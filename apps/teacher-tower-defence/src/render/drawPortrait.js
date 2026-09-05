import { drawHead } from './drawFigure.js';
import { drawEnemy } from './drawEnemy.js';

// A student trading-card portrait — matching the player's own reference
// card exactly: a 4:3 box with the head sitting low (a sliver of neck
// clipped by the bottom edge) and, for a unit carrying
// portraitFlairLeft/Right (The 6-7 Kid's "6"/"7"), a pair of huge
// accent-colored digits filling most of the box on either side of the
// head — not a full standing body.
export function renderUnitPortrait(unit, sizePx = 120) {
  const w = sizePx;
  const h = sizePx * 0.75;
  const canvas = document.createElement('canvas');
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  canvas.style.display = 'block';

  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);

  if (unit.portraitFlairLeft || unit.portraitFlairRight) {
    ctx.fillStyle = unit.accent || '#e8482c';
    ctx.font = `800 ${Math.round(h * 0.68)}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (unit.portraitFlairLeft) ctx.fillText(unit.portraitFlairLeft, w * 0.2, h * 0.42);
    if (unit.portraitFlairRight) ctx.fillText(unit.portraitFlairRight, w * 0.8, h * 0.42);
  }

  // headCy sits low enough that the neck sliver runs past the bottom
  // edge and gets clipped there, same as the reference.
  const headR = h * 0.24;
  const headCx = w / 2;
  const headCy = h * 0.72;

  ctx.fillStyle = unit.color;
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = Math.max(1.4, h * 0.018);

  // A round collar behind the head, mostly covered by it — only the
  // bottom crescent peeks out, same rounded sliver as the reference
  // (not a hard-cornered rectangle).
  ctx.beginPath();
  ctx.arc(headCx, headCy + headR * 0.8, headR * 0.75, 0, Math.PI * 2);
  ctx.fillStyle = unit.accent || unit.color;
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
  ctx.fillStyle = unit.color;
  ctx.fill();
  ctx.stroke();

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
