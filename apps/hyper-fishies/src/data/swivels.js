// Swivels: a fourth equipment slot alongside rod/hook/line — sold by Richy
// at Bait & Barnacles, right alongside the bait it keeps a rig from
// twisting. Focused on Luck + Bite Speed: a smoother rig spooks fewer fish
// and reads a bite sooner. Stacks into effectiveRodStats (core/gameState.js)
// the same flat-add way every other gear slot does.
export const SWIVELS = [
  { id: 'basicSwivel', name: 'Basic Swivel', cost: 0, luck: 0.00, biteSpeed: 0.00 },
  { id: 'brassSwivel', name: 'Brass Swivel', cost: 90, luck: 0.02, biteSpeed: 0.02 },
  { id: 'ballBearingSwivel', name: 'Ball-Bearing Swivel', cost: 240, luck: 0.04, biteSpeed: 0.04 },
  { id: 'titaniumSwivel', name: 'Titanium Swivel', cost: 520, luck: 0.07, biteSpeed: 0.06 },
  { id: 'abyssalSwivel', name: 'Abyssal Swivel', cost: 950, luck: 0.11, biteSpeed: 0.09 },
];

export function swivelById(id) {
  return SWIVELS.find(s => s.id === id) || SWIVELS[0];
}
