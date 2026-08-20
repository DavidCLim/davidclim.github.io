import { el, clearChildren } from './util/dom.js';
import { createCanvasSurface } from './core/canvas.js';
import { drawMap, drawTowerSlots } from './render/drawMap.js';
import { drawTeacher, drawTeacherGhost } from './render/drawTeacher.js';
import { drawEnemy } from './render/drawEnemy.js';
import { drawEffect, drawProjectile } from './render/drawEffects.js';
import { drawHallway } from './render/drawHallway.js';
import { drawBuilding } from './render/drawBuilding.js';
import { drawStudent } from './render/drawStudent.js';
import { TEACHER_LIST, TEACHERS } from './data/teachers.js';
import { TOTAL_WAVES } from './data/waves.js';
import { TOWER_SLOTS } from './data/path.js';
import { GACHA_BUILDING, DUNGEON_BUILDING } from './data/campusMap.js';
import { createCampusState, updateCampus } from './game/campus.js';
import {
  createGameState, update, startNextWave, placeTower, upgradeTower, sellTower,
  occupiedSlotIds, canAfford, slotAt,
} from './game/engine.js';
import * as audio from './audio/audioEngine.js';

const root = document.getElementById('game-root');

const GACHA_STYLE = { wallColor: '#5a3f28', roofColor: '#7a2e2e', doorColor: '#3c2a1a', accent: '#ffb454', glow: '#ffd670', label: 'GACHA HALL', icon: '🎰' };
const DUNGEON_STYLE = { wallColor: '#3c2a1a', roofColor: '#2c1e10', doorColor: '#241708', accent: '#5fe3c0', glow: '#8fe9d9', label: 'DUNGEON GATE', icon: '🗺️' };

document.addEventListener('click', () => {
  audio.ensureAudioContext();
}, { capture: true, once: false });

// `screen` is the single source of truth for which mode is active
// ('title' | 'lobby' | 'playing' | 'gameover' | 'victory') — deliberately
// its own variable rather than living on the tower-defense `state` object,
// since the lobby is a wholly separate system with its own state and
// shouldn't need engine.js's createGameState() just to exist.
let screen = 'title';
let state = createGameState();
let lobby = createCampusState();
const titleLobby = createCampusState(); // static backdrop behind the title card

const surface = createCanvasSurface(root);
const { canvas, ctx } = surface;
canvas.classList.add('ttd-canvas');

// ---------- HUD (tower-defense battle) ----------
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

// ---------- Canvas interaction (tower-defense battle) ----------
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
  if (screen !== 'playing') return;
  const { x, y } = surface.clientToLogical(e.clientX, e.clientY);
  const slot = slotUnderPoint(x, y);
  state.hoverSlot = slot ? slot.id : null;
});
canvas.addEventListener('mouseleave', () => { state.hoverSlot = null; });

