import { el } from '../util/dom.js';
import { rarityOf, RARITY_ORDER } from '../data/rarity.js';
import { fishById } from '../data/fish.js';
import { SCALES, scaleById } from '../data/scales.js';
import { sellOne, sellAllFish, nextBagUpgrade, buyBagUpgrade, buyScale, tradeUpFish, TRADE_UP_COUNT, ensureHotCatch, smokeFish, collectSmokedFish } from '../economy/economy.js';
import { HOT_CATCH_VALUE_MULT } from '../data/hotCatch.js';
import { SMOKEHOUSE_SLOTS, SMOKE_VALUE_MULT } from '../data/smokehouse.js';
import { bagCapacity } from '../core/gameState.js';
import { drawFishIcon, fishVisualDetail } from '../render/drawFishIcon.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { showToast } from './toast.js';
import { SHOP_THEMES } from './shopTheme.js';
import { emojiIcon, deltaSpan, statBar } from './rodShopPanel.js';
import { mutatedName } from '../data/mutations.js';
import { buildShopBanner } from './shopBanner.js';

const TABS = [
  { id: 'sell', label: '🐟 Sell Fish' },
  { id: 'smoke', label: '🔥 Smokehouse' },
  { id: 'scales', label: '⚖ Scales' },
];

// "4m 12s" / "Ready!" — a short real-time countdown for a Smokehouse slot,
// same coarse-on-purpose spirit as notebookPanel.js's formatCountdown but
// down to the second, since a slot only ever takes a few minutes.
function formatSmokeTime(ms) {
  if (ms <= 0) return 'Ready!';
  const totalSeconds = Math.ceil(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${String(seconds).padStart(2, '0')}s`;
}

// Groups of TRADE_UP_COUNT+ bagged fish of the same species, one tier below
// the rarity ceiling — same shape as economy.js's tradeUpFish's own count
// check, computed here purely for display so the row only ever shows up
// when the trade is actually available.
function duplicateGroups(state) {
  const counts = {};
  for (const item of state.bag.items) counts[item.fishId] = (counts[item.fishId] || 0) + 1;
  return Object.entries(counts)
    .filter(([, count]) => count >= TRADE_UP_COUNT)
    .map(([fishId, count]) => ({ fishId, count, fish: fishById(fishId) }))
    .filter(g => g.fish && rarityOf(g.fish.rarity).rank < RARITY_ORDER.length - 1);
}

function buildScaleRows(state, refresh, onChange) {
  const equippedStats = scaleById(state.scale.equipped);
  return SCALES.filter(s => !s.questOnly).map(scale => {
    const owned = state.scale.owned.includes(scale.id);
    const equipped = state.scale.equipped === scale.id;
    const btn = el('button', {
      class: equipped ? 'btn btn-equipped' : 'btn',
      text: equipped ? 'Equipped' : owned ? 'Owned' : `Buy — ${scale.cost}g`,
      disabled: owned ? 'disabled' : undefined,
      onClick: () => {
        const result = buyScale(state, scale.id);
        if (!result.ok) { showToast(state, 'Not enough gold for that scale.'); return; }
        showToast(state, `Bought the ${scale.name}! Equip it from your Satchel.`);
        refresh();
        onChange();
      },
    });
    return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
      emojiIcon('⚖'),
      el('div', { class: 'shop-row-info' }, [
        el('div', { class: 'shop-row-name' }, scale.name),
        el('div', { class: 'shop-row-stats' }, [`Sell Value ${statBar(scale.valueMul)}`, equipped ? null : deltaSpan(scale.valueMul - equippedStats.valueMul)]),
        el('div', { class: 'shop-row-stats' }, [`Luck ${statBar(scale.luck)}`, equipped ? null : deltaSpan(scale.luck - equippedStats.luck)]),
      ]),
      btn,
    ]);
  });
}

export function buildMarketPanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame('Trading Post', () => { closeOverlay(state); onChange(); }, {
    landscape: true, theme: SHOP_THEMES.market,
  });
  // A burlap-and-crate crosshatch wash over the themed body — see .panel-market.
  frame.classList.add('panel-market');

  let activeTab = 'sell';
  const tabBar = el('div', { class: 'satchel-tabs' }, TABS.map(tab => el('button', {
    class: 'satchel-tab' + (tab.id === activeTab ? ' active' : ''),
    text: tab.label,
    onClick: () => { activeTab = tab.id; refresh(); },
  })));

  // The Smokehouse — a slower, real-time alternative to selling on the
  // spot (economy.js's smokeFish/collectSmokedFish). Up to SMOKEHOUSE_SLOTS
  // fish can cure at once; each slot shows a live countdown until it's
  // ready to collect for SMOKE_VALUE_MULT of its original sale value.
  function refreshSmoke() {
    const nodes = [
      buildShopBanner('market'),
      el('div', { class: 'shop-tagline shop-grid-full' },
        `🔥 Cure a catch instead of selling it — ready fish pay out ${Math.round((SMOKE_VALUE_MULT - 1) * 100)}% more than a straight sale, but it takes real time.`),
    ];

    for (let i = 0; i < SMOKEHOUSE_SLOTS; i++) {
      const slot = state.smokehouse.slots[i];
      if (!slot) {
        nodes.push(el('div', { class: 'shop-row smokehouse-slot-empty' }, [
          emojiIcon('🪵'),
          el('div', { class: 'shop-row-info' }, [
            el('div', { class: 'shop-row-name' }, 'Empty rack'),
            el('div', { class: 'shop-row-stats' }, 'Smoke a fish from the Sell Fish tab to fill it.'),
          ]),
        ]));
        continue;
      }
      const rarity = rarityOf(slot.rarity);
      const remaining = slot.readyAt - Date.now();
      const ready = remaining <= 0;
      const payout = Math.round(slot.value * SMOKE_VALUE_MULT);
      const icon = el('canvas', { width: 40, height: 40, class: 'market-fish-icon' });
      const ictx = icon.getContext('2d');
      const fish = fishById(slot.fishId);
      drawFishIcon(ictx, fish ? fish.shape : 'round', 20, 20, 28, fish ? fish.hue : rarity.color, { alpha: ready ? 1 : 0.55, ...fishVisualDetail(slot.fishId) });
      nodes.push(el('div', { class: 'shop-row' + (ready ? ' quest-done' : '') }, [
        icon,
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name', style: `color:${rarity.color}` }, mutatedName(slot.name, slot)),
          el('div', { class: 'shop-row-stats' }, ready ? `Ready — worth ${payout}g` : `Curing — ready in ${formatSmokeTime(remaining)}`),
        ]),
        el('button', {
          class: 'btn' + (ready ? ' btn-primary' : ''),
          text: ready ? `Collect ${payout}g` : 'Curing…',
          disabled: ready ? undefined : 'disabled',
          onClick: () => {
            const result = collectSmokedFish(state, i);
            if (!result.ok) return;
            showToast(state, `Collected the ${result.name} — +${result.payout}g.`);
            refresh();
            onChange();
          },
        }),
      ]));
    }

    replaceContent(body, nodes);
  }

  function refreshScales() {
    replaceContent(body, [
      buildShopBanner('market'),
      el('div', { class: 'shop-tagline shop-grid-full' }, "⚖ B-LA-KA's scales — a keener eye weighs a catch true, and spots the rare ones faster."),
      ...buildScaleRows(state, refresh, onChange),
    ]);
  }

  function refresh() {
    ensureHotCatch(state);
    for (let i = 0; i < TABS.length; i++) {
      tabBar.children[i].classList.toggle('active', TABS[i].id === activeTab);
    }
    if (activeTab === 'scales') { refreshScales(); return; }
    if (activeTab === 'smoke') { refreshSmoke(); return; }

    const nodes = [buildShopBanner('market')];

    nodes.push(el('div', { class: 'market-summary shop-grid-full' },
      `Bag: ${state.bag.items.length}/${bagCapacity(state)}  ·  Gold: ${state.coins}`));

    // Today's Hot Catch (data/hotCatch.js) — a bonus applied at sell time
    // (economy.js's sellOne/sellAllFish), so this tagline is a heads-up,
    // not a promise the price is already baked into anything in the bag.
    const hotFish = fishById(state.hotCatch.fishId);
    if (hotFish) {
      nodes.push(el('div', { class: 'shop-tagline shop-grid-full' },
        `🔥 Today's Hot Catch: ${hotFish.name} — sells for +${Math.round((HOT_CATCH_VALUE_MULT - 1) * 100)}% today.`));
    }

    if (state.bag.items.length === 0) {
      nodes.push(el('div', { class: 'market-empty shop-grid-full' }, 'Nothing in your bag yet — go catch something!'));
    } else {
      for (let i = 0; i < state.bag.items.length; i++) {
        const item = state.bag.items[i];
        const rarity = rarityOf(item.rarity);
        const fish = fishById(item.fishId);
        const isHot = item.fishId === state.hotCatch.fishId;
        const sellValue = isHot ? Math.round(item.value * HOT_CATCH_VALUE_MULT) : item.value;

        const icon = el('canvas', { width: 40, height: 40, class: 'market-fish-icon' });
        const ictx = icon.getContext('2d');
        const glow = ictx.createRadialGradient(20, 20, 1, 20, 20, 20);
        glow.addColorStop(0, rarity.glow + '66');
        glow.addColorStop(1, rarity.glow + '00');
        ictx.fillStyle = glow;
        ictx.fillRect(0, 0, 40, 40);
        drawFishIcon(ictx, fish ? fish.shape : 'round', 20, 20, 28, fish ? fish.hue : rarity.color, fishVisualDetail(item.fishId));

        const badges = [
          el('span', {
            class: 'rarity-badge',
            style: `background:${rarity.color}2e; border-color:${rarity.color}; color:${rarity.color}`,
          }, rarity.label),
        ];
        if (isHot) badges.push(el('span', { class: 'rarity-badge hot-catch-badge' }, '🔥 Hot'));

        nodes.push(el('div', { class: 'shop-row' + (item.shiny ? ' shiny-item' : item.giant ? ' giant-item' : '') }, [
          icon,
          el('div', { class: 'shop-row-info' }, [
            el('div', { class: 'shop-row-name', style: `color:${item.shiny ? '#ffe066' : item.giant ? '#8fd4ff' : rarity.color}` }, mutatedName(item.name, item)),
            el('div', { class: 'shop-row-badges' }, badges),
            el('div', { class: 'shop-row-stats' }, `Size ${item.size.toFixed(1)}`),
          ]),
          el('button', {
            class: 'btn',
            text: `Sell ${sellValue}g`,
            onClick: () => { const sold = sellOne(state, i); showToast(state, `Sold ${sold.name} for ${sold.value}g.`); refresh(); onChange(); },
          }),
          el('button', {
            class: 'btn btn-chip',
            text: '🔥 Smoke',
            disabled: state.smokehouse.slots.length >= SMOKEHOUSE_SLOTS ? 'disabled' : undefined,
            title: state.smokehouse.slots.length >= SMOKEHOUSE_SLOTS ? 'Smokehouse is full' : `Cure for ${Math.round(item.value * SMOKE_VALUE_MULT)}g later`,
            onClick: () => {
              const result = smokeFish(state, i);
              if (!result.ok) return;
              showToast(state, `${item.name} is smoking — check the Smokehouse tab later.`);
              refresh();
              onChange();
            },
          }),
        ]));
      }

      nodes.push(el('button', {
        class: 'btn btn-primary shop-grid-full',
        text: 'Sell All',
        onClick: () => {
          const { lines, total } = sellAllFish(state);
          if (total > 0) showToast(state, `Sold ${lines.length} fish for ${total}g total.`);
          refresh();
          onChange();
        },
      }));

      // Chum the Duplicates — a real use for a bag full of the same
      // species beyond just selling it: trade TRADE_UP_COUNT of one fish
      // for a guaranteed random catch one rarity tier up.
      const groups = duplicateGroups(state);
      if (groups.length > 0) {
        nodes.push(el('div', { class: 'shop-section-title shop-grid-full' }, 'Chum the Duplicates'));
        nodes.push(el('div', { class: 'shop-tagline shop-grid-full' },
          `Trade ${TRADE_UP_COUNT} of the same fish for one guaranteed catch a tier higher.`));
        for (const group of groups) {
          const rarity = rarityOf(group.fish.rarity);
          const nextRarity = rarityOf(RARITY_ORDER[rarity.rank + 1]);
          nodes.push(el('div', { class: 'shop-row' }, [
            emojiIcon('♻'),
            el('div', { class: 'shop-row-info' }, [
              el('div', { class: 'shop-row-name' }, `${group.fish.name} ×${group.count}`),
              el('div', { class: 'shop-row-stats' }, [
                el('span', { style: `color:${rarity.color}` }, rarity.label),
                ' → ',
                el('span', { style: `color:${nextRarity.color}` }, nextRarity.label),
              ]),
            ]),
            el('button', {
              class: 'btn btn-chip',
              text: `Trade Up (${TRADE_UP_COUNT})`,
              onClick: () => {
                const result = tradeUpFish(state, group.fishId);
                if (!result.ok) { showToast(state, "That trade didn't go through."); return; }
                showToast(state, result.added
                  ? `Traded up into a ${nextRarity.label} ${result.fish.name}!`
                  : `Traded up into a ${result.fish.name} — bag was full, so it swam off.`);
                refresh();
                onChange();
              },
            }),
          ]));
        }
      }
    }

    const next = nextBagUpgrade(state);
    if (next) {
      nodes.push(el('div', { class: 'market-upgrade shop-grid-full' }, [
        el('div', {}, `Bigger Bag — capacity ${next.capacity}`),
        el('button', {
          class: 'btn',
          text: `Upgrade — ${next.cost}g`,
          onClick: () => {
            const result = buyBagUpgrade(state);
            if (!result.ok) { showToast(state, 'Not enough gold for that upgrade.'); return; }
            showToast(state, 'Bag upgraded!');
            refresh();
            onChange();
          },
        }),
      ]));
    }

    replaceContent(body, nodes);
  }

  frame.querySelector('.panel-body').insertAdjacentElement('beforebegin', tabBar);
  refresh();
  return { frame, refresh };
}
