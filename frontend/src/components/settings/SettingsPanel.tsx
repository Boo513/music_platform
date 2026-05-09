import { SCENE_OPTIONS } from '@/types';

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  selectedScene: string;
  onSelectScene: (key: string) => void;
  effects: { particles: boolean; bloom: boolean; vignette: boolean };
  onToggleEffect: (key: 'particles' | 'bloom' | 'vignette') => void;
}

export function SettingsPanel({ open, onClose, selectedScene, onSelectScene, effects, onToggleEffect }: SettingsPanelProps) {
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-40" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-[320px] z-50
        bg-[rgba(14,10,22,0.9)] backdrop-blur-[40px] border-l border-[rgba(255,255,255,0.08)]
        shadow-[-20px_0_60px_rgba(0,0,0,0.5)] p-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <span className="text-[#f0e6e0] text-base font-bold">⚙ 设置</span>
          <button className="text-[#a09080] text-xl hover:text-[#ffe0c8]" onClick={onClose}>×</button>
        </div>

        <div className="text-[#a09080] text-[11px] uppercase tracking-wider mb-3">场景主题</div>
        <div className="flex flex-col gap-2 mb-6">
          {SCENE_OPTIONS.map((s) => (
            <div key={s.key}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all
                ${selectedScene === s.key ? 'bg-[#FF8C42]/10 border border-[rgba(255,179,102,0.2)]' : 'border border-transparent'}`}
              onClick={() => onSelectScene(s.key)}
            >
              <span className="text-xl">{s.emoji}</span>
              <div className="flex-1">
                <div className={`text-[13px] font-semibold ${selectedScene === s.key ? 'text-[#FFB366]' : 'text-[#d0c0b0]'}`}>
                  {s.label}
                </div>
                <div className="text-[10px] text-white/30">{s.desc}</div>
              </div>
              <div className={`w-3 h-3 rounded-full border
                ${selectedScene === s.key
                  ? 'bg-[#FF8C42] border-[#FF8C42] shadow-[0_0_8px_rgba(255,140,66,0.5)]'
                  : 'border-[rgba(255,255,255,0.15)]'}`} />
            </div>
          ))}
        </div>

        <div className="border-t border-[rgba(255,255,255,0.06)] pt-5">
          <div className="text-[#a09080] text-[11px] uppercase tracking-wider mb-3">画面效果</div>
          {([
            ['particles', '粒子特效'],
            ['bloom', '后处理 Bloom'],
            ['vignette', '暗角遮罩'],
          ] as const).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between mb-3">
              <span className="text-[#d0c0b0] text-[13px]">{label}</span>
              <button
                className={`w-10 h-[22px] rounded-full relative transition-colors
                  ${effects[key] ? 'bg-[#FF8C42]' : 'bg-[rgba(255,255,255,0.08)]'}`}
                onClick={() => onToggleEffect(key)}
              >
                <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white transition-all
                  ${effects[key] ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
