import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi } from '@/api/songs';

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { isPlaying, volume, currentSong, setCurrentTime, setDuration, next, recordHistory } = usePlayerStore();
  const song = currentSong();
  const historyRecorded = useRef(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.volume = volume;
    }
    const audio = audioRef.current;

    if (song) {
      audio.src = songsApi.getStreamUrl(song.id);
      audio.load();
      historyRecorded.current = false;
    }

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

  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.play().catch(() => {});
    else audioRef.current.pause();
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  return audioRef;
}
