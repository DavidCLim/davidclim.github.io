// Gibbondore The Great: how he fights, and what his magic does to the world.
// Like the original's ape he goes straight in and hits the ground hard enough to send everyone flying; being a gibbon
// he also swings himself across the gap in one great leap, and being a wizard he throws stars from his staff on the way.
import { TAU, K, FEET } from './config.js?v=244';

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
// where the orb of his staff is as he lets a spell go, in his own art px
const ORB = { x: 67, y: -30 };

export function resetGibbonFx(world) {
  world.storms = [];
  world.stars = [];
  world.quakes = [];
  world.glints = [];
}

function glints(world, x, y, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const sp = speed * (0.4 + Math.random() * 0.8);
    world.glints.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - speed * 0.3, age: 0, life: 0.25 + Math.random() * 0.35 });
  }
}

// both fists and the staff come down: everyone close is flattened and flung
function slam(world, u, big) {
  const d = u.def;
  const m = d.slam;
  const cx = u.x + u.facing * d.reach * (big > 1 ? 0.45 : 0.85);
  const cy = u.y;
  const radius = m.radius * big;
  world.eachEnemyNear(u.side, cx, cy, radius + 14, (o) => {
    const dx = o.x - cx;
    const dy = o.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > radius + o.def.radius) return;
    const share = Math.max(0.4, 1 - dist / (radius + o.def.radius));
    if (!o.def.noKnock) {
      o.kx += (dx / dist) * m.knock * share;
      o.ky += (dy / dist) * m.knock * share;
    }
    world.hurt(o, m.damage * big * share * rand(0.9, 1.1), o.x, o.y, undefined, u);
  });
  world.hitProps(cx, cy, radius * 0.6, m.damage);
  world.quakes.push({ x: cx, y: cy + FEET, r: radius, age: 0, life: 0.75, seed: Math.random() * TAU });
  // the beige cloud the original's ape throws up
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + Math.random() * 0.3;
    world.puffs.push({ x: cx + Math.cos(a) * radius * 0.3, y: cy + FEET - 1 + Math.sin(a) * radius * 0.12, vx: Math.cos(a) * radius * rand(1.6, 2.4), vy: Math.sin(a) * radius * 0.8 - rand(2, 9), age: 0, life: rand(0.45, 0.75), size: rand(2, 3.6), dust: true });
  }
  glints(world, cx, cy + FEET - 3, 12, 95);
  if (world.sfx) world.sfx('slam', cx);
}

// three stars off the end of his staff, each after its own mark where there are enough to go round
function throwStars(world, u) {
  const d = u.def;
  const m = d.spell;
  const t = u.target;
  if (!t) return;
  const near = [];
  world.eachEnemyNear(u.side, t.x, t.y, 70, (o) => near.push(o));
  if (!near.length) near.push(t);
  near.sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y));
  const x = u.x + u.facing * ORB.x * K * d.scale;
  const y = u.y + FEET + (ORB.y * K - FEET) * d.scale;
  const ahead = Math.atan2(t.y - y, t.x - x);
  for (let i = 0; i < m.bolts; i++) {
    // they fan out as they leave, then swing round onto their marks
    const a = ahead + (i - (m.bolts - 1) / 2) * 0.75 - 0.18 * u.facing;
    world.stars.push({ x, y, vx: Math.cos(a) * m.speed * 0.8, vy: Math.sin(a) * m.speed * 0.8, o: near[i % near.length], side: u.side, owner: u, wait: i * 0.07, age: 0, trail: [], spin: Math.random() * TAU });
  }
  glints(world, x, y, 9, 70);
  if (world.sfx) world.sfx('magic', x);
}

