interface TagChipProps {
  emoji?: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}

export function TagChip({ emoji, label, selected, onClick }: TagChipProps) {
  return (
    <button
      className={`px-3 py-1.5 rounded-2xl text-[11px] whitespace-nowrap transition-all duration-200
        ${selected
          ? 'bg-[#FF8C42]/15 border border-[#FFB366]/20 text-[#FFB366] font-semibold'
          : 'bg-white/4 text-[#a09080] hover:bg-white/6'}`}
      onClick={onClick}
    >
      {emoji} {label}
    </button>
  );
}
