// Today's Hot Catch — one random species the Trading Post pays a real bonus
// on today, rerolled once a day (same local-date-key pattern as Daily
// Bounties, data/bounties.js's todayBountyKey), giving a reason to check
// the board and fish for something specific rather than just sell
// whatever's already in the bag. Applied at sell time (economy.js's
// sellOne/sellAllFish), not at catch time — it rewards selling into today's
// demand, not just having caught the species at some point.
import { FISH } from './fish.js';

export const HOT_CATCH_VALUE_MULT = 1.5;

export function rollHotCatch(rng = Math.random) {
  const pool = FISH.filter(f => !f.boss);
  return pool[Math.floor(rng() * pool.length)].id;
}
