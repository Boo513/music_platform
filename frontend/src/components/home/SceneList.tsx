import { useStore } from '@/stores/useStore';

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

  const handleClick = (s: typeof SCENES[0]) => {
    setActiveScene(s.key);
    setTargetSpeed(s.speed);
    setAccentColor(s.color);
    triggerShockwave();
  };

  return (
    <div className="scene-list">
      <div className="scene-search">
        <input type="text" placeholder="搜索场景..." />
        <span className="search-icon">🔍</span>
      </div>
      <div className="scene-items">
        {SCENES.map((s) => (
          <div
            key={s.key}
            className={`scene-item ${activeScene === s.key ? 'active' : ''}`}
            onClick={() => handleClick(s)}
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
