import { usePlayerStore } from '@/stores/playerStore';

interface QueuePanelProps {
  onClose: () => void;
}

export function QueuePanel({ onClose }: QueuePanelProps) {
  const { queue, currentIndex, play } = usePlayerStore();

  return (
    <div
      style={{
        position: 'fixed',
        right: 100,
        bottom: 24,
        zIndex: 20,
        width: 280,
        maxHeight: 360,
        borderRadius: 16,
        overflow: 'hidden',
        background: 'rgba(18,14,24,0.95)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 8px 40px rgba(0,0,0,0.5)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>播放队列</span>
        <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>{queue.length} 首</span>
        <button
          onClick={onClose}
          style={{
            width: 24, height: 24, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, cursor: 'pointer',
            background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', border: 'none',
          }}
        >
          ×
        </button>
      </div>
      <div style={{ overflowY: 'auto', maxHeight: 300 }}>
        {queue.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', fontSize: 12, color: 'rgba(255,255,255,0.25)' }}>
            队列为空
          </div>
        ) : (
          queue.map((song, i) => (
            <div
              key={`${song.id}-${i}`}
              onClick={() => { if (i !== currentIndex) play(song, queue); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 16px',
                cursor: i === currentIndex ? 'default' : 'pointer',
                background: i === currentIndex ? 'rgba(255,140,66,0.12)' : 'transparent',
                borderLeft: i === currentIndex ? '3px solid #ff8c42' : '3px solid transparent',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                if (i !== currentIndex) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
              }}
              onMouseLeave={(e) => {
                if (i !== currentIndex) e.currentTarget.style.background = 'transparent';
              }}
            >
              <span style={{
                fontSize: 12, width: 20, textAlign: 'center',
                color: i === currentIndex ? '#ff8c42' : 'rgba(255,255,255,0.25)',
              }}>
                {i === currentIndex ? '▶' : i + 1}
              </span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: i === currentIndex ? '#ff8c42' : 'rgba(255,255,255,0.75)',
                }}>
                  {song.title}
                </div>
                <div style={{
                  fontSize: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                  color: 'rgba(255,255,255,0.3)',
                }}>
                  {song.artist}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
