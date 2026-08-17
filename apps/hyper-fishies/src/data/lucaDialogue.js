import { playerName } from '../core/gameState.js';

// Luca — a fisherman half-taken by something that came up with the last
// thing he ever hooked out here. Only ever findable in the Abyssal Lands
// (see world/worldObjects.js's `region` gate). His quest runs the same
// stage-machine shape as Richy's (data/shopDialogues.js): 'available' ->
// 'active' (gathering ingredients — see fishing/fishingMachine.js's
// resolveCatch) -> 'ingredientsReady' (go see Grizelda —
// ui/witchShopPanel.js's craftCleansingRune) -> 'runeReady' (bring it back)
// -> 'complete' -> 'thanked'.
export const LUCA_START = 'start';
export const LUCA_DIALOGUE = {
  start: {
    text: (state) => {
      const stage = state.quests.luca.stage;
      if (stage === 'active') {
        return `${playerName(state)}... it's still — heh — still in here. Talking's getting harder. Have you found what it wants yet?`;
      }
      if (stage === 'ingredientsReady') {
        return "It's quiet. Too quiet — it knows you've got what you need. Go. The witch. Before it wakes back up.";
      }
      if (stage === 'runeReady') {
        return "I can feel it clawing at the back of my own skull. Whatever you're holding — please. Now.";
      }
      if (stage === 'complete' || stage === 'thanked') {
        return `${playerName(state)}. Still can't believe I'm the one talking, all the way through. Been a long time since that was true.`;
      }
      return `Don't— heh. Don't mind the eye, ${playerName(state)}. Something followed a catch home a while back and it's been wearing me since. Most days I can still hold the wheel.`;
    },
    options: [
      {
        label: "I'll get it out of you.",
        action: 'acceptLucaQuest',
        when: (state) => state.quests.luca.stage === 'available',
      },
      {
        label: "What happened to you?",
        next: 'explainPossession',
        when: (state) => state.quests.luca.stage === 'available',
      },
      {
        label: "How's the hunt going?",
        next: 'questProgress',
        when: (state) => state.quests.luca.stage === 'active',
      },
      {
        label: "Hold still.",
        action: 'completeLucaQuest',
        when: (state) => state.quests.luca.stage === 'runeReady',
      },
      {
        label: 'About the cure...',
        // Same one-time-payoff pattern as Richy's dialogue: flips to
        // 'thanked' as a side effect of reading this node, so his grateful
        // line only ever plays once and stops cluttering future visits.
        next: (state) => { state.quests.luca.stage = 'thanked'; return 'questDone'; },
        when: (state) => state.quests.luca.stage === 'complete',
      },
      {
        label: "How's it feel, being free?",
        next: 'freeChat',
        when: (state) => state.quests.luca.stage === 'thanked',
      },
      { label: "I'll leave you to it.", next: 'end' },
    ],
  },
  freeChat: {
    text: "Strange, honestly. Keep waking up and checking if it's still gone. It is, every time. Gonna take some getting used to — being just me, all the way down, nothing else looking out through my eyes.",
    options: [{ label: 'Take care of yourself, Luca.', next: 'end' }],
  },
  explainPossession: {
    text: "Hooked something out past the trench line that I never should've kept. Half in me now, half still down there, far as I can tell. There's a way to pull it clean out — Grizelda could carve the rune for it, if I had what the cure calls for. Cursed things, dragged up from exactly where this thing came from.",
    options: [
      { label: "I'll get it out of you.", action: 'acceptLucaQuest' },
      { label: 'Maybe another time.', next: 'end' },
    ],
  },
  questProgress: {
    text: (state) => `Every one you land down here that the deep itself twisted — that's a piece of what's holding onto me. You're at ${state.quests.luca.progress} of ${state.quests.luca.goal}. Keep casting.`,
    options: [{ label: 'Back to it.', next: 'end' }],
  },
  questDone: {
    text: "Sun feels different when it's just your own eyes looking at it. I mean that. Take this — pulled it off my own gear before you got here. Don't know how long it's been cursed, only that it isn't anymore, and neither am I.",
    options: [{ label: 'Take care of yourself, Luca.', next: 'end' }],
  },
  end: { text: (state) => `Mind the water, ${playerName(state)}. It's already got one of us.`, options: [] },
};
