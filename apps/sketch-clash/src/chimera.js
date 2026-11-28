// The Chimera: what it looks like, how it moves, and the extras that go with its fire.
// A big lion with a goat's head rising out of its back and a snake for a tail. The goat's head is the one that breathes
// fire (the same fire as the dragon's, only bigger); the lion carries them about, and roars.
// Drawn in art units, facing +x, with the ground 25 below the origin.
import { TAU, K, FEET } from './config.js?v=265';
import { OUT } from './sprites.js?v=265';
import { blob, ribbon, stick, poly, circ, ell, vgrad } from './art_kit.js?v=265';
import { rigStep, applyBotBody } from './botrig.js?v=265';
import { scorch } from './zordfx.js?v=265';

const rand = (a, b) => a + Math.random() * (b - a);
const ease = (q) => q * q * (3 - 2 * q);

const C = {
  fur: '#e4a748', furDark: '#b9782c', furFar: '#9a6224', belly: '#f4d595', cream: '#f8e3b4', paw: '#d29438', pawFar: '#8a5620',
  mane: '#7c3f19', maneMid: '#a3591f', maneLite: '#c07428', claw: '#fbf5e6', nose: '#5a2a1e', mouth: '#7a2430', tongue: '#e8848c',
  goat: '#dcd6c8', goatDark: '#a89e8c', goatMuzzle: '#efeade', horn: '#7a6248', hornFar: '#58462f', ridge: '#4a3a28',
  snake: '#58a340', snakeDark: '#33682a', snakeBelly: '#e2d766',
};

// where the goat's head turns on its neck, and how far along from there its mouth is. (config.js puts the fire there)
export const GOAT = { x: 14, y: -35, mouth: 23 };

// ---------------------------------------------------------------- walking
// A paw on the ground is moved back exactly as far as the beast goes forward, so it stays where it was put
const STRIDE = 24;
const STANCE = 0.62;
export const stepLength = (u) => (STRIDE / STANCE) * K * u.def.scale;
export function pawAt(phase) {
  const p = phase - Math.floor(phase);
  if (p < STANCE) return { x: STRIDE / 2 - STRIDE * (p / STANCE), y: 0 };
  const q = (p - STANCE) / (1 - STANCE);
  return { x: -STRIDE / 2 + STRIDE * ease(q), y: -7.5 * Math.sin(q * Math.PI) };
}

// ---------------------------------------------------------------- drawing
function path(g, colour, wide, draw) {
  g.strokeStyle = colour;
  g.lineWidth = wide;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  draw();
  g.stroke();
}

