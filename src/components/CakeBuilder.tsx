import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FireworkSystem } from '../canvas/fireworks';

interface CakeStep {
  id: string;
  label: string;
  placed: boolean;
  placeTime: number;
}

const STEP_LABELS = [
  'Добавить нижний слой',
  'Добавить средний слой',
  'Добавить верхний слой',
  'Добавить свечи',
  'Добавить вишенку',
  'Добавить звёздочку',
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

/* ---- drawing helpers ---- */

function scaleForStep(step: CakeStep, now: number): number {
  if (!step.placed) return 0;
  const elapsed = now - step.placeTime;
  if (elapsed >= 300) return 1;
  return elapsed / 300; // linear 0..1
}

function drawPlate(ctx: CanvasRenderingContext2D, cx: number, baseY: number) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, baseY + 8, 110, 14, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#E5E7EB';
  ctx.fill();
  ctx.strokeStyle = '#D1D5DB';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawWavyFrosting(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, color: string,
) {
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(x, y);
  const waves = 6;
  const segW = w / waves;
  for (let i = 0; i < waves; i++) {
    const sx = x + i * segW;
    ctx.bezierCurveTo(
      sx + segW * 0.25, y - 8,
      sx + segW * 0.75, y + 6,
      sx + segW, y,
    );
  }
  ctx.lineTo(x + w, y + 6);
  ctx.lineTo(x, y + 6);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
  ctx.restore();
}

function drawLayer(
  ctx: CanvasRenderingContext2D,
  cx: number, topY: number,
  w: number, h: number,
  gradStart: string, gradEnd: string,
  frostingColor: string,
  scale: number,
) {
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, topY + h / 2);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -(topY + h / 2));

  const x = cx - w / 2;
  const grad = ctx.createLinearGradient(x, topY, x, topY + h);
  grad.addColorStop(0, gradStart);
  grad.addColorStop(1, gradEnd);

  drawRoundedRect(ctx, x, topY, w, h, 10);
  ctx.fillStyle = grad;
  ctx.fill();

  drawWavyFrosting(ctx, x, topY, w, frostingColor);

  ctx.restore();
}

function drawCandles(
  ctx: CanvasRenderingContext2D,
  cx: number, topOfCake: number,
  scale: number, now: number,
) {
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, topOfCake);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -topOfCake);

  const candleW = 4;
  const candleH = 30;
  const positions = [cx - 30, cx, cx + 30];

  for (const px of positions) {
    // candle body
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 0.8;
    const cX = px - candleW / 2;
    const cY = topOfCake - candleH;
    ctx.fillRect(cX, cY, candleW, candleH);
    ctx.strokeRect(cX, cY, candleW, candleH);

    // flame
    const flicker = 1 + 0.2 * Math.sin(now * 0.008 + px);
    const flameRx = 4 * flicker;
    const flameRy = 7 * flicker;
    const flameCy = cY - flameRy;

    const grad = ctx.createRadialGradient(px, flameCy, 0, px, flameCy, flameRy);
    grad.addColorStop(0, '#FDE68A');
    grad.addColorStop(0.5, '#FB923C');
    grad.addColorStop(1, 'rgba(251,146,60,0)');

    ctx.beginPath();
    ctx.ellipse(px, flameCy, flameRx, flameRy, 0, 0, Math.PI * 2);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  ctx.restore();
}