canvas.addEventListener('click', (e) => {
  if (screen === 'lobby') {
    if (lobby.nearTrigger) openBuildingModal(lobby.nearTrigger);
    return;
  }
  if (screen !== 'playing') return;
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

// ---------- Campus keyboard controls ----------
const CAMPUS_KEY_MAP = {
  w: 'up', arrowup: 'up',
  s: 'down', arrowdown: 'down',
  a: 'left', arrowleft: 'left',
  d: 'right', arrowright: 'right',
};
window.addEventListener('keydown', (evt) => {
  if (screen !== 'lobby') return;
  const k = evt.key.toLowerCase();
  if (k === 'e') {
    if (lobby.nearTrigger) openBuildingModal(lobby.nearTrigger);
    return;
  }
  const action = CAMPUS_KEY_MAP[k];
  if (action) { lobby.keys[action] = true; evt.preventDefault(); }
});
window.addEventListener('keyup', (evt) => {
  const k = evt.key.toLowerCase();
  const action = CAMPUS_KEY_MAP[k];
  if (action) lobby.keys[action] = false;
});

// ---------- Campus touch joystick ----------
// The exact same on-screen joystick Hyper Fishies uses for touch
// movement (see that project's core/input.js) — a base circle you drag a
// knob within, normalized to a unit vector.
const joyWrap = el('div', { class: 'ttd-touch-controls hidden' });
const joyBase = el('div', { class: 'joy-base' });
const joyKnob = el('div', { class: 'joy-knob' });
joyBase.appendChild(joyKnob);
joyWrap.appendChild(joyBase);
root.appendChild(joyWrap);

const JOY_RADIUS = 36;
let joyTouchId = null;
let joyBaseRect = null;
function setKnob(dx, dy) { joyKnob.style.transform = `translate(${dx * JOY_RADIUS}px, ${dy * JOY_RADIUS}px)`; }
function updateJoy(clientX, clientY) {
  if (!joyBaseRect) return;
  const cx = joyBaseRect.left + joyBaseRect.width / 2;
  const cy = joyBaseRect.top + joyBaseRect.height / 2;
  let dx = (clientX - cx) / JOY_RADIUS;
  let dy = (clientY - cy) / JOY_RADIUS;
  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }
  lobby.joystick.dx = dx;
  lobby.joystick.dy = dy;
  setKnob(dx, dy);
}
joyBase.addEventListener('touchstart', (e) => {
  e.preventDefault();
  const t = e.changedTouches[0];
  joyTouchId = t.identifier;
  joyBaseRect = joyBase.getBoundingClientRect();
  lobby.joystick.active = true;
  updateJoy(t.clientX, t.clientY);
}, { passive: false });
window.addEventListener('touchmove', (e) => {
  for (const t of e.changedTouches) {
    if (t.identifier === joyTouchId) { e.preventDefault(); updateJoy(t.clientX, t.clientY); }
  }
}, { passive: false });
function endJoy(e) {
  for (const t of e.changedTouches) {
    if (t.identifier === joyTouchId) {
      joyTouchId = null;
      lobby.joystick.active = false;
      lobby.joystick.dx = 0; lobby.joystick.dy = 0;
      setKnob(0, 0);
    }
  }
}
window.addEventListener('touchend', endJoy);
window.addEventListener('touchcancel', endJoy);

// ---------- Campus UI (interact prompt, modal) ----------
const lobbyUi = el('div', { class: 'ttd-lobby-ui hidden' });
const interactPrompt = el('button', {
  class: 'ttd-interact-prompt hidden',
  onClick: () => { if (lobby.nearTrigger) openBuildingModal(lobby.nearTrigger); },
});
lobbyUi.appendChild(interactPrompt);
root.appendChild(lobbyUi);

function refreshLobbyUi() {
  if (lobby.nearTrigger) {
    interactPrompt.textContent = `${lobby.nearTrigger.icon} Enter ${lobby.nearTrigger.label}`;
    interactPrompt.classList.remove('hidden');
  } else {
    interactPrompt.classList.add('hidden');
  }
}

const buildingModal = el('div', { class: 'ttd-building-modal hidden' });
root.appendChild(buildingModal);

function openBuildingModal(trigger) {
  clearChildren(buildingModal);
  const copy = trigger.id === 'gacha'
    ? "Spin for new students to add to your roster. Nothing to summon just yet — check back once the unit roster is in."
    : "Pick a dungeon and take your equipped 5 students in to fight off the teachers. Maps are still being drawn up.";
  buildingModal.appendChild(el('div', { class: 'ttd-building-card' }, [
    el('div', { class: 'ttd-building-emblem' }, trigger.icon),
    el('h2', { class: 'ttd-building-title' }, trigger.label),
    el('p', { class: 'ttd-building-desc' }, copy),
    el('button', { class: 'btn btn-primary', text: 'Back to the courtyard', onClick: closeBuildingModal }),
  ]));
  buildingModal.classList.remove('hidden');
}
function closeBuildingModal() {
  buildingModal.classList.add('hidden');
}

// ---------- Title / Game Over / Victory screens ----------
const titleScreen = el('div', { class: 'ttd-title-screen' }, [
  el('div', { class: 'ttd-title-card' }, [
    el('div', { class: 'ttd-title-emblem' }, '🎓'),
    el('h1', { class: 'ttd-title' }, 'TEACHER TOWER DEFENCE'),
    el('p', { class: 'ttd-subtitle' }, 'Cursed teachers are pouring out of the portal. Recruit students, hold the courtyard, and don\'t let anything reach your desk.'),
    el('button', { class: 'btn btn-primary ttd-start-btn', text: '▶ Enter the Academy', onClick: enterLobby }),
    el('div', { class: 'ttd-howto' }, [
      el('div', {}, '🚶 Walk the halls — WASD or the joystick.'),
      el('div', {}, '🎰 Visit the Gacha Hall to recruit new students.'),
      el('div', {}, '🗺️ Visit the Dungeon Gate to pick a battlefield.'),
    ]),
  ]),
]);
root.appendChild(titleScreen);

const endScreen = el('div', { class: 'ttd-end-screen hidden' });
root.appendChild(endScreen);

function hideAllScreens() {
  titleScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  hud.classList.add('hidden');
  shop.classList.add('hidden');
  popup.classList.add('hidden');
  lobbyUi.classList.add('hidden');
  joyWrap.classList.add('hidden');
  buildingModal.classList.add('hidden');
}

const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

function enterLobby() {
  screen = 'lobby';
  lobby = createCampusState();
  hideAllScreens();
  lobbyUi.classList.remove('hidden');
  if (isTouchDevice) joyWrap.classList.remove('hidden');
  refreshLobbyUi();
}

function startGame() {
  screen = 'playing';
  state = createGameState();
  state.screen = 'playing';
  audio.ensureAudioContext();
  audio.startMusic();
  hideAllScreens();
  hud.classList.remove('hidden');
  shop.classList.remove('hidden');
  refreshAll();
}
void startGame; // kept for when the Dungeon Gate leads into a real battle

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
    el('button', { class: 'btn btn-primary', text: 'Back to the Academy', onClick: enterLobby }),
  ]));
  endScreen.classList.remove('hidden');
  hud.classList.add('hidden');
  shop.classList.add('hidden');
}

