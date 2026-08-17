// Buried Treasure — a slow-burn payoff riding on top of Message in a
// Bottle (data/bottles.js): instead of every bottle just being flavor, a
// fraction of them carry a torn map fragment instead. Collect
// MAP_FRAGMENTS_NEEDED and the last one digs up the treasure itself, right
// there — no separate turn-in step, no NPC, just the payoff landing the
// moment the map completes (fishing/fishingMachine.js's resolveBottleCatch).
export const MAP_FRAGMENT_CHANCE = 0.2;
export const MAP_FRAGMENTS_NEEDED = 5;
export const BURIED_TREASURE_GOLD = 2000;
export const BURIED_TREASURE_EXP = 800;
