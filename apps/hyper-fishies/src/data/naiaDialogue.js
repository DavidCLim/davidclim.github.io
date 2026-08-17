import { playerName } from '../core/gameState.js';

// Naia — the Abyss Warden, found only in the Abyssal Lands (see
// world/worldObjects.js's `region` gate, same shape as Luca's). Unlike
// Luca she isn't a quest chain — she's a standing NPC vendor for one
// exclusive item, the Voidsong Lure (data/bait.js's `voidLure`, sold
// nowhere else), reached via a dialogue action rather than a shop overlay.
// Buying it is handled by main.js's dialogueHandlers.buyVoidLure, which
// just calls the same buyBait(state, 'voidLure', 1) any other bait purchase
// goes through.
// She'll only ever part with one Voidsong Lure at a time — buying another
// while you're still holding one is refused (see main.js's buyVoidLure
// handler), not just discouraged by price.
export const VOID_LURE_MAX_OWNED = 1;

export const NAIA_START = 'start';
export const NAIA_DIALOGUE = {
  start: {
    text: (state) => (state.npc.naia.talkCount === 0
      ? `You made it out this far. Most don't come looking for me on purpose, ${playerName(state)}. I keep watch on what surfaces down here — and, sometimes, on what shouldn't.`
      : `Back again. The dark's no different than it was — but you look it over a little less each time.`),
    options: [
      { label: 'Who are you?', next: 'lore' },
      { label: 'I need a special lure.', next: 'shop' },
      { label: "What's down there, really?", next: 'hint' },
      { label: "I'll leave you to your watch.", next: 'end' },
    ],
  },
  lore: {
    text: "Warden's the word Luca uses. I don't fish these waters so much as listen to them — most of what lives past the trench line never comes up on its own. Doesn't mean it can't be called.",
    options: [
      { label: 'Called how?', next: 'shop' },
      { label: 'Back to it.', next: 'end' },
    ],
  },
  hint: {
    text: "Things that don't blink, because they were never built with anything to blink at. I've felt one watching from the dark more than once. Never caught it. Might be it's waiting for the right lure, not the right hook.",
    options: [
      { label: 'Tell me about the lure.', next: 'shop' },
      { label: "I'd rather not know.", next: 'end' },
    ],
  },
  shop: {
    text: (state) => ((state.bait.owned.voidLure || 0) >= VOID_LURE_MAX_OWNED
      ? "You're still carrying the one I gave you. Use it up, then come find me again."
      : "The Voidsong Lure. Takes me the better part of a season to make one right — 3,200 gold, and I'll only ever have one to spare."),
    options: [
      { label: 'Buy the Voidsong Lure (3,200g)', action: 'buyVoidLure', when: (state) => (state.bait.owned.voidLure || 0) < VOID_LURE_MAX_OWNED },
      { label: 'Not today.', next: 'end' },
    ],
  },
  end: { text: () => 'Mind the dark on your way back up.', options: [] },
};
