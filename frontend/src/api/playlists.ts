import client from './client';
import type { ApiResponse, Playlist } from '@/types';

export const playlistsApi = {
  create: (data: { name: string; description?: string; isPublic?: boolean }) =>
    client.post<any, ApiResponse<Playlist>>('/playlists', data),

  list: () => client.get<any, ApiResponse<Playlist[]>>('/playlists'),

  getById: (id: number) => client.get<any, ApiResponse<Playlist>>(`/playlists/${id}`),

  update: (id: number, data: Partial<Playlist>) =>
    client.put<any, ApiResponse<Playlist>>(`/playlists/${id}`, data),

  delete: (id: number) => client.delete<any, ApiResponse<null>>(`/playlists/${id}`),

  addSong: (playlistId: number, songId: number) =>
    client.post<any, ApiResponse<null>>(`/playlists/${playlistId}/songs`, { songId }),

  removeSong: (playlistId: number, songId: number) =>
    client.delete<any, ApiResponse<null>>(`/playlists/${playlistId}/songs/${songId}`),
};
