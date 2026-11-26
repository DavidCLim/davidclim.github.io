// The Robot Juggernaut's skeleton. Every limb is its own piece hung on joints: a pelvis, a torso that twists and leans
// on it, a head, two arms (shoulder, elbow, wrist, with the axe turning in its own grip and the talons opening), and two
// legs whose knees are solved so the boots stay planted while the body moves. Hydraulic pistons stretch across the
// joints. Positions are in the juggernaut's own art units (facing right); angles are radians, clockwise on screen.
import { TAU, K } from './config.js?v=209';
import { drawLayer } from './sprites.js?v=209';

export const JS = 0.168; // reference px to art units
// a point on the 960px reference the parts were drawn from, mirrored so the axe leads
export const A = (x, y) => [-(x - 500) * JS, (y - 795) * JS + 28];

const J = {
  waist: A(570, 482),
  hips: A(552, 540),
  neck: A(492, 400),
  axeS: A(374, 384), axeE: A(280, 478), axeW: A(223, 574),
  clawS: A(772, 396), clawE: A(792, 488), clawW: A(802, 646),
  talon: [A(750, 668), A(802, 676), A(852, 668)],
  hipA: A(468, 534), kneeA: A(380, 632), ankleA: A(408, 722),
  hipB: A(598, 534), kneeB: A(712, 628), ankleB: A(706, 718),
  tassetA: A(440, 510), tassetC: A(588, 614), tassetB: A(676, 512),
};
const POINTS = {
  eye: A(478, 418),
  vent: A(605, 442),
  stacks: [A(614, 62), A(658, 56), A(695, 82)],
  back: [A(704, 150), A(780, 250), A(750, 400)],
  blade: A(56, 480), // the honed edge
  bladeIn: A(190, 440),
  clawTip: A(790, 770),
};
const MUZZLE_REST = [J.axeE[0] + (J.axeW[0] - J.axeE[0]) * 1.34, J.axeE[1] + (J.axeW[1] - J.axeE[1]) * 1.34];

const rotate = (x, y, a) => [x * Math.cos(a) - y * Math.sin(a), x * Math.sin(a) + y * Math.cos(a)];
// a placed part: its joint `rest` now sits at `pos`, turned by `rot`
const part = (rest, pos, rot) => ({ rest, pos, rot });
const place = (T, p) => {
  let dx = p[0] - T.rest[0];
  let dy = p[1] - T.rest[1];
  if (T.stretch) {
    const [along, across] = rotate(dx, dy, -T.axis);
    [dx, dy] = rotate(along * T.stretch, across, T.axis);
  }
  const [x, y] = rotate(dx, dy, T.rot);
  return [T.pos[0] + x, T.pos[1] + y];
};
const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
const lerp = (a, b, q) => a + (b - a) * q;
const mix = (a, b, q) => a.map((v, i) => lerp(v, b[i], q));
const clamp01 = (v) => Math.max(0, Math.min(1, v));
const smooth = (q) => q * q * (3 - 2 * q);

// he stands tall on long legs: the whole upper body rides this much higher than on the reference, and the thighs and
// shins are stretched along their length to match
const LIFT = 11;
const LEG = 1.25;

// where the knee goes, given the hip and the ankle; it bends toward `side` (+1 forward, -1 back)
function knee(hip, ankle, l1, l2, side) {
  const dx = ankle[0] - hip[0];
  const dy = ankle[1] - hip[1];
  const d = Math.max(Math.abs(l1 - l2) + 0.01, Math.min(l1 + l2 - 0.01, Math.hypot(dx, dy)));
  const base = Math.atan2(dy, dx);
  const bend = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d))));
  const one = [hip[0] + Math.cos(base + bend) * l1, hip[1] + Math.sin(base + bend) * l1];
  const two = [hip[0] + Math.cos(base - bend) * l1, hip[1] + Math.sin(base - bend) * l1];
  return one[0] * side > two[0] * side ? one : two;
}
const angleOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
// a leg bone laid from `from` to `to`, stretched along its own axis
const bone = (restA, restB, from, to) => ({ rest: restA, pos: from, rot: angleOf(from, to) - angleOf(restA, restB), axis: angleOf(restA, restB), stretch: LEG });
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]);

export function restPose() {
  return {
    pelvis: { x: 0, y: 0, rot: 0 },
    torso: { x: 0, y: 0, rot: 0 },
    head: { x: 0, y: 0, rot: 0 },
    axe: [0, 0, 0], // shoulder, elbow, wrist
    axeShift: [0, 0],
    claw: [0, 0, 0],
    clawShift: [0, 0],
    open: 0, // the talons: spread (+) or clenched (-)
    clawFront: false,
    footA: [0, 0, 0], // x, y, tilt
    footB: [0, 0, 0],
    tasset: [0, 0, 0],
  };
}

