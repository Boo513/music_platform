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
 className={`w-full py-3 rounded-xl text-center font-semibold text-sm
 transition-all duration-300 flex items-center justify-center gap-2
 ${disabled || loading
 ? 'btn-disabled'
 : 'btn-neon'
 } ${className}`}
 onClick={onClick}
 disabled={disabled || loading}
 >
 {loading && <Loader2 className="animate-spin w-4 h-4" />}
 {children}
 </button>
 );
}
