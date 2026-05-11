import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '@/stores/useStore';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi } from '@/api/songs';
import { startAudioPlayback } from '@/hooks/useAudioPlayer';
import type { Song } from '@/types';

const SCENES = [
  { key: 'cyberpunk', label: '赛博朋克城市', emoji: '🔮', color: '#FF8C42', speed: 2.5 },
  { key: 'galaxy', label: '宇宙星河', emoji: '🌌', color: '#7c3aed', speed: 0.6 },
  { key: 'spring', label: '春日樱花', emoji: '🌸', color: '#ffb7c5', speed: 1.5 },
  { key: 'beach', label: '夏日海滩', emoji: '🏖', color: '#4a90d9', speed: 1.2 },
  { key: 'rain', label: '雨夜都市', emoji: '🌧', color: '#6b8cce', speed: 4.0 },
  { key: 'mountain', label: '山水森林', emoji: '🏔', color: '#50C878', speed: 1.8 },
];

export function SceneList() {
  const { activeScene, setActiveScene, setTargetSpeed, setAccentColor, triggerShockwave } = useStore();
  const { play } = usePlayerStore();
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [searching, setSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const doSearch = useCallback((keyword: string) => {
    if (!keyword.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setSearching(true);
    songsApi.list({ keyword: keyword.trim(), size: 6 })
      .then((res) => {
        setResults(res.data.records);
        setShowResults(true);
      })
      .catch(() => setResults([]))
      .finally(() => setSearching(false));
  }, []);

  const handleInput = (value: string) => {
    setQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => doSearch(value), 300);
  };

  // 点击外部关闭搜索结果
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowResults(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSceneClick = (s: typeof SCENES[0]) => {
    setActiveScene(s.key);
    setTargetSpeed(s.speed);
    setAccentColor(s.color);
    triggerShockwave();
  };

  const handlePlay = (song: Song) => {
    play(song, results);
    startAudioPlayback(song.id);
    setShowResults(false);
    setQuery('');
    navigate(`/play/${song.id}`);
  };

  return (
    <div className="scene-list" ref={containerRef}>
      <div className="scene-search">
        <input
          type="text"
          placeholder="搜索歌曲/歌手..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => { if (results.length > 0) setShowResults(true); }}
        />
        <span className="search-icon">{searching ? '⏳' : '🔍'}</span>

        {/* 搜索结果下拉 */}
        {showResults && (
          <div className="search-results">
            {results.length === 0 ? (
              <div className="search-empty">未找到相关歌曲</div>
            ) : (
              results.map((s) => (
                <div key={s.id} className="search-item" onClick={() => handlePlay(s)}>
                  <span className="search-item-cover">
                    {s.coverUrl ? (
                      <img src={s.coverUrl} alt="" />
                    ) : (
                      <span className="search-item-placeholder">🎵</span>
                    )}
                  </span>
                  <div className="search-item-info">
                    <span className="search-item-title">{s.title}</span>
                    <span className="search-item-artist">{s.artist}</span>
                  </div>
                  <span className="search-item-play">▶</span>
                </div>
              ))
            )}
          </div>
        )}
      </div>
      <div className="scene-items">
        {SCENES.map((s) => (
          <div
            key={s.key}
            className={`scene-item ${activeScene === s.key ? 'active' : ''}`}
            onClick={() => handleSceneClick(s)}
          >
            <span className="scene-emoji">{s.emoji}</span>
            <span className="scene-label">{s.label}</span>
            <span className="scene-speed">{s.speed.toFixed(1)}x</span>
          </div>
        ))}
      </div>
    </div>
  );
}
