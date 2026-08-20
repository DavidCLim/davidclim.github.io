import { el, clearChildren } from './util/dom.js';
import { createCanvasSurface } from './core/canvas.js';
import { drawMap, drawTowerSlots } from './render/drawMap.js';
import { drawTeacher, drawTeacherGhost } from './render/drawTeacher.js';
import { drawEnemy } from './render/drawEnemy.js';
import { drawEffect, drawProjectile } from './render/drawEffects.js';
import { TEACHER_LIST, TEACHERS, teacherLevelStats } from './data/teachers.js';
import { TOTAL_WAVES } from './data/waves.js';
import { TOWER_SLOTS } from './data/path.js';
import {
  createGameState, update, startNextWave, placeTower, upgradeTower, sellTower,
  occupiedSlotIds, canAfford, slotAt,
} from './game/engine.js';
import * as audio from './audio/audioEngine.js';

const root = document.getElementById('game-root');

document.addEventListener('click', () => {
  audio.ensureAudioContext();
}, { capture: true, once: false });

let state = createGameState();

const surface = createCanvasSurface(root);
const { canvas, ctx } = surface;
canvas.classList.add('ttd-canvas');

// ---------- HUD ----------
const goldValue = el('span', { class: 'ttd-stat-value' }, String(state.gold));
const waveValue = el('span', { class: 'ttd-stat-value' }, `0 / ${TOTAL_WAVES}`);
const heartsWrap = el('div', { class: 'ttd-hearts' });
const waveBtn = el('button', { class: 'btn ttd-wave-btn', text: 'Start Wave 1', onClick: () => {
  if (startNextWave(state)) refreshHud();
} });
const speedBtn = el('button', { class: 'btn ttd-speed-btn', text: '1x', onClick: () => {
  state.speed = state.speed === 1 ? 2 : 1;
  speedBtn.textContent = state.speed + 'x';
} });
const autoBtn = el('button', { class: 'btn ttd-auto-btn', text: 'Auto: Off', onClick: () => {
  state.autoWave = !state.autoWave;
  autoBtn.textContent = 'Auto: ' + (state.autoWave ? 'On' : 'Off');
  autoBtn.classList.toggle('active', state.autoWave);
} });
const muteBtn = el('button', { class: 'btn ttd-mute-btn', text: '🔊', onClick: () => {
  soundOn = !soundOn;
  audio.setMusicEnabled(soundOn);
  audio.setSfxEnabled(soundOn);
  muteBtn.textContent = soundOn ? '🔊' : '🔇';
} });
let soundOn = true;

const hud = el('div', { class: 'ttd-hud hidden' }, [
  el('div', { class: 'ttd-stat ttd-stat-gold' }, [el('span', { class: 'ttd-stat-icon' }, '⭐'), goldValue]),
  el('div', { class: 'ttd-stat ttd-stat-wave' }, [el('span', { class: 'ttd-stat-icon' }, '📖'), waveValue]),
  heartsWrap,
  el('div', { class: 'ttd-hud-controls' }, [waveBtn, speedBtn, autoBtn, muteBtn]),
]);
root.appendChild(hud);

function refreshHearts() {
  clearChildren(heartsWrap);
  const pct = state.baseHp / state.baseMaxHp;
  const cls = pct > 0.5 ? '' : pct > 0.2 ? ' ttd-hearts-warn' : ' ttd-hearts-crit';
  heartsWrap.className = 'ttd-hearts' + cls;
  heartsWrap.appendChild(el('span', { class: 'ttd-stat-icon' }, '❤️'));
  heartsWrap.appendChild(el('span', { class: 'ttd-stat-value' }, `${state.baseHp} / ${state.baseMaxHp}`));
}

function refreshHud() {
  goldValue.textContent = state.gold.toLocaleString();
  waveValue.textContent = `${state.wave} / ${TOTAL_WAVES}`;
  refreshHearts();
  waveBtn.disabled = state.waveActive || state.wave >= TOTAL_WAVES;
  waveBtn.textContent = state.waveActive ? 'Wave in progress…' : (state.wave >= TOTAL_WAVES ? 'Final wave cleared' : `Start Wave ${state.wave + 1}`);
  refreshShop();
}

