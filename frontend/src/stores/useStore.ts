import { create } from 'zustand';

interface AppState {
  mouseX: number;
  mouseY: number;
  currentSpeed: number;
  targetSpeed: number;
  accentColor: string;
  isShockwave: boolean;
  activeScene: string;
  setMouse: (x: number, y: number) => void;
  setTargetSpeed: (speed: number) => void;
  setAccentColor: (color: string) => void;
  triggerShockwave: () => void;
  setActiveScene: (scene: string) => void;
}

export const useStore = create<AppState>((set) => ({
  mouseX: 0,
  mouseY: 0,
  currentSpeed: 0.4,
  targetSpeed: 0.4,
  accentColor: '#FF8C42',
  isShockwave: false,
  activeScene: 'cyberpunk',
  setMouse: (x, y) => set({ mouseX: x, mouseY: y }),
  setTargetSpeed: (speed) => set({ targetSpeed: speed }),
  setAccentColor: (color) => set({ accentColor: color }),
  triggerShockwave: () => {
    set({ isShockwave: true });
    setTimeout(() => set({ isShockwave: false }), 800);
  },
  setActiveScene: (scene) => set({ activeScene: scene }),
}));
