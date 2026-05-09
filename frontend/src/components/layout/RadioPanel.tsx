import type { Song } from '@/types';
import { STYLE_OPTIONS, MOOD_OPTIONS } from '@/types';

interface RadioPanelProps {
  song: Song;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onClose: () => void;
}

export function RadioPanel({ song, isPlaying, onTogglePlay, onClose }: RadioPanelProps) {
  const styleInfo = STYLE_OPTIONS.find((s) => s.value === song.style);
  const moodInfo = MOOD_OPTIONS.find((m) => m.value === song.mood);

  return (
    <div className="fixed left-7 top-[45%] -translate-y-[55%] z-10 w-[310px]
      bg-[rgba(18,14,24,0.55)] backdrop-blur-[28px] border border-white/[0.08]
      rounded-2xl overflow-hidden shadow-[0_24px_70px_rgba(0,0,0,0.55)]">
      <div className="relative h-40 bg-gradient-to-br from-[#3a2218] via-[#1e1830] to-[#141828]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[rgba(18,14,22,0.8)]" />
        <button className="absolute top-3 left-3 w-[26px] h-[26px] rounded-full bg-black/45
          flex items-center justify-center text-white text-xs z-10 hover:bg-black/70" onClick={onClose}>×</button>
        <span className="absolute top-3 right-3 z-10 bg-[#d42a2a] text-white text-[10px] font-bold
          px-2.5 py-1 rounded-md animate-pulse shadow-[0_0_12px_rgba(220,40,40,0.4)]">LIVE</span>
        <div className="absolute bottom-0 left-0 right-0 flex items-end gap-1 px-1">
          {Array.from({ length: 22 }).map((_, i) => (
            <span key={i} className="flex-1 bg-[rgba(10,8,18,0.75)] rounded-t-sm"
              style={{ height: `${12 + ((i * 7 + 3) % 40)}px` }} />
          ))}
        </div>
      </div>
      <div className="p-4">
        <div className="text-xl font-bold text-[#f0e6e0]">{song.title}</div>
        <div className="flex items-center gap-1.5 text-xs text-[#a09080] mt-1">
          {styleInfo?.emoji} {styleInfo?.label} · {moodInfo?.emoji} {moodInfo?.label}
        </div>
        <div className="text-xs text-white/40 mt-2 italic">{song.artist}</div>
        <div className="flex gap-4 mt-3 text-xs text-[#a09080]">
          <span>👁 <span className="text-[#d0c0b0]">{song.playCount.toLocaleString()}</span></span>
          <span>👍 48</span><span>💬 12</span><span>⭐</span>
        </div>
        <button
          className="w-full mt-4 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2
            transition-all duration-300"
          style={{ background: isPlaying
            ? 'linear-gradient(135deg, #c0392b, #a01d1d)'
            : 'linear-gradient(135deg, #33aa55, #228844)' }}
          onClick={onTogglePlay}
        >
          <span className={`w-3 h-3 ${isPlaying ? 'bg-white rounded-sm' : ''}`} />
          {isPlaying ? '停止收听' : '继续收听'}
        </button>
      </div>
    </div>
  );
}
