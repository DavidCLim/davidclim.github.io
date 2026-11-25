export const TAU = Math.PI * 2;

// Units are drawn from "art" coordinates (a ~92x82 reference sprite,
// origin at the body centre) and scaled to the board by K.
export const K = 0.31;
// Sizes below were tuned at K = 0.62; UNIT rescales them with the sprite.
export const UNIT = K / 0.62;
// Pixel distances below were tuned when units were bigger (K = 0.56).
const R = K / 0.56;
export const PIVOT = { x: 7 * K, y: 12 * K }; // where the soldier's rifle swings from, facing right
export const MUZZLE_LEN = 38 * K; // pivot to the end of the barrel
export const FEET = 25 * K; // ground contact, below the body centre

// Standing around, a soldier faces the viewer with the rifle held upright
// at their side and their eyes wandering; it swings down to aim at a target.
export const IDLE_PIVOT = { x: -19 * K, y: 14 * K };
export const IDLE_AIM = -1.9; // standing around the rifle is held upright against the back, barrel leaning away
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
  sep: 17 * UNIT,
  speed: 71, // about 105 screen px a second, measured off the original
  sight: 360,
  range: 290,
  holdDist: 120,
  kite: 55,
  // one shot at a time, about every 1.7 seconds, as in the original
  burst: 1,
  burstGap: 0.1,
  cooldownMin: 1.4,
  cooldownMax: 2,
  damage: 34,
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
  damage: 50, // four hits kill a Roman in the original
  pierce: 2,
  spread: 0.008,
  hipCooldown: 1.3,
  hipDamage: 34,
  pivot: { x: 7.8 * K, y: 14.3 * K },
  muzzleLen: 45 * K,
  // lying down: the whole body points at the target
  prone: { cy: 12 * K, mx: 52 * K, my: 6.4 * K },
};

const BODY = { radius: 11 * UNIT, sep: 17 * UNIT }; // crowds spread to about 14 screen px between bodies, as in the original

// The flamethrower: a firefighter-style trooper with a fuel tank on his back who hoses a jet of fire.
// Anyone it touches catches fire and keeps burning.
export const FLAMETHROWER = {
  kind: 'flame',
  hp: 120,
  ...BODY,
  speed: 64, // about 95 screen px a second in the original
  sight: 340,
  range: 100,
  holdDist: 90,
  dps: 30,
  cone: 0.32,
  burnTime: 3,
  burnDps: 9,
  onTime: 1.5,
  offTime: 1.1,
  pivot: { x: 8 * K, y: 11 * K },
  muzzleLen: 46 * K,
};

// Walks up to melee range, shield up (it blunts bullets and arrows), and
// jabs with a long spear.
export const ROMAN = {
  kind: 'melee',
  hp: 180, // about ten soldier bullets, counted in the original
  ...BODY,
  speed: 36, // about 58 screen px a second, measured off the original
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
  speed: 57, // about 85 screen px a second in the original
  sight: 360,
  range: 270,
  minRange: 70 * R,
  holdDist: 150,
  damage: 52,
  blastRadius: 22,
  // the original grenadier is slow: a throw roughly every five and a half seconds
  cooldownMin: 4.6,
  cooldownMax: 5.8,
  throwTime: 0.4,
  pivot: { x: 17 * K, y: 14 * K },
};

// Stays well back and shoots arcing arrows that stick in the ground.
export const ARCHER = {
  kind: 'archer',
  hp: 75,
  ...BODY,
  speed: 68, // about 100 screen px a second in the original
  sight: 540,
  range: 270, // they walk up to about 375 screen px from the target before drawing, as in the original
  minRange: 70 * R,
  holdDist: 233,
  drawTime: 1.8,
  cooldownMin: 0.25,
  cooldownMax: 0.6,
  damage: 45, // eight arrows kill a Roman in the original
  arrowSpeed: 380,
  pivot: { x: 13 * K, y: 3 * K },
  muzzleLen: 14 * K,
};

// Fast charge with a long lance; when the horse goes down the rider gets
// up as a knight.
export const CAVALRY = {
  kind: 'cavalry',
  hp: 170,
  radius: 15 * UNIT,
  sep: 21 * UNIT,
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
  // throws stars, then blurs across the gap in a quick dash that leaves a trail of dust
  dash: { speed: 142, min: 80, max: 230, cd: 2.4 }, // the original's ninja dashes at about 225 screen px/s, from about 390 px away until about 120 px from the target
  weapon: 'katana',
  // throws spinning stars while closing in, then cuts up close
  star: { range: 170 * R, cooldownMin: 1.0, cooldownMax: 1.8, damage: 9, speed: 330 },
  smoke: true,
  pivot: { x: 4 * K, y: 12 * K },
};

// A cowboy: takes his time, then fires a single flintlock shot that hits hard
// and leaves a puff of black-powder smoke.
export const COWBOY = {
  kind: 'rifle',
  hp: 120,
  ...BODY,
  speed: 38,
  sight: 380,
  range: 300,
  holdDist: 150,
  burst: 1,
  burstGap: 0.1,
  cooldownMin: 1.1,
  cooldownMax: 1.9,
  damage: 58,
  bulletSpeed: 560,
  bulletRange: 400,
  spread: 0.05,
  smoke: true,
  pivot: { x: 11 * K, y: 16.5 * K },
  muzzleLen: 27 * K,
};


