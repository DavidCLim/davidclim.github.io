import { WORLD_W, WORLD_H, BAG } from './constants.js';
import { FISH } from '../data/fish.js';
import { RODS } from '../data/rods.js';
import { runeById } from '../data/runes.js';
import { enchantById } from '../data/enchants.js';
import { UNLIMITED_BAIT_QTY } from '../data/bait.js';
import { rankForLevel } from '../data/ranks.js';
import { rodMasteryBonus } from '../data/rodMastery.js';
import { rodReinforcementBonus } from '../data/rodForge.js';
import { rollWeatherDuration, WEATHER_TYPES } from '../data/weather.js';
import { hookById } from '../data/hooks.js';
import { lineById } from '../data/fishingLine.js';
import { potionById } from '../data/potions.js';
import { swivelById } from '../data/swivels.js';
import { scaleById } from '../data/scales.js';
import { FISH_SETS, isSetComplete } from '../data/fishSets.js';
import { prestigeBonus } from '../data/prestige.js';
import { streakBonus } from '../data/streakMilestones.js';
import { regionMasteryBonus } from '../data/regionMilestones.js';

// The single central mutable game-state object. Every system reads/writes
// through this — no scattered globals. Systems receive `state` explicitly.
export function createInitialState(avatar, name) {
  const almanac = {};
  for (const f of FISH) {
    almanac[f.id] = { caught: false, count: 0, biggestSize: 0, shinyCaught: false, giantCaught: false };
  }

  return {
    coins: 20,

    // Everyone starts at level 1 — EXP comes from landing fish (higher
    // rarity pays more) and finishing quests (see economy.js's addExp,
    // wired in from fishing/fishingMachine.js and the quest-completion
    // handlers). `rankForLevel` (data/ranks.js) turns the raw number into
    // a naval-career label for display; nothing gates on rank itself.
    level: 1,
    exp: 0,

    // Prestige count (data/prestige.js) — how many times you've traded
    // Level MAX back down to Level 1 for a permanent stat bonus. 0 means
    // never prestiged; only reachable once state.level hits MAX_LEVEL.
    prestigeLevel: 0,

    player: {
      x: 480, y: 420,
      vx: 0, vy: 0,
      facing: 'down',
      moving: false,
      animTime: 0,
      // Both chosen once at save-slot creation (see ui/avatarCustomizer.js)
      // and persisted with the save from then on — avatar null means "use
      // the default look" (see render/playerAppearance.js's
      // resolveAppearance); name falls back to "Angler" for old saves.
      avatar: avatar || null,
      name: name || 'Angler',
    },

    // `socketed` maps a rodId to an array of the rune ids socketed on it
    // (see Grizelda's shop, ui/witchShopPanel.js) — each rod carries its own
    // independent set of slots, and how many it can hold depends on its
    // rank (data/rods.js's rodRuneSlots). `enchanted` maps a rodId to at
    // most one enchant id (data/enchants.js, Garrick's Forge) — a single
    // slot, separate from the rune sockets above.
    rod: { owned: ['twig'], equipped: 'twig', socketed: {}, enchanted: {} },
    bait: { owned: { none: UNLIMITED_BAIT_QTY }, equipped: 'none' },

    // Hook and Line: two more equip slots alongside the rod (data/hooks.js,
    // data/fishingLine.js) — bought from Finn's Rod Shop, equipped from the
    // Satchel, same ownership/equip shape as `rod` minus the rune sockets.
    hook: { owned: ['basicHook'], equipped: 'basicHook' },
    line: { owned: ['basicLine'], equipped: 'basicLine' },
    swivel: { owned: ['basicSwivel'], equipped: 'basicSwivel' },
    scale: { owned: ['basicScale'], equipped: 'basicScale' },

    // Active Brew (data/potions.js) — a consumable, time-limited buff from
    // Grizelda. `id: null` means nothing is active; `timeLeft` counts down
    // in real seconds while playing (main.js's frame loop).
    activePotion: { id: null, timeLeft: 0 },

    // Player-facing settings, toggled from the Help panel. `reduceEffects`
    // suppresses the screen flash and shrinks particle bursts (main.js) for
    // anyone sensitive to flashing/motion, without touching anything else.
    // `musicOn`/`sfxOn` gate audio/audioEngine.js's background loop and SFX.
    settings: { reduceEffects: false, musicOn: true, sfxOn: true },

    bag: { capacityTier: 0, items: [] },

    // `owned` maps a runeId to how many uncrafted-onto-anything copies you're
    // carrying — crafting a rune adds one here; socketing consumes one;
    // removing a socketed rune returns one (see economy/economy.js).
    runes: { owned: {} },

    almanac,

    streak: { current: 0, best: 0 },

    // Perfect Reel Streak (data/cleanStreak.js) — a separate axis from the
    // catch streak above: this one only grows while every reel stays clean
    // (tension never spikes past the "clean" threshold — same flag the
    // Trading Post's size bonus already uses), and resets the moment one
    // isn't, even if the fish still gets landed. Rewards careful reeling,
    // not just landing fish back-to-back.
    cleanStreak: { current: 0, best: 0 },

    // Charted Waters (data/regionMilestones.js) — maps a regionId to how
    // many real fish (not chests/scraps/bottles) have been landed there,
    // all time. Crossing a milestone grants a small permanent luck bonus
    // that only applies while actually fishing in that region.
    regionCatchCounts: {},

    personalBests: {
      biggestOverall: null, // { fishId, size }
      rarestCaughtRank: -1,
      rarestCaughtId: null,
    },

    achievements: {},

    // Wearable title (data/titles.js) shown next to the player's name in
    // the Profile panel — 'none' has no achievement requirement, so a
    // fresh save always has a valid, always-unlocked title equipped.
    title: 'none',

    // Total Shiny catches, all time (data/mutations.js) — kept as its own
    // running counter rather than derived from the bag, since sold/released
    // shiny catches would otherwise be forgotten.
    shinyCaughtCount: 0,

    // Total Giant catches, all time (data/mutations.js) — same running-
    // counter shape as shinyCaughtCount, its independent counterpart.
    giantCaughtCount: 0,

    // Total Sea Chests reeled in, all time (data/seaChest.js) — used for
    // the Treasure Hunter achievement (data/achievements.js).
    seaChestsOpened: 0,

    // Total fish landed during deep night (data/dayNight.js's isDeepNight),
    // all time — used for the Night Owl achievement (data/achievements.js).
    nightCatchCount: 0,

    // Which regions have ever been arrived at (world/travel.js marks this on
    // every arrival) — the Docks count from the start since you begin there
    // without ever "traveling" to it. Used for the World Traveler
    // achievement (data/achievements.js).
    regionsVisited: { dock: true },

    // Per-rod XP/level (data/rodMastery.js) — maps a rodId to { level, xp }.
    // Only ever populated for rods you've actually fished with; a rod with
    // no entry here just reads as level 0 (rodMasteryBonus/-Progress both
    // treat a missing entry that way).
    rodMastery: {},

    // Richy's secret quest: buying a Harpoon Chunk flips him from 'locked'
    // to 'available'; accepting it (see economy/economy.js's
    // acceptRichyQuest) moves him to 'active', which starts counting
    // Legendary-or-better catches (fishing/fishingMachine.js's
    // resolveCatch) toward `goal`. Hitting it sets Richy's Special to
    // Infinity uses and flips to 'complete' — that bait is never sold,
    // only ever earned this way, and asking Richy about it before then
    // gets you a progress report, not the bait.
    quests: {
      richy: { stage: 'locked', progress: 0, goal: 5 },
      // Luca (data/lucaDialogue.js) only appears in the Abyssal Lands — his
      // cure needs `goal` Mythic-or-better fish landed while actually
      // standing there and the quest active (fishing/fishingMachine.js's
      // resolveCatch), then a trip to Grizelda to carve the Cleansing Rune
      // (economy.js's craftCleansingRune) before you can turn it in on him.
      // Kept short (2, and Mythic+ rather than Abyssal-only) — this is a
      // story beat, not a grind.
      luca: { stage: 'available', progress: 0, goal: 2 },

      // Finn's secret quest (data/shopDialogues.js) — same automatic-
      // completion shape as Richy's own quest above, just gated by owning
      // the Leviathan's Cutlass Rod (economy.js's buyRod) instead of a bait
      // purchase, and asking for Gargantuan-or-better catches instead of
      // Legendary-or-better.
      finn: { stage: 'locked', progress: 0, goal: 4 },

      // B-LA-KA's secret quest — gated by owning the Abyssal Ledger scale
      // (economy.js's buyScale) rather than a purchase up front, and counts
      // Sea Chests opened (fishing/fishingMachine.js's resolveChestCatch)
      // instead of catches at all.
      barnaby: { stage: 'locked', progress: 0, goal: 5 },
    },

    // Loose rod parts, dragged up instead of a fish via a small passive
    // chance on every bite (data/rodParts.js's ROD_SCRAP_CHANCE). Bring
    // them to the Blacksmith to assemble a rod, reinforce one, or melt them
    // for a little gold (economy.js).
    salvage: { items: [] },

    // Daily Bounty board (data/bounties.js) — `day: null` guarantees the
    // very first ensureDailyBounties(state) call (main.js, right after
    // load) sees a mismatch and rolls a real board; a fresh save never
    // starts with an empty list.
    bounties: { day: null, list: [] },

    // Weekly Challenge board (data/weeklyChallenges.js) — same shape as
    // Daily Bounties, just keyed by week instead of day.
    weeklyChallenges: { week: null, list: [] },

    // Daily login streak (data/dailyLogin.js) — `lastDay: null` guarantees
    // the very first checkDailyLogin(state) call (main.js, right after
    // load) always grants day 1's reward.
    dailyLogin: { lastDay: null, streak: 0 },

    // Buried Treasure (data/treasureMap.js) — how many map fragments have
    // turned up in a Message in a Bottle so far, all time. Caps at
    // MAP_FRAGMENTS_NEEDED; the payoff fires once, the moment it's reached
    // (fishing/fishingMachine.js's resolveBottleCatch).
    mapFragments: 0,

    // Today's Hot Catch (data/hotCatch.js) — one random species the
    // Trading Post pays a bonus on today. `day: null` guarantees the first
    // ensureHotCatch(state) call (main.js, right after load) always rolls a
    // real one instead of leaving the board empty.
    hotCatch: { day: null, fishId: null },

    // Smokehouse (data/smokehouse.js) — up to SMOKEHOUSE_SLOTS fish curing
    // at once, each holding its full bag-item shape plus a real-world
    // `readyAt` timestamp (economy.js's smokeFish/collectSmokedFish). A
    // slower, real-time alternative to selling on the spot.
    smokehouse: { slots: [] },

    // Total fish collected out of the Smokehouse, all time — used for the
    // smokehouse_regular achievement (data/achievements.js).
    smokedCount: 0,

    // Crab Traps (data/traps.js) — `owned` maps a trapId to how many
    // unset copies are in your satchel; `slots` holds up to TRAP_SLOTS
    // entries of { trapId, readyAt }, same real-world-timestamp shape as
    // the Smokehouse's slots above. `trapsCollected` is an all-time counter
    // for the trapper achievement (data/achievements.js).
    traps: { owned: {}, slots: [] },
    trapsCollected: 0,

    // Today's Quarry (data/quarry.js) — one named species the board is
    // asking for today. `day: null` guarantees the first ensureQuarry(state)
    // call (main.js, right after load) always rolls a real one.
    quarry: { day: null, fishId: null, claimed: false },

    // Total Quarry bonuses claimed, all time — used for the quarry_hunter
    // achievement (data/achievements.js).
    quarryClaimCount: 0,

    // Local-date key of the last day a real fish (not a chest/bottle/scrap)
    // got the First Catch of the Day value-doubling bonus (fishing/
    // fishingMachine.js's resolveCatch) — `null` means today's hasn't been
    // claimed yet.
    firstCatchDay: null,

    // Per-rod reinforcement count (data/rodForge.js) — how many times
    // you've paid the Blacksmith to permanently strengthen a given rod,
    // capped per rod. Maps a rodId to a count.
    rodReinforcements: {},

    // Gear Loadout Presets (economy.js's saveLoadout/equipLoadout) — each
    // entry is a named snapshot of every equip slot at once.
    loadouts: [],

    currentRegion: 'dock',
    npc: { morris: { talkCount: 0 }, luca: { talkCount: 0 }, naia: { talkCount: 0 } },

    // --- Transient (not persisted) ---
    // Cycles on its own timer (world/weather.js, ticked once per frame from
    // main.js) — starts Clear with a normal-length first stretch rather
    // than persisting across sessions, so a save always opens under calm
    // skies.
    weather: { type: WEATHER_TYPES.clear.id, timer: rollWeatherDuration(WEATHER_TYPES.clear) },
    // Day/Night cycle (world/dayNight.js) — starts at 0.2 (mid-morning,
    // just past dawn) rather than 0 or a random point, so a fresh session
    // always opens in good light like weather does with Clear skies.
    dayNight: { time: 0.2 },
    fishing: { state: 'idle' },
    ui: {
      activeOverlay: null, toast: null, toastTimer: 0, nearZone: null,
      dialogue: null, // { npcId, nodeId }
      mapOpen: false,
      travel: null, // { toRegionId, elapsed, duration }
    },
    input: {
      keys: Object.create(null),
      joystick: { active: false, dx: 0, dy: 0 },
      actionDown: false,
      actionPressedEdge: false,
      bossKeyDown: false,
      bossKeyPressedEdge: false,
      escapePressedEdge: false,
    },

    // --- Transient: the boss encounter (see fishing/bossFight.js) ---
    boss: { state: 'idle' },
    session: { lastSaveError: null },

    fx: {
      particles: [],
      ripples: [],
      screenFlash: 0,
      screenFlashX: null,
      screenFlashY: null,
      ambient: null, // lazily built by render/ambientLife.js
      time: 0,
    },
  };
}

