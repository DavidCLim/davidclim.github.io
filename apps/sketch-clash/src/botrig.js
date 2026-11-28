// How the robots move. One rig for all of them, so they walk, kick, flinch, cheer and fidget like one family.
//
// Nothing here is keyed frame by frame. Every loose part (the lean and squash of the body, the helmet, the weapon, the
// antenna, the pack, the MechaZaur's head and jaw) hangs on a spring. Things that happen to a robot (a footfall, a shot,
// a hit, a landing) just give the springs a shove, and they overshoot and settle on their own.
// All of it is for show; none of it changes what a robot does. It runs on the unit's own time (u.breath, which only
// moves while the world does), so a paused robot holds still.
import { TAU, K, FEET } from './config.js?v=266';
import { drawLayer } from './sprites.js?v=266';

// [stiffness, damping]: low damping rings on longer
const SPRINGS = {
  lean: [150, 11], // radians, + leans forward
  squash: [300, 15], // + is squat and wide, - is tall and thin
  cap: [230, 10], // the helmet, art px (- is lifted off his head)
  gunA: [170, 12], // the weapon's swing, radians (- kicks up)
  gunX: [300, 19], // the weapon's slide, art px (- is back)
  ant: [95, 4.2], // the antenna tip, art px
  pack: [210, 9], // the pack, art px
  head: [190, 15], // MechaZaur: the tip of his head, radians
  jaw: [430, 19], // and how far his jaw hangs open
};

const STILL = {
  move: 0, phase: 0, roll: 0, bob: 0, lean: 0, sx: 1, sy: 1, hop: 0, cap: 0, capRot: 0, gunA: 0, gunX: 0, ant: 7, pack: 0,
  head: 0, jaw: 0.3, happy: 0, fidget: null, q: 0, vx: 0, since: { step: 9, land: 9, takeoff: 9 }, foot: 0,
};

function fresh(u) {
  const s = {};
  for (const k in SPRINGS) s[k] = { x: 0, v: 0 };
  return { s, t: 0, at: u.breath, x: u.x, y: u.y, vx: 0, move: 0, phase: 0, half: 0, foot: 0, hit: 0, bang: 0, alt: 0, moving: false, landed: false, target: null, cheerAt: -9, cheerHops: 0, nextCheer: 0, nextFidget: 0.8 + Math.random() * 2.2, fidget: null, fidgetAt: 0, fidgetFor: 0, beat: 0, stepAt: -9, landAt: -9, takeoffAt: -9 };
}

function shove(r, kicks, k = 1) {
  for (const name in kicks) r.s[name].v += kicks[name] * k;
}

