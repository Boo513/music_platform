import { usePlayerStore } from '@/stores/playerStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { useNavigate } from 'react-router-dom';

function formatTime(sec: number): string {
 if (!sec || !isFinite(sec)) return '0:00';
 const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
 return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerBar() {
 const navigate = useNavigate();
 useAudioPlayer();
 const { currentSong, isPlaying, currentTime, duration, volume, playMode,
 pause, resume, next, prev, setVolume, seek, togglePlayMode } = usePlayerStore();
 const modeIcon = playMode === 'sequential' ? '🔁' : playMode === 'shuffle' ? '🔀' : '🔂';
 const song = currentSong();
 if (!song) return null;

 const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

 return (
 <div className="fixed bottom-0 left-0 right-0 z-50 h-72 flex items-center gap-3.5 px-5
 bg-dark-80 border-t border-white/6">
 <div
 className="w-46 h-46 rounded-full bg-cover-disc
 border-2 border-orange-20 flex items-center justify-center text-lg flex-shrink-0
 cursor-pointer shadow-neon-sm"
 onClick={() => navigate(`/play/${song.id}`)}
 style={{ animation: isPlaying ? 'spin 8s linear infinite' : 'none' }}
 >
 💿
 </div>

 <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/play/${song.id}`)}>
 <div className="text-primary text-13 font-semibold truncate">{song.title}</div>
 <div className="text-secondary text-10 truncate">{song.artist}</div>
 </div>

 <div className="w-200 hidden-mobile flex items-center gap-2">
 <span className="text-secondary text-10 tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
 <div
 className="flex-1 h-1 bg-white-6 rounded cursor-pointer relative"
 onClick={(e) => {
 const rect = e.currentTarget.getBoundingClientRect();
 seek(((e.clientX - rect.left) / rect.width) * duration);
 }}
 >
 <div className="neon-progress h-full rounded absolute left-0 top-0" style={{ width: `${progress}%` }} />
 </div>
 <span className="text-secondary text-10 tabular-nums w-10">{formatTime(duration)}</span>
 </div>

 <div className="flex items-center gap-2.5">
 <span className="text-primary text-sm">🔊</span>
 <div className="w-60 h-0.5 bg-white-8 rounded cursor-pointer relative"
 onClick={(e) => {
 const r = e.currentTarget.getBoundingClientRect();
 setVolume((e.clientX - r.left) / r.width);
 }}>
 <div className="h-full rounded absolute left-0 top-0" style={{ width: `${volume * 100}%`, background: '#c0b0a0' }} />
 </div>
 <button
 className="rounded-full flex items-center justify-center cursor-pointer border-0"
 style={{ width: 34, height: 34, background: 'transparent', color: '#b0a090', fontSize: 16 }}
 onClick={prev}
 >⏮</button>
 <button
 className="rounded-full flex items-center justify-center cursor-pointer border-0"
 style={{ width: 34, height: 34, background: 'transparent', color: '#b0a090', fontSize: 14 }}
 onClick={togglePlayMode}
 >{modeIcon}</button>
 <div
 className="rounded-full flex items-center justify-center cursor-pointer
 hover-scale-110 transition-transform shadow-btn"
 style={{ width: 44, height: 44, background: '#f0e6e0' }}
 onClick={() => isPlaying ? pause() : resume()}
 >
 <span style={{ color: '#1a1428', fontSize: 16, marginLeft: 2 }}>{isPlaying ? '⏸' : '▶'}</span>
 </div>
 <button
 className="rounded-full flex items-center justify-center cursor-pointer border-0"
 style={{ width: 34, height: 34, background: 'transparent', color: '#b0a090', fontSize: 16 }}
 onClick={next}
 >⏭</button>
 </div>
 </div>
 );
}
