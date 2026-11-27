// MechaZaur's own part of the world: his missiles, and the effects that go with him (the shockwave as he lets loose, the
// embers and heat rings in his breath, the ground it leaves burning, the great blast when he goes). Only the missiles
// hurt anyone; the rest is for show.
import { TAU, K, FEET } from './config.js?v=245';
import { WATER } from './terrain.js?v=245';
import { swipeTurn, SWIPE_BACK } from './zordlimbs.js?v=245';

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

// ---------------------------------------------------------------- the great beam
// His rare one. He rears back while the light gathers in his open mouth, then pours out a huge beam that burns through
// everything in a long straight line. It can only swing slowly once it has started.
const clampTurn = (from, to, most) => {
  const d = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + Math.max(-most, Math.min(most, d));
};

// his open jaws, wherever he is (they go up with him when he flies)
function beamMouth(u) {
  return { x: u.x + u.facing * 54 * K, y: u.y + 1 * K - (u.alt || 0) * u.def.hoverH };
}

function aimBeam(u, t) {
  const m = beamMouth(u);
  return Math.atan2(t.y - 2 - m.y, t.x - m.x);
}

function stepBeam(world, u, dt) {
  const m = u.def.beam;
  const b = u.beam;
  const before = b.t;
  b.t += dt;
  const firing = b.t >= m.charge;
  const t = u.target;
  if (t && !t.dead) {
    if (!firing && Math.abs(t.x - u.x) > 3) u.facing = t.x > u.x ? 1 : -1;
    b.angle = clampTurn(b.angle, aimBeam(u, t), dt * (firing ? m.sweep : 3));
  }
  if (before < m.charge && firing && world.sfx) {
    world.sfx('boom', u.x);
    world.sfx('flame', u.x);
  }
  if (firing) {
    const from = beamMouth(u);
    const dx = Math.cos(b.angle);
    const dy = Math.sin(b.angle);
    const half = m.range / 2;
    world.eachEnemyNear(u.side, from.x + dx * half, from.y + dy * half, half + 30, (o) => {
      const ox = o.x - from.x;
      const oy = o.y - 2 - from.y;
      const along = ox * dx + oy * dy;
      if (along < 0 || along > m.range || Math.abs(ox * dy - oy * dx) > m.width + o.def.radius) return;
      if (!o.def.noKnock) {
        o.kx += dx * 520 * dt;
        o.ky += dy * 520 * dt;
      }
      world.hurt(o, m.dps * dt, o.x, o.y, 'burn', u);
    });
    for (const p of world.props) {
      if (p.dead || p.type !== 'barrel') continue;
      const ox = p.x - from.x;
      const oy = p.y - 8 - from.y;
      const along = ox * dx + oy * dy;
      if (along > 0 && along < m.range && Math.abs(ox * dy - oy * dx) <= m.width + 6) world.damageProp(p, m.dps * dt);
    }
    if (Math.random() < dt * 40) {
      const along = 20 + Math.random() * (m.range * 0.8);
      embers(world, from.x + dx * along, from.y + dy * along, 2, -Math.PI / 2, 2.4, 80);
    }
  }
  if (b.t >= m.charge + m.fire) u.beam = null;
}

// every frame he is fighting. It waits on a roll of the dice, made every few seconds once any rest after the last one
// is over. Returns true while he is busy with it.
export function stepZordBeam(world, u, dt) {
  const m = u.def.beam;
  if (u.beam) {
    stepBeam(world, u, dt);
    return true;
  }
  u.beamCd = (u.beamCd === undefined ? m.every : u.beamCd) - dt;
  if (u.beamCd <= 0 && !u.beamReady) {
    if (Math.random() < m.chance) u.beamReady = true;
    else u.beamCd = m.every;
  }
  const t = u.target;
  // not in the middle of a tail swipe
  if (!u.beamReady || !t || t.dead || (u.swipeT !== null && u.swipeT !== undefined) || Math.hypot(t.x - u.x, t.y - u.y) > m.range * 0.8) return false;
  u.beamReady = false;
  u.beam = { t: 0, angle: aimBeam(u, t) };
  u.beamCd = m.charge + m.fire + m.cooldown[0] + Math.random() * (m.cooldown[1] - m.cooldown[0]);
  if (world.sfx) world.sfx('magic', u.x);
  return true;
}

