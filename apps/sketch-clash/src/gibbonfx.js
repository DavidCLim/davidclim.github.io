// Gibbondore The Great: how he fights, and what his magic does to the world.
// Like the original's ape he goes straight in and hits the ground hard enough to send everyone flying; being a gibbon
// he also swings himself across the gap in one great leap, and being a wizard he throws stars from his staff on the way.
import { TAU, K, FEET } from './config.js?v=253';

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

// ---------------------------------------------------------------- the storm
// He beats the ground with his staff twice, and on the second blow lightning comes down out of the sky on the six
// enemies nearest him, one hard on the heels of another.
export const STORM = { tap1: 0.36, tap2: 0.8, strike: 0.9, time: 1.45 };
const GAP = 0.05; // between one bolt and the next
const GLOW = 0.36; // how long each is seen

// where the end of his staff lands in the slam pose
function staffEnd(u) {
  return { x: u.x + u.facing * 62 * K * u.def.scale, y: u.y + FEET };
}

function tap(world, u, big) {
  const at = staffEnd(u);
  glints(world, at.x, at.y - 3, big ? 14 : 8, 90);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    world.puffs.push({ x: at.x + Math.cos(a) * 4, y: at.y + Math.sin(a) * 2, vx: Math.cos(a) * 34, vy: Math.sin(a) * 11 - 5, age: 0, life: 0.4, size: 1.8 + Math.random(), dust: true });
  }
  if (world.sfx) world.sfx('slam', at.x);
}

function callDown(world, u) {
  const m = u.def.storm;
  const all = [];
  world.eachEnemyNear(u.side, u.x, u.y, 3000, (o) => all.push(o));
  all.sort((a, b) => Math.hypot(a.x - u.x, a.y - u.y) - Math.hypot(b.x - u.x, b.y - u.y));
  const bolts = all.slice(0, m.targets).map((o, i) => ({ o, x: o.x, y: o.y, at: i * GAP, struck: false }));
  if (bolts.length) world.storms.push({ bolts, age: 0, life: (bolts.length - 1) * GAP + GLOW, owner: u });
}

function stepStorm(world, u, dt) {
  const before = u.stormT;
  u.stormT += dt;
  if (before < STORM.tap1 && u.stormT >= STORM.tap1) tap(world, u, false);
  if (before < STORM.tap2 && u.stormT >= STORM.tap2) tap(world, u, true);
  if (before < STORM.strike && u.stormT >= STORM.strike) callDown(world, u);
  if (u.stormT >= STORM.time) u.stormT = null;
}

function stepStorms(world, dt) {
  for (const s of world.storms) {
    s.age += dt;
    for (const bolt of s.bolts) {
      if (bolt.struck || s.age < bolt.at) continue;
      bolt.struck = true;
      const o = bolt.o;
      bolt.x = o.x;
      bolt.y = o.y;
      glints(world, o.x, o.y + FEET * 0.5, 8, 95);
      if (!o.dead) world.hurt(o, s.owner.def.storm.damage * rand(0.9, 1.1), o.x, o.y, 'blast', s.owner);
      world.hitProps(o.x, o.y, 6, s.owner.def.storm.damage * 0.5);
      if (world.sfx) {
        world.sfx('zap', o.x);
        world.sfx('boom', o.x);
      }
    }
  }
  if (world.storms.some((s) => s.age >= s.life)) world.storms = world.storms.filter((s) => s.age < s.life);
}

// one bolt from above the top of the screen down to (x, y), a new shape every frame, with forks off it
function lightning(ctx, x, y, a) {
  const top = -40;
  const steps = Math.max(5, Math.ceil((y - top) / 15));
  const pts = [[x, y]];
  let px = x;
  for (let i = 1; i <= steps; i++) {
    px += (Math.random() - 0.5) * 15 + (x - px) * 0.12;
    pts.push([px, y + ((top - y) * i) / steps + (i < steps ? (Math.random() - 0.5) * 7 : 0)]);
  }
  const forks = [];
  for (let i = 2; i < pts.length - 1; i += 3) {
    const dir = Math.random() < 0.5 ? -1 : 1;
    const [fx, fy] = pts[i];
    forks.push([[fx, fy], [fx + dir * (7 + Math.random() * 6), fy + 5 + Math.random() * 6], [fx + dir * (10 + Math.random() * 9), fy + 15 + Math.random() * 9]]);
  }
  const trace = (line) => {
    ctx.beginPath();
    line.forEach(([qx, qy], i) => (i ? ctx.lineTo(qx, qy) : ctx.moveTo(qx, qy)));
    ctx.stroke();
  };
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'round';
  // a soft yellow glow, a deep gold edge so it shows on the white field, bright yellow, and a white-hot thread
  for (const [col, wide] of [[`rgba(255, 214, 40, ${0.28 * a})`, 10], [`rgba(214, 140, 0, ${a})`, 4.4], [`rgba(255, 216, 24, ${a})`, 3], [`rgba(255, 253, 224, ${a})`, 1.1]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = wide * (0.6 + 0.4 * a);
    trace(pts);
    ctx.lineWidth = wide * 0.45 * (0.6 + 0.4 * a);
    forks.forEach(trace);
  }
}

function drawStormAir(ctx, s) {
  for (const bolt of s.bolts) {
    if (!bolt.struck) continue;
    const since = s.age - bolt.at;
    if (since > GLOW) continue;
    const a = 1 - (since / GLOW) ** 2;
    const y = bolt.y + FEET * 0.45;
    lightning(ctx, bolt.x, y, a);
    // the crack where it lands
    ctx.fillStyle = `rgba(255, 220, 40, ${0.85 * a})`;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const an = (i / 14) * TAU;
      const r = i % 2 ? 2.6 : 6 + Math.random() * 6 * a;
      if (i) ctx.lineTo(bolt.x + Math.cos(an) * r, y + Math.sin(an) * r * 0.62);
      else ctx.moveTo(bolt.x + Math.cos(an) * r, y + Math.sin(an) * r * 0.62);
    }
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(255, 253, 228, ${a})`;
    ctx.beginPath();
    ctx.ellipse(bolt.x, y, 3.2 * a + 0.6, 2 * a + 0.4, 0, 0, TAU);
    ctx.fill();
  }
}

export function stepGibbon(world, u, dt) {
  const d = u.def;
  u.cdT -= dt;
  u.leapCd = (u.leapCd === undefined ? 0.7 : u.leapCd) - dt;
  u.spellCd = (u.spellCd === undefined ? 0.5 : u.spellCd) - dt;
  u.stormCd = (u.stormCd === undefined ? d.storm.first : u.stormCd) - dt;
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
  // in the middle of calling down the storm he stands where he is
  if (u.stormT !== null && u.stormT !== undefined) {
    stepStorm(world, u, dt);
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
      if (u.stormCd <= 0 && dist <= d.storm.range) {
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
    g.vy = g.vy * 0.94 + 90 * dt;
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
    for (const [col, wide] of [[`rgba(236, 150, 20, ${fade})`, 1.8], [`rgba(255, 240, 170, ${fade})`, 0.8]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = wide;
      ctx.beginPath();
      ctx.moveTo(g.x - g.vx * 0.024, g.y - g.vy * 0.024);
      ctx.lineTo(g.x, g.y);
      ctx.stroke();
    }
  }
}