// ------------------------------------------------------------------ the Animals tab
// Beasts all share the `beast` brain (chase, bite, special tricks). `body` is the
// size of the unit's hit-flash / fire overlay in art units; `ring` scales the team ring.
const BEAST = { kind: 'beast', sight: 380, atkTime: 0.28 };

export const BOAR = {
  ...BEAST, hp: 130, radius: 7, sep: 8.5, speed: 58, reach: 11, damage: 24, cooldownMin: 0.9, cooldownMax: 1.3,
  charge: { range: 150, mul: 2.1, knock: 190 }, creature: true, body: [28, 17, 5], ring: 1.35,
};
export const RAT = {
  ...BEAST, hp: 28, radius: 4, sep: 5, speed: 76, reach: 7, damage: 6, cooldownMin: 0.42, cooldownMax: 0.66, atkTime: 0.2,
  creature: true, body: [19, 11, 16], ring: 0.9,
};
export const ANT = {
  ...BEAST, hp: 20, radius: 3.4, sep: 4.4, speed: 94, reach: 6, damage: 5, cooldownMin: 0.34, cooldownMax: 0.5, atkTime: 0.16,
  creature: true, body: [26, 10, 13], ring: 0.85,
};
export const APE = {
  ...BEAST, hp: 280, radius: 8, sep: 10, speed: 38, reach: 15, damage: 40, cooldownMin: 1.3, cooldownMax: 1.8, atkTime: 0.7,
  knock: 160, creature: true, body: [24, 24, 0], ring: 1.2,
};
export const ALLIGATOR = {
  ...BEAST, hp: 200, radius: 8, sep: 11, speed: 32, swim: 2.6, reach: 17, damage: 46, cooldownMin: 1.4, cooldownMax: 2, atkTime: 0.4,
  creature: true, body: [34, 11, 16], ring: 1.6,
};
export const PIRANHA = {
  ...BEAST, hp: 45, radius: 5.5, sep: 7, speed: 104, reach: 8, damage: 11, cooldownMin: 0.36, cooldownMax: 0.5, atkTime: 0.18,
  waterOnly: true, creature: true, body: [24, 17, 9], ring: 1, flop: true,
};
export const SNAKE = {
  ...BEAST, hp: 48, radius: 5, sep: 6.5, speed: 54, reach: 10, damage: 5, cooldownMin: 0.8, cooldownMax: 1.1, atkTime: 0.22,
  poison: { dps: 4.5, time: 5 }, creature: true, body: [30, 8, 19], ring: 1.2,
};
export const CHEETAH = {
  ...BEAST, hp: 85, radius: 7, sep: 8.5, speed: 112, reach: 11, damage: 24, cooldownMin: 0.7, cooldownMax: 1, atkTime: 0.2,
  creature: true, body: [28, 12, 4], ring: 1.4,
};

// ------------------------------------------------------------------ the Mythical tab
export const ZOMBIE = {
  ...BEAST, hp: 105, ...BODY, speed: 27, reach: 11, damage: 13, cooldownMin: 0.8, cooldownMax: 1.1, atkTime: 0.3,
  infects: true, noDrop: true, egg: true,
};
export const SLIME = {
  ...BEAST, hp: 150, radius: 7.5, sep: 9, speed: 30, reach: 11, damage: 11, cooldownMin: 0.9, cooldownMax: 1.3,
  split: true, creature: true, body: [25, 17, 12], ring: 1.3,
};
export const MAGE = {
  kind: 'mage', hp: 72, ...BODY, speed: 33, sight: 400, range: 240, holdDist: 150,
  damage: 20, orbSpeed: 250, slow: 1.8, cooldownMin: 1.4, cooldownMax: 2, castTime: 0.45, egg: true,
};
export const GIANT = {
  ...BEAST, hp: 560, radius: 15, sep: 17, speed: 24, reach: 26, damage: 68, cooldownMin: 1.9, cooldownMax: 2.5, atkTime: 0.95,
  slam: { radius: 40, knock: 260 }, creature: true, body: [28, 34, -12], ring: 2.1,
};
export const DRAGON = {
  kind: 'flame', hp: 400, radius: 14, sep: 16, speed: 44, sight: 340, range: 150, holdDist: 110,
  dps: 38, cone: 0.3, burnTime: 3, burnDps: 11, onTime: 1.8, offTime: 1, flying: true,
  pivot: { x: 38 * K, y: -17 * K }, muzzleLen: 24 * K, creature: true, body: [36, 20, 8], ring: 2, noKnock: true,
};
export const NECROMANCER = {
  kind: 'necro', hp: 95, ...BODY, speed: 29, sight: 420, range: 260, holdDist: 200,
  summonMin: 3.8, summonMax: 5, maxMinions: 6, castTime: 0.7, egg: true, noDrop: true,
};
export const SKELETON = {
  ...BEAST, faction: 'necromancer', hp: 42, ...BODY, speed: 52, reach: 14, damage: 11, cooldownMin: 0.65, cooldownMax: 0.95,
  weapon: 'sword', egg: true, noDrop: true, pivot: { x: 4 * K, y: 12 * K },
};

