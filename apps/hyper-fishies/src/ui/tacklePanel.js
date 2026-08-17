import { el } from '../util/dom.js';
import { BAIT } from '../data/bait.js';
import { SWIVELS, swivelById } from '../data/swivels.js';
import { TRAPS, TRAP_SLOTS, trapById } from '../data/traps.js';
import { rarityOf } from '../data/rarity.js';
import { buyBait, buySwivel, buyTrap, setTrap, collectTrap } from '../economy/economy.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { showToast } from './toast.js';
import { SHOP_THEMES } from './shopTheme.js';
import { drawBaitIcon } from '../render/drawBaitIcon.js';
import { emojiIcon, deltaSpan, statBar } from './rodShopPanel.js';
import { buildShopBanner } from './shopBanner.js';

const TABS = [
  { id: 'bait', label: '🪱 Bait' },
  { id: 'swivels', label: '🔗 Swivels' },
  { id: 'traps', label: '🪤 Traps' },
];

// "12m 04s" / "Ready!" — same coarse-to-the-second countdown shape as
// marketPanel.js's formatSmokeTime, for a trap's own real-time timer.
function formatTrapTime(ms) {
  if (ms <= 0) return 'Ready!';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

// Richy only sells bait here — equipping which bait is loaded happens in
// the Satchel (see ui/satchelPanel.js's Gear section), same as rods.
// Potency badge purely for flavor — a quick read on how strong a lure's
// rarity pull is before digging into the exact numbers.
// Exported so ui/satchelPanel.js can show the same potency badge on bait
// you already own, not just ones still on Richy's counter.
export function baitTier(bait) {
  if (bait.rarityBoost >= 15) return { label: 'Potent', cls: 'tier-legendary' };
  if (bait.rarityBoost >= 8) return { label: 'Strong', cls: 'tier-captain' };
  if (bait.rarityBoost > 0) return { label: 'Mild', cls: 'tier-master' };
  return { label: 'Basic', cls: 'tier-deckhand' };
}

function buildBaitRows(state, refresh, onChange) {
  const nodes = [];
  const equippedBait = BAIT.find(b => b.id === state.bait.equipped);
  // Richy's Special is never sold — see data/bait.js's questOnly flag —
  // it's only ever granted by finishing his secret quest.
  for (const bait of BAIT.filter(b => b.id !== 'none' && !b.questOnly)) {
    const owned = state.bait.owned[bait.id] || 0;
    const equipped = state.bait.equipped === bait.id;
    const cost = owned > 0 ? bait.stackCost : bait.cost;
    const tier = baitTier(bait);

    const buyBtn = el('button', {
      class: 'btn',
      text: `Buy — ${cost}g`,
      onClick: () => {
        const result = buyBait(state, bait.id, 1);
        if (!result.ok) { showToast(state, 'Not enough gold for that bait.'); return; }
        showToast(state, result.questTriggered
          ? "Richy leans in — \"Actually, hold on a moment...\" Talk to him again."
          : `Bought 1 ${bait.name}. Equip it from your Satchel.`);
        refresh();
        onChange();
      },
    });

    const icon = el('canvas', { width: 36, height: 36, class: 'bait-icon' });
    drawBaitIcon(icon.getContext('2d'), bait.shape, 18, 18, 30, bait.hue);

    // A rarity-pull delta vs whatever bait's currently loaded, same "is
    // this actually an upgrade" cue the Rod Shop's gear rows show — bait's
    // rarityBoost runs on its own whole-number scale (0-20ish) rather than
    // the 0-1 scale every other stat uses, so this builds its own tag
    // instead of going through deltaSpan's fixed 2-decimal formatting.
    const boostDelta = equippedBait ? bait.rarityBoost - equippedBait.rarityBoost : 0;
    const delta = !equipped && Math.abs(boostDelta) > 0
      ? el('span', { class: 'stat-delta ' + (boostDelta > 0 ? 'stat-delta-up' : 'stat-delta-down') }, `${boostDelta > 0 ? '▲+' : '▼'}${boostDelta} pull`)
      : null;

    nodes.push(el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
      icon,
      el('div', { class: 'shop-row-info' }, [
        el('div', { class: 'shop-row-name' }, `${bait.name}  (x${owned})`),
        el('div', { class: 'shop-row-badges' }, [
          el('span', { class: 'tier-badge ' + tier.cls }, tier.label),
        ]),
        el('div', { class: 'shop-row-stats' }, [bait.desc, delta]),
      ]),
      buyBtn,
    ]));
  }
  return nodes;
}

