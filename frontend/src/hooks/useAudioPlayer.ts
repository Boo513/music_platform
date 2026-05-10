import { useEffect, useRef } from 'react';
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

  // Ensure audio element exists (reuses module-level one if already created)
  useEffect(() => {
    const audio = ensureAudio();
    audio.volume = volume;
    audioRef.current = audio;
  }, []);

  // Volume sync
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Song source changes (fallback for store-driven play)
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !song) return;

    const url = songsApi.getStreamUrl(song.id);
    if (currentUrl === url) return;
    currentUrl = url;

    historyRecorded.current = false;
    audio.src = url;
    audio.load();
    
    if (usePlayerStore.getState().isPlaying) {
      audio.play().catch(() => {});
    }
  }, [song?.id]);

  // Play/pause
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      if (audio.src && audio.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        audio.play().catch(() => {});
      }
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onTimeUpdate = () => setCurrentTime(audio.currentTime);
    const onLoadedMetadata = () => setDuration(audio.duration);
    const onEnded = () => next();
    const onPlay = () => {
      if (!historyRecorded.current && song) {
        setTimeout(() => { recordHistory(); historyRecorded.current = true; }, 2000);
      }
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);

    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
    };
  }, [song?.id]);

  return audioRef;
}
