import type { ReactNode } from 'react';
import { GlassButton } from '@/components/shared/GlassButton';

interface TopIconsProps {
  isFavorited: boolean;
  onToggleFavorite: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export function TopIcons({ isFavorited, onToggleFavorite, onOpenSettings, onToggleMute, isMuted }: TopIconsProps) {
  return (
    <div className="fixed top-7 left-7 z-10 flex gap-2.5">
      <GlassButton onClick={onToggleMute}>{isMuted ? '🔇' : '🔊' as ReactNode}</GlassButton>
      <GlassButton onClick={onToggleFavorite}>{isFavorited ? '❤️' : '♡' as ReactNode}</GlassButton>
      <GlassButton onClick={onOpenSettings}>{'⚙' as ReactNode}</GlassButton>
    </div>
  );
}
