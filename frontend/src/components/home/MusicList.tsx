import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi } from '@/api/songs';
import { startAudioPlayback } from '@/hooks/useAudioPlayer';
import { STYLE_OPTIONS, type Song, type StyleType } from '@/types';

const GENRES = ['全部', ...STYLE_OPTIONS.map((s) => s.label)];

const STYLE_MAP: Record<string, StyleType> = Object.fromEntries(
  STYLE_OPTIONS.map((s) => [s.label, s.value])
);

export function MusicList() {
  const [activeGenre, setActiveGenre] = useState('全部');
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
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

    const params: { page: number; size: number; style?: StyleType } = { page: p, size: 20 };
    if (activeGenre !== '全部') {
      const style = STYLE_MAP[activeGenre];
      if (style) params.style = style;
    }
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
  }, [activeGenre]);

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
                <div className="song-cover-mini">
                  {s.coverUrl ? (
                    <img src={s.coverUrl} alt="" className="song-cover-img" />
                  ) : (
                    <div className="song-cover-placeholder">🎵</div>
                  )}
                </div>
                <div className="song-info">
                  <span className="song-title">{s.title}</span>
                  <span className="song-artist">{s.artist}</span>
                </div>
                {s.isFavorited && <span className="song-vip">❤️</span>}
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
    </div>
  );
}
