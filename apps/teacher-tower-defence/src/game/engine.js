import { PATH_TOTAL_LENGTH, pointAtDistance, TOWER_SLOTS } from '../data/path.js';
import { TEACHERS, teacherLevelStats } from '../data/teachers.js';
import { ENEMIES } from '../data/enemies.js';
import { TOTAL_WAVES, buildWaveSpawns, statScaleForWave } from '../data/waves.js';
import * as audio from '../audio/audioEngine.js';

export const STARTING_GOLD = 220;
export const STARTING_HP = 20;

export function createGameState() {
  return {
    screen: 'title',
    gold: STARTING_GOLD,
    baseHp: STARTING_HP,
    baseMaxHp: STARTING_HP,
    wave: 0,
    waveActive: false,
    pendingSpawns: [],
    enemies: [],
    towers: [],
    effects: [],
    projectiles: [],
    selectedShopType: null,
    selectedTowerSlot: null,
    speed: 1,
    autoWave: false,
    t: 0,
    nextUid: 1,
    hoverSlot: null,
    lastWaveScale: statScaleForWave(1),
  };
}

function occupiedSlotIds(state) {
  return new Set(state.towers.map(tw => tw.slotId));
}
export { occupiedSlotIds };

export function slotAt(id) {
  return TOWER_SLOTS.find(s => s.id === id);
}

// ---------- Placement / economy ----------
export function canAfford(state, cost) {
  return state.gold >= cost;
}

export function placeTower(state, slotId, teacherId) {
  const def = TEACHERS[teacherId];
  if (!def) return false;
  if (def.maxCount && state.towers.filter(t => t.typeId === teacherId).length >= def.maxCount) return false;
  if (occupiedSlotIds(state).has(slotId)) return false;
  if (!canAfford(state, def.cost)) return false;
  const slot = slotAt(slotId);
  if (!slot) return false;

  const stats = teacherLevelStats(teacherId, 0);
  state.gold -= def.cost;
  state.towers.push({
    uid: state.nextUid++,
    slotId,
    typeId: teacherId,
    x: slot.x,
    y: slot.y,
    level: 0,
    color: def.color,
    glow: def.glow,
    cooldown: 0,
    attackFlashUntil: 0,
    ...stats,
  });
  audio.playPlaceTower();
  return true;
}

export function upgradeTower(state, uid) {
  const tower = state.towers.find(t => t.uid === uid);
  if (!tower) return false;
  const def = TEACHERS[tower.typeId];
  const nextLevel = tower.level + 1;
  if (nextLevel >= def.levels.length) return false;
  const nextStats = def.levels[nextLevel];
  if (!canAfford(state, nextStats.cost)) return false;
  state.gold -= nextStats.cost;
  tower.level = nextLevel;
  Object.assign(tower, teacherLevelStats(tower.typeId, nextLevel));
  audio.playUpgrade();
  return true;
}

export function sellTower(state, uid) {
  const idx = state.towers.findIndex(t => t.uid === uid);
  if (idx === -1) return false;
  const tower = state.towers[idx];
  const def = TEACHERS[tower.typeId];
  let spent = def.cost;
  for (let i = 1; i <= tower.level; i++) spent += def.levels[i].cost;
  state.gold += Math.round(spent * 0.6);
  state.towers.splice(idx, 1);
  audio.playClick();
  return true;
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
  const def = ENEMIES[typeId];
  const scale = state.lastWaveScale;
  const p = pointAtDistance(0);
  state.enemies.push({
    uid: state.nextUid++,
    typeId,
    x: p.x, y: p.y, angle: p.angle,
    dist: 0,
    hp: Math.round(def.hp * scale.hpMul),
    maxHp: Math.round(def.hp * scale.hpMul),
    speed: def.speed * scale.speedMul,
    baseSpeed: def.speed * scale.speedMul,
    size: def.size,
    color: def.color,
    glow: def.glow,
    reward: Math.round(def.reward * scale.rewardMul),
    damage: def.damage,
    boss: !!def.boss,
    evasive: def.evasive || 0,
    slowUntil: 0,
  });
}

// ---------- Per-frame simulation ----------
function updateSpawns(state, dt) {
  if (!state.pendingSpawns.length) return;
  for (const s of state.pendingSpawns) s.delay -= dt;
  while (state.pendingSpawns.length && state.pendingSpawns[0].delay <= 0) {
    const next = state.pendingSpawns.shift();
    spawnEnemy(state, next.id);
  }
}

function updateEnemies(state, dt) {
  for (let i = state.enemies.length - 1; i >= 0; i--) {
    const e = state.enemies[i];
    const speedMul = e.slowUntil > state.t ? (e.slowMul || 0.5) : 1;
    e.dist += e.speed * speedMul * dt;
    if (e.dist >= PATH_TOTAL_LENGTH) {
      state.baseHp = Math.max(0, state.baseHp - e.damage);
      audio.playBaseHit();
      pushEffect(state, { kind: 'text', text: `-${e.damage}`, x: e.x, y: e.y, color: '#ff6f6f', start: state.t, duration: 0.6, big: true });
      state.enemies.splice(i, 1);
      continue;
    }
    const p = pointAtDistance(e.dist);
    e.x = p.x; e.y = p.y; e.angle = p.angle;
  }
}

