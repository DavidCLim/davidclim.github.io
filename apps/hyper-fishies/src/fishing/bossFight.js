// The Armored Mosasaurus boss encounter: cutscene -> timing-based hit
// minigame -> reward (reusing the normal catch-card via state.fishing) or
// escape. Separate from the normal charging/flying/waiting/hookset/reeling
// pipeline in fishingMachine.js — this is a scripted fight, not a cast.
import { addCatchToBag } from '../economy/economy.js';
import { fishById } from '../data/fish.js';
import { rarityOf } from '../data/rarity.js';

export const BOSS_FISH_ID = 'mosasaurusBoss';

const ARMOR_HITS = 3;       // hits to crack off the fossil armor
const HITS_PER_SEGMENT = 2; // hits to drain one of the 4 red health segments
const SEGMENTS = 4;
export const TOTAL_HITS = ARMOR_HITS + SEGMENTS * HITS_PER_SEGMENT;
const MAX_MISSES = 6;       // consecutive-tolerant miss budget before it flees

// Fixed durations for the three reveal beats before the fight itself.
const PULLING_DURATION = 1.7;
const PULLED_UNDER_DURATION = 0.8;
const REVEAL_MIN_HOLD = 0.7; // reveal keeps playing at least this long before Space can skip it

// Every time a quarter of the health bar goes out, the Bonasaur reels —
// a real-time mash window (a different minigame from the timing hits)
// where landed presses build a meter that converts into bonus damage
// carried into the next quarter once the stun wears off.
const STUN_DURATION = 2.2;
const STUN_MASH_TARGET = 14;
const STUN_MAX_BONUS_HITS = 2;

export function startBossEncounter(state) {
  state.boss = {
    state: 'pulling',
    phaseTimer: 0,
    armorHits: 0,
    segmentHits: 0,
    misses: 0,
    markerPos: 15,
    markerDir: 1,
    markerSpeed: 55,
    zoneStart: 40,
    zoneWidth: 24,
    zoneTimer: 0,
    // Trap zone(s): decoy zones that show up once the armor is cracked —
    // pressing while the marker is inside one always counts as a bad hit,
    // even if it happens to overlap the real zone's edge. A second trap
    // starts appearing late in the fight for an extra layer to track.
    trapActive: false,
    trapStart: 0,
    trapWidth: 0,
    trap2Active: false,
    trap2Start: 0,
    trap2Width: 0,
    // Consecutive real hits without a miss — climbs the marker speed
    // reward/risk curve and unlocks the double-trap pattern.
    combo: 0,
    // Surge: every few seconds the marker's direction flips without
    // warning (on top of the normal end-to-end bounce), so the rhythm
    // can't just be memorized.
    surgeTimer: 3 + Math.random() * 2,
    // Stun mash window, entered after each quarter of health is drained.
    stunTimer: 0,
    stunMeter: 0,
    stunMashes: 0,
    hitFlash: 0,
    missFlash: 0,
    shakeT: 0,
    thrashPhase: 0,
  };
}

