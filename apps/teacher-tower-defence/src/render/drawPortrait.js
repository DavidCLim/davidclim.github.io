import { drawStudentBody, drawHead } from './drawFigure.js';
import { drawEnemy } from './drawEnemy.js';

// A static head-and-shoulders portrait of a student — the same figure
// drawn in battle (drawUnit.js), just framed as a bust instead of a full
// standing body, for Gacha UI spots that need a real likeness instead of
// a generic emoji glyph. One-time canvas draw, no animation loop.
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
  // phase 0 (standing still) and lean 0 (no forward tilt) — the in-battle
  // lean only makes sense walking toward a target, not centered in a
  // portrait frame.
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
