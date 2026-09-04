import { drawHead } from './drawFigure.js';
import { drawEnemy } from './drawEnemy.js';

// A student trading-card portrait — matching the player's own sketch
// exactly: just the head and a sliver of neck, sitting low in the box
// with a lot of empty space above it, not a full standing body. A unit
// can carry portraitFlairLeft/Right (e.g. The 6-7 Kid's "6"/"7") to sit
// beside the head, same as the sketch.
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

  // headCy sits low enough that the neck lands right at the bottom edge
  // — all the empty space stacks above him, instead of him floating with
  // a gap on both sides.
  const headR = sizePx * 0.15;
  const headCx = sizePx / 2;
  const headCy = sizePx * 0.77;

  ctx.fillStyle = unit.color;
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = Math.max(1.4, sizePx * 0.012);

  // A tiny neck sliver directly below the head — drawn first so the
  // head's own outline covers the seam between the two shapes.
  ctx.beginPath();
  ctx.rect(headCx - headR * 0.45, headCy + headR * 0.65, headR * 0.9, headR * 0.55);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(headCx, headCy, headR, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  if (unit.portraitFlairLeft || unit.portraitFlairRight) {
    ctx.fillStyle = '#ffd670';
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 1;
    ctx.font = `800 ${Math.round(headR * 1.05)}px 'Baloo 2', sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (unit.portraitFlairLeft) {
      ctx.fillText(unit.portraitFlairLeft, headCx - headR * 1.9, headCy);
      ctx.strokeText(unit.portraitFlairLeft, headCx - headR * 1.9, headCy);
    }
    if (unit.portraitFlairRight) {
      ctx.fillText(unit.portraitFlairRight, headCx + headR * 1.9, headCy);
      ctx.strokeText(unit.portraitFlairRight, headCx + headR * 1.9, headCy);
    }
  }

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
