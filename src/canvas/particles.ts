export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  alpha: number;
  rotation: number;
  rotationSpeed: number;
  life: number;
  maxLife: number;
  gravity: number;
  drag: number;
  shape: 'circle' | 'rect' | 'heart';
}

const DEFAULTS: Particle = {
  x: 0,
  y: 0,
  vx: 0,
  vy: 0,
  size: 6,
  color: '#F9A8D4',
  alpha: 1,
  rotation: 0,
  rotationSpeed: 0,
  life: 0,
  maxLife: 100,
  gravity: 0.05,
  drag: 0.99,
  shape: 'circle',
};

export function createParticle(overrides: Partial<Particle>): Particle {
  return { ...DEFAULTS, ...overrides };
}

export function updateParticle(p: Particle): void {
  p.vy += p.gravity;
  p.vx *= p.drag;
  p.vy *= p.drag;
  p.x += p.vx;
  p.y += p.vy;
  p.rotation += p.rotationSpeed;
  p.life += 1;
  p.alpha = Math.max(0, 1 - p.life / p.maxLife);
}

function drawHeartPath(ctx: CanvasRenderingContext2D, size: number): void {
  const s = size;
  ctx.beginPath();
  ctx.moveTo(0, -s * 0.4);
  ctx.bezierCurveTo(-s, -s * 1.2, -s * 1.4, s * 0.2, 0, s);
  ctx.bezierCurveTo(s * 1.4, s * 0.2, s, -s * 1.2, 0, -s * 0.4);
  ctx.closePath();
}

export function drawParticle(ctx: CanvasRenderingContext2D, p: Particle): void {
  if (p.alpha <= 0) return;

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.rotation);
  ctx.globalAlpha = p.alpha;

  switch (p.shape) {
    case 'circle':
      ctx.beginPath();
      ctx.arc(0, 0, p.size, 0, Math.PI * 2);
      ctx.fillStyle = p.color;
      ctx.fill();
      break;

    case 'rect':
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      break;

    case 'heart':
      drawHeartPath(ctx, p.size);
      ctx.fillStyle = p.color;
      ctx.fill();
      break;
  }

  ctx.restore();
}

export function isAlive(p: Particle): boolean {
  return p.life < p.maxLife && p.alpha > 0.01;
}
