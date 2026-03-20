import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PASTEL_COLORS } from '../utils/colors';
import { ConfettiSystem } from '../canvas/confetti';

const SEGMENTS = [
  { short: 'Лучшая мама!', long: 'Ты самая невероятная мама на свете! Твоя любовь делает мир ярче и теплее каждый день!' },
  { short: 'Обними маму!', long: 'Обними маму крепко-крепко 3 раза и скажи, как сильно ты её любишь!' },
  { short: 'Королева!', long: 'Мама — настоящая королева! Корона невидимая, но все вокруг её чувствуют!' },
  { short: 'Скажи "люблю"!', long: 'Скажи маме "Я тебя люблю" 5 раз подряд — каждый раз нежнее предыдущего!' },
  { short: 'Красавица!', long: 'Ты самая красивая мама во всей вселенной, и это не комплимент — это научный факт!' },
  { short: 'Чай для мамы!', long: 'Приготовь маме самый вкусный чай с любовью, печенькой и обнимашкой в подарок!' },
];

const RouletteWheel: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef(new ConfettiSystem());
  const animRef = useRef(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const angleRef = useRef(0);
  const velocityRef = useRef(0);

  const getCanvasSize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return { w: 0, h: 0, cx: 0, cy: 0, r: 0 };
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) * 0.38;
    return { w, h, cx, cy, r };
  }, []);

  const drawWheel = useCallback((ctx: CanvasRenderingContext2D) => {
    const { w, h, cx, cy, r } = getCanvasSize();
    ctx.clearRect(0, 0, w, h);

    const segCount = SEGMENTS.length;
    const segAngle = (Math.PI * 2) / segCount;

    // Shadow under wheel
    ctx.beginPath();
    ctx.ellipse(cx, cy + 8, r + 5, r * 0.15, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(91, 44, 111, 0.06)';
    ctx.fill();

    // Draw segments
    for (let i = 0; i < segCount; i++) {
      const startAngle = angleRef.current + i * segAngle;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = PASTEL_COLORS[i % PASTEL_COLORS.length];
      ctx.globalAlpha = 0.9;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      // Text — short label
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#5B2C6F';
      ctx.globalAlpha = 1;
      const fontSize = Math.max(11, r * 0.085);
      ctx.font = `600 ${fontSize}px Comfortaa`;
      ctx.fillText(SEGMENTS[i].short, r * 0.55, fontSize * 0.35);
      ctx.restore();
    }

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 4;
    ctx.globalAlpha = 1;
    ctx.stroke();

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.14, 0, Math.PI * 2);
    const centerGrad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r * 0.14);
    centerGrad.addColorStop(0, '#FFFFFF');
    centerGrad.addColorStop(1, '#F3E8FF');
    ctx.fillStyle = centerGrad;
    ctx.globalAlpha = 1;
    ctx.fill();
    ctx.strokeStyle = '#F9A8D4';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointer (top) — prettier triangle
    const pointerY = cy - r - 10;
    ctx.beginPath();
    ctx.moveTo(cx, pointerY + 20);
    ctx.lineTo(cx - 14, pointerY - 8);
    ctx.lineTo(cx + 14, pointerY - 8);
    ctx.closePath();
    const pointerGrad = ctx.createLinearGradient(cx, pointerY - 8, cx, pointerY + 20);
    pointerGrad.addColorStop(0, '#F472B6');
    pointerGrad.addColorStop(1, '#C084FC');
    ctx.fillStyle = pointerGrad;
    ctx.fill();
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Confetti
    confettiRef.current.update();
    confettiRef.current.draw(ctx);
    ctx.globalAlpha = 1;
  }, [getCanvasSize]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      drawWheel(ctx);
    };
    resize();
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, [drawWheel]);

  const spin = () => {
    if (spinning) return;
    setSpinning(true);
    setResult(null);
    velocityRef.current = 0.15 + Math.random() * 0.1;

    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const { cx, cy } = getCanvasSize();

    const animate = () => {
      angleRef.current += velocityRef.current;
      velocityRef.current *= 0.985;

      drawWheel(ctx);

      if (velocityRef.current > 0.001) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        const segCount = SEGMENTS.length;
        const segAngle = (Math.PI * 2) / segCount;
        const normalizedAngle = (((-angleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        const pointerAngle = (normalizedAngle + Math.PI / 2) % (Math.PI * 2);
        const segmentIndex = Math.floor(pointerAngle / segAngle) % segCount;
        setResult(SEGMENTS[segmentIndex].long);
        setSpinning(false);
        confettiRef.current.burst(cx, cy, 50);
        animRef.current = requestAnimationFrame(function drawConfetti() {
          drawWheel(ctx);
          if (confettiRef.current.isActive) {
            animRef.current = requestAnimationFrame(drawConfetti);
          }
        });
      }
    };

    animRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="section">
      <h2 className="section-title" style={{ zIndex: 1 }}>Мамина рулетка</h2>

      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: '380px',
        aspectRatio: '1',
        maxHeight: '50vh',
        zIndex: 1,
      }}>
        <canvas
          ref={canvasRef}
          style={{ width: '100%', height: '100%' }}
        />
      </div>

      <button
        className="btn"
        onClick={spin}
        disabled={spinning}
        style={{
          marginTop: '1rem',
          zIndex: 1,
          opacity: spinning ? 0.6 : 1,
        }}
      >
        {spinning ? 'Крутится...' : 'Крутить!'}
      </button>

      {result && (
        <div
          style={{
            marginTop: '1.5rem',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '1.5rem 2rem',
            maxWidth: '340px',
            boxShadow: '0 8px 30px rgba(196, 181, 253, 0.3)',
            animation: 'fadeIn 0.4s ease',
            zIndex: 1,
            textAlign: 'center',
          }}
        >
          <p className="handwritten" style={{ fontSize: '1.4rem', color: '#5B2C6F', lineHeight: 1.4 }}>
            {result}
          </p>
        </div>
      )}

      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default RouletteWheel;
