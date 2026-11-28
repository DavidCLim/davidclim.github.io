// MechaZaur's long legs and long tail, drawn from the pencil sketch for them: each leg has a big round hip, a banded
// thigh and shin and a foot with claws pointing down; the tail is a run of banded segments that ends in one long spike
// and two curved blades. Drawn in Robo Trooper's coordinates (facing +x), and all painted live so they can move.
import { TAU, K } from './config.js?v=262';
import { OUT } from './sprites.js?v=262';

export const ZORD_LIFT = 6; // how much higher his legs carry his body

const C = { lite: '#b9add2', mid: '#9b8db6', dark: '#746796', far: '#625680', band: '#5f7a74', steel: '#d3d8e3', steelFar: '#a7aec0', navy: '#4a5478', navyFar: '#3a4262' };

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = (v) => Math.max(0, Math.min(1, v));

function shape(g, fill, lw, path) {
  g.beginPath();
  path();
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  g.strokeStyle = OUT;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  g.stroke();
}

const ball = (g, fill, x, y, r, lw = 1.7) => shape(g, fill, lw, () => g.arc(x, y, r, 0, TAU));

// one tapered length from a (radius ra) to b (radius rb), with bands slanting across it like the sketch's hatching
function segment(g, a, b, ra, rb, fill, bands) {
  const an = Math.atan2(b[1] - a[1], b[0] - a[0]);
  const side = an + Math.PI / 2;
  const path = () => {
    g.moveTo(a[0] + Math.cos(side) * ra, a[1] + Math.sin(side) * ra);
    g.lineTo(b[0] + Math.cos(side) * rb, b[1] + Math.sin(side) * rb);
    g.arc(b[0], b[1], rb, side, side - Math.PI, true);
    g.lineTo(a[0] - Math.cos(side) * ra, a[1] - Math.sin(side) * ra);
    g.arc(a[0], a[1], ra, side - Math.PI, side - TAU, true);
  };
  shape(g, fill, 2, path);
  if (!bands) return;
  g.save();
  g.beginPath();
  path();
  g.clip();
  g.strokeStyle = C.band;
  g.lineWidth = 1.7;
  for (let i = 1; i <= bands; i++) {
    const k = i / (bands + 1);
    const x = lerp(a[0], b[0], k);
    const y = lerp(a[1], b[1], k);
    const r = lerp(ra, rb, k) + 2;
    g.beginPath();
    g.moveTo(x + Math.cos(side - 0.45) * r, y + Math.sin(side - 0.45) * r);
    g.lineTo(x - Math.cos(side - 0.45) * r, y - Math.sin(side - 0.45) * r);
    g.stroke();
  }
  g.restore();
}

// a claw hooking downward from (x, y)
function claw(g, x, y, lean, fill) {
  shape(g, fill, 1.1, () => {
    g.moveTo(x - 1.7, y - 1);
    g.quadraticCurveTo(x + 2.7 + lean, y + 0.7, x + 0.8 + lean, y + 4.6);
    g.quadraticCurveTo(x + 0.3 + lean * 0.5, y + 1.9, x - 1.3, y + 1.5);
  });
}

