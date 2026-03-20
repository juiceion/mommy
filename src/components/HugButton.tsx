import React, { useState, useRef, useEffect, useCallback } from 'react';
import type { FloatingHeart } from '../canvas/hearts';
import { createFloatingHeart, updateFloatingHeart, drawFloatingHeart } from '../canvas/hearts';

const HUG_MESSAGES = [
  'Самая тёплая обнимашка!',
  'Ещё крепче!',
  'Мамочка, ты чудо!',
  'Тёплая-претёплая!',
  'Не отпускаю!',
  'Бесконечная нежность!',
  'Мамочка, ты лучшая!',
  'Самые крепкие объятия!',
  'Ты — моё счастье!',
  'Обнимаю до луны и обратно!',
];

/* ─── bunny drawing helpers ─── */

function drawEar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  w: number,
  h: number,
  outerColor: string,
  innerColor: string,
  angle: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(angle);
  // outer ear
  ctx.beginPath();
  ctx.ellipse(0, -h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = outerColor;
  ctx.fill();
  // inner ear
  ctx.beginPath();
  ctx.ellipse(0, -h / 2, w / 2 - 3, h / 2 - 5, 0, 0, Math.PI * 2);
  ctx.fillStyle = innerColor;
  ctx.fill();
  ctx.restore();
}

