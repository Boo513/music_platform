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
 transition-all duration-300 text-sm
 bg-dark-40 border border-white-6
 hover:bg-dark-55h hover:border-white-15 hover-text-white"
 onClick={onClick}
 >{text}</button>
 );

 return (
 <div className="fixed right-18 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
 {btn('□', onTogglePanel)}
 {btn('+', onZoomIn)}
 {btn('−', onZoomOut)}
 {btn('⛶', onToggleFullscreen)}
 </div>
 );
}
