import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FloatingHeart } from '../canvas/hearts';
import { createFloatingHeart, updateFloatingHeart, drawFloatingHeart } from '../canvas/hearts';

const HugButton: React.FC = () => {
  const [hugs, setHugs] = useState(0);
  const [hugging, setHugging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<FloatingHeart[]>([]);
  const animRef = useRef(0);

  const addHearts = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    for (let i = 0; i < 8; i++) {
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

      // Remove hearts that went off screen
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
    setTimeout(() => setHugging(false), 600);
  };

  return (
    <div
      className="section"
      style={{
        transform: hugging ? 'scale(0.95)' : 'scale(1)',
        transition: 'transform 0.3s ease',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 0 }}
      />

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
          }}
        >
          <p className="handwritten" style={{ fontSize: '2rem', color: '#F472B6' }}>
            {hugs}
          </p>
          <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>
            {hugs === 1 ? 'обнимашка' : hugs < 5 ? 'обнимашки' : 'обнимашек'}
          </p>
        </div>
      )}

      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default HugButton;
