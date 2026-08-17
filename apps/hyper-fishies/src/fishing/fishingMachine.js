// The core fishing loop as an explicit state machine:
//   idle -> charging -> flying -> waiting -> hookset -> reeling -> result -> idle
//                                                 \-> (miss) -> idle
//                                    reeling -> (tension snap) -> result(snapped)
import { spotById } from '../data/spots.js';
import { rarityOf } from '../data/rarity.js';
import { behaviorFor } from './behaviors.js';
import { rollFishForSpot } from './rollFish.js';
import { effectiveRodStats } from '../core/gameState.js';
import { baitById, UNLIMITED_BAIT_QTY } from '../data/bait.js';
import { randomRodPartVariant, rodPartRarityId, ROD_SCRAP_CHANCE, ROD_SCRAP_FISH } from '../data/rodParts.js';
import { addCatchToBag, addSalvageToInventory, consumeEquippedBait, addExp, addRodMasteryXp, registerBountyProgress } from '../economy/economy.js';
import { SHINY_CHANCE, SHINY_VALUE_MULT, SHINY_SIZE_MULT, GIANT_CHANCE, GIANT_VALUE_MULT, GIANT_SIZE_MULT } from '../data/mutations.js';
import { weatherDef } from '../data/weather.js';
import { SEA_CHEST_CHANCE, SEA_CHEST_STORM_MULT, SEA_CHEST_FISH, rollSeaChestReward } from '../data/seaChest.js';
import { BOTTLE_CHANCE, BOTTLE_FISH, rollBottleMessage, rollBottleGold } from '../data/bottles.js';
import { MAP_FRAGMENT_CHANCE, MAP_FRAGMENTS_NEEDED, BURIED_TREASURE_GOLD, BURIED_TREASURE_EXP } from '../data/treasureMap.js';
import { QUARRY_BONUS_GOLD, QUARRY_BONUS_EXP } from '../data/quarry.js';
import { playCast, playSplash, playLandingSplash, playCatch, playSnap, playCoin, playHookset, playScrap, playLevelUp, playQuestComplete, playBagFull } from '../audio/audioEngine.js';
import { todayBountyKey } from '../data/bounties.js';
import { regionById } from '../data/regions.js';
import { STREAK_MILESTONES } from '../data/streakMilestones.js';
import { nightLuckBonus, isDeepNight } from '../data/dayNight.js';
import { cleanStreakValueMul } from '../data/cleanStreak.js';
import { REGION_MILESTONES } from '../data/regionMilestones.js';

const TUNE = {
  chargeCycleTime: 1.15,
  flightDuration: 0.4,
  hooksetBaseWindow: 0.62,
  reelPower: 34,     // distance/sec reeled while holding
  tensionRise: 62,   // tension/sec while holding
  tensionCool: 48,   // tension/sec while released
  driftScale: 1.0,
  cleanTensionThreshold: 55,
};

export function startCharging(state, spotId) {
  state.fishing = {
    state: 'charging',
    spotId,
    chargePower: 0,
    chargeDir: 1,
    prevActionDown: true,
    bobber: null,
    fish: null,
    fightTime: 0,
    distance: 100,
    tension: 0,
    maxTensionReached: 0,
    cleanReel: true,
    result: null,
    nibbleTimes: [],
    nibbleActive: false,
    nibbleTimer: 0,
    waitTimer: 0,
    waitDuration: 0,
    hooksetTimer: 0,
    hooksetDuration: TUNE.hooksetBaseWindow,
    flightT: 0,
    flightStart: null,
    castTarget: null,
    perfectCast: false,
  };
}

export function dismissResult(state) {
  state.fishing = { state: 'idle' };
}

export function updateFishing(state, dt, actionDown, actionEdge, toast) {
  const f = state.fishing;
  if (!f || f.state === 'idle') return;

  switch (f.state) {
    case 'charging': updateCharging(state, dt, actionDown); break;
    case 'flying': updateFlying(state, dt); break;
    case 'waiting': updateWaiting(state, dt, toast); break;
    case 'hookset': updateHookset(state, dt, actionEdge, toast); break;
    case 'reeling': updateReeling(state, dt, actionDown, toast); break;
    case 'result':
      f.resultTimer -= dt;
      if (actionEdge || f.resultTimer <= 0) dismissResult(state);
      break;
  }
}

