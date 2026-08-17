import { el } from '../util/dom.js';
import { rarityOf } from '../data/rarity.js';
import { fishById } from '../data/fish.js';
import { RODS, rodRuneSlots } from '../data/rods.js';
import { rodMasteryProgress, ROD_MASTERY_MAX_LEVEL } from '../data/rodMastery.js';
import { BAIT } from '../data/bait.js';
import { HOOKS } from '../data/hooks.js';
import { LINES } from '../data/fishingLine.js';
import { SWIVELS } from '../data/swivels.js';
import { SCALES } from '../data/scales.js';
import { titleById } from '../data/titles.js';
import { equipRod, equipBait, equipHook, equipLine, equipSwivel, equipScale, saveLoadout, equipLoadout, deleteLoadout, MAX_LOADOUTS, equipBestGear } from '../economy/economy.js';
import { bagCapacity } from '../core/gameState.js';
import { drawFishIcon, fishVisualDetail } from '../render/drawFishIcon.js';
import { drawRodIcon } from '../render/drawRodIcon.js';
import { drawBaitIcon } from '../render/drawBaitIcon.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { showToast } from './toast.js';
import { SHOP_THEMES } from './shopTheme.js';
import { rodTier, emojiIcon } from './rodShopPanel.js';
import { baitTier } from './tacklePanel.js';
import { mutatedName } from '../data/mutations.js';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'rods', label: 'Rods' },
  { id: 'bait', label: 'Bait' },
  { id: 'gear', label: 'Gear' },
  { id: 'fish', label: 'Fish' },
  { id: 'loadouts', label: 'Loadouts' },
];

