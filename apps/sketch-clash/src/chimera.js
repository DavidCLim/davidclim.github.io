// The Chimera: what it looks like, how it moves and how it fights.
// A huge lion with a goat's head rising out of its back and a snake for a tail, drawn as simply as the rest of the cast:
// round shapes, a dark line round each, and the same big plain eyes everyone has.
// Each head has its own tricks. The goat breathes fire and charges horns first; the lion pounces and roars (leaving
// those near it seeing stars); and the snake, all the while, lashes out and poisons whoever it can reach.
// Drawn in art units, facing +x, with the ground 25 below the origin.
import { TAU, K, FEET } from './config.js?v=266';
import { OUT } from './sprites.js?v=266';
import { ribbon, stick, poly, circ, ell, vgrad } from './art_kit.js?v=266';
import { rigStep, applyBotBody } from './botrig.js?v=266';
import { scorch } from './zordfx.js?v=266';

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (q) => q * q * (3 - 2 * q);
const clamp01 = (q) => Math.max(0, Math.min(1, q));

const C = {
  fur: '#efb24a', furDark: '#cc8830', furFar: '#a96f27', paw: '#d9973a', pawFar: '#94601f', belly: '#f8dd9a',
  mane: '#a2561f', maneDark: '#7c3d14', muzzle: '#fbeac2', nose: '#6a2f1e', mouth: '#7c2632', tongue: '#ec8d96', tooth: '#fdfaf0',
  goat: '#ece6d8', goatDark: '#c4baa6', goatMuzzle: '#f8f4ea', horn: '#98764e', hornFar: '#6f5436', ear: '#eab6ac',
  snake: '#64b546', snakeDark: '#3f8330', snakeBelly: '#ecdf6c',
};

// where the goat's head turns on its neck, and how far along from there its mouth is. (config.js puts the fire there)
export const GOAT = { x: 15, y: -37, mouth: 19 };

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

// the cast's eye: a white disc in a dark ring with a big plain pupil sitting low and to the front
function bigEye(g, x, y, rx, o, pupil = '#0d0b10', white = '#fdfdf8') {
  const ry = rx * 1.06;
  if (o.dead) {
    path(g, OUT, 1.6, () => {
      g.moveTo(x - rx * 0.7, y - rx * 0.7);
      g.lineTo(x + rx * 0.7, y + rx * 0.7);
      g.moveTo(x + rx * 0.7, y - rx * 0.7);
      g.lineTo(x - rx * 0.7, y + rx * 0.7);
    });
    return;
  }
  if (o.shut > 0.6) {
    path(g, OUT, 1.7, () => g.arc(x, y - rx * 0.4, rx * 0.8, 0.3, Math.PI - 0.3));
    return;
  }
  ell(g, x, y, rx, ry * (1 - o.shut), white, 1.7);
  ell(g, x + rx * 0.3, y + ry * 0.16, rx * 0.6, rx * 0.62 * (1 - o.shut), pupil, 0);
  circ(g, x + rx * 0.14, y - ry * 0.12, rx * 0.17, '#ffffff', 0);
}

// a short, fat leg ending in a round paw
function leg(g, top, foot, far) {
  stick(g, [top, [(top[0] + foot[0]) / 2 + (top[0] < 0 ? -2 : 1.4), (top[1] + foot[1]) / 2], [foot[0], foot[1] - 2.6]], far ? 10.4 : 11.6, far ? C.furFar : C.furDark, 1.7);
  ell(g, foot[0] + 2, foot[1] - 0.6, 8, 4.6, far ? C.pawFar : C.paw, 1.8);
  path(g, OUT, 1.1, () => {
    for (const dx of [4.6, 7.6]) {
      g.moveTo(foot[0] + dx, foot[1] - 0.4);
      g.lineTo(foot[0] + dx + 0.5, foot[1] + 3);
    }
  });
}

