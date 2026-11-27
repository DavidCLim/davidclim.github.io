// MechaZaur's own part of the world: his missiles, and the effects that go with him (the shockwave as he lets loose, the
// embers and heat rings in his breath, the ground it leaves burning, the great blast when he goes). Only the missiles
// hurt anyone; the rest is for show.
import { TAU, K, FEET } from './config.js?v=241';
import { WATER } from './terrain.js?v=241';

const TEAL = '70, 245, 200';
const GOLD = '255, 196, 80';
const SCORCH_MAX = 70;

export function resetZordFx(world) {
  world.embers = [];
  world.novas = [];
  world.scorches = [];
  world.missiles = [];
  world.trails = [];
}

// a ring racing outward. flat: lying on the ground. ang: squashed along a direction, as the heat rings in his breath are
function nova(world, o) {
  world.novas.push({ age: 0, vx: 0, vy: 0, from: 0.2, flat: false, ang: null, ...o });
}

function embers(world, x, y, n, ang, spread, speed) {
  for (let i = 0; i < n; i++) {
    const a = ang + (Math.random() - 0.5) * spread;
    const sp = speed * (0.45 + Math.random() * 0.75);
    world.embers.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 0.3 + Math.random() * 0.45, teal: Math.random() < 0.35 });
  }
}

// a patch of ground left burning (water won't)
function scorch(world, x, y, r, life) {
  if (world.terrain.at(x, y) & WATER) return;
  world.scorches.push({ x, y, r, life, age: 0, seed: Math.random() * 9 });
  if (world.scorches.length > SCORCH_MAX) world.scorches.shift();
}

// the moment his breath bursts out
export function zordIgnite(world, u, m, ang) {
  nova(world, { x: m.x, y: m.y, r: 24, life: 0.3, rgb: TEAL, wide: 3 });
  nova(world, { x: m.x, y: m.y, r: 14, life: 0.2, rgb: '255, 240, 190', wide: 2.6 });
  nova(world, { x: u.x, y: u.y + FEET + 1, r: 50, life: 0.5, rgb: TEAL, wide: 2.8, flat: true });
  embers(world, m.x, m.y, 20, ang, 1.2, 210);
  u.ringT = 0;
}

// every frame he breathes. t is who he is breathing at
export function zordBreath(world, u, m, ang, dt, t) {
  u.emberAcc = (u.emberAcc || 0) + dt;
  while (u.emberAcc >= 0.024) {
    u.emberAcc -= 0.024;
    embers(world, m.x, m.y, 1, ang, 0.62, 260);
  }
  // heat rings ride down the stream, swelling as they go
  u.ringT = (u.ringT || 0) - dt;
  if (u.ringT <= 0) {
    u.ringT = 0.2;
    nova(world, { x: m.x, y: m.y, vx: Math.cos(ang) * 235, vy: Math.sin(ang) * 235, ang, r: 17, from: 0.24, life: 0.42, rgb: GOLD, wide: 1.9 });
  }
  if (!t) return;
  u.scorchT = (u.scorchT || 0) - dt;
  if (u.scorchT <= 0) {
    u.scorchT = 0.11;
    const k = 0.42 + Math.random() * 0.7;
    scorch(world, u.x + (t.x - u.x) * k + (Math.random() - 0.5) * 16, u.y + (t.y - u.y) * k + FEET + (Math.random() - 0.5) * 9, 4.5 + Math.random() * 4, 2.4 + Math.random());
  }
}

export function zordDeath(world, u) {
  const gy = u.y + FEET + 1;
  nova(world, { x: u.x, y: gy, r: 96, life: 0.7, rgb: TEAL, wide: 4, flat: true });
  nova(world, { x: u.x, y: gy, r: 66, life: 0.55, rgb: GOLD, wide: 3.4, flat: true });
  nova(world, { x: u.x, y: u.y - 4, r: 54, life: 0.42, rgb: '225, 255, 247', wide: 4.4 });
  embers(world, u.x, u.y - 4, 46, 0, TAU, 230);
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * TAU + Math.random() * 0.4;
    const r = 12 + Math.random() * 24;
    scorch(world, u.x + Math.cos(a) * r, gy + Math.sin(a) * r * 0.45, 4 + Math.random() * 5, 2.6 + Math.random() * 1.2);
  }
}