function burst(world, s) {
  const m = s.owner.def.spell;
  world.eachEnemyNear(s.side, s.x, s.y, m.blast + 20, (o) => {
    const dx = o.x - s.x;
    const dy = o.y - 2 - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > m.blast + o.def.radius) return;
    const share = 1 - 0.5 * (dist / (m.blast + o.def.radius));
    if (!o.def.noKnock) {
      o.kx += (dx / dist) * 120 * share;
      o.ky += (dy / dist) * 120 * share;
    }
    world.hurt(o, m.damage * share, o.x, o.y, 'blast', s.owner);
  });
  world.hitProps(s.x, s.y + 8, m.blast, m.damage);
  world.quakes.push({ x: s.x, y: s.y, r: m.blast * 1.3, age: 0, life: 0.34, air: true });
  glints(world, s.x, s.y, 8, 85);
}

// ---------------------------------------------------------------- the storm ring
// He beats the ground with his staff twice. The first blow draws a circle on the ground round him; on the second the
// lightning comes down all along it. Only the circle itself is struck: whoever stands inside it, or beyond it, is safe.
export const STORM = { tap1: 0.36, tap2: 0.8, strike: 0.98, time: 1.45 };
const FLAT = 0.62; // a circle on the ground, seen at a slant

// is this one standing on the circle?
function onCircle(o, x, y, r, width) {
  const d = Math.hypot(o.x - x, (o.y - y) / FLAT);
  return Math.abs(d - r) <= width / 2 + o.def.radius;
}

function worthStorm(world, u) {
  const m = u.def.storm;
  let on = 0;
  let inside = 0;
  world.eachEnemyNear(u.side, u.x, u.y, m.radius + m.width + 14, (o) => {
    if (onCircle(o, u.x, u.y, m.radius, m.width)) on++;
    else if (Math.hypot(o.x - u.x, (o.y - u.y) / FLAT) < m.radius) inside++;
  });
  return on > 0 && on >= inside;
}

// where the end of his staff lands in the slam pose
function staffEnd(u) {
  return { x: u.x + u.facing * 62 * K * u.def.scale, y: u.y + FEET };
}

function tap(world, u, big) {
  const at = staffEnd(u);
  world.quakes.push({ x: at.x, y: at.y, r: big ? 22 : 16, age: 0, life: 0.55, seed: Math.random() * TAU });
  glints(world, at.x, at.y - 3, big ? 14 : 8, 90);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    world.puffs.push({ x: at.x + Math.cos(a) * 4, y: at.y + Math.sin(a) * 2, vx: Math.cos(a) * 34, vy: Math.sin(a) * 11 - 5, age: 0, life: 0.4, size: 1.8 + Math.random(), dust: true });
  }
  if (world.sfx) world.sfx('slam', at.x);
}

function stepStorm(world, u, dt) {
  const before = u.stormT;
  u.stormT += dt;
  if (before < STORM.tap1 && u.stormT >= STORM.tap1) {
    tap(world, u, false);
    const m = u.def.storm;
    world.storms.push({ x: u.x, y: u.y, r: m.radius, w: m.width, age: 0, at: STORM.strike - STORM.tap1, life: STORM.strike - STORM.tap1 + 0.55, struck: false, side: u.side, owner: u });
  }
  if (before < STORM.tap2 && u.stormT >= STORM.tap2) tap(world, u, true);
  if (u.stormT >= STORM.time) u.stormT = null;
}

function strike(world, s) {
  const m = s.owner.def.storm;
  s.struck = true;
  world.eachEnemyNear(s.side, s.x, s.y, s.r + s.w + 14, (o) => {
    if (!onCircle(o, s.x, s.y, s.r, s.w)) return;
    const dx = o.x - s.x;
    const dy = o.y - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (!o.def.noKnock) {
      o.kx += (dx / dist) * 90;
      o.ky += (dy / dist) * 90;
    }
    glints(world, o.x, o.y - 3, 6, 80);
    world.hurt(o, m.damage * rand(0.9, 1.1), o.x, o.y, 'blast', s.owner);
  });
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    const x = s.x + Math.cos(a) * s.r;
    const y = s.y + FEET + Math.sin(a) * s.r * FLAT;
    world.hitProps(x, y - FEET, 6, m.damage * 0.5);
    if (i % 2 === 0) glints(world, x, y - 2, 3, 70);
  }
  if (world.sfx) {
    world.sfx('boom', s.x);
    world.sfx('zap', s.x);
  }
}

