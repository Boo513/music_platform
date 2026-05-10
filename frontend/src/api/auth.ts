import client from './client';
import type { ApiResponse, User } from '@/types';

export const authApi = {
  register: (username: string, password: string, nickname?: string) =>
    client.post<any, ApiResponse<User>>('/auth/register', { username, password, nickname }),

  login: (username: string, password: string) =>
    client.post<any, ApiResponse<{ token: string; user: User }>>('/auth/login', { username, password }),

  getMe: () => client.get<any, ApiResponse<User>>('/user/me'),

  updateProfile: (nickname: string) =>
    client.put<any, ApiResponse<User>>('/user/profile', { nickname }),
};
