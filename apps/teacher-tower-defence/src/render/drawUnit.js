import { drawHumanBody, drawHead, drawProp } from './drawFigure.js';

// The actual arms-and-legs figure from the sketches (round head + a
// footie-pajama body with a two-leg notch), rarity-tinted, holding a prop
// that matches its combat archetype — a wand, a club, a thrown ball, or a
// glowing domain ring — instead of an icon badge. Flips to face whichever
// side it's fighting toward, for the side-view battle camera.
function archetypeOf(u) {
  if (u.domain) return 'domain';
  if (u.pierce > 1) return 'pierce';
  if (u.melee) return 'melee';
  if (u.splash) return 'splash';
  return 'plain';
}

// Rendered much larger than the old badge-scale towers, so every
// position that used to be a hand-tuned constant is scaled by SCALE
// instead — keeps the badge/pips/star/HP-bar sitting correctly relative
// to the bigger body instead of sinking into it.
const SCALE = 1.8;

export function drawUnit(ctx, tower, t) {
  const { x, y, color, accent, icon, attackFlashUntil, level, star, dir, hp, maxHp } = tower;
  ctx.save();
  ctx.translate(x, y);

  const flashing = attackFlashUntil && attackFlashUntil > t;
  // Idle marching-in-place stride, desynced a little per unit by x so a
  // row of them doesn't all step in lockstep.
  const phase = t * 9 + x * 0.08;

  // Body + prop face left/right (mirrored); the icon and pips are drawn
  // afterward, unflipped, so text/emoji never render backwards. Flat fill,
  // no gradient/glow — plain 2D like the sketch.
  ctx.save();
  ctx.scale(dir < 0 ? -1 : 1, 1);
  ctx.fillStyle = flashing ? '#fff6ea' : color;
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.6;
  drawHumanBody(ctx, SCALE, accent, phase);
  drawHead(ctx, 9 * SCALE, -20 * SCALE);
  drawProp(ctx, archetypeOf(tower), color, accent);
  ctx.restore();

  // Identity badge floats above the head instead of sitting on the face —
  // the head itself stays a plain blank circle, matching the reference.
  ctx.fillStyle = 'rgba(28, 18, 8, 0.85)';
  ctx.strokeStyle = 'rgba(255, 246, 234, 0.5)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(9 * SCALE, -30 * SCALE, 7 * SCALE * 0.7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.font = `${Math.round(9 * SCALE * 0.7)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(icon || '❓', 9 * SCALE, -29.5 * SCALE);

  const lvl = level || 0;
  for (let i = 0; i <= lvl; i++) {
    ctx.fillStyle = '#fff6ea';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc((-6 + i * 6) * SCALE, 22 * SCALE, 2 * SCALE, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (star) {
    ctx.fillStyle = '#ffd670';
    ctx.font = `${Math.round(9 * SCALE)}px sans-serif`;
    ctx.fillText('★'.repeat(star), -6 * SCALE, -30 * SCALE);
  }

  ctx.restore();

  // HP bar, only once damaged — keeps the lane readable when nothing's hurt.
  if (hp < maxHp) {
    const w = 26 * SCALE;
    const pct = Math.max(0, hp / maxHp);
    ctx.save();
    ctx.translate(x - w / 2, y - 42 * SCALE);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, 4);
    ctx.fillStyle = pct > 0.5 ? '#8fe98f' : pct > 0.25 ? '#ffd670' : '#ff6f6f';
    ctx.fillRect(0, 0, w * pct, 4);
    ctx.restore();
  }
}
