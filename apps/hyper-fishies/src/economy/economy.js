import { bagCapacity } from '../core/gameState.js';
import { BAG } from '../core/constants.js';
import { RODS, rodById, rodRuneSlots } from '../data/rods.js';
import { BAIT } from '../data/bait.js';
import { runeById } from '../data/runes.js';
import { MAX_LEVEL, expToNextLevel, rankForLevel } from '../data/ranks.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { ROD_MASTERY_MAX_LEVEL, rodMasteryXpToNext } from '../data/rodMastery.js';
import { REINFORCE_PARTS_COST, REINFORCE_GOLD_COST, REINFORCE_MAX_PER_ROD, rodReinforcementCount } from '../data/rodForge.js';
import { ENCHANT_PARTS_COST, ENCHANT_GOLD_COST, enchantById, enchantSlotsForRod } from '../data/enchants.js';
import { rarityOf, RARITY_ORDER } from '../data/rarity.js';
import { FISH, fishById } from '../data/fish.js';
import { rollDailyBounties, todayBountyKey } from '../data/bounties.js';
import { rollHotCatch, HOT_CATCH_VALUE_MULT } from '../data/hotCatch.js';
import { rollWeeklyChallenges, currentWeekKey } from '../data/weeklyChallenges.js';
import { HOOKS } from '../data/hooks.js';
import { LINES } from '../data/fishingLine.js';
import { titleById, isTitleUnlocked } from '../data/titles.js';
import { rewardForStreakDay, todayLoginKey, isConsecutiveDay } from '../data/dailyLogin.js';
import { potionById } from '../data/potions.js';
import { SWIVELS } from '../data/swivels.js';
import { SCALES } from '../data/scales.js';
import { SMOKEHOUSE_SLOTS, SMOKE_DURATION_MS, SMOKE_VALUE_MULT } from '../data/smokehouse.js';
import { TRAP_SLOTS, trapById } from '../data/traps.js';
import { rollQuarry } from '../data/quarry.js';
import { playAchievement, playCoin, playQuestComplete, playLevelUp } from '../audio/audioEngine.js';

// Grizelda's ritual fees — separate from a rune's own craftCost. Socketing
// and removing both cost her something extra every time, on top of
// whatever the rune itself was worth, per her own request.
export const RUNE_SOCKET_COST = 100;
export const RUNE_REMOVE_COST = 60;

// The one entry point for granting EXP — every catch and every finished
// quest routes through here (see fishing/fishingMachine.js and this file's
// completeLucaQuest) rather than touching state.level/state.exp directly,
// so leveling and rank-up detection only ever happen in one place. Handles
// more than one level-up from a single big grant (e.g. a quest completion
// bonus) by looping, and caps cleanly at MAX_LEVEL with the bar left full
// rather than rolling over into a level that doesn't exist.
export function addExp(state, amount) {
  if (amount <= 0 || state.level >= MAX_LEVEL) return { leveledUp: false, rankedUp: false, level: state.level };
  const prevLevel = state.level;
  const prevRank = rankForLevel(prevLevel);

  state.exp += amount;
  while (state.level < MAX_LEVEL && state.exp >= expToNextLevel(state.level)) {
    state.exp -= expToNextLevel(state.level);
    state.level += 1;
  }
  if (state.level >= MAX_LEVEL) { state.level = MAX_LEVEL; state.exp = 0; }

  const newRank = rankForLevel(state.level);
  return {
    leveledUp: state.level > prevLevel,
    rankedUp: newRank.id !== prevRank.id,
    level: state.level,
    rank: newRank,
  };
}

// Grants Rod Mastery XP (data/rodMastery.js) to whichever rod is passed in
// — always the equipped one in practice, since mastery is meant to track
// "how much have I actually fished with this rod," not just owning it.
// Lazily creates the {level, xp} entry the first time a rod earns any.
export function addRodMasteryXp(state, rodId, amount) {
  if (!rodId || amount <= 0) return null;
  if (!state.rodMastery[rodId]) state.rodMastery[rodId] = { level: 0, xp: 0 };
  const m = state.rodMastery[rodId];
  if (m.level >= ROD_MASTERY_MAX_LEVEL) return null;

  m.xp += amount;
  let leveledUp = false;
  while (m.level < ROD_MASTERY_MAX_LEVEL && m.xp >= rodMasteryXpToNext(m.level)) {
    m.xp -= rodMasteryXpToNext(m.level);
    m.level += 1;
    leveledUp = true;
  }
  if (m.level >= ROD_MASTERY_MAX_LEVEL) m.xp = 0;
  return leveledUp ? { level: m.level } : null;
}

// Only reachable once you've actually hit the level cap — economy.js's
// addExp already stops granting past MAX_LEVEL, so this is the one place
// level progress can move again after that point.
export function canPrestige(state) {
  return state.level >= MAX_LEVEL;
}

// Trades Level MAX_LEVEL back down to Level 1 for a permanent stat bump
// (data/prestige.js's prestigeBonus, applied in gameState.js's
// effectiveRodStats) — everything else (coins, gear, catches, achievements)
// is left completely untouched.
export function prestige(state) {
  if (!canPrestige(state)) return { ok: false };
  state.prestigeLevel = (state.prestigeLevel || 0) + 1;
  state.level = 1;
  state.exp = 0;
  return { ok: true, prestigeLevel: state.prestigeLevel };
}