function shape(g, fill, lw, draw) {
  g.beginPath();
  draw();
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  g.strokeStyle = OUT;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  g.stroke();
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

// a big soft paw with three claws
function paw(g, x, y, far) {
  ell(g, x + 1.4, y - 0.6, 7.6, 4.4, far ? C.pawFar : C.paw, 1.6);
  for (let i = 0; i < 3; i++) poly(g, [[x + 6 + i * 0.9, y - 2.6 + i * 1.9], [x + 10.4 + i * 0.4, y - 1 + i * 1.8], [x + 6.4 + i * 0.6, y - 0.8 + i * 1.8]], C.claw, 0.7);
  path(g, OUT, 0.8, () => {
    g.moveTo(x + 2.4, y + 0.8);
    g.quadraticCurveTo(x + 3.6, y + 2, x + 3.2, y + 3.4);
    g.moveTo(x + 5.6, y - 0.4);
    g.quadraticCurveTo(x + 6.8, y + 1, x + 6.4, y + 2.6);
  });
}

// a hind leg: a heavy thigh, bent back at the hock; a front leg: nearly straight and thick
function hindLeg(g, hip, foot, far) {
  const colour = far ? C.furFar : C.furDark;
  const knee = [hip[0] + 4 + (foot[0] - hip[0]) * 0.35, hip[1] + 10];
  const hock = [foot[0] - 5, foot[1] - 6];
  stick(g, [knee, hock, [foot[0] - 0.6, foot[1] - 2.5]], far ? 6.8 : 7.8, colour, 1.5);
  // the great round thigh, tipped toward the knee
  ell(g, hip[0] + 1.6, hip[1] + 3.4, far ? 8 : 9.6, far ? 10 : 12, far ? C.furFar : vgrad(g, hip[1] - 8, hip[1] + 15, C.fur, C.furDark), 1.7, -0.5 - (foot[0] - hip[0]) * 0.016);
  paw(g, foot[0], foot[1], far);
}

function frontLeg(g, top, foot, far) {
  const colour = far ? C.furFar : C.fur;
  const knee = [(top[0] + foot[0]) / 2 - 2.2, (top[1] + foot[1]) / 2];
  stick(g, [top, knee], far ? 10 : 11.6, colour, 1.5);
  stick(g, [knee, [foot[0], foot[1] - 3]], far ? 8.4 : 9.6, colour, 1.5);
  paw(g, foot[0], foot[1], far);
}

function body(g) {
  shape(g, vgrad(g, -13, 19, C.fur, C.furDark), 1.9, () => {
    g.moveTo(-34, 2);
    g.bezierCurveTo(-36, -9, -24, -15, -13, -10);
    g.bezierCurveTo(-5, -9, 5, -15, 16, -13);
    g.bezierCurveTo(29, -11, 31, 3, 25, 11);
    g.bezierCurveTo(19, 19, 4, 14, -7, 13.5);
    g.bezierCurveTo(-15, 14, -19, 18, -27, 15);
    g.bezierCurveTo(-33, 13, -33.6, 8, -34, 2);
  });
  shape(g, C.belly, 0, () => {
    g.moveTo(-14, 12);
    g.bezierCurveTo(-4, 8.6, 10, 9, 20, 11);
    g.bezierCurveTo(12, 15.6, -4, 13, -14, 12);
  });
  // the line of the haunch and the shoulder
  path(g, 'rgba(110, 66, 20, 0.65)', 1.3, () => {
    g.moveTo(8, -9);
    g.quadraticCurveTo(3, 0, 7, 8);
  });
}

// the snake that is its tail: up from the rump in a long S, its head looking out behind. sway: -1..1; coil: 0..1 drawn
// back to strike; gape: how wide its mouth is; tongue: how far out, 0..1
function snake(g, { sway, coil, gape, tongue, dead }) {
  const pts = [[-29, 3], [-41, 6], [-51, 1], [-53 + sway * 1.5, -10], [-46 + sway * 3, -19], [-48 + sway * 4 + coil * 6, -28], [-57 + sway * 4.5 + coil * 9, -31 - coil * 2]];
  // smoothed through more points, so it curves rather than bends at corners
  const fine = [];
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    for (let k = 0; k < 4; k++) {
      const t = k / 4;
      const at = (j) => 0.5 * (2 * p1[j] + (p2[j] - p0[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t * t + (3 * p1[j] - p0[j] - 3 * p2[j] + p3[j]) * t * t * t);
      fine.push([at(0), at(1)]);
    }
  }
  fine.push(pts[pts.length - 1]);
  ribbon(g, fine, 10.5, 5.6, C.snake, 1.8);
  path(g, C.snakeBelly, 1.8, () => fine.forEach(([x, y], i) => (i ? g.lineTo(x + 1.3, y + 1.3) : g.moveTo(x + 1.3, y + 1.3))));
  for (let i = 3; i < fine.length - 2; i += 3) {
    const [x, y] = fine[i];
    const a = Math.atan2(fine[i + 1][1] - fine[i - 1][1], fine[i + 1][0] - fine[i - 1][0]);
    g.save();
    g.translate(x, y);
    g.rotate(a);
    poly(g, [[-2.6, -1.2], [0, -3.8], [2.6, -1.2], [0, 0.4]], C.snakeDark, 0);
    g.restore();
  }
  // its head
  const [hx, hy] = fine[fine.length - 1];
  const [bx, by] = fine[fine.length - 4];
  g.save();
  g.translate(hx, hy);
  g.rotate(Math.atan2(hy - by, hx - bx));
  g.scale(1, -1); // (it faces backwards, and this keeps it the right way up)
  if (tongue > 0.05) {
    const far = 9 + tongue * 8;
    path(g, '#d4333f', 1.3, () => {
      g.moveTo(10, 1);
      g.lineTo(far, 1.6);
      g.lineTo(far + 3.4, -0.6);
      g.moveTo(far, 1.6);
      g.lineTo(far + 3.4, 3.8);
    });
  }
  if (gape > 0.1) {
    shape(g, C.mouth, 1.2, () => {
      g.moveTo(-1, 1);
      g.lineTo(12, 1.2);
      g.lineTo(9.6, 2 + gape * 8);
    });
  }
  // lower jaw
  g.save();
  g.rotate(gape * 0.55);
  blob(g, [[-2, 1.4], [6, 1.8], [11.4, 2.4], [8, 4.6], [0, 4.6]], C.snakeBelly, 1.4);
  g.restore();
  blob(g, [[-4, -2.6], [2, -5.8], [9, -4.2], [13.4, -0.6], [11, 2], [2, 2.2], [-4, 1.6]], C.snake, 1.7);
  if (gape > 0.3) for (const x of [7.6, 10.4]) poly(g, [[x - 1, 1.6], [x, 5.4], [x + 1, 1.6]], C.claw, 0.6);
  if (dead) {
    path(g, OUT, 1.1, () => {
      g.moveTo(3.6, -4);
      g.lineTo(7, -1);
      g.moveTo(7, -4);
      g.lineTo(3.6, -1);
    });
  } else {
    ell(g, 5.4, -2.4, 2.3, 2.1, '#f5df3a', 0.9);
    ell(g, 5.8, -2.4, 0.6, 1.8, '#141414', 0);
  }
  circ(g, 11, -1.8, 0.6, C.snakeDark, 0);
  g.restore();
}

// one curved, ridged goat horn sweeping up and back
function horn(g, root, mid, tip, wide, colour) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const at = (j) => (1 - t) * (1 - t) * root[j] + 2 * (1 - t) * t * mid[j] + t * t * tip[j];
    pts.push([at(0), at(1)]);
  }
  ribbon(g, pts, wide, 1.2, colour, 1.5);
  path(g, C.ridge, 0.9, () => {
    for (let i = 2; i < 9; i += 2) {
      const [x, y] = pts[i];
      const a = Math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0]) + Math.PI / 2;
      const r = (wide / 2) * (1 - i / 11);
      g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
      g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
  });
}