// a long shape from the mouth along +x: narrow where it leaves, quickly full width, with a rippling edge
function beamShape(ctx, len, wide, ripple, clock, fill) {
  const edge = (x, side) => side * wide * Math.min(1, 0.28 + x / 34) * (1 + Math.sin(x * 0.11 - clock * 34 + side) * ripple + Math.sin(x * 0.29 - clock * 51) * ripple * 0.6);
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(0, edge(0, -1));
  for (let x = 8; x <= len; x += 8) ctx.lineTo(x, edge(x, -1));
  ctx.quadraticCurveTo(len + wide * 1.5, 0, len, edge(len, 1));
  for (let x = len; x >= 0; x -= 8) ctx.lineTo(x, edge(x, 1));
  ctx.closePath();
  ctx.fill();
}

function drawBeam(ctx, u) {
  const m = u.def.beam;
  const b = u.beam;
  const from = beamMouth(u);
  const clock = u.breath;
  ctx.save();
  ctx.translate(from.x, from.y);
  ctx.rotate(b.angle);
  if (b.t < m.charge) {
    const p = b.t / m.charge;
    // a thin flickering line shows where it is going to go
    ctx.strokeStyle = `rgba(46, 200, 90, ${0.5 * p * (0.6 + 0.4 * Math.sin(clock * 40))})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(8, 0);
    ctx.lineTo(Math.min(m.range, 200), 0);
    ctx.stroke();
    // light is dragged into his mouth from all round
    ctx.lineCap = 'round';
    for (let i = 0; i < 18; i++) {
      const q = (clock * 2 + i / 18) % 1;
      const an = i * 2.4 + q * 2;
      const far = (1 - q) * 30 + 3;
      ctx.strokeStyle = `rgba(52, 220, 96, ${Math.min(1, q * 3) * p})`;
      ctx.lineWidth = 0.6 + 1.2 * q;
      ctx.beginPath();
      ctx.moveTo(Math.cos(an) * (far + 6), Math.sin(an) * (far + 6));
      ctx.lineTo(Math.cos(an) * far, Math.sin(an) * far);
      ctx.stroke();
    }
    const r = 1.2 + 5.6 * p + Math.sin(clock * 50) * 0.5 * p;
    for (const [col, k] of [['rgba(60, 255, 120, 0.35)', 2], ['#17a94a', 1.15], ['#5cf08a', 0.78], ['#d9ffe2', 0.42]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(5, 0, r * k, 0, TAU);
      ctx.fill();
    }
    ctx.restore();
    return;
  }
  const since = b.t - m.charge;
  const len = m.range * Math.min(1, since / 0.12);
  // it swells as it bursts out and thins away at the end
  const swell = Math.min(1, since / 0.1) * Math.min(1, (m.fire - since) / 0.28);
  const w = m.width * Math.max(0, swell);
  beamShape(ctx, len, w * 1.9, 0.1, clock, 'rgba(70, 255, 130, 0.22)');
  beamShape(ctx, len, w * 1.32, 0.13, clock, '#0c6b30');
  beamShape(ctx, len, w * 1.13, 0.12, clock + 0.03, '#17a94a');
  beamShape(ctx, len, w * 0.82, 0.1, clock + 0.07, '#3fe573');
  beamShape(ctx, len, w * 0.5, 0.09, clock + 0.11, '#9dffb6');
  beamShape(ctx, len, w * 0.22, 0.08, clock + 0.15, '#e6ffec');
  // rings of force riding down it
  ctx.lineWidth = 1.8;
  for (let i = 0; i < 7; i++) {
    const x = ((clock * 330 + (i * len) / 7) % len) || 0;
    ctx.strokeStyle = `rgba(214, 255, 222, ${0.85 * swell * (1 - x / len)})`;
    ctx.beginPath();
    ctx.ellipse(x, 0, 3.4, w * 1.55, 0, 0, TAU);
    ctx.stroke();
  }
  // ghostly crackle along its edges
  ctx.lineJoin = 'miter';
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = `rgba(24, 160, 70, ${0.9 * swell})`;
  for (let i = 0; i < 9; i++) {
    let x = Math.random() * len * 0.9;
    const side = Math.random() < 0.5 ? -1 : 1;
    let y = side * w * 1.1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let j = 0; j < 3; j++) {
      x += 5 + Math.random() * 9;
      y = side * w * (1.2 + Math.random() * 0.9);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  // the blinding ball at his mouth
  for (const [col, k] of [['rgba(70, 255, 130, 0.35)', 1.5], ['#17a94a', 0.9], ['#5cf08a', 0.7], ['#d9ffe2', 0.42]]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.arc(7, 0, w * k * (0.92 + Math.random() * 0.14), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

// ---------------------------------------------------------------- his tail swipe
// who the tail could knock over: on the ground, on their feet and not tucked away in a tower
function standing(o) {
  return !(o.slip > 0) && !o.def.flying && !(o.alt > 0.3) && !o.leap && !(o.perch && o.perch.state !== 'walk');
}

// distance as the swipe measures it: it runs flat along the ground, which we see at a slant
const sweptAt = (u, o) => Math.hypot(o.x - u.x, (o.y - u.y) / 0.62);

// returns true while he is busy sweeping
export function stepZordSwipe(world, u, dt) {
  const s = u.def.swipe;
  if (u.swipeCd === undefined) u.swipeCd = s.first;
  if (u.swipeT === undefined || u.swipeT === null) {
    u.swipeCd -= dt;
    if (u.swipeCd > 0 || u.alt > 0.15) return false;
    let near = false;
    world.eachEnemyNear(u.side, u.x, u.y, s.reach + 20, (o) => {
      if (standing(o) && sweptAt(u, o) <= s.reach + o.def.radius) near = true;
    });
    if (!near) return false;
    u.swipeT = 0;
    u.swiped = new Set();
    if (world.sfx) world.sfx('whoosh', u.x);
    return true;
  }
  u.swipeT += dt;
  const p = u.swipeT / s.time;
  const turned = swipeTurn(p);
  if (turned > 0) {
    world.eachEnemyNear(u.side, u.x, u.y, s.reach + 24, (o) => {
      if (u.swiped.has(o) || !standing(o)) return;
      const far = sweptAt(u, o);
      if (far > s.reach + o.def.radius) return;
      // the tail starts behind him and comes round past the near side first: has it got to them yet?
      const a = Math.atan2((o.y - u.y) / 0.62, (o.x - u.x) * u.facing);
      const round = (((Math.PI - a) % TAU) + TAU) % TAU;
      if (turned < Math.min(0.995, (SWIPE_BACK + round) / (TAU + SWIPE_BACK))) return;
      u.swiped.add(o);
      const dx = o.x - u.x;
      const dy = o.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (!world.trip(o, (dx / dist) * 62, (dy / dist) * 40)) return;
      nova(world, { x: o.x, y: o.y + FEET - 3, r: 11, life: 0.25, rgb: TEAL, wide: 2.2 });
      embers(world, o.x, o.y + FEET - 3, 5, -Math.PI / 2, 2.6, 90);
      if (world.sfx) world.sfx('slip', o.x);
    });
    // the dust it drags up
    u.dustT = (u.dustT || 0) - dt;
    if (u.dustT <= 0 && turned < 0.98) {
      u.dustT = 0.035;
      const an = Math.PI + SWIPE_BACK - (TAU + SWIPE_BACK) * turned;
      const x = u.x + u.facing * Math.cos(an) * s.reach * 0.86;
      const y = u.y + FEET + Math.sin(an) * s.reach * 0.4;
      world.puffs.push({ x, y, vx: u.facing * Math.cos(an) * 18, vy: -6 - Math.random() * 8, age: 0, life: 0.4 + Math.random() * 0.2, size: 1.8 + Math.random() * 1.4, dust: true });
    }
  }
  if (p >= 1) {
    u.swipeT = null;
    u.swipeCd = s.cooldown[0] + Math.random() * (s.cooldown[1] - s.cooldown[0]);
  }
  return true;
}

// ---------------------------------------------------------------- his second attack
// A salvo of little homing missiles out of his back. Each is lobbed high, over walls and heads, chases the enemy it has
// marked and bursts where it comes down. It reaches further than his fire does.

// where they leave from: the mouth of his upper thruster pod, in Robo Trooper's coordinates
const RACK = { x: -30, y: -26 };

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
  for (const u of world.units) if (u.beam && !u.dead && u.def.beam) drawBeam(ctx, u);
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
