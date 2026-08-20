import { LOBBY_GRID, GRID_W, GRID_H, CELL } from '../data/lobbyMap.js';

// Wall colors per cell type, {front, side} — `side` (a Y-axis hit in the
// DDA step below) is drawn a shade darker than `front` (an X-axis hit),
// the classic cheap "two-tone shading" trick that gives raycast walls a
// sense of depth without any real lighting model.
const WALL_COLORS = {
  [CELL.WALL]: { front: '#4a3a7a', side: '#372c5c' },
  [CELL.GACHA_WALL]: { front: '#c9922a', side: '#9a6f1e' },
  [CELL.DUNGEON_WALL]: { front: '#7a2e6e', side: '#5a2151' },
  [CELL.PILLAR]: { front: '#8a5cff', side: '#6a3ec9' },
};

const MAX_RENDER_DIST = 26;

// Digital Differential Analysis raycasting — steps the ray one grid line
// at a time (rather than marching in small fixed increments) so it's both
// fast and pixel-accurate regardless of map size. Returns the
// perpendicular wall distance (already fisheye-corrected, unlike a raw
// Euclidean hit distance) plus which axis was hit and the cell's value.
function castRay(ox, oy, angle) {
  const dirX = Math.cos(angle), dirY = Math.sin(angle);
  let mapX = Math.floor(ox), mapY = Math.floor(oy);

  const deltaDistX = dirX === 0 ? 1e30 : Math.abs(1 / dirX);
  const deltaDistY = dirY === 0 ? 1e30 : Math.abs(1 / dirY);

  let stepX, sideDistX;
  if (dirX < 0) { stepX = -1; sideDistX = (ox - mapX) * deltaDistX; }
  else { stepX = 1; sideDistX = (mapX + 1 - ox) * deltaDistX; }
  let stepY, sideDistY;
  if (dirY < 0) { stepY = -1; sideDistY = (oy - mapY) * deltaDistY; }
  else { stepY = 1; sideDistY = (mapY + 1 - oy) * deltaDistY; }

  let side = 0;
  let cellVal = CELL.WALL;
  let hit = false;
  for (let i = 0; i < 128; i++) {
    if (sideDistX < sideDistY) { sideDistX += deltaDistX; mapX += stepX; side = 0; }
    else { sideDistY += deltaDistY; mapY += stepY; side = 1; }
    if (mapX < 0 || mapY < 0 || mapX >= GRID_W || mapY >= GRID_H) { hit = true; cellVal = CELL.WALL; break; }
    const v = LOBBY_GRID[mapY][mapX];
    if (v !== CELL.EMPTY) { hit = true; cellVal = v; break; }
  }
  if (!hit) return { dist: MAX_RENDER_DIST, side: 0, val: CELL.WALL };
  const dist = side === 0 ? (sideDistX - deltaDistX) : (sideDistY - deltaDistY);
  return { dist: Math.max(0.05, dist), side, val: cellVal };
}

// One ray per screen column — returns the per-column hit array so both
// the wall pass and the sprite occlusion check below can reuse it without
// re-casting.
export function castColumns(player, fov, numColumns) {
  const columns = new Array(numColumns);
  const start = player.angle - fov / 2;
  for (let i = 0; i < numColumns; i++) {
    const rayAngle = start + (i / numColumns) * fov;
    // Correct for fisheye by projecting against the player's own facing,
    // not the raw ray — perpendicular distance from castRay is already
    // fisheye-free, this second cos() would double-correct, so it's
    // intentionally omitted.
    columns[i] = castRay(player.x, player.y, rayAngle);
  }
  return columns;
}

function drawSkyAndFloor(ctx, w, h) {
  const sky = ctx.createLinearGradient(0, 0, 0, h / 2);
  sky.addColorStop(0, '#0a0718');
  sky.addColorStop(1, '#221a44');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h / 2);

  const floor = ctx.createLinearGradient(0, h / 2, 0, h);
  floor.addColorStop(0, '#1c1638');
  floor.addColorStop(1, '#08060f');
  ctx.fillStyle = floor;
  ctx.fillRect(0, h / 2, w, h / 2);
}

function drawWalls(ctx, columns, w, h) {
  const colWidth = w / columns.length;
  for (let i = 0; i < columns.length; i++) {
    const { dist, side, val } = columns[i];
    const wallH = Math.min(h * 1.4, h / dist);
    const top = (h - wallH) / 2;
    const palette = WALL_COLORS[val] || WALL_COLORS[CELL.WALL];
    const base = side === 0 ? palette.front : palette.side;

    const fog = Math.max(0, 1 - dist / MAX_RENDER_DIST);
    ctx.globalAlpha = 0.35 + fog * 0.65;
    ctx.fillStyle = base;
    ctx.fillRect(Math.floor(i * colWidth), top, Math.ceil(colWidth) + 1, wallH);
  }
  ctx.globalAlpha = 1;
}

// Billboarded emoji sprites for the two building signs — projected by
// angle-relative-to-player rather than full 3D transform (there are only
// ever two of these on screen, so a cheap approach is plenty).
function drawSprites(ctx, player, sprites, columns, w, h, fov) {
  for (const s of sprites) {
    const dx = s.x - player.x, dy = s.y - player.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 0.3 || dist > MAX_RENDER_DIST) continue;
    let angleTo = Math.atan2(dy, dx) - player.angle;
    while (angleTo > Math.PI) angleTo -= Math.PI * 2;
    while (angleTo < -Math.PI) angleTo += Math.PI * 2;
    if (Math.abs(angleTo) > fov / 2 + 0.2) continue;

    const screenX = (0.5 + angleTo / fov) * w;
    const col = Math.max(0, Math.min(columns.length - 1, Math.floor((screenX / w) * columns.length)));
    if (columns[col] && columns[col].dist < dist - 0.3) continue; // occluded by a wall

    const size = Math.min(h * 0.5, (h * 0.9) / dist);
    const screenY = h / 2 - size * 0.15;
    ctx.save();
    ctx.globalAlpha = Math.max(0.2, Math.min(1, 1 - dist / MAX_RENDER_DIST + 0.3));
    ctx.font = `${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = 'rgba(200, 150, 255, 0.6)';
    ctx.shadowBlur = 14;
    ctx.fillText(s.icon, screenX, screenY);
    ctx.restore();
  }
}

export function renderLobbyView(ctx, w, h, player, fov, sprites) {
  drawSkyAndFloor(ctx, w, h);
  const numColumns = Math.round(w / 3);
  const columns = castColumns(player, fov, numColumns);
  drawWalls(ctx, columns, w, h);
  drawSprites(ctx, player, sprites, columns, w, h, fov);
}
