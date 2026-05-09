import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi } from '@/api/songs';
import { TopIcons } from '@/components/layout/TopIcons';
import { RightControls } from '@/components/layout/RightControls';
import { RadioPanel } from '@/components/layout/RadioPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import type { Song } from '@/types';

const DEMO_SONG: Song = {
  id: 0, title: 'India TOP 100', artist: 'Cheema Y, Gur Sidhu & Jasmeen Akhtar',
  coverUrl: null, duration: 222, style: 'electronic', mood: 'excited', playCount: 12801,
  isFavorited: false, uploader: { id: 1, nickname: 'Demo' }, createdAt: new Date().toISOString(),
};

function Scene3D() {
  return (
    <>
      <color attach="background" args={['#0a0a18']} />
      <Stars radius={150} depth={80} count={600} factor={4} saturation={0.2} fade speed={0.3} />
      <ambientLight intensity={0.5} color="#3a3060" />
      <pointLight position={[30, 20, -40]} intensity={2} color="#FF8C42" distance={200} />
    </>
  );
}

export default function PlayPage() {
  const { songId } = useParams<{ songId: string }>();
  const { isPlaying, pause, resume } = usePlayerStore();
  const [demoSong, setDemoSong] = useState<Song | null>(null);

  useEffect(() => {
    if (songId) {
      songsApi.getById(Number(songId)).then(() => {}).catch(() => setDemoSong(DEMO_SONG));
    }
  }, [songId]);

  const song = demoSong;
  if (!song) return <div className="flex items-center justify-center h-screen text-secondary text-sm">加载中...</div>;

  return (
    <div className="fixed inset-0" style={{ background: '#0a0a18' }}>
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, 5, 50], fov: 60 }}>
          <Scene3D />
        </Canvas>
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <TopIcons
            isFavorited={false}
            onToggleFavorite={() => {}}
            onOpenSettings={() => {}}
            isMuted={false}
            onToggleMute={() => {}}
          />
          <RightControls
            onTogglePanel={() => {}}
            onZoomIn={() => {}}
            onZoomOut={() => {}}
            onToggleFullscreen={() => {}}
          />
          <RadioPanel
            song={song}
            isPlaying={isPlaying}
            onTogglePlay={() => isPlaying ? pause() : resume()}
            onClose={() => {}}
          />
        </div>
        <div className="absolute inset-0 vignette pointer-events-none" />
      </div>

      <SettingsPanel
        open={false} onClose={() => {}}
        selectedScene="auto" onSelectScene={() => {}}
        effects={{ particles: true, bloom: false, vignette: true }}
        onToggleEffect={() => {}}
      />

      <div className="fixed top-30 right-90 z-10 text-13 font-semibold tracking-wider text-white-30">
        HEAR THE 🌍
      </div>
    </div>
  );
}
