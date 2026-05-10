import { SCENE_OPTIONS } from '@/types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  selectedScene: string;
  onSelectScene: (key: string) => void;
  effects: { particles: boolean; bloom: boolean; vignette: boolean };
  onToggleEffect: (key: 'particles' | 'bloom' | 'vignette') => void;
}

const s = {
  overlay: {
    position: 'fixed' as const, inset: 0, zIndex: 40,
    background: 'rgba(0,0,0,0.5)',
  },
  panel: {
    position: 'fixed' as const, right: 0, top: 0, bottom: 0, width: 300, zIndex: 50,
    background: 'rgba(10,8,18,0.95)', backdropFilter: 'blur(20px)',
    borderLeft: '1px solid rgba(255,255,255,0.08)',
    padding: '24px 20px', overflowY: 'auto' as const,
  },
  header: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    marginBottom: 20,
  },
  title: { color: '#f0e6e0', fontSize: 16, fontWeight: 700 },
  closeBtn: { background: 'none', border: 'none', color: '#f0e6e0', fontSize: 22, cursor: 'pointer' },
  sectionTitle: { color: '#f0e6e0', fontSize: 10, textTransform: 'uppercase' as const, letterSpacing: 2, marginBottom: 10 },
  sceneItem: (active: boolean): React.CSSProperties => ({
    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
    borderRadius: 12, cursor: 'pointer', border: '1px solid',
    borderColor: active ? 'rgba(249,115,22,0.3)' : 'transparent',
    background: active ? 'rgba(249,115,22,0.08)' : 'transparent',
    marginBottom: 6, transition: 'all 0.2s',
  }),
  sceneEmoji: { fontSize: 20 },
  sceneLabel: { flex: 1, fontSize: 13, fontWeight: 600, color: '#f0e6e0' },
  sceneDesc: { fontSize: 10, color: 'rgba(255,255,255,0.3)' },
  sceneDot: (active: boolean): React.CSSProperties => ({
    width: 12, height: 12, borderRadius: '50%', border: '2px solid',
    borderColor: active ? 'rgba(249,115,22,0.7)' : 'rgba(255,255,255,0.15)',
  }),
  divider: { borderTop: '1px solid rgba(255,255,255,0.06)', margin: '16px 0' },
  toggleRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  toggleLabel: { color: '#f0e6e0', fontSize: 13 },
  toggleBtn: (on: boolean): React.CSSProperties => ({
    width: 40, height: 24, borderRadius: 12, border: 'none',
    background: on ? '#f97316' : 'rgba(255,255,255,0.15)',
    cursor: 'pointer', position: 'relative' as const, transition: 'background 0.2s',
  }),
  toggleKnob: (on: boolean): React.CSSProperties => ({
    position: 'absolute' as const, top: 2, width: 20, height: 20, borderRadius: '50%',
    background: '#fff',
    left: on ? 18 : 2,
    transition: 'left 0.2s',
  }),
};

export function SettingsPanel({ open, onClose, selectedScene, onSelectScene, effects, onToggleEffect }: SettingsPanelProps) {
  if (!open) return null;

  return (
    <>
      <div style={s.overlay} onClick={onClose} />
      <div style={s.panel}>
        <div style={s.header}>
          <span style={s.title}>⚙ 设置</span>
          <button style={s.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={s.sectionTitle}>场景主题</div>
        {SCENE_OPTIONS.map((scene) => (
          <div
            key={scene.key}
            style={s.sceneItem(selectedScene === scene.key)}
            onClick={() => onSelectScene(scene.key)}
          >
            <span style={s.sceneEmoji}>{scene.emoji}</span>
            <div style={{ flex: 1 }}>
              <div style={s.sceneLabel}>{scene.label}</div>
              <div style={s.sceneDesc}>{scene.desc}</div>
            </div>
            <div style={s.sceneDot(selectedScene === scene.key)} />
          </div>
        ))}

        <div style={s.divider} />
        <div style={s.sectionTitle}>画面效果</div>

        {([
          ['particles', '粒子特效'] as const,
          ['bloom', '后处理 Bloom'] as const,
          ['vignette', '暗角遮罩'] as const,
        ]).map(([key, label]) => (
          <div key={key} style={s.toggleRow}>
            <span style={s.toggleLabel}>{label}</span>
            <button
              style={s.toggleBtn(effects[key])}
              onClick={(e) => {
                e.stopPropagation();
                onToggleEffect(key);
              }}
            >
              <div style={s.toggleKnob(effects[key])} />
            </button>
          </div>
        ))}
      </div>
    </>
  );
}
