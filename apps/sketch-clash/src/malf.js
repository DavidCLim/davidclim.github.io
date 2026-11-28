// Malfunction Trooper: how he picks his crowd, limps over to it and blows himself up, and the sparks that keep jumping off
// him on the way. Only the blast hurts anyone; the sparks are for show.
import { TAU, K, FEET } from './config.js?v=264';
import { nova, embers, scorch } from './zordfx.js?v=264';
import { MALF_SPOTS } from './art_units.js?v=264';

const rand = (a, b) => a + Math.random() * (b - a);
const ease = (q) => q * q * (3 - 2 * q);

export function resetMalfFx(world) {
  world.fizz = []; // his harmless sparks
  world.booms = []; // blasts about to happen
  world.crowds = new Map(); // side -> where its enemies are bunched
}

// ---------------------------------------------------------------- the limp
// One whole limping step, as a hurt leg makes it, with p going 0..1:
//   0    .. HOP    the good foot snatches forward, and while it is off the ground all his weight drops onto the bad leg,
//                  which gives under him: he lurches down and winces
//   HOP  .. DRAG   both feet down: he catches himself on the good one
//   DRAG .. REST   he heaves up over the good leg and hauls the bad one along behind, its toe scraping
//   REST .. 1      both down again: he stops a moment to get over it
// He only gets anywhere as `travel` says he does, and a foot that is on the ground is moved back by just as much as he
// goes forward, so it stays exactly where it was put.
const HOP = 0.28;
const DRAG = 0.48;
const REST = 0.84;
const SHARE = [0, 0.45, 0.5, 0.95, 1]; // how much of the step he has covered by the end of each part
// how far a foot goes from front to back, as a part of the step: what he covers while it is on the ground
const REACH = 1 - SHARE[1];

// how far he has got after `phase` steps, counted in steps
export function limpTravel(phase) {
  const whole = Math.floor(phase);
  const p = phase - whole;
  if (p < HOP) return whole + SHARE[1] * ease(p / HOP);
  if (p < DRAG) return whole + SHARE[1] + (SHARE[2] - SHARE[1]) * ((p - HOP) / (DRAG - HOP));
  if (p < REST) return whole + SHARE[2] + (SHARE[3] - SHARE[2]) * ease((p - DRAG) / (REST - DRAG));
  return whole + SHARE[3] + (SHARE[4] - SHARE[3]) * ((p - REST) / (1 - REST));
}

// What he looks like `phase` steps in. k: 0 standing still .. 1 walking. goodAt / badAt: how far ahead of its resting
// place each foot is, in steps (multiply by the length of a step)
export function limpPose(phase, k) {
  const p = phase - Math.floor(phase);
  const half = REACH / 2;
  const gone = limpTravel(p);
  const pose = { goodLift: 0, goodTurn: 0, badLift: 0, badTurn: 0, bob: 0, lean: 0, swing: 0, scrape: 0, stamp: 0, wince: 0, heave: 0 };
  // the good foot: in the air for the hop, then planted
  if (p < HOP) {
    const q = p / HOP;
    pose.goodAt = -half + REACH * ease(q);
  } else pose.goodAt = half - (gone - SHARE[1]);
  // the bad foot: dragged forward in its turn, planted the rest of the time (right through the end of one step and into
  // the next)
  if (p >= DRAG && p < REST) {
    const q = (p - DRAG) / (REST - DRAG);
    pose.badAt = -half + REACH * ease(q);
  } else pose.badAt = half - ((p < DRAG ? gone + 1 : gone) - SHARE[3]);

  if (p < HOP) {
    const q = p / HOP;
    const give = Math.sin(Math.PI * q ** 0.8);
    pose.goodLift = Math.sin(q * Math.PI) * 7.5;
    pose.goodTurn = -0.4 * Math.sin(q * TAU);
    pose.bob = 7 * give;
    pose.lean = -0.27 * give;
    pose.swing = give;
    pose.wince = Math.min(1, give * 1.5);
  } else if (p < DRAG) {
    const q = (p - HOP) / (DRAG - HOP);
    pose.bob = 2.6 * Math.sin(q * Math.PI);
    pose.lean = 0.07 * ease(q);
    pose.stamp = Math.max(0, 1 - q * 1.4);
    pose.wince = Math.max(0, 0.7 - q * 1.6);
  } else if (p < REST) {
    const q = (p - DRAG) / (REST - DRAG);
    const up = Math.sin(q * Math.PI);
    pose.bob = -3.5 * up;
    pose.lean = 0.07 + 0.14 * up;
    pose.badLift = 0.9 * up;
    pose.badTurn = 0.85 * Math.sin(Math.min(1, q * 1.25) * Math.PI);
    pose.swing = -0.7 * up;
    pose.scrape = up;
    pose.heave = up;
  } else {
    const q = (p - REST) / (1 - REST);
    pose.bob = 2.2 * Math.sin(q * Math.PI);
    pose.lean = 0.07 * (1 - ease(q));
  }
  for (const key in pose) pose[key] *= k;
  return pose;
}

