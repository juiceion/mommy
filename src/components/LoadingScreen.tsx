import React, { useState, useEffect, useRef } from 'react';
import { PASTEL_COLORS } from '../utils/colors';

const STATUSES = [
  'Подбираю самые тёплые слова...',
  'Считаю обнимашки...',
  'Заворачиваю подарок...',
  'Добавляю щепотку волшебства...',
  'Почти готово...',
];

interface HeartParticle {
  x: number; y: number;
  targetX: number; targetY: number;
  size: number; color: string; alpha: number;
  arrived: boolean;
}

function generateHeartPoints(cx: number, cy: number, scale: number): { x: number; y: number }[] {
  const points: { x: number; y: number }[] = [];
  for (let t = 0; t < Math.PI * 2; t += 0.15) {
    const x = 16 * Math.pow(Math.sin(t), 3);
    const y = -(13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t));
    points.push({ x: cx + x * scale, y: cy + y * scale });
  }
  return points;
}

const LoadingScreen: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [statusIdx, setStatusIdx] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<HeartParticle[]>([]);
  const animRef = useRef(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = Math.min(prev + Math.random() * 3 + 0.5, 100);
        setStatusIdx(Math.min(Math.floor(next / 20), STATUSES.length - 1));
        if (next >= 100) {
          clearInterval(interval);
          setTimeout(() => setDone(true), 600);
          setTimeout(() => onComplete(), 1200);
        }
        return next;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [onComplete]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const scale = Math.min(w, h) / 120;
      const heartPoints = generateHeartPoints(w / 2, h / 2 - 20, scale);
      particlesRef.current = heartPoints.map(pt => ({
        x: Math.random() * w,
        y: Math.random() * h,
        targetX: pt.x,
        targetY: pt.y,
        size: 3 + Math.random() * 3,
        color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
        alpha: 0.6 + Math.random() * 0.4,
        arrived: false,
      }));
    };

    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      const pct = progress / 100;

      for (const p of particlesRef.current) {
        const ease = pct * pct;
        p.x += (p.targetX - p.x) * ease * 0.05;
        p.y += (p.targetY - p.y) * ease * 0.05;

        if (!p.arrived) {
          p.x += (Math.random() - 0.5) * (1 - ease) * 3;
          p.y += (Math.random() - 0.5) * (1 - ease) * 3;
        }

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * (0.4 + ease * 0.6);
        ctx.fill();

        // Glow
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2);
        ctx.fillStyle = p.color;
        ctx.globalAlpha = p.alpha * 0.15 * ease;
        ctx.fill();
      }

      ctx.globalAlpha = 1;
      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [progress]);

  return (
    <div
      className="section"
      style={{
        opacity: done ? 0 : 1,
        transition: 'opacity 0.6s ease',
        background: 'linear-gradient(180deg, #FFF5F7 0%, #F8F0FF 100%)',
        zIndex: 100,
        position: done ? 'absolute' : 'relative',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
        }}
      />
      <div style={{ zIndex: 1, textAlign: 'center' }}>
        <h2 className="section-title" style={{ fontSize: '2rem', marginBottom: '2rem' }}>
          Готовим сюрприз...
        </h2>
        <div
          style={{
            width: '280px',
            height: '12px',
            borderRadius: '6px',
            background: 'rgba(196, 181, 253, 0.3)',
            overflow: 'hidden',
            margin: '0 auto 1rem',
          }}
        >
          <div
            style={{
              width: `${progress}%`,
              height: '100%',
              borderRadius: '6px',
              background: 'linear-gradient(90deg, #F9A8D4, #C4B5FD)',
              transition: 'width 0.1s ease',
            }}
          />
        </div>
        <p className="handwritten" style={{ fontSize: '1.4rem', minHeight: '2rem' }}>
          {STATUSES[statusIdx]}
        </p>
        <p style={{ fontSize: '1.2rem', marginTop: '0.5rem', fontWeight: 600 }}>
          {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
};

export default LoadingScreen;
