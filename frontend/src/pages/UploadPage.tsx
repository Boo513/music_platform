import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { songsApi } from '@/api/songs';
import { STYLE_OPTIONS, MOOD_OPTIONS, type StyleType, type MoodType } from '@/types';

export default function UploadPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [style, setStyle] = useState<StyleType | null>(null);
  const [mood, setMood] = useState<MoodType | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [error, setError] = useState('');

  const canSubmit = !!(file && title.trim() && artist.trim() && style && mood && !uploading);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.mp3')) { setError('仅支持 MP3 格式'); return; }
    if (f.size > 50 * 1024 * 1024) { setError('文件不能超过 50MB'); return; }
    setFile(f); setError('');
  };

  const handleSubmit = async () => {
    if (!canSubmit || !file || !style || !mood) return;
    setUploading(true); setError('');
    const fd = new FormData();
    fd.append('title', title.trim());
    fd.append('artist', artist.trim());
    fd.append('style', style);
    fd.append('mood', mood);
    fd.append('audio', file);
    try {
      const res = await songsApi.upload(fd, setProgress);
      setTimeout(() => navigate(`/play/${res.data.id}`, { replace: true }), 1500);
    } catch (err: any) {
      setError(err?.response?.data?.message || '上传失败');
      setUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a0a18 0%, #0d1025 50%, #111835 100%)',
      paddingBottom: 80,
      color: '#f0e6e0',
      fontFamily: "'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif",
    }}>
      {/* Top bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 24px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <button
          onClick={() => navigate('/')}
          style={{ background: 'none', border: 'none', color: '#a09080', fontSize: 18, cursor: 'pointer' }}
        >←</button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>上传音乐</span>
      </div>

      <div style={{ display: 'flex', gap: 20, padding: 24, alignItems: 'stretch' }}>
        {/* Drag zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !file && fileInputRef.current?.click()}
          style={{
            flex: 1.2,
            minHeight: 350,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            border: `2px dashed ${dragOver ? 'rgba(255,179,102,0.6)' : file ? 'rgba(0,199,88,0.3)' : 'rgba(255,255,255,0.1)'}`,
            borderRadius: 16,
            background: dragOver ? 'rgba(255,140,66,0.05)' : file ? 'rgba(0,199,88,0.02)' : 'rgba(255,255,255,0.02)',
            cursor: file && !uploading ? 'default' : 'pointer',
            transition: 'all 0.2s',
          }}
        >
          {uploading ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>⏳</div>
              <div style={{ fontSize: 14 }}>上传中 {progress}%</div>
              <div style={{ width: '80%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, marginTop: 16 }}>
                <div className="neon-progress" style={{ height: '100%', borderRadius: 2, width: `${progress}%` }} />
              </div>
            </>
          ) : file ? (
            <>
              <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>{file.name}</div>
              <div style={{ fontSize: 11, color: '#a09080', marginTop: 4 }}>
                {(file.size / 1024 / 1024).toFixed(1)} MB
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
                style={{ background: 'none', border: 'none', color: '#a09080', fontSize: 11, marginTop: 8, cursor: 'pointer' }}
              >× 移除</button>
            </>
          ) : (
            <>
              <div style={{ fontSize: 48, marginBottom: 14 }}>🎵</div>
              <div style={{ fontSize: 18, fontWeight: 600 }}>拖拽 MP3 到此处</div>
              <div style={{ fontSize: 12, color: '#a09080', marginTop: 6 }}>或点击下方按钮选择文件 · 最大 50MB</div>
              <button
                onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                style={{
                  marginTop: 20, padding: '10px 28px', borderRadius: 24,
                  background: 'linear-gradient(135deg, #FF8C42, #FFB366)',
                  border: 'none', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                }}
              >选择文件</button>
            </>
          )}
          <input ref={fileInputRef} type="file" accept=".mp3,audio/mpeg" style={{ display: 'none' }}
            onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
        </div>

        {/* Right form */}
        <div style={{
          width: 300,
          background: 'rgba(18,14,24,0.55)',
          backdropFilter: 'blur(28px)',
          border: '1px solid rgba(255,180,130,0.1)',
          borderRadius: 20,
          padding: 24,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <label style={{ color: '#a09080', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            歌曲标题 *
          </label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="输入歌曲名称..."
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              color: '#f0e6e0', fontSize: 13, outline: 'none', marginBottom: 16, boxSizing: 'border-box',
            }}
          />

          <label style={{ color: '#a09080', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            艺术家 *
          </label>
          <input
            value={artist}
            onChange={(e) => setArtist(e.target.value)}
            placeholder="输入艺术家..."
            style={{
              width: '100%', padding: '10px 12px', borderRadius: 8,
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
              color: '#f0e6e0', fontSize: 13, outline: 'none', marginBottom: 16, boxSizing: 'border-box',
            }}
          />

          <label style={{ color: '#a09080', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            风格 *
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {STYLE_OPTIONS.map((s) => (
              <button
                key={s.value}
                onClick={() => setStyle(s.value)}
                style={{
                  padding: '5px 12px', borderRadius: 14, fontSize: 11, cursor: 'pointer',
                  background: style === s.value ? 'rgba(255,140,66,0.15)' : 'rgba(255,255,255,0.04)',
                  border: style === s.value ? '1px solid rgba(255,179,102,0.2)' : '1px solid transparent',
                  color: style === s.value ? '#FFB366' : '#a09080',
                  fontWeight: style === s.value ? 600 : 400,
                }}
              >{s.emoji} {s.label}</button>
            ))}
          </div>

          <label style={{ color: '#a09080', fontSize: 11, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
            情绪 *
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 20 }}>
            {MOOD_OPTIONS.map((m) => (
              <button
                key={m.value}
                onClick={() => setMood(m.value)}
                style={{
                  padding: '5px 12px', borderRadius: 14, fontSize: 11, cursor: 'pointer',
                  background: mood === m.value ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.04)',
                  border: mood === m.value ? '1px solid rgba(167,139,250,0.2)' : '1px solid transparent',
                  color: mood === m.value ? '#c4b5fd' : '#a09080',
                  fontWeight: mood === m.value ? 600 : 400,
                }}
              >{m.emoji} {m.label}</button>
            ))}
          </div>

          {error && (
            <div style={{ color: '#f87171', fontSize: 11, textAlign: 'center', marginBottom: 12 }}>{error}</div>
          )}

          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            style={{
              width: '100%', padding: 13, borderRadius: 10, border: 'none',
              fontSize: 14, fontWeight: 600, cursor: canSubmit ? 'pointer' : 'not-allowed',
              background: canSubmit
                ? 'linear-gradient(135deg, #FF8C42, #FFB366)'
                : 'rgba(255,255,255,0.04)',
              color: canSubmit ? '#fff' : '#a09080',
              marginTop: 'auto',
            }}
          >
            {uploading ? '上传中...' : '上传歌曲'}
          </button>

          {!canSubmit && !uploading && (
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 11, textAlign: 'center', marginTop: 8 }}>
              请先选择文件并填写信息
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