// ---------------------------------------------------------------- finding the biggest group
// Everyone on the other side(s) with how many of them are bunched round each. Shared by all of one side's Malfunction
// Troopers, and only counted afresh a few times a second.
function crowdsFor(world, side, near) {
  let c = world.crowds.get(side);
  if (c && world.clock >= c.at && world.clock - c.at < 0.35) return c.list;
  const list = [];
  for (const o of world.units) {
    if (o.dead || o.side === side) continue;
    let n = 0;
    let x = 0;
    let y = 0;
    world.eachEnemyNear(side, o.x, o.y, near, (p) => {
      if ((p.x - o.x) ** 2 + (p.y - o.y) ** 2 > near * near) return;
      n++;
      x += p.x;
      y += p.y;
    });
    if (n) list.push({ o, n, x: x / n, y: y / n });
  }
  world.crowds.set(side, { at: world.clock, list });
  return list;
}

// the biggest group going, the nearer of two the same size. He sticks with the one he has unless another is bigger
function pickCrowd(world, u) {
  const list = crowdsFor(world, u.side, u.def.bomb.crowd);
  let best = null;
  let bestD = Infinity;
  let mine = null;
  for (const c of list) {
    if (c.o.dead) continue;
    if (u.goal && c.o === u.goal.o) mine = c;
    const dist = Math.hypot(c.x - u.x, c.y - u.y);
    if (!best || c.n > best.n || (c.n === best.n && dist < bestD)) {
      best = c;
      bestD = dist;
    }
  }
  if (mine && best && best.n <= mine.n) best = mine;
  if (!best || !u.goal || best.o !== u.goal.o) u.closest = Infinity;
  u.goal = best ? { o: best.o, n: best.n, x: best.x, y: best.y } : null;
}

