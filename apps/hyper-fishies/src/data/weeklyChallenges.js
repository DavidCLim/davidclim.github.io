import { RARITY } from './rarity.js';

// Weekly Challenges: the same "reach N catches of rarity X-or-better" shape
// as the Daily Bounty board (data/bounties.js), scaled way up for a full
// week — bigger goals, much bigger payouts, and only 2 drawn instead of 3
// so a week's board still reads as a real commitment rather than a daily
// board with padded numbers.
export const WEEKLY_TIERS = [
  { rarity: 'common', goal: 40, rewardGold: 400, rewardExp: 300 },
  { rarity: 'rare', goal: 20, rewardGold: 900, rewardExp: 650 },
  { rarity: 'legendary', goal: 10, rewardGold: 1800, rewardExp: 1300 },
  { rarity: 'mythic', goal: 5, rewardGold: 3200, rewardExp: 2200 },
  { rarity: 'gargantuan', goal: 3, rewardGold: 5000, rewardExp: 3400 },
];

export function weeklyLabel(tier) {
  return tier.rarity === 'common'
    ? 'Common catches'
    : `${RARITY[tier.rarity].label}-or-better catches`;
}

export function rollWeeklyChallenges() {
  const pool = WEEKLY_TIERS.slice();
  const picks = [];
  while (picks.length < 2 && pool.length) {
    picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picks.map((tier, i) => ({
    id: `${tier.rarity}-${i}`,
    rarity: tier.rarity,
    label: weeklyLabel(tier),
    goal: tier.goal,
    progress: 0,
    rewardGold: tier.rewardGold,
    rewardExp: tier.rewardExp,
    claimed: false,
    weekly: true,
  }));
}

// ISO-ish week key computed from the player's own local date (matching
// data/bounties.js's local-date todayBountyKey) rather than a running
// server clock — the board turns over once a week without needing one.
function weekKeyForDate(d) {
  const firstJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor((d - firstJan) / 86400000);
  const week = Math.ceil((days + firstJan.getDay() + 1) / 7);
  return `${d.getFullYear()}-W${week}`;
}

export function currentWeekKey() {
  return weekKeyForDate(new Date());
}

// How long until the board actually turns over — walks forward a day at a
// time from local midnight until weekKeyForDate disagrees with today's key,
// rather than assuming a fixed "always resets on Monday" offset (matches
// whatever weekKeyForDate itself considers a week boundary, so this can
// never drift out of sync with the reroll condition in
// economy.js's ensureWeeklyChallenges).
export function msUntilNextWeek() {
  const now = new Date();
  const key = weekKeyForDate(now);
  const cursor = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (let i = 0; i < 8; i++) {
    cursor.setDate(cursor.getDate() + 1);
    if (weekKeyForDate(cursor) !== key) return cursor - now;
  }
  return 7 * 86400000 - (now - new Date(now.getFullYear(), now.getMonth(), now.getDate()));
}
