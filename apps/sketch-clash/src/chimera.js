// The Chimera: what it looks like, how it moves and how it fights.
// A lion with a shaggy mane; a goat with curling horns rising from its back, whose legs are its hind legs; and a banded
// green snake for a tail. Drawn the way the game draws its animals: standing side on, flat colours, one even dark line,
// round-topped legs, small eyes under flat brows.
// Each head has its own tricks. The lion leaps, rakes with its claws and roars (leaving those near it seeing stars);
// the goat breathes fire and charges horns first; and the snake, all the while, lashes out and leaves poison behind.
// Drawn in art units, facing +x, with the ground 25 below the origin.
import { TAU, K, FEET } from './config.js?v=271';
import { poly, circ, ell } from './art_kit.js?v=271';
import { rigStep, applyBotBody } from './botrig.js?v=271';
import { scorch } from './zordfx.js?v=271';

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (q) => q * q * (3 - 2 * q);
const clamp01 = (q) => Math.max(0, Math.min(1, q));

const INK = '#1f1a24'; // the dark line round everything
const LW = 1.1; // as heavy on screen as the other animals'
const C = {
  fur: '#d9a23f', furDark: '#c18a31', furFar: '#9d7029', belly: '#f1d89c',
  mane: '#97572b', maneDark: '#7c431f', nose: '#4a2a26', maw: '#6a1f28', tongue: '#d96a75', tooth: '#fdfbf2', claw: '#f6f2e6',
  goat: '#6a6176', goatDark: '#554d61', goatFar: '#463f51', throat: '#b3a8bd', hoof: '#2e2735', pink: '#d99aa6', brow: '#3a2a2c',
  horn: '#efe8d8', hornFar: '#cdc4b0', hornTip: '#8d7c64', maneLight: '#b8723a', scar: '#f7dfae', blaze: '#8b8298',
  snake: '#7fac43', snakeDark: '#486f27', snakeBelly: '#cfdc8c', snakeMark: '#e6d55a',
};

// where the goat's head turns on its neck, and how far along from there its mouth is. (config.js puts the fire there)
export const GOAT = { x: 14, y: -55, mouth: 24 };
const GOAT_REST = 0.1; // how its head is tipped when it is minding its own business
const HEAD = [39, -15]; // the middle of the lion's head
export const LIFT = 0;

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

// ---- built like the game's own animals: a few flat shapes, one even dark line, legs with round tops laid over the body

// a leg: round at the top where it lies over the body, bending a little at the knee, narrower to the ankle. `bow`: how
// far back the knee goes
function limbShape(g, hip, ankle, top, mid, low, bow, fill) {
  const dx = ankle[0] - hip[0];
  const dy = ankle[1] - hip[1];
  const d = Math.hypot(dx, dy) || 1;
  const ux = dx / d;
  const uy = dy / d;
  const lx = -uy; // out to its back
  const ly = ux;
  const knee = [hip[0] + dx * 0.56 + lx * bow, hip[1] + dy * 0.56 + ly * bow];
  const at = (p, k, along = 0) => [p[0] + lx * k + ux * along, p[1] + ly * k + uy * along];
  const kneeBack = at(knee, mid);
  const kneeFront = at(knee, -mid);
  const path = () => {
    g.moveTo(...at(hip, top));
    g.bezierCurveTo(...at(hip, top, d * 0.22), ...at(knee, mid + 0.8, -d * 0.16), ...kneeBack);
    g.quadraticCurveTo(...at(knee, mid - 0.8, d * 0.16), ...at(ankle, low));
    g.quadraticCurveTo(...at(ankle, 0, low * 0.9), ...at(ankle, -low));
    g.quadraticCurveTo(...at(knee, -mid + 0.6, d * 0.14), ...kneeFront);
    g.bezierCurveTo(...at(knee, -mid - 0.6, -d * 0.18), ...at(hip, -top, d * 0.22), ...at(hip, -top));
    // the round top
    g.bezierCurveTo(...at(hip, -top, -top * 1.32), ...at(hip, top, -top * 1.32), ...at(hip, top));
  };
  shape(g, fill, LW, path);
}

// a small ragged tuft at (x, y) on a leg, its points streaming back
function tuft(g, x, y, size, fill) {
  poly(g, [[x + 3 * size, y - 5 * size], [x - 5.4 * size, y - 1.6 * size], [x - 1.8 * size, y - 0.4 * size], [x - 7 * size, y + 3.8 * size], [x - 1.4 * size, y + 2.6 * size], [x - 3.4 * size, y + 7.4 * size], [x + 3 * size, y + 3.6 * size]], fill, 0.95);
}

// where a leg's knee comes, for the tuft behind it
function kneeAt(hip, ankle, bow) {
  const dx = ankle[0] - hip[0];
  const dy = ankle[1] - hip[1];
  const d = Math.hypot(dx, dy) || 1;
  return [hip[0] + dx * 0.56 - (dy / d) * bow, hip[1] + dy * 0.56 + (dx / d) * bow];
}

