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
  const { currentSong, isPlaying, currentTime, duration, volume,
          pause, resume, setVolume, seek } = usePlayerStore();
  const song = currentSong();
  if (!song) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 h-[72px] flex items-center gap-3.5 px-5
      bg-[rgba(14,12,20,0.8)] backdrop-blur-2xl border-t border-white/6">
      <div
        className="w-[46px] h-[46px] rounded-full bg-gradient-to-br from-[#1e1830] to-[#141020]
          border-2 border-[#FFB366]/12 flex items-center justify-center text-lg flex-shrink-0
          shadow-[0_0_20px_rgba(255,140,66,0.08)] cursor-pointer"
        onClick={() => navigate(`/play/${song.id}`)}
        style={{ animation: isPlaying ? 'spin 8s linear infinite' : 'none' }}
      >
        💿
      </div>

      <div className="flex-1 min-w-0 cursor-pointer" onClick={() => navigate(`/play/${song.id}`)}>
        <div className="text-[#f0e6e0] text-[13px] font-semibold truncate">{song.title}</div>
        <div className="text-[#a09080] text-[10px] truncate">{song.artist}</div>
      </div>

      <div className="w-[200px] hidden sm:flex items-center gap-2">
        <span className="text-[10px] text-[#a09080] tabular-nums w-10 text-right">{formatTime(currentTime)}</span>
        <div
          className="flex-1 h-1 bg-[rgba(255,255,255,0.06)] rounded cursor-pointer relative"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            seek(((e.clientX - rect.left) / rect.width) * duration);
          }}
        >
          <div className="neon-progress h-full rounded absolute left-0 top-0" style={{ width: `${progress}%` }} />
        </div>
        <span className="text-[10px] text-[#a09080] tabular-nums w-10">{formatTime(duration)}</span>
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-[#908070] text-sm">🔊</span>
        <div className="w-[60px] h-0.5 bg-[rgba(255,255,255,0.08)] rounded cursor-pointer relative"
          onClick={(e) => {
            const r = e.currentTarget.getBoundingClientRect();
            setVolume((e.clientX - r.left) / r.width);
          }}>
          <div className="bg-[#c0b0a0] h-full rounded absolute left-0 top-0" style={{ width: `${volume * 100}%` }} />
        </div>
        <div
          className="w-8 h-8 rounded-full bg-[#f0e6e0] flex items-center justify-center cursor-pointer
            shadow-[0_0_18px_rgba(255,200,150,0.25)] hover:scale-110 transition-transform"
          onClick={() => isPlaying ? pause() : resume()}
        >
          <span className="text-[#1a1428] text-xs ml-0.5">{isPlaying ? '⏸' : '▶'}</span>
        </div>
      </div>
    </div>
  );
}
