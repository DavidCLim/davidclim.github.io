import { WORLD_W, WORLD_H } from '../core/constants.js';

// The Academy courtyard/hallway — a fixed, non-scrolling 960x600 scene
// (same convention as Hyper Fishies' dock regions: the whole walkable
// area fits on screen at once, no camera scroll to manage). Rect
// coordinates are plain pixels, not a grid — this is a real top-down 2D
// scene, not a raycast grid.
export const WALKABLE_RECT = { x: 30, y: 150, w: WORLD_W - 60, h: WORLD_H - 190 };

// Building footprints — a facade (see render/drawBuilding.js) sits with
// its base along the back wall, so the block itself is what's solid;
// the player can never walk behind it, only up to the door.
export const GACHA_BUILDING = { x: 90, y: 150, w: 150, h: 92 };
export const DUNGEON_BUILDING = { x: WORLD_W - 240, y: 150, w: 150, h: 92 };

export const BLOCKED_RECTS = [GACHA_BUILDING, DUNGEON_BUILDING];

export const TRIGGERS = [
  {
    id: 'gacha', label: 'Gacha Hall', icon: '🎰',
    x: GACHA_BUILDING.x + GACHA_BUILDING.w / 2, y: GACHA_BUILDING.y + GACHA_BUILDING.h + 34,
    radius: 46,
  },
  {
    id: 'dungeons', label: 'Dungeon Gate', icon: '🗺️',
    x: DUNGEON_BUILDING.x + DUNGEON_BUILDING.w / 2, y: DUNGEON_BUILDING.y + DUNGEON_BUILDING.h + 34,
    radius: 46,
  },
];

export const SPAWN = { x: WORLD_W / 2, y: WORLD_H - 110, facing: 'up' };

// Locker banks along the back wall, purely decorative (render/drawHallway.js)
// — the wall itself already blocks movement via WALKABLE_RECT's top edge,
// so these don't need their own collision.
export const LOCKER_BANKS = [
  { x: 270, y: 158, count: 6 },
  { x: WORLD_W - 270 - 6 * 34, y: 158, count: 6 },
];
