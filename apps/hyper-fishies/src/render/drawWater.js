import { WORLD_W, WATER_LINE } from '../core/constants.js';
import { regionById } from '../data/regions.js';
import {
  skyGradientStops, sunArc, moonArc, nightAmount, SUN_COLOR, SUN_GLOW, MOON_COLOR, MOON_GLOW,
  WATER_DAY_TOP, WATER_DAY_MID, WATER_DAY_BOTTOM, blendWaterStop,
} from '../data/dayNight.js';

// The top slice of the water rect is now a real sky — blue and sun-lit at
// noon, deep navy with stars and a moon at midnight — rather than the water
// gradient running all the way to y=0. Kept short relative to WATER_LINE
// since this view is mostly pier/dock; just enough to read as "the sky",
// with the region-tinted water gradient taking over beneath it.
const SKY_HEIGHT = WATER_LINE * 0.42;

function drawCelestialBody(ctx, arc, bandHeight, color, glowColor, radius) {
  const x = WORLD_W * (0.08 + arc.xFrac * 0.84);
  const y = bandHeight * (1 - arc.heightFrac * 0.85);
  const glow = ctx.createRadialGradient(x, y, 0, x, y, radius * 6);
  glow.addColorStop(0, glowColor + '55');
  glow.addColorStop(1, glowColor + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, WORLD_W, bandHeight + 20);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
}

function drawSkyBand(ctx, state) {
  const stops = skyGradientStops(state.dayNight.time);
  const grad = ctx.createLinearGradient(0, 0, 0, SKY_HEIGHT);
  grad.addColorStop(0, stops.top);
  grad.addColorStop(0.6, stops.mid);
  grad.addColorStop(1, stops.horizon);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, WORLD_W, SKY_HEIGHT);

  const n = nightAmount(state.dayNight.time);
  if (n > 0.55) {
    const starAlpha = Math.min(1, (n - 0.55) / 0.3);
    ctx.save();
    for (let i = 0; i < 26; i++) {
      const sx = (i * 137) % WORLD_W;
      const sy = (i * 53) % Math.max(1, SKY_HEIGHT - 6) + 3;
      const tw = 0.4 + 0.6 * Math.abs(Math.sin(state.fx.time * 1.6 + i * 2.1));
      ctx.globalAlpha = starAlpha * tw;
      ctx.fillStyle = '#eaf6f1';
      ctx.fillRect(sx, sy, 1.4, 1.4);
    }
    ctx.restore();
  }

  const sun = sunArc(state.dayNight.time);
  if (sun) drawCelestialBody(ctx, sun, SKY_HEIGHT, SUN_COLOR, SUN_GLOW, 15);
  const moon = moonArc(state.dayNight.time);
  if (moon) drawCelestialBody(ctx, moon, SKY_HEIGHT, MOON_COLOR, MOON_GLOW, 13);
}

// Water fill + parallax wave bands + a foam line right where the water
// meets the pier. Clipped to each water region (the main horizon strip and
// the fishing jetty's gap). Colors shift per the current region (see
// data/regions.js) so each destination still reads distinct beneath the
// shared day/night sky drawn above it (drawSkyBand).
function fillWaterRect(ctx, rect, t, deepColor, waveColor, midColor, bottomColor) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  const grad = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
  grad.addColorStop(0, deepColor);
  grad.addColorStop(0.55, midColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle = grad;
  ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = waveColor;
  ctx.lineWidth = 1.2;
  const bandSpacing = 22;
  for (let y = rect.y - bandSpacing; y < rect.y + rect.h + bandSpacing; y += bandSpacing) {
    ctx.beginPath();
    for (let x = rect.x; x <= rect.x + rect.w; x += 12) {
      const wave = Math.sin(x * 0.045 + t * 1.3 + y * 0.02) * 3.5;
      if (x === rect.x) ctx.moveTo(x, y + wave);
      else ctx.lineTo(x, y + wave);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Sparkle glints catching the moonlight
  for (let i = 0; i < 14; i++) {
    const sx = rect.x + ((i * 173 + t * 8) % rect.w);
    const sy = rect.y + ((i * 61) % rect.h);
    const tw = 0.3 + 0.5 * Math.abs(Math.sin(t * 2.2 + i * 1.7));
    ctx.globalAlpha = tw * 0.5;
    ctx.fillStyle = '#eaf6f1';
    ctx.fillRect(sx, sy, 1.2, 1.2);
  }
  ctx.globalAlpha = 1;

  // Foam lapping right at the pier's edge
  const foamY = rect.y + rect.h;
  ctx.strokeStyle = 'rgba(240, 246, 241, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  for (let x = rect.x; x <= rect.x + rect.w; x += 6) {
    const wobble = Math.sin(x * 0.12 + t * 2.4) * 1.6;
    const y = foamY - 3 + wobble;
    if (x === rect.x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.strokeStyle = 'rgba(240, 246, 241, 0.22)';
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  for (let x = rect.x; x <= rect.x + rect.w; x += 6) {
    const wobble = Math.sin(x * 0.09 + t * 2.4 + 1.4) * 1.4;
    const y = foamY - 6 + wobble;
    if (x === rect.x) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.stroke();

  ctx.restore();
}

export function drawWater(ctx, state) {
  const t = state.fx.time;
  const dnT = state.dayNight.time;
  const region = regionById(state.currentRegion);
  const waveColor = region.ambientTint || '#5fe3c0';

  // Each region keeps its own distinct dark water color at night (the
  // existing per-region tint), but by day every region's water lightens
  // toward the same sunlit blue — same "one shared day palette, distinct
  // night palette" split the sky itself doesn't need (the sky has no
  // per-region variant to protect) but the water does.
  const deepColor = blendWaterStop(dnT, WATER_DAY_TOP, region.waterTint || '#02202f');
  const midColor = blendWaterStop(dnT, WATER_DAY_MID, '#0b2733');
  const bottomColor = blendWaterStop(dnT, WATER_DAY_BOTTOM, '#123847');

  drawSkyBand(ctx, state);

  fillWaterRect(ctx, { x: 0, y: SKY_HEIGHT, w: WORLD_W, h: WATER_LINE - SKY_HEIGHT }, t, deepColor, waveColor, midColor, bottomColor);
  fillWaterRect(ctx, { x: 700, y: 130, w: 120, h: 90 }, t, deepColor, waveColor, midColor, bottomColor);
}
