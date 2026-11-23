export const TAU = Math.PI * 2;

// Units are drawn from "art" coordinates (a ~92x82 reference sprite,
// origin at the body centre) and scaled to the board by K.
export const K = 0.37;
// Sizes below were tuned at K = 0.62; UNIT rescales them with the sprite.
export const UNIT = K / 0.62;
// Pixel distances below were tuned when units were bigger (K = 0.56).
const R = K / 0.56;
export const PIVOT = { x: 7 * K, y: 12 * K }; // where the soldier's rifle swings from, facing right
export const MUZZLE_LEN = 38 * K; // pivot to the end of the barrel
export const FEET = 25 * K; // ground contact, below the body centre

// Standing around, a soldier faces the viewer with the rifle held upright
// at their side and their eyes wandering; it swings down to aim at a target.
export const IDLE_PIVOT = { x: 12 * K, y: 12 * K };
export const IDLE_AIM = -1.14;
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
  kind: 'rifle',
  hp: 100,
  radius: 11 * UNIT,
  sep: 13 * UNIT,
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
  kind: 'sniper',
  hp: 100,
  radius: 11 * UNIT,
  sep: 13 * UNIT,
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
  pivot: { x: 7.8 * K, y: 14.3 * K },
  muzzleLen: 45 * K,
  // lying down: the whole body points at the target
  prone: { cy: 12 * K, mx: 52 * K, my: 6.4 * K },
};

const BODY = { radius: 11 * UNIT, sep: 13 * UNIT };

// Sprays a cone of fire at close range and sets whatever it touches alight.
export const FLAMETHROWER = {
  kind: 'flame',
  hp: 130,
  ...BODY,
  speed: 42,
  sight: 280,
  range: 100 * R,
  holdDist: 64 * R,
  dps: 62,
  cone: 0.36,
  burnTime: 2.6,
  burnDps: 9,
  onTime: 1.7,
  offTime: 0.7,
  pivot: { x: 8 * K, y: 11 * K },
  muzzleLen: 46 * K,
};

// Walks up to melee range, shield up (it blunts bullets and arrows), and
// jabs with a long spear.
export const ROMAN = {
  kind: 'melee',
  hp: 180,
  ...BODY,
  speed: 44,
  sight: 320,
  reach: 36 * R,
  damage: 30,
  atkTime: 0.45,
  cooldownMin: 0.7,
  cooldownMax: 1.1,
  armor: 0.5,
  formation: true, // painted Romans snap into a rectangular block and march as one
  weapon: 'spear',
  pivot: { x: 4 * K, y: 12 * K },
};

// Lobs bombs in a high arc; a blast knocks units back and sends the
// helmets of the fallen flying.
export const GRENADIER = {
  kind: 'grenade',
  hp: 95,
  ...BODY,
  speed: 34,
  sight: 360,
  range: 270,
  minRange: 70 * R,
  holdDist: 150,
  damage: 52,
  blastRadius: 36,
  cooldownMin: 2.1,
  cooldownMax: 3.1,
  throwTime: 0.4,
  pivot: { x: 17 * K, y: 14 * K },
};

// Stays well back and shoots arcing arrows that stick in the ground.
export const ARCHER = {
  kind: 'archer',
  hp: 75,
  ...BODY,
  speed: 38,
  sight: 540,
  range: 440,
  minRange: 70 * R,
  holdDist: 260,
  drawTime: 0.5,
  cooldownMin: 0.6,
  cooldownMax: 1.1,
  damage: 27,
  arrowSpeed: 380,
  pivot: { x: 13 * K, y: 3 * K },
  muzzleLen: 14 * K,
};

// Fast charge with a long lance; when the horse goes down the rider gets
// up as a knight.
export const CAVALRY = {
  kind: 'cavalry',
  hp: 170,
  radius: 13 * UNIT,
  sep: 18 * UNIT,
  speed: 100,
  sight: 500,
  reach: 50 * R,
  damage: 36,
  cooldown: 0.8,
  retreat: 0.6,
  becomes: 'knight',
  pivot: { x: 8 * K, y: -15 * K },
};

export const KNIGHT = {
  kind: 'melee',
  faction: 'cavalry',
  hp: 75,
  ...BODY,
  speed: 46,
  sight: 320,
  reach: 44 * R,
  damage: 20,
  atkTime: 0.4,
  cooldownMin: 0.7,
  cooldownMax: 1,
  weapon: 'lance',
  pivot: { x: 4 * K, y: 12 * K },
};

// A blur of quick katana cuts.
export const NINJA = {
  kind: 'melee',
  hp: 85,
  ...BODY,
  speed: 96,
  sight: 400,
  reach: 26 * R,
  damage: 12,
  atkTime: 0.2,
  cooldownMin: 0.2,
  cooldownMax: 0.32,
  strafe: 34,
  weapon: 'katana',
  // throws spinning stars while closing in, then cuts up close
  star: { range: 170 * R, cooldownMin: 1.0, cooldownMax: 1.8, damage: 9, speed: 330 },
  smoke: true,
  pivot: { x: 4 * K, y: 12 * K },
};

// `faction` decides who fights whom in free-for-all (defaults to the
// species itself); a knight is the same faction as the cavalry.
export const SPECIES = {
  soldier: { id: 'soldier', label: 'Soldier', def: SOLDIER },
  flamethrower: { id: 'flamethrower', label: 'Flamethrower', def: FLAMETHROWER },
  sniper: { id: 'sniper', label: 'Sniper', def: SNIPER },
  roman: { id: 'roman', label: 'Roman', def: ROMAN },
  grenadier: { id: 'grenadier', label: 'Grenadier', def: GRENADIER },
  archer: { id: 'archer', label: 'Archer', def: ARCHER },
  cavalry: { id: 'cavalry', label: 'Cavalry', def: CAVALRY },
  ninja: { id: 'ninja', label: 'Ninja', def: NINJA },
  knight: { id: 'knight', label: 'Knight', def: KNIGHT },
};
// The order of the palette (the knight only ever comes from a cavalry).
export const PALETTE_ORDER = ['soldier', 'flamethrower', 'sniper', 'roman', 'grenadier', 'archer', 'cavalry', 'ninja'];
export const SPECIES_ORDER = [...PALETTE_ORDER, 'knight'];
