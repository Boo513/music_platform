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
          ? 'bg-[rgba(255,140,66,0.15)] border border-[rgba(255,179,102,0.2)] text-[#FFB366] font-semibold'
          : 'bg-[rgba(255,255,255,0.04)] text-[#a09080] hover:bg-[rgba(255,255,255,0.06)]'}`}
      onClick={onClick}
    >
      {emoji} {label}
    </button>
  );
}
