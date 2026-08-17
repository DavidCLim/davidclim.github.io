import { el } from '../util/dom.js';
import { RODS, rodTierIndex, rodRuneSlots, rodById } from '../data/rods.js';
import { HOOKS, hookById } from '../data/hooks.js';
import { LINES, lineById } from '../data/fishingLine.js';
import { buyRod, buyHook, buyLine } from '../economy/economy.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { showToast } from './toast.js';
import { drawRodIcon } from '../render/drawRodIcon.js';
import { SHOP_THEMES } from './shopTheme.js';
import { buildShopBanner } from './shopBanner.js';

const TABS = [
  { id: 'rods', label: '🎣 Rods' },
  { id: 'hooks', label: '🪝 Hooks' },
  { id: 'line', label: '🧵 Line' },
];

// A plain oversized emoji standing in for a canvas icon on the two newer
// gear rows — Rods already have a bespoke per-material drawRodIcon, but a
// whole icon-drawing module for two small five-item lists would be a lot of
// code for very little payoff; every other icon-less badge in this game
// (HUD chips, bounty rows) already leans on emoji the same way.
export function emojiIcon(char) {
  return el('div', { class: 'gear-emoji-icon' }, char);
}

// Finn only sells rods here — equipping an owned rod happens in the
// Satchel (see ui/satchelPanel.js's Gear section), same as bait.
// Rank badge purely for flavor — tells a new hand at a glance whether a
// rod is beginner gear or something a veteran captain would carry. Top tier
// used to be "Legendary" — a video-game rarity word that didn't fit the
// naval-rank ladder below it (Deckhand -> Journeyman -> Master -> Captain's),
// so it continues the same chain of command instead: the rank above Captain.
// Index lines up with data/rods.js's rodTierIndex/RUNE_SLOTS_BY_TIER, so a
// rod's rank and its rune-slot count always move together.
const TIER_INFO = [
  { label: 'Deckhand', cls: 'tier-deckhand' },
  { label: 'Journeyman', cls: 'tier-journeyman' },
  { label: 'Master', cls: 'tier-master' },
  { label: "Captain's", cls: 'tier-captain' },
  { label: "Admiral's", cls: 'tier-admiral' },
];
// The one badge that doesn't come from the cost ladder above — Cursed
// rarity belongs to exactly one item in the whole game (data/rods.js's
// Devil's Rod), so it's a flag check rather than another cost breakpoint.
const CURSED_TIER = { label: 'Cursed', cls: 'tier-cursed' };

// Exported so ui/satchelPanel.js can show the same rank badge on rods
// you already own, not just ones still on Finn's rack. Takes the whole rod
// (not just its cost) so the Cursed override can short-circuit the normal
// cost-based lookup.
export function rodTier(rod) {
  if (rod.cursed) return CURSED_TIER;
  return TIER_INFO[rodTierIndex(rod.cost)];
}

function buildRodRows(state, refresh, onChange) {
  const equippedStats = rodById(state.rod.equipped);
  return RODS.filter(r => !r.craftedOnly).map(rod => {
    const owned = state.rod.owned.includes(rod.id);
    const equipped = state.rod.equipped === rod.id;
    const tier = rodTier(rod);

    const icon = el('canvas', { width: 36, height: 36, class: 'rod-icon' });
    drawRodIcon(icon.getContext('2d'), rod.material, 18, 18, 30);

    const btn = el('button', {
      class: equipped ? 'btn btn-equipped' : 'btn',
      text: equipped ? 'Equipped' : owned ? 'Owned' : `Buy — ${rod.cost}g`,
      disabled: owned ? 'disabled' : undefined,
      onClick: () => {
        const result = buyRod(state, rod.id);
        if (!result.ok) { showToast(state, 'Not enough gold for that rod.'); return; }
        showToast(state, `Bought the ${rod.name}! Equip it from your Satchel.`);
        refresh();
        onChange();
      },
    });

    const slots = rodRuneSlots(rod.cost);

    return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
      icon,
      el('div', { class: 'shop-row-info' }, [
        el('div', { class: 'shop-row-name' }, rod.name),
        el('div', { class: 'shop-row-badges' }, [
          el('span', { class: 'tier-badge ' + tier.cls }, tier.label),
          el('span', { class: 'rune-slot-badge' }, `🔮 ${slots} slot${slots > 1 ? 's' : ''}`),
        ]),
        el('div', { class: 'shop-row-stats' }, [`Luck ${statBar(rod.luck)}`, equipped ? null : deltaSpan(rod.luck - equippedStats.luck)]),
        el('div', { class: 'shop-row-stats' }, [`Control ${statBar(rod.control)}`, equipped ? null : deltaSpan(rod.control - equippedStats.control)]),
        el('div', { class: 'shop-row-stats' }, [`Bite ${statBar(rod.biteSpeed)}`, equipped ? null : deltaSpan(rod.biteSpeed - equippedStats.biteSpeed)]),
      ]),
      btn,
    ]);
  });
}

