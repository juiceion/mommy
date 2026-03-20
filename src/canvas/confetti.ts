import type { Particle } from './particles';
import { createParticle, updateParticle, drawParticle, isAlive } from './particles';
import { randomConfettiColor } from '../utils/colors';

export class ConfettiSystem {
  particles: Particle[] = [];

  burst(x: number, y: number, count = 70): void {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 6;
      this.particles.push(createParticle({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2,
        size: 4 + Math.random() * 4,
        color: randomConfettiColor(),
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        maxLife: 80 + Math.random() * 40,
        gravity: 0.06,
        drag: 0.98,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.15,
      }));
    }
  }

  rain(width: number, count = 50): void {
    for (let i = 0; i < count; i++) {
      this.particles.push(createParticle({
        x: Math.random() * width,
        y: -10 - Math.random() * 50,
        vx: (Math.random() - 0.5) * 2,
        vy: 1 + Math.random() * 3,
        size: 4 + Math.random() * 4,
        color: randomConfettiColor(),
        shape: Math.random() > 0.5 ? 'rect' : 'circle',
        maxLife: 100 + Math.random() * 60,
        gravity: 0.03,
        drag: 0.995,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.1,
      }));
    }
  }

  update(): void {
    this.particles.forEach(updateParticle);
    this.particles = this.particles.filter(isAlive);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    this.particles.forEach(p => drawParticle(ctx, p));
  }

  get isActive(): boolean { return this.particles.length > 0; }
}
