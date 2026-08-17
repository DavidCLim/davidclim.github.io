// Milestone list for the Achievements panel (ui/achievementsPanel.js) —
// goals that cut across every system in the game (catches, rarity tiers,
// rank, quests, streaks, wealth) so there's always something to chase
// beyond "keep fishing at the same spot." `check(state)` is re-evaluated
// every frame (economy.js's checkAchievements) — cheap array scans, and
// each id is only ever granted once (state.achievements[id] persists).
import { FISH } from './fish.js';
import { REGIONS } from './regions.js';
import { BAG } from '../core/constants.js';
import { MAX_LEVEL } from './ranks.js';
import { FISH_SETS, isSetComplete } from './fishSets.js';
import { REGION_MILESTONES } from './regionMilestones.js';
import { MAP_FRAGMENTS_NEEDED } from './treasureMap.js';

function totalCatches(state) {
  let sum = 0;
  for (const f of FISH) {
    const entry = state.almanac[f.id];
    if (entry && entry.caught) sum += entry.count;
  }
  return sum;
}

function hasRarity(state, rarity) {
  return FISH.some(f => f.rarity === rarity && state.almanac[f.id] && state.almanac[f.id].caught);
}

function fullLog(state) {
  return FISH.every(f => state.almanac[f.id] && state.almanac[f.id].caught);
}

function questsDone(state) {
  const r = state.quests.richy.stage;
  const l = state.quests.luca.stage;
  return (r === 'complete' || r === 'thanked') && (l === 'complete' || l === 'thanked');
}

function allRegionsVisited(state) {
  return REGIONS.filter(r => !r.locked).every(r => state.regionsVisited[r.id]);
}

function maxRuneStack(state) {
  let max = 0;
  for (const rodId in state.rod.socketed || {}) {
    max = Math.max(max, (state.rod.socketed[rodId] || []).length);
  }
  return max;
}

// Any fish whose `weatherOnly` (data/fish.js) requires a storm specifically
// — not just rain — to ever bite at all.
function hasCaughtStormFish(state) {
  return FISH.some(f => f.weatherOnly && f.weatherOnly.includes('storm') && f.weatherOnly.length === 1
    && state.almanac[f.id] && state.almanac[f.id].caught);
}

