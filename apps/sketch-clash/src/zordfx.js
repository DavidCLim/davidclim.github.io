// MechaZord's effects in the world: the shockwave as he lets loose, the embers and heat rings in his breath, the ground
// it leaves burning, and the great blast when he goes. All of it is for show: none of it hurts anyone.
import { TAU, FEET } from './config.js?v=235';
import { WATER } from './terrain.js?v=235';

const TEAL = '70, 245, 200';
const GOLD = '255, 196, 80';
const SCORCH_MAX = 70;

export function resetZordFx(world) {
  world.embers = [];
  world.novas = [];
  world.scorches = [];
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

export function stepZordFx(world, dt) {
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
}

// over the units: the rings in the air and the embers
export function drawZordAir(ctx, world) {
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
