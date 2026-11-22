import { SOLDIER, OTHER } from './config.js';


export const CELL = 32;
const SEP_CELL = 16;
const SEP_DIST = SOLDIER.radius * 2;
const HIT_R2 = (SOLDIER.radius + 1) * (SOLDIER.radius + 1);

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

// Unit positions are the soldier's body centre; sprites are drawn with
// their feet 14px below it.
export class World {
  constructor() {
    this.units = [];
    this.bullets = [];
    this.sparks = [];
    this.mode = 'free'; // 'free': units are live on spawn. 'team': idle until started.
    this.started = false;
    this.counts = { red: 0, blue: 0 };
    this.centroids = { red: null, blue: null };
    this.centroidT = 0;
    this.anyDead = false;
    this.nextId = 1;
    this.onDeath = null;
    this.resize(800, 600);
  }

  resize(w, h) {
    this.w = w;
    this.h = h;
    this.cols = Math.ceil(w / CELL) + 1;
    this.rows = Math.ceil(h / CELL) + 1;
    const make = () => Array.from({ length: this.cols * this.rows }, () => []);
    this.grids = { red: make(), blue: make() };
    this.sepCols = Math.ceil(w / SEP_CELL) + 1;
    this.sepRows = Math.ceil(h / SEP_CELL) + 1;
    this.sepHead = new Int32Array(this.sepCols * this.sepRows);
    this.sepNext = new Int32Array(0);
  }

  get live() {
    return this.mode === 'free' || this.started;
  }