function body(g) {
  const round = () => {
    g.moveTo(-35, 2);
    g.bezierCurveTo(-36, -11, -22, -15, -8, -14);
    g.bezierCurveTo(8, -15, 24, -10, 24, 3);
    g.bezierCurveTo(24, 15, 10, 19, -7, 19);
    g.bezierCurveTo(-24, 19, -35, 14, -35, 2);
  };
  shape(g, vgrad(g, -14, 19, C.fur, C.furDark), 0, round);
  g.save();
  g.beginPath();
  round();
  g.clip();
  ell(g, -4, 19.5, 25, 8, C.belly, 0);
  g.restore();
  path(g, OUT, 2.1, () => {
    round();
    g.closePath();
  });
}

// where the snake's head rests, looking out behind
const SNAKE_ROOT = [-32, 3];
const SNAKE_REST = { head: [-56, -30], c1: [-66, 9], c2: [-35, -21] };

// the snake that is its tail. `head`, `c1`, `c2` shape it (it is one smooth curve from the rump); gape: mouth; tongue 0..1
function snake(g, { head, c1, c2, gape, tongue, o }) {
  const pts = [];
  for (let i = 0; i <= 22; i++) {
    const t = i / 22;
    const at = (j) => (1 - t) ** 3 * SNAKE_ROOT[j] + 3 * (1 - t) ** 2 * t * c1[j] + 3 * (1 - t) * t * t * c2[j] + t ** 3 * head[j];
    pts.push([at(0), at(1)]);
  }
  ribbon(g, pts, 11.5, 7, C.snake, 1.9);
  path(g, C.snakeBelly, 2.4, () => pts.forEach(([x, y], i) => (i > 1 ? g.lineTo(x + 0.8, y + 1.6) : g.moveTo(x + 0.8, y + 1.6))));
  const [bx, by] = pts[pts.length - 3];
  const angle = Math.atan2(head[1] - by, head[0] - bx);
  g.save();
  g.translate(head[0], head[1]);
  g.rotate(angle);
  if (Math.cos(angle) < 0) g.scale(1, -1); // (kept the right way up when it faces back)
  if (tongue > 0.05) {
    const far = 13 + tongue * 8;
    path(g, '#dc3a46', 1.5, () => {
      g.moveTo(13, 2);
      g.lineTo(far, 2.4);
      g.lineTo(far + 3.6, 0);
      g.moveTo(far, 2.4);
      g.lineTo(far + 3.6, 4.8);
    });
  }
  if (gape > 0.1) {
    shape(g, C.mouth, 1.4, () => {
      g.moveTo(-2, 1.6);
      g.lineTo(15, 1.6);
      g.lineTo(12, 2 + gape * 11);
    });
  }
  g.save();
  g.rotate(gape * 0.6);
  ell(g, 5, 3.4, 9, 3.4, C.snakeBelly, 1.7);
  g.restore();
  ell(g, 5, -1.2, 11, 7.4, vgrad(g, -8, 6, C.snake, C.snakeDark), 1.9);
  if (gape > 0.25) for (const x of [9, 13]) poly(g, [[x - 1.5, 3], [x, 9], [x + 1.5, 3]], C.tooth, 0.8);
  bigEye(g, 5.6, -4, 3.9, o);
  if (o.angry) {
    path(g, OUT, 1.9, () => {
      g.moveTo(1, -9.6);
      g.lineTo(10.4, -7.4);
    });
  }
  g.restore();
}

// one thick curved horn
function horn(g, root, mid, tip, wide, colour) {
  const pts = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const at = (j) => (1 - t) * (1 - t) * root[j] + 2 * (1 - t) * t * mid[j] + t * t * tip[j];
    pts.push([at(0), at(1)]);
  }
  ribbon(g, pts, wide, 2, colour, 1.8);
  path(g, 'rgba(40, 26, 14, 0.55)', 1, () => {
    for (const i of [3, 5, 7]) {
      const [x, y] = pts[i];
      const a = Math.atan2(pts[i + 1][1] - pts[i - 1][1], pts[i + 1][0] - pts[i - 1][0]) + Math.PI / 2;
      const r = (wide / 2) * (1 - i / 13);
      g.moveTo(x - Math.cos(a) * r, y - Math.sin(a) * r);
      g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
  });
}

