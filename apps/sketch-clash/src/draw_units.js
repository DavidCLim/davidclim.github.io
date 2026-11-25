import { TAU, K, UNIT, FEET } from './config.js?v=119';
import { drawLayer, OUT } from './sprites.js?v=119';
import { drawDrop } from './art_units.js?v=119';
import { drawCreature, paintCreatureIcon, CREATURE_IDS } from './creatures.js?v=119';
import { EGG_DROPS } from './art_eggs.js?v=119';

// Drawing for everything beyond the soldier and sniper: the egg-bodied
// units (flamethrower, roman, grenadier, archer, knight, ninja), the
// cavalry, and the effects they make (flames, bombs, blasts, arrows).

const GZ = [0, 1, 2, 0, 2]; // idle gaze 0..4 -> right / centre / left
const lerp = (a, b, t) => a + (b - a) * t;

// Puts the unit on the ground, facing the right way, and tips it over about
// its feet by u.tilt (used while a unit falls).
export function placeUnit(ctx, dpr, u, wobble = 0) {
  ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  if (u.tilt) {
    ctx.translate(0, FEET);
    ctx.rotate(u.tilt);
    ctx.translate(0, -FEET);
  }
}

function drawHurtMarks(ctx, sprites, u) {
  if (u.hp >= u.def.hp * 0.65) return;
  drawLayer(ctx, sprites.hurt[u.hp < u.def.hp * 0.3 ? 1 : 0]);
}