function buildSwivelRows(state, refresh, onChange) {
  const equippedStats = swivelById(state.swivel.equipped);
  return SWIVELS.map(swivel => {
    const owned = state.swivel.owned.includes(swivel.id);
    const equipped = state.swivel.equipped === swivel.id;
    const btn = el('button', {
      class: equipped ? 'btn btn-equipped' : 'btn',
      text: equipped ? 'Equipped' : owned ? 'Owned' : `Buy — ${swivel.cost}g`,
      disabled: owned ? 'disabled' : undefined,
      onClick: () => {
        const result = buySwivel(state, swivel.id);
        if (!result.ok) { showToast(state, 'Not enough gold for that swivel.'); return; }
        showToast(state, `Bought the ${swivel.name}! Equip it from your Satchel.`);
        refresh();
        onChange();
      },
    });
    return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
      emojiIcon('🔗'),
      el('div', { class: 'shop-row-info' }, [
        el('div', { class: 'shop-row-name' }, swivel.name),
        el('div', { class: 'shop-row-stats' }, [`Luck ${statBar(swivel.luck)}`, equipped ? null : deltaSpan(swivel.luck - equippedStats.luck)]),
        el('div', { class: 'shop-row-stats' }, [`Bite Speed ${statBar(swivel.biteSpeed)}`, equipped ? null : deltaSpan(swivel.biteSpeed - equippedStats.biteSpeed)]),
      ]),
      btn,
    ]);
  });
}

// Crab Traps (data/traps.js) — the one system that pays out on real
// wall-clock time instead of an actual cast. First, the three trap types
// you can buy into your satchel; then, up to TRAP_SLOTS set-and-waiting
// slots, same "empty rack vs. curing vs. ready" three-state shape as
// marketPanel.js's Smokehouse tab.
function buildTrapShopRows(state, refresh, onChange) {
  return TRAPS.map(trap => {
    const owned = state.traps.owned[trap.id] || 0;
    const rarityLabel = rarityOf(['common', 'rare', 'legendary'][trap.maxRarityRank] || 'common').label;
    return el('div', { class: 'shop-row' }, [
      emojiIcon('🪤'),
      el('div', { class: 'shop-row-info' }, [
        el('div', { class: 'shop-row-name' }, `${trap.name}${owned ? `  (x${owned})` : ''}`),
        el('div', { class: 'shop-row-badges' }, [
          el('span', { class: 'tier-badge tier-deckhand' }, `Up to ${rarityLabel}`),
          el('span', { class: 'rune-slot-badge' }, `⏱ ${formatTrapTime(trap.durationMs)}`),
        ]),
        el('div', { class: 'shop-row-stats' }, trap.desc),
      ]),
      el('button', {
        class: 'btn',
        text: `Buy — ${trap.cost}g`,
        onClick: () => {
          const result = buyTrap(state, trap.id);
          if (!result.ok) { showToast(state, 'Not enough gold for that trap.'); return; }
          showToast(state, `Bought a ${trap.name} — set it out from the slots below.`);
          refresh();
          onChange();
        },
      }),
    ]);
  });
}

