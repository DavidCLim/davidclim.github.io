// Gibbondore The Great: what he looks like and how he moves.
// Built the way the original's ape is built (knuckles to the ground, a high hunched back with a paler saddle, the head
// carried low and forward, long arms, short bent legs), but a gibbon: leaner, longer in the arm, with a white ruff
// round a dark face and white hands and feet. Over that, a wizard's hat, cloak and staff.
// Drawn in art units, facing +x, with the ground about 28 below the origin. His limbs are drawn live, from where his
// hands and feet are, so they can move smoothly through any pose.
import { TAU, K, FEET } from './config.js?v=243';
import { makeLayer, drawLayer, OUT } from './sprites.js?v=243';
import { rigStep, applyBotBody, applyBotCap, stepDust } from './botrig.js?v=243';

const C = {
  fur: '#54403a', furDark: '#382a27', furFar: '#33272a', saddle: '#8a766c', white: '#f4eddf', whiteShade: '#cfc3ae',
  skin: '#4d353a', cloak: '#5d2f8c', cloakDark: '#3f1f63', lining: '#9a3260', gold: '#f3bf37', goldLite: '#ffe58a',
  wood: '#8f5f2e', woodDark: '#65401d',
};

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

const oval = (g, fill, lw, x, y, rx, ry, turn = 0) => shape(g, fill, lw, () => g.ellipse(x, y, rx, ry, turn, 0, TAU));

function star(g, x, y, r, fill) {
  shape(g, fill, 0, () => {
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * TAU - Math.PI / 2;
      const k = i % 2 ? r * 0.45 : r;
      if (i) g.lineTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
      else g.moveTo(x + Math.cos(a) * k, y + Math.sin(a) * k);
    }
  });
}

// ---------------------------------------------------------------- the parts that keep their shape
// the high hunched back and deep chest
function drawBody(g) {
  const outline = () => {
    g.moveTo(-23, 9);
    g.bezierCurveTo(-24, -5, -12, -18, 4, -19);
    g.bezierCurveTo(15, -20, 21, -11, 18, -2);
    g.bezierCurveTo(15, 6, 6, 8, 1, 11);
    g.bezierCurveTo(-5, 19, -21, 21, -23, 9);
  };
  const gr = g.createLinearGradient(0, -20, 0, 19);
  gr.addColorStop(0, C.fur);
  gr.addColorStop(1, C.furDark);
  shape(g, gr, 0, outline);
  g.save();
  g.beginPath();
  outline();
  g.clip();
  oval(g, C.saddle, 0, -9, -12, 15, 9, -0.5);
  oval(g, 'rgba(190, 170, 158, 0.28)', 0, 11, -1, 8, 10, 0.2);
  g.restore();
  g.strokeStyle = OUT;
  g.lineWidth = 1.9;
  g.beginPath();
  outline();
  g.closePath();
  g.stroke();
}

