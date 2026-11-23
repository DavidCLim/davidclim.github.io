import { TAU, K, UNIT, FEET } from './config.js?v=12';
import { drawLayer, OUT } from './sprites.js?v=12';
import { drawDrop } from './art_units.js?v=12';

// Drawing for everything beyond the soldier and sniper: the egg-bodied
// units (flamethrower, roman, grenadier, archer, knight, ninja), the
// cavalry, and the effects they make (flames, bombs, blasts, arrows).

const GZ = [0, 1, 2, 0, 2]; // idle gaze 0..4 -> right / centre / left
const lerp = (a, b, t) => a + (b - a) * t;

function drawHurtMarks(ctx, sprites, u) {
  if (u.hp >= u.def.hp * 0.65) return;
  drawLayer(ctx, sprites.hurt[u.hp < u.def.hp * 0.3 ? 1 : 0]);
}

function burnGlow(ctx, u, rx, ry, cx = 0, cy = 0) {
  if (u.burn <= 0) return;
  ctx.fillStyle = `rgba(255, 120, 20, ${0.28 + 0.12 * Math.sin(u.breath * 18)})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.fill();
}

// Feet, body and face shared by every egg-shaped unit. Leaves the context
// in the body's (bobbing) space so the caller can add weapons.
function eggBase(ctx, dpr, sprites, A, u, before) {
  const f = u.facing;
  const ph = (u.anim * Math.PI) / 2;
  const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
  ctx.setTransform(f * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  drawLayer(ctx, A.feet[u.moving ? (u.anim | 0) & 3 : 0]);
  const pose = u.pose;
  if (u.moving) {
    ctx.translate(0, -Math.abs(Math.sin(ph)) * 2.4);
    ctx.rotate(Math.sin(ph) * 0.07);
  } else if (pose < 1) {
    ctx.translate(0, Math.sin(u.breath * 2.2) * 0.55 * (1 - pose));
  }
  if (before) {
    ctx.save();
    before();
    ctx.restore();
  }
  if (pose < 0.5) drawLayer(ctx, A.torsoFront[GZ[u.gaze]]);
  else drawLayer(ctx, u.species === 'roman' && u.target ? A.torsoAngry : A.torso);
  drawHurtMarks(ctx, sprites, u);
  burnGlow(ctx, u, 20 * K, 23 * K);
}

function drawFlamethrower(ctx, dpr, sprites, u) {
  const A = sprites.flamethrower;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  ctx.translate(lerp(14 * K, d.pivot.x, pose), lerp(5 * K, d.pivot.y, pose));
  ctx.rotate(lerp(1.1, u.aim, pose));
  drawLayer(ctx, u.firing ? A.nozzleFire : A.nozzle);
}

function drawRoman(ctx, dpr, sprites, u) {
  const A = sprites.roman;
  const pose = u.pose;
  const fight = pose >= 0.5;
  // walking, the shield stands behind and the spear leans back over the
  // shoulder; fighting, the shield comes round to the front and the spear
  // levels out and jabs.
  eggBase(ctx, dpr, sprites, A, u, () => {
    if (!fight) {
      ctx.translate(lerp(-19 * K, -4 * K, pose * 2), 9 * K);
      drawLayer(ctx, A.shield);
    }
  });
  const body = ctx.getTransform();
  const p = 1 - u.atk;
  const thrust = u.atk > 0 ? Math.sin(p * Math.PI) * 16 * K : 0;
  const ang = lerp(-2.0, u.aim - 0.04, pose);
  ctx.translate(lerp(12 * K, 6 * K, pose), lerp(10 * K, 5 * K, pose));
  ctx.rotate(ang);
  ctx.translate(pose * thrust, 0);
  drawLayer(ctx, A.spear);
  if (fight) {
    ctx.setTransform(body);
    ctx.translate(lerp(19 * K, 21 * K, Math.min(1, (pose - 0.5) * 2)), 7 * K);
    drawLayer(ctx, A.shield);
  }
}

function drawGrenadier(ctx, dpr, sprites, u) {
  const A = sprites.grenadier;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  let p = 0;
  if (u.throwT > 0) p = 1 - u.throwT / d.throwTime;
  if (p > 0.65) return; // the bomb has left the hand
  // the arm lifts the bomb up and back for the throw
  const lift = Math.sin(Math.min(1, p / 0.65) * Math.PI * 0.5);
  ctx.translate(lerp(19 * K, 8 * K, lift), lerp(14 * K, -17 * K, lift));
  ctx.rotate(lift * -0.6);
  const lit = u.pose > 0.5 && u.cdT < 0.9 && u.cdT > 0;
  drawLayer(ctx, lit ? A.bombLit : A.bomb);
}

function drawArcher(ctx, dpr, sprites, u) {
  const A = sprites.archer;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  ctx.translate(lerp(24 * K, d.pivot.x, pose), lerp(4 * K, d.pivot.y, pose));
  ctx.rotate(lerp(0, u.aim, pose));
  const draw = u.drawT > 0 ? Math.min(1, u.drawT / d.drawTime) : 0;
  ctx.translate(-u.recoil * 1.5, 0);
  drawLayer(ctx, draw > 0 ? A.bowDrawn : A.bow);
  if (pose > 0.5) {
    ctx.save();
    ctx.translate(-10 * K * draw - 1 * K, 0);
    ctx.scale(0.85, 0.85);
    drawLayer(ctx, A.arrow);
    ctx.restore();
  }
}

// Knight, with his lance held out in front.
function drawKnight(ctx, dpr, sprites, u) {
  const A = sprites.knight;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  const p = 1 - u.atk;
  const thrust = u.atk > 0 ? Math.sin(p * Math.PI) * 18 * K : 0;
  ctx.translate(lerp(16 * K, 8 * K, pose), lerp(14 * K, 12 * K, pose));
  ctx.rotate(lerp(-1.05, u.aim - 0.12, pose));
  ctx.translate(thrust, 0);
  drawLayer(ctx, A.lance);
}

function drawNinja(ctx, dpr, sprites, u) {
  const A = sprites.ninja;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  const px = lerp(15 * K, 10 * K, pose);
  const py = lerp(11 * K, 10 * K, pose);
  const rest = -0.95;
  let ang = rest;
  const slashing = u.atk > 0;
  const p = 1 - u.atk;
  if (slashing) {
    const a0 = u.swing > 0 ? -1.6 : 0.9;
    const a1 = u.swing > 0 ? 0.9 : -1.6;
    ang = lerp(a0, a1, Math.min(1, p * 1.25));
    // the white crescent the blade leaves behind
    ctx.save();
    ctx.translate(px, py);
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.8 * u.atk})`;
    ctx.lineWidth = 3.2 * (0.5 + u.atk);
    ctx.beginPath();
    ctx.arc(0, 0, 40 * K, Math.min(a0, ang) - 0.05, Math.max(a0, ang) + 0.05);
    ctx.stroke();
    ctx.restore();
  }
  ctx.translate(px, py);
  ctx.rotate(lerp(rest, ang, pose > 0.5 ? 1 : 0));
  drawLayer(ctx, A.katana);
}

