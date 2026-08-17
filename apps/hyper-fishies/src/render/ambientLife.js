import { WORLD_W, WATER_LINE } from '../core/constants.js';
import { regionById } from '../data/regions.js';

// Idle-scene ambient decoration: birds, distant boats, floating lanterns,
// drifting bioluminescent motes. Purely cosmetic, no gameplay coupling.
export function initAmbient(state) {
  if (state.fx.ambient) return;
  const rand = Math.random;
  const ambient = {
    birds: Array.from({ length: 4 }, () => ({
      x: rand() * WORLD_W, y: 20 + rand() * 45, speed: 14 + rand() * 10, phase: rand() * Math.PI * 2,
    })),
    boats: Array.from({ length: 2 }, () => ({
      x: rand() * WORLD_W, y: 60 + rand() * 40, speed: 5 + rand() * 4,
    })),
    lanterns: Array.from({ length: 5 }, () => ({
      x: rand() * WORLD_W, y: WATER_LINE - 10 - rand() * 140, speed: 3 + rand() * 3, sway: rand() * Math.PI * 2, seed: rand() * 10,
    })),
    motes: Array.from({ length: 26 }, () => ({
      x: rand() * WORLD_W, y: rand() * WATER_LINE, speed: 4 + rand() * 8, sway: rand() * Math.PI * 2, seed: rand() * 10,
    })),
  };
  state.fx.ambient = ambient;
}

export function updateAmbient(state, dt) {
  const a = state.fx.ambient;
  if (!a) return;
  const t = state.fx.time;

  for (const b of a.birds) {
    b.x += b.speed * dt;
    if (b.x > WORLD_W + 20) b.x = -20;
  }
  for (const b of a.boats) {
    b.x += b.speed * dt;
    if (b.x > WORLD_W + 60) b.x = -60;
  }
  for (const l of a.lanterns) {
    l.y -= l.speed * dt * 0.2;
    if (l.y < -10) l.y = WATER_LINE - 10;
  }
  void t;
}

export function drawAmbientBackground(ctx, state) {
  const a = state.fx.ambient;
  if (!a) return;
  const t = state.fx.time;

  // Distant boats drifting across the water read fine at the Docks/Tropical
  // Island/Seaside Bay/Dark Waters, but Mountain Isle and the Abyssal Lands
  // are both explicitly "no ships belong out here" horizons already
  // (render/drawDockScene.js's own drawHorizonSilhouette skips them for the
  // exact same two regions) — without this gate a little sailboat kept
  // drifting past the snow peaks in the top-down view, which is what read
  // as "the weird moving thing."
  const regionId = state.currentRegion;
  const showBoats = regionId !== 'mountainIsle' && regionId !== 'abyssalLands';

  ctx.save();
  for (const b of showBoats ? a.boats : []) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#03151f';
    // Hull
    ctx.beginPath();
    ctx.moveTo(b.x - 22, b.y);
    ctx.quadraticCurveTo(b.x, b.y + 7, b.x + 22, b.y);
    ctx.lineTo(b.x + 18, b.y - 3);
    ctx.lineTo(b.x - 18, b.y - 3);
    ctx.closePath();
    ctx.fill();
    // Mast + furled sail silhouette
    ctx.beginPath();
    ctx.moveTo(b.x - 2, b.y - 3);
    ctx.lineTo(b.x - 2, b.y - 24);
    ctx.lineTo(b.x + 10, b.y - 15);
    ctx.lineTo(b.x - 2, b.y - 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const b of a.birds) {
    const flap = Math.sin(t * 6 + b.phase) * 4;
    ctx.strokeStyle = 'rgba(200, 225, 220, 0.55)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(b.x - 6, b.y + flap * 0.3);
    ctx.quadraticCurveTo(b.x, b.y - flap, b.x + 6, b.y + flap * 0.3);
    ctx.stroke();
  }

  // Motes pick up the current region's ambient tint (teal at the Docks,
  // icy blue over Mountain Isle, cyan over the Abyssal Lands...) — one more
  // small cue, on top of the water/ground colors, that reads at a glance.
  const region = regionById(state.currentRegion);
  ctx.fillStyle = region.ambientTint || '#8fe9d9';
  for (const m of a.motes) {
    const sway = Math.sin(t * 0.6 + m.sway) * 6;
    const y = (m.y - t * m.speed) % WATER_LINE;
    const yy = y < 0 ? y + WATER_LINE : y;
    ctx.globalAlpha = 0.35 + 0.25 * Math.sin(t * 2 + m.seed);
    ctx.beginPath();
    ctx.arc(m.x + sway, yy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const l of a.lanterns) {
    const sway = Math.sin(t * 0.8 + l.sway) * 8;
    const glow = ctx.createRadialGradient(l.x + sway, l.y, 0, l.x + sway, l.y, 16);
    glow.addColorStop(0, 'rgba(255, 180, 84, 0.55)');
    glow.addColorStop(1, 'rgba(255, 180, 84, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(l.x + sway, l.y, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffd08a';
    ctx.beginPath();
    ctx.arc(l.x + sway, l.y, 2.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
