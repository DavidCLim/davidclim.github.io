import { SPECIES, GAZE_WEIGHTS } from './config.js?v=8';

export const CELL = 32;
const SEP_CELL = 20;
const GHOST_LIFE = 1.7;

function pickGaze() {
  let r = Math.random();
  for (let i = 0; i < GAZE_WEIGHTS.length; i++) {
    r -= GAZE_WEIGHTS[i];
    if (r <= 0) return i;
  }
  return 0;
}

// The sniper's own idle routine: what he does while nobody is around.
// [kind, weight, min seconds, max seconds]
const SNIPER_IDLES = [
  ['rest', 0.25, 1.4, 3],
  ['scan', 0.3, 2.6, 3.8],
  ['tip', 0.15, 1.2, 1.6],
  ['scope', 0.2, 2.2, 3],
  ['blink', 0.1, 0.5, 0.7],
];

function pickSniperIdle(prev) {
  let total = 0;
  for (const k of SNIPER_IDLES) if (k[0] !== prev || k[0] !== 'rest') total += k[1];
  let r = Math.random() * total;
  for (const [kind, w, lo, hi] of SNIPER_IDLES) {
    if (kind === prev && kind === 'rest') continue;
    r -= w;
    if (r <= 0) return { kind, dur: lo + Math.random() * (hi - lo) };
  }
  return { kind: 'rest', dur: 2 };
}

function segDist2(ax, ay, bx, by, px, py) {
  const abx = bx - ax;
  const aby = by - ay;
  const len2 = abx * abx + aby * aby;
  let t = len2 ? ((px - ax) * abx + (py - ay) * aby) / len2 : 0;
  t = t < 0 ? 0 : t > 1 ? 1 : t;
  const dx = ax + abx * t - px;
  const dy = ay + aby * t - py;
  return dx * dx + dy * dy;
}

function clamp(v, lo, hi) {
  return v < lo ? lo : v > hi ? hi : v;
}

// Every unit belongs to a "side" and only ever fights other sides. In
// free-for-all a side is a species, so a lone species has nobody to fight
// and just stands there; with two species they fight each other. In team
// battle a side is a team (red / blue) and units stay idle until the
// battle is started.
//
// Unit positions are the body centre; sprites are drawn with their feet
// FEET pixels below it. `aim` is the rifle angle in the unit's own
// (facing-mirrored) space.
export class World {
  constructor() {
    this.units = [];
    this.bullets = [];
    this.sparks = [];
    this.ghosts = [];
    this.streaks = []; // sniper shot trails
    this.puffs = []; // gun smoke
    this.casings = []; // ejected shells
    this.speciesCounts = {};
    this.mode = 'free'; // 'free' | 'team'
    this.started = false;
    this.grids = new Map(); // side -> targeting grid
    this.enemyGrids = new Map(); // side -> grids of every other occupied side
    this.counts = {};
    this.centroids = new Map();
    this.centroidT = 0;
    this.anyDead = false;
    this.nextId = 1;
    this.onDeath = null;
    this.resize(800, 600);
  }

  makeCells() {
    return Array.from({ length: this.cols * this.rows }, () => []);
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    this.cols = Math.ceil(w / CELL) + 1;
    this.rows = Math.ceil(h / CELL) + 1;
    for (const side of this.grids.keys()) this.grids.set(side, this.makeCells());
    this.sepCols = Math.ceil(w / SEP_CELL) + 1;
    this.sepRows = Math.ceil(h / SEP_CELL) + 1;
    this.sepHead = new Int32Array(this.sepCols * this.sepRows);
    this.sepNext = new Int32Array(0);
  }

  get live() {
    return this.mode === 'free' || this.started;
  }

  // `team` is only meaningful in team battle (null in free-for-all).
  addUnit(species, team, x, y) {
    const def = SPECIES[species].def;
    const side = this.mode === 'team' ? team : species;
    if (!this.grids.has(side)) this.grids.set(side, this.makeCells());
    this.units.push({
      id: this.nextId++,
      species,
      def,
      team: this.mode === 'team' ? team : null,
      side,
      x,
      y,
      hp: def.hp,
      facing: team === 'red' ? 1 : team === 'blue' ? -1 : Math.random() < 0.5 ? 1 : -1,
      speedMul: 0.9 + Math.random() * 0.2,
      target: null,
      marchTarget: null,
      retargetT: Math.random() * 0.3,
      burstLeft: 0,
      burstT: 0,
      cdT: Math.random() * 1.2,
      aim: 0,
      pose: 0, // 0 = standing around, 1 = ready to fight
      gaze: pickGaze(),
      gazeT: Math.random() * 2,
      breath: Math.random() * 10,
      prone: 0, // sniper: 0 standing .. 1 lying down
      aimT: 0, // sniper: time spent lined up on the current shot
      laser: false, // sniper: red laser on the target
      recoil: 0,
      idleKind: 'rest', // sniper idle routine
      idleT: Math.random() * 1.5,
      idleDur: 1.5,
      flash: 0,
      hit: 0,
      anim: Math.random() * 4,
      moving: false,
      dead: false,
    });
  }

