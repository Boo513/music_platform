import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';

export function LoginForm() {
  const navigate = useNavigate();
  const { login, register } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError('');
    if (!username.trim() || !password.trim()) { setError('请填写所有必填字段'); return; }
    setLoading(true);
    try {
      if (isRegister) {
        await register(username, password, nickname || undefined);
        setIsRegister(false);
        setError('');
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
    <div className="login-form">
      <div className="form-header">
        {isRegister ? 'CREATE ACCOUNT' : 'WELCOME BACK'}
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="input-group">
        <input
          type="text"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <span className="input-line" />
      </div>

      {isRegister && (
        <div className="input-group">
          <input
            type="text"
            placeholder="Nickname (optional)"
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <span className="input-line" />
        </div>
      )}

      <div className="input-group">
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
        />
        <span className="input-line" />
      </div>

      <p className="form-hint">关于浪漫，此时无声胜有声</p>

      <button className="submit-btn" onClick={handleSubmit} disabled={loading}>
        {loading ? '...' : isRegister ? 'SIGN UP' : 'SIGN IN'}
      </button>

      <p className="form-switch">
        {isRegister ? 'Already have an account?' : "Don't have an account?"}
        <span onClick={() => { setIsRegister(!isRegister); setError(''); }}>
          {isRegister ? ' Sign In' : ' Sign Up'}
        </span>
      </p>
    </div>
  );
}
