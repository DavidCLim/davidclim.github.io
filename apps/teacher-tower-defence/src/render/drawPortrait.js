import { drawStudentBody, drawHead } from './drawFigure.js';
import { drawEnemy } from './drawEnemy.js';

// A static action-pose portrait of a student — the same figure drawn in
// battle (drawUnit.js), caught mid-attack (the same "punching"/"raise"
// pose the unit throws in the lane, per its own gesture) instead of just
// standing there, with a soft glow behind it — for Gacha/Units/Index
// spots that need a real, cool-looking likeness instead of a flat emoji.
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

  const glowColor = unit.glow || unit.color || '#ffb454';
  const g = ctx.createRadialGradient(sizePx / 2, sizePx * 0.5, 0, sizePx / 2, sizePx * 0.5, sizePx * 0.62);
  g.addColorStop(0, hexToRgba(glowColor, 0.35));
  g.addColorStop(1, hexToRgba(glowColor, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, sizePx, sizePx);

  const bodyScale = sizePx / 34;
  ctx.save();
  ctx.translate(sizePx / 2, sizePx * 0.86);
  ctx.fillStyle = unit.color;
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.6 * (bodyScale / 1.8);
  // phase 0 + lean 0 (centered, no walk tilt) but punching=true — the
  // portrait catches the unit mid-attack (its own gesture: a boxer's
  // jab, or both arms raised for a "raise" unit) instead of standing
  // neutrally, which is what actually reads as "a cool pose".
  drawStudentBody(ctx, bodyScale, unit.accent, 0, 0, true, 0, unit.gesture || 'punch');
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

  const glowColor = def.glow || def.color || '#ff6f59';
  const g = ctx.createRadialGradient(sizePx / 2, sizePx * 0.5, 0, sizePx / 2, sizePx * 0.5, sizePx * 0.62);
  g.addColorStop(0, hexToRgba(glowColor, 0.3));
  g.addColorStop(1, hexToRgba(glowColor, 0));
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, sizePx, sizePx);

  const bodyScale = sizePx / 46;
  const fakeEnemy = {
    x: sizePx / 2, y: sizePx * 0.8,
    size: 16 * bodyScale, color: def.color,
    hp: 1, maxHp: 1, slowUntil: 0, evasive: 0, dir: 1, typeId: def.id,
  };
  drawEnemy(ctx, fakeEnemy, 0);

  return canvas;
}

function hexToRgba(hex, alpha) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(255, 180, 84, ${alpha})`;
  const r = parseInt(m[1], 16), g = parseInt(m[2], 16), b = parseInt(m[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