function buildHookRows(state, refresh, onChange) {
  const equippedStats = hookById(state.hook.equipped);
  return HOOKS.map(hook => {
    const owned = state.hook.owned.includes(hook.id);
    const equipped = state.hook.equipped === hook.id;
    const btn = el('button', {
      class: equipped ? 'btn btn-equipped' : 'btn',
      text: equipped ? 'Equipped' : owned ? 'Owned' : `Buy — ${hook.cost}g`,
      disabled: owned ? 'disabled' : undefined,
      onClick: () => {
        const result = buyHook(state, hook.id);
        if (!result.ok) { showToast(state, 'Not enough gold for that hook.'); return; }
        showToast(state, `Bought the ${hook.name}! Equip it from your Satchel.`);
        refresh();
        onChange();
      },
    });
    return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
      emojiIcon('🪝'),
      el('div', { class: 'shop-row-info' }, [
        el('div', { class: 'shop-row-name' }, hook.name),
        el('div', { class: 'shop-row-stats' }, [`Snap Guard ${statBar(hook.snapGuard)}`, equipped ? null : deltaSpan(hook.snapGuard - equippedStats.snapGuard)]),
        el('div', { class: 'shop-row-stats' }, [`Control ${statBar(hook.control)}`, equipped ? null : deltaSpan(hook.control - equippedStats.control)]),
      ]),
      btn,
    ]);
  });
}

function buildLineRows(state, refresh, onChange) {
  const equippedStats = lineById(state.line.equipped);
  return LINES.map(line => {
    const owned = state.line.owned.includes(line.id);
    const equipped = state.line.equipped === line.id;
    const btn = el('button', {
      class: equipped ? 'btn btn-equipped' : 'btn',
      text: equipped ? 'Equipped' : owned ? 'Owned' : `Buy — ${line.cost}g`,
      disabled: owned ? 'disabled' : undefined,
      onClick: () => {
        const result = buyLine(state, line.id);
        if (!result.ok) { showToast(state, 'Not enough gold for that line.'); return; }
        showToast(state, `Bought the ${line.name}! Equip it from your Satchel.`);
        refresh();
        onChange();
      },
    });
    return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
      emojiIcon('🧵'),
      el('div', { class: 'shop-row-info' }, [
        el('div', { class: 'shop-row-name' }, line.name),
        el('div', { class: 'shop-row-stats' }, [`Bite Speed ${statBar(line.biteSpeed)}`, equipped ? null : deltaSpan(line.biteSpeed - equippedStats.biteSpeed)]),
        el('div', { class: 'shop-row-stats' }, [`Control ${statBar(line.control)}`, equipped ? null : deltaSpan(line.control - equippedStats.control)]),
      ]),
      btn,
    ]);
  });
}

export function buildRodShopPanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame('Rigging & Rods', () => { closeOverlay(state); onChange(); }, {
    landscape: true, theme: SHOP_THEMES.rodShop,
  });
  // Faint plank-grain wash on the body background — see .panel-rodshop.
  frame.classList.add('panel-rodshop');

  let activeTab = 'rods';
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
      rods: '⚓ Finn\'s rigging — every rod hand-lashed to haul in something bigger than the last.',
      hooks: '🪝 A sharper, heavier hook holds a fight instead of letting it slip.',
      line: '🧵 The right line reads a bite sooner and keeps your hands steady through the reel.',
    };
    const nodes = [
      buildShopBanner('rodShop'),
      el('div', { class: 'shop-tagline shop-grid-full' }, taglines[activeTab]),
    ];
    if (activeTab === 'rods') nodes.push(...buildRodRows(state, refresh, onChange));
    if (activeTab === 'hooks') nodes.push(...buildHookRows(state, refresh, onChange));
    if (activeTab === 'line') nodes.push(...buildLineRows(state, refresh, onChange));
    replaceContent(body, nodes);
  }

  frame.querySelector('.panel-body').insertAdjacentElement('beforebegin', tabBar);
  refresh();
  return { frame, refresh };
}

// One line per stat (full label, 8-segment bar) instead of cramming all
// three onto one line — gives each rod row real weight/substance instead
// of reading as thin as a rune row, while still staying short enough per
// line that nothing wraps or overlaps.
export function statBar(v) {
  const filled = Math.round(v * 8);
  return '●'.repeat(filled) + '○'.repeat(8 - filled);
}

// A small "+0.06" / "-0.03" tag next to a stat bar, colored by direction —
// lets a shopper see at a glance whether an item is actually an upgrade
// over what's currently equipped, instead of having to remember the
// equipped item's own numbers and do the subtraction themselves. Returns
// null (skipped by el()'s children filter) for a wash, so an equipped or
// identical-stat row shows no tag at all rather than a "+0.00".
export function deltaSpan(delta) {
  if (delta === null || delta === undefined || Math.abs(delta) < 0.005) return null;
  const up = delta > 0;
  return el('span', { class: 'stat-delta ' + (up ? 'stat-delta-up' : 'stat-delta-down') }, `${up ? '▲+' : '▼'}${delta.toFixed(2)}`);
}
