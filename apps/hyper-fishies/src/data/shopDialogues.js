// Short dialogue trees for the three shopkeepers. Same node-graph shape as
// morrisDialogue.js: an option either points at `next` (another node) or
// fires an `action` string (handled in main.js — always opens that NPC's
// shop overlay).
import { playerName, bagCapacity } from '../core/gameState.js';

export const ANGLER_START = 'start';
export const ANGLER_DIALOGUE = {
  start: {
    // Finn actually looks at what you're carrying — still swinging the
    // starter twig gets ribbed, a real rod gets a nod of approval instead.
    text: (state) => {
      const name = playerName(state);
      if (state.rod.equipped === 'twig') {
        return `Well hey there, ${name} — still swingin' that bent twig, are ye? No shame in it, but I've got rods that'll actually pull their weight.`;
      }
      return `Well hey there, ${name} — that's a decent rod you've got now. Here for another upgrade, or just to talk shop?`;
    },
    options: [
      { label: 'Show me the rods.', action: 'openRodShop' },
      { label: 'Any tips for a beginner?', next: 'tips' },
      { label: 'Got a favorite catch story?', next: 'story' },
      {
        label: 'What did you want to ask me?',
        next: 'questOffer',
        when: (state) => state.quests.finn.stage === 'available',
      },
      {
        label: "How's the quest going?",
        next: 'questProgress',
        when: (state) => state.quests.finn.stage === 'active',
      },
      {
        label: 'About that Leviathan rod...',
        next: (state) => { state.quests.finn.stage = 'thanked'; return 'questDone'; },
        when: (state) => state.quests.finn.stage === 'complete',
      },
      { label: 'Just looking.', next: 'end' },
    ],
  },
  questOffer: {
    text: (state) => `That Leviathan's Cutlass you bought — heaviest rod on my rack, and I've never once seen anyone actually land anything worthy of it. Bring me ${state.quests.finn.goal} Gargantuan-or-better catches on it and I'll believe you've earned the thing. Do that, and Old Faithful's yours — the rod I actually fish with, not the one I sell.`,
    options: [
      { label: "I'll do it.", action: 'acceptFinnQuest' },
      { label: 'Maybe later.', next: 'end' },
    ],
  },
  questProgress: {
    text: (state) => `Still watching that rack for a return. You're at ${state.quests.finn.progress} of ${state.quests.finn.goal} gargantuan-or-better catches — nothing smaller counts, no matter how it fought.`,
    options: [
      { label: 'Show me the rods.', action: 'openRodShop' },
      { label: 'Back to it.', next: 'end' },
    ],
  },
  questDone: {
    text: "Ha! Told you that rod wasn't for show. Old Faithful's yours now — treat her better than I did, she deserves it.",
    options: [
      { label: 'Show me the rods.', action: 'openRodShop' },
      { label: 'Thanks, Finn.', next: 'end' },
    ],
  },
  tips: {
    text: "Keep the tension low 'til you know the fish — a clean reel is worth more than a fast one. Rush it and you'll be buying a new line, not a new rod.",
    options: [
      { label: "That's good to know. Show me the rods.", action: 'openRodShop' },
      { label: 'Thanks, Finn.', next: 'end' },
    ],
  },
  story: {
    // Finn's own claim gets quietly one-upped once you've actually landed
    // something worth bragging about — same "the game knows what you did"
    // touch as the streak-aware opener above.
    text: (state) => {
      const best = state.personalBests.biggestOverall;
      if (best) {
        return `Best I ever personally landed doesn't hold a candle to your ${best.size.toFixed(1)}-inch ${best.name}, if I'm honest. Don't go telling the other customers I admitted that.`;
      }
      return "Landed a Rare once that near pulled me clean off the dock. Haven't topped it since — but with the right rod, you might.";
    },
    options: [
      { label: 'Show me the rods.', action: 'openRodShop' },
      { label: 'Thanks for sharing.', next: 'end' },
    ],
  },
  end: { text: (state) => `Tight lines, ${playerName(state)}.`, options: [] },
};

