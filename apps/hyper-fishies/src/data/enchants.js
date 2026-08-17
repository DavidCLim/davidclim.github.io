import { ROD_MASTERY_MAX_LEVEL } from './rodMastery.js';

// Forge Enchants — Garrick's answer to Grizelda's Runes. A Rune stacks a
// flat number onto effectiveRodStats(); an Enchant instead reaches into
// rolls that are normally fixed no matter what you're wearing — Shiny/Giant
// mutation odds (data/mutations.js), Sea Chest/rod-scrap odds
// (data/seaChest.js, data/rodParts.js), EXP per catch, even whether the
// hookset QTE happens at all. Every rod starts with a single Enchant Slot
// (tracked as an array per rodId in state.rod.enchanted, separate from a
// rod's Rune sockets) — mastering that specific rod (data/rodMastery.js's
// ROD_MASTERY_MAX_LEVEL) earns it a second, so picking enchants stays a
// real build choice early on but rewards sticking with one rod later.
export const ENCHANT_PARTS_COST = 8;
export const ENCHANT_GOLD_COST = 150;
export const BASE_ENCHANT_SLOTS = 1;
export const MASTERED_ENCHANT_SLOTS = 2;

export function enchantSlotsForRod(state, rodId) {
  const mastery = state.rodMastery && state.rodMastery[rodId];
  return (mastery && mastery.level >= ROD_MASTERY_MAX_LEVEL) ? MASTERED_ENCHANT_SLOTS : BASE_ENCHANT_SLOTS;
}

export const ENCHANTS = [
  {
    id: 'radioactive', name: 'Radioactive Enchant',
    desc: 'Warps the water around your hook — Shiny and Giant odds more than double.',
    mutationMult: 2.5,
    glyph: 'bolt', hue: '#8dffb0',
  },
  {
    id: 'bountiful', name: 'Bountiful Enchant',
    desc: 'The sea feels generous — Sea Chests and loose rod parts turn up twice as often.',
    treasureMult: 2,
    glyph: 'coin', hue: '#ffd08a',
  },
  {
    id: 'wise', name: 'Wise Enchant',
    desc: 'Every catch teaches you something extra — a flat 40% more EXP.',
    expMult: 1.4,
    glyph: 'eye', hue: '#9fc9ff',
  },
  {
    id: 'piercing', name: 'Piercing Enchant',
    desc: 'The hook sets itself the instant a fish bites — the hookset window never gets a chance to close.',
    autoHookset: true,
    glyph: 'spiral', hue: '#ff9f9f',
  },
];

export function enchantById(id) {
  return ENCHANTS.find(e => e.id === id) || null;
}
