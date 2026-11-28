// Gandalligator the Grey: what he looks like, how he moves and how he fights.
// He is built on the original's alligator (the same long low back and tapering tail, stubby legs and long toothy jaws),
// stood a little higher so there is room for a beard, and dressed as a wizard: a tall grey hat, a grey cloak with a
// silver hem, a long white beard and a wooden staff, which he leans on as he walks. His magic is blue and silver.
// Drawn in art units, facing +x, with the ground 25 below the origin (as the alligator is).
import { TAU, K, FEET } from './config.js?v=268';
import { OUT } from './sprites.js?v=268';
import { blob, ribbon, stick, poly, circ, ell, vgrad } from './art_kit.js?v=268';
import { rigStep, applyBotBody } from './botrig.js?v=268';

const rand = (a, b) => a + Math.random() * (b - a);
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (q) => q * q * (3 - 2 * q);

const C = {
  skin: '#5d9a43', skinDark: '#3a7230', jaw: '#6fa650', ridge: '#2f5f27', legNear: '#4a8a3a', legFar: '#356a2a',
  footNear: '#26481f', footFar: '#1f3b19', tooth: '#fbf8ea', tongue: '#e8838a',
  cloak: '#9aa0b0', cloakDark: '#646a7b', hat: '#858b9b', hatDark: '#5f6574', silver: '#e9eef8', silverDim: '#b9c1d2',
  beard: '#f6f5f0', beardShade: '#cfd0d6', wood: '#8f5f2e', woodDark: '#65401d',
};

// ---------------------------------------------------------------- walking
// A foot on the ground is moved back exactly as far as he goes forward, so it stays where it was put. STRIDE: how far a
// foot goes from front to back; STANCE: the part of each step it spends on the ground
const STRIDE = 22;
const STANCE = 0.62;

// how far one whole step takes him, in world units
export const stepLength = (u) => (STRIDE / STANCE) * K * u.def.scale;

// where a foot is `phase` steps in: x ahead of where it rests, y above the ground (negative is up)
export function footAt(phase) {
  const p = phase - Math.floor(phase);
  if (p < STANCE) return { x: STRIDE / 2 - STRIDE * (p / STANCE), y: 0 };
  const q = (p - STANCE) / (1 - STANCE);
  return { x: -STRIDE / 2 + STRIDE * ease(q), y: -6 * Math.sin(q * Math.PI) };
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

// a stubby leg from the hip to a flat clawed foot
function leg(g, hip, foot, far) {
  const knee = [(hip[0] + foot[0]) / 2 + (hip[0] < 0 ? -2.6 : 2.6), (hip[1] + foot[1]) / 2];
  stick(g, [hip, knee, [foot[0], foot[1] - 1.5]], far ? 7 : 7.8, far ? C.legFar : C.legNear, 1.3);
  ell(g, foot[0] + 1.6, foot[1], 5.6, 2.9, far ? C.footFar : C.footNear, 1.3);
  for (let i = 0; i < 3; i++) poly(g, [[foot[0] + 4.4 + i * 1.5, foot[1] + 0.6 - i * 0.5], [foot[0] + 7.6 + i * 1.2, foot[1] + 1.8 - i * 0.7], [foot[0] + 4.8 + i * 1.5, foot[1] + 2 - i * 0.5]], C.tooth, 0.55);
}

// the middle line of his back and tail; `raise` curls the tail up over him (radians at the tip, - is up) and `swish`
// moves its end up and down
function spine(raise, swish) {
  const pts = [[26, 8.5], [14, 8], [0, 8.5], [-14, 9.5], [-26, 13.5], [-39, 19]];
  let [x, y] = pts[2];
  const out = pts.slice(0, 3);
  let turned = 0;
  for (let i = 3; i < pts.length; i++) {
    const dx = pts[i][0] - pts[i - 1][0];
    const dy = pts[i][1] - pts[i - 1][1] + (i === 5 ? swish : i === 4 ? swish * 0.4 : 0);
    // (the tail runs backwards, so turning it the other way lifts it)
    turned -= (raise * (i - 2)) / 6;
    const c = Math.cos(turned);
    const s = Math.sin(turned);
    x += dx * c - dy * s;
    y += dx * s + dy * c;
    out.push([x, y]);
  }
  return out;
}

function drawTrunk(g, raise, swish) {
  const pts = spine(raise, swish);
  ribbon(g, pts, 17, 2.8, vgrad(g, -1, 18, C.skin, C.skinDark), 1.9);
  ell(g, 2, 13.6, 19, 2.6, 'rgba(214, 232, 150, 0.45)', 0);
  // the bumpy ridge down what the cloak leaves bare of his tail
  for (let i = 3; i < pts.length - 1; i++) {
    for (const q of [0.15, 0.65]) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[i + 1];
      const x = lerp(ax, bx, q);
      const y = lerp(ay, by, q);
      const len = Math.hypot(bx - ax, by - ay) || 1;
      let nx = (by - ay) / len;
      let ny = -(bx - ax) / len;
      if (ny > 0) {
        nx = -nx;
        ny = -ny;
      }
      const half = lerp(8.5, 1.4, (i + q - 2) / 3.4);
      const cx = x + nx * (half - 1);
      const cy = y + ny * (half - 1);
      poly(g, [[cx - 2.4, cy + 1.2], [cx + nx * 3.6, cy + ny * 3.6], [cx + 2.4, cy + 0.8]], C.ridge, 0.9);
    }
  }
}

