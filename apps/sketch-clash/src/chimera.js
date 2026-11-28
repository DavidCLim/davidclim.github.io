// The Chimera: what it looks like, how it moves and how it fights.
// A great lean lion in a streaming mane; a dark goat with long ridged horns rising from its back, whose legs are its hind
// legs; and a heavy green serpent, red underneath, for a tail. Drawn with fine lines, clean and calm: few strokes, level
// eyes, and its teeth only to be seen when it opens its mouth.
// Each head has its own tricks. The lion leaps, rakes with its claws and roars (leaving those near it seeing stars);
// the goat breathes fire and charges horns first; and the snake, all the while, lashes out and leaves poison behind.
// Drawn in art units, facing +x, with the ground 25 below the origin.
import { TAU, K, FEET } from './config.js?v=269';
import { poly, circ, ell, vgrad } from './art_kit.js?v=269';
import { rigStep, applyBotBody } from './botrig.js?v=269';
import { scorch } from './zordfx.js?v=269';

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (q) => q * q * (3 - 2 * q);
const clamp01 = (q) => Math.max(0, Math.min(1, q));

const INK = '#1d1119'; // the fine dark line round everything
const LW = 0.95; // and how fine it is
const C = {
  fur: '#d6a94e', furLight: '#ecc974', furDark: '#a97a30', furFar: '#8a6128', furDeep: '#7c5620',
  muzzle: '#ead39a', nose: '#33191a', maw: '#58121a', tongue: '#c4515c', tooth: '#fbf6e6', claw: '#2c1c18',
  maneBack: '#7c2f19', maneMid: '#a34c28', maneShine: '#f3cd74', maneGold: '#c28a38',
  gum: '#8d2a33', socket: '#7a4c1c',
  goat: '#44375a', goatLight: '#5e4e7a', goatDark: '#2c223c', goatFar: '#241b31', hoof: '#1b1520',
  horn: '#c3b69a', hornShade: '#8d8069', hornFar: '#857964',
  snake: '#658f36', snakeLight: '#86ad49', snakeDark: '#3d5c22', belly: '#842523', bellyDark: '#561514',
};

// where the goat's head turns on its neck, and how far along from there its mouth is. (config.js puts the fire there)
export const GOAT = { x: 33, y: -63, mouth: 21 };
const GOAT_SIZE = 0.9; // its head, beside the rest
const HEAD = [34, -18]; // the middle of the mane
const FACE = { x: 16, y: 8, size: 0.76 }; // the lion's face within it: small, in all that mane
export const LIFT = 9; // how far the whole upper half stands above where it is laid out, so its legs are long and lean

// ---------------------------------------------------------------- walking
// A paw on the ground is moved back exactly as far as the beast goes forward, so it stays where it was put
const STRIDE = 22;
const STANCE = 0.62;
export const stepLength = (u) => (STRIDE / STANCE) * K * u.def.scale;
export function pawAt(phase) {
  const p = phase - Math.floor(phase);
  if (p < STANCE) return { x: STRIDE / 2 - STRIDE * (p / STANCE), y: 0 };
  const q = (p - STANCE) / (1 - STANCE);
  return { x: -STRIDE / 2 + STRIDE * ease(q), y: -8 * Math.sin(q * Math.PI) };
}

// ---------------------------------------------------------------- drawing
function ink(g, wide = LW, colour = INK) {
  g.strokeStyle = colour;
  g.lineWidth = wide;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.stroke();
}

// fine lines: draw(g) lays them out
function lines(g, wide, draw, colour = INK) {
  g.beginPath();
  draw();
  ink(g, wide, colour);
}

// a closed shape, filled and (unless lw is 0) lined
function shape(g, fill, lw, draw) {
  g.beginPath();
  draw();
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (lw) ink(g, lw);
}

// paint(g) keeps inside the shape draw() lays out
function within(g, draw, paintIn) {
  g.save();
  g.beginPath();
  draw();
  g.closePath();
  g.clip();
  paintIn();
  g.restore();
}