// Rerolls the Daily Bounty board (data/bounties.js) whenever the stored day
// doesn't match today — called once at game start and again whenever the
// Notebook opens, so a session that runs past midnight still gets a fresh
// board instead of waiting for the next reload.
export function ensureDailyBounties(state) {
  const key = todayBountyKey();
  if (!state.bounties || state.bounties.day !== key) {
    state.bounties = { day: key, list: rollDailyBounties() };
  }
}

// Rerolls the Weekly Challenge board (data/weeklyChallenges.js) whenever the
// stored week doesn't match the current one — same reroll idiom as
// ensureDailyBounties, just on a 7-day cadence instead of daily.
export function ensureWeeklyChallenges(state) {
  const key = currentWeekKey();
  if (!state.weeklyChallenges || state.weeklyChallenges.week !== key) {
    state.weeklyChallenges = { week: key, list: rollWeeklyChallenges() };
  }
}

// Rerolls Today's Hot Catch (data/hotCatch.js) whenever the stored day
// doesn't match the current one — same reroll idiom as ensureDailyBounties.
export function ensureHotCatch(state) {
  const key = todayBountyKey();
  if (!state.hotCatch || state.hotCatch.day !== key) {
    state.hotCatch = { day: key, fishId: rollHotCatch() };
  }
}

// Rerolls Today's Quarry (data/quarry.js) whenever the stored day doesn't
// match the current one — same reroll idiom as ensureHotCatch, just its own
// independent roll rather than sharing Hot Catch's pick.
export function ensureQuarry(state) {
  const key = todayBountyKey();
  if (!state.quarry || state.quarry.day !== key) {
    state.quarry = { day: key, fishId: rollQuarry(), claimed: false };
  }
}

function processBountyList(list, rank, state) {
  const messages = [];
  if (!list) return messages;
  for (const b of list) {
    if (b.claimed || rarityOf(b.rarity).rank > rank) continue;
    b.progress += 1;
    if (b.progress >= b.goal) {
      b.claimed = true;
      state.coins += b.rewardGold;
      addExp(state, b.rewardExp);
      messages.push(`${b.weekly ? 'Weekly Challenge' : 'Bounty'} complete: ${b.label}! +${b.rewardGold}g, +${b.rewardExp} EXP.`);
    }
  }
  return messages;
}

// Same "turn-in happens automatically" pattern as Richy's and Luca's quests
// (see ui/notebookPanel.js) — the moment a catch's rarity clears a bounty's
// (or weekly challenge's) threshold, the reward is granted on the spot and
// it flips to claimed, no separate turn-in step. Returns the toast-ready
// lines for anything that completed on this catch, for
// fishing/fishingMachine.js to fold into its existing questNote.
export function registerBountyProgress(state, rarityId) {
  const rank = rarityOf(rarityId).rank;
  return [
    ...processBountyList(state.bounties && state.bounties.list, rank, state),
    ...processBountyList(state.weeklyChallenges && state.weeklyChallenges.list, rank, state),
  ];
}

export function bagIsFull(state) {
  return state.bag.items.length >= bagCapacity(state);
}

// item: { fishId, name, rarity, size, value, cleanBonus }
export function addCatchToBag(state, item) {
  if (bagIsFull(state)) return false;
  state.bag.items.push(item);
  return true;
}

// Today's Hot Catch (data/hotCatch.js) bumps a matching fish's sell value
// right here, at the moment it's actually sold — not baked into the catch
// itself, so it rewards checking the board and selling into today's demand
// rather than just having caught the species at some point.
function sellValueFor(state, item) {
  return item.fishId === state.hotCatch.fishId ? Math.round(item.value * HOT_CATCH_VALUE_MULT) : item.value;
}

export function sellAllFish(state) {
  if (state.bag.items.length === 0) return { lines: [], total: 0 };
  const lines = state.bag.items.map(item => ({ name: item.name, rarity: item.rarity, value: sellValueFor(state, item) }));
  const total = lines.reduce((sum, l) => sum + l.value, 0);
  state.coins += total;
  state.bag.items = [];
  if (total > 0) playCoin();
  return { lines, total };
}

export function sellOne(state, index) {
  const item = state.bag.items[index];
  if (!item) return null;
  state.bag.items.splice(index, 1);
  const value = sellValueFor(state, item);
  state.coins += value;
  playCoin();
  return { ...item, value };
}

// Smokehouse (data/smokehouse.js) — pulls a fish out of the bag and starts
// it curing instead of selling it on the spot; nothing is paid out until
// collectSmokedFish below actually claims it.
export function smokeFish(state, bagIndex) {
  if (state.smokehouse.slots.length >= SMOKEHOUSE_SLOTS) return { ok: false, reason: 'full' };
  const item = state.bag.items[bagIndex];
  if (!item) return { ok: false, reason: 'missing' };
  state.bag.items.splice(bagIndex, 1);
  state.smokehouse.slots.push({ ...item, readyAt: Date.now() + SMOKE_DURATION_MS });
  return { ok: true };
}

