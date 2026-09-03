import { el, clearChildren } from './util/dom.js';
import { createCanvasSurface } from './core/canvas.js';
import { drawMap } from './render/drawBattleMap.js';
import { drawUnit } from './render/drawUnit.js';
import { drawEnemy } from './render/drawEnemy.js';
import { drawEffect, drawProjectile } from './render/drawEffects.js';
import { drawMenuBackground } from './render/drawMenuBackground.js';
import { renderUnitPortrait } from './render/drawPortrait.js';
import { UNITS, RARITY, RARITY_ORDER } from './data/units.js';
import { MAP_LIST } from './data/maps.js';
import { TOTAL_WAVES } from './data/waves.js';
import { createGameState, update, startNextWave, deployUnit, canDeploy } from './game/engine.js';
import {
  loadCollection, saveCollection, pullCost, pullGacha,
  canAwaken, awakenCostFor, awakenUnit,
  toggleEquip, MAX_EQUIPPED, MAX_STARS,
} from './game/collection.js';
import * as audio from './audio/audioEngine.js';

const root = document.getElementById('game-root');

// Real combat isn't ready for visitors yet, but the menu/Gacha/Inventory
// hub is worth showing off, so PLAY itself is always enabled — only the
// Battle button (which starts an actual fight) is gated to David's own
// machine, via hostname instead of hand-disabling it per deploy so the
// same source works everywhere.
const BATTLE_ENABLED = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';

document.addEventListener('click', () => {
  audio.ensureAudioContext();
}, { capture: true, once: false });

// `screen` is the single source of truth for which mode is active
// ('title' | 'menu' | 'playing' | 'gameover' | 'victory'). `state` (the
// battle) is only ever created once a dungeon is entered — it starts null.
let screen = 'title';
let state = null;
let collection = loadCollection();

const surface = createCanvasSurface(root);
const { canvas, ctx } = surface;
canvas.classList.add('ttd-canvas');

// ---------- HUD (battle) ----------
const goldValue = el('span', { class: 'ttd-stat-value' }, '0');
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
const retreatBtn = el('button', { class: 'btn ttd-retreat-btn', text: '🏃 Retreat', onClick: () => {
  audio.stopMusic();
  enterMenu();
} });
let soundOn = true;

const hud = el('div', { class: 'ttd-hud hidden' }, [
  el('div', { class: 'ttd-stat ttd-stat-gold' }, [el('span', { class: 'ttd-stat-icon' }, '📄'), goldValue]),
  el('div', { class: 'ttd-stat ttd-stat-wave' }, [el('span', { class: 'ttd-stat-icon' }, '📖'), waveValue]),
  heartsWrap,
  el('div', { class: 'ttd-hud-controls' }, [waveBtn, speedBtn, autoBtn, muteBtn, retreatBtn]),
]);
root.appendChild(hud);

function refreshHearts() {
  clearChildren(heartsWrap);
  const b = state.base;
  const pct = b.hp / b.maxHp;
  const cls = pct > 0.5 ? '' : pct > 0.2 ? ' ttd-hearts-warn' : ' ttd-hearts-crit';
  heartsWrap.className = 'ttd-hearts' + cls;
  heartsWrap.appendChild(el('span', { class: 'ttd-stat-icon' }, '❤️'));
  heartsWrap.appendChild(el('span', { class: 'ttd-stat-value' }, `${Math.round(b.hp)} / ${b.maxHp}`));
}

function refreshHud() {
  goldValue.textContent = Math.floor(state.gold).toLocaleString();
  waveValue.textContent = `${state.wave} / ${TOTAL_WAVES}`;
  refreshHearts();
  waveBtn.disabled = state.waveActive || state.wave >= TOTAL_WAVES;
  waveBtn.textContent = state.waveActive ? 'Wave in progress…' : (state.wave >= TOTAL_WAVES ? 'Final wave cleared' : `Start Wave ${state.wave + 1}`);
  refreshDeployRoster();
}

function refreshAll() {
  refreshHud();
}

// ---------- Deploy roster — click a card to spend its cost and send that
// student marching down the lane; each has its own redeploy cooldown. ----------
const deployButtons = {};
const squad = el('div', { class: 'ttd-shop hidden' });
root.appendChild(squad);

