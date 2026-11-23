import { SPECIES, GAZE_WEIGHTS, TAU } from './config.js?v=41';

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
    this.flames = []; // flamethrower stream
    this.bombs = []; // grenades in the air
    this.arrows = []; // arrows in the air
    this.blasts = []; // explosions
    this.debris = []; // headgear thrown by blasts
    this.groups = []; // Roman blocks marching in formation
    this.corpses = []; // units knocked over, seeing stars, before the ghost takes over
    this.onArrowLand = null;
    this.time = 0; // seconds since the battle started
    this.stats = null; // team battle record, see beginBattle()
    this.onDebrisLand = null;
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

  // Arranges freshly painted units into a rectangular block: they glide into
  // a tidy grid (cells sx by sy, rows running along `ang`) and later march
  // together until the enemy gets close, then break off to fight.
  formRectangle(list, ang, sx, sy) {
    const units = list.filter((u) => !u.dead && !u.form);
    const n = units.length;
    if (n < 2) return;
    let cx = 0;
    let cy = 0;
    for (const u of units) {
      cx += u.x;
      cy += u.y;
    }
    cx /= n;
    cy /= n;
    let sxx = 0;
    let syy = 0;
    let sxy = 0;
    for (const u of units) {
      sxx += (u.x - cx) ** 2;
      syy += (u.y - cy) ** 2;
      sxy += (u.x - cx) * (u.y - cy);
    }
    const mid = (sxx + syy) / 2;
    const dev = Math.sqrt(((sxx - syy) / 2) ** 2 + sxy * sxy);
    const elong = Math.sqrt((mid + dev) / Math.max(mid - dev, 1e-6));
    ang = elong > 1.7 ? 0.5 * Math.atan2(2 * sxy, sxx - syy) : 0;
    const ux = Math.cos(ang);
    const uy = Math.sin(ang);
    let minA = Infinity;
    let maxA = -Infinity;
    let minB = Infinity;
    let maxB = -Infinity;
    for (const u of units) {
      const a = (u.x - cx) * ux + (u.y - cy) * uy;
      const b = -(u.x - cx) * uy + (u.y - cy) * ux;
      minA = Math.min(minA, a);
      maxA = Math.max(maxA, a);
      minB = Math.min(minB, b);
      maxB = Math.max(maxB, b);
    }
    const aspect = clamp((maxA - minA + sx) / (maxB - minB + sy), 0.5, 8);
    const cols = Math.max(1, Math.round(Math.sqrt(n * aspect * (sy / sx))));
    const rows = Math.ceil(n / cols);
    // slots in reading order, the last row possibly short
    const slots = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols && slots.length < n; c++) {
        slots.push({ lx: (c - (cols - 1) / 2) * sx, ly: (r - (rows - 1) / 2) * sy });
      }
    }
    // Fill the ranks so nobody has far to walk: order the Romans across the block,
    // cut that into rows of `cols`, and order each row along the block.
    const proj = (u) => ({
      a: (u.x - cx) * ux + (u.y - cy) * uy,
      b: -(u.x - cx) * uy + (u.y - cy) * ux,
    });
    const keyed = units.map((u) => ({ u, ...proj(u) }));
    keyed.sort((p, q) => p.b - q.b);
    const ordered = [];
    for (let r = 0; r < rows; r++) {
      const row = keyed.slice(r * cols, (r + 1) * cols);
      row.sort((p, q) => p.a - q.a);
      for (const k of row) ordered.push(k.u);
    }
    units.length = 0;
    units.push(...ordered);
    slots.sort((p, q) => (p.ly !== q.ly ? p.ly - q.ly : p.lx - q.lx));
    // the block must sit inside the field (and on its own team's half)
    const half = this.w / 2;
    let ax = cx;
    let ay = cy;
    const reach = Math.hypot((cols * sx) / 2, (rows * sy) / 2);
    ax = clamp(ax, 14 + reach * 0.7, this.w - 14 - reach * 0.7);
    ay = clamp(ay, 24 + reach * 0.7, this.h - 24 - reach * 0.7);
    const team = units[0].team;
    if (team === 'red') ax = Math.min(ax, half - 10 - reach * 0.7);
    if (team === 'blue') ax = Math.max(ax, half + 10 + reach * 0.7);
    const g = { ax, ay, ux, uy, ang, members: units, engaged: false, anchor: { x: ax, y: ay, side: units[0].side, marchTarget: null } };
    units.forEach((u, i) => {
      // a quick snap into place (about half a second), eased out
      u.form = { g, lx: slots[i].lx, ly: slots[i].ly, snap: { t: 0, x: u.x, y: u.y } };
    });
    this.groups.push(g);
  }

  formSlot(u) {
    const { g, lx, ly } = u.form;
    return { x: g.ax + lx * g.ux - ly * g.uy, y: g.ay + lx * g.uy + ly * g.ux };
  }

  // Glide toward the slot. True while the unit is still holding formation.
  formStep(u, dt) {
    const f = u.form;
    if (!f) return false;
    if (f.g.engaged) {
      u.form = null;
      return false;
    }
    const s = this.formSlot(u);
    if (f.snap) {
      // walking into the ranks at a steady walk (the video takes about two seconds
      // to turn a painted blob into a grid), easing off as each Roman arrives
      const dx = s.x - u.x;
      const dy = s.y - u.y;
      const d = Math.hypot(dx, dy);
      if (d <= 0.8) {
        f.snap = null;
        return true;
      }
      const sp = Math.min(40, 6 + d * 1.9);
      const m = Math.min(d, sp * dt);
      u.x += (dx / d) * m;
      u.y += (dy / d) * m;
      if (Math.abs(dx) > 0.3) u.facing = dx > 0 ? 1 : -1;
      u.moving = d > 1.4;
      return true;
    }
    const dx = s.x - u.x;
    const dy = s.y - u.y;
    const d = Math.hypot(dx, dy);
    if (d > 0.6) {
      // the ranks follow their places with a little lag, so a turning block flexes
      const m = Math.min(d, u.def.speed * 1.5 * dt);
      u.x += (dx / d) * m;
      u.y += (dy / d) * m;
      u.moving = true;
    }
    return true;
  }

  // Each block marches on the nearest enemy and dissolves when one gets close.
  // A Roman block keeps its rectangle: it turns (slowly) so one side squares up
  // to the enemy, marches on it as a single body, and its soldiers jab from
  // their places. Only a soldier with an enemy right up against him leaves the
  // ranks to fight.
  stepGroups(dt) {
    let any = false;
    for (const g of this.groups) {
      g.members = g.members.filter((m) => !m.dead && m.form && m.form.g === g);
      if (!g.members.length) {
        g.dead = true;
        any = true;
        continue;
      }
      if (!this.live) continue;
      for (const m of g.members) {
        const t = m.target;
        // an enemy within ~45 units and a Roman stops holding his place (the
        // video's blocks start to come apart about a body-length before contact)
        if (t && !t.dead && Math.hypot(t.x - m.x, t.y - m.y) < 45) {
          m.form = null;
          if (g.dissolveT === undefined) g.dissolveT = 0.9;
        }
      }
      if (g.dissolveT !== undefined) {
        g.dissolveT -= dt;
        if (g.dissolveT <= 0) for (const m of g.members) m.form = null;
      }
      g.members = g.members.filter((m) => m.form);
      if (!g.members.length) {
        g.dead = true;
        any = true;
        continue;
      }
      g.anchor.x = g.ax;
      g.anchor.y = g.ay;
      const mp = this.marchPoint(g.anchor);
      if (mp) {
        const dx = mp.x - g.ax;
        const dy = mp.y - g.ay;
        const d = Math.hypot(dx, dy) || 1;
        // turn the nearest of the block's four sides toward the enemy
        const phi = Math.atan2(dy, dx);
        let best = Infinity;
        for (let k = 0; k < 4; k++) {
          let diff = phi - (g.ang + (k * Math.PI) / 2);
          while (diff > Math.PI) diff -= TAU;
          while (diff < -Math.PI) diff += TAU;
          if (Math.abs(diff) < Math.abs(best)) best = diff;
        }
        g.ang += clamp(best, -0.35 * dt, 0.35 * dt);
        g.ux = Math.cos(g.ang);
        g.uy = Math.sin(g.ang);
        // a slow, steady march (about 25 units a second) that quickens to a run
        // of ~44 once the enemy is within ~100 units
        const near = this.nearestEnemy(g.anchor);
        const nd = near ? Math.hypot(near.x - g.ax, near.y - g.ay) : Infinity;
        const sp = 25 + 19 * clamp((170 - nd) / 70, 0, 1);
        g.ax += (dx / d) * sp * dt;
        g.ay += (dy / d) * sp * dt;
        for (const m of g.members) if (Math.abs(dx) > 4) m.facing = dx > 0 ? 1 : -1;
      }
    }
    if (any) this.groups = this.groups.filter((g) => !g.dead);
  }

  // Team battle: remember who is on the field, then time the fight.
  beginBattle() {
    const initial = { red: {}, blue: {} };
    for (const u of this.units) {
      if (u.dead || !u.team) continue;
      initial[u.team][u.species] = (initial[u.team][u.species] || 0) + 1;
    }
    this.time = 0;
    this.stats = {
      initial,
      deaths: [],
      samples: [[0, this.countTeam('red'), this.countTeam('blue')]],
      sampleT: 0.25,
      duration: 0,
      final: null,
    };
  }

  countTeam(team) {
    let n = 0;
    for (const u of this.units) if (!u.dead && u.team === team) n++;
    return n;
  }

  endBattle() {
    const st = this.stats;
    if (!st || st.final) return;
    st.duration = this.time;
    st.samples.push([this.time, this.countTeam('red'), this.countTeam('blue')]);
    const final = { red: {}, blue: {} };
    for (const u of this.units) {
      if (u.dead || !u.team) continue;
      final[u.team][u.species] = (final[u.team][u.species] || 0) + 1;
    }
    st.final = final;
  }

  get live() {
    return this.mode === 'free' || this.started;
  }

  // `team` is only meaningful in team battle (null in free-for-all).
  addUnit(species, team, x, y) {
    const def = SPECIES[species].def;
    const side = this.mode === 'team' ? team : def.faction || species;
    if (!this.grids.has(side)) this.grids.set(side, this.makeCells());
    const u = {
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
      form: null, // formation slot, see formRectangle()
      firing: false, // flamethrower: spraying
      burn: 0, // seconds left on fire
      burnTick: 0,
      kx: 0, // knockback velocity
      ky: 0,
      atk: 0, // melee swing / lance thrust, 1 -> 0
      atkHit: false,
      swing: 1,
      strafeDir: 1,
      drawT: 0, // archer: time spent drawing the bow
      reloadT: 0, // archer: the bow is empty until the next arrow is nocked
      aimHold: 0, // archer: how long the bow stays raised after a shot
      starT: Math.random() * 1.2, // ninja: time to the next throwing star
      throwT: 0, // grenadier: throwing animation
      charge: 0, // cavalry: how fast it is galloping
      retreatT: 0,
      dirx: 1,
      diry: 0,
    };
    this.units.push(u);
    return u;
  }

  clear() {
    this.stats = null;
    this.time = 0;
    this.units = [];
    this.bullets = [];
    this.sparks = [];
    this.ghosts = [];
    this.streaks = [];
    this.puffs = [];
    this.casings = [];
    this.flames = [];
    this.bombs = [];
    this.arrows = [];
    this.blasts = [];
    this.debris = [];
    this.corpses = [];
    this.groups = [];
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
  // onDeath drops the helmet / hat). `kind` is 'bullet' | 'arrow' | 'snipe'
  // | 'burn' | 'blast' (or nothing for melee); armour only stops the first two.
  hurt(u, dmg, x, y, kind, src) {
    if (u.dead) return;
    if (u.def.armor && (kind === 'bullet' || kind === 'arrow')) dmg *= u.def.armor;
    u.hp -= dmg;
    u.hit = 0.12;
    if (kind !== 'burn') {
      for (let i = 0; i < 3; i++) {
        const a = Math.random() * Math.PI * 2;
        const sp = 40 + Math.random() * 70;
        this.sparks.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0.25 + Math.random() * 0.15, max: 0.4 });
      }
    }
    if (u.hp <= 0) {
      u.dead = true;
      this.anyDead = true;
      if (this.stats && u.team && !u.def.becomes) {
        this.stats.deaths.push({
          t: this.time,
          team: u.team,
          species: u.species,
          killer: src ? src.species : null,
          killerTeam: src ? src.team : null,
        });
      }
      this.ghosts.push({ x: u.x, y: u.y, age: 0, seed: Math.random(), species: u.species });
      this.corpses.push({ u: { ...u, dead: false, moving: false, hit: 0, flash: 0 }, age: 0 });
      if (u.def.smoke) {
        for (let i = 0; i < 2; i++) {
          this.puffs.push({
            x: u.x + (Math.random() - 0.5) * 8,
            y: u.y + (Math.random() - 0.5) * 6,
            vx: (Math.random() - 0.5) * 24,
            vy: -8 - Math.random() * 14,
            age: 0,
            life: 1.1 + Math.random() * 0.6,
            size: 10 + Math.random() * 8,
            white: true,
          });
        }
      }
      if (u.def.becomes) {
        // the horse is gone; its rider gets up on foot
        const k = this.addUnit(u.def.becomes, u.team, u.x, u.y);
        k.facing = u.facing;
        k.pose = 1;
        k.cdT = 0.5;
      } else if (kind === 'blast') this.launchDrop(u);
      else if (this.onDeath) this.onDeath(u);
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
      owner: u,
      damage: d.damage,
      dist: 0,
      dead: false,
    });
    u.flash = 0.07;
    if (d.smoke) {
      u.recoil = 1;
      for (let i = 0; i < 3; i++) {
        this.puffs.push({
          x: m.x,
          y: m.y,
          vx: Math.cos(a) * (14 + Math.random() * 22) + (Math.random() - 0.5) * 14,
          vy: Math.sin(a) * (14 + Math.random() * 22) - 6 - Math.random() * 10,
          age: 0,
          life: 0.9 + Math.random() * 0.5,
          size: 4 + Math.random() * 4,
        });
      }
    }
  }

  // A sniper round is a ray: it hits everything along the line, up to
  // `pierce` enemies, and leaves a long streak, smoke and a shell casing.
  fireSniper(u, t, hip) {
    const d = u.def;
    const m = this.muzzleOf(u);
    const ang = Math.atan2(t.y - m.y, t.x - m.x) + (Math.random() - 0.5) * 2 * (hip ? 0.05 : d.spread);
    const end = this.hitscan(u.side, m.x, m.y, ang, d.range * 1.3, hip ? d.hipDamage : d.damage, hip ? 1 : d.pierce, u);
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

  hitscan(side, ox, oy, ang, range, damage, pierce, owner) {
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
      this.hurt(hits[i].u, i === 0 ? damage : damage * 0.6, hits[i].x, hits[i].y, 'snipe', owner);
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
    if (u.kx || u.ky) {
      u.x += u.kx * dt;
      u.y += u.ky * dt;
      const decay = Math.max(0, 1 - dt * 5);
      u.kx *= decay;
      u.ky *= decay;
      if (Math.abs(u.kx) + Math.abs(u.ky) < 4) u.kx = u.ky = 0;
    }
    if (u.burn > 0) {
      u.burn -= dt;
      u.burnTick -= dt;
      if (u.burnTick <= 0) {
        u.burnTick = 0.25;
        this.hurt(u, u.def.burnDps ? u.def.burnDps * 0.25 : 2.2, u.x, u.y, 'burn', u.burnSrc);
        if (u.dead) return;
      }
      if (Math.random() < 0.25) {
        this.flames.push({
          x: u.x + (Math.random() - 0.5) * 12,
          y: u.y - 4 - Math.random() * 12,
          vx: (Math.random() - 0.5) * 14,
          vy: -28 - Math.random() * 18,
          age: 0,
          life: 0.35 + Math.random() * 0.2,
          size: 3 + Math.random() * 2,
          dot: Math.random() < 0.4,
          small: true,
        });
      }
    }
    if (u.form && this.formStep(u, dt)) {
      if (this.live) {
        const t = this.acquire(u, dt);
        this.meleeTick(u, dt);
        let near = false;
        if (t) {
          const d = u.def;
          const dist = Math.hypot(t.x - u.x, t.y - u.y);
          near = dist < 70;
          this.aimAt(u, t, dt);
          if (dist <= d.reach + t.def.radius * 0.5 && u.cdT <= 0 && u.atk <= 0) {
            u.atk = 1;
            u.atkHit = true;
            u.cdT = d.cooldownMin + Math.random() * (d.cooldownMax - d.cooldownMin);
          }
        }
        // spears stay slanted over the shoulder until a fight is close
        u.pose = near ? Math.min(1, u.pose + dt * 6) : Math.max(0, u.pose - dt * 5);
        if (u.moving) u.anim += dt * 9;
      } else this.idleStep(u, dt);
      return;
    }
    if (!this.live) {
      this.idleStep(u, dt);
      return;
    }
    switch (u.def.kind) {
      case 'sniper': this.stepSniper(u, dt); break;
      case 'flame': this.stepFlame(u, dt); break;
      case 'melee': this.stepMelee(u, dt); break;
      case 'grenade': this.stepGrenade(u, dt); break;
      case 'archer': this.stepArcher(u, dt); break;
      case 'cavalry': this.stepCavalry(u, dt); break;
      default: this.stepSoldier(u, dt);
    }
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

  // The first (non-dead) enemy cells within r of a point, handed to fn.
  eachEnemyNear(side, x, y, r, fn) {
    const enemy = this.enemyGrids.get(side);
    if (!enemy || !enemy.length) return;
    const c0 = this.cellCol(x - r);
    const c1 = this.cellCol(x + r);
    const r0 = this.cellRow(y - r);
    const r1 = this.cellRow(y + r);
    for (let gy = r0; gy <= r1; gy++) {
      for (let gx = c0; gx <= c1; gx++) {
        for (let g = 0; g < enemy.length; g++) {
          const cell = enemy[g][gy * this.cols + gx];
          for (let i = 0; i < cell.length; i++) {
            if (!cell[i].dead) fn(cell[i]);
          }
        }
      }
    }
  }

  acquire(u, dt) {
    u.retargetT -= dt;
    if (u.retargetT <= 0) {
      u.retargetT = 0.25 + Math.random() * 0.2;
      u.target = this.findTarget(u);
    }
    if (u.target && u.target.dead) u.target = null;
    return u.target;
  }

  // Aims the held weapon at the target (angle in the unit's mirrored space).
  aimAt(u, t, dt) {
    const d = u.def;
    const aimTo = Math.atan2(t.y - (u.y + d.pivot.y), (t.x - (u.x + u.facing * d.pivot.x)) * u.facing);
    u.aim += (clamp(aimTo, -1.25, 1.25) - u.aim) * Math.min(1, dt * 14);
  }

  readyUp(u, dt) {
    if (u.target || u.moving) u.pose = Math.min(1, u.pose + dt * 6);
    else this.idleStep(u, dt);
    if (u.moving) u.anim += dt * 9;
  }

  stepFlame(u, dt) {
    const d = u.def;
    const t = this.acquire(u, dt);
    const speed = d.speed * u.speedMul;
    u.firing = false;
    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      this.aimAt(u, t, dt);
      if (dist > d.holdDist) {
        const s = speed * (u.burstLeft > 0 ? 0.6 : 1);
        u.x += (dx / dist) * s * dt;
        u.y += (dy / dist) * s * dt;
        u.moving = true;
      }
      u.burstT -= dt;
      if (u.burstLeft > 0) {
        if (dist <= d.range * 1.1) {
          u.firing = true;
          this.spray(u, dt);
        }
        if (u.burstT <= 0) {
          u.burstLeft = 0;
          u.burstT = d.offTime * (0.7 + Math.random() * 0.6);
        }
      } else if (u.burstT <= 0 && dist <= d.range) {
        u.burstLeft = 1;
        u.burstT = d.onTime * (0.8 + Math.random() * 0.4);
      }
    } else {
      u.burstLeft = 0;
      u.aim -= u.aim * Math.min(1, dt * 6);
      this.marchStep(u, dt, speed * 0.85);
    }
    this.readyUp(u, dt);
  }

  // A stream of fire: visual particles plus a cone that burns everything in it.
  spray(u, dt) {
    const d = u.def;
    const m = this.muzzleOf(u);
    const ang = u.facing > 0 ? u.aim : Math.PI - u.aim;
    for (let i = 0; i < 2; i++) {
      if (Math.random() < 0.3) continue;
      const a = ang + (Math.random() - 0.5) * 0.3;
      const sp = 190 + Math.random() * 80;
      this.flames.push({
        x: m.x,
        y: m.y,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp,
        age: 0,
        life: 0.36 + Math.random() * 0.16,
        size: 2 + Math.random() * 1.8,
        dot: Math.random() < 0.55,
      });
    }
    const cone = d.cone;
    this.eachEnemyNear(u.side, m.x, m.y, d.range, (o) => {
      const dx = o.x - m.x;
      const dy = o.y - m.y;
      const dist = Math.hypot(dx, dy);
      if (dist > d.range + o.def.radius) return;
      let da = Math.atan2(dy, dx) - ang;
      while (da > Math.PI) da -= TAU;
      while (da < -Math.PI) da += TAU;
      if (Math.abs(da) > cone + (o.def.radius / Math.max(dist, 1)) * 0.9) return;
      o.burn = d.burnTime;
      o.burnSrc = u;
      this.hurt(o, d.dps * dt, o.x, o.y, 'burn', u);
    });
  }

  // Swing timer, cooldown and the moment the blow lands (halfway through).
  meleeTick(u, dt) {
    const d = u.def;
    u.atk = Math.max(0, u.atk - dt / d.atkTime);
    u.cdT -= dt;
    if (u.atkHit && u.atk <= 0.5) {
      u.atkHit = false;
      const v = u.target;
      if (v && !v.dead && Math.hypot(v.x - u.x, v.y - u.y) <= d.reach * 1.5 + v.def.radius) {
        this.hurt(v, d.damage * (0.85 + Math.random() * 0.3), v.x, v.y, undefined, u);
        if (d.weapon === 'katana') {
          for (let i = 0; i < (Math.random() < 0.3 ? 1 : 0); i++) {
            this.puffs.push({
              x: v.x + (Math.random() - 0.5) * 14,
              y: v.y + (Math.random() - 0.5) * 8,
              vx: (Math.random() - 0.5) * 30,
              vy: -10 - Math.random() * 20,
              age: 0,
              size: 9 + Math.random() * 9,
              life: 1 + Math.random() * 0.6,
              white: true,
            });
          }
        }
      }
    }
  }

  stepMelee(u, dt) {
    const d = u.def;
    const t = this.acquire(u, dt);
    const speed = d.speed * u.speedMul;
    this.meleeTick(u, dt);
    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      this.aimAt(u, t, dt);
      const reach = d.reach + t.def.radius * 0.5;
      if (d.star) {
        u.starT -= dt;
        if (u.starT <= 0 && dist > reach * 1.6 && dist <= d.star.range) {
          this.throwStar(u, t);
          u.starT = d.star.cooldownMin + Math.random() * (d.star.cooldownMax - d.star.cooldownMin);
        }
      }
      if (dist > reach * 0.85) {
        u.x += (dx / dist) * speed * dt;
        u.y += (dy / dist) * speed * dt;
        u.moving = true;
      } else if (d.strafe) {
        u.x += (-dy / dist) * u.strafeDir * d.strafe * dt;
        u.y += (dx / dist) * u.strafeDir * d.strafe * dt;
        u.moving = true;
      }
      if (dist <= reach && u.cdT <= 0 && u.atk <= 0) {
        u.atk = 1;
        u.atkHit = true;
        u.swing = u.swing > 0 ? -1 : 1;
        u.strafeDir = Math.random() < 0.5 ? 1 : -1;
        u.cdT = d.cooldownMin + Math.random() * (d.cooldownMax - d.cooldownMin);
      }
    } else {
      u.aim -= u.aim * Math.min(1, dt * 6);
      this.marchStep(u, dt, speed * 0.85);
    }
    this.readyUp(u, dt);
  }

  stepCavalry(u, dt) {
    const d = u.def;
    const t = this.acquire(u, dt);
    const speed = d.speed * u.speedMul;
    u.atk = Math.max(0, u.atk - dt / 0.4);
    u.cdT -= dt;
    if (u.retreatT > 0) {
      // carry on past the target, then wheel round for another pass
      u.retreatT -= dt;
      u.x += u.dirx * speed * 0.9 * dt;
      u.y += u.diry * speed * 0.9 * dt;
      if (Math.abs(u.dirx) > 0.05) u.facing = u.dirx > 0 ? 1 : -1;
      u.moving = true;
    } else if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      u.charge = Math.min(1, u.charge + dt * 1.6);
      const s = speed * (0.5 + 0.5 * u.charge);
      u.x += (dx / dist) * s * dt;
      u.y += (dy / dist) * s * dt;
      u.moving = true;
      if (dist <= d.reach + t.def.radius && u.cdT <= 0) {
        t.kx += (dx / dist) * 120;
        t.ky += (dy / dist) * 120;
        this.hurt(t, d.damage * (0.85 + Math.random() * 0.3), t.x, t.y, undefined, u);
        u.atk = 1;
        u.cdT = d.cooldown;
        u.retreatT = d.retreat * (0.8 + Math.random() * 0.5);
        const turn = (Math.random() - 0.5) * 0.9;
        const c = Math.cos(turn);
        const s2 = Math.sin(turn);
        u.dirx = (dx / dist) * c - (dy / dist) * s2;
        u.diry = (dx / dist) * s2 + (dy / dist) * c;
        u.charge = 0.35;
      }
    } else {
      u.charge = 0;
      this.marchStep(u, dt, speed * 0.55);
    }
    if (u.moving) u.anim += dt * (6 + 8 * u.charge);
    u.pose = u.moving || t ? Math.min(1, u.pose + dt * 6) : Math.max(0, u.pose - dt * 5);
  }

  stepGrenade(u, dt) {
    const d = u.def;
    const t = this.acquire(u, dt);
    const speed = d.speed * u.speedMul;
    u.throwT = Math.max(0, u.throwT - dt);
    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      if (dist > d.holdDist) {
        u.x += (dx / dist) * speed * dt;
        u.y += (dy / dist) * speed * dt;
        u.moving = true;
      } else if (dist < d.minRange) {
        u.x -= (dx / dist) * speed * 0.7 * dt;
        u.y -= (dy / dist) * speed * 0.7 * dt;
        u.moving = true;
      }
      u.cdT -= dt;
      if (u.cdT <= 0 && dist <= d.range && dist >= d.minRange * 0.8) {
        const o = this.rifleOrigin(u);
        const sp = dist * 0.07;
        const tx = t.x + (Math.random() - 0.5) * sp * 2;
        const ty = t.y + (Math.random() - 0.5) * sp * 2;
        const flight = Math.hypot(tx - o.x, ty - o.y);
        this.bombs.push({
          x0: o.x,
          y0: o.y,
          x1: tx,
          y1: ty,
          age: 0,
          dur: 0.5 + flight / 440,
          h: 34 + flight * 0.24,
          side: u.side,
          owner: u,
          damage: d.damage,
          radius: d.blastRadius,
          spin: (Math.random() < 0.5 ? -1 : 1) * (7 + Math.random() * 4),
        });
        u.throwT = d.throwTime;
        u.cdT = d.cooldownMin + Math.random() * (d.cooldownMax - d.cooldownMin);
      }
    } else {
      this.marchStep(u, dt, speed * 0.85);
    }
    this.readyUp(u, dt);
  }

  stepArcher(u, dt) {
    const d = u.def;
    const t = this.acquire(u, dt);
    const speed = d.speed * u.speedMul;
    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      this.aimAt(u, t, dt);
      if (u.drawT === 0 && dist > d.holdDist) {
        u.x += (dx / dist) * speed * dt;
        u.y += (dy / dist) * speed * dt;
        u.moving = true;
      } else if (u.drawT === 0 && dist < d.minRange) {
        u.x -= (dx / dist) * speed * 0.7 * dt;
        u.y -= (dy / dist) * speed * 0.7 * dt;
        u.moving = true;
      }
      u.reloadT = Math.max(0, u.reloadT - dt);
      u.aimHold = Math.max(0, u.aimHold - dt);
      if (u.drawT > 0) {
        u.aimHold = 0.7;
        u.drawT += dt;
        if (u.drawT >= d.drawTime) {
          this.loose(u, t);
          u.reloadT = 0.3;
          u.drawT = 0;
          u.cdT = d.cooldownMin + Math.random() * (d.cooldownMax - d.cooldownMin);
        }
      } else {
        u.cdT -= dt;
        if (u.cdT <= 0 && dist <= d.range && dist >= d.minRange * 0.6) u.drawT = 0.0001;
      }
    } else {
      u.drawT = 0;
      u.aimHold = 0;
      u.aim -= u.aim * Math.min(1, dt * 6);
      this.marchStep(u, dt, speed * 0.85);
    }
    // the bow is carried low while walking and only comes up for the shot
    if (u.moving) u.anim += dt * 9;
    if (u.aimHold > 0) u.pose = Math.min(1, u.pose + dt * 8);
    else u.pose = Math.max(0, u.pose - dt * 5);
  }

  // An arrow flies along a straight ground path with a high arc, then lands
  // where the target was (and may hit whoever is standing there).
  loose(u, t) {
    const d = u.def;
    const m = this.muzzleOf(u);
    const dist = Math.hypot(t.x - m.x, t.y - m.y);
    const sp = 6 + dist * 0.03;
    this.arrows.push({
      x0: m.x,
      y0: m.y,
      x1: t.x + (Math.random() - 0.5) * sp * 2,
      y1: t.y + (Math.random() - 0.5) * sp * 2,
      age: 0,
      dur: 0.25 + dist / d.arrowSpeed,
      h: 16 + dist * 0.2,
      side: u.side,
      owner: u,
      damage: d.damage,
    });
    u.recoil = 1;
  }

  // A ninja's throwing star: a short, low arc to where the target stands.
  throwStar(u, t) {
    const d = u.def;
    const o = this.rifleOrigin(u);
    const dist = Math.hypot(t.x - o.x, t.y - o.y);
    const sp = 4 + dist * 0.04;
    this.arrows.push({
      kind: 'star',
      owner: u,
      x0: o.x,
      y0: o.y,
      x1: t.x + (Math.random() - 0.5) * sp * 2,
      y1: t.y + (Math.random() - 0.5) * sp * 2,
      age: 0,
      dur: 0.2 + dist / d.star.speed,
      h: 6 + dist * 0.08,
      side: u.side,
      damage: d.star.damage,
    });
    u.atk = 1;
    u.swing = u.swing > 0 ? -1 : 1;
  }

  stepArrows(dt) {
    let gone = false;
    for (const a of this.arrows) {
      a.age += dt;
      if (a.age < a.dur) continue;
      a.dead = true;
      gone = true;
      let hit = null;
      let bestD2 = Infinity;
      this.eachEnemyNear(a.side, a.x1, a.y1, 24, (o) => {
        const dx = o.x - a.x1;
        const dy = o.y - a.y1;
        const d2 = dx * dx + dy * dy;
        const r = o.def.radius + 3;
        if (d2 <= r * r && d2 < bestD2) {
          bestD2 = d2;
          hit = o;
        }
      });
      if (hit) this.hurt(hit, a.damage, a.x1, a.y1, a.kind === 'star' ? undefined : 'arrow', a.owner);
      if (a.kind !== 'star' && this.onArrowLand) this.onArrowLand(a);
    }
    if (gone) this.arrows = this.arrows.filter((a) => !a.dead);
  }

  stepBombs(dt) {
    let gone = false;
    for (const b of this.bombs) {
      b.age += dt;
      if (b.age < b.dur) continue;
      b.dead = true;
      gone = true;
      this.explode(b);
    }
    if (gone) this.bombs = this.bombs.filter((b) => !b.dead);
  }

  // A grenade blast: damage with falloff, knockback, a fireball and smoke.
  explode(b) {
    const x = b.x1;
    const y = b.y1;
    this.blasts.push({ x, y, age: 0, life: 0.75, r: b.radius, seed: Math.random() });
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * TAU;
      const sp = 20 + Math.random() * 50;
      this.puffs.push({
        x: x + Math.cos(a) * 12,
        y: y + Math.sin(a) * 8,
        vx: Math.cos(a) * sp,
        vy: Math.sin(a) * sp - 16,
        age: 0,
        life: 1.1 + Math.random() * 0.8,
        size: 7 + Math.random() * 6,
      });
    }
    const reach = b.radius;
    this.eachEnemyNear(b.side, x, y, reach + 14, (o) => {
      const dx = o.x - x;
      const dy = o.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > reach + o.def.radius) return;
      const f = Math.max(0.25, 1 - dist / (reach + o.def.radius));
      o.kx += (dx / dist) * 300 * f;
      o.ky += (dy / dist) * 300 * f;
      this.hurt(o, b.damage * f, o.x, o.y, 'blast', b.owner);
    });
  }

  // A killed unit's headgear is thrown high into the air.
  launchDrop(u) {
    this.debris.push({
      x: u.x,
      y: u.y,
      z: 10,
      vx: u.kx * 0.5 + (Math.random() - 0.5) * 60,
      vy: u.ky * 0.5 + (Math.random() - 0.5) * 40,
      vz: 250 + Math.random() * 130,
      rot: Math.random() * 6,
      spin: (Math.random() < 0.5 ? -1 : 1) * (6 + Math.random() * 8),
      age: 0,
      species: u.species,
    });
  }

  stepDebris(dt) {
    let gone = false;
    for (const d of this.debris) {
      d.age += dt;
      d.x += d.vx * dt;
      d.y += d.vy * dt;
      d.vz -= 640 * dt;
      d.z += d.vz * dt;
      d.rot += d.spin * dt;
      if (d.z <= 0) {
        d.dead = true;
        gone = true;
        if (this.onDebrisLand) this.onDebrisLand(d);
      }
    }
    if (gone) this.debris = this.debris.filter((d) => !d.dead);
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
        this.hurt(hit, b.damage, b.x, b.y, 'bullet', b.owner);
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

    for (const f of this.flames) {
      f.age += dt;
      f.x += f.vx * dt;
      f.y += f.vy * dt;
      f.vx *= 0.985;
      f.vy *= 0.985;
    }
    if (this.flames.some((f) => f.age > f.life)) this.flames = this.flames.filter((f) => f.age <= f.life);

    for (const c of this.corpses) c.age += dt;
    if (this.corpses.some((c) => c.age > 1)) this.corpses = this.corpses.filter((c) => c.age <= 1);

    for (const b of this.blasts) b.age += dt;
    if (this.blasts.some((b) => b.age > b.life)) this.blasts = this.blasts.filter((b) => b.age <= b.life);
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
    this.stepGroups(dt);
    for (const u of this.units) {
      if (!u.dead) this.stepUnit(u, dt);
    }
    this.separate();
    if (this.stats && !this.stats.final) {
      this.time += dt;
      this.stats.sampleT -= dt;
      if (this.stats.sampleT <= 0) {
        this.stats.sampleT += 0.25;
        this.stats.samples.push([this.time, this.countTeam('red'), this.countTeam('blue')]);
      }
    }
    this.stepBullets(dt);
    this.stepArrows(dt);
    this.stepBombs(dt);
    this.stepDebris(dt);
    this.stepEffects(dt);
    if (this.anyDead) {
      this.units = this.units.filter((u) => !u.dead);
      this.anyDead = false;
    }
  }
}
