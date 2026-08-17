// Fisch-style Sea Chests — instead of the normal fish roll, a bite
// occasionally turns out to be a chest instead: still hooked and reeled in
// like any other catch (fishing/fishingMachine.js treats it as a calm,
// easy-pull "fish" with this shape), but it resolves as a straight gold
// reward rather than something you keep in your bag or log in the almanac.
// Storms wash up more of them — one more small reason a storm is worth
// fishing through, on top of the better rare-fish odds.
export const SEA_CHEST_CHANCE = 0.05;
export const SEA_CHEST_STORM_MULT = 1.6;

export const SEA_CHEST_FISH = {
  id: 'seaChest', name: 'Sea Chest', rarity: 'rare', shape: 'chest', hue: '#c9a227',
  behavior: 'resting', isChest: true,
};

// A bigger haul on a region's tougher water, with an occasional (15%) extra
// windfall on top — never a total dud, since finding the chest at all is
// already the lucky part.
export function rollSeaChestReward(regionStars, rng = Math.random) {
  const base = 30 + (regionStars || 0) * 8;
  let gold = Math.round(base * (0.7 + rng() * 0.9));
  const bonus = rng() < 0.15;
  if (bonus) gold *= 2;
  return { gold, bonus };
}
