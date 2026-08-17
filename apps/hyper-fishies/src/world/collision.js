// Single source of truth for "can the player stand here". Simple AABB/circle
// checks against the static world layout — no scattered per-feature fixes.
import { WORLD_W, WORLD_H } from '../core/constants.js';
import { WALKABLE_RECTS, BLOCKED_RECTS, STALLS, PROPS, NPCS } from './worldObjects.js';

function inflatedRectContains(rect, margin, x, y) {
  return x >= rect.x - margin && x <= rect.x + rect.w + margin &&
         y >= rect.y - margin && y <= rect.y + rect.h + margin;
}

export function isPositionValid(x, y, radius, currentRegion) {
  if (x - radius < 0 || x + radius > WORLD_W || y - radius < 0 || y + radius > WORLD_H) {
    return false;
  }

  const onWalkable = WALKABLE_RECTS.some(r => inflatedRectContains(r, -radius * 0.4, x, y));
  if (!onWalkable) return false;

  for (const r of BLOCKED_RECTS) {
    if (inflatedRectContains(r, radius * 0.5, x, y)) return false;
  }

  // The stall building itself still blocks — you can't walk through a
  // solid counter/wall. Margin is a small fixed amount rather than the
  // full player radius: inflating by the whole radius (as normal
  // circle-vs-rect collision would) made the box noticeably bigger than
  // the visual footprint, especially along the sides where the roof
  // doesn't overhang. A few px is enough to stop the player's sprite from
  // visibly clipping into the wall without padding the box out further
  // than the structure actually is.
  for (const s of STALLS) {
    if (inflatedRectContains(s, 4, x, y)) return false;
  }

  for (const p of PROPS) {
    if (!p.collide) continue;
    if (p.r != null) {
      if (Math.hypot(x - p.x, y - p.y) < p.r + radius) return false;
    } else {
      const rect = { x: p.x - p.w / 2, y: p.y - p.h / 2, w: p.w, h: p.h };
      if (inflatedRectContains(rect, radius, x, y)) return false;
    }
  }

  for (const n of NPCS) {
    // Region-pinned NPCs (currently just Luca — see world/worldObjects.js)
    // shouldn't block a spot they aren't actually standing in; skip them
    // entirely everywhere but their own region, same gate render/renderer.js
    // and world/zones.js apply for drawing/interaction.
    if (n.region && n.region !== currentRegion) continue;
    // Shopkeepers get a small collision radius — just enough that the
    // player's sprite can't slide straight through their body — instead of
    // Morris's full 11, which was big enough to read as "a wall in front
    // of the shop." Interaction itself is still entirely handled by
    // interactRadius (see world/zones.js), independent of this.
    const npcRadius = n.shopId ? 5 : 11;
    if (Math.hypot(x - n.x, y - n.y) < npcRadius + radius) return false;
  }

  return true;
}

// Moves (x,y) by (dx,dy), resolving axis-by-axis so the player slides along
// obstacles instead of sticking dead on contact.
export function moveWithCollision(x, y, dx, dy, radius, currentRegion) {
  let nx = x, ny = y;

  if (dx !== 0) {
    const tryX = x + dx;
    if (isPositionValid(tryX, ny, radius, currentRegion)) nx = tryX;
  }
  if (dy !== 0) {
    const tryY = y + dy;
    if (isPositionValid(nx, tryY, radius, currentRegion)) ny = tryY;
  }

  return { x: nx, y: ny };
}