// ---------- Shop ----------
const shopButtons = {};
const shop = el('div', { class: 'ttd-shop hidden' });
for (const teacher of TEACHER_LIST) {
  const iconDot = el('span', { class: 'ttd-shop-dot', style: `background:${teacher.color}` });
  const btn = el('button', {
    class: 'ttd-shop-item',
    onClick: () => {
      state.selectedTowerSlot = null;
      state.selectedShopType = state.selectedShopType === teacher.id ? null : teacher.id;
      refreshShop();
    },
  }, [
    iconDot,
    el('div', { class: 'ttd-shop-info' }, [
      el('div', { class: 'ttd-shop-name' }, teacher.name),
      el('div', { class: 'ttd-shop-cost' }, `${teacher.cost}⭐`),
    ]),
  ]);
  shopButtons[teacher.id] = btn;
  shop.appendChild(btn);
}
root.appendChild(shop);

function refreshShop() {
  for (const teacher of TEACHER_LIST) {
    const btn = shopButtons[teacher.id];
    const capped = teacher.maxCount && state.towers.filter(t => t.typeId === teacher.id).length >= teacher.maxCount;
    const affordable = canAfford(state, teacher.cost);
    btn.classList.toggle('selected', state.selectedShopType === teacher.id);
    btn.classList.toggle('disabled', capped || !affordable);
    btn.disabled = capped || !affordable;
    btn.title = capped ? 'Only one Principal per campus' : teacher.desc;
  }
}

// ---------- Tower info / upgrade popup ----------
const popup = el('div', { class: 'ttd-popup hidden' });
root.appendChild(popup);

function refreshPopup() {
  clearChildren(popup);
  const tower = state.towers.find(t => t.uid === state.selectedTowerSlot);
  if (!tower) { popup.classList.add('hidden'); return; }
  const def = TEACHERS[tower.typeId];
  const nextLevel = tower.level + 1;
  const hasNext = nextLevel < def.levels.length;
  const nextCost = hasNext ? def.levels[nextLevel].cost : null;
  let sellValue = def.cost;
  for (let i = 1; i <= tower.level; i++) sellValue += def.levels[i].cost;
  sellValue = Math.round(sellValue * 0.6);

  popup.style.setProperty('--ttd-popup-x', `${(tower.x / 960) * 100}%`);
  popup.style.setProperty('--ttd-popup-y', `${(tower.y / 600) * 100}%`);
  popup.appendChild(el('div', { class: 'ttd-popup-title' }, `${def.name} · Lv.${tower.level + 1}`));
  popup.appendChild(el('div', { class: 'ttd-popup-stats' }, `DMG ${Math.round(tower.damage)} · RNG ${Math.round(tower.range)} · RATE ${tower.fireRate.toFixed(1)}/s`));
  const row = el('div', { class: 'ttd-popup-row' });
  if (hasNext) {
    row.appendChild(el('button', {
      class: 'btn btn-primary',
      text: `Upgrade (${nextCost}⭐)`,
      disabled: !canAfford(state, nextCost) ? 'disabled' : undefined,
      onClick: () => { if (upgradeTower(state, tower.uid)) refreshAll(); },
    }));
  } else {
    row.appendChild(el('div', { class: 'ttd-popup-max' }, 'Max level'));
  }
  row.appendChild(el('button', { class: 'btn ttd-sell-btn', text: `Sell (${sellValue}⭐)`, onClick: () => {
    sellTower(state, tower.uid);
    state.selectedTowerSlot = null;
    refreshAll();
  } }));
  popup.appendChild(row);
  popup.appendChild(el('button', { class: 'ttd-popup-close', text: '✕', onClick: () => { state.selectedTowerSlot = null; refreshAll(); } }));
  popup.classList.remove('hidden');
}

function refreshAll() {
  refreshHud();
  refreshPopup();
}

// ---------- Canvas interaction ----------
function slotUnderPoint(px, py) {
  for (const slot of TOWER_SLOTS) {
    if (Math.hypot(slot.x - px, slot.y - py) <= 26) return slot;
  }
  return null;
}
function towerUnderPoint(px, py) {
  for (const tower of state.towers) {
    if (Math.hypot(tower.x - px, tower.y - py) <= 20) return tower;
  }
  return null;
}

canvas.addEventListener('mousemove', (e) => {
  if (state.screen !== 'playing') return;
  const { x, y } = surface.clientToLogical(e.clientX, e.clientY);
  const slot = slotUnderPoint(x, y);
  state.hoverSlot = slot ? slot.id : null;
});
canvas.addEventListener('mouseleave', () => { state.hoverSlot = null; });