// the lion's forelegs: golden, ending in a round paw with big curved white claws
function foreleg(g, hip, foot, turn, far) {
  const fill = far ? C.furFar : C.fur;
  const ankle = [foot[0] - 1.4, foot[1] - 4.6];
  const elbow = kneeAt(hip, ankle, 3.2);
  tuft(g, elbow[0] - 3.4, elbow[1] - 1, far ? 0.8 : 1, far ? C.maneDark : C.mane);
  limbShape(g, hip, ankle, far ? 9 : 10.6, 5.4, 4.9, 3.2, fill);
  if (!far) {
    lines(g, 0.95, () => {
      // the muscle of its shoulder, and a sinew down the arm
      g.moveTo(hip[0] - 7.4, hip[1] - 0.6);
      g.bezierCurveTo(hip[0] - 4, hip[1] + 7.6, hip[0] + 4, hip[1] + 7.4, hip[0] + 6.6, hip[1] + 0.6);
      g.moveTo(elbow[0] + 1.4, elbow[1] - 2);
      g.quadraticCurveTo(elbow[0] + 3.4, elbow[1] + 3, ankle[0] + 0.4, ankle[1] - 1.6);
    }, 'rgba(78, 48, 12, 0.6)');
  }
  g.save();
  g.translate(foot[0], foot[1]);
  g.rotate(turn);
  for (const [x, y] of [[7, -4], [8.6, -1.8], [8.2, 0.2]]) {
    shape(g, C.claw, 0.75, () => {
      g.moveTo(x - 1.4, y - 1.8);
      g.quadraticCurveTo(x + 3.8, y - 2, x + 5.2, y + 2);
      g.quadraticCurveTo(x + 2.4, y + 0.4, x - 1.2, y + 1);
    });
  }
  const pad = () => {
    g.moveTo(-6.2, -5.4);
    g.bezierCurveTo(-1, -8.2, 7, -7.4, 9, -3);
    g.quadraticCurveTo(10.4, 1.2, 6, 1.4);
    g.lineTo(-3.8, 1.4);
    g.quadraticCurveTo(-7.4, 0.6, -6.2, -5.4);
  };
  shape(g, fill, 0, pad);
  // (lined round the bottom only, so it runs on from the leg)
  g.beginPath();
  g.moveTo(8.2, -4.6);
  g.quadraticCurveTo(10.8, 1.2, 6, 1.4);
  g.lineTo(-3.8, 1.4);
  g.quadraticCurveTo(-7.2, 0.8, -6.4, -3.6);
  ink(g);
  lines(g, 0.8, () => {
    for (const x of [0.6, 4.4]) {
      g.moveTo(x, 1.2);
      g.quadraticCurveTo(x + 1.2, -1.2, x - 0.2, -2.8);
    }
  });
  g.restore();
}

// the goat's hind legs: the same build, dark, on split hooves
function hindleg(g, hip, foot, turn, far) {
  const ankle = [foot[0] - 1, foot[1] - 5.4];
  const hock = kneeAt(hip, ankle, 6.2);
  tuft(g, hock[0] - 2.4, hock[1] - 0.6, 0.8, far ? C.goatFar : C.goatDark);
  limbShape(g, hip, ankle, far ? 9.4 : 11.2, 4.6, 3.8, 6.2, far ? C.goatFar : C.goat);
  if (!far) {
    lines(g, 0.95, () => {
      g.moveTo(hip[0] - 7.6, hip[1] - 1);
      g.bezierCurveTo(hip[0] - 5, hip[1] + 8, hip[0] + 4, hip[1] + 8, hip[0] + 7, hip[1]);
    }, 'rgba(26, 18, 36, 0.55)');
  }
  g.save();
  g.translate(foot[0], foot[1]);
  g.rotate(turn);
  shape(g, C.hoof, LW, () => {
    g.moveTo(-4.6, -5.8);
    g.lineTo(2.8, -6.2);
    g.quadraticCurveTo(5.8, -2.6, 6.4, 1.4);
    g.lineTo(-5.2, 1.4);
    g.quadraticCurveTo(-5.6, -2.6, -4.6, -5.8);
  });
  poly(g, [[-5.4, -8], [3.6, -8.4], [4.4, -3.4], [2, -5.4], [0.4, -2.6], [-1.6, -5.2], [-3.6, -2.8], [-4.4, -5], [-7.2, -3.6]], far ? C.goatDark : C.blaze, 0.9);
  lines(g, 0.8, () => {
    g.moveTo(1.2, 1.2);
    g.lineTo(0.6, -2.6);
  }, '#6d6378');
  g.restore();
}

// the body: golden in front and goat behind, a darker flat band along its back and a pale one under its belly
function torso(g) {
  const round = () => {
    g.moveTo(-41, -9);
    g.bezierCurveTo(-41, -23, -25, -26, -9, -23.5);
    g.bezierCurveTo(7, -21.5, 18, -29, 31, -23);
    g.bezierCurveTo(42, -16, 42, 1, 31, 7);
    g.bezierCurveTo(19, 13, -3, 8.6, -18, 9.6);
    g.bezierCurveTo(-34, 11.6, -41, 4, -41, -9);
  };
  shape(g, C.fur, 0, round);
  within(g, round, () => {
    shape(g, C.furDark, 0, () => {
      g.moveTo(-46, -34);
      g.lineTo(46, -34);
      g.lineTo(46, -17);
      g.bezierCurveTo(20, -18, 0, -11, -46, -14);
    });
    shape(g, C.belly, 0, () => {
      g.moveTo(-20, 18);
      g.bezierCurveTo(-14, -1, 12, 3, 38, -5);
      g.lineTo(44, 18);
    });
    // slanting strokes across the pale belly, as on the game's dragon
    lines(g, 1, () => {
      for (const x of [-6, 2, 10, 18, 26]) {
        g.moveTo(x, -4);
        g.lineTo(x + 6, 10);
      }
    }, 'rgba(150, 104, 40, 0.45)');
    // tawny stripes running down from its back
    for (const [x, len] of [[-8, 13], [1, 16], [10, 12]]) {
      shape(g, '#9c6a24', 0, () => {
        g.moveTo(x - 3.4, -30);
        g.quadraticCurveTo(x - 1, -22 + len * 0.4, x - 2.6, -26 + len);
        g.quadraticCurveTo(x + 3, -22 + len * 0.3, x + 3.4, -30);
      });
    }
    // the goat's hindquarters, in the same two flat tones
    const rear = () => {
      g.moveTo(-50, -34);
      g.lineTo(-12, -34);
      g.bezierCurveTo(-6, -18, -24, -10, -16, 18);
      g.lineTo(-50, 18);
    };
    shape(g, C.goat, 0, rear);
    within(g, rear, () => shape(g, C.goatDark, 0, () => {
      g.moveTo(-50, -34);
      g.lineTo(0, -34);
      g.lineTo(0, -17);
      g.bezierCurveTo(-18, -14, -34, -13, -46, -12);
    }));
    lines(g, 1, () => {
      g.moveTo(-12, -34);
      g.bezierCurveTo(-6, -18, -24, -10, -16, 18);
    });
  });
  // shaggy hair under its chest and off its rump
  poly(g, [[16, 6], [34, 2], [31, 9], [35.4, 13], [28, 11.4], [28.4, 16.4], [22.6, 11], [20, 14.6], [18.4, 9.4]], C.mane, 1);
  poly(g, [[-36, 2], [-44.6, 5], [-39.6, 5.4], [-43, 11], [-36.4, 8.4], [-37, 13], [-30, 7]], C.goatDark, 1);
  g.beginPath();
  round();
  g.closePath();
  ink(g);
}

