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

// Restore persisted player state
function loadPersistedState() {
  try {
    const raw = localStorage.getItem('playerState');
    if (raw) {
      const saved = JSON.parse(raw);
      return {
        queue: Array.isArray(saved.queue) ? saved.queue : [],
        currentIndex: typeof saved.currentIndex === 'number' ? saved.currentIndex : -1,
        playMode: (['sequential', 'shuffle', 'repeat-one'].includes(saved.playMode) ? saved.playMode : 'sequential') as PlayMode,
      };
    }
  } catch {}
  return { queue: [] as Song[], currentIndex: -1, playMode: 'sequential' as PlayMode };
}

const persisted = loadPersistedState();

function persistState(queue: Song[], currentIndex: number, playMode: PlayMode) {
  try {
    localStorage.setItem('playerState', JSON.stringify({ queue, currentIndex, playMode }));
  } catch {}
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: persisted.queue,
  currentIndex: persisted.currentIndex,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: (() => {
    const saved = localStorage.getItem('playerVolume');
    if (saved === null) return 0.7;
    const n = Number(saved);
    return isNaN(n) ? 0.7 : Math.max(0, Math.min(1, n));
  })(),
  playMode: persisted.playMode,

  currentSong: () => {
    const { queue, currentIndex } = get();
    return queue[currentIndex] ?? null;
  },

  play: (song, queue) => {
    const newQueue = queue ?? [song];
    const idx = newQueue.findIndex((s) => s.id === song.id);
    const newIdx = idx >= 0 ? idx : 0;
    set({ queue: newQueue, currentIndex: newIdx, isPlaying: true, currentTime: 0 });
    persistState(newQueue, newIdx, get().playMode);
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
    persistState(queue, nextIdx, playMode);
  },

  prev: () => {
    const { queue, currentIndex } = get();
    if (queue.length === 0) return;
    const prevIdx = currentIndex <= 0 ? queue.length - 1 : currentIndex - 1;
    set({ currentIndex: prevIdx, isPlaying: true, currentTime: 0 });
    persistState(queue, prevIdx, get().playMode);
  },

  seek: (time) => set({ currentTime: time }),
  setVolume: (vol) => {
    const clamped = Math.max(0, Math.min(1, vol));
    localStorage.setItem('playerVolume', String(clamped));
    set({ volume: clamped });
  },
  setDuration: (dur) => set({ duration: dur }),
  setCurrentTime: (time) => set({ currentTime: time }),

  togglePlayMode: () => {
    const modes: PlayMode[] = ['sequential', 'shuffle', 'repeat-one'];
    const { playMode, queue, currentIndex } = get();
    const next = modes[(modes.indexOf(playMode) + 1) % modes.length];
    set({ playMode: next });
    persistState(queue, currentIndex, next);
  },

  recordHistory: () => {
    const song = get().currentSong();
    if (song) historyApi.record(song.id).catch(() => {});
  },
}));
