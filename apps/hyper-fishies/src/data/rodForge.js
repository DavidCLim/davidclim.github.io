// Rod Reinforcement (ui/forgePanel.js, economy.js's reinforceRod) — spend a
// batch of rod parts plus gold to permanently strengthen whichever rod is
// currently equipped, capped per rod so it stays a supplement to a real rod
// upgrade (or to Rod Mastery, data/rodMastery.js) rather than a replacement
// for either. Gives the parts pile an ongoing use once every craftable rod
// is already owned, instead of dead-ending at "melt for gold."
export const REINFORCE_PARTS_COST = 3;
export const REINFORCE_GOLD_COST = 60;
export const REINFORCE_MAX_PER_ROD = 5;
export const REINFORCE_STAT_PER_LEVEL = 0.012;

export function rodReinforcementCount(state, rodId) {
  return (state.rodReinforcements && state.rodReinforcements[rodId]) || 0;
}

export function rodReinforcementBonus(state, rodId) {
  return rodReinforcementCount(state, rodId) * REINFORCE_STAT_PER_LEVEL;
}