// origin at the middle of his head. `mouth` 0..1 how far open
export function drawGibbonFace(g, o) {
  // ear
  oval(g, C.skin, 1.5, -9.6, 0.5, 3.4, 4, -0.2);
  oval(g, C.fur, 1.8, 0, 0, 11.6, 11);
  // the white ruff every gibbon wears round its face
  shape(g, C.white, 1.5, () => {
    g.moveTo(-3.6, -1);
    g.bezierCurveTo(-5.4, -9.4, 3, -10.4, 5.4, -6.4);
    g.bezierCurveTo(8, -10.4, 15, -8, 13.4, -1.2);
    g.bezierCurveTo(16, 6, 10.4, 12, 5, 11.4);
    g.bezierCurveTo(-1, 12.4, -6.2, 6.4, -3.6, -1);
  });
  // the dark face inside it
  shape(g, C.skin, 1.1, () => {
    g.moveTo(-0.6, -1.6);
    g.bezierCurveTo(-0.6, -6.6, 4.4, -6.6, 5.4, -3.6);
    g.bezierCurveTo(6.8, -6.8, 11.8, -5.8, 11.2, -0.8);
    g.bezierCurveTo(13.6, 4.6, 9.4, 8.8, 5.4, 8.6);
    g.bezierCurveTo(1, 8.8, -2.2, 4.2, -0.6, -1.6);
  });
  const open = o.mouth || 0;
  for (const x of [2.4, 8.4]) {
    if (o.dead) {
      g.strokeStyle = C.white;
      g.lineWidth = 1.1;
      g.beginPath();
      g.moveTo(x - 1.6, -3.4);
      g.lineTo(x + 1.6, -0.2);
      g.moveTo(x + 1.6, -3.4);
      g.lineTo(x - 1.6, -0.2);
      g.stroke();
      continue;
    }
    if (o.happy || o.shut > 0.6) {
      g.strokeStyle = C.white;
      g.lineWidth = 1.4;
      g.lineCap = 'round';
      g.beginPath();
      if (o.happy) g.arc(x, -0.8, 2, Math.PI * 1.12, Math.PI * 1.88);
      else g.arc(x, -2.8, 2, Math.PI * 0.18, Math.PI * 0.82);
      g.stroke();
      continue;
    }
    oval(g, '#ffffff', 0.9, x, -1.7, 2.35, 2.6 * (1 - (o.shut || 0)));
    oval(g, '#c9801c', 0, x + o.lx * 0.7, -1.7 + o.ly * 0.6, 1.5, 1.6 * (1 - (o.shut || 0)));
    oval(g, OUT, 0, x + o.lx * 0.85, -1.7 + o.ly * 0.75, 0.85, 0.95 * (1 - (o.shut || 0)));
    if (o.angry) {
      g.strokeStyle = OUT;
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(x - 2.6, x < 5 ? -5.2 : -3.8);
      g.lineTo(x + 2.6, x < 5 ? -3.8 : -5.2);
      g.stroke();
    }
  }
  // nose
  oval(g, '#2a1b20', 0, 5.7, 2.4, 2, 1.3);
  if (open > 0.12) {
    oval(g, '#2a1218', 1, 5.7, 5.6, 2.2 + open * 0.8, 0.8 + open * 2.6);
  } else {
    g.strokeStyle = '#241419';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(2.6, 5.4);
    g.quadraticCurveTo(5.8, 7, 9, 5.2);
    g.stroke();
  }
}

// a tall bent hat with a wide brim, in royal purple with a gold band and stars. Origin: where the head's middle is
function drawHat(g) {
  g.lineJoin = 'round';
  // the cone, its point flopping over backwards
  const gr = g.createLinearGradient(-12, -36, 10, -10);
  gr.addColorStop(0, C.cloakDark);
  gr.addColorStop(1, C.cloak);
  shape(g, gr, 1.7, () => {
    g.moveTo(-10.5, -9);
    g.bezierCurveTo(-8, -20, -5, -29, -2, -34);
    g.bezierCurveTo(-7, -35, -13, -33, -18, -27);
    g.bezierCurveTo(-15, -38, -5, -43, 3, -36);
    g.bezierCurveTo(6, -27, 9, -18, 11.5, -10);
  });
  shape(g, C.gold, 1.2, () => {
    g.moveTo(-10, -11.4);
    g.quadraticCurveTo(1, -13.6, 11.4, -12.2);
    g.lineTo(9.8, -16.4);
    g.quadraticCurveTo(0, -17.8, -8.8, -15.6);
  });
  oval(g, C.cloak, 1.7, 1, -9.2, 18.5, 3.9, 0.04);
  star(g, 1.6, -23, 3.6, C.goldLite);
  star(g, -5.4, -33, 2.2, C.goldLite);
  star(g, 6.2, -20.6, 1.5, C.goldLite);
}

export function drawGibbonHatDrop(g) {
  g.save();
  g.scale(0.62, 0.62);
  g.translate(2, 24);
  drawHat(g);
  g.restore();
}

