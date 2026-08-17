import { fishForSpot } from '../data/fish.js';
import { rarityOf } from '../data/rarity.js';
import { baitById } from '../data/bait.js';
import { regionRarityWeight } from '../data/regions.js';

// Weighted-random fish selection for a bite at a given spot, biased by rod
// luck, the equipped bait's rarity boost, the current region's signature
// rarity (see data/regions.js), the current weather (data/weather.js —
// rain/storms nudge the odds toward rarer fish the same way rod luck does,
// and gate `weatherOnly` fish out entirely unless the sky actually matches),
// and how deep into the night it is (data/dayNight.js — a smaller version
// of the same "harsher conditions, better odds" nudge, on top of weather
// rather than replacing it). Fish that require a specific bait are excluded
// unless that bait is equipped, and `requiresRegion` fish are excluded
// entirely unless you're actually standing in that region.
export function rollFishForSpot(spotId, rod, baitId, regionId, weather, nightBonus = 0, rng = Math.random) {
  const bait = baitById(baitId);
  const candidates = fishForSpot(spotId).filter(f =>
    (!f.requiresBait || f.requiresBait === baitId) &&
    (!f.weatherOnly || f.weatherOnly.includes(weather.id)) &&
    (!f.requiresRegion || f.requiresRegion === regionId)
  );
  if (candidates.length === 0) return null;

  const weighted = candidates.map(f => {
    const rarity = rarityOf(f.rarity);
    let w = rarity.weight * (1 + (rod.luck + weather.luckBonus + nightBonus) * rarity.rank);
    w = regionRarityWeight(regionId, f.rarity, w, rarity.rank);
    if (bait.boostRank <= rarity.rank) w += bait.rarityBoost;
    return { fish: f, weight: Math.max(w, 0.0001) };
  });

  const total = weighted.reduce((s, w) => s + w.weight, 0);
  let roll = rng() * total;
  for (const w of weighted) {
    roll -= w.weight;
    if (roll <= 0) return w.fish;
  }
  return weighted[weighted.length - 1].fish;
}
