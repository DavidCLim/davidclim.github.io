import { el } from '../util/dom.js';
import { rarityOf } from '../data/rarity.js';
import { rodPartRarityId } from '../data/rodParts.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { showToast } from './toast.js';
import {
  craftScrapRod, craftIronboundRod, reinforceRod, meltSalvageForGold, craftEnchant,
  SCRAP_ROD_PARTS_NEEDED, IRONBOUND_ROD_PARTS_NEEDED,
} from '../economy/economy.js';
import { REINFORCE_PARTS_COST, REINFORCE_GOLD_COST, REINFORCE_MAX_PER_ROD, rodReinforcementCount } from '../data/rodForge.js';
import { ENCHANTS, ENCHANT_PARTS_COST, ENCHANT_GOLD_COST, BASE_ENCHANT_SLOTS, enchantSlotsForRod } from '../data/enchants.js';
import { equippedRod } from '../core/gameState.js';
import { drawFishIcon } from '../render/drawFishIcon.js';
import { SHOP_THEMES } from './shopTheme.js';
import { buildShopBanner } from './shopBanner.js';

// Garrick's forge: every rod part currently in the salvage hold, a "Melt
// for Gold" fallback that's always available, a two-tier crafting ladder
// (Scrap Rod, then the Ironbound Rod once that's built), and Reinforcement
// — a repeatable stat top-up for whichever rod you've got equipped, so the
// parts pile still has somewhere to go once both rods are already owned.
export function buildForgePanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame('The Forge', () => { closeOverlay(state); onChange(); }, {
    landscape: true, theme: SHOP_THEMES.blacksmith,
  });
  // A scatter of drifting embers over the themed body — see .panel-forge.
  frame.classList.add('panel-forge');

  function refresh() {
    const hasScrapRod = state.rod.owned.includes('scrapRod');
    const hasIronboundRod = state.rod.owned.includes('ironboundRod');
    const count = state.salvage.items.length;

    const nodes = [
      buildShopBanner('blacksmith'),
      el('div', { class: 'shop-tagline shop-grid-full' },
        !hasScrapRod
          ? `🔨 Rod parts — bring me ${SCRAP_ROD_PARTS_NEEDED} and I'll lash you together a rod.`
          : !hasIronboundRod
          ? `🔨 Bring me ${IRONBOUND_ROD_PARTS_NEEDED} parts and I'll build something sturdier.`
          : "🔨 Rod parts — reinforce your gear, or melt them down for gold."),
    ];

    if (count === 0) {
      nodes.push(el('div', { class: 'market-empty shop-grid-full' }, "No parts in your hold — every cast has a small chance to come up with one instead of a fish."));
    } else {
      for (const item of state.salvage.items) {
        const rarity = rarityOf(rodPartRarityId(item.tier));
        const canvas = el('canvas', { width: 56, height: 56, class: 'almanac-icon' });
        const ctx = canvas.getContext('2d');
        const glow = ctx.createRadialGradient(28, 28, 2, 28, 28, 28);
        glow.addColorStop(0, rarity.glow + '55');
        glow.addColorStop(1, rarity.glow + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 56, 56);
        drawFishIcon(ctx, 'wreck', 28, 28, 40, '#8a8f92');

        nodes.push(el('div', { class: 'almanac-cell' }, [
          canvas,
          el('div', { class: 'almanac-name' }, item.name),
          el('div', { class: 'almanac-meta' }, 'Rod part'),
        ]));
      }
    }

    if (!hasScrapRod) {
      nodes.push(el('div', { class: 'shop-grid-full' }, [
        el('button', {
          class: 'btn',
          text: `Assemble the Scrap Rod (${count}/${SCRAP_ROD_PARTS_NEEDED})`,
          disabled: count < SCRAP_ROD_PARTS_NEEDED ? 'disabled' : undefined,
          onClick: () => {
            const result = craftScrapRod(state);
            if (!result.ok) { showToast(state, `Need ${SCRAP_ROD_PARTS_NEEDED} rod parts to build it.`); return; }
            showToast(state, "Lashed together the Scrap Rod! Equip it from your Satchel.");
            refresh();
            onChange();
          },
        }),
      ]));
    } else if (!hasIronboundRod) {
      nodes.push(el('div', { class: 'shop-grid-full' }, [
        el('button', {
          class: 'btn',
          text: `Assemble the Ironbound Rod (${count}/${IRONBOUND_ROD_PARTS_NEEDED})`,
          disabled: count < IRONBOUND_ROD_PARTS_NEEDED ? 'disabled' : undefined,
          onClick: () => {
            const result = craftIronboundRod(state);
            if (!result.ok) { showToast(state, `Need ${IRONBOUND_ROD_PARTS_NEEDED} rod parts to build it.`); return; }
            showToast(state, "Forged the Ironbound Rod! Equip it from your Satchel.");
            refresh();
            onChange();
          },
        }),
      ]));
    }

    // Reinforcement is always on offer, win or lose on the crafting ladder
    // above — it targets whatever rod is currently equipped, so switching
    // rods in the Satchel changes what this button strengthens.
    const rod = equippedRod(state);
    const level = rodReinforcementCount(state, rod.id);
    const maxed = level >= REINFORCE_MAX_PER_ROD;
    const canAfford = count >= REINFORCE_PARTS_COST && state.coins >= REINFORCE_GOLD_COST;
    nodes.push(el('div', { class: 'shop-grid-full forge-reinforce' }, [
      el('div', { class: 'shop-row-name' }, `Reinforce ${rod.name}`),
      el('div', { class: 'shop-row-stats' }, maxed
        ? `Fully reinforced (${REINFORCE_MAX_PER_ROD}/${REINFORCE_MAX_PER_ROD}).`
        : `Level ${level}/${REINFORCE_MAX_PER_ROD} — costs ${REINFORCE_PARTS_COST} parts + ${REINFORCE_GOLD_COST}g each time.`),
      el('button', {
        class: 'btn btn-chip',
        text: maxed ? 'Maxed Out' : `Reinforce (${REINFORCE_PARTS_COST} parts + ${REINFORCE_GOLD_COST}g)`,
        disabled: (maxed || !canAfford) ? 'disabled' : undefined,
        onClick: () => {
          const result = reinforceRod(state);
          if (!result.ok) {
            showToast(state, result.reason === 'gold' ? 'Not enough gold for that.' : `Need ${REINFORCE_PARTS_COST} parts for that.`);
            return;
          }
          showToast(state, `${rod.name} reinforced! (Level ${result.level}/${REINFORCE_MAX_PER_ROD})`);
          refresh();
          onChange();
        },
      }),
    ]));

    // Forge Enchants (data/enchants.js) — starts as one slot per rod,
    // separate from Grizelda's rune sockets, that bends odds nothing else in
    // the game can touch (mutation chance, treasure chance, EXP, even
    // whether the hookset QTE happens at all) instead of stacking another
    // flat stat. Mastering this specific rod (data/rodMastery.js) earns it
    // a second slot.
    const activeEnchantIds = state.rod.enchanted[rod.id] || [];
    const maxEnchantSlots = enchantSlotsForRod(state, rod.id);
    nodes.push(el('div', { class: 'shop-section-title shop-grid-full' }, "Garrick's Enchants"));
    nodes.push(el('div', { class: 'shop-tagline shop-grid-full' },
      maxEnchantSlots > BASE_ENCHANT_SLOTS
        ? `${activeEnchantIds.length}/${maxEnchantSlots} slots on your ${rod.name} — mastering it paid off.`
        : `${activeEnchantIds.length}/${maxEnchantSlots} slot on your ${rod.name} — max out its Mastery for a second.`));
    const canAffordEnchant = count >= ENCHANT_PARTS_COST && state.coins >= ENCHANT_GOLD_COST;
    for (const enchant of ENCHANTS) {
      const active = activeEnchantIds.includes(enchant.id);
      nodes.push(el('div', { class: 'shop-grid-full forge-enchant-row' + (active ? ' active' : '') }, [
        el('div', { class: 'shop-row-info' }, [
          el('div', { class: 'shop-row-name' }, enchant.name + (active ? ' — Active' : '')),
          el('div', { class: 'shop-row-stats' }, enchant.desc),
        ]),
        el('button', {
          class: 'btn btn-chip',
          text: active ? 'Active' : `Enchant (${ENCHANT_PARTS_COST} parts + ${ENCHANT_GOLD_COST}g)`,
          disabled: (active || !canAffordEnchant) ? 'disabled' : undefined,
          onClick: () => {
            const result = craftEnchant(state, enchant.id);
            if (!result.ok) {
              showToast(state, result.reason === 'gold' ? 'Not enough gold for that.' : `Need ${ENCHANT_PARTS_COST} parts for that.`);
              return;
            }
            showToast(state, `${rod.name} enchanted with ${enchant.name}!`);
            refresh();
            onChange();
          },
        }),
      ]));
    }

    if (count > 0) {
      nodes.push(el('div', { class: 'shop-grid-full' }, [
        el('button', {
          class: 'btn btn-chip',
          text: `Melt Remaining Parts for Gold (${count})`,
          onClick: () => {
            const result = meltSalvageForGold(state);
            if (result.ok) showToast(state, `Melted down ${result.count} parts for ${result.total}g.`);
            refresh();
            onChange();
          },
        }),
      ]));
    }

    replaceContent(body, nodes);
  }

  refresh();
  return { frame, refresh };
}
