import type { ReactNode } from 'react';

interface GlassButtonProps {
  children: ReactNode;
  size?: number;
  onClick?: () => void;
  className?: string;
}

export function GlassButton({ children, size = 40, onClick, className = '' }: GlassButtonProps) {
  return (
    <button
      className={`rounded-full flex items-center justify-center cursor-pointer transition-all duration-300
        bg-[rgba(255,255,255,0.03)] backdrop-blur-[14px] border border-[rgba(255,255,255,0.06)]
        hover:bg-[rgba(255,255,255,0.08)] hover:border-[rgba(255,255,255,0.15)] hover:text-[#ffe0c8]
        hover:shadow-[0_0_20px_rgba(255,140,66,0.1)] text-[#b0a090] ${className}`}
      style={{ width: size, height: size, fontSize: size * 0.4 }}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
