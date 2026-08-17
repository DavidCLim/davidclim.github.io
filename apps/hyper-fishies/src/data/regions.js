// Travel destinations, reachable by rowboat from Morris at the dock.
// `stars` is the difficulty rating shown on the map (more stars = tougher
// water). `focusRarity` is the one rarity tier this region's odds are built
// around (see regionRarityMultiplier below) — `null` means no particular
// focus (the Docks are the general-purpose home water). `home` is the
// starting dock — you're already there, so it isn't a travel target.
// `locked: true` regions show as "???" on the map and have no unlock path
// yet. `unlockLevel` regions also show as "???" until state.level clears
// the bar (see isRegionLocked below), then reveal their real name/blurb —
// a level-gated destination reveal, not a permanently mysterious one.
export const REGIONS = [
  {
    id: 'dock', name: 'The Docks', stars: 0, home: true, locked: false, focusRarity: null,
    mapPos: { x: 0.46, y: 0.34 },
    waterTint: '#0b2733', ambientTint: '#5fe3c0', mapTint: '#c9a86a', deckTint: null,
    blurb: 'Home port — a bit of everything bites here.',
  },
  {
    id: 'tropicalIsland', name: 'Tropical Island', stars: 1, home: false, locked: false, focusRarity: 'rare',
    mapPos: { x: 0.22, y: 0.50 },
    waterTint: '#0d3a3f', ambientTint: '#8fe9d9', mapTint: '#5fe3c0', deckTint: '#e8c97a',
    blurb: 'Warm shallows thick with rare catches.',
  },
  {
    id: 'seasideBay', name: 'Seaside Bay', stars: 7, home: false, locked: false, focusRarity: 'extinct',
    mapPos: { x: 0.10, y: 0.38 },
    waterTint: '#0a2f3a', ambientTint: '#6fd8c9', mapTint: '#c896ff', deckTint: '#9fb0ac',
    blurb: 'A sheltered bay where things long gone still surface.',
  },
  {
    id: 'darkWaters', name: 'Dark Waters', stars: 3, home: false, locked: false, focusRarity: 'gargantuan',
    mapPos: { x: 0.20, y: 0.76 },
    waterTint: '#081a24', ambientTint: '#4a7a8f', mapTint: '#ff8ad1', deckTint: '#3a4a3a',
    blurb: 'Murky and cold — and home to things that grow much too large.',
  },
  {
    id: 'mountainIsle', name: 'Mountain Isle', stars: 5, home: false, locked: false, focusRarity: 'mythic',
    mapPos: { x: 0.47, y: 0.14 },
    waterTint: '#0f2b3c', ambientTint: '#9fc2ff', mapTint: '#ff6f59', deckTint: '#7a93b0',
    blurb: 'Cold, steep water beneath the peaks. Mythic things linger here.',
  },
  {
    id: 'abyssalLands', name: 'Abyssal Lands', stars: 10, home: false, locked: false, focusRarity: 'abyssal',
    mapPos: { x: 0.85, y: 0.45 },
    waterTint: '#04121c', ambientTint: '#43e0ff', mapTint: '#43e0ff', deckTint: '#1c2a38',
    blurb: "The deep dark. Not for the faint of heart.",
  },
  {
    // Level-gated rather than permanently locked (see isRegionLocked) — the
    // map shows it as "???" with a fog swirl exactly like a fully-locked
    // zone until state.level clears unlockLevel, then reveals the real
    // name/blurb/landmark. No fish are unique to it (no region already has
    // region-exclusive fish — see data/fish.js — every region's identity
    // comes from `stars`/`focusRarity` weighting the shared roster, and
    // this one follows the same pattern); `focusRarity: 'legendary'` was
    // the one tier no other region had already claimed.
    id: 'frozenReach', name: 'The Frozen Reach', stars: 6, home: false, unlockLevel: 15, focusRarity: 'legendary',
    mapPos: { x: 0.50, y: 0.60 },
    waterTint: '#0a2230', ambientTint: '#bfe8ff', mapTint: '#8fd4ff', deckTint: '#4a5c6b',
    blurb: 'Pack ice and drifting bergs — legendary catches wait beneath the crust.',
  },
  {
    id: 'mystery2', name: '???', stars: null, home: false, locked: true, focusRarity: null,
    mapPos: { x: 0.68, y: 0.78 },
    blurb: 'Uncharted. Morris won’t say what’s out there.',
  },
];

