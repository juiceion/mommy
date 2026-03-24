import React, { useState, useRef, useEffect, useCallback } from 'react';
import { drawTulip, drawDaisy, drawCherryBlossom, drawButterfly } from '../canvas/flowers';

interface PlantedFlower {
  id: number;
  x: number; // normalized 0-1
  y: number; // normalized 0-1
  type: 'tulip' | 'daisy' | 'cherry';
  color: string;
  plantTime: number;
  growthDuration: number;
}

const FLOWER_COLORS = ['#EC4899', '#FB7185', '#A855F7', '#F43F5E', '#F472B6'];
const FLOWER_TYPES: PlantedFlower['type'][] = ['tulip', 'daisy', 'cherry'];
const REQUIRED_FLOWERS = 8;
const MAX_FLOWERS = 15;
const GROUND_Y_RATIO = 0.72;

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

interface ButterflyState {
  x: number;
  y: number;
  vx: number;
  vy: number;
  phase: number;
  color: string;
  size: number;
}

function createButterfly(w: number, h: number): ButterflyState {
  return {
    x: Math.random() * w,
    y: h * 0.2 + Math.random() * h * 0.4,
    vx: (Math.random() - 0.5) * 1.5,
    vy: (Math.random() - 0.5) * 0.8,
    phase: Math.random() * Math.PI * 2,
    color: FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)],
    size: 10 + Math.random() * 6,
  };
}