canvas.addEventListener('click', (e) => {
  if (state.screen !== 'playing') return;
  const { x, y } = surface.clientToLogical(e.clientX, e.clientY);

  if (state.selectedShopType) {
    const slot = slotUnderPoint(x, y);
    if (slot && !occupiedSlotIds(state).has(slot.id)) {
      if (placeTower(state, slot.id, state.selectedShopType)) {
        state.selectedShopType = null;
        refreshAll();
        return;
      }
    }
    state.selectedShopType = null;
    refreshShop();
    return;
  }

  const tower = towerUnderPoint(x, y);
  state.selectedTowerSlot = tower ? tower.uid : null;
  refreshPopup();
});

// ---------- Title / Game Over / Victory screens ----------
const titleScreen = el('div', { class: 'ttd-title-screen' }, [
  el('div', { class: 'ttd-title-card' }, [
    el('div', { class: 'ttd-title-emblem' }, '🎓'),
    el('h1', { class: 'ttd-title' }, 'TEACHER TOWER DEFENCE'),
    el('p', { class: 'ttd-subtitle' }, 'Cursed homework is pouring out of the portal. Deploy your faculty, defend the Faculty Lounge, survive 15 waves.'),
    el('button', { class: 'btn btn-primary ttd-start-btn', text: '▶ Start Campaign', onClick: startGame }),
    el('div', { class: 'ttd-howto' }, [
      el('div', {}, '🎓 Pick a teacher from the roster, tap a glowing circle to deploy.'),
      el('div', {}, '⭐ Earn Gold Stars for every cursed paper you clear.'),
      el('div', {}, '❤️ Don\'t let anything reach the Faculty Lounge.'),
    ]),
  ]),
]);
root.appendChild(titleScreen);

const endScreen = el('div', { class: 'ttd-end-screen hidden' });
root.appendChild(endScreen);

function startGame() {
  state = createGameState();
  state.screen = 'playing';
  audio.ensureAudioContext();
  audio.startMusic();
  titleScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  hud.classList.remove('hidden');
  shop.classList.remove('hidden');
  refreshAll();
}

function showEndScreen() {
  const win = state.screen === 'victory';
  clearChildren(endScreen);
  endScreen.className = 'ttd-end-screen' + (win ? ' ttd-victory' : ' ttd-defeat');
  endScreen.appendChild(el('div', { class: 'ttd-end-card' }, [
    el('div', { class: 'ttd-end-emblem' }, win ? '🏆' : '💀'),
    el('h2', { class: 'ttd-end-title' }, win ? 'Campus Saved!' : 'The Faculty Lounge Has Fallen'),
    el('p', { class: 'ttd-end-sub' }, win
      ? `You held the line through all ${TOTAL_WAVES} waves. The homework has been graded.`
      : `You made it to Wave ${state.wave}. Detention for everyone — try again?`),
    el('button', { class: 'btn btn-primary', text: 'Play Again', onClick: startGame }),
  ]));
  endScreen.classList.remove('hidden');
  hud.classList.add('hidden');
  shop.classList.add('hidden');
  popup.classList.add('hidden');
}

// ---------- Render loop ----------
let lastTime = performance.now();
let renderT = 0;
let lastScreen = null;

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  renderT += dt;

  update(state, dt);

  if (state.screen !== lastScreen) {
    if (state.screen === 'gameover' || state.screen === 'victory') {
      audio.stopMusic();
      showEndScreen();
    }
    lastScreen = state.screen;
  }
  if (state.screen === 'playing') refreshAll();

  ctx.clearRect(0, 0, 960, 600);
  drawMap(ctx, renderT);

  if (state.screen === 'playing' || state.screen === 'gameover' || state.screen === 'victory') {
    const canPlaceSelected = state.selectedShopType
      ? canAfford(state, TEACHERS[state.selectedShopType].cost)
        && !(TEACHERS[state.selectedShopType].maxCount && state.towers.filter(t => t.typeId === state.selectedShopType).length >= TEACHERS[state.selectedShopType].maxCount)
      : true;
    if (state.selectedShopType) {
      drawTowerSlots(ctx, occupiedSlotIds(state), state.hoverSlot, canPlaceSelected, renderT);
    }
    for (const tower of state.towers) {
      tower.selected = tower.uid === state.selectedTowerSlot;
      drawTeacher(ctx, tower, state.t);
    }
    if (state.selectedShopType && state.hoverSlot && !occupiedSlotIds(state).has(state.hoverSlot)) {
      const slot = slotAt(state.hoverSlot);
      drawTeacherGhost(ctx, slot.x, slot.y, state.selectedShopType, TEACHERS[state.selectedShopType].color);
    }
    for (const enemy of state.enemies) drawEnemy(ctx, enemy, state.t);
    for (const p of state.projectiles) drawProjectile(ctx, p);
    for (const eff of state.effects) drawEffect(ctx, eff, state.t);
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
