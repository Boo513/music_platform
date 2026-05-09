import { useEffect } from 'react';
import { Scene3D } from '@/components/scenes/Scene3D';
import { LoginForm } from '@/components/auth/LoginForm';
import { PlayerBarRomantic } from '@/components/layout/PlayerBarRomantic';
import { useMouseStore } from '@/stores/useMouseStore';
import '@/styles/login.css';

export default function LoginPage() {
  const setMouse = useMouseStore((s) => s.setMouse);

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      setMouse(
        (e.clientX / window.innerWidth) * 2 - 1,
        -(e.clientY / window.innerHeight) * 2 + 1
      );
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, [setMouse]);

  return (
    <div className="login-page">
      <Scene3D />
      <div className="login-overlay">
        <div className="hero-text">
          <h1 className="hero-title">HEAR THE<br />LOVE</h1>
          <p className="hero-subtitle">Romance TOP 100 | In Universe</p>
          <span className="hero-live">LIVE</span>
        </div>
        <LoginForm />
        <PlayerBarRomantic />
      </div>
    </div>
  );
}