// hip: where the leg joins him. foot: where it stands. far: the leg on the other side of him
function leg(g, hip, foot, far) {
  const mx = (hip[0] + foot[0]) / 2;
  const my = (hip[1] + foot[1]) / 2;
  const dx = foot[0] - hip[0];
  const dy = foot[1] - hip[1];
  const d = Math.hypot(dx, dy) || 1;
  const out = Math.sqrt(Math.max(0, 9.5 * 9.5 - (d / 2) * (d / 2)));
  // the knee sticks out forward
  const knee = [mx + (dy / d) * out, my - (dx / d) * out];
  segment(g, hip, knee, 4.4, 3, far ? C.far : C.mid, 2);
  segment(g, knee, foot, 2.8, 2.3, far ? C.far : C.dark, 1);
  ball(g, far ? C.steelFar : C.steel, knee[0], knee[1], 2.7, 1.3);
  // the foot and its three claws
  shape(g, far ? C.navyFar : C.navy, 1.7, () => {
    g.moveTo(foot[0] - 3.4, foot[1] - 0.6);
    g.quadraticCurveTo(foot[0] + 1.4, foot[1] - 4.2, foot[0] + 7.4, foot[1] - 0.9);
    g.quadraticCurveTo(foot[0] + 9, foot[1] + 2, foot[0] + 5.4, foot[1] + 2.3);
    g.lineTo(foot[0] - 2.4, foot[1] + 2.4);
  });
  for (const [ox, lean] of [[-1, -1.5], [2.9, 0], [6.6, 1.3]]) claw(g, foot[0] + ox, foot[1] + 1, lean, far ? C.steelFar : C.steel);
  // the big round hip
  ball(g, far ? C.far : C.lite, hip[0], hip[1], far ? 4.4 : 5.8, 1.7);
  if (!far) {
    ball(g, C.band, hip[0], hip[1], 2.9, 1.1);
    ball(g, '#1fbc9c', hip[0], hip[1], 1.4, 0.8);
  }
}

// One of his legs, in the space of the ground he stands on. i: 0 near, 1 far. m: { phase, move (0..1 walking),
// ride (how far his body has bobbed), spread (a wider stance), air (0..1 dangling), clock }
export function drawZordLeg(g, i, m) {
  const far = i === 1;
  const a = (m.phase || 0) + i * Math.PI;
  const lift = Math.max(0, Math.sin(a));
  const hip = [far ? 9 : -7, (far ? 9 : 11) + (m.ride || 0)];
  const foot = [(far ? 11 : -7) + (far ? 1 : -1) * (m.spread || 0) * 0.6 - Math.cos(a) * 7 * (m.move || 0), (far ? 22.5 : 24.5) - lift * 6 * (m.move || 0) + Math.min(0, m.hop || 0)];
  if (m.air > 0) {
    const sway = Math.sin((m.clock || 0) * 4.2 + i * 2.2);
    foot[0] += (-3 + sway * 1.3) * m.air;
    foot[1] += (-2 + sway) * m.air;
  }
  g.save();
  g.scale(K, K);
  leg(g, hip, foot, far);
  g.restore();
}

// ---------------------------------------------------------------- the tail
const ROOT_Y = 1; // where it leaves his back (before the legs lift him)
const REST = [[-18, 13, 5], [-24, 17, 4.5], [-30, 19, 4], [-36, 18.5, 3.5], [-41, 16, 3]];
const GROUND = 27; // and where the ground is, in the space of his raised body

// how far through its full circle the tail has gone, p being how far through the whole swipe he is
export function swipeTurn(p) {
  const k = clamp01((p - 0.24) / 0.6);
  return k * k * (3 - 2 * k);
}
export const SWIPE_BACK = 0.5; // radians he draws it back before he swings
const swipeAngle = (p) => (p < 0.24 ? Math.PI + SWIPE_BACK * Math.sin((p / 0.24) * (Math.PI / 2)) : Math.PI + SWIPE_BACK - (TAU + SWIPE_BACK) * swipeTurn(p));

