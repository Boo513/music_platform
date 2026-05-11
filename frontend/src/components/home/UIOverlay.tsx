import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { SceneList } from './SceneList';
import { MusicList } from './MusicList';
import { Shockwave } from './Shockwave';

export function UIOverlay() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedQuery, setDebouncedQuery] = useState('');

  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setDebouncedQuery(value.trim()), 300);
  }, []);

  const handleProfileClick = () => {
    if (isLoggedIn) {
      navigate('/profile');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="home-overlay">
      <Shockwave />

      {/* Top bar */}
      <div className="home-top">
        <div className="home-hero">
          <h1 className="home-title">HEAR THE<br />SCENES</h1>
          <p className="home-subtitle">Immerse in 3D soundscapes</p>
          <span className="home-live">LIVE</span>
        </div>
        <div className="home-top-right">
          <button className="upload-btn" onClick={() => navigate('/upload')}>＋ 上传音乐</button>
          <button className="upload-btn" onClick={handleProfileClick} style={{ marginLeft: 8 }}>
            {isLoggedIn ? '👤 个人中心' : '🔑 登录'}
          </button>
        </div>
      </div>

      {/* Middle content */}
      <div className="home-middle">
        <SceneList searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        <MusicList searchKeyword={debouncedQuery} />
      </div>

      {/* Bottom player bar — 已有全局 PlayerBar，此处移除硬编码占位 */}
    </div>
  );
}
