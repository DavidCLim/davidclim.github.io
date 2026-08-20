// Procedural wave composition instead of 15 hand-written lists — count and
// variety both scale with the wave number, a boss (data/enemies.js's
// `finalexam`) rides in on every 5th wave, and stats scale globally via
// statScaleForWave rather than needing a separate stat table per wave.
export const TOTAL_WAVES = 15;

// Regular pool unlocks one new enemy type every wave or two, so wave 1
// isn't already throwing the full roster at the player.
const REGULAR_POOL = ['popquiz', 'lateslip', 'truant', 'detention'];
const UNLOCK_WAVE = { popquiz: 1, lateslip: 2, truant: 3, detention: 4 };

export function buildWaveSpawns(wave) {
  const spawns = [];
  const pool = REGULAR_POOL.filter(id => wave >= UNLOCK_WAVE[id]);
  const count = 6 + Math.floor(wave * 1.6);

  for (let i = 0; i < count; i++) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    spawns.push({ id, delay: i * 0.55 });
  }
  if (wave % 5 === 0) {
    spawns.push({ id: 'finalexam', delay: spawns.length * 0.55 + 1.5 });
  }
  return spawns;
}

export function statScaleForWave(wave) {
  return {
    hpMul: 1 + (wave - 1) * 0.16,
    speedMul: 1 + Math.min(0.35, (wave - 1) * 0.015),
    rewardMul: 1 + (wave - 1) * 0.05,
  };
}
