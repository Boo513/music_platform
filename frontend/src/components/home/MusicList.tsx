import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi } from '@/api/songs';
import { startAudioPlayback } from '@/hooks/useAudioPlayer';
import { STYLE_OPTIONS, MOOD_OPTIONS, type Song, type StyleType, type MoodType } from '@/types';

const GENRES = ['全部', ...STYLE_OPTIONS.map((s) => s.label)];

const STYLE_MAP: Record<string, StyleType> = Object.fromEntries(
  STYLE_OPTIONS.map((s) => [s.label, s.value])
);

interface Props {
  searchKeyword?: string;
}

export function MusicList({ searchKeyword = '' }: Props) {
  const [activeGenre, setActiveGenre] = useState('全部');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [mvUrl, setMvUrl] = useState<string | null>(null);
  const [editSong, setEditSong] = useState<Song | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editArtist, setEditArtist] = useState('');
  const [editStyle, setEditStyle] = useState<StyleType | ''>('');
  const [editMood, setEditMood] = useState<MoodType | ''>('');
  const [deleteTarget, setDeleteTarget] = useState<Song | null>(null);
  const [deleteOk, setDeleteOk] = useState(false);
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';
  const sentinelRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(false);
  const loadingRef = useRef(false);
  const navigate = useNavigate();
  const { play } = usePlayerStore();

  const fetchSongs = useCallback((p: number, append: boolean) => {
    if (p === 1) setLoading(true);
    else setLoadingMore(true);
    loadingRef.current = true;

    const params: { page: number; size: number; style?: StyleType; keyword?: string } = { page: p, size: 20 };
    if (activeGenre !== '全部') {
      const style = STYLE_MAP[activeGenre];
      if (style) params.style = style;
    }
    if (searchKeyword) params.keyword = searchKeyword;
    songsApi
      .list(params)
      .then((res) => {
        setSongs(append ? (prev) => [...prev, ...res.data.records] : res.data.records);
        hasMoreRef.current = p < res.data.pages;
        setHasMore(hasMoreRef.current);
        pageRef.current = p;
      })
      .catch(() => { if (!append) setSongs([]); })
      .finally(() => {
        setLoading(false);
        setLoadingMore(false);
        loadingRef.current = false;
      });
  }, [activeGenre, searchKeyword]);

  // 初次 / 切风格 → 重置
  useEffect(() => {
    pageRef.current = 1;
    setPage(1);
    fetchSongs(1, false);
  }, [fetchSongs]);

  // 无限滚动 — 监听 song-list 容器内部的滚动
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const root = sentinel.closest('.song-list') as HTMLElement | null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && !loadingRef.current) {
          const next = pageRef.current + 1;
          pageRef.current = next;
          setPage(next);
          fetchSongs(next, true);
        }
      },
      { root, rootMargin: '200px' }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [fetchSongs, songs.length]);

  const handlePlay = (song: Song) => {
    play(song, songs);
    startAudioPlayback(song.id);
    navigate(`/play/${song.id}`);
  };

  return (
    <div className="music-list">
      <div className="genre-tags">
        {GENRES.map((g) => (
          <button
            key={g}
            className={`genre-tag ${activeGenre === g ? 'active' : ''}`}
            onClick={() => setActiveGenre(g)}
          >
            {g}
          </button>
        ))}
      </div>
      <div className="song-list">
        {loading && songs.length === 0 ? (
          <div className="text-white-30 text-sm py-8 text-center">加载中...</div>
        ) : songs.length === 0 ? (
          <div className="text-white-30 text-sm py-8 text-center">暂无歌曲</div>
        ) : (
          <>
            {songs.map((s) => (
              <div key={s.id} className="song-row" onClick={() => handlePlay(s)}>
                <div className="song-cover-mini" style={{ position: 'relative' }}>
                  <div className="song-cover-placeholder">🎵</div>
                  {s.coverUrl && (
                    <img src={s.coverUrl} alt="" className="song-cover-img"
                      style={{ position: 'absolute', inset: 0 }}
                      onError={(e) => (e.target as HTMLImageElement).remove()} />
                  )}
                </div>
                <div className="song-info">
                  <span className="song-title">{s.title}</span>
                  <span className="song-artist">{s.artist}</span>
                </div>
                {s.isFavorited && <span className="song-vip">❤️</span>}
                {s.hasVideo && (
                  <button
                    className="song-mv-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setMvUrl(songsApi.getVideoUrl(s.id));
                    }}
                    title="播放MV"
                  >
                    🎬
                  </button>
                )}
                {isAdmin && (
                  <>
                    <button
                      className="song-edit-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditSong(s);
                        setEditTitle(s.title);
                        setEditArtist(s.artist);
                        setEditStyle(s.style);
                        setEditMood(s.mood);
                      }}
                      title="编辑歌曲"
                    >
                      ✏️
                    </button>
                    <button
                      className="song-del-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteTarget(s);
                      }}
                      title="删除歌曲"
                    >
                      🗑️
                    </button>
                  </>
                )}
                <span className="song-play">▶</span>
              </div>
            ))}
            {/* 滚动哨兵 */}
            <div ref={sentinelRef} style={{ height: 1 }} />
            {loadingMore && (
              <div className="text-white-20 text-xs py-3 text-center">加载中...</div>
            )}
          </>
        )}
      </div>

      {/* 编辑弹窗 */}
      {editSong && (
        <div className="mv-overlay" onClick={() => setEditSong(null)}>
          <div className="edit-dialog" onClick={(e) => e.stopPropagation()}>
            <h3 className="edit-title">编辑歌曲</h3>
            <div className="edit-field">
              <label>歌名</label>
              <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} />
            </div>
            <div className="edit-field">
              <label>歌手</label>
              <input value={editArtist} onChange={(e) => setEditArtist(e.target.value)} />
            </div>
            <div className="edit-field">
              <label>风格</label>
              <select value={editStyle} onChange={(e) => setEditStyle(e.target.value as StyleType)}>
                <option value="">不变</option>
                {STYLE_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>{s.emoji} {s.label}</option>
                ))}
              </select>
            </div>
            <div className="edit-field">
              <label>情绪</label>
              <select value={editMood} onChange={(e) => setEditMood(e.target.value as MoodType)}>
                <option value="">不变</option>
                {MOOD_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>{m.emoji} {m.label}</option>
                ))}
              </select>
            </div>
            <div className="edit-actions">
              <button className="edit-cancel" onClick={() => setEditSong(null)}>取消</button>
              <button className="edit-save" onClick={() => {
                const data: Record<string, string> = {};
                if (editTitle.trim() && editTitle.trim() !== editSong.title) data.title = editTitle.trim();
                if (editArtist.trim() && editArtist.trim() !== editSong.artist) data.artist = editArtist.trim();
                if (editStyle && editStyle !== editSong.style) data.style = editStyle;
                if (editMood && editMood !== editSong.mood) data.mood = editMood;
                if (Object.keys(data).length === 0) { setEditSong(null); return; }
                songsApi.update(editSong.id, data).then((res) => {
                  setSongs((prev) => prev.map((s) => s.id === editSong.id ? { ...s, ...res.data } : s));
                  setEditSong(null);
                }).catch(() => {});
              }}>保存</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除确认弹窗 */}
      {deleteTarget && (
        <div className="mv-overlay" onClick={() => setDeleteTarget(null)}>
          <div className="edit-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <h3 className="edit-title">确认删除</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 20 }}>
              将永久删除「{deleteTarget.title} - {deleteTarget.artist}」
            </p>
            <div className="edit-actions" style={{ justifyContent: 'center' }}>
              <button className="edit-cancel" onClick={() => setDeleteTarget(null)}>取消</button>
              <button className="edit-save" style={{ background: 'linear-gradient(135deg, #c0392b, #a01d1d)' }}
                onClick={() => {
                  songsApi.delete(deleteTarget.id).then(() => {
                    setSongs((prev) => prev.filter((s) => s.id !== deleteTarget.id));
                    setDeleteTarget(null);
                    setDeleteOk(true);
                    setTimeout(() => setDeleteOk(false), 2000);
                  }).catch(() => {});
                }}
              >确认删除</button>
            </div>
          </div>
        </div>
      )}

      {/* 删除成功提示 */}
      {deleteOk && (
        <div className="mv-overlay" onClick={() => setDeleteOk(false)}>
          <div className="edit-dialog" onClick={(e) => e.stopPropagation()} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
            <h3 className="edit-title">删除成功</h3>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, marginBottom: 16 }}>歌曲已从平台移除</p>
            <button className="edit-save" onClick={() => setDeleteOk(false)} style={{ width: '100%' }}>确定</button>
          </div>
        </div>
      )}

      {/* MV 播放弹窗 */}
      {mvUrl && (
        <div className="mv-overlay" onClick={() => setMvUrl(null)}>
          <div className="mv-player" onClick={(e) => e.stopPropagation()}>
            <button className="mv-close" onClick={() => setMvUrl(null)}>✕</button>
            <video
              src={mvUrl}
              controls
              autoPlay
              className="mv-video"
              onError={() => setMvUrl(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