const SpringGarden: React.FC = () => {
  const [flowers, setFlowers] = useState<PlantedFlower[]>([]);
  const [completed, setCompleted] = useState(false);
  const [started, setStarted] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const animRef = useRef(0);
  const flowersRef = useRef(flowers);
  flowersRef.current = flowers;
  const butterfliesRef = useRef<ButterflyState[]>([]);
  const nextIdRef = useRef(0);

  // IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setStarted(true);
      },
      { threshold: 0.3 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Animation loop
  useEffect(() => {
    if (!started) return;
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
      const now = performance.now();
      ctx.clearRect(0, 0, w, h);

      const groundY = h * GROUND_Y_RATIO;

      // Draw ground
      ctx.save();
      const groundGrad = ctx.createLinearGradient(0, groundY - 5, 0, h);
      groundGrad.addColorStop(0, 'rgba(34,197,94,0.12)');
      groundGrad.addColorStop(0.3, 'rgba(34,197,94,0.08)');
      groundGrad.addColorStop(1, 'rgba(34,197,94,0.03)');
      ctx.fillStyle = groundGrad;

      // Wavy ground line
      ctx.beginPath();
      ctx.moveTo(0, groundY);
      for (let x = 0; x <= w; x += 20) {
        const wave = Math.sin(x * 0.02 + now * 0.001) * 3;
        ctx.lineTo(x, groundY + wave);
      }
      ctx.lineTo(w, h);
      ctx.lineTo(0, h);
      ctx.closePath();
      ctx.fill();
      ctx.restore();

      // Draw grass tufts
      ctx.save();
      ctx.strokeStyle = 'rgba(34,197,94,0.3)';
      ctx.lineWidth = 1.5;
      ctx.lineCap = 'round';
      for (let x = 10; x < w; x += 25) {
        const wave = Math.sin(x * 0.02 + now * 0.001) * 3;
        const baseY = groundY + wave;
        const sway = Math.sin(now * 0.002 + x * 0.1) * 3;
        ctx.beginPath();
        ctx.moveTo(x, baseY);
        ctx.lineTo(x + sway - 2, baseY - 8 - Math.random() * 4);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + 5, baseY);
        ctx.lineTo(x + 5 + sway + 2, baseY - 10 - Math.random() * 3);
        ctx.stroke();
      }
      ctx.restore();

      // Draw flowers
      for (const flower of flowersRef.current) {
        const elapsed = now - flower.plantTime;
        const progress = Math.min(1, elapsed / flower.growthDuration);
        const growth = easeOutBack(Math.min(progress, 1));
        const flowerX = flower.x * w;
        const flowerGroundY = groundY + Math.sin(flowerX * 0.02 + now * 0.001) * 3;
        const stemHeight = 50 + flower.y * 30; // taller flowers closer to ground line
        const size = 12 + flower.y * 5;
        const sway = Math.sin(now * 0.002 + flower.x * 5) * 3;

        if (flower.type === 'tulip') {
          drawTulip(ctx, flowerX, flowerGroundY, stemHeight, size, flower.color, sway, growth);
        } else if (flower.type === 'daisy') {
          drawDaisy(ctx, flowerX, flowerGroundY, stemHeight, size, sway, growth);
        } else {
          drawCherryBlossom(ctx, flowerX, flowerGroundY, stemHeight, size, flower.color, sway, growth);
        }
      }

      // Butterflies (appear after completion)
      if (completed) {
        if (butterfliesRef.current.length < 3) {
          butterfliesRef.current.push(createButterfly(w, h));
        }
        for (const b of butterfliesRef.current) {
          b.x += b.vx;
          b.y += b.vy + Math.sin(now * 0.003 + b.phase) * 0.5;
          b.phase += 0.12;

          // Bounce off edges
          if (b.x < 20 || b.x > w - 20) b.vx *= -1;
          if (b.y < h * 0.1 || b.y > h * 0.6) b.vy *= -1;

          drawButterfly(ctx, b.x, b.y, b.size, b.phase, b.color);
        }
      }

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [started, completed]);

  const handleTap = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (flowers.length >= MAX_FLOWERS) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    let clientX: number, clientY: number;

    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const nx = (clientX - rect.left) / rect.width;
    const ny = (clientY - rect.top) / rect.height;

    // Only plant in the ground area
    if (ny < GROUND_Y_RATIO - 0.15 || ny > 0.95) return;
    if (nx < 0.05 || nx > 0.95) return;

    // Check distance from existing flowers
    const tooClose = flowers.some(f => {
      const dx = f.x - nx;
      const dy = f.y - ny;
      return Math.sqrt(dx * dx + dy * dy) < 0.07;
    });
    if (tooClose) return;

    const id = nextIdRef.current++;
    const type = FLOWER_TYPES[id % FLOWER_TYPES.length];
    const color = FLOWER_COLORS[Math.floor(Math.random() * FLOWER_COLORS.length)];

    const newFlower: PlantedFlower = {
      id,
      x: nx,
      y: ny - GROUND_Y_RATIO + 0.5, // normalized height
      type,
      color,
      plantTime: performance.now(),
      growthDuration: 1200 + Math.random() * 600,
    };

    const updated = [...flowers, newFlower];
    setFlowers(updated);

    if (updated.length >= REQUIRED_FLOWERS && !completed) {
      setCompleted(true);
    }
  }, [flowers, completed]);

  return (
    <div className="section" ref={sectionRef}>
      <h2
        className="section-title"
        style={{ zIndex: 2, position: 'relative', pointerEvents: 'none' }}
      >
        Вырасти сад для мамы!
      </h2>

      {flowers.length === 0 && started && (
        <p
          style={{
            zIndex: 2,
            position: 'relative',
            pointerEvents: 'none',
            fontSize: '1.1rem',
            color: '#7C3AED',
            opacity: 0.8,
            animation: 'pulse 2s infinite',
          }}
        >
          Нажимай, чтобы посадить цветы 🌱
        </p>
      )}

      <canvas
        ref={canvasRef}
        onClick={handleTap}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          cursor: flowers.length < MAX_FLOWERS ? 'pointer' : 'default',
        }}
      />

      {completed && (
        <div
          className="handwritten"
          style={{
            position: 'relative',
            zIndex: 2,
            marginTop: '0.5rem',
            fontSize: '1.6rem',
            color: '#1E3A2F',
            textAlign: 'center',
            animation: 'fadeIn 0.8s ease',
            background: 'rgba(255,255,255,0.7)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            padding: '0.8rem 1.5rem',
            borderRadius: '16px',
            pointerEvents: 'none',
          }}
        >
          Этот сад для тебя, мамочка! 🌸
        </div>
      )}

      <div className="scroll-hint">{'\u2193'}</div>
    </div>
  );
};

export default SpringGarden;
