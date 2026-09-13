import { drawHumanBody, drawButtons, drawRoundBlob, drawHead } from './drawFigure.js';
import { TEACHERS } from '../data/teachers.js';

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

const spriteCache = {};
function getSprite(path) {
  let img = spriteCache[path];
  if (!img) { img = new Image(); img.src = path; spriteCache[path] = img; }
  return img;
}

// Sized to match drawHumanBody's own footprint at scale 1 (head top at
// -29, feet around +15) so a real sprite lines up with the procedural
// shapes it stands in for.
const SPRITE_H = 44;
const SPRITE_TOP = -29;

function drawScaledSprite(ctx, img) {
  const w = SPRITE_H * (img.naturalWidth / img.naturalHeight);
  ctx.drawImage(img, -w / 2, SPRITE_TOP, w, SPRITE_H);
}

export function drawEnemy(ctx, enemy, t) {
  const { x, y, size, color, hp, maxHp, slowUntil, evasive, dir, typeId } = enemy;
  const scale = size / 16;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (dir < 0 ? -1 : 1), scale);

  const flicker = evasive && Math.sin(t * 14 + x) > 0.6 ? 0.4 : 1;
  ctx.globalAlpha = flicker;

  const spritePath = TEACHERS[typeId] && TEACHERS[typeId].battleSprite;
  const sprite = spritePath ? getSprite(spritePath) : null;
  if (sprite && sprite.complete && sprite.naturalWidth) {
    const phase = t * 9 + x * 0.08;
    const bounce = Math.abs(Math.sin(phase));
    const bob = bounce * 3;
    const squash = 1 - bounce * 0.04;
    const tilt = Math.sin(phase * 2) * 0.04;
    ctx.save();
    ctx.translate(0, -bob);
    ctx.rotate(tilt);
    ctx.scale(1, squash);
    drawScaledSprite(ctx, sprite);
    ctx.restore();
  } else {
    ctx.fillStyle = color;
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 1.6;
    const shapeFn = SHAPES[typeId] || SHAPES.random1;
    shapeFn(ctx);
  }

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
