// The dedicated side-view fishing scene. Reached the moment the player
// starts fishing at the dock (fishing.state leaves 'idle') and left the
// instant the result card is dismissed. It reads the exact same abstract
// fishing-state fields the top-down layer used to (chargePower, flightT,
// distance, tension, nibbleActive, hooksetTimer...) and re-projects them
// onto a fixed profile camera — no changes to fishingMachine.js needed.
import { WORLD_W, WORLD_H } from '../core/constants.js';
import { rarityOf } from '../data/rarity.js';
import { regionById } from '../data/regions.js';
import { equippedRod } from '../core/gameState.js';
import { drawFishIcon, fishVisualDetail } from './drawFishIcon.js';
import { drawShadow } from './drawShadow.js';
import { resolveAppearance } from './playerAppearance.js';
import { materialColors } from './drawRodIcon.js';
import { drawJointedLimb } from './limbs.js';
import { toonOutline, TOON_OUTLINE } from './toon.js';
import { groundBase } from './groundPalette.js';
import {
  skyGradientStops, sunArc, moonArc, nightAmount, SUN_COLOR, SUN_GLOW, MOON_COLOR, MOON_GLOW,
  WATER_DAY_TOP, WATER_DAY_MID, WATER_DAY_BOTTOM, blendWaterStop,
} from '../data/dayNight.js';

export const WATERLINE_Y = 250;
const DOCK_EDGE_X = 300;
const CAST_NEAR_X = 320;
export const CAST_FAR_X = 900;
export const ROD_TIP = { x: 268, y: 208 };

function castFraction(f) {
  const power = f.chargePower || 0;
  return 0.15 + power * 0.85;
}

export function sideViewBobber(f) {
  if (f.state === 'flying') {
    const t = Math.min(f.flightT, 1);
    const ease = 1 - Math.pow(1 - t, 2);
    const targetX = CAST_NEAR_X + (CAST_FAR_X - CAST_NEAR_X) * castFraction(f);
    const x = ROD_TIP.x + (targetX - ROD_TIP.x) * ease;
    const arc = Math.sin(Math.min(t, 1) * Math.PI) * 70;
    const y = ROD_TIP.y + (WATERLINE_Y - ROD_TIP.y) * ease - arc;
    return { x, y };
  }
  if (f.state === 'waiting' || f.state === 'hookset') {
    const x = CAST_NEAR_X + (CAST_FAR_X - CAST_NEAR_X) * castFraction(f);
    return { x, y: WATERLINE_Y };
  }
  if (f.state === 'reeling' || f.state === 'result') {
    const frac = f.state === 'result' ? 0 : Math.max(0, Math.min(1, f.distance / 100));
    const x = CAST_NEAR_X + (CAST_FAR_X - CAST_NEAR_X) * frac;
    return { x, y: WATERLINE_Y };
  }
  return { x: CAST_NEAR_X, y: WATERLINE_Y };
}

function drawPalmSilhouette(ctx, x, baseY) {
  ctx.fillStyle = '#061620';
  ctx.beginPath();
  ctx.moveTo(x - 1, baseY);
  ctx.quadraticCurveTo(x + 3, baseY - 26, x + 1, baseY - 44);
  ctx.lineTo(x - 1, baseY - 42);
  ctx.quadraticCurveTo(x - 2, baseY - 24, x - 3, baseY);
  ctx.closePath();
  ctx.fill();
  for (const ang of [-1.1, -0.4, 0.3, 1.0]) {
    ctx.beginPath();
    ctx.moveTo(x, baseY - 44);
    ctx.quadraticCurveTo(x + Math.cos(ang) * 10, baseY - 44 + Math.sin(ang) * 6 - 4, x + Math.cos(ang) * 20, baseY - 44 + Math.sin(ang) * 10);
    ctx.lineTo(x + Math.cos(ang) * 16, baseY - 44 + Math.sin(ang) * 8 + 2);
    ctx.closePath();
    ctx.fill();
  }
}

function drawDeadTreeSilhouette(ctx, x, baseY) {
  ctx.strokeStyle = '#061620';
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, baseY); ctx.lineTo(x - 1, baseY - 28);
  ctx.moveTo(x - 1, baseY - 14); ctx.lineTo(x - 9, baseY - 22);
  ctx.moveTo(x - 1, baseY - 20); ctx.lineTo(x + 7, baseY - 28);
  ctx.stroke();
}

