// The Gatling Trooper's effects in the world: his glowing tracer rounds, the brass that pours out of the cannon, bounces
// and piles up, the sparks where his rounds strike, and the blast of his ammo drum when he goes. All of it is for show.
import { TAU, FEET } from './config.js?v=271';

const BRASS_MAX = 36;

export function resetGatlingFx(world) {
  world.brass = [];
  world.chips = []; // sparks
  world.pops = []; // little flashes and rings
}

// a spent shell: it flies in a little arc over its own spot on the ground, bounces a couple of times and lies there
function shell(world, x, gy, z, vx, vy, vz, life) {
  world.brass.push({ x, gy, z, vx, vy, vz, rot: Math.random() * TAU, spin: (Math.random() - 0.5) * 34, age: 0, life, rest: false });
  if (world.brass.length > BRASS_MAX) world.brass.shift();
}

function chips(world, x, y, n, ang, spread, speed, cool) {
  for (let i = 0; i < n; i++) {
    const a = ang + (Math.random() - 0.5) * spread;
    const sp = speed * (0.4 + Math.random() * 0.8);
    world.chips.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: 0.12 + Math.random() * 0.22, cool: !!cool });
  }
}

function pop(world, x, y, r, life, kind) {
  world.pops.push({ x, y, r, life, kind, age: 0, turn: Math.random() * TAU });
}

// the first round of a volley lands with a thump
export function gatlingVolley(world, u) {
  if (world.sfx) world.sfx('slam', u.x);
}

// every round: a brass shell flung back from every other one, and now and then a lick of smoke
export function gatlingShot(world, u, m, a) {
  u.shots = (u.shots || 0) + 1;
  if (u.shots % 2 === 0) {
    shell(world, u.x + u.facing * 2, u.y + FEET + (Math.random() - 0.5) * 4, 10 + Math.random() * 2, -u.facing * (20 + Math.random() * 30), (Math.random() - 0.4) * 12, 52 + Math.random() * 36, 1.1 + Math.random() * 0.6);
  }
  if (u.shots % 6 === 0) {
    world.puffs.push({ x: m.x + Math.cos(a) * 7, y: m.y + Math.sin(a) * 7 - 1, vx: Math.cos(a) * 8, vy: -9 - Math.random() * 8, age: 0, life: 0.5, size: 1.8 });
  }
}

// where a round strikes: one small flash and a couple of sparks
export function gatlingImpact(world, x, y, ang) {
  pop(world, x, y, 4.4, 0.08, 'star');
  chips(world, x, y, 2, ang + Math.PI, 1.8, 120);
}

// the ammo drum goes off as he blows apart
export function gatlingCookOff(world, u) {
  const gy = u.y + FEET;
  for (let i = 0; i < 14; i++) {
    const a = Math.random() * TAU;
    const sp = 24 + Math.random() * 66;
    shell(world, u.x, gy + (Math.random() - 0.5) * 6, 11, Math.cos(a) * sp, Math.sin(a) * sp * 0.45, 90 + Math.random() * 120, 1.7 + Math.random() * 0.9);
  }
  chips(world, u.x, u.y - 3, 16, 0, TAU, 210);
  pop(world, u.x, u.y - 3, 30, 0.3, 'ring');
}

export function stepGatlingFx(world, dt) {
  for (const s of world.brass) {
    s.age += dt;
    if (s.rest) continue;
    s.x += s.vx * dt;
    s.gy += s.vy * dt;
    s.z += s.vz * dt;
    s.vz -= 330 * dt;
    s.rot += s.spin * dt;
    if (s.z > 0 || s.vz > 0) continue;
    s.z = 0;
    if (s.vz < -34) {
      s.vz *= -0.42;
      s.vx *= 0.6;
      s.vy *= 0.6;
      s.spin *= 0.6;
    } else s.rest = true;
  }
  for (const c of world.chips) {
    c.age += dt;
    c.x += c.vx * dt;
    c.y += c.vy * dt;
    c.vx *= 0.9;
    c.vy = c.vy * 0.9 + 140 * dt;
  }
  for (const p of world.pops) p.age += dt;
  const live = (o) => o.age < o.life;
  if (!world.brass.every(live)) world.brass = world.brass.filter(live);
  if (!world.chips.every(live)) world.chips = world.chips.filter(live);
  if (!world.pops.every(live)) world.pops = world.pops.filter(live);
}