function findTarget(state, tower) {
  let best = null, bestDist = -1;
  for (const e of state.enemies) {
    const d = Math.hypot(e.x - tower.x, e.y - tower.y);
    if (d <= tower.range && e.dist > bestDist) { best = e; bestDist = e.dist; }
  }
  return best;
}

function pushEffect(state, effect) {
  state.effects.push(effect);
}

function applyDamage(state, enemy, amount, tower) {
  enemy.hp -= amount;
  pushEffect(state, { kind: 'text', text: `${Math.round(amount)}`, x: enemy.x + (Math.random() * 12 - 6), y: enemy.y - enemy.size, color: '#fff6ea', start: state.t, duration: 0.5 });
  if (enemy.hp <= 0) {
    killEnemy(state, enemy);
  }
}

function killEnemy(state, enemy) {
  const idx = state.enemies.indexOf(enemy);
  if (idx === -1) return;
  state.enemies.splice(idx, 1);
  state.gold += enemy.reward;
  pushEffect(state, { kind: 'death', x: enemy.x, y: enemy.y, color: enemy.color, start: state.t, duration: 0.35 });
  pushEffect(state, { kind: 'text', text: `+${enemy.reward}⭐`, x: enemy.x, y: enemy.y - 14, color: '#ffd670', start: state.t, duration: 0.7 });
  audio.playEnemyDeath();
}

function fireTower(state, tower) {
  const target = findTarget(state, tower);
  if (!target) return;
  tower.attackFlashUntil = state.t + 0.12;

  if (tower.domain) {
    fireDomain(state, tower);
    return;
  }
  if (tower.melee) {
    fireMelee(state, tower, target);
    return;
  }
  fireProjectile(state, tower, target);
}

function fireDomain(state, tower) {
  pushEffect(state, { kind: 'domain', x: tower.x, y: tower.y, radius: tower.range, color: tower.color, start: state.t, duration: 0.9 });
  audio.playDomainExpansion();
  for (const e of [...state.enemies]) {
    if (Math.hypot(e.x - tower.x, e.y - tower.y) <= tower.range) {
      applyDamage(state, e, tower.damage, tower);
    }
  }
}

function fireMelee(state, tower, target) {
  pushEffect(state, { kind: 'impact', x: tower.x, y: tower.y, radius: tower.range, color: tower.glow, start: state.t, duration: 0.3 });
  audio.playFireShot(0.7);
  for (const e of [...state.enemies]) {
    if (Math.hypot(e.x - tower.x, e.y - tower.y) <= tower.splash) {
      applyDamage(state, e, tower.damage, tower);
    }
  }
}

function fireProjectile(state, tower, target) {
  audio.playFireShot(tower.typeId === 'math' ? 1.3 : 1);
  const angle = Math.atan2(target.y - tower.y, target.x - tower.x);
  state.projectiles.push({
    x: tower.x, y: tower.y, angle,
    speed: tower.projectileSpeed,
    damage: tower.damage,
    color: tower.color,
    splash: tower.splash,
    pierce: tower.pierce || 1,
    slowMul: tower.slowMul,
    slowDuration: tower.slowDuration,
    targetUid: target.uid,
    hitUids: new Set(),
    life: 2,
  });
}

function updateProjectiles(state, dt) {
  const list = state.projectiles;
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.life -= dt;
    p.x += Math.cos(p.angle) * p.speed * dt;
    p.y += Math.sin(p.angle) * p.speed * dt;
    let removed = false;
    if (p.life <= 0 || p.x < -60 || p.x > 1020 || p.y < -60 || p.y > 660) {
      list.splice(i, 1);
      continue;
    }
    for (const e of state.enemies) {
      if (p.hitUids.has(e.uid)) continue;
      if (Math.hypot(e.x - p.x, e.y - p.y) <= e.size * 0.9 + 5) {
        p.hitUids.add(e.uid);
        if (p.splash > 0) {
          pushEffect(state, { kind: 'impact', x: e.x, y: e.y, radius: p.splash, color: p.color, start: state.t, duration: 0.3 });
          for (const other of [...state.enemies]) {
            if (Math.hypot(other.x - e.x, other.y - e.y) <= p.splash) {
              applyDamage(state, other, p.damage, null);
              if (p.slowMul) { other.slowUntil = state.t + p.slowDuration; other.slowMul = p.slowMul; }
            }
          }
        } else {
          applyDamage(state, e, p.damage, null);
          if (p.slowMul) { e.slowUntil = state.t + p.slowDuration; e.slowMul = p.slowMul; }
        }
        if (p.hitUids.size >= p.pierce) { list.splice(i, 1); removed = true; }
        break;
      }
    }
    if (removed) continue;
  }
}

function updateTowers(state, dt) {
  for (const tower of state.towers) {
    tower.cooldown -= dt;
    if (tower.cooldown <= 0) {
      const target = findTarget(state, tower);
      if (target) {
        fireTower(state, tower);
        tower.cooldown = 1 / tower.fireRate;
      }
    }
  }
}

function pruneEffects(state) {
  state.effects = state.effects.filter(e => state.t < e.start + e.duration + 0.05);
}

export function update(state, dtRaw) {
  if (state.screen !== 'playing') return;
  const dt = dtRaw * state.speed;
  state.t += dt;

  updateSpawns(state, dt);
  updateEnemies(state, dt);
  updateTowers(state, dt);
  updateProjectiles(state, dt);
  pruneEffects(state);

  if (state.baseHp <= 0) {
    state.screen = 'gameover';
    audio.playDefeat();
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
