import React, { useState, useEffect, useRef } from 'react';

interface MeterItem {
  label: string;
  value: string;
  target: number;
  suffix: string;
}

const METERS: MeterItem[] = [
  { label: 'Раз сказала "надень шапку"', value: '', target: 9999, suffix: '+' },
  { label: 'Уровень кулинарного мастерства', value: '', target: 999, suffix: '/10' },
  { label: 'Обнимашек выдано', value: '', target: 1000000, suffix: '+' },
  { label: 'Терпение', value: '', target: 0, suffix: '' },
];

const MamaMeter: React.FC = () => {
  const [visible, setVisible] = useState(false);
  const [counts, setCounts] = useState<number[]>(METERS.map(() => 0));
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sparklesRef = useRef<{ x: number; y: number; vx: number; vy: number; alpha: number; size: number; color: string }[]>([]);
  const animRef = useRef(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.4 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Animate counters
  useEffect(() => {
    if (!visible) return;
    const duration = 2000;
    const start = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const t = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setCounts(METERS.map(m => Math.round(m.target * ease)));
      if (t >= 1) clearInterval(interval);
    }, 16);

    return () => clearInterval(interval);
  }, [visible]);

  // Sparkle canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const colors = ['#FDE68A', '#F9A8D4', '#C4B5FD', '#FFFFFF'];

    const addSparkles = () => {
      if (!visible) return;
      for (let i = 0; i < 3; i++) {
        sparklesRef.current.push({
          x: canvas.offsetWidth * 0.2 + Math.random() * canvas.offsetWidth * 0.6,
          y: canvas.offsetHeight * 0.2 + Math.random() * canvas.offsetHeight * 0.6,
          vx: (Math.random() - 0.5) * 2,
          vy: (Math.random() - 0.5) * 2 - 1,
          alpha: 1,
          size: 2 + Math.random() * 3,
          color: colors[Math.floor(Math.random() * colors.length)],
        });
      }
    };

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);

      if (visible && Math.random() > 0.7) addSparkles();

      for (const s of sparklesRef.current) {
        s.x += s.vx;
        s.y += s.vy;
        s.alpha -= 0.015;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.globalAlpha = Math.max(0, s.alpha);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      sparklesRef.current = sparklesRef.current.filter(s => s.alpha > 0);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [visible]);

  const formatNumber = (n: number) => n.toLocaleString('ru-RU');

  return (
    <div className="section" ref={sectionRef}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <h2 className="section-title" style={{ zIndex: 1 }}>Мама-метр</h2>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '1.5rem',
          maxWidth: '500px',
          width: '100%',
          zIndex: 1,
        }}
      >
        {METERS.map((meter, i) => (
          <div
            key={i}
            style={{
              background: 'rgba(255,255,255,0.6)',
              backdropFilter: 'blur(8px)',
              borderRadius: '16px',
              padding: '1.2rem 1.5rem',
              boxShadow: '0 4px 15px rgba(196, 181, 253, 0.15)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(20px)',
              transition: `all 0.6s ease ${i * 0.15}s`,
            }}
          >
            <div style={{ fontSize: '0.95rem', marginBottom: '0.5rem', opacity: 0.8 }}>
              {meter.label}
            </div>
            <div className="handwritten" style={{ fontSize: '2rem', fontWeight: 700, color: '#8B5CF6' }}>
              {meter.target === 0 ? (
                <span>
                  <span style={{ color: '#A7F3D0', letterSpacing: '2px' }}>████████████</span>
                  {' '}БЕЗЛИМИТ
                </span>
              ) : (
                `${formatNumber(counts[i])}${meter.suffix}`
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default MamaMeter;