function stepStorms(world, dt) {
  for (const s of world.storms) {
    s.age += dt;
    // knock him down or finish him before the second blow and the storm never comes
    if (!s.struck && (s.owner.dead || (s.owner.stormT === null && s.age < s.at))) s.life = 0;
    else if (!s.struck && s.age >= s.at) strike(world, s);
  }
  if (world.storms.some((s) => s.age >= s.life)) world.storms = world.storms.filter((s) => s.age < s.life);
}

// the circle on the ground: first a warning that crackles round, then scorched and glowing where the lightning landed
function drawStormGround(ctx, s) {
  const y = s.y + FEET;
  const hit = s.struck;
  const p = hit ? (s.age - s.at) / (s.life - s.at) : s.age / s.at;
  const a = hit ? 1 - p : Math.min(1, p * 3);
  ring(ctx, s.x, y, s.r, s.r * FLAT, hit ? `rgba(120, 140, 255, ${0.3 * a})` : `rgba(120, 140, 255, ${0.2 * a})`, s.w * 0.8);
  for (const k of [-1, 1]) {
    const r = s.r + (k * s.w) / 2;
    ring(ctx, s.x, y, r, r * FLAT, `rgba(76, 96, 230, ${0.75 * a})`, 1.1);
  }
  // sparks running round it
  ctx.strokeStyle = `rgba(90, 120, 255, ${0.95 * a})`;
  ctx.lineWidth = 1;
  ctx.lineJoin = 'miter';
  for (let i = 0; i < 12; i++) {
    const from = (i / 12) * TAU + s.age * 4;
    ctx.beginPath();
    for (let j = 0; j <= 3; j++) {
      const an = from + j * 0.075;
      const r = s.r + (Math.random() - 0.5) * s.w * 0.8;
      if (j) ctx.lineTo(s.x + Math.cos(an) * r, y + Math.sin(an) * r * FLAT);
      else ctx.moveTo(s.x + Math.cos(an) * r, y + Math.sin(an) * r * FLAT);
    }
    ctx.stroke();
  }
}

// one bolt out of the sky down to (x, y), a new shape every frame
function bolt(ctx, x, y, a, thick) {
  const pts = [[x, y]];
  let px = x;
  for (let h = 13; h <= 91; h += 13) {
    px += (Math.random() - 0.5) * 11;
    pts.push([px, y - h - Math.random() * 5]);
  }
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'round';
  for (const [col, wide] of [[`rgba(110, 120, 255, ${0.2 * a})`, 5], [`rgba(70, 105, 245, ${a})`, 2.1], [`rgba(255, 255, 255, ${a})`, 0.8]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = wide * thick;
    ctx.beginPath();
    pts.forEach(([qx, qy], i) => (i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)));
    ctx.stroke();
  }
  // a fork off the side
  const [fx, fy] = pts[3];
  const dir = Math.random() < 0.5 ? -1 : 1;
  ctx.strokeStyle = `rgba(90, 120, 250, ${a * 0.85})`;
  ctx.lineWidth = 1.4 * thick;
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + dir * 8, fy + 6);
  ctx.lineTo(fx + dir * 13, fy + 17);
  ctx.stroke();
}

function drawStormAir(ctx, s) {
  if (!s.struck) return;
  const since = s.age - s.at;
  const y = s.y + FEET;
  const n = 11;
  // the far side of the circle first, so nearer bolts cross in front of farther ones
  const spots = Array.from({ length: n }, (_, i) => (i / n) * TAU + 0.2).sort((a, b) => Math.sin(a) - Math.sin(b));
  for (const an of spots) {
    const a = Math.max(0, 1 - since / 0.34);
    if (a <= 0) break;
    const x = s.x + Math.cos(an) * s.r;
    const by = y + Math.sin(an) * s.r * FLAT;
    bolt(ctx, x, by, a, 0.75 + a * 0.35);
    ctx.fillStyle = `rgba(215, 225, 255, ${0.9 * a})`;
    ctx.beginPath();
    ctx.ellipse(x, by, 5.5 * a + 1, 2.4 * a + 0.5, 0, 0, TAU);
    ctx.fill();
  }
}

