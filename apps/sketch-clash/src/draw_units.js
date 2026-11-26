import { TAU, K, UNIT, FEET, ZAP_TIME } from './config.js?v=230';
import { drawLayer, OUT } from './sprites.js?v=230';
import { drawDrop, trooperEyes, BOT_JETS, drawJugArm, drawJugLeg, JUG_HEAD, ZORD_TAIL, ZORD_JAW, ZORD_EYE, ZORD_CORE, zordEye, drawZordTail, drawZordSpine } from './art_units.js?v=230';
import { drawCreature, paintCreatureIcon, CREATURE_IDS } from './creatures.js?v=230';
import { EGG_DROPS, WIZ_STAFF } from './art_eggs.js?v=230';

// Drawing for everything beyond the soldier and sniper: the egg-bodied
// units (flamethrower, roman, grenadier, archer, knight, ninja), the
// cavalry, and the effects they make (flames, bombs, blasts, arrows).

const GZ = [0, 1, 2, 0, 2]; // idle gaze 0..4 -> right / centre / left
const lerp = (a, b, t) => a + (b - a) * t;

// Puts the unit on the ground, facing the right way, and tips it over about
// its feet by u.tilt (used while a unit falls).
export function placeUnit(ctx, dpr, u, wobble = 0) {
  ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  if (u.tilt) {
    ctx.translate(0, FEET);
    ctx.rotate(u.tilt);
    ctx.translate(0, -FEET);
  }
}

function drawHurtMarks(ctx, sprites, u) {
  if (u.hp >= u.def.hp * 0.65) return;
  drawLayer(ctx, sprites.hurt[u.hp < u.def.hp * 0.3 ? 1 : 0]);
}

// A burning unit goes flat orange all over with a soft glow around it, as in the video.
export function burnOverlay(ctx, u, rx, ry, cx = 0, cy = 0) {
  if (u.slow > 0) {
    ctx.fillStyle = `rgba(140, 210, 255, ${0.5 * Math.min(1, u.slow / 0.5)})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fill();
  }
  if (u.poison > 0) {
    ctx.fillStyle = `rgba(120, 215, 70, ${0.42 * Math.min(1, u.poison / 0.6)})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fill();
  }
  if (u.burn <= 0) return;
  const t = Math.min(1, u.burn / 1.2);
  ctx.save();
  const gr = ctx.createRadialGradient(cx, cy, rx * 0.6, cx, cy, rx * 1.9);
  gr.addColorStop(0, `rgba(255, 150, 50, ${0.32 * t})`);
  gr.addColorStop(1, 'rgba(255, 150, 50, 0)');
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(cx, cy, rx * 1.9, 0, TAU);
  ctx.fill();
  ctx.fillStyle = `rgba(247, 152, 58, ${(0.62 + 0.1 * Math.sin(u.breath * 16)) * t})`;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.restore();
}

function burnGlow(ctx, u, rx, ry, cx = 0, cy = 0) {
  burnOverlay(ctx, u, rx, ry, cx, cy);
}

// Feet, body and face shared by every egg-shaped unit. Leaves the context
// in the body's (bobbing) space so the caller can add weapons.
function eggBase(ctx, dpr, sprites, A, u, before) {
  const ph = (u.anim * Math.PI) / 2;
  const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
  placeUnit(ctx, dpr, u, wobble);
  if (u.rise !== undefined && u.rise < 1) {
    ctx.translate(0, FEET);
    ctx.scale(1, 0.15 + 0.85 * u.rise);
    ctx.translate(0, -FEET);
  }
  if (u.atk > 0 && u.def.kind === 'beast') ctx.translate(Math.sin((1 - u.atk) * Math.PI) * 4 * K, 0);
  drawLayer(ctx, A.feet[u.moving ? (u.anim | 0) & 3 : 0]);
  const pose = u.pose;
  if (u.moving) {
    // an upright waddle, as in the video: the body bobs a little and squashes
    // down onto its feet as the legs spread
    const wk = Math.abs(Math.sin(ph));
    ctx.translate(0, FEET);
    ctx.scale(1 + 0.045 * (1 - wk), 1 - 0.06 * (1 - wk));
    ctx.translate(0, -FEET - wk * 1.5);
  } else if (pose < 1) {
    ctx.translate(0, Math.sin(u.breath * 2.2) * 0.55 * (1 - pose));
  }
  if (before) {
    ctx.save();
    before();
    ctx.restore();
  }
  if (pose < 0.5) drawLayer(ctx, A.torsoSide[GZ[u.gaze]]);
  else drawLayer(ctx, (u.species === 'roman' && u.target) || (u.species === 'archer' && u.drawT > u.def.drawTime - 0.55) ? A.torsoAngry : A.torso);
  drawHurtMarks(ctx, sprites, u);
  burnGlow(ctx, u, 20 * K, 23 * K);
  drawHitFlash(ctx, u, 20.5 * K, 23 * K);
}

// A fallen unit stares up with dizzy spiral eyes.
export function drawDizzyEyes(ctx, u) {
  ctx.lineCap = 'round';
  for (const ex of [1.5, 11.5]) {
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#17141a';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(ex * K, -4.5 * K, 4.3 * K, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    for (let i = 0; i <= 22; i++) {
      const a = i * 0.7;
      const r = 0.3 + i * 0.16;
      const px = ex * K + Math.cos(a) * r * K;
      const py = -4.5 * K + Math.sin(a) * r * K;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.stroke();
  }
}