// the grey cloak over his back, its silver hem hanging in points; `wave` ripples it, `sweep` carries its end out
function drawCloak(g, wave, sweep) {
  const tx = -25 - sweep * 10;
  const ty = 10 - sweep * 14 + wave * 1.6;
  const hem = () => {
    g.moveTo(tx, ty);
    g.quadraticCurveTo(-20, 13 - sweep * 6, -17, 18.5 + wave * 0.8 - sweep * 3);
    g.quadraticCurveTo(-15, 14, -11, 15);
    g.quadraticCurveTo(-9, 18.5, -6, 21 - wave * 0.8);
    g.quadraticCurveTo(-2, 16, 2, 16);
    g.quadraticCurveTo(6, 18.5, 9, 21 + wave * 0.6);
    g.quadraticCurveTo(12, 15.5, 16, 15);
    g.quadraticCurveTo(19, 17, 23, 17.5);
  };
  shape(g, vgrad(g, -7, 21, C.cloak, C.cloakDark), 1.7, () => {
    hem();
    g.quadraticCurveTo(27, 10, 24, 1);
    g.bezierCurveTo(16, -5, 4, -7, -9, -5);
    g.bezierCurveTo(-17, -3, -23, 2, tx, ty);
  });
  // a couple of folds
  path(g, 'rgba(50, 54, 70, 0.5)', 1.1, () => {
    g.moveTo(-3, -4);
    g.quadraticCurveTo(-8, 6, -6, 16);
    g.moveTo(11, -4);
    g.quadraticCurveTo(7, 6, 9, 16);
  });
  path(g, OUT, 4.4, hem);
  path(g, C.silver, 2.2, hem);
}

// his tall pointed hat: grey, with a wide brim and a silver band, the point flopping over backwards
function drawHat(g) {
  shape(g, vgrad(g, -37, -5, C.hatDark, C.hat), 1.7, () => {
    g.moveTo(8.6, -5);
    g.bezierCurveTo(11, -17, 13, -26, 13, -31);
    g.bezierCurveTo(9, -34, 3, -33, -1, -27);
    g.bezierCurveTo(1, -37, 12, -43, 19, -35);
    g.bezierCurveTo(22, -26, 25, -16, 29.4, -6.4);
  });
  shape(g, C.silver, 1.2, () => {
    g.moveTo(9.4, -8.4);
    g.quadraticCurveTo(19, -10.6, 28.4, -9.8);
    g.lineTo(26.6, -14);
    g.quadraticCurveTo(18, -15.4, 10.4, -13);
  });
  ell(g, 19, -5, 15.6, 3.5, C.hat, 1.7, -0.06);
}

export function drawGatorHatDrop(g) {
  g.save();
  g.scale(0.66, 0.66);
  g.translate(-17, 21);
  drawHat(g);
  g.restore();
}

// the hat with the middle of its brim at the origin, for whatever is wearing it
export function drawGatorHatWorn(g) {
  g.save();
  g.translate(-19, 5);
  drawHat(g);
  g.restore();
}

// his head: the alligator's long jaws and teeth, with a bushy white brow, a long white beard and the hat.
// o: jaw (radians open), shut (0..1), happy, dead, angry, sway (of the beard)
function drawHead(g, o) {
  // the collar standing up behind
  shape(g, C.cloakDark, 1.6, () => {
    g.moveTo(21, 4);
    g.quadraticCurveTo(12, -2, 3, -13);
    g.quadraticCurveTo(15, -9, 25, -3);
  });
  path(g, C.silver, 1.4, () => {
    g.moveTo(3.6, -12.4);
    g.quadraticCurveTo(15, -8.6, 24.4, -3);
  });
  // lower jaw first
  g.save();
  g.translate(25, 10);
  g.rotate(o.jaw);
  blob(g, [[0, 0], [10, 1], [26, 0.5], [27, 3.4], [10, 4.8], [0, 4]], C.jaw, 1.7);
  if (o.jaw > 0.16) {
    shape(g, C.tongue, 0, () => {
      g.moveTo(1, 0.6);
      g.lineTo(25, 0.6);
      g.lineTo(18, -1.2);
      g.lineTo(5, -1.2);
    });
    // lower teeth
    for (let i = 0; i < 4; i++) poly(g, [[11 + i * 3.6, 0.8], [12.3 + i * 3.6, -2], [13.4 + i * 3.6, 0.8]], C.tooth, 0.6);
  }
  g.restore();
  // upper jaw
  blob(g, [[22, 2], [32, 2.5], [50, 5.6], [52, 9.4], [36, 10.6], [22, 11.6]], vgrad(g, 1, 12, '#62a046', '#46823a'), 1.9);
  for (let i = 0; i < 6; i++) {
    const x = 33 + i * 3;
    poly(g, [[x, 10], [x + 1.2, 10 + (o.jaw > 0.16 ? 3.4 : 2)], [x + 2.4, 9.6]], C.tooth, 0.7);
  }
  circ(g, 48.5, 4.6, 1.6, C.ridge, 1);
  // eye bump and eye
  circ(g, 28.5, 1, 4, '#4f8f3d', 1.5);
  if (o.dead) {
    path(g, OUT, 1.2, () => {
      g.moveTo(27.4, -0.6);
      g.lineTo(30.8, 2.8);
      g.moveTo(30.8, -0.6);
      g.lineTo(27.4, 2.8);
    });
  } else if (o.happy || o.shut > 0.6) {
    path(g, OUT, 1.3, () => {
      if (o.happy) g.arc(29.1, 2, 2.1, Math.PI * 1.12, Math.PI * 1.88);
      else g.arc(29.1, 0.2, 2.1, Math.PI * 0.15, Math.PI * 0.85);
    });
  } else {
    if (o.angry) ell(g, 29.1, 1.1, 4.6, 4, 'rgba(110, 190, 255, 0.45)', 0);
    ell(g, 29.1, 1.1, 2.4, 2.4 * (1 - o.shut), o.angry ? '#dff1ff' : '#e0d94a', 0.9);
    ell(g, 29.5, 1.1, 0.8, 2 * (1 - o.shut), o.angry ? '#2f8fe8' : '#101010', 0);
  }
  // the long white beard, hung from his chin
  g.save();
  g.translate(25, 10);
  g.rotate(o.jaw * 0.55 + o.sway);
  shape(g, vgrad(g, 3, 17, C.beard, C.beardShade), 1.3, () => {
    g.moveTo(0, 3);
    g.bezierCurveTo(6, 5.4, 16, 4.6, 22, 3.2);
    g.quadraticCurveTo(23.6, 8, 19.6, 9.6);
    g.quadraticCurveTo(21.4, 12.6, 16.6, 12.4);
    g.quadraticCurveTo(16.4, 16.4, 11.4, 13.4);
    g.quadraticCurveTo(9, 18.6, 5, 13.6);
    g.quadraticCurveTo(0.6, 14.8, 1, 10.4);
    g.quadraticCurveTo(-2.4, 8, 0, 3);
  });
  path(g, 'rgba(150, 152, 170, 0.8)', 0.7, () => {
    g.moveTo(5.4, 6.2);
    g.quadraticCurveTo(5.6, 9.6, 6.6, 12);
    g.moveTo(11.4, 6.4);
    g.quadraticCurveTo(11.8, 9.4, 11.2, 12);
    g.moveTo(16.8, 5.8);
    g.quadraticCurveTo(17.4, 8, 16.4, 10);
  });
  g.restore();
  drawHat(g);
  // a bushy white brow, drawn down when he is angry
  shape(g, C.beard, 1.1, () => {
    const dip = o.angry ? 1.5 : 0;
    g.moveTo(24.6, -2.6);
    g.quadraticCurveTo(28, -5.4, 33.4, -2.4 + dip);
    g.lineTo(36.4, -2.8 + dip);
    g.quadraticCurveTo(33.6, 0 + dip, 31, -0.9 + dip * 0.7);
    g.quadraticCurveTo(28, -2.4, 24.6, -0.8);
  });
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

// a long gnarled staff with a blue stone held in its crook. Origin: where he grips it, near its foot
function drawStaff(g, power, clock) {
  const wood = () => {
    g.moveTo(0.4, 5.5);
    g.quadraticCurveTo(-1.8, -8, 0, -19);
    g.quadraticCurveTo(2, -30, -0.4, -40);
    g.quadraticCurveTo(-5.6, -45, -4.4, -52);
    g.quadraticCurveTo(-3, -58, 3.6, -56.6);
  };
  if (power > 0.02) glow(g, 0.4, -50, 12 + 14 * power, '90, 175, 255', 0.45 + 0.4 * power);
  for (const [colour, wide] of [[OUT, 5.6], [C.wood, 3.2]]) path(g, colour, wide, wood);
  path(g, C.woodDark, 1, () => {
    g.moveTo(-0.7, -8);
    g.quadraticCurveTo(0.6, -14, 0.4, -21);
  });
  const stone = g.createRadialGradient(-0.8, -51.4, 0.4, 0.4, -50, 4.6);
  stone.addColorStop(0, '#f4fbff');
  stone.addColorStop(0.5, '#8fcaff');
  stone.addColorStop(1, '#2f7fe0');
  circ(g, 0.4, -50, 4.4, stone, 1.3);
  if (power < 0.3) return;
  // a four-pointed glint turning on the stone
  g.fillStyle = `rgba(235, 248, 255, ${power})`;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const a = clock * 3.4 + (i / 8) * TAU;
    const r = i % 2 ? 1.6 : 6 + 7 * power;
    g.lineTo(0.4 + Math.cos(a) * r, -50 + Math.sin(a) * r);
  }
  g.closePath();
  g.fill();
}