function drawCherry(
  ctx: CanvasRenderingContext2D,
  cx: number, cherryY: number,
  scale: number,
) {
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, cherryY);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -cherryY);

  // cherry body
  ctx.beginPath();
  ctx.arc(cx, cherryY, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#EF4444';
  ctx.fill();

  // stem
  ctx.beginPath();
  ctx.moveTo(cx, cherryY - 7);
  ctx.quadraticCurveTo(cx + 6, cherryY - 22, cx + 2, cherryY - 26);
  ctx.strokeStyle = '#16A34A';
  ctx.lineWidth = 1.8;
  ctx.stroke();

  // highlight
  ctx.beginPath();
  ctx.arc(cx - 2.5, cherryY - 2.5, 2, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  ctx.restore();
}

function drawStar(
  ctx: CanvasRenderingContext2D,
  cx: number, starY: number,
  scale: number,
) {
  if (scale <= 0) return;
  ctx.save();
  ctx.translate(cx, starY);
  ctx.scale(scale, scale);
  ctx.translate(-cx, -starY);

  const spikes = 5;
  const outerR = 15;
  const innerR = 7;
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
  ctx.fillStyle = '#FDE68A';
  ctx.fill();
  ctx.strokeStyle = '#F59E0B';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

/* ---- component ---- */

const CakeBuilder: React.FC = () => {
  const [steps, setSteps] = useState<CakeStep[]>(createSteps);
  const [completed, setCompleted] = useState(false);

  const cakeCanvasRef = useRef<HTMLCanvasElement>(null);
  const fwCanvasRef = useRef<HTMLCanvasElement>(null);
  const fireworkRef = useRef(new FireworkSystem());
  const animRef = useRef(0);
  const stepsRef = useRef(steps);
  stepsRef.current = steps;

  const isStep = (id: string) => stepsRef.current.find(s => s.id === id);

  /* ---- cake draw loop ---- */
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
    const baseY = h - 40;

    // Plate
    drawPlate(ctx, cx, baseY);

    // Bottom layer
    const bottomStep = isStep('bottom')!;
    const bottomScale = scaleForStep(bottomStep, now);
    const bottomH = 50;
    const bottomY = baseY - bottomH;
    drawLayer(ctx, cx, bottomY, 180, bottomH, '#FBCFE8', '#F9A8D4', '#EC4899', bottomScale);

    // Middle layer
    const middleStep = isStep('middle')!;
    const middleScale = scaleForStep(middleStep, now);
    const middleH = 45;
    const middleY = bottomY - middleH;
    drawLayer(ctx, cx, middleY, 140, middleH, '#E9D5FF', '#C4B5FD', '#8B5CF6', middleScale);

    // Top layer
    const topStep = isStep('top')!;
    const topScale = scaleForStep(topStep, now);
    const topH = 40;
    const topY = middleY - topH;
    drawLayer(ctx, cx, topY, 100, topH, '#A7F3D0', '#6EE7B7', '#10B981', topScale);

    // Candles
    const candleStep = isStep('candles')!;
    const candleScale = scaleForStep(candleStep, now);
    drawCandles(ctx, cx, topY, candleScale, now);

    // Cherry
    const cherryStep = isStep('cherry')!;
    const cherryScale = scaleForStep(cherryStep, now);
    const cherryY = topY - 30 - 12;
    drawCherry(ctx, cx, cherryY, cherryScale);

    // Star
    const starStep = isStep('star')!;
    const starScale = scaleForStep(starStep, now);
    const starY = cherryY - 28;
    drawStar(ctx, cx, starY, starScale);

    ctx.restore();
  }, []);

  /* ---- firework draw loop ---- */
  const drawFireworks = useCallback((now: number) => {
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

  /* ---- unified animation loop ---- */
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

  /* ---- kick a draw whenever steps change ---- */
  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, [steps, loop]);

  /* ---- place a step ---- */
  const placeStep = useCallback((index: number) => {
    const now = performance.now();
    setSteps(prev => {
      const next = prev.map((s, i) =>
        i === index ? { ...s, placed: true, placeTime: now } : s,
      );
      const allPlaced = next.every(s => s.placed);
      if (allPlaced) {
        setCompleted(true);
        // launch fireworks with a small delay so the canvas is ready
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
      {/* Firework overlay */}
      <canvas
        ref={fwCanvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      <h2 className="section-title" style={{ zIndex: 1 }}>
        Собери торт для мамы!
      </h2>

      {/* Cake canvas */}
      <canvas
        ref={cakeCanvasRef}
        style={{
          width: '300px',
          height: '350px',
          maxWidth: '90vw',
          zIndex: 1,
          display: 'block',
          marginBottom: '1.2rem',
        }}
      />

      {/* Buttons */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.6rem',
          justifyContent: 'center',
          maxWidth: '400px',
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
                padding: '0.55rem 1.1rem',
                borderRadius: '12px',
                border: 'none',
                fontSize: '0.95rem',
                cursor: disabled ? 'default' : 'pointer',
                opacity: disabled ? 0.4 : 1,
                background: isNext
                  ? 'linear-gradient(135deg, #F9A8D4, #C4B5FD)'
                  : step.placed
                    ? '#E5E7EB'
                    : '#F3F4F6',
                color: isNext ? '#fff' : '#6B7280',
                fontWeight: isNext ? 600 : 400,
                transition: 'all 0.25s ease',
                boxShadow: isNext
                  ? '0 4px 14px rgba(196,181,253,0.4)'
                  : 'none',
              }}
            >
              {step.label}
            </button>
          );
        })}
      </div>

      {completed && (
        <div
          className="handwritten"
          style={{
            marginTop: '1.5rem',
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
