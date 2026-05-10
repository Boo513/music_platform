import { useRef, useEffect } from 'react';
import { useUploadStore } from '@/stores/useUploadStore';

export function EcgMonitor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointsRef = useRef<number[]>([]);
  const frameRef = useRef(0);
  const counterRef = useRef(0);

  const { isUploading, uploadProgress, selectedFile } = useUploadStore();
  const wasUploading = useRef(false);

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

    // Varying R-wave amplitude per beat
    const beatHeights: number[] = [];
    function getBeatHeight(beatIndex: number): number {
      if (beatHeights[beatIndex] !== undefined) return beatHeights[beatIndex];
      const h = 55 + Math.random() * 40;
      beatHeights[beatIndex] = h;
      return h;
    }

    function generateEcgPoint(globalCycle: number): number {
      const cycleLen = 120;
      const c = ((globalCycle % cycleLen) + cycleLen) % cycleLen;
      const beatIdx = Math.floor(globalCycle / cycleLen);
      const R = getBeatHeight(beatIdx);
      const S = R * 0.3;
      const P = R * 0.1;
      const T = R * 0.13;
      let y = 0;

      if (c >= 24 && c < 30) {
        y = P * Math.sin(((c - 24) / 6) * Math.PI);
      }
      if (c >= 48 && c < 50) {
        y = -(c - 48) * (R * 0.08);
      }
      if (c >= 50 && c < 54) {
        y = R * Math.sin(((c - 50) / 4) * Math.PI);
      }
      if (c >= 54 && c < 58) {
        y = -S * Math.sin(((c - 54) / 4) * Math.PI);
      }
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

      // Grid
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.06)';
      ctx.lineWidth = 0.5;
      for (let gx = 0; gx < cw; gx += 20) {
        ctx.beginPath(); ctx.moveTo(Math.round(gx) + 0.5, 0); ctx.lineTo(Math.round(gx) + 0.5, ch); ctx.stroke();
      }
      for (let gy = 0; gy < ch; gy += 20) {
        ctx.beginPath(); ctx.moveTo(0, Math.round(gy) + 0.5); ctx.lineTo(cw, Math.round(gy) + 0.5); ctx.stroke();
      }
      ctx.strokeStyle = 'rgba(0, 255, 157, 0.15)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(0, midY + 0.5); ctx.lineTo(cw, midY + 0.5); ctx.stroke();

      // === DETECT UPLOAD START: clear history ===
      const uploading = useUploadStore.getState().isUploading;
      if (uploading && !wasUploading.current) {
        pointsRef.current = [];
        beatHeights.length = 0;
      }
      wasUploading.current = uploading;

      // === GENERATE POINTS (2x speed during upload) ===
      const speed = uploading ? 3 : 1;
      for (let s = 0; s < speed; s++) {
        let newY: number;
        if (uploading) {
          newY = generateEcgPoint(pointsRef.current.length);
        } else {
          newY = (Math.random() - 0.5) * 0.3;
        }
        pointsRef.current.push(newY);
      }
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