// Claims a cured fish once its real-time timer has actually elapsed, paying
// out SMOKE_VALUE_MULT of its original sale value — more than an instant
// Sell would have, in exchange for the wait.
export function collectSmokedFish(state, slotIndex) {
  const slot = state.smokehouse.slots[slotIndex];
  if (!slot) return { ok: false, reason: 'missing' };
  if (Date.now() < slot.readyAt) return { ok: false, reason: 'notReady' };
  state.smokehouse.slots.splice(slotIndex, 1);
  const payout = Math.round(slot.value * SMOKE_VALUE_MULT);
  state.coins += payout;
  state.smokedCount = (state.smokedCount || 0) + 1;
  return { ok: true, payout, name: slot.name };
}

// Crab Traps (data/traps.js) — buys one trap into the satchel; it isn't
// producing anything until setTrap below actually puts it out.
export function buyTrap(state, trapId) {
  const trap = trapById(trapId);
  if (!trap) return { ok: false, reason: 'missing' };
  if (state.coins < trap.cost) return { ok: false, reason: 'coins' };
  state.coins -= trap.cost;
  state.traps.owned[trapId] = (state.traps.owned[trapId] || 0) + 1;
  return { ok: true };
}

// Sets one owned trap into an open slot, starting its real-time timer —
// same shape as smokeFish above, just consuming a trap instead of a bagged
// fish.
export function setTrap(state, trapId) {
  if (state.traps.slots.length >= TRAP_SLOTS) return { ok: false, reason: 'full' };
  const owned = state.traps.owned[trapId] || 0;
  if (owned <= 0) return { ok: false, reason: 'missing' };
  const trap = trapById(trapId);
  if (!trap) return { ok: false, reason: 'missing' };
  state.traps.owned[trapId] = owned - 1;
  state.traps.slots.push({ trapId, readyAt: Date.now() + trap.durationMs });
  return { ok: true };
}

// Weighted pick among ordinary dock fish at or below the trap's rarity
// ceiling, using the same rarity.weight numbers a real cast rolls with
// (data/rarity.js) — a trap is a slower, hands-off version of casting a
// line, not a different odds table. Excludes anything gated behind bait,
// weather, region, or a boss/quest flag, so a trap can only ever turn up a
// catch you could have reeled in yourself, right here, on an ordinary day.
function rollTrapFish(maxRarityRank) {
  const pool = FISH.filter(f => !f.boss && !f.requiresBait && !f.requiresRegion && !f.weatherOnly
    && rarityOf(f.rarity).rank <= maxRarityRank);
  if (pool.length === 0) return null;
  const total = pool.reduce((sum, f) => sum + rarityOf(f.rarity).weight, 0);
  let roll = Math.random() * total;
  for (const f of pool) {
    roll -= rarityOf(f.rarity).weight;
    if (roll <= 0) return f;
  }
  return pool[pool.length - 1];
}

// Claims a trap once its real-time timer elapses. Sized near the low end of
// its range on purpose — a trap is a passive convenience, not a substitute
// for actually fighting a fish on the line, so its catches are worth less
// than a real cast at the same rarity. Bag-full behaves the same generous
// way tradeUpFish does below: the trap still resets and the slot frees up,
// the catch just swims off instead of blocking the collect.
export function collectTrap(state, slotIndex) {
  const slot = state.traps.slots[slotIndex];
  if (!slot) return { ok: false, reason: 'missing' };
  if (Date.now() < slot.readyAt) return { ok: false, reason: 'notReady' };
  const trap = trapById(slot.trapId);
  state.traps.slots.splice(slotIndex, 1);
  const fish = rollTrapFish(trap ? trap.maxRarityRank : 0);
  if (!fish) return { ok: true, added: false, fish: null };

  const rarity = rarityOf(fish.rarity);
  const [minSize, maxSize] = fish.sizeRange;
  const size = Math.round((minSize + Math.random() * (maxSize - minSize) * 0.4) * 10) / 10;
  const sizeRatio = Math.min(1.6, Math.max(0, (size - minSize) / Math.max(0.001, maxSize - minSize)));
  const value = Math.round(fish.baseValue * rarity.valueMul * (0.55 + sizeRatio * 0.5));

  const item = { fishId: fish.id, name: fish.name, rarity: fish.rarity, size, value, shiny: false, giant: false };
  const added = addCatchToBag(state, item);

  const entry = state.almanac[fish.id];
  if (added && entry) {
    entry.caught = true;
    entry.count += 1;
    if (size > entry.biggestSize) entry.biggestSize = size;
  }

  state.trapsCollected = (state.trapsCollected || 0) + 1;
  return { ok: true, added, fish, item };
}

// Fish Trade-Up ("Chum the Duplicates," ui/marketPanel.js) — B-LA-KA takes
// TRADE_UP_COUNT bagged fish of the same species off your hands and hands
// back one guaranteed fish from the next rarity tier up, ignoring that
// fish's own requiresBait/requiresRegion gates entirely (it's traded up,
// not caught) — real use for a bag full of the same common instead of just
// selling them, same "spend duplicates for a shot at better" shape as a
// gacha trade-in. Size/value are rolled the same way resolveCatch
// (fishing/fishingMachine.js) rolls a fresh catch, just without any of the
// rod/rune/mutation bonuses a real cast could add.
export const TRADE_UP_COUNT = 3;