export function updateBossFight(state, dt, actionEdge, toast) {
  const b = state.boss;
  if (!b || b.state === 'idle') return;

  b.thrashPhase += dt;
  if (b.hitFlash > 0) b.hitFlash = Math.max(0, b.hitFlash - dt * 2.5);
  if (b.missFlash > 0) b.missFlash = Math.max(0, b.missFlash - dt * 2.5);
  if (b.shakeT > 0) b.shakeT = Math.max(0, b.shakeT - dt * 2.5);

  // ---- The three-beat reveal: strain -> pulled under -> mosasaurus bursts up ----
  if (b.state === 'pulling') {
    b.phaseTimer += dt;
    if (b.phaseTimer >= PULLING_DURATION) { b.state = 'pulledUnder'; b.phaseTimer = 0; }
    return;
  }
  if (b.state === 'pulledUnder') {
    b.phaseTimer += dt;
    if (b.phaseTimer >= PULLED_UNDER_DURATION) { b.state = 'reveal'; b.phaseTimer = 0; }
    return;
  }
  if (b.state === 'reveal') {
    b.phaseTimer += dt;
    if (actionEdge && b.phaseTimer > REVEAL_MIN_HOLD) b.state = 'fighting';
    return;
  }

  // ---- Stunned: a real-time mash window, not the timing-hit minigame —
  // every press fills the meter a little; how full it is when the stun
  // wears off decides the bonus damage carried into the next quarter. ----
  if (b.state === 'stunned') {
    b.stunTimer += dt;
    if (actionEdge) {
      b.stunMashes += 1;
      b.stunMeter = Math.min(100, b.stunMeter + 100 / STUN_MASH_TARGET);
      b.hitFlash = 0.6;
    }
    if (b.stunTimer >= STUN_DURATION) {
      resolveStunEnd(state, toast);
    }
    return;
  }

  if (b.state !== 'fighting') return;

  b.markerPos += b.markerDir * b.markerSpeed * dt;
  if (b.markerPos >= 100) { b.markerPos = 100; b.markerDir = -1; }
  if (b.markerPos <= 0) { b.markerPos = 0; b.markerDir = 1; }

  // Unpredictable direction surge — independent of the end-to-end bounce.
  b.surgeTimer -= dt;
  if (b.surgeTimer <= 0) {
    b.markerDir *= -1;
    b.surgeTimer = 2.4 + Math.random() * 2.4 - (b.armorHits + b.segmentHits) * 0.06;
  }

  b.zoneTimer += dt;
  if (b.zoneTimer > 2.1) {
    b.zoneTimer = 0;
    const progress = b.armorHits + b.segmentHits;
    b.zoneWidth = Math.max(9, 24 - progress * 1.1);
    b.zoneStart = 4 + Math.random() * (96 - b.zoneWidth - 4);

    // Once the armor's cracked, start throwing in a decoy trap zone that
    // must be dodged rather than hit — the later in the fight, the more
    // likely one shows up. A well-played combo of 3+ unlocks a second,
    // independent trap alongside it — the reward for being good is a
    // harder pattern to read, not just a breather.
    const armorBroken = b.armorHits >= ARMOR_HITS;
    b.trapActive = armorBroken && Math.random() < Math.min(0.75, 0.25 + progress * 0.05);
    if (b.trapActive) {
      b.trapWidth = Math.max(7, 16 - progress * 0.6);
      let tries = 0;
      do {
        b.trapStart = 4 + Math.random() * (96 - b.trapWidth - 4);
        tries += 1;
      } while (tries < 8 && zonesOverlap(b.trapStart, b.trapWidth, b.zoneStart, b.zoneWidth));
    }

    b.trap2Active = b.trapActive && b.combo >= 3 && Math.random() < 0.5;
    if (b.trap2Active) {
      b.trap2Width = Math.max(6, 13 - progress * 0.5);
      let tries = 0;
      do {
        b.trap2Start = 4 + Math.random() * (96 - b.trap2Width - 4);
        tries += 1;
      } while (tries < 10 && (
        zonesOverlap(b.trap2Start, b.trap2Width, b.zoneStart, b.zoneWidth) ||
        zonesOverlap(b.trap2Start, b.trap2Width, b.trapStart, b.trapWidth)
      ));
    }
  }

  if (!actionEdge) return;

  const inTrap = b.trapActive && b.markerPos >= b.trapStart && b.markerPos <= b.trapStart + b.trapWidth;
  const inTrap2 = b.trap2Active && b.markerPos >= b.trap2Start && b.markerPos <= b.trap2Start + b.trap2Width;
  const inZone = b.markerPos >= b.zoneStart && b.markerPos <= b.zoneStart + b.zoneWidth;

  if (inTrap || inTrap2) {
    b.misses += 1;
    b.missFlash = 1;
    b.shakeT = 1;
    b.markerSpeed += 8;
    b.combo = 0;
    if (toast) toast('The Bonasaur thrashes free of a bad strike!');
    if (b.misses >= MAX_MISSES) fleeEncounter(state, toast);
  } else if (inZone) {
    landHit(state, toast);
  } else {
    b.misses += 1;
    b.missFlash = 1;
    b.markerSpeed += 5;
    b.combo = 0;
    if (b.misses >= MAX_MISSES) fleeEncounter(state, toast);
  }
}

function zonesOverlap(aStart, aWidth, bStart, bWidth) {
  return aStart < bStart + bWidth + 3 && bStart < aStart + aWidth + 3;
}

function fleeEncounter(state, toast) {
  if (toast) toast('The Bonasaur dives deep and vanishes! Press Z to find it again.');
  state.boss = { state: 'idle' };
  // We hijacked the "waiting" cast for this fight — with the boss gone,
  // there's no fish left on the line either, so drop back to free-roam
  // instead of leaving a bobber frozen out on the water forever.
  state.fishing = { state: 'idle' };
}