function updateCharging(state, dt, actionDown) {
  const f = state.fishing;
  f.chargePower += (f.chargeDir * dt) / (TUNE.chargeCycleTime / 2);
  if (f.chargePower >= 1) { f.chargePower = 1; f.chargeDir = -1; }
  if (f.chargePower <= 0) { f.chargePower = 0; f.chargeDir = 1; }

  const released = f.prevActionDown && !actionDown;
  f.prevActionDown = actionDown;

  if (released) {
    const spot = spotById(f.spotId);
    const power = f.chargePower;
    const originVec = { x: spot.castOrigin.x - spot.x, y: spot.castOrigin.y - spot.y };
    const distFrac = 0.35 + power * 0.65;
    const perpLen = Math.hypot(originVec.x, originVec.y) || 1;
    const perp = { x: -originVec.y / perpLen, y: originVec.x / perpLen };
    const jitter = (Math.random() - 0.5) * 34;

    f.castTarget = {
      x: spot.x + originVec.x * distFrac + perp.x * jitter,
      y: spot.y + originVec.y * distFrac + perp.y * jitter,
    };
    f.flightStart = { x: spot.x, y: spot.y - 8 };
    f.bobber = { x: f.flightStart.x, y: f.flightStart.y };
    f.perfectCast = power > 0.88;
    f.flightT = 0;
    f.state = 'flying';
    playCast();
  }
}

function updateFlying(state, dt) {
  const f = state.fishing;
  f.flightT += dt / TUNE.flightDuration;
  const t = Math.min(f.flightT, 1);
  const ease = 1 - Math.pow(1 - t, 2);
  f.bobber = {
    x: f.flightStart.x + (f.castTarget.x - f.flightStart.x) * ease,
    y: f.flightStart.y + (f.castTarget.y - f.flightStart.y) * ease,
  };
  if (f.flightT >= 1) {
    beginWaiting(state);
  }
}

function beginWaiting(state) {
  const f = state.fishing;
  const rod = effectiveRodStats(state);
  const bait = baitById(state.bait.equipped);
  consumeEquippedBait(state);
  playLandingSplash();

  let waitDuration = (2.6 + Math.random() * 3.4) * bait.waitMul * (1 - rod.biteSpeed * 0.45);
  waitDuration *= weatherDef(state).waitMul;
  if (f.perfectCast) waitDuration *= 0.85;
  waitDuration = Math.max(1.1, waitDuration);

  const nibbleCount = Math.random() < 0.7 ? (Math.random() < 0.5 ? 1 : 2) : 0;
  const nibbleTimes = [];
  for (let i = 0; i < nibbleCount; i++) {
    nibbleTimes.push(waitDuration * (0.15 + Math.random() * 0.6));
  }
  nibbleTimes.sort((a, b) => a - b);

  f.state = 'waiting';
  f.waitTimer = 0;
  f.waitDuration = waitDuration;
  f.nibbleTimes = nibbleTimes;
  f.nibbleActive = false;
  f.nibbleTimer = 0;
}