// the goat's neck and head. aim: radians (+ down); jaw 0..1; heat 0..1, how fiercely the fire is going in it
function goat(g, o) {
  const lean = o.aim * 4;
  stick(g, [[-6, -8], [-1 - lean * 0.4, -25], [GOAT.x - 4, GOAT.y + 3 + lean * 0.35]], 13, C.goat, 1.9);
  g.save();
  g.translate(GOAT.x, GOAT.y);
  g.rotate(o.aim);
  if (o.heat > 0.02) glow(g, GOAT.mouth, 3, 15 + 9 * o.heat, '255, 150, 40', 0.65 * o.heat);
  horn(g, [3, -8], [-4, -26], [-20, -15], 7, C.hornFar);
  // lower jaw, with the fire glowing in its mouth, and the little beard
  g.save();
  g.translate(5, 5);
  g.rotate(o.jaw * 0.6);
  if (o.jaw > 0.15) {
    shape(g, o.heat > 0.2 ? '#ffb63a' : C.mouth, 0, () => {
      g.moveTo(-1, -1);
      g.lineTo(13, -1);
      g.lineTo(8, -5);
      g.lineTo(2, -4);
    });
  }
  shape(g, C.goatDark, 1.8, () => {
    g.moveTo(1, 2.6);
    g.quadraticCurveTo(6, 9, 3.4, 14);
    g.quadraticCurveTo(11, 10, 10.4, 2.6);
  });
  ell(g, 6, 1, 9, 3.6, C.goat, 1.8);
  g.restore();
  // a round head with a short soft muzzle
  ell(g, 0, -0.5, 11.5, 10.5, vgrad(g, -11, 10, C.goat, C.goatDark), 2);
  ell(g, 10.6, 2.4, 8.4, 6.4, C.goatMuzzle, 1.8);
  ell(g, 15.6, 0.4, 1.2, 1.7, C.nose, 0, 0.35);
  path(g, OUT, 1.3, () => {
    g.moveTo(17.6, 4.6);
    g.quadraticCurveTo(13, 7, 8, 5.6);
  });
  bigEye(g, 3.2, -4, 4.7, { ...o, shut: o.goatShut }, o.heat > 0.3 ? '#e8590c' : '#0d0b10', o.heat > 0.3 ? '#ffe58a' : '#fdfdf8');
  if (o.angry) {
    path(g, OUT, 2.2, () => {
      g.moveTo(-2.6, -10.6);
      g.lineTo(8.6, -8.2);
    });
  }
  // a floppy ear and the near horn
  g.save();
  g.translate(-5, -1);
  g.rotate(o.ear);
  shape(g, C.goat, 1.8, () => {
    g.moveTo(0, -3);
    g.bezierCurveTo(-9, -4, -16, 3, -14, 6.4);
    g.bezierCurveTo(-9, 8, -2, 4, 0, 2);
  });
  shape(g, C.ear, 0, () => {
    g.moveTo(-2, -0.6);
    g.bezierCurveTo(-7, -0.8, -12, 3.4, -11.6, 4.8);
    g.bezierCurveTo(-8, 5.4, -4, 2.8, -2, 1.2);
  });
  g.restore();
  horn(g, [-1.6, -8.6], [-13, -27], [-26, -10], 8, C.horn);
  if (o.heat > 0.3) glow(g, -22, -14, 7, '255, 170, 50', 0.7 * o.heat);
  g.restore();
}

