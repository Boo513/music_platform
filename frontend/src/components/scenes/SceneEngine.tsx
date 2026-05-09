import type { StyleType, MoodType } from '@/types';
import { CityScene } from './CityScene';

interface Props {
 style: StyleType | null;
 mood: MoodType | null;
 lockedScene?: string | null;
}

export function SceneEngine({ style, mood, lockedScene }: Props) {
 return <CityScene />;
}
