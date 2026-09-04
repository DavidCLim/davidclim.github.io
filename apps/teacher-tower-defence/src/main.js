import { el, clearChildren } from './util/dom.js';
import { createCanvasSurface } from './core/canvas.js';
import { drawMap } from './render/drawBattleMap.js';
import { drawUnit } from './render/drawUnit.js';
import { drawEnemy } from './render/drawEnemy.js';
import { drawEffect, drawProjectile } from './render/drawEffects.js';
import { drawMenuBackground } from './render/drawMenuBackground.js';
import { renderUnitPortrait, renderUnitFace, renderEnemyPortrait } from './render/drawPortrait.js';
import { UNITS, UNIT_LIST, RARITY, RARITY_ORDER } from './data/units.js';
import { TEACHER_LIST } from './data/teachers.js';
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

// Battle used to be gated to localhost while combat was still being
// built out; the roster/menu/gacha are far enough along now that it's
// open to everyone.
const BATTLE_ENABLED = true;

// Gacha and Index are mid-rework and still don't look right, so they're
// pulled off the live site while that work continues, but stay fully
// usable locally (localhost / file://) for testing.
const IS_LOCAL = ['localhost', '127.0.0.1'].includes(location.hostname) || location.protocol === 'file:';
const GACHA_ENABLED = IS_LOCAL;
const INDEX_ENABLED = IS_LOCAL;
const UNITS_ENABLED = IS_LOCAL;

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
    const dot = el('span', { class: 'ttd-shop-dot' });
    dot.appendChild(renderUnitFace(def, 30));
    const btn = el('button', {
      class: 'ttd-shop-item',
      onClick: () => { if (deployUnit(state, unitId)) refreshHud(); },
    }, [
      slotNum,
      dot,
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
  // A compact logo card (title + crossed-swords icon), then Battle as
  // its own primary button — actually starting a fight, restored after
  // Index took over that slot — with Index (now a swipeable
  // Teacher/Student reference, not a battle-starter), Gacha, and Units
  // stacked below it. Awakenings shares the bottom row with the loadout
  // tray instead of stacking as a 5th full-width button.
  menuScreen.appendChild(el('div', { class: 'ttd-menu-logo' }, [
    el('div', { class: 'ttd-menu-logo-title' }, 'BATTLE KIDS'),
    el('div', { class: 'ttd-menu-logo-icon' }, '⚔️'),
  ]));
  menuScreen.appendChild(el('div', { class: 'ttd-menu-nav' }, [
    el('button', {
      class: `ttd-menu-nav-btn ttd-menu-nav-primary${BATTLE_ENABLED ? '' : ' ttd-action-primary-disabled'}`,
      disabled: BATTLE_ENABLED ? undefined : true,
      onClick: BATTLE_ENABLED ? openDungeonModal : undefined,
    }, 'BATTLE'),
    el('button', {
      class: `ttd-menu-nav-btn${INDEX_ENABLED ? '' : ' ttd-action-primary-disabled'}`,
      disabled: INDEX_ENABLED ? undefined : true,
      onClick: INDEX_ENABLED ? openIndexModal : undefined,
    }, 'INDEX'),
    el('button', {
      class: `ttd-menu-nav-btn${GACHA_ENABLED ? '' : ' ttd-action-primary-disabled'}`,
      disabled: GACHA_ENABLED ? undefined : true,
      onClick: GACHA_ENABLED ? openGachaModal : undefined,
    }, 'GACHA'),
    el('button', {
      class: `ttd-menu-nav-btn${UNITS_ENABLED ? '' : ' ttd-action-primary-disabled'}`,
      disabled: UNITS_ENABLED ? undefined : true,
      onClick: UNITS_ENABLED ? openInventoryModal : undefined,
    }, 'UNITS'),
    el('button', { class: 'ttd-menu-nav-btn', onClick: openAwakenModal }, 'AWAKENINGS'),
  ]));
  menuScreen.appendChild(el('div', { class: 'ttd-equip-row', id: 'ttd-menu-equip-row' }));
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
    const slot = el('button', {
      class: 'ttd-equip-slot' + (def ? ` rarity-${def.rarity}` : ''),
      onClick: openInventoryModal,
    }, def ? [] : String(i + 1));
    if (def) slot.appendChild(renderUnitFace(def, 40));
    equipRow.appendChild(slot);
  }
}

