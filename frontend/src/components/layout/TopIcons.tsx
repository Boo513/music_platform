import type { ReactNode } from 'react';
import { GlassButton } from '@/components/shared/GlassButton';

interface TopIconsProps {
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onOpenSettings: () => void;
  onToggleMute: () => void;
  isMuted: boolean;
}

export function TopIcons({ autoRotate, onToggleAutoRotate, onOpenSettings, onToggleMute, isMuted }: TopIconsProps) {
  return (
    <div className="fixed top-7 left-7 z-10 flex gap-2.5">
      <GlassButton onClick={onToggleAutoRotate} title={autoRotate ? '关闭自动旋转' : '开启自动旋转'}>
        {autoRotate ? '📷' : '📷' as ReactNode}
      </GlassButton>
      <GlassButton onClick={onToggleMute}>{isMuted ? '🔇' : '🔊' as ReactNode}</GlassButton>
      <GlassButton onClick={onOpenSettings}>{'⚙' as ReactNode}</GlassButton>
    </div>
  );
}