function buildDeployRoster() {
  clearChildren(squad);
  for (const k of Object.keys(deployButtons)) delete deployButtons[k];
  for (let i = 0; i < MAX_EQUIPPED; i++) {
    const unitId = state.equipped[i];
    const slotNum = el('span', { class: 'ttd-shop-slot-num' }, String(i + 1));
    if (!unitId) {
      squad.appendChild(el('div', { class: 'ttd-shop-item ttd-shop-item-empty' }, [slotNum, el('div', { class: 'ttd-shop-info' }, [el('div', { class: 'ttd-shop-name' }, 'Empty')])]));
      continue;
    }
    const def = UNITS[unitId];
    const btn = el('button', {
      class: 'ttd-shop-item',
      onClick: () => { if (deployUnit(state, unitId)) refreshHud(); },
    }, [
      slotNum,
      el('span', { class: 'ttd-shop-dot', style: `background:${def.color}` }, def.icon),
      el('div', { class: 'ttd-shop-info' }, [
        el('div', { class: 'ttd-shop-name' }, def.name),
        el('div', { class: 'ttd-shop-cost' }, `${def.cost}📄`),
      ]),
    ]);
    deployButtons[unitId] = btn;
    squad.appendChild(btn);
  }
}

function refreshDeployRoster() {
  for (const unitId of state.equipped) {
    const btn = deployButtons[unitId];
    if (!btn) continue;
    const ready = canDeploy(state, unitId);
    const cooldown = state.deployCooldowns[unitId] || 0;
    btn.classList.toggle('disabled', !ready);
    btn.disabled = !ready;
    btn.title = cooldown > 0 ? `Reloading (${cooldown.toFixed(1)}s)` : UNITS[unitId].desc;
  }
}

// ---------- Main menu (replaces the walkable lobby — straight to the
// point, matching a menu-driven flow instead of an explorable hub) ----------
const menuGoldValue = el('span', { class: 'ttd-stat-value' }, '0');
const menuHud = el('div', { class: 'ttd-lobby-hud hidden' }, [
  el('div', { class: 'ttd-stat ttd-stat-gold' }, [el('span', { class: 'ttd-stat-icon' }, '📄'), menuGoldValue]),
]);
root.appendChild(menuHud);
function refreshMenuHud() { menuGoldValue.textContent = collection.gold.toLocaleString(); }

const menuScreen = el('div', { class: 'ttd-menu-screen hidden' });
root.appendChild(menuScreen);
// A full-screen academy hub instead of a small centered card: a title
// badge in the corner, a vertical stack of action buttons down the left
// (Battle first and biggest, since that's the thing you came here to do),
// and the 5-slot loadout tray anchored at the bottom.
function renderMenuScreen() {
  clearChildren(menuScreen);
  // A compact logo card (title + crossed-swords icon) instead of the old
  // pill titlebar, and three equal stacked nav buttons — Index (the
  // dungeon/map select, what "Battle" used to open directly), Gacha, and
  // Units (the renamed Inventory) — instead of one big primary button
  // plus a row of small icon buttons. Awaken moved inside the Units
  // screen since it's a per-unit action, not top-level navigation.
  menuScreen.appendChild(el('div', { class: 'ttd-menu-logo' }, [
    el('div', { class: 'ttd-menu-logo-title' }, 'BATTLE KIDS'),
    el('div', { class: 'ttd-menu-logo-icon' }, '⚔️'),
  ]));
  menuScreen.appendChild(el('div', { class: 'ttd-menu-nav' }, [
    el('button', {
      class: `ttd-menu-nav-btn ttd-menu-nav-primary${BATTLE_ENABLED ? '' : ' ttd-action-primary-disabled'}`,
      disabled: BATTLE_ENABLED ? undefined : true,
      onClick: BATTLE_ENABLED ? openDungeonModal : undefined,
    }, 'INDEX'),
    el('button', { class: 'ttd-menu-nav-btn', onClick: openGachaModal }, 'GACHA'),
    el('button', { class: 'ttd-menu-nav-btn', onClick: openInventoryModal }, 'UNITS'),
  ]));
  menuScreen.appendChild(el('div', { class: 'ttd-menu-tray' }, [
    el('div', { class: 'ttd-menu-tray-label' }, 'LOADOUT'),
    el('div', { class: 'ttd-equip-row ttd-menu-equip-row', id: 'ttd-menu-equip-row' }),
  ]));
  refreshEquipRow();
}

// ---------- Bottom equip row (the 5 loadout slots from the sketch) ----------
function refreshEquipRow() {
  const equipRow = menuScreen.querySelector('#ttd-menu-equip-row');
  if (!equipRow) return;
  clearChildren(equipRow);
  for (let i = 0; i < MAX_EQUIPPED; i++) {
    const unitId = collection.equipped[i];
    const def = unitId ? UNITS[unitId] : null;
    equipRow.appendChild(el('button', {
      class: 'ttd-equip-slot' + (def ? ` rarity-${def.rarity}` : ''),
      onClick: openInventoryModal,
    }, [def ? def.icon : String(i + 1)]));
  }
}