// True if a region should still show as "???" and refuse travel — either
// permanently (`locked: true`, no unlock path built yet) or until
// `state.level` clears its `unlockLevel`.
export function isRegionLocked(state, region) {
  if (region.locked) return true;
  if (region.unlockLevel && state.level < region.unlockLevel) return true;
  return false;
}

// Landmasses drawn on the treasure map (ui/mapPanel.js): one shared
// mainland (fractional 0-1 points, matched loosely to the region mapPos
// values above) plus a separate Abyssal Lands island and a tiny strait
// islet for the second mystery zone — split from the mainland by open
// water, since you have to row there.
export const MAINLAND_COASTLINE = [
  [0.06, 0.32], [0.14, 0.06], [0.30, 0.02], [0.40, 0.09], [0.50, 0.03], [0.60, 0.09],
  [0.60, 0.24], [0.56, 0.38], [0.60, 0.50], [0.58, 0.64], [0.60, 0.78], [0.50, 0.94],
  [0.40, 0.80], [0.34, 0.96], [0.14, 0.92], [0.02, 0.74], [0.02, 0.50],
];

// Deliberately jagged and irregular (drawn with straight segments, not the
// smooth curve the mainland gets) — the Abyssal Lands should read as a
// broken, dangerous coastline, not a rounded island.
export const ABYSSAL_COASTLINE = [
  [0.74, 0.30], [0.80, 0.19], [0.77, 0.09], [0.88, 0.07], [0.90, 0.16],
  [0.97, 0.09], [1.0, 0.21], [0.93, 0.25], [1.0, 0.33], [0.95, 0.41],
  [1.0, 0.49], [0.94, 0.57], [1.0, 0.65], [0.93, 0.73], [0.97, 0.81],
  [0.85, 0.90], [0.79, 0.83], [0.73, 0.90], [0.67, 0.77], [0.71, 0.67],
  [0.63, 0.57], [0.70, 0.49], [0.62, 0.41], [0.69, 0.33],
];

export const STRAIT_ISLET = { cx: 0.68, cy: 0.78, r: 0.055 };

// Region ids that share a border, for drawing the ink dividing lines
// between them on the mainland.
export const REGION_BORDERS = [
  ['dock', 'mountainIsle'],
  ['dock', 'tropicalIsland'],
  ['dock', 'frozenReach'],
  ['tropicalIsland', 'seasideBay'],
  ['tropicalIsland', 'darkWaters'],
  ['darkWaters', 'frozenReach'],
];

export function regionById(id) {
  return REGIONS.find(r => r.id === id) || REGIONS[0];
}

// A region's signature rarity gets a large odds boost here — this is the
// main way "Tropical Island is for rares", "Abyssal Lands is for abyssal
// fish", etc. actually plays out during a cast. Tougher water (more stars)
// also gives a small general nudge toward higher tiers on top of that,
// mirroring the existing rod-luck bias in fishing/rollFish.js.
const FOCUS_MULTIPLIER = 18;

export function regionRarityWeight(regionId, rarityId, baseWeight, rarityRank) {
  const region = regionById(regionId);
  const stars = region.stars || 0;
  let weight = baseWeight + stars * rarityRank * 0.12;
  if (region.focusRarity && region.focusRarity === rarityId) {
    weight *= FOCUS_MULTIPLIER;
  }
  return weight;
}