// a mane like a soft cloud: a ring of round tufts about a disc
function mane(g, cx, cy, ring, tuft, n, turn, colour) {
  const bumps = [];
  for (let i = 0; i < n; i++) {
    const a = turn + (i / n) * TAU;
    bumps.push([cx + Math.cos(a) * ring, cy + Math.sin(a) * ring]);
  }
  g.fillStyle = OUT;
  for (const [x, y] of bumps) {
    g.beginPath();
    g.arc(x, y, tuft + 1.9, 0, TAU);
    g.fill();
  }
  g.fillStyle = colour;
  g.beginPath();
  g.arc(cx, cy, ring, 0, TAU);
  g.fill();
  for (const [x, y] of bumps) {
    g.beginPath();
    g.arc(x, y, tuft, 0, TAU);
    g.fill();
  }
}

// the lion's head. jaw: 0..1; puff: the mane standing out
function lion(g, o) {
  const p = 1 + o.puff * 0.15;
  mane(g, 22, 0, 17.5 * p, 7.4 * p, 11, 0.2 + o.wave * 0.04, C.mane);
  g.fillStyle = C.maneDark;
  g.beginPath();
  g.arc(24, 1, 18, 0, TAU);
  g.fill();
  for (const [x, y] of [[14.6, -14], [39, -12.6]]) {
    circ(g, x, y, 5.8, C.fur, 1.9);
    circ(g, x + 0.3, y + 0.6, 2.9, C.ear, 0);
  }
  ell(g, 27, 1, 15.5, 15, vgrad(g, -14, 16, C.fur, C.furDark), 2);
  // the mouth, thrown wide when it roars
  if (o.jaw > 0.08) {
    shape(g, C.mouth, 1.9, () => {
      g.moveTo(25, 9);
      g.quadraticCurveTo(34, 12, 43, 8.6);
      g.quadraticCurveTo(43, 13 + o.jaw * 13, 34, 13 + o.jaw * 14);
      g.quadraticCurveTo(25, 12 + o.jaw * 13, 25, 9);
    });
    ell(g, 34, 11 + o.jaw * 10.6, 5.6, 2.2 + o.jaw * 1.6, C.tongue, 0);
    for (const x of [29.4, 39]) poly(g, [[x - 2, 10.6], [x, 12.4 + o.jaw * 4.6], [x + 2, 10.8]], C.tooth, 0.9);
  }
  ell(g, 34, 8, 9.6, 6, C.muzzle, 1.7);
  shape(g, C.nose, 1.1, () => {
    g.moveTo(31, 3.6);
    g.quadraticCurveTo(35, 2, 39, 3.8);
    g.quadraticCurveTo(37.4, 7, 35, 7.4);
    g.quadraticCurveTo(32.4, 7, 31, 3.6);
  });
  path(g, OUT, 1.3, () => {
    g.moveTo(35, 7.4);
    g.lineTo(34.8, 9.4);
    if (o.jaw <= 0.08) {
      g.moveTo(29.6, 10.4);
      g.quadraticCurveTo(32.6, 12.8, 34.8, 9.4);
      g.quadraticCurveTo(37.4, 12.8, 40.4, 10.4);
    }
  });
  bigEye(g, 23.4, -4.2, 4.9, o);
  bigEye(g, 36.6, -4.6, 4.5, o);
  if (o.angry) {
    path(g, OUT, 2.3, () => {
      g.moveTo(17.6, -12);
      g.lineTo(27.6, -9);
      g.moveTo(42.4, -12.2);
      g.lineTo(33, -9.4);
    });
  }
}

// ---------------------------------------------------------------- the whole beast
// A pose. crouch: how low it is; lean: front down (+) or reared (-), about the hips; nod: the lion's head; roar: its
// mouth; puff: its mane; tilt: the goat's head; bleat: the goat's mouth; reach / kick: front paws thrown forward and
// hind paws back, as it leaps
const REST = { crouch: 0, lean: 0, nod: 0, roar: 0.02, puff: 0, tilt: 0, bleat: 0, reach: 0, kick: 0 };
const PAWS = { farHind: [-17, 23.4], nearHind: [-26, 24.6], farFront: [17, 23.4], nearFront: [8, 24.8] };
const HIP = [-20, 6];