// ---------- Gacha modal (Summon only — Inventory/Awaken are their own
// their own menu buttons/modals) ----------
const gachaModal = el('div', { class: 'ttd-gacha-modal hidden' });
root.appendChild(gachaModal);
let lastPullResults = null;

function openGachaModal() {
  lastPullResults = null;
  renderGachaModal();
  gachaModal.classList.remove('hidden');
}
function closeGachaModal() { gachaModal.classList.add('hidden'); }

function renderGachaModal() {
  clearChildren(gachaModal);
  const card = el('div', { class: 'ttd-gacha-card ttd-gacha-card-wide' });
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
const inventoryModal = el('div', { class: 'ttd-gacha-modal ttd-gacha-fullscreen hidden' });
root.appendChild(inventoryModal);
function openInventoryModal() { renderInventoryModal(); inventoryModal.classList.remove('hidden'); }
function closeInventoryModal() { inventoryModal.classList.add('hidden'); }
function renderInventoryModal() {
  clearChildren(inventoryModal);
  const card = el('div', { class: 'ttd-gacha-card ttd-gacha-card-wide' });
  card.appendChild(el('button', { class: 'ttd-modal-close', text: '✕', onClick: closeInventoryModal }));
  card.appendChild(el('div', { class: 'ttd-units-title' }, 'UNITS'));
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

// ---------- Index modal — a swipeable Teacher/Student reference,
// matching the player's own "TEACHER NAME HERE" trading-card sketch:
// name, a real portrait (no frame), a flavor description, then a
// Health/Damage/Range stat row, with arrows to page through every
// teacher and student in the game. ----------
const indexModal = el('div', { class: 'ttd-gacha-modal hidden' });
root.appendChild(indexModal);
const INDEX_ENTRIES = [
  ...TEACHER_LIST.map(def => ({ kind: 'teacher', def })),
  ...UNIT_LIST.map(def => ({ kind: 'student', def })),
];
let indexPos = 0;
function openIndexModal() { indexPos = 0; renderIndexModal(); indexModal.classList.remove('hidden'); }
function closeIndexModal() { indexModal.classList.add('hidden'); }
function stepIndex(delta) {
  indexPos = (indexPos + delta + INDEX_ENTRIES.length) % INDEX_ENTRIES.length;
  renderIndexModal();
}
function renderIndexModal() {
  clearChildren(indexModal);
  const card = el('div', { class: 'ttd-gacha-card' });
  card.appendChild(el('button', { class: 'ttd-modal-close', text: '✕', onClick: closeIndexModal }));
  card.appendChild(el('div', { class: 'ttd-gacha-title' }, '📖 Index'));

  const { kind, def } = INDEX_ENTRIES[indexPos];
  const hp = kind === 'teacher' ? def.hp : (def.hp ?? Math.round(40 + def.cost * 0.6));
  const portrait = kind === 'teacher' ? renderEnemyPortrait(def, 150) : renderUnitPortrait(def, 150);
  const portraitWrap = el('div', { class: 'ttd-index-portrait' });
  portraitWrap.appendChild(portrait);

  const body = el('div', { class: 'ttd-index-body' }, [
    el('div', { class: 'ttd-index-name' }, def.name),
    portraitWrap,
    el('div', { class: 'ttd-index-desc' }, def.desc || 'No records on file yet.'),
    el('div', { class: 'ttd-reveal-stats' }, [
      el('div', { class: 'ttd-reveal-stat' }, [el('div', { class: 'ttd-reveal-stat-val' }, `${hp}❤️`), el('div', { class: 'ttd-reveal-stat-label' }, 'Health')]),
      el('div', { class: 'ttd-reveal-stat' }, [el('div', { class: 'ttd-reveal-stat-val' }, `${def.damage}⚔️`), el('div', { class: 'ttd-reveal-stat-label' }, 'Damage')]),
      el('div', { class: 'ttd-reveal-stat' }, [el('div', { class: 'ttd-reveal-stat-val' }, `${def.range ?? 10}🎯`), el('div', { class: 'ttd-reveal-stat-label' }, 'Range')]),
    ]),
    el('div', { class: 'ttd-index-nav' }, [
      el('button', { class: 'ttd-index-arrow', onClick: () => stepIndex(-1) }, '◁'),
      el('div', { class: 'ttd-index-count' }, `${kind === 'teacher' ? 'Teacher' : 'Student'} · ${indexPos + 1} / ${INDEX_ENTRIES.length}`),
      el('button', { class: 'ttd-index-arrow', onClick: () => stepIndex(1) }, '▷'),
    ]),
  ]);
  card.appendChild(body);
  indexModal.appendChild(card);
}

// A circular pie-chart "wheel" matching the player's own gacha sketch —
// colored wedges divided EQUALLY (not to true probability scale, same as
// the sketch itself — a 0.1%-true-scale Mythical sliver would be
// invisible), each labeled with its rarity name + real percentage,
// rotated to match its wedge's own angle — like the numbers on a clock
// face — instead of every label sitting upright regardless of position,
// which is what made it read as "not like my drawing".
const WHEEL_SIZE = 320;
function buildOddsWheel(slices, size = WHEEL_SIZE) {
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
    const labelR = r * 0.62;
    // Two-word labels ("SEASON CHAMPION") wrap onto their own line so
    // they don't run wide enough to crowd a neighboring wedge's text.
    const words = s.label.split(' ');
    const nameLines = words.length > 1 ? [words.slice(0, -1).join(' '), words[words.length - 1]] : [s.label];
    const lineH = 13;
    const textParts = [];
    let y = cy - labelR - (nameLines.length - 1) * lineH;
    for (const line of nameLines) {
      textParts.push(`<text x="${cx}" y="${y.toFixed(2)}" text-anchor="middle" font-size="12" font-weight="800" fill="#241708" font-family="'Baloo 2', sans-serif">${line}</text>`);
      y += lineH;
    }
    textParts.push(`<text x="${cx}" y="${(y + 5).toFixed(2)}" text-anchor="middle" font-size="12" font-weight="700" fill="#241708" font-family="'Baloo 2', sans-serif">${s.pctLabel}</text>`);
    // Draw every label at the top (12 o'clock), then rotate the whole
    // group around the wheel's center by this wedge's own angle — moves
    // it into place AND tilts it to follow the wedge, all in one step.
    parts.push(`<g transform="rotate(${mid.toFixed(2)} ${cx} ${cy})">${textParts.join('')}</g>`);
  });
  return `<svg viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" style="display:block">
    <circle cx="${cx}" cy="${cy}" r="${r + 3}" fill="#2c1e10"/>
    ${parts.join('')}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="#241708" stroke-width="3"/>
  </svg>`;
}

