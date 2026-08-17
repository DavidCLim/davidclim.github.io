import { SAVE_SLOTS, SAVE_KEY_PREFIX, SAVE_VERSION } from './constants.js';
import { createInitialState } from './gameState.js';
import { FISH } from '../data/fish.js';
import { MAX_LEVEL } from '../data/ranks.js';
import { TITLES } from '../data/titles.js';

function slotKey(index) {
  return `${SAVE_KEY_PREFIX}${index}`;
}

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

// Persist only the durable subset of state — transient UI/input/fishing
// state never touches localStorage. `avatar` and `name` are the one-time
// choices made at slot creation (see ui/avatarCustomizer.js) and travel
// with the save from then on.
function toSaveBlob(state) {
  return {
    version: SAVE_VERSION,
    updatedAt: Date.now(),
    avatar: state.player.avatar || null,
    name: state.player.name || 'Angler',
    coins: state.coins,
    level: state.level,
    exp: state.exp,
    prestigeLevel: state.prestigeLevel,
    player: { x: state.player.x, y: state.player.y },
    rod: state.rod,
    hook: state.hook,
    line: state.line,
    swivel: state.swivel,
    scale: state.scale,
    activePotion: state.activePotion,
    settings: state.settings,
    bait: state.bait,
    bag: state.bag,
    runes: state.runes,
    almanac: state.almanac,
    streak: { best: state.streak.best, current: 0 },
    cleanStreak: { best: state.cleanStreak.best, current: 0 },
    regionCatchCounts: state.regionCatchCounts,
    personalBests: state.personalBests,
    achievements: state.achievements,
    title: state.title,
    shinyCaughtCount: state.shinyCaughtCount,
    giantCaughtCount: state.giantCaughtCount,
    seaChestsOpened: state.seaChestsOpened,
    nightCatchCount: state.nightCatchCount,
    regionsVisited: state.regionsVisited,
    rodMastery: state.rodMastery,
    rodReinforcements: state.rodReinforcements,
    loadouts: state.loadouts,
    currentRegion: state.currentRegion,
    npc: state.npc,
    quests: state.quests,
    salvage: state.salvage,
    bounties: state.bounties,
    weeklyChallenges: state.weeklyChallenges,
    dailyLogin: state.dailyLogin,
    firstCatchDay: state.firstCatchDay,
    mapFragments: state.mapFragments,
    hotCatch: state.hotCatch,
    smokehouse: state.smokehouse,
    smokedCount: state.smokedCount,
    quarry: state.quarry,
    quarryClaimCount: state.quarryClaimCount,
    traps: state.traps,
    trapsCollected: state.trapsCollected,
  };
}

function readSlotRaw(index) {
  try {
    const raw = localStorage.getItem(slotKey(index));
    if (!raw) return null;
    const blob = JSON.parse(raw);
    if (!isPlainObject(blob) || typeof blob.version !== 'number') return null;
    return blob;
  } catch {
    return null;
  }
}

// Lightweight summary for each of the 5 slots — enough for the slot-picker
// screen (avatar preview, coins, region, last played) without reconstructing
// full game state. `null` means the slot is empty.
export function listSaveSlots() {
  const slots = [];
  for (let i = 0; i < SAVE_SLOTS; i++) {
    const blob = readSlotRaw(i);
    if (!blob) {
      slots.push(null);
      continue;
    }
    slots.push({
      avatar: isPlainObject(blob.avatar) ? blob.avatar : null,
      name: typeof blob.name === 'string' && blob.name ? blob.name : 'Angler',
      coins: typeof blob.coins === 'number' ? blob.coins : 0,
      level: typeof blob.level === 'number' && blob.level >= 1 ? Math.round(blob.level) : 1,
      currentRegion: typeof blob.currentRegion === 'string' ? blob.currentRegion : 'dock',
      updatedAt: typeof blob.updatedAt === 'number' ? blob.updatedAt : null,
    });
  }
  return slots;
}