// ---------------------------------------------------------------- his second attack
// A salvo of little homing missiles out of his back. Each is lobbed high, over walls and heads, chases the enemy it has
// marked and bursts where it comes down. It reaches further than his fire does.

// where they leave from: the mouth of his upper thruster pod, in Robo Trooper's coordinates
const RACK = { x: -30, y: -20 };

function rackOf(u) {
  const d = u.def;
  return {
    x: u.x + u.facing * RACK.x * K * d.scale,
    y: u.y + FEET + (RACK.y * K - FEET) * d.scale - (u.alt || 0) * d.hoverH,
  };
}

// who they go for: the one he is after and whoever is bunched around them, shared out so each missile has its own mark
function marksFor(world, u, m) {
  const t = u.target;
  const near = [];
  world.eachEnemyNear(u.side, u.x, u.y, m.range, (o) => {
    if (Math.hypot(o.x - u.x, o.y - u.y) <= m.range) near.push(o);
  });
  if (!near.length) near.push(t);
  near.sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y));
  return Array.from({ length: m.count }, (_, i) => near[i % near.length]);
}

function launch(world, u, i) {
  const m = u.def.missiles;
  const s = rackOf(u);
  const o = u.marks[i] && !u.marks[i].dead ? u.marks[i] : u.target;
  if (!o) return;
  const spread = () => (Math.random() - 0.5) * 9;
  const off = { x: spread(), y: spread() * 0.6 };
  world.missiles.push({
    x: s.x, y: s.y, px: s.x, py: s.y, sx: s.x, sy: s.y, o, off, tx: o.x + off.x, ty: o.y + off.y,
    age: 0, dur: m.flight * (0.9 + Math.random() * 0.28), h: 50 + Math.random() * 38, back: -u.facing * (18 + Math.random() * 22),
    ang: -Math.PI / 2, trail: 0, side: u.side, owner: u,
  });
  u.launch = 1;
  for (let k = 0; k < 3; k++) {
    world.puffs.push({ x: s.x, y: s.y, vx: -u.facing * (14 + Math.random() * 30), vy: -6 - Math.random() * 22, age: 0, life: 0.5 + Math.random() * 0.3, size: 2.4 + Math.random() * 1.6 });
  }
  nova(world, { x: s.x, y: s.y, r: 9, life: 0.2, rgb: TEAL, wide: 2 });
  if (world.sfx) world.sfx('snipe', s.x);
}

// every frame he is alive and fighting
export function stepZordSalvo(world, u, dt) {
  const m = u.def.missiles;
  if (u.missileT === undefined) u.missileT = m.first;
  u.launch = Math.max(0, (u.launch || 0) - dt * 6);
  if (u.salvo > 0) {
    u.salvoT -= dt;
    if (u.salvoT <= 0) {
      u.salvoT += m.gap;
      launch(world, u, m.count - u.salvo);
      u.salvo--;
    }
    return;
  }
  u.missileT -= dt;
  const t = u.target;
  if (u.missileT > 0 || !t || t.dead || Math.hypot(t.x - u.x, t.y - u.y) > m.range) return;
  u.marks = marksFor(world, u, m);
  u.salvo = m.count;
  u.salvoT = 0;
  u.missileT = m.every * (0.85 + Math.random() * 0.3);
}

function burst(world, k) {
  const m = k.owner.def.missiles;
  const x = k.tx;
  const y = k.ty;
  world.blasts.push({ x, y: y - 2, age: 0, life: 1.7, r: m.blast, seed: Math.random() });
  world.eachEnemyNear(k.side, x, y, m.blast + 20, (o) => {
    const dx = o.x - x;
    const dy = o.y - y;
    const dist = Math.hypot(dx, dy) || 1;
    const reach = m.blast + o.def.radius;
    if (dist > reach) return;
    const share = 1 - 0.5 * (dist / reach);
    if (!o.def.noKnock) {
      o.kx += (dx / dist) * 230 * share;
      o.ky += (dy / dist) * 230 * share;
    }
    world.hurt(o, m.damage * share, o.x, o.y, 'blast', k.owner);
  });
  world.hitProps(x, y, m.blast, m.damage);
  nova(world, { x, y: y + FEET, r: m.blast * 1.7, life: 0.4, rgb: TEAL, wide: 2.4, flat: true });
  embers(world, x, y - 2, 9, -Math.PI / 2, Math.PI * 1.5, 150);
  scorch(world, x, y + FEET, 4.5 + Math.random() * 3, 1.8 + Math.random());
  if (world.sfx) world.sfx('boom', x);
}

