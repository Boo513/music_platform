import { useNavigate } from 'react-router-dom';
import { useUploadStore } from '@/stores/useUploadStore';
import { FormPanel } from '@/components/upload/FormPanel';
import { DropZone } from '@/components/upload/DropZone';
import { EcgMonitor } from '@/components/upload/EcgMonitor';
import '@/styles/upload.css';

export default function UploadPage() {
  const navigate = useNavigate();
  const {
    isUploading, uploadProgress, selectedFile, title, artist, style, mood, error,
    startUpload, finishUpload, setProgress, setError, reset,
  } = useUploadStore();

  const canSubmit = !!(selectedFile && title.trim() && artist.trim() && style && mood && !isUploading);
  const isDone = uploadProgress >= 1 && !isUploading;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setError('');
    startUpload();

    // Simulate upload progress
    const interval = setInterval(() => {
      const p = useUploadStore.getState().uploadProgress;
      if (p >= 1) {
        clearInterval(interval);
        finishUpload();
        setTimeout(() => reset(), 2000);
      } else {
        setProgress(Math.min(1, p + Math.random() * 0.08 + 0.02));
      }
    }, 120);
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
    </div>
  );
}