const SEASON_CHAMPION_COLOR = '#ff5fc4';
const NORMAL_WHEEL_SLICES = [
  { rarityId: 'common', label: 'COMMON', pctLabel: '55%', color: RARITY.common.color },
  { rarityId: 'rare', label: 'RARE', pctLabel: '30%', color: RARITY.rare.color },
  { rarityId: 'epic', label: 'EPIC', pctLabel: '10%', color: RARITY.epic.color },
  { rarityId: 'legend', label: 'LEGEND', pctLabel: '1%', color: RARITY.legend.color },
  { rarityId: 'mythic', label: 'MYTHICAL', pctLabel: '0.1%', color: RARITY.mythic.color },
];
const SEASONAL_WHEEL_SLICES = [
  { label: 'COMMON', pctLabel: '60%', color: RARITY.common.color },
  { label: 'RARE', pctLabel: '30%', color: RARITY.rare.color },
  { label: 'EPIC', pctLabel: '5%', color: RARITY.epic.color },
  { label: 'LEGEND', pctLabel: '1%', color: RARITY.legend.color },
  { label: 'MYTHICAL', pctLabel: '0.5%', color: RARITY.mythic.color },
  { label: 'SEASON CHAMPION', pctLabel: '0.1%', color: SEASON_CHAMPION_COLOR },
];

