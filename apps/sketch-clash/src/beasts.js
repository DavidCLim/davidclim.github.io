import { TAU, FEET, GAIT } from './config.js?v=79';
import { WATER, ICE, WALL } from './terrain.js?v=79';

// Everything the Animals and Mythical tabs add to the world, plus the terrain physics:
// the beast brain, the mage's bolts, the necromancer's skeletons, zombie infection,
// and how water, ice, walls, mines, barrels, trees and towers affect everyone.
const rand = (a, b) => a + Math.random() * (b - a);
const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v);

const BARREL_HP = 28;
const TREE_R = 4;
const BARREL_R = 5;
const MINE_R = 8;
const TOWER_R = 6;

export function installBeasts(World) {
  const P = World.prototype;

  // ------------------------------------------------------------ the frame step
  P.stepUnit = function (u, dt) {
    if (u.rise !== undefined && u.rise < 1) {
      // clawing up out of the ground
      u.rise = Math.min(1, u.rise + dt / 0.75);
      u.breath += dt;
      return;
    }
    if (u.slip > 0) {
      this.stepSlip(u, dt);
      return;
    }
    const ox = u.x;
    const oy = u.y;
    this.stepUnitCore(u, dt);
    if (!u.dead) this.applyTerrain(u, ox, oy, dt);
  };

  P.stepSlip = function (u, dt) {
    u.hit = Math.max(0, u.hit - dt);
    u.flash = Math.max(0, u.flash - dt);
    u.breath += dt;
    u.slip -= dt;
    const k = Math.max(0, u.slip / 1.15);
    u.x += u.slipV[0] * k * dt;
    u.y += u.slipV[1] * k * dt;
    // a full somersault about the feet
    u.tilt = (1 - k) * TAU * -1;
    u.moving = false;
    if (u.slip <= 0) {
      u.tilt = 0;
      u.stun = 0.35;
    }
    this.confine(u);
  };

  P.confine = function (u) {
    u.x = clamp(u.x, 14, this.w - 14);
    u.y = clamp(u.y, 24, this.h - 24);
  };

  // Terrain acts on how far the unit moved this step.
  P.applyTerrain = function (u, ox, oy, dt) {
    const d = u.def;
    const T = this.terrain;
    let dx = u.x - ox;
    let dy = u.y - oy;
    const fly = !!d.flying;
    const here = T.at(ox, oy + FEET);
    u.inWater = !!(here & WATER);
    if (!fly && u.inWater && u.burn > 0) u.burn = 0;
    if (u.slow > 0) {
      dx *= 0.45;
      dy *= 0.45;
    }
    if (!fly && u.inWater && (dx || dy)) {
      const f = d.swim !== undefined ? d.swim : d.waterOnly ? 1 : 0.5;
      dx *= f;
      dy *= f;
    }
    // ice: you keep sliding the way you were going and can hardly steer
    const onIce = !fly && !!(here & ICE);
    if (onIce || (u.iv && (u.iv[0] || u.iv[1]))) {
      if (!u.iv) u.iv = [0, 0];
      if (onIce) {
        const k = Math.min(1, dt * 1.6);
        u.iv[0] += (dx / dt - u.iv[0]) * k;
        u.iv[1] += (dy / dt - u.iv[1]) * k;
        dx = u.iv[0] * dt;
        dy = u.iv[1] * dt;
      } else {
        const k = Math.max(0, 1 - dt * 4);
        u.iv[0] *= k;
        u.iv[1] *= k;
        if (Math.abs(u.iv[0]) + Math.abs(u.iv[1]) < 3) u.iv[0] = u.iv[1] = 0;
        dx += u.iv[0] * dt;
        dy += u.iv[1] * dt;
      }
    }
    let nx = ox + dx;
    let ny = oy + dy;
    if (!fly) {
      if (T.at(nx, ny + FEET) & WALL) {
        const len = Math.hypot(dx, dy) || 1;
        if (!(T.at(nx, oy + FEET) & WALL)) ny = oy;
        else if (!(T.at(ox, ny + FEET) & WALL)) nx = ox;
        else {
          // head on: slide sideways along the wall instead
          const side = u.wallDir || (u.wallDir = Math.random() < 0.5 ? 1 : -1);
          let sx = ox + (-dy / len) * side * len;
          let sy = oy + (dx / len) * side * len;
          if (T.at(sx, sy + FEET) & WALL) {
            u.wallDir = -side;
            sx = ox + (dy / len) * side * len;
            sy = oy + (-dx / len) * side * len;
          }
          if (T.at(sx, sy + FEET) & WALL) {
            sx = ox;
            sy = oy;
          }
          nx = sx;
          ny = sy;
        }
        if (u.iv) u.iv[0] = u.iv[1] = 0;
      }
      if (T.at(nx, ny + FEET) & WALL) {
        // painted over, or knocked into a wall: get out
        const p = this.nearestFree(nx, ny + FEET);
        if (p) {
          nx = p[0];
          ny = p[1] - FEET;
        }
      }
    }
    u.x = nx;
    u.y = ny;
    if (d.waterOnly && !(T.at(u.x, u.y + FEET) & WATER) && (T.at(ox, oy + FEET) & WATER)) {
      // never leaves the water under its own power
      u.x = ox;
      u.y = oy;
    }
    // solid trees and barrels, then peels and mines
    const props = this.props;
    if (props.length) {
      const fx = u.x;
      const fy = u.y + FEET;
      for (const p of props) {
        if (p.dead) continue;
        const ddx = fx - p.x;
        const ddy = fy - p.y;
        if (ddx > 24 || ddx < -24 || ddy > 24 || ddy < -24) continue;
        if (p.type === 'tree' || p.type === 'barrel' || p.type === 'tower') {
          if (fly) continue;
          const r = (p.type === 'tree' ? TREE_R : p.type === 'tower' ? TOWER_R : BARREL_R) + 3;
          const dd = Math.hypot(ddx, ddy) || 0.01;
          if (dd < r) {
            u.x += (ddx / dd) * (r - dd);
            u.y += (ddy / dd) * (r - dd);
          }
        } else if (p.type === 'mine') {
          // units see a mine coming and walk around it
          const md = Math.hypot(ddx, ddy);
          if (!fly && md < 24 && md > MINE_R) {
            const push = (1 - md / 24) * 1.1 * Math.hypot(dx, dy);
            u.x += (ddx / md) * push + (-ddy / md) * push * 0.6;
            u.y += (ddy / md) * push + (ddx / md) * push * 0.6;
          }
          if (fly || md > MINE_R) continue;
          p.dead = true;
          this.blastAt(p.x, p.y - 4, 26, 110, null);
        }
      }
    }
  };

  // The closest foot position that is not inside a wall.
  P.nearestFree = function (x, y) {
    const T = this.terrain;
    for (let r = 3; r <= 36; r += 3) {
      for (let a = 0; a < 12; a++) {
        const t = (a / 12) * TAU;
        const px = x + Math.cos(t) * r;
        const py = y + Math.sin(t) * r;
        if (px > 14 && px < this.w - 14 && py > 24 + FEET && py < this.h - 24 && !(T.at(px, py) & WALL)) return [px, py];
      }
    }
    return null;
  };

  // ------------------------------------------------------------ props
  P.addProp = function (type, x, y) {
    const p = { type, x, y, hp: type === 'barrel' ? BARREL_HP : 1, dead: false, age: 0, seed: Math.random() };
    this.props.push(p);
    return p;
  };

  P.damageProp = function (p, dmg) {
    if (p.dead || p.type !== 'barrel') return;
    p.hp -= dmg;
    p.hot = 0.2;
    if (p.hp <= 0) {
      p.dead = true;
      this.blastAt(p.x, p.y - 12, 30, 95, null);
    }
  };

  // Damage to whatever props are within r of a point; trees stop things, barrels blow up.
  P.hitProps = function (x, y, r, dmg) {
    for (const p of this.props) {
      if (p.dead) continue;
      if (p.type === 'barrel' || p.type === 'mine') {
        if (Math.hypot(p.x - x, p.y - 8 - y) <= r + BARREL_R) {
          if (p.type === 'barrel') this.damageProp(p, dmg);
          else {
            p.dead = true;
            this.blastAt(p.x, p.y - 4, 26, 110, null);
          }
        }
      }
    }
  };

  // Does something solid (a wall, a tree, a barrel) stand where a shot is flying? Barrels take the hit.
  P.shotBlocked = function (x, y, dmg) {
    if (this.terrain.at(x, y + 4) & WALL) return true;
    for (const p of this.props) {
      if (p.dead || (p.type !== 'tree' && p.type !== 'barrel' && p.type !== 'tower')) continue;
      const cy = p.type === 'tree' ? p.y - 6 : p.type === 'tower' ? p.y - 10 : p.y - 7;
      const r = p.type === 'tree' ? 4 : p.type === 'tower' ? 6 : 5;
      if (Math.abs(x - p.x) > 10 || Math.abs(y - cy) > 20) continue;
      if (Math.hypot(x - p.x, (y - cy) * 0.55) <= r) {
        if (p.type === 'barrel') this.damageProp(p, dmg);
        return true;
      }
    }
    return false;
  };

  P.stepProps = function (dt) {
    let gone = false;
    for (const p of this.props) {
      p.age += dt;
      if (p.hot > 0) p.hot -= dt;
      if (p.dead) gone = true;
    }
    if (gone) this.props = this.props.filter((p) => !p.dead);
  };

  // An explosion that doesn't care whose side anyone is on.
  P.blastAt = function (x, y, radius, damage, owner) {
    this.blasts.push({ x, y, age: 0, life: 4.4, r: radius, seed: Math.random() });
    if (this.sfx) this.sfx('boom', x);
    for (const o of this.units) {
      if (o.dead) continue;
      const dx = o.x - x;
      const dy = o.y - y;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > radius + o.def.radius) continue;
      const f = Math.max(0.25, 1 - dist / (radius + o.def.radius));
      if (!o.def.noKnock) {
        const m = o.def.hp > 300 ? 0.25 : 1;
        o.kx += (dx / dist) * 300 * f * m;
        o.ky += (dy / dist) * 300 * f * m;
      }
      this.hurt(o, damage * f, o.x, o.y, 'blast', owner);
    }
    for (const p of this.props) {
      if (p.dead) continue;
      if (p.type !== 'barrel' && p.type !== 'mine') continue;
      // in the original a blast next to a barrel does not set it off; only a close one does
      if (Math.hypot(p.x - x, p.y - 8 - y) <= radius * 0.45) {
        if (p.type === 'barrel') {
          p.hp = Math.min(p.hp, 4);
          p.fuse = 0.12 + Math.random() * 0.12;
        } else {
          p.fuse = 0.1 + Math.random() * 0.15;
        }
      }
    }
  };

  P.stepFuses = function (dt) {
    for (const p of this.props) {
      if (p.fuse === undefined || p.dead) continue;
      p.fuse -= dt;
      if (p.fuse <= 0) {
        p.dead = true;
        if (p.type === 'barrel') this.blastAt(p.x, p.y - 12, 30, 95, null);
        else this.blastAt(p.x, p.y - 4, 26, 110, null);
      }
    }
  };

  // ------------------------------------------------------------ the beast brain
  P.stepBeast = function (u, dt) {
    const d = u.def;
    const T = this.terrain;
    u.atk = Math.max(0, u.atk - dt / d.atkTime);
    u.cdT -= dt;
    if (u.stun > 0) {
      u.stun -= dt;
      return;
    }
    let t = this.acquire(u, dt);
    let speed = d.speed * u.speedMul * (u.small ? 1.25 : 1);
    if (d.waterOnly) {
      const wet = !!(T.at(u.x, u.y + FEET) & WATER);
      u.inWater = wet;
      if (!wet) {
        u.moving = false;
        this.hurt(u, 5 * dt, u.x, u.y, 'drown');
        return;
      }
      if (t && !T.near(t.x, t.y + FEET, 20, WATER)) t = null;
    }
    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      const reach = d.reach + t.def.radius * 0.5;
      u.charging = false;
      if (d.charge && dist > reach * 1.3 && dist < d.charge.range) {
        speed *= d.charge.mul;
        u.charging = true;
      }
      if (dist > reach * 0.85) {
        this.beastMove(u, (dx / dist) * speed * dt, (dy / dist) * speed * dt);
        u.moving = true;
      }
      if (dist <= reach && u.cdT <= 0 && u.atk <= 0) {
        u.atk = 1;
        u.atkHit = true;
        u.cdT = rand(d.cooldownMin, d.cooldownMax);
      }
    } else {
      u.charging = false;
      if (d.waterOnly) {
        u.wanderT = (u.wanderT || 0) - dt;
        if (u.wanderT <= 0) {
          u.wanderT = rand(0.8, 2);
          u.wander = Math.random() * TAU;
        }
        const wx = Math.cos(u.wander) * speed * 0.45 * dt;
        const wy = Math.sin(u.wander) * speed * 0.45 * dt;
        if (T.at(u.x + wx * 4, u.y + wy * 4 + FEET) & WATER) {
          this.beastMove(u, wx, wy);
          u.moving = true;
          if (Math.abs(wx) > 0.05) u.facing = wx > 0 ? 1 : -1;
        } else u.wander += 2 + Math.random();
      } else this.marchStep(u, dt, speed * 0.85);
    }
    // the blow lands halfway through the swing
    if (u.atkHit && u.atk <= 0.5) {
      u.atkHit = false;
      this.beastHit(u);
    }
    if (u.moving) u.anim += dt * (GAIT[u.species] || 8) * clamp(speed / d.speed, 0.7, 1.7);
    if (u.target || u.moving) u.pose = Math.min(1, u.pose + dt * 6);
    else this.idleStep(u, dt);
  };

  P.beastMove = function (u, mx, my) {
    if (u.def.waterOnly) {
      const T = this.terrain;
      if (T.at(u.x + mx, u.y + my + FEET) & WATER) {
        u.x += mx;
        u.y += my;
      } else if (T.at(u.x + mx, u.y + FEET) & WATER) u.x += mx;
      else if (T.at(u.x, u.y + my + FEET) & WATER) u.y += my;
      return;
    }
    u.x += mx;
    u.y += my;
  };

  P.beastHit = function (u) {
    const d = u.def;
    const v = u.target;
    if (!v || v.dead) return;
    const dx = v.x - u.x;
    const dy = v.y - u.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > d.reach * 1.7 + v.def.radius) return;
    const mul = u.small ? 0.6 : 1;
    if (d.slam) {
      // the giant brings the club down: everyone around the point of impact is flattened and flung
      const cx = u.x + u.facing * d.reach * 0.9;
      const cy = u.y;
      this.puffs.push(
        ...Array.from({ length: 6 }, () => {
          const a = Math.random() * TAU;
          return {
            x: cx + Math.cos(a) * 10,
            y: cy + FEET - 2 + Math.sin(a) * 4,
            vx: Math.cos(a) * rand(20, 50),
            vy: -rand(4, 16),
            age: 0,
            life: 0.9 + Math.random() * 0.5,
            size: 6 + Math.random() * 5,
          };
        }),
      );
      if (this.sfx) this.sfx('slam', cx);
      this.eachEnemyNear(u.side, cx, cy, d.slam.radius + 12, (o) => {
        const ox = o.x - cx;
        const oy = o.y - cy;
        const od = Math.hypot(ox, oy) || 1;
        if (od > d.slam.radius + o.def.radius) return;
        const f = Math.max(0.35, 1 - od / (d.slam.radius + o.def.radius));
        if (!o.def.noKnock) {
          o.kx += (ox / od) * d.slam.knock * f;
          o.ky += (oy / od) * d.slam.knock * f;
        }
        this.hurt(o, d.damage * f * rand(0.9, 1.1), o.x, o.y, undefined, u);
      });
      this.hitProps(cx, cy, d.slam.radius * 0.6, d.damage);
      return;
    }
    this.hurt(v, d.damage * mul * rand(0.85, 1.15), v.x, v.y, undefined, u);
    if (this.sfx) this.sfx(d.slam || d.knock ? 'smash' : 'bite', v.x);
    if (!v.dead && !v.def.noKnock) {
      const k = (u.charging && d.charge ? d.charge.knock : 0) || d.knock || 0;
      if (k) {
        v.kx += (dx / dist) * k;
        v.ky += (dy / dist) * k;
      }
    }
    if (d.poison && !v.dead) {
      v.poison = d.poison.time;
      v.poisonDps = d.poison.dps;
      v.poisonSrc = u;
    }
  };

  // ------------------------------------------------------------ the mage
  P.stepMage = function (u, dt) {
    const d = u.def;
    const t = this.acquire(u, dt);
    const speed = d.speed * u.speedMul;
    u.cdT -= dt;
    u.castT = Math.max(0, u.castT - dt);
    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      if (dist > d.holdDist) {
        u.x += (dx / dist) * speed * dt;
        u.y += (dy / dist) * speed * dt;
        u.moving = true;
      } else if (dist < d.holdDist * 0.5) {
        u.x -= (dx / dist) * speed * 0.7 * dt;
        u.y -= (dy / dist) * speed * 0.7 * dt;
        u.moving = true;
      }
      if (u.cdT <= 0 && dist <= d.range && u.castT <= 0) {
        u.castT = d.castTime;
        u.castFire = true;
        u.cdT = rand(d.cooldownMin, d.cooldownMax);
      }
      if (u.castFire && u.castT <= d.castTime * 0.45) {
        u.castFire = false;
        this.castOrb(u, t);
      }
    } else this.marchStep(u, dt, speed * 0.85);
    if (u.moving) u.anim += dt * 7.3;
    u.pose = u.target || u.moving ? Math.min(1, u.pose + dt * 6) : Math.max(0, u.pose - dt * 5);
  };

  P.castOrb = function (u, t) {
    const d = u.def;
    const sx = u.x + u.facing * 22 * 0.31 * 1.3;
    const sy = u.y - 40 * 0.31;
    const ang = Math.atan2(t.y - sy, t.x - sx);
    this.orbs.push({
      x: sx,
      y: sy,
      vx: Math.cos(ang) * d.orbSpeed,
      vy: Math.sin(ang) * d.orbSpeed,
      side: u.side,
      owner: u,
      damage: d.damage,
      slow: d.slow,
      age: 0,
      dead: false,
    });
    if (this.sfx) this.sfx('magic', u.x);
  };

  P.stepOrbs = function (dt) {
    let gone = false;
    for (const o of this.orbs) {
      o.age += dt;
      o.x += o.vx * dt;
      o.y += o.vy * dt;
      if (o.age > 2 || o.x < -10 || o.x > this.w + 10 || o.y < -10 || o.y > this.h + 10) {
        o.dead = true;
        gone = true;
        continue;
      }
      if (Math.random() < 0.6) {
        this.sparks.push({ x: o.x, y: o.y, vx: (Math.random() - 0.5) * 18, vy: (Math.random() - 0.5) * 18, life: 0.3, max: 0.3, cyan: true });
      }
      if (this.shotBlocked(o.x, o.y + 6, 12)) {
        o.dead = true;
        gone = true;
        continue;
      }
      let hit = null;
      this.eachEnemyNear(o.side, o.x, o.y, 10, (u) => {
        if (hit) return;
        const r = u.def.radius + 2.5;
        if ((u.x - o.x) ** 2 + (u.y - 2 - o.y) ** 2 <= r * r) hit = u;
      });
      if (hit) {
        o.dead = true;
        gone = true;
        this.hurt(hit, o.damage, hit.x, hit.y, 'magic', o.owner);
        hit.slow = Math.max(hit.slow || 0, o.slow);
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * TAU;
          this.sparks.push({ x: hit.x, y: hit.y - 2, vx: Math.cos(a) * 60, vy: Math.sin(a) * 60, life: 0.4, max: 0.4, cyan: true });
        }
      }
    }
    if (gone) this.orbs = this.orbs.filter((o) => !o.dead);
  };

  // ------------------------------------------------------------ the necromancer
  P.stepNecro = function (u, dt) {
    const d = u.def;
    const t = this.acquire(u, dt);
    const speed = d.speed * u.speedMul;
    u.castT = Math.max(0, u.castT - dt);
    u.cdT -= dt;
    if (t) {
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
      if (dist > d.holdDist) {
        u.x += (dx / dist) * speed * dt;
        u.y += (dy / dist) * speed * dt;
        u.moving = true;
      } else if (dist < d.holdDist * 0.6) {
        u.x -= (dx / dist) * speed * 0.8 * dt;
        u.y -= (dy / dist) * speed * 0.8 * dt;
        u.moving = true;
      }
    } else this.marchStep(u, dt, speed * 0.85);
    const have = this.units.reduce((n, k) => n + (k.owner === u && !k.dead ? 1 : 0), 0);
    if (u.cdT <= 0 && u.castT <= 0 && (t || have === 0) && have < d.maxMinions) {
      u.castT = d.castTime;
      u.castFire = true;
      u.cdT = rand(d.summonMin, d.summonMax);
    }
    if (u.castFire && u.castT <= d.castTime * 0.5) {
      u.castFire = false;
      this.summon(u);
    }
    if (u.moving) u.anim += dt * 7.3;
    u.pose = u.target || u.moving ? Math.min(1, u.pose + dt * 6) : Math.max(0, u.pose - dt * 5);
  };

  P.summon = function (u) {
    for (let i = 0; i < 2; i++) {
      const a = Math.random() * TAU;
      const x = clamp(u.x + Math.cos(a) * rand(14, 26), 16, this.w - 16);
      const y = clamp(u.y + Math.sin(a) * rand(10, 18), 26, this.h - 26);
      const k = this.addUnit('skeleton', u.team, x, y);
      k.owner = u;
      k.rise = 0;
      k.facing = u.facing;
      for (let j = 0; j < 3; j++) {
        this.puffs.push({
          x: x + (Math.random() - 0.5) * 8,
          y: y + FEET - 2,
          vx: (Math.random() - 0.5) * 24,
          vy: -rand(6, 16),
          age: 0,
          life: 0.8 + Math.random() * 0.5,
          size: 7 + Math.random() * 5,
          white: true,
        });
      }
    }
    if (this.sfx) this.sfx('summon', u.x);
  };

  // ------------------------------------------------------------ zombies
  P.stepRises = function (dt) {
    if (!this.rises.length) return;
    for (const r of this.rises) r.t -= dt;
    for (const r of this.rises) {
      if (r.t > 0) continue;
      const k = this.addUnit(r.sp, r.team, r.x, r.y);
      k.rise = 0;
      k.facing = r.facing;
      for (let j = 0; j < 4; j++) {
        this.puffs.push({
          x: r.x + (Math.random() - 0.5) * 8,
          y: r.y + FEET - 2,
          vx: (Math.random() - 0.5) * 26,
          vy: -rand(4, 14),
          age: 0,
          life: 0.8 + Math.random() * 0.5,
          size: 6 + Math.random() * 5,
        });
      }
    }
    this.rises = this.rises.filter((r) => r.t > 0);
  };

  // What happens when something dies: slimes split, zombies spread, a necromancer's skeletons crumble.
  P.afterDeath = function (u, kind, src) {
    const d = u.def;
    if (d.split && !u.small) {
      for (let i = 0; i < 2; i++) {
        const k = this.addUnit('slime', u.team, u.x + (i ? 7 : -7), u.y);
        k.small = true;
        k.scale = 0.6;
        k.hp = 38;
        k.facing = u.facing;
        k.kx = (i ? 1 : -1) * 90;
        k.ky = (Math.random() - 0.5) * 60;
      }
    }
    if (src && src.def.infects && !kind && !d.prop && u.species !== 'zombie' && u.species !== 'skeleton' && !d.creature) {
      this.rises.push({ x: u.x, y: u.y, team: src.team, sp: 'zombie', facing: u.facing, t: 1.5 });
    }
    if (u.species === 'necromancer') {
      for (const k of this.units) {
        if (k.owner === u && !k.dead) this.hurt(k, 9999, k.x, k.y, 'curse', null);
      }
    }
  };
}
