// The full student roster — these are what you place on a map to fight
// off the teachers. Every unit is defined by a level-0 base stat block;
// mkLevels() derives two upgrade tiers from it the same way the old
// single-archetype tower file did, so 27 units only need 27 hand-tuned
// base blocks instead of 81.
export const RARITY = {
  common: { id: 'common', label: 'Common', order: 0, color: '#9aa0a6', glow: '#e3e6ea' },
  rare: { id: 'rare', label: 'Rare', order: 1, color: '#5fd0ff', glow: '#bdf1ff' },
  epic: { id: 'epic', label: 'Epic', order: 2, color: '#c896ff', glow: '#ecd6ff' },
  legend: { id: 'legend', label: 'Legend', order: 3, color: '#ffb454', glow: '#ffe6b0' },
  mythic: { id: 'mythic', label: 'Mythic', order: 4, color: '#ff6f59', glow: '#ffc4b8' },
};
export const RARITY_ORDER = ['common', 'rare', 'epic', 'legend', 'mythic'];

function mkLevels(cost, damage, range, fireRate) {
  return [
    { damage, range, fireRate, cost: 0 },
    { damage: Math.round(damage * 1.55), range: Math.round(range * 1.08), fireRate: +(fireRate * 1.12).toFixed(2), cost: Math.round(cost * 1.15) },
    { damage: Math.round(damage * 2.4), range: Math.round(range * 1.18), fireRate: +(fireRate * 1.25).toFixed(2), cost: Math.round(cost * 2.1) },
  ];
}

function unit(def) {
  const { cost, damage, range, fireRate } = def;
  return { ...def, levels: mkLevels(cost, damage, range, fireRate) };
}

// Scoped down to just two units for now, while the roster's design gets
// nailed down — the other 25 units are cut from the active roster, not
// deleted from history. To bring the full roster back later, restore
// this file from git history before this change.
export const UNITS = {
  // The free unit everyone begins with — not in the Gacha pool at all
  // (notRollable), so pulling never just hands you a duplicate of the
  // thing you already started with.
  starter_student: unit({
    id: 'starter_student', name: 'Starter Student', rarity: 'common', icon: '🎒',
    desc: 'Everyone starts somewhere — a plain, reliable punch to the face.',
    color: '#f5f1e4', glow: '#ffffff', accent: '#1b6b3a', cost: 20, damage: 5, range: 28, fireRate: 1.2, melee: true,
    notRollable: true,
  }),
  // The only unit actually in the Common pool right now.
  sixseven_kid: unit({
    id: 'sixseven_kid', name: 'The 6-7 Kid', rarity: 'common', icon: '6️⃣7️⃣',
    desc: 'A kid following the "latest" trends. Seems to be "slightly" addicted to these two numbers.',
    color: '#fff3d6', glow: '#ffe066', accent: '#e8482c', cost: 20, damage: 5, range: 10, fireRate: 1.2, melee: true,
    hp: 90, gesture: 'raise',
  }),
};

export const UNIT_LIST = Object.values(UNITS);

export function unitLevelStats(unitId, level) {
  const u = UNITS[unitId];
  return { ...u, ...u.levels[Math.min(level, u.levels.length - 1)] };
}
