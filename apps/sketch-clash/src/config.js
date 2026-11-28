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
export const ZAP_TIME = 0.85; // how long a robot in water stands crackling before he drops
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
  bulletSpeed: 510, // 13.5 screen px a frame in the original
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

// Robo Trooper: a stocky walking armour with a big rifle. Slower and far tougher than a soldier, firing in threes.
export const TROOPER = {
  ...SOLDIER,
  robot: true, // water short-circuits him
  hp: 170, // a soldier has 100
  radius: 13 * UNIT,
  sep: 21 * UNIT,
  speed: 48,
  sight: 400,
  range: 300,
  holdDist: 150,
  burst: 3,
  burstGap: 0.12,
  cooldownMin: 1.2,
  cooldownMax: 1.8,
  damage: 16, // three a volley: a bit more than a soldier does over the same time
  spread: 0.07,
  ring: 1.2,
  pivot: { x: 9.2 * K, y: 8.9 * K }, // the drawing is scaled up 1.15 about the feet
  muzzleLen: 45 * K,
  kick: true, // he rocks back with every round
  casing: true, // and spits out shells
  explodes: true, // and goes to pieces when he dies
  boom: 15,
  thrusters: 'walk',
};

// Malfunction Trooper: a Robo Trooper half blown to bits, with no gun. All he does is limp into the biggest crowd of
// enemies he can find and blow up. Shot down on the way, he blows up where he drops (water just shorts him out).
export const MALF = {
  ...TROOPER,
  kind: 'malf',
  hp: 600, // a Robo Trooper has 170: he has to last long enough to get there
  armor: 0.65, // and shots mostly go into holes that are already there
  speed: 30,
  stride: 17, // how far one whole limping step takes him (his feet reach just far enough to match it, so they never slide)
  burst: 0,
  kick: false,
  casing: false,
  noDrop: true,
  thrusters: undefined, // his are broken
  boom: 20,
  // his bomb. radius: how far the blast reaches; damage: at the middle of it (less further out); wind: seconds he stands
  // shaking before it goes; crowd: how close together enemies count as one group; rush: this close to them he breaks into
  // a frantic hobble, `hurry` times as fast, since many back away from anyone coming at them
  bomb: { radius: 68, damage: 220, knock: 460, wind: 0.65, crowd: 46, rush: 125, hurry: 1.75 },
  parts: ['botplate', 'botplate', 'botplate', 'botpod', 'botlens', 'malftrooper'],
};

// Shield Trooper: he marches at the front behind a see-through energy shield that stops bullets, arrows (and throwing
// stars) and rockets, so that those behind him are covered. Up close he charges with it and shoves people back. Enough
// hits shatter it, and he backs off until it comes up again. Only the front is covered; blasts, fire, magic and blows
// get through.
export const SHIELD = {
  ...TROOPER,
  kind: 'shield',
  hp: 380,
  armor: 0.85,
  speed: 46,
  sight: 460,
  range: 0,
  burst: 0,
  kick: false,
  casing: false,
  noDrop: true,
  boom: 16,
  ring: 1.3,
  // the shield. hp: what it takes to shatter it; ahead: how far in front of him it stands; half: half of how far it
  // reaches up and down the field; recharge: seconds before it is back. The charge: rushFrom: how near someone must be;
  // rushTime / rushSpeed: how long and fast; every: seconds between; shove: how hard it throws; bash: damage.
  // keepOff: with no shield, how far he tries to stay from them
  guard: { hp: 520, ahead: 17, half: 18, recharge: 5.5, rushFrom: 62, rushTime: 0.34, rushSpeed: 200, every: 2.6, shove: 360, bash: 16, keepOff: 200 },
  parts: ['botplate', 'botplate', 'botpod', 'botpod', 'botlens', 'shieldtrooper'],
};

