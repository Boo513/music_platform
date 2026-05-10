import type { KeyboardEvent as ReactKeyboardEvent } from 'react';
import { useState } from 'react';

interface GlassInputProps {
 icon?: string;
 placeholder: string;
 type?: string;
 value: string;
 onChange: (v: string) => void;
 error?: string;
 onBlur?: () => void;
 onKeyDown?: (e: ReactKeyboardEvent) => void;
}

export function GlassInput({ icon, placeholder, type = 'text', value, onChange, error, onBlur, onKeyDown }: GlassInputProps) {
 const [focused, setFocused] = useState(false);

 return (
 <div className="mb-3">
 <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200 input-glass
 ${error ? 'error' : ''}`}>
 {icon && <span className="opacity-40 text-base">{icon}</span>}
 <input
 type={type}
 placeholder={placeholder}
 value={value}
 onChange={(e) => onChange(e.target.value)}
 onFocus={() => setFocused(true)}
 onBlur={() => { setFocused(false); onBlur?.(); }}
 onKeyDown={onKeyDown}
 className="text-13 w-full"
 style={{ background: 'transparent', border: 'none', outline: 'none', color: '#f0e6e0' }}
 />
 </div>
 {error && <p className="text-red-400 text-11 mt-1 ml-1">{error}</p>}
 </div>
 );
}