// a gnarled staff with a crooked head holding a golden orb. Origin: where he grips it; it runs 26 below and 40 above
function drawStaff(g) {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const wood = () => {
    g.beginPath();
    g.moveTo(0.6, 25);
    g.quadraticCurveTo(-2, 10, 0, 0);
    g.quadraticCurveTo(2.4, -14, -0.6, -25);
    g.quadraticCurveTo(-2, -31, -1, -33);
    g.bezierCurveTo(-8, -37, -7.4, -48, 1.4, -48.4);
    g.bezierCurveTo(7, -48.4, 9.6, -43, 7.4, -39);
  };
  for (const [col, wide] of [[OUT, 6], [C.wood, 3.6]]) {
    g.strokeStyle = col;
    g.lineWidth = wide;
    wood();
    g.stroke();
  }
  g.strokeStyle = C.woodDark;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-0.8, 14);
  g.quadraticCurveTo(0.6, 6, 0.4, -2);
  g.stroke();
  // a knot and a gold collar
  oval(g, C.woodDark, 1.2, 1, -17, 2.4, 3);
  shape(g, C.gold, 1.1, () => g.rect(-3.4, -32.6, 6, 3.2));
  const orb = g.createRadialGradient(-0.4, -42.6, 0.4, 1, -41, 6);
  orb.addColorStop(0, '#fffbe0');
  orb.addColorStop(0.5, '#ffd23c');
  orb.addColorStop(1, '#e58a12');
  oval(g, orb, 1.4, 1, -41, 5.4, 5.4);
}
const ORB_AT = [1, -41];

export function buildGibbonArt() {
  return {
    body: makeLayer(-27, -23, 25, 24, drawBody),
    hat: makeLayer(-22, -46, 23, -3, drawHat),
    staff: makeLayer(-11, -52, 13, 29, drawStaff),
  };
}

// ---------------------------------------------------------------- the parts drawn live
// where an elbow or knee goes, given both ends and how long each half is; `bend` picks which way it sticks out
function joint(a, b, len, bend) {
  const mx = (a[0] + b[0]) / 2;
  const my = (a[1] + b[1]) / 2;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const d = Math.hypot(dx, dy) || 1;
  const out = Math.sqrt(Math.max(0, len * len - (d / 2) * (d / 2)));
  return [mx - (dy / d) * out * bend, my + (dx / d) * out * bend];
}

// a limb as one smooth furry shape through three points, thick at the top
function limb(g, a, m, b, widths, fill) {
  const pts = [a, m, b];
  const path = (extra) => {
    for (let i = 0; i < 2; i++) {
      const [x0, y0] = pts[i];
      const [x1, y1] = pts[i + 1];
      const r0 = widths[i] + extra;
      const r1 = widths[i + 1] + extra;
      const an = Math.atan2(y1 - y0, x1 - x0);
      g.moveTo(x0 + Math.cos(an + Math.PI / 2) * r0, y0 + Math.sin(an + Math.PI / 2) * r0);
      g.lineTo(x1 + Math.cos(an + Math.PI / 2) * r1, y1 + Math.sin(an + Math.PI / 2) * r1);
      g.arc(x1, y1, r1, an + Math.PI / 2, an - Math.PI / 2, true);
      g.lineTo(x0 + Math.cos(an - Math.PI / 2) * r0, y0 + Math.sin(an - Math.PI / 2) * r0);
      g.arc(x0, y0, r0, an - Math.PI / 2, an + Math.PI / 2, true);
      g.closePath();
    }
  };
  // the outline goes down first and the fur over it, so no line is left across the joint
  g.fillStyle = OUT;
  g.beginPath();
  path(1.5);
  g.fill();
  g.fillStyle = fill;
  g.beginPath();
  path(0);
  g.fill();
}

// a long white hand, knuckles under, its fingers curled the way the arm is going
function hand(g, x, y, from, far) {
  const an = Math.atan2(y - from[1], x - from[0]);
  g.save();
  g.translate(x, y);
  g.rotate(Math.max(-1.1, Math.min(1.1, an - Math.PI / 2)));
  oval(g, far ? C.whiteShade : C.white, 1.5, 1.8, 0.8, 6.2, 4.3);
  g.strokeStyle = OUT;
  g.lineWidth = 0.9;
  g.beginPath();
  for (const dx of [2.6, 5]) {
    g.moveTo(dx, 1.6);
    g.lineTo(dx + 0.8, 4.4);
  }
  g.stroke();
  g.restore();
}

