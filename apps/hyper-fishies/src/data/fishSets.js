import { FISH } from './fish.js';

// Collection Sets group the roster by their shared icon shape
// (render/drawFishIcon.js's archetype), not rarity — a horizontal cut
// across the same tiers the rarity achievements already reward, so
// completing one asks you to actually round out the almanac rather than
// just chase the next rarity tier. Membership is computed from FISH itself
// (never hardcoded ids) so a new fish entry with an existing shape
// automatically joins its set, and the deliberately excluded boss
// (fish.js's `boss: true`, `spots: []`) never counts toward one.
const SET_DEFS = [
  { id: 'roundFamily', shape: 'round', name: 'The Round Family', icon: '⚪', bonus: { valueMul: 0.04 } },
  { id: 'rayFamily', shape: 'angel', name: 'The Ray Family', icon: '🐠', bonus: { luck: 0.04 } },
  { id: 'eelFamily', shape: 'eel', name: 'The Eel Family', icon: '🐍', bonus: { control: 0.05 } },
  { id: 'shellFamily', shape: 'chest', name: 'The Shelled Family', icon: '🐚', bonus: { snapGuard: 0.06 } },
  { id: 'starFamily', shape: 'star', name: 'The Starfish Family', icon: '⭐', bonus: { luck: 0.05 } },
  { id: 'squidFamily', shape: 'squid', name: 'The Squid Family', icon: '🦑', bonus: { biteSpeed: 0.05 } },
  { id: 'sailFamily', shape: 'sail', name: 'The Sailfish Family', icon: '⛵', bonus: { control: 0.05 } },
  { id: 'sharkFamily', shape: 'shark', name: 'The Shark Family', icon: '🦈', bonus: { sizeMul: 0.06 } },
  { id: 'whaleFamily', shape: 'whale', name: 'The Whale Family', icon: '🐋', bonus: { valueMul: 0.08 } },

  // Added alongside the shape-diversity pass (render/drawFishIcon.js) that
  // split several unrelated creatures off the 9 original archetypes above —
  // each new archetype with enough members forms its own set for free,
  // since membership and the achievement it grants (data/achievements.js)
  // are both generated from FISH itself rather than hand-listed.
  { id: 'clamFamily', shape: 'clam', name: 'The Clam Family', icon: '🐚', bonus: { valueMul: 0.04 } },
  { id: 'crabFamily', shape: 'crab', name: 'The Crab Family', icon: '🦀', bonus: { control: 0.04 } },
  { id: 'jellyfishFamily', shape: 'jellyfish', name: 'The Jellyfish Family', icon: '🎐', bonus: { biteSpeed: 0.04 } },
  { id: 'mantaFamily', shape: 'manta', name: 'The Manta Family', icon: '🐡', bonus: { luck: 0.05 } },
  { id: 'pikeFamily', shape: 'pike', name: 'The Pike Family', icon: '🐟', bonus: { sizeMul: 0.05 } },
  { id: 'koiFamily', shape: 'koi', name: 'The Koi Family', icon: '🎏', bonus: { valueMul: 0.06 } },
  { id: 'urchinFamily', shape: 'urchin', name: 'The Urchin Family', icon: '🦔', bonus: { snapGuard: 0.05 } },
  { id: 'serpentFamily', shape: 'serpent', name: 'The Serpent Family', icon: '🐉', bonus: { control: 0.06 } },
  { id: 'trilobiteFamily', shape: 'trilobite', name: 'The Trilobite Family', icon: '🦂', bonus: { luck: 0.06 } },

  // A third wave, added alongside this round's second batch of new
  // archetypes (render/drawFishIcon.js) plus enough new common/rare fish to
  // bring shrimp/catfish/piranha/turtle/flyingfish up from a single lonely
  // species each to a real 3-member family.
  { id: 'shrimpFamily', shape: 'shrimp', name: 'The Shrimp Family', icon: '🍤', bonus: { biteSpeed: 0.04 } },
  { id: 'catfishFamily', shape: 'catfish', name: 'The Catfish Family', icon: '🐱', bonus: { luck: 0.04 } },
  { id: 'piranhaFamily', shape: 'piranha', name: 'The Piranha Family', icon: '🦷', bonus: { sizeMul: 0.05 } },
  { id: 'turtleFamily', shape: 'turtle', name: 'The Turtle Family', icon: '🐢', bonus: { snapGuard: 0.05 } },
  { id: 'flyingfishFamily', shape: 'flyingfish', name: 'The Flying Fish Family', icon: '🕊', bonus: { biteSpeed: 0.05 } },
  { id: 'octopusFamily', shape: 'octopus', name: 'The Octopus Family', icon: '🐙', bonus: { control: 0.05 } },
  { id: 'lobsterFamily', shape: 'lobster', name: 'The Lobster Family', icon: '🦞', bonus: { valueMul: 0.05 } },
  { id: 'seahorseFamily', shape: 'seahorse', name: 'The Seahorse Family', icon: '🌊', bonus: { luck: 0.05 } },
  { id: 'swordfishFamily', shape: 'swordfish', name: 'The Swordfish Family', icon: '🗡', bonus: { sizeMul: 0.06 } },
  { id: 'hammerheadFamily', shape: 'hammerhead', name: 'The Hammerhead Family', icon: '🔨', bonus: { control: 0.06 } },
  { id: 'stingrayFamily', shape: 'stingray', name: 'The Stingray Family', icon: '⚡', bonus: { snapGuard: 0.05 } },
  { id: 'nautilusFamily', shape: 'nautilus', name: 'The Nautilus Family', icon: '🐚', bonus: { luck: 0.05 } },
  { id: 'anglerfishFamily', shape: 'anglerfish', name: 'The Anglerfish Family', icon: '🎣', bonus: { biteSpeed: 0.06 } },
  { id: 'morayFamily', shape: 'moray', name: 'The Moray Family', icon: '🦎', bonus: { control: 0.05 } },
  { id: 'cuttlefishFamily', shape: 'cuttlefish', name: 'The Cuttlefish Family', icon: '🦑', bonus: { valueMul: 0.04 } },
];

export const FISH_SETS = SET_DEFS.map(def => ({
  ...def,
  fishIds: FISH.filter(f => f.shape === def.shape && !f.boss).map(f => f.id),
})).filter(set => set.fishIds.length > 0);

export function fishSetById(id) {
  return FISH_SETS.find(s => s.id === id) || null;
}

export function isSetComplete(state, set) {
  return set.fishIds.every(id => state.almanac[id] && state.almanac[id].caught);
}

export function setProgress(state, set) {
  const caught = set.fishIds.filter(id => state.almanac[id] && state.almanac[id].caught).length;
  return [caught, set.fishIds.length];
}
