import { el } from '../util/dom.js';
import { nightAmount, dayPhase } from '../data/dayNight.js';
import { lerpColor } from '../util/color.js';

// A small analog clock, next to the weather wheel — a dark/light face that
// tints toward the current moment's own day/night color, hour-style ticks
// around the rim with the four phase icons standing in for 12/3/6/9, and a
// single hand sweeping around to the current time. Used to be a 48-slice
// rotating color wheel showing the *whole* day's gradient at once, which
// read as a smeared rainbow blob rather than a clock — this only ever shows
// "where the hand points right now," the same way an actual clock does.
// Redrawn every frame (main.js), same cheap canvas-arc budget as before.
const SIZE = 108;
const CENTER = SIZE / 2;
const RADIUS = SIZE / 2 - 4;
const FACE_DAY = ['#3a2818', '#241708'];
const FACE_NIGHT = ['#0e1826', '#060a14'];
const RIM_GOLD = '#c9a227';

// Dawn/day/dusk/night sit exactly on the clock's 12/3/6/9 the same way the
// nightAmount curve's own peak/trough do (data/dayNight.js) — t=0 is dawn at
// the top, t=0.25 is noon at 3 o'clock, t=0.5 is dusk at the bottom, t=0.75
// is midnight at 9 o'clock.
const PHASE_MARKS = [
  { t: 0, icon: '🌅' },
  { t: 0.25, icon: '☀️' },
  { t: 0.5, icon: '🌇' },
  { t: 0.75, icon: '🌙' },
];

function angleFor(t) {
  return -Math.PI / 2 + t * Math.PI * 2;
}

export function buildDayNightClock(root) {
  const canvas = el('canvas', { width: SIZE, height: SIZE, class: 'daynight-clock-canvas' });
  const label = el('div', { class: 'daynight-clock-label' });
  const wrap = el('div', { class: 'daynight-clock' }, [canvas, label]);
  root.appendChild(wrap);
  return { wrap, canvas, label };
}

export function updateDayNightClock(refs, state) {
  const t = state.dayNight.time;
  const n = nightAmount(t);
  const phase = dayPhase(t);
  const ctx = refs.canvas.getContext('2d');
  ctx.clearRect(0, 0, SIZE, SIZE);

  // Face: a soft radial wash that itself tints from a warm dusk-brown at
  // full day toward a deep midnight navy at full night — one ambient cue
  // for "roughly how bright is it right now," not a map of the whole day.
  const faceGrad = ctx.createRadialGradient(CENTER, CENTER - RADIUS * 0.3, 2, CENTER, CENTER, RADIUS);
  faceGrad.addColorStop(0, lerpColor(FACE_DAY[0], FACE_NIGHT[0], n));
  faceGrad.addColorStop(1, lerpColor(FACE_DAY[1], FACE_NIGHT[1], n));
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS, 0, Math.PI * 2);
  ctx.fillStyle = faceGrad;
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = RIM_GOLD;
  ctx.stroke();

  // Twelve short hour-style ticks around the rim, same plain "this is a
  // clock face" cue an ordinary analog clock gives at a glance.
  ctx.strokeStyle = 'rgba(240, 226, 196, 0.4)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
    const r0 = RADIUS * 0.86;
    const r1 = RADIUS * 0.96;
    ctx.beginPath();
    ctx.moveTo(CENTER + Math.cos(a) * r0, CENTER + Math.sin(a) * r0);
    ctx.lineTo(CENTER + Math.cos(a) * r1, CENTER + Math.sin(a) * r1);
    ctx.stroke();
  }

  // The four phase icons standing in for 12/3/6/9 — dimmed except whichever
  // one the current time actually falls under, so the active quarter reads
  // at a glance the same way a bolded number would.
  for (const mark of PHASE_MARKS) {
    const a = angleFor(mark.t);
    const mr = RADIUS * 0.72;
    const mx = CENTER + Math.cos(a) * mr;
    const my = CENTER + Math.sin(a) * mr;
    const active = mark.icon === phase.icon;
    ctx.save();
    ctx.globalAlpha = active ? 1 : 0.4;
    ctx.font = `${active ? 15 : 12}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(mark.icon, mx, my);
    ctx.restore();
  }

  // The hand itself, sweeping from the hub out toward the current time's
  // angle — a plain gold line, same "the hand is pointing at now" read a
  // real clock gives without needing any marker riding along its tip.
  const angle = angleFor(t);
  const handLen = RADIUS * 0.56;
  ctx.save();
  ctx.strokeStyle = RIM_GOLD;
  ctx.lineWidth = 2.2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(CENTER, CENTER);
  ctx.lineTo(CENTER + Math.cos(angle) * handLen, CENTER + Math.sin(angle) * handLen);
  ctx.stroke();
  ctx.restore();

  // Center hub, same treatment the weather wheel's own hub gets.
  ctx.beginPath();
  ctx.arc(CENTER, CENTER, RADIUS * 0.16, 0, Math.PI * 2);
  ctx.fillStyle = '#2c1e10';
  ctx.fill();
  ctx.strokeStyle = RIM_GOLD;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  refs.label.textContent = `${phase.icon} ${phase.label}`;
}