// How fast each creature's legs cycle (frames per second of its 8-frame walk).
export const GAIT = { boar: 8, rat: 15, ant: 15, ape: 7, alligator: 7, piranha: 11, snake: 7, cheetah: 13, slime: 6, giant: 5, dragon: 7, zombie: 4.5, skeleton: 8 };


// ------------------------------------------------------------------ robots
// Four mechanical troopers that borrow the army's mechanics: a laser rifle, a wrench-wielding bruiser, a rocket lobber
// and a flame vent.
export const BOLTBOT = { ...SOLDIER, hp: 130, speed: 62, damage: 30, bulletSpeed: 700, cooldownMin: 1.2, cooldownMax: 1.7 };
export const BRUISER = { ...ROMAN, hp: 280, speed: 24, damage: 44, armor: 0.6, formation: false, weapon: 'wrench' };
export const ROCKETBOT = { ...GRENADIER, hp: 115, speed: 52, damage: 60, blastRadius: 26, cooldownMin: 3.6, cooldownMax: 4.8 };
export const TORCHBOT = { ...FLAMETHROWER, hp: 160, speed: 56, dps: 36 };

// ------------------------------------------------------------------ terrain items
export const TERRAIN_IDS = ['wall', 'water', 'ice', 'mine', 'barrel', 'tree'];

// `faction` decides who fights whom in free-for-all (defaults to the
// species itself); a knight is the same faction as the cavalry.
export const SPECIES = {
  soldier: { id: 'soldier', label: 'Soldier', def: SOLDIER },
  flamethrower: { id: 'flamethrower', label: 'Flamethrower', def: FLAMETHROWER },
  sniper: { id: 'sniper', label: 'Sniper', def: SNIPER },
  roman: { id: 'roman', label: 'Chef', def: ROMAN },
  grenadier: { id: 'grenadier', label: 'Grenadier', def: GRENADIER },
  archer: { id: 'archer', label: 'Archer', def: ARCHER },
  cowboy: { id: 'cowboy', label: 'Cowboy', def: COWBOY },
  ninja: { id: 'ninja', label: 'Samurai', def: NINJA },
  boltbot: { id: 'boltbot', label: 'Bolt Bot', def: BOLTBOT },
  bruiser: { id: 'bruiser', label: 'Bruiser', def: BRUISER },
  rocketbot: { id: 'rocketbot', label: 'Rocket Bot', def: ROCKETBOT },
  torchbot: { id: 'torchbot', label: 'Torch Bot', def: TORCHBOT },
  boar: { id: 'boar', label: 'Boar', def: BOAR },
  rat: { id: 'rat', label: 'Rat', def: RAT },
  ant: { id: 'ant', label: 'Ant', def: ANT },
  ape: { id: 'ape', label: 'Ape', def: APE },
  alligator: { id: 'alligator', label: 'Alligator', def: ALLIGATOR },
  piranha: { id: 'piranha', label: 'Piranha', def: PIRANHA },
  snake: { id: 'snake', label: 'Snake', def: SNAKE },
  cheetah: { id: 'cheetah', label: 'Cheetah', def: CHEETAH },
  zombie: { id: 'zombie', label: 'Zombie', def: ZOMBIE },
  slime: { id: 'slime', label: 'Slime', def: SLIME },
  mage: { id: 'mage', label: 'Mage', def: MAGE },
  giant: { id: 'giant', label: 'Giant', def: GIANT },
  dragon: { id: 'dragon', label: 'Dragon', def: DRAGON },
  necromancer: { id: 'necromancer', label: 'Necromancer', def: NECROMANCER },
  skeleton: { id: 'skeleton', label: 'Skeleton', def: SKELETON },
  // terrain items that appear in the legend
  barrel: { id: 'barrel', label: 'Barrel', def: { prop: true } },
  tree: { id: 'tree', label: 'Tree', def: { prop: true } },
};
// The order of the palette (the knight only ever comes from a cavalry).
export const TABS = [
  { id: 'army', label: 'Army', items: ['soldier', 'flamethrower', 'sniper', 'roman', 'grenadier', 'archer', 'cowboy', 'ninja'] },
  { id: 'robots', label: 'Robots', items: ['boltbot', 'bruiser', 'rocketbot', 'torchbot'] },
  { id: 'terrain', label: 'Terrain', items: ['wall', 'water', 'ice', 'mine', 'barrel', 'tree'] },
];
export const TERRAIN_LABELS = { wall: 'Wall', water: 'Water', ice: 'Ice', mine: 'Mines', barrel: 'Barrel', tree: 'Tree' };
export const PALETTE_ORDER = TABS[0].items;
export const SPECIES_ORDER = [...TABS[0].items, ...TABS[1].items, 'barrel', 'tree'];
