// Enemy archetypes — cursed homework given legs. `hp`/`speed`/`reward`
// are wave-1 baselines; data/waves.js scales them up per wave rather than
// this file needing a whole table per wave.
export const ENEMIES = {
  popquiz: {
    id: 'popquiz',
    name: 'Pop Quiz Imp',
    color: '#ff6f6f',
    glow: '#ffc9c9',
    hp: 18,
    speed: 105,
    reward: 3,
    size: 16,
    damage: 1,
  },
  lateslip: {
    id: 'lateslip',
    name: 'Late Slip Wraith',
    color: '#8fe9d9',
    glow: '#d6fff6',
    hp: 34,
    speed: 78,
    reward: 4,
    size: 18,
    damage: 1,
  },
  truant: {
    id: 'truant',
    name: 'Truant Specter',
    color: '#c896ff',
    glow: '#ecd6ff',
    hp: 26,
    speed: 140,
    reward: 5,
    size: 16,
    damage: 1,
    evasive: 0.12,
  },
  detention: {
    id: 'detention',
    name: 'Detention Golem',
    color: '#8a8f92',
    glow: '#d6d9db',
    hp: 110,
    speed: 46,
    reward: 9,
    size: 26,
    damage: 2,
  },
  finalexam: {
    id: 'finalexam',
    name: 'The Final Exam',
    color: '#ff2050',
    glow: '#ff8fa8',
    hp: 900,
    speed: 40,
    reward: 60,
    size: 42,
    damage: 5,
    boss: true,
  },
};

export const ENEMY_LIST = Object.values(ENEMIES);
