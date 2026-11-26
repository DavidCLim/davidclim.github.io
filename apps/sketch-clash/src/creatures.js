import { TAU, K, FEET, UNIT } from './config.js?v=209';
import { makeLayer, drawLayer } from './sprites.js?v=209';
import { ANIMALS } from './art_animals.js?v=209';
import { MYTHIC } from './art_mythic.js?v=209';

// Sprites and drawing for the creatures that aren't egg-shaped: every animal,
// the slime, giant and dragon. Each gets 8 walk frames, a few idle (breathing)
// frames, an open-mouth frame and its special poses, all pre-rendered.
const DEFS = { ...ANIMALS, ...MYTHIC };
export const CREATURE_IDS = Object.keys(DEFS);

const POSES = { ape: ['raise'], giant: ['raise', 'slam'], snake: ['strike'], dragon: ['breath'], mechazord: ['breath'] };
const GAIT = { boar: 8, rat: 15, ant: 15, ape: 7, alligator: 7, piranha: 11, snake: 7, cheetah: 13, slime: 6, giant: 5, dragon: 7, mechazord: 7 };

function silhouette(layer, fill) {
  const c = document.createElement('canvas');
  c.width = layer.canvas.width;
  c.height = layer.canvas.height;
  const g = c.getContext('2d');
  g.drawImage(layer.canvas, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = fill;
  g.fillRect(0, 0, c.width, c.height);
  return c;
}

function ghostOf(layer) {
  const c = document.createElement('canvas');
  c.width = layer.canvas.width + 4;
  c.height = layer.canvas.height + 4;
  const g = c.getContext('2d');
  const edge = silhouette(layer, '#575c72');
  const body = silhouette(layer, '#cfdaf7');
  for (const [dx, dy] of [[-1.4, 0], [1.4, 0], [0, -1.4], [0, 1.4]]) g.drawImage(edge, 2 + dx, 2 + dy);
  g.drawImage(body, 2, 2);
  const k = layer.w / layer.canvas.width;
  return { canvas: c, x: layer.x - 2 * k, y: layer.y - 2 * k, w: c.width * k, h: c.height * k };
}

export function buildCreatureArt() {
  const out = {};
  for (const [id, c] of Object.entries(DEFS)) {
    const [x0, y0, x1, y1] = c.box;
    const mk = (st) => makeLayer(x0, y0, x1, y1, (g) => c.draw(g, st));
    const A = { walk: [], idle: [], poses: {} };
    for (let i = 0; i < 8; i++) A.walk.push(mk({ ph: i / 8, moving: true }));
    for (let i = 0; i < 4; i++) A.idle.push(mk({ ph: i / 4, moving: false }));
    A.open = mk({ ph: 0.1, moving: false, open: true });
    for (const p of POSES[id] || []) A.poses[p] = mk({ ph: 0.1, moving: false, pose: p, open: p === 'breath' });
    if (id === 'dragon' || id === 'mechazord') {
      A.walkBreath = [];
      for (let i = 0; i < 8; i++) A.walkBreath.push(mk({ ph: i / 8, moving: true, pose: 'breath', open: true }));
    }
    A.flash = { layer: A.idle[0], canvas: silhouette(A.idle[0], '#cedefc') };
    A.ghost = ghostOf(A.idle[0]);
    A.gait = GAIT[id] || 8;
    out[id] = A;
  }
  return out;
}

function place(ctx, dpr, u, wobble) {
  ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  if (u.tilt) {
    ctx.translate(0, FEET);
    ctx.rotate(u.tilt);
    ctx.translate(0, -FEET);
  }
}

function pickFrame(u, A) {
  const id = u.species;
  const atk = u.atk;
  if (id === 'giant' && atk > 0) return atk > 0.5 ? A.poses.raise : A.poses.slam;
  if (id === 'ape' && atk > 0.45) return A.poses.raise;
  if (id === 'snake' && atk > 0) return A.poses.strike;
  if ((id === 'dragon' || id === 'mechazord') && u.firing) return u.moving ? A.walkBreath[(u.anim | 0) & 7] : A.poses.breath;
  if (u.moving) return A.walk[(u.anim | 0) & 7];
  if (atk > 0.25 && atk < 0.95 && id !== 'slime' && id !== 'piranha') return A.open;
  if (id === 'piranha' && atk > 0) return A.open;
  return A.idle[((u.breath * 1.6) | 0) & 3];
}

// `overlay(ctx, u, rx, ry, cx, cy)` paints burning / frozen / poisoned tints.
export function drawCreature(ctx, dpr, sprites, u, overlay) {
  const A = sprites[u.species];
  const d = u.def;
  const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
  place(ctx, dpr, u, wobble);
  const sc = (u.scale || 1) * (u.rise !== undefined && u.rise < 1 ? 0.25 + 0.75 * u.rise : 1);
  if (sc !== 1) {
    ctx.translate(0, FEET);
    ctx.scale(sc, sc);
    ctx.translate(0, -FEET);
  }
  const alt = d.flying ? 1 : u.alt || 0;
  if (alt > 0.01 || d.shadowR) {
    // hovers above its shadow
    ctx.save();
    ctx.translate(0, FEET);
    ctx.scale(1, 0.22);
    ctx.fillStyle = `rgba(30, 30, 40, ${d.shadowR ? 0.26 - alt * 0.1 : 0.2})`;
    ctx.beginPath();
    ctx.arc(0, 0, (d.shadowR || 15) * (1 - alt * 0.18), 0, TAU);
    ctx.fill();
    ctx.restore();
  }
  if (alt > 0.01) ctx.translate(0, -alt * ((d.hoverH || 7) + Math.sin(u.breath * 3.2) * 1.2 + (u.moving ? 0 : 0.6)));
  let lunge = 0;
  if (u.atk > 0 && d.kind === 'beast') {
    const p = 1 - u.atk;
    lunge = Math.sin(p * Math.PI) * (u.species === 'giant' ? 4 : u.species === 'ape' ? 3 : 10) * K;
  }
  if (lunge) ctx.translate(lunge, 0);
  if (d.flop && !u.inWater) {
    // out of water a piranha lies on its side, flopping about
    ctx.translate(0, FEET - 3);
    ctx.rotate(1.35 + Math.sin(u.breath * 17) * 0.28);
    ctx.translate(0, -(FEET - 3));
  }
  // a hop or a waddle bobs the whole body slightly
  const frame = pickFrame(u, A);
  drawLayer(ctx, frame);
  if (u.hit > 0) {
    ctx.globalAlpha = 0.8;
    const f = A.flash;
    ctx.drawImage(f.canvas, f.layer.x, f.layer.y, f.layer.w, f.layer.h);
    ctx.globalAlpha = 1;
  }
  const b = d.body;
  if (overlay && b) overlay(ctx, u, b[0] * K, b[1] * K, 0, b[2] * K);
}

// The palette / legend icon: the standing creature, trimmed to its drawn pixels and fitted into the canvas.
const bboxCache = new Map();
function contentBox(layer) {
  let b = bboxCache.get(layer);
  if (b) return b;
  const c = layer.canvas;
  const d = c.getContext('2d').getImageData(0, 0, c.width, c.height).data;
  let x0 = c.width;
  let y0 = c.height;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (d[(y * c.width + x) * 4 + 3] > 40) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
    }
  }
  b = { x0, y0, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  bboxCache.set(layer, b);
  return b;
}

export function paintCreatureIcon(canvas, sprites, id) {
  const A = sprites[id];
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  const L = A.idle[0];
  const b = contentBox(L);
  const s = Math.min((canvas.width * 0.78) / b.w, (canvas.height * 0.8) / b.h);
  const w = b.w * s;
  const h = b.h * s;
  g.drawImage(L.canvas, b.x0, b.y0, b.w, b.h, (canvas.width - w) / 2, canvas.height * 0.93 - h, w, h);
}

export { DEFS as CREATURE_DEFS };