function updateWaiting(state, dt, toast) {
  const f = state.fishing;
  f.waitTimer += dt;

  if (f.nibbleActive) {
    f.nibbleTimer += dt;
    if (f.nibbleTimer > 0.35) f.nibbleActive = false;
  } else if (f.nibbleTimes.length && f.waitTimer >= f.nibbleTimes[0]) {
    f.nibbleTimes.shift();
    f.nibbleActive = true;
    f.nibbleTimer = 0;
    playSplash();
  }

  if (f.waitTimer >= f.waitDuration) {
    const rod = effectiveRodStats(state);
    const weather = weatherDef(state);

    // A Sea Chest (data/seaChest.js) or a loose Rod Scrap (data/rodParts.js)
    // each roll in place of the normal fish entirely — storms wash up more
    // chests, one more small reason a storm is worth fishing through. Rod
    // Scrap used to need the old hotkey-4 salvage toggle armed ahead of
    // time; it's a flat passive chance on every bite now, same as a chest.
    // Both odds also scale with a Bountiful Forge Enchant (data/enchants.js),
    // via rod.treasureMult — 1 with nothing enchanted, a true no-op.
    const chestChance = SEA_CHEST_CHANCE * (weather.id === 'storm' ? SEA_CHEST_STORM_MULT : 1) * rod.treasureMult;
    const scrapChance = ROD_SCRAP_CHANCE * rod.treasureMult;
    const bite = Math.random();
    let fish;
    if (bite < chestChance) fish = SEA_CHEST_FISH;
    else if (bite < chestChance + scrapChance) fish = ROD_SCRAP_FISH;
    else if (bite < chestChance + scrapChance + BOTTLE_CHANCE) fish = BOTTLE_FISH;
    else fish = rollFishForSpot(f.spotId, rod, state.bait.equipped, state.currentRegion, weather, nightLuckBonus(state.dayNight.time));
    if (!fish) { state.fishing = { state: 'idle' }; return; }
    f.fish = fish;
    f.nibbleActive = false;

    // A Piercing Forge Enchant (data/enchants.js) skips the hookset QTE
    // outright — the exact same state the manual actionEdge branch in
    // updateHookset sets up, just entered a beat early instead of waiting
    // on a keypress that would otherwise have to land inside the window.
    if (rod.autoHookset) {
      f.state = 'reeling';
      f.fightTime = 0;
      f.distance = 100;
      f.tension = 0;
      f.maxTensionReached = 0;
      f.cleanReel = true;
      f.behavior = behaviorFor(fish.behavior);
      playHookset();
      return;
    }
    f.state = 'hookset';
    f.hooksetTimer = 0;
    f.hooksetDuration = TUNE.hooksetBaseWindow + rod.control * 0.18;
  }
}

function updateHookset(state, dt, actionEdge, toast) {
  const f = state.fishing;
  f.hooksetTimer += dt;

  if (actionEdge) {
    f.state = 'reeling';
    f.fightTime = 0;
    f.distance = 100;
    f.tension = 0;
    f.maxTensionReached = 0;
    f.cleanReel = true;
    f.behavior = behaviorFor(f.fish.behavior);
    playHookset();
    return;
  }

  if (f.hooksetTimer >= f.hooksetDuration) {
    if (toast) toast('It got away before you could hook it.');
    state.fishing = { state: 'idle' };
  }
}

function updateReeling(state, dt, actionDown, toast) {
  const f = state.fishing;
  const rod = effectiveRodStats(state);
  const rarity = rarityOf(f.fish.rarity);

  f.fightTime += dt;
  const pull = f.behavior.pull(f.fightTime, Math.random);
  const driftScale = TUNE.driftScale * (1 + rarity.rank * 0.1);
  f.distance += pull * dt * driftScale * 0.35;

  if (actionDown) {
    f.distance -= TUNE.reelPower * (1 + rod.control * 0.7) * dt;
    // A socketed Rune of the Barnacle Ward (snapGuard) eases tension rise
    // further on top of the rod's own control — floored so a stacked
    // rod+rune combo can never make tension stop rising entirely.
    const tensionFactor = Math.max(0.15, 1 - rod.control * 0.55 - (rod.snapGuard || 0));
    // A storm's better odds come at a real cost — its tensionMul (usually
    // 1, only >1 during a storm) makes the line strain faster once
    // something's actually on the hook (data/weather.js).
    f.tension += TUNE.tensionRise * tensionFactor * weatherDef(state).tensionMul * dt;
  } else {
    f.tension -= TUNE.tensionCool * dt;
  }

  f.distance = clamp(f.distance, 0, 100);
  f.tension = clamp(f.tension, 0, 100);
  f.maxTensionReached = Math.max(f.maxTensionReached, f.tension);
  if (f.maxTensionReached > TUNE.cleanTensionThreshold) f.cleanReel = false;

  if (f.tension >= 100) {
    state.streak.current = 0;
    state.cleanStreak.current = 0;
    if (toast) toast('Snap! The line broke.');
    playSnap();
    f.state = 'result';
    f.resultTimer = 1.4;
    f.result = { type: 'snapped', fish: f.fish };
    return;
  }

  if (f.distance <= 0) {
    resolveCatch(state, toast);
  }
}

