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
 <div className="fixed inset-0 bg-black-40 z-40" onClick={onClose} />
 <div className="fixed right-0 top-0 bottom-0 w-320 z-50
 bg-dark-90 border-l border-white-8
 p-6 overflow-y-auto">
 <div className="flex items-center justify-between mb-6">
 <span className=" text-base font-bold">⚙ 设置</span>
 <button className=" text-xl hover-text-white" onClick={onClose}>×</button>
 </div>

 <div className=" text-11 uppercase tracking-wider mb-3">场景主题</div>
 <div className="flex flex-col gap-2 mb-6">
 {SCENE_OPTIONS.map((s) => (
 <div key={s.key}
 className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all
 ${selectedScene === s.key ? '/10 border border-orange-20' : 'border border-transparent'}`}
 onClick={() => onSelectScene(s.key)}
 >
 <span className="text-xl">{s.emoji}</span>
 <div className="flex-1">
 <div className={`text-13 font-semibold ${selectedScene === s.key ? '' : ''}`}>
 {s.label}
 </div>
 <div className="text-10 text-white-30">{s.desc}</div>
 </div>
 <div className={`w-3 h-3 rounded-full border
 ${selectedScene === s.key
 ? ' border-orange-20'
 : 'border-white-15'}`} />
 </div>
 ))}
 </div>

 <div className="border-t border-white-6 pt-5">
 <div className=" text-11 uppercase tracking-wider mb-3">画面效果</div>
 {([
 ['particles', '粒子特效'],
 ['bloom', '后处理 Bloom'],
 ['vignette', '暗角遮罩'],
 ] as const).map(([key, label]) => (
 <div key={key} className="flex items-center justify-between mb-3">
 <span className=" text-13">{label}</span>
 <button
 className={`w-10 h-22 rounded-full relative transition-colors
 ${effects[key] ? '' : 'bg-white-8'}`}
 onClick={() => onToggleEffect(key)}
 >
 <div className={`absolute top-0.5 w-18 h-18 rounded-full bg-white transition-all
 ${effects[key] ? 'right-0.5' : 'left-0.5'}`} />
 </button>
 </div>
 ))}
 </div>
 </div>
 </>
 );
}