// the goat's head, turned about where it joins the neck. aim: radians (+ down); jaw: 0..1; heat: 0..1 how fiercely the
// fire is going in it
function goat(g, o) {
  // the neck, growing up out of its back
  const lean = o.aim * 3;
  stick(g, [[1, -7], [4 - lean * 0.4, -21], [GOAT.x - 3, GOAT.y + 3 + lean * 0.3]], 12.5, C.goat, 1.6);
  path(g, C.goatDark, 3, () => {
    g.moveTo(-2, -9);
    g.quadraticCurveTo(0, -23, 8, -33);
  });
  // tufts of the lion's fur where it comes through
  for (const [x, y, a] of [[-6, -9, -0.5], [-1, -11, -0.1], [5, -11.5, 0.2], [10, -10.5, 0.55]]) {
    g.save();
    g.translate(x, y);
    g.rotate(a);
    poly(g, [[-3.4, 2.4], [0, -4.6], [3.4, 2.4]], C.maneLite, 1.1);
    g.restore();
  }
  g.save();
  g.translate(GOAT.x, GOAT.y);
  g.rotate(o.aim);
  if (o.heat > 0.02) glow(g, GOAT.mouth, 2, 15 + 8 * o.heat, '255, 150, 40', 0.6 * o.heat);
  // the far ear and horn
  blob(g, [[-1, -3], [-8, -4], [-14, -9], [-9, -10], [-3, -7]], C.goatDark, 1.3);
  horn(g, [3, -7], [-2, -25], [-19, -16], 6.4, C.hornFar);
  // lower jaw, with the glow of the fire in its mouth
  g.save();
  g.translate(6, 3.5);
  g.rotate(o.jaw * 0.6);
  if (o.jaw > 0.15) {
    shape(g, o.heat > 0.2 ? '#ffb63a' : C.mouth, 0, () => {
      g.moveTo(0, -1);
      g.lineTo(15, -1);
      g.lineTo(10, -4);
      g.lineTo(2, -3);
    });
  }
  blob(g, [[-2, -1], [7, 0], [15, -0.4], [14, 3], [6, 4.4], [-2, 3]], C.goatDark, 1.5);
  // the goat's wispy beard
  shape(g, C.goatMuzzle, 1.2, () => {
    g.moveTo(2, 3);
    g.quadraticCurveTo(10, 4, 11.6, 3);
    g.quadraticCurveTo(10, 9, 11, 15);
    g.quadraticCurveTo(7.4, 11, 6.4, 13);
    g.quadraticCurveTo(5.6, 9, 2.4, 11);
    g.quadraticCurveTo(3.4, 7, 2, 3);
  });
  g.restore();
  blob(g, [[-7, -5], [0, -9.6], [9, -7.4], [18, -3.6], [23.4, -0.6], [22.4, 3.4], [15, 4.4], [6, 4.4], [-1, 7], [-7, 3]], vgrad(g, -10, 7, C.goat, C.goatDark), 1.8);
  ell(g, 19, 0.6, 4.6, 3.6, C.goatMuzzle, 0);
  ell(g, 21, -0.8, 1, 1.4, C.ridge, 0, 0.4);
  path(g, OUT, 1, () => {
    g.moveTo(23, 2);
    g.quadraticCurveTo(17, 4.2, 11, 3.6);
  });
  // eye, with a goat's flat pupil
  if (o.dead) {
    path(g, OUT, 1.3, () => {
      g.moveTo(3, -5);
      g.lineTo(8, -0.6);
      g.moveTo(8, -5);
      g.lineTo(3, -0.6);
    });
  } else if (o.shut > 0.6) {
    path(g, OUT, 1.4, () => g.arc(5.4, -4, 2.8, 0.3, Math.PI - 0.3));
  } else {
    if (o.heat > 0.2) glow(g, 5.4, -2.8, 7, '255, 140, 30', 0.75 * o.heat);
    ell(g, 5.4, -2.8, 3.5, 3.3 * (1 - o.shut), o.heat > 0.3 ? '#ffd23c' : '#f2c43c', 1.2);
    ell(g, 6.1, -2.8, 2.1, 0.9 * (1 - o.shut), '#17120c', 0);
    circ(g, 4.2, -4, 0.8, '#ffffff', 0);
  }
  if (o.angry) {
    path(g, OUT, 1.8, () => {
      g.moveTo(0.6, -8);
      g.lineTo(10, -5.2);
    });
  }
  // the near ear, flicking, and horn
  g.save();
  g.translate(-3, -2);
  g.rotate(o.ear);
  blob(g, [[0, -2], [-7, -1], [-14, 4.5], [-7, 4], [0, 2.4]], C.goat, 1.5);
  blob(g, [[-2, -0.4], [-7, 0.6], [-11, 3.2], [-6, 2.4]], '#e9b3ac', 0);
  g.restore();
  horn(g, [-1, -7.5], [-9, -26], [-24, -12], 7.4, C.horn);
  if (o.heat > 0.3) {
    glow(g, -24, -12, 6, '255, 170, 50', 0.7 * o.heat);
    glow(g, -19, -16, 5, '255, 170, 50', 0.55 * o.heat);
  }
  g.restore();
}

