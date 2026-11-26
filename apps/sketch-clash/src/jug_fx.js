// The Robot Juggernaut's effects: the crater, shockwaves, lightning and rubble of his axe, the claw slashes, the dust
// under his feet, the ghostly trail of his charge, and the meltdown and explosion when he finally goes down.
// World code only adds events to world.jfx; everything is drawn from each event's age and seed.
import { TAU, K, FEET, JUGGERNAUT } from './config.js?v=204';
import { drawLayer } from './sprites.js?v=204';

const BIG = JUGGERNAUT.scale;

// a steady pseudo-random number for particle i of an event
const rnd = (seed, i) => {
  const n = Math.sin(seed * 127.1 + i * 311.7) * 43758.5453;
  return n - Math.floor(n);
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const easeOut = (q) => 1 - (1 - q) ** 3;

export function addJugFx(world, e) {
  e.age = 0;
  if (e.seed === undefined) e.seed = Math.random() * 100;
  world.jfx.push(e);
  if (world.jfx.length > 260) world.jfx.splice(0, world.jfx.length - 260);
}

export function jugShake(world, amount) {
  world.shake = Math.min(13, Math.max(world.shake || 0, amount));
}

export function stepJugFx(world, dt) {
  if (world.shake) world.shake = world.shake < 0.12 ? 0 : world.shake * Math.exp(-dt * 7.5);
  if (!world.jfx.length) return;
  const blow = [];
  const landed = [];
  for (const e of world.jfx) {
    e.age += dt;
    if (e.type === 'shell' && !e.done && e.age >= e.dur) {
      e.done = true;
      landed.push(e);
    }
    if (e.type !== 'meltdown') continue;
    // little blasts pop all over him, then he goes up
    const pop = Math.floor(e.age / 0.17);
    if (pop !== e.pop && e.age < 1.05) {
      e.pop = pop;
      jugShake(world, 1.8 + e.age * 2);
      if (world.sfx) world.sfx('shot', e.x);
    }
    if (!e.blown && e.age >= 1.08) {
      e.blown = true;
      blow.push(e);
    }
  }
  for (const e of landed) world.jugPlasmaHit(e);
  for (const e of blow) {
    world.blowApart(e.unit);
    addJugFx(world, { type: 'crater', x: e.x, y: e.y + FEET, life: 10, r: 52, dark: true });
    addJugFx(world, { type: 'nova', x: e.x, y: e.y - 14, life: 2, r: 44 });
    jugShake(world, 13);
  }
  if (world.jfx.some((e) => e.age > e.life)) world.jfx = world.jfx.filter((e) => e.age <= e.life);
}

function glow(ctx, x, y, r, rgb, a) {
  if (r <= 0 || a <= 0) return;
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb}, ${Math.min(1, a)})`);
  gr.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

function dot(ctx, x, y, r, col) {
  ctx.fillStyle = col;
  ctx.beginPath();
  ctx.arc(x, y, Math.max(0.1, r), 0, TAU);
  ctx.fill();
}

// a jagged crack or bolt out from (x, y), flattened onto the ground
function jagged(x, y, ang, len, seed, i, wobble = 0.42) {
  const pts = [[x, y]];
  let a = ang;
  let px = x;
  let py = y;
  for (let k = 1; k <= 4; k++) {
    a = ang + (rnd(seed, i * 11 + k) - 0.5) * wobble * 2.4;
    px += Math.cos(a) * (len / 4);
    py += Math.sin(a) * (len / 4) * 0.38;
    pts.push([px, py]);
  }
  return pts;
}

function strokePath(ctx, pts, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = w;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
  ctx.stroke();
}

function drawCrater(ctx, e) {
  const fade = e.age > e.life - 2.2 ? clamp01((e.life - e.age) / 2.2) : 1;
  const hot = clamp01(1 - e.age / 2.4);
  ctx.fillStyle = `rgba(52, 46, 58, ${(e.dark ? 0.42 : 0.24) * fade})`;
  ctx.beginPath();
  ctx.ellipse(e.x, e.y, e.r * 0.62, e.r * 0.23, 0, 0, TAU);
  ctx.fill();
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + rnd(e.seed, i) * 0.5;
    const pts = jagged(e.x, e.y, a, e.r * (0.55 + rnd(e.seed, i + 40) * 0.6) * Math.min(1, 0.25 + e.age * 9), e.seed, i);
    for (let k = 0; k < pts.length - 1; k++) strokePath(ctx, [pts[k], pts[k + 1]], `rgba(42, 36, 50, ${0.82 * fade})`, 2 - k * 0.42);
    if (hot > 0) {
      strokePath(ctx, pts.slice(0, 4), `rgba(60, 245, 205, ${0.4 * hot})`, 2.6);
      strokePath(ctx, pts.slice(0, 4), `rgba(205, 255, 242, ${0.9 * hot})`, 0.6);
    }
  }
  for (let i = 0; i < 14; i++) {
    const a = rnd(e.seed, i + 80) * TAU;
    const d = e.r * (0.35 + rnd(e.seed, i + 95) * 0.55);
    dot(ctx, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d * 0.36, 0.6 + rnd(e.seed, i + 111) * 1.1, `rgba(112, 106, 120, ${0.85 * fade})`);
  }
  if (hot > 0) glow(ctx, e.x, e.y, e.r * 0.7, '70, 245, 205', 0.3 * hot);
}

function groundRing(ctx, x, y, r, col, w) {
  ctx.strokeStyle = col;
  ctx.lineWidth = Math.max(0.2, w);
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.38, 0, 0, TAU);
  ctx.stroke();
}

function drawJugParts(ctx, A, clawAngle, axeAngle) {
  const at = (pivot, angle, layer) => {
    ctx.save();
    ctx.translate(pivot[0] * K, pivot[1] * K);
    ctx.rotate(angle);
    ctx.translate(-pivot[0] * K, -pivot[1] * K);
    drawLayer(ctx, layer);
    ctx.restore();
  };
  drawLayer(ctx, A.legB);
  drawLayer(ctx, A.legA);
  at([-46.2, -40], clawAngle, A.clawArm);
  drawLayer(ctx, A.body);
  at([27.7, -38.4], axeAngle, A.axeArm);
}

// Under everyone: craters, the rings racing out across the floor, footfall dust and the charge trail.
export function drawJugGround(ctx, dpr, world, sprites) {
  if (!world.jfx.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const e of world.jfx) {
    if (e.type === 'crater') drawCrater(ctx, e);
    else if (e.type === 'slam' || e.type === 'nova') {
      const big = e.type === 'nova' ? 2.1 : 1;
      const y = e.type === 'nova' ? e.y + 8 + FEET : e.y;
      const r = (e.r || 31) * big;
      for (const [delay, dur, grow, rgb, w] of [[0, 0.45, 1.7, '80, 245, 210', 6], [0.05, 0.4, 1.35, '255, 255, 255', 4], [0.1, 0.75, 2.15, '150, 142, 156', 5]]) {
        const q = (e.age - delay) / dur;
        if (q > 0 && q < 1) groundRing(ctx, e.x, y, r * (0.2 + grow * easeOut(q)), `rgba(${rgb}, ${0.9 * (1 - q)})`, w * (1 - q) * Math.sqrt(big));
      }
    } else if (e.type === 'whirl') {
      const q = e.age / e.life;
      groundRing(ctx, e.x, e.y, e.r * (0.55 + 0.6 * easeOut(q)), `rgba(90, 245, 212, ${0.75 * (1 - q)})`, 5 * (1 - q));
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * TAU + e.seed + q * 2.6;
        const d = e.r * (0.6 + 0.45 * easeOut(q));
        dot(ctx, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d * 0.38 - 6 * q, 2.2 + 3 * q, `rgba(176, 168, 180, ${0.55 * (1 - q)})`);
      }
    } else if (e.type === 'roar') {
      for (let i = 0; i < 4; i++) {
        const q = (e.age - i * 0.11) / 0.6;
        if (q > 0 && q < 1) groundRing(ctx, e.x, e.y, e.r * (0.2 + 1.15 * easeOut(q)), i % 2 ? `rgba(255, 255, 255, ${0.85 * (1 - q)})` : `rgba(255, 84, 110, ${0.9 * (1 - q)})`, 7 * (1 - q));
      }
      const hot = clamp01(1 - e.age / e.life);
      for (let i = 0; i < 12; i++) {
        const pts = jagged(e.x, e.y, (i / 12) * TAU, e.r * (0.7 + rnd(e.seed, i) * 0.5) * Math.min(1, e.age * 6), e.seed, i, 0.6);
        strokePath(ctx, pts, `rgba(255, 70, 100, ${0.6 * hot})`, 2.8);
        strokePath(ctx, pts, `rgba(255, 225, 230, ${0.9 * hot})`, 0.8);
      }
    } else if (e.type === 'plasma') {
      const q = e.age / 0.5;
      if (q < 1) groundRing(ctx, e.x, e.y + FEET + 3, e.r * (0.2 + 1.5 * easeOut(q)), `rgba(80, 245, 215, ${0.9 * (1 - q)})`, 7 * (1 - q));
    } else if (e.type === 'step') {
      const q = e.age / e.life;
      for (let i = 0; i < (e.big ? 11 : 7); i++) {
        const a = rnd(e.seed, i) * TAU;
        const d = 4 + (e.big ? 17 : 11) * easeOut(q) * (0.5 + rnd(e.seed, i + 9));
        dot(ctx, e.x + Math.cos(a) * d, e.y + Math.sin(a) * d * 0.36 - 4 * q, (1.5 + rnd(e.seed, i + 21) * 2) * (0.7 + q), `rgba(182, 175, 180, ${0.62 * (1 - q)})`);
      }
      groundRing(ctx, e.x, e.y, 5 + 12 * easeOut(q), `rgba(130, 124, 140, ${0.5 * (1 - q)})`, 1.4 * (1 - q));
    } else if (e.type === 'after') {
      const q = e.age / e.life;
      ctx.save();
      ctx.setTransform(e.facing * dpr, 0, 0, dpr, e.x * dpr, e.y * dpr);
      ctx.translate(0, FEET);
      ctx.rotate(0.15);
      ctx.scale(BIG, BIG);
      ctx.translate(0, -FEET);
      ctx.globalAlpha = 0.26 * (1 - q);
      drawJugParts(ctx, sprites.juggernaut, 0, 0);
      ctx.restore();
    }
  }
  ctx.restore();
}

function drawSlam(ctx, e) {
  const { x, y, r, seed, age: t } = e;
  // a ring of stone shards punches up out of the ground, one after another, then sinks away
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + rnd(seed, i + 500) * 0.35;
    const q = t - 0.04 - (i % 7) * 0.017;
    if (q <= 0) continue;
    const up = q < 0.09 ? q / 0.09 : q < 0.72 ? 1 : clamp01(1 - (q - 0.72) / 0.38);
    if (up <= 0) continue;
    const far = r * (0.78 + rnd(seed, i + 520) * 0.42);
    // none come up on his side of the blow, where they would cover him
    if (Math.cos(a) * (e.facing || 1) < -0.35) continue;
    const bx = x + Math.cos(a) * far;
    const by = y + Math.sin(a) * far * 0.4;
    const h = (9 + rnd(seed, i + 540) * 17) * up;
    const hw = 3 + rnd(seed, i + 560) * 3;
    const tx = bx + Math.cos(a) * h * 0.45;
    const ty = by - h;
    glow(ctx, bx, by - h * 0.4, hw * 3.2, '80, 245, 210', 0.4 * up * clamp01(1 - q / 0.5));
    for (const [side, col] of [[-1, '#8e869c'], [1, '#554e66']]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(bx + side * hw, by);
      ctx.lineTo(tx, ty);
      ctx.lineTo(bx, by + 1.2);
      ctx.closePath();
      ctx.fill();
    }
    strokePath(ctx, [[bx - hw, by], [tx, ty], [bx + hw, by]], '#241e30', 0.8);
    strokePath(ctx, [[bx, by + 1], [tx, ty]], `rgba(170, 255, 232, ${0.9 * clamp01(1 - q / 0.6)})`, 0.8);
  }
  if (t < 0.34) {
    // a pillar of light punching up out of the blow
    const q = t / 0.34;
    const w = r * 0.5 * (1 - q * 0.85);
    const h = r * (1.3 + 1.9 * easeOut(q));
    const pg = ctx.createLinearGradient(0, y, 0, y - h);
    pg.addColorStop(0, `rgba(225, 255, 248, ${0.95 * (1 - q)})`);
    pg.addColorStop(0.4, `rgba(80, 245, 210, ${0.6 * (1 - q)})`);
    pg.addColorStop(1, 'rgba(80, 245, 210, 0)');
    ctx.fillStyle = pg;
    ctx.beginPath();
    ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 0.35, y - h * 0.5, x, y - h);
    ctx.quadraticCurveTo(x + w * 0.35, y - h * 0.5, x + w, y);
    ctx.closePath();
    ctx.fill();
  }
  if (t < 0.16) {
    const q = t / 0.16;
    glow(ctx, x, y - 4, r * (1.1 + q), '120, 255, 225', 0.85 * (1 - q));
    glow(ctx, x, y - 4, r * 0.65 * (1 + q), '255, 255, 255', 1 - q);
    // a hard white starburst on the very first frames
    ctx.fillStyle = `rgba(255, 255, 255, ${1 - q})`;
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
      const a = (i / 18) * TAU;
      const len = i % 2 === 0 ? r * (0.75 + rnd(seed, i) * 0.65) : r * 0.17;
      const px = x + Math.cos(a) * len;
      const py = y - 3 + Math.sin(a) * len * 0.55;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
  if (t < 0.42) {
    // lightning crawling out along the ground, redrawn every frame
    const a0 = 1 - t / 0.42;
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * TAU + rnd(seed, i) * 0.6;
      const pts = jagged(x, y, a, r * (0.95 + rnd(seed, i + 5) * 0.65) * Math.min(1, t / 0.09), Math.random() * 90, i, 0.7);
      strokePath(ctx, pts, `rgba(70, 235, 205, ${0.55 * a0})`, 2.8);
      strokePath(ctx, pts, `rgba(235, 255, 250, ${a0})`, 0.85);
    }
  }
  // dust boiling up
  for (let i = 0; i < 18; i++) {
    const life = 0.8 + rnd(seed, i + 200) * 0.65;
    const q = t / life;
    if (q >= 1) continue;
    const a = rnd(seed, i + 220) * TAU;
    const d = r * (0.25 + (0.55 + rnd(seed, i + 240) * 0.7) * easeOut(q));
    const rise = q * (5 + rnd(seed, i + 260) * 15);
    dot(ctx, x + Math.cos(a) * d, y + Math.sin(a) * d * 0.38 - rise, 2.4 + 5.6 * q, `rgba(${i % 3 === 0 ? '208, 204, 212' : '170, 162, 172'}, ${0.56 * (1 - q)})`);
  }
  // chunks of floor thrown up, bouncing down and lying there a moment
  for (let i = 0; i < 18; i++) {
    const a = rnd(seed, i + 300) * TAU;
    const sp = 22 + rnd(seed, i + 320) * 72;
    const vz = 55 + rnd(seed, i + 340) * 105;
    const land = (2 * vz) / 340;
    const tt = Math.min(t, land);
    const gx = x + Math.cos(a) * sp * tt;
    const gy = y + Math.sin(a) * sp * 0.4 * tt;
    const z = Math.max(0, vz * tt - 170 * tt * tt);
    const al = t > 1.1 ? clamp01((e.life - t) / 0.4) : 1;
    const s = 1 + rnd(seed, i + 360) * 2.3;
    ctx.fillStyle = `rgba(40, 34, 50, ${0.22 * al})`;
    ctx.beginPath();
    ctx.ellipse(gx, gy, s, s * 0.4, 0, 0, TAU);
    ctx.fill();
    const spin = tt * (5 + rnd(seed, i + 380) * 14);
    ctx.fillStyle = `rgba(${i % 3 === 0 ? '150, 142, 158' : '98, 90, 108'}, ${al})`;
    ctx.strokeStyle = `rgba(28, 24, 36, ${al})`;
    ctx.lineWidth = 0.55;
    ctx.beginPath();
    for (let k = 0; k < 5; k++) {
      const pa = spin + (k / 5) * TAU;
      const pr = s * (0.7 + rnd(seed, i * 7 + k) * 0.6);
      const px = gx + Math.cos(pa) * pr;
      const py = gy - z - s * 0.6 + Math.sin(pa) * pr;
      if (k === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  // bright sparks streaking away
  if (t < 0.55) {
    for (let i = 0; i < 22; i++) {
      const a = -Math.PI * rnd(seed, i + 400);
      const sp = 70 + rnd(seed, i + 430) * 150;
      const at = (tm) => [x + Math.cos(a) * sp * tm, y - 3 + Math.sin(a) * sp * 0.75 * tm + 150 * tm * tm];
      strokePath(ctx, [at(Math.max(0, t - 0.045)), at(t)], `rgba(${i % 2 ? '255, 255, 255' : '110, 250, 220'}, ${1 - t / 0.55})`, 1);
    }
  }
}

// three curved gashes of light torn through the air by the claw
function drawSlash(ctx, e) {
  const q = clamp01(e.age / 0.13);
  const fade = e.age < 0.15 ? 1 : clamp01(1 - (e.age - 0.15) / (e.life - 0.15));
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.scale(e.facing * 1.5, 1.5);
  for (let i = 0; i < 3; i++) {
    const rad = 17 + i * 6.5;
    const a0 = -1.35;
    const a1 = a0 + 2.5 * q;
    for (const [col, w] of [[`rgba(70, 235, 205, ${0.55 * fade})`, 5.4], [`rgba(240, 255, 252, ${fade})`, 2]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(-4, i * 1.5 - 2, rad, a0, a1);
      ctx.arc(-4 - w, i * 1.5 - 2, rad - w * 0.25, a1, a0, true);
      ctx.closePath();
      ctx.fill();
    }
  }
  if (e.age < 0.3) {
    const s = e.age / 0.3;
    glow(ctx, 20, 2, 20 * (0.6 + s), '170, 255, 235', 0.7 * (1 - s));
    for (let i = 0; i < 14; i++) {
      const a = -1.2 + rnd(e.seed, i) * 2.2;
      const d = 14 + 46 * s * (0.5 + rnd(e.seed, i + 30));
      strokePath(ctx, [[8 + Math.cos(a) * d * 0.72, Math.sin(a) * d * 0.72], [8 + Math.cos(a) * d, Math.sin(a) * d]], `rgba(255, ${i % 2 ? 255 : 214}, ${i % 2 ? 250 : 110}, ${1 - s})`, 1);
    }
  }
  ctx.restore();
}

// the plasma in flight: a white-hot ball with a teal tail and motes spiralling round it
function drawShell(ctx, e) {
  if (e.done) return;
  const q = clamp01(e.age / e.dur);
  const at = (p) => [e.x + (e.tx - e.x) * p, e.y + (e.ty - e.y) * p - Math.sin(p * Math.PI) * 20];
  const [x, y] = at(q);
  for (let i = 12; i >= 1; i--) {
    const p = q - i * 0.032;
    if (p < 0) continue;
    const [px, py] = at(p);
    glow(ctx, px, py, 12 * (1 - i / 15), '70, 235, 215', 0.75 * (1 - i / 13));
  }
  glow(ctx, x, y, 23, '90, 245, 220', 0.95);
  glow(ctx, x, y, 11, '255, 255, 255', 1);
  dot(ctx, x, y, 4.6, '#ffffff');
  for (let i = 0; i < 6; i++) {
    const a = e.age * 26 + (i / 6) * TAU;
    dot(ctx, x + Math.cos(a) * 11, y + Math.sin(a) * 6.5, 1.5, i % 2 ? '#d6fff6' : '#5cf0d0');
  }
}

function drawPlasma(ctx, e) {
  const { x, y, r, seed, age: t } = e;
  if (t < 0.2) {
    const q = t / 0.2;
    glow(ctx, x, y - 4, r * (1.3 + q), '150, 255, 232', 0.95 * (1 - q));
    glow(ctx, x, y - 4, r * (0.7 + q * 0.5), '255, 255, 255', 1 - q);
  }
  // a swelling, crackling sphere
  if (t < 0.5) {
    const q = t / 0.5;
    const rad = r * (0.3 + 0.95 * easeOut(q));
    glow(ctx, x, y - 6, rad * 1.25, '60, 225, 212', 0.5 * (1 - q));
    ctx.strokeStyle = `rgba(190, 255, 240, ${1 - q})`;
    ctx.lineWidth = 3.4 * (1 - q) + 0.4;
    ctx.beginPath();
    ctx.arc(x, y - 6, rad, 0, TAU);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      let a = (i / 9) * TAU + Math.random() * 0.5;
      const pts = [[x, y - 6]];
      for (let k = 1; k <= 4; k++) {
        a += (Math.random() - 0.5) * 0.9;
        pts.push([x + Math.cos(a) * rad * (k / 4), y - 6 + Math.sin(a) * rad * (k / 4)]);
      }
      strokePath(ctx, pts, `rgba(80, 240, 220, ${0.7 * (1 - q)})`, 2.6);
      strokePath(ctx, pts, `rgba(255, 255, 255, ${1 - q})`, 0.8);
    }
  }
  for (let i = 0; i < 30; i++) {
    const life = 0.45 + rnd(seed, i) * 0.65;
    const q = t / life;
    if (q >= 1) continue;
    const a = rnd(seed, i + 40) * TAU;
    const d = r * (0.4 + rnd(seed, i + 80) * 1.2) * easeOut(q);
    const px = x + Math.cos(a) * d;
    const py = y - 6 + Math.sin(a) * d * 0.7 + 34 * q * q;
    strokePath(ctx, [[px, py], [px - Math.cos(a) * 5 * (1 - q), py - Math.sin(a) * 3.5 * (1 - q)]], `rgba(${i % 3 ? '110, 250, 222' : '255, 255, 255'}, ${1 - q})`, 1.7 * (1 - q) + 0.4);
  }
  for (let i = 0; i < 8; i++) {
    const q = (t - 0.12 - i * 0.04) / 0.85;
    if (q > 0 && q < 1) glow(ctx, x + (rnd(seed, i + 120) - 0.5) * r, y - 4 - q * 42, 8 + q * 14, '88, 108, 120', 0.5 * (1 - q));
  }
}

// a hit from his charge: a hard little starburst
function drawImpact(ctx, e) {
  const q = e.age / e.life;
  glow(ctx, e.x, e.y, 15 * (0.5 + q), '255, 244, 200', 0.85 * (1 - q));
  ctx.fillStyle = `rgba(255, 255, 255, ${1 - q})`;
  ctx.beginPath();
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + e.seed;
    const d = i % 2 === 0 ? 8 + 15 * easeOut(q) : 3;
    if (i === 0) ctx.moveTo(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d);
    else ctx.lineTo(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
}

// the roar when rage takes him: a column of red light and embers
function drawRoar(ctx, e) {
  const t = e.age;
  if (t < 0.7) {
    const q = t / 0.7;
    const w = 34 * (1 - q * 0.6);
    const h = 90 + 90 * easeOut(q);
    const pg = ctx.createLinearGradient(0, e.y, 0, e.y - h);
    pg.addColorStop(0, `rgba(255, 190, 200, ${0.6 * (1 - q)})`);
    pg.addColorStop(0.45, `rgba(255, 64, 100, ${0.45 * (1 - q)})`);
    pg.addColorStop(1, 'rgba(255, 64, 100, 0)');
    ctx.fillStyle = pg;
    ctx.fillRect(e.x - w, e.y - h, w * 2, h);
  }
  for (let i = 0; i < 26; i++) {
    const q = (t - rnd(e.seed, i) * 0.4) / 0.9;
    if (q <= 0 || q >= 1) continue;
    const px = e.x + (rnd(e.seed, i + 30) - 0.5) * 90 + Math.sin(q * 7 + i) * 6;
    const py = e.y - q * (50 + rnd(e.seed, i + 60) * 90);
    dot(ctx, px, py, 1.9 * (1 - q) + 0.4, `rgba(255, ${i % 3 === 0 ? 220 : 90}, ${i % 3 === 0 ? 200 : 110}, ${1 - q})`);
  }
}

// the big one
function drawNova(ctx, e) {
  const { x, y, seed, age: t } = e;
  if (t < 0.18) {
    glow(ctx, x, y, 90 + 160 * t, '255, 246, 214', 1 - t / 0.18);
  }
  // the fireball: lumps that swell from white-hot through orange into black smoke
  for (let i = 0; i < 20; i++) {
    const life = 0.75 + rnd(seed, i) * 0.55;
    const q = t / life;
    if (q >= 1) continue;
    const a = rnd(seed, i + 20) * TAU;
    const d = (8 + rnd(seed, i + 40) * 30) * easeOut(Math.min(1, q * 1.7));
    const cx = x + Math.cos(a) * d;
    const cy = y + Math.sin(a) * d * 0.7 - q * q * 22;
    const rad = (6 + rnd(seed, i + 60) * 10) * (0.45 + easeOut(q) * 0.85);
    const col = q < 0.16 ? '255, 250, 220' : q < 0.34 ? '255, 204, 70' : q < 0.55 ? '248, 126, 40' : '74, 66, 78';
    glow(ctx, cx, cy, rad * 1.35, col, q < 0.55 ? 0.95 : 0.85 * (1 - q) * 2);
    if (q < 0.45) glow(ctx, cx - rad * 0.2, cy - rad * 0.2, rad * 0.7, '255, 236, 160', 0.9 * (1 - q / 0.45));
  }
  // licks of flame darting out of the fireball
  if (t < 0.5) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU + rnd(seed, i + 600);
      const len = (22 + rnd(seed, i + 620) * 26) * easeOut(Math.min(1, t / 0.22));
      ctx.fillStyle = `rgba(255, ${150 + (i % 3) * 40}, 50, ${0.85 * (1 - t / 0.5)})`;
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(a - 0.22) * 8, y + Math.sin(a - 0.22) * 6);
      ctx.lineTo(x + Math.cos(a) * len, y + Math.sin(a) * len * 0.72);
      ctx.lineTo(x + Math.cos(a + 0.22) * 8, y + Math.sin(a + 0.22) * 6);
      ctx.closePath();
      ctx.fill();
    }
  }
  // smoke rolling up afterwards
  for (let i = 0; i < 12; i++) {
    const q = (t - 0.3 - i * 0.055) / 1.15;
    if (q <= 0 || q >= 1) continue;
    glow(ctx, x + (rnd(seed, i + 90) - 0.5) * 30 + Math.sin(q * 4 + i) * 5, y - 6 - q * 66, 7 + q * 17, '62, 58, 70', 0.6 * (1 - q));
  }
  if (t < 0.75) {
    for (let i = 0; i < 44; i++) {
      const a = rnd(seed, i + 150) * TAU;
      const sp = 80 + rnd(seed, i + 200) * 190;
      const at = (tm) => [x + Math.cos(a) * sp * tm * (1 - tm * 0.4), y + Math.sin(a) * sp * 0.75 * tm * (1 - tm * 0.4) + 80 * tm * tm];
      strokePath(ctx, [at(Math.max(0, t - 0.05)), at(t)], `rgba(${i % 3 === 0 ? '120, 250, 222' : i % 3 === 1 ? '255, 214, 90' : '255, 255, 255'}, ${1 - t / 0.75})`, 1.25);
    }
    const q = t / 0.75;
    ctx.strokeStyle = `rgba(255, 236, 190, ${0.9 * (1 - q)})`;
    ctx.lineWidth = 4.5 * (1 - q) + 0.3;
    ctx.beginPath();
    ctx.arc(x, y, 12 + 78 * easeOut(q), 0, TAU);
    ctx.stroke();
  }
}

// He doesn't drop straight away: he shudders, splits with light and pops all over before the big blast.
function drawMeltdown(ctx, dpr, e, sprites) {
  if (e.blown) return;
  const t = e.age;
  const q = clamp01(t / 1.08);
  ctx.save();
  ctx.setTransform(e.facing * dpr, 0, 0, dpr, (e.x + (Math.random() - 0.5) * 3.4 * q) * dpr, (e.y + (Math.random() - 0.5) * 1.6 * q) * dpr);
  ctx.translate(0, FEET + q * 2.4);
  ctx.rotate(-0.1 * q);
  ctx.scale(BIG, BIG);
  ctx.translate(0, -FEET);
  drawJugParts(ctx, sprites.juggernaut, -0.4 * easeOut(q), 0.55 * easeOut(q));
  // seams splitting with light
  for (let i = 0; i < 6; i++) {
    if (q < i * 0.12) continue;
    let px = (-26 + rnd(e.seed, i) * 48) * K;
    let py = (-72 + rnd(e.seed, i + 9) * 50) * K;
    const pts = [[px, py]];
    for (let k = 0; k < 4; k++) {
      px += (rnd(e.seed, i * 5 + k + 20) - 0.5) * 6.5;
      py += (rnd(e.seed, i * 5 + k + 50) - 0.35) * 5;
      pts.push([px, py]);
    }
    const flick = 0.6 + 0.4 * Math.sin(t * 40 + i);
    ctx.lineCap = 'round';
    strokePath(ctx, pts, `rgba(80, 250, 215, ${0.6 * flick})`, 2.6);
    strokePath(ctx, pts, `rgba(240, 255, 250, ${flick})`, 0.8);
  }
  glow(ctx, -3, -13, 8 + 16 * q + Math.sin(t * 30) * 2, '150, 255, 230', 0.12 + 0.38 * q);
  // small blasts popping all over him
  for (let i = 0; i < 7; i++) {
    const s = (t - i * 0.15) / 0.26;
    if (s <= 0 || s >= 1) continue;
    const px = (-34 + rnd(e.seed, i + 100) * 62) * K;
    const py = (-80 + rnd(e.seed, i + 130) * 66) * K;
    glow(ctx, px, py, 4 + 10 * easeOut(s), '255, 150, 50', 0.95 * (1 - s));
    glow(ctx, px, py, 2.5 + 5 * s, '255, 255, 225', 1 - s);
    for (let k = 0; k < 7; k++) {
      const a = rnd(e.seed, i * 9 + k) * TAU;
      strokePath(ctx, [[px + Math.cos(a) * 12 * s, py + Math.sin(a) * 12 * s], [px + Math.cos(a) * (12 * s + 3), py + Math.sin(a) * (12 * s + 3)]], `rgba(255, 224, 110, ${1 - s})`, 0.8);
    }
  }
  ctx.restore();
}

// Over everyone: the blows themselves and the explosions.
export function drawJugTop(ctx, dpr, world, sprites) {
  if (!world.jfx.length) return;
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const e of world.jfx) {
    if (e.type === 'meltdown') drawMeltdown(ctx, dpr, e, sprites);
  }
  for (const e of world.jfx) {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (e.type === 'slam') drawSlam(ctx, e);
    else if (e.type === 'slash') drawSlash(ctx, e);
    else if (e.type === 'nova') drawNova(ctx, e);
    else if (e.type === 'shell') drawShell(ctx, e);
    else if (e.type === 'plasma') drawPlasma(ctx, e);
    else if (e.type === 'impact') drawImpact(ctx, e);
    else if (e.type === 'roar') drawRoar(ctx, e);
  }
  ctx.restore();
}
