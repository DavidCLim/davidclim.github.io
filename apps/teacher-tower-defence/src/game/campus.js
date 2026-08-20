import { WORLD_W, WORLD_H, PLAYER } from '../core/constants.js';
import { WALKABLE_RECT, BLOCKED_RECTS, TRIGGERS, SPAWN } from '../data/campusMap.js';

function inflatedRectContains(rect, margin, x, y) {
  return x >= rect.x - margin && x <= rect.x + rect.w + margin &&
         y >= rect.y - margin && y <= rect.y + rect.h + margin;
}

// Same "single source of truth for can-the-player-stand-here" shape as
// Hyper Fishies' world/collision.js — one open walkable rect (inflated
// slightly negative so the player's circle can't hang half off the edge)
// minus a couple of solid building footprints.
function isPositionValid(x, y, radius) {
  if (x - radius < 0 || x + radius > WORLD_W || y - radius < 0 || y + radius > WORLD_H) return false;
  if (!inflatedRectContains(WALKABLE_RECT, -radius * 0.4, x, y)) return false;
  for (const r of BLOCKED_RECTS) {
    if (inflatedRectContains(r, 4, x, y)) return false;
  }
  return true;
}

function moveWithCollision(x, y, dx, dy, radius) {
  let nx = x, ny = y;
  if (dx !== 0) {
    const tryX = x + dx;
    if (isPositionValid(tryX, ny, radius)) nx = tryX;
  }
  if (dy !== 0) {
    const tryY = y + dy;
    if (isPositionValid(nx, tryY, radius)) ny = tryY;
  }
  return { x: nx, y: ny };
}

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return current;
}

export function createCampusState() {
  return {
    x: SPAWN.x, y: SPAWN.y,
    vx: 0, vy: 0,
    facing: SPAWN.facing,
    moving: false,
    animTime: 0,
    keys: { up: false, down: false, left: false, right: false },
    joystick: { active: false, dx: 0, dy: 0 },
    nearTrigger: null,
  };
}

export function updateCampus(p, dt) {
  let dx = (p.keys.right ? 1 : 0) - (p.keys.left ? 1 : 0);
  let dy = (p.keys.down ? 1 : 0) - (p.keys.up ? 1 : 0);
  if (p.joystick.active) { dx = p.joystick.dx; dy = p.joystick.dy; }

  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }

  const targetVx = dx * PLAYER.maxSpeed;
  const targetVy = dy * PLAYER.maxSpeed;
  p.vx = approach(p.vx, targetVx, (dx !== 0 ? PLAYER.accel : PLAYER.friction) * dt);
  p.vy = approach(p.vy, targetVy, (dy !== 0 ? PLAYER.accel : PLAYER.friction) * dt);

  const moveDx = p.vx * dt, moveDy = p.vy * dt;
  if (Math.abs(moveDx) > 0.001 || Math.abs(moveDy) > 0.001) {
    const resolved = moveWithCollision(p.x, p.y, moveDx, moveDy, PLAYER.radius);
    p.x = resolved.x; p.y = resolved.y;
  }

  const speed = Math.hypot(p.vx, p.vy);
  p.moving = speed > 4;
  if (p.moving) {
    if (Math.abs(p.vx) > Math.abs(p.vy)) p.facing = p.vx < 0 ? 'left' : 'right';
    else p.facing = p.vy < 0 ? 'up' : 'down';
    p.animTime += dt * (speed / PLAYER.maxSpeed);
  } else {
    p.animTime += dt * 0.4; // keeps the idle sway ticking over while still
  }

  let nearest = null, nearestDist = Infinity;
  for (const trig of TRIGGERS) {
    const d = Math.hypot(trig.x - p.x, trig.y - p.y);
    if (d <= trig.radius && d < nearestDist) { nearest = trig; nearestDist = d; }
  }
  p.nearTrigger = nearest;
}
