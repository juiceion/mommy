import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FireworkSystem } from '../canvas/fireworks';

interface CakeStep {
  id: string;
  label: string;
  placed: boolean;
  placeTime: number;
}

const STEP_LABELS = [
  'Нижний слой',
  'Средний слой',
  'Верхний слой',
  'Свечи',
  'Вишенка',
  'Звёздочка',
];

const STEP_IDS = ['bottom', 'middle', 'top', 'candles', 'cherry', 'star'];

function createSteps(): CakeStep[] {
  return STEP_IDS.map((id, i) => ({
    id,
    label: STEP_LABELS[i],
    placed: false,
    placeTime: 0,
  }));
}

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function scaleForStep(step: CakeStep, now: number): number {
  if (!step.placed) return 0;
  const elapsed = now - step.placeTime;
  if (elapsed >= 500) return 1;
  return easeOutBack(Math.min(elapsed / 500, 1));
}

function drawPlate(ctx: CanvasRenderingContext2D, cx: number, baseY: number, plateW: number) {
  // Shadow
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 12, plateW * 0.48, 10, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.fill();

  // Plate body
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 4, plateW * 0.52, 16, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#F8F9FA';
  ctx.fill();
  ctx.strokeStyle = '#E5E7EB';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Plate rim highlight
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 2, plateW * 0.48, 12, 0, 0, Math.PI);
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ctx.fill();
  ctx.restore();
}

function drawCakeLayer(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topY: number,
  w: number,
  h: number,
  color1: string,
  color2: string,
  frostColor: string,
  frostDrip: boolean,
  scale: number,
) {
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, topY + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -(topY + h / 2));

  const x = cx - w / 2;
  const r = 14;

  // Layer shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.08)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  // Main body
  const grad = ctx.createLinearGradient(x, topY, x + w, topY + h);
  grad.addColorStop(0, color1);
  grad.addColorStop(1, color2);
  ctx.beginPath();
  ctx.moveTo(x + r, topY);
  ctx.lineTo(x + w - r, topY);
  ctx.quadraticCurveTo(x + w, topY, x + w, topY + r);
  ctx.lineTo(x + w, topY + h);
  ctx.lineTo(x, topY + h);
  ctx.lineTo(x, topY + r);
  ctx.quadraticCurveTo(x, topY, x + r, topY);
  ctx.closePath();
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.restore();

  // Cream stripe at the top
  ctx.beginPath();
  ctx.moveTo(x + r, topY);
  ctx.lineTo(x + w - r, topY);
  ctx.quadraticCurveTo(x + w, topY, x + w, topY + r);
  ctx.lineTo(x + w, topY + 8);
  ctx.lineTo(x, topY + 8);
  ctx.lineTo(x, topY + r);
  ctx.quadraticCurveTo(x, topY, x + r, topY);
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.25)';
  ctx.fill();

  // Frosting drips on top
  if (frostDrip) {
    ctx.beginPath();
    ctx.moveTo(x - 2, topY);

    // Smooth wavy top
    const segs = 8;
    const segW = (w + 4) / segs;
    for (let i = 0; i < segs; i++) {
      const sx = x - 2 + i * segW;
      const peakY = topY - 6 - Math.random() * 3;
      ctx.bezierCurveTo(
        sx + segW * 0.3, peakY,
        sx + segW * 0.7, topY - 2,
        sx + segW, topY - 1,
      );
    }

    ctx.lineTo(x + w + 2, topY + 10);
    ctx.lineTo(x - 2, topY + 10);
    ctx.closePath();
    ctx.fillStyle = frostColor;
    ctx.fill();

    // Drips going down
    const dripPositions = [0.15, 0.35, 0.6, 0.8];
    for (const dp of dripPositions) {
      const dripX = x + w * dp;
      const dripLen = 12 + Math.random() * 18;
      const dripW = 5 + Math.random() * 3;

      ctx.beginPath();
      ctx.moveTo(dripX - dripW / 2, topY + 6);
      ctx.quadraticCurveTo(dripX - dripW / 2, topY + 6 + dripLen * 0.6, dripX, topY + 6 + dripLen);
      ctx.quadraticCurveTo(dripX + dripW / 2, topY + 6 + dripLen * 0.6, dripX + dripW / 2, topY + 6);
      ctx.closePath();
      ctx.fillStyle = frostColor;
      ctx.fill();
    }
  }

  ctx.restore();
}

