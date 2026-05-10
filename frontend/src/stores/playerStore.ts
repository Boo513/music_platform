import { create } from 'zustand';
import type { Song, PlayMode } from '@/types';
import { historyApi } from '@/api/history';

interface PlayerState {
  queue: Song[];
  currentIndex: number;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playMode: PlayMode;

  currentSong: () => Song | null;
  play: (song: Song, queue?: Song[]) => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  prev: () => void;
  seek: (time: number) => void;
  setVolume: (vol: number) => void;
  setDuration: (dur: number) => void;
  setCurrentTime: (time: number) => void;
  togglePlayMode: () => void;
  recordHistory: () => void;
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  playMode: 'sequential',

  currentSong: () => {
    const { queue, currentIndex } = get();
    return queue[currentIndex] ?? null;
  },

  play: (song, queue) => {
    const newQueue = queue ?? [song];
    const idx = newQueue.findIndex((s) => s.id === song.id);
    set({ queue: newQueue, currentIndex: idx >= 0 ? idx : 0, isPlaying: true, currentTime: 0 });
  },

  pause: () => set({ isPlaying: false }),
  resume: () => set({ isPlaying: true }),

  next: () => {
    const { queue, currentIndex, playMode } = get();
    if (queue.length === 0) return;
    let nextIdx: number;
    if (playMode === 'shuffle') {
      nextIdx = Math.floor(Math.random() * queue.length);
    } else if (playMode === 'repeat-one') {
      nextIdx = currentIndex;
    } else {
      nextIdx = (currentIndex + 1) % queue.length;
    }
    set({ currentIndex: nextIdx, isPlaying: true, currentTime: 0 });
  },

  prev: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const prevIdx = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    set({ currentIndex: prevIdx, isPlaying: true, currentTime: 0 });
  },

  seek: (time) => set({ currentTime: time }),
  setVolume: (vol) => set({ volume: Math.max(0, Math.min(1, vol)) }),
  setDuration: (dur) => set({ duration: dur }),
  setCurrentTime: (time) => set({ currentTime: time }),

  togglePlayMode: () => {
    const modes: PlayMode[] = ['sequential', 'shuffle', 'repeat-one'];
    const { playMode } = get();
    const next = modes[(modes.indexOf(playMode) + 1) % modes.length];
    set({ playMode: next });
  },

  recordHistory: () => {
    const song = get().currentSong();
    if (song) historyApi.record(song.id).catch(() => {});
  },
}));
