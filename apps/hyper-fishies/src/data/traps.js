// Crab Traps (ui/tacklePanel.js's Traps tab) — the one system in the game
// that pays out on real wall-clock time without you actually casting a
// line. Buy a trap, set it in an open slot, and it fills in on its own —
// including while the game isn't even open — so there's always a reason to
// pop back in even on a day with no time to actually sit and fish. Modeled
// on the same "start it, walk away, come back later" shape as the
// Smokehouse (data/smokehouse.js), just producing a brand-new catch instead
// of curing one you already reeled in.
export const TRAP_SLOTS = 3;

// `maxRarityRank` caps which FISH entries a trap can turn up (see
// economy.js's collectTrap) — a trap never reaches into weather/region/bait
// -gated fish, it just rolls a plain dock-water catch at or below its own
// rank ceiling, weighted the same way a real cast is (rarer = rarer).
export const TRAPS = [
  {
    id: 'wickerTrap', name: 'Wicker Trap', cost: 90,
    durationMs: 15 * 60 * 1000,
    maxRarityRank: 0,
    desc: 'A cheap reed basket. Only ever pulls up common catches, but it fills fast.',
  },
  {
    id: 'ironTrap', name: 'Iron Cage Trap', cost: 380,
    durationMs: 45 * 60 * 1000,
    maxRarityRank: 1,
    desc: 'Heavier, sturdier, and patient enough to hold something Rare.',
  },
  {
    id: 'reinforcedTrap', name: 'Reinforced Trap', cost: 1100,
    durationMs: 2 * 60 * 60 * 1000,
    maxRarityRank: 2,
    desc: "Iron-banded and baited right — a real shot at something Legendary by the time it's ready.",
  },
];

export function trapById(id) {
  return TRAPS.find(t => t.id === id) || null;
}
