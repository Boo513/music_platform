interface RightControlsProps {
  onTogglePanel: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onToggleFullscreen: () => void;
}

export function RightControls({ onTogglePanel, onZoomIn, onZoomOut, onToggleFullscreen }: RightControlsProps) {
  const btn = (text: string, onClick: () => void) => (
    <button
      className="w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer
        transition-all duration-300 text-[#908070] text-sm
        bg-[rgba(20,16,28,0.4)] backdrop-blur-[10px] border border-white/6
        hover:bg-[rgba(40,30,50,0.55)] hover:border-white/15 hover:text-[#ffe0c8]"
      onClick={onClick}
    >{text}</button>
  );

  return (
    <div className="fixed right-[18px] top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
      {btn('□', onTogglePanel)}
      {btn('+', onZoomIn)}
      {btn('−', onZoomOut)}
      {btn('⛶', onToggleFullscreen)}
    </div>
  );
}