export function tradeUpFish(state, fishId) {
  const matches = [];
  for (let i = 0; i < state.bag.items.length; i++) {
    if (state.bag.items[i].fishId === fishId) matches.push(i);
  }
  if (matches.length < TRADE_UP_COUNT) return { ok: false, reason: 'count' };

  const sourceFish = fishById(fishId);
  if (!sourceFish) return { ok: false, reason: 'missing' };
  const currentRank = rarityOf(sourceFish.rarity).rank;
  const nextRarityId = RARITY_ORDER[currentRank + 1];
  if (!nextRarityId) return { ok: false, reason: 'max' };

  const pool = FISH.filter(f => f.rarity === nextRarityId && !f.boss);
  if (pool.length === 0) return { ok: false, reason: 'max' };
  const resultFish = pool[Math.floor(Math.random() * pool.length)];

  // Remove highest indices first so earlier splices don't shift the ones
  // still queued up.
  for (let k = matches.length - 1, removed = 0; k >= 0 && removed < TRADE_UP_COUNT; k--, removed++) {
    state.bag.items.splice(matches[k], 1);
  }

  const rarity = rarityOf(resultFish.rarity);
  const [minSize, maxSize] = resultFish.sizeRange;
  const size = Math.round((minSize + Math.random() * (maxSize - minSize)) * 10) / 10;
  const sizeRatio = Math.min(1.6, Math.max(0, (size - minSize) / Math.max(0.001, maxSize - minSize)));
  const value = Math.round(resultFish.baseValue * rarity.valueMul * (0.65 + sizeRatio * 0.65));

  const item = { fishId: resultFish.id, name: resultFish.name, rarity: resultFish.rarity, size, value, shiny: false, giant: false };
  const added = addCatchToBag(state, item);

  const entry = state.almanac[resultFish.id];
  if (added && entry) {
    entry.caught = true;
    entry.count += 1;
    if (size > entry.biggestSize) entry.biggestSize = size;
  }

  return { ok: true, added, fish: resultFish, item };
}

export function nextBagUpgrade(state) {
  const nextTier = state.bag.capacityTier + 1;
  return BAG.upgrades[nextTier] || null;
}

export function buyBagUpgrade(state) {
  const next = nextBagUpgrade(state);
  if (!next) return { ok: false, reason: 'max' };
  if (state.coins < next.cost) return { ok: false, reason: 'coins' };
  state.coins -= next.cost;
  state.bag.capacityTier += 1;
  return { ok: true };
}

export function buyRod(state, rodId) {
  const rod = RODS.find(r => r.id === rodId);
  if (!rod) return { ok: false, reason: 'missing' };
  if (state.rod.owned.includes(rodId)) return { ok: false, reason: 'owned' };
  if (state.coins < rod.cost) return { ok: false, reason: 'coins' };
  state.coins -= rod.cost;
  state.rod.owned.push(rodId);

  // Buying the Leviathan's Cutlass Rod — Finn's own top-of-the-rack item —
  // is what tips him off to ask for a favor, same "the purchase itself is
  // the trigger" shape as Richy's Harpoon Chunk (see buyBait above).
  if (rodId === 'leviathan' && state.quests.finn.stage === 'locked') {
    state.quests.finn.stage = 'available';
  }
  return { ok: true };
}

export function equipRod(state, rodId) {
  if (!state.rod.owned.includes(rodId)) return false;
  state.rod.equipped = rodId;
  return true;
}

// Hook and Line follow the exact same buy/equip shape as a rod, just
// against `state.hook`/`state.line` and their own data tables — no rune
// sockets, since only a rod carries those.
export function buyHook(state, hookId) {
  const hook = HOOKS.find(h => h.id === hookId);
  if (!hook) return { ok: false, reason: 'missing' };
  if (state.hook.owned.includes(hookId)) return { ok: false, reason: 'owned' };
  if (state.coins < hook.cost) return { ok: false, reason: 'coins' };
  state.coins -= hook.cost;
  state.hook.owned.push(hookId);
  return { ok: true };
}

export function equipHook(state, hookId) {
  if (!state.hook.owned.includes(hookId)) return false;
  state.hook.equipped = hookId;
  return true;
}

export function buyLine(state, lineId) {
  const line = LINES.find(l => l.id === lineId);
  if (!line) return { ok: false, reason: 'missing' };
  if (state.line.owned.includes(lineId)) return { ok: false, reason: 'owned' };
  if (state.coins < line.cost) return { ok: false, reason: 'coins' };
  state.coins -= line.cost;
  state.line.owned.push(lineId);
  return { ok: true };
}

export function equipLine(state, lineId) {
  if (!state.line.owned.includes(lineId)) return false;
  state.line.equipped = lineId;
  return true;
}

