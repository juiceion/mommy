import React, { useState, useRef, useEffect, useCallback } from 'react';
import { ConfettiSystem } from '../canvas/confetti';

const Envelope: React.FC = () => {
  const [opened, setOpened] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const confettiRef = useRef(new ConfettiSystem());
  const animRef = useRef(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    confettiRef.current.update();
    confettiRef.current.draw(ctx);
    if (confettiRef.current.isActive) {
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

  const handleOpen = () => {
    if (opened) return;
    setOpened(true);
    const canvas = canvasRef.current!;
    confettiRef.current.burst(canvas.offsetWidth / 2, canvas.offsetHeight / 2, 80);
    animRef.current = requestAnimationFrame(animate);
  };

  return (
    <div className="section" style={{ cursor: opened ? 'default' : 'pointer' }} onClick={handleOpen}>
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 2 }}
      />

      {/* Envelope */}
      <div
        style={{
          position: 'relative',
          width: '260px',
          height: '180px',
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
            borderRadius: '12px',
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
          {/* Heart seal */}
          {!opened && (
            <div
              className="envelope-heart"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                marginLeft: '-12px',
                marginTop: '-18px',
                zIndex: 4,
                animation: 'pulse 2s infinite',
              }}
            />
          )}
        </div>

        {/* Card sliding out */}
        <div
          style={{
            position: 'absolute',
            top: opened ? '-100%' : '10%',
            left: '10%',
            width: '80%',
            height: '80%',
            background: 'white',
            borderRadius: '10px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            transition: 'top 0.8s ease 0.3s, opacity 0.5s ease 0.3s',
            opacity: opened ? 1 : 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5,
            padding: '1rem',
          }}
        >
          <p className="handwritten" style={{ fontSize: '1.3rem', textAlign: 'center', color: '#5B2C6F' }}>
            Открытка для самой лучшей мамы!
          </p>
        </div>
      </div>

      {!opened && (
        <p style={{ marginTop: '2rem', fontSize: '1.1rem', opacity: 0.7, animation: 'pulse 2s infinite' }}>
          Нажми, чтобы открыть
        </p>
      )}

      {opened && (
        <div className="scroll-hint">↓</div>
      )}
    </div>
  );
};

export default Envelope;
