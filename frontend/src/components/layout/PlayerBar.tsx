import { useRef, useCallback, useState } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useAudioPlayer, startAudioPlayback } from '@/hooks/useAudioPlayer';
import { useNavigate } from 'react-router-dom';
import { playlistsApi } from '@/api/playlists';
import type { Playlist } from '@/types';

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

const RECORD_SIZE = 260;
const RECORD_RADIUS = RECORD_SIZE / 2;
const RING_RADIUS = 124;
const CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
const RING_START = 135; // 从左上7点半方向开始

export function PlayerBar() {
  const navigate = useNavigate();
  const volRef = useRef<HTMLDivElement>(null);
  const audioRef = useAudioPlayer();
  const { currentSong, isPlaying, currentTime, duration, volume,
    pause, resume, setVolume, seek, queue, currentIndex, play } = usePlayerStore();
  const song = currentSong();

  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  const openAddPlaylist = () => {
    setShowAddPlaylist((v) => !v);
    if (!showAddPlaylist) {
      playlistsApi.list().then((r) => setPlaylists(r.data)).catch(() => {});
    }
  };

  const addToPlaylist = (plId: number) => {
    if (!song) return;
    playlistsApi.addSong(plId, song.id).then(() => setShowAddPlaylist(false)).catch(() => {});
  };

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

  const handleRingSeek = useCallback((e: React.MouseEvent<SVGCircleElement>) => {
    if (duration <= 0) return;
    const svg = (e.target as Element).closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 90 || dist > 140) return;
    let angle = Math.atan2(dy, dx) * (180 / Math.PI);
    if (angle < 0) angle += 360;
    let progressAngle = angle - RING_START;
    if (progressAngle < 0) progressAngle += 360;
    const pct = progressAngle / 360;
    if (audioRef.current) audioRef.current.currentTime = pct * duration;
    seek(pct * duration);
  }, [duration, seek, audioRef]);

  const handleRingSeekDown = useCallback((e: React.MouseEvent<SVGCircleElement>) => {
    handleRingSeek(e);
    const svg = (e.target as Element).closest('svg');
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const onMove = (ev: MouseEvent) => {
      const dx = ev.clientX - cx;
      const dy = ev.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 90 || dist > 140) return;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      let progressAngle = angle - RING_START;
      if (progressAngle < 0) progressAngle += 360;
      const pct = progressAngle / 360;
      if (audioRef.current) audioRef.current.currentTime = pct * duration;
      seek(pct * duration);
    };
    const onUp = () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [handleRingSeek, duration, seek, audioRef]);

  if (!song) return null;

  const progress = duration > 0 ? currentTime / duration : 0;
  const progressOffset = CIRCUMFERENCE * (1 - progress);

  const handleRecordClick = () => navigate(`/play/${song.id}`);

  return (
    <>
      {/* 音量控制 - 唱片右侧，底部 */}
      <div data-immersive-hide style={{
        position: 'fixed',
        left: 200, bottom: 16,
        zIndex: 10000,
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span
          style={{ fontSize: 12, color: '#b0a090', cursor: 'pointer', userSelect: 'none', flexShrink: 0 }}
          onClick={() => setVolume(volume === 0 ? 0.5 : 0)}
        >
          {volume === 0 ? '🔇' : volume < 0.3 ? '🔉' : '🔊'}
        </span>
        <div
          ref={volRef}
          onMouseDown={handleVolDown}
          style={{
            width: 90, height: 5,
            background: 'rgba(255,255,255,0.1)',
            borderRadius: 3, cursor: 'pointer',
            position: 'relative',
          }}
        >
          <div style={{
            width: `${volume * 100}%`, height: '100%',
            borderRadius: 2, position: 'absolute', left: 0, top: 0,
            background: 'linear-gradient(90deg, rgba(255,180,130,0.7), rgba(255,220,180,0.9))',
            boxShadow: '0 0 6px rgba(255,180,130,0.4)',
          }} />
        </div>
      </div>

      {/* 唱片样式 - 左下角 */}
      <div data-immersive-hide style={{
        position: 'fixed', bottom: -65, left: -65, zIndex: 9999,
        width: RECORD_SIZE, height: RECORD_SIZE,
        pointerEvents: 'none',
      }}>

        {/* 当前时间 - 圆环左侧 */}
        <span style={{
          position: 'absolute',
          top: 70, left: 34,
          fontSize: 10, color: 'rgba(255,255,255,0.5)',
          fontFamily: 'monospace', zIndex: 10,
          pointerEvents: 'none',
        }}>
          {formatTime(currentTime)}
        </span>

        {/* SVG 进度圆环 */}
        <svg
          width={RECORD_SIZE} height={RECORD_SIZE}
          style={{ position: 'absolute', top: 0, left: 0 }}
        >
          {/* 背景圆环 */}
          <circle
            cx={RECORD_RADIUS} cy={RECORD_RADIUS} r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,255,255,0.06)"
            strokeWidth={3}
          />
          {/* 进度圆环 - 从左上7点半开始顺时针 */}
          <circle
            cx={RECORD_RADIUS} cy={RECORD_RADIUS} r={RING_RADIUS}
            fill="none"
            stroke="rgba(255,180,130,0.8)"
            strokeWidth={3}
            strokeLinecap="round"
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={progressOffset}
            transform={`rotate(${RING_START} ${RECORD_RADIUS} ${RECORD_RADIUS})`}
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255,160,100,0.6))',
              transition: 'stroke-dashoffset 0.3s linear',
            }}
            pointerEvents="none"
          />
          {/* 可点击的透明圆环用于拖动进度 */}
          <circle
            cx={RECORD_RADIUS} cy={RECORD_RADIUS} r={RING_RADIUS}
            fill="none"
            stroke="transparent"
            strokeWidth={28}
            style={{ cursor: 'pointer', pointerEvents: 'auto' }}
            onMouseDown={handleRingSeekDown}
          />
        </svg>

        {/* 唱片本体 */}
        <div
          onClick={handleRecordClick}
          style={{
            position: 'absolute',
            top: 22, left: 22,
            width: 216, height: 216,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 30% 30%, #2a2a2a, #111 50%, #0a0a0a 90%)',
            boxShadow: '0 0 40px rgba(0,0,0,0.6), inset 0 0 60px rgba(0,0,0,0.5)',
            cursor: 'pointer',
            pointerEvents: 'auto',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}
        >
          {/* 唱片纹路 */}
          {[62, 68, 74, 80, 86, 92, 98].map((r, i) => (
            <div key={i} style={{
              position: 'absolute',
              width: r * 2, height: r * 2,
              borderRadius: '50%',
              border: '1px solid rgba(255,255,255,0.03)',
              pointerEvents: 'none',
            }} />
          ))}

          {/* 旋转封面 */}
          <div style={{
            width: 108, height: 108,
            borderRadius: '50%',
            overflow: 'hidden',
            position: 'relative',
            animation: isPlaying ? 'spin 8s linear infinite' : 'none',
            border: '3px solid rgba(255,255,255,0.12)',
            boxShadow: '0 0 30px rgba(255,140,66,0.2), inset 0 0 20px rgba(0,0,0,0.3)',
            zIndex: 1,
          }}>
            {/* 封面图或CD占位 */}
            <div style={{
              position: 'absolute', inset: 0,
              background: 'linear-gradient(145deg, #1e1830, #141020)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, borderRadius: '50%',
            }}>💿</div>
            {song.coverUrl && (
              <img src={song.coverUrl} alt="" style={{
                position: 'absolute', inset: 0,
                width: '100%', height: '100%', objectFit: 'cover',
                display: 'block', borderRadius: '50%',
              }} onError={(e) => {
                (e.target as HTMLImageElement).remove();
              }} />
            )}
          </div>
        </div>

        {/* 队列列表弹窗 */}
        {showQueue && queue.length > 0 && (
          <div style={{
            position: 'absolute', bottom: 40, left: 50,
            width: 240, maxHeight: 320, overflowY: 'auto',
            background: 'rgba(16,12,24,0.96)', backdropFilter: 'blur(20px)',
            borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 0', zIndex: 60, pointerEvents: 'auto',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, letterSpacing: 2,
              color: 'rgba(255,255,255,0.4)', padding: '6px 16px 8px',
            }}>
              播放列表 ({queue.length})
            </div>
            {queue.map((s, i) => {
              const isCurrent = i === currentIndex;
              return (
                <div
                  key={`${s.id}-${i}`}
                  onClick={() => {
                    if (i !== currentIndex) {
                      play(queue[i], queue);
                      startAudioPlayback(queue[i].id);
                    }
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 16px', cursor: 'pointer',
                    background: isCurrent ? 'rgba(255,180,130,0.08)' : 'transparent',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={(e) => { if (!isCurrent) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
                  onMouseLeave={(e) => { if (!isCurrent) e.currentTarget.style.background = 'transparent'; }}
                >
                  <span style={{
                    fontSize: 12, color: isCurrent ? '#ffb482' : 'rgba(255,255,255,0.5)',
                    fontWeight: isCurrent ? 700 : 400, minWidth: 0, flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  }}>
                    {isCurrent && '▶ '}{s.title}
                  </span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', flexShrink: 0 }}>
                    {s.artist}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* 添加到歌单弹窗 */}
        {showAddPlaylist && (
          <div style={{
            position: 'absolute', top: 20, left: 50,
            width: 180, maxHeight: 200, overflowY: 'auto',
            background: 'rgba(20,16,28,0.95)', backdropFilter: 'blur(16px)',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 0', zIndex: 60, pointerEvents: 'auto',
          }}>
            {playlists.length === 0 ? (
              <div style={{ padding: '12px 16px', color: '#908070', fontSize: 12 }}>暂无歌单</div>
            ) : (
              playlists.map((pl) => (
                <div
                  key={pl.id}
                  onClick={() => addToPlaylist(pl.id)}
                  style={{
                    padding: '8px 16px', cursor: 'pointer', fontSize: 12,
                    color: '#d0c8c0', display: 'flex', alignItems: 'center', gap: 8,
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                >
                  <span>📋</span>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* 全局 spin 动画 */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