// ---------------------------------------------------------------- eyes, as the game's animals have them
// a small round eye: its colour, and a pupil (slot: true, lying flat as a goat's does; 'up', an upright slit)
function beastEye(g, x, y, r, o, iris, slot) {
  if (o.dead) {
    lines(g, 1.3, () => {
      g.moveTo(x - r * 0.8, y - r * 0.8);
      g.lineTo(x + r * 0.8, y + r * 0.8);
      g.moveTo(x + r * 0.8, y - r * 0.8);
      g.lineTo(x - r * 0.8, y + r * 0.8);
    });
    return;
  }
  const open = 1 - (o.shut || 0);
  if (open < 0.4) {
    lines(g, 1.2, () => {
      g.moveTo(x - r, y);
      g.quadraticCurveTo(x, y + 1.4, x + r, y);
    });
    return;
  }
  ell(g, x, y, r, r * 0.92 * open, iris, 0.95);
  if (slot === 'up') ell(g, x + r * 0.2, y + 0.1, r * 0.2, r * 0.74 * open, '#17121a', 0);
  else if (slot) ell(g, x + r * 0.18, y + 0.2, r * 0.62, r * 0.27 * open, '#17121a', 0);
  else ell(g, x + r * 0.26, y + 0.15, r * 0.46, r * 0.52 * open, '#17121a', 0);
  circ(g, x + r * 0.08, y - r * 0.28 * open, r * 0.17, '#ffffff', 0);
}

// the flat bar of a brow over it
function brow(g, x0, y0, x1, y1, colour, wide) {
  lines(g, wide + 1.5, () => {
    g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 1.6, x1, y1);
  });
  lines(g, wide, () => {
    g.moveTo(x0, y0);
    g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 - 1.6, x1, y1);
  }, colour);
}

// ---------------------------------------------------------------- the goat
// a clean pale horn, curving back to a point. heat: glowing as the fire builds
function horn(g, root, c1, c2, tip, wide, fill, heat) {
  const pts = [];
  for (let i = 0; i <= 16; i++) {
    const t = i / 16;
    const at = (j) => (1 - t) ** 3 * root[j] + 3 * (1 - t) ** 2 * t * c1[j] + 3 * (1 - t) * t * t * c2[j] + t ** 3 * tip[j];
    pts.push([at(0), at(1)]);
  }
  const [L, R] = edges(pts, (i) => wide * (1 - (i / 16) * 0.94));
  shape(g, fill, LW, () => {
    g.moveTo(L[0][0], L[0][1]);
    through(g, L);
    through(g, [...R].reverse());
  });
  // the dark tip, and the rings it has grown
  shape(g, C.hornTip, LW, () => {
    g.moveTo(L[12][0], L[12][1]);
    through(g, L.slice(12));
    through(g, R.slice(12).reverse());
  });
  lines(g, 0.95, () => {
    for (const i of [2, 4, 6, 8, 10]) {
      g.moveTo(L[i][0], L[i][1]);
      g.quadraticCurveTo(pts[i + 1][0], pts[i + 1][1], R[i][0], R[i][1]);
    }
  }, 'rgba(60, 48, 40, 0.6)');
  if (heat > 0.02) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    through(g, pts);
    ink(g, wide * 0.5, `rgba(255, 110, 30, ${0.7 * heat})`);
    glow(g, tip[0], tip[1], 6 + 3 * heat, '255, 90, 30', 0.75 * heat);
  }
}

