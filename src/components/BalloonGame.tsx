import React, { useRef, useEffect, useState, useCallback } from 'react';
import { PASTEL_COLORS } from '../utils/colors';
import { ConfettiSystem } from '../canvas/confetti';

const TARGET_PHRASE = 'С ДНЁМ РОЖДЕНИЯ';
const TARGET_LETTERS = TARGET_PHRASE.split('');

// Decoys are only letters that exist in the target phrase (shuffled)
const PHRASE_UNIQUE_LETTERS = [...new Set(TARGET_PHRASE.replace(/ /g, '').split(''))];

interface FloatingLetter {
  x: number;
  y: number;
  baseX: number;
  letter: string;
  shape: 'star' | 'heart' | 'circle';
  color: string;
  radius: number;
  speed: number;
  wobblePhase: number;
  wobbleAmplitude: number;
  wobbleSpeed: number;
  collected: boolean;
  popAnim: number; // 0 = no pop, >0 = pop animation frames remaining
}

const SHAPES: FloatingLetter['shape'][] = ['star', 'heart', 'circle'];

function createFloatingLetter(
  w: number,
  h: number,
  letter: string,
  yOverride?: number,
  isMobile?: boolean,
): FloatingLetter {
  const minR = isMobile ? 22 : 28;
  const maxR = isMobile ? 30 : 36;
  const radius = minR + Math.random() * (maxR - minR);
  const baseX = radius + 30 + Math.random() * (w - 2 * (radius + 30));
  return {
    x: baseX,
    y: yOverride ?? h + radius + 20,
    baseX,
    letter,
    shape: SHAPES[Math.floor(Math.random() * SHAPES.length)],
    color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
    radius,
    speed: 0.35 + Math.random() * 0.35,
    wobblePhase: Math.random() * Math.PI * 2,
    wobbleAmplitude: 12 + Math.random() * 12,
    wobbleSpeed: 0.008 + Math.random() * 0.012,
    collected: false,
    popAnim: 0,
  };
}

function pickLetter(collectedCount: number): string {
  const nextNeeded = TARGET_LETTERS[collectedCount];
  if (!nextNeeded || nextNeeded === ' ') {
    return PHRASE_UNIQUE_LETTERS[Math.floor(Math.random() * PHRASE_UNIQUE_LETTERS.length)];
  }
  // 50% chance correct letter, 50% other letter from the phrase
  if (Math.random() < 0.5) return nextNeeded;
  // Pick a different letter from the phrase
  const others = PHRASE_UNIQUE_LETTERS.filter(l => l !== nextNeeded);
  return others[Math.floor(Math.random() * others.length)];
}

function drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const spikes = 5;
  const outerR = r;
  const innerR = r * 0.5;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerR : innerR;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    const x = cx + Math.cos(angle) * radius;
    const y = cy + Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawHeartShape(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const s = r * 0.65;
  ctx.beginPath();
  ctx.moveTo(cx, cy + s * 0.7);
  ctx.bezierCurveTo(cx - s * 1.3, cy - s * 0.3, cx - s * 0.7, cy - s * 1.2, cx, cy - s * 0.5);
  ctx.bezierCurveTo(cx + s * 0.7, cy - s * 1.2, cx + s * 1.3, cy - s * 0.3, cx, cy + s * 0.7);
  ctx.closePath();
}

