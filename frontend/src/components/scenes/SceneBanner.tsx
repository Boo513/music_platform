import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { SCENE_OPTIONS } from '@/types';

interface Props {
 selectedScene: string;
 onSelectScene: (key: string) => void;
}

export function SceneBanner({ selectedScene, onSelectScene }: Props) {
 return (
 <div className="mx-6 mt-4 rounded-2xl overflow-hidden border border-white-8 h-180 flex">
 <div className="flex-1 relative bg-gradient-to-b via-[#2a4560]/60">
 <Canvas camera={{ position: [0, 0, 3], fov: 45 }}>
 <Stars radius={20} depth={10} count={150} factor={2} fade speed={0.3} />
 <ambientLight intensity={0.4} />
 </Canvas>
 <div className="absolute bottom-4 left-4 z-10">
 <div className="text-11 text-white/40 tracking-wider">CURRENT SCENE</div>
 <div className="text-lg font-bold">
 {SCENE_OPTIONS.find((s) => s.key === selectedScene)?.label ?? '自动匹配'}
 </div>
 <div className="text-11">当前播放场景</div>
 </div>
 </div>
 <div className="w-160 bg-black-70 p-3 flex flex-col gap-1.5 overflow-y-auto">
 {SCENE_OPTIONS.map((s) => (
 <div key={s.key}
 className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-11 cursor-pointer transition-all
 ${selectedScene === s.key ? 'bg-accent-15 border border-orange-20 ' : ''}`}
 onClick={() => onSelectScene(s.key)}
 >{s.emoji} {s.label}</div>
 ))}
 </div>
 </div>
 );
}
