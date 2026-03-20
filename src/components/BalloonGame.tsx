import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PASTEL_COLORS } from '../utils/colors';
import { ConfettiSystem } from '../canvas/confetti';

const WISHES = [
  'Счастья!', 'Здоровья!', 'Любви!', 'Радости!',
  'Улыбок!', 'Тепла!', 'Удачи!', 'Вдохновения!',
  'Гармонии!', 'Нежности!', 'Красоты!', 'Мечтаний!',
  'Уюта!', 'Волшебства!', 'Света!',
];

interface Balloon {
  x: number; y: number;
  radius: number;
  color: string;
  popped: boolean;
  wobblePhase: number;
  wobbleSpeed: number;
  wish: string;
}

const BalloonGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balloonsRef = useRef<Balloon[]>([]);
  const confettiRef = useRef(new ConfettiSystem());
  const animRef = useRef(0);
  const [poppedWish, setPoppedWish] = useState<string | null>(null);
  const [poppedCount, setPoppedCount] = useState(0);
  const [allPopped, setAllPopped] = useState(false);
  const initializedRef = useRef(false);

  const initBalloons = useCallback((w: number, h: number) => {
    const balloons: Balloon[] = [];
    const count = 15;
    const cols = 5;
    const rows = 3;
    const cellW = w / cols;
    const cellH = (h * 0.7) / rows;

    for (let i = 0; i < count; i++) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      balloons.push({
        x: cellW * col + cellW / 2 + (Math.random() - 0.5) * cellW * 0.3,
        y: h * 0.15 + cellH * row + cellH / 2 + (Math.random() - 0.5) * cellH * 0.3,
        radius: 28 + Math.random() * 12,
        color: PASTEL_COLORS[i % PASTEL_COLORS.length],
        popped: false,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: 0.02 + Math.random() * 0.02,
        wish: WISHES[i % WISHES.length],
      });
    }
    balloonsRef.current = balloons;
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
      if (!initializedRef.current) {
        initBalloons(canvas.offsetWidth, canvas.offsetHeight);
        initializedRef.current = true;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const drawBalloon = (b: Balloon) => {
      if (b.popped) return;
      const wobbleX = Math.sin(b.wobblePhase) * 3;
      const bx = b.x + wobbleX;

      // String
      ctx.beginPath();
      ctx.moveTo(bx, b.y + b.radius);
      ctx.quadraticCurveTo(bx + 5, b.y + b.radius + 20, bx - 3, b.y + b.radius + 40);
      ctx.strokeStyle = 'rgba(91, 44, 111, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Balloon body
      ctx.beginPath();
      ctx.ellipse(bx, b.y, b.radius * 0.85, b.radius, 0, 0, Math.PI * 2);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 0.85;
      ctx.fill();

      // Knot
      ctx.beginPath();
      ctx.moveTo(bx - 4, b.y + b.radius);
      ctx.lineTo(bx, b.y + b.radius + 6);
      ctx.lineTo(bx + 4, b.y + b.radius);
      ctx.fillStyle = b.color;
      ctx.globalAlpha = 1;
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.ellipse(bx - b.radius * 0.25, b.y - b.radius * 0.3, b.radius * 0.2, b.radius * 0.35, -0.4, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fill();
    };

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      for (const b of balloonsRef.current) {
        b.wobblePhase += b.wobbleSpeed;
        drawBalloon(b);
      }

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
  }, [initBalloons]);

  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    for (const b of balloonsRef.current) {
      if (b.popped) continue;
      const dx = x - b.x;
      const dy = y - b.y;
      if (dx * dx + dy * dy < b.radius * b.radius) {
        b.popped = true;
        confettiRef.current.burst(b.x, b.y, 20);
        setPoppedWish(b.wish);
        const newCount = poppedCount + 1;
        setPoppedCount(newCount);
        setTimeout(() => setPoppedWish(null), 1500);

        if (newCount >= balloonsRef.current.length) {
          setAllPopped(true);
          confettiRef.current.rain(canvas.offsetWidth, 80);
        }
        break;
      }
    }
  };

  return (
    <div className="section" style={{ padding: 0 }}>
      <h2 className="section-title" style={{ position: 'absolute', top: '1rem', zIndex: 2 }}>
        Лопни шарики!
      </h2>

      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchStart={handleClick}
        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
      />

      {poppedWish && (
        <div
          className="handwritten"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '2.5rem',
            fontWeight: 700,
            color: '#8B5CF6',
            textShadow: '0 4px 20px rgba(139, 92, 246, 0.3)',
            animation: 'fadeIn 0.3s ease',
            pointerEvents: 'none',
            zIndex: 3,
          }}
        >
          {poppedWish}
        </div>
      )}

      {allPopped && (
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            textAlign: 'center',
            zIndex: 3,
            animation: 'fadeIn 0.5s ease',
          }}
        >
          <p className="handwritten" style={{ fontSize: '2rem', color: '#5B2C6F' }}>
            Все пожелания — для тебя!
          </p>
        </div>
      )}

      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default BalloonGame;
