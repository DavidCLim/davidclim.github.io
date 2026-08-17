// Daily login rewards — a small escalating gift for playing on consecutive
// real-world days, separate from the Daily Bounty board (data/bounties.js)
// which resets *what to catch*, not just for showing up. Caps at day 7 and
// stays there for anything beyond a week-long streak, rather than growing
// without bound.
export const DAILY_LOGIN_REWARDS = [
  { day: 1, gold: 20, exp: 15 },
  { day: 2, gold: 30, exp: 20 },
  { day: 3, gold: 50, exp: 30 },
  { day: 4, gold: 70, exp: 40 },
  { day: 5, gold: 100, exp: 60 },
  { day: 6, gold: 140, exp: 80 },
  { day: 7, gold: 250, exp: 150 },
];

export function rewardForStreakDay(streak) {
  const idx = Math.min(streak, DAILY_LOGIN_REWARDS.length) - 1;
  return DAILY_LOGIN_REWARDS[Math.max(0, idx)];
}

// Local-date key (not UTC), matching data/bounties.js's todayBountyKey — the
// board and the login streak both flip over at the player's own midnight.
export function todayLoginKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}

// Whether `todayKey` is exactly one calendar day after `prevKey` — anything
// else (a gap of 2+ days, or no previous key at all) breaks the streak
// rather than continuing it.
export function isConsecutiveDay(prevKey, todayKey) {
  if (!prevKey) return false;
  const [py, pm, pd] = prevKey.split('-').map(Number);
  const prevDate = new Date(py, pm - 1, pd);
  prevDate.setDate(prevDate.getDate() + 1);
  const expectedKey = `${prevDate.getFullYear()}-${prevDate.getMonth() + 1}-${prevDate.getDate()}`;
  return expectedKey === todayKey;
}
