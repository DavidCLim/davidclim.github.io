import { MAPS } from '../data/maps.js';
import { UNITS, unitLevelStats } from '../data/units.js';
import { TEACHERS } from '../data/teachers.js';
import { TOTAL_WAVES, buildWaveSpawns, statScaleForWave } from '../data/waves.js';
import { starMultiplier } from './collection.js';
import * as audio from '../audio/audioEngine.js';

// A classic lane auto-battler: no player character. Gold only comes from
// kills — you spend it deploying students from your equipped roster (each
// on its own cost + cooldown), and they march down the lane on their own,
// fighting whatever teacher they run into, while teachers do the same
// toward your base.
export const STARTING_GOLD = 60;
export const STARTING_BASE_HP = 75;
export const ENEMY_BASE_HP = 75;

const DEPLOY_COOLDOWN = { common: 2, rare: 3, epic: 4.5, legend: 6, mythic: 9 };
const CONTACT_RANGE = 26;
const PASSIVE_GOLD_PER_SEC = 10;

function unitHpFor(def) {
  return Math.round(40 + def.cost * 0.6);
}

export function createGameState(mapId, equipped, stars) {
  const map = MAPS[mapId];
  return {
    screen: 'playing',
    map,
    equipped,
    stars,
    base: { hp: STARTING_BASE_HP, maxHp: STARTING_BASE_HP },
    enemyBase: { hp: ENEMY_BASE_HP, maxHp: ENEMY_BASE_HP },
    gold: STARTING_GOLD,
    units: [],
    enemies: [],
    deployCooldowns: Object.fromEntries(equipped.map(id => [id, 0])),
    wave: 0,
    waveActive: false,
    pendingSpawns: [],
    effects: [],
    projectiles: [],
    speed: 1,
    autoWave: false,
    t: 0,
    nextUid: 1,
    lastWaveScale: statScaleForWave(1),
  };
}

// ---------- Deploy ----------
export function canDeploy(state, unitId) {
  const def = UNITS[unitId];
  if (!def) return false;
  if (state.gold < def.cost) return false;
  if ((state.deployCooldowns[unitId] || 0) > 0) return false;
  if (def.maxCount && state.units.filter(u => u.typeId === unitId).length >= def.maxCount) return false;
  return true;
}

export function deployUnit(state, unitId) {
  if (!canDeploy(state, unitId)) return false;
  const def = UNITS[unitId];
  const star = state.stars[unitId] || 0;
  const mul = starMultiplier(star);
  const stats = unitLevelStats(unitId, 0);
  const hp = unitHpFor(def);
  state.gold -= def.cost;
  state.deployCooldowns[unitId] = DEPLOY_COOLDOWN[def.rarity] || 3;
  const towardSpawn = state.map.spawn.x < state.map.base.x ? -1 : 1;
  state.units.push({
    uid: state.nextUid++,
    typeId: unitId,
    x: state.map.base.x - towardSpawn * 26,
    y: state.map.laneY + (Math.random() * 20 - 10),
    dir: towardSpawn,
    color: def.color,
    glow: def.glow,
    icon: def.icon,
    accent: def.accent,
    star,
    level: 0,
    hp, maxHp: hp,
    ...stats,
    damage: stats.damage * mul,
    range: stats.range * mul,
    speed: 62,
    cooldown: 0,
    attackFlashUntil: 0,
  });
  audio.playPlaceTower();
  return true;
}

function updateDeployCooldowns(state, dt) {
  for (const id of Object.keys(state.deployCooldowns)) {
    if (state.deployCooldowns[id] > 0) state.deployCooldowns[id] = Math.max(0, state.deployCooldowns[id] - dt);
  }
}

// ---------- Waves ----------
export function startNextWave(state) {
  if (state.waveActive || state.wave >= TOTAL_WAVES) return false;
  state.wave++;
  state.waveActive = true;
  state.pendingSpawns = buildWaveSpawns(state.wave);
  state.lastWaveScale = statScaleForWave(state.wave);
  audio.playWaveStart();
  return true;
}

