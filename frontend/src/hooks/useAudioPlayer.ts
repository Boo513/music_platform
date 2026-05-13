import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi } from '@/api/songs';

let audioElement: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

function ensureAudio() {
  if (!audioElement) {
    audioElement = new Audio();
    audioElement.preload = 'auto';
    audioElement.crossOrigin = 'anonymous';
    audioElement.volume = usePlayerStore.getState().volume;
  }
  return audioElement;
}

export function startAudioPlayback(songId: number) {
  const audio = ensureAudio();
  const url = songsApi.getStreamUrl(songId);
  if (currentUrl !== url) {
    currentUrl = url;
    audio.src = url;
    audio.load();
  }
  audio.play().catch(() => {});
}

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isPlaying, volume, currentSong, setCurrentTime, setDuration, next, recordHistory } = usePlayerStore();
  const song = currentSong();
  const historyRecorded = useRef(false);
  const retryCount = useRef(0);
  const maxRetries = 3;
  const canplayPending = useRef(false);
  const seekedToSaved = useRef(false);
  const lastProgressSave = useRef(0);

  // Ensure audio element exists
  useEffect(() => {
    const audio = ensureAudio();
    audio.volume = volume;
    audioRef.current = audio;
  }, []);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Song source changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;

    const url = songsApi.getStreamUrl(song.id);
    if (currentUrl === url) return;
    currentUrl = url;

    historyRecorded.current = false;
    retryCount.current = 0;
    seekedToSaved.current = false;
    audio.src = url;
    audio.load();

    if (usePlayerStore.getState().isPlaying) {
      audio.play().catch(() => {});
    }
  }, [song?.id]);

  // Play/pause with canplay deferral
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audio.src && audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        canplayPending.current = false;
        audio.play().catch(() => {});
      } else if (audio.src) {
        canplayPending.current = true;
      }
    } else {
      canplayPending.current = false;
      audio.pause();
    }
  }, [isPlaying]);

  // Event listeners including error handling
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => {
    const t = audio.currentTime;
    setCurrentTime(t);
    // 每 2 秒保存一次进度到 localStorage
    if (t > 0 && Date.now() - lastProgressSave.current > 2000) {
      lastProgressSave.current = Date.now();
      localStorage.setItem('playerProgress', JSON.stringify({
        time: t,
        songId: song?.id,
      }));
    }
  };
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => next();

    const onPlay = () => {
      if (!historyRecorded.current && song) {
        setTimeout(() => { recordHistory(); historyRecorded.current = true; }, 2000);
      }
    };

    const onCanPlay = () => {
      if (!seekedToSaved.current && song) {
        seekedToSaved.current = true;
        try {
          const saved = JSON.parse(localStorage.getItem('playerProgress') || 'null');
          if (saved && saved.songId === song.id && saved.time > 0) {
            audio.currentTime = saved.time;
            setCurrentTime(saved.time);
          }
        } catch {}
      }
      if (canplayPending.current && usePlayerStore.getState().isPlaying) {
        canplayPending.current = false;
        audio.play().catch(() => {});
      }
    };

    const retryPlayback = () => {
      if (retryCount.current >= maxRetries) return;
      retryCount.current++;
      const currentTime = audio.currentTime;
      audio.load();
      setTimeout(() => {
        audio.currentTime = currentTime;
        if (usePlayerStore.getState().isPlaying) {
          audio.play().catch(() => {});
        }
      }, 500);
    };

    const onError = () => {
      const error = audio.error;
      // MEDIA_ERR_NETWORK(2) = network error, MEDIA_ERR_DECODE(3) = decode error
      if (error && (error.code === MediaError.MEDIA_ERR_NETWORK || error.code === MediaError.MEDIA_ERR_DECODE)) {
        retryPlayback();
      }
    };

    const onWaiting = () => {
      // Browser is buffering - this is normal, don't intervene
    };

    const onStalled = () => {
      // Browser failed to fetch data - retry
      if (usePlayerStore.getState().isPlaying) {
        retryPlayback();
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('stalled', onStalled);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('stalled', onStalled);
    };
  }, [song?.id]);

  return audioRef;
}
