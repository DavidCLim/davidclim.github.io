// Procedural wave composition — count and variety both scale with the wave
// number, T (Awakened) rides in as a boss on every 5th wave, and stats
// scale globally via statScaleForWave rather than needing a separate stat
// table per wave.
export const TOTAL_WAVES = 15;

// Regular pool unlocks one new teacher every wave or two, so wave 1 isn't
// already throwing the full staff room at the player.
const REGULAR_POOL = ['random1', 'random2', 'p', 'k', 't'];
const UNLOCK_WAVE = { random1: 1, random2: 2, p: 3, k: 4, t: 6 };

export function buildWaveSpawns(wave) {
  const spawns = [];
  const pool = REGULAR_POOL.filter(id => wave >= UNLOCK_WAVE[id]);
  const count = 8 + Math.floor(wave * 2);

  for (let i = 0; i < count; i++) {
    const id = pool[Math.floor(Math.random() * pool.length)];
    spawns.push({ id, delay: i * 0.45 });
  }
  if (wave % 5 === 0) {
    spawns.push({ id: 't_awakened', delay: spawns.length * 0.45 + 1.5 });
  }
  return spawns;
}

export function statScaleForWave(wave) {
  return {
    hpMul: 1 + (wave - 1) * 0.22,
    speedMul: 1 + Math.min(0.5, (wave - 1) * 0.025),
    rewardMul: 1 + (wave - 1) * 0.05,
  };
}
