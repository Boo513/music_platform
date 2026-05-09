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
      // Normalize x within the cycle (80px per beat - wider waveform)
      const p = ((x % 80) + 80) % 80;
      let y = 0;

      // P wave: small bump at start (~8px)
      if (p > 4 && p < 16) {
        const t = (p - 4) / 12;
        y = 10 * Math.sin(t * Math.PI) * Math.exp(-t * 1.5);
      }
      // PR segment: flat
      // Q wave: small dip (~-8px)
      if (p > 18 && p < 22) {
        y = -8 * Math.sin(((p - 18) / 4) * Math.PI * 0.5);
      }
      // R wave: TALL spike (~65px peak)
      if (p >= 22 && p <= 26) {
        const t = (p - 22) / 4;
        y = 65 * Math.sin(t * Math.PI) * (1 - t * 0.8);
      }
      // S wave: deep dip (~-25px)
      if (p > 26 && p < 32) {
        const t = (p - 26) / 6;
        y = -25 * Math.sin(t * Math.PI * 0.5);
      }
      // T wave: medium bump (~15px)
      if (p > 35 && p < 52) {
        const t = (p - 35) / 17;
        y = 15 * Math.sin(t * Math.PI) * Math.exp(-t * 0.8);
      }
      // Micro noise for realism
      y += (Math.sin(cycle * 0.7 + p * 0.3) * 0.8) + (Math.random() - 0.5) * 0.6;
      return y;
    }

    function draw() {
      frameRef.current = requestAnimationFrame(draw);
      const { isUploading, uploadProgress } = useUploadStore.getState();
      ctx.clearRect(0, 0, cw, ch);

      // Grid lines
      ctx.strokeStyle = 'rgba(0,255,157,0.05)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < cw; gx += 80) {
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
      ctx.lineWidth = 8;
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 25;
      ctx.globalAlpha = 0.25;
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
      ctx.lineWidth = 2.5;
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 10;
      ctx.globalAlpha = 1;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // Scanning dot at front
      if (pointsRef.current.length > 0) {
        const lastX = pointsRef.current.length - 1;
        const lastY = ch / 2 - pointsRef.current[pointsRef.current.length - 1];
        ctx.beginPath();
        ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 18;
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