// Gatling Trooper: between the Jet Trooper and MechaZaur. A heavier Robo Trooper whose rotary cannon pours out a long
// stream of rounds, then winds down for a moment. He doesn't back away from anyone.
export const GATLING = {
  ...TROOPER,
  hp: 520,
  radius: 14 * UNIT,
  sep: 22 * UNIT,
  speed: 40,
  sight: 440,
  range: 300,
  holdDist: 160,
  kite: 0,
  burst: 22,
  burstGap: 0.065,
  cooldownMin: 1.2,
  cooldownMax: 1.7,
  damage: 9,
  spread: 0.1,
  armor: 0.85,
  scale: 1.18, // of Robo Trooper's drawing; the trooper himself is 1.15
  rapid: true, // a rotary cannon: tracers, and his own muzzle and shell effects (gatlingfx.js)
  casing: false,
  noDrop: true,
  ring: 1.3,
  pivot: { x: 7.1 * K, y: 10.8 * K }, // the drawing is scaled up 1.18 about the feet
  muzzleLen: 53 * K,
  boom: 19,
  parts: ['botplate', 'botplate', 'botpod', 'botpod', 'gatlingbarrel', 'trooper'],
};

// Robot Juggernaut: a broad armoured brute with great iron fists. He wades in and brings his fists down, flattening everyone
// near where they land. Bullets and arrows only do part of their damage, and nothing knocks him back.
export const JUGGERNAUT = {
  kind: 'jugger',
  robot: true,
  hp: 480,
  radius: 17 * UNIT,
  scale: 1.36, // well bigger than Robo Trooper, and built much broader
  jets: [[-46, -30], [-45, -4]], // his thruster pack, on the back of the hump
  bulk: 1,
  sep: 30 * UNIT,
  speed: 48,
  // riflemen back away from him, so now and then he fires his thrusters to catch up
  charge: { time: 0.85, boost: 2.7, rest: 1.2, from: 30 },
  sight: 560,
  reach: 24, // from his middle to the edge of whoever he's punching
  windup: 0.5,
  recover: 0.45,
  rest: 0.45,
  damage: 60, // two punches fell a soldier
  slamAt: 19, // how far in front of him the punch lands
  slamRadius: 14,
  slam: { every: 3, radius: 19 }, // every third blow is both fists at once, and lands wider
  lunge: 95, // how fast he throws himself into a punch
  knock: 70,
  armor: 0.75,
  noDrop: true,
  explodes: true, // goes to pieces like Robo Trooper
  boom: 15,
  thrusters: 'boost',
  parts: ['botplate', 'botplate', 'botpod', 'jugfist', 'juggernaut'],
  ring: 1.8,
  pivot: { x: 0, y: 0 },
  muzzleLen: 0,
};

