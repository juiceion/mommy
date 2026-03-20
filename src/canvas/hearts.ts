import type { Particle } from './particles';
import { createParticle, updateParticle, isAlive } from './particles';
import { PASTEL_COLORS } from '../utils/colors';

export function drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number, color: string, alpha = 1): void {
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.4);
  ctx.bezierCurveTo(-size, -size * 1.2, -size * 1.4, size * 0.2, 0, size);
  ctx.bezierCurveTo(size * 1.4, size * 0.2, size, -size * 1.2, 0, -size * 0.4);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export class HeartBurst {
  particles: Particle[] = [];

  burst(x: number, y: number, count = 12): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.5 + Math.random() * 4;
      this.particles.push(createParticle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        size: 5 + Math.random() * 8,
        color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
        shape: 'heart',
        maxLife: 60 + Math.random() * 40,
        gravity: 0.03,
        drag: 0.97,
        rotationSpeed: (Math.random() - 0.5) * 0.08,
      }));
    }
  }

  update(): void {
    this.particles.forEach(updateParticle);
    this.particles = this.particles.filter(isAlive);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(p => {
      drawHeart(ctx, p.x, p.y, p.size, p.color, p.alpha);
    });
  }

  get isActive(): boolean { return this.particles.length > 0; }
}

export interface FloatingHeart {
  x: number; y: number; size: number; color: string; alpha: number;
  speed: number; wobble: number; wobbleSpeed: number; phase: number;
}

export function createFloatingHeart(canvasWidth: number, canvasHeight: number): FloatingHeart {
  return {
    x: Math.random() * canvasWidth,
    y: canvasHeight + 20,
    size: 6 + Math.random() * 14,
    color: PASTEL_COLORS[Math.floor(Math.random() * PASTEL_COLORS.length)],
    alpha: 0.3 + Math.random() * 0.5,
    speed: 0.5 + Math.random() * 1.5,
    wobble: 30 + Math.random() * 40,
    wobbleSpeed: 0.01 + Math.random() * 0.02,
    phase: Math.random() * Math.PI * 2,
  };
}

export function updateFloatingHeart(h: FloatingHeart): void {
  h.y -= h.speed;
  h.phase += h.wobbleSpeed;
  h.x += Math.sin(h.phase) * 0.5;
}

export function drawFloatingHeart(ctx: CanvasRenderingContext2D, h: FloatingHeart): void {
  drawHeart(ctx, h.x, h.y, h.size, h.color, h.alpha);
}
