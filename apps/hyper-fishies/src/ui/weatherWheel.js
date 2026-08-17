import { el } from '../util/dom.js';
import { WEATHER_TYPES, weatherDef } from '../data/weather.js';

// A small circular weather indicator, top-left corner — every weather type
// (data/weather.js) gets an equal wedge, colored and iconed, with whichever
// one is currently active lit up bright while the rest sit dimmed. Redrawn
// every frame (main.js), but it's a handful of canvas arcs — cheap.
const SIZE = 108;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 4;

export function buildWeatherWheel(root) {
  const canvas = el('canvas', { width: SIZE, height: SIZE, class: 'weather-wheel-canvas' });
  const label = el('div', { class: 'weather-wheel-label' });
  const wrap = el('div', { class: 'weather-wheel' }, [canvas, label]);
  root.appendChild(wrap);
  return { wrap, canvas, label };
}

export function updateWeatherWheel(refs, state) {
  const types = Object.values(WEATHER_TYPES);
  const n = types.length;
  const current = weatherDef(state);
  const ctx = refs.canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);

  const anglePer = (Math.PI * 2) / n;
  const start = -Math.PI / 2 - anglePer / 2;

  types.forEach((w, i) => {
    const a0 = start + i * anglePer;
    const a1 = a0 + anglePer;
    const active = w.id === current.id;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(CENTER, CENTER);
    ctx.arc(CENTER, CENTER, RADIUS, a0, a1);
    ctx.closePath();
    ctx.fillStyle = w.color;
    ctx.globalAlpha = active ? 1 : 0.32;
    ctx.fill();
    ctx.lineWidth = active ? 2.5 : 1;
    ctx.strokeStyle = active ? '#fff6ea' : 'rgba(20,12,6,0.45)';
    ctx.globalAlpha = 1;
    ctx.stroke();
    ctx.restore();

    const mid = a0 + anglePer / 2;
    const iconR = RADIUS * 0.6;
    const ix = CENTER + Math.cos(mid) * iconR;
    const iy = CENTER + Math.sin(mid) * iconR;
    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.55;
    ctx.font = `${active ? 17 : 13}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(w.icon, ix, iy);
    ctx.restore();
  });

  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS * 0.22, 0, Math.PI * 2);
  ctx.fillStyle = '#2c1e10';
  ctx.fill();
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  refs.label.textContent = `${current.icon} ${current.label}`;
}
