// ── Shared flower drawing utilities ─────────────────────────

export function drawStem(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  height: number,
  sway: number,
  color = '#16A34A',
) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, groundY);
  const cp1x = x + sway * 0.6;
  const cp1y = groundY - height * 0.4;
  const cp2x = x + sway;
  const cp2y = groundY - height * 0.8;
  const endX = x + sway * 0.8;
  const endY = groundY - height;
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, endX, endY);
  ctx.stroke();
  ctx.restore();
  return { x: endX, y: endY };
}

export function drawLeaf(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  angle: number,
  color = '#22C55E',
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(size * 0.3, -size * 0.5, size * 0.8, -size * 0.3, size, 0);
  ctx.bezierCurveTo(size * 0.8, size * 0.3, size * 0.3, size * 0.5, 0, 0);
  ctx.fill();
  ctx.restore();
}

export function drawTulip(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  stemHeight: number,
  size: number,
  color: string,
  sway: number,
  growth = 1,
) {
  const actualHeight = stemHeight * growth;
  const head = drawStem(ctx, x, groundY, actualHeight, sway);

  // Leaves
  if (growth > 0.4) {
    const leafProgress = Math.min(1, (growth - 0.4) / 0.3);
    const leafSize = size * 1.2 * leafProgress;
    const midX = x + sway * 0.3;
    const midY = groundY - actualHeight * 0.4;
    drawLeaf(ctx, midX, midY, leafSize, -0.6, '#22C55E');
    drawLeaf(ctx, midX, midY + size * 0.5, leafSize * 0.8, 0.5, '#16A34A');
  }

  // Tulip head
  if (growth > 0.6) {
    const petalProgress = Math.min(1, (growth - 0.6) / 0.4);
    const petalSize = size * petalProgress;
    ctx.save();
    ctx.translate(head.x, head.y);

    // Three petals
    for (let i = -1; i <= 1; i++) {
      ctx.save();
      ctx.rotate(i * 0.25 * petalProgress);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.ellipse(0, -petalSize * 0.7, petalSize * 0.45, petalSize * 0.9, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Inner shadow
    ctx.fillStyle = 'rgba(0,0,0,0.08)';
    ctx.beginPath();
    ctx.ellipse(0, -petalSize * 0.2, petalSize * 0.25, petalSize * 0.3, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function drawDaisy(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  stemHeight: number,
  size: number,
  sway: number,
  growth = 1,
) {
  const actualHeight = stemHeight * growth;
  const head = drawStem(ctx, x, groundY, actualHeight, sway);

  // Leaf
  if (growth > 0.3) {
    const leafProgress = Math.min(1, (growth - 0.3) / 0.3);
    const midX = x + sway * 0.35;
    const midY = groundY - actualHeight * 0.45;
    drawLeaf(ctx, midX, midY, size * 1.1 * leafProgress, -0.7, '#22C55E');
  }

  // Daisy head
  if (growth > 0.5) {
    const petalProgress = Math.min(1, (growth - 0.5) / 0.5);
    const petalLen = size * 0.9 * petalProgress;
    const petalW = size * 0.28 * petalProgress;
    const numPetals = 9;

    ctx.save();
    ctx.translate(head.x, head.y);

    // Petals
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < numPetals; i++) {
      const angle = (i / numPetals) * Math.PI * 2;
      ctx.save();
      ctx.rotate(angle);
      ctx.beginPath();
      ctx.ellipse(0, -petalLen * 0.7, petalW, petalLen, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Center
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.32 * petalProgress, 0, Math.PI * 2);
    ctx.fill();

    // Center detail
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.arc(0, 0, size * 0.15 * petalProgress, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }
}

export function drawCherryBlossom(
  ctx: CanvasRenderingContext2D,
  x: number,
  groundY: number,
  stemHeight: number,
  size: number,
  color: string,
  sway: number,
  growth = 1,
) {
  const actualHeight = stemHeight * growth;
  const head = drawStem(ctx, x, groundY, actualHeight, sway, '#8B5E3C');

  // Small branch splits
  if (growth > 0.5) {
    const branchProgress = Math.min(1, (growth - 0.5) / 0.2);
    ctx.save();
    ctx.strokeStyle = '#8B5E3C';
    ctx.lineWidth = 1.5;
    ctx.lineCap = 'round';

    const branchLen = size * 1.2 * branchProgress;
    // Left branch
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(head.x - branchLen * 0.5, head.y - branchLen * 0.3);
    ctx.stroke();
    // Right branch
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(head.x + branchLen * 0.4, head.y - branchLen * 0.35);
    ctx.stroke();
    ctx.restore();
  }

  // Blossoms
  if (growth > 0.6) {
    const bloomProgress = Math.min(1, (growth - 0.6) / 0.4);
    const petalSize = size * 0.4 * bloomProgress;

    const blossomPositions = [
      { x: head.x, y: head.y - size * 0.2 },
      { x: head.x - size * 0.6, y: head.y - size * 0.15 },
      { x: head.x + size * 0.5, y: head.y - size * 0.2 },
    ];

    for (const pos of blossomPositions) {
      ctx.save();
      ctx.translate(pos.x, pos.y);
      ctx.globalAlpha = 0.85;

      // 5 petals
      for (let i = 0; i < 5; i++) {
        const angle = (i / 5) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(0, -petalSize * 0.6, petalSize * 0.45, petalSize * 0.65, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // Center
      ctx.globalAlpha = 1;
      ctx.fillStyle = '#FDE68A';
      ctx.beginPath();
      ctx.arc(0, 0, petalSize * 0.25, 0, Math.PI * 2);
      ctx.fill();

      // Dots
      ctx.fillStyle = '#F472B6';
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * Math.PI * 2 + 0.5;
        ctx.beginPath();
        ctx.arc(Math.cos(a) * petalSize * 0.15, Math.sin(a) * petalSize * 0.15, 1, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.restore();
    }
  }
}

export function drawButterfly(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  wingPhase: number,
  color: string,
) {
  const wingAngle = Math.sin(wingPhase) * 0.5 + 0.3;

  ctx.save();
  ctx.translate(x, y);

  // Left wing
  ctx.save();
  ctx.scale(Math.cos(wingAngle), 1);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(-size * 0.3, -size * 0.1, size * 0.5, size * 0.7, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Wing pattern
  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(-size * 0.3, -size * 0.15, size * 0.2, size * 0.35, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Right wing
  ctx.save();
  ctx.scale(Math.cos(wingAngle), 1);
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.7;
  ctx.beginPath();
  ctx.ellipse(size * 0.3, -size * 0.1, size * 0.5, size * 0.7, 0.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(255,255,255,0.4)';
  ctx.beginPath();
  ctx.ellipse(size * 0.3, -size * 0.15, size * 0.2, size * 0.35, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Body
  ctx.globalAlpha = 0.9;
  ctx.fillStyle = '#1E3A2F';
  ctx.beginPath();
  ctx.ellipse(0, 0, size * 0.07, size * 0.35, 0, 0, Math.PI * 2);
  ctx.fill();

  // Antennae
  ctx.strokeStyle = '#1E3A2F';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.3);
  ctx.quadraticCurveTo(-size * 0.15, -size * 0.6, -size * 0.25, -size * 0.65);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.3);
  ctx.quadraticCurveTo(size * 0.15, -size * 0.6, size * 0.25, -size * 0.65);
  ctx.stroke();

  ctx.restore();
}

export function drawSimpleFlower(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  petalColor: string,
  centerColor: string,
  rotation = 0,
) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);

  const numPetals = 5;
  for (let i = 0; i < numPetals; i++) {
    const angle = (i / numPetals) * Math.PI * 2;
    ctx.save();
    ctx.rotate(angle);
    ctx.fillStyle = petalColor;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.ellipse(0, -size * 0.55, size * 0.35, size * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.globalAlpha = 1;
  ctx.fillStyle = centerColor;
  ctx.beginPath();
  ctx.arc(0, 0, size * 0.25, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}
