import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { SceneList } from './SceneList';
import { MusicList } from './MusicList';
import { Shockwave } from './Shockwave';

export function UIOverlay() {
  const navigate = useNavigate();
  const { isLoggedIn } = useAuthStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [immersive, setImmersive] = useState(false);
  const [showImmersiveToast, setShowImmersiveToast] = useState(false);
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

  const handleImmersiveConfirm = () => {
    setShowImmersiveToast(false);
    document.body.requestFullscreen().catch(() => {});
    document.body.classList.add('immersive-mode');
    setImmersive(true);
  };

  useEffect(() => {
    if (!immersive) return;
    const onFullscreenChange = () => {
      if (!document.fullscreenElement) {
        document.body.classList.remove('immersive-mode');
        setImmersive(false);
      }
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, [immersive]);

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
          <button
            className="upload-btn"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #a78bfa)' }}
            onClick={() => setShowImmersiveToast(true)}
          >
            🌙 沉浸模式
          </button>
        </div>
      </div>

      {/* Middle content */}
      <div className="home-middle">
        <SceneList searchQuery={searchQuery} onSearchChange={handleSearchChange} />
        <MusicList searchKeyword={debouncedQuery} />
      </div>

      {/* Bottom player bar — 已有全局 PlayerBar，此处移除硬编码占位 */}

      {/* 沉浸模式确认弹窗 */}
      {showImmersiveToast && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            pointerEvents: 'auto',
          }}
          onClick={() => setShowImmersiveToast(false)}
        >
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }} />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              background: 'rgba(18,14,28,0.97)',
              backdropFilter: 'blur(24px)',
              border: '1px solid rgba(124,58,237,0.2)',
              borderRadius: 20,
              padding: '28px 24px 20px',
              maxWidth: 340,
              width: '90%',
              textAlign: 'center',
              boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>🌙</div>
            <div style={{ color: '#fff', fontSize: 16, fontWeight: 700, marginBottom: 6 }}>沉浸模式</div>
            <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, lineHeight: 1.6, marginBottom: 20 }}>
              将进入全屏并隐藏所有界面元素<br />
              仅保留 3D 场景背景<br />
              按 <span style={{ color: '#a78bfa', fontWeight: 600 }}>ESC</span> 即可退出
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowImmersiveToast(false)}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.04)',
                  color: 'rgba(255,255,255,0.6)', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                取消
              </button>
              <button
                onClick={handleImmersiveConfirm}
                style={{
                  flex: 1, padding: '10px 0', borderRadius: 10, border: 'none',
                  background: 'linear-gradient(135deg, #7c3aed, #a78bfa)',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}
              >
                进入
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