// ---------------------------------------------------------------- the arm keyframes
const AXE = {
  raised: [-1.3, -1.15, 0.5],
  impact: [0, -0.45, 1.2],
  trail: [-0.28, -0.5, 1.05], // charging, he levels it ahead of him like a ram
  spin: [-0.7, -0.45, 1.55],
  aim: [-0.35, -0.35, 2.95], // the axe flips right round in his grip to clear the gun
  roar: [-0.85, -0.4, 0.55],
};

// The overhead chop, as a whip: the shoulder leads, then the elbow, then the wrist snaps the head down.
export function axeSwing(d, s) {
  const strike = 0.13;
  if (s <= 0) return [0, 0, 0];
  if (s < d.windup - strike) {
    const q = s / (d.windup - strike);
    const out = (v) => 1 - (1 - clamp01(v)) ** 2.4;
    return [AXE.raised[0] * out(q * 1.2), AXE.raised[1] * out(q * 1.1 - 0.04), AXE.raised[2] * smooth(clamp01((q - 0.18) / 0.82))];
  }
  if (s < d.windup) {
    const p = (s - (d.windup - strike)) / strike;
    const at = (i, v) => lerp(AXE.raised[i], AXE.impact[i], clamp01(v) ** 1.5);
    return [at(0, p * 1.5), at(1, (p - 0.15) * 1.4), at(2, (p - 0.3) * 1.43)];
  }
  const after = (s - d.windup) / d.recover;
  if (after < 0.45) {
    const bounce = Math.sin(Math.min(1, after / 0.2) * Math.PI);
    return [AXE.impact[0], AXE.impact[1] - 0.13 * bounce, AXE.impact[2] - 0.2 * bounce];
  }
  return mix(AXE.impact, [0, 0, 0], smooth((after - 0.45) / 0.55));
}

// the claw swipe: drawn back with the talons wide, thrown across the front, snapped shut
export function clawSwing(c, s) {
  const back = { claw: [0.62, 0.38, 0.22], shift: [-9, -4], open: 0.6, twist: -0.11, lunge: -3 };
  const out = { claw: [-1.12, -0.5, -0.28], shift: [46, -7], open: 0.2, twist: 0.2, lunge: 7 };
  const rest = { claw: [0, 0, 0], shift: [0, 0], open: 0, twist: 0, lunge: 0 };
  const blend = (a, b, q) => ({ claw: mix(a.claw, b.claw, q), shift: mix(a.shift, b.shift, q), open: lerp(a.open, b.open, q), twist: lerp(a.twist, b.twist, q), lunge: lerp(a.lunge, b.lunge, q) });
  if (s < c.windup - 0.11) return blend(rest, back, 1 - (1 - s / (c.windup - 0.11)) ** 2);
  if (s < c.windup) return blend(back, out, ((s - (c.windup - 0.11)) / 0.11) ** 1.6);
  const after = (s - c.windup) / c.recover;
  if (after < 0.38) return { ...out, open: lerp(out.open, -0.42, clamp01(after / 0.12)) };
  return blend({ ...out, open: -0.42 }, rest, smooth((after - 0.38) / 0.62));
}

// ---------------------------------------------------------------- walking
// one foot's path through a stride: planted and sliding back, then lifted and swung forward
function stride(p) {
  const phase = ((p % 1) + 1) % 1;
  if (phase < 0.58) return [11 * (0.5 - phase / 0.58), 0, 0];
  const q = (phase - 0.58) / 0.42;
  return [11 * (-0.5 + smooth(q)), -Math.sin(q * Math.PI) * 10, -Math.sin(q * Math.PI) * 0.28];
}

export function walkInto(pose, anim, amount = 1) {
  const c = (anim * 0.52) / TAU; // a foot comes down at c = 0 and again at c = 0.5
  const sw = Math.sin(c * TAU);
  pose.footA = stride(c).map((v) => v * amount);
  pose.footB = stride(c + 0.5).map((v) => v * amount);
  // the hips sink as the weight lands on a foot and rise as he passes over it
  const dip = (3.6 * Math.cos(c * TAU) ** 2 - 1.2) * amount;
  pose.pelvis.y += dip;
  pose.pelvis.x += sw * 1.4 * amount;
  pose.pelvis.rot += sw * 0.045 * amount;
  pose.torso.y += Math.cos(c * TAU * 2 - 0.9) * 0.9 * amount;
  pose.torso.rot += (0.045 + sw * 0.05) * amount;
  pose.head.rot -= sw * 0.04 * amount;
  const arm = (lag) => Math.sin(c * TAU + Math.PI - lag);
  pose.axe = [arm(0) * 0.17, arm(0.75) * 0.15, arm(1.5) * 0.26].map((v) => v * amount);
  pose.claw = [-arm(0) * 0.2, -arm(0.75) * 0.17, -arm(1.5) * 0.2].map((v) => v * amount);
  pose.open = Math.max(0, arm(1.5)) * 0.18;
  pose.tasset = [arm(0.5) * 0.13, arm(1.3) * 0.1, -arm(0.9) * 0.13].map((v) => v * amount);
}

