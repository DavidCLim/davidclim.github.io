// The Shield Trooper: he goes in front behind a shield that stops shots, charges into whoever is close, and when it is
// shattered backs off until it comes up again.
import { TAU, FEET } from './config.js?v=265';

const rand = (a, b) => a + Math.random() * (b - a);

export function resetShieldFx(world) {
  world.shields = []; // the shields that are up
  world.shards = []; // pieces of a shattered one
  world.glimmers = []; // teal sparks where one is struck
}

function glimmer(world, x, y, n, speed, ang = 0, spread = TAU) {
  for (let i = 0; i < n; i++) {
    const a = ang + (Math.random() - 0.5) * spread;
    const sp = speed * rand(0.4, 1.2);
    world.glimmers.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 18, age: 0, life: rand(0.18, 0.42) });
  }
}

// It stands upright just in front of him, across the way he faces. A shot of some other side going from (x0, y0) to
// (x1, y1) through it from the front is stopped: returns the first shield it would strike, and where.
export function shieldCross(world, side, x0, y0, x1, y1) {
  let found = null;
  for (const s of world.shields) {
    if (s.side === side || s.dead || s.shieldHp <= 0) continue;
    const g = s.def.guard;
    const sx = s.x + s.facing * g.ahead;
    // from in front of it to behind it
    if ((x0 - sx) * s.facing < 0 || (x1 - sx) * s.facing >= 0 || x1 === x0) continue;
    const q = (sx - x0) / (x1 - x0);
    const y = y0 + (y1 - y0) * q;
    if (Math.abs(y - (s.y - 3)) > g.half) continue;
    if (!found || q < found.q) found = { s, x: sx, y, q };
  }
  return found;
}

function shatter(world, u) {
  const g = u.def.guard;
  const sx = u.x + u.facing * g.ahead;
  for (let i = 0; i < 16; i++) {
    const y = u.y - 3 + ((i + 0.5) / 16 - 0.5) * 2 * g.half;
    world.shards.push({ x: sx + rand(-3, 3), y, vx: u.facing * rand(10, 90) + rand(-30, 30), vy: rand(-90, 20), spin: rand(-14, 14), rot: Math.random() * TAU, size: rand(2.4, 5.2), age: 0, life: rand(0.45, 0.8), floor: u.y + FEET + rand(-3, 4) });
  }
  glimmer(world, sx, u.y - 3, 22, 130);
  if (world.sfx) world.sfx('smash', sx);
}

export function shieldHit(world, u, dmg, x, y) {
  if (u.dead || u.shieldHp <= 0) return;
  u.shieldHp -= dmg;
  u.shieldFlash = 0.18;
  // how far up or down it was struck, -1 .. 1
  u.struckAt = Math.max(-1, Math.min(1, (y - (u.y - 3)) / u.def.guard.half));
  glimmer(world, x, y, 5, 90, u.facing > 0 ? 0 : Math.PI, 2.2);
  if (u.shieldHp <= 0) {
    u.shieldHp = 0;
    u.brokenT = u.def.guard.recharge;
    u.rushT = 0;
    shatter(world, u);
  } else if (world.sfx) world.sfx('hit', x);
}