function glow(g, x, y, r, rgb, a) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb}, ${a})`);
  gr.addColorStop(1, `rgba(${rgb}, 0)`);
  g.fillStyle = gr;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
}

// a smooth line through the points, carrying on from wherever the path is
function through(g, pts) {
  for (let i = 1; i < pts.length - 1; i++) g.quadraticCurveTo(pts[i][0], pts[i][1], (pts[i][0] + pts[i + 1][0]) / 2, (pts[i][1] + pts[i + 1][1]) / 2);
  g.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]);
}

// the two edges of something thick running along pts, `wide(i)` across
function edges(pts, wide) {
  const L = [];
  const R = [];
  const n = pts.length;
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    const nx = -(b[1] - a[1]) / d;
    const ny = (b[0] - a[0]) / d;
    const w = wide(i) / 2;
    L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]);
    R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
  }
  return [L, R];
}

// a muscled limb through its joints, as thick at each as `widths` says; `shade` darkens its back edge
function limb(g, joints, widths, fill, shade) {
  const [L, R] = edges(joints, (i) => widths[i]);
  const n = joints.length;
  const round = () => {
    g.moveTo(L[0][0], L[0][1]);
    through(g, L);
    const end = joints[n - 1];
    const before = joints[n - 2];
    const d = Math.hypot(end[0] - before[0], end[1] - before[1]) || 1;
    const reach = widths[n - 1] * 0.55;
    g.quadraticCurveTo(end[0] + ((end[0] - before[0]) / d) * reach, end[1] + ((end[1] - before[1]) / d) * reach, R[n - 1][0], R[n - 1][1]);
    through(g, [...R].reverse());
  };
  g.beginPath();
  round();
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (shade) {
    within(g, round, () => {
      g.beginPath();
      g.moveTo(L[0][0], L[0][1]);
      through(g, L);
      ink(g, 5.4, shade);
    });
  }
  // lined down both sides and round the end, but open at the top, where it grows out of the body
  g.beginPath();
  g.moveTo(L[0][0], L[0][1]);
  through(g, L);
  const end = joints[n - 1];
  const before = joints[n - 2];
  const d = Math.hypot(end[0] - before[0], end[1] - before[1]) || 1;
  const reach = widths[n - 1] * 0.55;
  g.quadraticCurveTo(end[0] + ((end[0] - before[0]) / d) * reach, end[1] + ((end[1] - before[1]) / d) * reach, R[n - 1][0], R[n - 1][1]);
  through(g, [...R].reverse());
  ink(g);
}

// two bones, a and b long, from `top` to `end`: where the joint between them is (side: which way it bends)
function bend(top, end, a, b, side) {
  const dx = end[0] - top[0];
  const dy = end[1] - top[1];
  const real = Math.hypot(dx, dy) || 1;
  const d = Math.max(Math.abs(a - b) + 0.1, Math.min(a + b - 0.05, real));
  const base = Math.atan2(dy, dx);
  const turn = Math.acos(clamp01(((a * a + d * d - b * b) / (2 * a * d) + 1) / 2) * 2 - 1);
  const at = base + side * turn;
  return { joint: [top[0] + Math.cos(at) * a, top[1] + Math.sin(at) * a], end: [top[0] + Math.cos(base) * d, top[1] + Math.sin(base) * d] };
}

// a lion's paw with its claws out. (x, y): the sole under the middle of it. turn: how it is tipped
function paw(g, x, y, turn, far) {
  g.save();
  g.translate(x, y);
  g.rotate(turn);
  const fill = far ? C.furFar : C.fur;
  // short claws, only just showing
  for (const [cx, cy, len] of [[7.2, -3, 4.2], [9, -1, 4.6], [8.8, 0.6, 3.8]]) {
    shape(g, C.claw, 0.5, () => {
      g.moveTo(cx - 1, cy - 1.1);
      g.quadraticCurveTo(cx + len * 0.75, cy - 1.4, cx + len, cy + 1.6);
      g.quadraticCurveTo(cx + len * 0.45, cy + 0.6, cx - 0.8, cy + 1);
    });
  }
  const pad = () => {
    g.moveTo(-6, -3.4);
    g.bezierCurveTo(-3, -8, 5, -8.4, 8, -4.6);
    g.bezierCurveTo(10.6, -3.4, 10.8, 0.4, 8, 1);
    g.lineTo(-3, 1);
    g.bezierCurveTo(-6.4, 0.8, -7.2, -1.6, -6, -3.4);
  };
  shape(g, fill, 0, pad);
  within(g, pad, () => ell(g, 1, 1.6, 10, 2.6, far ? C.furDeep : C.furDark, 0));
  g.beginPath();
  pad();
  g.closePath();
  ink(g);
  lines(g, 0.65, () => {
    for (const [a, b] of [[2.2, -4.6], [5.6, -3.2]]) {
      g.moveTo(a - 1, b - 1.6);
      g.quadraticCurveTo(a + 2, b + 0.8, a + 1.2, b + 3.8);
    }
  });
  g.restore();
}

// a foreleg: heavy at the shoulder, the elbow well back, the forearm reaching down and forward
function foreleg(g, top, foot, turn, far) {
  const wrist = [foot[0] - 5.4, foot[1] - 4];
  const k = far ? bend(top, wrist, 22, 32, 1) : bend(top, wrist, 20, 30, 1);
  const [e, w] = [k.joint, k.end];
  const upper = [(top[0] + e[0]) / 2 - 2.2, (top[1] + e[1]) / 2];
  const fore = [lerp(e[0], w[0], 0.34), lerp(e[1], w[1], 0.34) - 0.6];
  limb(g, [top, upper, e, fore, [lerp(e[0], w[0], 0.75), lerp(e[1], w[1], 0.75)], [w[0] + 1.2, w[1] + 1]], [far ? 16 : 21, far ? 13.4 : 17.4, 9.2, 11.4, 6.8, 7.8], far ? C.furFar : C.fur, far ? C.furDeep : C.furDark);
  if (!far) {
    lines(g, 0.6, () => {
      // the muscle over its shoulder and down the arm
      g.moveTo(top[0] - 8, top[1] + 1);
      g.bezierCurveTo(top[0] - 6, top[1] - 9, top[0] + 8, top[1] - 8, top[0] + 7, top[1] + 4);
      g.moveTo(upper[0] - 1, upper[1] - 5);
      g.quadraticCurveTo(upper[0] + 7, upper[1] + 1, e[0] + 3.4, e[1] - 1);
    });
  }
  paw(g, w[0] + 5.4, w[1] + 4, turn, far);
}

// a goat's hind leg: the thigh running back to a high hock, then a slim shank down and forward to a cloven hoof.
// back: where the hock is from the foot
function hindleg(g, top, foot, back, turn, far) {
  const hock = [foot[0] + back[0], foot[1] + back[1]];
  const knee = [(top[0] + hock[0]) / 2, (top[1] + hock[1]) / 2 + 2.6];
  const ankle = [foot[0] - 1.6, foot[1] - 4.6];
  limb(g, [top, [(top[0] + knee[0]) / 2, (top[1] + knee[1]) / 2], knee, hock, [lerp(hock[0], ankle[0], 0.55) - 1.4, lerp(hock[1], ankle[1], 0.55) + 0.6], ankle], [far ? 13 : 16, far ? 11 : 13.6, far ? 9 : 10.6, far ? 7 : 8, 4.6, 5.2], far ? C.goatFar : C.goat, far ? '#191222' : C.goatDark);
  if (!far) {
    lines(g, 0.65, () => {
      g.moveTo(top[0] - 4, top[1] + 1);
      g.quadraticCurveTo(knee[0], knee[1] - 3, hock[0] + 3, hock[1] - 0.6);
      g.moveTo(hock[0] + 2, hock[1] + 2);
      g.lineTo(ankle[0] - 0.4, ankle[1] - 1);
    }, C.goatLight);
  }
  g.save();
  g.translate(ankle[0], ankle[1]);
  g.rotate(turn);
  shape(g, C.hoof, LW, () => {
    g.moveTo(-2.8, -0.8);
    g.lineTo(2.6, -1.2);
    g.quadraticCurveTo(6.4, 1.4, 7, 5);
    g.lineTo(-3.6, 5);
    g.quadraticCurveTo(-4, 1.8, -2.8, -0.8);
  });
  lines(g, 0.6, () => {
    g.moveTo(2.2, 5);
    g.lineTo(1, 1.2);
    g.moveTo(-2.4, 0.4);
    g.quadraticCurveTo(0.6, 1.4, 3.6, 0.2);
  }, '#6b5c7c');
  g.restore();
}

// the lion's body, tawny in front and turning into the dark goat's haunches behind
function torso(g) {
  const round = () => {
    g.moveTo(-34, -18);
    g.bezierCurveTo(-22, -27, -8, -22, 4, -24);
    g.bezierCurveTo(18, -31, 34, -29, 42, -18);
    g.bezierCurveTo(50, -8, 47, 7, 36, 15);
    g.bezierCurveTo(26, 22, 13, 22, 5, 15);
    g.bezierCurveTo(-2, 6, -12, 3, -20, 7);
    g.bezierCurveTo(-30, 13, -42, 7, -42, -4);
    g.bezierCurveTo(-42, -12, -39, -16, -34, -18);
  };
  shape(g, vgrad(g, -28, 20, C.furLight, C.furDark), 0, round);
  within(g, round, () => {
    // belly shadow
    ell(g, 10, 24, 34, 11, C.furDark, 0, -0.12);
    // the goat's dark coat along its back and rump, with a ragged edge where it meets the gold
    shape(g, vgrad(g, -28, 8, C.goatLight, C.goatDark), 0.8, () => {
      g.moveTo(-54, -40);
      g.lineTo(10, -40);
      g.quadraticCurveTo(5, -28, 7, -20);
      g.quadraticCurveTo(-2, -18, -6, -10);
      g.quadraticCurveTo(-16, -11, -20, -3);
      g.quadraticCurveTo(-30, -4, -36, 6);
      g.lineTo(-34, 20);
      g.lineTo(-54, 20);
    });
  });
  g.beginPath();
  round();
  g.closePath();
  ink(g);
  lines(g, 0.6, () => {
    // shoulder
    g.moveTo(6, -22);
    g.bezierCurveTo(-2, -10, 0, 0, 10, 10);
  });
}

// the lion's golden haunch, folded up in front of the goat's own hind legs. sway: how far its leg has stepped
function haunch(g, sway) {
  const round = () => {
    g.moveTo(-31, -13);
    g.bezierCurveTo(-21, -17, -11, -9, -13, 0);
    g.bezierCurveTo(-14, 6, -17 + sway * 0.7, 11, -18.6 + sway, 17);
    g.quadraticCurveTo(-18.4 + sway, 22.6, -24 + sway, 21.6);
    g.quadraticCurveTo(-28 + sway, 20, -27.6 + sway, 15);
    g.quadraticCurveTo(-31 + sway * 0.6, 9, -35, 4);
    g.bezierCurveTo(-39, -4, -37, -10, -31, -13);
  };
  shape(g, vgrad(g, -15, 22, C.fur, C.furDark), 0, round);
  within(g, round, () => {
    g.beginPath();
    g.moveTo(-31, -13);
    g.bezierCurveTo(-37, -10, -39, -4, -35, 4);
    g.quadraticCurveTo(-31 + sway * 0.6, 9, -27.6 + sway, 15);
    g.quadraticCurveTo(-28 + sway, 20, -24 + sway, 21.6);
    ink(g, 5.4, C.furDark);
  });
  g.beginPath();
  round();
  g.closePath();
  ink(g);
  lines(g, 0.6, () => {
    g.moveTo(-29, -9);
    g.bezierCurveTo(-18, -10, -15, 0, -20, 7);
  });
}

// ---------------------------------------------------------------- the goat
function horn(g, root, c1, c2, tip, wide, fill, shade, heat) {
  const pts = [];
  for (let i = 0; i <= 18; i++) {
    const t = i / 18;
    const at = (j) => (1 - t) ** 3 * root[j] + 3 * (1 - t) ** 2 * t * c1[j] + 3 * (1 - t) * t * t * c2[j] + t ** 3 * tip[j];
    pts.push([at(0), at(1)]);
  }
  const across = (i) => wide * (1 - (i / 18) ** 1.4 * 0.92);
  const [L, R] = edges(pts, across);
  const round = () => {
    g.moveTo(L[0][0], L[0][1]);
    through(g, L);
    through(g, [...R].reverse());
  };
  shape(g, fill, 0, round);
  within(g, round, () => {
    g.beginPath();
    g.moveTo(R[0][0], R[0][1]);
    through(g, R);
    ink(g, wide * 0.55, shade);
  });
  g.beginPath();
  round();
  g.closePath();
  ink(g);
  // ridges all the way along
  lines(g, 0.7, () => {
    for (let i = 3; i < 15; i += 3) {
      g.moveTo(L[i][0], L[i][1]);
      g.quadraticCurveTo(pts[i + 1][0], pts[i + 1][1], R[i][0], R[i][1]);
    }
  }, 'rgba(50, 36, 24, 0.55)');
  if (heat > 0.02) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    through(g, pts);
    ink(g, wide * 0.42, `rgba(255, 96, 30, ${0.65 * heat})`);
    glow(g, tip[0], tip[1], 6 + 3 * heat, '255, 90, 30', 0.75 * heat);
  }
}

// the goat's neck and head. aim: radians (+ down); jaw 0..1; heat: how fiercely the fire is going in it; charge: how
// much fire has gathered before it breathes; fury: its horns wreathed as it charges
function goat(g, o) {
  const lean = (o.aim - 0.55) * 4;
  const gx = GOAT.x;
  const gy = GOAT.y + lean * 0.4;
  const neck = () => {
    g.moveTo(-27, -17);
    g.bezierCurveTo(-18, -45, 2, -58, gx - 7, gy - 10);
    g.lineTo(gx + 3, gy + 8);
    g.bezierCurveTo(gx - 6, -40, 24, -28, 27, -8);
  };
  // a soft dark ruff down the back of the neck
  shape(g, C.goatDark, 0.75, () => {
    g.moveTo(gx - 5, gy - 8);
    for (const [vx, vy, tx, ty] of [[7, -60, -6, -57], [-8, -46, -22, -40], [-21, -30, -31, -19]]) {
      g.quadraticCurveTo((vx + tx) / 2 + 3, ty - 5, tx, ty);
      g.quadraticCurveTo(tx + 8, ty, vx, vy + 5);
    }
    g.lineTo(-6, -20);
    g.lineTo(gx - 2, gy);
  });
  shape(g, vgrad(g, gy - 10, -10, C.goat, C.goatDark), 0, neck);
  within(g, neck, () => {
    g.beginPath();
    g.moveTo(gx + 1, gy + 7);
    g.bezierCurveTo(gx - 7, -40, 22, -28, 25, -8);
    ink(g, 7, C.goatLight);
  });
  g.beginPath();
  neck();
  ink(g);
  lines(g, 0.6, () => {
    g.moveTo(-6, -24);
    g.quadraticCurveTo(2, -48, gx - 8, gy + 4);
  }, C.goatLight);

  g.save();
  g.translate(GOAT.x, GOAT.y);
  g.rotate(o.aim);
  g.scale(GOAT_SIZE, GOAT_SIZE);
  if (o.heat > 0.02) glow(g, GOAT.mouth, 1, 15 + 10 * o.heat, '255, 130, 30', 0.6 * o.heat);
  horn(g, [3, -10.4], [-9, -9], [-28, 3], [-47, 8], 5.8, C.hornFar, '#5f5546', o.heat * 0.7);
  // the long pointed beard
  shape(g, C.goatDark, 0.8, () => {
    g.moveTo(3, 3.6);
    g.quadraticCurveTo(4, 9, 0.4 - o.wave, 13.6);
    g.quadraticCurveTo(6.4, 11, 7.6, 7.8);
    g.quadraticCurveTo(8.4, 10.4, 7.4 - o.wave, 12.4);
    g.quadraticCurveTo(12.6, 9, 12.4, 4);
  });
  const open = o.jaw * 0.55;
  const swing = (x, y) => [4 + (x - 4) * Math.cos(open) - (y - 0.4) * Math.sin(open), 0.4 + (x - 4) * Math.sin(open) + (y - 0.4) * Math.cos(open)];
  if (o.jaw > 0.1) {
    shape(g, o.heat > 0.2 ? '#ffb23a' : C.maw, 0, () => {
      g.moveTo(4, 0);
      g.lineTo(22.4, 0);
      g.lineTo(...swing(20, 2));
      g.lineTo(...swing(5, 2.4));
    });
  }
  g.save();
  g.translate(4, 0.4);
  g.rotate(open);
  g.translate(-4, -0.4);
  shape(g, C.goatDark, LW, () => {
    g.moveTo(4, 0.6);
    g.lineTo(21.4, 0.9);
    g.quadraticCurveTo(21.6, 3.8, 17.4, 4.2);
    g.quadraticCurveTo(9, 6, 1.6, 4.4);
  });
  g.restore();
  const head = () => {
    g.moveTo(-9, -5);
    g.bezierCurveTo(-8.6, -13, 0, -15.6, 7, -12.4);
    g.quadraticCurveTo(11, -10.4, 15, -8.8);
    g.bezierCurveTo(19.4, -7.4, 24, -5.4, 25.4, -2.6);
    g.quadraticCurveTo(26.2, -0.2, 23, 0.4);
    g.lineTo(8, 0.2);
    g.quadraticCurveTo(4, 0.8, 3, 3.4);
    g.bezierCurveTo(-1.4, 7.4, -8.4, 4.6, -9, -5);
  };
  shape(g, vgrad(g, -14, 6, C.goatLight, C.goatDark), 0, head);
  within(g, head, () => ell(g, 2, 5, 13, 4.6, C.goatDark, 0, -0.1));
  g.beginPath();
  head();
  g.closePath();
  ink(g);
  // nostril, and one line down its long face
  lines(g, 0.6, () => {
    g.moveTo(12, -9);
    g.quadraticCurveTo(18, -5.6, 22.6, -4.6);
  });
  lines(g, 1.1, () => {
    g.moveTo(21.6, -3.4);
    g.quadraticCurveTo(23.2, -3.2, 23.6, -2);
  });
  calmEye(g, 6.6, -6.8, 3.9, 2, o, o.heat > 0.3 || o.fury > 0.3 ? '#ffd24a' : '#d99a2b');
  lines(g, 1.05, () => {
    g.moveTo(2, -9.8);
    g.quadraticCurveTo(7, -11, 12, -8.8);
  });
  // a long pointed ear, laid back
  g.save();
  g.translate(-5, -5);
  g.rotate(o.ear * 0.6);
  shape(g, C.goat, LW, () => {
    g.moveTo(0, -3.4);
    g.quadraticCurveTo(-9, -7.6, -16, 1);
    g.quadraticCurveTo(-8, 1.2, -0.6, 3);
  });
  shape(g, '#76516c', 0, () => {
    g.moveTo(-2, -1.8);
    g.quadraticCurveTo(-8, -4.4, -12.8, 0);
    g.quadraticCurveTo(-7, -0.4, -2, 1.2);
  });
  g.restore();
  horn(g, [-1.6, -11.6], [-15, -17], [-34, -12], [-52, 3], 7.4, C.horn, C.hornShade, Math.max(o.heat * 0.7, o.fury));
  if (o.fury > 0.05) glow(g, -26, -8, 28, '190, 60, 255', 0.45 * o.fury);
  // fire gathering at its lips: motes spiralling in to a ball that swells
  if (o.charge > 0.04) {
    const c = o.charge;
    const x = GOAT.mouth + 4;
    glow(g, x, 0.6, 6 + 11 * c, '255, 90, 20', 0.75 * c);
    glow(g, x, 0.6, 2.4 + 5 * c, '255, 236, 150', 0.95 * c);
    for (let i = 0; i < 9; i++) {
      const q = (o.clock * 1.9 + i / 9) % 1;
      const a = i * 2.4 + q * 4.4;
      const r = (1 - q) * (13 + (i % 3) * 3);
      lines(g, 1.3 * q + 0.3, () => {
        g.moveTo(x + Math.cos(a) * r, 0.6 + Math.sin(a) * r * 0.8);
        g.lineTo(x + Math.cos(a - 0.35) * (r + 3.4), 0.6 + Math.sin(a - 0.35) * (r + 3.4) * 0.8);
      }, `rgba(255, ${150 + Math.round(90 * q)}, 50, ${c * (0.35 + 0.65 * q)})`);
    }
  }
  g.restore();
}

// a small level eye, its upper lid resting on it
function calmEye(g, x, y, rx, ry, o, iris) {
  if (o.dead) {
    lines(g, 1.1, () => {
      g.moveTo(x - rx * 0.6, y - ry);
      g.lineTo(x + rx * 0.6, y + ry);
      g.moveTo(x + rx * 0.6, y - ry);
      g.lineTo(x - rx * 0.6, y + ry);
    });
    return;
  }
  const open = 1 - (o.shut || 0);
  if (open < 0.4) {
    lines(g, 1.1, () => {
      g.moveTo(x - rx, y);
      g.quadraticCurveTo(x, y + 1.2, x + rx, y + 0.2);
    });
    return;
  }
  const lid = () => {
    g.moveTo(x - rx, y);
    g.quadraticCurveTo(x - rx * 0.1, y - ry * 1.05 * open, x + rx, y);
  };
  shape(g, iris, 0.6, () => {
    lid();
    g.quadraticCurveTo(x, y + ry * 1.05 * open, x - rx, y);
  });
  ell(g, x + rx * 0.18, y, rx * 0.24, ry * 0.58 * open, '#1a0d0a', 0);
  circ(g, x + rx * 0.02, y - ry * 0.24, 0.45, '#fff6e6', 0);
  lines(g, 1.15, lid);
}

// ---------------------------------------------------------------- the lion's head
// one layer of the mane: a ring of long locks, each bending like a flame. locks: [tip x, tip y, the notch after it x, y]
// about the head; the tips stream and stir (wave)
function maneLayer(g, start, locks, fill, shine, o, phase) {
  const tips = locks.map(([tx, ty], i) => {
    const far = Math.min(1, Math.max(0, -tx) / 40); // the long ones trailing behind stir the most
    return [tx + Math.sin(o.clock * o.wind + phase + i * 1.7) * (0.8 + 1.8 * far), ty + Math.cos(o.clock * o.wind * 0.9 + phase + i * 2.3) * (0.8 + 2.4 * far)];
  });
  // a point `at` of the way from a to b, pushed `off` to one side
  const side = (a, b, at, off) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    return [lerp(a[0], b[0], at) + ((b[1] - a[1]) / d) * off, lerp(a[1], b[1], at) - ((b[0] - a[0]) / d) * off];
  };
  const round = () => {
    let from = start;
    g.moveTo(from[0], from[1]);
    locks.forEach(([, , vx, vy], i) => {
      const tip = tips[i];
      const notch = [vx, vy];
      const len = Math.hypot(tip[0] - from[0], tip[1] - from[1]);
      // (it stops just short of its point and rounds it off)
      g.bezierCurveTo(...side(from, tip, 0.34, -len * 0.19), ...side(from, tip, 0.7, len * 0.02), lerp(tip[0], from[0], 0.07), lerp(tip[1], from[1], 0.07));
      g.quadraticCurveTo(...tip, lerp(tip[0], notch[0], 0.12), lerp(tip[1], notch[1], 0.12));
      g.bezierCurveTo(...side(tip, notch, 0.34, len * 0.05), ...side(tip, notch, 0.7, len * 0.12), ...notch);
      from = notch;
    });
  };
  shape(g, fill, 0, round);
  g.beginPath();
  round();
  g.closePath();
  ink(g, 0.8);
  // a strand or two
  lines(g, 0.6, () => {
    tips.forEach(([tx, ty], i) => {
      if (i % 3 !== 1) return;
      g.moveTo(tx * 0.46, ty * 0.46);
      g.bezierCurveTo(tx * 0.58 + 2, ty * 0.58 - 2.6, tx * 0.74, ty * 0.74 + 0.6, tx * 0.86, ty * 0.86);
    });
  }, shine);
}

// a single long lock flying free: from (x, y) round through (cx, cy) to its point
function tress(g, o, i, [x, y, cx, cy, tx, ty], wide, fill) {
  const sway = Math.sin(o.clock * o.wind + i * 2.1) * 3;
  shape(g, fill, 0.65, () => {
    g.moveTo(x, y - wide / 2);
    g.bezierCurveTo(lerp(x, cx, 0.7), cy - wide * 0.7, cx - 4, cy + sway * 0.4, tx, ty + sway);
    g.bezierCurveTo(cx - 1, cy + wide * 0.75 + sway * 0.4, lerp(x, cx, 0.6), cy + wide, x, y + wide / 2);
  });
}

function mane(g, o) {
  g.save();
  const p = 1 + o.puff * 0.08;
  g.scale(p, p);
  // two long locks flying back
  [[-18, -15, -40, -22, -63, -36], [-24, -3, -40, -9, -55, -8]].forEach((l, i) => tress(g, o, i, l, 7, C.maneBack));
  maneLayer(g, [14, -24], [[-4, -38, -5, -23], [-30, -37, -18, -20], [-46, -21, -23, -12], [-37, -5, -25, 0], [-44, 9, -21, 10], [-27, 23, -11, 19], [-11, 33, 4, 23], [14, 35, 17, 21], [31, 23, 25, 11], [38, 3, 27, -6], [37, -22, 22, -20], [25, -35, 14, -24]], C.maneBack, C.maneMid, o, 0);
  maneLayer(g, [12, -20], [[-6, -31, -4, -18], [-27, -27, -14, -13], [-37, -10, -18, -4], [-27, 3, -17, 8], [-30, 17, -8, 16], [-7, 28, 5, 20], [15, 30, 17, 18], [29, 18, 24, 7], [35, -4, 23, -10], [31, -24, 18, -19], [19, -31, 12, -20]], C.maneGold, C.maneShine, o, 2);
  g.restore();
}

// a curved fang from (x, y). h: how long, downward (negative: upward)
function fang(g, x, y, h, w) {
  shape(g, C.tooth, 0.5, () => {
    g.moveTo(x - w, y);
    g.quadraticCurveTo(x - w * 0.3, y + h * 0.72, x + w * 0.7, y + h);
    g.quadraticCurveTo(x + w * 1.25, y + h * 0.5, x + w, y);
  });
}

// jaw: 0..1. At rest its mouth is shut
function lionHead(g, o) {
  mane(g, o);
  ell(g, FACE.x - 3, FACE.y - 2, 15, 15.5, 'rgba(112, 62, 14, 0.26)', 0);
  g.save();
  g.translate(FACE.x, FACE.y);
  g.scale(FACE.size, FACE.size);
  // a small ear, laid back
  shape(g, C.fur, LW, () => {
    g.moveTo(-9, -10);
    g.quadraticCurveTo(-17, -20, -11, -23);
    g.quadraticCurveTo(-3, -21, -1, -13.4);
  });
  shape(g, C.maneBack, 0, () => {
    g.moveTo(-8, -12);
    g.quadraticCurveTo(-13, -18, -10.4, -20.4);
    g.quadraticCurveTo(-5, -18.4, -3, -13.4);
  });
  const open = Math.max(0, o.jaw - 0.08) * 0.66;
  const swing = (x, y) => [x * Math.cos(open) - (y - 6) * Math.sin(open), 6 + x * Math.sin(open) + (y - 6) * Math.cos(open)];
  if (open > 0.04) {
    // inside the mouth
    shape(g, C.maw, 0.6, () => {
      g.moveTo(1, 5);
      g.bezierCurveTo(9, 4.4, 18, 4, 24.4, 3.6);
      g.lineTo(...swing(22.4, 6.4));
      g.quadraticCurveTo(...swing(10, 9), ...swing(-1, 7));
    });
  }
  // lower jaw
  g.save();
  g.translate(0, 6);
  g.rotate(open);
  g.translate(0, -6);
  if (open > 0.14) {
    shape(g, C.tongue, 0.5, () => {
      g.moveTo(3, 7);
      g.bezierCurveTo(8, 3.6, 13, 6.4, 18, 6.4);
      g.quadraticCurveTo(10, 8.8, 3, 8);
    });
    fang(g, 19, 7, -4.8, 1.4);
  }
  const chin = () => {
    g.moveTo(-1, 5.2);
    g.quadraticCurveTo(10, 4.4, 22.6, 4);
    g.quadraticCurveTo(23.8, 8.8, 19, 11);
    g.quadraticCurveTo(11, 14, 3, 13.2);
    g.quadraticCurveTo(-4, 11.6, -7, 7);
  };
  shape(g, C.muzzle, 0, chin);
  within(g, chin, () => ell(g, 5, 14, 16, 4, C.furDark, 0));
  g.beginPath();
  chin();
  ink(g);
  // a short beard under the chin
  shape(g, C.maneGold, 0.65, () => {
    g.moveTo(1, 12.6);
    g.quadraticCurveTo(2, 17.4, -3.4, 20.4);
    g.quadraticCurveTo(6, 19.4, 11.6, 13);
  });
  g.restore();
  // the skull and upper jaw
  const face = () => {
    g.moveTo(-11.4, -9);
    g.bezierCurveTo(-7, -17, 2.6, -17, 7.4, -12.4);
    g.bezierCurveTo(12, -9.6, 18, -8.4, 23.4, -6.2);
    g.quadraticCurveTo(28, -4.6, 27.8, -1);
    g.quadraticCurveTo(28, 3.2, 24, 4.4);
    g.bezierCurveTo(18, 5.4, 9, 6.6, 3, 5.6);
    g.quadraticCurveTo(-3, 11.4, -10.4, 9);
    g.bezierCurveTo(-15.2, 3.6, -15.2, -4, -11.4, -9);
  };
  shape(g, vgrad(g, -16, 8, C.furLight, C.fur), 0, face);
  within(g, face, () => {
    ell(g, -4, 11, 14, 6, C.furDark, 0, -0.3);
    ell(g, 21.4, 1.4, 8.4, 4.4, C.muzzle, 0, -0.06);
  });
  g.beginPath();
  face();
  g.closePath();
  ink(g);
  if (open > 0.1) {
    fang(g, 21.4, 4.4, 5.6, 1.5);
    fang(g, 11, 5.9, 3, 1.1);
  }
  // a broad flat nose, and the line from it to the corner of the mouth
  shape(g, C.nose, 0.7, () => {
    g.moveTo(21.8, -6.4);
    g.quadraticCurveTo(27.6, -5.6, 28, -2.2);
    g.quadraticCurveTo(26, 0, 24.2, -1.2);
    g.quadraticCurveTo(22.4, -3.2, 21.8, -6.4);
  });
  lines(g, 0.75, () => {
    g.moveTo(24.4, -1);
    g.quadraticCurveTo(24.6, 1.4, 23.4, 2.4);
    g.quadraticCurveTo(19, 3.6, 15.6, 1.6);
  });
  // one line along the nose and one on the cheek
  lines(g, 0.6, () => {
    g.moveTo(11.4, -6.2);
    g.quadraticCurveTo(16, -4.4, 20, -4.6);
    g.moveTo(-6, 0);
    g.quadraticCurveTo(0, 3, 7, 0.6);
  });
  calmEye(g, 5.4, -5.6, 4.6, 2.3, o, '#e0991f');
  // a level brow
  lines(g, 1.35, () => {
    g.moveTo(-1.6, -10.4);
    g.quadraticCurveTo(5, -12, 11.4, -8.6);
  });
  g.restore();
}

// ---------------------------------------------------------------- the serpent that is its tail
const SNAKE_ROOT = [-37, -7];
// eight points it runs through, from the rump to its head: at rest it makes a great loop out behind and comes forward
const SNAKE_REST = [SNAKE_ROOT, [-55, -3], [-71, -10], [-78, -23], [-70, -34], [-53, -35], [-31, -24], [-11, -22]];
const SNAKE_COIL = [SNAKE_ROOT, [-57, -4], [-73, -17], [-74, -35], [-61, -47], [-45, -48], [-40, -40], [-32, -34]];
const SNAKE_SLACK = [SNAKE_ROOT, [-50, 10], [-62, 22], [-56, 29], [-42, 29], [-28, 30], [-16, 31], [-3, 30]];

function smoothThrough(pts, each = 4) {
  const out = [];
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const [p0, p1, p2, p3] = [pts[Math.max(0, i - 1)], pts[i], pts[i + 1], pts[Math.min(n - 1, i + 2)]];
    for (let j = 0; j < each; j++) {
      const t = j / each;
      const at = (k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t * t + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t ** 3);
      out.push([at(0), at(1)]);
    }
  }
  out.push(pts[n - 1]);
  return out;
}

// from: which sample to begin at (the last stretch is painted again over the front of the beast)
function serpentBody(g, pts, from) {
  const n = pts.length;
  const wide = (i) => 15.8 - 3.2 * (i / (n - 1));
  const [L, R] = edges(pts, wide);
  // it is red underneath: that is its one side along the bottom of the loop, and by a twist at the far end the other
  // side along the top
  const twist = (i) => ease(clamp01((i / (n - 1) - 0.34) / 0.2));
  const under = pts.map((_, i) => [lerp(R[i][0], L[i][0], twist(i)), lerp(R[i][1], L[i][1], twist(i))]);
  const over = pts.map((_, i) => [lerp(L[i][0], R[i][0], twist(i)), lerp(L[i][1], R[i][1], twist(i))]);
  const l = L.slice(from);
  const r = R.slice(from);
  const round = () => {
    g.moveTo(l[0][0], l[0][1]);
    through(g, l);
    through(g, [...r].reverse());
  };
  shape(g, C.snake, 0, round);
  within(g, round, () => {
    const along = (k, colour, w) => {
      g.beginPath();
      let first = true;
      for (let i = Math.max(0, from - 1); i < n; i++) {
        const x = lerp(pts[i][0], under[i][0], k);
        const y = lerp(pts[i][1], under[i][1], k);
        if (first) g.moveTo(x, y);
        else g.lineTo(x, y);
        first = false;
      }
      ink(g, w, colour);
    };
    along(-0.75, C.snakeDark, 4.6);
    along(-0.2, C.snakeLight, 1.6);
    // dark red underneath, in plates
    along(0.74, C.belly, 6.8);
    lines(g, 0.6, () => {
      for (let i = from + 1; i < n - 1; i += 3) {
        const mx = lerp(pts[i][0], under[i][0], 0.3);
        const my = lerp(pts[i][1], under[i][1], 0.3);
        g.moveTo(mx, my);
        g.lineTo(under[i][0] * 1.12 - pts[i][0] * 0.12, under[i][1] * 1.12 - pts[i][1] * 0.12);
      }
    }, C.bellyDark);
    lines(g, 0.5, () => {
      for (let i = from; i < n; i++) {
        g.moveTo(lerp(pts[i][0], under[i][0], 0.3), lerp(pts[i][1], under[i][1], 0.3));
        const j = Math.max(0, i - 1);
        g.lineTo(lerp(pts[j][0], under[j][0], 0.3), lerp(pts[j][1], under[j][1], 0.3));
      }
    });
  });
  for (const side of [l, r]) {
    g.beginPath();
    g.moveTo(side[0][0], side[0][1]);
    through(g, side);
    ink(g);
  }
}

function serpentHead(g, pts, s, o) {
  const head = pts[pts.length - 1];
  const [bx, by] = pts[pts.length - 3];
  const angle = Math.atan2(head[1] - by, head[0] - bx);
  g.save();
  g.translate(head[0], head[1]);
  g.rotate(angle);
  if (Math.cos(angle) < 0) g.scale(1, -1); // (kept the right way up when it faces back)
  g.scale(1.06, 1.16);
  if (s.tongue > 0.05) {
    const far = 17 + s.tongue * 9;
    lines(g, 1.25, () => {
      g.moveTo(13, 2.4);
      g.bezierCurveTo(18, 3.4, 18, 9 + s.tongue * 3, far - 1, 11 + s.tongue * 3);
      g.lineTo(far + 3.4, 10.4 + s.tongue * 3);
      g.moveTo(far - 1, 11 + s.tongue * 3);
      g.lineTo(far + 2, 15 + s.tongue * 3);
    }, '#d8232f');
  }
  const open = s.gape * 0.75;
  if (s.gape > 0.1) {
    shape(g, C.maw, 0.6, () => {
      g.moveTo(-1, 1.4);
      g.lineTo(18, 0.6);
      g.lineTo(16 * Math.cos(open), 1.6 + 16 * Math.sin(open));
    });
  }
  g.save();
  g.translate(0, 1.6);
  g.rotate(open);
  g.translate(0, -1.6);
  shape(g, C.belly, LW, () => {
    g.moveTo(-3, 1.8);
    g.lineTo(16.4, 2);
    g.quadraticCurveTo(14, 5.4, 8, 5.6);
    g.quadraticCurveTo(1, 6.4, -4, 3.6);
  });
  if (s.gape > 0.5) poly(g, [[11.6, 2], [13, -2.4], [14.4, 2]], C.tooth, 0.5);
  g.restore();
  const skull = () => {
    g.moveTo(-5, -4);
    g.bezierCurveTo(0, -9.4, 6, -8.6, 10, -6);
    g.quadraticCurveTo(17.4, -5, 19.4, -1.2);
    g.quadraticCurveTo(19, 1.6, 15, 1.4);
    g.quadraticCurveTo(6, 3.4, -4, 2.4);
  };
  shape(g, vgrad(g, -9, 3, C.snakeLight, C.snakeDark), 0, skull);
  g.beginPath();
  skull();
  ink(g);
  if (s.gape > 0.5) {
    for (const x of [12.6, 16.4]) {
      shape(g, C.tooth, 0.5, () => {
        g.moveTo(x - 1.3, 1.4);
        g.quadraticCurveTo(x + 1.6, 4, x - 0.4, 8.2);
        g.quadraticCurveTo(x - 0.2, 4.4, x + 1.2, 1.4);
      });
    }
  }
  lines(g, 0.6, () => {
    g.moveTo(17.4, 0.2);
    g.quadraticCurveTo(9, 0.8, 1, 0.2);
  });
  circ(g, 16.6, -2.6, 0.55, INK, 0);
  calmEye(g, 6.6, -3.6, 3.2, 1.9, o, '#e5b21e');
  lines(g, 0.9, () => {
    g.moveTo(2.4, -6.4);
    g.quadraticCurveTo(7, -7.4, 11.4, -5);
  });
  g.restore();
}

// ---------------------------------------------------------------- the whole beast
// A pose. crouch: how low it is; lean: front down (+) or reared (-), about the hips; nod: the lion's head; roar: how
// wide its mouth; puff: its mane; tilt: the goat's head; bleat: the goat's mouth; reach / kick: front paws thrown
// forward and hind hooves back, as it leaps; ax, ay and bx, by: where its near and far forepaws are lifted to, clawing
const REST = { crouch: 0, lean: 0, nod: 0, roar: 0, puff: 0, tilt: 0, bleat: 0, reach: 0, kick: 0, ax: 0, ay: 0, bx: 0, by: 0 };
const PAWS = { farHind: [-6, 19.4], nearHind: [-39, 25], farFront: [72, 22.6], nearFront: [40, 25] };
const HIP = [-24, 4];

// o: { paws, bob, clock, wind, aim, heat, charge, fury, shut, goatShut, ear, angry, dead, snake: { pts, gape, tongue } }
function paint(g, P, o) {
  g.save();
  g.scale(K, K);
  const down = o.bob + P.crouch - LIFT;
  const upper = (draw) => {
    g.save();
    g.translate(HIP[0], HIP[1] + down);
    g.rotate(P.lean);
    g.translate(-HIP[0], -HIP[1]);
    draw();
    g.restore();
  };
  const turned = (x, y) => {
    const c = Math.cos(P.lean);
    const s = Math.sin(P.lean);
    return [HIP[0] + (x - HIP[0]) * c - (y - HIP[1]) * s, HIP[1] + down + (x - HIP[0]) * s + (y - HIP[1]) * c];
  };
  const foot = (name) => {
    const front = name.endsWith('Front');
    let x = PAWS[name][0] + o.paws[name].x + (front ? P.reach * 14 : -P.kick * 16);
    let y = PAWS[name][1] + o.paws[name].y - (front ? P.reach * 10 : P.kick * 4);
    if (name === 'nearFront') {
      x += P.ax;
      y += P.ay;
    } else if (name === 'farFront') {
      x += P.bx;
      y += P.by;
    }
    return [x, y];
  };
  // a paw off the ground tips with the way it is held
  const tip = (lift, over) => Math.max(-0.9, Math.min(0.75, lift * 0.035 - over * 0.012));
  const pts = smoothThrough(o.snake.pts);
  const snakeEyes = { dead: o.dead, shut: o.shut };
  const behind = () => upper(() => serpentBody(g, pts, 0));
  const inFront = () => upper(() => {
    serpentBody(g, pts, Math.floor(pts.length * 0.5));
    serpentHead(g, pts, o.snake, snakeEyes);
  });

  hindleg(g, turned(6, 6), foot('farHind'), [-8, -21], P.kick * 0.5, true);
  const farLifted = P.by < -6;
  if (!farLifted) foreleg(g, turned(34, 1), foot('farFront'), -P.reach * 0.3, true);
  behind();
  upper(() => torso(g));
  hindleg(g, turned(-26, 3), foot('nearHind'), [-13, -24], P.kick * 0.5, false);
  upper(() => haunch(g, o.paws.nearHind.x * 0.3 - P.kick * 7));
  upper(() => goat(g, { aim: o.aim + P.tilt, jaw: Math.max(P.bleat, o.heat), heat: o.heat, charge: o.charge, fury: o.fury, clock: o.clock, wave: Math.sin(o.clock * o.wind) * 1.2, shut: o.goatShut, ear: o.ear, dead: o.dead }));
  const near = () => foreleg(g, turned(9, 0), foot('nearFront'), tip(P.ay, P.ax) - P.reach * 0.3, false);
  const raised = P.ay < -6;
  if (!raised) near();
  upper(() => {
    g.save();
    g.translate(HEAD[0] - 14, HEAD[1] + 4);
    g.rotate(P.nod);
    g.translate(14, -4);
    lionHead(g, { jaw: Math.max(0, P.roar), puff: P.puff, clock: o.clock, wind: o.wind, shut: o.shut, angry: o.angry, burning: o.burning, dead: o.dead });
    g.restore();
  });
  // paws clawing the air come over in front
  if (farLifted) foreleg(g, turned(36, 3), foot('farFront'), tip(P.by, P.bx), false);
  if (raised) near();
  inFront();
  g.restore();
}

const none = () => ({ x: 0, y: 0 });
const STAND = { farHind: none(), nearHind: none(), farFront: none(), nearFront: none() };

export function drawChimeraStill(g) {
  paint(g, REST, { paws: STAND, bob: 0, clock: 0, wind: 2, aim: 0.57, heat: 0, charge: 0, fury: 0, shut: 0, goatShut: 0, ear: 0, angry: true, snake: { pts: SNAKE_REST, gape: 0, tongue: 0 } });
}

// ---------------------------------------------------------------- how it holds itself
function posed(u, R, dead, windup, t) {
  let want = { ...REST };
  let stiff = 240;
  let damp = 22;
  if (!dead) {
    const m = u.act;
    const a = m ? u.def[m.kind] : null;
    if (m && m.kind === 'pounce') {
      if (m.t < a.windup) want = { ...want, crouch: 8, lean: 0.1 + Math.sin(t * 30) * 0.03, roar: 0.3, puff: 0.4, tilt: 0.14 };
      else if (m.t < a.windup + a.time) {
        const q = (m.t - a.windup) / a.time;
        want = { ...want, lean: lerp(-0.34, 0.3, q), reach: 1, kick: q < 0.7 ? 1 : 0.3, roar: 0.9, puff: 0.9, tilt: -0.25, ay: q < 0.75 ? -14 : 0, by: q < 0.75 ? -22 : 0, ax: 4, bx: 8 };
      } else want = { ...want, crouch: 10, lean: 0.07, roar: 0.55, puff: 0.6 };
      stiff = 520;
      damp = 34;
    } else if (m && m.kind === 'rake') {
      // up with one great paw and down across them, then the other
      const first = a.hits[0];
      const second = a.hits[1];
      if (m.t < first - 0.07) want = { ...want, lean: -0.13, crouch: 2, ax: 25, ay: -41, roar: 0.5, puff: 0.5, nod: -0.1 };
      else if (m.t < first + 0.09) want = { ...want, lean: 0.12, crouch: 4, ax: 40, ay: -3, bx: 2, by: -36, roar: 0.85, puff: 0.7, nod: 0.08 };
      else if (m.t < second - 0.07) want = { ...want, lean: -0.1, crouch: 2, bx: 4, by: -44, roar: 0.6, puff: 0.6 };
      else want = { ...want, lean: 0.14, crouch: 5, bx: 18, by: -3, roar: 0.95, puff: 0.8, nod: 0.08 };
      stiff = 900;
      damp = 46;
    } else if (m && m.kind === 'ram') {
      // head right down, horns first
      if (m.t < a.windup) want = { ...want, crouch: 6, lean: -0.1, tilt: 0.62, roar: 0.25, puff: 0.3 };
      else want = { ...want, crouch: 4, lean: 0.12, tilt: 0.78, roar: 0.55, puff: 0.5 };
      stiff = 420;
      damp = 30;
    } else if (m && m.kind === 'roar') {
      if (m.t < a.windup) want = { ...want, nod: -0.4, lean: -0.2, roar: 0.2, puff: 0.5, tilt: -0.35, ax: -4, ay: -16, bx: -2, by: -22 };
      else want = { ...want, nod: -0.06, lean: 0.1, roar: 1.1, puff: 1.2, tilt: -0.5, bleat: 0.9, crouch: 4 };
      stiff = 560;
      damp = 34;
    } else if (u.firing) {
      want = { ...want, crouch: 3, lean: 0.05, roar: 0.22 + Math.sin(t * 19) * 0.04, puff: 0.45 + Math.sin(t * 23) * 0.2, nod: 0.07 };
    } else if (windup > 0) {
      // the goat rears its head back to fill its lungs
      want = { ...want, tilt: -0.55 * windup, lean: -0.08 * windup, crouch: 2 * windup, bleat: 0.35 * windup, puff: 0.35 * windup };
    } else if (R.fidget === 'growl') {
      const swell = Math.sin(R.q * Math.PI);
      // a long yawn
      want = { ...want, roar: swell * 0.5, nod: -0.1 * swell };
    } else if (R.fidget === 'bleat') {
      const swell = Math.sin(R.q * Math.PI);
      want = { ...want, bleat: swell * (0.5 + 0.5 * Math.abs(Math.sin(t * 17))), tilt: -0.34 * swell };
    } else if (R.fidget === 'look') want = { ...want, nod: Math.sin(R.q * TAU) * 0.13, tilt: -Math.sin(R.q * TAU) * 0.22 };
  }
  if (dead) return { ...REST, roar: 0.55, bleat: 0.6, nod: 0.12, tilt: 0.3 };
  let s = u.chi;
  const dt = Math.min(0.15, Math.max(0, u.breath - (s ? s.at : u.breath)));
  if (!s) {
    s = u.chi = { at: u.breath, p: {} };
    for (const k in REST) s.p[k] = { x: REST[k], v: 0 };
  }
  s.at = u.breath;
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  const out = {};
  for (const k in REST) {
    const p = s.p[k];
    for (let i = 0; i < steps; i++) {
      p.v += ((want[k] - p.x) * stiff - p.v * damp) * h;
      p.x += p.v * h;
    }
    out[k] = p.x;
  }
  return out;
}

// a point on the field, in the drawing's own units
function toArt(u, x, y) {
  const s = u.def.scale;
  return [((x - u.x) * u.facing) / (K * s), ((y - u.y - FEET) / s + FEET) / K];
}

const mix = (a, b, k) => a.map((p, i) => [lerp(p[0], b[i][0], k), lerp(p[1], b[i][1], k)]);

// the serpent's shape just now: at rest, or drawn back, shot out at its mark, and slid home again
function snakePose(u, t, dead) {
  if (dead) return { pts: SNAKE_SLACK, gape: 0.6, tongue: 0.7 };
  const sway = Math.sin(t * 1.9);
  const rest = SNAKE_REST.map(([x, y], i) => {
    const k = i / 7;
    return [x + Math.sin(t * 1.9 - k * 3.4) * 3.4 * k, y + Math.sin(t * 2.7 - k * 4) * 2.4 * k];
  });
  const flick = t % 4.2;
  const b = u.bite;
  if (!b) return { pts: rest, gape: 0, tongue: flick < 0.4 ? Math.abs(Math.sin((flick / 0.4) * Math.PI * 3)) : 0 };
  const a = u.def.venom;
  const mark = toArt(u, b.x, b.y);
  mark[1] += LIFT; // (the tail is drawn with the upper half, which stands that much higher)
  // it arcs up high on the way there (over its own back to reach in front; a rounder hoop to reach behind)
  const high = Math.min(mark[1], -30);
  const back = clamp01((SNAKE_ROOT[0] - mark[0]) / 30);
  const c1 = [lerp(-72, SNAKE_ROOT[0] - 12, back), lerp(-38, high - 22, back)];
  const c2 = [lerp(lerp(SNAKE_ROOT[0], mark[0], 0.55), mark[0] + 4, back), high - lerp(46, 26, back)];
  const out = SNAKE_REST.map((_, i) => {
    const q = i / 7;
    const at = (j) => (1 - q) ** 3 * SNAKE_ROOT[j] + 3 * (1 - q) ** 2 * q * c1[j] + 3 * (1 - q) * q * q * c2[j] + q ** 3 * mark[j];
    return [at(0), at(1)];
  });
  const coil = a.hit * 0.55;
  let pts;
  let gape = 1;
  if (b.t < coil) {
    pts = mix(rest, SNAKE_COIL, ease(b.t / coil));
    gape = b.t / coil;
  } else if (b.t < a.hit) pts = mix(SNAKE_COIL, out, ((b.t - coil) / (a.hit - coil)) ** 2);
  else if (b.t < a.hit + 0.14) {
    pts = out;
    gape = 0.3; // jaws shut on them
  } else {
    const k = ease(clamp01((b.t - a.hit - 0.14) / (a.time - a.hit - 0.14)));
    pts = mix(out, rest, k);
    gape = 0.3 * (1 - k);
  }
  return { pts, gape, tongue: 0 };
}

// speed lines trailing back from it
function streaks(ctx, t, rows, colour, wide) {
  ctx.lineCap = 'round';
  ctx.strokeStyle = colour;
  ctx.lineWidth = wide;
  ctx.beginPath();
  for (const [x, y, len] of rows) {
    const l = len * (0.65 + 0.35 * Math.sin(t * 41 + y * 3));
    ctx.moveTo(x - l, y);
    ctx.lineTo(x, y);
  }
  ctx.stroke();
}

// `overlay(ctx, u, rx, ry, cx, cy)` paints burning / frozen / poisoned tints
export function drawChimera(ctx, dpr, sprites, u, overlay) {
  const d = u.def;
  const dead = !!u.tilt;
  const t = performance.now() / 1000 + (u.id || 0) * 0.737;
  const firing = !dead && !!u.firing;
  const act = dead ? null : u.act;
  // nearly ready to breathe again, with someone in reach
  const near = !dead && !act && !firing && u.target && !u.target.dead && Math.hypot(u.target.x - u.x, u.target.y - u.y) <= d.range * 1.05;
  const windup = near && u.burstT > 0 && u.burstT < 0.55 ? 1 - u.burstT / 0.55 : 0;
  // (the rig is told it is standing, so its own two-footed stride never gets going: the four feet are worked out below)
  const R = rigStep(u, {
    age: 9, dead, moving: false, bang: 0, kick: 0.3, calm: !u.target && !u.moving, busy: firing || !!act || windup > 0,
    fidgets: ['look', 'growl', 'growl', 'bleat'],
  });
  const P = posed(u, R, dead, windup, t);
  const k = dead || (act && act.kind === 'pounce') ? 0 : u.walkK || 0;
  const walk = dead ? 0 : u.walk || 0;
  const wx = u.walkX === undefined ? 1 : Math.max(0.65, Math.abs(u.walkX));
  const tall = (u.walkY || 0) * 0.3;
  const step = (late) => {
    const f = pawAt(walk + late);
    return { x: f.x * wx * k, y: (f.y + f.x * tall) * k };
  };
  const paws = { nearHind: step(0), farFront: step(0.05), farHind: step(0.5), nearFront: step(0.55) };
  const alt = dead ? 0 : u.alt || 0;
  const ramming = act && act.kind === 'ram';
  const dashing = ramming && act.t > d.ram.windup && act.t < d.ram.windup + d.ram.time;
  const fury = ramming && act.t < d.ram.windup + d.ram.time ? clamp01(act.t / d.ram.windup) : 0;

  const wobble = u.hit > 0.14 ? (Math.random() - 0.5) * 1.4 : act && act.kind === 'roar' && act.t > d.roar.windup ? (Math.random() - 0.5) * 2.2 : 0;
  ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  if (u.tilt) {
    ctx.translate(0, FEET);
    ctx.rotate(u.tilt);
    ctx.translate(0, -FEET);
  }
  if (!dead) {
    // its shadow stays on the ground, shrinking as it leaps
    ctx.save();
    ctx.translate(0, FEET + 0.8);
    ctx.scale(1, 0.22);
    glow(ctx, 0, 0, 62 * K * d.scale * (1 - alt * 0.35), '0, 0, 0', 0.46 - alt * 0.22);
    ctx.restore();
    if (firing) {
      ctx.save();
      ctx.translate(60, FEET);
      ctx.scale(1, 0.32);
      glow(ctx, 0, 0, 62, '255, 130, 30', 0.28 + 0.07 * Math.sin(t * 27));
      ctx.restore();
    }
  }
  // streaking along as it charges, violet off the horns and grey off the ground
  if (dashing) {
    streaks(ctx, t, [[-22, -62, 70], [-14, -52, 88], [-26, -43, 56]], 'rgba(176, 62, 236, 0.6)', 3);
    streaks(ctx, t, [[-22, -57, 52], [-18, -47, 64]], 'rgba(255, 196, 255, 0.85)', 1.3);
    streaks(ctx, t, [[-42, -14, 40], [-46, 2, 56], [-40, 12, 34]], 'rgba(150, 140, 130, 0.65)', 2);
  }
  if (alt > 0.01) {
    ctx.translate(0, -alt * d.pounce.height);
    streaks(ctx, t, [[-40, -34, 38], [-46, -18, 54], [-44, 0, 42]], 'rgba(255, 104, 40, 0.55)', 2.4);
    streaks(ctx, t, [[-44, -26, 30], [-46, -9, 40]], 'rgba(255, 226, 160, 0.8)', 1.1);
  }
  ctx.translate(0, FEET);
  ctx.scale(d.scale, d.scale);
  ctx.translate(0, -FEET);
  applyBotBody(ctx, { ...R, roll: 0, lean: R.lean * 0.3 });

  const blink = t % 4.3;
  const busy = firing || !!act || windup > 0;
  const shut = !busy && !u.target && blink < 0.14 ? Math.sin((blink / 0.14) * Math.PI) : 0;
  const goatBlink = (t + 1.9) % 5.1;
  const pose = dead ? 0 : u.pose || 0;
  // the goat looks where the fire is going; with nobody about it gazes round
  const aim = dead ? 0.2 : (0.55 + Math.sin(t * 0.9) * 0.1) * (1 - pose) + (u.aim || 0) * pose + (firing ? Math.sin(t * 31) * 0.03 : 0);
  // (the snake's mark is on the ground; while the beast is in the air the drawing is lifted, so it aims lower to match)
  const lifted = alt * d.pounce.height;
  const bite = u.bite;
  if (bite) bite.y += lifted;
  const tail = snakePose(u, t, dead);
  if (bite) bite.y -= lifted;
  paint(ctx, P, {
    paws,
    // it rises and falls with each pair of feet, and breathes
    bob: -Math.abs(Math.sin(walk * TAU)) * 2.2 * k + Math.sin(t * 2.2) * 0.6 * (1 - k),
    clock: dead ? 0 : t,
    wind: k > 0.3 || busy ? 9 : 3,
    aim: act ? 0.5 : aim,
    heat: firing ? 1 : windup * 0.65,
    charge: windup,
    fury,
    shut,
    goatShut: !busy && !u.target && goatBlink < 0.15 ? Math.sin((goatBlink / 0.15) * Math.PI) : 0,
    ear: dead ? 0 : t % 5.2 < 0.3 ? Math.sin(((t % 5.2) / 0.3) * Math.PI * 2) * 0.45 : Math.sin(t * 1.3) * 0.06,
    angry: busy || !!u.target,
    burning: busy,
    dead,
    snake: tail,
  });
  if (overlay) overlay(ctx, u, d.body[0] * K, d.body[1] * K, 0, d.body[2] * K);
  // it takes a lot of knocks, so a soft flash rather than turning solid white
  if (!dead && u.hit > 0) glow(ctx, 6 * K, -6 * K, 44 * K, '240, 246, 255', Math.min(0.28, u.hit * 1.6));
}

// ---------------------------------------------------------------- how it fights
export function resetChimeraFx(world) {
  world.venoms = []; // drops of poison
  world.roars = []; // the rings of a roar
  world.stomps = []; // where it has landed
  world.slashes = []; // the marks of its claws
  world.rubble = []; // stones thrown up
  world.miasma = []; // clouds of poison left behind a bite
  world.impacts = []; // flashes where horns strike and fire bursts out
}

function dust(world, x, y, n, wide) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + Math.random() * 0.3;
    world.puffs.push({ x: x + Math.cos(a) * wide * 0.3, y: y + Math.sin(a) * wide * 0.12, vx: Math.cos(a) * wide * rand(1.4, 2.2), vy: Math.sin(a) * wide * 0.65 - rand(2, 9), age: 0, life: rand(0.4, 0.75), size: rand(2.2, 4), dust: true });
  }
}

function shove(o, dx, dy, force) {
  if (o.def.noKnock) return;
  const dist = Math.hypot(dx, dy) || 1;
  const heavy = o.def.hp > 300 ? 0.35 : 1;
  o.kx += (dx / dist) * force * heavy;
  o.ky += (dy / dist) * force * heavy;
}

// three claw marks torn through the air at (x, y). turn: which way they run; wait: seconds before they show
function claws(world, x, y, turn, size, face, wait = 0) {
  world.slashes.push({ x, y, turn, size, face, age: -wait, life: 0.42 });
}

function rubble(world, x, y, n, wide, power) {
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + Math.random() * 0.5;
    const sp = rand(0.5, 1.2) * power;
    world.rubble.push({ x: x + Math.cos(a) * wide * rand(0.2, 0.8), y: y + Math.sin(a) * wide * 0.3, z: 1, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp * 0.4, vz: rand(55, 150), age: 0, life: rand(0.6, 1), size: rand(1.4, 3.4), turn: rand(0, TAU), spin: rand(-11, 11) });
  }
}

// the lion comes down on them
function land(world, u) {
  const a = u.def.pounce;
  const cx = u.x + u.facing * 34;
  const cy = u.y;
  const main = u.act.mark;
  world.eachEnemyNear(u.side, cx, cy, a.radius + 24, (o) => {
    const dist = Math.hypot(o.x - cx, o.y - cy);
    if (dist > a.radius + o.def.radius) return;
    shove(o, o.x - cx, o.y - cy, a.knock);
    world.hurt(o, (o === main ? a.damage : a.splash) * rand(0.9, 1.1), o.x, o.y, undefined, u);
  });
  world.hitProps(cx, cy, a.radius * 0.6, a.damage);
  world.stomps.push({ x: cx, y: cy + FEET, r: a.radius * 1.2, age: 0, life: 0.8, seed: Math.random() * TAU });
  dust(world, cx, cy + FEET - 1, 18, a.radius);
  rubble(world, cx, cy + FEET, 14, a.radius, 80);
  claws(world, cx + u.facing * 6, cy - 8, 0.95, 36, u.facing);
  claws(world, cx - u.facing * 4, cy - 4, -0.75, 28, u.facing, 0.09);
  if (world.sfx) world.sfx('slam', cx);
}

// the roar bursts out: everyone near is knocked back and left seeing stars
function bellow(world, u) {
  const a = u.def.roar;
  const mouth = { x: u.x + u.facing * 66 * K * u.def.scale, y: u.y + FEET + (-14 * K - FEET) * u.def.scale };
  world.roars.push({ x: mouth.x, y: mouth.y, ground: u.y + FEET, cx: u.x, r: a.radius, age: 0, life: 0.9, seed: Math.random() * TAU });
  world.stomps.push({ x: u.x, y: u.y + FEET, r: a.radius * 0.8, age: 0, life: 1, seed: Math.random() * TAU });
  rubble(world, u.x, u.y + FEET, 16, a.radius * 0.7, 95);
  dust(world, u.x, u.y + FEET - 1, 22, a.radius * 0.8);
  world.eachEnemyNear(u.side, u.x, u.y, a.radius + 24, (o) => {
    const dist = Math.hypot(o.x - u.x, o.y - u.y);
    if (dist > a.radius + o.def.radius) return;
    shove(o, o.x - u.x, o.y - u.y, a.knock);
    // (nobody in mid-leap or on the wing is stopped in the air; the biggest shake it off twice as fast)
    if (!(o.alt > 0.3) && !o.leap) o.dazed = o.def.hp > 900 ? a.daze * 0.5 : a.daze;
    world.hurt(o, a.damage, o.x, o.y, undefined, u);
  });
  if (world.sfx) {
    world.sfx('boom', u.x);
    world.sfx('slam', u.x);
  }
}

// horns first: whoever is in the way is flipped over (the big ones are only shoved)
function butt(world, u) {
  const a = u.def.ram;
  const m = u.act;
  world.eachEnemyNear(u.side, u.x, u.y, 80, (o) => {
    if (m.struck.has(o)) return;
    const dx = o.x - u.x;
    const dy = o.y - u.y;
    if (dx * m.dx + dy * m.dy < -6 || Math.hypot(dx, dy) > u.def.radius + o.def.radius + 12) return;
    m.struck.add(o);
    world.hurt(o, a.damage * rand(0.9, 1.1), o.x, o.y, undefined, u);
    const light = !o.def.noKnock && o.def.hp <= 300 && !(o.alt > 0.3);
    if (light && !o.dead && world.trip) world.trip(o, m.dx * 150, m.dy * 150);
    else shove(o, m.dx, m.dy, a.knock);
    dust(world, o.x, o.y + FEET - 2, 6, 12);
    rubble(world, o.x, o.y + FEET, 4, 8, 70);
    world.impacts.push({ x: o.x, y: o.y - 6, r: 24, age: 0, life: 0.34, turn: Math.random() * TAU, violet: true });
    if (world.sfx) world.sfx('smash', o.x);
  });
  world.hitProps(u.x + m.dx * 22, u.y + m.dy * 22, 14, a.damage);
}

// one stroke of its claws: everyone in front of it and within reach
function swipe(world, u, i) {
  const a = u.def.rake;
  const cx = u.x + u.facing * 30;
  claws(world, u.x + u.facing * 52, u.y - (i ? 4 : 8), i ? -0.8 : 0.95, i ? 32 : 28, u.facing);
  let struck = false;
  world.eachEnemyNear(u.side, cx, u.y, a.reach + 24, (o) => {
    if ((o.x - u.x) * u.facing < -8 || Math.hypot(o.x - cx, (o.y - u.y) * 1.3) > a.reach + o.def.radius || o.def.flying) return;
    struck = true;
    shove(o, u.facing, (o.y - u.y) / 40, a.knock * (i ? 1.4 : 0.7));
    world.hurt(o, a.damage * rand(0.9, 1.1), o.x, o.y, undefined, u);
  });
  world.hitProps(cx, u.y, a.reach * 0.6, a.damage);
  dust(world, u.x + u.facing * 40, u.y + FEET - 2, 6, 16);
  if (world.sfx) world.sfx(struck ? 'smash' : 'whoosh', u.x);
}

// ---------------------------------------------------------------- the snake
// It has a mind of its own: whatever the rest of the beast is doing, it strikes at whoever it can reach, those creeping
// up behind first
function stepSnake(world, u, dt) {
  const a = u.def.venom;
  const b = u.bite;
  if (b) {
    const before = b.t;
    b.t += dt;
    // it follows its mark until it gets there
    if (b.t < a.hit && !b.o.dead) {
      b.x = b.o.x;
      b.y = b.o.y - 2;
    }
    if (before < a.hit && b.t >= a.hit && !b.o.dead && Math.hypot(b.o.x - u.x, b.o.y - u.y) <= (a.reach + b.o.def.radius) * 1.35) {
      const o = b.o;
      o.poison = a.poison;
      o.poisonDps = a.poisonDps;
      o.poisonSrc = u;
      world.hurt(o, a.damage * rand(0.9, 1.1), o.x, o.y, undefined, u);
      world.miasma.push({ x: o.x, y: o.y, r: a.cloudRadius, age: 0, life: a.cloud, side: u.side, src: u, dps: a.poisonDps, seed: Math.random() * 99 });
      for (let i = 0; i < 18; i++) {
        const an = Math.random() * TAU;
        const sp = rand(30, 90);
        world.venoms.push({ x: o.x, y: o.y - 3, vx: Math.cos(an) * sp, vy: Math.sin(an) * sp - 45, age: 0, life: rand(0.3, 0.65), size: rand(1, 2.4) });
      }
      if (world.sfx) world.sfx('bite', o.x);
    }
    if (b.t >= a.time) u.bite = null;
    return;
  }
  u.venomCd = (u.venomCd === undefined ? 1 : u.venomCd) - dt;
  if (u.venomCd > 0) return;
  let best = null;
  let bestScore = Infinity;
  world.eachEnemyNear(u.side, u.x, u.y, a.reach + 24, (o) => {
    const dist = Math.hypot(o.x - u.x, o.y - u.y) - o.def.radius;
    if (dist > a.reach) return;
    // behind it counts as much nearer; and someone not yet poisoned comes first
    const score = dist - ((o.x - u.x) * u.facing < 0 ? 60 : 0) + (o.poison > 0 ? 40 : 0);
    if (score < bestScore) {
      best = o;
      bestScore = score;
    }
  });
  if (!best) return;
  u.bite = { t: 0, o: best, x: best.x, y: best.y - 2 };
  u.venomCd = a.cooldown[0] + Math.random() * (a.cooldown[1] - a.cooldown[0]);
  if (world.sfx) world.sfx('whoosh', u.x);
}

function begin(world, u, kind, t) {
  const a = u.def[kind];
  u.act = { kind, t: 0, mark: t, struck: new Set() };
  u[`${kind}Cd`] = a.cooldown[0] + Math.random() * (a.cooldown[1] - a.cooldown[0]);
  u.burstLeft = 0;
  u.firing = false;
  if (Math.abs(t.x - u.x) > 3) u.facing = t.x > u.x ? 1 : -1;
  if (world.sfx && kind !== 'pounce') world.sfx(kind === 'rake' ? 'whoosh' : 'magic', u.x);
}

// whatever big move it is in the middle of
function stepAct(world, u, dt) {
  const m = u.act;
  const a = u.def[m.kind];
  const before = m.t;
  m.t += dt;
  const t = m.mark;
  if (m.kind === 'pounce') {
    if (m.t < a.windup) {
      if (!t.dead && Math.abs(t.x - u.x) > 3) u.facing = t.x > u.x ? 1 : -1;
      return;
    }
    if (before < a.windup) {
      // it springs at where its mark is now, to come down with its front paws on them
      const dx = t.x - u.x;
      const dy = t.y - u.y;
      const dist = Math.hypot(dx, dy) || 1;
      const go = Math.max(0, Math.min(a.max, dist) - 40);
      m.x0 = u.x;
      m.y0 = u.y;
      m.x1 = u.x + (dx / dist) * go;
      m.y1 = u.y + (dy / dist) * go;
      dust(world, u.x - u.facing * 14, u.y + FEET - 1, 8, 16);
      if (world.sfx) world.sfx('whoosh', u.x);
    }
    if (before - a.windup < a.time) {
      const p = Math.min(1, (m.t - a.windup) / a.time);
      u.x = lerp(m.x0, m.x1, p);
      u.y = lerp(m.y0, m.y1, p);
      u.alt = p < 1 ? Math.max(0.001, Math.sin(Math.PI * p)) : 0;
      u.kx = u.ky = 0;
      if (p >= 1) land(world, u);
    }
    if (m.t >= a.windup + a.time + a.recover) u.act = null;
  } else if (m.kind === 'ram') {
    if (m.dx === undefined) {
      m.dx = u.facing;
      m.dy = 0;
    }
    if (m.t < a.windup) {
      if (!t.dead) {
        if (Math.abs(t.x - u.x) > 3) u.facing = t.x > u.x ? 1 : -1;
        const dist = Math.hypot(t.x - u.x, t.y - u.y) || 1;
        m.dx = (t.x - u.x) / dist;
        m.dy = (t.y - u.y) / dist;
      }
      return;
    }
    if (m.t < a.windup + a.time) {
      u.x += m.dx * a.speed * dt;
      u.y += m.dy * a.speed * dt;
      u.moving = true;
      butt(world, u);
      m.dustT = (m.dustT || 0) - dt;
      if (m.dustT <= 0) {
        m.dustT = 0.07;
        dust(world, u.x - u.facing * 18, u.y + FEET - 1, 4, 9);
      }
    }
    if (m.t >= a.windup + a.time + a.recover) u.act = null;
  } else if (m.kind === 'rake') {
    if (m.t < a.hits[0] && !t.dead && Math.abs(t.x - u.x) > 3) u.facing = t.x > u.x ? 1 : -1;
    a.hits.forEach((when, i) => {
      if (before < when && m.t >= when) swipe(world, u, i);
    });
    if (m.t >= a.time) u.act = null;
  } else {
    if (before < a.windup && m.t >= a.windup) bellow(world, u);
    if (m.t >= a.time) u.act = null;
  }
}

export function stepChimera(world, u, dt) {
  const d = u.def;
  // it opens with one of its leaps or charges rather than the fire
  if (u.pounceCd === undefined) u.burstT = 1.9;
  for (const kind of ['rake', 'pounce', 'ram', 'roar']) {
    const key = `${kind}Cd`;
    u[key] = (u[key] === undefined ? d[kind].first : u[key]) - dt;
  }
  stepSnake(world, u, dt);
  const wasX = u.x;
  const wasY = u.y;
  if (u.act) {
    world.acquire(u, dt);
    stepAct(world, u, dt);
    // (the fire waits its turn)
    u.burstLeft = 0;
    u.firing = false;
    u.burstT = Math.max(u.burstT || 0, 0.5);
    u.pose = Math.min(1, u.pose + dt * 6);
  } else {
    const t = world.acquire(u, dt);
    let chosen = false;
    // it finishes a breath of fire before starting anything else
    if (t && !(u.burstLeft > 0)) {
      const dist = Math.hypot(t.x - u.x, t.y - u.y);
      let close = 0;
      let right = false;
      world.eachEnemyNear(u.side, u.x, u.y, d.roar.radius, (o) => {
        const away = Math.hypot(o.x - u.x, o.y - u.y);
        if (away <= d.roar.radius * 0.8) close++;
        if (away <= d.radius + o.def.radius + 14) right = true;
      });
      const inReach = dist <= d.radius + t.def.radius + d.rake.near && !t.def.flying;
      if (u.roarCd <= 0 && (close >= 3 || (right && u.rakeCd > 0.4))) {
        begin(world, u, 'roar', t);
        chosen = true;
      } else if (u.rakeCd <= 0 && inReach) {
        begin(world, u, 'rake', t);
        chosen = true;
      } else if (u.pounceCd <= 0 && dist >= d.pounce.min && dist <= d.pounce.max && !t.def.flying) {
        begin(world, u, 'pounce', t);
        chosen = true;
      } else if (u.ramCd <= 0 && dist >= d.ram.min && dist <= d.ram.max) {
        begin(world, u, 'ram', t);
        chosen = true;
      }
    }
    if (!chosen) world.stepFlame(u, dt);
  }
  // its paws go round exactly as fast as it is getting along
  if (u.moving && !(u.act && u.act.kind === 'pounce')) {
    const mx = u.x - wasX;
    const my = u.y - wasY;
    const gone = Math.hypot(mx, my);
    if (gone > 0.001) {
      u.walk = (u.walk || 0) + gone / stepLength(u);
      u.walkX = mx / gone;
      u.walkY = my / gone;
    }
  }
  u.walkK = u.moving ? Math.min(1, (u.walkK || 0) + dt * 7) : Math.max(0, (u.walkK || 0) - dt * 6);
}

export function stepChimeraFx(world, dt) {
  for (const list of [world.venoms, world.roars, world.stomps, world.slashes, world.rubble, world.miasma, world.impacts]) for (const e of list) e.age += dt;
  for (const e of world.rubble) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.z += e.vz * dt;
    e.vz -= 340 * dt;
    if (e.z < 0) {
      e.z = 0;
      e.vz *= -0.34;
      e.vx *= 0.55;
      e.vy *= 0.55;
      e.spin *= 0.5;
    }
    e.turn += e.spin * dt;
  }
  // whoever stands in a cloud of its poison is poisoned too
  for (const m of world.miasma) {
    world.eachEnemyNear(m.side, m.x, m.y, m.r + 20, (o) => {
      if (o.def.flying || Math.hypot(o.x - m.x, (o.y - m.y) * 1.5) > m.r + o.def.radius * 0.5 || o.poison > 1.2) return;
      o.poison = 1.2;
      o.poisonDps = m.dps;
      o.poisonSrc = m.src;
    });
  }
  for (const e of world.venoms) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.vy += 230 * dt;
  }
  const live = (o) => o.age < o.life;
  for (const key of ['venoms', 'roars', 'stomps', 'slashes', 'rubble', 'miasma', 'impacts']) if (!world[key].every(live)) world[key] = world[key].filter(live);
}

function sparks(world, x, y, n, ang, spread, speed) {
  for (let i = 0; i < n; i++) {
    const a = ang + (Math.random() - 0.5) * spread;
    const sp = speed * rand(0.45, 1.2);
    world.embers.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: rand(0.3, 0.75), teal: false, green: false });
  }
}

// the moment the fire bursts out of the goat's mouth
export function chimeraIgnite(world, u, m, ang) {
  sparks(world, m.x, m.y, 30, ang, 1.5, 250);
  world.impacts.push({ x: m.x, y: m.y, r: 30, age: 0, life: 0.32, turn: Math.random() * TAU, violet: false });
  if (world.sfx) world.sfx('boom', u.x);
}

// every frame it breathes: sparks fly, and the ground under the fire is left burning
export function chimeraBreath(world, u, m, ang, dt, t) {
  u.emberAcc = (u.emberAcc || 0) + dt;
  while (u.emberAcc >= 0.028) {
    u.emberAcc -= 0.028;
    sparks(world, m.x, m.y, 1, ang, 0.65, 250);
  }
  if (!t) return;
  u.scorchT = (u.scorchT || 0) - dt;
  if (u.scorchT <= 0) {
    u.scorchT = 0.13;
    const k = rand(0.4, 1.12);
    scorch(world, u.x + (t.x - u.x) * k + rand(-8, 8), u.y + (t.y - u.y) * k + FEET + rand(-4.5, 4.5), rand(4.2, 8), rand(2.2, 3.2));
  }
}

// under the units: the ground cracked where it landed
export function drawChimeraGround(ctx, world) {
  if (!world.stomps.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (const q of world.stomps) {
    const p = q.age / q.life;
    const out = 1 - (1 - Math.min(1, p * 1.7)) ** 3;
    ctx.strokeStyle = `rgba(92, 70, 52, ${0.65 * (1 - p * p)})`;
    ctx.lineWidth = 1.2;
    for (let i = 0; i < 7; i++) {
      const a = q.seed + (i / 7) * TAU;
      const len = q.r * (0.5 + ((i * 37) % 10) / 26) * Math.min(1, p * 5);
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x + Math.cos(a + 0.16) * len * 0.55, q.y + Math.sin(a + 0.16) * len * 0.25);
      ctx.lineTo(q.x + Math.cos(a - 0.06) * len, q.y + Math.sin(a - 0.06) * len * 0.42);
      ctx.stroke();
    }
    ctx.strokeStyle = `rgba(160, 140, 118, ${0.75 * (1 - p)})`;
    ctx.lineWidth = 3 * (1 - p) + 0.5;
    ctx.beginPath();
    ctx.ellipse(q.x, q.y, q.r * (0.25 + out), q.r * (0.25 + out) * 0.4, 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
}

// one claw mark: a curved sliver from one end to the other, as far along as `shown`
function claw(ctx, len, off, bow, wide, shown, colour) {
  const at = (t) => [-len + 2 * len * t, off - bow * 4 * t * (1 - t)];
  ctx.fillStyle = colour;
  ctx.beginPath();
  const n = 14;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * shown;
    const [x, y] = at(t);
    const w = wide * Math.sin(Math.PI * Math.min(1, (i / n) * 0.86 + 0.07));
    if (i) ctx.lineTo(x, y - w);
    else ctx.moveTo(x, y - w);
  }
  for (let i = n; i >= 0; i--) {
    const t = (i / n) * shown;
    const [x, y] = at(t);
    ctx.lineTo(x, y + wide * Math.sin(Math.PI * Math.min(1, (i / n) * 0.86 + 0.07)) * 0.45);
  }
  ctx.closePath();
  ctx.fill();
}

function star(ctx, x, y, r, inner, points, turn) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const a = turn + (i / (points * 2)) * TAU;
    const d = i % 2 ? r * inner : r * (i % 4 ? 0.72 : 1);
    if (i) ctx.lineTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
    else ctx.moveTo(x + Math.cos(a) * d, y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
}

// over the units: poison, claw marks, flying stones, the flash of its horns and the sound of its roar
export function drawChimeraAir(ctx, world) {
  if (!world.roars.length && !world.venoms.length && !world.slashes.length && !world.rubble.length && !world.miasma.length && !world.impacts.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (const m of world.miasma) {
    const p = m.age / m.life;
    const swell = Math.min(1, p * 4);
    const fade = Math.min(1, (1 - p) * 2.4);
    for (let i = 0; i < 7; i++) {
      const q = (m.seed + i * 0.37 + m.age * 0.55) % 1;
      const a = m.seed + i * 2.4;
      const x = m.x + Math.cos(a) * m.r * 0.72 * swell * (0.4 + (i % 3) * 0.3);
      const y = m.y + FEET - 4 + Math.sin(a) * m.r * 0.28 * swell - q * 13;
      const size = (4 + (i % 3) * 2.2) * swell * (1 - q * 0.35);
      ctx.fillStyle = i % 2 ? `rgba(104, 176, 40, ${0.3 * fade})` : `rgba(122, 76, 160, ${0.2 * fade})`;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();
      ctx.strokeStyle = `rgba(52, 110, 22, ${0.55 * fade * (1 - q)})`;
      ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.arc(x + size * 0.5, y - size * 0.8 - q * 5, 1.3, 0, TAU);
      ctx.stroke();
    }
  }
  for (const e of world.rubble) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, (1 - e.age / e.life) * 3);
    ctx.translate(e.x, e.y - e.z);
    ctx.rotate(e.turn);
    ctx.fillStyle = e.size > 2.4 ? '#8d7762' : '#a8927a';
    ctx.strokeStyle = '#3d2e22';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.moveTo(-e.size, -e.size * 0.4);
    ctx.lineTo(-e.size * 0.1, -e.size);
    ctx.lineTo(e.size, -e.size * 0.1);
    ctx.lineTo(e.size * 0.4, e.size * 0.8);
    ctx.lineTo(-e.size * 0.7, e.size * 0.6);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  for (const r of world.roars) {
    const p = r.age / r.life;
    // a red flash swelling out over the ground
    if (p < 0.7) {
      const q = p / 0.7;
      const size = 14 + r.r * 1.1 * (1 - (1 - q) ** 2);
      ctx.save();
      ctx.translate(r.cx, r.ground - 8);
      ctx.scale(1, 0.62);
      const gr = ctx.createRadialGradient(0, 0, size * 0.3, 0, 0, size);
      gr.addColorStop(0, 'rgba(255, 110, 20, 0)');
      gr.addColorStop(0.75, `rgba(255, 70, 20, ${0.3 * (1 - q)})`);
      gr.addColorStop(1, 'rgba(190, 20, 20, 0)');
      ctx.fillStyle = gr;
      ctx.beginPath();
      ctx.arc(0, 0, size, 0, TAU);
      ctx.fill();
      ctx.restore();
    }
    // jagged lines of force bursting from its mouth
    if (p < 0.55) {
      ctx.strokeStyle = `rgba(122, 30, 18, ${0.8 * (1 - p / 0.55)})`;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      for (let i = 0; i < 18; i++) {
        const an = r.seed + (i / 18) * TAU;
        const from = 16 + p * 90 + (i % 3) * 6;
        const to = from + 12 + (i % 4) * 7;
        ctx.moveTo(r.x + Math.cos(an) * from, r.y + Math.sin(an) * from * 0.7);
        ctx.lineTo(r.x + Math.cos(an) * to, r.y + Math.sin(an) * to * 0.7);
      }
      ctx.stroke();
    }
    // rings of sound racing out from its mouth, one after another
    for (let i = 0; i < 4; i++) {
      const q = (p - i * 0.13) / 0.6;
      if (q <= 0 || q >= 1) continue;
      const size = 10 + (r.r - 4) * (1 - (1 - q) ** 2);
      for (const [colour, wide] of [[`rgba(150, 26, 14, ${0.75 * (1 - q)})`, 5.4 * (1 - q) + 0.8], [`rgba(255, 150, 60, ${0.9 * (1 - q)})`, 2.8 * (1 - q) + 0.4], [`rgba(255, 240, 200, ${1 - q})`, 1 * (1 - q) + 0.2]]) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = wide;
        ctx.beginPath();
        ctx.ellipse(lerp(r.x, r.cx, q), lerp(r.y, r.ground - 6, q), size, size * lerp(0.9, 0.5, q), 0, 0, TAU);
        ctx.stroke();
      }
    }
  }
  for (const e of world.impacts) {
    const p = e.age / e.life;
    const size = e.r * (0.45 + 0.75 * (1 - (1 - p) ** 2));
    ctx.fillStyle = e.violet ? `rgba(106, 22, 150, ${0.85 * (1 - p)})` : `rgba(214, 66, 12, ${0.8 * (1 - p)})`;
    star(ctx, e.x, e.y, size, 0.34, 8, e.turn);
    ctx.fillStyle = e.violet ? `rgba(214, 118, 255, ${1 - p})` : `rgba(255, 170, 40, ${1 - p})`;
    star(ctx, e.x, e.y, size * 0.68, 0.36, 8, e.turn);
    ctx.fillStyle = `rgba(255, 250, 230, ${1 - p})`;
    star(ctx, e.x, e.y, size * 0.36, 0.45, 8, e.turn);
  }
  for (const c of world.slashes) {
    if (c.age < 0) continue;
    const p = c.age / c.life;
    const shown = Math.min(1, p / 0.28);
    const fade = p < 0.45 ? 1 : 1 - (p - 0.45) / 0.55;
    ctx.save();
    ctx.translate(c.x, c.y);
    ctx.scale(c.face, 1);
    ctx.rotate(c.turn);
    for (const i of [-1, 0, 1]) {
      const len = c.size * (i ? 0.82 : 1);
      const off = i * c.size * 0.34;
      claw(ctx, len, off, c.size * 0.3, c.size * 0.19, shown, `rgba(128, 8, 20, ${0.9 * fade})`);
      claw(ctx, len * 0.97, off, c.size * 0.3, c.size * 0.12, shown, `rgba(255, 66, 40, ${fade})`);
      claw(ctx, len * 0.88, off, c.size * 0.3, c.size * 0.05, shown, `rgba(255, 244, 224, ${fade})`);
    }
    ctx.restore();
  }
  for (const e of world.venoms) {
    const fade = 1 - (e.age / e.life) ** 2;
    ctx.fillStyle = `rgba(112, 205, 46, ${fade})`;
    ctx.strokeStyle = `rgba(38, 96, 20, ${fade})`;
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(e.x, e.y, e.size, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}
