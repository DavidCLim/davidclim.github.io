// A continuous day/night cycle, independent of the weather system (data/
// weather.js handles sky conditions; this handles the sun itself). `time`
// is a 0-1 fraction of a full day, looped by world/dayNight.js — 0/1 is
// sunrise, 0.25 is noon, 0.5 is sunset, 0.75 is midnight.
import { lerpColor } from '../util/color.js';

export const DAY_LENGTH = 480; // seconds for one full in-game day

// A smooth 0 (full daylight) -> 1 (deepest night) curve across the day
// instead of hard-cut phases, so dawn/dusk read as an actual gradient
// rather than a visible pop the moment "day" flips to "night". Peaks at
// t=0.75 (midnight), bottoms out at t=0.25 (noon).
export function nightAmount(t) {
  return (1 - Math.cos((t - 0.25) * Math.PI * 2)) / 2;
}

// Four labeled quartiles, offset so each one's center lines up with the
// nightAmount curve's own peak/trough — purely cosmetic (HUD clock label,
// toast on phase change), the actual lighting/gameplay math only ever reads
// the continuous curve above.
const PHASES = {
  dawn: { id: 'dawn', label: 'Dawn', icon: '🌅' },
  day: { id: 'day', label: 'Day', icon: '☀️' },
  dusk: { id: 'dusk', label: 'Dusk', icon: '🌇' },
  night: { id: 'night', label: 'Night', icon: '🌙' },
};

export function dayPhase(t) {
  const tt = ((t % 1) + 1) % 1;
  if (tt < 0.125) return PHASES.dawn;
  if (tt < 0.375) return PHASES.day;
  if (tt < 0.625) return PHASES.dusk;
  if (tt < 0.875) return PHASES.night;
  return PHASES.dawn;
}

// Deep-navy wash the night overlay (render/drawDayNight.js) fades toward,
// and how heavily it can darken the scene at its absolute deepest — capped
// well short of black so nothing ever becomes unreadable.
export const NIGHT_COLOR = '#0a1428';
export const NIGHT_MAX_ALPHA = 0.5;

// Fishing at true night (nightAmount past this line) is a little luckier —
// same "harsher conditions, better odds" idea weather/regions already use,
// scaled from 0 at the threshold up to NIGHT_LUCK_MAX at deepest night.
export const NIGHT_LUCK_THRESHOLD = 0.6;
export const NIGHT_LUCK_MAX = 0.06;

export function nightLuckBonus(t) {
  const n = nightAmount(t);
  if (n <= NIGHT_LUCK_THRESHOLD) return 0;
  return ((n - NIGHT_LUCK_THRESHOLD) / (1 - NIGHT_LUCK_THRESHOLD)) * NIGHT_LUCK_MAX;
}

export function isDeepNight(t) {
  return nightAmount(t) > NIGHT_LUCK_THRESHOLD;
}

// Sky palette — the actual visible cue for "is it day or night," on top of
// the HUD clock. Both the world-view sky (render/drawWater.js) and the
// close-up fishing sky (render/drawDockScene.js) interpolate between these
// endpoints by nightAmount(t), so the sky itself turns blue at noon and
// deep navy at midnight instead of always reading as the same dim,
// permanently-moonlit gradient regardless of the actual time.
const SKY_DAY = { top: '#3a9fdb', mid: '#7cc8ec', horizon: '#cdeef7' };
const SKY_NIGHT = { top: '#020c16', mid: '#0b2733', horizon: '#123847' };
// A warm wash blended in only near the day/night crossover (dawn and dusk),
// not at full day or full night — see the triangular `crossover` weight
// below, which peaks exactly at nightAmount 0.5 (true sunrise/sunset).
const SKY_DAWN_DUSK = { top: '#4a3a6b', mid: '#c96b4a', horizon: '#ffb454' };

export function skyGradientStops(t) {
  const n = nightAmount(t);
  const top = lerpColor(SKY_DAY.top, SKY_NIGHT.top, n);
  const mid = lerpColor(SKY_DAY.mid, SKY_NIGHT.mid, n);
  const horizon = lerpColor(SKY_DAY.horizon, SKY_NIGHT.horizon, n);
  const crossover = Math.max(0, 1 - Math.abs(n - 0.5) * 4);
  if (crossover <= 0) return { top, mid, horizon };
  return {
    top: lerpColor(top, SKY_DAWN_DUSK.top, crossover * 0.5),
    mid: lerpColor(mid, SKY_DAWN_DUSK.mid, crossover * 0.6),
    horizon: lerpColor(horizon, SKY_DAWN_DUSK.horizon, crossover * 0.7),
  };
}

// Water blends the same way the sky does (skyGradientStops above) — each
// gradient stop fades from a sunlit light blue at full day toward whatever
// dark "night" stop the caller already uses (drawWater.js's per-region
// tint, drawDockScene.js's fixed close-up gradient) as nightAmount climbs.
// Exported as three flat day-side colors plus a blend helper rather than a
// stops-object like skyGradientStops returns, since the two water renderers
// don't share the same night-side gradient shape (region-tinted vs. fixed).
export const WATER_DAY_TOP = '#bfe8ff';
export const WATER_DAY_MID = '#5fbdea';
export const WATER_DAY_BOTTOM = '#2f8fc2';

export function blendWaterStop(t, dayColor, nightColor) {
  return lerpColor(dayColor, nightColor, nightAmount(t));
}

export const SUN_COLOR = '#fff3c4';
export const SUN_GLOW = '#ffd76a';
export const MOON_COLOR = '#eef6f2';
export const MOON_GLOW = '#8fe9d9';

// The sun is only ever "up" from sunrise (t=0) to sunset (t=0.5) — returns
// null the rest of the day. `xFrac`/`heightFrac` are both 0..1 fractions
// (left-to-right, horizon-to-zenith) rather than fixed pixel coordinates,
// since drawWater.js's world-view sky and drawDockScene.js's close-up sky
// are different sizes and each maps these onto their own rect.
export function sunArc(t) {
  const tt = ((t % 1) + 1) % 1;
  if (tt > 0.5) return null;
  const frac = tt / 0.5;
  return { xFrac: frac, heightFrac: Math.sin(frac * Math.PI) };
}

// The moon's mirror image, up from sunset (t=0.5) to the next sunrise.
export function moonArc(t) {
  const tt = ((t % 1) + 1) % 1;
  if (tt < 0.5) return null;
  const frac = (tt - 0.5) / 0.5;
  return { xFrac: frac, heightFrac: Math.sin(frac * Math.PI) };
}