// ---------------------------------------------------------------- the great beam
// His rare one. He rears back while the light gathers in his open mouth, then pours out a huge beam that burns through
// everything in a long straight line. It can only swing slowly once it has started.
const clampTurn = (from, to, most) => {
  const d = Math.atan2(Math.sin(to - from), Math.cos(to - from));
  return from + Math.max(-most, Math.min(most, d));
};

export function beamMouth(u) {
  const s = u.def.scale;
  return { x: u.x + u.facing * 27 * K * s, y: u.y + FEET + (-15 * K - FEET) * s };
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
      glints(world, from.x + dx * along, from.y + dy * along, 1, 50);
      world.glints[world.glints.length - 1].ghost = true;
    }
  }
  if (b.t >= m.charge + m.fire) u.beam = null;
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

export function stepGibbon(world, u, dt) {
  const d = u.def;
  u.cdT -= dt;
  u.leapCd = (u.leapCd === undefined ? 0.7 : u.leapCd) - dt;
  u.spellCd = (u.spellCd === undefined ? 0.5 : u.spellCd) - dt;
  u.stormCd = (u.stormCd === undefined ? d.storm.first : u.stormCd) - dt;
  // the rare one waits on a roll of the dice, made every few seconds once any rest after the last is over
  u.beamCd = (u.beamCd === undefined ? d.beam.every : u.beamCd) - dt;
  if (u.beamCd <= 0 && !u.beamReady) {
    if (Math.random() < d.beam.chance) u.beamReady = true;
    else u.beamCd = d.beam.every;
  }
  u.castFlash = Math.max(0, (u.castFlash || 0) - dt);
  u.landT = Math.max(0, (u.landT || 0) - dt);

  // in mid air: nothing steers or shoves him until he comes down
  if (u.leap) {
    const l = u.leap;
    l.t += dt;
    const p = Math.min(1, l.t / d.leap.time);
    u.x = lerp(l.x0, l.x1, p);
    u.y = lerp(l.y0, l.y1, p);
    u.alt = Math.max(0.001, Math.sin(Math.PI * p));
    u.kx = u.ky = 0;
    u.pose = 1;
    if (p >= 1) {
      u.leap = null;
      u.alt = 0;
      u.landT = 0.4;
      u.cdT = Math.max(u.cdT, rand(d.slam.cooldown[0], d.slam.cooldown[1]));
      slam(world, u, 1.15);
    }
    return;
  }

  const t = world.acquire(u, dt);
  // in the middle of either of his big ones he stands where he is
  if (u.beam || (u.stormT !== null && u.stormT !== undefined)) {
    if (u.beam) stepBeam(world, u, dt);
    else stepStorm(world, u, dt);
    u.pose = 1;
    return;
  }
  if (u.slamT > 0) {
    u.slamT -= dt;
    // the blow lands as his fists reach the ground
    if (u.slamHit && u.slamT <= d.slam.time * 0.42) {
      u.slamHit = false;
      slam(world, u, 1);
    }
  } else if (u.castT > 0) {
    u.castT -= dt;
    if (u.castT <= 0) {
      u.castFlash = 0.28;
      throwStars(world, u);
    }
  } else if (u.landT <= 0) {
    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      const reach = d.reach + t.def.radius * 0.5;
      if (u.beamReady && dist <= d.beam.range * 0.8) {
        u.beamReady = false;
        u.beam = { t: 0, angle: aimBeam(u, t) };
        u.beamCd = d.beam.charge + d.beam.fire + rand(d.beam.cooldown[0], d.beam.cooldown[1]);
        if (world.sfx) world.sfx('magic', u.x);
      } else if (u.stormCd <= 0 && worthStorm(world, u)) {
        u.stormT = 0;
        u.stormCd = STORM.time + rand(d.storm.cooldown[0], d.storm.cooldown[1]);
      } else if (dist <= reach) {
        if (u.cdT <= 0) {
          u.slamT = d.slam.time;
          u.slamHit = true;
          u.cdT = d.slam.time + rand(d.slam.cooldown[0], d.slam.cooldown[1]);
        }
      } else if (u.leapCd <= 0 && dist >= d.leap.min && dist <= d.leap.max) {
        u.leap = { t: 0, x0: u.x, y0: u.y, x1: t.x - (dx / dist) * reach * 0.55, y1: t.y - (dy / dist) * reach * 0.55 };
        u.leapCd = d.leap.cooldown * rand(0.85, 1.15);
        if (world.sfx) world.sfx('whoosh', u.x);
      } else if (u.spellCd <= 0 && dist <= d.spell.range && dist > reach * 1.6) {
        u.castT = d.spell.cast;
        u.spellCd = d.spell.cast + rand(d.spell.cooldown[0], d.spell.cooldown[1]);
      } else {
        const s = d.speed * u.speedMul * dt;
        u.x += (dx / dist) * s;
        u.y += (dy / dist) * s;
        u.moving = true;
      }
    } else world.marchStep(u, dt, d.speed * u.speedMul * 0.85);
  }
  if (u.moving) u.anim += dt * 7.3;
  u.pose = u.target || u.moving ? Math.min(1, u.pose + dt * 6) : Math.max(0, u.pose - dt * 5);
}