// the goat's neck and head. aim: radians (+ down); jaw 0..1; heat: how fiercely the fire is going in it; charge: how
// much fire has gathered before it breathes; fury: its horns wreathed as it charges
function goat(g, o) {
  const lean = (o.aim - GOAT_REST) * 4;
  const gx = GOAT.x;
  const gy = GOAT.y + lean * 0.5;
  const neck = () => {
    g.moveTo(-15, -16);
    g.bezierCurveTo(-10, -32, -8, gy - 4, gx - 4, gy - 9);
    g.lineTo(gx + 6, gy + 4);
    g.bezierCurveTo(gx - 2, gy + 14, 14, -32, 18, -17);
  };
  // little dark points down the back of the neck, like the crest on the game's dragon
  for (const [x, y, a] of [[gx - 9, gy - 4.6, -2.5], [gx - 14, gy + 2.6, -2.75], [-9.4, -34, -2.95], [-11.4, -27, -3.05], [-13.4, -21, -3.15]]) {
    poly(g, [[x + 3, y - 3], [x + Math.cos(a) * 10.4, y + Math.sin(a) * 10.4], [x + 1.4, y + 3.8]], C.goatDark, 0.95);
  }
  shape(g, C.goat, 0, neck);
  within(g, neck, () => {
    // a pale throat with a few slanted strokes
    shape(g, C.throat, 0, () => {
      g.moveTo(gx + 9, gy + 3);
      g.bezierCurveTo(gx - 5, gy + 11, 5, -30, 7, -12);
      g.lineTo(24, -12);
      g.lineTo(gx + 14, gy);
    });
    lines(g, 0.9, () => {
      for (const [x, y] of [[gx + 2, gy + 8], [gx - 1, gy + 13], [11, -37], [9.4, -31], [9.2, -25], [9.6, -19]]) {
        g.moveTo(x - 1, y - 3);
        g.lineTo(x + 6, y + 3);
      }
    }, 'rgba(50, 38, 62, 0.45)');
  });
  g.beginPath();
  neck();
  ink(g);

  g.save();
  g.translate(GOAT.x, gy);
  g.rotate(o.aim);
  if (o.heat > 0.02) glow(g, GOAT.mouth, 2, 15 + 10 * o.heat, '255, 130, 30', 0.6 * o.heat);
  horn(g, [3, -10], [2, -31], [-21, -35], [-35, -19], 7, C.hornFar, o.heat * 0.7);
  // a long forked beard
  poly(g, [[3.4, 5], [2 - o.wave, 19.6], [7.4, 11], [9.6 - o.wave * 0.7, 17], [13.6, 5.6]], C.goatDark, 1);
  const open = o.jaw * 0.5;
  const swing = (x, y) => [5 + (x - 5) * Math.cos(open) - (y - 1.4) * Math.sin(open), 1.4 + (x - 5) * Math.sin(open) + (y - 1.4) * Math.cos(open)];
  if (o.jaw > 0.1) {
    shape(g, o.heat > 0.2 ? '#ffb23a' : C.maw, 0, () => {
      g.moveTo(5, 0.6);
      g.lineTo(24, 1);
      g.lineTo(...swing(22, 3));
      g.lineTo(...swing(6, 3.4));
    });
  }
  g.save();
  g.translate(5, 1.4);
  g.rotate(open);
  g.translate(-5, -1.4);
  shape(g, C.throat, LW, () => {
    g.moveTo(5, 1.6);
    g.lineTo(23.4, 2);
    g.quadraticCurveTo(22.4, 5.8, 17, 6);
    g.lineTo(6, 6.2);
  });
  g.restore();
  const head = () => {
    g.moveTo(-8, -2);
    g.bezierCurveTo(-9, -12, 2, -15, 9, -11);
    g.bezierCurveTo(15, -8.4, 21, -8.6, 25, -6);
    g.quadraticCurveTo(29, -2.6, 26.4, 1.4);
    g.quadraticCurveTo(24.6, 2.6, 22, 2.2);
    g.lineTo(8, 1.8);
    g.bezierCurveTo(3, 7.6, -7, 6.4, -8, -2);
  };
  shape(g, C.goat, 0, head);
  within(g, head, () => {
    ell(g, 3, -14, 20, 7.4, C.goatDark, 0, 0.16);
    // a pale blaze down its long face
    shape(g, C.blaze, 0, () => {
      g.moveTo(11, -12);
      g.quadraticCurveTo(19, -7.4, 30, -4.4);
      g.quadraticCurveTo(19, -4.6, 9, -9.4);
    });
  });
  g.beginPath();
  head();
  g.closePath();
  ink(g);
  circ(g, 23.6, -3.4, 1.15, '#1c1620', 0);
  lines(g, 0.85, () => {
    g.moveTo(20.4, -2);
    g.quadraticCurveTo(23, -0.6, 26.2, -1.4);
    g.moveTo(1.6, -2.4);
    g.quadraticCurveTo(6, 0.2, 12, -1.6);
  }, 'rgba(24, 16, 34, 0.7)');
  beastEye(g, 6.6, -6.2, 3.5, o, o.heat > 0.3 || o.fury > 0.3 ? '#ff8a1e' : '#f2c232', true);
  brow(g, 1.6, -9.6, 12.4, -8.6, C.brow, 2.2);
  // a long ear, drooping back
  g.save();
  g.translate(-3.6, -5);
  g.rotate(o.ear * 0.6);
  shape(g, C.goat, LW, () => {
    g.moveTo(0, -3.4);
    g.bezierCurveTo(-7, -5.4, -14, 0.6, -15, 5.4);
    g.bezierCurveTo(-9, 6.6, -3, 3.4, 0, 2.4);
  });
  shape(g, C.pink, 0, () => {
    g.moveTo(-2.2, -1.2);
    g.bezierCurveTo(-6.4, -2, -10.4, 1.4, -11.6, 3.8);
    g.bezierCurveTo(-8, 4, -4.4, 2.2, -2.2, 1);
  });
  g.restore();
  horn(g, [-1, -10.4], [-5, -35], [-32, -37], [-44, -14], 8.8, C.horn, Math.max(o.heat * 0.7, o.fury));
  if (o.fury > 0.05) glow(g, -18, -18, 25, '190, 60, 255', 0.45 * o.fury);
  // fire gathering at its lips: motes spiralling in to a ball that swells
  if (o.charge > 0.04) {
    const c = o.charge;
    const x = GOAT.mouth + 4;
    glow(g, x, 2, 6 + 11 * c, '255, 90, 20', 0.75 * c);
    glow(g, x, 2, 2.4 + 5 * c, '255, 236, 150', 0.95 * c);
    for (let i = 0; i < 9; i++) {
      const q = (o.clock * 1.9 + i / 9) % 1;
      const a = i * 2.4 + q * 4.4;
      const r = (1 - q) * (13 + (i % 3) * 3);
      lines(g, 1.3 * q + 0.3, () => {
        g.moveTo(x + Math.cos(a) * r, 2 + Math.sin(a) * r * 0.8);
        g.lineTo(x + Math.cos(a - 0.35) * (r + 3.4), 2 + Math.sin(a - 0.35) * (r + 3.4) * 0.8);
      }, `rgba(255, ${150 + Math.round(90 * q)}, 50, ${c * (0.35 + 0.65 * q)})`);
    }
  }
  g.restore();
}

