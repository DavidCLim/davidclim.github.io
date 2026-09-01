import { WORLD_W, WORLD_H } from '../core/constants.js';

// A richer backdrop for the title and main-menu screens — warm wood/gold
// vignette, a soft diagonal light sweep, drifting gold + mint sparkle
// motes (mint ties back to the site's other accent color), and a very
// faint watermark emblem for a bit of depth. No walkable hub anymore;
// menus are just menus, so all the "life" here is atmosphere, not motion
// you interact with.
const MOTES = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 97.5) % WORLD_W,
  y: (i * 61.3 + i * i * 2.7) % WORLD_H,
  r: 0.6 + ((i * 37) % 10) / 6,
  speed: 5 + ((i * 53) % 10),
  drift: ((i * 19) % 10) / 10 - 0.5,
  phase: (i * 2.3) % (Math.PI * 2),
  mint: i % 5 === 0,
}));

export function drawMenuBackground(ctx, t) {
  const grad = ctx.createRadialGradient(WORLD_W / 2, WORLD_H * 0.38, 60, WORLD_W / 2, WORLD_H * 0.55, WORLD_W * 0.8);
  grad.addColorStop(0, '#3a2a16');
  grad.addColorStop(0.45, '#2c1e10');
  grad.addColorStop(0.8, '#170f07');
  grad.addColorStop(1, '#0a0603');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  // a slow diagonal light sweep, like sun through a tall window
  ctx.save();
  ctx.globalAlpha = 0.05 + Math.sin(t * 0.3) * 0.015;
  const beamGrad = ctx.createLinearGradient(0, 0, WORLD_W, WORLD_H);
  beamGrad.addColorStop(0, 'transparent');
  beamGrad.addColorStop(0.45, 'rgba(255, 214, 130, 0.9)');
  beamGrad.addColorStop(0.55, 'rgba(255, 214, 130, 0.9)');
  beamGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = beamGrad;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.restore();

  // faint watermark emblem, big and mostly hidden in the gradient
  ctx.save();
  ctx.globalAlpha = 0.05;
  ctx.font = `${WORLD_H * 0.62}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎓', WORLD_W / 2, WORLD_H * 0.42);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 180, 84, 0.045)';
  ctx.lineWidth = 1;
  for (let x = 0; x < WORLD_W; x += 40) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, WORLD_H); ctx.stroke(); }
  for (let y = 0; y < WORLD_H; y += 40) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(WORLD_W, y); ctx.stroke(); }

  for (const m of MOTES) {
    const y = ((m.y - t * m.speed) % (WORLD_H + 20) + WORLD_H + 20) % (WORLD_H + 20) - 10;
    const x = m.x + Math.sin(t * 0.5 + m.phase) * 10 * m.drift;
    const twinkle = 0.35 + Math.sin(t * 2 + m.phase) * 0.25;
    ctx.fillStyle = m.mint ? `rgba(95, 227, 192, ${twinkle})` : `rgba(255, 180, 84, ${twinkle + 0.25})`;
    ctx.beginPath(); ctx.arc(x, y, m.r, 0, Math.PI * 2); ctx.fill();
  }

  // vignette to keep the edges dark and pull focus to the center card
  const vignette = ctx.createRadialGradient(WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.35, WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.75);
  vignette.addColorStop(0, 'transparent');
  vignette.addColorStop(1, 'rgba(5, 3, 1, 0.55)');
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
}
