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
 <div className="fixed left-7 top-45 -translate-y-55 z-10 w-310
 bg-dark-55 border border-white-8
 rounded-2xl overflow-hidden">
 <div className="relative h-40 grad-panel-thumb">
 <div className="absolute inset-0" style={{background:'linear-gradient(180deg, transparent 40%, rgba(18,14,22,0.8) 100%)'}} />
 <button className="absolute top-3 left-3 w-26 h-26 rounded-full bg-black-45
 flex items-center justify-center text-white text-xs z-10 hover:bg-black-70" onClick={onClose}>×</button>
 <span className="absolute top-3 right-3 z-10 text-white text-10 font-bold
 px-2.5 py-1 rounded-md animate-pulse">LIVE</span>
 <div className="absolute bottom-0 left-0 right-0 flex items-end gap-1 px-1">
 {Array.from({ length: 22 }).map((_, i) => (
 <span key={i} className="flex-1 bg-black-70 rounded-t-sm"
 style={{ height: `${12 + ((i * 7 + 3) % 40)}px` }} />
 ))}
 </div>
 </div>
 <div className="p-4">
 <div className="text-xl font-bold">{song.title}</div>
 <div className="flex items-center gap-1.5 text-xs mt-1">
 {styleInfo?.emoji} {styleInfo?.label} · {moodInfo?.emoji} {moodInfo?.label}
 </div>
 <div className="text-xs mt-2 italic" style={{color:'rgba(255,255,255,0.4)'}}>{song.artist}</div>
 <div className="flex gap-4 mt-3 text-secondary text-xs">
 <span>👁 <span className="">{song.playCount.toLocaleString()}</span></span>
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
