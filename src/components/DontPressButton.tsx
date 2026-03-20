import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HeartBurst } from '../canvas/hearts';

const COMPLIMENTS = [
  'Ты самая лучшая!',
  'Красавица!',
  'Солнышко!',
  'Королева!',
  'Мамуля-красотуля!',
  'Ты — чудо!',
  'Самая добрая!',
  'Ты сияешь!',
  'Лучшая на свете!',
  'Ты — вдохновение!',
  'Самая мудрая!',
  'Бесценная!',
  'Ты — свет!',
  'Самая нежная!',
  'Золотая мамочка!',
];

const BUTTON_TEXTS = [
  'Не нажимать!',
  'Ну ладно, ещё разок',
  'Хватит!',
  'Ну серьёзно, хватит!',
  'Ой, всё...',
  'Ещё?!',
  'Ладно, жми 😄',
];

interface FlyingCompliment {
  id: number;
  text: string;
  x: number;
  y: number;
  rotation: number;
}

const DontPressButton: React.FC = () => {
  const [presses, setPresses] = useState(0);
  const [compliments, setCompliments] = useState<FlyingCompliment[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartBurstRef = useRef(new HeartBurst());
  const animRef = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    heartBurstRef.current.update();
    heartBurstRef.current.draw(ctx);
    if (heartBurstRef.current.isActive) {
      animRef.current = requestAnimationFrame(animate);
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      const ctx = canvas.getContext('2d')!;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animRef.current);
    };
  }, []);

  const handlePress = (e: React.MouseEvent | React.TouchEvent) => {
    setPresses(p => p + 1);

    const section = sectionRef.current!;
    const rect = section.getBoundingClientRect();
    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    // Heart burst at click position
    heartBurstRef.current.burst(clientX - rect.left, clientY - rect.top, 8);
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    // Flying compliment
    const id = idCounter.current++;
    const text = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
    const x = 10 + Math.random() * 60;
    const y = 10 + Math.random() * 60;
    const rotation = (Math.random() - 0.5) * 30;

    setCompliments(prev => [...prev.slice(-8), { id, text, x, y, rotation }]);

    setTimeout(() => {
      setCompliments(prev => prev.filter(c => c.id !== id));
    }, 2000);
  };

  const btnText = BUTTON_TEXTS[Math.min(presses, BUTTON_TEXTS.length - 1)];

  return (
    <div className="section" ref={sectionRef} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      />

      {/* Flying compliments */}
      {compliments.map(c => (
        <div
          key={c.id}
          className="handwritten"
          style={{
            position: 'absolute',
            left: `${c.x}%`,
            top: `${c.y}%`,
            fontSize: '1.5rem',
            fontWeight: 700,
            color: '#8B5CF6',
            transform: `rotate(${c.rotation}deg)`,
            animation: 'fadeIn 0.3s ease',
            pointerEvents: 'none',
            zIndex: 1,
            textShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
          }}
        >
          {c.text}
        </div>
      ))}

      <h2 className="section-title" style={{ zIndex: 1 }}>Секретная кнопка</h2>

      <button
        className="btn"
        onClick={handlePress}
        style={{
          fontSize: '1.3rem',
          padding: '1rem 2.5rem',
          zIndex: 1,
          animation: presses > 0 ? 'shake 0.5s ease' : undefined,
          background: presses > 3
            ? 'linear-gradient(135deg, #F472B6, #A78BFA)'
            : undefined,
        }}
      >
        {btnText}
      </button>

      {presses > 0 && (
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.6, zIndex: 1 }}>
          Нажато раз: {presses}
        </p>
      )}

      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default DontPressButton;
