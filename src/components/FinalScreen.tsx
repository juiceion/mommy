import React, { useRef, useEffect } from 'react';
import type { FloatingHeart } from '../canvas/hearts';
import { drawHeart, createFloatingHeart, updateFloatingHeart, drawFloatingHeart } from '../canvas/hearts';
import { ConfettiSystem } from '../canvas/confetti';

function drawWarmthOrbs(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  phase: number,
) {
  const cx = w / 2;
  const cy = h / 2 - 30;
  const orbitR = Math.min(w, h) * 0.15;

  // Two orbs orbiting
  const angleA = phase * 0.3;
  const angleB = phase * 0.3 + Math.PI;

  // Merge factor: orbs get closer periodically
  const mergeFactor = 0.5 + 0.5 * Math.sin(phase * 0.15);
  const actualR = orbitR * (1 - mergeFactor * 0.7);

  const ax = cx + Math.cos(angleA) * actualR;
  const ay = cy + Math.sin(angleA) * actualR * 0.6;
  const bx = cx + Math.cos(angleB) * actualR;
  const by = cy + Math.sin(angleB) * actualR * 0.6;

  const orbSize = Math.min(w, h) * 0.08;
  const pulse = 1 + Math.sin(phase * 0.5) * 0.15;

  // Draw orb A (pink)
  ctx.save();
  const gradA = ctx.createRadialGradient(ax, ay, 0, ax, ay, orbSize * pulse * 1.5);
  gradA.addColorStop(0, 'rgba(236, 72, 153, 0.5)');
  gradA.addColorStop(0.4, 'rgba(236, 72, 153, 0.2)');
  gradA.addColorStop(1, 'rgba(236, 72, 153, 0)');
  ctx.fillStyle = gradA;
  ctx.beginPath();
  ctx.arc(ax, ay, orbSize * pulse * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Inner core A
  const coreA = ctx.createRadialGradient(ax, ay, 0, ax, ay, orbSize * pulse * 0.5);
  coreA.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  coreA.addColorStop(1, 'rgba(236, 72, 153, 0.3)');
  ctx.fillStyle = coreA;
  ctx.beginPath();
  ctx.arc(ax, ay, orbSize * pulse * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Draw orb B (violet)
  ctx.save();
  const gradB = ctx.createRadialGradient(bx, by, 0, bx, by, orbSize * pulse * 1.5);
  gradB.addColorStop(0, 'rgba(168, 85, 247, 0.5)');
  gradB.addColorStop(0.4, 'rgba(168, 85, 247, 0.2)');
  gradB.addColorStop(1, 'rgba(168, 85, 247, 0)');
  ctx.fillStyle = gradB;
  ctx.beginPath();
  ctx.arc(bx, by, orbSize * pulse * 1.5, 0, Math.PI * 2);
  ctx.fill();

  // Inner core B
  const coreB = ctx.createRadialGradient(bx, by, 0, bx, by, orbSize * pulse * 0.5);
  coreB.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
  coreB.addColorStop(1, 'rgba(168, 85, 247, 0.3)');
  ctx.fillStyle = coreB;
  ctx.beginPath();
  ctx.arc(bx, by, orbSize * pulse * 0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Merge glow (when orbs are close)
  if (mergeFactor > 0.5) {
    const mergeAlpha = (mergeFactor - 0.5) * 2;
    const mx = (ax + bx) / 2;
    const my = (ay + by) / 2;
    const mergeSize = orbSize * pulse * 2;

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const mergeGrad = ctx.createRadialGradient(mx, my, 0, mx, my, mergeSize);
    mergeGrad.addColorStop(0, `rgba(250, 204, 21, ${0.3 * mergeAlpha})`);
    mergeGrad.addColorStop(0.5, `rgba(236, 72, 153, ${0.15 * mergeAlpha})`);
    mergeGrad.addColorStop(1, 'rgba(168, 85, 247, 0)');
    ctx.fillStyle = mergeGrad;
    ctx.beginPath();
    ctx.arc(mx, my, mergeSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalCompositeOperation = 'source-over';
    ctx.restore();
  }
}

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

      // Warmth orbs (abstract embrace)
      drawWarmthOrbs(ctx, w, h, phaseRef.current);

      // Pulsing center heart
      const heartScale = 1 + Math.sin(phaseRef.current) * 0.1;
      const heartSize = Math.min(w, h) * 0.1 * heartScale;
      drawHeart(ctx, w / 2, h / 2 - 30, heartSize, '#F43F5E', 0.7);

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
            fontSize: '2.8rem',
            color: '#1E3A2F',
            textShadow: '0 4px 20px rgba(30, 58, 47, 0.12)',
            marginBottom: '1rem',
          }}
        >
          С Днём Рождения, мамочка!
        </h2>
        <p
          className="handwritten"
          style={{
            fontSize: '1.3rem',
            lineHeight: 1.6,
            color: '#1E3A2F',
            opacity: 0.8,
            maxWidth: '400px',
          }}
        >
          Обнимаю тебя крепко-крепко ♡
        </p>
        <p style={{ fontSize: '1rem', opacity: 0.6, maxWidth: '400px', marginTop: '0.5rem' }}>
          Ты — самое ценное в моей жизни. Люблю бесконечно!
        </p>
      </div>
    </div>
  );
};

export default FinalScreen;