// A burning unit goes flat orange all over with a soft glow around it, as in the video.
export function burnOverlay(ctx, u, rx, ry, cx = 0, cy = 0) {
  if (u.slow > 0) {
    ctx.fillStyle = `rgba(140, 210, 255, ${0.5 * Math.min(1, u.slow / 0.5)})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fill();
  }
  if (u.poison > 0) {
    ctx.fillStyle = `rgba(120, 215, 70, ${0.42 * Math.min(1, u.poison / 0.6)})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fill();
  }
  if (u.burn <= 0) return;
  const t = Math.min(1, u.burn / 1.2);
  ctx.save();
  const gr = ctx.createRadialGradient(cx, cy, rx * 0.6, cx, cy, rx * 1.9);
  gr.addColorStop(0, `rgba(255, 150, 50, ${0.32 * t})`);
  gr.addColorStop(1, 'rgba(255, 150, 50, 0)');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(cx, cy, rx * 1.9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = `rgba(247, 152, 58, ${(0.62 + 0.1 * Math.sin(u.breath * 16)) * t})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function burnGlow(ctx, u, rx, ry, cx = 0, cy = 0) {
  burnOverlay(ctx, u, rx, ry, cx, cy);
}

// Feet, body and face shared by every egg-shaped unit. Leaves the context
// in the body's (bobbing) space so the caller can add weapons.
function eggBase(ctx, dpr, sprites, A, u, before) {
  const ph = (u.anim * Math.PI) / 2;
  const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
  placeUnit(ctx, dpr, u, wobble);
  if (u.rise !== undefined && u.rise < 1) {
    ctx.translate(0, FEET);
    ctx.scale(1, 0.15 + 0.85 * u.rise);
    ctx.translate(0, -FEET);
  }
  if (u.atk > 0 && u.def.kind === 'beast') ctx.translate(Math.sin((1 - u.atk) * Math.PI) * 4 * K, 0);
  drawLayer(ctx, A.feet[u.moving ? (u.anim | 0) & 3 : 0]);
  const pose = u.pose;
  if (u.moving) {
    // an upright waddle, as in the video: the body bobs a little and squashes
    // down onto its feet as the legs spread
    const wk = Math.abs(Math.sin(ph));
    ctx.translate(0, FEET);
    ctx.scale(1 + 0.045 * (1 - wk), 1 - 0.06 * (1 - wk));
    ctx.translate(0, -FEET - wk * 1.5);
  } else if (pose < 1) {
    ctx.translate(0, Math.sin(u.breath * 2.2) * 0.55 * (1 - pose));
  }
  if (before) {
    ctx.save();
    before();
    ctx.restore();
  }
  if (pose < 0.5) drawLayer(ctx, A.torsoSide[GZ[u.gaze]]);
  else drawLayer(ctx, (u.species === 'roman' && u.target) || (u.species === 'archer' && u.drawT > u.def.drawTime - 0.55) ? A.torsoAngry : A.torso);
  drawHurtMarks(ctx, sprites, u);
  burnGlow(ctx, u, 20 * K, 23 * K);
  drawHitFlash(ctx, u, 20.5 * K, 23 * K);
}

// A fallen unit stares up with dizzy spiral eyes.
export function drawDizzyEyes(ctx, u) {
  ctx.lineCap = 'round';
  for (const ex of [1.5, 11.5]) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#17141a';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(ex * K, -4.5 * K, 4.3 * K, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= 22; i++) {
      const a = i * 0.7;
      const r = 0.3 + i * 0.16;
      const px = ex * K + Math.cos(a) * r * K;
      const py = -4.5 * K + Math.sin(a) * r * K;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

// A hit turns the whole body white with dizzy spiral eyes and three stars circling over its head,
// then pale blue for a moment, as in the original.
export function drawHitFlash(ctx, u, rx, ry) {
  if (!(u.hit > 0)) return;
  const first = u.hit > 0.13;
  ctx.fillStyle = first ? 'rgba(255, 255, 255, 0.96)' : 'rgba(198, 217, 252, 0.88)';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#2a2d3a';
  ctx.lineCap = 'round';
  if (first) {
    ctx.lineWidth = 0.55;
    for (const ex of [1.5, 11.5]) {
      ctx.beginPath();
      for (let i = 0; i <= 26; i++) {
        const a = i * 0.62;
        const r = 0.25 + i * 0.16;
        const px = ex * K + Math.cos(a) * r * K * 1.15;
        const py = -4.5 * K + Math.sin(a) * r * K * 1.15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 0.45;
    for (const [sx, sy] of [[-7, -31], [3, -35], [13, -30]]) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = (i % 2 === 0 ? 3.2 : 1.3) * K;
        const a = (i / 10) * TAU - Math.PI / 2;
        if (i === 0) ctx.moveTo(sx * K + Math.cos(a) * r, sy * K + Math.sin(a) * r);
        else ctx.lineTo(sx * K + Math.cos(a) * r, sy * K + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // eyes screwed shut
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const ex of [1.5, 11.5]) {
      ctx.moveTo((ex - 3.2) * K, -4.5 * K);
      ctx.lineTo((ex + 3.2) * K, -4.5 * K);
    }
    ctx.stroke();
  }
}

function drawMinigunner(ctx, dpr, sprites, u) {
  const A = sprites.minigunner;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  ctx.translate(lerp(8 * K, d.pivot.x, pose) - u.recoil * 1.2 * K, lerp(11 * K, d.pivot.y, pose) + (u.flash > 0 ? (Math.random() - 0.5) * 0.7 : 0));
  ctx.rotate(lerp(0.06, u.aim, pose));
  drawLayer(ctx, u.flash > 0 ? A.gunFire : A.gun);
}

function drawRoman(ctx, dpr, sprites, u) {
  const A = sprites.roman;
  const pose = u.pose;
  eggBase(ctx, dpr, sprites, A, u);
  const body = ctx.getTransform();
  // Standing around the sword is held upright in front; fighting, it levels out and jabs.
  const p = 1 - u.atk;
  const thrust = u.atk > 0 ? Math.sin(p * Math.PI) * 16 * K : 0;
  ctx.translate(lerp(5.4 * K, -4 * K, pose), lerp(23.3 * K, 4 * K, pose));
  ctx.rotate(lerp(-1.32, u.aim - 0.04, pose));
  ctx.translate(pose * thrust, 0);
  drawLayer(ctx, A.spear);
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
  ctx.translate(lerp(17 * K, 8 * K, lift), lerp(12 * K, -17 * K, lift));
  ctx.rotate(lift * -0.6);
  const lit = u.pose > 0.5 && u.cdT < 0.9 && u.cdT > 0;
  drawLayer(ctx, lit ? A.bombLit : A.bomb);
}

function drawArcher(ctx, dpr, sprites, u) {
  const A = sprites.archer;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  // carried low with the arrow pointing down and forward, raised level to shoot
  ctx.translate(lerp(24 * K, d.pivot.x, pose), lerp(10 * K, d.pivot.y, pose));
  ctx.rotate(lerp(0, u.aim, pose));
  const draw = u.drawT > 0 ? Math.min(1, u.drawT / d.drawTime) : 0;
  // the bow jolts forward as the arrow leaves
  ctx.translate(u.recoil * 2.2 * K, 0);
  drawLayer(ctx, draw > 0 ? A.bowDrawn : A.bow);
  if (u.reloadT <= 0) {
    ctx.save();
    ctx.translate(-10 * K * draw - 1 * K, 0);
    ctx.scale(1.0, 1.0);
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
  const px = lerp(9 * K, 14 * K, pose);
  const py = lerp(12 * K, 10 * K, pose);
  const rest = lerp(-2.5, -0.8, Math.min(1, pose * 2)); // idle: blade held up and back
  let ang = rest;
  const slashing = u.atk > 0;
  const p = 1 - u.atk;
  if (slashing) {
    const a0 = u.swing > 0 ? -1.6 : 0.9;
    const a1 = u.swing > 0 ? 0.9 : -1.6;
    ang = lerp(a0, a1, Math.min(1, p * 1.25));
  }
  ctx.translate(px, py);
  ctx.rotate(slashing ? ang : rest);
  drawLayer(ctx, A.katana);
}

function drawCavalry(ctx, dpr, sprites, u) {
  const A = sprites.cavalry;
  const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
  placeUnit(ctx, dpr, u, wobble);
  drawLayer(ctx, A.shadow);
  const gait = u.moving ? ((u.anim * 0.8) | 0) & 3 : 4;
  if (u.moving) {
    ctx.translate(0, -Math.abs(Math.sin(u.anim * 0.8 * Math.PI * 0.5)) * 2.6);
    ctx.rotate(Math.sin(u.anim * 0.8 * Math.PI * 0.5) * 0.03);
  } else {
    ctx.translate(0, Math.sin(u.breath * 1.8) * 0.5);
  }
  drawLayer(ctx, A.horse[gait]);
  burnGlow(ctx, u, 30 * K, 14 * K);
  ctx.save();
  ctx.translate(-8 * K, -18 * K);
  ctx.scale(1.12, 1.12);
  drawLayer(ctx, A.rider);
  ctx.restore();
  // lance held out front; levels out when charging and jabs on a strike
  const p = 1 - u.atk;
  const thrust = u.atk > 0 ? Math.sin(p * Math.PI) * 20 * K : 0;
  ctx.translate(-3 * K, -14 * K);
  ctx.rotate(lerp(-0.64, -0.22, Math.max(u.charge, u.atk)));
  ctx.scale(0.7, 0.7);
  ctx.translate(thrust / 0.7, 0);
  drawLayer(ctx, A.lance);
}

// The cowboy: the sniper's look with a flintlock held low at his side, raised to
// aim and kicking back when it goes off.
function drawCowboy(ctx, dpr, sprites, u) {
  const A = sprites.cowboy;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  ctx.translate(lerp(14 * K, d.pivot.x, pose) - u.recoil * 2.2 * K, lerp(17 * K, d.pivot.y, pose));
  ctx.rotate(lerp(0.9, u.aim - u.recoil * 0.18, pose));
  ctx.scale(0.78, 0.78);
  drawLayer(ctx, u.flash > 0 ? A.pistolFire : A.pistol);
}

function drawZombie(ctx, dpr, sprites, u) {
  eggBase(ctx, dpr, sprites, sprites.zombie, u);
}

function drawSkeleton(ctx, dpr, sprites, u) {
  const A = sprites.skeleton;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  const p = 1 - u.atk;
  ctx.translate(lerp(14 * K, 14 * K, pose), lerp(11 * K, 9 * K, pose));
  // chopping down from overhead
  const chop = u.atk > 0 ? -1.5 + p * 2.3 : lerp(-0.9, -0.35, pose);
  ctx.rotate(chop);
  drawLayer(ctx, A.sword);
}

function drawStaffUnit(ctx, dpr, sprites, u, id) {
  const A = sprites[id];
  eggBase(ctx, dpr, sprites, A, u);
  const cd = u.def.castTime;
  const cp = u.castT > 0 ? 1 - u.castT / cd : 0;
  ctx.translate(lerp(23 * K, 25 * K, u.pose), 0);
  ctx.rotate(u.castT > 0 ? Math.sin(cp * Math.PI) * 0.62 : 0);
  drawLayer(ctx, u.castT > 0 ? A.staffGlow : A.staff);
}

const DRAWERS = {
  zombie: drawZombie,
  skeleton: drawSkeleton,
  mage: (ctx, dpr, sprites, u) => drawStaffUnit(ctx, dpr, sprites, u, 'mage'),
  necromancer: (ctx, dpr, sprites, u) => drawStaffUnit(ctx, dpr, sprites, u, 'necromancer'),
  ...Object.fromEntries(CREATURE_IDS.map((id) => [id, (ctx, dpr, sprites, u) => drawCreature(ctx, dpr, sprites, u, burnOverlay)])),
  minigunner: drawMinigunner,
  roman: drawRoman,
  grenadier: drawGrenadier,
  archer: drawArcher,
  knight: drawKnight,
  ninja: drawNinja,
  cavalry: drawCavalry,
  cowboy: drawCowboy,
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
  gr.addColorStop(0, 'rgba(255, 190, 70, 1)');
  gr.addColorStop(0.55, 'rgba(250, 150, 45, 0.95)');
  gr.addColorStop(0.85, 'rgba(235, 105, 25, 0.55)');
  gr.addColorStop(1, 'rgba(235, 105, 25, 0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
}
let blob = null;
const blobs = (() => {
  const mk = (rgb) => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb}, 1)`);
    gr.addColorStop(0.55, `rgba(${rgb}, 0.8)`);
    gr.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return c;
  };
  return { yellow: mk('255, 226, 110'), orange: mk('247, 150, 62'), brown: mk('176, 104, 46') };
})();

