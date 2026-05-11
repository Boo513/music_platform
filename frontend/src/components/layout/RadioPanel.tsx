import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { favoritesApi } from '@/api/favorites';
import { playlistsApi } from '@/api/playlists';
import type { Song, Playlist } from '@/types';
import { STYLE_OPTIONS, MOOD_OPTIONS } from '@/types';

interface RadioPanelProps {
  song: Song;
  isPlaying: boolean;
  isFavorited: boolean;
  onTogglePlay: () => void;
  onToggleFavorite: () => void;
  onClose: () => void;
}

const romanticBtn: React.CSSProperties = {
  flexShrink: 0,
  fontSize: 13,
  fontWeight: 600,
  width: 36, height: 36,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.12))',
  border: '1px solid rgba(236,72,153,0.2)',
  color: 'rgba(251,207,232,0.85)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  transition: 'all 0.3s',
};

export function RadioPanel({ song, isPlaying, isFavorited, onTogglePlay, onToggleFavorite, onClose }: RadioPanelProps) {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const { playMode, next, prev, togglePlayMode } = usePlayerStore();
  const [favCount, setFavCount] = useState(0);
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [addingId, setAddingId] = useState<number | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const prevFavRef = useRef(isFavorited);

  useEffect(() => {
    if (!song.id) return;
    favoritesApi.count(song.id).then((r) => setFavCount(r.data)).catch(() => {});
  }, [song.id]);

  useEffect(() => {
    if (prevFavRef.current !== isFavorited) {
      setFavCount((c) => isFavorited ? c + 1 : Math.max(0, c - 1));
      prevFavRef.current = isFavorited;
    }
  }, [isFavorited]);

  const styleInfo = STYLE_OPTIONS.find((s) => s.value === song.style);
  const moodInfo = MOOD_OPTIONS.find((m) => m.value === song.mood);

  const modeIcon = playMode === 'sequential' ? '🔁' : playMode === 'shuffle' ? '🔀' : '🔂';
  const modeLabel = playMode === 'sequential' ? '顺序' : playMode === 'shuffle' ? '随机' : '单曲';

  const handleOpenPlaylistPicker = () => {
    if (!isLoggedIn) {
      setToastMsg('请先登录');
      setTimeout(() => setToastMsg(''), 2000);
      return;
    }
    playlistsApi.list().then((r) => setPlaylists(r.data)).catch(() => {});
    setShowPlaylistPicker(!showPlaylistPicker);
  };

  const handleAddToPlaylist = (pl: Playlist) => {
    if (!song.id) return;
    setAddingId(pl.id);
    playlistsApi.addSong(pl.id, song.id)
      .then(() => {
        setToastMsg(`已添加到「${pl.name}」`);
        setShowPlaylistPicker(false);
      })
      .catch(() => setToastMsg('添加失败，可能已存在'))
      .finally(() => {
        setAddingId(null);
        setTimeout(() => setToastMsg(''), 2000);
      });
  };

  const onHover = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236,72,153,0.22), rgba(168,85,247,0.22))';
    e.currentTarget.style.borderColor = 'rgba(236,72,153,0.4)';
    e.currentTarget.style.color = '#fdf2f8';
    e.currentTarget.style.boxShadow = '0 0 20px rgba(236,72,153,0.15)';
  };
  const onLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.background = 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(168,85,247,0.12))';
    e.currentTarget.style.borderColor = 'rgba(236,72,153,0.2)';
    e.currentTarget.style.color = 'rgba(251,207,232,0.85)';
    e.currentTarget.style.boxShadow = 'none';
  };

  return (
    <div className="fixed left-7 top-45 -translate-y-55 z-10 w-310
      bg-dark-55 border border-white-8 rounded-2xl overflow-hidden">
      <div className="relative h-40 grad-panel-thumb">
        <div className="absolute inset-0" style={{background:'linear-gradient(180deg, transparent 40%, rgba(18,14,22,0.8) 100%)'}} />
        <button className="absolute top-3 left-3 w-26 h-26 rounded-full bg-black-45
          flex items-center justify-center text-white text-xs z-10 hover-bg-black-70" onClick={onClose}>×</button>
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
        <div className="flex items-center gap-2">
          <div className="text-xl font-bold flex-1">{song.title}</div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={handleOpenPlaylistPicker}
              style={romanticBtn}
              onMouseEnter={onHover}
              onMouseLeave={onLeave}
              title="添加到歌单"
            >
              📁
            </button>
            {showPlaylistPicker && (
              <div style={{
                position: 'absolute', top: '100%', right: 0, marginTop: 6,
                background: 'rgba(18,14,24,0.97)', backdropFilter: 'blur(20px)',
                border: '1px solid rgba(236,72,153,0.15)', borderRadius: 12,
                padding: 8, minWidth: 180, maxHeight: 220, overflowY: 'auto', zIndex: 20,
              }}>
                {playlists.length === 0 ? (
                  <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12, padding: 8, textAlign: 'center' }}>暂无歌单</div>
                ) : (
                  playlists.map((pl) => (
                    <div
                      key={pl.id}
                      onClick={() => handleAddToPlaylist(pl)}
                      style={{
                        padding: '8px 10px', borderRadius: 8, cursor: 'pointer',
                        fontSize: 13, color: addingId === pl.id ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.75)',
                        transition: 'all 0.15s',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(236,72,153,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
                    >
                      <span>📋</span>
                      <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pl.name}</span>
                      {addingId === pl.id && <span style={{ fontSize: 11 }}>...</span>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => navigate('/')}
            style={romanticBtn}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            title="返回首页"
          >
            🏠
          </button>
        </div>
        <div className="flex items-center gap-1.5 text-xs mt-1">
          {styleInfo?.emoji} {styleInfo?.label} · {moodInfo?.emoji} {moodInfo?.label}
        </div>
        <div className="text-xs mt-2 italic" style={{color:'rgba(255,255,255,0.4)'}}>{song.artist}</div>

        {/* 播放控制按钮 - 纯图标，随意摆放 */}
        <div style={{
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-evenly',
          marginTop: 14, padding: '0 4px',
        }}>
          <button
            onClick={togglePlayMode}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.35)', fontSize: 14,
              cursor: 'pointer', padding: 4, transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)'; e.currentTarget.style.transform = 'scale(1.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'scale(1)'; }}
            title={`播放模式：${modeLabel}`}
          >
            {modeIcon}
          </button>
          <button
            onClick={prev}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.35)', fontSize: 16,
              cursor: 'pointer', padding: 6, transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(251,207,232,0.8)'; e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'scale(1)'; }}
            title="上一曲"
          >
            ⏮
          </button>
          <button
            onClick={onTogglePlay}
            style={{
              background: 'none', border: 'none',
              color: isPlaying ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)',
              fontSize: 24,
              cursor: 'pointer', padding: 6, transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#fff'; e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isPlaying ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.55)'; e.currentTarget.style.transform = 'scale(1)'; }}
            title={isPlaying ? '暂停' : '播放'}
          >
            {isPlaying ? '⏸' : '▶'}
          </button>
          <button
            onClick={next}
            style={{
              background: 'none', border: 'none',
              color: 'rgba(255,255,255,0.35)', fontSize: 16,
              cursor: 'pointer', padding: 6, transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = 'rgba(251,207,232,0.8)'; e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(255,255,255,0.35)'; e.currentTarget.style.transform = 'scale(1)'; }}
            title="下一曲"
          >
            ⏭
          </button>
          <button
            onClick={onToggleFavorite}
            style={{
              background: 'none', border: 'none',
              color: isFavorited ? 'rgba(255,100,120,0.7)' : 'rgba(255,255,255,0.3)',
              fontSize: 15,
              cursor: 'pointer', padding: 6, transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = '#ff6080'; e.currentTarget.style.transform = 'scale(1.2)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.color = isFavorited ? 'rgba(255,100,120,0.7)' : 'rgba(255,255,255,0.3)'; e.currentTarget.style.transform = 'scale(1)'; }}
            title="收藏"
          >
            {isFavorited ? '❤️' : '♡'}
          </button>
        </div>

        <div className="flex gap-4 mt-3 text-secondary text-xs">
          <span>👁 {song.playCount.toLocaleString()}</span>
          <span>❤️ {favCount}</span>
          {toastMsg && (
            <span style={{ color: 'rgba(251,207,232,0.7)', fontSize: 11, flex: 1, textAlign: 'right' }}>{toastMsg}</span>
          )}
        </div>
        <button
          className="w-full mt-4 py-3 rounded-xl text-white text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-300"
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
