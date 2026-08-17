// Perfect Reel Streak — a skill-based combo, distinct from the plain catch
// streak (state.streak, data/streakMilestones.js). That one only cares
// whether you kept landing fish; this one cares whether you reeled each one
// in *cleanly* (tension never spiked past TUNE.cleanTensionThreshold in
// fishing/fishingMachine.js) — so a careless string of catches never builds
// this bonus, and one sloppy fight resets it even if the fish still gets
// landed. Read off state.cleanStreak.current (fishing/fishingMachine.js
// updates it) rather than being computed here.
export const CLEAN_STREAK_VALUE_PER_LEVEL = 0.02; // +2% sell value per clean reel in a row
export const CLEAN_STREAK_MAX_BONUS = 0.30; // caps at +30%, reached at streak 15

export function cleanStreakValueMul(streak) {
  return Math.min(CLEAN_STREAK_MAX_BONUS, streak * CLEAN_STREAK_VALUE_PER_LEVEL);
}
