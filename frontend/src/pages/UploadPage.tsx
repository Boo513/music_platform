import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { songsApi } from '@/api/songs';
import { NeonButton } from '@/components/shared/NeonButton';
import { STYLE_OPTIONS, MOOD_OPTIONS, type StyleType, type MoodType } from '@/types';

export default function UploadPage() {
 const navigate = useNavigate();
 const fileInputRef = useRef<HTMLInputElement>(null);
 const [file, setFile] = useState<File | null>(null);
 const [title, setTitle] = useState('');
 const [artist, setArtist] = useState('');
 const [style, setStyle] = useState<StyleType | null>(null);
 const [mood, setMood] = useState<MoodType | null>(null);
 const [uploading, setUploading] = useState(false);
 const [progress, setProgress] = useState(0);
 const [dragOver, setDragOver] = useState(false);
 const [error, setError] = useState('');

 const canSubmit = file && title.trim() && artist.trim() && style && mood && !uploading;

 const handleFile = (f: File) => {
 if (!f.name.endsWith('.mp3')) { setError('仅支持 MP3 格式'); return; }
 if (f.size > 50 * 1024 * 1024) { setError('文件不能超过 50MB'); return; }
 setFile(f); setError('');
 };

 const handleSubmit = async () => {
 if (!canSubmit) return;
 setUploading(true); setError('');
 const fd = new FormData();
 fd.append('title', title.trim()); fd.append('artist', artist.trim());
 fd.append('style', style!); fd.append('mood', mood!); fd.append('audio', file!);
 try {
 const res = await songsApi.upload(fd, setProgress);
 setTimeout(() => navigate(`/play/${res.data.id}`, { replace: true }), 1500);
 } catch (err: any) {
 setError(err?.response?.data?.message || '上传失败');
 setUploading(false);
 }
 };

 const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
 const handleDragLeave = () => setDragOver(false);
 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault(); setDragOver(false);
 if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
 };

 return (
 <div className="min-h-screen pb-24 relative">
 <div className="fixed inset-0 -z-10 opacity-10" style={{
  background: 'radial-gradient(ellipse at 30% 50%, rgba(100,60,180,0.4), transparent 60%), radial-gradient(circle at 70% 40%, rgba(255,140,66,0.15), transparent 50%)'
 }} />

 <div className="flex items-center gap-4 px-6 py-4 border-b border-white-6">
 <button className="text-primary text-lg hover-text-white" onClick={() => navigate(-1)}>←</button>
 <span className="text-primary text-base font-semibold">上传音乐</span>
 </div>

 <div className="flex gap-5 p-6 items-stretch">
 <div
 className={`flex flex-col items-center justify-center border-2 border-dashed rounded-2xl
 cursor-pointer transition-all duration-200
 ${dragOver ? 'border-orange-20 bg-accent-15' :
 file ? 'border-green-30 bg-green-2' :
 'border-white-10 bg-white-2'}`}
 style={{ flex: '1.2', minHeight: 350 }}
 onDragOver={handleDragOver}
 onDragLeave={handleDragLeave}
 onDrop={handleDrop}
 onClick={() => !file && fileInputRef.current?.click()}
 >
 {uploading ? (
 <>
 <div className="text-4xl mb-3">⏳</div>
 <div className="text-primary text-sm">上传中 {progress}%</div>
 <div className="w-4/5 h-1 bg-white-6 rounded mt-4">
 <div className="neon-progress h-full rounded" style={{ width: `${progress}%` }} />
 </div>
 </>
 ) : file ? (
 <>
 <div className="text-4xl mb-3">✅</div>
 <div className="text-primary text-sm font-semibold">{file.name}</div>
 <div className="text-primary text-11 mt-1">{(file.size / 1024 / 1024).toFixed(1)} MB</div>
 <button className="text-primary text-11 mt-2 hover:text-red-400"
 onClick={(e) => { e.stopPropagation(); setFile(null); }}>× 移除</button>
 </>
 ) : (
 <>
 <div className="text-5xl mb-3.5">🎵</div>
 <div className="text-primary text-lg font-semibold">拖拽 MP3 到此处</div>
 <div className="text-primary text-xs mt-1.5">或点击下方按钮选择文件 · 最大 50MB</div>
 <div className="mt-5 px-7 py-2.5 rounded-3xl text-white text-sm font-semibold btn-neon">选择文件</div>
 </>
 )}
 <input ref={fileInputRef} type="file" accept=".mp3,audio/mpeg" className="hidden"
 onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
 </div>

 <div className="w-300 glass-panel p-5 flex flex-col">
 <label className="text-secondary text-11 uppercase tracking-wider mb-1.5">歌曲标题 *</label>
 <input className="w-full px-3 py-2.5 rounded-lg bg-white-3 border border-white-6 text-primary text-13 mb-4"
 style={{outline:'none'}}
 value={title} onChange={(e) => setTitle(e.target.value)} placeholder="输入歌曲名称..." />

 <label className="text-secondary text-11 uppercase tracking-wider mb-1.5">艺术家 *</label>
 <input className="w-full px-3 py-2.5 rounded-lg bg-white-3 border border-white-6 text-primary text-13 mb-4"
 style={{outline:'none'}}
 value={artist} onChange={(e) => setArtist(e.target.value)} placeholder="输入艺术家..." />

 <label className="text-primary text-11 uppercase tracking-wider mb-1.5">风格 *</label>
 <div className="flex flex-wrap gap-1.5 mb-4">
 {STYLE_OPTIONS.map((s) => (
 <button key={s.value}
 className={`px-2.5 py-1 rounded-2xl text-11 transition-all cursor-pointer
 ${style === s.value ? 'bg-accent-15 border border-orange-20 text-accent font-semibold'
 : 'bg-white-4 text-secondary'}`}
 onClick={() => setStyle(s.value)}>{s.emoji} {s.label}</button>
 ))}
 </div>

 <label className="text-primary text-11 uppercase tracking-wider mb-1.5">情绪 *</label>
 <div className="flex flex-wrap gap-1.5 mb-6">
 {MOOD_OPTIONS.map((m) => (
 <button key={m.value}
 className={`px-2.5 py-1 rounded-2xl text-11 transition-all cursor-pointer
 ${mood === m.value ? 'bg-purple-15 border border-purple-20 text-purple-200 font-semibold'
 : 'bg-white-4 text-secondary'}`}
 style={mood === m.value ? {color: '#c4b5fd'} : {}}
 onClick={() => setMood(m.value)}>{m.emoji} {m.label}</button>
 ))}
 </div>

 {error && <div className="text-red-400 text-11 mb-3 text-center">{error}</div>}

 <NeonButton disabled={!canSubmit} loading={uploading} onClick={handleSubmit} className="mt-auto">
 上传歌曲
 </NeonButton>
 {!canSubmit && <div className="text-white-30 text-11 text-center mt-2">请先选择文件并填写信息</div>}
 </div>
 </div>
 </div>
 );
}
