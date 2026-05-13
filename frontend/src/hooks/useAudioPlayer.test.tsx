import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';

// Mock dependencies
vi.mock('@/api/songs', () => ({
  songsApi: { getStreamUrl: (id: number) => `/api/songs/${id}/stream` },
}));

vi.mock('@/api/history', () => ({
  historyApi: { record: vi.fn().mockResolvedValue(undefined) },
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => vi.fn(),
  useLocation: () => ({ pathname: '/' }),
  Outlet: () => null,
}));

vi.mock('framer-motion', () => ({
  AnimatePresence: ({ children }: any) => children,
  motion: { div: ({ children }: any) => children },
}));

// Audio mock
let audioVol = 0.7;
let audioSrc = '';
let audioInstance: any = null;

beforeEach(() => {
  audioVol = 0.7;
  audioSrc = '';
  audioInstance = null;
});

class MockAudio {
  constructor() {
    this._vol = audioVol;
    this._src = audioSrc;
    audioInstance = this;
  }
  private _vol: number;
  private _src: string;
  get volume() { return this._vol; }
  set volume(v: number) { this._vol = v; audioVol = v; }
  get src() { return this._src; }
  set src(v: string) { this._src = v; audioSrc = v; }
  currentTime = 0;
  duration = 0;
  readyState = 0;
  preload = 'auto';
  crossOrigin = '';
  play = vi.fn().mockResolvedValue(undefined);
  pause = vi.fn();
  load = vi.fn();
  addEventListener = vi.fn();
  removeEventListener = vi.fn();
}

// @ts-ignore
globalThis.Audio = MockAudio as any;
Object.defineProperty(HTMLMediaElement, 'HAVE_CURRENT_DATA', { value: 2 });

describe('useAudioPlayer 音量持久化与 remount 行为', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    audioVol = 0.7;
    audioSrc = '';
    audioInstance = null;
    vi.resetModules();
  });

  it('audio 元素初始化时从 localStorage 恢复音量', async () => {
    localStorage.setItem('playerVolume', '0.3');
    const { useAudioPlayer } = await import('@/hooks/useAudioPlayer');
    renderHook(() => useAudioPlayer());
    expect(audioVol).toBe(0.3);
  });

  it('setVolume 同步更新 audio 元素音量', async () => {
    const { usePlayerStore: freshStore } = await import('@/stores/playerStore');
    const { useAudioPlayer } = await import('@/hooks/useAudioPlayer');
    renderHook(() => useAudioPlayer());

    act(() => { freshStore.getState().setVolume(0.45); });
    expect(audioVol).toBe(0.45);
    expect(localStorage.getItem('playerVolume')).toBe('0.45');
  });

  it('hook 卸载后 audio 元素继续存在且保留音量', async () => {
    const { usePlayerStore: freshStore } = await import('@/stores/playerStore');
    const { useAudioPlayer } = await import('@/hooks/useAudioPlayer');

    const { unmount } = renderHook(() => useAudioPlayer());
    act(() => { freshStore.getState().setVolume(0.6); });

    unmount(); // 模拟导航离开（PlayerBar 卸载）
    expect(audioVol).toBe(0.6);

    // 重新挂载 — 音量应保持不变
    renderHook(() => useAudioPlayer());
    expect(audioVol).toBe(0.6);
  });

  it('模拟页面切换：unmount/remount 后音量不丢失', async () => {
    const { usePlayerStore: freshStore } = await import('@/stores/playerStore');
    const { useAudioPlayer } = await import('@/hooks/useAudioPlayer');

    const { unmount } = renderHook(() => useAudioPlayer());
    act(() => { freshStore.getState().setVolume(0.25); });
    expect(audioVol).toBe(0.25);

    unmount();
    renderHook(() => useAudioPlayer());
    expect(audioVol).toBe(0.25);
  });
});
