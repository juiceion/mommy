import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PASTEL_COLORS } from '../utils/colors';
import { ConfettiSystem } from '../canvas/confetti';

const WISHES = [
  'Желаю счастья и любви!', 'Пусть сбудутся все мечты!',
  'Здоровья и радости!', 'Улыбок каждый день!',
  'Тепла и уюта!', 'Вдохновения и сил!',
  'Гармонии и нежности!', 'Пусть всё получается!',
  'Море красоты и света!', 'Бесконечного счастья!',
  'Волшебства в каждом дне!', 'Любви, что согревает!',
];

interface Balloon {
  x: number;
  y: number;
  baseX: number;
  radius: number;
  color: string;
  popped: boolean;
  speed: number;
  wobblePhase: number;
  wobbleAmplitude: number;
  wobbleSpeed: number;
  wishIndex: number;
}

function createBalloon(
  w: number,
  h: number,
  wishIndex: number,
  yOverride?: number,
  isMobile?: boolean,
): Balloon {
  const minR = isMobile ? 25 : 30;
  const maxR = isMobile ? 35 : 42;
  const radius = minR + Math.random() * (maxR - minR);
  const baseX = radius + 30 + Math.random() * (w - 2 * (radius + 30));
  return {
    x: baseX,
    y: yOverride ?? h + radius + 20,
    baseX,
    radius,
    color: PASTEL_COLORS[wishIndex % PASTEL_COLORS.length],
    popped: false,
    speed: 0.4 + Math.random() * 0.4,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleAmplitude: 15 + Math.random() * 15,
    wobbleSpeed: 0.008 + Math.random() * 0.012,
    wishIndex,
  };
}

const BalloonGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const balloonsRef = useRef<Balloon[]>([]);
  const confettiRef = useRef(new ConfettiSystem());
  const animRef = useRef(0);
  const nextWishRef = useRef(0);
  const poppedWishesRef = useRef(new Set<number>());
  const [poppedWish, setPoppedWish] = useState<string | null>(null);
  const [allPopped, setAllPopped] = useState(false);
  const initializedRef = useRef(false);
  const wishTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const initBalloons = useCallback((w: number, h: number) => {
    const isMobile = w < 480;
    const count = isMobile ? 8 : 12;
    const balloons: Balloon[] = [];
    const totalHeight = h + 100; // spread across full height + below

    for (let i = 0; i < count; i++) {
      const staggerY = -100 + (totalHeight / count) * i + Math.random() * 40;
      balloons.push(createBalloon(w, h, i % WISHES.length, staggerY, isMobile));
    }
    nextWishRef.current = count % WISHES.length;
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
      const wobbleX = Math.sin(b.wobblePhase) * b.wobbleAmplitude;
      const bx = b.baseX + wobbleX;
      b.x = bx; // store for hit detection

      // String (curved line from knot downward)
      ctx.beginPath();
      ctx.moveTo(bx, b.y + b.radius);
      ctx.quadraticCurveTo(bx + 8, b.y + b.radius + 25, bx - 5, b.y + b.radius + 45);
      ctx.strokeStyle = 'rgba(91, 44, 111, 0.3)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Balloon body (ellipse)
      ctx.save();
      ctx.beginPath();
      ctx.ellipse(bx, b.y, b.radius * 0.85, b.radius, 0, 0, Math.PI * 2);
      ctx.globalAlpha = 0.85;
      ctx.fillStyle = b.color;
      ctx.fill();
      ctx.restore();

      // Knot triangle at bottom
      ctx.beginPath();
      ctx.moveTo(bx - 4, b.y + b.radius);
      ctx.lineTo(bx, b.y + b.radius + 7);
      ctx.lineTo(bx + 4, b.y + b.radius);
      ctx.closePath();
      ctx.fillStyle = b.color;
      ctx.fill();

      // Highlight (small white ellipse at top-left)
      ctx.beginPath();
      ctx.ellipse(
        bx - b.radius * 0.25,
        b.y - b.radius * 0.3,
        b.radius * 0.18,
        b.radius * 0.32,
        -0.4,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.fill();
    };

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const isMobile = w < 480;
      ctx.clearRect(0, 0, w, h);

      for (const b of balloonsRef.current) {
        if (b.popped) continue;
        b.wobblePhase += b.wobbleSpeed;
        b.y -= b.speed;

        // Recycle when balloon exits top
        if (b.y < -b.radius * 2) {
          const nextIdx = nextWishRef.current;
          nextWishRef.current = (nextWishRef.current + 1) % WISHES.length;
          const minR = isMobile ? 25 : 30;
          const maxR = isMobile ? 35 : 42;
          const newRadius = minR + Math.random() * (maxR - minR);
          b.radius = newRadius;
          b.baseX = newRadius + 30 + Math.random() * (w - 2 * (newRadius + 30));
          b.y = h + newRadius + 20;
          b.color = PASTEL_COLORS[nextIdx % PASTEL_COLORS.length];
          b.speed = 0.4 + Math.random() * 0.4;
          b.wobblePhase = Math.random() * Math.PI * 2;
          b.wobbleAmplitude = 15 + Math.random() * 15;
          b.wobbleSpeed = 0.008 + Math.random() * 0.012;
          b.wishIndex = nextIdx;
          b.popped = false;
        }

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

  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
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
        confettiRef.current.burst(b.x, b.y, 25);

        // Track unique wishes
        poppedWishesRef.current.add(b.wishIndex);

        // Show wish
        if (wishTimerRef.current) clearTimeout(wishTimerRef.current);
        setPoppedWish(WISHES[b.wishIndex]);
        wishTimerRef.current = setTimeout(() => setPoppedWish(null), 2500);

        // Check if all 12 unique wishes collected
        if (poppedWishesRef.current.size >= WISHES.length) {
          setAllPopped(true);
          confettiRef.current.rain(canvas.offsetWidth, 80);
        }
        break;
      }
    }
  }, []);

  return (
    <div className="section" style={{ padding: 0 }}>
      <div
        style={{
          position: 'absolute',
          top: '1rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          background: 'rgba(255, 255, 255, 0.7)',
          backdropFilter: 'blur(6px)',
          WebkitBackdropFilter: 'blur(6px)',
          borderRadius: '999px',
          padding: '0.35rem 1.4rem',
        }}
      >
        <h2
          className="section-title"
          style={{ margin: 0, whiteSpace: 'nowrap' }}
        >
          Лопни шарики!
        </h2>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchStart={handleClick}
        style={{ width: '100%', height: '100%', cursor: 'pointer' }}
      />

      {poppedWish && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background: 'rgba(255, 255, 255, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '1.2rem',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.18)',
            padding: '1.2rem 2rem',
            fontFamily: "'Caveat', cursive",
            fontSize: '1.6rem',
            fontWeight: 700,
            color: '#8B5CF6',
            textAlign: 'center',
            animation: 'fadeIn 0.3s ease',
            pointerEvents: 'none',
            zIndex: 3,
            maxWidth: '85vw',
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
            left: '50%',
            transform: 'translateX(-50%)',
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