// o: age, dead, moving, alt, bang (a value that jumps each time he fires), kick (how hard each bang is),
//    cadence (strides a second), calm (nothing to fight), busy (mid-attack: no cheering), cheers (celebrates a win),
//    fidgets (names to pick from), aim: targets for the springs ({ lean, squash, head, jaw })
export function rigStep(u, o) {
  if (o.dead) return STILL;
  const { age } = o;
  let r = u.rig;
  if (!r) r = u.rig = fresh(u);
  const dt = Math.min(0.15, Math.max(0, u.breath - r.at));
  r.at = u.breath;
  r.t += dt;
  const clock = r.t;

  const vx = dt > 0 ? (u.x - r.x) / dt : 0;
  r.vx += (vx - r.vx) * Math.min(1, dt * 8);
  const speed = dt > 0 ? Math.hypot(u.x - r.x, u.y - r.y) / dt : 0;
  r.x = u.x;
  r.y = u.y;
  const alt = o.alt || 0;
  const grounded = alt < 0.12;
  const walking = !!o.moving && grounded;
  r.move += ((walking ? 1 : 0) - r.move) * Math.min(1, dt * 10);

  // ---- the stride: smooth, quicker the faster he goes, each foot planting once a cycle
  if (walking) {
    const pace = Math.max(0.75, Math.min(1.25, speed / 46));
    r.phase += dt * TAU * (o.cadence || 2.1) * pace;
    const half = Math.floor(r.phase / Math.PI);
    if (half !== r.half) {
      r.half = half;
      r.foot = half & 1;
      r.stepAt = clock;
      shove(r, { squash: 1.15, cap: 30, ant: half & 1 ? 34 : -34, pack: 24, gunA: 0.9, head: 0.55 });
    }
  }
  if (walking && !r.moving) shove(r, { squash: 1.4, lean: -0.7, ant: -45 }); // gathers himself to set off
  if (!walking && r.moving && grounded) shove(r, { squash: 0.9, ant: 60, cap: 20 }); // and rocks to a stop
  r.moving = walking;

  // ---- off the ground and back onto it
  if (r.alt <= 0.1 && alt > 0.1) {
    r.takeoffAt = clock;
    shove(r, { squash: 4.2, cap: 45, ant: -70, gunA: 2 });
  } else if (r.alt > 0.14 && alt <= 0.14) {
    r.landAt = clock;
    shove(r, { squash: 4.8, cap: -100, ant: 120, pack: 60, gunA: 3.5, head: 1.8 });
  }
  r.alt = alt;

  // ---- every round that leaves him kicks the lot
  const bang = o.bang || 0;
  if (bang > r.bang + 0.02) shove(r, { lean: -2.5, gunX: -190, gunA: -6.5, cap: -80, squash: 1.7, ant: -120, pack: 45, head: -1.5, jaw: 2 }, o.kick === undefined ? 1 : o.kick);
  r.bang = bang;

  // ---- being hit knocks him back on his heels
  const hit = u.hit || 0;
  if (hit > r.hit + 0.05) shove(r, { lean: -1.7, squash: 2.1, cap: -75, ant: Math.random() < 0.5 ? 110 : -110, gunA: Math.random() * 3 - 1.5, head: -1.2, pack: 40 });
  r.hit = hit;

  // ---- a happy double hop when the one he was after goes down (only for those who celebrate: o.cheers)
  const was = r.target;
  if (o.cheers && was && was !== u.target && was.dead && !o.busy && grounded && clock > r.nextCheer) {
    r.cheerAt = clock;
    r.cheerHops = 0;
    r.nextCheer = clock + 3.5 + Math.random() * 2;
  }
  r.target = u.target || null;
  const cheerQ = (clock - r.cheerAt) / 0.62;
  let hop = 0;
  let happy = 0;
  if (cheerQ >= 0 && cheerQ < 1) {
    hop = -Math.abs(Math.sin(cheerQ * TAU)) * (cheerQ < 0.5 ? 11 : 7.5);
    happy = 1;
    const landings = Math.floor(cheerQ * 2);
    if (landings > r.cheerHops) {
      r.cheerHops = landings;
      shove(r, { squash: 2.8, cap: -70, ant: 90 });
    }
  }

  // ---- with nothing to do he fidgets
  if (r.fidget && (clock - r.fidgetAt > r.fidgetFor || !o.calm || walking)) r.fidget = null;
  if (o.calm && !walking && age > 1.4 && !r.fidget && clock > r.nextFidget && o.fidgets) {
    r.fidget = o.fidgets[Math.floor(Math.random() * o.fidgets.length)];
    r.fidgetAt = clock;
    r.fidgetFor = { look: 1.6, stretch: 1.2, shimmy: 0.8, tinker: 1.5, hops: 0.9, chomp: 0.8, yawn: 1.7, sniff: 1.3, roar: 1.35, scratch: 1.5, twirl: 1.1, hoot: 1.5 }[r.fidget] || 1.2;
    r.nextFidget = clock + r.fidgetFor + 1.4 + Math.random() * 2.6;
    r.beat = 0;
  }
  const q = r.fidget ? Math.min(1, (clock - r.fidgetAt) / r.fidgetFor) : 0;
  const ease = r.fidget ? Math.sin(q * Math.PI) : 0;
  const aim = { lean: 0, squash: 0, head: 0, jaw: 0, ...o.aim };
  if (r.fidget === 'look') {
    // leans one way for a look, then the other
    aim.lean += Math.sin(q * TAU) * 0.15;
    aim.head += -Math.sin(q * TAU) * 0.12;
  } else if (r.fidget === 'stretch') {
    aim.squash += q < 0.62 ? -0.15 * Math.sin((q / 0.62) * Math.PI) : 0;
    if (r.beat === 0 && q > 0.62) {
      r.beat = 1;
      shove(r, { squash: 2.6, cap: -45, ant: 70 });
    }
  } else if (r.fidget === 'shimmy') {
    aim.lean += Math.sin(q * TAU * 3) * 0.12 * ease;
  } else if (r.fidget === 'hops') {
    hop += -Math.abs(Math.sin(q * TAU)) * 6;
    const landings = Math.floor(q * 2);
    if (landings > r.beat) {
      r.beat = landings;
      shove(r, { squash: 2.4, cap: -55, ant: 75 });
    }
  } else if (r.fidget === 'chomp') {
    aim.jaw += Math.max(0, Math.sin(q * TAU * 2)) * 0.5;
    aim.head += Math.max(0, Math.sin(q * TAU * 2)) * -0.1;
  } else if (r.fidget === 'yawn') {
    aim.jaw += ease ** 0.7 * 0.72;
    aim.head += -ease * 0.24;
    aim.squash += -ease * 0.08;
  } else if (r.fidget === 'sniff') {
    aim.head += ease * (0.2 + Math.sin(q * TAU * 5) * 0.06);
    aim.lean += ease * 0.09;
  }

  // ---- the springs, in small steps so a slow frame can't blow them up
  const to = { lean: aim.lean + r.move * 0.13, squash: aim.squash, cap: 0, gunA: 0, gunX: 0, ant: -r.move * 5 + Math.sin(clock * 2.1 + (u.id || 0)) * 1.3, pack: 0, head: aim.head, jaw: aim.jaw };
  const steps = Math.max(1, Math.ceil(dt / (1 / 120)));
  const h = dt / steps;
  for (let i = 0; i < steps; i++) {
    for (const name in SPRINGS) {
      const p = r.s[name];
      const [stiff, damp] = SPRINGS[name];
      p.v += ((to[name] - p.x) * stiff - p.v * damp) * h;
      p.x += p.v * h;
    }
  }
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const sq = clamp(r.s.squash.x, -0.22, 0.26);
  // breathing, and the waddle: he rolls onto each foot and rises over it
  const breath = Math.sin(clock * 2.5 + (u.id || 0) * 1.3) * 0.016 * (1 - r.move);
  const cap = clamp(r.s.cap.x, -11, 1.6);
  return {
    move: r.move,
    phase: r.phase,
    roll: Math.cos(r.phase) * 0.065 * r.move,
    bob: -(Math.sin(r.phase) ** 2) * 5 * r.move,
    lean: clamp(r.s.lean.x, -0.42, 0.42),
    sx: 1 + sq * 0.72 - breath * 0.6,
    sy: 1 - sq + breath,
    hop,
    cap: cap + Math.max(-1.2, hop * 0.14),
    capRot: clamp(r.s.cap.x * 0.016, -0.17, 0.05),
    gunA: clamp(r.s.gunA.x, -0.75, 0.6),
    gunX: clamp(r.s.gunX.x, -12, 4),
    ant: clamp(r.s.ant.x, -14, 14),
    pack: clamp(r.s.pack.x, -4, 4),
    head: clamp(r.s.head.x, -0.42, 0.42),
    jaw: clamp(r.s.jaw.x, -0.03, 0.82),
    happy,
    fidget: r.fidget,
    q,
    vx: r.vx,
    since: { step: clock - r.stepAt, land: clock - r.landAt, takeoff: clock - r.takeoffAt },
    foot: r.foot,
  };
}

