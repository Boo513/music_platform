import client from './client';
import type { ApiResponse, PageData, Song } from '@/types';

export const favoritesApi = {
  add: (songId: number) => client.post<any, ApiResponse<null>>(`/favorites/${songId}`),
  remove: (songId: number) => client.delete<any, ApiResponse<null>>(`/favorites/${songId}`),
  list: (page = 1, size = 20) => client.get<any, ApiResponse<PageData<Song>>>('/favorites', { params: { page, size } }),
  check: (songId: number) => client.get<any, ApiResponse<{ favorited: boolean }>>(`/favorites/check/${songId}`),
};
