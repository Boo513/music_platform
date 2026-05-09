import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeonButton } from '@/components/shared/NeonButton';
import { GlassInput } from '@/components/shared/GlassInput';
import { useAuthStore } from '@/stores/authStore';

export default function LoginPage() {
 const navigate = useNavigate();
 const { login, register } = useAuthStore();
 const [isRegister, setIsRegister] = useState(false);
 const [flipping, setFlipping] = useState(false);
 const [username, setUsername] = useState('');
 const [password, setPassword] = useState('');
 const [nickname, setNickname] = useState('');
 const [error, setError] = useState('');
 const [loading, setLoading] = useState(false);

 const toggleMode = () => {
 setFlipping(true);
 setTimeout(() => { setIsRegister(!isRegister); setFlipping(false); setError(''); }, 300);
 };

 const handleSubmit = async () => {
 setError('');
 if (!username.trim() || !password.trim()) { setError('请填写所有必填字段'); return; }
 if (username.length < 3) { setError('用户名至少3个字符'); return; }
 if (password.length < 6) { setError('密码至少6个字符'); return; }
 setLoading(true);
 try {
 if (isRegister) {
 await register(username, password, nickname || undefined);
 toggleMode();
 } else {
 await login(username, password);
 navigate('/', { replace: true });
 }
 } catch (err: any) {
 setError(err?.response?.data?.message || '操作失败，请重试');
 } finally {
 setLoading(false);
 }
 };

 return (
 <div className="flex items-center justify-center min-h-screen relative overflow-hidden"
 style={{ background: 'linear-gradient(160deg, #0a0a14 0%, #1a1040 40%, #0d1020 70%, #141830 100%)' }}>
 <div className="fixed top-6 left-7 z-10 text-sm font-semibold tracking-wider" style={{ color: 'rgba(255,255,255,0.3)' }}>
 SOUNDSCAPE
 </div>
 <div className="z-10">
 <div style={{
 perspective: 1000, transformStyle: 'preserve-3d',
 transition: 'transform 0.6s ease-in-out',
 transform: flipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
 }}>
 <div className="glass-panel" style={{ width: 380, padding: 36, backfaceVisibility: 'hidden' }}>
 <div className="text-center" style={{ marginBottom: 28 }}>
 <div className="text-4xl mb-3">{isRegister ? '✨' : '🌌'}</div>
 <div style={{ fontSize: 22, fontWeight: 700, color: '#f0e6e0', marginBottom: 4 }}>
 {isRegister ? '创建账号' : '欢迎回来'}
 </div>
 <div className="text-xs" style={{ color: '#a09080' }}>
 {isRegister ? '开启你的音乐之旅' : '登录你的音乐世界'}
 </div>
 </div>

 {error && (
 <div className="text-xs text-center rounded-lg px-4 py-2.5 mb-4"
 style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
 {error}
 </div>
 )}

 <GlassInput icon="👤" placeholder="用户名" value={username} onChange={setUsername} />
 {isRegister && <GlassInput icon="✏️" placeholder="昵称（选填）" value={nickname} onChange={setNickname} />}
 <GlassInput icon="🔒" placeholder="密码" type="password" value={password} onChange={setPassword}
 onKeyDown={(e) => e.key === 'Enter' && handleSubmit()} />

 <NeonButton loading={loading} onClick={handleSubmit}>
 {isRegister ? '注 册' : '登 录'}
 </NeonButton>

 <div className="text-center text-xs mt-5" style={{ color: '#a09080' }}>
 {isRegister ? '已有账号？' : '还没有账号？'}
 <span className="font-semibold cursor-pointer ml-1" style={{ color: '#FFB366' }} onClick={toggleMode}>
 {isRegister ? '返回登录' : '立即注册'}
 </span>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
