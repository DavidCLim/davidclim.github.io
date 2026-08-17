// Prestige: once you've hit the level cap (data/ranks.js's MAX_LEVEL), trade
// your level back down to 1 for a small permanent bonus that stacks forever
// — the same "one more run" hook a lot of long-tail games use once the
// normal leveling curve runs out, so hitting the cap isn't a dead end.
// Coins, gear, catches, and achievements are all untouched — only level/exp
// reset (see economy.js's prestige()).
export const PRESTIGE_BONUS_PER_LEVEL = { luck: 0.015, valueMul: 0.02 };

export function prestigeBonus(state) {
  const n = (state && state.prestigeLevel) || 0;
  const bonus = {};
  for (const key in PRESTIGE_BONUS_PER_LEVEL) {
    bonus[key] = PRESTIGE_BONUS_PER_LEVEL[key] * n;
  }
  return bonus;
}

// A row of stars for the badge next to the player's name — caps the
// literal star count at 5 and switches to a "+N" suffix beyond that so a
// heavily-prestiged name doesn't run off the UI.
export function prestigeBadge(state) {
  const n = (state && state.prestigeLevel) || 0;
  if (n <= 0) return '';
  return '★'.repeat(Math.min(n, 5)) + (n > 5 ? `+${n - 5}` : '');
}
