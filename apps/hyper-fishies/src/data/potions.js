// Grizelda's Brews: consumable, time-limited buffs — a gold sink distinct
// from every permanent purchase in the game (rods/hooks/line/runes/gear),
// and a reason to actually spend a big stash instead of just watching it
// pile up. Only one brew can be active at a time; buying a new one replaces
// whatever's still running rather than stacking.
export const POTIONS = [
  { id: 'luckyBrew', name: 'Lucky Brew', icon: '🍀', effect: { luck: 0.15 }, cost: 150, duration: 300 },
  { id: 'swiftTonic', name: 'Swift Tonic', icon: '⚡', effect: { biteSpeed: 0.15 }, cost: 150, duration: 300 },
  { id: 'steadyDraft', name: 'Steady Draft', icon: '🎯', effect: { control: 0.15 }, cost: 150, duration: 300 },
  { id: 'goldenElixir', name: 'Golden Elixir', icon: '✨', effect: { valueMul: 0.25 }, cost: 300, duration: 300 },
  { id: 'giantsDraft', name: "Giant's Draft", icon: '🐋', effect: { sizeMul: 0.10 }, cost: 220, duration: 300 },
  { id: 'ironGrip', name: 'Iron Grip', icon: '🛡', effect: { snapGuard: 0.15 }, cost: 200, duration: 300 },
  { id: 'twinFortune', name: 'Twin Fortune', icon: '🎭', effect: { luck: 0.10, valueMul: 0.10 }, cost: 400, duration: 300 },
];

export function potionById(id) {
  return POTIONS.find(p => p.id === id) || null;
}