  clear() {
    this.units = [];
    this.bullets = [];
    this.sparks = [];
    this.ghosts = [];
    this.streaks = [];
    this.puffs = [];
    this.casings = [];
    this.started = false;
    this.counts = {};
    this.speciesCounts = {};
    this.centroids.clear();
  }

  cellCol(x) {
    const c = (x / CELL) | 0;
    return c < 0 ? 0 : c >= this.cols ? this.cols - 1 : c;
  }

  cellRow(y) {
    const r = (y / CELL) | 0;
    return r < 0 ? 0 : r >= this.rows ? this.rows - 1 : r;
  }

  rebuild() {
    for (const cells of this.grids.values()) {
      for (let i = 0; i < cells.length; i++) cells[i].length = 0;
    }
    this.counts = {};
    this.speciesCounts = {};
    for (const u of this.units) {
      if (u.dead) continue;
      this.speciesCounts[u.species] = (this.speciesCounts[u.species] || 0) + 1;
      this.grids.get(u.side)[this.cellRow(u.y) * this.cols + this.cellCol(u.x)].push(u);
      this.counts[u.side] = (this.counts[u.side] || 0) + 1;
    }
    this.enemyGrids.clear();
    for (const side of this.grids.keys()) {
      const others = [];
      for (const [s, cells] of this.grids) if (s !== side && this.counts[s]) others.push(cells);
      this.enemyGrids.set(side, others);
    }
  }

  computeCentroids() {
    const sum = new Map();
    for (const u of this.units) {
      if (u.dead) continue;
      let s = sum.get(u.side);
      if (!s) sum.set(u.side, (s = { x: 0, y: 0, n: 0 }));
      s.x += u.x;
      s.y += u.y;
      s.n++;
    }
    this.centroids.clear();
    for (const [side, s] of sum) this.centroids.set(side, { x: s.x / s.n, y: s.y / s.n });
  }

