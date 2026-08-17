// Hooks: a second equipment slot alongside the rod (economy/economy.js's
// buyHook/equipHook, worn via the Satchel same as a rod). Focused on
// snapGuard — a hook's whole job is not letting go once it's set — with a
// little control on top for the sharper/heavier ones. Stacks into
// effectiveRodStats (core/gameState.js) the same way runes do.
export const HOOKS = [
  { id: 'basicHook', name: 'Basic Hook', cost: 0, snapGuard: 0.00, control: 0.00 },
  { id: 'barbedHook', name: 'Barbed Hook', cost: 80, snapGuard: 0.05, control: 0.02 },
  { id: 'weightedHook', name: 'Weighted Hook', cost: 220, snapGuard: 0.08, control: 0.05 },
  { id: 'trebleHook', name: 'Treble Hook', cost: 480, snapGuard: 0.12, control: 0.08 },
  { id: 'obsidianHook', name: 'Obsidian Hook', cost: 900, snapGuard: 0.18, control: 0.12 },
];

export function hookById(id) {
  return HOOKS.find(h => h.id === id) || HOOKS[0];
}