function arm(g, shoulder, wrist, far, bend = 1) {
  const elbow = joint(shoulder, wrist, bend > 0 ? 22 : 13, bend);
  limb(g, shoulder, elbow, wrist, far ? [5.6, 4.2, 3.2] : [7, 5, 3.6], far ? C.furFar : C.fur);
  hand(g, wrist[0], wrist[1], elbow, far);
}

function leg(g, hip, foot, far) {
  const knee = joint(hip, foot, 12, -1);
  limb(g, hip, knee, foot, far ? [6.4, 4.4, 2.8] : [7.6, 5, 3.1], far ? C.furFar : C.fur);
  oval(g, far ? C.whiteShade : C.white, 1.4, foot[0] + 3, foot[1] + 0.8, 5.6, 2.9, 0.05);
}

// the cloak over his back, gold at the hem; `sweep` carries it out behind, `wave` ripples it
function cloak(g, sweep, wave) {
  const tx = -33 - sweep * 13;
  const ty = 17 - sweep * 20 + wave * 3;
  const hem = () => {
    g.moveTo(tx, ty);
    g.quadraticCurveTo(tx + 6, ty + 5 - sweep * 3 + wave * 2, -22 - sweep * 6, 21 - sweep * 8 - wave * 2);
    g.quadraticCurveTo(-16 - sweep * 3, 16 - sweep * 3 + wave * 2, -9, 16);
  };
  const gr = g.createLinearGradient(0, -20, -20, 20);
  gr.addColorStop(0, C.cloak);
  gr.addColorStop(1, C.cloakDark);
  shape(g, gr, 1.7, () => {
    hem();
    g.bezierCurveTo(-8, 4, 2, -5, 14, -9);
    g.bezierCurveTo(10, -19, -2, -23, -10, -19);
    g.bezierCurveTo(-23 - sweep * 4, -14 - sweep * 5, -23 - sweep * 9 + wave * 2, 4 - sweep * 9, tx, ty);
  });
  shape(g, C.lining, 0, () => {
    g.moveTo(tx, ty);
    g.quadraticCurveTo(-25 - sweep * 8, 6 - sweep * 10 + wave * 2, -17 - sweep * 2, 1);
    g.quadraticCurveTo(-21 - sweep * 5, 13 - sweep * 6, -22 - sweep * 6, 21 - sweep * 8 - wave * 2);
    g.quadraticCurveTo(tx + 6, ty + 5 - sweep * 3 + wave * 2, tx, ty);
  });
  g.lineCap = 'round';
  for (const [col, wide] of [[OUT, 4.6], [C.gold, 2.4]]) {
    g.strokeStyle = col;
    g.lineWidth = wide;
    g.beginPath();
    hem();
    g.stroke();
  }
  star(g, -15 - sweep * 3, -7 - sweep * 2 + wave * 0.6, 2.8, C.goldLite);
  star(g, -22 - sweep * 6, 9 - sweep * 9 + wave * 1.4, 2, C.goldLite);
  star(g, -4, -13, 1.6, C.goldLite);
}

// the clasp that holds it
function clasp(g) {
  oval(g, C.gold, 1.4, 12.5, -9, 3.4, 3.4);
  oval(g, '#c2386b', 0.9, 12.5, -9, 1.6, 1.6);
}

// ---------------------------------------------------------------- poses
// nw / fw: near and far wrist, nf / ff: near and far foot, staff: its tilt (0 upright, + forward),
// lean: the whole upper body about the hips, head: its nod (+ down), mouth: 0..1
const REST = { nwx: 38, nwy: 5, fwx: 8, fwy: 24, nfx: -12, nfy: 25.5, ffx: -2, ffy: 25, staff: 0.07, lean: 0, head: 0, mouth: 0 };
const POSES = {
  // the staff and both fists swung up over his head...
  raise: { nwx: 13, nwy: -45, fwx: -1, fwy: -43, staff: -0.95, lean: -0.27, head: -0.16, mouth: 0.8 },
  // ...and brought down on the ground
  slam: { nwx: 33, nwy: 13, fwx: 26, fwy: 22, staff: 1.78, lean: 0.27, head: 0.14, mouth: 0.45 },
  leap: { nwx: 29, nwy: -33, fwx: -22, fwy: -29, nfx: -22, nfy: 15, ffx: -9, ffy: 20, staff: 0.55, lean: 0.13, head: -0.05, mouth: 0.6 },
  draw: { nwx: 4, nwy: -30, fwx: -19, fwy: -2, staff: -0.75, lean: -0.17, head: -0.1, mouth: 0.15 },
  cast: { nwx: 36, nwy: -11, fwx: -21, fwy: -13, staff: 1.12, lean: 0.12, head: 0.04, mouth: 0.65 },
  cheer: { nwx: 17, nwy: -46, fwx: -21, fwy: -38, staff: 0, lean: -0.08, head: -0.14, mouth: 0.9 },
};
const STIFF = { calm: [230, 21], snap: [620, 35] };