// o: { paws, bob, wave, aim, heat, shut, goatShut, ear, angry, dead, snake: { head, c1, c2, gape, tongue, front } }
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
  const foot = (name) => {
    const front = name.endsWith('Front');
    return [PAWS[name][0] + o.paws[name].x + (front ? P.reach * 20 : -P.kick * 15), PAWS[name][1] + o.paws[name].y - (front ? P.reach * 9 : P.kick * 3)];
  };
  const tail = () => upper(() => snake(g, { ...o.snake, o: { dead: o.dead, shut: o.shut, angry: o.angry || o.snake.front } }));
  leg(g, turned(-17, 10), foot('farHind'), true);
  leg(g, turned(13, 10), foot('farFront'), true);
  if (!o.snake.front) tail();
  upper(() => body(g));
  leg(g, turned(-24, 9), foot('nearHind'), false);
  upper(() => goat(g, { aim: o.aim + P.tilt, jaw: Math.max(P.bleat, o.heat), heat: o.heat, shut: o.shut, goatShut: o.goatShut, ear: o.ear, angry: o.angry, dead: o.dead }));
  leg(g, turned(7, 10), foot('nearFront'), false);
  upper(() => {
    g.save();
    g.translate(16, 4);
    g.rotate(P.nod);
    g.translate(-16, -4);
    lion(g, { jaw: Math.max(0, P.roar), puff: P.puff, wave: o.wave, shut: o.shut, angry: o.angry, dead: o.dead });
    g.restore();
  });
  // while it is striking, the snake comes over in front of everything
  if (o.snake.front) tail();
  g.restore();
}

const none = () => ({ x: 0, y: 0 });
const STAND = { farHind: none(), nearHind: none(), farFront: none(), nearFront: none() };

export function drawChimeraStill(g) {
  paint(g, REST, { paws: STAND, bob: 0, wave: 0, aim: -0.05, heat: 0, shut: 0, goatShut: 0, ear: 0, snake: { ...SNAKE_REST, gape: 0, tongue: 0.5 } });
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
      if (m.t < a.windup) want = { ...want, crouch: 7, lean: 0.08 + Math.sin(t * 26) * 0.035, roar: 0.2, puff: 0.2, tilt: 0.12 };
      else if (m.t < a.windup + a.time) {
        const q = (m.t - a.windup) / a.time;
        want = { ...want, lean: lerp(-0.3, 0.3, q), reach: 1, kick: q < 0.7 ? 1 : 0.3, roar: 0.8, puff: 0.7, tilt: -0.25 };
      } else want = { ...want, crouch: 8, lean: 0.05, roar: 0.3, puff: 0.3 };
      stiff = 520;
      damp = 34;
    } else if (m && m.kind === 'ram') {
      // head right down, horns first
      if (m.t < a.windup) want = { ...want, crouch: 5, lean: -0.08, tilt: 1.15, roar: 0.15 };
      else want = { ...want, crouch: 3, lean: 0.1, tilt: 1.3, roar: 0.4, puff: 0.4 };
      stiff = 420;
      damp = 30;
    } else if (m && m.kind === 'roar') {
      if (m.t < a.windup) want = { ...want, nod: -0.34, lean: -0.1, roar: 0.15, puff: 0.35, tilt: -0.3 };
      else want = { ...want, nod: -0.02, lean: 0.06, roar: 1.05, puff: 1, tilt: -0.45, bleat: 0.8, crouch: 2 };
      stiff = 560;
      damp = 34;
    } else if (u.firing) {
      want = { ...want, crouch: 3, lean: 0.05, roar: 0.28 + Math.sin(t * 19) * 0.05, puff: 0.45 + Math.sin(t * 23) * 0.18, nod: 0.06 };
    } else if (windup > 0) {
      // the goat rears its head back to fill its lungs
      want = { ...want, tilt: -0.5 * windup, lean: -0.06 * windup, crouch: 1.5 * windup, bleat: 0.2 * windup };
    } else if (R.fidget === 'yawn') {
      const swell = Math.sin(R.q * Math.PI) ** 0.7;
      want = { ...want, roar: swell * 0.62, nod: -0.14 * swell };
    } else if (R.fidget === 'bleat') {
      const swell = Math.sin(R.q * Math.PI);
      want = { ...want, bleat: swell * (0.5 + 0.5 * Math.abs(Math.sin(t * 17))), tilt: -0.3 * swell };
    } else if (R.fidget === 'look') want = { ...want, nod: Math.sin(R.q * TAU) * 0.15, tilt: -Math.sin(R.q * TAU) * 0.22 };
  }
  if (dead) return { ...REST, roar: 0.5, bleat: 0.6, nod: 0.12, tilt: 0.3 };
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

