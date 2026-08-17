// Message in a Bottle — a rare alternate bite, same shape as a Sea Chest
// (data/seaChest.js) or Rod Scrap (data/rodParts.js): rolled in place of a
// normal fish, still hooked and reeled in like one. Purely flavor — a short
// found note plus a small finder's fee, nothing added to the almanac or bag.
export const BOTTLE_CHANCE = 0.03;
export const BOTTLE_GOLD_RANGE = [15, 45];

export const BOTTLE_FISH = {
  id: 'bottle', name: 'Message in a Bottle', rarity: 'rare', shape: 'chest', hue: '#8fb0c4',
  behavior: 'resting', isBottle: true,
};

export const BOTTLE_MESSAGES = [
  "If you're reading this, the tide got here before I did. — R.",
  "Told the harbor master I'd be back by spring. It's been three springs.",
  "Whoever finds this: the big one really did get away. Don't believe anyone who says otherwise.",
  "Marry me, Cordelia. — a fool who forgot to sign his own name",
  "Left this at the Docks years back. If you're reading it there, some things never change.",
  "Recipe for the Special: never tell. Not even the bottle. — R",
  "Coordinates lost to water damage. So was my dignity.",
  "Dear future finder: put it back. Someone else deserves this feeling too.",
  "Note to self: waterproof ink exists. Buy some.",
  "If found, please return to sender. Sender is deceased. It's fine, keep it.",
];

export function rollBottleMessage(rng = Math.random) {
  return BOTTLE_MESSAGES[Math.floor(rng() * BOTTLE_MESSAGES.length)];
}

export function rollBottleGold(rng = Math.random) {
  const [lo, hi] = BOTTLE_GOLD_RANGE;
  return lo + Math.floor(rng() * (hi - lo + 1));
}