// ---------- Render loop ----------
let lastTime = performance.now();
let renderT = 0;
let lastScreen = null;

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  renderT += dt;

  if (screen === 'lobby') {
    updateCampus(lobby, dt);
    refreshLobbyUi();
  } else if (screen === 'playing') {
    update(state, dt);
    screen = state.screen === 'playing' ? 'playing' : state.screen;
  }

  if (screen !== lastScreen) {
    if (screen === 'gameover' || screen === 'victory') {
      audio.stopMusic();
      showEndScreen();
    }
    lastScreen = screen;
  }
  if (screen === 'playing') refreshAll();

  ctx.clearRect(0, 0, 960, 600);

  if (screen === 'lobby' || screen === 'title') {
    // The title card floats over the same campus hallway rather than the
    // tower-defense battle map — that map belongs to a screen this title
    // button doesn't even lead to yet, and would look like a mismatched
    // backdrop behind a now gold/wood-themed title card.
    if (screen === 'title') titleLobby.animTime = renderT * 0.4;
    drawHallway(ctx);
    drawBuilding(ctx, GACHA_BUILDING, GACHA_STYLE);
    drawBuilding(ctx, DUNGEON_BUILDING, DUNGEON_STYLE);
    drawStudent(ctx, screen === 'title' ? titleLobby : lobby);
  } else {
    drawMap(ctx, renderT);
    if (screen === 'playing' || screen === 'gameover' || screen === 'victory') {
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
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
