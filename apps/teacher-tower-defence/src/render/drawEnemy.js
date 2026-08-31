import { drawHumanBody, drawButtons, drawRoundBlob, drawHead } from './drawFigure.js';

// The same arms-and-legs figure the students use, colored per teacher —
// K is the one exception, drawn as the squat round blob from the sketch.
// T holds a ruler, its Awakened form holds the same pose scaled up and
// lit red, P totes the dodgeball, and the two Random Teachers stay plain.
// Flat fills throughout, no gradients or glow — plain 2D like the sketch.
function drawRuler(ctx, big) {
  ctx.strokeStyle = big ? '#c0203f' : '#241708';
  ctx.lineWidth = big ? 3 : 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(8, -2);
  ctx.lineTo(big ? 24 : 19, big ? -14 : -10);
  ctx.stroke();
}

const SHAPES = {
  random1(ctx) { drawHumanBody(ctx); drawButtons(ctx); drawHead(ctx, 9, -20); },
  random2(ctx) { drawHumanBody(ctx); drawButtons(ctx); drawHead(ctx, 9, -20); },
  p(ctx) {
    drawHumanBody(ctx); drawButtons(ctx); drawHead(ctx, 9, -20);
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 2.4;
    ctx.beginPath(); ctx.moveTo(8, -1); ctx.lineTo(16, 3); ctx.stroke();
    ctx.fillStyle = '#fff6ea';
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.arc(18, 5, 4.5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  },
  k(ctx) { drawRoundBlob(ctx); drawHead(ctx, 7, -10); },
  t(ctx) { drawHumanBody(ctx); drawButtons(ctx); drawHead(ctx, 9, -20); drawRuler(ctx, false); },
  t_awakened(ctx) {
    drawHumanBody(ctx, 1.3); drawButtons(ctx, 1.3); drawHead(ctx, 11, -26);
    drawRuler(ctx, true);
  },
};

export function drawEnemy(ctx, enemy, t) {
  const { x, y, size, color, hp, maxHp, slowUntil, evasive, dir } = enemy;
  const scale = size / 16;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (dir < 0 ? -1 : 1), scale);

  const flicker = evasive && Math.sin(t * 14 + x) > 0.6 ? 0.4 : 1;
  ctx.globalAlpha = flicker;

  ctx.fillStyle = color;
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.6;
  const shapeFn = SHAPES[enemy.typeId] || SHAPES.random1;
  shapeFn(ctx);

  if (slowUntil && slowUntil > t) {
    ctx.globalAlpha = 0.35;
    ctx.fillStyle = '#7fb8ff';
    ctx.beginPath();
    ctx.arc(0, -4, 20, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // HP bar, only once damaged — keeps a fresh wave visually clean.
  if (hp < maxHp) {
    const w = size * 1.8;
    const pct = Math.max(0, hp / maxHp);
    ctx.save();
    ctx.translate(x - w / 2, y - size - 10);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, 5);
    ctx.fillStyle = pct > 0.5 ? '#8fe98f' : pct > 0.25 ? '#ffd670' : '#ff6f6f';
    ctx.fillRect(0, 0, w * pct, 5);
    ctx.strokeStyle = '#2c1e10';
    ctx.lineWidth = 1;
    ctx.strokeRect(0, 0, w, 5);
    ctx.restore();
  }
}