function drawLighthouse(ctx, x, baseY, t) {
  ctx.fillStyle = '#061620';
  ctx.beginPath();
  ctx.moveTo(x - 4, baseY);
  ctx.lineTo(x - 2, baseY - 38);
  ctx.lineTo(x + 2, baseY - 38);
  ctx.lineTo(x + 4, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(x - 5, baseY - 44, 10, 6);
  const on = Math.sin(t * 1.8) > 0;
  ctx.fillStyle = on ? 'rgba(255,210,140,0.9)' : 'rgba(120,100,70,0.5)';
  ctx.beginPath();
  ctx.arc(x, baseY - 41, 2.4, 0, Math.PI * 2);
  ctx.fill();
  if (on) {
    const beam = ctx.createRadialGradient(x, baseY - 41, 0, x, baseY - 41, 40);
    beam.addColorStop(0, 'rgba(255,210,140,0.22)');
    beam.addColorStop(1, 'rgba(255,210,140,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.arc(x, baseY - 41, 40, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawMountainSilhouette(ctx, baseY) {
  const peaks = [0, 0.14, 0.24, 0.38, 0.5, 0.64, 0.76, 0.9, 1];
  const heights = [10, 46, 28, 58, 20, 50, 32, 44, 10];
  ctx.fillStyle = '#061620';
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  for (let i = 0; i < peaks.length; i++) ctx.lineTo(peaks[i] * WORLD_W, baseY - heights[i]);
  ctx.lineTo(WORLD_W, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = 'rgba(240,246,248,0.65)';
  for (let i = 0; i < peaks.length; i++) {
    const x = peaks[i] * WORLD_W, h = heights[i];
    if (h < 30) continue;
    ctx.beginPath();
    ctx.moveTo(x - 10, baseY - h + 12);
    ctx.lineTo(x, baseY - h);
    ctx.lineTo(x + 10, baseY - h + 12);
    ctx.lineTo(x + 4, baseY - h + 10);
    ctx.lineTo(x, baseY - h + 15);
    ctx.lineTo(x - 4, baseY - h + 10);
    ctx.closePath();
    ctx.fill();
  }
}

function drawAbyssalSilhouette(ctx, baseY) {
  const pts = [0, 0.1, 0.18, 0.3, 0.4, 0.52, 0.63, 0.75, 0.86, 1];
  const heights = [12, 56, 18, 48, 14, 60, 22, 50, 16, 12];
  ctx.fillStyle = '#020a12';
  ctx.beginPath();
  ctx.moveTo(0, baseY);
  for (let i = 0; i < pts.length; i++) ctx.lineTo(pts[i] * WORLD_W, baseY - heights[i]);
  ctx.lineTo(WORLD_W, baseY);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(67, 224, 255, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < pts.length; i++) {
    const x = pts[i] * WORLD_W, y = baseY - heights[i];
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// Each region's far shore reads structurally different, not just tinted —
// jagged snow peaks for Mountain Isle, palm silhouettes for Tropical
// Island, a lighthouse for Seaside Bay, bare dead trees for Dark Waters,
// broken obsidian spires for Abyssal Lands.
function drawHorizonSilhouette(ctx, regionId, t) {
  const baseY = WATERLINE_Y;
  switch (regionId) {
    case 'mountainIsle':
      drawMountainSilhouette(ctx, baseY);
      return;
    case 'abyssalLands':
      drawAbyssalSilhouette(ctx, baseY);
      return;
    case 'tropicalIsland':
      ctx.fillStyle = '#061620';
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= WORLD_W; x += 40) ctx.lineTo(x, baseY - 12 - Math.sin(x * 0.008 + 1) * 5);
      ctx.lineTo(WORLD_W, baseY);
      ctx.closePath();
      ctx.fill();
      for (const px of [0.12, 0.32, 0.66, 0.84]) drawPalmSilhouette(ctx, px * WORLD_W, baseY);
      return;
    case 'darkWaters':
      ctx.fillStyle = '#061620';
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= WORLD_W; x += 40) ctx.lineTo(x, baseY - 6 - Math.sin(x * 0.02 + 2) * 3);
      ctx.lineTo(WORLD_W, baseY);
      ctx.closePath();
      ctx.fill();
      for (const px of [0.18, 0.42, 0.7, 0.9]) drawDeadTreeSilhouette(ctx, px * WORLD_W, baseY);
      return;
    case 'seasideBay':
      ctx.fillStyle = '#061620';
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= WORLD_W; x += 40) ctx.lineTo(x, baseY - 8 - Math.sin(x * 0.01 + 2) * 6);
      ctx.lineTo(WORLD_W, baseY);
      ctx.closePath();
      ctx.fill();
      drawLighthouse(ctx, WORLD_W * 0.8, baseY, t);
      return;
    default:
      ctx.fillStyle = '#061620';
      ctx.beginPath();
      ctx.moveTo(0, baseY);
      for (let x = 0; x <= WORLD_W; x += 40) ctx.lineTo(x, baseY - 8 - Math.sin(x * 0.01 + 2) * 6);
      ctx.lineTo(WORLD_W, baseY);
      ctx.closePath();
      ctx.fill();
  }
}

function drawCelestialBody(ctx, arc, bandHeight, color, glowColor, radius) {
  const x = WORLD_W * (0.08 + arc.xFrac * 0.84);
  const y = bandHeight * (1 - arc.heightFrac * 0.85);
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 5);
  glow.addColorStop(0, glowColor + '48');
  glow.addColorStop(1, glowColor + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WORLD_W, bandHeight);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawSky(ctx, t, regionId, dayNightTime) {
  const stops = skyGradientStops(dayNightTime);
  const grad = ctx.createLinearGradient(0, 0, 0, WATERLINE_Y);
  grad.addColorStop(0, stops.top);
  grad.addColorStop(0.6, stops.mid);
  grad.addColorStop(1, stops.horizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, WATERLINE_Y);

  // Stars — only once night is reasonably deep, same threshold as the
  // world-view sky (render/drawWater.js) and the full-screen night wash
  // (render/drawDayNight.js).
  const n = nightAmount(dayNightTime);
  if (n > 0.55) {
    const starAlpha = Math.min(1, (n - 0.55) / 0.3);
    for (let i = 0; i < 46; i++) {
      const sx = (i * 137) % WORLD_W;
      const sy = (i * 53) % (WATERLINE_Y - 20);
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(t * 1.5 + i));
      ctx.globalAlpha = starAlpha * (0.25 + tw * 0.5);
      ctx.fillStyle = '#eaf6f1';
      ctx.fillRect(sx, sy, 1, 1);
    }
    ctx.globalAlpha = 1;
  }

  // Sun by day, moon by night — same arc math as the world-view sky.
  const sun = sunArc(dayNightTime);
  if (sun) drawCelestialBody(ctx, sun, WATERLINE_Y, SUN_COLOR, SUN_GLOW, 24);
  const moon = moonArc(dayNightTime);
  if (moon) drawCelestialBody(ctx, moon, WATERLINE_Y, MOON_COLOR, MOON_GLOW, 22);

  // Distant silhouette / far shore — structurally different per region
  drawHorizonSilhouette(ctx, regionId, t);

  drawGulls(ctx, t);

  // Galleons at anchor — only where a ship actually makes sense; the
  // mountain and abyssal horizons get their own dressing instead.
  if (regionId !== 'mountainIsle' && regionId !== 'abyssalLands') {
    drawDistantShip(ctx, WORLD_W * 0.58, WATERLINE_Y - 4, t);
    if (regionId !== 'darkWaters') {
      drawDistantShip(ctx, WORLD_W * 0.86, WATERLINE_Y - 2, t * 0.85 + 3, 0.55);
    }
  }
}

function drawDistantShip(ctx, sx, sy, t, scale = 1) {
  const bob = Math.sin(t * 0.8) * 1.4;
  ctx.save();
  ctx.translate(sx, sy + bob);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#04121c';
  ctx.beginPath();
  ctx.moveTo(-46, 0);
  ctx.quadraticCurveTo(0, 12, 46, 0);
  ctx.lineTo(38, -6);
  ctx.lineTo(-38, -6);
  ctx.closePath();
  ctx.fill();

  for (const mx of [-16, 14]) {
    ctx.beginPath();
    ctx.moveTo(mx, -6);
    ctx.lineTo(mx, -46);
    ctx.stroke();
  }
  ctx.strokeStyle = '#04121c';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-16, -6); ctx.lineTo(-16, -46);
  ctx.moveTo(14, -6); ctx.lineTo(14, -38);
  ctx.stroke();

  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(-16, -44);
  ctx.lineTo(4, -34);
  ctx.lineTo(-16, -26);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(14, -36);
  ctx.lineTo(28, -28);
  ctx.lineTo(14, -22);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawWaterBody(ctx, t, tint, dayNightTime) {
  const grad = ctx.createLinearGradient(0, WATERLINE_Y, 0, WORLD_H);
  grad.addColorStop(0, blendWaterStop(dayNightTime, WATER_DAY_TOP, tint.waterTint || '#0e3240'));
  grad.addColorStop(0.4, blendWaterStop(dayNightTime, WATER_DAY_MID, '#0b2733'));
  grad.addColorStop(1, blendWaterStop(dayNightTime, WATER_DAY_BOTTOM, '#021620'));
  ctx.fillStyle = grad;
  ctx.fillRect(0, WATERLINE_Y, WORLD_W, WORLD_H - WATERLINE_Y);

  ctx.strokeStyle = 'rgba(143, 233, 217, 0.18)';
  ctx.lineWidth = 1;
  for (let band = 0; band < 6; band++) {
    const y = WATERLINE_Y + 16 + band * 22;
    ctx.beginPath();
    for (let x = 0; x <= WORLD_W; x += 10) {
      const wobble = Math.sin(x * 0.06 + t * 1.4 + band) * 2.4;
      if (x === 0) ctx.moveTo(x, y + wobble); else ctx.lineTo(x, y + wobble);
    }
    ctx.stroke();
  }

  // Bioluminescent motes beneath the surface
  ctx.fillStyle = tint.ambientTint || '#8fe9d9';
  for (let i = 0; i < 18; i++) {
    const mx = (i * 97 + t * 12) % WORLD_W;
    const my = WATERLINE_Y + 30 + ((i * 61) % (WORLD_H - WATERLINE_Y - 40));
    ctx.globalAlpha = 0.25 + 0.25 * Math.abs(Math.sin(t * 2 + i));
    ctx.fillRect(mx, my, 1.4, 1.4);
  }
  ctx.globalAlpha = 1;

  // Waterline crest highlight
  ctx.strokeStyle = 'rgba(143, 233, 217, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  for (let x = 0; x <= WORLD_W; x += 8) {
    const y = WATERLINE_Y + Math.sin(x * 0.05 + t * 1.6) * 2;
    if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
}

function drawDockPlatform(ctx, region) {
  const deckY = WATERLINE_Y - 34;
  const deckH = 34;

  // Support posts into the water
  ctx.fillStyle = '#2c2117';
  for (let x = 30; x < DOCK_EDGE_X; x += 54) {
    ctx.fillRect(x, deckY + deckH - 4, 10, WORLD_H - (deckY + deckH - 4));
  }
  ctx.globalAlpha = 0.4;
  ctx.fillStyle = '#0b2733';
  for (let x = 30; x < DOCK_EDGE_X; x += 54) {
    ctx.fillRect(x, WATERLINE_Y, 10, WORLD_H - WATERLINE_Y);
  }
  ctx.globalAlpha = 1;

  // Deck
  const ground = groundBase(region && region.id);
  const grad = ctx.createLinearGradient(0, deckY, 0, deckY + deckH);
  grad.addColorStop(0, ground.top);
  grad.addColorStop(1, ground.bottom);
  ctx.fillStyle = grad;
  ctx.fillRect(0, deckY, DOCK_EDGE_X + 14, deckH);

  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let x = 0; x < DOCK_EDGE_X + 14; x += 20) {
    ctx.beginPath();
    ctx.moveTo(x, deckY);
    ctx.lineTo(x, deckY + deckH);
    ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,180,84,0.14)';
  ctx.fillRect(0, deckY, DOCK_EDGE_X + 14, 3);

  if (region && region.deckTint) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, deckY, DOCK_EDGE_X + 14, deckH);
    ctx.clip();
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = region.deckTint;
    ctx.fillRect(0, deckY, DOCK_EDGE_X + 14, deckH);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = region.deckTint;
    ctx.fillRect(0, deckY, DOCK_EDGE_X + 14, deckH);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Edge post + small lantern
  ctx.fillStyle = '#2c2117';
  ctx.fillRect(DOCK_EDGE_X - 10, deckY - 40, 6, 40);
  const lx = DOCK_EDGE_X - 7, ly = deckY - 44;
  const lglow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 34);
  lglow.addColorStop(0, 'rgba(255,180,84,0.5)');
  lglow.addColorStop(1, 'rgba(255,180,84,0)');
  ctx.fillStyle = lglow;
  ctx.beginPath();
  ctx.arc(lx, ly, 34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd08a';
  ctx.beginPath();
  ctx.arc(lx, ly, 3, 0, Math.PI * 2);
  ctx.fill();

  drawDockFringe(ctx, deckY, deckH);

  return deckY;
}

