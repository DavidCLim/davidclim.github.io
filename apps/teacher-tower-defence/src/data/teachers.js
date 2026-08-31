// The teachers — these are the enemies. Two of your real teachers get a
// letter-code cameo (T and its boss-tier Awakened form, K, P), rounded out
// by two generic hallway-monitor types that make up most of a wave's
// filler. `hp`/`speed`/`reward` are wave-1 baselines; data/waves.js scales
// them up per wave rather than this file needing a table per wave.
export const TEACHERS = {
  random1: {
    id: 'random1', name: 'Random Teacher', color: '#8a8f92', glow: '#d6d9db',
    hp: 22, speed: 95, reward: 3, size: 16, damage: 1,
  },
  random2: {
    id: 'random2', name: 'Random Teacher', color: '#7a8a6a', glow: '#d4e0b8',
    hp: 28, speed: 85, reward: 3, size: 17, damage: 1,
  },
  p: {
    id: 'p', name: 'P', color: '#ff8a4c', glow: '#ffd8ba',
    hp: 55, speed: 100, reward: 8, size: 18, damage: 1, evasive: 0.18,
  },
  k: {
    id: 'k', name: 'K', color: '#8a7a6a', glow: '#e0d4c4',
    hp: 170, speed: 48, reward: 15, size: 30, damage: 2,
  },
  t: {
    id: 't', name: 'T', color: '#5fd0ff', glow: '#bdf1ff',
    hp: 90, speed: 78, reward: 10, size: 20, damage: 2,
  },
  t_awakened: {
    id: 't_awakened', name: 'T (Awakened)', color: '#ff2050', glow: '#ff8fa8',
    hp: 900, speed: 55, reward: 60, size: 40, damage: 5, boss: true,
  },
};

export const TEACHER_LIST = Object.values(TEACHERS);
