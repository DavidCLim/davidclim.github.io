// MechaZaur's own part of the world: his missiles, and the effects that go with him (the shockwave as he lets loose, the
// embers and heat rings in his breath, the ground it leaves burning, the great blast when he goes). Only the missiles
// hurt anyone; the rest is for show.
import { TAU, K, FEET } from './config.js?v=270';
import { WATER } from './terrain.js?v=270';
import { shieldCross, shieldHit } from './shield.js?v=270';
import { swipeTurn, SWIPE_BACK } from './zordlimbs.js?v=270';

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
export function nova(world, o) {
  world.novas.push({ age: 0, vx: 0, vy: 0, from: 0.2, flat: false, ang: null, ...o });
}

export function embers(world, x, y, n, ang, spread, speed, green = false) {
  for (let i = 0; i < n; i++) {
    const a = ang + (Math.random() - 0.5) * spread;
    const sp = speed * (0.45 + Math.random() * 0.75);
    world.embers.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 0.3 + Math.random() * 0.45, teal: Math.random() < 0.35, green });
  }
}

// a patch of ground left burning (water won't)
export function scorch(world, x, y, r, life, ghost = false) {
  if (world.terrain.at(x, y) & WATER) return;
  world.scorches.push({ x, y, r, life, ghost, age: 0, seed: Math.random() * 9 });
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

const BEAM_GAP = 6.5; // how far apart its puffs are
// it gets steadily bigger nearly the whole way
const swellOver = (reach) => reach * 0.9;

// The beam is made of the same puffs as his fire breath, in teal: poured out much faster and dead straight, small at his
// jaws and bigger the further they get, thinning away to nothing at the end of its reach.
function pourBeam(world, u, dt) {
  const m = u.def.beam;
  const b = u.beam;
  const every = BEAM_GAP / m.speed;
  b.pourT = (b.pourT || 0) + dt;
  while (b.pourT >= every) {
    b.pourT -= every;
    const v = m.speed * (0.97 + Math.random() * 0.06);
    world.flames.push({
      beam: true,
      x: b.x0,
      y: b.y0,
      of: b,
      v,
      far: 0,
      k: 0,
      // (the world moves it on by this frame straight after, so it starts a frame back: puffs made in the same frame
      // then come out spaced along the stream, not in one lump)
      age: b.pourT - dt,
      life: (b.reach + 18) / v,
      size: 4.4,
      full: 22 + Math.random() * 6,
      lat: (Math.random() - 0.5) * 38,
      phase: Math.random() * TAU,
      dark: Math.random() < 0.32,
    });
  }
}

// where a puff of the beam has got to: along the line he is aiming (or was, once it is over), tight near his jaws and
// spreading and rolling more the further out it is
export function moveBeamPuff(f) {
  const b = f.of;
  f.far = Math.max(0, f.v * f.age);
  f.k = Math.min(1, f.far / swellOver(b.reach));
  const side = f.lat * f.k ** 1.5 + Math.sin(f.far * 0.025 + f.phase) * 2 * f.k;
  f.x = b.x0 + b.dx * f.far - b.dy * side;
  f.y = b.y0 + b.dy * f.far + b.dx * side;
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
  if (before < m.charge && firing) {
    const mouth = beamMouth(u);
    embers(world, mouth.x, mouth.y, 30, b.angle, 1.3, 270, true);
    if (world.sfx) {
      world.sfx('boom', u.x);
      world.sfx('flame', u.x);
    }
  }
  b.reach = m.reach;
  if (firing) {
    const from = beamMouth(u);
    const dx = Math.cos(b.angle);
    const dy = Math.sin(b.angle);
    const reach = b.reach;
    // the fire only burns as far as it has got
    const out = Math.min(reach, m.speed * (b.t - m.charge));
    // (it is aimed as one straight thing: all of it swings together as he turns)
    b.x0 = from.x;
    b.y0 = from.y;
    b.dx = dx;
    b.dy = dy;
    const halfAt = (along) => m.width + m.widen * Math.min(1, along / swellOver(reach));
    pourBeam(world, u, dt);
    world.eachEnemyNear(u.side, from.x + (dx * reach) / 2, from.y + (dy * reach) / 2, reach / 2 + 30, (o) => {
      const ox = o.x - from.x;
      const oy = o.y - 2 - from.y;
      const along = ox * dx + oy * dy;
      if (along < 0 || along > out || Math.abs(ox * dy - oy * dx) > halfAt(along) + o.def.radius) return;
      if (!o.def.noKnock) {
        o.kx += dx * 520 * dt;
        o.ky += dy * 520 * dt;
      }
      o.spirit = 2;
      world.hurt(o, m.dps * dt, o.x, o.y, 'burn', u);
    });
    for (const p of world.props) {
      if (p.dead || p.type !== 'barrel') continue;
      const ox = p.x - from.x;
      const oy = p.y - 8 - from.y;
      const along = ox * dx + oy * dy;
      if (along > 0 && along < out && Math.abs(ox * dy - oy * dx) <= halfAt(along) + 6) world.damageProp(p, m.dps * dt);
    }
    // sparks thrown off all along it
    b.sparkT = (b.sparkT || 0) - dt;
    while (b.sparkT <= 0) {
      b.sparkT += 0.016;
      const along = 8 + Math.random() * Math.max(0, out - 50);
      const side = Math.random() < 0.5 ? -1 : 1;
      const off = side * halfAt(along) * (0.5 + Math.random() * 0.6);
      embers(world, from.x + dx * along - dy * off, from.y + dy * along + dx * off, 1, b.angle + side * 0.45, 0.7, 190, true);
    }
    // sparks spat from his jaws, as with his breath
    b.spitT = (b.spitT || 0) - dt;
    while (b.spitT <= 0) {
      b.spitT += 0.022;
      embers(world, from.x, from.y, 1, b.angle, 0.7, 300, true);
    }
    b.fireT = (b.fireT || 0) - dt;
    if (b.fireT <= 0) {
      b.fireT = 0.035;
      const along = 22 + Math.random() * Math.max(0, out - 60);
      scorch(world, from.x + dx * along + (Math.random() - 0.5) * 14, from.y + dy * along + FEET + (Math.random() - 0.5) * 7, 4 + Math.random() * 4, 1.9 + Math.random() * 1.2, true);
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

// ---- the gathering before it: teal fire dragged into his jaws. (The beam itself is drawn with the rest of the fire,
// puff by puff: see pourBeam.)
const FIRE_TEAL = { white: '242, 255, 252', pale: '176, 255, 236', bright: '24, 208, 180', dark: '10, 132, 136' };

// one of the soft puffs his fire is made of
function softPuff(rgb) {
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
}

let fire = null;
function beamFire() {
  if (!fire) fire = Object.fromEntries(Object.entries(FIRE_TEAL).map(([k, rgb]) => [k, softPuff(rgb)]));
  return fire;
}

const stamp = (ctx, img, x, y, r) => ctx.drawImage(img, x - r, y - r, r * 2, r * 2);

function drawBeam(ctx, u) {
  const m = u.def.beam;
  const b = u.beam;
  if (b.t >= m.charge) return;
  const from = beamMouth(u);
  const clock = u.breath;
  const P = beamFire();
  ctx.save();
  ctx.translate(from.x, from.y);
  ctx.rotate(b.angle);
  ctx.lineCap = 'round';
  {
    const p = b.t / m.charge;
    // a thin flickering line shows where it is going to go
    ctx.strokeStyle = `rgba(14, 162, 146, ${0.5 * p * (0.6 + 0.4 * Math.sin(clock * 40))})`;
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(210, 0);
    ctx.stroke();
    // green fire is dragged in out of the air, spiralling into his jaws
    for (let i = 0; i < 22; i++) {
      const q = (clock * 1.5 + i / 22) % 1;
      const an = i * 2.4 + q * 3.4;
      const far = (1 - q) * 40 + 4;
      ctx.globalAlpha = Math.min(1, q * 2.6) * Math.min(1, p * 1.8);
      stamp(ctx, i % 3 === 0 ? P.pale : i % 3 === 1 ? P.bright : P.dark, 5 + Math.cos(an) * far, Math.sin(an) * far, 1.8 + 3.4 * q);
    }
    ctx.globalAlpha = 1;
    // rings closing in as it comes to the full
    for (let i = 0; i < 3; i++) {
      const q = (clock * 2.1 + i / 3) % 1;
      ctx.strokeStyle = `rgba(38, 212, 188, ${0.75 * q * p})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.arc(5, 0, 6 + 30 * (1 - q), 0, TAU);
      ctx.stroke();
    }
    // the ball of it between his jaws
    const r = 2 + 9 * p;
    for (let i = 0; i < 9; i++) {
      const an = (i / 9) * TAU + clock * 5;
      const out = r * (0.55 + 0.3 * Math.abs(Math.sin(clock * 13 + i * 2.1)));
      stamp(ctx, i % 2 ? P.dark : P.bright, 5 + Math.cos(an) * out, Math.sin(an) * out, r * 0.8);
    }
    stamp(ctx, P.bright, 5, 0, r * 1.5);
    stamp(ctx, P.pale, 5, 0, r * 1.1);
    stamp(ctx, P.white, 5, 0, r * 0.65 * (0.9 + 0.2 * Math.random()));
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
    // one whose way lies through a shield comes down on the front of it instead
    if (world.shields.length && !k.guard && p < 0.8) {
      const c = shieldCross(world, k.side, k.sx, k.sy, k.tx, k.ty);
      if (c) k.guard = { s: c.s, dy: c.y - c.s.y };
    }
    if (k.guard) {
      const s = k.guard.s;
      if (!s.dead && s.shieldHp > 0) {
        const f = Math.min(1, dt * 14);
        k.tx += (s.x + s.facing * (s.def.guard.ahead + 2) - k.tx) * f;
        k.ty += (s.y + k.guard.dy - k.ty) * f;
      }
    } else if (!k.o.dead && p < 0.75) {
      // it follows its mark until it starts to dive
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
      if (k.guard) shieldHit(world, k.guard.s, k.owner.def.missiles.damage, k.tx, k.ty);
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

// The burning ground can be seventy patches at once, so a patch is not drawn shape by shape: its black stain, its glow
// and a short loop of its three little flames are each drawn once, for a patch REF across, and stamped from then on.
const REF = 8;
const BEATS = 8;
const SHARP = 4; // picture px to a unit
const patchPictures = new Map();

function picture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w * SHARP;
  c.height = h * SHARP;
  const g = c.getContext('2d');
  g.setTransform(SHARP, 0, 0, SHARP, (w / 2) * SHARP, h * SHARP);
  draw(g);
  return c;
}

function patchArt(green) {
  let art = patchPictures.get(green);
  if (art) return art;
  const oval = (colour, rx, ry) => picture(rx * 2 + 2, ry * 2 + 2, (g) => {
    g.translate(0, -ry - 1);
    g.fillStyle = colour;
    g.beginPath();
    g.ellipse(0, 0, rx, ry, 0, 0, TAU);
    g.fill();
  });
  art = {
    stain: oval(green ? 'rgb(14, 68, 72)' : 'rgb(66, 46, 40)', REF, REF * 0.42),
    glow: oval(green ? 'rgb(40, 214, 196)' : 'rgb(255, 140, 40)', REF * 0.72, REF * 0.3),
    flames: Array.from({ length: BEATS }, (_, n) => picture(24, 24, (g) => {
      g.translate(0, -4);
      for (let i = 0; i < 3; i++) {
        const beat = (n / BEATS) * TAU + i * 2.1;
        const x = (i - 1) * REF * 0.52;
        const h = REF * (i === 1 ? 1.35 : 0.9) * (green ? 1.25 : 1) * (1 + 0.24 * Math.sin(beat * (i === 1 ? 1 : 2)));
        const lean = Math.sin(beat) * 1.4;
        tongue(g, x, 0, REF * 0.26, h, lean, green ? '#0fae9e' : '#ff8a2e');
        tongue(g, x, 0, REF * 0.14, h * 0.6, lean * 0.6, green ? '#b4fff0' : '#ffd65c');
      }
    })),
  };
  patchPictures.set(green, art);
  return art;
}

// under the units: the burning ground and the rings that race across it
export function drawZordGround(ctx, world) {
  for (const s of world.scorches) {
    const fade = Math.max(0, Math.min(1, (s.life - s.age) / 0.9, s.age / 0.12));
    const art = patchArt(!!s.ghost);
    const k = s.r / REF / SHARP;
    const put = (img, bottom, tall, alpha) => {
      ctx.globalAlpha = alpha;
      ctx.drawImage(img, s.x - (img.width * k) / 2, s.y + (bottom - img.height * tall) * k, img.width * k, img.height * k * tall);
    };
    put(art.stain, (art.stain.height / 2), 1, 0.24 * fade);
    const heat = Math.max(0, 1 - s.age / (s.life * 0.74));
    if (heat <= 0) continue;
    put(art.glow, (art.glow.height / 2), 1, 0.36 * heat * fade);
    const tall = 0.45 + heat * 0.55;
    put(art.flames[Math.floor(s.age * 17 + s.seed * 3) % BEATS], 4 * SHARP * tall, tall, fade * Math.min(1, heat * 2.2));
  }
  ctx.globalAlpha = 1;
  for (const n of world.novas) if (n.flat) drawNova(ctx, n);
  for (const k of world.missiles) drawLock(ctx, k);
}

const EMBER_INK = {
  orange: ['255, 128, 30', '255, 238, 150'],
  teal: ['30, 215, 170', '220, 255, 246'],
  green: ['8, 166, 158', '196, 255, 244'], // (the beam's)
};

function drawEmbers(ctx, embers) {
  if (!embers.length) return;
  const lots = new Map();
  for (const e of embers) {
    const kind = e.green ? 'green' : e.teal ? 'teal' : 'orange';
    const bright = Math.ceil(Math.max(0, 1 - (e.age / e.life) ** 2) * 4);
    if (!bright) continue;
    const key = `${kind}|${bright}`;
    let path = lots.get(key);
    if (!path) lots.set(key, (path = new Path2D()));
    path.moveTo(e.x - e.vx * 0.024, e.y - e.vy * 0.024);
    path.lineTo(e.x, e.y);
  }
  ctx.lineCap = 'round';
  for (const [key, path] of lots) {
    const [kind, bright] = key.split('|');
    for (const [i, wide, most] of [[0, 1.9, 0.9], [1, 0.8, 1]]) {
      ctx.strokeStyle = `rgba(${EMBER_INK[kind][i]}, ${(most * bright) / 4})`;
      ctx.lineWidth = wide;
      ctx.stroke(path);
    }
  }
}

// over the units: the rings in the air and the embers
export function drawZordAir(ctx, world) {
  for (const u of world.units) if (u.beam && !u.dead && u.def.beam) drawBeam(ctx, u);
  drawTrails(ctx, world);
  for (const k of world.missiles) drawMissile(ctx, k);
  for (const n of world.novas) if (!n.flat) drawNova(ctx, n);
  drawEmbers(ctx, world.embers);
}