// a ring of pointed locks, for the mane. `puff` swells it
function locks(g, cx, cy, r, n, turn, fill, lw) {
  shape(g, fill, lw, () => {
    for (let i = 0; i < n; i++) {
      const a = turn + (i / n) * TAU;
      const b = turn + ((i + 1) / n) * TAU;
      const m = (a + b) / 2;
      if (!i) g.moveTo(cx + Math.cos(a) * r * 0.84, cy + Math.sin(a) * r * 0.84);
      // each lock sweeps out to a point, leaning back
      g.quadraticCurveTo(cx + Math.cos(a + 0.05) * r * 1.12, cy + Math.sin(a + 0.05) * r * 1.12, cx + Math.cos(m + 0.2) * r * 1.2, cy + Math.sin(m + 0.2) * r * 1.2);
      g.quadraticCurveTo(cx + Math.cos(b - 0.1) * r * 0.96, cy + Math.sin(b - 0.1) * r * 0.96, cx + Math.cos(b) * r * 0.84, cy + Math.sin(b) * r * 0.84);
    }
  });
}

// the lion's head in its great mane. jaw: 0..1; puff: the mane standing out; angry, happy, shut, dead
function lion(g, o) {
  const p = 1 + o.puff * 0.13;
  locks(g, 22, 0, 20.5 * p, 14, 0.1 + o.wave * 0.05, C.mane, 1.8);
  locks(g, 24, 0.4, 16 * p, 12, 0.35 - o.wave * 0.07, C.maneMid, 1.2);
  // ears
  for (const [x, y, r] of [[20.5, -15, 5], [37.5, -13.5, 5.2]]) {
    circ(g, x, y, r, C.fur, 1.6);
    circ(g, x + 0.4, y + 0.6, r * 0.52, '#d98a76', 0);
  }
  // lower jaw, dropped when it roars
  if (o.jaw > 0.08) {
    shape(g, C.mouth, 1.6, () => {
      g.moveTo(32, 7);
      g.quadraticCurveTo(40, 10, 48, 6.6);
      g.quadraticCurveTo(48, 10 + o.jaw * 13, 40, 11 + o.jaw * 14);
      g.quadraticCurveTo(31.6, 10 + o.jaw * 12, 32, 7);
    });
    ell(g, 40, 9 + o.jaw * 10.4, 4.8, 2.4 + o.jaw * 1.2, C.tongue, 0);
    for (const x of [36, 43.6]) poly(g, [[x - 1.5, 10 + o.jaw * 13.4], [x, 7.4 + o.jaw * 9.6], [x + 1.5, 10 + o.jaw * 13.4]], C.claw, 0.7);
  }
  ell(g, 33, 0, 13, 12.4, vgrad(g, -12, 12, '#efb857', C.fur), 1.8);
  // muzzle
  ell(g, 38.4, 5.2, 6.4, 5, C.cream, 1.2);
  ell(g, 45.6, 4.8, 5.4, 4.6, C.cream, 1.2);
  if (o.jaw > 0.12) for (const x of [37, 45.4]) poly(g, [[x - 1.6, 8.4], [x, 13.4], [x + 1.6, 8.4]], C.claw, 0.8);
  shape(g, C.nose, 1, () => {
    g.moveTo(40.4, -0.4);
    g.quadraticCurveTo(45, -2.4, 49.4, -0.6);
    g.quadraticCurveTo(47.4, 2.8, 45, 3.2);
    g.quadraticCurveTo(42.2, 2.6, 40.4, -0.4);
  });
  path(g, OUT, 1, () => {
    g.moveTo(45, 3.2);
    g.lineTo(44, 6.4);
    g.moveTo(37, 8.4);
    g.quadraticCurveTo(41, 10, 44, 6.4);
    g.quadraticCurveTo(46.4, 9.4, 49, 7.6);
  });
  for (const [x, y] of [[36, 4], [38.4, 6.2], [47.6, 5.4], [35.4, 6.8]]) circ(g, x, y, 0.55, C.furDark, 0);
  path(g, 'rgba(90, 56, 26, 0.7)', 0.7, () => {
    g.moveTo(36, 5.4);
    g.quadraticCurveTo(30, 4.4, 25.4, 6.4);
    g.moveTo(36.4, 7);
    g.quadraticCurveTo(31, 8, 27.6, 10.6);
  });
  // eyes
  for (const [x, y, r] of [[33, -4.4, 3.4], [43, -5, 2.9]]) {
    if (o.dead) {
      path(g, OUT, 1.2, () => {
        g.moveTo(x - 2, y - 2);
        g.lineTo(x + 2, y + 2);
        g.moveTo(x + 2, y - 2);
        g.lineTo(x - 2, y + 2);
      });
    } else if (o.happy || o.shut > 0.6) {
      path(g, OUT, 1.4, () => {
        if (o.happy) g.arc(x, y + 1, r * 0.8, Math.PI * 1.12, Math.PI * 1.88);
        else g.arc(x, y - 1.2, r * 0.8, 0.3, Math.PI - 0.3);
      });
    } else {
      ell(g, x, y, r, r * (1 - o.shut), '#ffffff', 1.1);
      ell(g, x + 0.7, y + 0.2, r * 0.64, r * 0.68 * (1 - o.shut), '#d98a14', 0);
      ell(g, x + 0.9, y + 0.2, r * 0.32, r * 0.4 * (1 - o.shut), '#17120c', 0);
      circ(g, x - 0.2, y - 1, 0.75, '#ffffff', 0);
    }
  }
  path(g, '#6a3414', 2.2, () => {
    const dip = o.angry ? 2.2 : 0;
    g.moveTo(28.6, -9.4 + dip * 0.2);
    g.quadraticCurveTo(33, -10.4 + dip * 0.7, 36.8, -8.4 + dip);
    g.moveTo(40, -8.8 + dip);
    g.quadraticCurveTo(43, -10.2 + dip * 0.5, 46.4, -9.2);
  });
}

