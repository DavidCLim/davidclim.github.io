import { PLAYER } from '../core/constants.js';
import { moveWithCollision } from './collision.js';
import { keyboardMoveVector } from '../core/input.js';

// Player movement: acceleration/friction toward a target direction, simple
// walk-cycle timing, and collision-resolved position updates. Movement is
// locked while the fishing state machine has the player engaged (anything
// other than 'idle' or 'aiming' near a spot).
export function updatePlayer(state, dt) {
  const p = state.player;
  const input = state.input;

  const bossActive = !!state.boss && state.boss.state !== 'idle';
  const locked = state.fishing.state !== 'idle' || !!state.ui.activeOverlay || bossActive;

  let dx = 0, dy = 0;
  if (!locked) {
    const kb = keyboardMoveVector(input);
    dx = kb.dx; dy = kb.dy;
    if (input.joystick.active) {
      dx = input.joystick.dx;
      dy = input.joystick.dy;
    }
  }

  const len = Math.hypot(dx, dy);
  if (len > 1) { dx /= len; dy /= len; }

  const targetVx = dx * PLAYER.maxSpeed;
  const targetVy = dy * PLAYER.maxSpeed;

  p.vx = approach(p.vx, targetVx, (dx !== 0 ? PLAYER.accel : PLAYER.friction) * dt);
  p.vy = approach(p.vy, targetVy, (dy !== 0 ? PLAYER.accel : PLAYER.friction) * dt);

  const moveDx = p.vx * dt;
  const moveDy = p.vy * dt;

  if (Math.abs(moveDx) > 0.001 || Math.abs(moveDy) > 0.001) {
    const resolved = moveWithCollision(p.x, p.y, moveDx, moveDy, PLAYER.radius, state.currentRegion);
    p.x = resolved.x;
    p.y = resolved.y;
  }

  const speed = Math.hypot(p.vx, p.vy);
  p.moving = speed > 4;

  if (p.moving) {
    if (Math.abs(p.vx) > Math.abs(p.vy)) {
      p.facing = p.vx < 0 ? 'left' : 'right';
    } else {
      p.facing = p.vy < 0 ? 'up' : 'down';
    }
    p.animTime += dt * (speed / PLAYER.maxSpeed);
  }
}

function approach(current, target, maxDelta) {
  if (current < target) return Math.min(current + maxDelta, target);
  if (current > target) return Math.max(current - maxDelta, target);
  return current;
}
