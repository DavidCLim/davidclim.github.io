import { RARITY } from './rarity.js';

// Daily fishing bounties: "land N fish of rarity X or better," which
// piggybacks on the same rarity-rank comparison every catch already rolls
// (fishing/fishingMachine.js's resolveCatch) rather than needing a whole new
// tracking axis. Three of these four tiers are drawn at random each day —
// see rollDailyBounties below.
export const BOUNTY_TIERS = [
  { rarity: 'common', goal: 5, rewardGold: 50, rewardExp: 40 },
  { rarity: 'rare', goal: 3, rewardGold: 110, rewardExp: 90 },
  { rarity: 'legendary', goal: 2, rewardGold: 260, rewardExp: 200 },
  { rarity: 'mythic', goal: 1, rewardGold: 480, rewardExp: 360 },
];

export function bountyLabel(tier) {
  return tier.rarity === 'common'
    ? 'Common catches'
    : `${RARITY[tier.rarity].label}-or-better catches`;
}

export function rollDailyBounties() {
  const pool = BOUNTY_TIERS.slice();
  const picks = [];
  while (picks.length < 3 && pool.length) {
    picks.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return picks.map((tier, i) => ({
    id: `${tier.rarity}-${i}`,
    rarity: tier.rarity,
    label: bountyLabel(tier),
    goal: tier.goal,
    progress: 0,
    rewardGold: tier.rewardGold,
    rewardExp: tier.rewardExp,
    claimed: false,
  }));
}

// A local-date key (not UTC) so the board turns over at the player's own
// midnight rather than some arbitrary UTC boundary.
export function todayBountyKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Milliseconds until the player's own local midnight — how long until
// ensureDailyBounties (economy.js) actually rerolls the board.
export function msUntilNextDay() {
  const now = new Date();
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return next - now;
}
