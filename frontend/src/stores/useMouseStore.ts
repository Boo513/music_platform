import { create } from 'zustand';

interface MouseState {
  x: number;
  y: number;
  setMouse: (x: number, y: number) => void;
}

export const useMouseStore = create<MouseState>((set) => ({
  x: 0,
  y: 0,
  setMouse: (x, y) => set({ x, y }),
}));