// Reached via the passive ROD_SCRAP_CHANCE roll in updateWaiting — instead
// of resolving the fish that actually bit, the line comes back with a loose
// rod part instead. Bypasses the bag/almanac/streak/personal-bests
// machinery entirely (it was never a real fish), but still ends in the
// normal 'result' state so the existing catch card renders it — it only
// needs shape/hue/name/rarity/size, which a rod part variant can fake
// convincingly (see data/rodParts.js).
function resolveSalvageCatch(state) {
  const f = state.fishing;
  const variant = randomRodPartVariant();
  const rarityId = rodPartRarityId(variant.tier);

  addSalvageToInventory(state, { id: variant.id, name: variant.name, tier: variant.tier });
  playScrap();

  const fauxFish = { id: variant.id, name: variant.name, rarity: rarityId, shape: 'wreck', hue: '#8a8f92' };
  f.state = 'result';
  f.resultTimer = 9;
  f.result = {
    type: 'caught', fish: fauxFish, size: variant.tier + 1, value: 0,
    cleanBonus: false, bagFull: false, questNote: null, salvage: true,
  };
}

// A Sea Chest bypasses the almanac/bag/streak/personal-bests machinery
// entirely — it was never a fish, just gold with a hook in it. Still ends
// in the normal 'result' state so the catch card renders it (catchCard.js's
// `chest` branch), the same pattern resolveSalvageCatch uses for rod parts.
function resolveChestCatch(state, toast) {
  const f = state.fishing;
  const region = regionById(state.currentRegion);
  const reward = rollSeaChestReward(region.stars);
  state.coins += reward.gold;
  state.seaChestsOpened += 1;
  playCoin();

  let questNote = null;
  const chestExp = addExp(state, Math.round((15 + region.stars * 2) * effectiveRodStats(state).expMult));
  if (chestExp.leveledUp) {
    questNote = chestExp.rankedUp
      ? `Level up! ${chestExp.rank.label} now — level ${chestExp.level}.`
      : `Level up! Level ${chestExp.level}.`;
    playLevelUp();
  }

  // B-LA-KA's secret quest: while active, every Sea Chest opened counts
  // toward the goal — same automatic-completion shape as Richy's and
  // Finn's own quests, just counting chests instead of catches.
  const barnabyQuest = state.quests.barnaby;
  if (barnabyQuest.stage === 'active') {
    barnabyQuest.progress += 1;
    if (barnabyQuest.progress >= barnabyQuest.goal) {
      barnabyQuest.stage = 'complete';
      if (!state.scale.owned.includes('blakaGoldenScale')) state.scale.owned.push('blakaGoldenScale');
      addExp(state, 250);
      questNote = (questNote ? questNote + ' ' : '') + "B-LA-KA's quest complete! His Golden Scale is yours — equip it from your Satchel.";
      playQuestComplete();
    } else {
      questNote = (questNote ? questNote + ' ' : '') + `B-LA-KA's quest: ${barnabyQuest.progress}/${barnabyQuest.goal} Sea Chests opened.`;
    }
  }

  f.state = 'result';
  f.resultTimer = 9;
  f.result = {
    type: 'caught', fish: f.fish, size: 0, value: reward.gold, chest: true, chestBonus: reward.bonus,
    cleanBonus: false, bagFull: false, questNote,
  };
}

// A Message in a Bottle (data/bottles.js) — like a Sea Chest, it bypasses
// the almanac/bag/streak entirely. No mastery or level EXP either: this is
// pure flavor with a small finder's fee, not a real catch — except for
// Buried Treasure (data/treasureMap.js), riding along as a small
// independent chance for the bottle to hold a map fragment instead of just
// a note. The payoff fires immediately once the last fragment turns up —
// no separate turn-in, no NPC, just the treasure landing right there.
function resolveBottleCatch(state) {
  const f = state.fishing;
  const gold = rollBottleGold();
  let message = rollBottleMessage();
  state.coins += gold;
  playCoin();

  let questNote = null;
  if (state.mapFragments < MAP_FRAGMENTS_NEEDED && Math.random() < MAP_FRAGMENT_CHANCE) {
    state.mapFragments += 1;
    message = `A torn corner of a map, water-stained but legible. (${state.mapFragments}/${MAP_FRAGMENTS_NEEDED} pieces found)`;
    if (state.mapFragments >= MAP_FRAGMENTS_NEEDED) {
      state.coins += BURIED_TREASURE_GOLD;
      addExp(state, BURIED_TREASURE_EXP);
      questNote = `🗺 The map is complete! Buried treasure — +${BURIED_TREASURE_GOLD}g, +${BURIED_TREASURE_EXP} EXP!`;
      playQuestComplete();
    } else {
      questNote = `🗺 Found a map fragment! (${state.mapFragments}/${MAP_FRAGMENTS_NEEDED})`;
    }
  }

  f.state = 'result';
  f.resultTimer = 9;
  f.result = {
    type: 'caught', fish: f.fish, size: 0, value: gold, bottle: true, bottleMessage: message,
    cleanBonus: false, bagFull: false, questNote,
  };
}

