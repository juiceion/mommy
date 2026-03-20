import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PASTEL_COLORS } from '../utils/colors';
import { ConfettiSystem } from '../canvas/confetti';

const SEGMENTS = [
  'Ты лучшая мама!',
  'Обними маму 3 раза',
  'Мама — королева!',
  'Скажи "люблю" 5 раз',
  'Самая красивая!',
  'Приготовь маме чай',
  'Бесконечная любовь!',
  'Расскажи маме комплимент',
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
    const r = Math.min(w, h) * 0.35;
    return { w, h, cx, cy, r };
  }, []);

  const drawWheel = useCallback((ctx: CanvasRenderingContext2D) => {
    const { w, h, cx, cy, r } = getCanvasSize();
    ctx.clearRect(0, 0, w, h);

    const segAngle = (Math.PI * 2) / SEGMENTS.length;

    // Draw segments
    for (let i = 0; i < SEGMENTS.length; i++) {
      const startAngle = angleRef.current + i * segAngle;
      const endAngle = startAngle + segAngle;

      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = PASTEL_COLORS[i % PASTEL_COLORS.length];
      ctx.globalAlpha = 0.85;
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.8)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Text
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(startAngle + segAngle / 2);
      ctx.textAlign = 'right';
      ctx.fillStyle = '#5B2C6F';
      ctx.globalAlpha = 1;
      ctx.font = `${Math.max(10, r * 0.09)}px Comfortaa`;

      const text = SEGMENTS[i];
      const maxWidth = r * 0.7;
      // Simple word wrap
      const words = text.split(' ');
      const lines: string[] = [];
      let currentLine = '';
      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if (ctx.measureText(testLine).width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      const lineHeight = r * 0.11;
      const offsetY = -((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, li) => {
        ctx.fillText(line, r * 0.85, offsetY + li * lineHeight + 4);
      });

      ctx.restore();
    }

    // Center circle
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.15, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.globalAlpha = 1;
    ctx.fill();
    ctx.strokeStyle = '#F9A8D4';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Pointer (top)
    ctx.beginPath();
    ctx.moveTo(cx, cy - r - 15);
    ctx.lineTo(cx - 12, cy - r - 35);
    ctx.lineTo(cx + 12, cy - r - 35);
    ctx.closePath();
    ctx.fillStyle = '#F472B6';
    ctx.fill();

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
      velocityRef.current *= 0.985; // Ease out

      drawWheel(ctx);

      if (velocityRef.current > 0.001) {
        animRef.current = requestAnimationFrame(animate);
      } else {
        // Determine result
        const segAngle = (Math.PI * 2) / SEGMENTS.length;
        const normalizedAngle = (((-angleRef.current % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2));
        // Pointer is at top (-PI/2), so adjust
        const pointerAngle = (normalizedAngle + Math.PI / 2) % (Math.PI * 2);
        const segmentIndex = Math.floor(pointerAngle / segAngle) % SEGMENTS.length;
        setResult(SEGMENTS[segmentIndex]);
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

      <div style={{ position: 'relative', width: '100%', maxWidth: '400px', height: '400px', zIndex: 1 }}>
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
          className="handwritten"
          style={{
            marginTop: '1rem',
            fontSize: '1.6rem',
            color: '#5B2C6F',
            animation: 'fadeIn 0.4s ease',
            textAlign: 'center',
            zIndex: 1,
            maxWidth: '300px',
          }}
        >
          {result}
        </div>
      )}

      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default RouletteWheel;