export function stepGibbonFx(world, dt) {
  stepStorms(world, dt);
  for (const s of world.stars) {
    if (s.wait > 0) {
      s.wait -= dt;
      continue;
    }
    s.age += dt;
    const m = s.owner.def.spell;
    if (!s.o || s.o.dead) {
      let best = null;
      let bd = 90;
      world.eachEnemyNear(s.side, s.x, s.y, 90, (o) => {
        const dist = Math.hypot(o.x - s.x, o.y - s.y);
        if (dist < bd) {
          bd = dist;
          best = o;
        }
      });
      s.o = best;
    }
    if (s.o) {
      const dx = s.o.x - s.x;
      const dy = s.o.y - 2 - s.y;
      const dist = Math.hypot(dx, dy) || 1;
      // the longer it flies the harder it turns, so it can't circle for ever
      const f = Math.min(1, dt * (4 + s.age * 22));
      s.vx += ((dx / dist) * m.speed - s.vx) * f;
      s.vy += ((dy / dist) * m.speed - s.vy) * f;
    }
    s.trail.push([s.x, s.y]);
    if (s.trail.length > 9) s.trail.shift();
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.spin += dt * 13;
    if ((s.o && Math.hypot(s.o.x - s.x, s.o.y - 2 - s.y) <= s.o.def.radius + 3) || s.age > 1.5) {
      s.dead = true;
      burst(world, s);
    }
  }
  if (world.stars.some((s) => s.dead)) world.stars = world.stars.filter((s) => !s.dead);
  for (const q of world.quakes) q.age += dt;
  for (const g of world.glints) {
    g.age += dt;
    g.x += g.vx * dt;
    g.y += g.vy * dt;
    g.vx *= 0.94;
    g.vy = g.vy * 0.94 + (g.ghost ? -60 : 90) * dt;
  }
  const live = (o) => o.age < o.life;
  if (!world.quakes.every(live)) world.quakes = world.quakes.filter(live);
  if (!world.glints.every(live)) world.glints = world.glints.filter(live);
}

function ring(ctx, x, y, rx, ry, col, wide) {
  ctx.strokeStyle = col;
  ctx.lineWidth = wide;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.stroke();
}

function fivePoint(ctx, x, y, r, turn) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = turn + (i / 10) * TAU;
    const k = i % 2 ? r * 0.45 : r;
    if (i) ctx.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
    else ctx.moveTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
  }
  ctx.closePath();
}