// Swivels (data/swivels.js, sold at Bait & Barnacles) and Scales (data/
// scales.js, sold at the Trading Post) follow the exact same buy/equip
// shape as every other gear slot.
export function buySwivel(state, swivelId) {
  const swivel = SWIVELS.find(s => s.id === swivelId);
  if (!swivel) return { ok: false, reason: 'missing' };
  if (state.swivel.owned.includes(swivelId)) return { ok: false, reason: 'owned' };
  if (state.coins < swivel.cost) return { ok: false, reason: 'coins' };
  state.coins -= swivel.cost;
  state.swivel.owned.push(swivelId);
  return { ok: true };
}

export function equipSwivel(state, swivelId) {
  if (!state.swivel.owned.includes(swivelId)) return false;
  state.swivel.equipped = swivelId;
  return true;
}

export function buyScale(state, scaleId) {
  const scale = SCALES.find(s => s.id === scaleId);
  if (!scale) return { ok: false, reason: 'missing' };
  if (state.scale.owned.includes(scaleId)) return { ok: false, reason: 'owned' };
  if (state.coins < scale.cost) return { ok: false, reason: 'coins' };
  state.coins -= scale.cost;
  state.scale.owned.push(scaleId);

  // Buying the Abyssal Ledger is what tips B-LA-KA off to ask his own
  // favor — same "the purchase itself is the trigger" shape as Finn's
  // rod quest above.
  if (scaleId === 'abyssalLedger' && state.quests.barnaby.stage === 'locked') {
    state.quests.barnaby.stage = 'available';
  }
  return { ok: true };
}

export function equipScale(state, scaleId) {
  if (!state.scale.owned.includes(scaleId)) return false;
  state.scale.equipped = scaleId;
  return true;
}

const GEAR_STAT_FIELDS = ['luck', 'control', 'biteSpeed', 'valueMul', 'sizeMul', 'snapGuard'];

function scoreGearItem(item) {
  let score = 0;
  for (const key of GEAR_STAT_FIELDS) {
    if (typeof item[key] === 'number') score += item[key];
  }
  return score;
}

// One-click "optimize" for the five passive gear slots — scores every owned
// item in a slot by the flat sum of every stat it carries (the same fields
// effectiveRodStats stacks, gameState.js) and equips whichever scores
// highest. A blunt heuristic on purpose: it only looks at each item's own
// base stats (not socketed runes or anything else already equipped), so
// it's meant as a fast starting point — especially useful right after
// buying a pile of new gear — not a replacement for hand-picking a build
// around one particular stat.
export function equipBestGear(state) {
  const changes = [];
  const bestOf = (list, owned) => list.filter(i => owned.includes(i.id)).sort((a, b) => scoreGearItem(b) - scoreGearItem(a))[0];

  const bestRod = bestOf(RODS, state.rod.owned);
  if (bestRod && bestRod.id !== state.rod.equipped) { equipRod(state, bestRod.id); changes.push(bestRod.name); }

  const bestHook = bestOf(HOOKS, state.hook.owned);
  if (bestHook && bestHook.id !== state.hook.equipped) { equipHook(state, bestHook.id); changes.push(bestHook.name); }

  const bestLine = bestOf(LINES, state.line.owned);
  if (bestLine && bestLine.id !== state.line.equipped) { equipLine(state, bestLine.id); changes.push(bestLine.name); }

  const bestSwivel = bestOf(SWIVELS, state.swivel.owned);
  if (bestSwivel && bestSwivel.id !== state.swivel.equipped) { equipSwivel(state, bestSwivel.id); changes.push(bestSwivel.name); }

  const bestScale = bestOf(SCALES, state.scale.owned);
  if (bestScale && bestScale.id !== state.scale.equipped) { equipScale(state, bestScale.id); changes.push(bestScale.name); }

  return { changed: changes.length, items: changes };
}

// Selecting a title (data/titles.js) just needs its achievement already
// unlocked — there's no cost, it's a cosmetic flex, not a purchase.
export function selectTitle(state, titleId) {
  const title = titleById(titleId);
  if (!isTitleUnlocked(state, title)) return false;
  state.title = title.id;
  return true;
}

// Gear Loadout Presets — a named snapshot of every equip slot at once
// (rod/hook/line/swivel/scale/bait/title), so swapping between a
// "luck build" and a "value build" is one click in the Satchel instead of
// eight. Capped so the list stays a quick glance, not another inventory to
// manage.
export const MAX_LOADOUTS = 5;

export function saveLoadout(state, name) {
  if (state.loadouts.length >= MAX_LOADOUTS) return { ok: false, reason: 'max' };
  state.loadouts.push({
    name: (name && name.trim()) || `Loadout ${state.loadouts.length + 1}`,
    rod: state.rod.equipped,
    hook: state.hook.equipped,
    line: state.line.equipped,
    swivel: state.swivel.equipped,
    scale: state.scale.equipped,
    bait: state.bait.equipped,
    title: state.title,
  });
  return { ok: true };
}