// ---------------------------------------------------------------- the whole beast
const REST = { crouch: 0, lean: 0, nod: 0, roar: 0.02, puff: 0, tilt: 0, bleat: 0, coil: 0, gape: 0 };
const PAWS = { farHind: [-17, 23.6], nearHind: [-24, 24.6], farFront: [22, 23.6], nearFront: [15, 24.8] };
const HIP = [-22, 5];

// P: a pose. o: { paws, bob, sway, wave, aim, heat, shut, goatShut, ear, happy, angry, dead, tongue }
function paint(g, P, o) {
  g.save();
  g.scale(K, K);
  const down = o.bob + P.crouch;
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
  const foot = (name) => [PAWS[name][0] + o.paws[name].x, PAWS[name][1] + o.paws[name].y];
  hindLeg(g, turned(-18, 3), foot('farHind'), true);
  frontLeg(g, turned(18, 3), foot('farFront'), true);
  upper(() => snake(g, { sway: o.sway, coil: P.coil, gape: P.gape, tongue: o.tongue, dead: o.dead }));
  upper(() => body(g));
  hindLeg(g, turned(-24, 3), foot('nearHind'), false);
  upper(() => goat(g, { aim: o.aim + P.tilt, jaw: Math.max(P.bleat, o.heat), heat: o.heat, shut: o.goatShut, ear: o.ear, angry: o.angry, dead: o.dead }));
  frontLeg(g, turned(13, 4), foot('nearFront'), false);
  upper(() => {
    g.save();
    g.translate(18, 2);
    g.rotate(P.nod);
    g.translate(-18, -2);
    lion(g, { jaw: Math.max(0, P.roar), puff: P.puff, wave: o.wave, shut: o.shut, happy: o.happy, angry: o.angry, dead: o.dead });
    g.restore();
  });
  g.restore();
}

