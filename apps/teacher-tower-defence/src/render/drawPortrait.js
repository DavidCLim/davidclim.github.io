import { drawStudentBody, drawHead } from './drawFigure.js';
import { drawEnemy } from './drawEnemy.js';

// A student portrait caught mid-gesture — the unit's own signature move
// (a boxer's punch, or The 6-7 Kid's both-hands-up "67!") — matching the
// player's own trading-card sketch, where the figure is mid-pose, not
// standing neutrally. No glow, no gradient — the same flat 2D figure
// drawn in battle (drawUnit.js), just framed as a standing portrait.
// One-time canvas draw, no animation loop.
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

  // bodyScale/translate are picked so the WHOLE figure (head down to
  // feet, ~49 units tall in drawStudentBody's own coordinate space)
  // fits inside the box with a little margin — the previous constants
  // were tuned for a head+torso bust crop and cut the legs off below
  // the canvas entirely, leaving a floating, legless torso instead of
  // the standing figure the sketch shows.
  const bodyScale = sizePx / 58;
  ctx.save();
  ctx.translate(sizePx / 2, sizePx * 0.58);
  ctx.fillStyle = unit.color;
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.6 * (bodyScale / 1.8);
  // phase 0 + lean 0 (centered, no walk tilt), punching=true so the
  // figure is caught mid-gesture — its own signature move — instead of
  // idling.
  drawStudentBody(ctx, bodyScale, unit.accent, 0, 0, true, 1, unit.gesture || 'punch');
  drawHead(ctx, 9 * bodyScale, -20 * bodyScale);
  ctx.restore();

  return canvas;
}

// A small bust badge — a plain round head over a short collar hint, sized
// small with empty margin around it inside its circular slot — matching
// the player's own sketch exactly (a little face floating in the middle
// of the slot circle, not a tight crop that fills the whole thing).
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

  const bodyScale = sizePx / 60;
  ctx.save();
  ctx.translate(sizePx / 2, sizePx * 0.62);
  ctx.fillStyle = unit.color;
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.6 * (bodyScale / 1.8);

  // Just the collar — the top of the torso, no legs or arms — so this
  // reads as "shoulders", not a full body shrunk down to a speck.
  ctx.beginPath();
  ctx.moveTo(-6 * bodyScale, -11 * bodyScale);
  ctx.lineTo(-6.5 * bodyScale, 2 * bodyScale);
  ctx.lineTo(6.5 * bodyScale, 2 * bodyScale);
  ctx.lineTo(6 * bodyScale, -11 * bodyScale);
  ctx.quadraticCurveTo(0, -9 * bodyScale, -6 * bodyScale, -11 * bodyScale);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

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