// ---------- Gacha modal (Summon only — Inventory/Awaken are their own
// their own menu buttons/modals) ----------
const gachaModal = el('div', { class: 'ttd-gacha-modal hidden' });
root.appendChild(gachaModal);
let gachaBanner = 'standard';
let lastPullResults = null;

function openGachaModal() {
  lastPullResults = null;
  renderGachaModal();
  gachaModal.classList.remove('hidden');
}
function closeGachaModal() { gachaModal.classList.add('hidden'); }

function renderGachaModal() {
  clearChildren(gachaModal);
  const card = el('div', { class: 'ttd-gacha-card' });
  card.appendChild(el('button', { class: 'ttd-modal-close', text: '✕', onClick: closeGachaModal }));
  card.appendChild(el('div', { class: 'ttd-gacha-header' }, [
    el('div', { class: 'ttd-gacha-title' }, '🎰 Gacha'),
    el('div', { class: 'ttd-gacha-gold' }, `${collection.gold.toLocaleString()} 📄`),
  ]));
  const body = el('div', { class: 'ttd-gacha-body' });
  renderSummonTab(body);
  card.appendChild(body);
  gachaModal.appendChild(card);
}

// ---------- Inventory modal ----------
const inventoryModal = el('div', { class: 'ttd-gacha-modal hidden' });
root.appendChild(inventoryModal);
function openInventoryModal() { renderInventoryModal(); inventoryModal.classList.remove('hidden'); }
function closeInventoryModal() { inventoryModal.classList.add('hidden'); }
function renderInventoryModal() {
  clearChildren(inventoryModal);
  const card = el('div', { class: 'ttd-gacha-card' });
  card.appendChild(el('button', { class: 'ttd-modal-close', text: '✕', onClick: closeInventoryModal }));
  card.appendChild(el('div', { class: 'ttd-gacha-header' }, [
    el('div', { class: 'ttd-gacha-title' }, '🎒 Units'),
    el('button', { class: 'ttd-units-awaken-btn', onClick: openAwakenModal }, '✨ Awaken'),
  ]));
  const body = el('div', { class: 'ttd-gacha-body' });
  renderInventoryTab(body);
  card.appendChild(body);
  inventoryModal.appendChild(card);
}

// ---------- Awaken modal ----------
const awakenModal = el('div', { class: 'ttd-gacha-modal hidden' });
root.appendChild(awakenModal);
function openAwakenModal() { renderAwakenModal(); awakenModal.classList.remove('hidden'); }
function closeAwakenModal() { awakenModal.classList.add('hidden'); }
function renderAwakenModal() {
  clearChildren(awakenModal);
  const card = el('div', { class: 'ttd-gacha-card' });
  card.appendChild(el('button', { class: 'ttd-modal-close', text: '✕', onClick: closeAwakenModal }));
  card.appendChild(el('div', { class: 'ttd-gacha-title' }, '✨ Awaken'));
  card.appendChild(el('p', { class: 'ttd-building-desc' }, 'Spend duplicates and homework pages for a permanent stat boost.'));
  const body = el('div', { class: 'ttd-gacha-body' });
  renderAwakenTab(body);
  card.appendChild(body);
  awakenModal.appendChild(card);
}