// Both banners sit side by side, full-width — matching the player's own
// sketch exactly — instead of a Normal/Seasonal tab toggle that only
// ever shows one wheel at a time.
function renderSummonTab(body) {
  const modeRow = el('div', { class: 'ttd-gacha-mode-row' }, [
    el('div', { class: 'ttd-gacha-mode-pill' }, ['NORMAL', el('span', { class: 'ttd-gacha-mode-dot' })]),
    el('div', { class: 'ttd-gacha-mode-pill' }, [el('span', { class: 'ttd-gacha-mode-dot' }), 'SEASONAL']),
  ]);
  body.appendChild(modeRow);

  const row = el('div', { class: 'ttd-gacha-wheels-row' });
  row.appendChild(buildWheelColumn(false));
  row.appendChild(buildWheelColumn(true));
  body.appendChild(row);

  if (lastPullResults) {
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

function buildWheelColumn(isSeasonal) {
  const col = el('div', { class: 'ttd-gacha-wheel-col' });

  const wheelSVG = buildOddsWheel(isSeasonal ? SEASONAL_WHEEL_SLICES : NORMAL_WHEEL_SLICES, WHEEL_SIZE);
  const wheelWrap = el('div', { class: 'ttd-gacha-wheel-wrap' });
  wheelWrap.appendChild(el('div', { class: 'ttd-gacha-wheel-pointer' }));
  const wheelEl = el('div', { class: 'ttd-gacha-wheel' + (isSeasonal ? '' : ' ttd-gacha-wheel-normal') });
  wheelEl.innerHTML = wheelSVG;
  wheelWrap.appendChild(wheelEl);
  wheelWrap.appendChild(el('div', { class: 'ttd-gacha-stand' }));
  col.appendChild(wheelWrap);

  if (isSeasonal) {
    col.appendChild(el('div', { class: 'ttd-gacha-coming-soon' }, '🌱 Coming soon'));
  }

  const currencyIcon = isSeasonal ? '🪙' : '📄';
  const seasonalCosts = { 1: 10, 5: 45, 10: 90 };
  const pullRow = el('div', { class: 'ttd-pull-row ttd-pull-row-3' });
  for (const count of [1, 5, 10]) {
    const cost = isSeasonal ? seasonalCosts[count] : pullCost(count);
    pullRow.appendChild(el('button', {
      class: 'ttd-pull-btn',
      disabled: (isSeasonal || gachaSpinning || collection.gold < cost) ? 'disabled' : undefined,
      onClick: isSeasonal ? undefined : () => doPull(count),
    }, [el('span', { class: 'ttd-pull-btn-label' }, `x${count} SPIN`), el('span', { class: 'ttd-pull-btn-cost' }, `${cost} ${currencyIcon}`)]));
  }
  col.appendChild(pullRow);
  return col;
}

// The wheel actually spins before revealing what you got — a long,
// heavily-decelerating turn (fast start, real crawl at the very end,
// same feel as a real prize wheel) that lands the rolled rarity's wedge
// under the pointer, then flashes on landing — instead of the odds
// display just sitting still while cards appear. For a x5/x10 pull it
// spins once, landing on the first result, then the existing
// reveal-card sequence covers the rest.
let gachaSpinning = false;
const SPIN_DURATION_MS = 4200;

function spinWheelToRarity(rarity, onDone) {
  const wheelEl = gachaModal.querySelector('.ttd-gacha-wheel-normal');
  const idx = NORMAL_WHEEL_SLICES.findIndex(s => s.rarityId === rarity);
  if (!wheelEl || idx === -1) { onDone(); return; }
  const step = 360 / NORMAL_WHEEL_SLICES.length;
  const wedgeMid = idx * step + step / 2;
  const landingMod = (360 - wedgeMid + 360) % 360;
  const extraSpins = 8;
  wheelEl.style.transition = 'none';
  wheelEl.style.transform = 'rotate(0deg)';
  wheelEl.classList.remove('ttd-gacha-wheel-landed');
  void wheelEl.offsetWidth; // force reflow so the reset applies before the transition starts
  // A strong ease-out (quart-ish) — most of the visual travel happens in
  // the first half, and the tail crawls to a real stop instead of just
  // cutting off, which is what "should slow down at the end" needs.
  wheelEl.style.transition = `transform ${SPIN_DURATION_MS}ms cubic-bezier(0.08, 0.82, 0.13, 1)`;
  requestAnimationFrame(() => {
    wheelEl.style.transform = `rotate(${extraSpins * 360 + landingMod}deg)`;
  });
  setTimeout(() => {
    wheelEl.classList.add('ttd-gacha-wheel-landed');
    onDone();
  }, SPIN_DURATION_MS + 80);
}

function doPull(count) {
  if (gachaSpinning) return;
  const results = pullGacha(collection, 'standard', count);
  if (!results) return;
  gachaSpinning = true;
  gachaModal.querySelectorAll('.ttd-pull-btn').forEach(b => { b.disabled = true; });
  audio.playUpgrade();
  spinWheelToRarity(results[0].rarity, () => {
    gachaSpinning = false;
    lastPullResults = results;
    renderGachaModal();
    showPullReveal(results);
  });
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

// Matches the player's own trading-card sketch: rarity name as the big
// header (no "YOU GOT!" banner), a plain rectangular portrait box (not a
// curtained circle), name, description, then a Health/Damage/Range stat
// row — instead of the earlier curtain-reveal design.
function renderPullReveal() {
  clearChildren(revealOverlay);
  const u = revealQueue[revealIndex];
  const r = RARITY[u.rarity];
  const hp = u.hp ?? Math.round(40 + u.cost * 0.6);
  const portrait = el('div', { class: 'ttd-reveal-portrait' });
  portrait.appendChild(renderUnitPortrait(u, 150));
  const card = el('div', { class: `ttd-reveal-card rarity-${u.rarity}`, onClick: (e) => e.stopPropagation() }, [
    el('div', { class: 'ttd-reveal-label' }, r.label.toUpperCase()),
    portrait,
    el('div', { class: 'ttd-reveal-name' }, u.name),
    el('div', { class: 'ttd-reveal-desc' }, u.desc),
    el('div', { class: 'ttd-reveal-stats' }, [
      el('div', { class: 'ttd-reveal-stat' }, [el('div', { class: 'ttd-reveal-stat-val' }, `${hp}❤️`), el('div', { class: 'ttd-reveal-stat-label' }, 'Health')]),
      el('div', { class: 'ttd-reveal-stat' }, [el('div', { class: 'ttd-reveal-stat-val' }, `${u.damage}⚔️`), el('div', { class: 'ttd-reveal-stat-label' }, 'Damage')]),
      el('div', { class: 'ttd-reveal-stat' }, [el('div', { class: 'ttd-reveal-stat-val' }, `${u.range}🎯`), el('div', { class: 'ttd-reveal-stat-label' }, 'Range')]),
    ]),
    el('div', { class: 'ttd-reveal-next' }, revealIndex < revealQueue.length - 1 ? `Tap to continue (${revealIndex + 1}/${revealQueue.length})` : 'Tap to continue'),
  ]);
  revealOverlay.appendChild(card);
  revealOverlay.onclick = advancePullReveal;
}

// A fixed grid of numbered slots — matching the player's own Units
// sketch — instead of a card list that only shows what you already own.
// The first slots hold the actual roster (portrait + tap-to-equip once
// owned, a dimmed icon if it exists but you haven't pulled it yet); any
// slots beyond the current roster stay plain numbered placeholders for
// students still to come.
const TOTAL_UNIT_SLOTS = 20;

function renderInventoryTab(body) {
  body.appendChild(el('div', { class: 'ttd-equip-status' }, `Equipped ${collection.equipped.length} / ${MAX_EQUIPPED}`));
  const grid = el('div', { class: 'ttd-slot-grid' });
  for (let i = 0; i < TOTAL_UNIT_SLOTS; i++) {
    const def = UNIT_LIST[i];
    if (!def) {
      grid.appendChild(el('div', { class: 'ttd-slot' }, String(i + 1)));
      continue;
    }
    const count = collection.owned[def.id] || 0;
    const owned = count > 0;
    const equipped = collection.equipped.includes(def.id);
    const portraitBox = el('div', { class: 'ttd-slot-portrait' });
    portraitBox.appendChild(renderUnitFace(def, 60));
    const slot = el('button', {
      class: 'ttd-slot ttd-slot-filled' + (owned ? ' owned' : ' locked') + (equipped ? ' equipped' : ''),
      onClick: owned ? () => { toggleEquip(collection, def.id); renderInventoryModal(); refreshEquipRow(); } : undefined,
      disabled: owned ? undefined : true,
    }, [portraitBox]);
    grid.appendChild(slot);
  }
  body.appendChild(grid);
  body.appendChild(el('div', { class: 'ttd-slot-hint' }, 'Tap a recruited student to equip or unequip them.'));
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
    const faceBox = el('div', { class: 'ttd-unit-icon' });
    faceBox.appendChild(renderUnitFace(def, 30));
    list.appendChild(el('div', { class: `ttd-list-row rarity-${def.rarity}` }, [
      faceBox,
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
  // Wave 1 starts itself instead of waiting on a button tap — walking
  // into a battle with an empty lane and no enemies in sight read as
  // "nothing is happening" rather than "tap Start Wave".
  startNextWave(state);
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
