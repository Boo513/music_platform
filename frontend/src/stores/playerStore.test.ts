import { describe, it, expect, beforeEach, vi } from 'vitest';

// Mock dependencies before importing the store
vi.mock('@/api/history', () => ({
  historyApi: { record: vi.fn().mockResolvedValue(undefined) },
}));

describe('playerStore volume persistence', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.resetModules();
  });

  function createStore() {
    // Dynamic import to get a fresh store each time (simulates page refresh)
    return import('@/stores/playerStore').then((m) => m.usePlayerStore);
  }

  it('默认音量为 0.7（无 localStorage 时）', async () => {
    const { usePlayerStore } = await import('@/stores/playerStore');
    expect(usePlayerStore.getState().volume).toBe(0.7);
  });

  it('从 localStorage 读取已保存的音量', async () => {
    localStorage.setItem('playerVolume', '0.3');
    const { usePlayerStore } = await import('@/stores/playerStore');
    expect(usePlayerStore.getState().volume).toBe(0.3);
  });

  it('setVolume 同步写入 localStorage', async () => {
    const { usePlayerStore } = await import('@/stores/playerStore');
    usePlayerStore.getState().setVolume(0.55);
    expect(localStorage.getItem('playerVolume')).toBe('0.55');
    expect(usePlayerStore.getState().volume).toBe(0.55);
  });

  it('音量设为 0（静音）后刷新页面应保持 0', async () => {
    // 第一次：设置音量为 0
    const first = await import('@/stores/playerStore');
    first.usePlayerStore.getState().setVolume(0);
    expect(first.usePlayerStore.getState().volume).toBe(0);
    expect(localStorage.getItem('playerVolume')).toBe('0');

    // 模拟刷新：重置模块重新导入
    vi.resetModules();
    const second = await import('@/stores/playerStore');
    // BUG: Number("0") || 0.7 → 0.7，因为 0 是 falsy
    expect(second.usePlayerStore.getState().volume).toBe(0);
  });

  it('setVolume 限制在 0-1 范围内', async () => {
    const { usePlayerStore } = await import('@/stores/playerStore');
    usePlayerStore.getState().setVolume(1.5);
    expect(usePlayerStore.getState().volume).toBe(1);
    usePlayerStore.getState().setVolume(-0.5);
    expect(usePlayerStore.getState().volume).toBe(0);
  });

  it('localStorage 存的是字符串 "0" 时不应被视为无效', async () => {
    // 模拟 setVolume(0) 后 localStorage 存了 "0"
    localStorage.setItem('playerVolume', '0');
    const { usePlayerStore } = await import('@/stores/playerStore');
    expect(usePlayerStore.getState().volume).toBe(0);
  });

  it('localStorage 存了非法值时回退到默认 0.7', async () => {
    localStorage.setItem('playerVolume', 'not-a-number');
    const { usePlayerStore } = await import('@/stores/playerStore');
    expect(usePlayerStore.getState().volume).toBe(0.7);
  });
});