export function chargePose(anim) {
  const pose = restPose();
  walkInto(pose, anim, 0.85);
  pose.torso.rot += 0.17;
  pose.torso.x += 4;
  pose.pelvis.y += 3;
  pose.head.rot += 0.08;
  pose.axe = AXE.trail.slice();
  pose.claw = [0.55, 0.3, 0.1];
  pose.open = 0.45;
  pose.tasset = [0.34, 0.28, 0.32];
  return pose;
}

// the last second: he sags to his knees, the arms drop and the head falls forward
export function droopPose(q) {
  const pose = restPose();
  const e = 1 - (1 - clamp01(q)) ** 2;
  pose.pelvis.y = 9 * e;
  pose.torso.rot = 0.2 * e;
  pose.torso.x = 3 * e;
  pose.head.rot = 0.5 * e;
  pose.head.y = 5 * e;
  pose.axe = [0.38 * e, 0.05 * e, 1.7 * e];
  pose.claw = [-0.15 * e, -0.45 * e, 0.35 * e];
  pose.open = 0.5 * e;
  pose.tasset = [0.2 * e, -0.1 * e, -0.2 * e];
  return pose;
}

export const keyframes = AXE;

// ---------------------------------------------------------------- solving and drawing
export function solve(pose) {
  const pelvis = part(J.hips, add(J.hips, [pose.pelvis.x, pose.pelvis.y - LIFT]), pose.pelvis.rot);
  const torso = part(J.waist, add(J.waist, [pose.pelvis.x + pose.torso.x, pose.pelvis.y + pose.torso.y - LIFT]), pose.torso.rot);
  const head = part(J.neck, add(place(torso, J.neck), [pose.head.x, pose.head.y]), torso.rot + pose.head.rot);

  const arm = (S, E, W, shift, a) => {
    const sh = add(place(torso, S), shift);
    const upper = part(S, sh, torso.rot + a[0]);
    const fore = part(E, place(upper, E), upper.rot + a[1]);
    const wrist = place(fore, W);
    return { upper, fore, wrist };
  };
  const axe = arm(J.axeS, J.axeE, J.axeW, pose.axeShift, pose.axe);
  axe.weapon = part(J.axeW, axe.wrist, axe.fore.rot + pose.axe[2]);
  // the hand wraps the haft but only turns part of the way with it, so the axe spins in his grip
  axe.hand = part(J.axeW, axe.wrist, axe.fore.rot + Math.sin(pose.axe[2]) * 0.22);
  const claw = arm(J.clawS, J.clawE, J.clawW, pose.clawShift, pose.claw);
  claw.palm = part(J.clawW, claw.wrist, claw.fore.rot + pose.claw[2]);
  claw.talons = J.talon.map((k, i) => part(k, place(claw.palm, k), claw.palm.rot + pose.open * [0.85, 0.25, -0.85][i]));

  const leg = (H, N, An, foot, side) => {
    const hip = place(pelvis, H);
    const ankle = [An[0] + foot[0], An[1] + foot[1]];
    const l1 = len(H, N) * LEG;
    const l2 = len(N, An) * LEG;
    const kn = knee(hip, ankle, l1, l2, side);
    return {
      thigh: bone(H, N, hip, kn),
      shin: bone(N, An, kn, ankle),
      foot: part(An, ankle, foot[2] || 0),
    };
  };
  const legA = leg(J.hipA, J.kneeA, J.ankleA, pose.footA, 1);
  const legB = leg(J.hipB, J.kneeB, J.ankleB, pose.footB, -1);
  const tassets = [J.tassetA, J.tassetC, J.tassetB].map((p, i) => part(p, place(pelvis, p), pelvis.rot + pose.tasset[i]));

  return {
    pose, pelvis, torso, head, axe, claw, legA, legB, tassets,
    eye: place(head, POINTS.eye),
    vent: place(torso, POINTS.vent),
    stacks: POINTS.stacks.map((p) => place(torso, p)),
    back: POINTS.back.map((p) => place(torso, p)),
    blade: place(axe.weapon, POINTS.blade),
    bladeIn: place(axe.weapon, POINTS.bladeIn),
    muzzle: place(axe.fore, MUZZLE_REST),
    clawTip: place(claw.palm, POINTS.clawTip),
  };
}