// ---------------------------------------------------------------- the lion's head
// the mane: two flat shaggy shapes, one inside the other, with short points all round that are longest at the back
function shag(g, o, n, cx, cy, rx, ry, reach, turn, fill) {
  const rim = (a) => [cx + Math.cos(a) * rx, cy + Math.sin(a) * ry];
  const round = () => {
    g.moveTo(...rim(turn));
    for (let i = 0; i < n; i++) {
      const a0 = turn + (i / n) * TAU;
      const a1 = turn + ((i + 1) / n) * TAU;
      const back = Math.max(0, -Math.cos(a0)); // 0 in front, 1 straight behind
      const long = reach + back * reach * 1.5 + (i % 2) * 1.6;
      // each point is swept toward the back
      const am = (a0 + a1) / 2 + (Math.sin(a0) > 0 ? 0.14 : -0.14);
      const sway = Math.sin(o.clock * o.wind * 0.7 + i * 1.9 + turn * 9) * 0.9 * (0.3 + back);
      const tip = [cx + Math.cos(am) * (rx + long), cy + Math.sin(am) * (ry + long) + sway];
      g.quadraticCurveTo(...rim(a0 + (a1 - a0) * 0.7), ...tip);
      g.lineTo(...rim(a1));
    }
  };
  shape(g, fill, 0, round);
  return round;
}

function mane(g, o) {
  const p = 1 + o.puff * 0.1;
  // the outer layer, with a darker patch low behind
  const outer = shag(g, o, 21, -5, 0, 24 * p, 25 * p, 4.4, 0, C.mane);
  within(g, outer, () => ell(g, -17, 12, 26, 19, C.maneDark, 0, 0.35));
  g.beginPath();
  outer();
  g.closePath();
  ink(g);
  lines(g, 0.95, () => {
    for (const [x, y] of [[-23, -13], [-27, -1], [-22, 11], [-13, -20], [-11, 19]]) {
      g.moveTo(x, y);
      g.lineTo(x - 6, y + 1.6);
    }
  }, 'rgba(48, 24, 10, 0.55)');
  // the lighter layer round its face
  const inner = shag(g, o, 17, -1.4, 0.6, 18.4 * p, 19.4 * p, 3.2, 0.19, C.maneLight);
  within(g, inner, () => ell(g, -17, 14, 17, 11, C.mane, 0, 0.4));
  g.beginPath();
  inner();
  g.closePath();
  ink(g, 0.95);
}

