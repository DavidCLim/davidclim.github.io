import { playerName } from '../core/gameState.js';

// Garrick's dialogue — gruff, practical, no interest in fish. `openForge`
// (handled in main.js) opens the parts-and-crafting overlay (see
// ui/forgePanel.js) — always on offer now, whether you're carrying any
// parts or not, since the Forge itself has plenty to show/explain even at
// zero (and reinforcing a rod there doesn't need a rod part backlog to be
// worth walking in for).
export const BLACKSMITH_START = 'start';
export const BLACKSMITH_DIALOGUE = {
  start: {
    text: (state) => `${playerName(state)}. Bring me rod parts, not fish — I've no use for the latter. Enough scrap and I can lash you together something that'll actually cast.`,
    options: [
      { label: 'See what you can make.', action: 'openForge' },
      { label: "What's it for?", next: 'explain' },
      { label: 'Just looking.', next: 'end' },
    ],
  },
  explain: {
    text: "Rod parts. Enough of them and I'll build you a rod — not the prettiest thing on Finn's rack, but it'll pull its weight. I can also reinforce whatever you've already got equipped, parts or no parts to spare toward a whole new rod. Any cast has a small chance of turning up scrap instead of a fish, so keep at it and you'll have plenty soon enough.",
    options: [
      { label: 'See what you can make.', action: 'openForge' },
      { label: 'Good to know.', next: 'end' },
    ],
  },
  end: { text: (state) => `Mind the sparks on your way out, ${playerName(state)}.`, options: [] },
};