  findTarget(u) {
    const enemy = this.enemyGrids.get(u.side);
    if (!enemy || !enemy.length) return null;
    const sight = u.def.sight;
    const ccx = this.cellCol(u.x);
    const ccy = this.cellRow(u.y);
    const maxRing = Math.ceil(sight / CELL);
    let best = null;
    let bestD2 = sight * sight;
    for (let r = 0; r <= maxRing; r++) {
      const x0 = ccx - r;
      const x1 = ccx + r;
      const y0 = ccy - r;
      const y1 = ccy + r;
      for (let cy = y0; cy <= y1; cy++) {
        if (cy < 0 || cy >= this.rows) continue;
        const edgeRow = cy === y0 || cy === y1;
        const step = edgeRow ? 1 : (x1 - x0) || 1;
        for (let cx = x0; cx <= x1; cx += step) {
          if (cx < 0 || cx >= this.cols) continue;
          for (let g = 0; g < enemy.length; g++) {
            const cell = enemy[g][cy * this.cols + cx];
            for (let i = 0; i < cell.length; i++) {
              const o = cell[i];
              if (o.dead) continue;
              const dx = o.x - u.x;
              const dy = o.y - u.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < bestD2) {
                bestD2 = d2;
                best = o;
              }
            }
          }
        }
      }
      if (best && bestD2 <= r * CELL * r * CELL) break;
    }
    return best;
  }

  nearestEnemy(u) {
    let best = null;
    let bestD2 = Infinity;
    for (const o of this.units) {
      if (o.side === u.side || o.dead) continue;
      const dx = o.x - u.x;
      const dy = o.y - u.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = o;
      }
    }
    return best;
  }

  // Nothing in sight: head for the middle of the nearest other side, then
  // for a specific straggler once close to it.
  marchPoint(u) {
    let best = null;
    let bestD2 = Infinity;
    for (const [side, c] of this.centroids) {
      if (side === u.side) continue;
      const dx = c.x - u.x;
      const dy = c.y - u.y;
      const d2 = dx * dx + dy * dy;
      if (d2 < bestD2) {
        bestD2 = d2;
        best = c;
      }
    }
    if (!best) return null;
    if (bestD2 > 70 * 70) return best;
    if (!u.marchTarget || u.marchTarget.dead) u.marchTarget = this.nearestEnemy(u);
    return u.marchTarget;
  }

  // Where the rifle swings from, in the world.
  rifleOrigin(u) {
    const d = u.def;
    if (d.prone && u.prone >= 0.5) return { x: u.x, y: u.y + d.prone.cy };
    return { x: u.x + u.facing * d.pivot.x, y: u.y + d.pivot.y };
  }

  muzzleOf(u) {
    const d = u.def;
    const cos = Math.cos(u.aim);
    const sin = Math.sin(u.aim);
    if (d.prone && u.prone >= 0.5) {
      const { cy, mx, my } = d.prone;
      return { x: u.x + u.facing * (mx * cos - my * sin), y: u.y + cy + mx * sin + my * cos };
    }
    return {
      x: u.x + u.facing * (d.pivot.x + cos * d.muzzleLen),
      y: u.y + d.pivot.y + sin * d.muzzleLen,
    };
  }

  // Damage with a spark burst; kills leave a ghost (and the caller's
  // onDeath drops the helmet / hat).
  hurt(u, dmg, x, y) {
    if (u.dead) return;
    u.hp -= dmg;
    u.hit = 0.12;
    for (let i = 0; i < 3; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 70;
      this.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.25 + Math.random() * 0.15, max: 0.4 });
    }
    if (u.hp <= 0) {
      u.dead = true;
      this.anyDead = true;
      this.ghosts.push({ x: u.x, y: u.y, age: 0, seed: Math.random(), species: u.species });
      if (this.onDeath) this.onDeath(u);
    }
  }

  fire(u, t) {
    const d = u.def;
    const m = this.muzzleOf(u);
    const a = Math.atan2(t.y - m.y, t.x - m.x) + (Math.random() - 0.5) * 2 * d.spread;
    this.bullets.push({
      x: m.x,
      y: m.y,
      vx: Math.cos(a) * d.bulletSpeed,
      vy: Math.sin(a) * d.bulletSpeed,
      side: u.side,
      damage: d.damage,
      dist: 0,
      dead: false,
    });
    u.flash = 0.07;
  }

  // A sniper round is a ray: it hits everything along the line, up to
  // `pierce` enemies, and leaves a long streak, smoke and a shell casing.
  fireSniper(u, t, hip) {
    const d = u.def;
    const m = this.muzzleOf(u);
    const ang = Math.atan2(t.y - m.y, t.x - m.x) + (Math.random() - 0.5) * 2 * (hip ? 0.05 : d.spread);
    const end = this.hitscan(u.side, m.x, m.y, ang, d.range * 1.3, hip ? d.hipDamage : d.damage, hip ? 1 : d.pierce);
    this.streaks.push({ x0: m.x, y0: m.y, x1: end.x, y1: end.y, age: 0, life: hip ? 0.18 : 0.45 });
    for (let i = 0; i < 4; i++) {
      this.puffs.push({
        x: m.x,
        y: m.y,
        vx: Math.cos(ang) * (20 + Math.random() * 30) + (Math.random() - 0.5) * 20,
        vy: Math.sin(ang) * (20 + Math.random() * 30) - 8 - Math.random() * 14,
        age: 0,
        life: 0.9 + Math.random() * 0.5,
        size: 5 + Math.random() * 4,
      });
    }
    const o = this.rifleOrigin(u);
    this.casings.push({
      x: o.x,
      y: o.y - 3,
      vx: -u.facing * (20 + Math.random() * 30),
      vy: -40 - Math.random() * 30,
      rot: Math.random() * 3,
      spin: (Math.random() - 0.5) * 20,
      age: 0,
      life: 1.1,
    });
    u.flash = 0.12;
    u.recoil = 1;
  }

  hitscan(side, ox, oy, ang, range, damage, pierce) {
    const c = Math.cos(ang);
    const s = Math.sin(ang);
    let end = { x: ox + c * range, y: oy + s * range };
    const enemy = this.enemyGrids.get(side);
    if (!enemy || !enemy.length) return end;
    const hits = [];
    const seen = new Set();
    let px = ox;
    let py = oy;
    for (let dist = 14; dist <= range; dist += 14) {
      const x = ox + c * dist;
      const y = oy + s * dist;
      if (x < 0 || x > this.w || y < 0 || y > this.h) {
        end = { x: clamp(x, 0, this.w), y: clamp(y, 0, this.h) };
        break;
      }
      const cx = this.cellCol(x);
      const cy = this.cellRow(y);
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        if (gy < 0 || gy >= this.rows) continue;
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          if (gx < 0 || gx >= this.cols) continue;
          for (let g = 0; g < enemy.length; g++) {
            const cell = enemy[g][gy * this.cols + gx];
            for (let i = 0; i < cell.length; i++) {
              const u = cell[i];
              if (u.dead || seen.has(u)) continue;
              const r = u.def.radius + 1;
              if (segDist2(px, py, x, y, u.x, u.y) <= r * r) {
                seen.add(u);
                hits.push({ u, dist, x: u.x, y: u.y });
              }
            }
          }
        }
      }
      px = x;
      py = y;
      if (hits.length >= pierce) break;
    }
    hits.sort((a, b) => a.dist - b.dist);
    const n = Math.min(pierce, hits.length);
    for (let i = 0; i < n; i++) {
      this.hurt(hits[i].u, i === 0 ? damage : damage * 0.6, hits[i].x, hits[i].y);
    }
    if (hits.length >= pierce) end = { x: ox + c * hits[pierce - 1].dist, y: oy + s * hits[pierce - 1].dist };
    return end;
  }

  stepUnit(u, dt) {
    u.flash = Math.max(0, u.flash - dt);
    u.hit = Math.max(0, u.hit - dt);
    u.recoil = Math.max(0, u.recoil - dt * 5);
    u.moving = false;
    u.breath += dt;
    if (!this.live) {
      this.idleStep(u, dt);
      return;
    }
    if (u.species === 'sniper') this.stepSniper(u, dt);
    else this.stepSoldier(u, dt);
  }

  stepSoldier(u, dt) {
    const d = u.def;
    u.retargetT -= dt;
    if (u.retargetT <= 0) {
      u.retargetT = 0.25 + Math.random() * 0.2;
      u.target = this.findTarget(u);
    }
    if (u.target && u.target.dead) u.target = null;
    const t = u.target;
    const speed = d.speed * u.speedMul;

    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      const aimTo = Math.atan2(t.y - (u.y + d.pivot.y), (t.x - (u.x + u.facing * d.pivot.x)) * u.facing);
      u.aim += (clamp(aimTo, -1.25, 1.25) - u.aim) * Math.min(1, dt * 14);
      if (dist > d.holdDist) {
        const s = speed * (u.burstLeft > 0 ? 0.55 : 1);
        u.x += (dx / dist) * s * dt;
        u.y += (dy / dist) * s * dt;
        u.moving = true;
      }
      if (u.burstLeft > 0) {
        u.burstT -= dt;
        if (u.burstT <= 0) {
          this.fire(u, t);
          u.burstLeft--;
          u.burstT = d.burstGap;
          if (u.burstLeft === 0) {
            u.cdT = d.cooldownMin + Math.random() * (d.cooldownMax - d.cooldownMin);
          }
        }
      } else {
        u.cdT -= dt;
        if (u.cdT <= 0 && dist <= d.range) {
          u.burstLeft = d.burst;
          u.burstT = 0.08;
        }
      }
    } else {
      u.burstLeft = 0;
      u.aim -= u.aim * Math.min(1, dt * 6);
      this.marchStep(u, dt, speed * 0.85);
    }
    if (u.moving) u.anim += dt * 9;
    if (u.target || u.moving) u.pose = Math.min(1, u.pose + dt * 6);
    else this.idleStep(u, dt);
  }

  marchStep(u, dt, speed) {
    const m = this.marchPoint(u);
    if (!m) return;
    const dx = m.x - u.x;
    const dy = m.y - u.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
    u.x += (dx / dist) * speed * dt;
    u.y += (dy / dist) * speed * dt;
    u.moving = true;
  }

  stepSniper(u, dt) {
    const d = u.def;
    u.retargetT -= dt;
    if (u.retargetT <= 0) {
      u.retargetT = 0.25 + Math.random() * 0.2;
      u.target = this.findTarget(u);
    }
    if (u.target && u.target.dead) u.target = null;
    const t = u.target;
    const speed = d.speed * u.speedMul;
    let wantProne = false;
    let hip = false;

    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      const o = this.rifleOrigin(u);
      const aimTo = Math.atan2(t.y - o.y, (t.x - o.x) * u.facing);
      u.aim += (clamp(aimTo, -1.25, 1.25) - u.aim) * Math.min(1, dt * 14);
      if (dist <= d.range) {
        if (dist < d.closeDist) hip = true;
        else wantProne = true;
      } else if (u.prone <= 0.02) {
        u.x += (dx / dist) * speed * dt;
        u.y += (dy / dist) * speed * dt;
        u.moving = true;
      }
    } else {
      u.aim -= u.aim * Math.min(1, dt * 6);
      if (u.prone <= 0.02) this.marchStep(u, dt, speed * 0.85);
    }

    if (wantProne) u.prone = Math.min(1, u.prone + dt / d.dropTime);
    else u.prone = Math.max(0, u.prone - dt / d.riseTime);

    // Lying down: wait out the cooldown, light the target up with the
    // laser, then take the shot.
    if (wantProne && u.prone >= 1) {
      if (u.cdT > 0) {
        u.cdT -= dt;
        u.laser = false;
        u.aimT = 0;
      } else {
        u.laser = true;
        u.aimT += dt;
        if (u.aimT >= d.aimTime) {
          this.fireSniper(u, t, false);
          u.aimT = 0;
          u.cdT = d.cooldownMin + Math.random() * (d.cooldownMax - d.cooldownMin);
          u.laser = false;
        }
      }
    } else {
      u.laser = false;
      u.aimT = 0;
      if (hip && u.prone <= 0.02) {
        u.cdT -= dt;
        if (u.cdT <= 0) {
          this.fireSniper(u, t, true);
          u.cdT = d.hipCooldown * (0.8 + Math.random() * 0.4);
        }
      }
    }

    if (u.moving) u.anim += dt * 9;
    if (t || u.moving || u.prone > 0) u.pose = Math.min(1, u.pose + dt * 6);
    else this.idleStep(u, dt);
  }

  // Standing around. A soldier lowers readiness and lets the eyes wander;
  // the sniper runs his own routine (see SNIPER_IDLES).
  idleStep(u, dt) {
    u.pose = Math.max(0, u.pose - dt * 5);
    if (u.species === 'sniper') {
      u.prone = Math.max(0, u.prone - dt / u.def.riseTime);
      u.laser = false;
      u.aimT = 0;
      u.idleT += dt;
      if (u.idleT >= u.idleDur) {
        const next = pickSniperIdle(u.idleKind);
        u.idleKind = next.kind;
        u.idleDur = next.dur;
        u.idleT = 0;
      }
      return;
    }
    u.gazeT -= dt;
    if (u.gazeT <= 0) {
      u.gaze = pickGaze();
      u.gazeT = 0.8 + Math.random() * 1.8;
    }
  }

  // Soft collisions use their own finer, flat grid (cells just wider than
  // the push distance): dense crowds put hundreds of soldiers in one big
  // targeting cell, but only a handful within reach of each other.
  separate() {
    const units = this.units;
    const cols = this.sepCols;
    const rows = this.sepRows;
    if (this.sepHead.length !== cols * rows) this.sepHead = new Int32Array(cols * rows);
    if (this.sepNext.length < units.length) this.sepNext = new Int32Array(units.length * 2);
    const head = this.sepHead;
    const next = this.sepNext;
    head.fill(-1);
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u.dead) continue;
      let c = (u.x / SEP_CELL) | 0;
      let r = (u.y / SEP_CELL) | 0;
      c = c < 0 ? 0 : c >= cols ? cols - 1 : c;
      r = r < 0 ? 0 : r >= rows ? rows - 1 : r;
      next[i] = head[r * cols + c];
      head[r * cols + c] = i;
    }
    for (let i = 0; i < units.length; i++) {
      const u = units[i];
      if (u.dead) continue;
      let cx = (u.x / SEP_CELL) | 0;
      let cy = (u.y / SEP_CELL) | 0;
      cx = cx < 0 ? 0 : cx >= cols ? cols - 1 : cx;
      cy = cy < 0 ? 0 : cy >= rows ? rows - 1 : cy;
      for (let gy = cy - 1; gy <= cy + 1; gy++) {
        if (gy < 0 || gy >= rows) continue;
        for (let gx = cx - 1; gx <= cx + 1; gx++) {
          if (gx < 0 || gx >= cols) continue;
          for (let j = head[gy * cols + gx]; j !== -1; j = next[j]) {
            if (j <= i) continue;
            const o = units[j];
            const sep = (u.def.sep + o.def.sep) / 2;
            let dx = o.x - u.x;
            let dy = o.y - u.y;
            let d2 = dx * dx + dy * dy;
            if (d2 >= sep * sep) continue;
            if (d2 < 0.0001) {
              dx = Math.random() - 0.5;
              dy = Math.random() - 0.5;
              d2 = dx * dx + dy * dy;
            }
            const d = Math.sqrt(d2);
            const push = (sep - d) * 0.3;
            const nx = dx / d;
            const ny = dy / d;
            u.x -= nx * push;
            u.y -= ny * push;
            o.x += nx * push;
            o.y += ny * push;
          }
        }
      }
    }
    const maxX = this.w - 14;
    const maxY = this.h - 24;
    for (const u of units) {
      if (u.x < 14) u.x = 14;
      else if (u.x > maxX) u.x = maxX;
      if (u.y < 24) u.y = 24;
      else if (u.y > maxY) u.y = maxY;
    }
  }

  stepBullets(dt) {
    let anyGone = false;
    for (const b of this.bullets) {
      const px = b.x;
      const py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.dist += Math.hypot(b.vx, b.vy) * dt;
      if (b.dist > 380 || b.x < 0 || b.x > this.w || b.y < 0 || b.y > this.h) {
        b.dead = true;
        anyGone = true;
        continue;
      }
      const enemy = this.enemyGrids.get(b.side);
      if (!enemy || !enemy.length) continue;
      const cx = this.cellCol(b.x);
      const cy = this.cellRow(b.y);
      let hit = null;
      for (let gy = cy - 1; gy <= cy + 1 && !hit; gy++) {
        if (gy < 0 || gy >= this.rows) continue;
        for (let gx = cx - 1; gx <= cx + 1 && !hit; gx++) {
          if (gx < 0 || gx >= this.cols) continue;
          for (let g = 0; g < enemy.length && !hit; g++) {
            const cell = enemy[g][gy * this.cols + gx];
            for (let i = 0; i < cell.length; i++) {
              const u = cell[i];
              if (u.dead) continue;
              const r = u.def.radius + 1;
              if (segDist2(px, py, b.x, b.y, u.x, u.y) <= r * r) {
                hit = u;
                break;
              }
            }
          }
        }
      }
      if (hit) {
        b.dead = true;
        anyGone = true;
        this.hurt(hit, b.damage, b.x, b.y);
      }
    }
    if (anyGone) this.bullets = this.bullets.filter((b) => !b.dead);
  }

  stepEffects(dt) {
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
    }
    if (this.sparks.some((s) => s.life <= 0)) this.sparks = this.sparks.filter((s) => s.life > 0);

    for (const g of this.ghosts) g.age += dt;
    if (this.ghosts.some((g) => g.age > GHOST_LIFE)) this.ghosts = this.ghosts.filter((g) => g.age <= GHOST_LIFE);

    for (const s of this.streaks) s.age += dt;
    if (this.streaks.some((s) => s.age > s.life)) this.streaks = this.streaks.filter((s) => s.age <= s.life);

    for (const p of this.puffs) {
      p.age += dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.97;
      p.vy *= 0.97;
    }
    if (this.puffs.some((p) => p.age > p.life)) this.puffs = this.puffs.filter((p) => p.age <= p.life);

    for (const c of this.casings) {
      c.age += dt;
      c.x += c.vx * dt;
      c.y += c.vy * dt;
      c.vy += 260 * dt;
      c.rot += c.spin * dt;
    }
    if (this.casings.some((c) => c.age > c.life)) this.casings = this.casings.filter((c) => c.age <= c.life);
  }

  // The eraser: removes units under the brush with no ghost or helmet.
  eraseAt(x, y, r) {
    const r2 = r * r;
    let any = false;
    for (const u of this.units) {
      const dx = u.x - x;
      const dy = u.y - y;
      if (dx * dx + dy * dy <= r2) {
        u.dead = true;
        any = true;
      }
    }
    if (!any) return;
    this.units = this.units.filter((u) => !u.dead);
    this.rebuild();
  }

  update(dt) {
    this.rebuild();
    this.centroidT -= dt;
    if (this.centroidT <= 0) {
      this.centroidT = 0.5;
      this.computeCentroids();
    }
    for (const u of this.units) {
      if (!u.dead) this.stepUnit(u, dt);
    }
    this.separate();
    this.stepBullets(dt);
    this.stepEffects(dt);
    if (this.anyDead) {
      this.units = this.units.filter((u) => !u.dead);
      this.anyDead = false;
    }
  }
}