// jaw: 0..1. Shut, two small teeth still show, as on the game's dragon and alligator
function lionHead(g, o) {
  mane(g, o);
  // a round ear with a pink inside
  circ(g, -1.6, -16, 5.6, C.fur, LW);
  circ(g, -1.2, -15.6, 2.7, C.pink, 0);
  const open = Math.max(0, o.jaw - 0.06) * 0.62;
  const swing = (x, y) => [4 + (x - 4) * Math.cos(open) - (y - 6) * Math.sin(open), 6 + (x - 4) * Math.sin(open) + (y - 6) * Math.cos(open)];
  if (open > 0.04) {
    shape(g, C.maw, 0, () => {
      g.moveTo(3, 5);
      g.lineTo(28, 5);
      g.lineTo(...swing(25, 8));
      g.lineTo(...swing(5, 9));
    });
  }
  // lower jaw
  g.save();
  g.translate(4, 6);
  g.rotate(open);
  g.translate(-4, -6);
  if (open > 0.16) {
    ell(g, 15, 6.4, 8, 2.2, C.tongue, 0);
    for (const x of [22.6, 18.6]) poly(g, [[x - 1.7, 6.8], [x, 2.8], [x + 1.7, 6.8]], C.tooth, 0.7);
  }
  shape(g, C.belly, LW, () => {
    g.moveTo(2, 6);
    g.lineTo(26.4, 6.4);
    g.quadraticCurveTo(25.6, 11.6, 19, 12.4);
    g.quadraticCurveTo(9, 13.6, 2, 10);
  });
  g.restore();
  const face = () => {
    g.moveTo(-11, -2);
    g.bezierCurveTo(-11, -15, 4, -17.4, 11, -12.6);
    g.bezierCurveTo(14, -10.4, 15.4, -8.4, 17.6, -7.4);
    g.bezierCurveTo(25, -7.6, 32, -5, 31.6, 1);
    g.quadraticCurveTo(31.4, 6, 26.6, 6.2);
    g.lineTo(12, 6);
    g.bezierCurveTo(8, 8.8, 3, 11.6, -2, 10.8);
    g.bezierCurveTo(-8, 9.4, -11, 4.6, -11, -2);
  };
  shape(g, C.fur, 0, face);
  within(g, face, () => {
    ell(g, 0, -17, 20, 7.6, C.furDark, 0, 0.12);
    ell(g, 23.6, 3.4, 11.4, 6.4, C.belly, 0, -0.05);
  });
  g.beginPath();
  face();
  g.closePath();
  ink(g);
  // teeth along the top of the mouth
  for (const [x, long] of open > 0.1 ? [[24.6, 5.6], [20.4, 3.4], [16.2, 3.4], [12.4, 4.4]] : [[23.6, 5.2], [18.8, 3.2], [13.4, 2.4]]) poly(g, [[x - 1.7, 5.9], [x + 0.2, 5.9 + long], [x + 1.7, 6]], C.tooth, 0.7);
  // one lower fang standing up over its lip
  if (open <= 0.1) poly(g, [[19.8, 6.2], [21.2, 2.8], [22.6, 6.2]], C.tooth, 0.7);
  // the mouth line, turning down a little at the corner
  lines(g, LW, () => {
    g.moveTo(27, 6.1);
    g.lineTo(12, 5.9);
    g.quadraticCurveTo(9.6, 6.4, 8.6, 8.4);
  });
  // nose, the line under it, and whisker spots
  shape(g, C.nose, 0.9, () => {
    g.moveTo(25.4, -6.4);
    g.quadraticCurveTo(32.4, -6, 32.2, -2.6);
    g.quadraticCurveTo(31, -0.4, 28.4, -0.8);
    g.quadraticCurveTo(26, -2.8, 25.4, -6.4);
  });
  lines(g, 0.9, () => {
    g.moveTo(28.8, -0.8);
    g.quadraticCurveTo(29, 1.6, 27.4, 3);
  });
  for (const [x, y] of [[21.4, 0.8], [24, 2], [20.6, 3.2]]) circ(g, x, y, 0.65, '#6b4522', 0);
  // whiskers, and the creases of its muzzle and cheek
  lines(g, 0.6, () => {
    for (const [x, y, tx, ty] of [[21.6, 1.4, 36, -0.6], [21.8, 2.8, 36.4, 4], [21, 3.8, 33.4, 9]]) {
      g.moveTo(x, y);
      g.quadraticCurveTo((x + tx) / 2, (y + ty) / 2 - 1.6, tx, ty);
    }
  }, 'rgba(60, 40, 24, 0.8)');
  lines(g, 0.9, () => {
    g.moveTo(15.6, -4.6);
    g.quadraticCurveTo(18.4, -2.8, 19.6, 0.4);
    g.moveTo(-6, 2.4);
    g.lineTo(-0.4, 3.2);
    g.moveTo(-5, 5.6);
    g.lineTo(0, 5.4);
  }, 'rgba(78, 48, 12, 0.65)');
  // an old slash through its eye, with stitch marks across it
  for (const [wide, colour] of [[2.5, '#6e2f1c'], [1.1, C.scar]]) {
    lines(g, wide, () => {
      g.moveTo(2.4, -14.4);
      g.lineTo(12.6, 4.2);
    }, colour);
  }
  lines(g, 0.85, () => {
    for (const [x, y] of [[3.6, -12.2], [10.2, 0], [11.7, 2.7]]) {
      g.moveTo(x - 2, y + 1.1);
      g.lineTo(x + 2, y - 1.1);
    }
  }, '#6e2f1c');
  beastEye(g, 7, -4.6, 4, o, '#ffb92a', 'up');
  brow(g, 1.2, -10.2, 13.8, -7.4, C.brow, 2.8);
  // a forelock falling forward between its ears
  poly(g, [[-9.6, -10.4], [-7, -19.4], [-1, -16], [1, -22.6], [5.6, -16.4], [11.4, -19], [10.4, -13.8], [15.6, -13.4], [9, -11.2], [2, -13.4], [-4, -11]], C.maneLight, 1);
}

