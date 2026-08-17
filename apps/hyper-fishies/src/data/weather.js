// Fisch-style weather cycle — the sky shifts between these on its own timer
// (world/weather.js), each with a real gameplay effect layered on top of
// the normal rod/bait/region odds. Rain and storms bias hardest toward
// rarer fish and shorten the wait for a bite; a storm's bigger payoff comes
// with a real cost — the line strains faster once something's on the hook.
// `color` feeds the top-left weather wheel (ui/weatherWheel.js) — each
// type gets its own wedge.
export const WEATHER_TYPES = {
  clear: { id: 'clear', label: 'Sunny', icon: '☀️', color: '#ffd670', luckBonus: 0, waitMul: 1, tensionMul: 1, weight: 35, minDuration: 90, maxDuration: 150 },
  cloudy: { id: 'cloudy', label: 'Cloudy', icon: '☁️', color: '#9fb0c9', luckBonus: 0.02, waitMul: 0.97, tensionMul: 1, weight: 20, minDuration: 60, maxDuration: 100 },
  windy: { id: 'windy', label: 'Windy', icon: '💨', color: '#8fd9c4', luckBonus: 0.02, waitMul: 1, tensionMul: 1.08, weight: 12, minDuration: 45, maxDuration: 80 },
  foggy: { id: 'foggy', label: 'Foggy', icon: '🌫️', color: '#c9c2d8', luckBonus: 0.05, waitMul: 1.1, tensionMul: 1, weight: 8, minDuration: 40, maxDuration: 70 },
  rain: { id: 'rain', label: 'Rainy', icon: '🌧️', color: '#6a9adf', luckBonus: 0.08, waitMul: 0.85, tensionMul: 1, weight: 16, minDuration: 45, maxDuration: 75 },
  snowy: { id: 'snowy', label: 'Snowy', icon: '❄️', color: '#eaf6ff', luckBonus: 0.04, waitMul: 0.92, tensionMul: 1, weight: 5, minDuration: 40, maxDuration: 70 },
  storm: { id: 'storm', label: 'Storm', icon: '⛈️', color: '#6b5b95', luckBonus: 0.18, waitMul: 0.8, tensionMul: 1.2, weight: 4, minDuration: 20, maxDuration: 35 },
};

export function weatherDef(state) {
  return WEATHER_TYPES[state.weather.type] || WEATHER_TYPES.clear;
}

export function rollNextWeather(rng = Math.random) {
  const entries = Object.values(WEATHER_TYPES);
  const total = entries.reduce((sum, w) => sum + w.weight, 0);
  let roll = rng() * total;
  for (const w of entries) {
    roll -= w.weight;
    if (roll <= 0) return w;
  }
  return entries[0];
}

export function rollWeatherDuration(weather, rng = Math.random) {
  return weather.minDuration + rng() * (weather.maxDuration - weather.minDuration);
}
