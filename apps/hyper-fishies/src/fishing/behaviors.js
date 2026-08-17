// Reel-fight behavior archetypes. Each returns a per-frame "pull" value
// (positive = fish pulling away / distance increasing) given elapsed fight time.
// Pull is later scaled by rarity and combined with player reel input.

function noise(seed) {
  // cheap deterministic-ish pseudo noise from a running phase
  return Math.sin(seed * 12.9898) * 43758.5453 % 1;
}

export const BEHAVIORS = {
  steady: {
    label: 'Steady',
    pull(t, rng) {
      return 18 + Math.sin(t * 1.6) * 6;
    },
  },
  erratic: {
    label: 'Erratic',
    pull(t, rng) {
      const dart = (rng() - 0.5) * 60;
      return 20 + Math.sin(t * 3.1) * 10 + dart;
    },
  },
  resting: {
    label: 'Resting',
    pull(t, rng) {
      const cyclePos = (t % 4.5);
      if (cyclePos > 3.2) return 4 + Math.sin(t * 2) * 3; // resting phase, weak pull
      return 22 + Math.sin(t * 2.2) * 8;
    },
  },
  sprinter: {
    label: 'Sprinter',
    pull(t, rng) {
      const cyclePos = (t % 3.0);
      if (cyclePos < 0.6) return 55 + rng() * 20; // sprint burst
      return 14 + Math.sin(t * 1.8) * 5;
    },
  },
};

export function behaviorFor(id) {
  return BEHAVIORS[id] || BEHAVIORS.steady;
}

// Simple mulberry32 PRNG so fights are reproducible-ish per-fight if seeded, but
// we just use Math.random by default via this wrapper.
export function makeRng(seed) {
  let s = seed >>> 0;
  return function () {
    s |= 0; s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