  addSoldier(team, x, y) {
    this.units.push({
      id: this.nextId++,
      team,
      x,
      y,
      hp: SOLDIER.hp,
      facing: team === 'red' ? 1 : -1,
      speedMul: 0.9 + Math.random() * 0.2,
      target: null,
      marchTarget: null,
      retargetT: Math.random() * 0.3,
      burstLeft: 0,
      burstT: 0,
      cdT: Math.random() * 1.2,
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
    this.started = false;
    this.counts.red = 0;
    this.counts.blue = 0;
    this.centroids.red = null;
    this.centroids.blue = null;
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
    for (const team of ['red', 'blue']) {
      const cells = this.grids[team];
      for (let i = 0; i < cells.length; i++) cells[i].length = 0;
      this.counts[team] = 0;
    }
    for (const u of this.units) {
      if (u.dead) continue;
      this.grids[u.team][this.cellRow(u.y) * this.cols + this.cellCol(u.x)].push(u);
      this.counts[u.team]++;
    }
  }

  computeCentroids() {
    const sum = { red: { x: 0, y: 0, n: 0 }, blue: { x: 0, y: 0, n: 0 } };
    for (const u of this.units) {
      if (u.dead) continue;
      const s = sum[u.team];
      s.x += u.x;
      s.y += u.y;
      s.n++;
    }
    for (const team of ['red', 'blue']) {
      const s = sum[team];
      this.centroids[team] = s.n ? { x: s.x / s.n, y: s.y / s.n } : null;
    }
  }

  findTarget(u) {
    const ccx = this.cellCol(u.x);
    const ccy = this.cellRow(u.y);
    const maxRing = Math.ceil(SOLDIER.sight / CELL);
    const enemyCells = this.grids[OTHER[u.team]];
    let best = null;
    let bestD2 = SOLDIER.sight * SOLDIER.sight;
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
          const cell = enemyCells[cy * this.cols + cx];
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
      if (best && bestD2 <= r * CELL * r * CELL) break;
    }
    return best;
  }

  nearestEnemy(u) {
    let best = null;
    let bestD2 = Infinity;
    for (const o of this.units) {
      if (o.team === u.team || o.dead) continue;
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

  // Nothing in sight: head for the enemy army's middle, then for a
  // specific straggler once close to it.
  marchPoint(u) {
    const c = this.centroids[OTHER[u.team]];
    if (!c) return null;
    const dx = c.x - u.x;
    const dy = c.y - u.y;
    if (dx * dx + dy * dy > 70 * 70) return c;
    if (!u.marchTarget || u.marchTarget.dead) u.marchTarget = this.nearestEnemy(u);
    return u.marchTarget;
  }

  fire(u, t) {
    const mx = u.x + u.facing * 16;
    const my = u.y - 6;
    const a = Math.atan2(t.y - my, t.x - mx) + (Math.random() - 0.5) * 2 * SOLDIER.spread;
    this.bullets.push({
      x: mx,
      y: my,
      vx: Math.cos(a) * SOLDIER.bulletSpeed,
      vy: Math.sin(a) * SOLDIER.bulletSpeed,
      team: u.team,
      dist: 0,
      dead: false,
    });
    u.flash = 0.07;
  }

  stepUnit(u, dt) {
    u.flash = Math.max(0, u.flash - dt);
    u.hit = Math.max(0, u.hit - dt);
    u.moving = false;
    if (!this.live) return;

    u.retargetT -= dt;
    if (u.retargetT <= 0) {
      u.retargetT = 0.25 + Math.random() * 0.2;
      u.target = this.findTarget(u);
    }
    if (u.target && u.target.dead) u.target = null;
    const t = u.target;
    const speed = SOLDIER.speed * u.speedMul;

    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const d = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      if (d > SOLDIER.holdDist) {
        const s = speed * (u.burstLeft > 0 ? 0.55 : 1);
        u.x += (dx / d) * s * dt;
        u.y += (dy / d) * s * dt;
        u.moving = true;
      }
      if (u.burstLeft > 0) {
        u.burstT -= dt;
        if (u.burstT <= 0) {
          this.fire(u, t);
          u.burstLeft--;
          u.burstT = SOLDIER.burstGap;
          if (u.burstLeft === 0) {
            u.cdT = SOLDIER.cooldownMin + Math.random() * (SOLDIER.cooldownMax - SOLDIER.cooldownMin);
          }
        }
      } else {
        u.cdT -= dt;
        if (u.cdT <= 0 && d <= SOLDIER.range) {
          u.burstLeft = SOLDIER.burst;
          u.burstT = 0.08;
        }
      }
    } else {
      u.burstLeft = 0;
      const m = this.marchPoint(u);
      if (m) {
        const dx = m.x - u.x;
        const dy = m.y - u.y;
        const d = Math.hypot(dx, dy) || 1;
        if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
        const s = speed * 0.85;
        u.x += (dx / d) * s * dt;
        u.y += (dy / d) * s * dt;
        u.moving = true;
      }
    }
    if (u.moving) u.anim += dt * 9;
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
    const minD2 = SEP_DIST * SEP_DIST;
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
            let dx = o.x - u.x;
            let dy = o.y - u.y;
            let d2 = dx * dx + dy * dy;
            if (d2 >= minD2) continue;
            if (d2 < 0.0001) {
              dx = Math.random() - 0.5;
              dy = Math.random() - 0.5;
              d2 = dx * dx + dy * dy;
            }
            const d = Math.sqrt(d2);
            const push = (SEP_DIST - d) * 0.3;
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
    const maxX = this.w - 10;
    const maxY = this.h - 20;
    for (const u of units) {
      if (u.x < 10) u.x = 10;
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
      b.dist += SOLDIER.bulletSpeed * dt;
      if (b.dist > SOLDIER.bulletRange || b.x < 0 || b.x > this.w || b.y < 0 || b.y > this.h) {
        b.dead = true;
        anyGone = true;
        continue;
      }
      const cx = this.cellCol(b.x);
      const cy = this.cellRow(b.y);
      const enemyCells = this.grids[OTHER[b.team]];
      let hit = null;
      for (let gy = cy - 1; gy <= cy + 1 && !hit; gy++) {
        if (gy < 0 || gy >= this.rows) continue;
        for (let gx = cx - 1; gx <= cx + 1 && !hit; gx++) {
          if (gx < 0 || gx >= this.cols) continue;
          const cell = enemyCells[gy * this.cols + gx];
          for (let i = 0; i < cell.length; i++) {
            const u = cell[i];
            if (u.dead) continue;
            if (segDist2(px, py, b.x, b.y, u.x, u.y) <= HIT_R2) {
              hit = u;
              break;
            }
          }
        }
      }
      if (hit) {
        b.dead = true;
        anyGone = true;
        hit.hp -= SOLDIER.damage;
        hit.hit = 0.12;
        for (let i = 0; i < 3; i++) {
          const a = Math.random() * Math.PI * 2;
          const sp = 40 + Math.random() * 70;
          this.sparks.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.25 + Math.random() * 0.15, max: 0.4 });
        }
        if (hit.hp <= 0 && !hit.dead) {
          hit.dead = true;
          this.anyDead = true;
          if (this.onDeath) this.onDeath(hit);
        }
      }
    }
    if (anyGone) this.bullets = this.bullets.filter((b) => !b.dead);
  }

  stepSparks(dt) {
    let gone = false;
    for (const s of this.sparks) {
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      if (s.life <= 0) gone = true;
    }
    if (gone) this.sparks = this.sparks.filter((s) => s.life > 0);
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
    this.stepSparks(dt);
    if (this.anyDead) {
      this.units = this.units.filter((u) => !u.dead);
      this.anyDead = false;
    }
  }
}
