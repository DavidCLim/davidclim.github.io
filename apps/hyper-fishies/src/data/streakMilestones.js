// Streak Milestone Buffs: reaching a live-streak threshold (state.streak.
// current, fishing/fishingMachine.js) grants a temporary stat bonus that
// stays active only as long as the streak itself does — break the streak
// and the bonus vanishes with it, same moment state.streak.current resets
// to 0. Purely derived from streak.current every call (gameState.js's
// effectiveRodStats), so there's nothing extra to persist or expire.
export const STREAK_MILESTONES = [
  { threshold: 5, bonus: { luck: 0.03 } },
  { threshold: 10, bonus: { luck: 0.05, biteSpeed: 0.03 } },
  { threshold: 15, bonus: { luck: 0.07, biteSpeed: 0.05, control: 0.03 } },
  { threshold: 20, bonus: { luck: 0.10, biteSpeed: 0.07, control: 0.05, valueMul: 0.05 } },
  { threshold: 25, bonus: { luck: 0.15, biteSpeed: 0.10, control: 0.08, valueMul: 0.10 } },
];

// The single highest-threshold milestone currently met — tiers aren't
// additive (each already includes a bigger version of the one before it),
// so only the best one applies.
export function activeStreakMilestone(streakCurrent) {
  let best = null;
  for (const m of STREAK_MILESTONES) {
    if (streakCurrent >= m.threshold) best = m;
  }
  return best;
}

export function streakBonus(streakCurrent) {
  const m = activeStreakMilestone(streakCurrent);
  return m ? m.bonus : {};
}
