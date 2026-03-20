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
  'Ты — счастье!',
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
  slot: number; // fixed position slot index
  rotation: number;
}

// Pre-defined slots that avoid center (where button/title are)
// Each slot: [x%, y%] — positioned around edges, not overlapping center
const COMPLIMENT_SLOTS: [number, number][] = [
  [5, 8], [55, 5], [75, 10], [85, 25],
  [8, 75], [60, 80], [80, 75], [5, 30],
  [70, 88], [15, 88], [90, 50], [3, 55],
];

const DontPressButton: React.FC = () => {
  const [presses, setPresses] = useState(0);
  const [compliments, setCompliments] = useState<FlyingCompliment[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const heartBurstRef = useRef(new HeartBurst());
  const animRef = useRef(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const idCounter = useRef(0);
  const nextSlotRef = useRef(0);

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
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
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

    heartBurstRef.current.burst(clientX - rect.left, clientY - rect.top, 8);
    cancelAnimationFrame(animRef.current);
    animRef.current = requestAnimationFrame(animate);

    // Use next slot in rotation
    const slot = nextSlotRef.current;
    nextSlotRef.current = (nextSlotRef.current + 1) % COMPLIMENT_SLOTS.length;

    const id = idCounter.current++;
    const text = COMPLIMENTS[id % COMPLIMENTS.length];
    const rotation = (Math.random() - 0.5) * 20;

    setCompliments(prev => {
      // Remove any compliment already in this slot
      const filtered = prev.filter(c => c.slot !== slot);
      return [...filtered.slice(-6), { id, text, slot, rotation }];
    });

    setTimeout(() => {
      setCompliments(prev => prev.filter(c => c.id !== id));
    }, 2500);
  };

  const btnText = BUTTON_TEXTS[Math.min(presses, BUTTON_TEXTS.length - 1)];

  return (
    <div className="section" ref={sectionRef} style={{ position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      />

      {/* Flying compliments — positioned in fixed slots around edges */}
      {compliments.map(c => {
        const [sx, sy] = COMPLIMENT_SLOTS[c.slot];
        return (
          <div
            key={c.id}
            className="handwritten"
            style={{
              position: 'absolute',
              left: `${sx}%`,
              top: `${sy}%`,
              fontSize: '1.4rem',
              fontWeight: 700,
              color: '#8B5CF6',
              transform: `rotate(${c.rotation}deg)`,
              animation: 'fadeIn 0.3s ease',
              pointerEvents: 'none',
              zIndex: 1,
              textShadow: '0 2px 10px rgba(139, 92, 246, 0.3)',
              whiteSpace: 'nowrap',
              maxWidth: '40vw',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {c.text}
          </div>
        );
      })}

      <h2 className="section-title" style={{ zIndex: 3 }}>Секретная кнопка</h2>

      <button
        className="btn"
        onClick={handlePress}
        style={{
          fontSize: '1.3rem',
          padding: '1rem 2.5rem',
          zIndex: 3,
          animation: presses > 0 ? 'shake 0.5s ease' : undefined,
          background: presses > 3
            ? 'linear-gradient(135deg, #F472B6, #A78BFA)'
            : undefined,
        }}
      >
        {btnText}
      </button>

      {presses > 0 && (
        <p style={{ marginTop: '1rem', fontSize: '0.9rem', opacity: 0.6, zIndex: 3 }}>
          Нажато раз: {presses}
        </p>
      )}

      <div className="scroll-hint">{'\u2193'}</div>
    </div>
  );
};

export default DontPressButton;