export const ACHIEVEMENTS = [
  { id: 'first_catch', name: 'First Catch', desc: 'Land your very first fish.', gold: 20, exp: 15, check: (s) => totalCatches(s) >= 1 },
  { id: 'first_rare', name: 'Something Rare', desc: 'Land a Rare-tier fish.', gold: 15, exp: 10, check: (s) => hasRarity(s, 'rare') },
  { id: 'first_legendary', name: 'The Stuff of Legend', desc: 'Land a Legendary-tier fish.', gold: 25, exp: 20, check: (s) => hasRarity(s, 'legendary') },
  { id: 'first_mythic', name: 'Myth Made Real', desc: 'Land a Mythic-tier fish.', gold: 40, exp: 35, check: (s) => hasRarity(s, 'mythic') },
  { id: 'first_gargantuan', name: 'Bigger Boat Needed', desc: 'Land a Gargantuan-tier fish.', gold: 60, exp: 50, check: (s) => hasRarity(s, 'gargantuan') },
  { id: 'first_extinct', name: 'Back From Extinction', desc: 'Land an Extinct-tier fish.', gold: 80, exp: 70, check: (s) => hasRarity(s, 'extinct') },
  { id: 'first_abyssal', name: 'Deep Dive', desc: 'Land an Abyssal-tier fish.', gold: 120, exp: 100, check: (s) => hasRarity(s, 'abyssal') },
  { id: 'first_secret', name: '???', desc: 'Land a Secret-tier fish.', gold: 200, exp: 150, check: (s) => hasRarity(s, 'secret') },
  { id: 'century_catch', name: 'Seasoned Angler', desc: 'Land 100 fish, all told.', gold: 150, exp: 120, check: (s) => totalCatches(s) >= 100, progress: (s) => [totalCatches(s), 100] },
  { id: 'full_log', name: 'The Complete Log', desc: "Catalogue every species in the Captain's Log.", gold: 500, exp: 400, check: (s) => fullLog(s), progress: (s) => [FISH.filter(f => s.almanac[f.id] && s.almanac[f.id].caught).length, FISH.length] },
  { id: 'journeyman_rank', name: 'Journeyman', desc: 'Reach the Journeyman rank.', gold: 30, exp: 25, check: (s) => s.level >= 10, progress: (s) => [s.level, 10] },
  { id: 'master_rank', name: 'Master', desc: 'Reach the Master rank.', gold: 60, exp: 50, check: (s) => s.level >= 25, progress: (s) => [s.level, 25] },
  { id: 'captain_rank', name: "Captain's Rank", desc: "Reach the Captain's rank.", gold: 100, exp: 80, check: (s) => s.level >= 50, progress: (s) => [s.level, 50] },
  { id: 'admiral_rank', name: "Admiral's Rank", desc: "Reach the Admiral's rank.", gold: 200, exp: 150, check: (s) => s.level >= 80, progress: (s) => [s.level, 80] },
  { id: 'quest_master', name: 'Debts Repaid', desc: "Finish both Richy's and Luca's questlines.", gold: 150, exp: 120, check: (s) => questsDone(s) },

  // Finn's and B-LA-KA's own secret quests (data/shopDialogues.js) — same
  // "complete or thanked counts" shape as questsDone above.
  { id: 'finn_quest', name: 'Old Faithful', desc: "Finish Finn's secret quest.", gold: 150, exp: 120, check: (s) => s.quests.finn.stage === 'complete' || s.quests.finn.stage === 'thanked' },
  { id: 'barnaby_quest', name: "Weighed True", desc: "Finish B-LA-KA's secret quest.", gold: 150, exp: 120, check: (s) => s.quests.barnaby.stage === 'complete' || s.quests.barnaby.stage === 'thanked' },
  { id: 'streak_10', name: 'On a Roll', desc: 'Reach a 10-catch streak.', gold: 40, exp: 30, check: (s) => s.streak.best >= 10, progress: (s) => [s.streak.best, 10] },
  { id: 'gold_hoarder', name: 'Gold Hoarder', desc: 'Hold 1,000 gold at once.', gold: 0, exp: 80, check: (s) => s.coins >= 1000, progress: (s) => [s.coins, 1000] },

  // A Shiny (data/mutations.js) is a second, independent axis of luck on
  // top of the normal rarity roll — its own pair of milestones, distinct
  // from the rarity-tier ones above.
  { id: 'first_shiny', name: 'Shine On', desc: 'Land your first Shiny fish.', gold: 50, exp: 40, check: (s) => s.shinyCaughtCount >= 1 },
  { id: 'shiny_hunter', name: 'Shiny Hunter', desc: 'Land 10 Shiny fish.', gold: 250, exp: 200, check: (s) => s.shinyCaughtCount >= 10, progress: (s) => [s.shinyCaughtCount, 10] },

  // Giant (data/mutations.js) is Shiny's independent, size-first
  // counterpart — its own pair of milestones, same shape as Shiny's above.
  { id: 'first_giant', name: 'Go Big', desc: 'Land your first Giant fish.', gold: 50, exp: 40, check: (s) => (s.giantCaughtCount || 0) >= 1 },
  { id: 'giant_hunter', name: 'Giant Hunter', desc: 'Land 10 Giant fish.', gold: 250, exp: 200, check: (s) => (s.giantCaughtCount || 0) >= 10, progress: (s) => [s.giantCaughtCount || 0, 10] },
  { id: 'world_traveler', name: 'World Traveler', desc: 'Visit every charted region at least once.', gold: 80, exp: 60, check: (s) => allRegionsVisited(s) },
  { id: 'rod_collector', name: 'Rod Collector', desc: 'Own 5 different rods.', gold: 60, exp: 50, check: (s) => s.rod.owned.length >= 5, progress: (s) => [s.rod.owned.length, 5] },
  { id: 'rune_master', name: 'Rune Master', desc: 'Socket 3 runes onto a single rod at once.', gold: 100, exp: 80, check: (s) => maxRuneStack(s) >= 3, progress: (s) => [maxRuneStack(s), 3] },
  { id: 'bag_maxed', name: 'Every Last Pocket', desc: 'Upgrade your bag to its maximum capacity.', gold: 100, exp: 80, check: (s) => s.bag.capacityTier >= BAG.upgrades.length - 1, progress: (s) => [s.bag.capacityTier, BAG.upgrades.length - 1] },
  { id: 'max_level', name: 'Top of the Ladder', desc: `Reach the maximum level (${MAX_LEVEL}).`, gold: 500, exp: 0, check: (s) => s.level >= MAX_LEVEL, progress: (s) => [s.level, MAX_LEVEL] },
  { id: 'streak_25', name: 'Unstoppable', desc: 'Reach a 25-catch streak.', gold: 100, exp: 80, check: (s) => s.streak.best >= 25, progress: (s) => [s.streak.best, 25] },

  // Sea Chests and weather-exclusive fish (data/seaChest.js, data/fish.js's
  // weatherOnly) are both new reasons to actually be out fishing when the
  // sky turns — their own milestones, distinct from the rarity/rank ones.
  { id: 'treasure_hunter', name: 'Treasure Hunter', desc: 'Reel in 5 Sea Chests.', gold: 150, exp: 100, check: (s) => s.seaChestsOpened >= 5, progress: (s) => [s.seaChestsOpened, 5] },
  { id: 'storm_chaser', name: 'Storm Chaser', desc: 'Land a fish that only bites in a storm.', gold: 120, exp: 100, check: (s) => hasCaughtStormFish(s) },
  { id: 'ice_breaker', name: 'Ice Breaker', desc: 'Chart a course to the Frozen Reach.', gold: 100, exp: 80, check: (s) => !!s.regionsVisited.frozenReach },
  { id: 'night_owl', name: 'Night Owl', desc: 'Land 10 fish during the dead of night.', gold: 150, exp: 120, check: (s) => (s.nightCatchCount || 0) >= 10, progress: (s) => [s.nightCatchCount || 0, 10] },

  // Prestige (data/prestige.js) — a permanent, one-time milestone for
  // going back to Level 1 on purpose for the first time.
  { id: 'first_prestige', name: 'Ascended', desc: 'Prestige for the first time.', gold: 500, exp: 0, check: (s) => (s.prestigeLevel || 0) >= 1 },

  // Naia (data/naiaDialogue.js) and her one exclusive catch — same
  // "find the NPC, then find what only their gear unlocks" shape as
  // ice_breaker/night_owl above, just two milestones instead of one.
  { id: 'abyss_warden', name: 'Voice of the Deep', desc: 'Find Naia in the Abyssal Lands.', gold: 100, exp: 80, check: (s) => (s.npc.naia && s.npc.naia.talkCount) > 0 },
  { id: 'the_unblinking', name: 'It Noticed You Too', desc: 'Land The Unblinking.', gold: 400, exp: 0, check: (s) => s.almanac.theUnblinking && s.almanac.theUnblinking.caught },

  // Both Forge Enchant slots (data/enchants.js) filled on the same rod —
  // only reachable once that specific rod is mastered, so this is really a
  // Rod Mastery milestone wearing a Forge Enchant name.
  { id: 'fully_enchanted', name: 'Fully Enchanted', desc: 'Fill both Enchant slots on a mastered rod.', gold: 200, exp: 150, check: (s) => Object.values(s.rod.enchanted || {}).some(list => Array.isArray(list) && list.length >= 2) },

  // Perfect Reel Streak (data/cleanStreak.js) — best-ever, not the live
  // count, so this stays earned even after the streak itself breaks.
  { id: 'steady_hands', name: 'Steady Hands', desc: 'Reach a 15-reel Perfect Reel Streak.', gold: 150, exp: 120, check: (s) => (s.cleanStreak && s.cleanStreak.best) >= 15, progress: (s) => [(s.cleanStreak && s.cleanStreak.best) || 0, 15] },

  // Charted Waters (data/regionMilestones.js) — any one region maxed out,
  // same "any one of them" shape as fully_enchanted above.
  { id: 'local_legend', name: 'Local Legend', desc: 'Max out Charted Waters for any one region.', gold: 200, exp: 150, check: (s) => Object.values(s.regionCatchCounts || {}).some(c => c >= REGION_MILESTONES[REGION_MILESTONES.length - 1].count) },

  // Buried Treasure (data/treasureMap.js) — the reward itself already fires
  // the moment the map completes (fishing/fishingMachine.js's
  // resolveBottleCatch); this is purely the trophy for it.
  { id: 'buried_treasure', name: 'X Marks the Spot', desc: 'Piece together the full treasure map from bottled messages.', gold: 0, exp: 0, check: (s) => (s.mapFragments || 0) >= MAP_FRAGMENTS_NEEDED, progress: (s) => [s.mapFragments || 0, MAP_FRAGMENTS_NEEDED] },

  // Smokehouse (data/smokehouse.js) — a running counter of cured fish
  // collected, same "cheap running counter" shape as everything else here.
  { id: 'smokehouse_regular', name: 'Low and Slow', desc: 'Collect 15 cured fish from the Smokehouse.', gold: 200, exp: 100, check: (s) => (s.smokedCount || 0) >= 15, progress: (s) => [s.smokedCount || 0, 15] },
  // Morris's rapport system (data/morris.js) — Old Salt is the top tier,
  // unlocked at 15 conversations (ui/dialogue.js increments talkCount once
  // per exchange).
  { id: 'morris_old_salt', name: 'Old Salt', desc: "Earn Morris's full trust.", gold: 200, exp: 120, check: (s) => (s.npc.morris.talkCount || 0) >= 15, progress: (s) => [Math.min(s.npc.morris.talkCount || 0, 15), 15] },

  // Today's Quarry (data/quarry.js) — a running counter of daily bonuses
  // claimed, same shape as smokehouse_regular just above.
  { id: 'quarry_hunter', name: 'Marked Prey', desc: "Claim Today's Quarry bonus 20 times.", gold: 200, exp: 120, check: (s) => (s.quarryClaimCount || 0) >= 20, progress: (s) => [s.quarryClaimCount || 0, 20] },

  // Crab Traps (data/traps.js) — a running counter of traps collected,
  // same "cheap running counter" shape as smokehouse_regular/quarry_hunter.
  { id: 'trap_line', name: 'Set It and Forget It', desc: 'Collect 15 Crab Traps.', gold: 200, exp: 120, check: (s) => (s.trapsCollected || 0) >= 15, progress: (s) => [s.trapsCollected || 0, 15] },

  // One achievement per Fish Collection Set (data/fishSets.js), generated
  // rather than hand-written so a new set (or a new fish added to an
  // existing shape) is automatically covered without a second edit here.
  ...FISH_SETS.map(set => ({
    id: `set_${set.id}`,
    name: `Collector: ${set.name}`,
    desc: `Catch every fish in ${set.name}.`,
    gold: 150,
    exp: 120,
    check: (s) => isSetComplete(s, set),
  })),
];
