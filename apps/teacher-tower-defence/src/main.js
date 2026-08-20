import { el, clearChildren } from './util/dom.js';
import { createCanvasSurface } from './core/canvas.js';
import { drawMap, drawTowerSlots } from './render/drawMap.js';
import { drawTeacher, drawTeacherGhost } from './render/drawTeacher.js';
import { drawEnemy } from './render/drawEnemy.js';
import { drawEffect, drawProjectile } from './render/drawEffects.js';
import { renderLobbyView } from './render/raycast.js';
import { TEACHER_LIST, TEACHERS } from './data/teachers.js';
import { TOTAL_WAVES } from './data/waves.js';
import { TOWER_SLOTS } from './data/path.js';
import { TRIGGERS } from './data/lobbyMap.js';
import { createLobbyState, updateLobby, FOV, MOUSE_SENSITIVITY } from './game/lobby.js';
import {
  createGameState, update, startNextWave, placeTower, upgradeTower, sellTower,
  occupiedSlotIds, canAfford, slotAt,
} from './game/engine.js';
import * as audio from './audio/audioEngine.js';

const root = document.getElementById('game-root');

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
let lobby = createLobbyState();

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
  if (screen === 'playing') {
    const { x, y } = surface.clientToLogical(e.clientX, e.clientY);
    const slot = slotUnderPoint(x, y);
    state.hoverSlot = slot ? slot.id : null;
    return;
  }
  if (screen === 'lobby' && lobby.pointerLocked) {
    lobby.angle += e.movementX * MOUSE_SENSITIVITY;
  }
});
canvas.addEventListener('mouseleave', () => { state.hoverSlot = null; });

// Pointer Lock can fail for reasons that have nothing to do with this
// game (an embedding iframe without the `pointer-lock` permission, a
// browser setting, etc.) — if it does, fall back to keyboard-only turning
// (arrow keys, see LOBBY_KEY_MAP) rather than leaving the "click to look
// around" overlay stuck on screen forever with no way to dismiss it.
function requestLobbyPointerLock() {
  const result = canvas.requestPointerLock();
  if (result && result.catch) {
    result.catch(() => { lobby.pointerLockUnavailable = true; refreshLobbyUi(); });
  }
}
document.addEventListener('pointerlockerror', () => {
  lobby.pointerLockUnavailable = true;
  refreshLobbyUi();
});

canvas.addEventListener('click', (e) => {
  if (screen === 'lobby') {
    if (!lobby.pointerLocked) requestLobbyPointerLock();
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

document.addEventListener('pointerlockchange', () => {
  lobby.pointerLocked = document.pointerLockElement === canvas;
  refreshLobbyUi();
});

// ---------- Lobby keyboard controls ----------
const LOBBY_KEY_MAP = {
  w: 'forward', arrowup: 'forward',
  s: 'back', arrowdown: 'back',
  a: 'left', d: 'right',
  q: 'turnLeft', e: null, // 'e' reserved for interact, handled separately
  arrowleft: 'turnLeft', arrowright: 'turnRight',
};
window.addEventListener('keydown', (evt) => {
  if (screen !== 'lobby') return;
  const k = evt.key.toLowerCase();
  if (k === 'e') {
    if (lobby.nearTrigger) openBuildingModal(lobby.nearTrigger);
    return;
  }
  const action = LOBBY_KEY_MAP[k];
  if (action) { lobby.keys[action] = true; evt.preventDefault(); }
});
window.addEventListener('keyup', (evt) => {
  const k = evt.key.toLowerCase();
  const action = LOBBY_KEY_MAP[k];
  if (action) lobby.keys[action] = false;
});

// ---------- Lobby UI (crosshair, prompt, click-to-look, modal) ----------
const lobbyUi = el('div', { class: 'ttd-lobby-ui hidden' });
const crosshair = el('div', { class: 'ttd-crosshair' });
const interactPrompt = el('div', { class: 'ttd-interact-prompt hidden' });
const clickFallbackHint = el('div', { class: 'ttd-click-fallback hidden' }, 'Mouse-look isn\'t available here — click again to continue with ← / → to turn instead.');
const clickToLookOverlay = el('div', {
  class: 'ttd-click-overlay',
  onClick: () => {
    if (lobby.pointerLockUnavailable) { lobby.overlayDismissed = true; refreshLobbyUi(); }
    else requestLobbyPointerLock();
  },
}, [
  el('div', { class: 'ttd-click-card' }, [
    el('div', { class: 'ttd-click-title' }, '🖱️ Click anywhere to look around'),
    el('div', { class: 'ttd-click-sub' }, 'WASD to walk · Mouse to look · E to interact · Esc to release cursor'),
    clickFallbackHint,
  ]),
]);
lobbyUi.appendChild(crosshair);
lobbyUi.appendChild(interactPrompt);
lobbyUi.appendChild(clickToLookOverlay);
root.appendChild(lobbyUi);

function refreshLobbyUi() {
  const overlayDone = lobby.pointerLocked || lobby.overlayDismissed;
  clickToLookOverlay.classList.toggle('hidden', overlayDone);
  clickFallbackHint.classList.toggle('hidden', !lobby.pointerLockUnavailable);
  if (lobby.nearTrigger && overlayDone) {
    interactPrompt.textContent = `${lobby.nearTrigger.icon} Press E to enter ${lobby.nearTrigger.label}`;
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
  if (document.pointerLockElement) document.exitPointerLock();
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
      el('div', {}, '🚶 Walk the courtyard in first person — WASD + mouse.'),
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
  buildingModal.classList.add('hidden');
}

function enterLobby() {
  screen = 'lobby';
  lobby = createLobbyState();
  hideAllScreens();
  lobbyUi.classList.remove('hidden');
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
    updateLobby(lobby, dt);
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

  if (screen === 'lobby') {
    renderLobbyView(ctx, 960, 600, lobby, FOV, TRIGGERS);
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
