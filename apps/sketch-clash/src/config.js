export const TAU = Math.PI * 2;

// The soldier is drawn from "art" coordinates (a 92x82 reference sprite,
// origin at the body centre) and scaled to the board by K.
export const K = 0.62;
export const PIVOT = { x: 7 * K, y: 12 * K }; // where the rifle swings from, facing right
export const MUZZLE_LEN = 38 * K; // pivot to the end of the barrel
export const FEET = 25 * K; // ground contact, below the body centre

// Team battle only: a team is shown by a coloured circle under the feet,
// never by recolouring the unit itself.
export const TEAMS = {
  red: { id: 'red', label: 'Red', ring: '#ef4444', ringDark: '#b42323' },
  blue: { id: 'blue', label: 'Blue', ring: '#2f6bf0', ringDark: '#1f46a8' },
};

export const SPECIES = {
  soldier: { id: 'soldier', label: 'Soldier' },
};

// A mid-range skirmisher: walks toward the enemy while firing short rifle
// bursts, no setup delay. Distances are CSS pixels, times are seconds.
export const SOLDIER = {
  hp: 100,
  radius: 11,
  sep: 15,
  speed: 46,
  sight: 360,
  range: 290,
  holdDist: 120,
  burst: 3,
  burstGap: 0.1,
  cooldownMin: 0.9,
  cooldownMax: 1.7,
  damage: 20,
  bulletSpeed: 640,
  bulletRange: 380,
  spread: 0.06,
};