// Applies every slot in a saved loadout, but only where you still actually
// own (or, for title, have unlocked) the referenced item — a loadout saved
// before selling/losing something never leaves an equip slot pointing at
// nothing.
export function equipLoadout(state, index) {
  const loadout = state.loadouts[index];
  if (!loadout) return { ok: false };
  if (state.rod.owned.includes(loadout.rod)) equipRod(state, loadout.rod);
  if (state.hook.owned.includes(loadout.hook)) equipHook(state, loadout.hook);
  if (state.line.owned.includes(loadout.line)) equipLine(state, loadout.line);
  if (state.swivel.owned.includes(loadout.swivel)) equipSwivel(state, loadout.swivel);
  if (state.scale.owned.includes(loadout.scale)) equipScale(state, loadout.scale);
  if (loadout.bait === 'none' || state.bait.owned[loadout.bait] > 0) equipBait(state, loadout.bait);
  const title = titleById(loadout.title);
  if (isTitleUnlocked(state, title)) selectTitle(state, loadout.title);
  return { ok: true };
}

export function deleteLoadout(state, index) {
  if (index < 0 || index >= state.loadouts.length) return { ok: false };
  state.loadouts.splice(index, 1);
  return { ok: true };
}

// Called once at game start (main.js). No-ops if already claimed today;
// otherwise grants the reward for the (possibly-continued, possibly-reset)
// streak and returns it so main.js can toast it. Same automatic-grant
// pattern as everything else that doesn't need a turn-in step.
// Buying a Brew (data/potions.js) replaces whatever's currently running
// rather than stacking — a fresh purchase always resets the timer to the
// full duration, even if you're re-buying the same brew mid-run.
export function buyPotion(state, potionId) {
  const potion = potionById(potionId);
  if (!potion) return { ok: false, reason: 'missing' };
  if (state.coins < potion.cost) return { ok: false, reason: 'coins' };
  state.coins -= potion.cost;
  state.activePotion = { id: potion.id, timeLeft: potion.duration };
  return { ok: true };
}

export function checkDailyLogin(state) {
  const today = todayLoginKey();
  if (state.dailyLogin.lastDay === today) return null;
  const consecutive = isConsecutiveDay(state.dailyLogin.lastDay, today);
  state.dailyLogin.streak = consecutive ? state.dailyLogin.streak + 1 : 1;
  state.dailyLogin.lastDay = today;
  const reward = rewardForStreakDay(state.dailyLogin.streak);
  state.coins += reward.gold;
  addExp(state, reward.exp);
  return { streak: state.dailyLogin.streak, gold: reward.gold, exp: reward.exp };
}

export function buyBait(state, baitId, qty = 1) {
  const bait = BAIT.find(b => b.id === baitId);
  if (!bait) return { ok: false, reason: 'missing' };
  const cost = (state.bait.owned[baitId] ? bait.stackCost : bait.cost) * qty;
  if (state.coins < cost) return { ok: false, reason: 'coins' };
  state.coins -= cost;
  state.bait.owned[baitId] = (state.bait.owned[baitId] || 0) + qty;

  // Buying Harpoon Chunk for the first time is what tips Richy off to ask
  // for a favor — see data/shopDialogues.js's Richy quest branch. Returned
  // as a flag rather than shown as a toast here since economy.js doesn't
  // otherwise touch the UI layer.
  let questTriggered = false;
  if (baitId === 'harpoonChunk' && state.quests.richy.stage === 'locked') {
    state.quests.richy.stage = 'available';
    questTriggered = true;
  }

  return { ok: true, questTriggered };
}

export function equipBait(state, baitId) {
  if (baitId !== 'none' && !(state.bait.owned[baitId] > 0)) return false;
  state.bait.equipped = baitId;
  return true;
}

// Accepting the quest from Richy's dialogue — only valid while he's
// actually offering it, so a stray double-click or replayed action can't
// re-trigger it once it's underway.
export function acceptRichyQuest(state) {
  if (state.quests.richy.stage !== 'available') return { ok: false };
  state.quests.richy.stage = 'active';
  state.quests.richy.progress = 0;
  return { ok: true };
}

// Finn's and B-LA-KA's own secret quests — same accept shape as Richy's
// just above, just against their own quest slots.
export function acceptFinnQuest(state) {
  if (state.quests.finn.stage !== 'available') return { ok: false };
  state.quests.finn.stage = 'active';
  state.quests.finn.progress = 0;
  return { ok: true };
}

export function acceptBarnabyQuest(state) {
  if (state.quests.barnaby.stage !== 'available') return { ok: false };
  state.quests.barnaby.stage = 'active';
  state.quests.barnaby.progress = 0;
  return { ok: true };
}

// Crafting a rune adds it to your satchel — it isn't socketed onto
// anything yet, see socketRune below.
export function craftRune(state, runeId) {
  const rune = runeById(runeId);
  if (!rune) return { ok: false, reason: 'missing' };
  if (state.coins < rune.craftCost) return { ok: false, reason: 'coins' };
  state.coins -= rune.craftCost;
  state.runes.owned[runeId] = (state.runes.owned[runeId] || 0) + 1;
  return { ok: true };
}