function resolveCatch(state, toast) {
  if (state.fishing.fish.isChest) { resolveChestCatch(state, toast); return; }
  if (state.fishing.fish.isRodScrap) { resolveSalvageCatch(state); return; }
  if (state.fishing.fish.isBottle) { resolveBottleCatch(state); return; }

  const f = state.fishing;
  const fish = f.fish;
  const rarity = rarityOf(fish.rarity);
  const rod = effectiveRodStats(state);

  // Perfect Reel Streak (data/cleanStreak.js) — updates before this catch's
  // own value is computed, so a reel that just extended the streak
  // immediately benefits from the longer streak rather than the next one.
  if (f.cleanReel) {
    state.cleanStreak.current += 1;
    if (state.cleanStreak.current > state.cleanStreak.best) state.cleanStreak.best = state.cleanStreak.current;
  } else {
    state.cleanStreak.current = 0;
  }

  const [minSize, maxSize] = fish.sizeRange;
  const [minMul, maxMul] = rarity.sizeMul;
  let sizeRoll = minSize + Math.random() * (maxSize - minSize);
  const rarityFactor = minMul + Math.random() * (maxMul - minMul);
  sizeRoll *= rarityFactor;
  if (f.cleanReel) sizeRoll *= 1.12;
  sizeRoll *= 1 + (rod.sizeMul || 0);
  sizeRoll = Math.round(sizeRoll * 10) / 10;

  const sizeRatio = clamp((sizeRoll - minSize) / Math.max(0.001, maxSize - minSize), 0, 1.6);
  let value = Math.round(fish.baseValue * rarity.valueMul * (0.65 + sizeRatio * 0.65)
    * (1 + (rod.valueMul || 0)) * (1 + cleanStreakValueMul(state.cleanStreak.current)));

  // A Shiny roll is a second, independent axis of luck (data/mutations.js) —
  // any fish, any rarity, can come up gleaming and worth several times as
  // much. Rolled after the normal size/value math so it's a clean multiplier
  // on top, not a replacement for it. A Radioactive Forge Enchant
  // (data/enchants.js) scales both mutation odds via rod.mutationMult — 1
  // with nothing enchanted, a true no-op.
  const shiny = Math.random() < SHINY_CHANCE * rod.mutationMult;
  if (shiny) {
    sizeRoll = Math.round(sizeRoll * SHINY_SIZE_MULT * 10) / 10;
    value = Math.round(value * SHINY_VALUE_MULT);
  }

  // Giant is its own independent roll (data/mutations.js), leaning harder
  // into size than value — the opposite emphasis of Shiny. Rolled
  // separately from Shiny rather than as an alternative to it, so the two
  // can stack on the same catch.
  const giant = Math.random() < GIANT_CHANCE * rod.mutationMult;
  if (giant) {
    sizeRoll = Math.round(sizeRoll * GIANT_SIZE_MULT * 10) / 10;
    value = Math.round(value * GIANT_VALUE_MULT);
  }

  // First Catch of the Day: the first real fish landed each local calendar
  // day (chests/bottles/scrap don't count — see the early-return dispatch
  // above) doubles its value on top of everything else already rolled,
  // same "stacks last" placement as the Shiny multiplier just above.
  const today = todayBountyKey();
  const firstCatchOfDay = state.firstCatchDay !== today;
  if (firstCatchOfDay) {
    state.firstCatchDay = today;
    value = Math.round(value * 2);
  }

  const entry = state.almanac[fish.id];
  entry.caught = true;
  entry.count += 1;
  if (sizeRoll > entry.biggestSize) entry.biggestSize = sizeRoll;

  // Charted Waters (data/regionMilestones.js) — counts real fish only,
  // toward whichever region you're actually standing in right now.
  const regionId = state.currentRegion;
  state.regionCatchCounts[regionId] = (state.regionCatchCounts[regionId] || 0) + 1;
  if (shiny) {
    entry.shinyCaught = true;
    state.shinyCaughtCount += 1;
  }
  if (giant) {
    entry.giantCaught = true;
    state.giantCaughtCount += 1;
  }
  if (isDeepNight(state.dayNight.time)) {
    state.nightCatchCount += 1;
  }

  state.streak.current += 1;
  if (state.streak.current > state.streak.best) state.streak.best = state.streak.current;

  if (!state.personalBests.biggestOverall || sizeRoll > state.personalBests.biggestOverall.size) {
    state.personalBests.biggestOverall = { fishId: fish.id, name: fish.name, size: sizeRoll };
  }
  if (rarity.rank > state.personalBests.rarestCaughtRank) {
    state.personalBests.rarestCaughtRank = rarity.rank;
    state.personalBests.rarestCaughtId = fish.id;
  }

  const item = { fishId: fish.id, name: fish.name, rarity: fish.rarity, size: sizeRoll, value, shiny, giant };
  const added = addCatchToBag(state, item);
  if (!added && toast) { toast('Bag full! The catch was released — visit the Trading Post.'); playBagFull(); }

  // EXP from the catch itself, scaled by rarity — a Common pays out a
  // trickle, a Secret pays out a small windfall. Quest-completion bonuses
  // (below, and economy.js's completeLucaQuest) stack on top of this, not
  // instead of it.
  let questNote = firstCatchOfDay ? '🌅 First catch of the day — value doubled!' : null;

  // Streak Milestone Buffs (data/streakMilestones.js) — the bonus itself is
  // purely derived from state.streak.current (gameState.js's
  // effectiveRodStats), so the only thing needed here is the one-time
  // announcement the moment the streak passes a new threshold.
  const streakMilestone = STREAK_MILESTONES.find(m => m.threshold === state.streak.current);
  if (streakMilestone) {
    questNote = (questNote ? questNote + ' ' : '') + `🔥 ${state.streak.current}-catch streak! Bonus active until it breaks.`;
  }

  // Perfect Reel Streak — a quieter every-5 announcement rather than every
  // single reel, so it doesn't drown out everything else stacking up here.
  if (f.cleanReel && state.cleanStreak.current > 0 && state.cleanStreak.current % 5 === 0) {
    questNote = (questNote ? questNote + ' ' : '') + `🎯 ${state.cleanStreak.current} perfect reels in a row!`;
  }

  // Charted Waters — announced the instant a region catch count crosses a
  // milestone tier (data/regionMilestones.js).
  const regionMilestone = REGION_MILESTONES.find(m => m.count === state.regionCatchCounts[regionId]);
  if (regionMilestone) {
    const region = regionById(regionId);
    questNote = (questNote ? questNote + ' ' : '') + `🗺 You know ${region.name} well now — +${Math.round(regionMilestone.luck * 100)}% luck fishing here.`;
  }

  // Today's Quarry (data/quarry.js) — a flat bonus the first time this
  // specific species is landed today, on top of whatever it would have
  // earned anyway. One-shot per day, same "claimed" shape as elsewhere.
  if (fish.id === state.quarry.fishId && !state.quarry.claimed) {
    state.quarry.claimed = true;
    state.coins += QUARRY_BONUS_GOLD;
    state.quarryClaimCount = (state.quarryClaimCount || 0) + 1;
    addExp(state, QUARRY_BONUS_EXP);
    questNote = (questNote ? questNote + ' ' : '') + `🎯 Today's Quarry! +${QUARRY_BONUS_GOLD}g, +${QUARRY_BONUS_EXP} EXP.`;
  }

  const catchExp = addExp(state, Math.round((8 + rarity.rank * 14) * rod.expMult));
  if (catchExp.leveledUp) {
    questNote = catchExp.rankedUp
      ? `Level up! ${catchExp.rank.label} now — level ${catchExp.level}.`
      : `Level up! Level ${catchExp.level}.`;
    playLevelUp();
  }

  // Rod Mastery (data/rodMastery.js) — the equipped rod earns its own XP
  // from this same catch, independent of the player's own level.
  const masteryResult = addRodMasteryXp(state, state.rod.equipped, 6 + rarity.rank * 5);
  if (masteryResult) {
    questNote = (questNote ? questNote + ' ' : '') + `${rod.name} reached Mastery Level ${masteryResult.level}!`;
  }

  // Richy's secret quest: while active, every Legendary-or-better catch
  // counts toward the goal — a real fight, matching the Harpoon Chunk's
  // "draws a real fight" pitch. Hitting it sets his Special to
  // UNLIMITED_BAIT_QTY uses directly (a large-but-finite, JSON-safe
  // stand-in for "infinite" — see data/bait.js) — it's never sold, only
  // ever earned this way. This is recorded on the result rather than
  // toasted here directly — main.js's "Caught a ...!" toast fires right
  // after this returns, in the same frame, and would silently clobber a
  // toast raised in here first.
  const quest = state.quests.richy;
  if (quest.stage === 'active' && rarity.rank >= 2) {
    quest.progress += 1;
    if (quest.progress >= quest.goal) {
      quest.stage = 'complete';
      state.bait.owned.wigginsSpecial = UNLIMITED_BAIT_QTY;
      // A flat completion bonus on top of every catch's own EXP — a five-
      // catch quest like this one is a real ask, so it pays out like one.
      addExp(state, 250);
      questNote = (questNote ? questNote + ' ' : '') + "Richy's quest complete! His Special never runs out now — check your Satchel.";
      playQuestComplete();
    } else {
      questNote = (questNote ? questNote + ' ' : '') + `Richy's quest: ${quest.progress}/${quest.goal} legendary-or-better catches.`;
    }
  }

  // Finn's secret quest: while active, every Gargantuan-or-better catch
  // counts toward the goal — same automatic-completion shape as Richy's
  // quest just above, just a heavier ask (his own rod cost that much) for
  // a rod instead of bait.
  const finnQuest = state.quests.finn;
  if (finnQuest.stage === 'active' && rarity.rank >= 4) {
    finnQuest.progress += 1;
    if (finnQuest.progress >= finnQuest.goal) {
      finnQuest.stage = 'complete';
      if (!state.rod.owned.includes('finnOldFaithful')) state.rod.owned.push('finnOldFaithful');
      addExp(state, 300);
      questNote = (questNote ? questNote + ' ' : '') + "Finn's quest complete! Old Faithful is yours — equip it from your Satchel.";
      playQuestComplete();
    } else {
      questNote = (questNote ? questNote + ' ' : '') + `Finn's quest: ${finnQuest.progress}/${finnQuest.goal} gargantuan-or-better catches.`;
    }
  }

  // Luca's quest: while active, every Mythic-or-better fish landed while
  // actually standing in the Abyssal Lands counts as one of the cursed
  // ingredients his cure needs — see data/lucaDialogue.js. Mythic+ (not
  // Abyssal-only) and a short goal (gameState.js) keep this a quick story
  // beat rather than a rare-fish grind. Hitting the goal hands off to
  // Grizelda (ui/witchShopPanel.js's craftCleansingRune) instead of
  // resolving anything here directly.
  const lucaQuest = state.quests.luca;
  if (lucaQuest.stage === 'active' && state.currentRegion === 'abyssalLands' && rarity.rank >= 3) {
    lucaQuest.progress += 1;
    if (lucaQuest.progress >= lucaQuest.goal) {
      lucaQuest.stage = 'ingredientsReady';
      questNote = (questNote ? questNote + ' ' : '') + "That's every ingredient Luca's cure needs — Grizelda can carve the rune now.";
    } else {
      questNote = (questNote ? questNote + ' ' : '') + `A cursed ingredient for Luca's cure (${lucaQuest.progress}/${lucaQuest.goal}).`;
    }
  }

  // Daily Bounty board (data/bounties.js) — every catch's rarity is checked
  // against the day's three targets, same automatic-completion pattern as
  // Richy's and Luca's quests just above.
  const bountyMessages = registerBountyProgress(state, fish.rarity);
  if (bountyMessages.length) {
    questNote = (questNote ? questNote + ' ' : '') + bountyMessages.join(' ');
  }

  f.state = 'result';
  f.resultTimer = 9;
  f.result = { type: 'caught', fish, size: sizeRoll, value, shiny, giant, firstCatch: firstCatchOfDay, cleanBonus: f.cleanReel, bagFull: !added, questNote };
  playCatch(rarity.rank);
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