// ---------------------------------------------------------------- the whole of him
// A pose. lean: his front down (+) or reared up (-), about his hips; head: its nod (+ down); jaw; tail: the curl of
// it (- up); px / py: the paw that holds the staff; staff: its tilt; lunge: thrown forward
const REST = { lean: 0, head: 0, jaw: 0.04, tail: 0, px: 21, py: 19.5, staff: 0.46, lunge: 0 };
const HIP = [-12, 12];
const FEET_AT = { farHind: [-20, 24.4], nearHind: [-13, 25], farFront: [13, 24.4] };

// look: { feet: { farHind, nearHind, farFront, staff } offsets, swish, wave, sweep, shut, happy, angry, dead, sway,
// power, clock, bob }
function paint(g, P, o) {
  g.save();
  g.scale(K, K);
  // the upper body: pitched about his hips, thrown forward
  const upper = (draw) => {
    g.save();
    g.translate(HIP[0] + P.lunge, HIP[1] + o.bob);
    g.rotate(P.lean);
    g.translate(-HIP[0], -HIP[1]);
    draw();
    g.restore();
  };
  const turned = (x, y) => {
    const c = Math.cos(P.lean);
    const s = Math.sin(P.lean);
    return [HIP[0] + P.lunge + (x - HIP[0]) * c - (y - HIP[1]) * s, HIP[1] + o.bob + (x - HIP[0]) * s + (y - HIP[1]) * c];
  };
  const foot = (name) => {
    const f = o.feet[name];
    return [FEET_AT[name][0] + f.x, FEET_AT[name][1] + f.y];
  };
  leg(g, turned(-17, 11), foot('farHind'), true);
  leg(g, turned(12, 10), foot('farFront'), true);
  upper(() => drawTrunk(g, P.tail, o.swish));
  leg(g, turned(-10, 12), foot('nearHind'), false);
  upper(() => drawCloak(g, o.wave, o.sweep));
  // the staff, and the near front leg holding it like a walking stick. They go behind his head
  const paw = [P.px + o.feet.staff.x + P.lunge, P.py + o.feet.staff.y];
  g.save();
  g.translate(paw[0], paw[1]);
  g.rotate(P.staff);
  drawStaff(g, o.power, o.clock);
  g.restore();
  upper(() => {
    g.save();
    g.translate(20, 6);
    g.rotate(P.head);
    g.translate(-20, -6);
    drawHead(g, { jaw: Math.max(0, P.jaw), shut: o.shut, happy: o.happy, dead: o.dead, angry: o.angry, sway: o.sway });
    g.restore();
  });
  const shoulder = turned(14, 11);
  stick(g, [shoulder, [(shoulder[0] + paw[0]) / 2 + 3.4, (shoulder[1] + paw[1]) / 2 + 2.6], paw], 8, C.legNear, 1.3);
  ell(g, paw[0] + 0.6, paw[1], 4.6, 4, C.footNear, 1.3);
  path(g, OUT, 0.9, () => {
    g.moveTo(paw[0] - 1, paw[1] - 2.6);
    g.lineTo(paw[0] + 4.6, paw[1] - 1.6);
    g.moveTo(paw[0] - 1.4, paw[1] + 0.4);
    g.lineTo(paw[0] + 4.8, paw[1] + 1.2);
  });
  upper(() => {
    circ(g, 21.5, 12.6, 3.4, C.silver, 1.3);
    circ(g, 21.5, 12.6, 1.6, '#4b9dee', 0.9);
  });
  g.restore();
}