// Socketing consumes one owned copy of the rune and costs Grizelda's flat
// ritual fee on top. How many runes a rod can hold at once depends on its
// rank (data/rods.js's rodRuneSlots) — once every slot is filled you have
// to remove one before socketing another.
export function socketRune(state, rodId, runeId) {
  const rod = rodById(rodId);
  if (!rod || !state.rod.owned.includes(rodId)) return { ok: false, reason: 'rod' };
  const current = state.rod.socketed[rodId] || [];
  if (current.length >= rodRuneSlots(rod.cost)) return { ok: false, reason: 'full' };
  if (!(state.runes.owned[runeId] > 0)) return { ok: false, reason: 'rune' };
  if (state.coins < RUNE_SOCKET_COST) return { ok: false, reason: 'coins' };
  state.coins -= RUNE_SOCKET_COST;
  state.runes.owned[runeId] -= 1;
  if (state.runes.owned[runeId] <= 0) delete state.runes.owned[runeId];
  state.rod.socketed[rodId] = [...current, runeId];
  return { ok: true };
}

// Removal costs its own fee but the rune itself survives extraction and
// goes back to your satchel, ready to be socketed onto something else.
// `slotIndex` picks which of the rod's (possibly several) socketed runes
// to pull.
export function removeRune(state, rodId, slotIndex) {
  const current = state.rod.socketed[rodId] || [];
  const runeId = current[slotIndex];
  if (!runeId) return { ok: false, reason: 'empty' };
  if (state.coins < RUNE_REMOVE_COST) return { ok: false, reason: 'coins' };
  state.coins -= RUNE_REMOVE_COST;
  state.rod.socketed[rodId] = current.filter((_, i) => i !== slotIndex);
  state.runes.owned[runeId] = (state.runes.owned[runeId] || 0) + 1;
  return { ok: true };
}

// `have - 1` is safe for a bait stocked as Infinity (Richy's Special, once
// his quest is complete — see fishing/fishingMachine.js) since
// Infinity - 1 === Infinity in JS: it never dips to 0, so this never
// unequips or deletes an infinite-use bait.
export function consumeEquippedBait(state) {
  const id = state.bait.equipped;
  if (id === 'none') return;
  const have = state.bait.owned[id] || 0;
  if (have <= 0) { state.bait.equipped = 'none'; return; }
  state.bait.owned[id] = have - 1;
  if (state.bait.owned[id] <= 0) {
    delete state.bait.owned[id];
    state.bait.equipped = 'none';
  }
}

// A loose rod part landing in the salvage hold instead of the fish bag —
// every cast has a small passive chance to resolve as one instead of a fish
// (see fishing/fishingMachine.js, data/rodParts.js's ROD_SCRAP_CHANCE). Not
// capped by bag capacity — scrap metal doesn't compete with your catch for
// space.
export function addSalvageToInventory(state, item) {
  state.salvage.items.push(item);
}

// How many rod parts the Blacksmith needs on his bench before he'll lash
// together the Scrap Rod (data/rods.js) — exported so ui/forgePanel.js can
// show a "3/5" style progress readout.
export const SCRAP_ROD_PARTS_NEEDED = 5;

// Consumes SCRAP_ROD_PARTS_NEEDED parts (oldest first) and hands over the
// finished rod. Only ever craftable once — a second Scrap Rod would just be
// the same rod, so once it's owned there's nothing left to build toward.
export function craftScrapRod(state) {
  if (state.rod.owned.includes('scrapRod')) return { ok: false, reason: 'owned' };
  if (state.salvage.items.length < SCRAP_ROD_PARTS_NEEDED) return { ok: false, reason: 'parts' };
  state.salvage.items.splice(0, SCRAP_ROD_PARTS_NEEDED);
  state.rod.owned.push('scrapRod');
  return { ok: true };
}

// The Forge's second tier — only on the table once the Scrap Rod is already
// built, and wants twice the parts (data/rods.js's ironboundRod).
export const IRONBOUND_ROD_PARTS_NEEDED = 12;
export function craftIronboundRod(state) {
  if (!state.rod.owned.includes('scrapRod')) return { ok: false, reason: 'locked' };
  if (state.rod.owned.includes('ironboundRod')) return { ok: false, reason: 'owned' };
  if (state.salvage.items.length < IRONBOUND_ROD_PARTS_NEEDED) return { ok: false, reason: 'parts' };
  state.salvage.items.splice(0, IRONBOUND_ROD_PARTS_NEEDED);
  state.rod.owned.push('ironboundRod');
  return { ok: true };
}

// Rod Reinforcement (data/rodForge.js) — a repeatable sink for parts that
// stays useful even after every craftable rod is already owned. Always
// targets whichever rod is currently equipped, capped per rod.
export function reinforceRod(state) {
  const rodId = state.rod.equipped;
  const count = rodReinforcementCount(state, rodId);
  if (count >= REINFORCE_MAX_PER_ROD) return { ok: false, reason: 'max' };
  if (state.salvage.items.length < REINFORCE_PARTS_COST) return { ok: false, reason: 'parts' };
  if (state.coins < REINFORCE_GOLD_COST) return { ok: false, reason: 'gold' };
  state.salvage.items.splice(0, REINFORCE_PARTS_COST);
  state.coins -= REINFORCE_GOLD_COST;
  state.rodReinforcements[rodId] = count + 1;
  return { ok: true, level: count + 1 };
}

