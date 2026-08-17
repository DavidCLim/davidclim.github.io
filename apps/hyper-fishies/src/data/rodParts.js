import { RARITY_ORDER } from './rarity.js';

// Loose rod parts — a small independent chance (ROD_SCRAP_CHANCE, rolled
// alongside the Sea Chest chance in fishing/fishingMachine.js's
// updateWaiting) for a bite to come up as a part instead of a fish. Bring
// enough of them to the Blacksmith and he'll lash together a rod out of
// whatever still has some use left in it — not the best rod on the rack,
// but built for free out of what the sea already gives up. `tier` just
// picks the variant's rarity color (via RARITY_ORDER) for its icon glow —
// no payout attached, unlike a real catch.
export const ROD_SCRAP_CHANCE = 0.05;

// A stand-in "fish" object for the rod-scrap roll — same shape/pattern as
// data/seaChest.js's SEA_CHEST_FISH, flagged so fishingMachine.js's
// resolveCatch can route it to resolveSalvageCatch instead of the normal
// catch resolution.
export const ROD_SCRAP_FISH = {
  id: 'rodScrap', name: 'Rod Scrap', rarity: 'common', shape: 'wreck', hue: '#8a8f92',
  behavior: 'resting', isRodScrap: true,
};

export const ROD_PART_VARIANTS = [
  { id: 'bentFerrule', name: 'Bent Ferrule', tier: 0 },
  { id: 'crackedReelSeat', name: 'Cracked Reel Seat', tier: 1 },
  { id: 'frayedLineGuide', name: 'Frayed Line Guide', tier: 2 },
  { id: 'warpedRodBlank', name: 'Warped Rod Blank', tier: 3 },
  { id: 'rustedButtCap', name: 'Rusted Butt Cap', tier: 4 },
];

export function randomRodPartVariant() {
  return ROD_PART_VARIANTS[Math.floor(Math.random() * ROD_PART_VARIANTS.length)];
}

export function rodPartRarityId(tier) {
  return RARITY_ORDER[tier] || RARITY_ORDER[0];
}
