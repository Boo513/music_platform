import { useState, useRef } from 'react';
import { useUploadStore } from '@/stores/useUploadStore';

export function DropZone() {
  const { selectedFile, setFile, setError } = useUploadStore();
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.toLowerCase().endsWith('.mp3')) { setError('ONLY MP3 FORMAT ALLOWED'); return; }
    if (f.size > 50 * 1024 * 1024) { setError('FILE SIZE EXCEEDS 50MB'); return; }
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div
      className={`up-dropzone ${dragOver ? 'drag-over' : ''} ${selectedFile ? 'has-file' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      onClick={() => !selectedFile && fileRef.current?.click()}
    >
      {selectedFile ? (
        <div className="up-file-info">
          <span className="up-file-icon">⬆</span>
          <span className="up-file-name">{selectedFile.name}</span>
          <span className="up-file-size">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
          <button className="up-file-remove" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
            REMOVE
          </button>
        </div>
      ) : (
        <div className="up-drop-prompt">
          <span className="up-drop-icon">⬆</span>
          <span>DROP MP3 HERE</span>
          <span className="up-drop-hint">or click to browse</span>
        </div>
      )}
      <input
        ref={fileRef}
        type="file"
        accept=".mp3,audio/mpeg"
        style={{ display: 'none' }}
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />
    </div>
  );
}