// Forge Enchants (data/enchants.js) — targets the equipped rod directly,
// same "no separate inventory step" shape as reinforceRod above, rather than
// crafting a portable item first. Each rod holds enchantSlotsForRod(state,
// rodId) enchants at once (1 normally, 2 once that rod is mastered) — while
// there's still an empty slot, crafting fills it; once full, crafting a new
// one bumps the oldest (slot 0) rather than needing a separate removal step,
// since there's nothing to give back either way — the parts and gold are
// spent regardless, exactly like a reinforcement payment.
export function craftEnchant(state, enchantId) {
  const enchant = enchantById(enchantId);
  if (!enchant) return { ok: false, reason: 'missing' };
  const rodId = state.rod.equipped;
  const current = state.rod.enchanted[rodId] || [];
  if (current.includes(enchantId)) return { ok: false, reason: 'active' };
  if (state.salvage.items.length < ENCHANT_PARTS_COST) return { ok: false, reason: 'parts' };
  if (state.coins < ENCHANT_GOLD_COST) return { ok: false, reason: 'gold' };
  state.salvage.items.splice(0, ENCHANT_PARTS_COST);
  state.coins -= ENCHANT_GOLD_COST;
  const maxSlots = enchantSlotsForRod(state, rodId);
  state.rod.enchanted[rodId] = current.length < maxSlots ? [...current, enchantId] : [enchantId, ...current.slice(1)];
  return { ok: true, enchant };
}

// Melting down whatever's left in the salvage hold for a little gold —
// nowhere near what a real catch sells for, but better than the parts just
// sitting there once you're not saving toward the Scrap Rod (or already own
// it). Every part pays the same flat rate regardless of variant; there's no
// rarity-driven payout the way a real fish has.
const SALVAGE_MELT_VALUE = 4;
export function meltSalvageForGold(state) {
  const items = state.salvage.items;
  if (items.length === 0) return { ok: false, reason: 'empty' };
  const count = items.length;
  const total = count * SALVAGE_MELT_VALUE;
  state.coins += total;
  state.salvage.items = [];
  return { ok: true, count, total };
}

// Luca's quest offer, first heard in the Abyssal Lands — see
// data/lucaDialogue.js. Ingredient-gathering itself happens passively while
// the quest is active (fishing/fishingMachine.js's resolveCatch counts
// Abyssal-rarity catches made there toward the goal).
export function acceptLucaQuest(state) {
  if (state.quests.luca.stage !== 'available') return { ok: false };
  state.quests.luca.stage = 'active';
  state.quests.luca.progress = 0;
  return { ok: true };
}

// Grizelda turning the gathered ingredients into the actual Cleansing Rune —
// only available once the quest has hit its ingredient goal (see
// ui/witchShopPanel.js). Nothing further to consume: hitting the goal *was*
// spending the ingredients, this just cashes that progress in for the rune.
export function craftCleansingRune(state) {
  if (state.quests.luca.stage !== 'ingredientsReady') return { ok: false };
  state.quests.luca.stage = 'runeReady';
  return { ok: true };
}

// Using the finished rune on Luca himself — cures him, and in thanks he
// presses gold, a big EXP bonus (this was the harder of the two secret
// quests — a short goal, but a rare one, on top of a whole side plot), and
// the Devil's Rod on you: whatever came up out of the deep with him left
// something behind before it left. Guarded against double-granting the rod
// even though `stage` gating already makes completeLucaQuest a one-shot.
export function completeLucaQuest(state) {
  if (state.quests.luca.stage !== 'runeReady') return { ok: false };
  state.quests.luca.stage = 'complete';
  state.coins += 300;
  if (!state.rod.owned.includes('devilsRod')) state.rod.owned.push('devilsRod');
  const expResult = addExp(state, 400);
  playQuestComplete();
  if (expResult.leveledUp) playLevelUp();
  return { ok: true, expResult };
}

// Re-checked every frame (main.js) — cheap array scans (data/achievements.js),
// and each id is only ever granted once since `state.achievements[id]` is
// set permanently the moment it's earned. Catching this on a frame timer
// rather than sprinkling calls after every catch/quest/gold change means it
// can never miss a milestone crossed by any of those paths.
export function checkAchievements(state, toast) {
  let anyUnlocked = false;
  for (const a of ACHIEVEMENTS) {
    if (state.achievements[a.id]) continue;
    if (!a.check(state)) continue;
    state.achievements[a.id] = true;
    anyUnlocked = true;
    playAchievement();
    if (a.gold) state.coins += a.gold;
    const expResult = a.exp ? addExp(state, a.exp) : null;
    if (toast) {
      let msg = `🏆 Achievement unlocked: ${a.name}!`;
      if (a.gold || a.exp) msg += ` (+${a.gold}g, +${a.exp} EXP)`;
      if (expResult && expResult.leveledUp) {
        msg += expResult.rankedUp
          ? ` Level up! ${expResult.rank.label} now — level ${expResult.level}.`
          : ` Level up! Level ${expResult.level}.`;
      }
      toast(msg);
    }
  }
  return anyUnlocked;
}
