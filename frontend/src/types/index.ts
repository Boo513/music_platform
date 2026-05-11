// === 用户 ===
export interface User {
  id: number;
  username: string;
  nickname: string;
  avatar: string | null;
  createdAt: string;
}

// === 歌曲 ===
export interface Song {
  id: number;
  title: string;
  artist: string;
  coverUrl: string | null;
  duration: number;
  style: StyleType;
  mood: MoodType;
  playCount: number;
  isFavorited: boolean;
  hasVideo?: boolean;
  uploader: { id: number; nickname: string };
  createdAt: string;
}

// === 枚举 ===
export type StyleType = 'rock' | 'pop' | 'classical' | 'electronic' | 'folk' | 'jazz' | 'hiphop' | 'rnb';
export type MoodType = 'happy' | 'sad' | 'calm' | 'excited' | 'romantic' | 'melancholy';
export type PlayMode = 'sequential' | 'shuffle' | 'repeat-one';

export const STYLE_OPTIONS: { value: StyleType; label: string; emoji: string }[] = [
  { value: 'rock', label: '摇滚', emoji: '🎸' },
  { value: 'pop', label: '流行', emoji: '🎤' },
  { value: 'classical', label: '古典', emoji: '🎻' },
  { value: 'electronic', label: '电子', emoji: '💿' },
  { value: 'folk', label: '民谣', emoji: '🪕' },
  { value: 'jazz', label: '爵士', emoji: '🎷' },
  { value: 'hiphop', label: '嘻哈', emoji: '🎧' },
  { value: 'rnb', label: 'R&B', emoji: '🎶' },
];

export const MOOD_OPTIONS: { value: MoodType; label: string; emoji: string }[] = [
  { value: 'happy', label: '开心', emoji: '😊' },
  { value: 'sad', label: '悲伤', emoji: '😢' },
  { value: 'calm', label: '平静', emoji: '😌' },
  { value: 'excited', label: '激昂', emoji: '🔥' },
  { value: 'romantic', label: '浪漫', emoji: '💕' },
  { value: 'melancholy', label: '忧郁', emoji: '🌧' },
];

export const SCENE_OPTIONS = [
  { key: 'auto', label: '自动匹配', emoji: '🎵', desc: '根据歌曲风格/情绪自动切换' },
  { key: 'cyberpunk', label: '赛博朋克城市', emoji: '🔮', desc: '霓虹都市 · 电子/摇滚' },
  { key: 'galaxy', label: '宇宙星河', emoji: '🌌', desc: '深空星云 · 古典/平静' },
  { key: 'spring', label: '春日樱花', emoji: '🌸', desc: '樱花山脉 · 流行/开心' },
  { key: 'beach', label: '夏日海滩', emoji: '🏖', desc: '碧海蓝天 · 摇滚/激昂' },
  { key: 'rain', label: '雨夜都市', emoji: '🌧', desc: '阴雨霓虹 · 爵士/悲伤' },
  { key: 'mountain', label: '山水森林', emoji: '🏔', desc: '雾中山峦 · 民谣/平静' },
] as const;

// === 歌单 ===
export interface Playlist {
  id: number;
  name: string;
  description: string | null;
  cover: string | null;
  isPublic: boolean;
  songCount: number;
  owner: { id: number; nickname: string };
  songs?: Song[];
  createdAt: string;
}

// === 播放历史 ===
export interface PlayHistoryItem {
  id: number;
  song: Song;
  playedAt: string;
}

// === API 响应 ===
export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PageData<T> {
  records: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
}
