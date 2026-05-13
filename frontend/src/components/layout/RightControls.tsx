interface RightControlsProps {
  onTogglePanel: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
  onToggleQueue: () => void;
  queueOpen: boolean;
}

export function RightControls({ onTogglePanel, onZoomIn, onZoomOut, onToggleFullscreen, onToggleQueue, queueOpen }: RightControlsProps) {
  const btn = (text: string, onClick: () => void, active?: boolean) => (
    <button
      className="w-34 h-34 rounded-full flex items-center justify-center cursor-pointer
        transition-all duration-300 text-sm border-0"
      style={{ background: active ? '#ff8c42' : '#f0e6e0', color: active ? '#fff' : '#1a1428', fontSize: 14 }}
      onClick={onClick}
    >{text}</button>
  );

  return (
    <div className="fixed right-18 top-50 translate-y-50 z-10 flex flex-col gap-2">
      {btn('□', onTogglePanel)}
      {btn('+', onZoomIn)}
      {btn('−', onZoomOut)}
      {btn('⛶', onToggleFullscreen)}
      {btn('📋', onToggleQueue, queueOpen)}
    </div>
  );
}