function buildTrapSlotRows(state, refresh, onChange) {
  const nodes = [];
  for (let i = 0; i < TRAP_SLOTS; i++) {
    const slot = state.traps.slots[i];
    if (!slot) {
      const ownedIds = Object.keys(state.traps.owned).filter(id => state.traps.owned[id] > 0);
      nodes.push(el('div', { class: 'shop-row smokehouse-slot-empty' }, [
        emojiIcon('〰'),
        el('div', { class: 'shop-row-info' }, ownedIds.length === 0
          ? [
            el('div', { class: 'shop-row-name' }, 'Open slot'),
            el('div', { class: 'shop-row-stats' }, 'Buy a trap above, then set it here.'),
          ]
          : [
            el('div', { class: 'shop-row-name' }, 'Open slot — tap a trap to set it:'),
            el('div', { class: 'rune-chip-row' }, ownedIds.map(id => {
              const t = trapById(id);
              return el('button', {
                class: 'btn btn-chip',
                text: `${t.name} (x${state.traps.owned[id]})`,
                onClick: () => {
                  const result = setTrap(state, id);
                  if (!result.ok) return;
                  showToast(state, `${t.name} set — ready in ${formatTrapTime(t.durationMs)}.`);
                  refresh();
                  onChange();
                },
              });
            })),
          ]),
      ]));
      continue;
    }

    const trap = trapById(slot.trapId);
    const remaining = slot.readyAt - Date.now();
    const ready = remaining <= 0;
    nodes.push(el('div', { class: 'shop-row' + (ready ? ' quest-done' : '') }, [
      emojiIcon(ready ? '🎣' : '🪤'),
      el('div', { class: 'shop-row-info' }, [
        el('div', { class: 'shop-row-name' }, trap ? trap.name : 'Trap'),
        el('div', { class: 'shop-row-stats' }, ready ? 'Ready to check' : `Waiting — ready in ${formatTrapTime(remaining)}`),
      ]),
      el('button', {
        class: 'btn' + (ready ? ' btn-primary' : ''),
        text: ready ? 'Check Trap' : 'Waiting…',
        disabled: ready ? undefined : 'disabled',
        onClick: () => {
          const result = collectTrap(state, i);
          if (!result.ok) return;
          if (!result.fish) { showToast(state, 'The trap came up empty.'); }
          else if (!result.added) { showToast(state, `Caught a ${result.fish.name} in the trap — bag was full, so it swam off.`); }
          else { showToast(state, `The trap turned up a ${result.fish.name}!`); }
          refresh();
          onChange();
        },
      }),
    ]));
  }
  return nodes;
}

export function buildTacklePanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame('Bait & Barnacles', () => { closeOverlay(state); onChange(); }, {
    landscape: true, theme: SHOP_THEMES.tackle,
  });
  // A faint damp-ripple wash over the themed body — see .panel-tackle.
  frame.classList.add('panel-tackle');

  let activeTab = 'bait';
  const tabBar = el('div', { class: 'satchel-tabs' }, TABS.map(tab => el('button', {
    class: 'satchel-tab' + (tab.id === activeTab ? ' active' : ''),
    text: tab.label,
    onClick: () => { activeTab = tab.id; refresh(); },
  })));

  function refresh() {
    for (let i = 0; i < TABS.length; i++) {
      tabBar.children[i].classList.toggle('active', TABS[i].id === activeTab);
    }
    const taglines = {
      bait: '🪝 Richy\'s tackle — bait for anything that swims, crawls, or lurks below.',
      swivels: '🔗 A smoother rig spooks fewer fish and reads a bite sooner.',
      traps: '🪤 Set a trap and walk away — it keeps working the water on real-world time, whether you\'re here to watch it or not.',
    };
    const nodes = [buildShopBanner('tackle'), el('div', { class: 'shop-tagline shop-grid-full' }, taglines[activeTab])];
    if (activeTab === 'bait') nodes.push(...buildBaitRows(state, refresh, onChange));
    if (activeTab === 'swivels') nodes.push(...buildSwivelRows(state, refresh, onChange));
    if (activeTab === 'traps') {
      nodes.push(...buildTrapShopRows(state, refresh, onChange));
      nodes.push(el('div', { class: 'shop-section-title shop-grid-full' }, 'Set Traps'));
      nodes.push(...buildTrapSlotRows(state, refresh, onChange));
    }
    replaceContent(body, nodes);
  }

  frame.querySelector('.panel-body').insertAdjacentElement('beforebegin', tabBar);
  refresh();
  return { frame, refresh };
}
