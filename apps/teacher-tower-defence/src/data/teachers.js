// Tower archetypes — five "teachers," each a distinct cursed technique
// instead of a palette-swapped clone. `levels` holds per-upgrade-level
// stats; level 0 is what you get for `cost`, each further entry is what
// buying the next upgrade tier grants (cost there is the upgrade price,
// not cumulative).
export const TEACHERS = {
  substitute: {
    id: 'substitute',
    name: 'Substitute Teacher',
    title: 'Photocopy Barrage',
    desc: 'Cheap and fast — flings stapled worksheets at anything that gets close.',
    color: '#c9d6e3',
    glow: '#eef3f8',
    cost: 50,
    projectileSpeed: 520,
    splash: 0,
    levels: [
      { damage: 8, range: 145, fireRate: 1.6, cost: 0 },
      { damage: 14, range: 160, fireRate: 1.9, cost: 60 },
      { damage: 22, range: 175, fireRate: 2.3, cost: 110 },
    ],
  },
  math: {
    id: 'math',
    name: 'Math Teacher',
    title: 'Numeric Beam',
    desc: 'A piercing beam of pure arithmetic — punches straight through a whole line.',
    color: '#5fd0ff',
    glow: '#bdf1ff',
    cost: 100,
    projectileSpeed: 780,
    splash: 0,
    pierce: 3,
    levels: [
      { damage: 16, range: 190, fireRate: 1.1, cost: 0 },
      { damage: 26, range: 205, fireRate: 1.2, cost: 110 },
      { damage: 40, range: 220, fireRate: 1.4, cost: 190 },
    ],
  },
  gym: {
    id: 'gym',
    name: 'Gym Teacher',
    title: 'Whistle Shockwave',
    desc: 'Short range, brutal payoff — a shockwave that hits everything nearby at once.',
    color: '#ff8a4c',
    glow: '#ffd8ba',
    cost: 150,
    splash: 70,
    melee: true,
    levels: [
      { damage: 22, range: 100, fireRate: 0.9, cost: 0 },
      { damage: 34, range: 110, fireRate: 1.0, cost: 160 },
      { damage: 52, range: 120, fireRate: 1.15, cost: 260 },
    ],
  },
  art: {
    id: 'art',
    name: 'Art Teacher',
    title: 'Paint Splash',
    desc: 'Low damage, high nuisance — every hit slows its target to a crawl.',
    color: '#c896ff',
    glow: '#ecd6ff',
    cost: 120,
    projectileSpeed: 460,
    splash: 40,
    slowMul: 0.5,
    slowDuration: 1.6,
    levels: [
      { damage: 6, range: 155, fireRate: 1.3, cost: 0 },
      { damage: 10, range: 170, fireRate: 1.4, cost: 130 },
      { damage: 15, range: 185, fireRate: 1.6, cost: 210 },
    ],
  },
  principal: {
    id: 'principal',
    name: 'The Principal',
    title: 'Expulsion Domain',
    desc: 'One per campus. Periodically drops a massive domain of pure authority on everything in range.',
    color: '#ffd670',
    glow: '#fff6da',
    cost: 400,
    splash: 999,
    domain: true,
    maxCount: 1,
    levels: [
      { damage: 90, range: 260, fireRate: 0.32, cost: 0 },
      { damage: 140, range: 280, fireRate: 0.4, cost: 380 },
      { damage: 220, range: 300, fireRate: 0.5, cost: 600 },
    ],
  },
};

export const TEACHER_LIST = Object.values(TEACHERS);

export function teacherLevelStats(teacherId, level) {
  const t = TEACHERS[teacherId];
  return { ...t, ...t.levels[Math.min(level, t.levels.length - 1)] };
}
