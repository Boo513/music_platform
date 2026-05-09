import { useNavigate } from 'react-router-dom';
import { SceneList } from './SceneList';
import { MusicList } from './MusicList';
import { Shockwave } from './Shockwave';

export function UIOverlay() {
  const navigate = useNavigate();

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
          <div className="home-param">
            <span className="param-value">0.70</span>
            <span className="param-label">验证你的身份</span>
          </div>
        </div>
      </div>

      {/* Middle content */}
      <div className="home-middle">
        <SceneList />
        <MusicList />
      </div>

      {/* Bottom player bar */}
      <div className="home-player-bar">
        <div className="hp-left">
          <span className="hp-dot" />
          <span className="hp-song">赛博夜曲</span>
          <span className="hp-artist">Neon Waves</span>
        </div>
        <div className="hp-center">
          <span className="hp-time">3:42</span>
          <div className="hp-track">
            <div className="hp-fill" />
          </div>
          <span className="hp-time">0:00</span>
        </div>
        <div className="hp-right">
          <span className="hp-tag">标准音效试听</span>
          <span className="hp-tag hp-tag-vip">VIP</span>
        </div>
      </div>
    </div>
  );
}
