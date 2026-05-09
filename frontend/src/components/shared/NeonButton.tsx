import type { ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

interface NeonButtonProps {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

export function NeonButton({ children, onClick, disabled, loading, className = '' }: NeonButtonProps) {
  return (
    <button
      className={`w-full py-3 rounded-xl text-center text-white font-semibold text-sm
        transition-all duration-300 flex items-center justify-center gap-2
        ${disabled || loading
          ? 'bg-white/4 text-[#a09080] cursor-not-allowed'
          : 'bg-gradient-to-r from-[#FF8C42] to-[#FFB366] shadow-[0_4px_24px_rgba(255,140,66,0.25)] hover:shadow-[0_8px_32px_rgba(255,140,66,0.4)] active:scale-[0.98]'
        } ${className}`}
      onClick={onClick}
      disabled={disabled || loading}
    >
      {loading && <Loader2 className="animate-spin w-4 h-4" />}
      {children}
    </button>
  );
}
