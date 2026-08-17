export const WORLD_W = 960;
export const WORLD_H = 600;

// Boardwalk occupies the lower ~2/3 of the scene; water sits toward the top.
export const WATER_LINE = 210;

export const PLAYER = {
  radius: 12,
  maxSpeed: 118,
  accel: 720,
  friction: 900,
};

export const BAG = {
  baseCapacity: 8,
  upgrades: [
    { capacity: 8, cost: 0 },
    { capacity: 14, cost: 150 },
    { capacity: 22, cost: 500 },
    { capacity: 32, cost: 1400 },
    { capacity: 46, cost: 3500 },
  ],
};

export const SAVE_SLOTS = 6;
export const SAVE_KEY_PREFIX = 'hyperFishies.save.v2.slot';
export const SAVE_VERSION = 2;