// A circular pie-chart "wheel" matching the player's own gacha sketch —
// colored wedges divided EQUALLY (not to true probability scale, same as
// the sketch itself — a 0.1%-true-scale Mythical sliver would be
// invisible) with the rarity name + its real percentage labeled inside
// each wedge, sitting on a small pedestal stand.
function buildOddsWheel(slices, size = 190) {
  const cx = size / 2, cy = size / 2, r = size / 2 - 4;
  const toXY = (angleDeg, radius) => {
    const rad = (angleDeg - 90) * Math.PI / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };
  const step = 360 / slices.length;
  const parts = [];
  slices.forEach((s, i) => {
    const startAngle = i * step;
    const endAngle = startAngle + step;
    const start = toXY(startAngle, r);
    const end = toXY(endAngle, r);
    const largeArc = step > 180 ? 1 : 0;
    parts.push(`<path d="M ${cx} ${cy} L ${start.x.toFixed(2)} ${start.y.toFixed(2)} A ${r} ${r} 0 ${largeArc} 1 ${end.x.toFixed(2)} ${end.y.toFixed(2)} Z" fill="${s.color}" stroke="#241708" stroke-width="1.6"/>`);
    const mid = startAngle + step / 2;
    const labelPos = toXY(mid, r * 0.62);
    // Two-word labels ("SEASON CHAMPION") wrap onto their own line instead
    // of running wide enough to crowd into the neighboring wedge's text.
    const words = s.label.split(' ');
    const nameLines = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [s.label];
    const nameStartY = labelPos.y - 5 - (nameLines.length - 1) * 8;
    nameLines.forEach((line, li) => {
      parts.push(`<text x="${labelPos.x.toFixed(2)}" y="${(nameStartY + li * 8).toFixed(2)}" text-anchor="middle" font-size="7.5" font-weight="800" fill="#241708" font-family="'Baloo 2', sans-serif">${line}</text>`);
    });
    parts.push(`<text x="${labelPos.x.toFixed(2)}" y="${(labelPos.y + 8 + (nameLines.length - 1) * 4).toFixed(2)}" text-anchor="middle" font-size="8" font-weight="700" fill="#241708" font-family="'Baloo 2', sans-serif">${s.pctLabel}</text>`);
  });
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block">
    <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="#2c1e10"/>
    ${parts.join('')}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#241708" stroke-width="3"/>
  </svg>`;
}

const SEASON_CHAMPION_COLOR = '#ff5fc4';
const NORMAL_WHEEL_SLICES = [
  { label: 'COMMON', pctLabel: '55%', color: RARITY.common.color },
  { label: 'RARE', pctLabel: '30%', color: RARITY.rare.color },
  { label: 'EPIC', pctLabel: '10%', color: RARITY.epic.color },
  { label: 'LEGEND', pctLabel: '1%', color: RARITY.legend.color },
  { label: 'MYTHICAL', pctLabel: '0.1%', color: RARITY.mythic.color },
];
const SEASONAL_WHEEL_SLICES = [
  { label: 'COMMON', pctLabel: '60%', color: RARITY.common.color },
  { label: 'RARE', pctLabel: '30%', color: RARITY.rare.color },
  { label: 'EPIC', pctLabel: '5%', color: RARITY.epic.color },
  { label: 'LEGEND', pctLabel: '1%', color: RARITY.legend.color },
  { label: 'MYTHICAL', pctLabel: '0.5%', color: RARITY.mythic.color },
  { label: 'SEASON CHAMPION', pctLabel: '0.1%', color: SEASON_CHAMPION_COLOR },
];

function renderSummonTab(body) {
  // Normal / Seasonal mode toggle — a two-segment radio pill, matching
  // the player's sketch, instead of a generic banner-tab strip.
  const toggle = el('div', { class: 'ttd-gacha-mode-toggle' });
  for (const mode of ['standard', 'seasonal']) {
    toggle.appendChild(el('button', {
      class: 'ttd-gacha-mode-btn' + (gachaBanner === mode ? ' active' : ''),
      onClick: () => { gachaBanner = mode; lastPullResults = null; renderGachaModal(); },
    }, [
      el('span', { class: 'ttd-gacha-mode-radio' }, gachaBanner === mode ? '●' : '○'),
      mode === 'standard' ? 'NORMAL' : 'SEASONAL',
    ]));
  }
  body.appendChild(toggle);

  const isSeasonal = gachaBanner === 'seasonal';
  const wheelSVG = buildOddsWheel(isSeasonal ? SEASONAL_WHEEL_SLICES : NORMAL_WHEEL_SLICES);
  const wheelWrap = el('div', { class: 'ttd-gacha-wheel-wrap' });
  const wheelEl = el('div', { class: 'ttd-gacha-wheel' });
  wheelEl.innerHTML = wheelSVG;
  wheelWrap.appendChild(wheelEl);
  wheelWrap.appendChild(el('div', { class: 'ttd-gacha-stand' }));
  body.appendChild(wheelWrap);

  if (isSeasonal) {
    body.appendChild(el('div', { class: 'ttd-gacha-coming-soon' }, '🌱 Seasonal banner coming soon'));
  }

  const currencyIcon = isSeasonal ? '🪙' : '📄';
  const seasonalCosts = { 1: 10, 5: 45, 10: 90 };
  const pullRow = el('div', { class: 'ttd-pull-row ttd-pull-row-3' });
  for (const count of [1, 5, 10]) {
    const cost = isSeasonal ? seasonalCosts[count] : pullCost(count);
    pullRow.appendChild(el('button', {
      class: 'ttd-pull-btn',
      disabled: (isSeasonal || collection.gold < cost) ? 'disabled' : undefined,
      onClick: isSeasonal ? undefined : () => doPull(count),
    }, [el('span', { class: 'ttd-pull-btn-label' }, `x${count} SPIN`), el('span', { class: 'ttd-pull-btn-cost' }, `${cost} ${currencyIcon}`)]));
  }
  body.appendChild(pullRow);

  if (!isSeasonal && lastPullResults) {
    const reveal = el('div', { class: 'ttd-pull-reveal' });
    for (const u of lastPullResults) {
      const iconBox = el('div', { class: 'ttd-pull-icon' });
      iconBox.appendChild(renderUnitPortrait(u, 46));
      reveal.appendChild(el('div', { class: `ttd-pull-card rarity-${u.rarity}` }, [
        iconBox,
        el('div', { class: 'ttd-pull-name' }, u.name),
        el('div', { class: 'ttd-pull-rarity' }, RARITY[u.rarity].label),
      ]));
    }
    body.appendChild(reveal);
  }
}

function doPull(count) {
  const results = pullGacha(collection, gachaBanner, count);
  if (!results) return;
  lastPullResults = results;
  audio.playUpgrade();
  renderGachaModal();
  showPullReveal(results);
}

// ---------- Pull reveal — a "YOU GOT!" curtain card shown for each unit
// just pulled, on top of the Gacha modal. Tap to advance through a x10
// pull one unit at a time; the results grid underneath is already in
// place by the time the last card is dismissed. ----------
// Appended to root (not gachaModal) since renderGachaModal() clears all
// of gachaModal's children on every render — a child of it would get
// wiped out the moment a pull re-renders the modal behind it.
const revealOverlay = el('div', { class: 'ttd-reveal-overlay hidden' });
root.appendChild(revealOverlay);
let revealQueue = [];
let revealIndex = 0;

function showPullReveal(results) {
  revealQueue = results;
  revealIndex = 0;
  renderPullReveal();
  revealOverlay.classList.remove('hidden');
}

function advancePullReveal() {
  revealIndex += 1;
  if (revealIndex >= revealQueue.length) {
    revealOverlay.classList.add('hidden');
    return;
  }
  renderPullReveal();
}

function renderPullReveal() {
  clearChildren(revealOverlay);
  const u = revealQueue[revealIndex];
  const r = RARITY[u.rarity];
  const portrait = el('div', { class: 'ttd-reveal-portrait' });
  portrait.appendChild(renderUnitPortrait(u, 120));
  const card = el('div', { class: `ttd-reveal-card rarity-${u.rarity}`, onClick: (e) => e.stopPropagation() }, [
    el('div', { class: 'ttd-reveal-label' }, 'YOU GOT!'),
    el('div', { class: 'ttd-reveal-stage' }, [
      el('div', { class: 'ttd-reveal-curtain ttd-reveal-curtain-left' }),
      el('div', { class: 'ttd-reveal-curtain ttd-reveal-curtain-right' }),
      el('div', { class: 'ttd-reveal-rod' }),
      portrait,
    ]),
    el('div', { class: 'ttd-reveal-name' }, u.name),
    el('div', { class: 'ttd-reveal-rarity' }, r.label),
    el('div', { class: 'ttd-reveal-desc' }, u.desc),
    el('div', { class: 'ttd-reveal-stats' }, [
      el('div', { class: 'ttd-reveal-stat' }, [el('div', { class: 'ttd-reveal-stat-val' }, `${u.damage}`), el('div', { class: 'ttd-reveal-stat-label' }, 'DMG')]),
      el('div', { class: 'ttd-reveal-stat' }, [el('div', { class: 'ttd-reveal-stat-val' }, `${u.range}`), el('div', { class: 'ttd-reveal-stat-label' }, 'Range')]),
    ]),
    el('div', { class: 'ttd-reveal-next' }, revealIndex < revealQueue.length - 1 ? `Tap to continue (${revealIndex + 1}/${revealQueue.length})` : 'Tap to continue'),
  ]);
  revealOverlay.appendChild(card);
  revealOverlay.onclick = advancePullReveal;
}

function renderInventoryTab(body) {
  body.appendChild(el('div', { class: 'ttd-equip-status' }, `Equipped ${collection.equipped.length} / ${MAX_EQUIPPED}`));
  const grid = el('div', { class: 'ttd-inventory-grid' });
  const ownedIds = Object.keys(collection.owned).filter(id => collection.owned[id] > 0);
  ownedIds.sort((a, b) => RARITY[UNITS[b].rarity].order - RARITY[UNITS[a].rarity].order || UNITS[a].name.localeCompare(UNITS[b].name));
  if (!ownedIds.length) {
    grid.appendChild(el('div', { class: 'ttd-empty-note' }, 'No students recruited yet — try the Summon tab.'));
  }
  for (const id of ownedIds) {
    const def = UNITS[id];
    const count = collection.owned[id];
    const star = collection.stars[id] || 0;
    const equipped = collection.equipped.includes(id);
    const card = el('button', {
      class: `ttd-unit-card rarity-${def.rarity}` + (equipped ? ' equipped' : ''),
      onClick: () => { toggleEquip(collection, id); renderInventoryModal(); refreshEquipRow(); },
    }, [
      el('div', { class: 'ttd-unit-icon' }, def.icon),
      el('div', { class: 'ttd-unit-name' }, def.name),
      el('div', { class: 'ttd-unit-meta' }, `x${count}${star ? ' ' + '★'.repeat(star) : ''}`),
      equipped ? el('div', { class: 'ttd-unit-equipped-badge' }, 'EQUIPPED') : null,
    ]);
    grid.appendChild(card);
  }
  body.appendChild(grid);
}

function renderAwakenTab(body) {
  const list = el('div', { class: 'ttd-list' });
  const ids = Object.keys(collection.owned).filter(id => collection.owned[id] > 0);
  ids.sort((a, b) => RARITY[UNITS[b].rarity].order - RARITY[UNITS[a].rarity].order);
  let any = false;
  for (const id of ids) {
    const def = UNITS[id];
    const info = awakenCostFor(id, collection);
    if (!info) continue;
    any = true;
    const ok = canAwaken(collection, id);
    list.appendChild(el('div', { class: `ttd-list-row rarity-${def.rarity}` }, [
      el('div', { class: 'ttd-unit-icon' }, def.icon),
      el('div', { class: 'ttd-list-info' }, [
        el('div', { class: 'ttd-unit-name' }, `${def.name} ${'★'.repeat(info.star)}${'☆'.repeat(MAX_STARS - info.star)}`),
        el('div', { class: 'ttd-list-sub' }, `Needs ${info.dupesNeeded} dupes + ${info.gold}📄`),
      ]),
      el('button', { class: 'btn' + (ok ? ' btn-primary' : ''), text: 'Awaken', disabled: ok ? undefined : 'disabled', onClick: () => { awakenUnit(collection, id); renderAwakenModal(); } }),
    ]));
  }
  if (!any) list.appendChild(el('div', { class: 'ttd-empty-note' }, 'Fully-awakened students, and ones with no duplicates yet, show nothing to do here.'));
  body.appendChild(list);
}

// ---------- Dungeon Gate modal ----------
const dungeonModal = el('div', { class: 'ttd-dungeon-modal hidden' });
root.appendChild(dungeonModal);
function openDungeonModal() { renderDungeonModal(); dungeonModal.classList.remove('hidden'); }
function closeDungeonModal() { dungeonModal.classList.add('hidden'); }
function renderDungeonModal() {
  clearChildren(dungeonModal);
  const card = el('div', { class: 'ttd-dungeon-card' });
  card.appendChild(el('button', { class: 'ttd-modal-close', text: '✕', onClick: closeDungeonModal }));
  card.appendChild(el('div', { class: 'ttd-gacha-title' }, '🗺️ Dungeon Gate'));
  if (!collection.equipped.length) {
    card.appendChild(el('p', { class: 'ttd-building-desc' }, 'Equip at least one student from the Inventory menu before heading in.'));
  } else {
    card.appendChild(el('p', { class: 'ttd-building-desc' }, `Bringing ${collection.equipped.length} student${collection.equipped.length === 1 ? '' : 's'} in.`));
    const grid = el('div', { class: 'ttd-map-grid' });
    for (const map of MAP_LIST) {
      grid.appendChild(el('button', {
        class: 'ttd-map-card',
        onClick: () => { closeDungeonModal(); startGame(map.id); },
      }, [el('div', { class: 'ttd-map-icon' }, map.icon), el('div', { class: 'ttd-map-name' }, map.name)]));
    }
    card.appendChild(grid);
  }
  dungeonModal.appendChild(card);
}

// ---------- Title / Credits / Game Over / Victory screens ----------
const titleScreen = el('div', { class: 'ttd-title-screen' }, [
  el('div', { class: 'ttd-title-card' }, [
    el('div', { class: 'ttd-title-emblem' }, '🎓'),
    el('h1', { class: 'ttd-title' }, 'BATTLE KIDS'),
    el('div', { class: 'ttd-title-actions' }, [
      el('button', { class: 'btn btn-primary ttd-start-btn', text: 'PLAY', onClick: enterMenu }),
      el('button', { class: 'btn ttd-credits-btn', text: 'CREDITS', onClick: showCredits }),
    ]),
    el('p', { class: 'ttd-subtitle' }, 'Cursed teachers are pouring out of their base. Recruit students, hold the courtyard, and don\'t let anything reach your desk.'),
    el('div', { class: 'ttd-howto' }, [
      el('div', {}, '🎰 Visit the Gacha to recruit new students.'),
      el('div', {}, '📦 Equip up to 5 students from your Inventory.'),
      el('div', {}, '⚔️ In battle: tap a student to deploy them — they march the lane and fight on their own.'),
    ]),
  ]),
]);
root.appendChild(titleScreen);

// The credits — a movie-style scroll straight out of the player's own
// sketch: Owner/Developer/Coding/Innovation/VFX/Music/Graphics up top,
// the full student roster, special thanks, and a closing signature.
const CREDITS_LINES = [
  { type: 'eyebrow', text: '🎓 BATTLE KIDS PRESENTS 🎓' },
  { type: 'title', text: 'CREDITS' },
  { type: 'line', text: 'Owner: David C. Lim' },
  { type: 'line', text: 'Developer: David C. Lim' },
  { type: 'line', text: 'Coding: David C. Lim' },
  { type: 'gap-sm' },
  { type: 'line', text: 'Innovation: Valerius Koh & Lucas Tan' },
  { type: 'line', text: 'Ng Jun Zhe & Ng Jun Kai' },
  { type: 'gap-sm' },
  { type: 'line', text: 'VFX Effects: David C. Lim' },
  { type: 'line', text: 'Music & Sound: David C. Lim' },
  { type: 'line', text: 'Graphics: David C. Lim' },
  { type: 'gap' },
  { type: 'heading', text: '🎓 STUDENTS' },
  { type: 'line', text: 'Valerius Koh, Lucas Tan, Edmund Liu, Ng Jun Zhe, Ng Jun Kai,' },
  { type: 'line', text: 'Auster Nieh, Hunter Tan, Elijah Seah, Evan Cheung, Shane Chong,' },
  { type: 'line', text: 'Timothy Chew, Christopher Kok, Jadon Teoh, Jude Mak,' },
  { type: 'line', text: 'Isaac Ong, Ashton Ch*a, Alexander Lai.' },
  { type: 'gap' },
  { type: 'heading', text: '✨ SPECIAL THANKS ✨' },
  { type: 'line', text: '- Students of 5 Anthony -' },
  { type: 'line', text: '- Lucas Tan Ze Yu -' },
  { type: 'line', text: '- Valerius Koh Jin Kai -' },
  { type: 'line', text: '- Ng Jun Zhe & Ng Jun Kai -' },
  { type: 'gap' },
  { type: 'gap' },
  { type: 'line', text: 'Last but not LEAST...' },
  { type: 'gap' },
  { type: 'name', text: 'DAVID C. LIM' },
  { type: 'gap' },
  { type: 'gap' },
];

function buildCreditsScroll() {
  const scroll = el('div', { class: 'ttd-credits-scroll' });
  for (const item of CREDITS_LINES) {
    if (item.type === 'gap') scroll.appendChild(el('div', { class: 'ttd-credits-gap' }));
    else if (item.type === 'gap-sm') scroll.appendChild(el('div', { class: 'ttd-credits-gap-sm' }));
    else if (item.type === 'eyebrow') scroll.appendChild(el('div', { class: 'ttd-credits-eyebrow' }, item.text));
    else if (item.type === 'title') scroll.appendChild(el('div', { class: 'ttd-credits-title' }, item.text));
    else if (item.type === 'heading') scroll.appendChild(el('div', { class: 'ttd-credits-heading' }, item.text));
    else if (item.type === 'name') scroll.appendChild(el('div', { class: 'ttd-credits-name' }, item.text));
    else scroll.appendChild(el('div', { class: 'ttd-credits-line' }, item.text));
  }
  return scroll;
}

// Drifting embers behind the scroll — same deterministic pseudo-random
// spread technique as the menu background's MOTES, just rising instead
// of falling, to match the gold/wood theme instead of a generic starfield.
function buildEmbers(n = 14) {
  const wrap = el('div', { class: 'ttd-credits-embers' });
  for (let i = 0; i < n; i++) {
    const dot = el('div', { class: 'ttd-ember' + (i % 4 === 0 ? ' ttd-ember-mint' : '') });
    const size = 2 + (i * 37) % 4;
    dot.style.left = `${(i * 53.7) % 100}%`;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.animationDelay = `${(i * 1.7) % 12}s`;
    dot.style.animationDuration = `${9 + (i * 2.3) % 7}s`;
    wrap.appendChild(dot);
  }
  return wrap;
}

const creditsScreen = el('div', { class: 'ttd-credits-screen hidden' }, [
  el('div', { class: 'ttd-credits-bg' }, [
    el('div', { class: 'ttd-credits-stars' }),
    el('div', { class: 'ttd-credits-stars ttd-credits-stars-2' }),
    buildEmbers(),
  ]),
  el('button', { class: 'btn ttd-credits-back', text: '← Back', onClick: hideCredits }),
  el('div', { class: 'ttd-credits-viewport' }, [buildCreditsScroll()]),
]);
root.appendChild(creditsScreen);

function showCredits() {
  screen = 'credits';
  hideAllScreens();
  creditsScreen.classList.remove('hidden');
}

function hideCredits() {
  screen = 'title';
  hideAllScreens();
  titleScreen.classList.remove('hidden');
}

const endScreen = el('div', { class: 'ttd-end-screen hidden' });
root.appendChild(endScreen);

function hideAllScreens() {
  titleScreen.classList.add('hidden');
  creditsScreen.classList.add('hidden');
  endScreen.classList.add('hidden');
  hud.classList.add('hidden');
  squad.classList.add('hidden');
  menuScreen.classList.add('hidden');
  menuHud.classList.add('hidden');
  gachaModal.classList.add('hidden');
  inventoryModal.classList.add('hidden');
  awakenModal.classList.add('hidden');
  dungeonModal.classList.add('hidden');
}

function enterMenu() {
  screen = 'menu';
  hideAllScreens();
  menuScreen.classList.remove('hidden');
  menuHud.classList.remove('hidden');
  renderMenuScreen();
  refreshMenuHud();
}

function startGame(mapId) {
  screen = 'playing';
  state = createGameState(mapId, collection.equipped.slice(), { ...collection.stars });
  buildDeployRoster();
  audio.ensureAudioContext();
  audio.startMusic();
  hideAllScreens();
  hud.classList.remove('hidden');
  squad.classList.remove('hidden');
  refreshAll();
}

function showEndScreen() {
  const win = state.screen === 'victory';
  const baseDestroyed = win && state.enemyBase.hp <= 0;
  const earned = state.wave * 15 + (win ? 100 : 0);
  collection.gold += earned;
  saveCollection(collection);

  clearChildren(endScreen);
  endScreen.className = 'ttd-end-screen' + (win ? ' ttd-victory' : ' ttd-defeat');
  endScreen.appendChild(el('div', { class: 'ttd-end-card' }, [
    el('div', { class: 'ttd-end-emblem' }, win ? '🏆' : '💀'),
    el('h2', { class: 'ttd-end-title' }, win ? 'Campus Saved!' : 'The Faculty Lounge Has Fallen'),
    el('p', { class: 'ttd-end-sub' }, win
      ? (baseDestroyed
        ? `Your students stormed the Teacher's Base on ${state.map.name} and tore it down on Wave ${state.wave}. +${earned}📄 banked.`
        : `You held ${state.map.name} through all ${TOTAL_WAVES} waves. +${earned}📄 banked.`)
      : `You made it to Wave ${state.wave} on ${state.map.name}. +${earned}📄 banked anyway — try again?`),
    el('button', { class: 'btn btn-primary', text: 'Back to the Academy', onClick: enterMenu }),
  ]));
  endScreen.classList.remove('hidden');
  hud.classList.add('hidden');
  squad.classList.add('hidden');
}

// ---------- Render loop ----------
let lastTime = performance.now();
let renderT = 0;
let lastScreen = null;

function frame(now) {
  const dt = Math.min(0.05, (now - lastTime) / 1000);
  lastTime = now;
  renderT += dt;

  if (screen === 'menu') {
    refreshMenuHud();
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

  if (screen === 'menu' || screen === 'title' || screen === 'credits') {
    drawMenuBackground(ctx, renderT);
  } else if (state) {
    drawMap(ctx, state.map, state.t, state.base, state.enemyBase);
    if (screen === 'playing' || screen === 'gameover' || screen === 'victory') {
      for (const u of state.units) drawUnit(ctx, u, state.t);
      for (const enemy of state.enemies) drawEnemy(ctx, enemy, state.t);
      for (const p of state.projectiles) drawProjectile(ctx, p);
      for (const eff of state.effects) drawEffect(ctx, eff, state.t);
    }
  }

  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
