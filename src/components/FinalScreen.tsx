import React, { useRef, useEffect } from 'react';
import type { FloatingHeart } from '../canvas/hearts';
import { drawHeart, createFloatingHeart, updateFloatingHeart, drawFloatingHeart } from '../canvas/hearts';
import { ConfettiSystem } from '../canvas/confetti';

const FinalScreen: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<FloatingHeart[]>([]);
  const confettiRef = useRef(new ConfettiSystem());
  const animRef = useRef(0);
  const phaseRef = useRef(0);
  const startedRef = useRef(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !startedRef.current) {
          startedRef.current = true;
          const canvas = canvasRef.current;
          if (canvas) {
            confettiRef.current.rain(canvas.offsetWidth, 60);
          }
        }
      },
      { threshold: 0.5 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
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
      phaseRef.current += 0.02;

      // Pulsing center heart
      const heartScale = 1 + Math.sin(phaseRef.current) * 0.1;
      const heartSize = Math.min(w, h) * 0.12 * heartScale;
      drawHeart(ctx, w / 2, h / 2 - 40, heartSize, '#F472B6', 0.7);

      // Orbiting mini hearts
      const orbitR = Math.min(w, h) * 0.22;
      const numOrbiting = 8;
      for (let i = 0; i < numOrbiting; i++) {
        const angle = phaseRef.current * 0.5 + (i / numOrbiting) * Math.PI * 2;
        const ox = w / 2 + Math.cos(angle) * orbitR;
        const oy = h / 2 - 40 + Math.sin(angle) * orbitR * 0.6;
        const miniSize = 8 + Math.sin(phaseRef.current + i) * 3;
        const colors = ['#F9A8D4', '#C4B5FD', '#FCA5A5', '#D8B4FE', '#FDBA74', '#93C5FD', '#A7F3D0', '#FDE68A'];
        drawHeart(ctx, ox, oy, miniSize, colors[i % colors.length], 0.6);
      }

      // Floating hearts
      if (Math.random() > 0.92) {
        heartsRef.current.push(createFloatingHeart(w, h));
      }
      for (const heart of heartsRef.current) {
        updateFloatingHeart(heart);
        drawFloatingHeart(ctx, heart);
      }
      heartsRef.current = heartsRef.current.filter(h => h.y > -30);

      // Confetti
      confettiRef.current.update();
      confettiRef.current.draw(ctx);
      ctx.globalAlpha = 1;

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="section" ref={sectionRef}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />

      <div
        style={{
          zIndex: 1,
          textAlign: 'center',
          animation: 'fadeIn 1s ease',
        }}
      >
        <h2
          className="handwritten"
          style={{
            fontSize: '3rem',
            color: '#5B2C6F',
            textShadow: '0 4px 20px rgba(91, 44, 111, 0.15)',
            marginBottom: '1rem',
          }}
        >
          С Днём Рождения, мамочка!
        </h2>
        <p style={{ fontSize: '1.1rem', opacity: 0.7, maxWidth: '400px' }}>
          Ты — самое ценное, что есть в моей жизни. Люблю тебя бесконечно!
        </p>
      </div>
    </div>
  );
};

export default FinalScreen;
