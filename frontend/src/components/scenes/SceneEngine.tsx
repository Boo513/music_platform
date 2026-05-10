import type { StyleType, MoodType } from '@/types';
import { CityScene } from './CityScene';
import { StarryGalaxy } from './StarryGalaxy';
import { RomanticShape } from './RomanticShape';
import { ParticleTunnel } from './ParticleTunnel';

interface Props {
  style: StyleType | null;
  mood: MoodType | null;
  lockedScene?: string | null;
}

function resolveScene(style: StyleType | null, mood: MoodType | null, lockedScene?: string | null) {
  if (lockedScene && lockedScene !== 'auto') {
    switch (lockedScene) {
      case 'cyberpunk': return CityScene;
      case 'galaxy': return StarryGalaxy;
      case 'spring': return CityScene;
      case 'beach': return CityScene;
      case 'rain': return CityScene;
      case 'mountain': return StarryGalaxy;
      default: return CityScene;
    }
  }

  if (!style || !mood) return CityScene;

  // Map style + mood to scene
  if (style === 'classical' || mood === 'calm') return StarryGalaxy;
  if (mood === 'romantic' || mood === 'melancholy' || style === 'jazz') return RomanticShape;
  if (mood === 'excited' || mood === 'happy') return ParticleTunnel;
  return CityScene;
}

export function SceneEngine({ style, mood, lockedScene }: Props) {
  const Scene = resolveScene(style, mood, lockedScene);
  return <Scene />;
}
