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
    const W = canvas.width = canvas.clientWidth * 2;
    const H = canvas.height = canvas.clientHeight * 2;
    ctx.scale(2, 2);
    const cw = W / 2, ch = H / 2;

    // --- ECG generator: real waveform shape ---
    function ecgY(x: number, cycle: number): number {
      // Normalize x within the cycle (60px per beat)
      const p = ((x % 60) + 60) % 60;
      let y = 0;

      // P wave: small bump at start
      if (p > 2 && p < 10) {
        const t = (p - 2) / 8;
        y = 3 * Math.sin(t * Math.PI) * Math.exp(-t * 2);
      }
      // Q wave: small dip
      if (p > 11 && p < 14) {
        y = -2 * Math.sin(((p - 11) / 3) * Math.PI * 0.5);
      }
      // R wave: tall spike
      if (p >= 14 && p <= 16) {
        const t = (p - 14) / 2;
        y = 28 * Math.sin(t * Math.PI * 0.5) * (1 - t);
      }
      // S wave: deep dip
      if (p > 16 && p < 20) {
        const t = (p - 16) / 4;
        y = -10 * Math.sin(t * Math.PI * 0.5);
      }
      // T wave: gentle bump
      if (p > 20 && p < 32) {
        const t = (p - 20) / 12;
        y = 5 * Math.sin(t * Math.PI) * Math.exp(-t);
      }
      // Noise
      y += (Math.sin(cycle * 0.7 + p * 0.3) * 0.3) + (Math.random() - 0.5) * 0.4;
      return y;
    }

    function draw() {
      frameRef.current = requestAnimationFrame(draw);
      const { isUploading, uploadProgress } = useUploadStore.getState();
      ctx.clearRect(0, 0, cw, ch);

      // Grid lines
      ctx.strokeStyle = 'rgba(0,255,157,0.05)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < cw; gx += 60) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, ch); ctx.stroke();
      }
      for (let gy = 0; gy < ch; gy += 30) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(cw, gy); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0,255,157,0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, ch / 2); ctx.lineTo(cw, ch / 2); ctx.stroke();

      // Push new points
      let newY: number;
      if (isUploading) {
        const cycle = pointsRef.current.length;
        newY = ecgY(pointsRef.current.length, cycle);
      } else {
        newY = (Math.random() - 0.5) * 1.5;
      }
      pointsRef.current.push(newY);
      if (pointsRef.current.length > cw) pointsRef.current.shift();

      // Draw glow layer
      ctx.save();
      ctx.beginPath();
      for (let i = 0; i < pointsRef.current.length; i++) {
        const px = i;
        const py = ch / 2 - pointsRef.current[i];
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 6;
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 15;
      ctx.globalAlpha = 0.3;
      ctx.stroke();
      ctx.restore();

      // Draw core layer
      ctx.beginPath();
      for (let i = 0; i < pointsRef.current.length; i++) {
        const px = i;
        const py = ch / 2 - pointsRef.current[i];
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 2;
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 6;
      ctx.globalAlpha = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Scanning dot at front
      if (pointsRef.current.length > 0) {
        const lastX = pointsRef.current.length - 1;
        const lastY = ch / 2 - pointsRef.current[pointsRef.current.length - 1];
        ctx.beginPath();
        ctx.arc(lastX, lastY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    }

    draw();
    return () => cancelAnimationFrame(frameRef.current);
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
