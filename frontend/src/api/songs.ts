import client from './client';
import type { ApiResponse, PageData, Song, StyleType, MoodType } from '@/types';

export const songsApi = {
  list: (params: {
    page?: number; size?: number; style?: StyleType;
    mood?: MoodType; keyword?: string; sort?: string;
  }) => client.get<any, ApiResponse<PageData<Song>>>('/songs', { params }),

  getById: (id: number) => client.get<any, ApiResponse<Song>>(`/songs/${id}`),

  upload: (formData: FormData, onProgress?: (pct: number) => void) =>
    client.post<any, ApiResponse<Song>>('/songs/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }),

  delete: (id: number) => client.delete<any, ApiResponse<null>>(`/songs/${id}`),

  uploadCover: (songId: number, formData: FormData) =>
    client.post<any, ApiResponse<{ coverUrl: string }>>(`/songs/${songId}/cover`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  uploadVideo: (songId: number, formData: FormData, onProgress?: (pct: number) => void) =>
    client.post<any, ApiResponse<{ videoUrl: string }>>(`/songs/${songId}/video`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (e) => {
        if (e.total && onProgress) onProgress(Math.round((e.loaded * 100) / e.total));
      },
    }),

  getStreamUrl: (id: number) => `/api/songs/${id}/stream`,
  getCoverUrl: (id: number) => `/api/songs/${id}/cover`,
  getVideoUrl: (id: number) => `/api/songs/${id}/video`,
};
