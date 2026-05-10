interface TagChipProps {
 emoji?: string;
 label: string;
 selected: boolean;
 onClick: () => void;
}

export function TagChip({ emoji, label, selected, onClick }: TagChipProps) {
 return (
 <button
 className={`px-3 py-1.5 rounded-2xl text-11 whitespace-nowrap transition-all duration-200
 ${selected
 ? 'bg-accent-15 border border-orange-20 font-semibold'
 : 'bg-white-4 hover-bg-white-6'}`}
 onClick={onClick}
 >
 {emoji} {label}
 </button>
 );
}
