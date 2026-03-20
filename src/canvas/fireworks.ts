import type { Particle } from './particles';
import { createParticle, updateParticle, drawParticle, isAlive } from './particles';
import { randomPastel } from '../utils/colors';

interface TrailDot { x: number; y: number; alpha: number; }

interface Rocket {
  x: number; y: number; targetY: number; speed: number;
  color: string; exploded: boolean; trail: TrailDot[];
}

export class FireworkSystem {
  rockets: Rocket[] = [];
  particles: Particle[] = [];

  launch(canvasWidth: number, canvasHeight: number): void {
    this.rockets.push({
      x: canvasWidth * 0.2 + Math.random() * canvasWidth * 0.6,
      y: canvasHeight,
      targetY: canvasHeight * (0.15 + Math.random() * 0.25),
      speed: 3 + Math.random() * 2,
      color: randomPastel(),
      exploded: false,
      trail: [],
    });
  }

  launchMultiple(canvasWidth: number, canvasHeight: number, count = 4): void {
    for (let i = 0; i < count; i++) {
      setTimeout(() => this.launch(canvasWidth, canvasHeight), i * 300);
    }
  }

  private explode(rocket: Rocket): void {
    const count = 35 + Math.floor(Math.random() * 20);
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
      const speed = 2 + Math.random() * 3;
      this.particles.push(createParticle({
        x: rocket.x, y: rocket.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 3,
        color: randomPastel(),
        shape: Math.random() > 0.7 ? 'heart' : 'circle',
        maxLife: 60 + Math.random() * 40,
        gravity: 0.04,
        drag: 0.97,
      }));
    }
    rocket.exploded = true;
  }

  update(): void {
    for (const rocket of this.rockets) {
      if (rocket.exploded) continue;
      rocket.trail.push({ x: rocket.x, y: rocket.y, alpha: 1 });
      rocket.y -= rocket.speed;
      if (rocket.y <= rocket.targetY) this.explode(rocket);
      // Fade trail
      for (const dot of rocket.trail) dot.alpha -= 0.03;
      rocket.trail = rocket.trail.filter(d => d.alpha > 0);
    }
    this.rockets = this.rockets.filter(r => !r.exploded || r.trail.length > 0);
    this.particles.forEach(updateParticle);
    this.particles = this.particles.filter(isAlive);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const rocket of this.rockets) {
      for (const dot of rocket.trail) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, 2, 0, Math.PI * 2);
        ctx.fillStyle = rocket.color;
        ctx.globalAlpha = dot.alpha;
        ctx.fill();
      }
      if (!rocket.exploded) {
        ctx.beginPath();
        ctx.arc(rocket.x, rocket.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = rocket.color;
        ctx.globalAlpha = 1;
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    this.particles.forEach(p => drawParticle(ctx, p));
  }

  get isActive(): boolean {
    return this.rockets.length > 0 || this.particles.length > 0;
  }
}