const BalloonGame: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const lettersRef = useRef<FloatingLetter[]>([]);
  const confettiRef = useRef(new ConfettiSystem());
  const animRef = useRef(0);
  const collectedRef = useRef(0);
  const [collectedCount, setCollectedCount] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const initializedRef = useRef(false);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-skip spaces
  const skipSpaces = useCallback(() => {
    while (
      collectedRef.current < TARGET_LETTERS.length &&
      TARGET_LETTERS[collectedRef.current] === ' '
    ) {
      collectedRef.current++;
      setCollectedCount(collectedRef.current);
    }
    if (collectedRef.current >= TARGET_LETTERS.length) {
      setCompleted(true);
    }
  }, []);

  const initLetters = useCallback((w: number, h: number) => {
    skipSpaces();
    const isMobile = w < 480;
    const count = isMobile ? 8 : 12;
    const letters: FloatingLetter[] = [];
    const totalHeight = h + 100;

    // Ensure at least 2 correct letters in initial batch
    let correctCount = 0;
    for (let i = 0; i < count; i++) {
      const staggerY = -100 + (totalHeight / count) * i + Math.random() * 40;
      let letter = pickLetter(collectedRef.current);
      if (i < 3 && correctCount < 2 && TARGET_LETTERS[collectedRef.current] !== ' ') {
        letter = TARGET_LETTERS[collectedRef.current];
        correctCount++;
      }
      letters.push(createFloatingLetter(w, h, letter, staggerY, isMobile));
    }
    lettersRef.current = letters;
  }, [skipSpaces]);

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
        initLetters(canvas.offsetWidth, canvas.offsetHeight);
        initializedRef.current = true;
      }
    };
    resize();
    window.addEventListener('resize', resize);

    const drawFloatingLetter = (fl: FloatingLetter) => {
      if (fl.collected && fl.popAnim <= 0) return;

      const wobbleX = Math.sin(fl.wobblePhase) * fl.wobbleAmplitude;
      const bx = fl.baseX + wobbleX;
      fl.x = bx;

      // Pop animation (shrink + fade)
      let scale = 1;
      let alpha = 0.9;
      if (fl.popAnim > 0) {
        const t = fl.popAnim / 12;
        scale = t;
        alpha = t * 0.9;
      }

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(bx, fl.y);
      ctx.scale(scale, scale);

      // Draw shape background
      ctx.beginPath();
      switch (fl.shape) {
        case 'circle':
          ctx.arc(0, 0, fl.radius, 0, Math.PI * 2);
          break;
        case 'star':
          drawStar(ctx, 0, 0, fl.radius);
          break;
        case 'heart':
          drawHeartShape(ctx, 0, -fl.radius * 0.1, fl.radius);
          break;
      }
      ctx.fillStyle = fl.color;
      ctx.fill();

      // Highlight
      ctx.beginPath();
      ctx.ellipse(
        -fl.radius * 0.2,
        -fl.radius * 0.2,
        fl.radius * 0.18,
        fl.radius * 0.28,
        -0.4,
        0,
        Math.PI * 2,
      );
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.fill();

      // String below (only for circle)
      if (fl.shape === 'circle') {
        ctx.beginPath();
        ctx.moveTo(0, fl.radius);
        ctx.quadraticCurveTo(6, fl.radius + 20, -4, fl.radius + 35);
        ctx.strokeStyle = 'rgba(91, 44, 111, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      }

      // Letter
      const fontSize = fl.radius * 0.85;
      ctx.font = `bold ${fontSize}px 'Comfortaa', sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fff';
      ctx.strokeStyle = 'rgba(91,44,111,0.3)';
      ctx.lineWidth = 2;
      ctx.strokeText(fl.letter, 0, 2);
      ctx.fillText(fl.letter, 0, 2);

      ctx.restore();
    };

    const animate = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      const isMobile = w < 480;
      ctx.clearRect(0, 0, w, h);

      for (const fl of lettersRef.current) {
        if (fl.collected && fl.popAnim <= 0) continue;

        if (fl.popAnim > 0) {
          fl.popAnim--;
          drawFloatingLetter(fl);
          continue;
        }

        fl.wobblePhase += fl.wobbleSpeed;
        fl.y -= fl.speed;

        // Recycle when exits top
        if (fl.y < -fl.radius * 2) {
          const letter = pickLetter(collectedRef.current);
          const newR = (isMobile ? 22 : 28) + Math.random() * (isMobile ? 8 : 8);
          fl.radius = newR;
          fl.baseX = newR + 30 + Math.random() * (w - 2 * (newR + 30));
          fl.y = h + newR + 20;
          fl.color = PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)];
          fl.shape = SHAPES[Math.floor(Math.random() * SHAPES.length)];
          fl.speed = 0.35 + Math.random() * 0.35;
          fl.wobblePhase = Math.random() * Math.PI * 2;
          fl.wobbleAmplitude = 12 + Math.random() * 12;
          fl.wobbleSpeed = 0.008 + Math.random() * 0.012;
          fl.letter = letter;
          fl.collected = false;
          fl.popAnim = 0;
        }

        drawFloatingLetter(fl);
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
  }, [initLetters]);

  const handleClick = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (completed) return;
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

    for (const fl of lettersRef.current) {
      if (fl.collected) continue;
      const dx = x - fl.x;
      const dy = y - fl.y;
      if (dx * dx + dy * dy < fl.radius * fl.radius * 1.3) {
        const nextNeeded = TARGET_LETTERS[collectedRef.current];

        if (fl.letter === nextNeeded) {
          // Correct!
          fl.collected = true;
          confettiRef.current.burst(fl.x, fl.y, 30);
          collectedRef.current++;
          setCollectedCount(collectedRef.current);

          // Skip any spaces
          while (
            collectedRef.current < TARGET_LETTERS.length &&
            TARGET_LETTERS[collectedRef.current] === ' '
          ) {
            collectedRef.current++;
            setCollectedCount(collectedRef.current);
          }

          if (collectedRef.current >= TARGET_LETTERS.length) {
            setCompleted(true);
            confettiRef.current.rain(canvas.offsetWidth, 80);
          }

          if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
          setFeedback('✓');
          feedbackTimerRef.current = setTimeout(() => setFeedback(null), 800);
        } else {
          // Wrong — just pop it away
          fl.collected = true;
          fl.popAnim = 12;
        }
        break;
      }
    }
  }, [completed]);

  // Build the word board display
  const words = TARGET_PHRASE.split(' ');
  let charIndex = 0;

  return (
    <div className="section" style={{ padding: 0, height: '100vh', minHeight: '100vh' }}>
      {/* Word board */}
      <div
        style={{
          position: 'absolute',
          top: '0.8rem',
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 2,
          background: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
          borderRadius: '16px',
          padding: '0.5rem 1rem',
          maxWidth: '95vw',
        }}
      >
        <p
          className="section-title"
          style={{ margin: '0 0 0.4rem 0', fontSize: '1.1rem', whiteSpace: 'nowrap' }}
        >
          Найди букву
          {!completed && collectedRef.current < TARGET_LETTERS.length && TARGET_LETTERS[collectedRef.current] !== ' ' && (
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '1.8rem',
              height: '1.8rem',
              background: 'linear-gradient(135deg, #F9A8D4, #C4B5FD)',
              borderRadius: '50%',
              color: '#fff',
              fontWeight: 700,
              fontSize: '1.1rem',
              marginLeft: '0.4rem',
              verticalAlign: 'middle',
              boxShadow: '0 2px 8px rgba(196,181,253,0.4)',
            }}>
              {TARGET_LETTERS[collectedCount]}
            </span>
          )}
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
          {words.map((word, wi) => {
            const startIdx = charIndex;
            charIndex += word.length + 1; // +1 for the space
            return (
              <div key={wi} style={{ display: 'flex', gap: '3px' }}>
                {word.split('').map((ch, ci) => {
                  const globalIdx = startIdx + ci;
                  const isRevealed = globalIdx < collectedCount;
                  const isNext = globalIdx === collectedCount;

                  return (
                    <div
                      key={ci}
                      style={{
                        width: '1.5rem',
                        height: '2rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderBottom: `2.5px solid ${isRevealed ? '#C4B5FD' : isNext ? '#F9A8D4' : 'rgba(91,44,111,0.2)'}`,
                        fontFamily: "'Caveat', cursive",
                        fontSize: '1.4rem',
                        fontWeight: 700,
                        color: isRevealed ? '#5B2C6F' : 'rgba(91,44,111,0.15)',
                        transition: 'all 0.3s ease',
                        transform: isRevealed ? 'scale(1.05)' : 'scale(0.9)',
                      }}
                    >
                      {isRevealed ? ch : '?'}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      <canvas
        ref={canvasRef}
        onClick={handleClick}
        onTouchStart={handleClick}
        style={{ width: '100%', height: '100vh', display: 'block', cursor: 'pointer' }}
      />

      {feedback && (
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '3rem',
            color: '#22c55e',
            fontWeight: 700,
            pointerEvents: 'none',
            zIndex: 3,
            animation: 'fadeIn 0.2s ease',
            textShadow: '0 2px 8px rgba(34,197,94,0.3)',
          }}
        >
          {feedback}
        </div>
      )}

      {completed && (
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            left: '50%',
            transform: 'translateX(-50%)',
            textAlign: 'center',
            zIndex: 3,
            animation: 'fadeIn 0.5s ease',
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            borderRadius: '1.2rem',
            padding: '1.2rem 2rem',
            boxShadow: '0 8px 32px rgba(139, 92, 246, 0.18)',
          }}
        >
          <p className="handwritten" style={{ fontSize: '2rem', color: '#5B2C6F' }}>
            С Днём Рождения, мамочка! 🎉
          </p>
        </div>
      )}

      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default BalloonGame;