export const WORM_START = 'start';
export const WORM_DIALOGUE = {
  start: {
    // A hot streak gets noticed — Richy's the type to comment on your form,
    // not just sell you bait.
    text: (state) => {
      const name = playerName(state);
      if (state.streak.current >= 5) {
        return `Ah, ${name}! Word's gotten around — ${state.streak.current} in a row, is it? Distinguished form. I'd applaud, but, well — no hands.`;
      }
      return `Ah, ${name}! Richy, at your service — purveyor of only the finest wrigglers this side of the dirt. Distinguished. Debonair. Never once touched a hook myself.`;
    },
    options: [
      { label: "Let's see your bait.", action: 'openTackle' },
      { label: "Who's your little friend?", next: 'worry' },
      { label: 'Ever fish yourself?', next: 'wormFish' },
      {
        label: 'What did you want to ask me?',
        next: 'questOffer',
        when: (state) => state.quests.richy.stage === 'available',
      },
      {
        label: "How's the quest going?",
        next: 'questProgress',
        when: (state) => state.quests.richy.stage === 'active',
      },
      {
        label: 'About that quest...',
        // Flips to a new terminal stage as a side effect of reading this
        // node, distinct from 'complete' — so once you've heard Richy's
        // one-time "Ha! Knew you had it in you" payoff, the quest option
        // stops cluttering his dialogue on every future visit. The reward
        // itself was already granted the moment the quest completed (see
        // fishing/fishingMachine.js), so this is purely acknowledgment.
        next: (state) => { state.quests.richy.stage = 'thanked'; return 'questDone'; },
        when: (state) => state.quests.richy.stage === 'complete',
      },
      { label: 'Not today.', next: 'end' },
    ],
  },
  worry: {
    text: "Wriggles, here? Found him in a shipment years back — too charming to sell. Best business partner I've ever had. Mostly just sits there, honestly.",
    options: [
      { label: "Cute. Show me the bait.", action: 'openTackle' },
      { label: "I'll leave you two to it.", next: 'end' },
    ],
  },
  wormFish: {
    text: "Me? Perish the thought — I sell the bait, I don't dangle it. Wriggles here's about as close as I get to the water, and even he just sits there judging my technique.",
    options: [
      { label: "Let's see your bait.", action: 'openTackle' },
      { label: 'Fair enough.', next: 'end' },
    ],
  },
  questOffer: {
    text: (state) => `Between you and me — that Harpoon Chunk wasn't just stock. I've been dying to know if it actually works. Land ${state.quests.richy.goal} Legendary-or-better fish and prove it, and I'll let you in on my Special recipe — for good. No charge, ever again.`,
    options: [
      { label: "I'll do it.", action: 'acceptRichyQuest' },
      { label: 'Maybe later.', next: 'end' },
    ],
  },
  questProgress: {
    text: (state) => `Not yet, not yet — no Special until you've proven it. You're at ${state.quests.richy.progress} of ${state.quests.richy.goal} legendary-or-better catches. A common one won't count, no matter how big it looks.`,
    options: [
      { label: "Let's see your bait.", action: 'openTackle' },
      { label: 'Back to it, then.', next: 'end' },
    ],
  },
  questDone: {
    text: "Ha! Knew you had it in you. The recipe's yours now — brew as much of the Special as you like, it'll never run dry.",
    options: [
      { label: "Let's see your bait.", action: 'openTackle' },
      { label: 'Thanks, Richy.', next: 'end' },
    ],
  },
  end: { text: (state) => `Do come again, ${playerName(state)} — I shall be here. I have nowhere else to be.`, options: [] },
};