function drawCavalry(ctx, dpr, sprites, u) {
  const A = sprites.cavalry;
  const f = u.facing;
  const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
  ctx.setTransform(f * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  drawLayer(ctx, A.shadow);
  const gait = u.moving ? ((u.anim * 0.8) | 0) & 3 : 1;
  if (u.moving) {
    ctx.translate(0, -Math.abs(Math.sin(u.anim * 0.8 * Math.PI * 0.5)) * 2.6);
    ctx.rotate(Math.sin(u.anim * 0.8 * Math.PI * 0.5) * 0.03);
  } else {
    ctx.translate(0, Math.sin(u.breath * 1.8) * 0.5);
  }
  drawLayer(ctx, A.horse[gait]);
  burnGlow(ctx, u, 30 * K, 14 * K);
  ctx.save();
  ctx.translate(-1 * K, -22 * K);
  ctx.scale(1.2, 1.2);
  drawLayer(ctx, A.rider);
  ctx.restore();
  // lance held out front; levels out when charging and jabs on a strike
  const p = 1 - u.atk;
  const thrust = u.atk > 0 ? Math.sin(p * Math.PI) * 20 * K : 0;
  ctx.translate(6 * K, -17 * K);
  ctx.rotate(lerp(-0.62, -0.22, Math.max(u.charge, u.atk)));
  ctx.translate(thrust, 0);
  drawLayer(ctx, A.lance);
}

const DRAWERS = {
  flamethrower: drawFlamethrower,
  roman: drawRoman,
  grenadier: drawGrenadier,
  archer: drawArcher,
  knight: drawKnight,
  ninja: drawNinja,
  cavalry: drawCavalry,
};

export function drawUnit(ctx, dpr, sprites, u) {
  DRAWERS[u.species](ctx, dpr, sprites, u);
}

// ------------------------------------------------------------- effects
// A soft orange blob, drawn once and stamped for every part of a blast.
function makeBlob() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255, 238, 150, 1)');
  gr.addColorStop(0.35, 'rgba(255, 168, 48, 0.95)');
  gr.addColorStop(0.75, 'rgba(240, 110, 25, 0.5)');
  gr.addColorStop(1, 'rgba(240, 110, 25, 0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
}
let blob = null;