const discCache = new Map();
function softDisc(color) {
  let c = discCache.get(color);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  gr.addColorStop(0, color);
  gr.addColorStop(0.5, color);
  gr.addColorStop(1, color + '00');
  g.fillStyle = gr;
  g.fillRect(0, 0, 96, 96);
  discCache.set(color, c);
  return c;
}

const FIRE_RAMP = ['#ffd25a', '#ffc247', '#ffa83c', '#ff8f33', '#f98530', '#ee7b2c', '#e2782c', '#d6783a'];
function fireColor(age) {
  return FIRE_RAMP[Math.min(FIRE_RAMP.length - 1, Math.floor((age / 0.46) * FIRE_RAMP.length))];
}

// A blast is a ring of overlapping blobs, the same ones for fire and smoke.
function lumpsOf(e) {
  if (e.lumps) return e.lumps;
  const out = [{ x: 0, y: 0, s: 0.62 }];
  for (let i = 0; i < 6; i++) {
    const a = e.seed * 9 + i * 1.07 + (i % 2) * 0.4;
    const d = 0.3 + ((i * 37 + Math.floor(e.seed * 100)) % 20) / 100;
    out.push({ x: Math.cos(a) * d, y: Math.sin(a) * d * 0.9, s: 0.4 + ((i * 53 + Math.floor(e.seed * 77)) % 14) / 100 });
  }
  e.lumps = out;
  return out;
}

