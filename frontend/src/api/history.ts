import client from './client';
import type { ApiResponse, PageData, PlayHistoryItem } from '@/types';

export const historyApi = {
  record: (songId: number) => client.post<any, ApiResponse<null>>(`/history/${songId}`),
  list: (page = 1, size = 20) =>
    client.get<any, ApiResponse<PageData<PlayHistoryItem>>>('/history', { params: { page, size } }),
};