// under the units: the ground he has struck, cracked, with a ring of gold light racing out across it
export function drawGibbonGround(ctx, world) {
  for (const s of world.storms) drawStormGround(ctx, s);
  for (const q of world.quakes) {
    if (q.air) continue;
    const p = q.age / q.life;
    const out = 1 - (1 - Math.min(1, p * 1.7)) ** 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
    ctx.strokeStyle = `rgba(92, 70, 52, ${0.6 * (1 - p * p)})`;
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 7; i++) {
      const a = q.seed + (i / 7) * TAU;
      const len = q.r * (0.55 + ((i * 37) % 10) / 24) * Math.min(1, p * 5);
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x + Math.cos(a + 0.16) * len * 0.55, q.y + Math.sin(a + 0.16) * len * 0.25);
      ctx.lineTo(q.x + Math.cos(a - 0.06) * len, q.y + Math.sin(a - 0.06) * len * 0.42);
      ctx.stroke();
    }
    ring(ctx, q.x, q.y, q.r * (0.25 + 0.95 * out), q.r * (0.25 + 0.95 * out) * 0.4, `rgba(255, 190, 48, ${0.9 * (1 - p)})`, 3.4 * (1 - p) + 0.5);
    ring(ctx, q.x, q.y, q.r * (0.18 + 0.72 * out), q.r * (0.18 + 0.72 * out) * 0.4, `rgba(255, 246, 200, ${0.9 * (1 - p)})`, 1.2);
  }
}

// over the units: his stars, where they burst, and the gold sparks
export function drawGibbonAir(ctx, world) {
  for (const u of world.units) if (u.beam && !u.dead) drawBeam(ctx, u);
  for (const s of world.storms) drawStormAir(ctx, s);
  for (const s of world.stars) {
    if (s.wait > 0) continue;
    for (let i = 0; i < s.trail.length; i++) {
      const k = (i + 1) / s.trail.length;
      ctx.fillStyle = `rgba(255, ${Math.round(150 + 80 * k)}, 50, ${0.75 * k})`;
      ctx.beginPath();
      ctx.arc(s.trail[i][0], s.trail[i][1], 0.6 + 2 * k, 0, TAU);
      ctx.fill();
    }
    ctx.lineJoin = 'round';
    fivePoint(ctx, s.x, s.y, 4.6, s.spin);
    ctx.fillStyle = '#ffd23c';
    ctx.strokeStyle = '#b86a0c';
    ctx.lineWidth = 0.9;
    ctx.fill();
    ctx.stroke();
    fivePoint(ctx, s.x, s.y, 2.2, s.spin);
    ctx.fillStyle = '#fffbe0';
    ctx.fill();
  }
  for (const q of world.quakes) {
    if (!q.air) continue;
    const p = q.age / q.life;
    const r = q.r * (0.3 + 0.8 * (1 - (1 - p) ** 2));
    ring(ctx, q.x, q.y, r, r, `rgba(255, 184, 40, ${0.95 * (1 - p)})`, 2.6 * (1 - p) + 0.4);
    ctx.fillStyle = `rgba(255, 236, 150, ${0.85 * (1 - p)})`;
    fivePoint(ctx, q.x, q.y, r * 0.9, p * 2.4);
    ctx.fill();
  }
  ctx.lineCap = 'round';
  for (const g of world.glints) {
    const fade = 1 - (g.age / g.life) ** 2;
    for (const [col, wide] of g.ghost ? [[`rgba(24, 170, 76, ${fade})`, 2.4], [`rgba(214, 255, 220, ${fade})`, 1]] : [[`rgba(236, 150, 20, ${fade})`, 1.8], [`rgba(255, 240, 170, ${fade})`, 0.8]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = wide;
      ctx.beginPath();
      ctx.moveTo(g.x - g.vx * 0.024, g.y - g.vy * 0.024);
      ctx.lineTo(g.x, g.y);
      ctx.stroke();
    }
  }
}