// Lived-in detail kept OFF the open deck (nothing underfoot to dodge while
// casting) and pushed to the fringe instead — hanging off the eave, wrapped
// around the support posts, and floating in the water beside them.
function drawDockFringe(ctx, deckY, deckH) {
  // A drying net slung under the lantern eave, near the dock's edge post.
  const nx = DOCK_EDGE_X - 44, ny = deckY - 10;
  ctx.save();
  ctx.translate(nx, ny);
  ctx.strokeStyle = 'rgba(196, 168, 120, 0.55)';
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(-16, -6); ctx.quadraticCurveTo(0, 10, 16, -6);
  ctx.stroke();
  for (let i = -12; i <= 12; i += 6) {
    ctx.beginPath();
    ctx.moveTo(i, -6 + Math.abs(i) * -0.05);
    ctx.quadraticCurveTo(i * 0.5, 6, 0, 3);
    ctx.stroke();
  }
  ctx.restore();

  // Rope coils and barnacle crust wrapped around each support post — part
  // of the structure itself, not clutter sitting on the walkable deck.
  for (let x = 30; x < DOCK_EDGE_X; x += 54) {
    const postX = x + 5;
    ctx.save();
    ctx.strokeStyle = 'rgba(120, 100, 70, 0.6)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(postX, deckY + deckH + 6, 7, 3.4, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(postX, deckY + deckH + 12, 6.4, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(150, 165, 150, 0.35)';
    for (let i = 0; i < 4; i++) {
      ctx.beginPath();
      ctx.arc(postX - 3 + i * 2.1, deckY + deckH + 20 + (i % 2) * 3, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Seaweed clumps and driftwood bobbing in the water beside the pilings —
  // decoration pushed outside the deck entirely, into the water fringe.
  const weedSpots = [[46, 40], [140, 58], [220, 34]];
  ctx.save();
  ctx.strokeStyle = 'rgba(95, 227, 192, 0.3)';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  for (const [wx, wy] of weedSpots) {
    const by = deckY + deckH + wy;
    ctx.beginPath();
    ctx.moveTo(wx - 4, by + 6);
    ctx.quadraticCurveTo(wx - 6, by - 2, wx - 1, by - 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(wx + 3, by + 6);
    ctx.quadraticCurveTo(wx + 6, by, wx + 2, by - 8);
    ctx.stroke();
  }
  ctx.restore();
}

function drawGulls(ctx, t) {
  for (let i = 0; i < 4; i++) {
    const gx = ((i * 210 + t * 20) % (WORLD_W + 60)) - 30;
    const gy = 26 + i * 14 + Math.sin(t * 1.4 + i) * 4;
    const flap = Math.sin(t * 7 + i) * 3;
    ctx.strokeStyle = 'rgba(220, 232, 226, 0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gx - 5, gy + flap * 0.3);
    ctx.quadraticCurveTo(gx, gy - flap, gx + 5, gy + flap * 0.3);
    ctx.stroke();
  }
}

// Distinct silhouette poses per fishing phase — a wind-up lean while
// charging, a forward follow-through right after release, a four-beat idle
// cycle while waiting on a bite, a sharp snap at hookset, and a pull/rest
// rhythm while reeling. All derived from fields fishingMachine.js already
// tracks, so no changes were needed there.
function anglerPose(f, t) {
  switch (f.state) {
    case 'charging': {
      const p = f.chargePower;
      return { lean: -0.05 - p * 0.16, bob: Math.sin(t * 4) * 0.4, armLift: p * 0.35 };
    }
    case 'flying': {
      const ft = Math.min(f.flightT, 1);
      const followThrough = Math.sin(ft * Math.PI);
      return { lean: 0.22 * (1 - ft * 0.6), bob: 0, armLift: 0.35 + followThrough * 0.25 };
    }
    case 'waiting': {
      const cycle = (t * 0.55) % 4;
      const phase = Math.floor(cycle);
      const localT = cycle - phase;
      const idleBob = Math.sin(t * 2) * 0.5;
      if (phase === 0) return { lean: 0, bob: idleBob, armLift: 0 }; // neutral
      if (phase === 1) return { lean: 0.035 * Math.sin(localT * Math.PI), bob: idleBob, armLift: 0 }; // small shift
      if (phase === 2) return { lean: -0.02, bob: idleBob - 0.4, armLift: 0.05 }; // look at the bobber
      return { lean: Math.sin(localT * Math.PI) * 0.09, bob: idleBob, armLift: 0 }; // look back & sway
    }
    case 'hookset': {
      const snap = Math.max(0, 1 - f.hooksetTimer * 7);
      return { lean: -0.24 * snap - 0.06, bob: -snap * 2, armLift: 0.2 + snap * 0.3 };
    }
    case 'reeling': {
      const pull = Math.min(f.tension, 100) / 100;
      const tug = Math.sin(t * 9) * 0.04;
      return { lean: -0.14 - pull * 0.16 + tug, bob: Math.sin(t * 5) * 1.4, armLift: 0.3 + pull * 0.2 };
    }
    default:
      return { lean: 0, bob: 0, armLift: 0 };
  }
}

function drawAnglerSilhouette(ctx, deckY, f, t, rodMaterial, avatar) {
  const standX = DOCK_EDGE_X - 32;
  const standY = deckY;
  const pose = anglerPose(f, t);
  const rod = materialColors(rodMaterial);
  const A = resolveAppearance(avatar);

  drawShadow(ctx, standX, standY + 3, 12, 5, 0.35);

  ctx.save();
  ctx.translate(standX, standY + pose.bob);
  ctx.rotate(pose.lean);

  // Boots
  ctx.fillStyle = A.bootDark;
  ctx.fillRect(-7, -14, 6, 16);
  ctx.strokeStyle = TOON_OUTLINE; ctx.lineWidth = 1.1; ctx.strokeRect(-7, -14, 6, 16);
  ctx.fillRect(2, -14, 6, 16);
  ctx.strokeRect(2, -14, 6, 16);
  ctx.fillStyle = A.bootCuff;
  ctx.fillRect(-8, -16, 8, 3.5);
  ctx.fillRect(1, -16, 8, 3.5);

  // Trousers, above the boot cuffs
  ctx.fillStyle = A.pants;
  ctx.fillRect(-7, -22, 6, 7);
  ctx.fillRect(2, -22, 6, 7);
  ctx.strokeStyle = A.pantsDark;
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-4, -22); ctx.lineTo(-4, -15); ctx.moveTo(5, -22); ctx.lineTo(5, -15); ctx.stroke();

  // Shirt, showing at the vest's open front edge
  ctx.fillStyle = A.shirt;
  ctx.beginPath();
  ctx.moveTo(-6, -41);
  ctx.lineTo(6, -41);
  ctx.lineTo(8, -12);
  ctx.lineTo(-4, -14);
  ctx.closePath();
  ctx.fill();

  // Vest with a flared tail — a touch shorter and broader than before so
  // the figure reads as the same stocky build as the walking sprite.
  const bodyGrad = ctx.createLinearGradient(0, -41, 0, -12);
  bodyGrad.addColorStop(0, A.vestLight);
  bodyGrad.addColorStop(1, A.vestDark);
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-10, -41);
  ctx.lineTo(-1, -41);
  ctx.lineTo(-3, -14);
  ctx.lineTo(-10, -18);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.2);
  ctx.beginPath();
  ctx.moveTo(10, -41);
  ctx.lineTo(3, -41);
  ctx.lineTo(6, -12);
  ctx.lineTo(12, -12);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.2);

  // Satchel strap, diagonal across the chest
  ctx.strokeStyle = A.strap;
  ctx.lineWidth = 2.2;
  ctx.beginPath(); ctx.moveTo(-4, -39); ctx.lineTo(7, -13); ctx.stroke();

  // Far arm, gripping the rod handle with a visible bend at the elbow
  drawJointedLimb(ctx, -7, -36, -1, -28, 4, -30, 4.6, '#d8b98c');

  // Head, matching the walking sprite's proportions
  ctx.fillStyle = A.skin;
  ctx.beginPath();
  ctx.arc(0, -49, 9, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.3);

  // Full beard, in profile — the same grizzled outdoorsman look as the
  // walking sprite, not a clean-shaven pirate deckhand.
  ctx.fillStyle = A.beard;
  ctx.beginPath();
  ctx.moveTo(-1, -47);
  ctx.quadraticCurveTo(-4, -40, -1, -34);
  ctx.quadraticCurveTo(4, -32, 8, -37);
  ctx.quadraticCurveTo(9, -44, 6, -47.5);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.1);

  // Calm eye, no exaggerated cartoon whites/highlight
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.ellipse(4.5, -49, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();

  // Wide-brim tan hat, in profile
  ctx.fillStyle = A.hat;
  ctx.beginPath();
  ctx.ellipse(0, -55, 11, 4.4, -0.05, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.2);
  ctx.fillStyle = A.hatDark;
  ctx.beginPath();
  ctx.ellipse(0, -55.6, 11, 3.2, -0.05, 0, Math.PI, true);
  ctx.fill();
  ctx.fillStyle = A.hat;
  ctx.beginPath();
  ctx.ellipse(-0.5, -59, 6, 5.6, -0.05, Math.PI, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);
  ctx.fillStyle = A.hatBand;
  ctx.beginPath();
  ctx.ellipse(0, -56.4, 6.2, 1.6, -0.05, 0, Math.PI);
  ctx.fill();

  // Rod — the lift/bend amount comes from the current pose, the color and
  // a tip glow (for exotic materials) come from the equipped rod.
  const tipX = 38 - pose.armLift * 22;
  const tipY = -73 - pose.armLift * 18;

  // Near arm, steadying the rod further up the shaft — between the two
  // arms this is what actually reads as "gripping a fishing rod" instead
  // of a floating stick.
  const gripX = 4 + (tipX - 4) * 0.35, gripY = -30 + (tipY + 30) * 0.35;
  drawJointedLimb(ctx, 8, -38, 14, -34, gripX, gripY, 4.2, '#d8b98c');

  const rodGrad = ctx.createLinearGradient(4, -30, tipX, tipY);
  rodGrad.addColorStop(0, rod.dark);
  rodGrad.addColorStop(1, rod.base);
  ctx.strokeStyle = rodGrad;
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(4, -30);
  ctx.quadraticCurveTo(24, -60, tipX, tipY);
  ctx.stroke();
  if (rod.glow) {
    const tipGlow = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, 9);
    tipGlow.addColorStop(0, rod.glow + 'cc');
    tipGlow.addColorStop(1, rod.glow + '00');
    ctx.fillStyle = tipGlow;
    ctx.beginPath();
    ctx.arc(tipX, tipY, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();

  return { tipXAbs: standX + tipX, tipYAbs: standY + pose.bob + tipY };
}

function drawChargeMeter(ctx, f) {
  const w = 70, h = 8, x = ROD_TIP.x - w / 2, y = WATERLINE_Y - 96;
  ctx.save();
  ctx.fillStyle = 'rgba(2,10,14,0.6)';
  ctx.fillRect(x - 2, y - 2, w + 4, h + 4);
  ctx.fillStyle = '#1c3a3a';
  ctx.fillRect(x, y, w, h);
  const grad = ctx.createLinearGradient(x, 0, x + w, 0);
  grad.addColorStop(0, '#5fe3c0');
  grad.addColorStop(1, '#ffb454');
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w * f.chargePower, h);
  ctx.restore();
}

