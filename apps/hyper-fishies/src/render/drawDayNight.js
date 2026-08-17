// A translucent night wash over whichever scene is active, scaling smoothly
// with data/dayNight.js's nightAmount curve — dims the pier/dock/props at
// night on top of the sky itself already turning dark (render/drawWater.js,
// render/drawDockScene.js own the sun/moon/stars now, so this stays a flat
// wash rather than drawing a second star field on top of theirs).
import { WORLD_W, WORLD_H } from '../core/constants.js';
import { nightAmount, NIGHT_COLOR, NIGHT_MAX_ALPHA } from '../data/dayNight.js';

export function drawDayNightOverlay(ctx, state) {
  const n = nightAmount(state.dayNight.time);
  if (n <= 0.02) return;

  ctx.save();
  ctx.fillStyle = NIGHT_COLOR;
  ctx.globalAlpha = n * NIGHT_MAX_ALPHA;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.restore();
}
