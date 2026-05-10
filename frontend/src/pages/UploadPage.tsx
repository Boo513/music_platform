import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadStore } from '@/stores/useUploadStore';
import { songsApi } from '@/api/songs';
import { FormPanel } from '@/components/upload/FormPanel';
import { DropZone } from '@/components/upload/DropZone';
import { EcgMonitor } from '@/components/upload/EcgMonitor';
import '@/styles/upload.css';

export default function UploadPage() {
  const navigate = useNavigate();
  const {
    isUploading, uploadProgress, selectedFile, coverFile, title, artist, style, mood, error,
    startUpload, finishUpload, setProgress, setError, setCoverFile, reset,
  } = useUploadStore();

  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  const canSubmit = !!(selectedFile && title.trim() && artist.trim() && style && mood && !isUploading);
  const isDone = uploadProgress >= 1 && !isUploading;

  // 清理封面预览 URL
  useEffect(() => {
    return () => { if (coverPreview) URL.revokeObjectURL(coverPreview); };
  }, [coverPreview]);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setError('封面仅支持 JPG / PNG / WebP 格式');
      return;
    }
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverFile(file);
    setCoverPreview(URL.createObjectURL(file));
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    setError('');
    startUpload();

    const formData = new FormData();
    formData.append('audio', selectedFile!);
    formData.append('title', title.trim());
    formData.append('artist', artist.trim());
    formData.append('style', style!);
    formData.append('mood', mood!);

    songsApi
      .upload(formData, (pct) => setProgress(pct / 100))
      .then((res) => {
        if (coverFile) {
          const coverForm = new FormData();
          coverForm.append('cover', coverFile);
          songsApi.uploadCover(res.data.id, coverForm).catch(() => {});
        }
        finishUpload();
        setTimeout(() => setShowCelebration(true), 400);
      })
      .catch((err) => {
        setError(err?.response?.data?.message || '上传失败');
        finishUpload();
      });
  };

  return (
    <div className="upload-page-cyber">
      {/* Top bar */}
      <div className="up-top">
        <div className="up-hero">
          <h1>UPLOAD THE<br />SOUND</h1>
          <p className="up-subtitle">Cyberpunk Audio Injection System</p>
          <button className="up-back" onClick={() => navigate('/')}>← RETURN HOME</button>
        </div>
        <div className="up-params">
          <div>MAX SIZE: 50MB</div>
          <div>FORMAT: MP3</div>
          <div>STATUS: {isUploading ? 'UPLOADING' : isDone ? 'COMPLETE' : 'IDLE'}</div>
        </div>
      </div>

      {/* Grid layout */}
      <div className="up-grid">
        <div className="up-left">
          <FormPanel />
          <div className="up-field" style={{ marginTop: 16 }}>
            <label className="up-label">COVER IMAGE</label>
            <label className="up-cover-picker">
              {coverPreview ? (
                <img src={coverPreview} alt="封面预览" className="up-cover-preview" />
              ) : (
                <div className="up-cover-placeholder">🖼</div>
              )}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleCoverChange}
                disabled={isUploading}
                style={{ display: 'none' }}
              />
              <span className="up-cover-hint">
                {coverFile ? coverFile.name : '点击选择封面 (可选)'}
              </span>
            </label>
          </div>
        </div>
        <div className="up-right">
          <DropZone />
          <EcgMonitor />

          <button
            className={`up-submit ${isDone ? 'done' : canSubmit ? 'ready' : ''} ${isUploading ? 'uploading' : ''}`}
            onClick={handleSubmit}
            disabled={isUploading || isDone}
          >
            {isDone ? 'INJECTION COMPLETE' : isUploading ? `UPLOADING ${Math.round(uploadProgress * 100)}%` : 'INITIATE UPLOAD'}
          </button>

          {error && <div className="up-error">{error}</div>}
        </div>
      </div>

      {/* 庆祝弹窗 */}
      {showCelebration && (
        <div className="up-celebration">
          <div className="up-fireworks">
            {Array.from({ length: 30 }).map((_, i) => {
              const angle = (i / 30) * 360;
              const dist = 120 + Math.random() * 160;
              const x = Math.cos((angle * Math.PI) / 180) * dist;
              const y = Math.sin((angle * Math.PI) / 180) * dist;
              const colors = ['#ff0000', '#ffdd00', '#00ffff', '#ff69b4', '#00ff9d', '#ff6600', '#bc13fe', '#fff'];
              const color = colors[i % colors.length];
              const delay = Math.random() * 0.4;
              const size = 4 + Math.random() * 10;
              return (
                <span
                  key={i}
                  className="up-particle"
                  style={{
                    '--x': `${x}px`,
                    '--y': `${y}px`,
                    '--color': color,
                    '--delay': `${delay}s`,
                    '--size': `${size}px`,
                    animationDelay: `${delay}s`,
                  } as React.CSSProperties}
                />
              );
            })}
          </div>
          <div className="up-celebration-card">
            <div className="up-celebration-icon">🎉</div>
            <div className="up-celebration-title">上传成功!</div>
            <div className="up-celebration-sub">你的音乐已注入系统</div>
            <button
              className="up-celebration-btn"
              onClick={() => { reset(); setCoverPreview(null); setShowCelebration(false); navigate('/'); }}
            >
              返回首页
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
