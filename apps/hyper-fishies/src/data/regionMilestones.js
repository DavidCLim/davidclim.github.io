// Charted Waters — fishing the same region enough times makes you better at
// reading it, permanently, but only while you're actually standing there
// (see core/gameState.js's effectiveRodStats, which only adds this in for
// state.currentRegion). Tiers aren't cumulative — you're always sitting at
// exactly the bonus for the highest tier you've crossed, not stacking every
// tier you've passed — so the numbers stay readable at a glance.
export const REGION_MILESTONES = [
  { count: 10, luck: 0.02 },
  { count: 25, luck: 0.04 },
  { count: 50, luck: 0.07 },
];

export function regionCatchCount(state, regionId) {
  return (state.regionCatchCounts && state.regionCatchCounts[regionId]) || 0;
}

export function regionMasteryBonus(state, regionId) {
  const count = regionCatchCount(state, regionId);
  let bonus = 0;
  for (const tier of REGION_MILESTONES) {
    if (count >= tier.count) bonus = tier.luck;
  }
  return bonus;
}

// Next tier still to reach, or null once every tier for this region is
// cleared — used by ui/notebookPanel.js to render a progress bar toward the
// next milestone rather than just the current bonus.
export function nextRegionMilestone(state, regionId) {
  const count = regionCatchCount(state, regionId);
  return REGION_MILESTONES.find(tier => count < tier.count) || null;
}
