// Fishing line: the third equipment slot alongside rod and hook (economy.js's
// buyLine/equipLine, worn via the Satchel). Focused on biteSpeed and control
// — a lighter, better-tuned line reads a bite sooner and gives you steadier
// hands through the reel. Stacks into effectiveRodStats (core/gameState.js)
// the same way runes/hooks do.
export const LINES = [
  { id: 'basicLine', name: 'Basic Line', cost: 0, biteSpeed: 0.00, control: 0.00 },
  { id: 'braidedLine', name: 'Braided Line', cost: 100, biteSpeed: 0.03, control: 0.03 },
  { id: 'monoLine', name: 'Monofilament Line', cost: 260, biteSpeed: 0.06, control: 0.05 },
  { id: 'fluoroLine', name: 'Fluorocarbon Line', cost: 550, biteSpeed: 0.09, control: 0.08 },
  { id: 'abyssalLine', name: 'Abyssal-Braid Line', cost: 1000, biteSpeed: 0.14, control: 0.12 },
];

export function lineById(id) {
  return LINES.find(l => l.id === id) || LINES[0];
}
