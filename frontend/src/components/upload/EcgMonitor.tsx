import { useRef, useEffect } from 'react';
import { useUploadStore } from '@/stores/useUploadStore';

export function EcgMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<number[]>([]);
  const frameRef = useRef(0);
  const counterRef = useRef(0);

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

    // Varying R-wave amplitude per beat for realistic ECG look
    const beatHeights: number[] = [];
    function getBeatHeight(beatIndex: number): number {
      if (beatHeights[beatIndex] !== undefined) return beatHeights[beatIndex];
      // Random variation: 55-95, some beats taller than others
      const h = 55 + Math.random() * 40;
      beatHeights[beatIndex] = h;
      return h;
    }

    function generateEcgPoint(globalCycle: number): number {
      const cycleLen = 120;
      const c = ((globalCycle % cycleLen) + cycleLen) % cycleLen;
      const beatIdx = Math.floor(globalCycle / cycleLen);
      const R = getBeatHeight(beatIdx); // varying R amplitude
      const S = R * 0.3;  // S depth proportional to R
      const P = R * 0.1;  // P proportional
      const T = R * 0.13; // T proportional
      let y = 0;

      // P wave: gentle bump (24-30)
      if (c >= 24 && c < 30) {
        y = P * Math.sin(((c - 24) / 6) * Math.PI);
      }
      // Q dip: (48-50)
      if (c >= 48 && c < 50) {
        y = -(c - 48) * (R * 0.08);
      }
      // R SPIKE: (50-54)
      if (c >= 50 && c < 54) {
        const t = c - 50;
        y = R * Math.sin((t / 4) * Math.PI);
      }
      // S dip: (54-58)
      if (c >= 54 && c < 58) {
        const t = c - 54;
        y = -S * Math.sin((t / 4) * Math.PI);
      }
      // T wave: (70-90)
      if (c >= 70 && c < 90) {
        y = T * Math.sin(((c - 70) / 20) * Math.PI);
      }

      y += (Math.random() - 0.5) * 0.6;
      return y;
    }

    function draw() {
      frameRef.current = requestAnimationFrame(draw);
      counterRef.current++;

      const W = canvas.width;
      const H = canvas.height;
      const cw = W / dpr;
      const ch = H / dpr;
      const midY = Math.round(ch / 2);

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, cw, ch);

      // === BACKGROUND GRID (20×20 medical paper) ===
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.06)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < cw; gx += 20) {
        ctx.beginPath(); ctx.moveTo(Math.round(gx) + 0.5, 0); ctx.lineTo(Math.round(gx) + 0.5, ch); ctx.stroke();
      }
      for (let gy = 0; gy < ch; gy += 20) {
        ctx.beginPath(); ctx.moveTo(0, Math.round(gy) + 0.5); ctx.lineTo(cw, Math.round(gy) + 0.5); ctx.stroke();
      }

      // Center baseline
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, midY + 0.5); ctx.lineTo(cw, midY + 0.5); ctx.stroke();

      // === GENERATE NEW DATA POINT ===
      let newY: number;
      const uploading = useUploadStore.getState().isUploading;
      if (uploading) {
        newY = generateEcgPoint(pointsRef.current.length);
      } else {
        // Tiny idle noise
        newY = (Math.random() - 0.5) * 0.4;
      }

      pointsRef.current.push(newY);
      while (pointsRef.current.length > cw) {
        pointsRef.current.shift();
      }

      const pts = pointsRef.current;

      // === LAYER 1: GLOW HALO ===
      ctx.save();
      ctx.beginPath();
      if (pts.length > 0) {
        ctx.moveTo(0, midY - pts[0]);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(i, midY - pts[i]);
        }
      }
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.25)';
      ctx.lineWidth = 7;
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#00ff9d';
      ctx.shadowBlur = 18;
      ctx.stroke();
      ctx.restore();

      // === LAYER 2: SHARP CORE ===
      ctx.beginPath();
      if (pts.length > 0) {
        ctx.moveTo(0, midY - pts[0]);
        for (let i = 1; i < pts.length; i++) {
          ctx.lineTo(i, midY - pts[i]);
        }
      }
      ctx.strokeStyle = '#00ff9d';
      ctx.lineWidth = 1.5;
      ctx.lineJoin = 'round';
      ctx.shadowBlur = 0;
      ctx.stroke();

      // === SCANNING DOT ===
      if (pts.length > 0) {
        const lx = pts.length - 1;
        const ly = midY - pts[pts.length - 1];
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.shadowColor = '#00ff9d';
        ctx.shadowBlur = 16;
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
            {(selectedFile.size / 1024 / 1024).toFixed(1)} MB
          </span>
        )}
      </div>
    </div>
  );
}