// A hit turns the whole body white with dizzy spiral eyes and three stars circling over its head,
// then pale blue for a moment, as in the original.
export function drawHitFlash(ctx, u, rx, ry) {
  if (!(u.hit > 0)) return;
  const first = u.hit > 0.13;
  ctx.fillStyle = first ? 'rgba(255, 255, 255, 0.96)' : 'rgba(198, 217, 252, 0.88)';
  ctx.beginPath();
  ctx.ellipse(0, 0, rx, ry, 0, 0, TAU);
  ctx.fill();
  ctx.strokeStyle = '#2a2d3a';
  ctx.lineCap = 'round';
  if (first) {
    ctx.lineWidth = 0.55;
    for (const ex of [1.5, 11.5]) {
      ctx.beginPath();
      for (let i = 0; i <= 26; i++) {
        const a = i * 0.62;
        const r = 0.25 + i * 0.16;
        const px = ex * K + Math.cos(a) * r * K * 1.15;
        const py = -4.5 * K + Math.sin(a) * r * K * 1.15;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 0.45;
    for (const [sx, sy] of [[-7, -31], [3, -35], [13, -30]]) {
      ctx.beginPath();
      for (let i = 0; i < 10; i++) {
        const r = (i % 2 === 0 ? 3.2 : 1.3) * K;
        const a = (i / 10) * TAU - Math.PI / 2;
        if (i === 0) ctx.moveTo(sx * K + Math.cos(a) * r, sy * K + Math.sin(a) * r);
        else ctx.lineTo(sx * K + Math.cos(a) * r, sy * K + Math.sin(a) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  } else {
    // eyes screwed shut
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    for (const ex of [1.5, 11.5]) {
      ctx.moveTo((ex - 3.2) * K, -4.5 * K);
      ctx.lineTo((ex + 3.2) * K, -4.5 * K);
    }
    ctx.stroke();
  }
}

// Robo Trooper. Everything lively about him is drawn here, frame by frame: dropping in and booting up, thruster jets
// as he walks, a scanning beam while idle, a laser sight and a charging cell as he aims, a heavy kick with a ground
// shockwave when he fires, a smoking barrel, electric crackle when hit and dead lenses once he falls.
const BOT_SCALE = 1.15;

function botGlow(ctx, x, y, r, rgb, a) {
  const gr = ctx.createRadialGradient(x, y, 0, x, y, r);
  gr.addColorStop(0, `rgba(${rgb}, ${a})`);
  gr.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.fillStyle = gr;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, TAU);
  ctx.fill();
}

// a springy antenna whose tip lags behind whatever the body is doing
function botAntennae(ctx, sway, blinkOn) {
  ctx.lineCap = 'round';
  for (const [x0, y0, x1, y1, k, beacon] of [[1, -26.4, -8, -45, 1, true]]) {
    const tx = x1 + sway * k;
    const ty = y1 + Math.abs(sway) * 0.35;
    for (const [col, w] of [[OUT, 2.7], ['#7a8494', 1.2]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w * K;
      ctx.beginPath();
      ctx.moveTo(x0 * K, y0 * K);
      ctx.quadraticCurveTo(((x0 + x1) / 2) * K, ((y0 + y1) / 2) * K, tx * K, ty * K);
      ctx.stroke();
    }
    if (beacon && blinkOn) botGlow(ctx, tx * K, ty * K, 7 * K, '255, 90, 70', 0.7);
    ctx.fillStyle = beacon ? (blinkOn ? '#ff6a52' : '#8d3b34') : '#9fb0c2';
    ctx.strokeStyle = OUT;
    ctx.lineWidth = 0.8 * K;
    ctx.beginPath();
    ctx.arc(tx * K, ty * K, 1.9 * K, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}

function drawTrooper(ctx, dpr, sprites, u) {
  const A = sprites.trooper;
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const pose = u.pose;
  const kick = u.recoil || 0;
  const moving = u.moving && !dead;
  const aiming = pose > 0.6 && !dead;
  const ph = (u.anim * Math.PI) / 2;

  placeUnit(ctx, dpr, u, u.hit > 0 ? (Math.random() - 0.5) * 2 : 0);

  // ---- on the ground: the landing dust ring and the shockwave of each shot
  if (age > 0.26 && age < 0.8) {
    const q = (age - 0.26) / 0.54;
    ctx.strokeStyle = `rgba(150, 148, 160, ${0.55 * (1 - q)})`;
    ctx.lineWidth = 2.4 * (1 - q) + 0.5;
    ctx.beginPath();
    ctx.ellipse(0, FEET + 1, 9 + 22 * q, 3 + 7.5 * q, 0, 0, TAU);
    ctx.stroke();
    ctx.fillStyle = `rgba(190, 186, 190, ${0.7 * (1 - q)})`;
    for (let i = 0; i < 7; i++) {
      const a = (i / 7) * TAU + (u.id || 0);
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (10 + 20 * q), FEET + Math.sin(a) * (3 + 6 * q) - 3 * q, 2.6 * (1 - q) + 0.6, 0, TAU);
      ctx.fill();
    }
  }
  if (kick > 0.05 && !dead) {
    ctx.strokeStyle = `rgba(120, 190, 235, ${0.5 * kick})`;
    ctx.lineWidth = 0.6 + 1.6 * kick;
    ctx.beginPath();
    ctx.ellipse(-2, FEET + 1, 10 + 17 * (1 - kick), 3.4 + 5.4 * (1 - kick), 0, 0, TAU);
    ctx.stroke();
  }

  // ---- he drops in from above and squashes as he lands
  if (age < 0.28) ctx.translate(0, -46 * (1 - (age / 0.28) ** 2));
  ctx.translate(0, FEET);
  const squash = age >= 0.28 && age < 0.55 ? Math.sin(((age - 0.28) / 0.27) * Math.PI) : 0;
  ctx.scale(BOT_SCALE * (1 + 0.2 * squash), BOT_SCALE * (1 - 0.22 * squash));
  ctx.translate(0, -FEET);

  drawLayer(ctx, A.feet[moving ? (u.anim | 0) & 3 : 0]);

  // ---- the body: a heavy waddle leaning into the walk, breathing at rest, rocked back by each shot
  if (moving) {
    const wk = Math.abs(Math.sin(ph));
    ctx.translate(0, FEET);
    ctx.rotate(0.09 + Math.sin(ph) * 0.035);
    ctx.scale(1 + 0.06 * (1 - wk), 1 - 0.08 * (1 - wk));
    ctx.translate(0, -FEET - wk * 2.4);
  } else if (!dead) ctx.translate(0, Math.sin(t * 2.4) * 0.6);
  if (kick > 0 && !dead) {
    ctx.translate(-4.2 * kick * K * 3, FEET);
    ctx.rotate(-0.2 * kick);
    ctx.translate(0, -FEET);
  }

  // ---- idle puffs of steam from the pods (his thruster fire is the same fire as everything else's)
  if (!dead && !aiming && !moving) {
    const q = (t % 2.8) / 0.7;
    if (q < 1) {
      ctx.fillStyle = `rgba(205, 210, 222, ${0.6 * (1 - q)})`;
      for (const [jx, jy] of BOT_JETS) {
        ctx.beginPath();
        ctx.arc((jx - 3 - 9 * q) * K, (jy - 3 - 10 * q) * K, (1.8 + 3.6 * q) * K, 0, TAU);
        ctx.fill();
      }
    }
  }
  drawLayer(ctx, A.pack);

  const sway = dead ? 7 : (moving ? -3.4 + Math.sin(ph * 2) * 3.4 : Math.sin(t * 2.1) * 1.6) - 12 * kick * Math.cos((1 - kick) * 9);
  botAntennae(ctx, sway, !dead && t % 1.1 < 0.22);
  drawLayer(ctx, A.torso);

  // ---- eyes: boot up with a flicker, then look about, blink, narrow and spin up to aim
  let power = 1;
  if (age < 0.5) power = 0;
  else if (age < 0.85) power = Math.sin(age * 70) > 0 ? 1 : 0.15;
  if (!dead && u.hp < d.hp * 0.25 && Math.sin(t * 23) > 0.72) power = 0.2;
  const blinkT = t % 3.3;
  const lid = !aiming && blinkT < 0.16 ? Math.sin((blinkT / 0.16) * Math.PI) : 0;
  const look = aiming ? [1, Math.sin(u.aim) * 1.2] : [Math.sin(t * 0.9) * 0.9 + 0.2, Math.sin(t * 1.7) * 0.5];
  ctx.save();
  ctx.scale(K, K);
  trooperEyes(ctx, { lx: look[0], ly: look[1], lid, angry: aiming, spin: aiming ? t * 5 : Math.sin(t * 0.6) * 0.4, power, dead });
  ctx.restore();
  if (!dead && power > 0.5) botGlow(ctx, 10.6 * K, -4.6 * K, (11 + (aiming ? 3 * Math.sin(t * 14) : Math.sin(t * 3))) * K, '70, 255, 205', aiming ? 0.34 : 0.18);
  // a green scanning beam sweeps about while there's nobody to shoot
  if (!dead && !moving && pose < 0.35 && age > 0.9) {
    const sa = Math.sin(t * 1.25) * 0.5 + 0.05;
    ctx.save();
    ctx.translate(15 * K, -4.6 * K);
    ctx.rotate(sa);
    const sg = ctx.createLinearGradient(0, 0, 58 * K, 0);
    sg.addColorStop(0, 'rgba(70, 245, 200, 0.42)');
    sg.addColorStop(1, 'rgba(70, 245, 200, 0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(58 * K, -12 * K);
    ctx.lineTo(58 * K, 12 * K);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  burnGlow(ctx, u, 20.7 * K, 23 * K);
  if (!dead) drawHitFlash(ctx, u, 20.9 * K, 23.2 * K);

  // ---- the blaster
  ctx.save();
  ctx.translate(lerp(8 * K, 8 * K, pose), lerp(12 * K, 11 * K, pose));
  ctx.rotate(dead ? 0.9 : lerp(0.3 + (moving ? Math.sin(ph) * 0.12 : 0), u.aim - kick * 0.34, pose));
  ctx.translate(-kick * 5.5 * K, 0);
  const heat = u.heat || 0;
  // laser sight while lining up the shot
  if (aiming && kick < 0.1) {
    const reach = 92 * K;
    const lg = ctx.createLinearGradient(39 * K, 0, 39 * K + reach, 0);
    lg.addColorStop(0, 'rgba(255, 60, 50, 0.7)');
    lg.addColorStop(1, 'rgba(255, 60, 50, 0)');
    ctx.strokeStyle = lg;
    ctx.lineWidth = 0.9 * K * 1.4;
    ctx.beginPath();
    ctx.moveTo(39 * K, -1 * K);
    ctx.lineTo(39 * K + reach, -1 * K);
    ctx.stroke();
    botGlow(ctx, 40 * K, -1 * K, (4 + Math.sin(t * 18)) * K, '255, 70, 60', 0.85);
  }
  drawLayer(ctx, A.gun);
  // the power cell fills as the next volley charges
  const charge = aiming ? 1 - Math.max(0, Math.min(1, (u.cdT || 0) / 1.5)) : 0.35 + 0.15 * Math.sin(t * 2.6);
  ctx.fillStyle = charge > 0.92 ? '#e9ffff' : '#4fe4f5';
  ctx.fillRect(2.4 * K, -1.7 * K, 8.8 * K * Math.max(0.08, charge), 2.2 * K);
  if (aiming && charge > 0.6) botGlow(ctx, 7 * K, -0.6 * K, 12 * K, '80, 225, 255', (charge - 0.6) * 1.2);
  // a smoking barrel after he has been firing (the muzzle ring is the same as any gun's)
  if (heat > 0.3 && kick < 0.1) {
    for (let i = 0; i < 4; i++) {
      const q = (t * 1.5 + i / 4) % 1;
      ctx.fillStyle = `rgba(170, 172, 184, ${0.55 * heat * (1 - q)})`;
      ctx.beginPath();
      ctx.arc((38 + Math.sin(q * 7 + i) * 3) * K, (-3 - 20 * q) * K, (1.6 + 3 * q) * K, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();

  // ---- electricity crawls over him when he's hit, and a badly damaged one keeps sparking
  const zap = !dead && (u.hit > 0.02 || (u.hp < d.hp * 0.45 && Math.sin(t * 7.3) > 0.9));
  if (zap) {
    ctx.lineJoin = 'miter';
    for (let b = 0; b < 3; b++) {
      let x = (Math.random() - 0.5) * 34;
      let y = (Math.random() - 0.6) * 36;
      const path = [[x, y]];
      for (let i = 0; i < 4; i++) {
        x += (Math.random() - 0.5) * 16;
        y += (Math.random() - 0.5) * 16;
        path.push([x, y]);
      }
      for (const [col, w] of [['rgba(80, 200, 255, 0.75)', 2.8], ['#ffffff', 1]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w * K;
        ctx.beginPath();
        path.forEach(([px, py], i) => (i ? ctx.lineTo(px * K, py * K) : ctx.moveTo(px * K, py * K)));
        ctx.stroke();
      }
    }
  }
}

// Robot Juggernaut: Robo Trooper's armour on a gorilla's frame. He walks on his knuckles, pumps a fist now and then
// while he waits, throws punches, and every third blow rears up and brings both iron fists down together.
// A pose is where his wrists and feet are, in art units, and how far he is reared up (negative) or hunched over.
const JUG_SLOPE = 0.17; // his front end rides high, the back sloping down to the rump
const JUG_REST = { near: [6, 7], far: [26, 6], nearFoot: [-28, 21], farFoot: [-20, 20], tilt: 0, lift: 0, chin: 0, shove: 0 };

const jugMix = (p, q, k) => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k];

// the two attacks, `s` seconds in: drawn back, driven home, held a moment, and back to rest
function jugAttackPose(d, kind, s) {
  const R = JUG_REST;
  const slam = kind === 'slam';
  const back = slam
    ? { near: [-3, -56], far: [17, -56], tilt: -0.28, lift: 4, chin: 2, shove: -2 }
    : { near: [-17, -9], far: [28, 6], tilt: -0.12, lift: 1, chin: 0, shove: -4 };
  const hit = slam
    ? { near: [34, 8], far: [47, 5], tilt: 0.17, lift: -1, chin: -1, shove: 8 }
    : { near: [44, 0], far: [17, 6], tilt: 0.13, lift: 0, chin: 0, shove: 13 };
  const blend = (p, q, k) => ({
    ...R,
    near: jugMix(p.near, q.near, k),
    far: jugMix(p.far, q.far, k),
    tilt: p.tilt + (q.tilt - p.tilt) * k,
    lift: p.lift + (q.lift - p.lift) * k,
    chin: p.chin + (q.chin - p.chin) * k,
    shove: p.shove + (q.shove - p.shove) * k,
  });
  const strike = 0.11;
  if (s < d.windup - strike) return blend(R, back, 1 - (1 - s / (d.windup - strike)) ** 2);
  if (s < d.windup) return blend(back, hit, ((s - (d.windup - strike)) / strike) ** 2);
  const after = (s - d.windup) / d.recover;
  return after < 0.45 ? blend(hit, hit, 0) : blend(hit, R, Math.min(1, (after - 0.45) / 0.55));
}

// knuckle-walking: each fist plants in turn with the opposite foot; charging, both fists swing through together
function jugWalkPose(ph, boosting) {
  const R = JUG_REST;
  const sn = Math.sin(ph);
  const cs = Math.cos(ph);
  const lift = (v) => Math.max(0, v);
  if (boosting) {
    return {
      ...R,
      near: [R.near[0] + sn * 15, R.near[1] - lift(cs) * 13],
      far: [R.far[0] + Math.sin(ph - 0.5) * 14, R.far[1] - lift(Math.cos(ph - 0.5)) * 12],
      nearFoot: [R.nearFoot[0] - sn * 9, R.nearFoot[1] - lift(-cs) * 8],
      farFoot: [R.farFoot[0] - Math.sin(ph - 0.5) * 9, R.farFoot[1] - lift(-Math.cos(ph - 0.5)) * 7],
      tilt: 0.11 + cs * 0.07,
      lift: Math.abs(sn) * 4,
    };
  }
  return {
    ...R,
    near: [R.near[0] + sn * 10, R.near[1] - lift(cs) * 9],
    far: [R.far[0] - sn * 10, R.far[1] - lift(-cs) * 9],
    nearFoot: [R.nearFoot[0] - sn * 6, R.nearFoot[1] - lift(-cs) * 5],
    farFoot: [R.farFoot[0] + sn * 6, R.farFoot[1] - lift(cs) * 5],
    tilt: 0.02 + sn * 0.04,
    lift: Math.abs(cs) * 2,
  };
}

// everything above the ground shadow, from the far leg to the near arm. `eyes` paints his eye (and its glow).
function drawJugRig(ctx, A, pose, eyes) {
  const p = { ...pose, tilt: pose.tilt - JUG_SLOPE };
  // the body rocks about his hips; fists and feet stay where the pose puts them
  const hx = -24;
  const hy = 4;
  const ca = Math.cos(p.tilt);
  const sa = Math.sin(p.tilt);
  const onBody = (x, y) => [hx + (x - hx) * ca - (y - hy) * sa + p.shove * 0.45, hy + (x - hx) * sa + (y - hy) * ca - p.lift];
  // a layer that belongs to the body, leaning with it
  const onTorso = (layer, ox = 0, oy = 0) => {
    ctx.save();
    ctx.translate((hx + p.shove * 0.45) * K, (hy - p.lift) * K);
    ctx.rotate(p.tilt);
    ctx.translate((ox - hx) * K, (oy - hy) * K);
    drawLayer(ctx, layer);
    ctx.restore();
  };
  const leg = (hip, foot, far) => {
    ctx.save();
    ctx.scale(K, K);
    drawJugLeg(ctx, ...onBody(...hip), foot[0], foot[1], far);
    ctx.restore();
  };
  // an arm, the iron fist on its end (knuckles leading, so they are down when he stands on them), then its armour
  const arm = (at, wrist, far) => {
    const [sx, sy] = onBody(...at);
    ctx.save();
    ctx.scale(K, K);
    const way = drawJugArm(ctx, sx, sy, wrist[0], wrist[1], far);
    ctx.restore();
    const k = far ? 0.96 : 1.04;
    drawJugFistAt(ctx, A, { a: way.fore, x: wrist[0] + Math.cos(way.fore) * 6.5, y: wrist[1] + Math.sin(way.fore) * 6.5 }, k);
    ctx.save();
    ctx.translate(sx * K, sy * K);
    ctx.rotate(p.tilt * 0.5 + (way.upper - 1.9) * 0.25);
    ctx.translate(0, -3.4 * K);
    ctx.scale(far ? 0.74 : 0.86, far ? 0.74 : 0.86);
    drawLayer(ctx, A.shoulder);
    ctx.restore();
  };

  leg([-17, 1], p.farFoot, true);
  arm([12, -17], p.far, true);
  onTorso(A.pack, -13, -15);
  onTorso(A.torso);
  leg([-25, 1], p.nearFoot, false);
  // the head rides on the front of the body, and stays nearly level
  const neck = onBody(9, -18);
  ctx.save();
  ctx.translate((neck[0] + 3) * K, (neck[1] + 2 - p.chin) * K);
  ctx.rotate(p.tilt * 0.35);
  ctx.translate(-9 * K, 18 * K);
  drawLayer(ctx, A.head);
  eyes(ctx);
  drawLayer(ctx, A.brow);
  ctx.restore();
  arm([3, -17], p.near, false);
}

function drawJugFistAt(ctx, A, p, k) {
  ctx.save();
  ctx.translate(p.x * K, p.y * K);
  ctx.rotate(p.a);
  ctx.scale(k, k);
  drawLayer(ctx, A.fist);
  ctx.restore();
}

// his eye is Robo Trooper's, in the same place on his head
function jugEye(g, o) {
  g.save();
  g.translate(JUG_HEAD.x * K, JUG_HEAD.y * K);
  g.scale(JUG_HEAD.k, JUG_HEAD.k);
  g.save();
  g.scale(K, K);
  trooperEyes(g, o);
  g.restore();
  g.restore();
}

function drawZaps(ctx, n) {
  ctx.lineJoin = 'miter';
  for (let b = 0; b < n; b++) {
    let x = (Math.random() - 0.5) * 34;
    let y = (Math.random() - 0.6) * 36;
    const path = [[x, y]];
    for (let i = 0; i < 4; i++) {
      x += (Math.random() - 0.5) * 16;
      y += (Math.random() - 0.5) * 16;
      path.push([x, y]);
    }
    for (const [col, w] of [['rgba(80, 200, 255, 0.75)', 2.8], ['#ffffff', 1]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w * K;
      ctx.beginPath();
      path.forEach(([px, py], i) => (i ? ctx.lineTo(px * K, py * K) : ctx.moveTo(px * K, py * K)));
      ctx.stroke();
    }
  }
}

function drawJuggernaut(ctx, dpr, sprites, u) {
  const A = sprites.juggernaut;
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const moving = u.moving && !dead;
  const boosting = moving && u.chargeT > 0;
  const ph = (u.anim * Math.PI) / 2;
  const s = dead || !u.atkKind ? 0 : u.swing || 0; // (a new unit's swing starts non-zero, before he has thrown anything)
  const punching = s > 0;
  const slam = u.atkKind === 'slam';

  placeUnit(ctx, dpr, u, u.hit > 0.16 ? (Math.random() - 0.5) * 1.4 : 0);

  const ring = (x, y, rx, col, width) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx * 0.34, 0, 0, TAU);
    ctx.stroke();
  };
  if (age > 0.26 && age < 0.8) {
    const q = (age - 0.26) / 0.54;
    ring(0, FEET + 1, 14 + 32 * q, `rgba(150, 148, 160, ${0.6 * (1 - q)})`, 3 * (1 - q) + 0.5);
  }
  // where the blow lands: a shock ring, and under a two-fisted slam the ground cracks too
  if (punching && s >= d.windup) {
    const x = (u.strikeX === undefined ? u.facing * d.slamAt : u.strikeX) * u.facing;
    const y = (u.strikeY || 0) + FEET;
    const radius = slam ? d.slam.radius : d.slamRadius;
    const q = (s - d.windup) / 0.28;
    if (q < 1) {
      ring(x, y, radius * (0.3 + 0.85 * q), `rgba(150, 148, 160, ${0.78 * (1 - q)})`, (slam ? 4 : 2.8) * (1 - q) + 0.4);
      if (slam) ring(x, y, radius * (0.15 + 0.6 * q), `rgba(112, 232, 214, ${0.7 * (1 - q)})`, 1.8 * (1 - q) + 0.3);
    }
    if (slam) {
      const fade = Math.max(0, 1 - (s - d.windup) / d.recover);
      ctx.strokeStyle = `rgba(48, 46, 56, ${0.75 * fade})`;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'miter';
      for (let i = 0; i < 7; i++) {
        const an = (i / 7) * TAU + 0.35;
        const len = radius * (0.85 + 0.35 * ((i * 5) % 3) * 0.5);
        const kink = i % 2 ? 0.28 : -0.28;
        ctx.lineWidth = 1.1;
        ctx.beginPath();
        ctx.moveTo(x + Math.cos(an) * 2.5, y + Math.sin(an) * 1);
        ctx.lineTo(x + Math.cos(an + kink) * len * 0.55, y + Math.sin(an + kink) * len * 0.22);
        ctx.lineTo(x + Math.cos(an) * len, y + Math.sin(an) * len * 0.38);
        ctx.stroke();
      }
    }
  }

  if (age < 0.28) ctx.translate(0, -60 * (1 - (age / 0.28) ** 2));
  const squash = age >= 0.28 && age < 0.55 ? Math.sin(((age - 0.28) / 0.27) * Math.PI) : 0;
  ctx.translate(0, FEET);
  ctx.scale(d.scale * d.bulk * (1 + 0.2 * squash), d.scale * (1 - 0.22 * squash));
  ctx.translate(0, -FEET);

  // one wide shadow under fists and feet
  ctx.save();
  if (dead) ctx.globalAlpha = 0;
  if (dead) ctx.globalAlpha = 0;
  ctx.scale(K, K);
  ctx.translate(0, 28);
  ctx.scale(1, 0.24);
  const sh = ctx.createRadialGradient(0, 0, 8, 0, 0, 48);
  sh.addColorStop(0, 'rgba(0, 0, 0, 0.46)');
  sh.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(0, 0, 48, 0, TAU);
  ctx.fill();
  ctx.restore();

  let pose;
  if (punching) pose = jugAttackPose(d, u.atkKind, s);
  else if (moving) pose = jugWalkPose(ph, boosting);
  else {
    const breathe = dead ? 0 : Math.sin(t * 2);
    // now and then, while he waits, he pumps his fist
    const pump = !dead && age > 0.9 && t % 5 < 0.9 ? Math.sin(((t % 5) / 0.9) * Math.PI * 3) ** 2 : 0;
    pose = { ...JUG_REST, near: [JUG_REST.near[0] + 9 * pump, JUG_REST.near[1] - 17 * pump], lift: breathe * 0.9 };
  }
  // landing, he sinks onto his knuckles
  if (squash) pose = { ...pose, lift: pose.lift - 3 * squash };

  // smoke from the stacks
  if (!dead && age > 0.9) {
    for (const [sx, sy] of [[-11, -50], [-23, -44]]) {
      for (let i = 0; i < 2; i++) {
        const q = (t * (moving || punching ? 1.3 : 0.55) + i / 2 + sx * 0.03) % 1;
        botGlow(ctx, (sx - (moving ? 16 : 6) * q) * K, (sy - pose.lift - (moving ? 12 : 15) * q) * K, (3.4 + 5.5 * q) * K, '140, 138, 156', 0.55 * (1 - q));
      }
    }
  }

  const power = age < 0.5 ? 0 : age < 0.85 ? (Math.sin(age * 70) > 0 ? 1 : 0.15) : 1;
  const attacking = punching || (u.pose > 0.6 && !!u.target);
  const blink = !attacking && t % 3.3 < 0.16 ? Math.sin(((t % 3.3) / 0.16) * Math.PI) : 0;
  drawJugRig(ctx, A, pose, (g) => {
    jugEye(g, { lx: attacking ? 1 : Math.sin(t * 0.9) * 0.9, ly: attacking ? 0.2 : Math.sin(t * 1.7) * 0.5, lid: blink, angry: attacking, power, dead });
    const ex = JUG_HEAD.x + 10.6 * JUG_HEAD.k;
    const ey = JUG_HEAD.y - 4.6 * JUG_HEAD.k;
    if (!dead && power > 0.5) botGlow(g, ex * K, ey * K, (attacking ? 12 : 9) * K, '70, 255, 205', attacking ? 0.4 : 0.18);
  });

  // arcs sweep behind his fists as a blow comes down
  if (punching && s > d.windup - 0.09 && s < d.windup + 0.12) {
    const fade = s < d.windup ? 1 : 1 - (s - d.windup) / 0.12;
    ctx.lineCap = 'round';
    if (slam) {
      for (const [x, w] of [[pose.near[0], 1], [pose.far[0], 0.7]]) {
        ctx.strokeStyle = `rgba(112, 232, 214, ${0.75 * fade * w})`;
        ctx.lineWidth = 3.4 * K;
        ctx.beginPath();
        ctx.moveTo((x - 24) * K, -36 * K);
        ctx.quadraticCurveTo((x + 12) * K, -34 * K, (x + 11) * K, 6 * K);
        ctx.stroke();
      }
    } else {
      ctx.strokeStyle = `rgba(120, 126, 144, ${0.75 * fade})`;
      ctx.lineWidth = 1.7 * K;
      ctx.beginPath();
      for (const [dy, len] of [[-9, 26], [0, 36], [9, 23]]) {
        ctx.moveTo((pose.near[0] - 12) * K, (pose.near[1] + dy) * K);
        ctx.lineTo((pose.near[0] - 12 - len) * K, (pose.near[1] + dy) * K);
      }
      ctx.stroke();
    }
  }

  burnGlow(ctx, u, 28 * K, 25 * K);
  if (!dead) drawHitFlash(ctx, u, 28 * K, 25 * K);

  if (!dead && (u.hit > 0.14 || (u.hp < d.hp * 0.4 && Math.sin(t * 7.3) > 0.9))) drawZaps(ctx, 2);
}

// MechaZord: tramps forward with his tail swinging; the blades down his back light up from the tail to his head, with
// lightning jumping between them, then his jaw drops and he pours out fire. Now and then he lifts off on jets.
// the blades along his back: [x, y, which way they point, length]; the rest ride on the tail
const ZORD_BACK = [[22, -118, -2.2, 14], [9, -103, -2.34, 20], [-5, -88, -2.46, 26], [-17, -73, -2.52, 31], [-27, -58, -2.52, 34]];
const ZORD_ON_TAIL = [[0, 0.2, -2.4, 33], [0, 0.75, -2.25, 29], [1, 0.3, -2.14, 24], [1, 0.85, -2.06, 20], [2, 0.45, -2.0, 17], [3, 0.1, -1.96, 13], [3, 0.75, -1.9, 10], [4, 0.4, -1.84, 8]];

// everything of him above the shadow. m: { tail (joints), legs [near, far] as {a, lift}, arms [near, far] angles, bob,
// jaw (radians open), headTilt, glow(i, n) }; `eyes` paints his eye
function drawZordRig(ctx, A, m, eyes) {
  const art = (fn) => {
    ctx.save();
    ctx.scale(K, K);
    fn();
    ctx.restore();
  };
  const joint = (layer, x, y, a, lift = 0) => {
    ctx.save();
    ctx.translate(x * K, (y - lift) * K);
    ctx.rotate(a);
    drawLayer(ctx, layer);
    ctx.restore();
  };
  const fixed = (layer, dy) => {
    ctx.save();
    ctx.translate(0, dy * K);
    drawLayer(ctx, layer);
    ctx.restore();
  };
  const pts = m.tail;
  // where each blade stands this frame
  const blades = ZORD_BACK.map(([x, y, a, len]) => [x, y - m.bob, a, len]);
  for (const [i, k, a, len] of ZORD_ON_TAIL) {
    const p = pts[i];
    const q = pts[i + 1];
    const r = p[2] + (q[2] - p[2]) * k;
    blades.push([p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k - r * 0.8, a, len]);
  }
  const n = blades.length;
  m.blades = blades;

  joint(A.farLeg, 22, -22, m.legs[1].a, m.legs[1].lift);
  joint(A.farArm, 31, -69 - m.bob, m.arms[1]);
  // two rows of blades, the far one a little behind
  art(() => {
    for (let i = n - 1; i >= 0; i--) {
      const [x, y, a, len] = blades[i];
      drawZordSpine(ctx, x + 7, y - 1, a + 0.2, len * 0.8, m.glow(i, n), true);
    }
    for (let i = n - 1; i >= 0; i--) {
      const [x, y, a, len] = blades[i];
      drawZordSpine(ctx, x, y, a, len, m.glow(i, n), false);
    }
    drawZordTail(ctx, pts);
  });
  // the glow of the lit blades
  for (let i = 0; i < n; i++) {
    const g = m.glow(i, n);
    if (g <= 0.5) continue;
    const [x, y, a, len] = blades[i];
    botGlow(ctx, (x + Math.cos(a) * len * 0.6) * K, (y + Math.sin(a) * len * 0.6) * K, len * 0.62 * K, '70, 255, 205', 0.55 * g);
  }
  fixed(A.body, -m.bob);
  ctx.save();
  ctx.translate(26 * K, (-100 - m.bob) * K);
  ctx.rotate(m.headTilt);
  ctx.translate(-26 * K, 100 * K);
  drawLayer(ctx, A.head);
  ctx.save();
  ctx.translate(ZORD_JAW[0] * K, ZORD_JAW[1] * K);
  ctx.rotate(m.jaw);
  ctx.translate(-ZORD_JAW[0] * K, -ZORD_JAW[1] * K);
  drawLayer(ctx, A.jaw);
  ctx.restore();
  eyes(ctx);
  ctx.restore();
  joint(A.nearLeg, -10, -25, m.legs[0].a, m.legs[0].lift);
  fixed(A.haunch, -m.bob * 0.6);
  joint(A.nearArm, 13, -69 - m.bob, m.arms[0]);
  fixed(A.pauldron, -m.bob);
}

const ZORD_STILL = {
  tail: ZORD_TAIL,
  legs: [{ a: 0, lift: 0 }, { a: 0, lift: 0 }],
  arms: [0, 0],
  bob: 0,
  jaw: 0,
  headTilt: 0,
  glow: () => 0,
};

function drawMechaZord(ctx, dpr, sprites, u) {
  const A = sprites.mechazord;
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const alt = dead ? 0 : u.alt || 0;
  const moving = u.moving && !dead;
  const firing = !!u.firing && !dead;
  // the moment before he breathes, the light runs up his back
  const inRange = u.target && Math.hypot(u.target.x - u.x, u.target.y - u.y) <= d.range;
  const charge = !dead && !firing && inRange && !(u.burstLeft > 0) && u.burstT !== undefined && u.burstT < 0.8 ? Math.max(0, Math.min(1, 1 - u.burstT / 0.8)) : 0;
  // he roars once he has landed, and now and then while he waits for a fight
  const idleFor = !dead && !moving && !u.target && age > 4 ? t % 8 : 9;
  const roarAt = age > 0.75 && age < 2.1 ? (age - 0.75) / 1.35 : idleFor < 1.35 ? idleFor / 1.35 : 1;
  const roar = roarAt < 1 ? Math.min(1, roarAt * 5, (1 - roarAt) * 4) : 0;
  const ph = u.anim * 0.9;
  const sn = Math.sin(ph);
  const cs = Math.cos(ph);

  placeUnit(ctx, dpr, u, u.hit > 0.16 ? (Math.random() - 0.5) * 1.4 : 0);
  const ring = (x, y, rx, col, width) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx * 0.34, 0, 0, TAU);
    ctx.stroke();
  };
  if (age > 0.28 && age < 0.9) {
    const q = (age - 0.28) / 0.62;
    ring(0, FEET + 1, 22 + 46 * q, `rgba(150, 148, 160, ${0.65 * (1 - q)})`, 3.6 * (1 - q) + 0.5);
  }
  // each heavy footfall puffs out under the foot that lands
  if (moving && alt < 0.1) {
    const q = ((ph / Math.PI + 0.5) % 1 + 1) % 1;
    if (q < 0.45) ring((Math.floor(ph / Math.PI + 0.5) % 2 ? 8 : 26) * K, FEET, (9 + 26 * q) * K, `rgba(150, 148, 160, ${0.65 * (1 - q / 0.45)})`, 1.2);
  }

  // his shadow stays on the ground, shrinking as he climbs
  ctx.save();
  if (dead) ctx.globalAlpha = 0;
  ctx.scale(K, K);
  ctx.translate(-30, 28);
  ctx.scale(1, 0.15);
  const sh = ctx.createRadialGradient(0, 0, 20, 0, 0, 110 * (1 - alt * 0.25));
  sh.addColorStop(0, `rgba(0, 0, 0, ${0.42 - alt * 0.2})`);
  sh.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(0, 0, 110, 0, TAU);
  ctx.fill();
  ctx.restore();

  if (age < 0.3) ctx.translate(0, -90 * (1 - (age / 0.3) ** 2));
  if (alt > 0.01) ctx.translate(0, -alt * (d.hoverH + Math.sin(t * 3.2) * 1.4));
  const squash = age >= 0.3 && age < 0.6 ? Math.sin(((age - 0.3) / 0.3) * Math.PI) : 0;
  ctx.translate(0, FEET);
  ctx.scale(d.scale * (1 + 0.1 * squash), d.scale * (1 - 0.12 * squash));
  ctx.translate(0, -FEET);
  if (moving && alt < 0.1) {
    ctx.translate(0, FEET);
    ctx.rotate(0.025 + sn * 0.025);
    ctx.translate(0, -FEET);
  }
  // roaring he shudders
  if (roar > 0) ctx.translate(Math.sin(t * 62) * 0.5 * roar, 0);

  const swing = moving && alt < 0.1 ? 1 : 0;
  const breathe = dead ? 0 : Math.sin(t * 1.7);
  const tail = ZORD_TAIL.map(([x, y, r], i) => {
    const wave = dead ? 0 : Math.sin(t * (moving ? 5.2 : 1.8) - i * 0.8) * i * (moving ? 1.3 : 0.9);
    return [x, y + wave + alt * i * 1.6, r];
  });
  const m = {
    tail,
    legs: [
      { a: swing * sn * 0.16 + alt * 0.22, lift: swing * Math.max(0, cs) * 8 },
      { a: -swing * sn * 0.16 + alt * 0.14, lift: swing * Math.max(0, -cs) * 8 },
    ],
    arms: [
      roar > 0 ? -0.55 * roar : firing ? -0.22 + Math.sin(t * 30) * 0.03 : swing * -sn * 0.14 + breathe * 0.04 - charge * 0.2,
      roar > 0 ? -0.45 * roar : firing ? -0.16 : swing * sn * 0.14 - breathe * 0.03 - charge * 0.14,
    ],
    bob: swing * Math.abs(cs) * 3.4 + breathe * 1.1,
    jaw: roar > 0 ? 0.78 * roar + Math.sin(t * 40) * 0.04 * roar : firing ? 0.55 + Math.sin(t * 38) * 0.04 : charge * 0.3,
    // he braces: head thrown back to roar or drawn back to charge, then dipped toward whoever he is burning
    headTilt: firing ? Math.max(-0.2, Math.min(0.34, u.aim * 0.6)) + Math.sin(t * 34) * 0.012 : roar > 0 ? -0.34 * roar : -0.18 * charge,
    glow: dead
      ? () => 0
      : firing ? (i) => 0.75 + 0.25 * Math.sin(t * 16 - i * 0.9)
        : roar > 0 ? (i) => (Math.sin(t * 22 - i * 0.8) > -0.2 ? roar : 0)
          : charge > 0 ? (i, n) => (charge * 1.15 > (n - 1 - i) / n ? 1 : 0)
            : () => 0,
  };

  const power = age < 0.55 ? 0 : age < 0.9 ? (Math.sin(age * 70) > 0 ? 1 : 0.15) : 1;
  const angry = firing || charge > 0 || roar > 0.3;
  const blink = !angry && t % 3.7 < 0.16 ? Math.sin(((t % 3.7) / 0.16) * Math.PI) : 0;
  drawZordRig(ctx, A, m, (g) => {
    g.save();
    g.scale(K, K);
    zordEye(g, { lx: angry ? 1 : Math.sin(t * 0.8) * 0.8, ly: angry ? 0.2 : Math.sin(t * 1.5) * 0.5, lid: blink, angry, power, dead });
    g.restore();
    if (!dead && power > 0.5) botGlow(g, ZORD_EYE.x * K, ZORD_EYE.y * K, (angry ? 16 : 12) * K, '70, 255, 205', angry ? 0.5 : 0.24);
    if (firing || charge > 0.4) botGlow(g, 66 * K, -97 * K, (firing ? 20 + 3 * Math.sin(t * 40) : 14 * charge) * K, '255, 170, 60', firing ? 0.75 : 0.6 * charge);
  });

  // the core in his chest beats, and blazes while he breathes
  if (!dead && power > 0.5) {
    const hot = firing ? 1 : charge;
    const beat = 0.5 + 0.5 * Math.sin(t * (3 + hot * 22));
    const cx = ZORD_CORE.x * K;
    const cy = (ZORD_CORE.y - m.bob) * K;
    botGlow(ctx, cx, cy, (11 + 3 * beat + 14 * hot) * K, '70, 255, 205', 0.4 + 0.25 * beat + 0.35 * hot);
    ctx.fillStyle = `rgba(225, 255, 247, ${0.45 + 0.35 * beat + 0.2 * hot})`;
    ctx.beginPath();
    ctx.arc(cx, cy, (2.2 + 1.8 * hot) * K, 0, TAU);
    ctx.fill();
  }
  // as the fire builds, lightning jumps from blade to blade up his back
  if (charge > 0.12) {
    const lit = m.blades.filter((_, i) => charge * 1.15 > (m.blades.length - 1 - i) / m.blades.length);
    ctx.save();
    ctx.scale(K, K);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'miter';
    for (let i = 0; i + 1 < lit.length; i++) {
      if (Math.random() < 0.4) continue;
      const tipOf = ([x, y, ang, len]) => [x + Math.cos(ang) * len * 0.9, y + Math.sin(ang) * len * 0.9];
      const [x0, y0] = tipOf(lit[i]);
      const [x1, y1] = tipOf(lit[i + 1]);
      const mx = (x0 + x1) / 2 + (Math.random() - 0.6) * 14;
      const my = (y0 + y1) / 2 + (Math.random() - 0.6) * 14;
      for (const [col, wide] of [['rgba(60, 235, 200, 0.85)', 3.4], ['#f2fffc', 1.2]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = wide;
        ctx.beginPath();
        ctx.moveTo(x0, y0);
        ctx.lineTo(mx, my);
        ctx.lineTo(x1, y1);
        ctx.stroke();
      }
    }
    ctx.restore();
  }
  // each roar rings out from his mouth
  if (roar > 0) {
    ctx.lineCap = 'round';
    for (let i = 0; i < 3; i++) {
      const q = (roarAt * 3.2 + i / 3) % 1;
      ctx.strokeStyle = `rgba(112, 190, 180, ${0.85 * (1 - q) * roar})`;
      ctx.lineWidth = (2.6 - 1.6 * q) * K * 1.4;
      ctx.beginPath();
      ctx.arc(66 * K, -102 * K, (16 + 46 * q) * K, -0.95, 0.55);
      ctx.stroke();
    }
  }

  burnGlow(ctx, u, 62 * K, 54 * K);
  // a hit flashes white over his chest, and sparks crawl over him when he is badly hurt
  if (!dead && u.hit > 0) botGlow(ctx, 2 * K, -48 * K, 62 * K, '235, 244, 255', Math.min(0.6, u.hit * 3));
  if (!dead && u.hp < d.hp * 0.4 && Math.sin(t * 7.3) > 0.9) {
    ctx.translate(0, -44 * K);
    drawZaps(ctx, 3);
  }
}

// Jet Trooper: walks and lobs rockets, and every so often lifts off on his jetpack and fights from the air. The fire
// under him is made by the world, from the same flames as the flamethrower's.
function drawJetTrooper(ctx, dpr, sprites, u) {
  const A = sprites.jettrooper;
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const alt = dead ? 0 : u.alt || 0;
  const air = alt > 0.12;
  const moving = u.moving && !dead && !air;
  const ph = (u.anim * Math.PI) / 2;
  const pose = u.pose;
  const kick = dead ? 0 : u.recoil || 0;

  placeUnit(ctx, dpr, u, u.hit > 0 ? (Math.random() - 0.5) * 2 : 0);
  // his shadow stays on the ground, shrinking as he climbs
  if (air) {
    ctx.fillStyle = `rgba(40, 42, 54, ${0.28 - 0.12 * alt})`;
    ctx.beginPath();
    ctx.ellipse(0, FEET + 2, 10 - 3 * alt, 3.2 - alt, 0, 0, TAU);
    ctx.fill();
  }
  if (age > 0.26 && age < 0.8) {
    const q = (age - 0.26) / 0.54;
    ctx.strokeStyle = `rgba(150, 148, 160, ${0.55 * (1 - q)})`;
    ctx.lineWidth = 2.4 * (1 - q) + 0.5;
    ctx.beginPath();
    ctx.ellipse(0, FEET + 1, 10 + 24 * q, 3.4 + 8 * q, 0, 0, TAU);
    ctx.stroke();
  }
  if (age < 0.28) ctx.translate(0, -50 * (1 - (age / 0.28) ** 2));
  ctx.translate(0, -alt * (d.fly.height + Math.sin(t * 3.4) * 2));
  const squash = age >= 0.28 && age < 0.55 ? Math.sin(((age - 0.28) / 0.27) * Math.PI) : 0;
  ctx.translate(0, FEET);
  ctx.scale(d.scale * (1 + 0.2 * squash), d.scale * (1 - 0.22 * squash));
  ctx.translate(0, -FEET);
  if (air) {
    // leaning into the flight
    ctx.rotate((u.moving ? 0.14 : 0.04) + Math.sin(t * 2.3) * 0.04);
  }

  if (air) {
    // legs dangling
    ctx.save();
    ctx.translate(-1.5 * alt * K * 3, 1.5 * alt * K * 3);
    ctx.rotate(0.12 * alt);
    drawLayer(ctx, A.feet[1]);
    ctx.restore();
  } else drawLayer(ctx, A.feet[moving ? (u.anim | 0) & 3 : 0]);
  if (moving) {
    const wk = Math.abs(Math.sin(ph));
    ctx.translate(0, FEET);
    ctx.rotate(0.06 + Math.sin(ph) * 0.035);
    ctx.scale(1 + 0.045 * (1 - wk), 1 - 0.06 * (1 - wk));
    ctx.translate(0, -FEET - wk * 1.8);
  } else if (!dead && !air) ctx.translate(0, Math.sin(t * 2.4) * 0.6);
  if (kick > 0) {
    ctx.translate(-9 * kick * K, 0);
    ctx.rotate(-0.12 * kick);
  }

  drawLayer(ctx, A.pack);
  drawLayer(ctx, A.torso);

  const power = age < 0.5 ? 0 : age < 0.85 ? (Math.sin(age * 70) > 0 ? 1 : 0.15) : 1;
  const aiming = pose > 0.6 && !!u.target && !dead;
  const blink = !aiming && t % 3.3 < 0.16 ? Math.sin(((t % 3.3) / 0.16) * Math.PI) : 0;
  ctx.save();
  ctx.scale(K, K);
  trooperEyes(ctx, { lx: aiming ? 1 : Math.sin(t * 0.9) * 0.9, ly: aiming ? Math.sin(u.aim) : Math.sin(t * 1.7) * 0.5, lid: blink, angry: aiming, power, dead });
  ctx.restore();
  if (!dead && power > 0.5) botGlow(ctx, 10.6 * K, -4.6 * K, 11 * K, '70, 255, 205', aiming ? 0.32 : 0.18);

  burnGlow(ctx, u, 20.7 * K, 23 * K);
  if (!dead) drawHitFlash(ctx, u, 20.9 * K, 23.2 * K);

  ctx.translate(lerp(8 * K, 8 * K, pose), lerp(12 * K, 10 * K, pose));
  ctx.rotate(dead ? 0.9 : lerp(0.28 + (moving ? Math.sin(ph) * 0.1 : 0), u.aim - kick * 0.3, pose));
  ctx.translate(-kick * 6 * K, 0);
  drawLayer(ctx, (u.reload || 0) < 0.45 && !dead ? A.gunLoaded : A.gun);
  if (!dead && u.hit > 0.14) {
    ctx.setTransform(u.facing * dpr, 0, 0, dpr, u.x * dpr, (u.y - alt * d.fly.height) * dpr);
    drawZaps(ctx, 2);
  }
}

function drawFlamethrower(ctx, dpr, sprites, u) {
  const A = sprites[u.species];
  const dd = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  ctx.translate(lerp(8 * K, dd.pivot.x, pose), lerp(11 * K, dd.pivot.y, pose));
  ctx.rotate(lerp(0.06, u.aim, pose));
  drawLayer(ctx, u.firing ? A.gunFire : A.gun);
}

function drawRoman(ctx, dpr, sprites, u) {
  const A = sprites[u.species];
  const pose = u.pose;
  eggBase(ctx, dpr, sprites, A, u);
  const body = ctx.getTransform();
  // Standing around the sword is held upright in front; fighting, it levels out and jabs.
  const p = 1 - u.atk;
  const thrust = u.atk > 0 ? Math.sin(p * Math.PI) * 16 * K : 0;
  ctx.translate(lerp(5.4 * K, -4 * K, pose), lerp(23.3 * K, 4 * K, pose));
  ctx.rotate(lerp(-1.32, u.aim - 0.04, pose));
  ctx.translate(pose * thrust, 0);
  drawLayer(ctx, A.spear);
}

function drawGrenadier(ctx, dpr, sprites, u) {
  const A = sprites[u.species];
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  let p = 0;
  if (u.throwT > 0) p = 1 - u.throwT / d.throwTime;
  if (p > 0.65) return; // the bomb has left the hand
  // the arm lifts the bomb up and back for the throw
  const lift = Math.sin(Math.min(1, p / 0.65) * Math.PI * 0.5);
  ctx.translate(lerp(17 * K, 8 * K, lift), lerp(12 * K, -17 * K, lift));
  ctx.rotate(lift * -0.6);
  const lit = u.pose > 0.5 && u.cdT < 0.9 && u.cdT > 0;
  drawLayer(ctx, lit ? A.bombLit : A.bomb);
}

function drawArcher(ctx, dpr, sprites, u) {
  const A = sprites.archer;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  // carried low with the arrow pointing down and forward, raised level to shoot
  ctx.translate(lerp(24 * K, d.pivot.x, pose), lerp(10 * K, d.pivot.y, pose));
  ctx.rotate(lerp(0, u.aim, pose));
  const draw = u.drawT > 0 ? Math.min(1, u.drawT / d.drawTime) : 0;
  // the bow jolts forward as the arrow leaves
  ctx.translate(u.recoil * 2.2 * K, 0);
  drawLayer(ctx, draw > 0 ? A.bowDrawn : A.bow);
  if (u.reloadT <= 0) {
    ctx.save();
    ctx.translate(-10 * K * draw - 1 * K, 0);
    ctx.scale(1.0, 1.0);
    drawLayer(ctx, A.arrow);
    ctx.restore();
  }
}

// Knight, with his lance held out in front.
function drawKnight(ctx, dpr, sprites, u) {
  const A = sprites.knight;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  const p = 1 - u.atk;
  const thrust = u.atk > 0 ? Math.sin(p * Math.PI) * 18 * K : 0;
  ctx.translate(lerp(16 * K, 8 * K, pose), lerp(14 * K, 12 * K, pose));
  ctx.rotate(lerp(-1.05, u.aim - 0.12, pose));
  ctx.translate(thrust, 0);
  drawLayer(ctx, A.lance);
}

function drawNinja(ctx, dpr, sprites, u) {
  const A = sprites.ninja;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  const px = lerp(9 * K, 14 * K, pose);
  const py = lerp(12 * K, 10 * K, pose);
  const rest = lerp(-2.5, -0.8, Math.min(1, pose * 2)); // idle: blade held up and back
  let ang = rest;
  const slashing = u.atk > 0;
  const p = 1 - u.atk;
  if (slashing) {
    const a0 = u.swing > 0 ? -1.6 : 0.9;
    const a1 = u.swing > 0 ? 0.9 : -1.6;
    ang = lerp(a0, a1, Math.min(1, p * 1.25));
  }
  ctx.translate(px, py);
  ctx.rotate(slashing ? ang : rest);
  drawLayer(ctx, A.katana);
}

function drawCavalry(ctx, dpr, sprites, u) {
  const A = sprites.cavalry;
  const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
  placeUnit(ctx, dpr, u, wobble);
  drawLayer(ctx, A.shadow);
  const gait = u.moving ? ((u.anim * 0.8) | 0) & 3 : 4;
  if (u.moving) {
    ctx.translate(0, -Math.abs(Math.sin(u.anim * 0.8 * Math.PI * 0.5)) * 2.6);
    ctx.rotate(Math.sin(u.anim * 0.8 * Math.PI * 0.5) * 0.03);
  } else {
    ctx.translate(0, Math.sin(u.breath * 1.8) * 0.5);
  }
  drawLayer(ctx, A.horse[gait]);
  burnGlow(ctx, u, 30 * K, 14 * K);
  ctx.save();
  ctx.translate(-8 * K, -18 * K);
  ctx.scale(1.12, 1.12);
  drawLayer(ctx, A.rider);
  ctx.restore();
  // lance held out front; levels out when charging and jabs on a strike
  const p = 1 - u.atk;
  const thrust = u.atk > 0 ? Math.sin(p * Math.PI) * 20 * K : 0;
  ctx.translate(-3 * K, -14 * K);
  ctx.rotate(lerp(-0.64, -0.22, Math.max(u.charge, u.atk)));
  ctx.scale(0.7, 0.7);
  ctx.translate(thrust / 0.7, 0);
  drawLayer(ctx, A.lance);
}

// The cowboy: the sniper's look with a flintlock held low at his side, raised to
// aim and kicking back when it goes off.
function drawCowboy(ctx, dpr, sprites, u) {
  const A = sprites.cowboy;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  ctx.translate(lerp(14 * K, d.pivot.x, pose) - u.recoil * 2.2 * K, lerp(17 * K, d.pivot.y, pose));
  ctx.rotate(lerp(0.9, u.aim - u.recoil * 0.18, pose));
  ctx.scale(0.78, 0.78);
  drawLayer(ctx, A.pistol);
}

function drawZombie(ctx, dpr, sprites, u) {
  eggBase(ctx, dpr, sprites, sprites.zombie, u);
}

function drawSkeleton(ctx, dpr, sprites, u) {
  const A = sprites.skeleton;
  const d = u.def;
  eggBase(ctx, dpr, sprites, A, u);
  const pose = u.pose;
  const p = 1 - u.atk;
  ctx.translate(lerp(14 * K, 14 * K, pose), lerp(11 * K, 9 * K, pose));
  // chopping down from overhead
  const chop = u.atk > 0 ? -1.5 + p * 2.3 : lerp(-0.9, -0.35, pose);
  ctx.rotate(chop);
  drawLayer(ctx, A.sword);
}

function drawStaffUnit(ctx, dpr, sprites, u, id) {
  const A = sprites[id];
  eggBase(ctx, dpr, sprites, A, u);
  const cd = u.def.castTime;
  const cp = u.castT > 0 ? 1 - u.castT / cd : 0;
  ctx.translate(lerp(23 * K, 25 * K, u.pose), 0);
  ctx.rotate(u.castT > 0 ? Math.sin(cp * Math.PI) * 0.62 : 0);
  drawLayer(ctx, u.castT > 0 ? A.staffGlow : A.staff);
}

// The wizard: as he casts, his staff tips forward and a six-pointed light swells round the orb, pink for the bursting
// bolt, pale blue for lightning; as the spell leaves, the staff swings back and the light flashes.
function drawWizard(ctx, dpr, sprites, u) {
  const A = sprites.mage;
  eggBase(ctx, dpr, sprites, A, u);
  const casting = u.castT > 0 && u.castFire;
  const p = casting ? 1 - u.castT / u.def.castTime : 0;
  const flash = (u.castFlash || 0) / 0.24;
  const clock = performance.now() / 1000 + (u.id || 0);
  const tilt = 0.07 + (casting ? 0.4 * (1 - (1 - p) ** 2) : flash > 0.6 ? 0.2 * ((flash - 0.6) / 0.4) : 0);
  ctx.translate(lerp(21 * K, 20 * K, u.pose), 21 * K);
  ctx.rotate(tilt);
  const pink = casting && u.spell === 'burst';
  const rgb = pink ? '255, 100, 232' : '140, 235, 255';
  const oy = -WIZ_STAFF * K;
  const power = casting ? p : flash;
  if (power > 0.02) {
    botGlow(ctx, 0, oy, (11 + 9 * power) * K, rgb, 0.75);
    const r = (8 + 8 * power) * K;
    ctx.fillStyle = `rgba(${rgb}, ${0.55 * Math.min(1, power * 1.6)})`;
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const an = (i / 12) * TAU + clock * 1.5;
      const rr = i % 2 ? r * 0.62 : r * 1.2;
      if (i) ctx.lineTo(Math.cos(an) * rr, oy + Math.sin(an) * rr);
      else ctx.moveTo(Math.cos(an) * rr, oy + Math.sin(an) * rr);
    }
    ctx.closePath();
    ctx.fill();
  } else botGlow(ctx, 0, oy, 10 * K, rgb, 0.4 + 0.1 * Math.sin(clock * 2.5));
  drawLayer(ctx, pink ? A.staffPink : A.staff);
}

// his spells: pink bolts with a soft tail, the round pink burst where one lands, and the lightning
function drawSpells(ctx, world) {
  ctx.save();
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const o of world.orbs) {
    const len = Math.hypot(o.vx, o.vy) || 1;
    const ux = o.vx / len;
    const uy = o.vy / len;
    const tail = Math.min(11, o.gone);
    const gr = ctx.createLinearGradient(o.x - ux * tail, o.y - uy * tail, o.x, o.y);
    gr.addColorStop(0, 'rgba(240, 110, 245, 0)');
    gr.addColorStop(1, 'rgba(240, 110, 245, 0.9)');
    ctx.strokeStyle = gr;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(o.x - ux * tail, o.y - uy * tail);
    ctx.lineTo(o.x - ux * 2, o.y - uy * 2);
    ctx.stroke();
    botGlow(ctx, o.x, o.y, 7.5, '245, 120, 250', 0.5);
    ctx.fillStyle = '#ffe2ff';
    ctx.strokeStyle = '#e866f2';
    ctx.lineWidth = 1.9;
    ctx.beginPath();
    ctx.arc(o.x, o.y, 2.6, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
  for (const e of world.bursts) {
    const q = e.age / e.life;
    const r = e.r * (0.4 + 0.9 * (1 - (1 - q) ** 2));
    const fade = 1 - q;
    const gr = ctx.createRadialGradient(e.x, e.y, 0, e.x, e.y, r);
    gr.addColorStop(0, `rgba(255, 255, 255, ${0.95 * fade})`);
    gr.addColorStop(0.45, `rgba(245, 130, 250, ${0.65 * fade * fade})`);
    gr.addColorStop(1, `rgba(240, 150, 250, ${0.18 * fade})`);
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(e.x, e.y, r, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = `rgba(214, 120, 235, ${0.7 * fade})`;
    ctx.lineWidth = 1.1;
    ctx.stroke();
  }
  for (const a of world.arcs) {
    const fade = Math.min(1, (a.life - a.age) / 0.2);
    // each leap bends gently two or three times, and the bends shift as it burns
    let seed = Math.floor(a.age * 24) * 31 + Math.floor(a.pts[0][0] * 7) + 5;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    rnd();
    const path = [a.pts[0]];
    for (let i = 1; i < a.pts.length; i++) {
      const [x0, y0] = a.pts[i - 1];
      const [x1, y1] = a.pts[i];
      const len = Math.hypot(x1 - x0, y1 - y0) || 1;
      const n = Math.max(2, Math.round(len / 18));
      for (let k = 1; k < n; k++) {
        const off = (rnd() - 0.5) * 6;
        path.push([x0 + ((x1 - x0) * k) / n - ((y1 - y0) / len) * off, y0 + ((y1 - y0) * k) / n + ((x1 - x0) / len) * off]);
      }
      path.push([x1, y1]);
    }
    for (const [col, wide] of [
      [`rgba(150, 190, 255, ${0.22 * fade})`, 6.5],
      [`rgba(160, 200, 255, ${0.55 * fade})`, 3],
      [`rgba(255, 255, 255, ${fade})`, 1.1],
    ]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = wide;
      ctx.beginPath();
      path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
  }
  ctx.restore();
}

const DRAWERS = {
  zombie: drawZombie,
  skeleton: drawSkeleton,
  mage: drawWizard,
  necromancer: (ctx, dpr, sprites, u) => drawStaffUnit(ctx, dpr, sprites, u, 'necromancer'),
  ...Object.fromEntries(CREATURE_IDS.map((id) => [id, (ctx, dpr, sprites, u) => drawCreature(ctx, dpr, sprites, u, burnOverlay)])),
  flamethrower: drawFlamethrower,
  trooper: drawTrooper,
  jettrooper: drawJetTrooper,
  juggernaut: drawJuggernaut,
  mechazord: drawMechaZord,
  roman: drawRoman,
  grenadier: drawGrenadier,
  archer: drawArcher,
  knight: drawKnight,
  ninja: drawNinja,
  cavalry: drawCavalry,
  cowboy: drawCowboy,
};

export function drawUnit(ctx, dpr, sprites, u) {
  DRAWERS[u.species](ctx, dpr, sprites, u);
}

// A robot shorting out in water: arcs jumping over him, more skittering across the water, rings spreading from his
// feet and a few sparks flying; when he has dropped, a last crackle and a wisp of smoke. World coordinates.
export function drawShortCircuit(ctx, dpr, c) {
  const u = c.u;
  const age = c.age;
  const live = age < ZAP_TIME ? 1 : Math.max(0, 1 - (age - ZAP_TIME) / 0.55);
  const s = u.def.scale || 1;
  const wide = u.species === 'juggernaut';
  const big = u.def.creature ? u.def.radius * 1.6 : 0;
  const zord = u.species === 'mechazord';
  const rx = zord ? 62 * K * s : big || (wide ? 36 : 23) * K * s;
  const ry = zord ? 54 * K * s : big ? big * 0.8 : (wide ? 29 : 25) * K * s;
  const cx = u.x - (wide ? u.facing * 2 * K * s : 0);
  const cy = u.y + FEET + ((zord ? -48 : wide ? -8 : 0) * K - FEET) * s;
  const feet = u.y + FEET;
  // the shapes hold for a twentieth of a second, then jump
  let seed = (Math.floor(age * 22) + 1) * 97 + (u.id || 0) * 31;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  rnd();
  rnd();
  ctx.save();
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'miter';
  const bolt = (x0, y0, x1, y1, jag, alpha, wide) => {
    const pts = [[x0, y0]];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    for (let i = 1; i < 5; i++) {
      const k = i / 5;
      const off = (rnd() - 0.5) * jag;
      pts.push([x0 + (x1 - x0) * k - ((y1 - y0) / len) * off, y0 + (y1 - y0) * k + ((x1 - x0) / len) * off]);
    }
    pts.push([x1, y1]);
    for (const [col, w] of [[`rgba(70, 190, 255, ${0.85 * alpha})`, 1.7], [`rgba(255, 255, 255, ${alpha})`, 0.6]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w * wide;
      ctx.beginPath();
      pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
  };

  // rings spreading over the water
  const spread = Math.max(0, 1 - age / (ZAP_TIME + 0.9));
  for (let i = 0; i < 2; i++) {
    const q = (age * 1.9 + i * 0.5) % 1;
    ctx.strokeStyle = `rgba(255, 255, 255, ${0.9 * (1 - q) * spread})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.ellipse(cx, feet, rx * (0.7 + q * 0.9), rx * (0.7 + q * 0.9) * 0.34, 0, 0, TAU);
    ctx.stroke();
  }

  if (live > 0) {
    // a flickering blue-white light over him
    const flick = rnd() > 0.45 ? 1 : 0.35;
    const gr = ctx.createRadialGradient(cx, cy, 1, cx, cy, rx * 1.5);
    gr.addColorStop(0, `rgba(215, 248, 255, ${0.62 * flick * live})`);
    gr.addColorStop(0.5, `rgba(90, 200, 255, ${0.28 * flick * live})`);
    gr.addColorStop(1, 'rgba(90, 200, 255, 0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(cx, cy, rx * 1.5, 0, TAU);
    ctx.fill();
    // arcs jumping about his body
    const n = age < ZAP_TIME ? 5 : 2;
    for (let i = 0; i < n; i++) {
      const a = rnd() * TAU;
      const b = a + 1 + rnd() * 2;
      const ra = 0.45 + rnd() * 0.75;
      const rb = 0.45 + rnd() * 0.75;
      bolt(cx + Math.cos(a) * rx * ra, cy + Math.sin(a) * ry * ra, cx + Math.cos(b) * rx * rb, cy + Math.sin(b) * ry * rb, rx * 0.62, live, 1);
    }
    // and running out across the water
    for (let i = 0; i < 3; i++) {
      const a = rnd() * TAU;
      const far = 1.15 + rnd() * 0.65;
      bolt(cx + Math.cos(a) * rx * 0.4, feet + Math.sin(a) * rx * 0.14, cx + Math.cos(a) * rx * far, feet + Math.sin(a) * rx * far * 0.34, rx * 0.34, 0.9 * live, 0.75);
    }
  }

  // sparks and drops of water thrown off
  for (let i = 0; i < 9; i++) {
    const q = (age * 2.6 + i / 9) % 1;
    if (age > ZAP_TIME) break;
    const a = (i / 9) * TAU + i * i;
    const x = cx + Math.cos(a) * rx * (0.55 + q * 1.1);
    const y = cy + Math.sin(a) * ry * (0.4 + q * 0.7) - Math.sin(q * Math.PI) * ry * 0.55;
    ctx.fillStyle = i % 3 === 0 ? `rgba(150, 220, 232, ${1 - q})` : i % 3 === 1 ? `rgba(255, 236, 120, ${1 - q})` : `rgba(120, 215, 255, ${1 - q})`;
    ctx.beginPath();
    ctx.arc(x, y, 1.5 * (1 - q) + 0.4, 0, TAU);
    ctx.fill();
  }

  // once he's down, thin smoke rises off him
  if (age > ZAP_TIME) {
    const t = age - ZAP_TIME;
    for (let i = 0; i < 4; i++) {
      const q = (t * 0.9 + i * 0.23) % 1;
      ctx.fillStyle = `rgba(120, 122, 138, ${0.45 * (1 - q) * Math.max(0, 1 - t / 1.4)})`;
      ctx.beginPath();
      ctx.arc(cx + Math.sin(q * 6 + i * 2) * 3 - u.facing * i * 2, cy - q * 17, 1.6 + q * 3.4, 0, TAU);
      ctx.fill();
    }
  }
  ctx.restore();
}

// ------------------------------------------------------------- effects
// A soft orange blob, drawn once and stamped for every part of a blast.
function makeBlob() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(64, 64, 4, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255, 190, 70, 1)');
  gr.addColorStop(0.55, 'rgba(250, 150, 45, 0.95)');
  gr.addColorStop(0.85, 'rgba(235, 105, 25, 0.55)');
  gr.addColorStop(1, 'rgba(235, 105, 25, 0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 128, 128);
  return c;
}
let blob = null;
const blobs = (() => {
  const mk = (rgb) => {
    const c = document.createElement('canvas');
    c.width = c.height = 64;
    const g = c.getContext('2d');
    const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32);
    gr.addColorStop(0, `rgba(${rgb}, 1)`);
    gr.addColorStop(0.55, `rgba(${rgb}, 0.8)`);
    gr.addColorStop(1, `rgba(${rgb}, 0)`);
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 64);
    return c;
  };
  return {
    yellow: mk('255, 226, 110'),
    orange: mk('247, 150, 62'),
    brown: mk('176, 104, 46'),
  };
})();

const discCache = new Map();
function softDisc(color, hard = 0.5) {
  const key = color + hard;
  let c = discCache.get(key);
  if (c) return c;
  c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(48, 48, 0, 48, 48, 48);
  gr.addColorStop(0, color);
  gr.addColorStop(hard, color);
  gr.addColorStop(1, color + '00');
  g.fillStyle = gr;
  g.fillRect(0, 0, 96, 96);
  discCache.set(key, c);
  return c;
}

const FIRE_RAMP = ['#ffd25a', '#ffc247', '#ffa83c', '#ff8f33', '#f98530', '#ee7b2c', '#dd7a30', '#cc7640'];

// one cloud of lobes, drawn solid into a scratch canvas first so overlapping lobes don't stack their alpha
let scratch = null;
function drawCloud(ctx, e, lumps, spr, r, spread, scale, alpha, rise) {
  if (!scratch) {
    scratch = document.createElement('canvas');
    scratch.width = scratch.height = 220;
  }
  const g = scratch.getContext('2d');
  const f = 110 / (r * 1.9);
  g.clearRect(0, 0, 220, 220);
  for (const l of lumps) {
    const rad = Math.max(1, r * 1.2 * l.s * scale) * f;
    g.drawImage(spr, 110 + l.x * r * spread * f - rad, 110 + l.y * r * spread * f - rad, rad * 2, rad * 2);
  }
  ctx.globalAlpha = alpha;
  ctx.drawImage(scratch, e.x - 110 / f, e.y - 110 / f - rise, 220 / f, 220 / f);
}
function fireColor(age) {
  return FIRE_RAMP[Math.min(FIRE_RAMP.length - 1, Math.floor((age / 0.46) * FIRE_RAMP.length))];
}

// A blast is a ring of overlapping blobs, the same ones for fire and smoke.
function lumpsOf(e) {
  if (e.lumps) return e.lumps;
  // a round, scalloped disc: a fat middle and a ring of lobes around it
  const out = [{ x: 0, y: 0, s: 0.8 }];
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = e.seed * 9 + (i / n) * TAU;
    out.push({ x: Math.cos(a) * 0.56, y: Math.sin(a) * 0.5, s: 0.4 + ((i * 53 + Math.floor(e.seed * 77)) % 6) / 100 });
  }
  e.lumps = out;
  return out;
}

export function drawFlames(ctx, world, under) {
  if (!blob) blob = makeBlob();
  for (const f of world.flames) {
    if (!!f.under !== under) continue;
    const t = f.age / f.life;
    const r = (f.size + f.grow * t) * (f.small ? 1 : 1.12);
    const spr = t < 0.3 ? blobs.yellow : f.dark && t > 0.62 ? blobs.brown : blobs.orange;
    ctx.globalAlpha = Math.max(0, (t < 0.1 ? 0.75 + t * 2 : 0.92) * (1 - t * t * t));
    ctx.drawImage(spr, f.x - r, f.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;
  if (!under) drawSpells(ctx, world);
}

// the Jet Trooper's rockets: a stubby grey rocket with a red nose (its fire trail is ordinary flame)
function drawRockets(ctx, world) {
  for (const k of world.rockets) {
    ctx.save();
    ctx.translate(k.x, k.y);
    ctx.rotate(Math.atan2(k.ty - k.sy, k.tx - k.sx));
    ctx.lineWidth = 0.8;
    ctx.strokeStyle = '#15131b';
    ctx.fillStyle = '#6d7389';
    ctx.beginPath();
    ctx.roundRect(-5, -2.2, 8.4, 4.4, 1.4);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#e0523c';
    ctx.beginPath();
    ctx.moveTo(3.4, -2.2);
    ctx.quadraticCurveTo(9, 0, 3.4, 2.2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#4f6a62';
    ctx.beginPath();
    ctx.moveTo(-5, -2);
    ctx.lineTo(-7.6, -4.2);
    ctx.lineTo(-2.6, -2.2);
    ctx.moveTo(-5, 2);
    ctx.lineTo(-7.6, 4.2);
    ctx.lineTo(-2.6, 2.2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

export function drawFx(ctx, dpr, sprites, world) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!blob) blob = makeBlob();

  // flamethrower fire (and the flames on burning units): soft blobs that begin as
  // small pale-yellow dots, swell into orange smudges, and end up charred brown
  drawFlames(ctx, world, false);
  drawRockets(ctx, world);

  // bombs in the air: a round black bomb with a glint and a yellow fuse spark, looking bigger at the top of its arc,
  // with a small grey shadow sliding along the ground below
  for (const b of world.bombs) {
    const p = b.age / b.dur;
    const gx = lerp(b.x0, b.x1, p);
    const gy = lerp(b.y0, b.y1, p);
    ctx.fillStyle = 'rgba(80, 82, 94, 0.34)';
    ctx.beginPath();
    ctx.ellipse(gx, gy + FEET * 0.8, 2.2, 1.3, 0, 0, TAU);
    ctx.fill();
    const lift = 4 * p * (1 - p);
    const r = 2.3 + 1.4 * lift;
    ctx.save();
    ctx.translate(gx, gy - b.h * lift);
    ctx.rotate(b.age * b.spin);
    ctx.fillStyle = '#26252d';
    ctx.strokeStyle = '#0f0e14';
    ctx.lineWidth = 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.arc(-r * 0.35, -r * 0.35, r * 0.24, 0, TAU);
    ctx.fill();
    ctx.fillStyle = (b.age * 18) % 2 < 1 ? '#ffd23f' : '#ffab2e';
    ctx.beginPath();
    ctx.arc(r * 0.85, -r * 0.85, r * 0.34, 0, TAU);
    ctx.fill();
    ctx.restore();
  }

  // explosions, as in the original: a yellow flash with a pale halo, a flat lumpy orange disc that
  // darkens, then a beige smoke cloud that hangs about and fades slowly
  for (const e of world.blasts) {
    const age = e.age;
    const r = e.r * 1.28;
    const lumps = lumpsOf(e);
    if (age < 0.5) {
      const grow = 1 - (1 - Math.min(1, age / 0.36)) ** 2;
      const fire = age < 0.4 ? 1 : 1 - (age - 0.4) / 0.1;
      if (age < 0.09) {
        ctx.globalAlpha = 0.5;
        ctx.drawImage(softDisc('#fff3b0'), e.x - r * 0.75, e.y - r * 0.75, r * 1.5, r * 1.5);
      }
      drawCloud(ctx, e, lumps, softDisc(fireColor(age), 0.72), r, grow, 0.34 + 0.66 * grow, Math.max(0, fire) * (age < 0.1 ? 1 : 0.92), 0);
      if (age > 0.08 && age < 0.45) {
        const q = (age - 0.08) / 0.37;
        ctx.globalAlpha = 0.28 * (1 - q);
        ctx.strokeStyle = '#fff6cf';
        ctx.lineWidth = r * 0.1;
        ctx.beginPath();
        ctx.arc(e.x, e.y, r * (0.9 + 0.7 * q), 0, TAU);
        ctx.stroke();
      }
    }
    if (age > 0.36) {
      const k = (age - 0.36) / (e.life - 0.36);
      const a = Math.min(1, (age - 0.36) / 0.12) * 0.42 * (1 - k) ** 1.3;
      drawCloud(ctx, e, lumps, softDisc('#e2d9d5', 0.66), r, 1.05, 0.95 + 0.25 * k, a, (age - 0.36) * 5);
    }
  }
  ctx.globalAlpha = 1;

  // arrows in flight
  const arrow = sprites.archer.arrow;
  for (const a of world.arrows) {
    const p = Math.min(1, a.age / a.dur);
    const gx = lerp(a.x0, a.x1, p);
    const gy = lerp(a.y0, a.y1, p);
    if (a.kind === 'star') {
      if (a.age < 0) continue;
      // a four-pointed silver throwing star, spinning, with a shadow on the ground
      ctx.fillStyle = 'rgba(80, 82, 94, 0.3)';
      ctx.beginPath();
      ctx.ellipse(gx, gy + FEET * 0.8, 2.6, 1, 0, 0, TAU);
      ctx.fill();
      ctx.save();
      ctx.translate(gx, gy - 4 * a.h * p * (1 - p));
      ctx.rotate(a.age * 22);
      ctx.fillStyle = '#858a99';
      ctx.strokeStyle = '#3c3f4c';
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      for (let i = 0; i < 8; i++) {
        const r = i % 2 === 0 ? 2.5 : 0.6;
        const ang = (i / 8) * TAU;
        if (i === 0) ctx.moveTo(Math.cos(ang) * r, Math.sin(ang) * r);
        else ctx.lineTo(Math.cos(ang) * r, Math.sin(ang) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = '#7c8190';
      ctx.beginPath();
      ctx.arc(0, 0, 0.7, 0, TAU);
      ctx.fill();
      ctx.restore();
      continue;
    }
    // as measured in the original: the shadow is a soft grey dash sliding along the ground under the arrow, and the
    // arrow itself (red tail, brown shaft, grey point) tips over as it follows its high slow arc
    const ground = Math.atan2(a.y1 - a.y0, a.x1 - a.x0);
    ctx.strokeStyle = 'rgba(90, 92, 102, 0.34)';
    ctx.lineCap = 'round';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(gx - Math.cos(ground) * 4.2, gy + FEET * 0.8 - Math.sin(ground) * 4.2);
    ctx.lineTo(gx + Math.cos(ground) * 4.2, gy + FEET * 0.8 + Math.sin(ground) * 4.2);
    ctx.stroke();
    const slope = a.y1 - a.y0 - 4 * a.h * (1 - 2 * p);
    ctx.save();
    ctx.translate(gx, gy - 4 * a.h * p * (1 - p));
    ctx.rotate(Math.atan2(slope, a.x1 - a.x0));
    ctx.strokeStyle = '#7b5a3c';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-4.8, 0);
    ctx.lineTo(3.4, 0);
    ctx.stroke();
    ctx.fillStyle = '#e0403a';
    ctx.beginPath();
    ctx.moveTo(-6.8, 0);
    ctx.lineTo(-5, -1.8);
    ctx.lineTo(-3.2, 0);
    ctx.lineTo(-5, 1.8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#5a5d68';
    ctx.beginPath();
    ctx.moveTo(5.6, 0);
    ctx.lineTo(2.4, -1.6);
    ctx.lineTo(3.2, 0);
    ctx.lineTo(2.4, 1.6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  // headgear blown into the air
  for (const d of world.debris) {
    const sh = Math.max(0.35, 1 - d.z / 220);
    ctx.fillStyle = `rgba(0, 0, 0, ${0.2 * sh})`;
    ctx.beginPath();
    ctx.ellipse(d.x, d.y + FEET * 0.7, 9 * UNIT * sh, 3 * UNIT * sh, 0, 0, TAU);
    ctx.fill();
    ctx.save();
    ctx.translate(d.x, d.y + FEET * 0.7 - d.z);
    ctx.rotate(d.rot);
    ctx.scale(UNIT, UNIT);
    drawDrop(ctx, d.species);
    ctx.restore();
  }
}

// ------------------------------------------------------------- ground marks
// Headgear and stuck arrows left on the ground. They are small pre-drawn
// sprites that fade out and disappear after MARK_LIFE seconds.
export const MARK_LIFE = 9;
const MARK_FADE = 3;
const markSprites = new Map();

function markSprite(key, w, h, draw) {
  let m = markSprites.get(key);
  if (m) return m;
  const sc = 3;
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * sc);
  c.height = Math.ceil(h * sc);
  const g = c.getContext('2d');
  g.scale(sc, sc);
  g.translate(w / 2, h / 2);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  draw(g);
  m = { c, w, h };
  markSprites.set(key, m);
  return m;
}

// What a unit leaves on the ground when it dies.
export function dropMark(species, x, y) {
  return {
    spr: markSprite('drop-' + species, 44, 30, (g) => (EGG_DROPS[species] || ((h) => drawDrop(h, species)))(g)),
    x: x + (Math.random() - 0.5) * 22 * UNIT,
    y: y + (Math.random() - 0.5) * 8 * UNIT,
    rot: (Math.random() - 0.5) * 1.7,
    k: UNIT,
    age: 0,
  };
}

// An arrow that missed (or hit) stays stuck in the ground for a while.
export function arrowMark(a) {
  const spr = markSprite('arrow', 16, 8, (g) => {
    g.translate(4.5, 0);
    g.strokeStyle = '#6b5a44';
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-6, 0);
    g.lineTo(0, 0);
    g.stroke();
    g.fillStyle = '#d83a35';
    g.strokeStyle = '#8f1f1f';
    g.lineWidth = 0.6;
    g.beginPath();
    g.moveTo(-9, -2.2);
    g.lineTo(-4.5, -0.2);
    g.lineTo(-4.5, 0.2);
    g.lineTo(-9, 2.2);
    g.closePath();
    g.fill();
    g.stroke();
  });
  const rot = Math.atan2(a.y1 - a.y0 + 4 * a.h, a.x1 - a.x0);
  // the video's stuck arrows are tiny red-tipped sticks that are gone in about five seconds
  const k = K * 1.05;
  return {
    spr,
    x: a.x1 - Math.cos(rot) * 4.5 * k,
    y: a.y1 - Math.sin(rot) * 4.5 * k,
    rot,
    k,
    age: 0,
    life: 5,
    fade: 1.1,
  };
}

export function stepMarks(marks, dt) {
  let gone = false;
  for (const m of marks) {
    m.age += dt;
    if (m.age >= (m.life || MARK_LIFE)) gone = true;
  }
  return gone ? marks.filter((m) => m.age < (m.life || MARK_LIFE)) : marks;
}

export function drawMarks(ctx, dpr, marks) {
  for (const m of marks) {
    const a = 0.92 * Math.min(1, ((m.life || MARK_LIFE) - m.age) / (m.fade || MARK_FADE));
    if (a <= 0) continue;
    ctx.globalAlpha = a;
    ctx.setTransform(dpr * Math.cos(m.rot) * m.k, dpr * Math.sin(m.rot) * m.k, -dpr * Math.sin(m.rot) * m.k, dpr * Math.cos(m.rot) * m.k, m.x * dpr, m.y * dpr);
    ctx.drawImage(m.spr.c, -m.spr.w / 2, -m.spr.h / 2, m.spr.w, m.spr.h);
  }
  ctx.globalAlpha = 1;
}

// ------------------------------------------------------------- palette icons
// [canvas width in art px, body x, body y, drawing]
const ICONS = {
  jettrooper: [104, 54, 62, (g, S) => {
    g.save();
    g.scale(K, K);
    trooperEyes(g, { lx: 0.7, ly: 0.2 });
    g.restore();
    g.translate(8 * K, 12 * K);
    g.rotate(0.2);
    drawLayer(g, S.gunLoaded);
  }],
  juggernaut: [104, 52, 68, null],
  mechazord: [240, 162, 176, null],
  trooper: [92, 44, 50, (g, S) => {
    g.save();
    g.scale(K, K);
    trooperEyes(g, { lx: 0.7, ly: 0.2 });
    g.restore();
    g.translate(8 * K, 12 * K);
    g.rotate(0.2);
    drawLayer(g, S.gun);
  }],
  flamethrower: [84, 34, 39, (g, S) => {
    g.translate(8 * K, 11 * K);
    g.rotate(0.03);
    drawLayer(g, S.gun);
  }],
  roman: [84, 32, 39, (g, S) => {
    g.translate(5.4 * K, 23.3 * K);
    g.rotate(-1.32);
    drawLayer(g, S.spear);
  }],
  grenadier: [84, 32.3, 39, (g, S) => {
    g.translate(17 * K, 12 * K);
    drawLayer(g, S.bombLit);
  }],
  archer: [84, 30, 39, (g, S) => {
    g.translate(24 * K, 6 * K);
    drawLayer(g, S.bow);
    g.translate(-1 * K, 0);
    g.scale(0.85, 0.85);
    drawLayer(g, S.arrow);
  }],
  cavalry: [84, 41, 39, null],
  cowboy: [84, 33, 39, (g, S) => {
    g.translate(11 * K, 16.5 * K);
    g.rotate(-0.05);
    g.scale(0.78, 0.78);
    drawLayer(g, S.pistol);
  }],
  ninja: [84, 32, 39, (g, S) => {
    g.translate(14 * K, 10 * K);
    g.rotate(-0.8);
    drawLayer(g, S.katana);
  }],
  zombie: [84, 33, 39, () => {}],
  skeleton: [84, 33, 39, (g, S) => {
    g.translate(14 * K, 11 * K);
    g.rotate(-0.8);
    drawLayer(g, S.sword);
  }],
  mage: [84, 37, 49, (g, S) => {
    g.translate(21 * K, 21 * K);
    g.rotate(0.07);
    drawLayer(g, S.staff);
  }],
  necromancer: [128, 54, 68, (g, S) => {
    g.translate(25 * K, 0);
    drawLayer(g, S.staff);
  }],
  knight: [84, 34, 39, (g, S) => {
    g.translate(8 * K, 12 * K);
    g.rotate(-0.95);
    drawLayer(g, S.lance);
  }],
};

export function hasIcon(species) {
  return species in ICONS || CREATURE_IDS.includes(species);
}

export function paintUnitIcon(canvas, sprites, species) {
  if (CREATURE_IDS.includes(species)) {
    paintCreatureIcon(canvas, sprites, species);
    return;
  }
  const [w, ox, oy, extra] = ICONS[species];
  const S = sprites[species];
  const g = canvas.getContext('2d');
  const m = canvas.width / (w * K);
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  g.translate((ox * canvas.width) / w, (oy * canvas.width) / w);
  g.scale(m, m);
  if (species === 'trooper' || species === 'jettrooper') drawLayer(g, S.pack);
  if (species === 'mechazord') {
    drawZordRig(g, S, ZORD_STILL, () => {
      g.save();
      g.scale(K, K);
      zordEye(g, { lx: 0.6, ly: 0.1 });
      g.restore();
    });
  } else if (species === 'juggernaut') {
    drawJugRig(g, S, JUG_REST, () => jugEye(g, { lx: 0.7, ly: 0.2 }));
  } else if (species === 'cavalry') {
    drawLayer(g, S.shadow);
    drawLayer(g, S.horse[4]);
    g.save();
    g.translate(-8 * K, -18 * K);
    g.scale(1.12, 1.12);
    drawLayer(g, S.rider);
    g.restore();
    g.translate(-3 * K, -14 * K);
    g.rotate(-0.64);
    g.scale(0.7, 0.7);
    drawLayer(g, S.lance);
  } else {
    drawLayer(g, S.feet[0]);
    drawLayer(g, S.torso);
    extra(g, S);
  }
  g.restore();
}