function drawBunnyEye(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  // eye (softer color)
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = '#2d1b36';
  ctx.fill();
  // main highlight (bigger, kawaii)
  ctx.beginPath();
  ctx.arc(x + r * 0.25, y - r * 0.25, r * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
  // second small highlight dot
  ctx.beginPath();
  ctx.arc(x - r * 0.2, y + r * 0.15, r * 0.18, 0, Math.PI * 2);
  ctx.fillStyle = '#fff';
  ctx.fill();
}

function drawBunnyNose(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.ellipse(x, y, size / 2, size / 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#f9a8d4';
  ctx.fill();
}

function drawSmile(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  // kawaii "ω" mouth — two small arcs side by side
  ctx.beginPath();
  ctx.arc(x - w * 0.35, y, w * 0.45, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.strokeStyle = '#9b6b8a';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x + w * 0.35, y, w * 0.45, 0.1 * Math.PI, 0.9 * Math.PI);
  ctx.strokeStyle = '#9b6b8a';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.stroke();
}

function drawCheek(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r * 1.3, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(249,168,212,0.55)';
  ctx.fill();
}

interface BunnyParams {
  bodyColor: string;
  earOuter: string;
  earInner: string;
  bodyH: number; // total height reference
}

const MAMA: BunnyParams = {
  bodyColor: '#fbb6ce',  // soft pink
  earOuter: '#f9a8d4',
  earInner: '#fbcfe8',
  bodyH: 120,
};

const BABY: BunnyParams = {
  bodyColor: '#c4b5fd',  // lavender
  earOuter: '#a78bfa',
  earInner: '#ddd6fe',
  bodyH: 80,
};

/**
 * Draw a bunny at a given anchor (bottom-center of body).
 * `armAngle` controls how far the near-side arm reaches (0 = at side, 1 = hugging).
 * `facing` is 1 (facing right) or -1 (facing left).
 */
function drawBunny(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  p: BunnyParams,
  facing: number, // 1 = right, -1 = left
  armAngle: number, // 0..1 animation progress for hug arm
) {
  const scale = p.bodyH / 120; // normalize to mama=1
  const s = (v: number) => v * scale;

  // body (oval)
  const bodyW = s(50);
  const bodyH = s(60);
  const bodyCY = by - bodyH;
  ctx.beginPath();
  ctx.ellipse(bx, bodyCY, bodyW, bodyH, 0, 0, Math.PI * 2);
  ctx.fillStyle = p.bodyColor;
  ctx.fill();

  // head (circle) — larger for kawaii proportions
  const headR = s(32);
  const headCY = bodyCY - bodyH + headR * 0.3;
  ctx.beginPath();
  ctx.arc(bx, headCY, headR, 0, Math.PI * 2);
  ctx.fillStyle = p.bodyColor;
  ctx.fill();

  // ears (wider for softer look)
  const earW = s(16);
  const earH = s(34);
  const earSpread = s(14);
  drawEar(ctx, bx - earSpread, headCY - headR + s(4), earW, earH, p.earOuter, p.earInner, -0.15);
  drawEar(ctx, bx + earSpread, headCY - headR + s(4), earW, earH, p.earOuter, p.earInner, 0.15);

  // eyes (bigger for kawaii)
  const eyeR = s(6);
  const eyeY = headCY - s(2);
  drawBunnyEye(ctx, bx - s(10), eyeY, eyeR);
  drawBunnyEye(ctx, bx + s(10), eyeY, eyeR);

  // nose
  drawBunnyNose(ctx, bx, headCY + s(6), s(7));

  // smile
  drawSmile(ctx, bx, headCY + s(10), s(6));

  // cheeks
  drawCheek(ctx, bx - s(18), headCY + s(4), s(6));
  drawCheek(ctx, bx + s(18), headCY + s(4), s(6));

  // ─── arms ───
  const armLen = s(35);
  const armW = s(10);
  const armOriginY = bodyCY - s(10);

  // far arm (always at side)
  const farSide = -facing;
  ctx.save();
  ctx.translate(bx + farSide * bodyW * 0.85, armOriginY);
  ctx.rotate(farSide * 0.3);
  ctx.beginPath();
  ctx.ellipse(farSide * armLen * 0.35, armLen * 0.3, armW / 2, armLen / 2, farSide * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = p.bodyColor;
  ctx.fill();
  ctx.restore();

  // near arm (hugging arm) — rotates toward the other bunny
  const nearSide = facing;
  const hugRotation = nearSide * (0.3 - armAngle * 1.1); // swings inward
  ctx.save();
  ctx.translate(bx + nearSide * bodyW * 0.85, armOriginY);
  ctx.rotate(hugRotation);
  ctx.beginPath();
  ctx.ellipse(nearSide * armLen * 0.35, armLen * 0.3, armW / 2, armLen / 2, nearSide * 0.3, 0, Math.PI * 2);
  ctx.fillStyle = p.bodyColor;
  ctx.fill();
  ctx.restore();

  // little feet
  const footY = by - s(4);
  ctx.beginPath();
  ctx.ellipse(bx - s(16), footY, s(12), s(6), 0, 0, Math.PI * 2);
  ctx.fillStyle = p.bodyColor;
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(bx + s(16), footY, s(12), s(6), 0, 0, Math.PI * 2);
  ctx.fillStyle = p.bodyColor;
  ctx.fill();

  // pom-pom tail
  const tailX = bx - facing * s(22);
  const tailY = by - s(18);
  ctx.beginPath();
  ctx.arc(tailX, tailY, s(10), 0, Math.PI * 2);
  ctx.fillStyle = p.bodyColor;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(tailX + s(2), tailY - s(2), s(3), 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.fill();
}

/* ─── component ─── */

const HugButton: React.FC = () => {
  const [hugs, setHugs] = useState(0);
  const [hugging, setHugging] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartsRef = useRef<FloatingHeart[]>([]);
  const animRef = useRef(0);
  const hugProgressRef = useRef(0); // 0..1

  const addHearts = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    for (let i = 0; i < 14; i++) {
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

      // ─── animate hug progress ───
      const target = hugProgressRef.current;
      // we store an internal "current" value on the ref object
      if ((hugProgressRef as any)._cur == null) (hugProgressRef as any)._cur = 0;
      const cur = (hugProgressRef as any)._cur as number;
      const next = cur + (target - cur) * 0.12;
      (hugProgressRef as any)._cur = next;

      // ─── bunny positioning ───
      const groundY = h - 20; // bottom of canvas area
      const cx = w / 2;

      // gap between bunnies shrinks with hug
      const maxGap = 60;
      const minGap = -8;
      const gap = maxGap - next * (maxGap - minGap);

      const mamaX = cx - gap / 2 - 15;
      const babyX = cx + gap / 2 + 10;

      // draw mama (facing right toward baby)
      drawBunny(ctx, mamaX, groundY, MAMA, 1, next);
      // draw baby (facing left toward mama)
      drawBunny(ctx, babyX, groundY, BABY, -1, next);

      // ─── floating hearts ───
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
    hugProgressRef.current = 1;
    addHearts();
    setTimeout(() => {
      setHugging(false);
      hugProgressRef.current = 0;
    }, 1400);
  };

  const message = hugs > 0 ? HUG_MESSAGES[(hugs - 1) % HUG_MESSAGES.length] : '';

  return (
    <div className="section">
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 0,
        }}
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
          key={hugs}
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

      <div className="scroll-hint">&darr;</div>
    </div>
  );
};

export default HugButton;
