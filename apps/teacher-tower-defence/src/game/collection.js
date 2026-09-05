// The player's persistent progress across visits — gold, owned students
// (with duplicate counts), awaken stars, and the 5-slot equip loadout.
// Saved to localStorage since a gacha collection that resets on every
// reload would defeat the entire point of the Gacha Hall.
import { UNITS, UNIT_LIST } from '../data/units.js';
import { MAP_LIST, MAPS } from '../data/maps.js';

const STORAGE_KEY = 'ttd-collection-v1';
const STARTING_GOLD = 300;

export function loadCollection() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const p = JSON.parse(raw);
      return {
        gold: typeof p.gold === 'number' ? p.gold : STARTING_GOLD,
        owned: p.owned || {},
        stars: p.stars || {},
        equipped: Array.isArray(p.equipped) ? p.equipped : [],
        crystals: p.crystals || {},
        clearedChapters: Array.isArray(p.clearedChapters) ? p.clearedChapters : [],
      };
    }
  } catch { /* corrupt/absent save, fall through to a fresh one */ }
  return { gold: STARTING_GOLD, owned: { starter_student: 1 }, stars: {}, equipped: ['starter_student'], crystals: {}, clearedChapters: [] };
}

export function saveCollection(c) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(c)); } catch { /* storage unavailable */ }
}

// ---------- Gacha ----------
const RATE_STANDARD = { common: 0.55, rare: 0.30, epic: 0.10, legend: 0.01, mythic: 0.001 };

export const BANNERS = {
  standard: { id: 'standard', name: 'Normal', desc: 'The full roster — every rarity is in the pool.', rates: RATE_STANDARD },
};
export const BANNER_LIST = Object.values(BANNERS);

function poolForBanner(banner) {
  const rarities = Object.keys(banner.rates);
  // notRollable units (the free starter) never come out of the Gacha,
  // even if their rarity is in the pool.
  return UNIT_LIST.filter(u => rarities.includes(u.rarity) && !u.notRollable);
}

function rollRarity(rates) {
  const r = Math.random();
  let acc = 0;
  for (const [rarity, chance] of Object.entries(rates)) {
    acc += chance;
    if (r <= acc) return rarity;
  }
  return Object.keys(rates)[0];
}

const PULL_COSTS = { 1: 100, 5: 400, 10: 800 };
export function pullCost(count) {
  return PULL_COSTS[count] ?? count * 100;
}

export function pullGacha(collection, bannerId, count) {
  const banner = BANNERS[bannerId];
  const cost = pullCost(count);
  if (collection.gold < cost) return null;
  collection.gold -= cost;
  const pool = poolForBanner(banner);
  const results = [];
  for (let i = 0; i < count; i++) {
    const rarity = rollRarity(banner.rates);
    const rarityChoices = pool.filter(u => u.rarity === rarity);
    const choices = rarityChoices.length ? rarityChoices : pool;
    const unit = choices[Math.floor(Math.random() * choices.length)];
    collection.owned[unit.id] = (collection.owned[unit.id] || 0) + 1;
    results.push(unit);
  }
  saveCollection(collection);
  return results;
}

// ---------- Chapters (replayable stages, unlocked in order) ----------
// Chapter 1 is always open; chapter N+1 unlocks once chapter N has been
// cleared at least once — same as Empire of Cats. A cleared chapter
// stays replayable forever after, and every clear (not just the first)
// drops that chapter's own awaken crystal, so farming a chapter for
// crystals is the whole point of replaying it.
export function isChapterUnlocked(collection, mapId) {
  const idx = MAP_LIST.findIndex(m => m.id === mapId);
  if (idx <= 0) return true;
  return collection.clearedChapters.includes(MAP_LIST[idx - 1].id);
}

export function clearChapter(collection, mapId) {
  const map = MAPS[mapId];
  if (!map) return;
  if (!collection.clearedChapters.includes(mapId)) collection.clearedChapters.push(mapId);
  if (map.crystal) collection.crystals[map.crystal.id] = (collection.crystals[map.crystal.id] || 0) + 1;
  saveCollection(collection);
}

// ---------- Awaken (spend a chapter's crystal + gold for permanent star
// bonuses) — which crystal a unit needs is set per-unit via
// unit.awakenCrystal (a map id), matching the player's own "different
// chapters give different crystals for different awakenings" design. ----------
export const MAX_STARS = 3;
const AWAKEN_CRYSTAL_COST = [2, 3, 4];
const AWAKEN_GOLD_COST = [40, 90, 180];

export function awakenCostFor(unitId, collection) {
  const star = collection.stars[unitId] || 0;
  if (star >= MAX_STARS) return null;
  const def = UNITS[unitId];
  const map = MAPS[def.awakenCrystal];
  return {
    star,
    gold: AWAKEN_GOLD_COST[star],
    crystalsNeeded: AWAKEN_CRYSTAL_COST[star],
    crystalId: map.crystal.id,
    crystalName: map.crystal.name,
    crystalIcon: map.crystal.icon,
    chapterName: map.name,
  };
}

export function canAwaken(collection, unitId) {
  const info = awakenCostFor(unitId, collection);
  if (!info) return false;
  const have = collection.crystals[info.crystalId] || 0;
  return have >= info.crystalsNeeded && collection.gold >= info.gold;
}

export function awakenUnit(collection, unitId) {
  if (!canAwaken(collection, unitId)) return false;
  const info = awakenCostFor(unitId, collection);
  collection.crystals[info.crystalId] -= info.crystalsNeeded;
  collection.gold -= info.gold;
  collection.stars[unitId] = info.star + 1;
  saveCollection(collection);
  return true;
}

export function starMultiplier(stars) {
  return 1 + (stars || 0) * 0.15;
}

// ---------- Equip loadout ----------
export const MAX_EQUIPPED = 5;

export function toggleEquip(collection, unitId) {
  const idx = collection.equipped.indexOf(unitId);
  if (idx >= 0) {
    collection.equipped.splice(idx, 1);
  } else {
    if (collection.equipped.length >= MAX_EQUIPPED) return false;
    if (!(collection.owned[unitId] > 0)) return false;
    collection.equipped.push(unitId);
  }
  saveCollection(collection);
  return true;
}