function drawCandles(
  ctx: CanvasRenderingContext2D,
  cx: number,
  topOfCake: number,
  scale: number,
  now: number,
) {
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, topOfCake);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -topOfCake);

  const candleW = 7;
  const candleH = 35;
  const positions = [cx - 28, cx, cx + 28];
  const candleColors = ['#F9A8D4', '#C4B5FD', '#93C5FD'];
  const stripeColors = ['#FBCFE8', '#DDD6FE', '#BFDBFE'];

  positions.forEach((px, idx) => {
    const cX = px - candleW / 2;
    const cY = topOfCake - candleH;

    // Candle body
    ctx.fillStyle = candleColors[idx];
    ctx.beginPath();
    ctx.roundRect(cX, cY, candleW, candleH, 3);
    ctx.fill();

    // Stripe
    ctx.fillStyle = stripeColors[idx];
    for (let s = 0; s < 3; s++) {
      ctx.fillRect(cX, cY + 5 + s * 10, candleW, 4);
    }

    // Wick
    ctx.beginPath();
    ctx.moveTo(px, cY);
    ctx.lineTo(px, cY - 6);
    ctx.strokeStyle = '#6B7280';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Flame
    const t = now * 0.005 + idx * 2.1;
    const flickerX = Math.sin(t) * 1.5;
    const flickerScale = 0.9 + 0.15 * Math.sin(t * 1.3);
    const flameX = px + flickerX;
    const flameY = cY - 6;

    // Outer glow
    const glow = ctx.createRadialGradient(flameX, flameY - 6, 0, flameX, flameY - 4, 14 * flickerScale);
    glow.addColorStop(0, 'rgba(253, 230, 138, 0.4)');
    glow.addColorStop(1, 'rgba(253, 230, 138, 0)');
    ctx.beginPath();
    ctx.arc(flameX, flameY - 5, 14 * flickerScale, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();

    // Flame shape (teardrop)
    ctx.beginPath();
    const fh = 11 * flickerScale;
    const fw = 4.5 * flickerScale;
    ctx.moveTo(flameX, flameY - fh);
    ctx.bezierCurveTo(flameX - fw, flameY - fh * 0.5, flameX - fw, flameY, flameX, flameY + 2);
    ctx.bezierCurveTo(flameX + fw, flameY, flameX + fw, flameY - fh * 0.5, flameX, flameY - fh);
    const fGrad = ctx.createLinearGradient(flameX, flameY - fh, flameX, flameY + 2);
    fGrad.addColorStop(0, '#FDE68A');
    fGrad.addColorStop(0.4, '#FB923C');
    fGrad.addColorStop(1, '#EF4444');
    ctx.fillStyle = fGrad;
    ctx.fill();

    // Inner bright core
    ctx.beginPath();
    ctx.ellipse(flameX, flameY - 2, 2 * flickerScale, 4 * flickerScale, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fill();
  });

  ctx.restore();
}

function drawCherry(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cherryY: number,
  scale: number,
) {
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, cherryY);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cherryY);

  const r = 10;

  // Shadow
  ctx.beginPath();
  ctx.ellipse(cx + 2, cherryY + r - 2, r * 0.7, 3, 0, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.fill();

  // Cherry body
  ctx.beginPath();
  ctx.arc(cx, cherryY, r, 0, Math.PI * 2);
  const cGrad = ctx.createRadialGradient(cx - 3, cherryY - 3, 1, cx, cherryY, r);
  cGrad.addColorStop(0, '#F87171');
  cGrad.addColorStop(1, '#DC2626');
  ctx.fillStyle = cGrad;
  ctx.fill();

  // Highlight
  ctx.beginPath();
  ctx.ellipse(cx - 3, cherryY - 3, 3, 4, -0.5, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.fill();

  // Stem
  ctx.beginPath();
  ctx.moveTo(cx + 1, cherryY - r + 2);
  ctx.bezierCurveTo(cx + 4, cherryY - r - 12, cx + 12, cherryY - r - 16, cx + 8, cherryY - r - 22);
  ctx.strokeStyle = '#16A34A';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.stroke();

  // Leaf
  ctx.beginPath();
  ctx.moveTo(cx + 8, cherryY - r - 14);
  ctx.bezierCurveTo(cx + 16, cherryY - r - 18, cx + 18, cherryY - r - 10, cx + 10, cherryY - r - 10);
  ctx.fillStyle = '#22C55E';
  ctx.fill();

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  starY: number,
  scale: number,
  now: number,
) {
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, starY);
  const pulse = 1 + 0.06 * Math.sin(now * 0.003);
  ctx.scale(scale * pulse, scale * pulse);
  ctx.translate(-cx, -starY);

  const spikes = 5;
  const outerR = 18;
  const innerR = 8;

  // Glow
  const glow = ctx.createRadialGradient(cx, starY, 0, cx, starY, outerR * 1.8);
  glow.addColorStop(0, 'rgba(253, 230, 138, 0.35)');
  glow.addColorStop(1, 'rgba(253, 230, 138, 0)');
  ctx.beginPath();
  ctx.arc(cx, starY, outerR * 1.8, 0, Math.PI * 2);
  ctx.fillStyle = glow;
  ctx.fill();

  // Star body
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = starY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();

  const sGrad = ctx.createLinearGradient(cx, starY - outerR, cx, starY + outerR);
  sGrad.addColorStop(0, '#FDE68A');
  sGrad.addColorStop(1, '#F59E0B');
  ctx.fillStyle = sGrad;
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Inner highlight
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? outerR * 0.5 : innerR * 0.5;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * r;
    const y = starY + Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fill();

  ctx.restore();
}

