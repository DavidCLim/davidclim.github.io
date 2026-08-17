// Player level/rank ladder. Level is the raw number that goes up with EXP
// (see economy.js's addExp); rank is a naval-career label layered on top of
// it, AND — unlike the old cosmetic-only version of this — a small passive
// buff that actually feeds core/gameState.js's effectiveRodStats, stacking
// on top of whatever the equipped rod and its socketed runes already give.
// Each rank's buff is deliberately narrow and escalates in reach as you
// climb: Deckhand steadies your grip, Journeyman sharpens your odds, Master
// speeds up the wait, Captain's pads your payout, and Admiral's — the
// ceiling — rolls a little of every earlier rank's specialty into one.
export const MAX_LEVEL = 100;

export const RANKS = [
  {
    id: 'deckhand', label: 'Deckhand', minLevel: 1, maxLevel: 9,
    buffLabel: 'Sea Legs', buffDesc: '+6% Control — steadier hands on the line.',
    buff: { control: 0.06 },
  },
  {
    id: 'journeyman', label: 'Journeyman', minLevel: 10, maxLevel: 24,
    buffLabel: 'Keen Eye', buffDesc: '+8% Luck — better odds at rare fish.',
    buff: { luck: 0.08 },
  },
  {
    id: 'master', label: 'Master', minLevel: 25, maxLevel: 49,
    buffLabel: 'Patient Hand', buffDesc: '+10% Bite Speed — shorter waits for a bite.',
    buff: { biteSpeed: 0.10 },
  },
  {
    id: 'captain', label: "Captain's", minLevel: 50, maxLevel: 79,
    buffLabel: "Captain's Cut", buffDesc: '+12% Sell Value — every catch pays out more.',
    buff: { valueMul: 0.12 },
  },
  {
    id: 'admiral', label: "Admiral's", minLevel: 80, maxLevel: MAX_LEVEL,
    buffLabel: 'Command Presence',
    buffDesc: '+10% Luck, +8% Control, +8% Bite Speed, +10% Sell Value.',
    buff: { luck: 0.10, control: 0.08, biteSpeed: 0.08, valueMul: 0.10 },
  },
];

export function rankForLevel(level) {
  return RANKS.find(r => level >= r.minLevel && level <= r.maxLevel) || RANKS[0];
}

// How much EXP it takes to climb from `level` to `level + 1` — strictly
// increasing so late-game levels are a real grind instead of flying by at
// the same pace as the first ones. Tuned so early levels come in a
// handful of catches (level 1: 82 EXP against ~8-100 EXP per fish) while
// level 99 takes several thousand.
export function expToNextLevel(level) {
  return Math.round(60 + level * 22 + level * level * 0.6);
}