const none = () => ({ x: 0, y: 0 });

export function drawChimeraStill(g) {
  paint(g, REST, { paws: { farHind: none(), nearHind: none(), farFront: none(), nearFront: none() }, bob: 0, sway: 0, wave: 0, aim: -0.05, heat: 0, shut: 0, goatShut: 0, ear: 0, tongue: 0.5 });
}

function posed(u, R, dead, windup, t) {
  let want = { ...REST };
  if (!dead) {
    if (u.firing) {
      // braced and snarling while the goat pours it out
      want = { ...want, crouch: 3.2, lean: 0.05, roar: 0.3 + Math.sin(t * 19) * 0.06, puff: 0.55 + Math.sin(t * 23) * 0.2, nod: 0.07, coil: 0.35, gape: 0.5 };
    } else if (windup > 0) {
      // the goat rears its head back to fill its lungs
      want = { ...want, tilt: -0.5 * windup, lean: -0.06 * windup, crouch: 1.5 * windup, bleat: 0.2 * windup, puff: 0.35 * windup };
    } else if (R.happy) {
      want = { ...want, nod: -0.24, roar: 0.8, puff: 0.8, bleat: 0.7, tilt: -0.3, gape: 0.8 };
    } else if (R.fidget === 'roar') {
      const swell = Math.sin(R.q * Math.PI) ** 0.6;
      want = { ...want, nod: -0.3 * swell, roar: swell, puff: swell, lean: -0.07 * swell };
    } else if (R.fidget === 'hiss') {
      const swell = Math.sin(R.q * Math.PI);
      want = { ...want, coil: swell, gape: swell * 0.95 };
    } else if (R.fidget === 'bleat') {
      const swell = Math.sin(R.q * Math.PI);
      want = { ...want, bleat: swell * (0.5 + 0.5 * Math.abs(Math.sin(t * 17))), tilt: -0.35 * swell };
    } else if (R.fidget === 'look') want = { ...want, nod: Math.sin(R.q * TAU) * 0.16, tilt: -Math.sin(R.q * TAU) * 0.24 };
  }
  if (dead) return { ...REST, roar: 0.5, bleat: 0.6, nod: 0.12, tilt: 0.3, gape: 0.6 };
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
      p.v += ((want[k] - p.x) * 240 - p.v * 22) * h;
      p.x += p.v * h;
    }
    out[k] = p.x;
  }
  return out;
}

