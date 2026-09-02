import { drawStudentBody, drawHead } from './drawFigure.js';

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
