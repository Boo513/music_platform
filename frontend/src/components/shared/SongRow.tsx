import type { ReactNode } from 'react';
import type { Song } from '@/types';
import { STYLE_OPTIONS, MOOD_OPTIONS } from '@/types';

interface SongRowProps {
 song: Song;
 onClick: (song: Song) => void;
 extra?: ReactNode;
}

export function SongRow({ song, onClick, extra }: SongRowProps) {
 const styleEmoji = STYLE_OPTIONS.find((s) => s.value === song.style)?.emoji;
 const moodEmoji = MOOD_OPTIONS.find((m) => m.value === song.mood)?.emoji;

 return (
 <div
 className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white-2 border border-white/4
 hover:bg-white-4 cursor-pointer transition-all duration-200"
 onClick={() => onClick(song)}
 >
 <div className="w-9 h-9 rounded-full
 flex items-center justify-center text-lg flex-shrink-0">
 {styleEmoji}
 </div>
 <div className="flex-1 min-w-0">
 <div className="text-primary text-13 font-semibold truncate">{song.title}</div>
 <div className="text-primary text-11">{song.artist}</div>
 </div>
 <div className="flex gap-1">
 <span className="text-10 px-1.5 py-0.5 rounded-md bg-accent-15">
 {styleEmoji} {song.style}
 </span>
 <span className="text-10 px-1.5 py-0.5 rounded-md bg-purple-12">
 {moodEmoji} {song.mood}
 </span>
 </div>
 <span className="text-primary text-11 w-16 text-right">{song.playCount.toLocaleString()} 次</span>
 {extra}
 </div>
 );
}