// where each foot is, in art px. `spread` widens his stance; `air` 0..1 lets them dangle
function footAt(i, R, spread, air, clock) {
  const rest = i ? 8.8 : -4.3;
  const out = i ? 1 : -1;
  const a = R.phase + i * Math.PI;
  const lift = Math.max(0, Math.sin(a));
  let x = rest + out * spread - Math.cos(a) * 7 * R.move;
  let y = 25.7 - lift * 6.5 * R.move + R.hop * 0.82;
  let turn = lift * R.move * (Math.cos(a) > 0 ? 0.34 : -0.22);
  if (air > 0) {
    const sway = Math.sin(clock * 4.2 + i * 2.2);
    x += (-2.5 + sway * 1.6) * air;
    y += (1.2 + sway * 1.1) * air;
    turn += (0.42 + sway * 0.14) * air;
  }
  return { x, y, turn };
}

// his shadow and two feet, each moving on its own
export function drawBotFeet(ctx, A, R, { spread = 0, air = 0, clock = 0, shadow = true } = {}) {
  if (shadow) {
    ctx.save();
    ctx.translate(1 * K, 28 * K);
    const k = 1 + R.hop * 0.018 + (R.sx - 1) * 0.8;
    ctx.scale(k, k);
    drawLayer(ctx, A.shade);
    ctx.restore();
  }
  for (let i = 0; i < 2; i++) {
    const f = footAt(i, R, spread, air, clock);
    ctx.save();
    ctx.translate(f.x * K, f.y * K);
    ctx.rotate(f.turn);
    drawLayer(ctx, A.foot);
    ctx.restore();
  }
}

// puts the context into his body's own moving space: hop, lean and waddle about his feet, squash and stretch
export function applyBotBody(ctx, R, swell = 0) {
  ctx.translate(0, R.hop * K);
  ctx.translate(0, FEET);
  ctx.rotate(R.lean + R.roll);
  ctx.scale(R.sx + swell, R.sy + swell);
  ctx.translate(0, -FEET + R.bob * K);
}

// the helmet rides a spring of its own, rocking about where it sits
export function applyBotCap(ctx, R) {
  ctx.translate(0, (R.cap - 15) * K);
  ctx.rotate(R.capRot);
  ctx.translate(0, 15 * K);
}

// the puff of dust under the foot that has just come down
export function stepDust(ctx, R, size = 1) {
  const q = R.since.step / 0.3;
  if (q >= 1 || R.move < 0.4) return;
  const x = (R.foot ? 8 : -5) * K;
  ctx.fillStyle = `rgba(176, 172, 180, ${0.6 * (1 - q)})`;
  for (const side of [-1, 0.4, 1]) {
    ctx.beginPath();
    ctx.arc(x + side * (3 + 7 * q) * size, FEET + 0.6 - q * 2.4 * size * (1.4 - Math.abs(side)), (1.1 + 1.5 * q) * size, 0, TAU);
    ctx.fill();
  }
}
