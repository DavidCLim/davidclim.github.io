// Gibbondore The Great: how he fights, and what his magic does to the world.
// Like the original's ape he goes straight in and hits the ground hard enough to send everyone flying; being a gibbon
// he also swings himself across the gap in one great leap, and being a wizard he throws stars from his staff on the way.
import { TAU, K, FEET } from './config.js?v=255';
import { OUT } from './sprites.js?v=255';

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
// where the orb of his staff is as he lets a spell go, in his own art px
const ORB = { x: 96, y: -42 };

export function resetGibbonFx(world) {
  world.storms = [];
  world.zapMarks = [];
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
const LEAD = 0.14; // the sky darkens and each bolt feels its way down before it hits
const GAP = 0.065; // between one bolt and the next
const GLOW = 0.46; // how long each is seen
const CRAWL = 0.7; // how long sparks go on crawling over whoever was struck
const UP = 0.24; // the bolt that leaps from his staff into the sky

// where the end of his staff lands in the slam pose
function staffEnd(u) {
  return { x: u.x + u.facing * 92 * K * u.def.scale, y: u.y + FEET };
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
  const bolts = all.slice(0, m.targets).map((o, i) => ({ o, x: o.x, y: o.y, at: LEAD + i * GAP, struck: false, seed: Math.floor(Math.random() * 9000) }));
  if (!bolts.length) return;
  // where the orb is as he holds the staff to the sky
  const orb = { x: u.x + u.facing * 17 * K * u.def.scale, y: u.y + FEET + (-124 * K - FEET) * u.def.scale };
  world.storms.push({ bolts, age: 0, life: LEAD + (bolts.length - 1) * GAP + Math.max(GLOW, CRAWL), owner: u, orb, seed: Math.floor(Math.random() * 9000) });
  glints(world, orb.x, orb.y, 14, 120);
  if (world.sfx) world.sfx('zap', orb.x);
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
      glints(world, o.x, o.y + FEET * 0.5, 14, 130);
      world.zapMarks.push({ x: o.x, y: o.y + FEET * 0.85, age: 0, life: 2.4, seed: bolt.seed });
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * TAU + Math.random();
        world.puffs.push({ x: o.x + Math.cos(a) * 5, y: o.y + FEET * 0.7 + Math.sin(a) * 2.4, vx: Math.cos(a) * 30, vy: Math.sin(a) * 10 - 8, age: 0, life: rand(0.35, 0.6), size: rand(1.8, 3.2), dust: true });
      }
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

// the same string of numbers every time for the same seed, so a bolt can hold its shape for a few frames
const rnd = (seed, i) => {
  const v = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453;
  return v - Math.floor(v);
};

// a hard zig-zag from (x0, y0) to (x1, y1), kinking to one side and then the other
function zigzag(x0, y0, x1, y1, seed, kink, step = 21) {
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  const nx = -(y1 - y0) / len;
  const ny = (x1 - x0) / len;
  const n = Math.max(3, Math.round(len / step));
  const pts = [[x0, y0]];
  for (let i = 1; i < n; i++) {
    const q = (i + (rnd(seed, i + 40) - 0.5) * 0.5) / n;
    // it settles onto its mark as it nears the ground
    const off = (i % 2 ? 1 : -1) * kink * (0.35 + 0.65 * rnd(seed, i)) * Math.min(1, (1 - q) * 3.2);
    pts.push([x0 + (x1 - x0) * q + nx * off, y0 + (y1 - y0) * q + ny * off]);
  }
  pts.push([x1, y1]);
  return pts;
}

// the shape of a bolt: `w0` half as wide where it starts, down to `w1`, and drawn out to a point at its end
function ribbon(ctx, pts, w0, w1) {
  const left = [];
  const right = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[i + 1];
    const len = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / len;
    const ny = (b[0] - a[0]) / len;
    const w = w0 + (w1 - w0) * (i / (pts.length - 1));
    left.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    right.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  ctx.moveTo(...left[0]);
  for (const [x, y] of left) ctx.lineTo(x, y);
  ctx.lineTo(...pts[pts.length - 1]);
  for (let i = right.length - 1; i >= 0; i--) ctx.lineTo(...right[i]);
  ctx.closePath();
}

function trace(ctx, pts) {
  ctx.beginPath();
  for (const [x, y] of pts) ctx.lineTo(x, y);
  ctx.stroke();
}

// flat yellow with a white-hot middle, inside the same dark line as everything else in the game. `list` is any number
// of [points, w0, w1], all drawn in one go
function boltShapes(ctx, list, edge = 1) {
  const all = (a, b) => {
    ctx.beginPath();
    for (const [pts, w0, w1] of list) ribbon(ctx, pts, w0 * a, w1 * b);
  };
  all(1, 1);
  if (edge > 0.05) {
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 4;
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 2.2 * edge; // half of it is covered by the fill
    ctx.stroke();
  }
  ctx.fillStyle = '#ffd51a';
  ctx.fill();
  all(0.46, 0.4);
  ctx.fillStyle = '#fffbe2';
  ctx.fill();
}

const boltShape = (ctx, pts, w0, w1, edge) => boltShapes(ctx, [[pts, w0, w1]], edge);

// thin crackles of electricity, any number of lines at once: gold edge, yellow, white thread
function crackle(ctx, lines, wide) {
  ctx.lineJoin = 'miter';
  ctx.lineCap = 'round';
  ctx.beginPath();
  for (const pts of lines) {
    ctx.moveTo(...pts[0]);
    for (const [x, y] of pts) ctx.lineTo(x, y);
  }
  for (const [col, k] of [['#d88a00', 2.6], ['#ffd51a', 1.6], ['#fffbe2', 0.6]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = wide * k;
    ctx.stroke();
  }
}

// A great bolt is a lot of shapes, so each is drawn once into a picture and stamped from then on. The picture holds a
// straight run of it, TALL long with its point at the foot; a strike uses as much of the foot as it needs and leans it
// to fit. Six different ones, each as it strikes (lined in dark, thin arcs twisting about it) and as it dies (bare light)
const SHAPES = 6;
const TALL = 700;
const HALF = 52; // half the picture's width
const SHARP = 2.5; // picture px to a world unit
const boltPictures = new Map();

function boltPicture(n, striking) {
  const key = n * 2 + (striking ? 1 : 0);
  let c = boltPictures.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = HALF * 2 * SHARP;
  c.height = (TALL + 6) * SHARP;
  const g = c.getContext('2d');
  g.setTransform(SHARP, 0, 0, SHARP, HALF * SHARP, 0);
  const seed = 211 + n * 97;
  const pts = zigzag(0, 0, 0, TALL, seed, 9);
  const edge = striking ? 1 : 0;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  for (const [col, wide] of [['rgba(255, 222, 60, 0.2)', 24], ['rgba(255, 232, 90, 0.34)', 14]]) {
    g.strokeStyle = col;
    g.lineWidth = wide;
    trace(g, pts);
  }
  if (striking) crackle(g, [0, 1].map((side) => zigzag(side ? 10 : -10, 0, 0, TALL, seed + 101 + side * 53, 11, 15)), 0.6);
  // forks, splitting off downward
  const forks = [];
  for (let i = 2; i < pts.length - 1; i += 2) {
    const dir = rnd(seed, i + 7) < 0.5 ? -1 : 1;
    const [fx, fy] = pts[i];
    const ex = fx + dir * (15 + rnd(seed, i + 9) * 17);
    const ey = Math.min(TALL + 4, fy + 16 + rnd(seed, i + 11) * 22);
    forks.push([zigzag(fx, fy, ex, ey, seed + i, 4.5, 10), 2.1, 0.7]);
  }
  boltShapes(g, forks, edge);
  boltShape(g, pts, 7.8, 3.4, edge);
  boltPictures.set(key, c);
  return c;
}

// one great bolt from above the top of the screen down to (x, y). It changes shape every few frames, blinks once as it
// strikes a second time down the same path, and dies away as light
function lightning(ctx, x, y, since, seed) {
  const blink = since > 0.1 && since < 0.145 ? 0.25 : 1;
  const a = (since < 0.3 ? 1 : Math.max(0, 1 - (since - 0.3) / (GLOW - 0.3))) * blink;
  if (a <= 0) return;
  const n = (seed + Math.floor(Math.min(since, 0.24) / 0.06)) % SHAPES;
  const top = -40;
  const lean = (rnd(seed, 3) - 0.5) * 36;
  const len = Math.max(20, y - top);
  const run = Math.min(TALL, len);
  const lined = Math.max(0, Math.min(1, 1 - (since - 0.24) / 0.1));
  ctx.save();
  // (leant over so its head is `lean` to one side and its point is on the mark)
  ctx.transform(1, 0, -lean / run, len / run, x + lean, top);
  for (const [striking, alpha] of [[false, a * (1 - lined)], [true, a * lined]]) {
    if (alpha <= 0.01) continue;
    ctx.globalAlpha = alpha;
    ctx.drawImage(boltPicture(n, striking), 0, (TALL - run) * SHARP, HALF * 2 * SHARP, (run + 5) * SHARP, -HALF, 0, HALF * 2, run + 5);
  }
  ctx.restore();
}

// before it hits, a faint thread feels its way down toward the one it is after
function leader(ctx, x, y, q, seed, clock) {
  const pts = zigzag(x + (rnd(seed, 3) - 0.5) * 36, -40, x, y, seed + Math.floor(clock * 30), 8, 14);
  const n = Math.max(2, Math.ceil(pts.length * q));
  ctx.save();
  ctx.globalAlpha = 0.35 + 0.45 * q;
  crackle(ctx, [pts.slice(0, n)], 0.7);
  ctx.restore();
}

// the crack where it lands: a jagged burst, outlined, with sharp shards flying out of it
function impact(ctx, x, y, since, seed) {
  if (since > 0.3) return;
  const p = since / 0.3;
  const grow = Math.min(1, since / 0.05);
  ctx.save();
  ctx.globalAlpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
  ctx.lineJoin = 'miter';
  for (const [fill, k, line] of [['#ffd51a', 1, 2], ['#fffbe2', 0.5, 0]]) {
    ctx.beginPath();
    for (let i = 0; i < 18; i++) {
      const an = (i / 18) * TAU + rnd(seed, 2) * 3;
      const r = (i % 2 ? 4.2 : 9 + 8 * rnd(seed, i + 20)) * k * grow;
      ctx.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r * 0.62);
    }
    ctx.closePath();
    if (line) {
      ctx.strokeStyle = OUT;
      ctx.lineWidth = line;
      ctx.stroke();
    }
    ctx.fillStyle = fill;
    ctx.fill();
  }
  const out = 1 - (1 - p) ** 2;
  const shards = [];
  for (let i = 0; i < 7; i++) {
    const an = (i / 7) * TAU + rnd(seed, i + 60);
    const r = 12 + 26 * out;
    const px = x + Math.cos(an) * r;
    const py = y + Math.sin(an) * r * 0.55 - Math.sin(p * Math.PI) * 9;
    shards.push([[[px, py], [px + Math.cos(an) * 3 - 1.6, py + Math.sin(an) * 2], [px + Math.cos(an) * 5 + 1.6, py + Math.sin(an) * 3], [px + Math.cos(an) * 9, py + Math.sin(an) * 5]], 1.5 * (1 - p), 0.6 * (1 - p)]);
  }
  boltShapes(ctx, shards, p < 0.55 ? 1 : 0);
  ctx.restore();
}

// whoever it hit goes on sparking for a moment
function crawl(ctx, bolt, since) {
  if (since > CRAWL) return;
  const o = bolt.o;
  const x = o.dead ? bolt.x : o.x;
  const y = (o.dead ? bolt.y : o.y) - 1;
  const r = (o.def.radius || 6) + 3;
  const seed = bolt.seed + Math.floor(since / 0.055) * 31;
  ctx.save();
  ctx.globalAlpha = 1 - (since / CRAWL) ** 3;
  const arcs = [];
  for (let i = 0; i < 2; i++) {
    const a0 = rnd(seed, i) * TAU;
    const pts = [];
    for (let j = 0; j < 5; j++) {
      const an = a0 + j * 0.42;
      const k = 0.72 + 0.6 * rnd(seed, i * 7 + j + 3);
      pts.push([x + Math.cos(an) * r * k, y + Math.sin(an) * r * 0.9 * k]);
    }
    arcs.push(pts);
  }
  crackle(ctx, arcs, 0.7);
  ctx.restore();
}

let cloudGlow = null;
function makeCloudGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(48, 48, 2, 48, 48, 48);
  gr.addColorStop(0, 'rgba(255, 246, 170, 0.95)');
  gr.addColorStop(1, 'rgba(255, 220, 60, 0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 96, 96);
  return c;
}

// dark thunderheads along the top of the screen over everyone who is about to be struck, run together into one
function clouds(ctx, s) {
  const grow = Math.min(1, s.age / LEAD);
  const last = s.bolts[s.bolts.length - 1].at + GLOW;
  const fade = s.age < last - 0.16 ? 1 : Math.max(0, 1 - (s.age - last + 0.16) / 0.3);
  if (fade <= 0) return;
  const puffs = [];
  for (const b of s.bolts) {
    const cx = b.x + (rnd(b.seed, 3) - 0.5) * 36;
    for (const [dx, dy, r] of [[-27, 0, 11], [-13, 6, 15], [3, 2, 19], [18, 7, 13], [30, 0, 10]]) {
      puffs.push([cx + dx * grow, dy + Math.sin(s.age * 9 + dx) * 0.8 - 14 * (1 - grow), r * (0.5 + 0.5 * grow)]);
    }
  }
  ctx.save();
  ctx.globalAlpha = fade * 0.96;
  const all = (extra) => {
    ctx.beginPath();
    for (const [x, y, r] of puffs) {
      ctx.moveTo(x + r + extra, y);
      ctx.arc(x, y, r + extra, 0, TAU);
    }
    ctx.fill();
  };
  ctx.fillStyle = OUT;
  all(1.2);
  ctx.fillStyle = '#4b4570';
  all(0);
  ctx.fillStyle = '#625b8c';
  ctx.beginPath();
  for (const [x, y, r] of puffs) {
    ctx.moveTo(x - 2 + r * 0.66, y - 3);
    ctx.arc(x - 2, y - 3, r * 0.66, 0, TAU);
  }
  ctx.fill();
  // they light up from inside as each bolt leaves them
  for (const b of s.bolts) {
    const since = s.age - b.at;
    if (since < 0 || since > 0.2) continue;
    const cx = b.x + (rnd(b.seed, 3) - 0.5) * 36;
    if (!cloudGlow) cloudGlow = makeCloudGlow();
    ctx.globalAlpha = fade * (1 - since / 0.2);
    ctx.drawImage(cloudGlow, cx - 30, -21, 60, 60);
  }
  ctx.restore();
}

// the whole field blinks pale with the thunder: one blink at a time, however many storms are breaking
function thunderFlash(ctx, storms) {
  let flash = 0;
  for (const s of storms) {
    for (const b of s.bolts) {
      const since = s.age - b.at;
      if (since >= 0 && since < 0.12) flash = Math.max(flash, 1 - since / 0.12);
    }
  }
  if (flash <= 0) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = `rgba(255, 236, 130, ${0.1 * flash})`;
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.restore();
}

function drawStormAir(ctx, s) {
  const clock = performance.now() / 1000;
  // up from his staff first
  if (s.age < UP) {
    const k = 1 - (s.age / UP) ** 2;
    const pts = zigzag(s.orb.x, s.orb.y, s.orb.x + (rnd(s.seed, 5) - 0.5) * 30, -40, s.seed + Math.floor(s.age / 0.05) * 13, 7, 15);
    ctx.save();
    ctx.globalAlpha = Math.min(1, k * 1.5);
    boltShape(ctx, pts, 3.4 * (0.5 + 0.5 * k), 1.6 * k, Math.max(0, (k - 0.55) / 0.45));
    ctx.restore();
  }
  for (const b of s.bolts) {
    const since = s.age - b.at;
    const y = b.y + FEET * 0.45;
    if (since < 0) {
      if (since > -LEAD) leader(ctx, b.struck || b.o.dead ? b.x : b.o.x, (b.o.dead ? b.y : b.o.y) + FEET * 0.45, 1 + since / LEAD, b.seed, clock);
      continue;
    }
    if (!b.struck) continue;
    if (since <= GLOW) lightning(ctx, b.x, y, since, b.seed);
    impact(ctx, b.x, y, since, b.seed);
    crawl(ctx, b, since);
  }
  clouds(ctx, s);
}

// under the units: the burnt patch each bolt leaves in the ground
function drawZapMarks(ctx, world) {
  for (const m of world.zapMarks) {
    const fade = m.age < m.life * 0.55 ? 1 : 1 - (m.age - m.life * 0.55) / (m.life * 0.45);
    const hot = Math.max(0, 1 - m.age / 0.5);
    ctx.lineJoin = 'miter';
    ctx.lineCap = 'round';
    ctx.fillStyle = `rgba(66, 46, 40, ${0.34 * fade})`;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const an = (i / 14) * TAU;
      const r = (i % 2 ? 7.5 : 11 + 4 * rnd(m.seed, i));
      ctx.lineTo(m.x + Math.cos(an) * r, m.y + Math.sin(an) * r * 0.42);
    }
    ctx.closePath();
    ctx.fill();
    // for a moment the cracks round it still glow
    if (hot <= 0) continue;
    for (let i = 0; i < 5; i++) {
      const an = (i / 5) * TAU + rnd(m.seed, i + 30);
      const len = 14 + 7 * rnd(m.seed, i + 35);
      const pts = zigzag(m.x + Math.cos(an) * 5, m.y + Math.sin(an) * 2.1, m.x + Math.cos(an) * len, m.y + Math.sin(an) * len * 0.42, m.seed + i, 1.8, 4);
      for (const [col, wide] of [[`rgba(216, 138, 0, ${hot})`, 1.8], [`rgba(255, 224, 60, ${hot})`, 0.8]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = wide;
        trace(ctx, pts);
      }
    }
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
    // a trail of gold sparks hangs in the air behind him
    glints(world, u.x - u.facing * 9 + rand(-5, 5), u.y - u.alt * d.leap.height + rand(-8, 8), 1, 34);
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
  for (const m of world.zapMarks) m.age += dt;
  if (world.zapMarks.some((m) => m.age >= m.life)) world.zapMarks = world.zapMarks.filter((m) => m.age < m.life);
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
  drawZapMarks(ctx, world);
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
  // (the gold sparks, gathered by brightness and each lot drawn in one go)
  const lots = [null, null, null, null, null];
  for (const g of world.glints) {
    const bright = Math.ceil(Math.max(0, 1 - (g.age / g.life) ** 2) * 4);
    if (!bright) continue;
    const path = lots[bright] || (lots[bright] = new Path2D());
    path.moveTo(g.x - g.vx * 0.024, g.y - g.vy * 0.024);
    path.lineTo(g.x, g.y);
  }
  ctx.lineCap = 'round';
  lots.forEach((path, bright) => {
    if (!path) return;
    for (const [rgb, wide] of [['236, 150, 20', 1.8], ['255, 240, 170', 0.8]]) {
      ctx.strokeStyle = `rgba(${rgb}, ${bright / 4})`;
      ctx.lineWidth = wide;
      ctx.stroke(path);
    }
  });
  thunderFlash(ctx, world.storms);
  for (const s of world.storms) drawStormAir(ctx, s);
}
