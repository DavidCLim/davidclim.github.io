import { DAY_LENGTH, dayPhase } from '../data/dayNight.js';

// Advances state.dayNight.time once per frame (main.js), looping back to 0
// every DAY_LENGTH seconds — same per-frame-tick shape as world/weather.js's
// updateWeather, just a continuous loop instead of a reroll-on-timeout.
export function updateDayNight(state, dt, toast) {
  const prevPhase = dayPhase(state.dayNight.time);
  state.dayNight.time += dt / DAY_LENGTH;
  if (state.dayNight.time >= 1) {
    state.dayNight.time -= 1;
  }
  const phase = dayPhase(state.dayNight.time);
  if (toast && phase.id !== prevPhase.id) {
    toast(`${phase.icon} ${phase.label} breaks over the water.`);
  }
}