// The tail's joints this frame, in the space of his raised body. wag: seconds, for its sway; k: how hard it sways;
// droop: pushes its end down; swipe: how far through a swipe he is, or null
export function zordTail(wag, k, droop, swipe) {
  const pts = REST.map(([x, y, r], i) => [x, y + Math.sin(wag - i * 0.75) * i * k + droop * i * i * 0.2, r]);
  if (swipe === null || swipe === undefined) return { pts, front: false, angle: null };
  const w = Math.max(0, Math.min(1, swipe / 0.16, (1 - swipe) / 0.14));
  const angle = swipeAngle(swipe);
  const trail = swipe > 0.24 ? Math.sin(Math.PI * swipeTurn(swipe)) : 0;
  const swung = REST.map(([, , r], i) => {
    const s = i / (REST.length - 1);
    // swung round flat to the ground, the end trailing behind the root
    const a = angle + s * 0.7 * trail;
    const far = 16 + 34 * s;
    // down from his back to just off the ground (which is further down in his raised body's space)
    return [Math.cos(a) * far, lerp(ROOT_Y, GROUND, Math.min(1, s * 1.5)) + Math.sin(a) * far * 0.36, r];
  });
  return { pts: pts.map((p, i) => [lerp(p[0], swung[i][0], w), lerp(p[1], swung[i][1], w), p[2]]), front: w > 0.5 && Math.sin(angle) > 0.12, angle };
}

function blade(g, x, y, dir, len, wide, curl, fill) {
  g.save();
  g.translate(x, y);
  g.rotate(dir);
  shape(g, fill, 1.8, () => {
    g.moveTo(-2, -wide);
    g.quadraticCurveTo(len * 0.62, -wide + curl * 0.5, len, curl);
    g.quadraticCurveTo(len * 0.58, wide + curl * 0.35, -2, wide);
  });
  g.restore();
}

// `lit` 0..1 runs teal light into the blades
export function drawZordTail(g, tail, lit = 0) {
  g.save();
  g.scale(K, K);
  const { pts } = tail;
  const n = pts.length;
  // the end: one long spike and two curved blades
  const [ex, ey] = pts[n - 1];
  const [bx, by] = pts[n - 2];
  const out = Math.atan2(ey - by, ex - bx);
  const up = Math.cos(out) < 0 ? 1 : -1; // whichever way round points the long spike skyward
  const steel = lit > 0.4 ? '#b7f7e6' : C.steel;
  blade(g, ex, ey, out + up * 0.72, 13, 2.3, up * 0.7, steel);
  blade(g, ex, ey, out + up * 0.04, 9, 2.3, up * 2.8, steel);
  blade(g, ex, ey, out - up * 0.52, 8.6, 2.3, up * 3.1, steel);
  for (let i = n - 2; i >= 0; i--) {
    const [x0, y0, r0] = pts[i];
    const [x1, y1, r1] = pts[i + 1];
    segment(g, [x0, y0], [x1, y1], r0 * 0.96, r1, i % 2 ? C.mid : C.lite, 1);
  }
  ball(g, C.band, ex, ey, 3.3, 1.4);
  g.restore();
}

// the rush of air behind the end of the tail as it goes round
export function drawSwoosh(g, swipe, front) {
  if (swipe === null || swipe === undefined || swipe < 0.26 || swipe > 0.94) return;
  const angle = swipeAngle(swipe);
  const strong = Math.min(1, Math.sin(Math.PI * clamp01((swipe - 0.26) / 0.68)) * 1.5);
  g.save();
  g.scale(K, K);
  g.lineCap = 'round';
  for (const [radius, wide, rgb, a] of [[52, 7, '60, 225, 190', 0.55], [62, 3, '255, 255, 255', 0.9], [62, 1.4, '40, 190, 160', 0.9], [43, 2.6, '120, 240, 210', 0.5]]) {
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const a0 = angle + (i / steps) * 1.7;
      const a1 = angle + ((i + 1) / steps) * 1.7;
      if (Math.sin(a0) > 0.12 !== front) continue;
      g.strokeStyle = `rgba(${rgb}, ${a * strong * (1 - i / steps)})`;
      g.lineWidth = wide * (1 - (i / steps) * 0.7);
      g.beginPath();
      g.moveTo(Math.cos(a0) * radius, GROUND + Math.sin(a0) * radius * 0.36);
      g.lineTo(Math.cos(a1) * radius, GROUND + Math.sin(a1) * radius * 0.36);
      g.stroke();
    }
  }
  g.restore();
}