function spawnEnemy(state, typeId) {
  const def = TEACHERS[typeId];
  const scale = state.lastWaveScale;
  const towardBase = state.map.base.x < state.map.spawn.x ? -1 : 1;
  state.enemies.push({
    uid: state.nextUid++,
    typeId,
    x: state.map.spawn.x, y: state.map.laneY + (Math.random() * 20 - 10),
    dir: towardBase,
    hp: Math.round(def.hp * scale.hpMul),
    maxHp: Math.round(def.hp * scale.hpMul),
    speed: def.speed * scale.speedMul,
    size: def.size,
    color: def.color,
    glow: def.glow,
    reward: Math.round(def.reward * scale.rewardMul),
    damage: def.damage,
    boss: !!def.boss,
    evasive: def.evasive || 0,
    slowUntil: 0,
    attackCooldown: 0,
  });
}

function updateSpawns(state, dt) {
  if (!state.pendingSpawns.length) return;
  for (const s of state.pendingSpawns) s.delay -= dt;
  while (state.pendingSpawns.length && state.pendingSpawns[0].delay <= 0) {
    const next = state.pendingSpawns.shift();
    spawnEnemy(state, next.id);
  }
}

// ---------- Lane movement + combat ----------
function nearestInRange(list, x, maxRange) {
  let best = null, bestD = Infinity;
  for (const t of list) {
    const d = Math.abs(t.x - x);
    if (d <= maxRange && d < bestD) { best = t; bestD = d; }
  }
  return best;
}

function updateUnits(state, dt) {
  for (const u of state.units) {
    u.cooldown -= dt;
    const aggroRange = Math.max(u.range * 2, CONTACT_RANGE * 1.5);
    const target = nearestInRange(state.enemies, u.x, aggroRange);
    if (target) {
      u.dir = target.x < u.x ? -1 : 1;
      const engageRange = u.melee || u.domain ? CONTACT_RANGE : u.range;
      if (Math.abs(target.x - u.x) > engageRange) {
        u.x += u.dir * u.speed * dt;
      } else if (u.cooldown <= 0) {
        fireAttacker(state, u, target, state.enemies);
        u.cooldown = 1 / u.fireRate;
      }
    } else {
      const towardSpawn = state.map.spawn.x < state.map.base.x ? -1 : 1;
      u.dir = towardSpawn;
      const limit = state.map.spawn.x - towardSpawn * 10;
      if (Math.abs(u.x - state.map.spawn.x) > CONTACT_RANGE) {
        u.x = towardSpawn < 0 ? Math.max(limit, u.x + towardSpawn * u.speed * dt) : Math.min(limit, u.x + towardSpawn * u.speed * dt);
      } else if (u.cooldown <= 0 && state.enemyBase.hp > 0) {
        // No teacher around — with no enemy left to fight, the unit
        // attacks the Teacher's Base itself instead of just idling next
        // to it, mirroring how a teacher attacks the player's base.
        fireAtEnemyBase(state, u);
        u.cooldown = 1 / u.fireRate;
      }
    }
  }
}

function updateEnemies(state, dt) {
  const base = state.map.base;
  for (const e of state.enemies) {
    const speedMul = e.slowUntil > state.t ? (e.slowMul || 0.5) : 1;
    const target = nearestInRange(state.units, e.x, CONTACT_RANGE * 1.5);
    e.attackCooldown -= dt;
    if (target) {
      e.dir = target.x < e.x ? -1 : 1;
      if (Math.abs(target.x - e.x) > CONTACT_RANGE) {
        e.x += e.dir * e.speed * speedMul * dt;
      } else if (e.attackCooldown <= 0) {
        e.attackCooldown = 0.8;
        applyDamageToUnit(state, target, e.damage);
      }
      continue;
    }
    const towardBase = base.x < e.x ? -1 : 1;
    e.dir = towardBase;
    if (Math.abs(e.x - base.x) > CONTACT_RANGE) {
      e.x += towardBase * e.speed * speedMul * dt;
    } else if (e.attackCooldown <= 0) {
      e.attackCooldown = 0.7;
      base.hp = Math.max(0, base.hp - e.damage);
      audio.playBaseHit();
      pushEffect(state, { kind: 'text', text: `-${e.damage}`, x: base.x, y: e.y - 18, color: '#ff6f6f', start: state.t, duration: 0.5, big: true });
    }
  }
}

