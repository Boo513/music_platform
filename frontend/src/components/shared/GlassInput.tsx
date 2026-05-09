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
      <div className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl transition-all duration-200
        bg-white/3 border ${error ? 'border-red-500/50' : focused ? 'border-[#FFB366]/30' : 'border-white/6'}`}>
        {icon && <span className="opacity-40 text-base">{icon}</span>}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => { setFocused(false); onBlur?.(); }}
          onKeyDown={onKeyDown}
          className="bg-transparent border-none outline-none text-[#f0e6e0] text-[13px] w-full
            placeholder-[#a09080]"
        />
      </div>
      {error && <p className="text-red-400 text-[11px] mt-1 ml-1">{error}</p>}
    </div>
  );
}