// the snake's shape just now: at rest, or drawn back, shot out at its mark, and slid home again
function snakePose(u, t, dead) {
  const sway = dead ? 0 : Math.sin(t * 1.9);
  const rest = {
    head: [SNAKE_REST.head[0] + sway * 4, SNAKE_REST.head[1] + Math.sin(t * 3.1) * 2],
    c1: [SNAKE_REST.c1[0] + sway * 3, SNAKE_REST.c1[1]],
    c2: [SNAKE_REST.c2[0] - sway * 4, SNAKE_REST.c2[1]],
  };
  const flick = t % 1.9;
  const b = u.bite;
  if (!b || dead) return { ...rest, gape: dead ? 0.6 : 0, tongue: dead ? 0.7 : flick < 0.34 ? Math.abs(Math.sin((flick / 0.34) * Math.PI * 3)) : 0, front: false };
  const a = u.def.venom;
  const mark = toArt(u, b.x, b.y);
  const back = { head: [-66, -40], c1: [-58, 6], c2: [-42, -34] };
  // it arcs up high on the way there (over its own back to reach in front; a rounder hoop to reach behind)
  const high = Math.min(mark[1], -30);
  const behind = clamp01((SNAKE_ROOT[0] - mark[0]) / 30);
  const out = {
    head: mark,
    c1: [lerp(-62, SNAKE_ROOT[0] - 10, behind), lerp(-30, high - 20, behind)],
    c2: [lerp(lerp(SNAKE_ROOT[0], mark[0], 0.6), mark[0] + 4, behind), high - lerp(34, 24, behind)],
  };
  const mix = (p, q, k) => ({ head: [lerp(p.head[0], q.head[0], k), lerp(p.head[1], q.head[1], k)], c1: [lerp(p.c1[0], q.c1[0], k), lerp(p.c1[1], q.c1[1], k)], c2: [lerp(p.c2[0], q.c2[0], k), lerp(p.c2[1], q.c2[1], k)] });
  const coil = a.hit * 0.55;
  let now;
  let gape = 1;
  if (b.t < coil) {
    now = mix(rest, back, ease(b.t / coil));
    gape = b.t / coil;
  } else if (b.t < a.hit) now = mix(back, out, ((b.t - coil) / (a.hit - coil)) ** 2);
  else if (b.t < a.hit + 0.14) {
    now = out;
    gape = 0.35; // jaws shut on them
  } else {
    const k = ease(clamp01((b.t - a.hit - 0.14) / (a.time - a.hit - 0.14)));
    now = mix(out, rest, k);
    gape = 0.35 * (1 - k);
  }
  return { ...now, gape, tongue: 0, front: b.t >= coil && b.t < a.time - 0.12 };
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
  const windup = near && u.burstT > 0 && u.burstT < 0.45 ? 1 - u.burstT / 0.45 : 0;
  // (the rig is told it is standing, so its own two-footed stride never gets going: the four paws are worked out below)
  const R = rigStep(u, {
    age: 9, dead, moving: false, bang: 0, kick: 0.3, calm: !u.target && !u.moving, busy: firing || !!act || windup > 0,
    fidgets: ['look', 'look', 'yawn', 'bleat'],
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

  const wobble = u.hit > 0.14 ? (Math.random() - 0.5) * 1.4 : act && act.kind === 'roar' && act.t > d.roar.windup ? (Math.random() - 0.5) * 1.8 : 0;
  ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  if (u.tilt) {
    ctx.translate(0, FEET);
    ctx.rotate(u.tilt);
    ctx.translate(0, -FEET);
  }
  if (!dead) {
    // its shadow stays on the ground, shrinking as it leaps
    ctx.save();
    ctx.translate(-2, FEET + 0.8);
    ctx.scale(1, 0.24);
    glow(ctx, 0, 0, 56 * K * d.scale * (1 - alt * 0.35), '0, 0, 0', 0.46 - alt * 0.22);
    ctx.restore();
    if (firing) {
      ctx.save();
      ctx.translate(46, FEET);
      ctx.scale(1, 0.32);
      glow(ctx, 0, 0, 52, '255, 140, 30', 0.26 + 0.06 * Math.sin(t * 27));
      ctx.restore();
    }
  }
  // streaking along as it charges
  if (act && act.kind === 'ram' && act.t > d.ram.windup && act.t < d.ram.windup + d.ram.time) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(150, 140, 130, 0.65)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    for (const [y, len] of [[-18, 34], [-4, 46], [9, 30]]) {
      ctx.moveTo(-34 - len * (0.7 + 0.3 * Math.sin(t * 40 + y)), y);
      ctx.lineTo(-34, y);
    }
    ctx.stroke();
  }
  if (alt > 0.01) ctx.translate(0, -alt * d.pounce.height);
  ctx.translate(0, FEET);
  ctx.scale(d.scale, d.scale);
  ctx.translate(0, -FEET);
  applyBotBody(ctx, { ...R, roll: 0, lean: R.lean * 0.3 });

  const blink = t % 3.7;
  const busy = firing || !!act || windup > 0;
  const shut = !busy && blink < 0.15 ? Math.sin((blink / 0.15) * Math.PI) : R.fidget === 'yawn' ? Math.sin(R.q * Math.PI) : 0;
  const goatBlink = (t + 1.6) % 4.4;
  const pose = dead ? 0 : u.pose || 0;
  // the goat looks where the fire is going; with nobody about it gazes round
  const aim = dead ? 0.2 : (-0.1 + Math.sin(t * 0.9) * 0.14) * (1 - pose) + (u.aim || 0) * pose + (firing ? Math.sin(t * 31) * 0.03 : 0);
  // (the snake's mark is on the ground; while the beast is in the air the drawing is lifted, so it aims lower to match)
  const lifted = alt * d.pounce.height;
  const bite = u.bite;
  if (bite) bite.y += lifted;
  const tailPose = snakePose(u, t, dead);
  if (bite) bite.y -= lifted;
  paint(ctx, P, {
    paws,
    // it rises and falls with each pair of paws, and breathes
    bob: -Math.abs(Math.sin(walk * TAU)) * 2.2 * k + Math.sin(t * 2.2) * 0.5 * (1 - k),
    wave: dead ? 0 : Math.sin(t * (k > 0.3 || busy ? 9 : 2.2)),
    aim: act ? 0 : aim,
    heat: firing ? 1 : windup * 0.7,
    shut,
    goatShut: !busy && goatBlink < 0.16 ? Math.sin((goatBlink / 0.16) * Math.PI) : 0,
    ear: dead ? 0 : t % 5.2 < 0.3 ? Math.sin(((t % 5.2) / 0.3) * Math.PI * 2) * 0.45 : Math.sin(t * 1.3) * 0.06,
    angry: busy || !!u.target,
    dead,
    snake: tailPose,
  });
  if (overlay) overlay(ctx, u, d.body[0] * K, d.body[1] * K, 0, d.body[2] * K);
  // it takes a lot of knocks, so a soft flash rather than turning solid white
  if (!dead && u.hit > 0) glow(ctx, 0, -2 * K, 42 * K, '240, 246, 255', Math.min(0.3, u.hit * 1.6));
}

// ---------------------------------------------------------------- how it fights
export function resetChimeraFx(world) {
  world.venoms = []; // drops of poison
  world.roars = []; // the rings of a roar
  world.stomps = []; // where it has landed
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

// the lion comes down on them
function land(world, u) {
  const a = u.def.pounce;
  const cx = u.x + u.facing * 16;
  const cy = u.y;
  const main = u.act.mark;
  world.eachEnemyNear(u.side, cx, cy, a.radius + 24, (o) => {
    const dist = Math.hypot(o.x - cx, o.y - cy);
    if (dist > a.radius + o.def.radius) return;
    shove(o, o.x - cx, o.y - cy, a.knock);
    world.hurt(o, (o === main ? a.damage : a.splash) * rand(0.9, 1.1), o.x, o.y, undefined, u);
  });
  world.hitProps(cx, cy, a.radius * 0.6, a.damage);
  world.stomps.push({ x: cx, y: cy + FEET, r: a.radius * 1.2, age: 0, life: 0.65, seed: Math.random() * TAU });
  dust(world, cx, cy + FEET - 1, 16, a.radius);
  if (world.sfx) world.sfx('slam', cx);
}

// the roar bursts out: everyone near is knocked back and left seeing stars
function bellow(world, u) {
  const a = u.def.roar;
  const mouth = { x: u.x + u.facing * 34 * K * u.def.scale, y: u.y + FEET + (10 * K - FEET) * u.def.scale };
  world.roars.push({ x: mouth.x, y: mouth.y, ground: u.y + FEET, cx: u.x, r: a.radius, age: 0, life: 0.75 });
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
    if (world.sfx) world.sfx('smash', o.x);
  });
  world.hitProps(u.x + m.dx * 22, u.y + m.dy * 22, 14, a.damage);
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
      for (let i = 0; i < 12; i++) {
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
  if (world.sfx && kind !== 'pounce') world.sfx('magic', u.x);
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
      const go = Math.max(0, Math.min(a.max, dist) - 24);
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
  } else {
    if (before < a.windup && m.t >= a.windup) bellow(world, u);
    if (m.t >= a.time) u.act = null;
  }
}