// where the plasma leaves his arm when it is levelled
export const JUG_MUZZLE = (() => {
  const pose = restPose();
  pose.axe = AXE.aim.slice();
  return solve(pose).muzzle;
})();

export function drawPart(ctx, layer, T) {
  ctx.save();
  ctx.translate(T.pos[0] * K, T.pos[1] * K);
  ctx.rotate(T.rot);
  if (T.stretch) {
    ctx.rotate(T.axis);
    ctx.scale(T.stretch, 1);
    ctx.rotate(-T.axis);
  }
  ctx.translate(-T.rest[0] * K, -T.rest[1] * K);
  drawLayer(ctx, layer);
  ctx.restore();
}

// a hydraulic ram between two moving points: a fat dark sleeve with a bright rod sliding out of it
function piston(ctx, a, b, w) {
  const ax = a[0] * K;
  const ay = a[1] * K;
  const bx = b[0] * K;
  const by = b[1] * K;
  const d = Math.hypot(bx - ax, by - ay) || 1;
  const nx = -(by - ay) / d;
  const ny = (bx - ax) / d;
  const tube = (x0, y0, x1, y1, wide, cols) => {
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#1a1722';
    ctx.lineWidth = (wide + 1.5) * K;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
    const half = (wide * K) / 2;
    const gr = ctx.createLinearGradient(x0 - nx * half, y0 - ny * half, x0 + nx * half, y0 + ny * half);
    gr.addColorStop(0, cols[0]);
    gr.addColorStop(0.42, cols[1]);
    gr.addColorStop(1, cols[2]);
    ctx.strokeStyle = gr;
    ctx.lineWidth = wide * K;
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.stroke();
  };
  tube(ax, ay, bx, by, w * 0.52, ['#ffffff', '#c3cada', '#5c637a']);
  tube(ax, ay, ax + (bx - ax) * 0.56, ay + (by - ay) * 0.56, w, ['#aab2c6', '#697088', '#2c3042']);
}

function drawLeg(ctx, S, A_, leg, pistons) {
  drawPart(ctx, A_.thigh, leg.thigh);
  for (const [from, to, w] of pistons) piston(ctx, place(S.pelvis, from), place(leg.shin, to), w);
  drawPart(ctx, A_.foot, leg.foot);
  drawPart(ctx, A_.shin, leg.shin);
}

function drawClawArm(ctx, L, S) {
  const c = S.claw;
  drawPart(ctx, L.clawUpper, c.upper);
  piston(ctx, place(S.torso, A(824, 392)), place(c.fore, A(852, 530)), 5);
  for (const i of [2, 0, 1]) drawPart(ctx, L.talons[i], c.talons[i]);
  drawPart(ctx, L.clawPalm, c.palm);
  drawPart(ctx, L.clawFore, c.fore);
}

function drawAxeArm(ctx, L, S) {
  const a = S.axe;
  drawPart(ctx, L.axeUpper, a.upper);
  piston(ctx, place(S.torso, A(360, 424)), place(a.fore, A(300, 520)), 4.6);
  drawPart(ctx, L.axeFore, a.fore);
  drawPart(ctx, L.axeWeapon, a.weapon);
  drawPart(ctx, L.axeHand, a.hand);
}

// the whole machine, back to front
export function drawRig(ctx, L, S) {
  drawLeg(ctx, S, L.legB, S.legB, [[A(630, 556), A(700, 668), 4.4]]);
  drawLeg(ctx, S, L.legA, S.legA, [[A(436, 556), A(404, 672), 4.4]]);
  // the spine and the rams that hold the torso up
  piston(ctx, place(S.pelvis, A(556, 546)), place(S.torso, A(566, 440)), 8);
  piston(ctx, place(S.pelvis, A(496, 540)), place(S.torso, A(520, 448)), 5.4);
  piston(ctx, place(S.pelvis, A(610, 538)), place(S.torso, A(640, 444)), 5.4);
  drawPart(ctx, L.pelvis, S.pelvis);
  if (!S.pose.clawFront) drawClawArm(ctx, L, S);
  drawPart(ctx, L.torso, S.torso);
  drawPart(ctx, L.head, S.head);
  drawPart(ctx, L.tassets[2], S.tassets[2]);
  drawPart(ctx, L.tassets[0], S.tassets[0]);
  drawPart(ctx, L.tassets[1], S.tassets[1]);
  drawAxeArm(ctx, L, S);
  if (S.pose.clawFront) drawClawArm(ctx, L, S);
}

// only the axe arm, for the ghost images that trail a swing
export function drawRigAxe(ctx, L, S) {
  drawAxeArm(ctx, L, S);
}

export function drawRigClaw(ctx, L, S) {
  drawClawArm(ctx, L, S);
}