export function stepMalf(world, u, dt) {
  const d = u.def;
  const m = d.bomb;
  u.limpK = u.limpK || 0;
  if (u.fuseT !== undefined) {
    u.fuseT += dt;
    u.limpK = Math.max(0, u.limpK - dt * 8);
    if (u.fuseT >= m.wind) world.hurt(u, u.hp + 1e6, u.x, u.y, 'fuse', null);
    return;
  }
  u.huntT = (u.huntT || 0) - dt;
  if (u.huntT <= 0 || (u.goal && u.goal.o.dead)) {
    u.huntT = 0.35 + Math.random() * 0.15;
    pickCrowd(world, u);
  }
  const g = u.goal;
  u.target = g ? g.o : null;
  if (g) {
    const dx = g.x - u.x;
    const dy = g.y - u.y;
    const dist = Math.hypot(dx, dy) || 1;
    // in among them? then it is time
    let close = 0;
    let touching = false;
    world.eachEnemyNear(u.side, u.x, u.y, m.radius * 0.5 + 12, (o) => {
      const away = Math.hypot(o.x - u.x, o.y - u.y);
      if (away <= m.radius * 0.5) close++;
      if (o === g.o && away <= u.def.radius + o.def.radius + 5) touching = true;
    });
    const enough = close >= Math.max(1, Math.ceil(Math.min(g.n, 8) * 0.6));
    // if the crush (or their backing away) will not let him any nearer, this is near enough
    if (dist < u.closest - 2) {
      u.closest = dist;
      u.stuckT = 0;
    } else if (dist < m.radius * 0.9) u.stuckT = (u.stuckT || 0) + dt;
    if (touching || dist < 14 || (enough && dist < m.radius * 0.55) || u.stuckT > 0.8) {
      u.fuseT = 0;
      if (world.sfx) world.sfx('zap', u.x);
      return;
    }
    if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
    // he gets along in lurches, only ever moving as far as his step has taken him (hurrying, he reaches a bit further too)
    const hurry = dist < m.rush ? m.hurry : 1;
    const want = d.stride * (hurry > 1 ? 1.2 : 1);
    u.stride = u.stride === undefined ? want : u.stride + (want - u.stride) * Math.min(1, dt * 4);
    if (u.limp === undefined) u.limp = Math.random();
    const was = limpTravel(u.limp);
    u.limp += (dt * d.speed * u.speedMul * hurry) / u.stride;
    const s = (limpTravel(u.limp) - was) * u.stride;
    u.walkX = dx / dist;
    u.walkY = dy / dist;
    u.x += u.walkX * s;
    u.y += u.walkY * s;
    u.moving = true;
  }
  u.limpK = u.moving ? Math.min(1, u.limpK + dt * 7) : Math.max(0, u.limpK - dt * 6);
  u.pose = u.moving ? 1 : 0;
}

// ---------------------------------------------------------------- the blast
// he goes up a moment after he falls, so one setting off another goes bang, bang, not all at once
export function queueBoom(world, u) {
  world.booms.push({ x: u.x, y: u.y, owner: u, t: 0.06 });
}

function boom(world, b) {
  const u = b.owner;
  const m = u.def.bomb;
  const { x, y } = b;
  const gy = y + FEET;
  world.eachEnemyNear(u.side, x, y, m.radius + 20, (o) => {
    const dx = o.x - x;
    const dy = o.y - y;
    const dist = Math.hypot(dx, dy) || 1;
    const reach = m.radius + o.def.radius;
    if (dist > reach) return;
    // full force near the middle, falling to a third at the rim
    const f = Math.min(1, 1.2 - 0.87 * (dist / reach));
    if (!o.def.noKnock) {
      const heavy = o.def.hp > 300 ? 0.3 : 1;
      o.kx += (dx / dist) * m.knock * f * heavy;
      o.ky += (dy / dist) * m.knock * f * heavy;
    }
    world.hurt(o, m.damage * f, o.x, o.y, 'blast', u);
  });
  world.hitProps(x, y, m.radius, m.damage);

  // one big blast, and a ring of smaller ones bursting out round it a moment after
  world.blasts.push({ x, y: y - 5, age: 0, life: 4.4, r: m.radius * 0.6, seed: Math.random() });
  const turn = Math.random() * TAU;
  for (let i = 0; i < 6; i++) {
    const a = turn + (i / 6) * TAU + rand(-0.3, 0.3);
    const r = m.radius * rand(0.5, 0.78);
    world.booms.push({ pop: true, x: x + Math.cos(a) * r, y: y + Math.sin(a) * r * 0.62 - 3, r: rand(13, 21), t: 0.07 + i * 0.045 });
  }
  // fire rolling out of the middle
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * TAU + rand(-0.15, 0.15);
    const sp = rand(70, 270);
    world.flames.push({ x, y: y - 4, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.7 - rand(0, 40), age: 0, life: rand(0.35, 0.75), size: rand(3, 5.5), grow: rand(7, 13), dark: Math.random() < 0.6 });
  }
  nova(world, { x, y: gy, r: m.radius * 1.45, life: 0.55, rgb: '255, 150, 50', wide: 5, flat: true });
  nova(world, { x, y: gy, r: m.radius * 1.05, life: 0.42, rgb: '255, 220, 140', wide: 3, flat: true });
  nova(world, { x, y: y - 5, r: m.radius * 0.9, life: 0.26, rgb: '255, 240, 200', wide: 5 });
  embers(world, x, y - 5, 54, 0, TAU, 340);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU + Math.random() * 0.4;
    const r = i < 3 ? rand(0, 14) : rand(14, m.radius * 0.85);
    scorch(world, x + Math.cos(a) * r, gy + Math.sin(a) * r * 0.5, rand(4.5, 10), rand(2.6, 4.4));
  }
  for (let i = 0; i < 9; i++) {
    world.puffs.push({ x: x + rand(-26, 26), y: y - 6 + rand(-16, 12), vx: rand(-34, 34), vy: rand(-34, -6), age: 0, life: rand(1, 1.9), size: rand(6, 12) });
  }
  if (world.sfx) {
    world.sfx('boom', x);
    world.sfx('slam', x);
  }
}