function stepMissiles(world, dt) {
  for (const k of world.missiles) {
    k.age += dt;
    const p = Math.min(1, k.age / k.dur);
    // it follows its mark until it starts to dive
    if (!k.o.dead && p < 0.75) {
      const f = Math.min(1, dt * 9);
      k.tx += (k.o.x + k.off.x - k.tx) * f;
      k.ty += (k.o.y + k.off.y - k.ty) * f;
    }
    const go = p * p * 0.55 + p * 0.45; // slow off the rack, then it tears in
    k.px = k.x;
    k.py = k.y;
    k.x = k.sx + (k.tx - k.sx) * go + k.back * Math.sin(Math.PI * Math.min(1, p * 1.5)) * (1 - p);
    k.y = k.sy + (k.ty - k.sy) * go - k.h * 4 * p * (1 - p);
    if (k.x !== k.px || k.y !== k.py) k.ang = Math.atan2(k.y - k.py, k.x - k.px);
    k.trail -= dt;
    if (k.trail <= 0) {
      k.trail = 0.018;
      world.trails.push({ x: k.x - Math.cos(k.ang) * 5, y: k.y - Math.sin(k.ang) * 5, age: 0, life: 0.34 });
    }
    if (p >= 1) {
      k.dead = true;
      burst(world, k);
    }
  }
  if (world.missiles.some((k) => k.dead)) world.missiles = world.missiles.filter((k) => !k.dead);
}

// the lock-on ring on the ground under each mark, closing in as the missile comes down
function drawLock(ctx, k) {
  const p = k.age / k.dur;
  const r = 15 - 8 * p;
  const y = k.ty + FEET;
  ctx.strokeStyle = `rgba(255, 74, 58, ${Math.min(0.9, 0.35 + p)})`;
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.ellipse(k.tx, y, r, r * 0.42, 0, 0, TAU);
  ctx.stroke();
  ctx.beginPath();
  for (let i = 0; i < 4; i++) {
    const a = k.age * 6 + (i / 4) * TAU;
    ctx.moveTo(k.tx + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.26);
    ctx.lineTo(k.tx + Math.cos(a) * r * 1.35, y + Math.sin(a) * r * 0.57);
  }
  ctx.stroke();
}

function drawTrails(ctx, world) {
  for (const t of world.trails) {
    const q = t.age / t.life;
    ctx.fillStyle = q < 0.3 ? `rgba(55, 232, 196, ${0.85 * (1 - q)})` : `rgba(165, 178, 196, ${0.6 * (1 - q)})`;
    ctx.beginPath();
    ctx.arc(t.x, t.y, 1.5 + 2.6 * q, 0, TAU);
    ctx.fill();
  }
}

