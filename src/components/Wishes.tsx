import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PASTEL_COLORS } from '../utils/colors';

interface Wish {
  emoji: string;
  text: string;
}

const WISHES: Wish[] = [
  { emoji: '🌸', text: 'Пусть каждый день начинается с улыбки и приносит маленькие радости!' },
  { emoji: '☀️', text: 'Желаю крепкого здоровья, энергии и сил на всё, о чём мечтаешь!' },
  { emoji: '🌷', text: 'Пусть рядом всегда будут люди, которые любят и ценят тебя!' },
  { emoji: '🦋', text: 'Желаю ярких путешествий, новых впечатлений и незабываемых моментов!' },
  { emoji: '✨', text: 'Пусть сбудутся все мечты — даже те, о которых ты ещё не загадала!' },
  { emoji: '💖', text: 'Мамочка, ты заслуживаешь всего самого лучшего. Я всегда рядом!' },
];

interface Sparkle {
  x: number;
  y: number;
  size: number;
  alpha: number;
  color: string;
  vx: number;
  vy: number;
  life: number;
}

const Wishes: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [animClass, setAnimClass] = useState<'enter' | 'exit' | ''>('enter');
  const [started, setStarted] = useState(false);
  const [allSeen, setAllSeen] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);
  const sparklesRef = useRef<Sparkle[]>([]);
  const timeRef = useRef(0);

  // IntersectionObserver
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) {
          setStarted(true);
        }
      },
      { threshold: 0.5 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [started]);

  // Auto-progress timer
  useEffect(() => {
    if (!started || allSeen) return;

    timerRef.current = setTimeout(() => {
      goToNext();
    }, 4000);

    return () => clearTimeout(timerRef.current);
  }, [currentIndex, started, allSeen]);

  const spawnSparkles = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const cx = canvas.offsetWidth / 2;
    const cy = canvas.offsetHeight / 2;

    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 3;
      sparklesRef.current.push({
        x: cx,
        y: cy,
        size: 2 + Math.random() * 3,
        alpha: 1,
        color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 0,
      });
    }
  }, []);

  const goToNext = useCallback(() => {
    setAnimClass('exit');
    setTimeout(() => {
      setCurrentIndex(prev => {
        const next = prev + 1;
        if (next >= WISHES.length) {
          setAllSeen(true);
          return 0;
        }
        return next;
      });
      spawnSparkles();
      setAnimClass('enter');
    }, 300);
  }, [spawnSparkles]);

  const handleTap = useCallback(() => {
    clearTimeout(timerRef.current);
    goToNext();
  }, [goToNext]);

  // Canvas animation
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
      timeRef.current += 1;

      // Floating petals (ambient)
      ctx.save();
      for (let i = 0; i < 6; i++) {
        const px = ((timeRef.current * 0.3 + i * 200) % (w + 100)) - 50;
        const py = h * 0.2 + Math.sin(timeRef.current * 0.01 + i * 1.5) * h * 0.3;
        const size = 6 + i * 1.5;
        const alpha = 0.2 + Math.sin(timeRef.current * 0.02 + i) * 0.1;

        ctx.globalAlpha = alpha;
        ctx.fillStyle = PASTEL_COLORS[i % PASTEL_COLORS.length];
        ctx.beginPath();
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(timeRef.current * 0.005 + i);
        // Petal shape
        ctx.moveTo(0, -size);
        ctx.bezierCurveTo(size * 0.8, -size * 0.6, size * 0.6, size * 0.4, 0, size);
        ctx.bezierCurveTo(-size * 0.6, size * 0.4, -size * 0.8, -size * 0.6, 0, -size);
        ctx.fill();
        ctx.restore();
      }
      ctx.restore();

      // Sparkles
      ctx.save();
      sparklesRef.current = sparklesRef.current.filter(s => s.life < 40);
      for (const s of sparklesRef.current) {
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.05;
        s.vx *= 0.98;
        s.vy *= 0.98;
        s.life += 1;
        s.alpha = Math.max(0, 1 - s.life / 40);

        ctx.globalAlpha = s.alpha;
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const wish = WISHES[currentIndex];

  return (
    <div className="section" ref={sectionRef} onClick={handleTap} style={{ cursor: 'pointer' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      <h2 className="section-title" style={{ zIndex: 1 }}>
        Пожелания для тебя
      </h2>

      <div
        style={{
          zIndex: 1,
          width: 'min(380px, 85vw)',
          background: 'rgba(255,255,255,0.75)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          borderRadius: '24px',
          padding: '2rem 1.5rem',
          boxShadow: '0 8px 32px rgba(168,85,247,0.15)',
          border: '1px solid rgba(236,72,153,0.12)',
          textAlign: 'center',
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: animClass === 'exit' ? 0 : 1,
          transform: animClass === 'exit' ? 'translateY(-20px)' : animClass === 'enter' ? 'translateY(0)' : undefined,
          animation: animClass === 'enter' ? 'fadeIn 0.5s ease' : undefined,
        }}
      >
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{wish.emoji}</div>
        <p
          className="handwritten"
          style={{
            fontSize: '1.35rem',
            lineHeight: 1.7,
            color: '#1E3A2F',
          }}
        >
          {wish.text}
        </p>
      </div>

      {/* Progress dots */}
      <div style={{ zIndex: 1, display: 'flex', gap: '8px', marginTop: '1.5rem' }}>
        {WISHES.map((_, i) => (
          <div
            key={i}
            style={{
              width: i === currentIndex ? '24px' : '8px',
              height: '8px',
              borderRadius: '4px',
              background: i === currentIndex ? '#EC4899' : 'rgba(168,85,247,0.3)',
              transition: 'all 0.3s ease',
            }}
          />
        ))}
      </div>

      {!allSeen && (
        <p
          style={{
            zIndex: 1,
            fontSize: '0.85rem',
            color: '#7C3AED',
            opacity: 0.5,
            marginTop: '1rem',
          }}
        >
          нажми для следующего
        </p>
      )}

      {allSeen && <div className="scroll-hint">{'\u2193'}</div>}
    </div>
  );
};

export default Wishes;