export function drawFx(ctx, dpr, sprites, world) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!blob) blob = makeBlob();

  // flamethrower fire (and the flames on burning units): soft blobs that begin as
  // small pale-yellow dots, swell into orange smudges, and end up charred brown
  for (const f of world.flames) {
    const t = f.age / f.life;
    const r = f.size + f.grow * t;
    const spr = t < 0.22 ? blobs.yellow : f.dark && t > 0.5 ? blobs.brown : blobs.orange;
    ctx.globalAlpha = Math.max(0, (t < 0.12 ? 0.55 + t * 3 : 0.8) * (1 - t * t));
    ctx.drawImage(spr, f.x - r, f.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;

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
    ctx.scale(0.62, 0.62);
    drawLayer(ctx, bomb);
    ctx.restore();
  }

  // explosions, as in the original: a yellow flash with a pale halo, a flat lumpy orange disc that
  // darkens, then a beige smoke cloud that hangs about and fades slowly
  for (const e of world.blasts) {
    const age = e.age;
    const r = e.r;
    const lumps = lumpsOf(e);
    if (age < 0.5) {
      const grow = 1 - (1 - Math.min(1, age / 0.2)) ** 2;
      const fire = age < 0.32 ? 1 : 1 - (age - 0.32) / 0.18;
      if (age < 0.09) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(softDisc('#fff3b0'), e.x - r * 0.75, e.y - r * 0.75, r * 1.5, r * 1.5);
      }
      ctx.globalAlpha = Math.max(0, fire);
      const spr = softDisc(fireColor(age));
      for (const l of lumps) {
        const rad = Math.max(1, r * 1.2 * l.s * (0.34 + 0.66 * grow));
        ctx.drawImage(spr, e.x + l.x * r * grow - rad, e.y + l.y * r * grow - rad, rad * 2, rad * 2);
      }
      if (age > 0.08 && age < 0.45) {
        const q = (age - 0.08) / 0.37;
        ctx.globalAlpha = 0.28 * (1 - q);
        ctx.strokeStyle = '#fff6cf';
        ctx.lineWidth = r * 0.1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * (0.9 + 0.7 * q), 0, TAU);
        ctx.stroke();
      }
    }
    if (age > 0.28) {
      const k = (age - 0.28) / (e.life - 0.28);
      const a = Math.min(1, (age - 0.28) / 0.25) * 0.55 * (1 - k) ** 1.4;
      ctx.globalAlpha = a;
      const spr = softDisc('#e2d9d5');
      const rise = (age - 0.28) * 5;
      for (const l of lumps) {
        const rad = r * 1.2 * l.s * (0.95 + 0.4 * k);
        ctx.drawImage(spr, e.x + l.x * r * 1.05 - rad, e.y + l.y * r * 1.05 - rad - rise, rad * 2, rad * 2);
      }
    }
  }
  ctx.globalAlpha = 1;

  // arrows in flight
  const arrow = sprites.archer.arrow;
  for (const a of world.arrows) {
    const p = Math.min(1, a.age / a.dur);
    const gx = lerp(a.x0, a.x1, p);
    const gy = lerp(a.y0, a.y1, p);
    if (a.kind === 'star') {
      if (a.age < 0) continue;
      // a four-pointed silver throwing star, spinning, with a shadow on the ground
      ctx.fillStyle = 'rgba(0, 0, 0, 0.14)';
      ctx.beginPath();
      ctx.ellipse(gx, gy + FEET * 0.5, 2.6, 1, 0, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(gx, gy - 4 * a.h * p * (1 - p));
      ctx.rotate(a.age * 22);
      ctx.fillStyle = '#c9cedb';
      ctx.strokeStyle = '#464a5a';
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? 3.4 : 1.1;
        const ang = (i / 8) * TAU;
        if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7c8190';
      ctx.beginPath();
      ctx.arc(0, 0, 0.7, 0, TAU);
      ctx.fill();
      ctx.restore();
      continue;
    }
    ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
    ctx.beginPath();
    ctx.ellipse(gx, gy + FEET * 0.5, 4, 1.5, 0, 0, TAU);
    ctx.fill();
    const slope = a.y1 - a.y0 + 4 * a.h * (2 * p - 1);
    if (a.age < 0.28) {
      // a fresh arrow trails a pale speed streak
      const ang0 = Math.atan2(slope, a.x1 - a.x0);
      ctx.strokeStyle = `rgba(150, 152, 162, ${0.6 * (1 - a.age / 0.28)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(gx, gy - 4 * a.h * p * (1 - p));
      ctx.lineTo(gx - Math.cos(ang0) * 24, gy - 4 * a.h * p * (1 - p) - Math.sin(ang0) * 24);
      ctx.stroke();
    }
    ctx.save();
    ctx.translate(gx, gy - 4 * a.h * p * (1 - p));
    ctx.rotate(Math.atan2(slope, a.x1 - a.x0));
    ctx.scale(1.6, 1.6); // the original's flying arrow is about 17px long
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
// Headgear and stuck arrows left on the ground. They are small pre-drawn
// sprites that fade out and disappear after MARK_LIFE seconds.
export const MARK_LIFE = 9;
const MARK_FADE = 3;
const markSprites = new Map();

function markSprite(key, w, h, draw) {
  let m = markSprites.get(key);
  if (m) return m;
  const sc = 3;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * sc);
  c.height = Math.ceil(h * sc);
  const g = c.getContext('2d');
  g.scale(sc, sc);
  g.translate(w / 2, h / 2);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  draw(g);
  m = { c, w, h };
  markSprites.set(key, m);
  return m;
}

// What a unit leaves on the ground when it dies.
export function dropMark(species, x, y) {
  return {
    spr: markSprite('drop-' + species, 44, 30, (g) => (EGG_DROPS[species] || ((h) => drawDrop(h, species)))(g)),
    x: x + (Math.random() - 0.5) * 22 * UNIT,
    y: y + (Math.random() - 0.5) * 8 * UNIT,
    rot: (Math.random() - 0.5) * 1.7,
    k: UNIT,
    age: 0,
  };
}

// An arrow that missed (or hit) stays stuck in the ground for a while.
export function arrowMark(a) {
  const spr = markSprite('arrow', 16, 8, (g) => {
    g.translate(4.5, 0);
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
  });
  const rot = Math.atan2(a.y1 - a.y0 + 4 * a.h, a.x1 - a.x0);
  // the video's stuck arrows are tiny red-tipped sticks that are gone in about five seconds
  const k = K * 1.05;
  return {
    spr,
    x: a.x1 - Math.cos(rot) * 4.5 * k,
    y: a.y1 - Math.sin(rot) * 4.5 * k,
    rot,
    k,
    age: 0,
    life: 5,
    fade: 1.1,
  };
}

export function stepMarks(marks, dt) {
  let gone = false;
  for (const m of marks) {
    m.age += dt;
    if (m.age >= (m.life || MARK_LIFE)) gone = true;
  }
  return gone ? marks.filter((m) => m.age < (m.life || MARK_LIFE)) : marks;
}

export function drawMarks(ctx, dpr, marks) {
  for (const m of marks) {
    const a = 0.92 * Math.min(1, ((m.life || MARK_LIFE) - m.age) / (m.fade || MARK_FADE));
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.setTransform(dpr * Math.cos(m.rot) * m.k, dpr * Math.sin(m.rot) * m.k, -dpr * Math.sin(m.rot) * m.k, dpr * Math.cos(m.rot) * m.k, m.x * dpr, m.y * dpr);
    ctx.drawImage(m.spr.c, -m.spr.w / 2, -m.spr.h / 2, m.spr.w, m.spr.h);
  }
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------- palette icons
// [canvas width in art px, body x, body y, drawing]
const ICONS = {
  minigunner: [84, 34, 39, (g, S) => {
    g.translate(8 * K, 11 * K);
    g.rotate(0.03);
    drawLayer(g, S.gun);
  }],
  roman: [84, 32, 39, (g, S) => {
    g.translate(5.4 * K, 23.3 * K);
    g.rotate(-1.32);
    drawLayer(g, S.spear);
  }],
  grenadier: [84, 32.3, 39, (g, S) => {
    g.translate(17 * K, 12 * K);
    drawLayer(g, S.bombLit);
  }],
  archer: [84, 30, 39, (g, S) => {
    g.translate(24 * K, 6 * K);
    drawLayer(g, S.bow);
    g.translate(-1 * K, 0);
    g.scale(0.85, 0.85);
    drawLayer(g, S.arrow);
  }],
  cavalry: [84, 41, 39, null],
  cowboy: [84, 33, 39, (g, S) => {
    g.translate(11 * K, 16.5 * K);
    g.rotate(-0.05);
    g.scale(0.78, 0.78);
    drawLayer(g, S.pistol);
  }],
  ninja: [84, 32, 39, (g, S) => {
    g.translate(14 * K, 10 * K);
    g.rotate(-0.8);
    drawLayer(g, S.katana);
  }],
  zombie: [84, 33, 39, () => {}],
  skeleton: [84, 33, 39, (g, S) => {
    g.translate(14 * K, 11 * K);
    g.rotate(-0.8);
    drawLayer(g, S.sword);
  }],
  mage: [128, 54, 68, (g, S) => {
    g.translate(25 * K, 0);
    drawLayer(g, S.staff);
  }],
  necromancer: [128, 54, 68, (g, S) => {
    g.translate(25 * K, 0);
    drawLayer(g, S.staff);
  }],
  knight: [84, 34, 39, (g, S) => {
    g.translate(8 * K, 12 * K);
    g.rotate(-0.95);
    drawLayer(g, S.lance);
  }],
};

export function hasIcon(species) {
  return species in ICONS || CREATURE_IDS.includes(species);
}

export function paintUnitIcon(canvas, sprites, species) {
  if (CREATURE_IDS.includes(species)) {
    paintCreatureIcon(canvas, sprites, species);
    return;
  }
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
    drawLayer(g, S.horse[4]);
    g.save();
    g.translate(-8 * K, -18 * K);
    g.scale(1.12, 1.12);
    drawLayer(g, S.rider);
    g.restore();
    g.translate(-3 * K, -14 * K);
    g.rotate(-0.64);
    g.scale(0.7, 0.7);
    drawLayer(g, S.lance);
  } else {
    drawLayer(g, S.feet[0]);
    drawLayer(g, S.torso);
    extra(g, S);
  }
  g.restore();
}