// The Satchel is both "what am I carrying" (fish) and "what am I using"
// (Gear: owned rods/bait). The shops (Rod Shop, Bait Shop) only sell now —
// this is the one place you actually equip what you've bought. Tabs let you
// jump straight to the one category you care about instead of scrolling
// past everything else.
export function buildSatchelPanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame('Satchel', () => { closeOverlay(state); onChange(); }, {
    landscape: true, theme: SHOP_THEMES.satchel,
  });
  // A worn leather cross-hatch wash over the themed body — see .panel-satchel.
  frame.classList.add('panel-satchel');

  let activeTab = 'all';
  const tabBar = el('div', { class: 'satchel-tabs' }, TABS.map(tab => el('button', {
    class: 'satchel-tab' + (tab.id === activeTab ? ' active' : ''),
    text: tab.label,
    onClick: () => { activeTab = tab.id; refresh(); },
  })));
  // A clipped leather strip with a brass buckle hanging over the tab row —
  // the one bit of chrome that makes this panel actually read as a bag
  // you're carrying, not just another counter-and-ledger shop panel.
  const flap = el('div', { class: 'satchel-flap' }, [el('div', { class: 'satchel-buckle' })]);

  function buildRodRows() {
    const ownedRods = RODS.filter(r => state.rod.owned.includes(r.id));
    return ownedRods.map(rod => {
      const equipped = state.rod.equipped === rod.id;
      const filled = (state.rod.socketed[rod.id] || []).length;
      const slots = rodRuneSlots(rod.cost);
      const tier = rodTier(rod);
      const icon = el('canvas', { width: 36, height: 36, class: 'rod-icon' });
      drawRodIcon(icon.getContext('2d'), rod.material, 18, 18, 30);
      const mastery = rodMasteryProgress(state, rod.id);
      const masteryPct = mastery.maxed ? 100 : Math.round((mastery.xp / mastery.xpToNext) * 100);
      return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
        icon,
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, rod.name),
          el('div', { class: 'shop-row-badges' }, [
            el('span', { class: 'tier-badge ' + tier.cls }, tier.label),
            el('span', { class: 'rune-slot-badge' }, `🔮 ${filled}/${slots}`),
          ]),
          el('div', { class: 'shop-row-stats' }, equipped ? 'Equipped' : 'In your satchel'),
          el('div', { class: 'rod-mastery-row' }, [
            el('span', { class: 'rod-mastery-label' }, mastery.maxed ? `Mastery ${ROD_MASTERY_MAX_LEVEL}/${ROD_MASTERY_MAX_LEVEL} (max)` : `Mastery ${mastery.level}/${ROD_MASTERY_MAX_LEVEL}`),
            el('div', { class: 'rod-mastery-bar' }, [
              el('div', { class: 'rod-mastery-bar-fill', style: `width:${masteryPct}%` }),
            ]),
          ]),
        ]),
        el('button', {
          class: equipped ? 'btn btn-equipped' : 'btn',
          text: equipped ? 'Equipped' : 'Equip',
          disabled: equipped ? 'disabled' : undefined,
          onClick: () => { equipRod(state, rod.id); showToast(state, `Equipped the ${rod.name}.`); refresh(); onChange(); },
        }),
      ]);
    });
  }

  function buildBaitRows() {
    const noneBait = BAIT.find(b => b.id === 'none');
    const ownedBait = [noneBait].concat(BAIT.filter(b => b.id !== 'none' && (state.bait.owned[b.id] || 0) > 0));
    return ownedBait.map(bait => {
      const equipped = state.bait.equipped === bait.id;
      const count = bait.id === 'none' ? null : state.bait.owned[bait.id] || 0;
      // `questOnly` bait (currently just Richy's Special) is granted as a
      // large-but-finite UNLIMITED_BAIT_QTY once earned, not a literal
      // Infinity (see data/bait.js for why) — its count reads as a badge
      // instead of a raw six-digit "(x999999)" in the name.
      const showCount = count != null && !bait.questOnly;
      const tier = bait.id === 'none' ? null : baitTier(bait);
      const badges = [];
      if (tier) badges.push(el('span', { class: 'tier-badge ' + tier.cls }, tier.label));
      if (bait.questOnly) badges.push(el('span', { class: 'unlimited-badge' }, '∞ Unlimited'));
      const icon = el('canvas', { width: 36, height: 36, class: 'bait-icon' });
      drawBaitIcon(icon.getContext('2d'), bait.shape, 18, 18, 30, bait.hue);
      return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
        icon,
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, bait.name + (showCount ? `  (x${count})` : '')),
          badges.length ? el('div', { class: 'shop-row-badges' }, badges) : null,
          el('div', { class: 'shop-row-stats' }, equipped ? 'Equipped' : 'In your satchel'),
        ]),
        el('button', {
          class: equipped ? 'btn btn-equipped' : 'btn',
          text: equipped ? 'Equipped' : 'Equip',
          disabled: equipped ? 'disabled' : undefined,
          onClick: () => { equipBait(state, bait.id); showToast(state, `Equipped ${bait.name}.`); refresh(); onChange(); },
        }),
      ]);
    });
  }

  function buildHookRows() {
    return HOOKS.filter(h => state.hook.owned.includes(h.id)).map(hook => {
      const equipped = state.hook.equipped === hook.id;
      return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
        emojiIcon('🪝'),
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, hook.name),
          el('div', { class: 'shop-row-stats' }, equipped ? 'Equipped' : 'In your satchel'),
        ]),
        el('button', {
          class: equipped ? 'btn btn-equipped' : 'btn',
          text: equipped ? 'Equipped' : 'Equip',
          disabled: equipped ? 'disabled' : undefined,
          onClick: () => { equipHook(state, hook.id); showToast(state, `Equipped the ${hook.name}.`); refresh(); onChange(); },
        }),
      ]);
    });
  }

  function buildLineRows() {
    return LINES.filter(l => state.line.owned.includes(l.id)).map(line => {
      const equipped = state.line.equipped === line.id;
      return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
        emojiIcon('🧵'),
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, line.name),
          el('div', { class: 'shop-row-stats' }, equipped ? 'Equipped' : 'In your satchel'),
        ]),
        el('button', {
          class: equipped ? 'btn btn-equipped' : 'btn',
          text: equipped ? 'Equipped' : 'Equip',
          disabled: equipped ? 'disabled' : undefined,
          onClick: () => { equipLine(state, line.id); showToast(state, `Equipped the ${line.name}.`); refresh(); onChange(); },
        }),
      ]);
    });
  }

  function buildSwivelRows() {
    return SWIVELS.filter(s => state.swivel.owned.includes(s.id)).map(swivel => {
      const equipped = state.swivel.equipped === swivel.id;
      return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
        emojiIcon('🔗'),
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, swivel.name),
          el('div', { class: 'shop-row-stats' }, equipped ? 'Equipped' : 'In your satchel'),
        ]),
        el('button', {
          class: equipped ? 'btn btn-equipped' : 'btn',
          text: equipped ? 'Equipped' : 'Equip',
          disabled: equipped ? 'disabled' : undefined,
          onClick: () => { equipSwivel(state, swivel.id); showToast(state, `Equipped the ${swivel.name}.`); refresh(); onChange(); },
        }),
      ]);
    });
  }

  function buildScaleRows() {
    return SCALES.filter(s => state.scale.owned.includes(s.id)).map(scale => {
      const equipped = state.scale.equipped === scale.id;
      return el('div', { class: 'shop-row' + (equipped ? ' active' : '') }, [
        emojiIcon('⚖'),
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, scale.name),
          el('div', { class: 'shop-row-stats' }, equipped ? 'Equipped' : 'In your satchel'),
        ]),
        el('button', {
          class: equipped ? 'btn btn-equipped' : 'btn',
          text: equipped ? 'Equipped' : 'Equip',
          disabled: equipped ? 'disabled' : undefined,
          onClick: () => { equipScale(state, scale.id); showToast(state, `Equipped the ${scale.name}.`); refresh(); onChange(); },
        }),
      ]);
    });
  }


  // The bag has no built-in order beyond "when it was caught" — fine for a
  // handful of fish, tedious to scan once it's nearly full. Sort is purely
  // a display order, never touches state.bag.items itself, so it can't
  // desync from whatever index sellOne/sellAllFish (economy.js) expect.
  const FISH_SORTS = [
    { id: 'newest', label: 'Newest' },
    { id: 'value', label: 'Value' },
    { id: 'rarity', label: 'Rarity' },
  ];
  let fishSort = 'newest';

  function sortedBagItems() {
    const items = state.bag.items.slice();
    if (fishSort === 'value') items.sort((a, b) => b.value - a.value);
    else if (fishSort === 'rarity') items.sort((a, b) => rarityOf(b.rarity).rank - rarityOf(a.rarity).rank);
    else items.reverse();
    return items;
  }

  function buildFishRows() {
    const nodes = [];
    nodes.push(el('div', { class: 'market-summary shop-grid-full' },
      `Carrying: ${state.bag.items.length}/${bagCapacity(state)}`));
    if (state.bag.items.length === 0) {
      nodes.push(el('div', { class: 'market-empty shop-grid-full' }, 'Your satchel is empty — go catch something!'));
      return nodes;
    }
    nodes.push(el('div', { class: 'fish-sort-row shop-grid-full' }, [
      el('span', { class: 'fish-sort-label' }, 'Sort:'),
      ...FISH_SORTS.map(s => el('button', {
        class: 'fish-sort-btn' + (fishSort === s.id ? ' active' : ''),
        text: s.label,
        onClick: () => { fishSort = s.id; refresh(); },
      })),
    ]));
    for (const item of sortedBagItems()) {
      const rarity = rarityOf(item.rarity);
      const fish = fishById(item.fishId);
      const canvas = el('canvas', { width: 56, height: 56, class: 'almanac-icon' });
      const ctx = canvas.getContext('2d');
      const glow = ctx.createRadialGradient(28, 28, 2, 28, 28, 28);
      glow.addColorStop(0, rarity.glow + '55');
      glow.addColorStop(1, rarity.glow + '00');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, 56, 56);
      drawFishIcon(ctx, fish ? fish.shape : 'round', 28, 28, 40, fish ? fish.hue : rarity.color, fishVisualDetail(item.fishId));

      const mutClass = item.shiny ? ' discovered shiny-item' : item.giant ? ' discovered giant-item' : '';
      const mutStyle = item.shiny ? '--cell-color:#ffe066; --cell-glow:#fff7cc;' : item.giant ? '--cell-color:#8fd4ff; --cell-glow:#cfe9ff;' : '';
      nodes.push(el('div', { class: 'almanac-cell' + mutClass, style: mutStyle }, [
        canvas,
        el('div', { class: 'almanac-name', style: `color:${item.shiny ? '#ffe066' : item.giant ? '#8fd4ff' : rarity.color}` }, mutatedName(item.name, item)),
        el('div', { class: 'almanac-name-line' }, [
          el('span', {
            class: 'rarity-badge',
            style: `background:${rarity.color}2e; border-color:${rarity.color}; color:${rarity.color}`,
          }, rarity.label),
        ]),
        el('div', { class: 'almanac-meta' }, `Size ${item.size.toFixed(1)} · ${item.value}g`),
      ]));
    }
    nodes.push(el('div', { class: 'satchel-hint shop-grid-full' }, 'Head to the Trading Post to sell your catch.'));
    return nodes;
  }

  // Gear Loadout Presets (economy.js) — a named snapshot of every equip
  // slot at once, so swapping between e.g. a luck build and a value build
  // is one click instead of re-equipping five separate things.
  function describeLoadout(loadout) {
    const parts = [
      RODS.find(r => r.id === loadout.rod),
      HOOKS.find(h => h.id === loadout.hook),
      LINES.find(l => l.id === loadout.line),
      SWIVELS.find(s => s.id === loadout.swivel),
      SCALES.find(s => s.id === loadout.scale),
    ].filter(Boolean).map(item => item.name);
    if (loadout.title && loadout.title !== 'none') {
      parts.push(titleById(loadout.title).label);
    }
    return parts.join(' · ');
  }

  const loadoutNameInput = el('input', {
    type: 'text', class: 'loadout-name-input', placeholder: 'Loadout name', maxlength: '20',
  });

  function buildLoadoutRows() {
    const nodes = [];
    const canSave = state.loadouts.length < MAX_LOADOUTS;
    nodes.push(el('div', { class: 'shop-row loadout-save-row shop-grid-full' }, [
      loadoutNameInput,
      el('button', {
        class: 'btn',
        text: canSave ? 'Save Current as Loadout' : `Max ${MAX_LOADOUTS} reached`,
        disabled: canSave ? undefined : 'disabled',
        onClick: () => {
          const result = saveLoadout(state, loadoutNameInput.value);
          if (!result.ok) { showToast(state, `You can only keep ${MAX_LOADOUTS} loadouts — delete one first.`); return; }
          loadoutNameInput.value = '';
          showToast(state, 'Loadout saved.');
          refresh();
          onChange();
        },
      }),
    ]));

    if (state.loadouts.length === 0) {
      nodes.push(el('div', { class: 'market-empty shop-grid-full' }, "No loadouts saved yet — gear up the way you like, then save it above."));
      return nodes;
    }

    state.loadouts.forEach((loadout, i) => {
      nodes.push(el('div', { class: 'shop-row' }, [
        emojiIcon('🧰'),
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, loadout.name),
          el('div', { class: 'shop-row-stats' }, describeLoadout(loadout)),
        ]),
        el('button', {
          class: 'btn',
          text: 'Equip',
          onClick: () => { equipLoadout(state, i); showToast(state, `Equipped loadout: ${loadout.name}.`); refresh(); onChange(); },
        }),
        el('button', {
          class: 'btn',
          text: 'Delete',
          onClick: () => { deleteLoadout(state, i); showToast(state, 'Loadout deleted.'); refresh(); onChange(); },
        }),
      ]));
    });
    return nodes;
  }

  function refresh() {
    for (let i = 0; i < TABS.length; i++) {
      tabBar.children[i].classList.toggle('active', TABS[i].id === activeTab);
    }

    const nodes = [
      el('div', { class: 'shop-tagline shop-grid-full' },
        "🎒 Your gear — everything you've bought, ready to sling over a shoulder."),
    ];
    if (activeTab === 'all' || activeTab === 'rods') {
      nodes.push(el('div', { class: 'shop-section-title' }, 'Rods'));
      const rows = buildRodRows();
      nodes.push(...(rows.length ? rows : [el('div', { class: 'market-empty shop-grid-full' }, "You don't own any rods yet.")]));
    }
    if (activeTab === 'all' || activeTab === 'bait') {
      nodes.push(el('div', { class: 'shop-section-title' }, 'Bait'));
      nodes.push(...buildBaitRows());
    }
    if (activeTab === 'gear') {
      nodes.push(el('button', {
        class: 'btn equip-best-gear-btn shop-grid-full',
        text: '⚙ Equip Best Gear',
        onClick: () => {
          const result = equipBestGear(state);
          showToast(state, result.changed
            ? `Equipped: ${result.items.join(', ')}.`
            : 'Already wearing your best gear.');
          refresh();
          onChange();
        },
      }));
    }
    if (activeTab === 'all' || activeTab === 'gear') {
      nodes.push(el('div', { class: 'shop-section-title' }, 'Hooks'));
      nodes.push(...buildHookRows());
      nodes.push(el('div', { class: 'shop-section-title' }, 'Line'));
      nodes.push(...buildLineRows());
      nodes.push(el('div', { class: 'shop-section-title' }, 'Swivels'));
      nodes.push(...buildSwivelRows());
      nodes.push(el('div', { class: 'shop-section-title' }, 'Scales'));
      nodes.push(...buildScaleRows());
    }
    if (activeTab === 'all' || activeTab === 'fish') {
      nodes.push(el('div', { class: 'shop-section-title' }, 'Fish'));
      nodes.push(...buildFishRows());
    }
    if (activeTab === 'loadouts') {
      nodes.push(el('div', { class: 'shop-section-title' }, 'Loadouts'));
      nodes.push(...buildLoadoutRows());
    }

    replaceContent(body, nodes);
  }

  frame.querySelector('.panel-body').insertAdjacentElement('beforebegin', tabBar);
  tabBar.insertAdjacentElement('beforebegin', flap);
  refresh();
  return { frame, refresh };
}
