// A grid-based hub map for the first-person lobby (see render/raycast.js) —
// classic Wolfenstein-style raycasting, one unit per cell, player position
// is a float within that grid rather than pixel coordinates. Two building
// facades (Gacha Hall, Dungeon Gate) are carved into the courtyard as
// hollow rooms with a doorway, each with an interaction trigger point
// just inside — walking through the door is what puts the player in
// range to interact, same as approaching a shop NPC.
export const CELL = { EMPTY: 0, WALL: 1, GACHA_WALL: 2, DUNGEON_WALL: 3, PILLAR: 4 };

export const GRID_W = 24;
export const GRID_H = 20;

function makeGrid(w, h, fill) {
  return Array.from({ length: h }, () => new Array(w).fill(fill));
}

function fillRect(grid, x0, y0, x1, y1, val) {
  for (let y = y0; y <= y1; y++) {
    for (let x = x0; x <= x1; x++) grid[y][x] = val;
  }
}

const grid = makeGrid(GRID_W, GRID_H, CELL.EMPTY);

// Courtyard boundary.
fillRect(grid, 0, 0, GRID_W - 1, 0, CELL.WALL);
fillRect(grid, 0, GRID_H - 1, GRID_W - 1, GRID_H - 1, CELL.WALL);
fillRect(grid, 0, 0, 0, GRID_H - 1, CELL.WALL);
fillRect(grid, GRID_W - 1, 0, GRID_W - 1, GRID_H - 1, CELL.WALL);

// Gacha Hall — west side, doorway faces east into the courtyard.
fillRect(grid, 3, 6, 7, 12, CELL.GACHA_WALL);
fillRect(grid, 4, 7, 6, 11, CELL.EMPTY);
grid[9][7] = CELL.EMPTY;
grid[10][7] = CELL.EMPTY;

// Dungeon Gate — east side, doorway faces west into the courtyard.
fillRect(grid, 16, 6, 20, 12, CELL.DUNGEON_WALL);
fillRect(grid, 17, 7, 19, 11, CELL.EMPTY);
grid[9][16] = CELL.EMPTY;
grid[10][16] = CELL.EMPTY;

// A couple of decorative pillars in the open courtyard for visual depth —
// offset off x=12 (the spawn's own column, see SPAWN below) so they don't
// sit directly in the player's starting line of sight.
grid[4][9] = CELL.PILLAR;
grid[4][14] = CELL.PILLAR;
grid[15][9] = CELL.PILLAR;
grid[15][14] = CELL.PILLAR;

export const LOBBY_GRID = grid;

export const SPAWN = { x: 12, y: 16.5, angle: -Math.PI / 2 };

export const TRIGGERS = [
  { id: 'gacha', label: 'Gacha Hall', icon: '🎰', x: 5.5, y: 9.5, radius: 1.6 },
  { id: 'dungeons', label: 'Dungeon Gate', icon: '🗺️', x: 18.5, y: 9.5, radius: 1.6 },
];

export function cellAt(x, y) {
  const gx = Math.floor(x), gy = Math.floor(y);
  if (gx < 0 || gy < 0 || gx >= GRID_W || gy >= GRID_H) return CELL.WALL;
  return LOBBY_GRID[gy][gx];
}

export function isSolid(x, y) {
  return cellAt(x, y) !== CELL.EMPTY;
}