// Merge a loaded blob onto a fresh initial state, tolerating missing/extra
// fields so future save-shape changes don't hard-crash old saves.
function mergeBlobOntoFresh(blob) {
  const avatar = isPlainObject(blob.avatar) ? blob.avatar : null;
  const name = typeof blob.name === 'string' && blob.name ? blob.name : null;
  const fresh = createInitialState(avatar, name);
  try {
    if (typeof blob.coins === 'number' && isFinite(blob.coins)) fresh.coins = blob.coins;

    if (typeof blob.level === 'number' && isFinite(blob.level)) {
      fresh.level = Math.max(1, Math.min(MAX_LEVEL, Math.round(blob.level)));
    }
    if (typeof blob.exp === 'number' && isFinite(blob.exp) && blob.exp >= 0) fresh.exp = blob.exp;
    if (typeof blob.prestigeLevel === 'number' && isFinite(blob.prestigeLevel) && blob.prestigeLevel >= 0) {
      fresh.prestigeLevel = Math.round(blob.prestigeLevel);
    }

    if (isPlainObject(blob.player)) {
      if (typeof blob.player.x === 'number') fresh.player.x = blob.player.x;
      if (typeof blob.player.y === 'number') fresh.player.y = blob.player.y;
    }

    if (isPlainObject(blob.rod) && Array.isArray(blob.rod.owned) && typeof blob.rod.equipped === 'string') {
      // `socketed` used to map a rodId to a single runeId string before
      // rods could hold more than one rune — wrap old string values in an
      // array so old saves keep their socketed rune instead of losing it.
      const socketed = {};
      if (isPlainObject(blob.rod.socketed)) {
        for (const rodId in blob.rod.socketed) {
          const v = blob.rod.socketed[rodId];
          if (Array.isArray(v)) socketed[rodId] = v.filter(id => typeof id === 'string');
          else if (typeof v === 'string') socketed[rodId] = [v];
        }
      }
      // `enchanted` (data/enchants.js) maps a rodId to an array of active
      // enchant ids (1 slot normally, 2 once that rod is mastered — see
      // enchantSlotsForRod). Didn't exist on older saves at all, and was a
      // single string per rodId before rods could hold more than one
      // enchant — default to {} and wrap old string values in an array,
      // same "upgrade the old shape in place" treatment socketed gets above,
      // since effectiveRodStats (gameState.js) indexes into it
      // unconditionally.
      const enchanted = {};
      if (isPlainObject(blob.rod.enchanted)) {
        for (const rodId in blob.rod.enchanted) {
          const v = blob.rod.enchanted[rodId];
          if (Array.isArray(v)) enchanted[rodId] = v.filter(id => typeof id === 'string');
          else if (typeof v === 'string') enchanted[rodId] = [v];
        }
      }
      fresh.rod = {
        owned: blob.rod.owned.slice(),
        equipped: blob.rod.equipped,
        socketed,
        enchanted,
      };
    }

    if (isPlainObject(blob.hook) && Array.isArray(blob.hook.owned) && typeof blob.hook.equipped === 'string') {
      fresh.hook = { owned: blob.hook.owned.filter(id => typeof id === 'string'), equipped: blob.hook.equipped };
    }

    if (isPlainObject(blob.line) && Array.isArray(blob.line.owned) && typeof blob.line.equipped === 'string') {
      fresh.line = { owned: blob.line.owned.filter(id => typeof id === 'string'), equipped: blob.line.equipped };
    }

    if (isPlainObject(blob.dailyLogin) && typeof blob.dailyLogin.streak === 'number') {
      fresh.dailyLogin = {
        lastDay: typeof blob.dailyLogin.lastDay === 'string' ? blob.dailyLogin.lastDay : null,
        streak: Math.max(0, Math.round(blob.dailyLogin.streak)),
      };
    }

    if (isPlainObject(blob.swivel) && Array.isArray(blob.swivel.owned) && typeof blob.swivel.equipped === 'string') {
      fresh.swivel = { owned: blob.swivel.owned.filter(id => typeof id === 'string'), equipped: blob.swivel.equipped };
    }

    if (isPlainObject(blob.scale) && Array.isArray(blob.scale.owned) && typeof blob.scale.equipped === 'string') {
      fresh.scale = { owned: blob.scale.owned.filter(id => typeof id === 'string'), equipped: blob.scale.equipped };
    }

    if (typeof blob.firstCatchDay === 'string') {
      fresh.firstCatchDay = blob.firstCatchDay;
    }

    if (isPlainObject(blob.settings)) {
      fresh.settings = {
        reduceEffects: !!blob.settings.reduceEffects,
        musicOn: blob.settings.musicOn !== false,
        sfxOn: blob.settings.sfxOn !== false,
      };
    }

    if (isPlainObject(blob.activePotion)) {
      fresh.activePotion = {
        id: typeof blob.activePotion.id === 'string' ? blob.activePotion.id : null,
        timeLeft: typeof blob.activePotion.timeLeft === 'number' && blob.activePotion.timeLeft > 0 ? blob.activePotion.timeLeft : 0,
      };
    }

    if (isPlainObject(blob.runes) && isPlainObject(blob.runes.owned)) {
      fresh.runes = { owned: { ...blob.runes.owned } };
    }

    if (isPlainObject(blob.bait) && isPlainObject(blob.bait.owned) && typeof blob.bait.equipped === 'string') {
      fresh.bait = { owned: { ...blob.bait.owned }, equipped: blob.bait.equipped };
    }

    if (isPlainObject(blob.bag) && typeof blob.bag.capacityTier === 'number' && Array.isArray(blob.bag.items)) {
      fresh.bag = { capacityTier: blob.bag.capacityTier, items: blob.bag.items.filter(isPlainObject) };
    }

    if (isPlainObject(blob.almanac)) {
      for (const f of FISH) {
        const entry = blob.almanac[f.id];
        if (isPlainObject(entry)) {
          fresh.almanac[f.id] = {
            caught: !!entry.caught,
            count: typeof entry.count === 'number' ? entry.count : 0,
            biggestSize: typeof entry.biggestSize === 'number' ? entry.biggestSize : 0,
            shinyCaught: !!entry.shinyCaught,
            giantCaught: !!entry.giantCaught,
          };
        }
      }
    }

    if (typeof blob.shinyCaughtCount === 'number') {
      fresh.shinyCaughtCount = blob.shinyCaughtCount;
    }

    if (typeof blob.giantCaughtCount === 'number') {
      fresh.giantCaughtCount = blob.giantCaughtCount;
    }

    if (typeof blob.seaChestsOpened === 'number') {
      fresh.seaChestsOpened = blob.seaChestsOpened;
    }

    if (typeof blob.nightCatchCount === 'number') {
      fresh.nightCatchCount = blob.nightCatchCount;
    }

    if (typeof blob.mapFragments === 'number' && blob.mapFragments >= 0) {
      fresh.mapFragments = Math.round(blob.mapFragments);
    }

    if (isPlainObject(blob.hotCatch) && typeof blob.hotCatch.fishId === 'string') {
      fresh.hotCatch = {
        day: typeof blob.hotCatch.day === 'string' ? blob.hotCatch.day : null,
        fishId: blob.hotCatch.fishId,
      };
    }

    if (isPlainObject(blob.smokehouse) && Array.isArray(blob.smokehouse.slots)) {
      fresh.smokehouse = {
        slots: blob.smokehouse.slots
          .filter(isPlainObject)
          .filter(s => typeof s.fishId === 'string' && typeof s.readyAt === 'number')
          .map(s => ({
            fishId: s.fishId,
            name: typeof s.name === 'string' ? s.name : 'Fish',
            rarity: typeof s.rarity === 'string' ? s.rarity : 'common',
            size: typeof s.size === 'number' ? s.size : 0,
            value: typeof s.value === 'number' ? s.value : 0,
            shiny: !!s.shiny,
            giant: !!s.giant,
            readyAt: s.readyAt,
          })),
      };
    }

    if (typeof blob.smokedCount === 'number' && blob.smokedCount >= 0) {
      fresh.smokedCount = Math.round(blob.smokedCount);
    }

    if (isPlainObject(blob.quarry) && typeof blob.quarry.fishId === 'string') {
      fresh.quarry = {
        day: typeof blob.quarry.day === 'string' ? blob.quarry.day : null,
        fishId: blob.quarry.fishId,
        claimed: !!blob.quarry.claimed,
      };
    }

    if (typeof blob.quarryClaimCount === 'number' && blob.quarryClaimCount >= 0) {
      fresh.quarryClaimCount = Math.round(blob.quarryClaimCount);
    }

    if (isPlainObject(blob.traps) && isPlainObject(blob.traps.owned) && Array.isArray(blob.traps.slots)) {
      fresh.traps = {
        owned: Object.fromEntries(
          Object.entries(blob.traps.owned).filter(([, count]) => typeof count === 'number' && count > 0)
        ),
        slots: blob.traps.slots
          .filter(isPlainObject)
          .filter(s => typeof s.trapId === 'string' && typeof s.readyAt === 'number')
          .map(s => ({ trapId: s.trapId, readyAt: s.readyAt })),
      };
    }

    if (typeof blob.trapsCollected === 'number' && blob.trapsCollected >= 0) {
      fresh.trapsCollected = Math.round(blob.trapsCollected);
    }

    if (isPlainObject(blob.regionsVisited)) {
      fresh.regionsVisited = { dock: true, ...blob.regionsVisited };
    }

    if (isPlainObject(blob.rodMastery)) {
      const mastery = {};
      for (const rodId in blob.rodMastery) {
        const entry = blob.rodMastery[rodId];
        if (isPlainObject(entry) && typeof entry.level === 'number' && typeof entry.xp === 'number') {
          mastery[rodId] = { level: Math.max(0, Math.round(entry.level)), xp: Math.max(0, entry.xp) };
        }
      }
      fresh.rodMastery = mastery;
    }

    if (isPlainObject(blob.rodReinforcements)) {
      const reinforcements = {};
      for (const rodId in blob.rodReinforcements) {
        const count = blob.rodReinforcements[rodId];
        if (typeof count === 'number' && count > 0) reinforcements[rodId] = Math.round(count);
      }
      fresh.rodReinforcements = reinforcements;
    }

    if (Array.isArray(blob.loadouts)) {
      fresh.loadouts = blob.loadouts
        .filter(isPlainObject)
        .filter(l => typeof l.rod === 'string')
        .map(l => ({
          name: typeof l.name === 'string' && l.name ? l.name : 'Loadout',
          rod: l.rod,
          hook: typeof l.hook === 'string' ? l.hook : 'basicHook',
          line: typeof l.line === 'string' ? l.line : 'basicLine',
          swivel: typeof l.swivel === 'string' ? l.swivel : 'basicSwivel',
          scale: typeof l.scale === 'string' ? l.scale : 'basicScale',
          bait: typeof l.bait === 'string' ? l.bait : 'none',
          title: typeof l.title === 'string' ? l.title : 'none',
        }));
    }

    if (isPlainObject(blob.streak) && typeof blob.streak.best === 'number') {
      fresh.streak.best = blob.streak.best;
    }

    if (isPlainObject(blob.cleanStreak) && typeof blob.cleanStreak.best === 'number') {
      fresh.cleanStreak.best = blob.cleanStreak.best;
    }

    if (isPlainObject(blob.regionCatchCounts)) {
      const counts = {};
      for (const regionId in blob.regionCatchCounts) {
        const count = blob.regionCatchCounts[regionId];
        if (typeof count === 'number' && count > 0) counts[regionId] = Math.round(count);
      }
      fresh.regionCatchCounts = counts;
    }

    if (isPlainObject(blob.personalBests)) {
      fresh.personalBests = {
        biggestOverall: isPlainObject(blob.personalBests.biggestOverall) ? blob.personalBests.biggestOverall : null,
        rarestCaughtRank: typeof blob.personalBests.rarestCaughtRank === 'number' ? blob.personalBests.rarestCaughtRank : -1,
        rarestCaughtId: blob.personalBests.rarestCaughtId || null,
      };
    }

    if (isPlainObject(blob.achievements)) {
      fresh.achievements = { ...blob.achievements };
    }

    if (typeof blob.title === 'string' && TITLES.some(t => t.id === blob.title)) {
      fresh.title = blob.title;
    }

    if (typeof blob.currentRegion === 'string') {
      fresh.currentRegion = blob.currentRegion;
    }

    if (isPlainObject(blob.npc) && isPlainObject(blob.npc.morris) && typeof blob.npc.morris.talkCount === 'number') {
      fresh.npc.morris.talkCount = blob.npc.morris.talkCount;
    }
    if (isPlainObject(blob.npc) && isPlainObject(blob.npc.luca) && typeof blob.npc.luca.talkCount === 'number') {
      fresh.npc.luca.talkCount = blob.npc.luca.talkCount;
    }
    if (isPlainObject(blob.npc) && isPlainObject(blob.npc.naia) && typeof blob.npc.naia.talkCount === 'number') {
      fresh.npc.naia.talkCount = blob.npc.naia.talkCount;
    }

    const richyQuest = isPlainObject(blob.quests) && blob.quests.richy;
    if (isPlainObject(richyQuest)) {
      const validStages = ['locked', 'available', 'active', 'complete', 'thanked'];
      if (validStages.includes(richyQuest.stage)) fresh.quests.richy.stage = richyQuest.stage;
      if (typeof richyQuest.progress === 'number') fresh.quests.richy.progress = richyQuest.progress;
    }

    const lucaQuest = isPlainObject(blob.quests) && blob.quests.luca;
    if (isPlainObject(lucaQuest)) {
      const validStages = ['available', 'active', 'ingredientsReady', 'runeReady', 'complete', 'thanked'];
      if (validStages.includes(lucaQuest.stage)) fresh.quests.luca.stage = lucaQuest.stage;
      if (typeof lucaQuest.progress === 'number') fresh.quests.luca.progress = lucaQuest.progress;
    }

    const finnQuest = isPlainObject(blob.quests) && blob.quests.finn;
    if (isPlainObject(finnQuest)) {
      const validStages = ['locked', 'available', 'active', 'complete', 'thanked'];
      if (validStages.includes(finnQuest.stage)) fresh.quests.finn.stage = finnQuest.stage;
      if (typeof finnQuest.progress === 'number') fresh.quests.finn.progress = finnQuest.progress;
    }

    const barnabyQuest = isPlainObject(blob.quests) && blob.quests.barnaby;
    if (isPlainObject(barnabyQuest)) {
      const validStages = ['locked', 'available', 'active', 'complete', 'thanked'];
      if (validStages.includes(barnabyQuest.stage)) fresh.quests.barnaby.stage = barnabyQuest.stage;
      if (typeof barnabyQuest.progress === 'number') fresh.quests.barnaby.progress = barnabyQuest.progress;
    }

    if (isPlainObject(blob.salvage) && Array.isArray(blob.salvage.items)) {
      fresh.salvage.items = blob.salvage.items
        .filter(isPlainObject)
        .filter(it => typeof it.name === 'string')
        .map(it => ({
          id: typeof it.id === 'string' ? it.id : 'wreck',
          name: it.name,
          tier: typeof it.tier === 'number' ? it.tier : 0,
        }));
    }

    if (isPlainObject(blob.bounties) && Array.isArray(blob.bounties.list)) {
      fresh.bounties = {
        day: typeof blob.bounties.day === 'string' ? blob.bounties.day : null,
        list: blob.bounties.list
          .filter(isPlainObject)
          .filter(b => typeof b.rarity === 'string')
          .map(b => ({
            id: typeof b.id === 'string' ? b.id : `${b.rarity}-0`,
            rarity: b.rarity,
            label: typeof b.label === 'string' ? b.label : '',
            goal: typeof b.goal === 'number' ? b.goal : 1,
            progress: typeof b.progress === 'number' ? b.progress : 0,
            rewardGold: typeof b.rewardGold === 'number' ? b.rewardGold : 0,
            rewardExp: typeof b.rewardExp === 'number' ? b.rewardExp : 0,
            claimed: !!b.claimed,
          })),
      };
    }

    if (isPlainObject(blob.weeklyChallenges) && Array.isArray(blob.weeklyChallenges.list)) {
      fresh.weeklyChallenges = {
        week: typeof blob.weeklyChallenges.week === 'string' ? blob.weeklyChallenges.week : null,
        list: blob.weeklyChallenges.list
          .filter(isPlainObject)
          .filter(b => typeof b.rarity === 'string')
          .map(b => ({
            id: typeof b.id === 'string' ? b.id : `${b.rarity}-0`,
            rarity: b.rarity,
            label: typeof b.label === 'string' ? b.label : '',
            goal: typeof b.goal === 'number' ? b.goal : 1,
            progress: typeof b.progress === 'number' ? b.progress : 0,
            rewardGold: typeof b.rewardGold === 'number' ? b.rewardGold : 0,
            rewardExp: typeof b.rewardExp === 'number' ? b.rewardExp : 0,
            claimed: !!b.claimed,
            weekly: true,
          })),
      };
    }
  } catch {
    return createInitialState(avatar, name); // any structural surprise -> safe fresh start, keep the avatar/name
  }

  return fresh;
}

export function loadSlot(index) {
  const blob = readSlotRaw(index);
  if (!blob) return createInitialState();
  return mergeBlobOntoFresh(blob);
}

export function saveToSlot(index, state) {
  try {
    localStorage.setItem(slotKey(index), JSON.stringify(toSaveBlob(state)));
    state.session.lastSaveError = null;
    return true;
  } catch (err) {
    state.session.lastSaveError = String(err && err.message || err);
    return false;
  }
}

// Creates a brand-new save in `index` with the chosen avatar/name and
// persists it immediately, so the slot list reflects it right away.
export function createSlot(index, avatar, name) {
  const state = createInitialState(avatar, name);
  saveToSlot(index, state);
  return state;
}

export function deleteSlot(index) {
  try { localStorage.removeItem(slotKey(index)); } catch { /* ignore */ }
}
