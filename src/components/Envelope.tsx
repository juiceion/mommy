import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ConfettiSystem } from '../canvas/confetti';
import { FireworkSystem } from '../canvas/fireworks';

const Envelope: React.FC = () => {
  const [opened, setOpened] = useState(false);
  const [showBtn, setShowBtn] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef(new ConfettiSystem());
  const fireworkRef = useRef(new FireworkSystem());
  const animRef = useRef(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;
    ctx.clearRect(0, 0, w, h);

    confettiRef.current.update();
    confettiRef.current.draw(ctx);

    fireworkRef.current.update();
    fireworkRef.current.draw(ctx);

    if (confettiRef.current.isActive || fireworkRef.current.isActive) {
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

  const handleOpen = () => {
    if (opened) return;
    setOpened(true);
    const canvas = canvasRef.current!;
    const w = canvas.offsetWidth;
    const h = canvas.offsetHeight;

    // Confetti burst immediately
    confettiRef.current.burst(w / 2, h / 2, 80);
    animRef.current = requestAnimationFrame(animate);

    // Fireworks after 300ms
    setTimeout(() => {
      fireworkRef.current.launchMultiple(w, h, 4);
      // Restart animation if it stopped
      cancelAnimationFrame(animRef.current);
      animRef.current = requestAnimationFrame(animate);
    }, 300);

    // Show scroll button after 1.5s
    setTimeout(() => setShowBtn(true), 1500);
  };

  const scrollDown = () => {
    const section = (canvasRef.current?.closest('.section') as HTMLElement)?.nextElementSibling;
    section?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="section" style={{ cursor: opened ? 'default' : 'pointer' }} onClick={handleOpen}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }}
      />

      {/* Envelope */}
      <div
        style={{
          position: 'relative',
          width: 'min(280px, 80vw)',
          height: 'min(200px, 55vw)',
          perspective: '800px',
          zIndex: 1,
        }}
      >
        {/* Envelope body */}
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, #FECDD3, #E9D5FF)',
            borderRadius: '14px',
            boxShadow: '0 8px 30px rgba(196, 181, 253, 0.3)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Flap */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '50%',
              background: 'linear-gradient(180deg, #F9A8D4, #DDD6FE)',
              clipPath: 'polygon(0 0, 50% 100%, 100% 0)',
              transformOrigin: 'top center',
              transform: opened ? 'rotateX(180deg)' : 'rotateX(0deg)',
              transition: 'transform 0.8s ease',
              zIndex: 3,
            }}
          />
          {/* Empty - heart removed by user request */}
        </div>

        {/* Card sliding out */}
        <div
          style={{
            position: 'absolute',
            top: opened ? '-55%' : '10%',
            left: '5%',
            width: '90%',
            minHeight: '80%',
            background: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'top 0.8s ease 0.3s, opacity 0.5s ease 0.3s',
            opacity: opened ? 1 : 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            padding: '1.2rem',
          }}
        >
          <p className="handwritten" style={{ fontSize: '1.2rem', textAlign: 'center', color: '#5B2C6F', lineHeight: 1.5 }}>
            Дорогая мамочка!
          </p>
          <p className="handwritten" style={{ fontSize: '1rem', textAlign: 'center', color: '#8B5CF6', lineHeight: 1.4, marginTop: '0.4rem' }}>
            Эта открытка — маленькое путешествие, которое я создал специально для тебя!
          </p>
        </div>
      </div>

      {!opened && (
        <p className="handwritten" style={{ marginTop: '2rem', fontSize: '1.3rem', opacity: 0.7, animation: 'pulse 2s infinite', color: '#8B5CF6' }}>
          Нажми, чтобы открыть
        </p>
      )}

      {opened && showBtn && (
        <button
          className="btn"
          onClick={(e) => { e.stopPropagation(); scrollDown(); }}
          style={{
            marginTop: '2rem',
            animation: 'fadeIn 0.5s ease',
            zIndex: 11,
          }}
        >
          Листай вниз
        </button>
      )}
    </div>
  );
};

export default Envelope;
