// Wearable titles, each tied to one achievement (data/achievements.js) —
// purely cosmetic, shown next to the player's name in the Profile panel.
// `none` has no requirement and is always unlocked (the default).
export const TITLES = [
  { id: 'none', label: 'No Title', achievementId: null },
  { id: 'rookie', label: 'the Rookie Angler', achievementId: 'first_catch' },
  { id: 'rareFinder', label: 'the Rare Finder', achievementId: 'first_rare' },
  { id: 'legendChaser', label: 'the Legend-Chaser', achievementId: 'first_legendary' },
  { id: 'mythMaker', label: 'the Myth-Maker', achievementId: 'first_mythic' },
  { id: 'deepDiver', label: 'the Deep Diver', achievementId: 'first_abyssal' },
  { id: 'secretKeeper', label: 'Keeper of Secrets', achievementId: 'first_secret' },
  { id: 'seasoned', label: 'the Seasoned Angler', achievementId: 'century_catch' },
  { id: 'completeLog', label: 'the Complete Log', achievementId: 'full_log' },
  { id: 'shinyHunter', label: 'the Shiny Hunter', achievementId: 'shiny_hunter' },
  { id: 'unstoppable', label: 'the Unstoppable', achievementId: 'streak_25' },
  { id: 'debtsRepaid', label: 'Debts Repaid', achievementId: 'quest_master' },
  { id: 'stormChaser', label: 'the Storm Chaser', achievementId: 'storm_chaser' },
  { id: 'topOfLadder', label: 'Top of the Ladder', achievementId: 'max_level' },
  { id: 'ascended', label: 'the Ascended', achievementId: 'first_prestige' },
  { id: 'giantHunter', label: 'the Giant Hunter', achievementId: 'giant_hunter' },
  { id: 'treasureFinder', label: 'the Treasure Finder', achievementId: 'buried_treasure' },
];

export function titleById(id) {
  return TITLES.find(t => t.id === id) || TITLES[0];
}

export function isTitleUnlocked(state, title) {
  return !title.achievementId || !!state.achievements[title.achievementId];
}