export function stepChimera(world, u, dt) {
  const d = u.def;
  // it opens with one of its leaps or charges rather than the fire
  if (u.pounceCd === undefined) u.burstT = 1.9;
  for (const kind of ['pounce', 'ram', 'roar']) {
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
      if (u.roarCd <= 0 && (close >= 3 || right)) {
        begin(world, u, 'roar', t);
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
  for (const list of [world.venoms, world.roars, world.stomps]) for (const e of list) e.age += dt;
  for (const e of world.venoms) {
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.vy += 230 * dt;
  }
  const live = (o) => o.age < o.life;
  for (const key of ['venoms', 'roars', 'stomps']) if (!world[key].every(live)) world[key] = world[key].filter(live);
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

// over the units: the sound of its roar, and drops of poison
export function drawChimeraAir(ctx, world) {
  if (!world.roars.length && !world.venoms.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  for (const r of world.roars) {
    const p = r.age / r.life;
    // rings of sound racing out from its mouth, one after another
    for (let i = 0; i < 3; i++) {
      const q = (p - i * 0.16) / 0.68;
      if (q <= 0 || q >= 1) continue;
      const size = 10 + (r.r - 4) * (1 - (1 - q) ** 2);
      for (const [colour, wide] of [[`rgba(150, 82, 24, ${0.7 * (1 - q)})`, 4.2 * (1 - q) + 0.8], [`rgba(255, 214, 120, ${0.95 * (1 - q)})`, 2 * (1 - q) + 0.4]]) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = wide;
        ctx.beginPath();
        ctx.ellipse(lerp(r.x, r.cx, q), lerp(r.y, r.ground - 6, q), size, size * lerp(0.9, 0.5, q), 0, 0, TAU);
        ctx.stroke();
      }
    }
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
