import React, { useState, useEffect, useRef } from 'react';
import { ConfettiSystem } from '../canvas/confetti';
import { drawSimpleFlower } from '../canvas/flowers';

const GREETING_TEXT = `Дорогая мамочка!

С Днём Рождения! 🌸

Ты — весна моей жизни, самый тёплый и родной человек на свете.

Спасибо за каждый день, за твою любовь, нежность и заботу. Ты делаешь мир прекраснее просто тем, что ты есть.

Пусть этот день будет таким же светлым и красивым, как ты сама!

Эта маленькая открытка — с любовью для тебя ♡`;

type Phase = 'closed' | 'opening' | 'typing' | 'done';

const GreetingCard: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('closed');
  const [displayText, setDisplayText] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef(new ConfettiSystem());
  const animRef = useRef(0);
  const timeRef = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);

  // Canvas animation (decorative flowers + confetti)
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

    const flowerDeco = [
      { x: 0.08, y: 0.12, size: 18, color: '#EC4899', center: '#FACC15', rot: 0.3 },
      { x: 0.92, y: 0.1, size: 15, color: '#A855F7', center: '#FACC15', rot: -0.2 },
      { x: 0.06, y: 0.88, size: 14, color: '#FB7185', center: '#FDE047', rot: 0.5 },
      { x: 0.94, y: 0.9, size: 16, color: '#EC4899', center: '#FACC15', rot: -0.4 },
      { x: 0.15, y: 0.5, size: 12, color: '#A855F7', center: '#FDE047', rot: 0.1 },
      { x: 0.87, y: 0.55, size: 13, color: '#FB7185', center: '#FACC15', rot: -0.1 },
    ];

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      timeRef.current += 1;

      // Decorative flowers
      for (const f of flowerDeco) {
        const bobY = Math.sin(timeRef.current * 0.015 + f.rot * 5) * 4;
        drawSimpleFlower(ctx, f.x * w, f.y * h + bobY, f.size, f.color, f.center, f.rot + timeRef.current * 0.002);
      }

      // Confetti
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
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (phase !== 'typing') return;
    let i = 0;
    const timer = setInterval(() => {
      i++;
      setDisplayText(GREETING_TEXT.slice(0, i));
      // Auto-scroll to bottom
      if (cardRef.current) {
        cardRef.current.scrollTop = cardRef.current.scrollHeight;
      }
      if (i >= GREETING_TEXT.length) {
        clearInterval(timer);
        setPhase('done');
      }
    }, 30);
    return () => clearInterval(timer);
  }, [phase]);

  const handleOpen = () => {
    if (phase !== 'closed') return;
    setPhase('opening');

    // Fire confetti
    const canvas = canvasRef.current;
    if (canvas) {
      confettiRef.current.burst(canvas.offsetWidth / 2, canvas.offsetHeight / 2, 80);
    }

    setTimeout(() => setPhase('typing'), 900);
  };

  return (
    <div className="section" onClick={handleOpen} style={{ cursor: phase === 'closed' ? 'pointer' : 'default' }}>
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute', top: 0, left: 0,
          width: '100%', height: '100%',
          pointerEvents: 'none', zIndex: 0,
        }}
      />

      {/* Closed card */}
      {phase === 'closed' && (
        <div
          style={{
            zIndex: 1,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            animation: 'fadeIn 0.8s ease',
          }}
        >
          <div
            style={{
              width: 'min(300px, 80vw)',
              height: 'min(200px, 35dvh)',
              background: 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.15))',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              borderRadius: '20px',
              border: '2px solid rgba(236,72,153,0.25)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 32px rgba(168,85,247,0.2)',
            }}
          >
            <div style={{ fontSize: '4rem', marginBottom: '0.5rem' }}>💌</div>
            <div className="handwritten" style={{ fontSize: '1.6rem', color: '#1E3A2F' }}>
              Для мамочки
            </div>
          </div>
          <p
            className="handwritten"
            style={{
              marginTop: '1.5rem',
              fontSize: '1.3rem',
              color: '#7C3AED',
              animation: 'pulse 2s infinite',
            }}
          >
            Нажми, чтобы открыть ✉
          </p>
        </div>
      )}

      {/* Opening / Typing / Done */}
      {phase !== 'closed' && (
        <div
          ref={cardRef}
          style={{
            zIndex: 1,
            width: 'min(360px, 88vw)',
            maxHeight: 'min(500px, 78dvh)',
            overflowY: 'auto',
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            borderRadius: '20px',
            padding: '2rem 1.5rem',
            boxShadow: '0 8px 32px rgba(168,85,247,0.2)',
            border: '1px solid rgba(236,72,153,0.15)',
            animation: phase === 'opening' ? 'fadeIn 0.8s ease' : undefined,
            scrollbarWidth: 'none',
          }}
        >
          <div
            style={{
              fontFamily: "'Nunito', sans-serif",
              fontSize: '1.1rem',
              lineHeight: 1.8,
              color: '#1E3A2F',
              whiteSpace: 'pre-wrap',
              minHeight: '200px',
            }}
          >
            {displayText}
            {phase === 'typing' && (
              <span
                style={{
                  display: 'inline-block',
                  width: '2px',
                  height: '1.2em',
                  background: '#EC4899',
                  marginLeft: '2px',
                  animation: 'pulse 0.8s infinite',
                  verticalAlign: 'text-bottom',
                }}
              />
            )}
          </div>
        </div>
      )}

      {phase === 'done' && <div className="scroll-hint">{'\u2193'}</div>}
    </div>
  );
};

export default GreetingCard;