function applyDamageToUnit(state, unit, amount) {
  unit.hp -= amount;
  pushEffect(state, { kind: 'text', text: `${Math.round(amount)}`, x: unit.x, y: unit.y - 20, color: '#ffb0b0', start: state.t, duration: 0.4 });
  if (unit.hp <= 0) {
    const idx = state.units.indexOf(unit);
    if (idx !== -1) state.units.splice(idx, 1);
    pushEffect(state, { kind: 'death', x: unit.x, y: unit.y, color: unit.color, start: state.t, duration: 0.35 });
  }
}

// ---------- Combat helpers (shared by every deployed unit) ----------
function pushEffect(state, effect) { state.effects.push(effect); }

function applyDamage(state, enemy, amount) {
  enemy.hp -= amount;
  pushEffect(state, { kind: 'text', text: `${Math.round(amount)}`, x: enemy.x + (Math.random() * 12 - 6), y: enemy.y - enemy.size, color: '#fff6ea', start: state.t, duration: 0.5 });
  if (enemy.hp <= 0) killEnemy(state, enemy);
}

function killEnemy(state, enemy) {
  const idx = state.enemies.indexOf(enemy);
  if (idx === -1) return;
  state.enemies.splice(idx, 1);
  state.gold += enemy.reward;
  pushEffect(state, { kind: 'death', x: enemy.x, y: enemy.y, color: enemy.color, start: state.t, duration: 0.35 });
  pushEffect(state, { kind: 'text', text: `+${enemy.reward}📄`, x: enemy.x, y: enemy.y - 14, color: '#ffd670', start: state.t, duration: 0.7 });
  audio.playEnemyDeath();
}

function fireAttacker(state, u, target, enemyList) {
  u.attackFlashUntil = state.t + 0.12;
  if (u.domain) return fireDomain(state, u, enemyList);
  if (u.melee) return fireMelee(state, u, enemyList);
  fireProjectile(state, u, target);
}

function fireDomain(state, u, enemyList) {
  pushEffect(state, { kind: 'domain', x: u.x, y: u.y, radius: u.range, color: u.color, start: state.t, duration: 0.9 });
  audio.playDomainExpansion();
  for (const e of [...enemyList]) {
    if (Math.abs(e.x - u.x) <= u.range) applyDamage(state, e, u.damage);
  }
}

function fireMelee(state, u, enemyList) {
  const splash = u.splash || CONTACT_RANGE;
  // A punch spark at the point of contact (in front of the unit, toward
  // whichever way it's facing) instead of a plain ring centered on the
  // attacker — reads as an actual thrown hit rather than a generic AoE.
  pushEffect(state, { kind: 'punch', x: u.x + u.dir * 18, y: u.y - 8, color: '#fff6ea', start: state.t, duration: 0.2 });
  audio.playFireShot(0.7);
  for (const e of [...enemyList]) {
    if (Math.abs(e.x - u.x) <= splash) applyDamage(state, e, u.damage);
  }
}

// A direct hit on the Teacher's Base itself, for a unit that has no
// living teacher left to fight — deals the unit's own damage straight to
// the base's HP, same punch effect as hitting a teacher.
function fireAtEnemyBase(state, u) {
  u.attackFlashUntil = state.t + 0.12;
  const amount = u.damage;
  state.enemyBase.hp = Math.max(0, state.enemyBase.hp - amount);
  pushEffect(state, { kind: 'punch', x: u.x + u.dir * 18, y: u.y - 8, color: '#fff6ea', start: state.t, duration: 0.2 });
  pushEffect(state, { kind: 'text', text: `${Math.round(amount)}`, x: state.map.spawn.x, y: u.y - 30, color: '#fff6ea', start: state.t, duration: 0.5 });
  audio.playFireShot(0.7);
}

