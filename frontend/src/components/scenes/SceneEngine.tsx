import type { StyleType, MoodType } from '@/types';

const sceneMap: Record<string, Record<string, string>> = {
 rock: { happy: 'galaxy', sad: 'galaxy', calm: 'galaxy', excited: 'galaxy', romantic: 'galaxy', melancholy: 'galaxy' },
 pop: { happy: 'galaxy', sad: 'galaxy', calm: 'galaxy', excited: 'galaxy', romantic: 'galaxy', melancholy: 'galaxy' },
 classical: { happy: 'galaxy', sad: 'galaxy', calm: 'galaxy', excited: 'galaxy', romantic: 'galaxy', melancholy: 'galaxy' },
 electronic: { happy: 'galaxy', sad: 'galaxy', calm: 'galaxy', excited: 'galaxy', romantic: 'galaxy', melancholy: 'galaxy' },
 folk: { happy: 'galaxy', sad: 'galaxy', calm: 'galaxy', excited: 'galaxy', romantic: 'galaxy', melancholy: 'galaxy' },
 jazz: { happy: 'galaxy', sad: 'galaxy', calm: 'galaxy', excited: 'galaxy', romantic: 'galaxy', melancholy: 'galaxy' },
 hiphop: { happy: 'galaxy', sad: 'galaxy', calm: 'galaxy', excited: 'galaxy', romantic: 'galaxy', melancholy: 'galaxy' },
 rnb: { happy: 'galaxy', sad: 'galaxy', calm: 'galaxy', excited: 'galaxy', romantic: 'galaxy', melancholy: 'galaxy' },
};

interface Props {
 style: StyleType | null;
 mood: MoodType | null;
 lockedScene?: string | null;
}

export function SceneEngine({ style, mood, lockedScene }: Props) {
 const sceneKey = lockedScene && lockedScene !== 'auto'
 ? lockedScene
 : (style && mood ? (sceneMap[style]?.[mood] ?? 'galaxy') : 'galaxy');

 // For now, render a simple starfield placeholder
 // Full 3D scenes will be added in Task 17-20
 return null;
}
