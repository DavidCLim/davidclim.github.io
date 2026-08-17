// Today's Quarry — one random species picked each day (same date-key
// pattern as Today's Hot Catch, data/hotCatch.js) that pays a flat one-time
// bonus the first time you land it today. Distinct from Hot Catch (a
// sell-price bump on whichever species is featured) and from the
// rarity-tier Daily Bounties/Weekly Challenges (any fish of a given rarity
// counts): this names one specific species and rewards actually going out
// and finding that one fish.
import { FISH } from './fish.js';

export const QUARRY_BONUS_GOLD = 150;
export const QUARRY_BONUS_EXP = 100;

export function rollQuarry(rng = Math.random) {
  const pool = FISH.filter(f => !f.boss);
  return pool[Math.floor(rng() * pool.length)].id;
}