// Jet Trooper: between the two. One rocket at a time with a long reload, and every so often he takes off on his
// jetpack and fights from the air for a few seconds.
export const JETTROOPER = {
  ...SOLDIER,
  robot: true,
  kind: 'jet',
  hp: 260,
  radius: 13 * UNIT,
  sep: 22 * UNIT,
  speed: 46,
  sight: 460,
  range: 300,
  holdDist: 175,
  cooldownMin: 3, // much slower to reload than Robo Trooper
  cooldownMax: 3.8,
  damage: 75,
  blast: 22,
  rocketSpeed: 250,
  spread: 0.05,
  armor: 0.9,
  scale: 1.15, // the same size as Robo Trooper
  fly: { time: 3.2, rest: 5, height: 28, boost: 1.8 },
  ring: 1.2,
  pivot: { x: 9.2 * K, y: 7.75 * K }, // the drawing is scaled up 1.15 about the feet
  muzzleLen: 44 * K,
  kick: true,
  casing: false,
  noDrop: true,
  explodes: true,
  boom: 15,
  parts: ['botplate', 'botpod', 'botpod', 'jettrooper'],
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
  arrowSpeed: 162, // about 260 screen px a second in the original
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
  kind: 'mage', hp: 140, ...BODY, speed: 33, sight: 400, range: 240, holdDist: 150,
  cooldownMin: 0.7, cooldownMax: 1.1, castTime: 0.55, egg: true,
  // two spells, as the original's mage casts them:
  // a pink bolt that bursts, hurting and throwing back everyone close to where it lands,
  // like the original's snipers and trees, he goes up a wizard tower and casts from the top, one wizard to a tower:
  // reach: how far he'll walk to one. height: how far above its foot he stands. range: how far he can cast from there.
  // enter / rise: seconds going in at the door and coming up through the roof
  // cover: how much of any hit gets through its stone walls and roof to him (fire gets him in full)
  perch: { reach: 300, height: 40.5, range: 440, enter: 0.4, rise: 0.55, cover: 0.5 },
  orbSpeed: 200, burst: { damage: 45, radius: 18, knock: 150 },
  // and lightning that leaps from enemy to enemy, leaving each one alight
  chain: { damage: 28, jumps: 5, hop: 62, burn: 2.2 },
};
// Gibbondore The Great: a gibbon wizard. He fights like the original's ape (straight in, and a ground slam that sends
// everyone flying), crosses the gap in one great leap, and throws stars from his staff on the way.
export const GIBBONDORE = {
  kind: 'gibbon',
  hp: 1050,
  armor: 0.68, // a ward about him turns aside some of every bullet and arrow
  radius: 9,
  sep: 13.5,
  speed: 61,
  sight: 440,
  reach: 20, // from his middle to the edge of whoever he slams
  slam: { radius: 33, damage: 58, knock: 240, time: 0.62, cooldown: [0.55, 0.85] },
  leap: { min: 42, max: 205, time: 0.56, height: 36, cooldown: 3.4 },
  spell: { range: 260, cast: 0.42, cooldown: [1.6, 2.2], bolts: 3, damage: 31, blast: 11, speed: 235 },
  // two blows of his staff and lightning comes down out of the sky on the nearest `targets` enemies. range: how close
  // one has to be before he'll bother
  storm: { first: 2.6, cooldown: [8, 10], range: 280, targets: 6, damage: 72 },
  scale: 1.2,
  ring: 1.7,
  body: [34, 30, -14],
  pivot: { x: 0, y: 0 },
  muzzleLen: 0,
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
export const GAIT = { boar: 8, rat: 15, ant: 15, ape: 7, alligator: 7, piranha: 11, snake: 7, cheetah: 13, slime: 6, giant: 5, dragon: 7, mechazord: 7, zombie: 4.5, skeleton: 8 };

// ------------------------------------------------------------------ terrain items
// MechaZaur: Robo Trooper built bulkier, with a dragon's head, and the biggest of the robots. His attacks: fire
// breath, a salvo of homing missiles, a tail swipe that knocks people over and, rarely, a great beam; he walks, and now and then lifts off on jets and breathes from the air.
export const MECHAZORD = {
  ...DRAGON,
  robot: true,
  flying: false,
  airborne: true, // like the dragon, he sometimes takes off and breathes fire from the air, sometimes he stays on the ground
  hoverH: 24,
  scale: 1.4, // of Robo Trooper's drawing; the trooper himself is 1.15, and not as broad
  hp: 3300,
  mega: true, // his breath and his end come with their own effects (zordfx.js)
  radius: 10.5,
  sep: 17.5,
  speed: 38,
  sight: 560,
  dps: 82, // the dragon's is 38; half as much again from the air
  burnDps: 18,
  cone: 0.38,
  range: 240,
  holdDist: 135,
  onTime: 2.5,
  offTime: 0.85,
  explodes: true, // and goes to pieces when he dies, like the other robots
  boom: 30,
  // his rare one, a huge beam of teal fire from his jaws: made like his fire breath, only bigger. Every `every` seconds he has only
  // a `chance` of using it, and after he has, none for a long while. charge / fire: how long each part lasts; width: half
  // its width at his jaws, growing by `widen` as the fire swells; speed: how fast the fire rushes out; sweep: how fast he
  // can swing it once firing (radians a second). range: how near someone must be for him to start it; once it is out it
  // runs clean off the edge of the field
  beam: { every: 4, chance: 0.14, cooldown: [24, 34], range: 400, width: 8, widen: 20, speed: 1100, dps: 200, charge: 1.15, fire: 1.35, sweep: 0.4 },
  // his third attack: a sweep of the tail along the ground. It does no damage; whoever it catches is flipped off their
  // feet and lies stunned. first: seconds before he can; cooldown: between sweeps; reach: how far the tail gets;
  // time: how long the sweep takes
  swipe: { first: 1.2, cooldown: [3.6, 4.8], reach: 27, time: 0.85 },
  // his second attack: a salvo of homing missiles. first: seconds before the first one; every: between salvos;
  // range: further than his fire; flight: seconds each is in the air
  missiles: { first: 2.4, every: 5.5, count: 6, gap: 0.09, damage: 48, blast: 17, range: 390, flight: 0.9 },
  parts: ['botplate', 'botplate', 'botpod', 'botpod', 'zordhorn', 'zordhorn', 'zordhead'],
  ring: 1.65,
  body: [33, 33, -18],
  pivot: { x: 43 * K, y: -0.2 * K }, // his mouth, as high as his legs carry it
  muzzleLen: 8 * K,
  footFire: 18, // whoever is pressed this close against him, under his jaws, is caught by the fire too
  plume: { every: 0.021, speed: 2.35, life: 1.7, size: 2.15 },
};

export const TERRAIN_IDS = ['wall', 'water', 'ice', 'mine', 'barrel', 'tree', 'tower'];

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
  mechazord: { id: 'mechazord', label: 'MechaZaur', def: MECHAZORD },
  trooper: { id: 'trooper', label: 'Robo Trooper', def: TROOPER },
  shieldtrooper: { id: 'shieldtrooper', label: 'Shield Trooper', def: SHIELD },
  jettrooper: { id: 'jettrooper', label: 'Jet Trooper', def: JETTROOPER },
  malftrooper: { id: 'malftrooper', label: 'Malfunction Trooper', def: MALF },
  gatlingtrooper: { id: 'gatlingtrooper', label: 'Gatling Trooper', def: GATLING },
  juggernaut: { id: 'juggernaut', label: 'Robot Juggernaut', def: JUGGERNAUT },
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
  mage: { id: 'mage', label: 'Wizard', def: MAGE },
  gibbondore: { id: 'gibbondore', label: 'Gibbondore The Great', def: GIBBONDORE },
  giant: { id: 'giant', label: 'Giant', def: GIANT },
  dragon: { id: 'dragon', label: 'Dragon', def: DRAGON },
  necromancer: { id: 'necromancer', label: 'Necromancer', def: NECROMANCER },
  skeleton: { id: 'skeleton', label: 'Skeleton', def: SKELETON },
  // terrain items that appear in the legend
  barrel: { id: 'barrel', label: 'Barrel', def: { prop: true } },
  tree: { id: 'tree', label: 'Tree', def: { prop: true } },
  tower: { id: 'tower', label: 'Wizard Tower', def: { prop: true } },
};
// The order of the palette (the knight only ever comes from a cavalry).
export const TABS = [
  { id: 'army', label: 'Army', items: ['soldier', 'flamethrower', 'sniper', 'grenadier', 'archer', 'cowboy', 'ninja'] },
  { id: 'robots', label: 'Robots', items: ['trooper', 'shieldtrooper', 'jettrooper', 'malftrooper', 'gatlingtrooper', 'mechazord'] }, // the Juggernaut's code is kept, but he isn't in the palette
  { id: 'magic', label: 'Magic', items: ['mage', 'gibbondore'] },
  { id: 'terrain', label: 'Terrain', items: ['wall', 'water', 'ice', 'mine', 'barrel', 'tree', 'tower'] },
];
export const TERRAIN_LABELS = { wall: 'Wall', water: 'Water', ice: 'Ice', mine: 'Mines', barrel: 'Barrel', tree: 'Tree', tower: 'Wizard Tower' };
export const PALETTE_ORDER = TABS[0].items;
export const SPECIES_ORDER = [...TABS[0].items, ...TABS[1].items, ...TABS[2].items, 'barrel', 'tree', 'tower'];