export function drawFx(ctx, dpr, sprites, world) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!blob) blob = makeBlob();

  // flamethrower fire (and the flames on burning units)
  for (const f of world.flames) {
    const t = f.age / f.life;
    const a = Math.max(0, 1 - t);
    const r = f.size * (1 + (f.small ? 0.8 : 1.3) * t);
    ctx.fillStyle = `rgba(${f.small ? '255, 150, 30' : '250, 118, 30'}, ${0.8 * a})`;
    ctx.beginPath();
    ctx.arc(f.x, f.y, r, 0, TAU);
    ctx.fill();
    if (f.dot || f.small) {
      ctx.fillStyle = `rgba(255, 215, 70, ${0.95 * a})`;
      ctx.beginPath();
      ctx.arc(f.x + 1, f.y - 1, r * 0.55, 0, TAU);
      ctx.fill();
    }
  }

  // bombs in the air
  const bomb = sprites.grenadier.bombLit;
  for (const b of world.bombs) {
    const p = b.age / b.dur;
    const gx = lerp(b.x0, b.x1, p);
    const gy = lerp(b.y0, b.y1, p);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.16)';
    ctx.beginPath();
    ctx.ellipse(gx, gy + FEET * 0.6, 5, 2, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(gx, gy - 4 * b.h * p * (1 - p));
    ctx.rotate(b.age * b.spin);
    drawLayer(ctx, bomb);
    ctx.restore();
  }

  // explosions: soft fireballs, expanding rings, a white flash
  for (const e of world.blasts) {
    const t = e.age / e.life;
    const grow = 1 - (1 - Math.min(1, t * 2.2)) ** 2;
    const fade = Math.max(0, 1 - t);
    for (let i = 0; i < 5; i++) {
      const a = (i / 5) * TAU + e.seed * 6;
      const off = e.r * 0.34 * grow * (i === 0 ? 0 : 1);
      const rad = e.r * (i === 0 ? 0.95 : 0.6) * (0.35 + 0.65 * grow);
      ctx.globalAlpha = fade * fade * (i === 0 ? 0.95 : 0.8);
      const bx = e.x + Math.cos(a) * off;
      const by = e.y + Math.sin(a) * off * 0.8;
      ctx.drawImage(blob, bx - rad, by - rad, rad * 2, rad * 2);
    }
    for (const [delay, col] of [[0, '255, 214, 70'], [0.12, '255, 170, 50']]) {
      const q = (t - delay) / (1 - delay);
      if (q <= 0) continue;
      ctx.globalAlpha = Math.max(0, 1 - q);
      ctx.strokeStyle = `rgba(${col}, 1)`;
      ctx.lineWidth = 3.4 * (1 - q) + 0.8;
      ctx.beginPath();
      ctx.ellipse(e.x, e.y, e.r * (0.25 + 0.95 * q), e.r * (0.25 + 0.95 * q) * 0.82, 0, 0, TAU);
      ctx.stroke();
    }
    if (t < 0.18) {
      ctx.globalAlpha = (1 - t / 0.18) * 0.9;
      ctx.fillStyle = '#fffbe0';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r * 0.34, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  // arrows in flight
  const arrow = sprites.archer.arrow;
  for (const a of world.arrows) {
    const p = Math.min(1, a.age / a.dur);
    const gx = lerp(a.x0, a.x1, p);
    const gy = lerp(a.y0, a.y1, p);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(gx, gy + FEET * 0.5, 4, 1.5, 0, 0, TAU);
    ctx.fill();
    const slope = a.y1 - a.y0 + 4 * a.h * (2 * p - 1);
    ctx.save();
    ctx.translate(gx, gy - 4 * a.h * p * (1 - p));
    ctx.rotate(Math.atan2(slope, a.x1 - a.x0));
    ctx.scale(0.66, 0.66);
    ctx.translate(-16 * K, 0);
    drawLayer(ctx, arrow);
    ctx.restore();
  }

  // headgear blown into the air
  for (const d of world.debris) {
    const sh = Math.max(0.35, 1 - d.z / 220);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * sh})`;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y + FEET * 0.7, 9 * UNIT * sh, 3 * UNIT * sh, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(d.x, d.y + FEET * 0.7 - d.z);
    ctx.rotate(d.rot);
    ctx.scale(UNIT, UNIT);
    drawDrop(ctx, d.species);
    ctx.restore();
  }
}

// ------------------------------------------------------------- ground marks
// What a unit leaves on the ground when it dies.
export function stampDrop(g, species, x, y) {
  g.save();
  g.translate(x + (Math.random() - 0.5) * 22 * UNIT, y + (Math.random() - 0.5) * 8 * UNIT);
  g.rotate((Math.random() - 0.5) * 1.7);
  g.scale(UNIT, UNIT);
  g.globalAlpha = 0.92;
  drawDrop(g, species);
  g.restore();
}

// An arrow that missed (or hit) stays stuck in the ground.
export function stampArrow(g, a) {
  const ang = Math.atan2(a.y1 - a.y0 + 4 * a.h, a.x1 - a.x0);
  g.save();
  g.translate(a.x1, a.y1);
  g.rotate(ang);
  g.scale(K / 0.56, K / 0.56);
  g.lineCap = 'round';
  g.strokeStyle = '#6b5a44';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-6, 0);
  g.lineTo(0, 0);
  g.stroke();
  g.fillStyle = '#d83a35';
  g.strokeStyle = '#8f1f1f';
  g.lineWidth = 0.6;
  g.beginPath();
  g.moveTo(-9, -2.2);
  g.lineTo(-4.5, -0.2);
  g.lineTo(-4.5, 0.2);
  g.lineTo(-9, 2.2);
  g.closePath();
  g.fill();
  g.stroke();
  g.restore();
}

// ------------------------------------------------------------- palette icons
// [canvas width in art px, body x, body y, drawing]
const ICONS = {
  flamethrower: [96, 32, 33, (g, S) => {
    g.translate(8 * K, 5 * K);
    g.rotate(0.08);
    drawLayer(g, S.nozzle);
  }],
  roman: [100, 50, 47, (g, S) => {
    g.save();
    g.translate(23 * K, 10 * K);
    drawLayer(g, S.shield);
    g.restore();
    g.translate(11 * K, 8 * K);
    g.rotate(-1.4);
    drawLayer(g, S.spear);
  }],
  grenadier: [84, 32.3, 29, (g, S) => {
    g.translate(19 * K, 14 * K);
    drawLayer(g, S.bombLit);
  }],
  archer: [90, 34, 31, (g, S) => {
    g.translate(22 * K, 4 * K);
    drawLayer(g, S.bow);
    g.translate(-1 * K, 0);
    g.scale(0.85, 0.85);
    drawLayer(g, S.arrow);
  }],
  cavalry: [124, 50, 64, null],
  ninja: [100, 42, 40, (g, S) => {
    g.translate(10 * K, 10 * K);
    g.rotate(-0.95);
    drawLayer(g, S.katana);
  }],
  knight: [100, 36, 46, (g, S) => {
    g.translate(8 * K, 12 * K);
    g.rotate(-0.95);
    drawLayer(g, S.lance);
  }],
};

export function hasIcon(species) {
  return species in ICONS;
}

export function paintUnitIcon(canvas, sprites, species) {
  const [w, ox, oy, extra] = ICONS[species];
  const S = sprites[species];
  const g = canvas.getContext('2d');
  const m = canvas.width / (w * K);
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  g.translate((ox * canvas.width) / w, (oy * canvas.width) / w);
  g.scale(m, m);
  if (species === 'cavalry') {
    drawLayer(g, S.shadow);
    drawLayer(g, S.horse[1]);
    g.save();
    g.translate(-1 * K, -22 * K);
    g.scale(1.2, 1.2);
    drawLayer(g, S.rider);
    g.restore();
    g.translate(6 * K, -17 * K);
    g.rotate(-0.62);
    drawLayer(g, S.lance);
  } else {
    drawLayer(g, S.feet[0]);
    drawLayer(g, S.torso);
    extra(g, S);
  }
  g.restore();
}
