import { WORLD_W, WORLD_H } from '../core/constants.js';

// A simple static backdrop for the title and main-menu screens — warm
// wood/gold radial gradient with drifting motes, matching the site's
// house palette. No walkable hub anymore; menus are just menus.
const MOTES = Array.from({ length: 30 }, (_, i) => ({
  x: (i * 137.5) % WORLD_W,
  y: (i * 71.3 + i * i * 3.1) % WORLD_H,
  r: 0.6 + ((i * 37) % 10) / 6,
  speed: 5 + ((i * 53) % 10),
  drift: ((i * 19) % 10) / 10 - 0.5,
  phase: (i * 2.3) % (Math.PI * 2),
}));

export function drawMenuBackground(ctx, t) {
  const grad = ctx.createRadialGradient(WORLD_W / 2, WORLD_H / 2, 60, WORLD_W / 2, WORLD_H / 2, WORLD_W * 0.75);
  grad.addColorStop(0, '#2c1e10');
  grad.addColorStop(0.6, '#1c1006');
  grad.addColorStop(1, '#0c0703');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.strokeStyle = 'rgba(255, 180, 84, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < WORLD_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke(); }
  for (let y = 0; y < WORLD_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke(); }

  ctx.fillStyle = 'rgba(255, 180, 84, 0.5)';
  for (const m of MOTES) {
    const y = ((m.y - t * m.speed) % (WORLD_H + 20) + WORLD_H + 20) % (WORLD_H + 20) - 10;
    const x = m.x + Math.sin(t * 0.5 + m.phase) * 10 * m.drift;
    ctx.beginPath(); ctx.arc(x, y, m.r, 0, Math.PI * 2); ctx.fill();
  }
}
