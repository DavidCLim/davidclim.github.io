import { SPAWN, TRIGGERS, isSolid } from '../data/lobbyMap.js';

export const MOVE_SPEED = 3.2; // grid units/sec
export const PLAYER_RADIUS = 0.22;
export const FOV = Math.PI / 2.6;
export const MOUSE_SENSITIVITY = 0.0022;
export const TURN_SPEED = 2.4; // rad/sec, keyboard turning fallback

export function createLobbyState() {
  return {
    x: SPAWN.x,
    y: SPAWN.y,
    angle: SPAWN.angle,
    keys: { forward: false, back: false, left: false, right: false, turnLeft: false, turnRight: false },
    nearTrigger: null,
    pointerLocked: false,
  };
}

// Moves each axis independently and only commits the axis that doesn't
// walk the player into a wall, so brushing a wall at an angle slides
// along it instead of just stopping dead — standard FPS-collision feel.
function tryMove(lobby, dx, dy) {
  const nx = lobby.x + dx;
  if (!isSolid(nx + Math.sign(dx) * PLAYER_RADIUS, lobby.y) && !isSolid(nx - Math.sign(dx) * PLAYER_RADIUS, lobby.y)) {
    lobby.x = nx;
  }
  const ny = lobby.y + dy;
  if (!isSolid(lobby.x, ny + Math.sign(dy) * PLAYER_RADIUS) && !isSolid(lobby.x, ny - Math.sign(dy) * PLAYER_RADIUS)) {
    lobby.y = ny;
  }
}

export function updateLobby(lobby, dt) {
  if (lobby.keys.turnLeft) lobby.angle -= TURN_SPEED * dt;
  if (lobby.keys.turnRight) lobby.angle += TURN_SPEED * dt;

  const forward = (lobby.keys.forward ? 1 : 0) - (lobby.keys.back ? 1 : 0);
  const strafe = (lobby.keys.right ? 1 : 0) - (lobby.keys.left ? 1 : 0);
  if (forward !== 0 || strafe !== 0) {
    const mag = Math.hypot(forward, strafe) || 1;
    const fx = Math.cos(lobby.angle), fy = Math.sin(lobby.angle);
    const sx = Math.cos(lobby.angle + Math.PI / 2), sy = Math.sin(lobby.angle + Math.PI / 2);
    const dx = ((fx * forward + sx * strafe) / mag) * MOVE_SPEED * dt;
    const dy = ((fy * forward + sy * strafe) / mag) * MOVE_SPEED * dt;
    tryMove(lobby, dx, dy);
  }

  let nearest = null, nearestDist = Infinity;
  for (const trig of TRIGGERS) {
    const d = Math.hypot(trig.x - lobby.x, trig.y - lobby.y);
    if (d <= trig.radius && d < nearestDist) { nearest = trig; nearestDist = d; }
  }
  lobby.nearTrigger = nearest;
}