function drawLine(ctx, from, to) {
  ctx.save();
  ctx.strokeStyle = 'rgba(230,240,235,0.6)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo((from.x + to.x) / 2, Math.min(from.y, to.y) - 12, to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawBobberAndFish(ctx, f, bobberPos, t) {
  let dy = 0;
  if (f.state === 'waiting') {
    dy = Math.sin(t * 3) * 2;
    if (f.nibbleActive) dy += 6;
  } else if (f.state === 'hookset') {
    dy = -3 + Math.sin(t * 24) * 2;
  } else if (f.state === 'reeling') {
    dy = Math.sin(t * 14) * 1.6;
  }
  const bx = bobberPos.x, by = bobberPos.y + dy;

  if (f.state !== 'flying') {
    ctx.beginPath();
    ctx.ellipse(bx, by + 4, 9, 3, 0, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(143,233,217,0.4)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.fillStyle = '#ff6f59';
  ctx.beginPath();
  ctx.arc(bx, by, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff6ea';
  ctx.beginPath();
  ctx.arc(bx, by - 2, 5, Math.PI, Math.PI * 2);
  ctx.fill();

  if (f.nibbleActive && f.state === 'waiting') {
    ctx.strokeStyle = 'rgba(255,180,84,0.6)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(bx, by, 13, 0, Math.PI * 2);
    ctx.stroke();
  }

  if (f.state === 'hookset') {
    const ringT = f.hooksetTimer / f.hooksetDuration;
    ctx.strokeStyle = '#ffb454';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(bx, by, 15, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * (1 - ringT));
    ctx.stroke();
    ctx.fillStyle = '#fff6ea';
    ctx.font = '22px "Pirata One", cursive';
    ctx.textAlign = 'center';
    ctx.fillText('!', bx, by - 22);

    if (f.fish) {
      const rarity = rarityOf(f.fish.rarity);
      drawRarityCallout(ctx, rarity, bx, by - 42);
    }
  }

  if (f.state === 'reeling' && f.fish) {
    const rarity = rarityOf(f.fish.rarity);
    ctx.save();
    ctx.globalAlpha = 0.85;
    // A thrash, not a static icon — amplitude and speed both scale with
    // tension, so a fish barely fighting back just sways gently while one
    // about to snap the line whips visibly harder.
    const thrash = 0.1 + (f.tension / 100) * 0.4;
    const wiggle = Math.sin(t * (14 + f.tension * 0.1)) * thrash;
    ctx.translate(bx, by + 14);
    ctx.rotate(wiggle);
    drawFishIcon(ctx, f.fish.shape, 0, 0, 22, rarity.color, { flip: true, ...fishVisualDetail(f.fish.id) });
    ctx.restore();
  }

  return { x: bx, y: by };
}

// Tells the player exactly what they're fighting — a small pill of glow +
// label in the fish's rarity color, used at the hookset moment and again
// pinned above the reel meters for the whole fight.
function drawRarityCallout(ctx, rarity, x, y, big) {
  ctx.save();
  ctx.font = (big ? 'bold 13px' : '11px') + ' "Nunito", sans-serif';
  ctx.textAlign = 'center';
  const label = rarity.label.toUpperCase();
  const w = ctx.measureText(label).width + 20;
  const h = big ? 20 : 16;

  const glow = ctx.createRadialGradient(x, y, 0, x, y, w * 0.8);
  glow.addColorStop(0, rarity.glow + '55');
  glow.addColorStop(1, rarity.glow + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, w * 0.8, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = 'rgba(2,10,14,0.6)';
  roundedRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.fill();
  ctx.strokeStyle = rarity.color;
  ctx.lineWidth = 1.4;
  roundedRect(ctx, x - w / 2, y - h / 2, w, h, h / 2);
  ctx.stroke();

  ctx.fillStyle = rarity.color;
  ctx.textBaseline = 'middle';
  ctx.fillText(label, x, y + 0.5);
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawMeters(ctx, f) {
  if (f.state !== 'reeling') return;
  const rarity = rarityOf(f.fish.rarity);
  const barW = 300, barH = 12, cx = WORLD_W / 2, y1 = WORLD_H - 50, y2 = WORLD_H - 28;
  const x = cx - barW / 2;

  drawRarityCallout(ctx, rarity, cx, y1 - 26, true);

  ctx.save();
  ctx.font = '10px "Nunito", sans-serif';
  ctx.textAlign = 'center';

  ctx.fillStyle = 'rgba(2,10,14,0.55)';
  ctx.fillRect(x - 4, y1 - 4, barW + 8, barH + 8);
  ctx.fillStyle = '#1c3a3a';
  ctx.fillRect(x, y1, barW, barH);
  const progress = 1 - f.distance / 100;
  ctx.fillStyle = rarity.color;
  ctx.fillRect(x, y1, barW * progress, barH);
  ctx.fillStyle = '#cfe8df';
  ctx.fillText('Reel it in!', cx, y1 - 8);

  ctx.fillStyle = 'rgba(2,10,14,0.55)';
  ctx.fillRect(x - 4, y2 - 4, barW + 8, barH + 8);
  ctx.fillStyle = '#1c3a3a';
  ctx.fillRect(x, y2, barW, barH);
  const tensionRatio = f.tension / 100;
  const tColor = tensionRatio > 0.8 ? '#ff6f59' : tensionRatio > 0.5 ? '#ffb454' : '#8fe9d9';
  ctx.fillStyle = tColor;
  ctx.fillRect(x, y2, barW * tensionRatio, barH);
  ctx.restore();
}

export function renderDockScene(ctx, state) {
  const f = state.fishing;
  const t = state.fx.time;
  const region = regionById(state.currentRegion);
  const rodMaterial = equippedRod(state).material;

  drawSky(ctx, t, region.id, state.dayNight.time);
  drawWaterBody(ctx, t, region, state.dayNight.time);
  const deckY = drawDockPlatform(ctx, region);
  const angler = drawAnglerSilhouette(ctx, deckY, f, t, rodMaterial, state.player.avatar);

  // Once the Bonasaur takes over, drawBossScene.js owns everything past
  // this point — the line, bobber, and reel meters would otherwise still
  // show the frozen ordinary cast underneath the fight.
  const bossActive = state.boss && state.boss.state !== 'idle';
  if (bossActive) return;

  if (f.state === 'charging') drawChargeMeter(ctx, f);

  if (f.state === 'flying' || f.state === 'waiting' || f.state === 'hookset' || f.state === 'reeling' || f.state === 'result') {
    const bobberPos = sideViewBobber(f);
    if (f.state !== 'result') {
      drawLine(ctx, { x: angler.tipXAbs, y: angler.tipYAbs }, bobberPos);
      drawBobberAndFish(ctx, f, bobberPos, t);
    }
  }

  drawMeters(ctx, f);
}
