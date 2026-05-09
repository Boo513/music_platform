import { useEffect } from 'react';
import { HomeScene3D } from '@/components/scenes/HomeScene3D';
import { UIOverlay } from '@/components/home/UIOverlay';
import { useStore } from '@/stores/useStore';
import '@/styles/home.css';

export default function HomePage() {
  const setMouse = useStore((s) => s.setMouse);

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
    <div className="home-page">
      <HomeScene3D />
      <UIOverlay />
    </div>
  );
}
