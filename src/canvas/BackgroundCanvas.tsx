import React, { useRef, useEffect } from 'react';
import { PASTEL_COLORS } from '../utils/colors';

interface Petal {
  x: number;
  y: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  phase: number;
}

interface Star {
  x: number;
  y: number;
  size: number;
  color: string;
  pulseSpeed: number;
  phase: number;
}

const STAR_COLORS = ['#FDE68A', '#FFFFFF', '#D8B4FE'];
const PETAL_COUNT = 20;
const STAR_COUNT = 25;

function createPetal(w: number, h: number, randomY = false): Petal {
  return {
    x: Math.random() * w,
    y: randomY ? Math.random() * h : -Math.random() * h * 0.3,
    size: 8 + Math.random() * 14,
    color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
    alpha: 0.25 + Math.random() * 0.35,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.015,
    speed: 0.3 + Math.random() * 0.7,
    wobble: 30 + Math.random() * 40,
    wobbleSpeed: 0.005 + Math.random() * 0.01,
    phase: Math.random() * Math.PI * 2,
  };
}

function createStar(w: number, h: number): Star {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: 2 + Math.random() * 2,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    pulseSpeed: 0.01 + Math.random() * 0.025,
    phase: Math.random() * Math.PI * 2,
  };
}

function drawPetal(ctx: CanvasRenderingContext2D, petal: Petal) {
  ctx.save();
  ctx.translate(petal.x, petal.y);
  ctx.rotate(petal.rotation);
  ctx.globalAlpha = petal.alpha;
  ctx.fillStyle = petal.color;

  const s = petal.size;

  ctx.beginPath();
  ctx.moveTo(0, -s);
  ctx.bezierCurveTo(s * 0.8, -s * 0.6, s * 0.6, s * 0.4, 0, s);
  ctx.bezierCurveTo(-s * 0.6, s * 0.4, -s * 0.8, -s * 0.6, 0, -s);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawStar(ctx: CanvasRenderingContext2D, star: Star, time: number) {
  const alpha = 0.3 + 0.5 * (0.5 + 0.5 * Math.sin(time * star.pulseSpeed + star.phase));
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = star.color;
  ctx.beginPath();
  ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const BackgroundCanvas: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    resize();

    const w = () => window.innerWidth;
    const h = () => window.innerHeight;

    const petals: Petal[] = Array.from({ length: PETAL_COUNT }, () =>
      createPetal(w(), h(), true),
    );
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () =>
      createStar(w(), h()),
    );

    const animate = () => {
      time += 1;
      const cw = w();
      const ch = h();

      ctx.clearRect(0, 0, cw, ch);

      // Update and draw stars
      for (const star of stars) {
        drawStar(ctx, star, time);
      }

      // Update and draw petals
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.y += p.speed;
        p.x += Math.sin(time * p.wobbleSpeed + p.phase) * (p.wobble * 0.02);
        p.rotation += p.rotationSpeed;

        // Recycle petals that fall below screen
        if (p.y > ch + p.size * 2) {
          petals[i] = createPetal(cw, ch, false);
          petals[i].y = -(petals[i].size * 2 + Math.random() * 40);
        }

        drawPetal(ctx, p);
      }

      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    window.addEventListener('resize', resize);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        pointerEvents: 'none',
      }}
    />
  );
};

export default BackgroundCanvas;