function posed(u, R, dead, t) {
  const d = u.def;
  let want = { ...REST };
  let snap = false;
  if (R.move > 0.05 && !dead) {
    // knuckle-walking: the free arm and the staff arm take turns, the feet going the opposite way
    const a = R.phase;
    const k = R.move;
    want.fwx += -Math.cos(a) * 12 * k;
    want.fwy += -Math.max(0, Math.sin(a)) * 11 * k;
    want.nwx += Math.cos(a) * 8 * k;
    want.nwy += -Math.max(0, -Math.sin(a)) * 8 * k;
    want.staff += Math.cos(a) * 0.2 * k;
    want.ffx += Math.cos(a) * 8 * k;
    want.ffy += -Math.max(0, -Math.sin(a)) * 6 * k;
    want.nfx += -Math.cos(a) * 8 * k;
    want.nfy += -Math.max(0, Math.sin(a)) * 6 * k;
    want.head += Math.sin(a * 2) * 0.07 * k;
  }
  if (!dead) {
    if (u.leap) {
      want = { ...want, ...POSES.leap };
      // coming down, he hauls the staff back to strike
      if (u.leap.t / d.leap.time > 0.62) want = { ...want, ...POSES.raise, nfx: -18, nfy: 18, ffx: -5, ffy: 21 };
      snap = true;
    } else if (u.landT > 0.08) {
      want = { ...want, ...POSES.slam };
      snap = true;
    } else if (u.slamT > 0) {
      want = { ...want, ...(u.slamT > d.slam.time * 0.48 ? POSES.raise : POSES.slam) };
      snap = true;
    } else if (u.castT > 0) want = { ...want, ...POSES.draw };
    else if (u.castFlash > 0) {
      want = { ...want, ...POSES.cast };
      snap = true;
    } else if (R.happy) want = { ...want, ...POSES.cheer };
    else if (R.fidget === 'scratch' && R.q < 0.88) {
      // a good scratch behind the ear
      want = { ...want, fwx: 8 + Math.sin(t * 24) * 2.2, fwy: -21 + Math.cos(t * 24) * 1.8, head: 0.2, lean: -0.05 };
    } else if (R.fidget === 'twirl') {
      want = { ...want, nwx: 40, nwy: -10, staff: 0.07 + R.q * TAU * 2 };
      snap = true;
    } else if (R.fidget === 'hoot') {
      // gibbons sing
      const swell = Math.sin(R.q * Math.PI);
      want = { ...want, head: -0.38 * swell, mouth: swell * (0.65 + 0.35 * Math.abs(Math.sin(t * 13))), lean: -0.1 * swell, fwx: 8 - 12 * swell, fwy: 24 - 18 * swell };
    }
  }
  if (dead) return { ...REST, mouth: 0.3, nwy: 12, staff: 0.9 };
  let s = u.gib;
  const dt = Math.min(0.05, Math.max(0, u.breath - (s ? s.at : u.breath)));
  if (!s) {
    s = u.gib = { at: u.breath, p: {} };
    for (const k in REST) s.p[k] = { x: REST[k], v: 0 };
  }
  s.at = u.breath;
  const [stiff, damp] = snap ? STIFF.snap : STIFF.calm;
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  const out = {};
  for (const k in REST) {
    const p = s.p[k];
    // (a twirl is a full turn or two: when it ends, unwind to the same angle rather than spin back)
    if (k === 'staff' && Math.abs(p.x - want[k]) > Math.PI * 1.5) p.x -= Math.round((p.x - want[k]) / TAU) * TAU;
    for (let i = 0; i < steps; i++) {
      p.v += ((want[k] - p.x) * stiff - p.v * damp) * h;
      p.x += p.v * h;
    }
    out[k] = p.x;
  }
  return out;
}

