interface EmptyStateProps {
  emoji: string;
  title: string;
  action?: { label: string; onClick: () => void };
}

export function EmptyState({ emoji, title, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="text-5xl mb-4 opacity-60">{emoji}</div>
      <div className="text-[#a09080] text-sm mb-4">{title}</div>
      {action && (
        <button
          className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#FF8C42] to-[#FFB366] text-white text-sm font-semibold"
          onClick={action.onClick}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
