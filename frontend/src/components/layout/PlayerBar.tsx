import { useRef, useCallback } from 'react';
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
  const volRef = useRef<HTMLDivElement>(null);
  useAudioPlayer();
  const { currentSong, isPlaying, currentTime, duration, volume, playMode,
    pause, resume, next, prev, setVolume, seek, togglePlayMode } = usePlayerStore();
  const song = currentSong();

  const updateVol = useCallback((clientX: number) => {
    if (!volRef.current) return;
    const r = volRef.current.getBoundingClientRect();
    setVolume(Math.max(0, Math.min(1, (clientX - r.left) / r.width)));
  }, [setVolume]);

  const handleVolDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    updateVol(e.clientX);
    const onMove = (ev: MouseEvent) => updateVol(ev.clientX);
    const onUp = () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [updateVol]);

  if (!song) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const modeIcon = playMode === 'sequential' ? '🔁' : playMode === 'shuffle' ? '🔀' : '🔂';

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - rect.left) / rect.width) * duration);
  };

  const s = {
    bar: {
      position: 'fixed' as const, bottom: 0, left: 0, right: 0, zIndex: 50,
      height: 72, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px',
      background: 'rgba(14,12,20,0.8)', backdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.06)',
    },
    disc: {
      width: 46, height: 46, borderRadius: '50%',
      background: 'linear-gradient(145deg, #1e1830, #141020)',
      border: '2px solid rgba(255,180,130,0.12)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18, flexShrink: 0, cursor: 'pointer',
      boxShadow: '0 0 20px rgba(255,140,66,0.08)',
      animation: isPlaying ? 'spin 8s linear infinite' : 'none',
    },
    info: { flex: 1, minWidth: 0, cursor: 'pointer' },
    title: { color: '#f0e6e0', fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    artist: { color: '#a09080', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const },
    progressWrap: { display: 'flex', alignItems: 'center', gap: 8, width: 220 },
    time: { fontSize: 10, color: '#a09080', fontFamily: 'monospace', minWidth: 32 },
    timeR: { fontSize: 10, color: '#a09080', fontFamily: 'monospace', minWidth: 32, textAlign: 'right' as const },
    track: { flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2, cursor: 'pointer', position: 'relative' as const },
    fill: (pct: number) => ({ width: `${pct}%`, height: '100%', borderRadius: 2, position: 'absolute' as const, left: 0, top: 0 }),
    volWrap: { display: 'flex', alignItems: 'center', gap: 8 },
    volIcon: { fontSize: 14, color: '#908070' },
    volTrack: { width: 80, height: 3, background: 'rgba(255,255,255,0.08)', borderRadius: 2, cursor: 'pointer', position: 'relative' as const },
    volFill: (v: number) => ({ width: `${v * 100}%`, height: '100%', borderRadius: 2, position: 'absolute' as const, left: 0, top: 0, background: '#c0b0a0' }),
    ctrlBtn: { width: 34, height: 34, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: 'none', background: 'transparent', color: '#b0a090', fontSize: 16 },
    playBtn: { width: 44, height: 44, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: '#f0e6e0', boxShadow: '0 0 18px rgba(255,200,150,0.25)' },
    playIcon: { color: '#1a1428', fontSize: 16, marginLeft: 2 },
  };

  return (
    <div style={s.bar}>
      <div style={s.disc} onClick={() => navigate(`/play/${song.id}`)}>💿</div>
      <div style={s.info} onClick={() => navigate(`/play/${song.id}`)}>
        <div style={s.title}>{song.title}</div>
        <div style={s.artist}>{song.artist}</div>
      </div>
      <div style={s.progressWrap}>
        <span style={s.timeR}>{formatTime(currentTime)}</span>
        <div style={s.track} onClick={handleSeek}>
          <div className="neon-progress" style={s.fill(progress)} />
        </div>
        <span style={s.time}>{formatTime(duration)}</span>
      </div>
      <div style={s.volWrap}>
        <span style={s.volIcon}>🔊</span>
        <div ref={volRef} style={s.volTrack} onMouseDown={handleVolDown}>
          <div style={s.volFill(volume)} />
        </div>
      </div>
      <button style={s.ctrlBtn} onClick={prev}>⏮</button>
      <button style={{ ...s.ctrlBtn, fontSize: 14 }} onClick={togglePlayMode}>{modeIcon}</button>
      <div style={s.playBtn} onClick={() => isPlaying ? pause() : resume()}>
        <span style={s.playIcon}>{isPlaying ? '⏸' : '▶'}</span>
      </div>
      <button style={s.ctrlBtn} onClick={next}>⏭</button>
    </div>
  );
}