function fireProjectile(state, u, target) {
  audio.playFireShot(u.pierce > 1 ? 1.3 : 1);
  const angle = Math.atan2(target.y - u.y, target.x - u.x);
  state.projectiles.push({
    x: u.x, y: u.y, angle,
    speed: u.projectileSpeed || 520,
    damage: u.damage,
    color: u.color,
    splash: u.splash || 0,
    pierce: u.pierce || 1,
    slowMul: u.slowMul,
    slowDuration: u.slowDuration,
    hitUids: new Set(),
    life: 2,
  });
}

function updateProjectiles(state, dt) {
  const list = state.projectiles;
  for (let i = list.length - 1; i >= 0; i--) {
    const pr = list[i];
    pr.life -= dt;
    pr.x += Math.cos(pr.angle) * pr.speed * dt;
    pr.y += Math.sin(pr.angle) * pr.speed * dt;
    if (pr.life <= 0 || pr.x < -60 || pr.x > 1020 || pr.y < -60 || pr.y > 660) {
      list.splice(i, 1);
      continue;
    }
    let removed = false;
    for (const e of state.enemies) {
      if (pr.hitUids.has(e.uid)) continue;
      if (Math.hypot(e.x - pr.x, e.y - pr.y) <= e.size * 0.9 + 5) {
        pr.hitUids.add(e.uid);
        if (pr.splash > 0) {
          pushEffect(state, { kind: 'impact', x: e.x, y: e.y, radius: pr.splash, color: pr.color, start: state.t, duration: 0.3 });
          for (const other of [...state.enemies]) {
            if (Math.abs(other.x - e.x) <= pr.splash) {
              applyDamage(state, other, pr.damage);
              if (pr.slowMul) { other.slowUntil = state.t + pr.slowDuration; other.slowMul = pr.slowMul; }
            }
          }
        } else {
          applyDamage(state, e, pr.damage);
          if (pr.slowMul) { e.slowUntil = state.t + pr.slowDuration; e.slowMul = pr.slowMul; }
        }
        if (pr.hitUids.size >= pr.pierce) { list.splice(i, 1); removed = true; }
        break;
      }
    }
    if (removed) continue;
  }
}

function pruneEffects(state) {
  state.effects = state.effects.filter(e => state.t < e.start + e.duration + 0.05);
}

export function update(state, dtRaw) {
  if (state.screen !== 'playing') return;
  const dt = dtRaw * state.speed;
  state.t += dt;

  // A steady trickle of homework pages while a battle is on, on top of
  // kill rewards, so you're never just waiting on gold to deploy.
  state.gold += PASSIVE_GOLD_PER_SEC * dt;

  updateDeployCooldowns(state, dt);
  updateSpawns(state, dt);
  updateUnits(state, dt);
  updateEnemies(state, dt);
  updateProjectiles(state, dt);
  pruneEffects(state);

  if (state.base.hp <= 0) {
    state.screen = 'gameover';
    audio.playDefeat();
    return;
  }

  // Destroying the Teacher's Base is an instant win, on top of the usual
  // "survive all the waves" victory below — an alternate, faster way to
  // clear a level by pushing into their base instead of just holding out.
  if (state.enemyBase.hp <= 0) {
    state.screen = 'victory';
    audio.playVictory();
    return;
  }

  if (state.waveActive && !state.pendingSpawns.length && !state.enemies.length) {
    state.waveActive = false;
    if (state.wave >= TOTAL_WAVES) {
      state.screen = 'victory';
      audio.playVictory();
    } else if (state.autoWave) {
      startNextWave(state);
    }
  }
}
