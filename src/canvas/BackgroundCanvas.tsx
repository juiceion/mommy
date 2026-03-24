import React, { useRef, useEffect } from 'react';
import { PASTEL_COLORS } from '../utils/colors';

// ── Interfaces ──────────────────────────────────────────────

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

interface Bubble {
  x: number;
  y: number;
  radius: number;
  color: string;
  alpha: number;
  speed: number;
  wobble: number;
  wobbleSpeed: number;
  phase: number;
}

// ── Constants ───────────────────────────────────────────────

const PETAL_COUNT = 12;
const STAR_COUNT = 15;
const BUBBLE_COUNT = 5;

const STAR_COLORS = ['#FACC15', '#FFFFFF', '#A855F7'];

// ── Factory functions ───────────────────────────────────────

function createPetal(w: number, h: number, randomY = false): Petal {
  return {
    x: Math.random() * w,
    y: randomY ? Math.random() * h : -(Math.random() * h * 0.3),
    size: 10 + Math.random() * 12,
    color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
    alpha: 0.25 + Math.random() * 0.25,
    rotation: Math.random() * Math.PI * 2,
    rotationSpeed: (Math.random() - 0.5) * 0.012,
    speed: 0.3 + Math.random() * 0.6,
    wobble: 30 + Math.random() * 40,
    wobbleSpeed: 0.005 + Math.random() * 0.01,
    phase: Math.random() * Math.PI * 2,
  };
}

function createStar(w: number, h: number): Star {
  return {
    x: Math.random() * w,
    y: Math.random() * h,
    size: 2 + Math.random() * 4,
    color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
    pulseSpeed: 0.01 + Math.random() * 0.025,
    phase: Math.random() * Math.PI * 2,
  };
}

function createBubble(w: number, h: number, randomY = false): Bubble {
  return {
    x: Math.random() * w,
    y: randomY ? Math.random() * h : h + Math.random() * 100,
    radius: 15 + Math.random() * 25,
    color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
    alpha: 0.08 + Math.random() * 0.07,
    speed: 0.15 + Math.random() * 0.35,
    wobble: 20 + Math.random() * 30,
    wobbleSpeed: 0.003 + Math.random() * 0.006,
    phase: Math.random() * Math.PI * 2,
  };
}

// ── Draw functions ──────────────────────────────────────────

function drawGradientBackground(
  ctx: CanvasRenderingContext2D,
  cw: number,
  ch: number,
  time: number,
) {
  const hue = 80 + ((time * 1.5) % 80); // 80-160 green-yellow range
  const grad = ctx.createLinearGradient(0, 0, cw, ch);
  grad.addColorStop(0, `hsl(${hue}, 25%, 95%)`);
  grad.addColorStop(0.5, `hsl(${hue + 30}, 22%, 96%)`);
  grad.addColorStop(1, `hsl(${hue + 60}, 20%, 95%)`);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, cw, ch);
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

function drawSparkle(
  ctx: CanvasRenderingContext2D,
  star: Star,
  time: number,
) {
  const alpha =
    0.3 + 0.5 * (0.5 + 0.5 * Math.sin(time * star.pulseSpeed + star.phase));
  const outerR = star.size;
  const innerR = star.size * 0.4;

  ctx.save();
  ctx.translate(star.x, star.y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = star.color;

  ctx.beginPath();
  for (let i = 0; i < 8; i++) {
    const angle = (Math.PI / 4) * i - Math.PI / 2;
    const r = i % 2 === 0 ? outerR : innerR;
    const px = Math.cos(angle) * r;
    const py = Math.sin(angle) * r;
    if (i === 0) {
      ctx.moveTo(px, py);
    } else {
      ctx.lineTo(px, py);
    }
  }
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

function drawBubble(ctx: CanvasRenderingContext2D, bubble: Bubble) {
  ctx.save();
  ctx.globalAlpha = bubble.alpha;

  const grad = ctx.createRadialGradient(
    bubble.x,
    bubble.y,
    0,
    bubble.x,
    bubble.y,
    bubble.radius,
  );
  grad.addColorStop(0, '#FFFFFF');
  grad.addColorStop(1, bubble.color);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(bubble.x, bubble.y, bubble.radius, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// ── Component ───────────────────────────────────────────────

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
    const bubbles: Bubble[] = Array.from({ length: BUBBLE_COUNT }, () =>
      createBubble(w(), h(), true),
    );

    const animate = () => {
      time += 1;
      const cw = w();
      const ch = h();

      // Animated background gradient
      drawGradientBackground(ctx, cw, ch, time);

      // Draw glow bubbles (behind everything)
      for (let i = 0; i < bubbles.length; i++) {
        const b = bubbles[i];
        b.y -= b.speed;
        b.x += Math.sin(time * b.wobbleSpeed + b.phase) * (b.wobble * 0.015);

        if (b.y < -(b.radius * 2)) {
          bubbles[i] = createBubble(cw, ch, false);
        }

        drawBubble(ctx, b);
      }

      // Draw sparkle stars
      for (const star of stars) {
        drawSparkle(ctx, star, time);
      }

      // Update and draw petals
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.y += p.speed;
        p.x += Math.sin(time * p.wobbleSpeed + p.phase) * (p.wobble * 0.02);
        p.rotation += p.rotationSpeed;

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
