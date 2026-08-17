// Fisch-style Rod Mastery — each rod quietly tracks its own XP as you catch
// fish with it equipped (state.rodMastery, economy.js's addRodMasteryXp),
// separate from the player's own level. Leveling a rod up grants that rod a
// small permanent stat bump, capped well below what runes or player rank
// can add — the reward here is a reason to stick with (and eventually
// master) a rod, not to replace player progression.
export const ROD_MASTERY_MAX_LEVEL = 10;
export const ROD_MASTERY_STAT_PER_LEVEL = 0.015; // +1.5%/level, up to +15% at max

export function rodMasteryXpToNext(level) {
  return 40 + level * 30;
}

export function rodMasteryBonus(state, rodId) {
  const m = state.rodMastery && state.rodMastery[rodId];
  return m ? m.level * ROD_MASTERY_STAT_PER_LEVEL : 0;
}

export function rodMasteryProgress(state, rodId) {
  const m = (state.rodMastery && state.rodMastery[rodId]) || { level: 0, xp: 0 };
  return {
    level: m.level,
    xp: m.xp,
    xpToNext: m.level >= ROD_MASTERY_MAX_LEVEL ? 0 : rodMasteryXpToNext(m.level),
    maxed: m.level >= ROD_MASTERY_MAX_LEVEL,
  };
}