function drawMissile(ctx, k) {
  ctx.save();
  ctx.translate(k.x, k.y);
  ctx.rotate(k.ang);
  const flick = 3 + Math.random() * 3;
  for (const [col, len, wide] of [['#ff9a2e', 4 + flick, 2.1], ['#fff0a8', 2 + flick * 0.5, 1.1]]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(-4, -wide);
    ctx.lineTo(-4 - len, 0);
    ctx.lineTo(-4, wide);
    ctx.closePath();
    ctx.fill();
  }
  ctx.lineWidth = 0.8;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = '#15131b';
  ctx.fillStyle = '#1fbc9c';
  ctx.beginPath();
  ctx.moveTo(-1, 0);
  ctx.lineTo(-5, -3.8);
  ctx.lineTo(-4, 0);
  ctx.lineTo(-5, 3.8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#d3d8e3';
  ctx.beginPath();
  ctx.roundRect(-4.4, -1.9, 7.4, 3.8, 1.2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#e0523c';
  ctx.beginPath();
  ctx.moveTo(3, -1.9);
  ctx.quadraticCurveTo(7.8, 0, 3, 1.9);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function stepZordFx(world, dt) {
  stepMissiles(world, dt);
  for (const t of world.trails) t.age += dt;
  for (const e of world.embers) {
    e.age += dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.vx *= 0.95;
    e.vy = e.vy * 0.95 - 46 * dt; // hot, so they drift up as they slow
  }
  for (const n of world.novas) {
    n.age += dt;
    n.x += n.vx * dt;
    n.y += n.vy * dt;
  }
  for (const s of world.scorches) s.age += dt;
  const live = (o) => o.age < o.life;
  if (!world.embers.every(live)) world.embers = world.embers.filter(live);
  if (!world.novas.every(live)) world.novas = world.novas.filter(live);
  if (!world.scorches.every(live)) world.scorches = world.scorches.filter(live);
  if (!world.trails.every(live)) world.trails = world.trails.filter(live);
}

function drawNova(ctx, n) {
  const q = n.age / n.life;
  const r = n.r * (n.from + (1 - n.from) * (1 - (1 - q) ** 2));
  const rx = n.ang !== null ? r * 0.36 : r;
  const ry = n.flat ? r * 0.34 : r;
  for (const [col, wide] of [[`rgba(${n.rgb}, ${0.85 * (1 - q)})`, n.wide * (1 - q * 0.6)], [`rgba(255, 255, 255, ${0.8 * (1 - q)})`, n.wide * 0.36 * (1 - q)]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = wide;
    ctx.beginPath();
    ctx.ellipse(n.x, n.y, rx, ry, n.ang || 0, 0, TAU);
    ctx.stroke();
  }
}

// one little tongue of flame standing on the ground
function tongue(ctx, x, y, w, h, lean, fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(x - w, y);
  ctx.quadraticCurveTo(x - w, y - h * 0.45, x + lean, y - h);
  ctx.quadraticCurveTo(x + w, y - h * 0.4, x + w, y);
  ctx.quadraticCurveTo(x, y + w * 0.8, x - w, y);
  ctx.fill();
}

// under the units: the burning ground and the rings that race across it
export function drawZordGround(ctx, world) {
  for (const s of world.scorches) {
    const fade = Math.min(1, (s.life - s.age) / 0.9, s.age / 0.12);
    ctx.fillStyle = `rgba(66, 46, 40, ${0.24 * fade})`;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.r, s.r * 0.42, 0, 0, TAU);
    ctx.fill();
    const heat = Math.max(0, 1 - s.age / (s.life * 0.74));
    if (heat <= 0) continue;
    ctx.fillStyle = `rgba(255, 140, 40, ${0.34 * heat * fade})`;
    ctx.beginPath();
    ctx.ellipse(s.x, s.y, s.r * 0.72, s.r * 0.3, 0, 0, TAU);
    ctx.fill();
    ctx.globalAlpha = fade * Math.min(1, heat * 2.2);
    for (let i = 0; i < 3; i++) {
      const beat = s.age * (13 + i * 3) + s.seed + i * 2.1;
      const x = s.x + (i - 1) * s.r * 0.52;
      const h = s.r * (i === 1 ? 1.35 : 0.9) * (0.45 + heat * 0.55) * (1 + 0.24 * Math.sin(beat));
      const lean = Math.sin(beat * 0.7) * 1.4;
      tongue(ctx, x, s.y, s.r * 0.26, h, lean, '#ff8a2e');
      tongue(ctx, x, s.y, s.r * 0.14, h * 0.6, lean * 0.6, '#ffd65c');
    }
    ctx.globalAlpha = 1;
  }
  for (const n of world.novas) if (n.flat) drawNova(ctx, n);
  for (const k of world.missiles) drawLock(ctx, k);
}

// over the units: the rings in the air and the embers
export function drawZordAir(ctx, world) {
  drawTrails(ctx, world);
  for (const k of world.missiles) drawMissile(ctx, k);
  for (const n of world.novas) if (!n.flat) drawNova(ctx, n);
  ctx.lineCap = 'round';
  for (const e of world.embers) {
    const fade = 1 - (e.age / e.life) ** 2;
    const x = e.x - e.vx * 0.024;
    const y = e.y - e.vy * 0.024;
    for (const [col, wide] of [[e.teal ? `rgba(30, 215, 170, ${0.85 * fade})` : `rgba(255, 128, 30, ${0.9 * fade})`, 1.9], [e.teal ? `rgba(220, 255, 246, ${fade})` : `rgba(255, 238, 150, ${fade})`, 0.8]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = wide;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(e.x, e.y);
      ctx.stroke();
    }
  }
}
