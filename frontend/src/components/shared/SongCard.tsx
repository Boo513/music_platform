import type { Song } from '@/types';
import { STYLE_OPTIONS, MOOD_OPTIONS } from '@/types';

interface SongCardProps {
 song: Song;
 onClick: (song: Song) => void;
}

export function SongCard({ song, onClick }: SongCardProps) {
 const styleInfo = STYLE_OPTIONS.find((s) => s.value === song.style);
 const moodInfo = MOOD_OPTIONS.find((m) => m.value === song.mood);

 return (
 <div
 className="glass-panel p-3.5 rounded-2xl text-center cursor-pointer transition-all duration-300
 "
 onClick={() => onClick(song)}
 >
 <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl
 border-2 border-orange-20
">
 {song.coverUrl
 ? <img src={song.coverUrl} className="w-full h-full rounded-full object-cover" alt="" />
 : styleInfo?.emoji ?? '🎵'}
 </div>
 <div className=" text-13 font-semibold truncate">{song.title}</div>
 <div className=" text-11 mt-0.5">{song.artist}</div>
 <div className="flex justify-center gap-1 mt-2">
 <span className="text-10 px-2 py-0.5 rounded-lg bg-accent-15">
 {styleInfo?.label ?? song.style}
 </span>
 <span className="text-10 px-2 py-0.5 rounded-lg bg-purple-12">
 {moodInfo?.label ?? song.mood}
 </span>
 </div>
 </div>
 );
}
