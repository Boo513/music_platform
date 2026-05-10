import { create } from 'zustand';
import type { StyleType, MoodType } from '@/types';

interface UploadState {
  isUploading: boolean;
  uploadProgress: number;
  selectedFile: File | null;
  coverFile: File | null;
  title: string;
  artist: string;
  style: StyleType | null;
  mood: MoodType | null;
  error: string;
  setFile: (f: File | null) => void;
  setCoverFile: (f: File | null) => void;
  setTitle: (t: string) => void;
  setArtist: (a: string) => void;
  setStyle: (s: StyleType) => void;
  setMood: (m: MoodType) => void;
  setError: (e: string) => void;
  startUpload: () => void;
  finishUpload: () => void;
  setProgress: (p: number) => void;
  reset: () => void;
}

export const useUploadStore = create<UploadState>((set, get) => ({
  isUploading: false,
  uploadProgress: 0,
  selectedFile: null,
  coverFile: null,
  title: '',
  artist: '',
  style: null,
  mood: null,
  error: '',
  setFile: (f) => set({ selectedFile: f, error: '' }),
  setCoverFile: (f) => set({ coverFile: f, error: '' }),
  setTitle: (t) => set({ title: t }),
  setArtist: (a) => set({ artist: a }),
  setStyle: (s) => set({ style: s }),
  setMood: (m) => set({ mood: m }),
  setError: (e) => set({ error: e }),
  startUpload: () => set({ isUploading: true, uploadProgress: 0, error: '' }),
  finishUpload: () => set({ isUploading: false, uploadProgress: 1 }),
  setProgress: (p) => set({ uploadProgress: p }),
  reset: () => set({ isUploading: false, uploadProgress: 0, selectedFile: null, coverFile: null, title: '', artist: '', style: null, mood: null, error: '' }),
}));
