import React, { useState, useEffect, useRef } from 'react';

const GREETING_TEXT = `Дорогая мамочка!

Ты — самый важный человек в моей жизни. Спасибо тебе за терпение, заботу и тепло. Ты делаешь мир вокруг светлее и добрее.

С Днём Рождения! Желаю тебе счастья, здоровья, ярких путешествий и чтобы каждый день приносил радость и вдохновение!`;

const Greeting: React.FC = () => {
  const [displayText, setDisplayText] = useState('');
  const [started, setStarted] = useState(false);
  const [showCursor, setShowCursor] = useState(true);
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef(0);

  // Start typing when section is visible
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [started]);

  // Typewriter effect
  useEffect(() => {
    if (!started) return;
    let idx = 0;
    const interval = setInterval(() => {
      idx++;
      setDisplayText(GREETING_TEXT.slice(0, idx));
      if (idx >= GREETING_TEXT.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [started]);

  // Blinking cursor
  useEffect(() => {
    const interval = setInterval(() => setShowCursor(v => !v), 530);
    return () => clearInterval(interval);
  }, []);

  // Glow canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    let phase = 0;

    const resize = () => {
      canvas.width = canvas.offsetWidth * dpr;
      canvas.height = canvas.offsetHeight * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      phase += 0.02;
      const alpha = 0.08 + Math.sin(phase) * 0.05;
      const gradient = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.min(w, h) * 0.5);
      gradient.addColorStop(0, `rgba(249, 168, 212, ${alpha})`);
      gradient.addColorStop(0.5, `rgba(196, 181, 253, ${alpha * 0.5})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
      animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <div className="section" ref={sectionRef}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}
      />
      <div
        style={{
          maxWidth: '600px',
          zIndex: 1,
          background: 'rgba(255, 255, 255, 0.6)',
          backdropFilter: 'blur(10px)',
          borderRadius: '20px',
          padding: '2.5rem',
          boxShadow: '0 8px 32px rgba(196, 181, 253, 0.2)',
        }}
      >
        <p
          className="handwritten"
          style={{
            fontSize: '1.5rem',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            color: '#5B2C6F',
          }}
        >
          {displayText}
          <span style={{ opacity: showCursor ? 1 : 0, transition: 'opacity 0.1s' }}>|</span>
        </p>
      </div>
      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default Greeting;