// the whole of him, in art units about his middle. `live` is left out for the menu picture
function paint(g, A, P, face, live) {
  const art = (fn) => {
    g.save();
    g.scale(K, K);
    fn();
    g.restore();
  };
  // the top half turns about his hips
  const upper = (fn) => {
    g.save();
    g.translate(-12 * K, 10 * K);
    g.rotate(P.lean);
    g.translate(12 * K, -10 * K);
    fn();
    g.restore();
  };
  // a point on the upper body, after it has turned
  const turned = (x, y) => {
    const c = Math.cos(P.lean);
    const s = Math.sin(P.lean);
    return [-12 + (x + 12) * c - (y - 10) * s, 10 + (x + 12) * s + (y - 10) * c];
  };
  const farWrist = [P.fwx, P.fwy];
  const nearWrist = [P.nwx, P.nwy];
  art(() => {
    leg(g, [-8, 11], [P.ffx, P.ffy], true);
    if (!(live && live.farFront)) arm(g, turned(3, -9), farWrist, true);
  });
  upper(() => drawLayer(g, A.body));
  art(() => leg(g, [-13, 12], [P.nfx, P.nfy], false));
  upper(() => {
    art(() => cloak(g, live ? live.sweep : 0.1, live ? live.wave : 0));
    // head, and the hat riding its own spring on top
    g.save();
    g.translate(18 * K, -18 * K);
    g.rotate(P.head);
    art(() => drawGibbonFace(g, face));
    g.save();
    g.translate(0, -2 * K);
    if (live) applyBotCap(g, { cap: live.cap, capRot: live.capRot });
    drawLayer(g, A.hat);
    g.restore();
    g.restore();
    art(() => clasp(g));
  });
  // the staff, then the hand that holds it
  g.save();
  g.translate(nearWrist[0] * K, nearWrist[1] * K);
  g.rotate(P.staff);
  if (live && live.power > 0.02) live.orb(g, ORB_AT[0], ORB_AT[1]);
  drawLayer(g, A.staff);
  if (live && live.power > 0.02) live.shine(g, ORB_AT[0], ORB_AT[1]);
  g.restore();
  art(() => arm(g, turned(8, -8), nearWrist, false));
  // (a hand up scratching his head has to come round in front of it)
  if (live && live.farFront) art(() => arm(g, turned(1, -10), farWrist, false, -1));
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

export function drawGibbonStill(g, A) {
  paint(g, A, REST, { lx: 0.7, ly: 0.2, mouth: 0 }, null);
}

// `overlay(ctx, u, rx, ry, cx, cy)` paints burning / frozen / poisoned tints
export function drawGibbondore(ctx, dpr, sprites, u, overlay) {
  const A = sprites.gibbondore;
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const alt = dead ? 0 : u.alt || 0;
  const busy = !!u.leap || u.slamT > 0 || u.castT > 0 || u.landT > 0;
  const R = rigStep(u, {
    age, dead, moving: u.moving && !dead, alt,
    bang: u.castFlash > 0 ? 1 : 0,
    kick: 0.45,
    cadence: 1.8,
    calm: !u.target && !u.moving,
    busy,
    fidgets: ['look', 'scratch', 'scratch', 'twirl', 'hoot', 'hops'],
    aim: {},
  });
  const P = posed(u, R, dead, t);

  const wobble = u.hit > 0.14 ? (Math.random() - 0.5) * 1.4 : 0;
  ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  if (u.tilt) {
    ctx.translate(0, FEET);
    ctx.rotate(u.tilt);
    ctx.translate(0, -FEET);
  }
  // his shadow stays on the ground, shrinking while he is in the air
  if (!dead) {
    ctx.save();
    ctx.translate(1, FEET + 1.4);
    ctx.scale(1, 0.28);
    const r = 31 * K * d.scale * (1 - alt * 0.35);
    glow(ctx, 0, 0, r, '0, 0, 0', 0.46 - alt * 0.22);
    ctx.restore();
  }
  // ground effects of what he is up to: gold light gathering as he rears up or winds a spell
  const gather = !dead && u.castT > 0 ? 1 - u.castT / d.spell.cast : !dead && u.slamT > d.slam.time * 0.48 ? (d.slam.time - u.slamT) / (d.slam.time * 0.52) : 0;
  if (gather > 0) {
    for (let i = 0; i < 2; i++) {
      const q = (t * 2.2 + i / 2) % 1;
      ctx.strokeStyle = `rgba(240, 175, 35, ${0.8 * q * gather})`;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(0, FEET + 1, 30 - 19 * q, (30 - 19 * q) * 0.34, 0, 0, TAU);
      ctx.stroke();
    }
  }
  if (!dead) stepDust(ctx, R, 1.2);

  const fall = age < 0.28 ? age / 0.28 : 0;
  if (age < 0.28) ctx.translate(0, -46 * (1 - fall ** 2));
  if (alt > 0.01) ctx.translate(0, -alt * d.leap.height);
  ctx.translate(0, FEET);
  ctx.scale(d.scale * (1 - 0.08 * fall), d.scale * (1 + 0.14 * fall));
  ctx.translate(0, -FEET);
  applyBotBody(ctx, R);

  const blink = t % 3.6;
  let shut = !busy && blink < 0.15 ? Math.sin((blink / 0.15) * Math.PI) : 0;
  if (R.fidget === 'scratch' || R.fidget === 'hoot') shut = 1;
  const look = u.target ? [1, 0.2] : R.fidget === 'look' ? [Math.sin(R.q * TAU) * 1.4, -0.2] : [Math.sin(t * 0.8) * 0.8, Math.sin(t * 1.5) * 0.5];
  const power = dead ? 0 : u.castT > 0 ? 1 - u.castT / d.spell.cast : u.castFlash > 0 ? u.castFlash / 0.28 : u.slamT > 0 || u.leap ? 0.8 : 0.16 + 0.06 * Math.sin(t * 3);
  paint(ctx, A, P, { lx: look[0], ly: look[1], shut, happy: R.happy, angry: busy && !R.happy, mouth: Math.max(0, Math.min(1, P.mouth)), dead }, {
    sweep: dead ? 0 : Math.max(0.1 + Math.sin(t * 1.9) * 0.1, R.move * 0.7 + Math.sin(R.phase) * 0.08 * R.move, alt, busy ? 0.5 : 0),
    wave: dead ? 0 : Math.sin(t * (R.move > 0.3 || busy ? 11 : 2.6)),
    cap: R.cap * 0.8,
    capRot: R.capRot,
    power,
    farFront: !dead && P.fwy < -12 && R.fidget === 'scratch',
    orb: (g, x, y) => glow(g, x * K, y * K, (11 + 15 * power) * K, '255, 190, 40', 0.45 + 0.4 * power),
    shine: (g, x, y) => {
      if (power < 0.3) return;
      g.fillStyle = `rgba(255, 250, 215, ${power})`;
      g.beginPath();
      for (let i = 0; i < 8; i++) {
        const a = t * 4 + (i / 8) * TAU;
        const r = (i % 2 ? 1.8 : 7 + 7 * power) * K;
        if (i) g.lineTo(x * K + Math.cos(a) * r, y * K + Math.sin(a) * r);
        else g.moveTo(x * K + Math.cos(a) * r, y * K + Math.sin(a) * r);
      }
      g.closePath();
      g.fill();
    },
  });
  // his song rings out
  if (R.fidget === 'hoot') {
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const q = (R.q * 3 + i / 3) % 1;
      ctx.strokeStyle = `rgba(200, 140, 40, ${0.85 * (1 - q) * Math.sin(R.q * Math.PI)})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(30 * K, -19 * K, (6 + 24 * q) * K, -1.1, 0.5);
      ctx.stroke();
    }
  }
  if (overlay) overlay(ctx, u, d.body[0] * K, d.body[1] * K, 0, d.body[2] * K);
  // he takes a lot of knocks, so a soft flash rather than turning solid white
  if (!dead && u.hit > 0) glow(ctx, 2 * K, -9 * K, 32 * K, '240, 246, 255', Math.min(0.75, u.hit * 3.8));
}
