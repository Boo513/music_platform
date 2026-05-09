import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { NeonButton } from '@/components/shared/NeonButton';
import { GlassInput } from '@/components/shared/GlassInput';
import { useAuthStore } from '@/stores/authStore';
import { LoginBackground } from '@/components/scenes/LoginBackground';

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
    <div className="h-screen relative overflow-hidden">
      <LoginBackground />

      <div className="fixed top-6 left-7 z-10 text-[13px] font-semibold tracking-[1.5px] text-white/30">
        SOUNDSCAPE
      </div>

      <div className="absolute inset-0 flex items-center justify-center z-10">
        <div className="perspective-1000" style={{
          transformStyle: 'preserve-3d',
          transition: 'transform 0.6s ease-in-out',
          transform: flipping ? 'rotateY(180deg)' : 'rotateY(0deg)',
        }}>
          <div className="glass-panel w-[380px] p-9" style={{ backfaceVisibility: 'hidden' }}>
            <div className="text-center mb-7">
              <div className="text-4xl mb-2.5">{isRegister ? '✨' : '🌌'}</div>
              <div className="text-[22px] font-bold text-[#f0e6e0]">{isRegister ? '创建账号' : '欢迎回来'}</div>
              <div className="text-xs text-[#a09080] mt-1">{isRegister ? '开启你的音乐之旅' : '登录你的音乐世界'}</div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5 mb-4 text-red-400 text-xs text-center">
                {error}
              </div>
            )}

            <GlassInput icon="👤" placeholder="用户名" value={username} onChange={setUsername} />
            {isRegister && <GlassInput icon="✏️" placeholder="昵称（选填）" value={nickname} onChange={setNickname} />}
            <GlassInput icon="🔒" placeholder="密码" type="password" value={password} onChange={setPassword}
              onKeyDown={(e: React.KeyboardEvent) => e.key === 'Enter' && handleSubmit()} />

            <NeonButton loading={loading} onClick={handleSubmit} className="mt-2">
              {isRegister ? '注 册' : '登 录'}
            </NeonButton>

            <div className="text-center text-xs text-[#a09080] mt-5">
              {isRegister ? '已有账号？' : '还没有账号？'}
              <span className="text-[#FFB366] cursor-pointer font-semibold ml-1" onClick={toggleMode}>
                {isRegister ? '返回登录' : '立即注册'}
              </span>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .perspective-1000 { perspective: 1000px; }
      `}</style>
    </div>
  );
}