const still = () => ({ x: 0, y: 0 });
const STAND = { farHind: still(), nearHind: still(), farFront: still(), staff: still() };

export function drawGatorStill(g) {
  paint(g, REST, { feet: STAND, swish: 0, wave: 0, sweep: 0, shut: 0, sway: 0, power: 0.2, clock: 0, bob: 0 });
}

// ---------------------------------------------------------------- how he holds himself, moment to moment
export const BITE = { snap: 0.24, hit: 0.3, curl: 0.46, slam: 0.78, time: 1.12 };
export const WAVE = { strike: 0.74, time: 1.3 };
const STIFF = { calm: [220, 20], snap: [640, 36] };

const POSES = {
  // jaws gaping, drawn back...
  gape: { head: -0.34, jaw: 0.72, lunge: -5, lean: -0.08 },
  // ...and snapped shut on them
  chomp: { head: 0.13, jaw: 0, lunge: 12, lean: 0.08 },
  // the tail curled up over his back...
  curl: { tail: -1.9, lean: 0.13, head: 0.1, lunge: 2, jaw: 0.2 },
  // ...and brought down
  lash: { tail: 0.42, lean: -0.07, head: -0.12, lunge: -1, jaw: 0.5 },
  // aiming the staff...
  aim: { lean: -0.1, head: -0.14, jaw: 0.24, px: 24, py: 3, staff: 0.05 },
  // ...and flicking it
  flick: { lean: 0.05, head: 0.02, jaw: 0.55, px: 29, py: 5, staff: 0.92 },
  // reared up with the staff held high...
  rear: { lean: -0.3, head: -0.26, jaw: 0.5, px: 27, py: -9, staff: -0.06, tail: 0.1 },
  // ...and planted: they shall not pass
  plant: { lean: 0.06, head: -0.06, jaw: 0.74, px: 30, py: 18, staff: 0.24, lunge: 3, tail: -0.3 },
  cheer: { lean: -0.2, head: -0.36, jaw: 0.5, px: 26, py: 0, staff: 0.1, tail: -0.5 },
};