// ---------------------------------------------------------------- the serpent that is its tail, like the game's snake
const SNAKE_ROOT = [-37, -9];
// eight points it runs through, from the rump to its head: at rest it curves out behind and up, and looks forward
const SNAKE_REST = [SNAKE_ROOT, [-52, -7], [-63, -15], [-62, -29], [-55, -39], [-55, -50], [-47, -57], [-35, -56]];
const SNAKE_COIL = [SNAKE_ROOT, [-56, -7], [-70, -20], [-70, -38], [-60, -50], [-48, -47], [-46, -38], [-42, -35]];
const SNAKE_SLACK = [SNAKE_ROOT, [-50, 8], [-62, 20], [-56, 28], [-42, 28], [-28, 29], [-16, 30], [-4, 29]];

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
  const wide = (i) => 12.6 - 3.4 * (i / (n - 1));
  const [L, R] = edges(pts, wide);
  // its pale belly: one side low down, and by a twist the other side up by the head
  const twist = (i) => ease(clamp01((i / (n - 1) - 0.3) / 0.24));
  const under = pts.map((_, i) => [lerp(R[i][0], L[i][0], twist(i)), lerp(R[i][1], L[i][1], twist(i))]);
  const l = L.slice(from);
  const r = R.slice(from);
  const round = () => {
    g.moveTo(l[0][0], l[0][1]);
    through(g, l);
    through(g, [...r].reverse());
  };
  // little spines along the top of it
  for (let i = 3; i < n - 2; i += 3) {
    if (i < from) continue;
    const ox = pts[i][0] - under[i][0];
    const oy = pts[i][1] - under[i][1];
    const d = Math.hypot(ox, oy) || 1;
    const w = d * 0.9;
    const ax = pts[i + 1][0] - pts[i - 1][0];
    const ay = pts[i + 1][1] - pts[i - 1][1];
    const len = Math.hypot(ax, ay) || 1;
    poly(g, [[pts[i][0] + (ox / d) * w - (ax / len) * 2.6, pts[i][1] + (oy / d) * w - (ay / len) * 2.6], [pts[i][0] + (ox / d) * (w + 4.6) - (ax / len) * 3.6, pts[i][1] + (oy / d) * (w + 4.6) - (ay / len) * 3.6], [pts[i][0] + (ox / d) * w + (ax / len) * 2.6, pts[i][1] + (oy / d) * w + (ay / len) * 2.6]], C.snakeDark, 0.9);
  }
  shape(g, C.snake, 0, round);
  within(g, round, () => {
    // dark diamonds down its back, each with a yellow heart
    for (let i = 2; i < n - 2; i += 4) {
      if (i < from - 1) continue;
      const over = [pts[i][0] * 2 - under[i][0], pts[i][1] * 2 - under[i][1]];
      const cx = lerp(pts[i][0], over[0], 0.3);
      const cy = lerp(pts[i][1], over[1], 0.3);
      const ax = pts[i + 1][0] - pts[i - 1][0];
      const ay = pts[i + 1][1] - pts[i - 1][1];
      const d = Math.hypot(ax, ay) || 1;
      for (const [along, wide, colour] of [[5.2, 4.6, C.snakeDark], [2.2, 1.8, C.snakeMark]]) {
        poly(g, [[cx - (ax / d) * along, cy - (ay / d) * along], [cx - (ay / d) * wide, cy + (ax / d) * wide], [cx + (ax / d) * along, cy + (ay / d) * along], [cx + (ay / d) * wide, cy - (ax / d) * wide]], colour, 0);
      }
    }
    g.beginPath();
    let first = true;
    for (let i = Math.max(0, from - 1); i < n; i++) {
      const x = lerp(pts[i][0], under[i][0], 0.86);
      const y = lerp(pts[i][1], under[i][1], 0.86);
      if (first) g.moveTo(x, y);
      else g.lineTo(x, y);
      first = false;
    }
    ink(g, 4.6, C.snakeBelly);
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
  if (s.tongue > 0.05) {
    const far = 16 + s.tongue * 8;
    lines(g, 1.2, () => {
      g.moveTo(14, 2);
      g.lineTo(far, 2.8);
      g.lineTo(far + 3.6, 0.6);
      g.moveTo(far, 2.8);
      g.lineTo(far + 3.6, 5);
    }, '#d3303c');
  }
  const open = s.gape * 0.75;
  if (s.gape > 0.1) {
    shape(g, C.maw, 0.8, () => {
      g.moveTo(-1, 1.4);
      g.lineTo(17, 0.8);
      g.lineTo(15 * Math.cos(open), 1.6 + 15 * Math.sin(open));
    });
  }
  g.save();
  g.translate(0, 1.6);
  g.rotate(open);
  g.translate(0, -1.6);
  shape(g, C.snakeBelly, LW, () => {
    g.moveTo(-3, 1.6);
    g.lineTo(16, 1.8);
    g.quadraticCurveTo(13.4, 6, 7, 6);
    g.quadraticCurveTo(1, 6.4, -4, 3.4);
  });
  if (s.gape > 0.5) poly(g, [[11.4, 1.8], [12.8, -2], [14.2, 1.8]], C.tooth, 0.6);
  g.restore();
  // two little horns swept back over its eyes
  poly(g, [[2.4, -7], [-6.4, -12.6], [6.4, -8]], C.hornFar, 0.9);
  poly(g, [[5.6, -7.6], [-1, -14.4], [9.6, -7.4]], C.horn, 0.9);
  const skull = () => {
    g.moveTo(-5, -3.6);
    g.bezierCurveTo(-1, -9.4, 9, -8.8, 14, -5.4);
    g.quadraticCurveTo(19.6, -2.6, 18, 0.8);
    g.quadraticCurveTo(14, 2.8, 8, 2.2);
    g.lineTo(-4, 2.6);
  };
  shape(g, C.snake, 0, skull);
  within(g, skull, () => ell(g, 1, -9, 12, 4, C.snakeDark, 0, 0.1));
  g.beginPath();
  skull();
  ink(g);
  if (s.gape > 0.5) {
    for (const x of [11.4, 15]) poly(g, [[x - 1.3, 1.4], [x + 0.4, 6.6], [x + 1.3, 1.4]], C.tooth, 0.6);
  }
  lines(g, 0.9, () => {
    g.moveTo(17.8, 0.2);
    g.quadraticCurveTo(10, 1.4, 3, -0.2);
  });
  circ(g, 15.4, -3, 0.7, INK, 0);
  if (s.gape <= 0.1) poly(g, [[12, 1], [13.2, 4.4], [14.6, 0.9]], C.tooth, 0.6);
  beastEye(g, 6.8, -3.9, 3.5, o, '#ffd32e', 'up');
  brow(g, 2.8, -7.4, 11.2, -5.4, C.snakeDark, 1.4);
  g.restore();
}

// ---------------------------------------------------------------- the whole beast
// A pose. crouch: how low it is; lean: front down (+) or reared (-), about the hips; nod: the lion's head; roar: how
// wide its mouth; puff: its mane; tilt: the goat's head; bleat: the goat's mouth; reach / kick: front paws thrown
// forward and hind hooves back, as it leaps; ax, ay and bx, by: where its near and far forepaws are lifted to, clawing
const REST = { crouch: 0, lean: 0, nod: 0, roar: 0, puff: 0, tilt: 0, bleat: 0, reach: 0, kick: 0, ax: 0, ay: 0, bx: 0, by: 0 };
const PAWS = { farHind: [-16, 23.4], nearHind: [-29, 25], farFront: [35, 23.4], nearFront: [24, 25] };
const HIP = [-24, 2];

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
    let x = PAWS[name][0] + o.paws[name].x + (front ? P.reach * 20 : -P.kick * 18);
    let y = PAWS[name][1] + o.paws[name].y - (front ? P.reach * 11 : P.kick * 5);
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
  const tip = (lift, over) => Math.max(-0.9, Math.min(0.75, lift * 0.03 - over * 0.014));
  const pts = smoothThrough(o.snake.pts);
  const snakeEyes = { dead: o.dead, shut: o.shut };
  const tail = (from) => upper(() => {
    serpentBody(g, pts, from);
    serpentHead(g, pts, o.snake, snakeEyes);
  });

  hindleg(g, turned(-17, -3), foot('farHind'), P.kick * 0.5, true);
  const farLifted = P.by < -8;
  if (!farLifted) foreleg(g, turned(31, -5), foot('farFront'), -P.reach * 0.3, true);
  tail(0);
  upper(() => goat(g, { aim: o.aim + P.tilt, jaw: Math.max(P.bleat, o.heat), heat: o.heat, charge: o.charge, fury: o.fury, clock: o.clock, wave: Math.sin(o.clock * o.wind) * 1.2, shut: o.goatShut, ear: o.ear, dead: o.dead }));
  upper(() => torso(g));
  hindleg(g, turned(-27, -2), foot('nearHind'), P.kick * 0.5, false);
  const near = () => foreleg(g, turned(20, -4), foot('nearFront'), tip(P.ay, P.ax) - P.reach * 0.3, false);
  const raised = P.ay < -8;
  if (!raised) near();
  upper(() => {
    g.save();
    g.translate(HEAD[0] - 14, HEAD[1] + 4);
    g.rotate(P.nod);
    g.translate(14, -4);
    lionHead(g, { jaw: Math.max(0, P.roar), puff: P.puff, clock: o.clock, wind: o.wind, shut: o.shut, dead: o.dead });
    g.restore();
  });
  // paws clawing the air come over in front
  if (farLifted) foreleg(g, turned(33, -3), foot('farFront'), tip(P.by, P.bx), false);
  if (raised) near();
  // the serpent comes round over everything while it strikes
  if (o.snake.front) tail(Math.floor(pts.length * 0.5));
  g.restore();
}

