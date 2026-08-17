// Morris's branching conversation tree. Each node has `text` and a list of
// `options`. An option either points at another node (`next`, which may be
// a function of state for conditional branching) or fires an `action`
// string the caller handles (see ui/dialogue.js + main.js). Omitting both
// ends the conversation.
import { playerName } from '../core/gameState.js';
import { rankForLevel } from '../data/ranks.js';
import { morrisRapportTier } from './morris.js';

export const MORRIS_START = 'start';

// Rather than a whole extra dialogue branch, a rapport-gated story rides
// along on the farewell line instead (see the `end` node below) — keyed by
// talkCount parity so two visits in a row don't always land the same one.
const SEA_STORIES = [
  "Once rowed a fella so heavy the boat nearly went under before we cleared the pier. Charged him double after that, and he still tips better than most.",
  "Saw a fish once, out past the Abyssal rift, bigger than this whole boat. Didn't try to catch it. Didn't try to look at it twice either.",
  "Lost a good hat to a gust off Mountain Isle. Still see it out there sometimes, bobbing along like it's got somewhere to be.",
  "Ask Grizelda about the time I tried her fourth brew on an empty stomach. Actually — don't. I still owe that story some dignity.",
];

// Morris's opener changes with how well he actually knows you by now — a
// first-ever meeting, a familiar-but-still-green regular, and someone who's
// climbed the ranks all get a genuinely different line, instead of the same
// canned greeting no matter how many fish you've landed since.
function morrisGreeting(state) {
  const name = playerName(state);
  if (state.npc.morris.talkCount === 0) {
    return `Ahoy there, ${name}! Name's Morris — I row folk out to the fishing grounds, for the right coin. What'll it be?`;
  }
  const rank = rankForLevel(state.level);
  const best = state.personalBests.biggestOverall;
  const tier = morrisRapportTier(state);
  if (rank.id === 'admiral') {
    return `Admiral ${name}. Half the docks salute when you walk by these days — still can't believe I used to row you out for pocket change.`;
  }
  if (rank.id === 'captain') {
    return `Cap'n ${name}! Fancy title, that. Where's the Captain fancy going today?`;
  }
  if (tier.id === 'oldSalt') {
    return `There's my favorite passenger. Boat's warmed up and waiting, ${name} — say the word.`;
  }
  if (best) {
    return `Back again, ${name}. Still thinkin' about that ${best.size.toFixed(1)}-inch ${best.name}? Where to this time?`;
  }
  return `Back again, ${name}. Where to this time?`;
}

export const MORRIS_DIALOGUE = {
  start: {
    text: morrisGreeting,
    options: [
      { label: 'Who are you, exactly?', next: 'about' },
      { label: 'Any news from the docks?', next: 'news' },
      { label: 'Take me somewhere to fish?', next: 'travelAsk' },
      { label: 'Just passing by.', next: 'end' },
    ],
  },

  // Points at the Daily Bounty board (data/bounties.js, tracked in the
  // Notebook) without duplicating its numbers here — Morris just tells you
  // it exists and how urgent it is today, the Notebook is the source of
  // truth for exactly what's on it.
  news: {
    text: (state) => {
      const open = state.bounties ? state.bounties.list.filter(b => !b.claimed).length : 0;
      if (open === 0) {
        return "Board's picked clean for today, far as I've heard. Fresh bounties go up every morning — check your Notebook at first light.";
      }
      return `Aye — ${open} bount${open === 1 ? 'y' : 'ies'} still open on the board today, good coin for the right catch. Your Notebook'll have the particulars.`;
    },
    options: [
      { label: 'Take me somewhere to fish?', next: 'travelAsk' },
      { label: 'Thanks, Morris.', next: 'end' },
    ],
  },

  about: {
    text: "Rowed these waters longer than ye've been alive, matey. Lost this hand to somethin' with too many teeth — the hook does just fine gutting fish, mind ye.",
    options: [
      { label: 'What waters have you seen?', next: 'aboutWaters' },
      { label: 'Take me somewhere to fish?', next: 'travelAsk' },
      { label: "I'll leave you be.", next: 'end' },
    ],
  },

  aboutWaters: {
    text: "Seaside coves, black mountain fjords, waters so deep the light gives up before ye hit bottom. I've rowed men out and... not always rowed 'em back.",
    options: [
      { label: 'Cheerful. Take me out there?', next: 'travelAsk' },
      { label: "I'll leave you be.", next: 'end' },
    ],
  },

  // The old flat "talk 3 times" gate is now just the Shipmate rapport tier
  // (data/morris.js) — same threshold, but it reads Morris's actual trust
  // level instead of a bare counter, and the line changes again once he's
  // properly fond of you (Old Salt).
  travelAsk: {
    text: (state) => {
      const tier = morrisRapportTier(state);
      if (tier.id === 'stranger') return "Ha! I don't row for strangers I've just met. Chew the fat with me a spell first, then we'll talk.";
      if (tier.id === 'oldSalt') return "For you? Always. Let's see where the water's calling today.";
      return "Aye, I know a few spots. Ready when you are, cap'n.";
    },
    options: [
      { label: 'Show me the map.', next: 'mapGate' },
      { label: 'Tell me about yourself.', next: 'about' },
      { label: 'Fair enough.', next: 'end' },
    ],
  },

  mapGate: {
    text: (state) => (morrisRapportTier(state).id !== 'stranger'
      ? "Here y'are — mind the stars, more of 'em means rougher water and meaner fish. Pick yer poison."
      : "Not so fast — I don't hand out charts to just anyone. A few more words first, eh?"),
    options: [
      { label: 'Open the map', action: 'openMap', when: (state) => morrisRapportTier(state).id !== 'stranger' },
      { label: 'Tell me about yourself.', next: 'about', when: (state) => morrisRapportTier(state).id === 'stranger' },
      { label: 'Never mind.', next: 'end' },
    ],
  },

  // Shipmate rapport or better rides a short sea story along on the
  // farewell every other visit (talkCount parity), instead of a whole
  // extra "got a story?" branch — flavor without more options to click
  // through.
  end: {
    text: (state) => {
      const name = playerName(state);
      const talk = state.npc.morris.talkCount;
      if (morrisRapportTier(state).id !== 'stranger' && talk % 2 === 0) {
        const story = SEA_STORIES[Math.floor(talk / 2) % SEA_STORIES.length];
        return `Fair winds to ye, ${name}. Oh, and — ${story}`;
      }
      return `Fair winds to ye, ${name}.`;
    },
    options: [],
  },
};
