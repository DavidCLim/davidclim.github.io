export const WORLD_W = 960;
export const WORLD_H = 600;

// Same accel/friction movement feel as Hyper Fishies' own player (see that
// project's world/player.js) — the whole point of matching its style is
// that walking around should *feel* the same, not just look the same.
export const PLAYER = {
  radius: 12,
  maxSpeed: 118,
  accel: 720,
  friction: 900,
};