// `overlay(ctx, u, rx, ry, cx, cy)` paints burning / frozen / poisoned tints
export function drawChimera(ctx, dpr, sprites, u, overlay) {
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const firing = !dead && !!u.firing;
  // nearly ready to breathe again, with someone in reach
  const near = !dead && !firing && u.target && !u.target.dead && Math.hypot(u.target.x - u.x, u.target.y - u.y) <= d.range * 1.05;
  const windup = near && u.burstT > 0 && u.burstT < 0.45 ? 1 - u.burstT / 0.45 : 0;
  // (the rig is told it is standing, so its own two-footed stride never gets going: the four paws are worked out below)
  const R = rigStep(u, {
    age, dead, moving: false, bang: 0, kick: 0.3, calm: !u.target && !u.moving, busy: firing || windup > 0,
    fidgets: ['look', 'roar', 'roar', 'hiss', 'hiss', 'bleat'],
  });
  const P = posed(u, R, dead, windup, t);
  const k = dead ? 0 : u.walkK || 0;
  const walk = dead ? 0 : u.walk || 0;
  const wx = u.walkX === undefined ? 1 : Math.max(0.65, Math.abs(u.walkX));
  const tall = (u.walkY || 0) * 0.3;
  const step = (late) => {
    const f = pawAt(walk + late);
    return { x: f.x * wx * k, y: (f.y + f.x * tall) * k };
  };
  const paws = { nearHind: step(0), farFront: step(0.05), farHind: step(0.5), nearFront: step(0.55) };

  const wobble = u.hit > 0.14 ? (Math.random() - 0.5) * 1.4 : 0;
  ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  if (u.tilt) {
    ctx.translate(0, FEET);
    ctx.rotate(u.tilt);
    ctx.translate(0, -FEET);
  }
  if (!dead) {
    ctx.save();
    ctx.translate(-1, FEET + 0.8);
    ctx.scale(1, 0.24);
    glow(ctx, 0, 0, 58 * K * d.scale, '0, 0, 0', 0.46);
    ctx.restore();
    // the ground in front lights up orange as the fire goes
    if (firing) {
      ctx.save();
      ctx.translate(34, FEET);
      ctx.scale(1, 0.32);
      glow(ctx, 0, 0, 40, '255, 140, 30', 0.26 + 0.06 * Math.sin(t * 27));
      ctx.restore();
    }
  }
  const fall = age < 0.28 ? age / 0.28 : 0;
  if (age < 0.28) ctx.translate(0, -46 * (1 - fall ** 2));
  ctx.translate(0, FEET);
  ctx.scale(d.scale * (1 - 0.08 * fall), d.scale * (1 + 0.14 * fall));
  ctx.translate(0, -FEET);
  applyBotBody(ctx, { ...R, roll: 0, lean: R.lean * 0.35 });

  const blink = t % 3.7;
  const shut = !firing && blink < 0.15 ? Math.sin((blink / 0.15) * Math.PI) : 0;
  const goatBlink = (t + 1.6) % 4.4;
  const goatShut = !firing && goatBlink < 0.16 ? Math.sin((goatBlink / 0.16) * Math.PI) : 0;
  const flick = (t + 0.4) % 1.9;
  // the goat looks where the fire is going; with nobody about it gazes round
  const pose = dead ? 0 : u.pose || 0;
  const aim = dead ? 0.2 : (-0.1 + Math.sin(t * 0.9) * 0.14) * (1 - pose) + (u.aim || 0) * pose + (firing ? Math.sin(t * 31) * 0.03 : 0);
  paint(ctx, P, {
    paws,
    // it rises and falls with each pair of paws, and breathes
    bob: -Math.abs(Math.sin(walk * TAU)) * 2.2 * k + Math.sin(t * 2.2) * 0.5 * (1 - k),
    sway: dead ? 0 : Math.sin(walk * TAU) * k + Math.sin(t * 1.9) * (1 - k * 0.5),
    wave: dead ? 0 : Math.sin(t * (k > 0.3 || firing ? 9 : 2.2)),
    aim,
    heat: firing ? 1 : windup * 0.7,
    shut, goatShut, ear: dead ? 0 : (t % 5.2 < 0.3 ? Math.sin((t % 5.2) / 0.3 * Math.PI * 2) * 0.45 : Math.sin(t * 1.3) * 0.06),
    happy: R.happy, angry: (firing || windup > 0 || !!u.target) && !R.happy, dead,
    tongue: dead ? 0.7 : flick < 0.34 ? Math.abs(Math.sin((flick / 0.34) * Math.PI * 3)) : 0,
  });
  if (overlay) overlay(ctx, u, d.body[0] * K, d.body[1] * K, 0, d.body[2] * K);
  // it takes a lot of knocks, so a soft flash rather than turning solid white
  if (!dead && u.hit > 0) glow(ctx, 0, -2 * K, 42 * K, '240, 246, 255', Math.min(0.3, u.hit * 1.6));
}

// ---------------------------------------------------------------- in the world
// It fights as the dragon does (keeping its distance and breathing), on foot; this also counts its paces
export function stepChimera(world, u, dt) {
  const wasX = u.x;
  const wasY = u.y;
  world.stepFlame(u, dt);
  if (u.moving) {
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

function sparks(world, x, y, n, ang, spread, speed) {
  for (let i = 0; i < n; i++) {
    const a = ang + (Math.random() - 0.5) * spread;
    const sp = speed * rand(0.45, 1.2);
    world.embers.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, age: 0, life: rand(0.3, 0.75), teal: false, green: false });
  }
}

// the moment the fire bursts out of the goat's mouth
export function chimeraIgnite(world, u, m, ang) {
  sparks(world, m.x, m.y, 18, ang, 1.3, 220);
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
