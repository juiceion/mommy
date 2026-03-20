import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FloatingHeart } from '../canvas/hearts';
import { createFloatingHeart, updateFloatingHeart, drawFloatingHeart } from '../canvas/hearts';

const HUG_MESSAGES = [
  'Самая тёплая обнимашка!',
  'Ещё крепче!',
  'Обнимашка с бесконечной любовью!',
  'Тёплая-претёплая!',
  'Не отпускаю!',
  'Бесконечная нежность!',
  'Мамочка, ты лучшая!',
  'Обнимаю до луны и обратно!',
  'Самые крепкие объятия!',
  'Вся любовь мира — тебе!',
];

const HugButton: React.FC = () => {
  const [hugs, setHugs] = useState(0);
  const [hugging, setHugging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<FloatingHeart[]>([]);
  const animRef = useRef(0);

  const addHearts = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    for (let i = 0; i < 12; i++) {
      heartsRef.current.push(createFloatingHeart(canvas.offsetWidth, canvas.offsetHeight));
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const heart of heartsRef.current) {
        updateFloatingHeart(heart);
        drawFloatingHeart(ctx, heart);
      }
      ctx.globalAlpha = 1;

      heartsRef.current = heartsRef.current.filter(h => h.y > -30);

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleHug = () => {
    setHugs(h => h + 1);
    setHugging(true);
    addHearts();
    setTimeout(() => setHugging(false), 700);
  };

  const message = hugs > 0 ? HUG_MESSAGES[(hugs - 1) % HUG_MESSAGES.length] : '';

  return (
    <div
      className="section"
      style={{
        transform: hugging ? 'scale(0.9)' : 'scale(1)',
        transition: 'transform 0.4s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      />

      {/* Warm glow overlay when hugging */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle, rgba(249,168,212,0.25) 0%, transparent 70%)',
          opacity: hugging ? 1 : 0,
          transition: 'opacity 0.3s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Arms */}
      <div className={`hug-arm hug-arm-left ${hugging ? 'active' : ''}`} />
      <div className={`hug-arm hug-arm-right ${hugging ? 'active' : ''}`} />

      <h2 className="section-title" style={{ zIndex: 1 }}>Обнимашки!</h2>

      <button
        className="btn"
        onClick={handleHug}
        style={{
          fontSize: '1.5rem',
          padding: '1.2rem 3rem',
          zIndex: 1,
          animation: hugging ? 'pulse 0.3s ease' : undefined,
        }}
      >
        Обнять маму!
      </button>

      {hugs > 0 && (
        <div
          style={{
            marginTop: '1.5rem',
            textAlign: 'center',
            zIndex: 1,
            animation: 'fadeIn 0.3s ease',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(8px)',
            borderRadius: '16px',
            padding: '1rem 1.5rem',
            maxWidth: '320px',
          }}
        >
          <p className="handwritten" style={{ fontSize: '1.5rem', color: '#5B2C6F', lineHeight: 1.3 }}>
            Обнимашка #{hugs}:
          </p>
          <p className="handwritten" style={{ fontSize: '1.3rem', color: '#F472B6', marginTop: '0.3rem' }}>
            {message}
          </p>
        </div>
      )}

      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default HugButton;