function drawShell(ctx, s, y) {
  ctx.save();
  ctx.translate(s.x, y);
  ctx.rotate(s.rot);
  ctx.fillStyle = '#e8b54a';
  ctx.strokeStyle = '#6e4a10';
  ctx.lineWidth = 0.55;
  ctx.beginPath();
  ctx.rect(-2, -0.9, 4, 1.8);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#fff0b8';
  ctx.fillRect(-1.5, -0.65, 2.4, 0.55);
  ctx.restore();
}

// under the units: the shells lying about
export function drawGatlingGround(ctx, world) {
  for (const s of world.brass) {
    const fade = Math.min(1, (s.life - s.age) / 0.7);
    ctx.globalAlpha = fade;
    if (s.rest) drawShell(ctx, s, s.gy);
    else {
      ctx.fillStyle = 'rgba(70, 70, 82, 0.22)';
      ctx.beginPath();
      ctx.ellipse(s.x, s.gy, 1.9, 0.9, 0, 0, TAU);
      ctx.fill();
    }
  }
  ctx.globalAlpha = 1;
}

function line(ctx, x0, y0, x1, y1, col, wide) {
  ctx.strokeStyle = col;
  ctx.lineWidth = wide;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.stroke();
}

// a round in flight: a hot streak, white at the head, trailing off through gold to orange
function drawTracer(ctx, b) {
  const sp = Math.hypot(b.vx, b.vy) || 1;
  const ux = b.vx / sp;
  const uy = b.vy / sp;
  const len = Math.min(15, 4 + (b.dist || 0));
  for (const [rgb, wide, k] of [['255, 156, 28', 2.5, 1]]) {
    const gr = ctx.createLinearGradient(b.x - ux * len * k, b.y - uy * len * k, b.x, b.y);
    gr.addColorStop(0, `rgba(${rgb}, 0)`);
    gr.addColorStop(1, `rgba(${rgb}, 0.95)`);
    line(ctx, b.x - ux * len * k, b.y - uy * len * k, b.x, b.y, gr, wide);
  }
  line(ctx, b.x - ux * 3.6, b.y - uy * 3.6, b.x, b.y, '#fff6c8', 1.1);
}

// over the units: tracers, shells in the air, sparks and flashes
export function drawGatlingAir(ctx, world) {
  ctx.lineCap = 'round';
  for (const b of world.bullets) if (b.tracer) drawTracer(ctx, b);
  for (const s of world.brass) {
    if (s.rest) continue;
    ctx.globalAlpha = Math.min(1, (s.life - s.age) / 0.7);
    drawShell(ctx, s, s.gy - s.z);
  }
  ctx.globalAlpha = 1;
  for (const c of world.chips) {
    const fade = 1 - (c.age / c.life) ** 2;
    const x = c.x - c.vx * 0.022;
    const y = c.y - c.vy * 0.022;
    line(ctx, x, y, c.x, c.y, c.cool ? `rgba(30, 215, 170, ${fade})` : `rgba(255, 132, 24, ${fade})`, 1.7);
    line(ctx, x, y, c.x, c.y, c.cool ? `rgba(220, 255, 246, ${fade})` : `rgba(255, 240, 160, ${fade})`, 0.7);
  }
  for (const p of world.pops) {
    const q = p.age / p.life;
    if (p.kind === 'ring') {
      const r = p.r * (0.25 + 0.75 * (1 - (1 - q) ** 2));
      for (const [col, wide] of [[`rgba(255, 168, 40, ${0.85 * (1 - q)})`, 2.6 * (1 - q * 0.6)], [`rgba(255, 252, 225, ${1 - q})`, 0.9]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = wide;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.stroke();
      }
      continue;
    }
    for (const [col, k] of [[`rgba(255, 160, 34, ${1 - q})`, 1], [`rgba(255, 249, 205, ${1 - q})`, 0.55]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const an = p.turn + (i / 10) * TAU;
        const r = p.r * k * (i % 2 ? 0.34 : 1) * (0.7 + q * 0.5);
        if (i) ctx.lineTo(p.x + Math.cos(an) * r, p.y + Math.sin(an) * r);
        else ctx.moveTo(p.x + Math.cos(an) * r, p.y + Math.sin(an) * r);
      }
      ctx.closePath();
      ctx.fill();
    }
  }
}
