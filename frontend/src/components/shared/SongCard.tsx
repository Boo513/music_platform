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
        hover:-translate-y-1 hover:shadow-[0_0_40px_rgba(255,140,66,0.08)]"
      onClick={() => onClick(song)}
    >
      <div className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl
        bg-gradient-to-br from-[#1e1830] to-[#141020] border-2 border-[#FFB366]/15
        shadow-[0_0_25px_rgba(255,140,66,0.1)]">
        {song.coverUrl
          ? <img src={song.coverUrl} className="w-full h-full rounded-full object-cover" alt="" />
          : styleInfo?.emoji ?? '🎵'}
      </div>
      <div className="text-[#f0e6e0] text-[13px] font-semibold truncate">{song.title}</div>
      <div className="text-[#a09080] text-[11px] mt-0.5">{song.artist}</div>
      <div className="flex justify-center gap-1 mt-2">
        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#FF8C42]/12 text-[#FFB366]">
          {styleInfo?.label ?? song.style}
        </span>
        <span className="text-[10px] px-2 py-0.5 rounded-lg bg-[#7c3aed]/12 text-[#c4b5fd]">
          {moodInfo?.label ?? song.mood}
        </span>
      </div>
    </div>
  );
}