export function stepShield(world, u, dt) {
  const d = u.def;
  const g = d.guard;
  const speed = d.speed * u.speedMul;
  if (u.shieldHp === undefined) u.shieldHp = g.hp;
  u.shoveCd = Math.max(0, (u.shoveCd === undefined ? 0.5 : u.shoveCd) - dt);
  if (u.brokenT > 0) {
    u.brokenT -= dt;
    if (u.brokenT <= 0) {
      u.brokenT = 0;
      u.shieldHp = g.hp;
      u.upAge = 0;
      if (world.sfx) world.sfx('magic', u.x);
    }
  }
  if (u.upAge !== undefined) u.upAge += dt;
  const t = world.acquire(u, dt);
  u.pose = 1;
  // charging: shield first, and everyone in the way is thrown back
  if (u.rushT > 0) {
    u.rushT -= dt;
    u.x += u.rushX * g.rushSpeed * dt;
    u.y += u.rushY * g.rushSpeed * dt;
    u.moving = true;
    world.eachEnemyNear(u.side, u.x, u.y, 60, (o) => {
      if (u.shoved.has(o)) return;
      const dx = o.x - u.x;
      const dy = o.y - u.y;
      if (dx * u.rushX + dy * u.rushY < -3 || Math.hypot(dx, dy) > g.ahead + o.def.radius + 7) return;
      u.shoved.add(o);
      if (!o.def.noKnock) {
        const heavy = o.def.hp > 300 ? 0.35 : 1;
        o.kx += u.rushX * g.shove * heavy;
        o.ky += u.rushY * g.shove * heavy;
      }
      world.hurt(o, g.bash * rand(0.9, 1.1), o.x, o.y, undefined, u);
      glimmer(world, o.x - u.rushX * 5, o.y - 3, 8, 100);
      if (world.sfx) world.sfx('smash', o.x);
    });
    return;
  }
  if (!t) {
    world.marchStep(u, dt, speed * 0.85);
    return;
  }
  const dx = t.x - u.x;
  const dy = t.y - u.y;
  const dist = Math.hypot(dx, dy) || 1;
  if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
  if (u.shieldHp <= 0) {
    // no shield: get back until it comes up again
    if (dist < g.keepOff) {
      u.x -= (dx / dist) * speed * 1.15 * dt;
      u.y -= (dy / dist) * speed * 1.15 * dt;
      u.moving = true;
    }
  } else if (dist < g.rushFrom + t.def.radius && u.shoveCd <= 0) {
    u.rushT = g.rushTime;
    u.rushX = dx / dist;
    u.rushY = dy / dist;
    u.shoved = new Set();
    u.shoveCd = g.every * rand(0.85, 1.15);
    if (world.sfx) world.sfx('whoosh', u.x);
  } else if (dist > d.radius + t.def.radius + 14) {
    u.x += (dx / dist) * speed * dt;
    u.y += (dy / dist) * speed * dt;
    u.moving = true;
  }
}

// before anything moves: which shields are up this frame
export function findShields(world) {
  world.shields.length = 0;
  for (const u of world.units) {
    if (!u.def.guard || u.dead || u.slip > 0) continue;
    if (u.shieldHp === undefined) u.shieldHp = u.def.guard.hp;
    if (u.shieldHp > 0) world.shields.push(u);
  }
}

export function stepShieldFx(world, dt) {
  for (const u of world.units) if (u.shieldFlash > 0) u.shieldFlash -= dt;
  for (const s of world.glimmers) {
    s.age += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 200 * dt;
  }
  for (const s of world.shards) {
    s.age += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 320 * dt;
    s.rot += s.spin * dt;
    if (s.y > s.floor && s.vy > 0) {
      s.y = s.floor;
      s.vy *= -0.3;
      s.vx *= 0.5;
      s.spin *= 0.5;
    }
  }
  const live = (o) => o.age < o.life;
  if (!world.glimmers.every(live)) world.glimmers = world.glimmers.filter(live);
  if (!world.shards.every(live)) world.shards = world.shards.filter(live);
}

// over the units: the pieces of a shattered shield, and teal sparks
export function drawShieldAir(ctx, world) {
  if (!world.shards.length && !world.glimmers.length) return;
  ctx.save();
  ctx.lineJoin = 'round';
  for (const s of world.shards) {
    const fade = 1 - (s.age / s.life) ** 2;
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const a = s.rot + (i / 3) * TAU;
      const r = s.size * (i === 0 ? 1.3 : 0.75);
      if (i) ctx.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r);
      else ctx.moveTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = `rgba(90, 232, 214, ${0.5 * fade})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(8, 150, 140, ${0.9 * fade})`;
    ctx.lineWidth = 0.8;
    ctx.stroke();
  }
  const lots = [null, null, null, null, null];
  for (const s of world.glimmers) {
    const bright = Math.ceil(Math.max(0, 1 - (s.age / s.life) ** 2) * 4);
    if (!bright) continue;
    const path = lots[bright] || (lots[bright] = new Path2D());
    path.moveTo(s.x - s.vx * 0.026, s.y - s.vy * 0.026);
    path.lineTo(s.x, s.y);
  }
  ctx.lineCap = 'round';
  lots.forEach((path, bright) => {
    if (!path) return;
    for (const [rgb, wide] of [['8, 170, 155', 1.7], ['222, 255, 248', 0.75]]) {
      ctx.strokeStyle = `rgba(${rgb}, ${bright / 4})`;
      ctx.lineWidth = wide;
      ctx.stroke(path);
    }
  });
  ctx.restore();
}
