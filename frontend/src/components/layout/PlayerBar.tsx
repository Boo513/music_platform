import { useRef, useCallback, useState, useEffect } from 'react';
import { usePlayerStore } from '@/stores/playerStore';
import { useAudioPlayer, startAudioPlayback } from '@/hooks/useAudioPlayer';
import { useNavigate } from 'react-router-dom';
import { favoritesApi } from '@/api/favorites';
import { playlistsApi } from '@/api/playlists';
import type { Playlist } from '@/types';

function formatTime(sec: number): string {
  if (!sec || !isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60), s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function PlayerBar() {
  const navigate = useNavigate();
  const volRef = useRef<HTMLDivElement>(null);
  const audioRef = useAudioPlayer();
  const { currentSong, isPlaying, currentTime, duration, volume, playMode,
    pause, resume, next, prev, setVolume, seek, togglePlayMode, queue, currentIndex, play } = usePlayerStore();
  const song = currentSong();

  const [isFav, setIsFav] = useState(song?.isFavorited ?? false);
  const [showAddPlaylist, setShowAddPlaylist] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    if (song) {
      setIsFav(song.isFavorited);
      favoritesApi.check(song.id).then((r) => setIsFav(r.data.favorited)).catch(() => {});
    }
  }, [song?.id]);

  const toggleFav = () => {
    if (!song) return;
    const next = !isFav;
    setIsFav(next);
    (next ? favoritesApi.add(song.id) : favoritesApi.remove(song.id)).catch(() => setIsFav(!next));
  };

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

  if (!song) return null;

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const modeIcon = playMode === 'sequential' ? '🔁' : playMode === 'shuffle' ? '🔀' : '🔂';

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const newTime = ((e.clientX - rect.left) / rect.width) * duration;
    if (audioRef.current) audioRef.current.currentTime = newTime;
    seek(newTime);
  };

  const s = {
    bar: {
      position: 'fixed' as const, bottom: 0, left: 0, right: 0, zIndex: 9999,
      height: 72, display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px',
      background: 'rgba(14,12,20,0.92)',
      backdropFilter: 'blur(24px)',
      WebkitBackdropFilter: 'blur(24px)',
      borderTop: '1px solid rgba(255,255,255,0.15)',
    },
    disc: {
      width: 46, height: 46, borderRadius: '50%',
      flexShrink: 0, cursor: 'pointer',
      animation: isPlaying ? 'spin 8s linear infinite' : 'none',
      overflow: 'hidden',
      border: '2px solid rgba(255,180,130,0.12)',
      boxShadow: '0 0 20px rgba(255,140,66,0.08)',
    },
    discImg: {
      width: '100%', height: '100%', objectFit: 'cover', display: 'block',
    },
    discPlaceholder: {
      width: '100%', height: '100%',
      background: 'linear-gradient(145deg, #1e1830, #141020)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 18,
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
      <div style={{ position: 'relative' as const, display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={s.disc} onClick={() => navigate(`/play/${song.id}`)}>
          {song.coverUrl ? (
            <img src={song.coverUrl} alt="" style={s.discImg} />
          ) : (
            <div style={s.discPlaceholder}>💿</div>
          )}
        </div>
        {queue.length > 0 && (
          <>
            <button
              style={{ ...s.ctrlBtn, fontSize: 14, flexShrink: 0 }}
              onClick={() => setShowQueue(!showQueue)}
              title="播放列表"
            >
              📋
            </button>
            {showQueue && (
              <div style={{
                position: 'absolute', bottom: 56, left: 0, width: 260,
                maxHeight: 340, overflowY: 'auto',
                background: 'rgba(16,12,24,0.96)', backdropFilter: 'blur(20px)',
                borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)',
                padding: '8px 0', zIndex: 60,
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
          </>
        )}
      </div>
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
      <div style={s.playBtn} onClick={() => {
        if (isPlaying) { pause(); }
        else { resume(); if (song) startAudioPlayback(song.id); }
      }}>
        <span style={s.playIcon}>{isPlaying ? '⏸' : '▶'}</span>
      </div>
      <button style={s.ctrlBtn} onClick={next}>⏭</button>
      <button style={{ ...s.ctrlBtn, fontSize: 14 }} onClick={toggleFav}>{isFav ? '❤️' : '♡'}</button>
      <div style={{ position: 'relative' as const }}>
        <button style={{ ...s.ctrlBtn, fontSize: 16 }} onClick={openAddPlaylist}>＋</button>
        {showAddPlaylist && (
          <div style={{
            position: 'absolute', bottom: 44, right: 0, width: 180,
            background: 'rgba(20,16,28,0.95)', backdropFilter: 'blur(16px)',
            borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)',
            padding: '8px 0', maxHeight: 200, overflowY: 'auto',
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
    </div>
  );
}