/* ---- Component ---- */

const CakeBuilder: React.FC = () => {
  const [steps, setSteps] = useState<CakeStep[]>(createSteps);
  const [completed, setCompleted] = useState(false);

  const cakeCanvasRef = useRef<HTMLCanvasElement>(null);
  const fwCanvasRef = useRef<HTMLCanvasElement>(null);
  const fireworkRef = useRef(new FireworkSystem());
  const animRef = useRef(0);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const getStep = (id: string) => stepsRef.current.find(s => s.id === id)!;

  const drawCake = useCallback((now: number) => {
    const canvas = cakeCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const cx = w / 2;
    const baseY = h - 30;

    // Plate
    drawPlate(ctx, cx, baseY, 220);

    // Bottom layer - widest, pink
    const bottomScale = scaleForStep(getStep('bottom'), now);
    const bH = 55;
    const bW = 200;
    const bY = baseY - bH + 4;
    drawCakeLayer(ctx, cx, bY, bW, bH, '#FBCFE8', '#F472B6', '#EC4899', true, bottomScale);

    // Middle layer - lavender
    const middleScale = scaleForStep(getStep('middle'), now);
    const mH = 48;
    const mW = 150;
    const mY = bY - mH + 4;
    drawCakeLayer(ctx, cx, mY, mW, mH, '#E9D5FF', '#C4B5FD', '#A78BFA', true, middleScale);

    // Top layer - mint, smallest
    const topScale = scaleForStep(getStep('top'), now);
    const tH = 42;
    const tW = 105;
    const tY = mY - tH + 4;
    drawCakeLayer(ctx, cx, tY, tW, tH, '#A7F3D0', '#6EE7B7', '#34D399', true, topScale);

    // Candles on top of the top layer
    const candleScale = scaleForStep(getStep('candles'), now);
    drawCandles(ctx, cx, tY + 2, candleScale, now);

    // Cherry
    const cherryScale = scaleForStep(getStep('cherry'), now);
    drawCherry(ctx, cx, tY - 38, cherryScale);

    // Star
    const starScale = scaleForStep(getStep('star'), now);
    drawStar(ctx, cx, tY - 62, starScale, now);

    ctx.restore();
  }, []);

  const drawFireworks = useCallback((_now: number) => {
    const canvas = fwCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
    }

    ctx.save();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    fireworkRef.current.update();
    fireworkRef.current.draw(ctx);
    ctx.globalAlpha = 1;
    ctx.restore();
  }, []);

  const loop = useCallback((ts: number) => {
    drawCake(ts);

    if (fireworkRef.current.isActive) {
      drawFireworks(ts);
    }

    const hasCandles = stepsRef.current.find(s => s.id === 'candles')?.placed;
    const fwActive = fireworkRef.current.isActive;

    if (hasCandles || fwActive) {
      animRef.current = requestAnimationFrame(loop);
    }
  }, [drawCake, drawFireworks]);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [steps, loop]);

  const placeStep = useCallback((index: number) => {
    const now = performance.now();
    setSteps(prev => {
      const next = prev.map((s, i) =>
        i === index ? { ...s, placed: true, placeTime: now } : s,
      );
      const allPlaced = next.every(s => s.placed);
      if (allPlaced) {
        setCompleted(true);
        requestAnimationFrame(() => {
          const fwCanvas = fwCanvasRef.current;
          if (fwCanvas) {
            fireworkRef.current.launchMultiple(
              fwCanvas.offsetWidth,
              fwCanvas.offsetHeight,
              5,
            );
          }
        });
      }
      return next;
    });
  }, []);

  const nextIndex = steps.findIndex(s => !s.placed);

  return (
    <div className="section">
      <canvas
        ref={fwCanvasRef}
        style={{
          position: 'absolute',
          top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      <h2 className="section-title" style={{ zIndex: 1 }}>
        Собери торт для мамы!
      </h2>

      <canvas
        ref={cakeCanvasRef}
        style={{
          width: 'min(340px, 85vw)',
          height: 'min(380px, 50vh)',
          zIndex: 1,
          display: 'block',
          marginBottom: '1rem',
        }}
      />

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.5rem',
          justifyContent: 'center',
          maxWidth: 'min(450px, 90vw)',
          zIndex: 1,
        }}
      >
        {steps.map((step, i) => {
          const isNext = i === nextIndex;
          const disabled = step.placed || !isNext;
          return (
            <button
              key={step.id}
              className={isNext ? 'btn' : undefined}
              disabled={disabled}
              onClick={() => placeStep(i)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                border: 'none',
                fontSize: '0.9rem',
                fontFamily: "'Comfortaa', sans-serif",
                cursor: disabled ? 'default' : 'pointer',
                opacity: step.placed ? 0.35 : disabled ? 0.5 : 1,
                background: isNext
                  ? 'linear-gradient(135deg, #F9A8D4, #C4B5FD)'
                  : step.placed
                    ? '#E5E7EB'
                    : '#F3F4F6',
                color: isNext ? '#fff' : step.placed ? '#9CA3AF' : '#6B7280',
                fontWeight: isNext ? 600 : 400,
                transition: 'all 0.3s ease',
                boxShadow: isNext
                  ? '0 4px 14px rgba(196,181,253,0.5)'
                  : 'none',
                textDecoration: step.placed ? 'line-through' : 'none',
              }}
            >
              {step.placed ? `✓ ${step.label}` : step.label}
            </button>
          );
        })}
      </div>

      {completed && (
        <div
          className="handwritten"
          style={{
            marginTop: '1.2rem',
            fontSize: '1.8rem',
            color: '#5B2C6F',
            animation: 'fadeIn 0.5s ease',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          Идеальный торт для идеальной мамы!
        </div>
      )}

      <div className="scroll-hint">{'\u2193'}</div>
    </div>
  );
};

export default CakeBuilder;
