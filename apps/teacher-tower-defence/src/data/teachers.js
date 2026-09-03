// The teachers — these are the enemies. Two of your real teachers get a
// letter-code cameo (T and its boss-tier Awakened form, K, P), rounded out
// by two generic hallway-monitor types that make up most of a wave's
// filler. `hp`/`speed`/`reward` are wave-1 baselines; data/waves.js scales
// them up per wave rather than this file needing a table per wave.
export const TEACHERS = {
  random1: {
    id: 'random1', name: 'Random Teacher', color: '#8a8f92', glow: '#d6d9db',
    hp: 22, speed: 95, reward: 3, size: 16, damage: 1, range: 10,
    desc: 'A Teacher. The base species of Docens Stultus. Seemingly weak, but still capable of defeating weaker students.',
  },
  random2: {
    id: 'random2', name: 'Random Teacher', color: '#7a8a6a', glow: '#d4e0b8',
    hp: 28, speed: 85, reward: 3, size: 17, damage: 1, range: 10,
    desc: 'A Teacher. The base species of Docens Stultus. Seemingly weak, but still capable of defeating weaker students.',
  },
  p: {
    id: 'p', name: 'P', color: '#ff8a4c', glow: '#ffd8ba',
    hp: 55, speed: 100, reward: 8, size: 18, damage: 1, evasive: 0.18, range: 10,
    desc: 'Docens Stultus Agilis. Quick on their feet and hard to pin down — known to dodge a well-aimed worksheet entirely.',
  },
  k: {
    id: 'k', name: 'K', color: '#8a7a6a', glow: '#e0d4c4',
    hp: 170, speed: 48, reward: 15, size: 30, damage: 2, range: 10,
    desc: 'Docens Stultus Fortis. Slow, heavily set, and hard to put down — makes up for its speed with sheer stubbornness.',
  },
  t: {
    id: 't', name: 'T', color: '#5fd0ff', glow: '#bdf1ff',
    hp: 90, speed: 78, reward: 10, size: 20, damage: 2, range: 10,
    desc: 'Docens Stultus Doctus. A well-rounded specimen — no glaring weaknesses, no particular mercy either.',
  },
  t_awakened: {
    id: 't_awakened', name: 'T (Awakened)', color: '#ff2050', glow: '#ff8fa8',
    hp: 900, speed: 55, reward: 60, size: 40, damage: 5, boss: true, range: 12,
    desc: 'Docens Stultus Rex. The Awakened form — everything that made T merely difficult, now considerably worse.',
  },
};

export const TEACHER_LIST = Object.values(TEACHERS);