export const PIRATE_START = 'start';
export const PIRATE_DIALOGUE = {
  start: {
    // A bag riding near full gets a nudge to come sell — B-LA-KA's whole
    // job is watching people's nets, he'd notice.
    text: (state) => {
      const name = playerName(state);
      const cap = bagCapacity(state);
      if (state.bag.items.length >= cap && cap > 0) {
        return `Arr, ${name} — that bag o' yours is fit to burst. Best let ol' B-LA-KA lighten the load before ye can't reel in another.`;
      }
      return `Arr, ${name}, fresh catch, is it? B-LA-KA's the name — weighin' fish and countin' gold's the game. Let's see what ye hauled up.`;
    },
    options: [
      { label: "Let's trade.", action: 'openMarket' },
      { label: 'Got any sea stories?', next: 'story' },
      { label: 'Seen anything shiny come through?', next: 'shinyTalk' },
      {
        label: 'What did you want to ask me?',
        next: 'questOffer',
        when: (state) => state.quests.barnaby.stage === 'available',
      },
      {
        label: "How's the quest going?",
        next: 'questProgress',
        when: (state) => state.quests.barnaby.stage === 'active',
      },
      {
        label: 'About that Ledger...',
        next: (state) => { state.quests.barnaby.stage = 'thanked'; return 'questDone'; },
        when: (state) => state.quests.barnaby.stage === 'complete',
      },
      { label: 'Just browsing.', next: 'end' },
    ],
  },
  questOffer: {
    text: (state) => `That Abyssal Ledger ye bought off me — weighs truer than any scale I've sold, but I've never once trusted my own numbers on a real haul. Crack open ${state.quests.barnaby.goal} Sea Chests and bring me the count, and I'll hand over me own Golden Scale. Never sold that one. Never will.`,
    options: [
      { label: "I'll do it.", action: 'acceptBarnabyQuest' },
      { label: 'Maybe later.', next: 'end' },
    ],
  },
  questProgress: {
    text: (state) => `Still countin'. Ye're at ${state.quests.barnaby.progress} of ${state.quests.barnaby.goal} chests opened — gold from a fish don't count, only chests off the hook.`,
    options: [
      { label: "Let's trade.", action: 'openMarket' },
      { label: 'Back to it.', next: 'end' },
    ],
  },
  questDone: {
    text: "Ha! Knew that Ledger'd pay for itself. Golden Scale's yours now, fair and square — weighs truer than anythin' else on me counter.",
    options: [
      { label: "Let's trade.", action: 'openMarket' },
      { label: 'Thanks, B-LA-KA.', next: 'end' },
    ],
  },
  story: {
    text: "Once hauled up somethin' the size of a rowboat off the Abyssal Lands. Sold it for enough gold to retire twice over. Didn't, obviously. Here I am.",
    options: [
      { label: "Ha — alright, let's trade.", action: 'openMarket' },
      { label: "I'll let you get back to it.", next: 'end' },
    ],
  },
  shinyTalk: {
    text: (state) => {
      const n = state.shinyCaughtCount;
      if (n > 0) {
        return `Aye, matter of fact — ${n} of 'em's come through your own nets. Gleam like that don't happen by accident, ${playerName(state)}. Keep 'em coming and I'll keep payin' true weight.`;
      }
      return "Time to time. Whole fish gleamin' like it swallowed a lantern whole. Fetches a mighty fine price too, if the deep ever hands you one.";
    },
    options: [
      { label: "Let's trade.", action: 'openMarket' },
      { label: 'Noted.', next: 'end' },
    ],
  },
  end: { text: (state) => `Fair winds and full nets to ye, ${playerName(state)}.`, options: [] },
};

export const WITCH_START = 'start';
export const WITCH_DIALOGUE = {
  start: {
    // She can see her own work — a rod already carrying socketed runes gets
    // a knowing remark instead of the generic pitch.
    text: (state) => {
      const name = playerName(state);
      const socketed = (state.rod.socketed && state.rod.socketed[state.rod.equipped]) || [];
      if (socketed.length > 0) {
        return `Heh heh... ${name}. I can feel my own work humming on that rod from here. Back for another rune, or did one of mine finally crack?`;
      }
      return `Heh heh heh... ${name}, is it? Grizelda's the name — though 'round these docks they call me the Wicked Witch of the Fishies. I carve runes. Want one on that rod of yours?`;
    },
    options: [
      { label: 'Show me your runes.', action: 'openRuneShop' },
      { label: 'What do runes actually do?', next: 'explain' },
      { label: 'Where did you learn all this?', next: 'origin' },
      { label: "I'll pass.", next: 'end' },
    ],
  },
  explain: {
    text: "A little of my own luck, bound into stone and set into your rod — sharper eyes for rare fish, steadier hands, faster bites, whatever you fancy. Carving one costs gold. Setting it in the rod costs gold. Prying it back out again? Also costs gold. Magic isn't charity, dear.",
    options: [
      { label: "Fair enough — show me the runes.", action: 'openRuneShop' },
      { label: 'Maybe another time.', next: 'end' },
    ],
  },
  origin: {
    text: "Carved my first ward under a sky none of you would recognize, for people who'd have burned these docks to the waterline just to watch. Quieter here. Fewer torches. I've traded up, heh heh.",
    options: [
      { label: 'Show me your runes.', action: 'openRuneShop' },
      { label: 'Interesting.', next: 'end' },
    ],
  },
  end: { text: (state) => `Mind the tide on your way out, ${playerName(state)}. Heh heh.`, options: [] },
};

export const SHOP_DIALOGUES = {
  finn: { tree: ANGLER_DIALOGUE, start: ANGLER_START },
  wiggins: { tree: WORM_DIALOGUE, start: WORM_START },
  barnaby: { tree: PIRATE_DIALOGUE, start: PIRATE_START },
  grizelda: { tree: WITCH_DIALOGUE, start: WITCH_START },
};
