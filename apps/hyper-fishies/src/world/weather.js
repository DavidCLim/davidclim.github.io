import { rollNextWeather, rollWeatherDuration } from '../data/weather.js';

// Counts down state.weather's timer (main.js, once per frame) and rolls the
// next stretch of weather once it runs out — deliberately weighted so
// storms are rare, short-lived events rather than a state you sit in.
export function updateWeather(state, dt, toast) {
  state.weather.timer -= dt;
  if (state.weather.timer > 0) return;

  const prevType = state.weather.type;
  const next = rollNextWeather();
  state.weather.type = next.id;
  state.weather.timer = rollWeatherDuration(next);

  if (toast && next.id !== prevType) {
    const messages = {
      clear: '☀️ The skies clear.',
      cloudy: '☁️ Clouds roll in overhead.',
      windy: '💨 A stiff wind picks up.',
      foggy: '🌫️ Fog rolls in off the water.',
      rain: '🌧️ Rain begins to fall — the fish are biting.',
      snowy: '❄️ Snow starts to drift down.',
      storm: '⛈️ A storm rolls in — rare fish bite faster, but lines strain harder.',
    };
    toast(messages[next.id] || `The weather shifts to ${next.label}.`);
  }
}
