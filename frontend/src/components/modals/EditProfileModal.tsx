import { useState } from 'react';
import { NeonButton } from '@/components/shared/NeonButton';

interface Props {
 open: boolean;
 onClose: () => void;
 initialNickname: string;
 onSave: (nickname: string) => void;
}

export function EditProfileModal({ open, onClose, initialNickname, onSave }: Props) {
 const [nickname, setNickname] = useState(initialNickname);
 if (!open) return null;

 return (
 <>
 <div className="fixed inset-0 bg-black-50 z-50" onClick={onClose} />
 <div className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
 glass-panel p-6 w-360 duration-200">
 <h3 className=" text-lg font-bold mb-4">✎ 编辑资料</h3>
 <label className=" text-11 uppercase tracking-wider mb-1.5 block">昵称</label>
 <input
 className="w-full px-3.5 py-3 rounded-xl bg-white-3 border border-white-6
 text-13 "
 value={nickname} onChange={(e) => setNickname(e.target.value)}
 />
 <div className="flex gap-3 mt-6">
 <button className="flex-1 py-3 rounded-xl border border-white-8 text-sm" onClick={onClose}>
 取消
 </button>
 <div className="flex-1"><NeonButton onClick={() => { onSave(nickname); onClose(); }}>保存</NeonButton></div>
 </div>
 </div>
 </>
 );
}
