import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Canvas } from '@react-three/fiber';
import { usePlayerStore } from '@/stores/playerStore';
import { songsApi } from '@/api/songs';
import { favoritesApi } from '@/api/favorites';
import { TopIcons } from '@/components/layout/TopIcons';
import { RightControls } from '@/components/layout/RightControls';
import { RadioPanel } from '@/components/layout/RadioPanel';
import { SettingsPanel } from '@/components/settings/SettingsPanel';
import { SceneEngine } from '@/components/scenes/SceneEngine';

export default function PlayPage() {
  const { songId } = useParams<{ songId: string }>();
  const navigate = useNavigate();
  const { currentSong, isPlaying, play, pause, resume } = usePlayerStore();
  const song = currentSong();

  const [showPanel, setShowPanel] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [selectedScene, setSelectedScene] = useState('auto');
  const [effects, setEffects] = useState({ particles: true, bloom: false, vignette: true });

  useEffect(() => {
    if (songId) {
      songsApi.getById(Number(songId)).then((res) => {
        play(res.data);
      }).catch(() => navigate('/'));
    }
  }, [songId]);

  useEffect(() => {
    if (song) favoritesApi.check(song.id).then((res) => setIsFavorited(res.data.favorited)).catch(() => {});
  }, [song?.id]);

  const handleToggleFavorite = async () => {
    if (!song) return;
    try {
      if (isFavorited) { await favoritesApi.remove(song.id); setIsFavorited(false); }
      else { await favoritesApi.add(song.id); setIsFavorited(true); }
    } catch {}
  };

  if (!song) return <div className="flex items-center justify-center h-screen text-[#a09080]">加载中...</div>;

  return (
    <div className="fixed inset-0 bg-[#0d0f18]">
      {/* 3D scene layer */}
      <div className="absolute inset-0 z-0">
        <Canvas camera={{ position: [0, -5, 20], fov: 60 }}>
          <SceneEngine
            style={song.style}
            mood={song.mood}
            lockedScene={selectedScene !== 'auto' ? selectedScene : null}
          />
          <fog attach="fog" args={['#0d0f18', 50, 200]} />
        </Canvas>
      </div>

      {/* UI overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <TopIcons
            isFavorited={isFavorited}
            onToggleFavorite={handleToggleFavorite}
            onOpenSettings={() => setShowSettings(true)}
            isMuted={isMuted}
            onToggleMute={() => setIsMuted(!isMuted)}
          />

          <RightControls
            onTogglePanel={() => setShowPanel(!showPanel)}
            onZoomIn={() => {}}
            onZoomOut={() => {}}
            onToggleFullscreen={() => {
              if (document.fullscreenElement) document.exitFullscreen();
              else document.body.requestFullscreen();
            }}
          />

          {showPanel && (
            <RadioPanel
              song={song}
              isPlaying={isPlaying}
              onTogglePlay={() => isPlaying ? pause() : resume()}
              onClose={() => setShowPanel(false)}
            />
          )}
        </div>

        {/* Vignette */}
        <div className="absolute inset-0 vignette pointer-events-none" />
      </div>

      <SettingsPanel
        open={showSettings} onClose={() => setShowSettings(false)}
        selectedScene={selectedScene} onSelectScene={setSelectedScene}
        effects={effects}
        onToggleEffect={(key) => setEffects((prev) => ({ ...prev, [key]: !prev[key] }))}
      />

      {/* Brand text */}
      <div className="fixed top-[30px] right-[90px] z-10 text-[13px] font-semibold tracking-[1.5px] text-white/[0.3]">
        HEAR THE 🌍
      </div>
    </div>
  );
}