const none = () => ({ x: 0, y: 0 });
const STAND = { farHind: none(), nearHind: none(), farFront: none(), nearFront: none() };

export function drawChimeraStill(g) {
  paint(g, REST, { paws: STAND, bob: 0, clock: 0, wind: 2, aim: GOAT_REST, heat: 0, charge: 0, fury: 0, shut: 0, goatShut: 0, ear: 0, angry: true, snake: { pts: SNAKE_REST, gape: 0, tongue: 0 } });
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
      if (m.t < first - 0.07) want = { ...want, lean: -0.13, crouch: 2, ax: 26, ay: -42, roar: 0.5, puff: 0.5, nod: -0.1 };
      else if (m.t < first + 0.09) want = { ...want, lean: 0.11, crouch: 3, ax: 32, ay: -7, bx: 18, by: -40, roar: 0.75, puff: 0.7, nod: 0.08 };
      else if (m.t < second - 0.07) want = { ...want, lean: -0.1, crouch: 2, bx: 22, by: -44, roar: 0.6, puff: 0.6 };
      else want = { ...want, lean: 0.12, crouch: 4, bx: 28, by: -6, roar: 0.8, puff: 0.8, nod: 0.08 };
      stiff = 900;
      damp = 46;
    } else if (m && m.kind === 'ram') {
      // head right down, horns first
      if (m.t < a.windup) want = { ...want, crouch: 5, lean: -0.08, tilt: 0.85, roar: 0.25, puff: 0.3 };
      else want = { ...want, crouch: 4, lean: 0.12, tilt: 1.15, roar: 0.4, puff: 0.5 };
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
  return { pts, gape, tongue: 0, front: b.t >= coil && b.t < a.time - 0.12 };
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
  const aim = dead ? 0.2 : (GOAT_REST + Math.sin(t * 0.9) * 0.1) * (1 - pose) + (u.aim || 0) * pose + (firing ? Math.sin(t * 31) * 0.03 : 0);
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
    aim: act ? GOAT_REST : aim,
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
  const cx = u.x + u.facing * 39;
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
  claws(world, cx + u.facing * 7, cy - 9, 0.95, 42, u.facing);
  claws(world, cx - u.facing * 5, cy - 5, -0.75, 33, u.facing, 0.09);
  if (world.sfx) world.sfx('slam', cx);
}

// the roar bursts out: everyone near is knocked back and left seeing stars
function bellow(world, u) {
  const a = u.def.roar;
  const mouth = { x: u.x + u.facing * 64 * K * u.def.scale, y: u.y + FEET + (-10 * K - FEET) * u.def.scale };
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
  const cx = u.x + u.facing * 34;
  claws(world, u.x + u.facing * 60, u.y - (i ? 5 : 9), i ? -0.8 : 0.95, i ? 37 : 33, u.facing);
  let struck = false;
  world.eachEnemyNear(u.side, cx, u.y, a.reach + 24, (o) => {
    if ((o.x - u.x) * u.facing < -8 || Math.hypot(o.x - cx, (o.y - u.y) * 1.3) > a.reach + o.def.radius || o.def.flying) return;
    struck = true;
    shove(o, u.facing, (o.y - u.y) / 40, a.knock * (i ? 1.4 : 0.7));
    world.hurt(o, a.damage * rand(0.9, 1.1), o.x, o.y, undefined, u);
  });
  world.hitProps(cx, u.y, a.reach * 0.6, a.damage);
  dust(world, u.x + u.facing * 46, u.y + FEET - 2, 6, 18);
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
      const go = Math.max(0, Math.min(a.max, dist) - 46);
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