function posed(u, R, dead, t) {
  let want = { ...REST };
  let snap = false;
  if (!dead) {
    if (u.waveT !== null && u.waveT !== undefined) {
      want = { ...want, ...(u.waveT < WAVE.strike - 0.06 ? POSES.rear : POSES.plant) };
      snap = u.waveT >= WAVE.strike - 0.06;
    } else if (u.biteT !== null && u.biteT !== undefined) {
      const q = u.biteT;
      want = { ...want, ...(q < BITE.snap ? POSES.gape : q < BITE.curl ? POSES.chomp : q < BITE.slam - 0.07 ? POSES.curl : POSES.lash) };
      snap = (q >= BITE.snap && q < BITE.curl) || q >= BITE.slam - 0.07;
    } else if (u.castT > 0) want = { ...want, ...POSES.aim };
    else if (u.castFlash > 0) {
      want = { ...want, ...POSES.flick };
      snap = true;
    } else if (R.happy) want = { ...want, ...POSES.cheer };
    else if (R.fidget === 'yawn') {
      const swell = Math.sin(R.q * Math.PI) ** 0.7;
      want = { ...want, jaw: 0.78 * swell, head: -0.24 * swell, lean: -0.05 * swell };
    } else if (R.fidget === 'swish') want = { ...want, tail: -0.5 * Math.sin(R.q * Math.PI) + Math.sin(R.q * TAU * 3) * 0.24 };
    else if (R.fidget === 'tap') want = { ...want, py: 19.5 - Math.max(0, Math.sin(R.q * TAU * 3)) * 5, staff: 0.46 - Math.max(0, Math.sin(R.q * TAU * 3)) * 0.1 };
    else if (R.fidget === 'look') want = { ...want, head: Math.sin(R.q * TAU) * 0.18 };
    else want = { ...want, jaw: 0.04 + Math.max(0, Math.sin(t * 1.4)) * 0.03 };
  }
  if (dead) return { ...REST, jaw: 0.45, py: 21, staff: 1.15, head: 0.1 };
  let s = u.gat;
  const dt = Math.min(0.15, Math.max(0, u.breath - (s ? s.at : u.breath)));
  if (!s) {
    s = u.gat = { at: u.breath, p: {} };
    for (const k in REST) s.p[k] = { x: REST[k], v: 0 };
  }
  s.at = u.breath;
  const [stiff, damp] = snap ? STIFF.snap : STIFF.calm;
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

// `overlay(ctx, u, rx, ry, cx, cy)` paints burning / frozen / poisoned tints
export function drawGandalligator(ctx, dpr, sprites, u, overlay) {
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const biting = u.biteT !== null && u.biteT !== undefined;
  const waving = u.waveT !== null && u.waveT !== undefined;
  const busy = biting || waving || u.castT > 0;
  // (the rig is told he is standing, so its own stride never gets going: his four feet are worked out below)
  const R = rigStep(u, {
    age, dead, moving: false, bang: u.castFlash > 0 ? 1 : 0, kick: 0.4,
    calm: !u.target && !u.moving, busy,
    fidgets: ['look', 'yawn', 'swish', 'swish', 'tap'],
  });
  const P = posed(u, R, dead, t);
  const k = dead ? 0 : u.walkK || 0;
  const walk = dead ? 0 : u.walk || 0;
  // along the way he is heading (straight up or down the field he still steps a little to the side, or you couldn't see
  // that he was stepping at all)
  const wx = u.walkX === undefined ? 1 : Math.max(0.65, Math.abs(u.walkX));
  const tall = (u.walkY || 0) * 0.3;
  const step = (late) => {
    const f = footAt(walk + late);
    return { x: f.x * wx * k, y: (f.y + f.x * tall) * k };
  };
  const feet = { nearHind: step(0), farFront: step(0.04), farHind: step(0.5), staff: step(0.54) };

  const wobble = u.hit > 0.14 ? (Math.random() - 0.5) * 1.4 : 0;
  ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  if (u.tilt) {
    ctx.translate(0, FEET);
    ctx.rotate(u.tilt);
    ctx.translate(0, -FEET);
  }
  if (!dead) {
    ctx.save();
    ctx.translate(2, FEET + 0.6);
    ctx.scale(1, 0.24);
    glow(ctx, 0, 0, 50 * K * d.scale, '0, 0, 0', 0.45);
    ctx.restore();
  }
  // blue light gathers on the ground as he rears up or aims a spell
  const gather = dead ? 0 : waving && u.waveT < WAVE.strike ? u.waveT / WAVE.strike : u.castT > 0 ? 1 - u.castT / d.spell.cast : 0;
  if (gather > 0) {
    for (let i = 0; i < 2; i++) {
      const q = (t * 2.2 + i / 2) % 1;
      ctx.strokeStyle = `rgba(70, 150, 240, ${0.8 * q * gather})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, FEET + 1, 36 - 22 * q, (36 - 22 * q) * 0.32, 0, 0, TAU);
      ctx.stroke();
    }
  }
  ctx.translate(0, FEET);
  ctx.scale(d.scale, d.scale);
  ctx.translate(0, -FEET);
  applyBotBody(ctx, { ...R, roll: 0, lean: R.lean * 0.4 });

  const blink = t % 3.9;
  let shut = !busy && blink < 0.15 ? Math.sin((blink / 0.15) * Math.PI) : 0;
  if (R.fidget === 'yawn') shut = 1;
  const power = dead ? 0 : waving ? 1 : u.castT > 0 ? 1 - u.castT / d.spell.cast : u.castFlash > 0 ? u.castFlash / 0.28 : 0.16 + 0.07 * Math.sin(t * 3);
  paint(ctx, P, {
    feet,
    // a heavy waddle: he rises and falls a little with each pair of feet, and his tail swings against them
    bob: -Math.abs(Math.sin(walk * TAU)) * 1.6 * k + Math.sin(t * 2.1) * 0.35 * (1 - k),
    swish: dead ? 0 : Math.sin(walk * TAU) * 4.5 * k + Math.sin(t * 1.5) * 1.6 * (1 - k),
    wave: dead ? 0 : Math.sin(t * (k > 0.3 || busy ? 10 : 2.4)),
    sweep: dead ? 0 : Math.max(0.1 + Math.sin(t * 1.8) * 0.08, k * 0.35, waving ? 0.85 : 0),
    sway: dead ? 0 : Math.sin(walk * TAU + 0.8) * 0.07 * k + Math.sin(t * 1.7) * 0.025,
    shut, happy: R.happy, angry: busy && !R.happy, dead, power, clock: t,
  });
  if (overlay) overlay(ctx, u, d.body[0] * K, d.body[1] * K, 0, d.body[2] * K);
  // he takes a lot of knocks, so a soft flash rather than turning solid white
  if (!dead && u.hit > 0) glow(ctx, 0, 6 * K, 40 * K, '240, 246, 255', Math.min(0.5, u.hit * 2.6));
}

// ---------------------------------------------------------------- how he fights
export function resetGatorFx(world) {
  world.crackers = []; // his firework sparks in flight
  world.fireworks = []; // where they have burst
  world.lightWaves = []; // "you shall not pass"
  world.lashes = []; // where his tail has struck the ground
  world.motes = []; // loose blue and silver sparks
}

function motes(world, x, y, n, speed) {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const sp = speed * rand(0.4, 1.2);
    world.motes.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - speed * 0.3, age: 0, life: rand(0.25, 0.55), blue: Math.random() < 0.55 });
  }
}

// a point of his drawing (art units, facing right), out on the field
function onField(u, ax, ay) {
  return { x: u.x + u.facing * ax * K * u.def.scale, y: u.y + FEET + (ay * K - FEET) * u.def.scale };
}

// the snap of his jaws on whoever he is facing
function chomp(world, u) {
  const d = u.def;
  const o = u.bitten;
  const at = onField(u, 58, 9);
  motes(world, at.x, at.y, 5, 60);
  if (world.sfx) world.sfx('bite', at.x);
  if (!o || o.dead || Math.hypot(o.x - u.x, o.y - u.y) > (d.reach + o.def.radius) * 1.5) return;
  world.hurt(o, d.bite.damage * rand(0.9, 1.1), o.x, o.y, undefined, u);
}

// his tail comes down and everyone close, all round him, is thrown off their feet
function tailSlam(world, u) {
  const d = u.def;
  const m = d.lash;
  const cx = u.x - u.facing * 6;
  const cy = u.y;
  world.eachEnemyNear(u.side, cx, cy, m.radius + 14, (o) => {
    const dx = o.x - cx;
    const dy = o.y - cy;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > m.radius + o.def.radius) return;
    const share = Math.max(0.45, 1 - dist / (m.radius + o.def.radius));
    if (!o.def.noKnock) {
      const heavy = o.def.hp > 300 ? 0.4 : 1;
      o.kx += (dx / dist) * m.knock * share * heavy;
      o.ky += (dy / dist) * m.knock * share * heavy;
    }
    world.hurt(o, m.damage * share * rand(0.9, 1.1), o.x, o.y, undefined, u);
  });
  world.hitProps(cx, cy, m.radius * 0.6, m.damage);
  const tip = onField(u, -36, 24);
  world.lashes.push({ x: tip.x, y: u.y + FEET, cx, r: m.radius, age: 0, life: 0.7, seed: Math.random() * TAU });
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU + Math.random() * 0.3;
    world.puffs.push({ x: tip.x + Math.cos(a) * 6, y: u.y + FEET - 1 + Math.sin(a) * 3, vx: Math.cos(a) * m.radius * rand(1.5, 2.3), vy: Math.sin(a) * m.radius * 0.7 - rand(2, 9), age: 0, life: rand(0.45, 0.75), size: rand(2, 3.4), dust: true });
  }
  motes(world, tip.x, u.y + FEET - 3, 10, 85);
  if (world.sfx) world.sfx('slam', tip.x);
}

// three firework sparks off the end of his staff, each after its own mark where there are enough to go round
function throwCrackers(world, u) {
  const m = u.def.spell;
  const t = u.target;
  if (!t) return;
  const near = [];
  world.eachEnemyNear(u.side, t.x, t.y, 70, (o) => near.push(o));
  if (!near.length) near.push(t);
  near.sort((a, b) => Math.hypot(a.x - t.x, a.y - t.y) - Math.hypot(b.x - t.x, b.y - t.y));
  const from = onField(u, 70, -26);
  const ahead = Math.atan2(t.y - from.y, t.x - from.x);
  for (let i = 0; i < m.bolts; i++) {
    const a = ahead + (i - (m.bolts - 1) / 2) * 0.75 - 0.18 * u.facing;
    world.crackers.push({ x: from.x, y: from.y, vx: Math.cos(a) * m.speed * 0.8, vy: Math.sin(a) * m.speed * 0.8, o: near[i % near.length], side: u.side, owner: u, wait: i * 0.07, age: 0, trail: [], spin: Math.random() * TAU });
  }
  motes(world, from.x, from.y, 12, 80);
  if (world.sfx) world.sfx('magic', from.x);
}

function burst(world, s) {
  const m = s.owner.def.spell;
  world.eachEnemyNear(s.side, s.x, s.y, m.blast + 20, (o) => {
    const dx = o.x - s.x;
    const dy = o.y - 2 - s.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist > m.blast + o.def.radius) return;
    const share = 1 - 0.5 * (dist / (m.blast + o.def.radius));
    if (!o.def.noKnock) {
      o.kx += (dx / dist) * 120 * share;
      o.ky += (dy / dist) * 120 * share;
    }
    world.hurt(o, m.damage * share, o.x, o.y, 'blast', s.owner);
  });
  world.hitProps(s.x, s.y + 8, m.blast, m.damage);
  world.fireworks.push({ x: s.x, y: s.y, r: m.blast * 2, age: 0, life: 0.55, turn: Math.random() * TAU });
  motes(world, s.x, s.y, 8, 90);
}

// "You shall not pass": a wall of white light races out in front of him from where he plants the staff
function letLoose(world, u) {
  const at = onField(u, 28, 25);
  world.lightWaves.push({ x: at.x, y: at.y, ang: u.waveAng, side: u.side, owner: u, hit: new Set(), age: 0, life: 0.75 });
  motes(world, at.x, at.y - 4, 26, 150);
  if (world.sfx) {
    world.sfx('slam', at.x);
    world.sfx('boom', at.x);
  }
}

const SPREAD = 1.15; // how far to each side of straight ahead the wave goes, radians
const FLAT = 0.66; // the ground is seen at a slant
const RUN = 0.42; // seconds to reach its full distance
const frontAt = (w, reach) => 14 + (reach - 14) * (1 - (1 - Math.min(1, w.age / RUN)) ** 2);

function stepWaves(world, dt) {
  for (const w of world.lightWaves) {
    w.age += dt;
    if (w.age > RUN + 0.06) continue;
    const m = w.owner.def.wave;
    const r = frontAt(w, m.reach);
    world.eachEnemyNear(w.side, w.x, w.y - FEET, m.reach + 20, (o) => {
      if (w.hit.has(o)) return;
      const dx = o.x - w.x;
      const dy = (o.y + FEET - w.y) / FLAT;
      const dist = Math.hypot(dx, dy) || 1;
      if (dist > r + o.def.radius) return;
      let off = Math.atan2(dy, dx) - w.ang;
      off = Math.atan2(Math.sin(off), Math.cos(off));
      // (anyone right on top of the staff is caught whichever way they are)
      if (Math.abs(off) > SPREAD && dist > 20) return;
      w.hit.add(o);
      if (!o.def.noKnock) {
        const heavy = o.def.hp > 300 ? 0.35 : 1;
        o.kx += Math.cos(w.ang + off * 0.4) * m.knock * heavy;
        o.ky += Math.sin(w.ang + off * 0.4) * FLAT * m.knock * heavy;
      }
      world.hurt(o, m.damage * rand(0.9, 1.1), o.x, o.y, 'blast', w.owner);
      motes(world, o.x, o.y - 3, 7, 100);
    });
  }
}

export function stepGator(world, u, dt) {
  const d = u.def;
  const speed = d.speed * u.speedMul;
  u.cdT -= dt;
  u.spellCd = (u.spellCd === undefined ? 0.5 : u.spellCd) - dt;
  u.waveCd = (u.waveCd === undefined ? d.wave.first : u.waveCd) - dt;
  u.castFlash = Math.max(0, (u.castFlash || 0) - dt);
  const t = world.acquire(u, dt);
  const wasX = u.x;
  const wasY = u.y;
  if (u.waveT !== null && u.waveT !== undefined) {
    const before = u.waveT;
    u.waveT += dt;
    if (before < WAVE.strike && u.waveT >= WAVE.strike) letLoose(world, u);
    if (u.waveT >= WAVE.time) u.waveT = null;
  } else if (u.biteT !== null && u.biteT !== undefined) {
    const before = u.biteT;
    u.biteT += dt;
    if (before < BITE.hit && u.biteT >= BITE.hit) chomp(world, u);
    if (before < BITE.slam && u.biteT >= BITE.slam) tailSlam(world, u);
    if (u.biteT >= BITE.time) u.biteT = null;
  } else if (u.castT > 0) {
    u.castT -= dt;
    if (u.castT <= 0) {
      u.castFlash = 0.28;
      throwCrackers(world, u);
    }
  } else if (t) {
    const dx = t.x - u.x;
    const dy = t.y - u.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (Math.abs(dx) > 3) u.facing = dx > 0 ? 1 : -1;
    const reach = d.reach + t.def.radius * 0.5;
    if (u.waveCd <= 0 && dist <= d.wave.trigger + t.def.radius) {
      u.waveT = 0;
      u.waveAng = Math.atan2(dy / FLAT, dx);
      u.waveCd = WAVE.time + rand(d.wave.cooldown[0], d.wave.cooldown[1]);
      if (world.sfx) world.sfx('magic', u.x);
    } else if (dist <= reach) {
      if (u.cdT <= 0) {
        u.biteT = 0;
        u.bitten = t;
        u.cdT = BITE.time + rand(d.bite.cooldown[0], d.bite.cooldown[1]);
      }
    } else if (u.spellCd <= 0 && dist <= d.spell.range && dist > reach * 1.8) {
      u.castT = d.spell.cast;
      u.spellCd = d.spell.cast + rand(d.spell.cooldown[0], d.spell.cooldown[1]);
    } else {
      u.x += (dx / dist) * speed * dt;
      u.y += (dy / dist) * speed * dt;
      u.moving = true;
    }
  } else world.marchStep(u, dt, speed * 0.85);
  // his feet go round exactly as fast as he is getting along
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
  u.pose = u.target || u.moving ? Math.min(1, u.pose + dt * 6) : Math.max(0, u.pose - dt * 5);
}

export function stepGatorFx(world, dt) {
  stepWaves(world, dt);
  for (const s of world.crackers) {
    if (s.wait > 0) {
      s.wait -= dt;
      continue;
    }
    s.age += dt;
    const m = s.owner.def.spell;
    if (!s.o || s.o.dead) {
      let best = null;
      let bd = 90;
      world.eachEnemyNear(s.side, s.x, s.y, 90, (o) => {
        const dist = Math.hypot(o.x - s.x, o.y - s.y);
        if (dist < bd) {
          bd = dist;
          best = o;
        }
      });
      s.o = best;
    }
    if (s.o) {
      const dx = s.o.x - s.x;
      const dy = s.o.y - 2 - s.y;
      const dist = Math.hypot(dx, dy) || 1;
      // the longer it flies the harder it turns, so it can't circle for ever
      const f = Math.min(1, dt * (4 + s.age * 22));
      s.vx += ((dx / dist) * m.speed - s.vx) * f;
      s.vy += ((dy / dist) * m.speed - s.vy) * f;
    }
    s.trail.push([s.x + rand(-1.6, 1.6), s.y + rand(-1.6, 1.6)]);
    if (s.trail.length > 10) s.trail.shift();
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.spin += dt * 15;
    if ((s.o && Math.hypot(s.o.x - s.x, s.o.y - 2 - s.y) <= s.o.def.radius + 3) || s.age > 1.5) {
      s.dead = true;
      burst(world, s);
    }
  }
  if (world.crackers.some((s) => s.dead)) world.crackers = world.crackers.filter((s) => !s.dead);
  for (const list of [world.fireworks, world.lightWaves, world.lashes]) for (const e of list) e.age += dt;
  for (const e of world.motes) {
    e.age += dt;
    e.x += e.vx * dt;
    e.y += e.vy * dt;
    e.vx *= 0.94;
    e.vy = e.vy * 0.94 + 80 * dt;
  }
  const live = (o) => o.age < o.life;
  for (const key of ['fireworks', 'lightWaves', 'lashes', 'motes']) if (!world[key].every(live)) world[key] = world[key].filter(live);
}

function ring(ctx, x, y, rx, ry, colour, wide) {
  ctx.strokeStyle = colour;
  ctx.lineWidth = wide;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, TAU);
  ctx.stroke();
}

// under the units: the ground his tail has cracked, and the light of the wave racing along it
export function drawGatorGround(ctx, world) {
  ctx.save();
  ctx.lineCap = 'round';
  for (const q of world.lashes) {
    const p = q.age / q.life;
    const out = 1 - (1 - Math.min(1, p * 1.7)) ** 3;
    ctx.strokeStyle = `rgba(92, 70, 52, ${0.6 * (1 - p * p)})`;
    ctx.lineWidth = 1.1;
    for (let i = 0; i < 6; i++) {
      const a = q.seed + (i / 6) * TAU;
      const len = q.r * (0.45 + ((i * 37) % 10) / 28) * Math.min(1, p * 5);
      ctx.beginPath();
      ctx.moveTo(q.x, q.y);
      ctx.lineTo(q.x + Math.cos(a + 0.16) * len * 0.55, q.y + Math.sin(a + 0.16) * len * 0.25);
      ctx.lineTo(q.x + Math.cos(a - 0.06) * len, q.y + Math.sin(a - 0.06) * len * 0.42);
      ctx.stroke();
    }
    ring(ctx, q.cx, q.y, q.r * (0.25 + 0.9 * out), q.r * (0.25 + 0.9 * out) * 0.42, `rgba(80, 150, 230, ${0.85 * (1 - p)})`, 3.2 * (1 - p) + 0.5);
    ring(ctx, q.cx, q.y, q.r * (0.18 + 0.7 * out), q.r * (0.18 + 0.7 * out) * 0.42, `rgba(232, 242, 255, ${0.95 * (1 - p)})`, 1.3);
  }
  for (const w of world.lightWaves) {
    const reach = w.owner.def.wave.reach;
    const r = frontAt(w, reach);
    const fade = w.age < RUN ? 1 : Math.max(0, 1 - (w.age - RUN) / (w.life - RUN));
    // the ground it has crossed stays lit a moment
    ctx.save();
    ctx.translate(w.x, w.y);
    ctx.scale(1, FLAT);
    const lit = ctx.createRadialGradient(0, 0, r * 0.35, 0, 0, r);
    lit.addColorStop(0, 'rgba(150, 205, 255, 0)');
    lit.addColorStop(1, `rgba(120, 190, 255, ${0.34 * fade})`);
    ctx.fillStyle = lit;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, r, w.ang - SPREAD, w.ang + SPREAD);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// over the units: the wall of light, his sparks, where they burst, and the loose ones
export function drawGatorAir(ctx, world) {
  if (!world.lightWaves.length && !world.crackers.length && !world.fireworks.length && !world.motes.length) return;
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const w of world.lightWaves) {
    const reach = w.owner.def.wave.reach;
    const r = frontAt(w, reach);
    const fade = w.age < RUN ? 1 : Math.max(0, 1 - (w.age - RUN) / (w.life - RUN));
    const at = (a, back = 0) => [w.x + Math.cos(a) * (r - back), w.y + Math.sin(a) * (r - back) * FLAT];
    // shafts of light standing up along its front, tallest in the middle
    for (let i = 0; i <= 16; i++) {
      const q = i / 16;
      const a = w.ang - SPREAD + 2 * SPREAD * q;
      const [x, y] = at(a);
      const high = (9 + 22 * Math.sin(q * Math.PI)) * (0.8 + 0.2 * Math.sin(i * 2.7 + w.age * 34)) * fade;
      for (const [colour, wide] of [[`rgba(110, 180, 255, ${0.34 * fade})`, 6.5], [`rgba(255, 255, 255, ${0.9 * fade})`, 2.2]]) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = wide;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y - high);
        ctx.stroke();
      }
    }
    // and the bright front itself, with two fainter ones behind
    for (const [back, k] of [[0, 1], [11, 0.55], [22, 0.28]]) {
      if (r - back < 12) continue;
      for (const [colour, wide] of [[`rgba(80, 150, 235, ${0.75 * fade * k})`, 7], [`rgba(200, 228, 255, ${0.95 * fade * k})`, 4], [`rgba(255, 255, 255, ${fade * k})`, 1.8]]) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = wide;
        ctx.beginPath();
        for (let i = 0; i <= 20; i++) ctx.lineTo(...at(w.ang - SPREAD + (2 * SPREAD * i) / 20, back));
        ctx.stroke();
      }
    }
  }
  // his firework sparks: a crackling tail of blue and silver, and a bright four-pointed head
  for (const s of world.crackers) {
    if (s.wait > 0) continue;
    for (let i = 0; i < s.trail.length; i++) {
      const k = (i + 1) / s.trail.length;
      ctx.fillStyle = i % 2 ? `rgba(60, 140, 240, ${0.85 * k})` : `rgba(168, 182, 206, ${0.9 * k})`;
      ctx.beginPath();
      ctx.arc(s.trail[i][0], s.trail[i][1], 0.5 + 1.7 * k, 0, TAU);
      ctx.fill();
    }
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const a = s.spin + (i / 8) * TAU;
      const r = i % 2 ? 1.8 : 5.4;
      ctx.lineTo(s.x + Math.cos(a) * r, s.y + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = '#eaf6ff';
    ctx.strokeStyle = '#2f74d8';
    ctx.lineWidth = 1.1;
    ctx.fill();
    ctx.stroke();
  }
  // each goes off like a firework: streaks flying out all round, turn about blue and silver, drooping as they fade
  for (const f of world.fireworks) {
    const p = f.age / f.life;
    const out = 1 - (1 - p) ** 3;
    const fade = 1 - p * p;
    if (p < 0.28) {
      ctx.fillStyle = `rgba(226, 242, 255, ${0.95 * (1 - p / 0.28)})`;
      ctx.beginPath();
      ctx.arc(f.x, f.y, 4 + 9 * (p / 0.28), 0, TAU);
      ctx.fill();
    }
    for (let i = 0; i < 14; i++) {
      const a = f.turn + (i / 14) * TAU;
      const far = f.r * (i % 2 ? 0.72 : 1) * out;
      const x = f.x + Math.cos(a) * far;
      const y = f.y + Math.sin(a) * far + 9 * p * p;
      const tail = f.r * 0.34 * (1 - p);
      for (const [colour, wide] of [[i % 2 ? `rgba(58, 128, 226, ${fade})` : `rgba(132, 148, 178, ${fade})`, 2.1], [`rgba(240, 249, 255, ${fade})`, 0.8]]) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = wide;
        ctx.beginPath();
        ctx.moveTo(x - Math.cos(a) * tail, y - Math.sin(a) * tail);
        ctx.lineTo(x, y);
        ctx.stroke();
      }
      ctx.fillStyle = i % 2 ? `rgba(84, 160, 255, ${fade})` : `rgba(206, 218, 240, ${fade})`;
      ctx.beginPath();
      ctx.arc(x, y, 1.3 * (1 - p * 0.5), 0, TAU);
      ctx.fill();
    }
  }
  for (const e of world.motes) {
    const fade = Math.max(0, 1 - (e.age / e.life) ** 2);
    ctx.strokeStyle = e.blue ? `rgba(52, 126, 230, ${fade})` : `rgba(140, 156, 188, ${fade})`;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(e.x - e.vx * 0.024, e.y - e.vy * 0.024);
    ctx.lineTo(e.x, e.y);
    ctx.stroke();
  }
  ctx.restore();
}
