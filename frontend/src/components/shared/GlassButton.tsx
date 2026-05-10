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
 bg-white-3 border border-white-6
 hover-bg-white-8 hover-border-white-15 hover-text-white
 ${className}`}
 style={{ width: size, height: size, fontSize: size * 0.4 }}
 onClick={onClick}
 >
 {children}
 </button>
 );
}
