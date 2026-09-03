import { drawStudentBody, drawHead } from './drawFigure.js';
import { drawEnemy } from './drawEnemy.js';

// A plain, neutral standing portrait of a student — matching the
// player's own trading-card sketch exactly (a calm, centered figure, no
// glow, no action pose) — the same figure drawn in battle (drawUnit.js),
// just framed as a bust instead of a full standing body. One-time canvas
// draw, no animation loop.
export function renderUnitPortrait(unit, sizePx = 120) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = sizePx * dpr;
  canvas.height = sizePx * dpr;
  canvas.style.width = sizePx + 'px';
  canvas.style.height = sizePx + 'px';
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const bodyScale = sizePx / 34;
  ctx.save();
  ctx.translate(sizePx / 2, sizePx * 0.86);
  ctx.fillStyle = unit.color;
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.6 * (bodyScale / 1.8);
  // phase 0 + lean 0 (centered, no walk tilt) and punching=false — a
  // plain neutral stand, same as the sketch.
  drawStudentBody(ctx, bodyScale, unit.accent, 0, 0);
  drawHead(ctx, 9 * bodyScale, -20 * bodyScale);
  ctx.restore();

  return canvas;
}

// A tight face-and-collar crop of the same figure — for small circular
// slots (the loadout tray) that need to read as "a face", not a full
// action pose shrunk down to a speck.
export function renderUnitFace(unit, sizePx = 64) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = sizePx * dpr;
  canvas.height = sizePx * dpr;
  canvas.style.width = sizePx + 'px';
  canvas.style.height = sizePx + 'px';
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  // A much larger body scale + a translate that pushes the head/collar
  // down into frame — crops in tight enough that only the face and a
  // sliver of the collar/neck show, like a headshot.
  const bodyScale = sizePx / 15;
  ctx.save();
  ctx.translate(sizePx / 2, sizePx * 1.34);
  ctx.fillStyle = unit.color;
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.6 * (bodyScale / 1.8);
  drawStudentBody(ctx, bodyScale, unit.accent, 0, 0);
  drawHead(ctx, 9 * bodyScale, -20 * bodyScale);
  ctx.restore();

  return canvas;
}

// The Index screen's equivalent for teachers — reuses drawEnemy.js's own
// per-typeId shapes (the exact figure seen in battle) against a
// synthetic, standing-still "enemy" so the reference card shows the real
// likeness instead of a flat emoji.
export function renderEnemyPortrait(def, sizePx = 120) {
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = sizePx * dpr;
  canvas.height = sizePx * dpr;
  canvas.style.width = sizePx + 'px';
  canvas.style.height = sizePx + 'px';
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  const bodyScale = sizePx / 46;
  const fakeEnemy = {
    x: sizePx / 2, y: sizePx * 0.8,
    size: 16 * bodyScale, color: def.color,
    hp: 1, maxHp: 1, slowUntil: 0, evasive: 0, dir: 1, typeId: def.id,
  };
  drawEnemy(ctx, fakeEnemy, 0);

  return canvas;
}
