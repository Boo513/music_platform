import { useRef, useEffect } from 'react';
import { useUploadStore } from '@/stores/useUploadStore';

export function EcgMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<number[]>([]);
  const frameRef = useRef(0);

  const { isUploading, uploadProgress, selectedFile } = useUploadStore();

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    }
    resize();
    window.addEventListener('resize', resize);

    // --- REAL ECG WAVEFORM GENERATOR ---
    function generateEcgPoint(cycle: number): number {
      // 120 points per heartbeat cycle
      const c = ((cycle % 120) + 120) % 120;
      let y = 0;

      // P wave: small bump (20-30)
      if (c > 20 && c < 30) {
        y = Math.sin(((c - 20) / 10) * Math.PI) * 4;
      }
      // Q wave: micro dip (45-48)
      else if (c >= 45 && c < 48) {
        y = -6;
      }
      // R wave: EXTREME spike up then down (48-53)
      else if (c >= 48 && c < 53) {
        y = 60 - (c - 48) * 24;
      }
      // S wave: deep dip then recover (53-57)
      else if (c >= 53 && c < 57) {
        y = -20 + (c - 53) * 5;
      }
      // T wave: wide gentle bump (65-85)
      else if (c > 65 && c < 85) {
        y = Math.sin(((c - 65) / 20) * Math.PI) * 8;
      }
      // Baseline: mostly flat (micro noise only)

      // Tiny random noise for realism
      y += (Math.random() - 0.5) * 0.8;
      return y;
    }

    function draw() {
      frameRef.current = requestAnimationFrame(draw);
      const { isUploading } = useUploadStore.getState();

      const W = canvas.width;
      const H = canvas.height;
      const cw = W / dpr;
      const ch = H / dpr;
      const midY = ch / 2;

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cw, ch);

      // --- 1. Background grid (20x20) ---
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.05)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < cw; gx += 20) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke();
      }
      for (let gy = 0; gy < ch; gy += 20) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke();
      }
      // Center baseline (slightly brighter)
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(cw, midY); ctx.stroke();

      // --- 2. Generate new point ---
      let newY: number;
      if (isUploading) {
        newY = generateEcgPoint(pointsRef.current.length);
      } else {
        // Flatline with tiny noise when idle
        newY = (Math.random() - 0.5) * 0.4;
      }
      pointsRef.current.push(newY);
      if (pointsRef.current.length > cw) {
        pointsRef.current.shift();
      }

      // --- 3. Double-layer glow rendering ---
      // Layer 1: Glow halo
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < pointsRef.current.length; i++) {
        const px = i;
        const py = midY - pointsRef.current[i];
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.3)';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 15;
      ctx.stroke();
      ctx.restore();

      // Layer 2: Sharp core line
      ctx.beginPath();
      for (let i = 0; i < pointsRef.current.length; i++) {
        const px = i;
        const py = midY - pointsRef.current[i];
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 1.5;
      ctx.shadowBlur = 0;
      ctx.stroke();

      // --- 4. Scanning dot at waveform front ---
      if (pointsRef.current.length > 0) {
        const lastIdx = pointsRef.current.length - 1;
        const lx = lastIdx;
        const ly = midY - pointsRef.current[lastIdx];
        ctx.beginPath();
        ctx.arc(lx, ly, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 14;
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      ctx.restore();
    }

    draw();
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="up-ecg">
      <canvas ref={canvasRef} className="up-ecg-canvas" />
      <div className="up-ecg-info">
        <span className={`up-ecg-status ${isUploading ? 'active' : ''}`}>
          ● {isUploading ? 'UPLOADING' : 'STANDBY'}
        </span>
        <span className="up-ecg-progress">
          {isUploading ? `${Math.round(uploadProgress * 100)}%` : '--'}
        </span>
        {selectedFile && (
          <span className="up-ecg-size">
            {(selectedFile.size / 1024 / 1024).toFixed(1)}MB / {(selectedFile.size / 1024 / 1024).toFixed(1)}MB
          </span>
        )}
      </div>
    </div>
  );
}
