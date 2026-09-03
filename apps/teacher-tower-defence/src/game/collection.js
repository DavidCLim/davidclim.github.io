// The player's persistent progress across visits — gold, owned students
// (with duplicate counts), awaken stars, and the 5-slot equip loadout.
// Saved to localStorage since a gacha collection that resets on every
// reload would defeat the entire point of the Gacha Hall.
import { UNITS, UNIT_LIST } from '../data/units.js';

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
      };
    }
  } catch { /* corrupt/absent save, fall through to a fresh one */ }
  return { gold: STARTING_GOLD, owned: { starter_student: 1 }, stars: {}, equipped: ['starter_student'] };
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

// ---------- Awaken (spend dupes + gold for permanent star bonuses) ----------
export const MAX_STARS = 3;
const AWAKEN_DUPE_COST = [2, 3, 4];
const AWAKEN_GOLD_COST = [40, 90, 180];

export function awakenCostFor(unitId, collection) {
  const star = collection.stars[unitId] || 0;
  if (star >= MAX_STARS) return null;
  return { dupesNeeded: AWAKEN_DUPE_COST[star], gold: AWAKEN_GOLD_COST[star], star };
}

export function canAwaken(collection, unitId) {
  const info = awakenCostFor(unitId, collection);
  if (!info) return false;
  const owned = collection.owned[unitId] || 0;
  return owned > info.dupesNeeded && collection.gold >= info.gold;
}

export function awakenUnit(collection, unitId) {
  if (!canAwaken(collection, unitId)) return false;
  const info = awakenCostFor(unitId, collection);
  collection.owned[unitId] -= info.dupesNeeded;
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