function landHit(state, toast) {
  const b = state.boss;
  b.hitFlash = 1;
  b.markerSpeed += 4;
  b.combo += 1;
  if (b.combo === 3 && toast) toast('Combo x3! The Bonasaur starts throwing double traps!');

  if (b.armorHits < ARMOR_HITS) {
    b.armorHits += 1;
    if (b.armorHits >= ARMOR_HITS && toast) toast('The fossil armor cracks and falls away!');
    return;
  }

  b.segmentHits += 1;
  if (b.segmentHits >= SEGMENTS * HITS_PER_SEGMENT) {
    resolveVictory(state, toast);
    return;
  }
  // A whole quarter just went out (but the fight isn't over) — reel it
  // into the stun mash window instead of continuing straight on.
  if (b.segmentHits % HITS_PER_SEGMENT === 0) {
    b.state = 'stunned';
    b.stunTimer = 0;
    b.stunMeter = 0;
    b.stunMashes = 0;
    if (toast) toast('The Bonasaur reels, stunned! Mash Space to press the advantage!');
  }
}

function resolveStunEnd(state, toast) {
  const b = state.boss;
  const bonusHits = Math.round((b.stunMeter / 100) * STUN_MAX_BONUS_HITS);
  if (bonusHits > 0) {
    b.segmentHits = Math.min(SEGMENTS * HITS_PER_SEGMENT, b.segmentHits + bonusHits);
    if (b.segmentHits >= SEGMENTS * HITS_PER_SEGMENT) { resolveVictory(state, toast); return; }
    if (toast) toast(bonusHits >= STUN_MAX_BONUS_HITS ? 'Perfect follow-up! Extra damage landed!' : 'You landed a follow-up strike!');
  } else if (toast) {
    toast('The Bonasaur shakes off the stun...');
  }
  b.state = 'fighting';
  b.stunMeter = 0;
  b.stunMashes = 0;
  b.markerSpeed = Math.max(50, b.markerSpeed - 10);
  b.zoneTimer = 999; // force a fresh zone/trap roll the moment fighting resumes
}

function resolveVictory(state, toast) {
  const fish = fishById(BOSS_FISH_ID);
  const rarity = rarityOf(fish.rarity);
  const [minSize, maxSize] = fish.sizeRange;
  const size = Math.round((minSize + Math.random() * (maxSize - minSize)) * 10) / 10;
  const sizeRatio = clamp((size - minSize) / Math.max(0.001, maxSize - minSize), 0, 1);
  const value = Math.round(fish.baseValue * rarity.valueMul * (0.85 + sizeRatio * 0.65));

  const entry = state.almanac[fish.id];
  entry.caught = true;
  entry.count += 1;
  if (size > entry.biggestSize) entry.biggestSize = size;

  state.streak.current += 1;
  if (state.streak.current > state.streak.best) state.streak.best = state.streak.current;
  if (!state.personalBests.biggestOverall || size > state.personalBests.biggestOverall.size) {
    state.personalBests.biggestOverall = { fishId: fish.id, name: fish.name, size };
  }
  if (rarity.rank > state.personalBests.rarestCaughtRank) {
    state.personalBests.rarestCaughtRank = rarity.rank;
    state.personalBests.rarestCaughtId = fish.id;
  }

  const item = { fishId: fish.id, name: fish.name, rarity: fish.rarity, size, value };
  const added = addCatchToBag(state, item);
  if (!added && toast) toast('Bag full! The Bonasaur catch was released — visit the Trading Post.');
  if (toast) toast('You defeated the Bonasaur!');

  state.boss = { state: 'idle' };
  // Reuse the existing catch-card UI for the reward reveal instead of
  // building a second one — main.js's loop already drives state.fishing's
  // 'result' state regardless of how it got there.
  state.fishing = {
    state: 'result',
    resultTimer: 9,
    result: { type: 'caught', fish, size, value, cleanBonus: false, bagFull: !added },
  };
}

// UI-facing snapshot: how full each bar should render.
export function bossProgress(state) {
  const b = state.boss;
  if (!b) return null;
  return {
    armorFrac: Math.max(0, 1 - b.armorHits / ARMOR_HITS),
    armorGone: b.armorHits >= ARMOR_HITS,
    segments: Array.from({ length: SEGMENTS }, (_, i) => {
      const doneHits = b.segmentHits - i * HITS_PER_SEGMENT;
      return clamp(doneHits / HITS_PER_SEGMENT, 0, 1);
    }),
    stunned: b.state === 'stunned',
    stunFrac: clamp(b.stunMeter / 100, 0, 1),
    stunTimeLeft: Math.max(0, STUN_DURATION - b.stunTimer),
    combo: b.combo,
  };
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
