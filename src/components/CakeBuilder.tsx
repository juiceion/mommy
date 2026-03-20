import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FireworkSystem } from '../canvas/fireworks';

interface CakeItem {
  id: string;
  label: string;
  emoji: string;
  placed: boolean;
}

const CAKE_ITEMS: CakeItem[] = [
  { id: 'layer1', label: 'Нижний слой', emoji: '🍰', placed: false },
  { id: 'layer2', label: 'Средний слой', emoji: '🎂', placed: false },
  { id: 'layer3', label: 'Верхний слой', emoji: '🧁', placed: false },
  { id: 'candle', label: 'Свечи', emoji: '🕯️', placed: false },
  { id: 'cherry', label: 'Вишенка', emoji: '🍒', placed: false },
  { id: 'star', label: 'Звёздочка', emoji: '⭐', placed: false },
];

const CakeBuilder: React.FC = () => {
  const [items, setItems] = useState(CAKE_ITEMS.map(i => ({ ...i })));
  const [completed, setCompleted] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireworkRef = useRef(new FireworkSystem());
  const animRef = useRef(0);

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    fireworkRef.current.update();
    fireworkRef.current.draw(ctx);
    ctx.globalAlpha = 1;
    if (fireworkRef.current.isActive) {
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

  const handleDragStart = (e: React.DragEvent, id: string) => {
    e.dataTransfer.setData('text/plain', id);
  };

  const handleTouchPlace = (id: string) => {
    placeItem(id);
  };

  const placeItem = (id: string) => {
    setItems(prev => {
      const updated = prev.map(item =>
        item.id === id ? { ...item, placed: true } : item
      );
      const allPlaced = updated.every(item => item.placed);
      if (allPlaced && !completed) {
        setCompleted(true);
        const canvas = canvasRef.current!;
        fireworkRef.current.launchMultiple(canvas.offsetWidth, canvas.offsetHeight, 5);
        cancelAnimationFrame(animRef.current);
        animRef.current = requestAnimationFrame(animate);
      }
      return updated;
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const id = e.dataTransfer.getData('text/plain');
    placeItem(id);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const placedItems = items.filter(i => i.placed);
  const availableItems = items.filter(i => !i.placed);

  return (
    <div className="section">
      <canvas
        ref={canvasRef}
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 3 }}
      />

      <h2 className="section-title" style={{ zIndex: 1 }}>Собери торт для мамы!</h2>

      {/* Drop zone - cake plate */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        style={{
          width: '240px',
          minHeight: '200px',
          background: dragOver
            ? 'rgba(249, 168, 212, 0.2)'
            : 'rgba(255, 255, 255, 0.5)',
          backdropFilter: 'blur(8px)',
          borderRadius: '20px',
          border: `3px dashed ${dragOver ? '#F9A8D4' : '#C4B5FD'}`,
          display: 'flex',
          flexDirection: 'column-reverse',
          alignItems: 'center',
          justifyContent: 'flex-start',
          padding: '1rem',
          gap: '0.3rem',
          transition: 'all 0.3s ease',
          zIndex: 1,
          marginBottom: '1.5rem',
        }}
      >
        {placedItems.length === 0 && (
          <p style={{ opacity: 0.5, fontSize: '0.9rem', textAlign: 'center' }}>
            Перетащи ингредиенты сюда!
          </p>
        )}
        {placedItems.map((item) => (
          <div
            key={item.id}
            style={{
              fontSize: '2.5rem',
              animation: 'fadeIn 0.3s ease',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
            }}
          >
            {item.emoji}
          </div>
        ))}
      </div>

      {/* Available items */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '0.8rem',
          justifyContent: 'center',
          maxWidth: '400px',
          zIndex: 1,
        }}
      >
        {availableItems.map((item) => (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, item.id)}
            onClick={() => handleTouchPlace(item.id)}
            style={{
              background: 'rgba(255,255,255,0.7)',
              backdropFilter: 'blur(6px)',
              borderRadius: '12px',
              padding: '0.6rem 1rem',
              cursor: 'grab',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 2px 10px rgba(196, 181, 253, 0.2)',
              transition: 'transform 0.2s',
              fontSize: '1rem',
              userSelect: 'none',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
            onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <span style={{ fontSize: '1.5rem' }}>{item.emoji}</span>
            {item.label}
          </div>
        ))}
      </div>

      {completed && (
        <div
          className="handwritten"
          style={{
            marginTop: '1.5rem',
            fontSize: '1.8rem',
            color: '#5B2C6F',
            animation: 'fadeIn 0.5s ease',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          Идеальный торт для идеальной мамы! 🎉
        </div>
      )}

      <div className="scroll-hint">↓</div>
    </div>
  );
};

export default CakeBuilder;
