import { el } from '../util/dom.js';
import { RUNES, runeById } from '../data/runes.js';
import { RODS, rodRuneSlots } from '../data/rods.js';
import { craftRune, socketRune, removeRune, craftCleansingRune, buyPotion, RUNE_SOCKET_COST, RUNE_REMOVE_COST } from '../economy/economy.js';
import { POTIONS } from '../data/potions.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { showToast } from './toast.js';
import { drawRuneIcon } from '../render/drawRuneIcon.js';
import { drawRodIcon } from '../render/drawRodIcon.js';
import { SHOP_THEMES } from './shopTheme.js';
import { emojiIcon } from './rodShopPanel.js';
import { buildShopBanner } from './shopBanner.js';

// Grizelda's shop is two halves, now split into their own tabs: conjure a
// rune into your satchel (costs its own craftCost), then separately pay
// her to socket it onto a rod's rune slots, or to pry a socketed one back
// out — both flat ritual fees on top of the rune's own worth. Runes carry
// no rarity, so there's no tier badge here the way Rod Shop/Tackle have one.
function effectLine(effect) {
  const parts = [];
  if (effect.luck) parts.push(`+${Math.round(effect.luck * 100)}% Luck`);
  if (effect.control) parts.push(`+${Math.round(effect.control * 100)}% Control`);
  if (effect.biteSpeed) parts.push(`+${Math.round(effect.biteSpeed * 100)}% Bite Speed`);
  if (effect.valueMul) parts.push(`+${Math.round(effect.valueMul * 100)}% Sell Value`);
  if (effect.sizeMul) parts.push(`+${Math.round(effect.sizeMul * 100)}% Size`);
  if (effect.snapGuard) parts.push(`+${Math.round(effect.snapGuard * 100)}% Snap Ward`);
  return parts.join('  ·  ');
}

const TABS = [
  { id: 'conjure', label: '✨ Conjure' },
  { id: 'manage', label: '🔧 Socket & Remove' },
  { id: 'brews', label: '🧪 Brews' },
];

function formatBrewTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function buildWitchShopPanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame("Witch's Runes", () => { closeOverlay(state); onChange(); }, {
    landscape: true, theme: SHOP_THEMES.runeShop,
  });
  // Faint starfield wash on the body background — see .panel-witch.
  frame.classList.add('panel-witch');

  let activeTab = 'conjure';
  const tabBar = el('div', { class: 'satchel-tabs' }, TABS.map(tab => el('button', {
    class: 'satchel-tab' + (tab.id === activeTab ? ' active' : ''),
    text: tab.label,
    onClick: () => { activeTab = tab.id; refresh(); },
  })));

  function buildConjureNodes() {
    const nodes = [];
    for (const rune of RUNES) {
      const owned = state.runes.owned[rune.id] || 0;
      const icon = el('canvas', { width: 36, height: 36, class: 'rune-icon' });
      drawRuneIcon(icon.getContext('2d'), rune.glyph, 18, 18, 32, rune.hue);

      nodes.push(el('div', { class: 'shop-row' }, [
        icon,
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, rune.name + (owned ? `  (x${owned})` : '')),
          el('div', { class: 'shop-row-badges' }, [
            el('span', {
              class: 'rune-badge',
              style: `background:${rune.hue}2e; border-color:${rune.hue}; color:${rune.hue}`,
            }, effectLine(rune.effect)),
          ]),
          el('div', { class: 'shop-row-stats' }, rune.desc),
        ]),
        el('button', {
          class: 'btn btn-conjure',
          text: `Conjure — ${rune.craftCost}g`,
          onClick: () => {
            const result = craftRune(state, rune.id);
            if (!result.ok) { showToast(state, 'Not enough gold for that rune.'); return; }
            showToast(state, `Conjured a ${rune.name}. Socket it from the Socket & Remove tab.`);
            refresh();
            onChange();
          },
        }),
      ]));
    }
    return nodes;
  }

  function buildManageNodes() {
    const ownedRods = RODS.filter(r => state.rod.owned.includes(r.id));
    if (ownedRods.length === 0) {
      return [el('div', { class: 'market-empty shop-grid-full' }, "You don't own any rods yet.")];
    }

    const nodes = [];
    for (const rod of ownedRods) {
      const slots = rodRuneSlots(rod.cost);
      const socketedIds = state.rod.socketed[rod.id] || [];
      const icon = el('canvas', { width: 36, height: 36, class: 'rod-icon' });
      drawRodIcon(icon.getContext('2d'), rod.material, 18, 18, 30);

      const slotRows = [];
      for (let i = 0; i < slots; i++) {
        const runeId = socketedIds[i];
        const rune = runeId ? runeById(runeId) : null;

        if (rune) {
          slotRows.push(el('div', { class: 'rune-slot-row filled' }, [
            el('span', { class: 'rune-slot-index' }, `${i + 1}`),
            el('div', { class: 'rune-slot-body' }, [
              el('div', { class: 'shop-row-name' }, rune.name),
              el('div', { class: 'shop-row-badges' }, [
                el('span', {
                  class: 'rune-badge',
                  style: `background:${rune.hue}2e; border-color:${rune.hue}; color:${rune.hue}`,
                }, effectLine(rune.effect)),
              ]),
            ]),
            el('button', {
              class: 'btn btn-chip',
              text: `Remove — ${RUNE_REMOVE_COST}g`,
              onClick: () => {
                const result = removeRune(state, rod.id, i);
                if (!result.ok) { showToast(state, 'Not enough gold to pry that rune loose.'); return; }
                showToast(state, `Removed the ${rune.name} — back in your satchel.`);
                refresh();
                onChange();
              },
            }),
          ]));
          continue;
        }

        const ownedRuneIds = Object.keys(state.runes.owned).filter(id => state.runes.owned[id] > 0);
        slotRows.push(el('div', { class: 'rune-slot-row' }, [
          el('span', { class: 'rune-slot-index' }, `${i + 1}`),
          el('div', { class: 'rune-slot-body' }, ownedRuneIds.length === 0
            ? [el('span', { class: 'rune-slot-empty-label' }, `Empty — conjure a rune first`)]
            : [
              el('span', { class: 'rune-slot-empty-label' }, `Empty — tap to set (${RUNE_SOCKET_COST}g):`),
              el('div', { class: 'rune-chip-row' }, ownedRuneIds.map(id => {
                const r = runeById(id);
                return el('button', {
                  class: 'btn btn-chip',
                  text: `${r.name} (x${state.runes.owned[id]})`,
                  onClick: () => {
                    const result = socketRune(state, rod.id, id);
                    if (!result.ok) { showToast(state, 'Not enough gold to set that rune.'); return; }
                    showToast(state, `Set the ${r.name} into the ${rod.name}.`);
                    refresh();
                    onChange();
                  },
                });
              })),
            ]),
        ]));
      }

      nodes.push(el('div', { class: 'rune-rod-card shop-grid-full' }, [
        el('div', { class: 'rune-rod-header' }, [
          icon,
          el('div', {}, [
            el('div', { class: 'shop-row-name' }, rod.name),
            el('div', { class: 'shop-row-stats' }, `${socketedIds.length}/${slots} rune slots filled`),
          ]),
        ]),
        el('div', { class: 'rune-slot-list' }, slotRows),
      ]));
    }
    return nodes;
  }

  function buildBrewNodes() {
    const nodes = [];
    const active = state.activePotion.id ? POTIONS.find(p => p.id === state.activePotion.id) : null;
    nodes.push(el('div', { class: 'shop-row rune-rod-card shop-grid-full' }, [
      el('div', { class: 'shop-row-info' }, [
        el('div', { class: 'shop-row-name' }, active ? `${active.icon} ${active.name} active` : 'No brew active'),
        el('div', { class: 'shop-row-stats' }, active ? `${formatBrewTime(state.activePotion.timeLeft)} remaining — ${effectLine(active.effect)}` : 'Buy one below — only one can be active at a time.'),
      ]),
    ]));
    for (const potion of POTIONS) {
      nodes.push(el('div', { class: 'shop-row' + (state.activePotion.id === potion.id ? ' active' : '') }, [
        emojiIcon(potion.icon),
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, potion.name),
          el('div', { class: 'shop-row-badges' }, [
            el('span', {
              class: 'rune-badge',
              style: `background:${SHOP_THEMES.runeShop.accent}2e; border-color:${SHOP_THEMES.runeShop.accent}; color:${SHOP_THEMES.runeShop.accent}`,
            }, effectLine(potion.effect)),
          ]),
          el('div', { class: 'shop-row-stats' }, `Lasts ${formatBrewTime(potion.duration)}`),
        ]),
        el('button', {
          class: 'btn btn-conjure',
          text: `Brew — ${potion.cost}g`,
          onClick: () => {
            const result = buyPotion(state, potion.id);
            if (!result.ok) { showToast(state, 'Not enough gold for that brew.'); return; }
            showToast(state, `${potion.name} is in your system — ${formatBrewTime(potion.duration)} on the clock.`);
            refresh();
            onChange();
          },
        }),
      ]));
    }
    return nodes;
  }

  function refresh() {
    for (let i = 0; i < TABS.length; i++) {
      tabBar.children[i].classList.toggle('active', TABS[i].id === activeTab);
    }
    const nodes = [
      buildShopBanner('runeShop'),
      el('div', { class: 'shop-tagline shop-grid-full' },
        "🔮 Grizelda's runes — carved from stone, bound with a little of her own luck."),
    ];

    // Luca's cure: once every cursed ingredient is in hand (see
    // fishing/fishingMachine.js's resolveCatch), Grizelda can carve the
    // Cleansing Rune on the spot — a one-off ritual, not a regular
    // catalogue rune, so it gets its own banner instead of a shop row.
    if (state.quests.luca.stage === 'ingredientsReady') {
      nodes.push(el('div', { class: 'shop-row rune-rod-card shop-grid-full' }, [
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, 'The Cleansing Rune'),
          el('div', { class: 'shop-row-stats' }, "Every ingredient Luca needs, gathered from the Abyssal Lands — ready to be bound into a cure."),
        ]),
        el('button', {
          class: 'btn',
          text: 'Carve the Cleansing Rune',
          onClick: () => {
            const result = craftCleansingRune(state);
            if (result.ok) showToast(state, 'The rune is carved. Bring it back to Luca.');
            refresh();
            onChange();
          },
        }),
      ]));
    }

    if (activeTab === 'conjure') nodes.push(...buildConjureNodes());
    else if (activeTab === 'manage') nodes.push(...buildManageNodes());
    else nodes.push(...buildBrewNodes());
    replaceContent(body, nodes);
  }

  frame.querySelector('.panel-body').insertAdjacentElement('beforebegin', tabBar);
  refresh();
  return { frame, refresh };
}