export function bagCapacity(state) {
  const tier = BAG.upgrades[Math.min(state.bag.capacityTier, BAG.upgrades.length - 1)];
  return tier.capacity;
}

export function equippedRod(state) {
  return RODS.find(r => r.id === state.rod.equipped) || RODS[0];
}

// The equipped rod's base stats plus every rune socketed on it (a rod can
// hold more than one — see data/rods.js's rodRuneSlots) — this is what
// gameplay (rollFish.js, fishingMachine.js) should read instead of
// equippedRod() directly, so socketed runes' buffs actually stack and take
// effect. Copies the base rod (never mutates the shared RODS entry) and
// adds valueMul/sizeMul/snapGuard as 0 by default since only runes grant
// those, not rods themselves.
export function effectiveRodStats(state) {
  const base = equippedRod(state);
  const eff = { ...base, valueMul: 0, sizeMul: 0, snapGuard: 0 };
  const runeIds = (state.rod.socketed && state.rod.socketed[state.rod.equipped]) || [];
  for (const runeId of runeIds) {
    const rune = runeById(runeId);
    if (!rune) continue;
    for (const key in rune.effect) {
      eff[key] = (eff[key] || 0) + rune.effect[key];
    }
  }
  // Your rank's own passive buff (data/ranks.js) stacks on top of the rod
  // and its runes — a Deckhand's steadier grip is worth having even on the
  // starter twig rod, and it only gets better as you climb.
  const rankBuff = rankForLevel(state.level).buff || {};
  for (const key in rankBuff) {
    eff[key] = (eff[key] || 0) + rankBuff[key];
  }
  // Rod Mastery (data/rodMastery.js) — a small bonus earned by fishing with
  // this specific rod, stacking on everything else above. Applied evenly
  // across every stat a rune could grant, so a mastered starter rod stays
  // meaningfully behind a mastered top-tier one, not equal to it.
  const mastery = rodMasteryBonus(state, state.rod.equipped);
  if (mastery > 0) {
    eff.luck = (eff.luck || 0) + mastery;
    eff.control = (eff.control || 0) + mastery;
    eff.biteSpeed = (eff.biteSpeed || 0) + mastery;
    eff.valueMul = (eff.valueMul || 0) + mastery;
  }
  // Rod Reinforcement (data/rodForge.js) — a smaller, Blacksmith-bought
  // top-up on the same stats, stacking on mastery/runes/rank rather than
  // replacing any of them.
  const reinforcement = rodReinforcementBonus(state, state.rod.equipped);
  if (reinforcement > 0) {
    eff.luck = (eff.luck || 0) + reinforcement;
    eff.control = (eff.control || 0) + reinforcement;
    eff.biteSpeed = (eff.biteSpeed || 0) + reinforcement;
  }
  // Hook and Line (data/hooks.js, data/fishingLine.js) — the other two gear
  // slots, stacking the same flat-add-per-stat way a rune does rather than
  // multiplying anything, so a cheap hook/line upgrade is always worth
  // buying regardless of what rod it ends up paired with.
  const hook = hookById(state.hook.equipped);
  for (const key of ['snapGuard', 'control']) {
    if (hook[key]) eff[key] = (eff[key] || 0) + hook[key];
  }
  const line = lineById(state.line.equipped);
  for (const key of ['biteSpeed', 'control']) {
    if (line[key]) eff[key] = (eff[key] || 0) + line[key];
  }
  const swivel = swivelById(state.swivel.equipped);
  for (const key of ['luck', 'biteSpeed']) {
    if (swivel[key]) eff[key] = (eff[key] || 0) + swivel[key];
  }
  const scale = scaleById(state.scale.equipped);
  for (const key of ['valueMul', 'luck']) {
    if (scale[key]) eff[key] = (eff[key] || 0) + scale[key];
  }
  // Active Brew (data/potions.js) — a temporary buff on top of everything
  // above, only while state.activePotion.timeLeft is still counting down.
  if (state.activePotion.id && state.activePotion.timeLeft > 0) {
    const potion = potionById(state.activePotion.id);
    if (potion) {
      for (const key in potion.effect) {
        eff[key] = (eff[key] || 0) + potion.effect[key];
      }
    }
  }
  // Fish Collection Sets (data/fishSets.js) — a permanent bonus per
  // completed set, stacking with everything else above. Recomputed live
  // from the almanac every call rather than cached, so a catch that
  // completes a set takes effect immediately.
  for (const set of FISH_SETS) {
    if (!isSetComplete(state, set)) continue;
    for (const key in set.bonus) {
      eff[key] = (eff[key] || 0) + set.bonus[key];
    }
  }
  // Prestige (data/prestige.js) — a small permanent bonus per prestige
  // level, on top of everything else, since trading Level 80 back down to
  // Level 1 on purpose needs to actually feel worth it.
  const prestige = prestigeBonus(state);
  for (const key in prestige) {
    eff[key] = (eff[key] || 0) + prestige[key];
  }
  // Streak Milestone Buffs (data/streakMilestones.js) — a temporary bonus
  // tied directly to the current live streak, gone the instant it breaks.
  const streak = streakBonus(state.streak.current);
  for (const key in streak) {
    eff[key] = (eff[key] || 0) + streak[key];
  }
  // Charted Waters (data/regionMilestones.js) — a small luck bonus earned
  // by fishing this specific region enough times, only in effect while
  // state.currentRegion actually matches it.
  eff.luck = (eff.luck || 0) + regionMasteryBonus(state, state.currentRegion);
  // Forge Enchant (data/enchants.js) — unlike everything above, this isn't
  // a flat stat add. It moves rolls that are otherwise fixed no matter what
  // you're wearing (mutation odds, treasure odds, EXP, hookset difficulty),
  // so it's carried as its own multiplier/flag fields rather than folded
  // into luck/control/etc. Up to enchantSlotsForRod(state, rodId) can be
  // active at once (data/rodMastery.js's max level unlocks a 2nd) — each
  // multiplier field's *bonus* (mult - 1) stacks additively across active
  // enchants, so two different +100%-class enchants add up to +200% rather
  // than compounding to +300%. Defaults keep every caller's math a no-op
  // when nothing is enchanted.
  const enchantIds = (state.rod.enchanted && state.rod.enchanted[state.rod.equipped]) || [];
  let mutationMult = 1, treasureMult = 1, expMult = 1, autoHookset = false;
  for (const id of enchantIds) {
    const enchant = enchantById(id);
    if (!enchant) continue;
    if (enchant.mutationMult) mutationMult += enchant.mutationMult - 1;
    if (enchant.treasureMult) treasureMult += enchant.treasureMult - 1;
    if (enchant.expMult) expMult += enchant.expMult - 1;
    if (enchant.autoHookset) autoHookset = true;
  }
  eff.mutationMult = mutationMult;
  eff.treasureMult = treasureMult;
  eff.expMult = expMult;
  eff.autoHookset = autoHookset;
  return eff;
}

export function playerName(state) {
  return (state.player && state.player.name) || 'Angler';
}
