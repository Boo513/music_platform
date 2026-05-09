import { useState } from 'react';
import { NeonButton } from '@/components/shared/NeonButton';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreate: (name: string, description: string, isPublic: boolean) => void;
}

export function CreatePlaylistModal({ open, onClose, onCreate }: Props) {
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/50 z-50" onClick={onClose} />
      <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
        glass-panel p-6 w-[400px] animate-in zoom-in-95 duration-200">
        <h3 className="text-[#f0e6e0] text-lg font-bold mb-4">＋ 新建歌单</h3>
        <label className="text-[#a09080] text-[11px] uppercase tracking-wider mb-1.5 block">歌单名称 *</label>
        <input className="w-full px-3.5 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]
          text-[#f0e6e0] text-[13px] outline-none focus:border-[#FFB366]/30 mb-3"
          value={name} onChange={(e) => setName(e.target.value)} placeholder="输入歌单名称..." />
        <label className="text-[#a09080] text-[11px] uppercase tracking-wider mb-1.5 block">描述</label>
        <textarea className="w-full px-3.5 py-3 rounded-xl bg-[rgba(255,255,255,0.03)] border border-[rgba(255,255,255,0.06)]
          text-[#f0e6e0] text-[13px] outline-none focus:border-[#FFB366]/30 mb-4 resize-none h-20"
          value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="描述一下这个歌单..." />
        <div className="flex items-center justify-between mb-6">
          <span className="text-[#d0c0b0] text-[13px]">公开</span>
          <button
            className={`w-10 h-[22px] rounded-full relative transition-colors ${isPublic ? 'bg-[#FF8C42]' : 'bg-[rgba(255,255,255,0.08)]'}`}
            onClick={() => setIsPublic(!isPublic)}
          >
            <div className={`absolute top-0.5 w-[18px] h-[18px] rounded-full bg-white transition-all
              ${isPublic ? 'right-0.5' : 'left-0.5'}`} />
          </button>
        </div>
        <div className="flex gap-3">
          <button className="flex-1 py-3 rounded-xl border border-[rgba(255,255,255,0.08)] text-[#a09080] text-sm" onClick={onClose}>
            取消
          </button>
          <div className="flex-1"><NeonButton disabled={!name.trim()} onClick={() => { onCreate(name, desc, isPublic); onClose(); }}>创建</NeonButton></div>
        </div>
      </div>
    </>
  );
}
