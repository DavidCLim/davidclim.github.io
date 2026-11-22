export const TAU = Math.PI * 2;

// Units are drawn from "art" coordinates (a ~92x82 reference sprite,
// origin at the body centre) and scaled to the board by K.
export const K = 0.56;
// Sizes below were tuned at K = 0.62; UNIT rescales them with the sprite.
export const UNIT = K / 0.62;
export const PIVOT = { x: 7 * K, y: 12 * K }; // where the soldier's rifle swings from, facing right
export const MUZZLE_LEN = 38 * K; // pivot to the end of the barrel
export const FEET = 25 * K; // ground contact, below the body centre

// Standing around, a soldier faces the viewer with the rifle held upright
// at their side and their eyes wandering; it swings down to aim at a target.
export const IDLE_PIVOT = { x: -9 * K, y: 13 * K };
export const IDLE_AIM = -1.48;
// How often each gaze is picked while idle: right, up, up-left, up-right, left.
export const GAZE_WEIGHTS = [0.1, 0.4, 0.2, 0.2, 0.1];

// Team battle only: a team is shown by a coloured circle under the feet,
// never by recolouring the unit itself.
export const TEAMS = {
  red: { id: 'red', label: 'Red', ring: '#ef4444', ringDark: '#b42323' },
  blue: { id: 'blue', label: 'Blue', ring: '#2f6bf0', ringDark: '#1f46a8' },
};

// A mid-range skirmisher: walks toward the enemy while firing short rifle
// bursts, no setup delay. Distances are CSS pixels, times are seconds.
export const SOLDIER = {
  hp: 100,
  radius: 11 * UNIT,
  sep: 15 * UNIT,
  speed: 44,
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
  pivot: PIVOT,
  muzzleLen: MUZZLE_LEN,
};

// Walks until an enemy is inside its very long range, then drops prone,
// paints a red laser on the target and fires one near-instant shot that
// punches through a second enemy. If someone gets close it stands up and
// hip-fires instead.
export const SNIPER = {
  hp: 100,
  radius: 11 * UNIT,
  sep: 15 * UNIT,
  speed: 36,
  sight: 560,
  range: 520,
  closeDist: 150,
  dropTime: 0.5,
  riseTime: 0.4,
  aimTime: 0.7,
  cooldownMin: 1.7,
  cooldownMax: 2.6,
  damage: 100,
  pierce: 2,
  spread: 0.008,
  hipCooldown: 1.3,
  hipDamage: 34,
  pivot: { x: 9 * K, y: 13 * K },
  muzzleLen: 44 * K,
  // lying down: the whole body points at the target
  prone: { cy: 12 * K, mx: 52 * K, my: 6.4 * K },
};

export const SPECIES = {
  soldier: { id: 'soldier', label: 'Soldier', def: SOLDIER },
  sniper: { id: 'sniper', label: 'Sniper', def: SNIPER },
};
export const SPECIES_ORDER = ['soldier', 'sniper'];