function fizzFrom(world, u, spot, n) {
  const [ax, ay] = MALF_SPOTS[spot];
  const size = u.def.scale || 1.15;
  const x = u.x + u.facing * ax * K * size;
  const y = u.y + FEET + (ay * K - FEET) * size;
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + rand(-1.9, 1.9);
    const sp = rand(35, 105);
    world.fizz.push({ x, y, vx: Math.cos(a) * sp - u.facing * 14, vy: Math.sin(a) * sp, age: 0, life: rand(0.25, 0.6), floor: u.y + FEET + rand(-2, 3) });
  }
}

export function stepMalfFx(world, dt) {
  for (const u of world.units) {
    if (!u.def.bomb || u.dead) continue;
    if (u.zapT > 0) u.zapT -= dt;
    u.fizzT = (u.fizzT === undefined ? rand(0.4, 1.2) : u.fizzT) - dt;
    if (u.fizzT > 0) continue;
    const going = u.fuseT !== undefined;
    u.fizzT = going ? 0.07 : rand(0.45, 1.6);
    u.zapAt = Math.floor(Math.random() * MALF_SPOTS.length);
    u.zapT = 0.16;
    fizzFrom(world, u, u.zapAt, going ? 5 : 6 + Math.floor(Math.random() * 7));
  }
  for (const s of world.fizz) {
    s.age += dt;
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vy += 300 * dt;
    // they bounce once or twice off the ground
    if (s.y > s.floor && s.vy > 0) {
      s.y = s.floor;
      s.vy *= -0.4;
      s.vx *= 0.6;
    }
  }
  if (world.fizz.some((s) => s.age >= s.life)) world.fizz = world.fizz.filter((s) => s.age < s.life);
  if (!world.booms.length) return;
  // (a blast can bring down another of him, which adds to the list while it is being gone through)
  const waiting = world.booms;
  world.booms = [];
  for (const b of waiting) {
    b.t -= dt;
    if (b.t > 0) world.booms.push(b);
    else if (b.pop) world.blasts.push({ x: b.x, y: b.y, age: 0, life: 2.6, r: b.r, seed: Math.random() });
    else boom(world, b);
  }
}

// over the units: his sparks, gathered by brightness and each lot drawn in one go
export function drawMalfAir(ctx, world) {
  if (!world.fizz.length) return;
  const lots = [null, null, null, null, null];
  for (const s of world.fizz) {
    const bright = Math.ceil(Math.max(0, 1 - (s.age / s.life) ** 2) * 4);
    if (!bright) continue;
    const path = lots[bright] || (lots[bright] = new Path2D());
    path.moveTo(s.x - s.vx * 0.026, s.y - s.vy * 0.026);
    path.lineTo(s.x, s.y);
  }
  ctx.lineCap = 'round';
  lots.forEach((path, bright) => {
    if (!path) return;
    for (const [rgb, wide] of [['240, 150, 20', 1.7], ['255, 250, 205', 0.75]]) {
      ctx.strokeStyle = `rgba(${rgb}, ${bright / 4})`;
      ctx.lineWidth = wide;
      ctx.stroke(path);
    }
  });
}
