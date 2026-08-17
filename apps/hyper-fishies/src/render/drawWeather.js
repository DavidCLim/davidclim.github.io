// A light rain/storm overlay (data/weather.js) drawn over whichever scene
// is active — a darkening wash plus scrolling rain streaks, deterministic
// per-drop (seeded off its own index) so they don't jitter frame to frame,
// just scroll steadily with state.fx.time.
import { WORLD_W, WORLD_H } from '../core/constants.js';
import { weatherDef } from '../data/weather.js';

export function drawWeatherOverlay(ctx, state) {
  const def = weatherDef(state);
  if (def.id === 'clear') return;

  const t = state.fx.time;
  const intensity = def.id === 'storm' ? 1 : 0.55;

  ctx.save();
  ctx.fillStyle = `rgba(4, 10, 16, ${0.14 * intensity})`;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);

  ctx.strokeStyle = `rgba(200, 220, 235, ${0.4 * intensity})`;
  ctx.lineWidth = 1.4;
  ctx.lineCap = 'round';
  const count = def.id === 'storm' ? 100 : 55;
  for (let i = 0; i < count; i++) {
    const seed = i * 97.13;
    const x = ((seed * 13.37 + t * 340) % (WORLD_W + 60)) - 30;
    const y = ((seed * 7.91 + t * 780) % (WORLD_H + 60)) - 30;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x - 7, y + 20);
    ctx.stroke();
  }
  ctx.restore();
}
