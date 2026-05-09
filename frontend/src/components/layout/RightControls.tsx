interface RightControlsProps {
 onTogglePanel: () => void;
 onZoomIn: () => void;
 onZoomOut: () => void;
 onToggleFullscreen: () => void;
}

export function RightControls({ onTogglePanel, onZoomIn, onZoomOut, onToggleFullscreen }: RightControlsProps) {
 const btn = (text: string, onClick: () => void) => (
 <button
 className="w-34 h-34 rounded-full flex items-center justify-center cursor-pointer
 transition-all duration-300 text-sm border-0"
 style={{ background: '#f0e6e0', color: '#1a1428', fontSize: 14 }}
 onClick={onClick}
 >{text}</button>
 );

 return (
 <div className="fixed right-18 top-50 translate-y-50 z-10 flex flex-col gap-2">
 {btn('□', onTogglePanel)}
 {btn('+', onZoomIn)}
 {btn('−', onZoomOut)}
 {btn('⛶', onToggleFullscreen)}
 </div>
 );
}
