import { TAU, K, UNIT, FEET, ZAP_TIME } from './config.js?v=269';
import { drawLayer, OUT, drawArcLine } from './sprites.js?v=269';
import { drawDrop, trooperEyes, BOT_JETS, drawJugArm, drawJugLeg, JUG_HEAD, ZORD_JAW, ZORD_WIDE, ZORD_HORNS, GATLING_WIDE, drawGatlingBarrels, drawGatlingDrum, drawGatlingBelt, MALF_CORE, MALF_SPOTS } from './art_units.js?v=269';
import { drawCreature, paintCreatureIcon, CREATURE_IDS } from './creatures.js?v=269';
import { EGG_DROPS, WIZ_STAFF } from './art_eggs.js?v=269';
import { drawZordGround, drawZordAir } from './zordfx.js?v=269';
import { drawGatlingGround, drawGatlingAir } from './gatlingfx.js?v=269';
import { drawMalfAir, limpPose } from './malf.js?v=269';
import { drawShieldAir } from './shield.js?v=269';
import { drawGibbondore, drawGibbonStill } from './gibbon.js?v=269';
import { drawGibbonGround, drawGibbonAir } from './gibbonfx.js?v=269';
import { drawGandalligator, drawGatorStill, drawGatorGround, drawGatorAir } from './gator.js?v=269';
import { drawChimera, drawChimeraStill, drawChimeraGround, drawChimeraAir } from './chimera.js?v=269';
import { rigStep, drawBotFeet, applyBotBody, applyBotCap, stepDust } from './botrig.js?v=269';
import { ZORD_LIFT, drawZordLeg, zordTail, drawZordTail, drawSwoosh } from './zordlimbs.js?v=269';

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
  // caught in his teal beam it glows with it
  if (u.spirit > 0) {
    ctx.fillStyle = `rgba(40, 218, 196, ${(0.5 + 0.14 * Math.sin(u.breath * 22)) * Math.min(1, u.spirit / 0.25)})`;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, TAU);
    ctx.fill();
    return; // and that fire stays its own colour
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

// ---------------------------------------------------------------- the Gatling Trooper
// How he stands is worked out once a frame and eased, so nothing about him snaps:
//   brace  0..1  feet planted wide, crouched and leaning back, while the cannon winds up and runs
//   lift   0..1  the cannon tipped up to cool after a volley (or to try its spin while he waits)
//   spinA, spinRate  the barrels, with the ammo drum and the belt geared to them
function gatlingMood(u, dead, aiming, R) {
  const clock = u.breath;
  const firing = !dead && u.burstLeft > 0;
  const winding = !dead && aiming && !firing && u.target && (u.cdT || 0) < 0.65;
  const wind = winding ? 1 - Math.max(0, u.cdT || 0) / 0.65 : 0;
  const dt = Math.min(0.05, Math.max(0, clock - (u.moodAt === undefined ? clock : u.moodAt)));
  u.moodAt = clock;
  // a volley ending starts him venting
  if (u.wasFiring && !firing && !dead) {
    u.ventAt = clock;
    if (u.rig) {
      // the recoil he was leaning into lets go all at once
      u.rig.s.lean.v += 1.8;
      u.rig.s.cap.v -= 55;
    }
  }
  u.wasFiring = firing;
  const vent = !dead && !firing && u.ventAt !== undefined && clock - u.ventAt < 0.85 ? (clock - u.ventAt) / 0.85 : 1;
  const test = R.fidget === 'tinker' ? Math.sin(R.q * Math.PI) : 0;
  const ease = (from, to, rate) => from + (to - from) * Math.min(1, dt * rate);
  const want = firing ? 36 : winding ? 6 + 30 * wind : test * 17;
  u.spinRate = ease(u.spinRate || 0, want, want > (u.spinRate || 0) ? 9 : 2.2);
  u.spinA = ((u.spinA || 0) + u.spinRate * dt) % TAU;
  u.drumA = ((u.drumA || 0) + u.spinRate * dt * 0.22) % TAU;
  u.feed = ((u.feed || 0) + u.spinRate * dt * 0.045) % 1;
  u.brace = ease(u.brace || 0, firing ? 1 : wind * 0.8, 11);
  u.lift = ease(u.lift || 0, vent < 1 ? Math.sin(Math.min(1, vent * 1.15) * Math.PI) : test * 0.55, 13);
  return { firing, winding, wind, vent, test, brace: u.brace, lift: u.lift };
}

// his drum, and the belt of rounds running from it into the cannon
function drawGatlingFeed(ctx, u) {
  ctx.save();
  ctx.scale(K, K);
  drawGatlingBelt(ctx, u.feed || 0);
  ctx.restore();
}

// the blur of barrels going round too fast to see
function gatlingBlur(ctx, amount) {
  ctx.fillStyle = `rgba(205, 213, 230, ${0.36 * amount})`;
  ctx.beginPath();
  ctx.roundRect(18 * K, -8 * K, 27 * K, 16 * K, 5 * K);
  ctx.fill();
}

// one clean tongue of flame at the muzzle, a different length every frame, with a white heart
function gatlingMuzzle(ctx, hot) {
  const x = 46;
  const len = (22 + Math.random() * 10) * hot;
  botGlow(ctx, (x + 6) * K, 0, 19 * K, '255, 180, 50', 0.65 * hot);
  for (const [col, k] of [['#ff9420', 1], ['#ffd23c', 0.7], ['#fffbe0', 0.4]]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x * K, -4 * k * K);
    ctx.lineTo((x + len * 0.34 * k) * K, -10 * k * K);
    ctx.lineTo((x + len * 0.46 * k) * K, -3.4 * k * K);
    ctx.lineTo((x + len * k) * K, 0);
    ctx.lineTo((x + len * 0.46 * k) * K, 3.4 * k * K);
    ctx.lineTo((x + len * 0.34 * k) * K, 10 * k * K);
    ctx.lineTo(x * K, 4 * k * K);
    ctx.closePath();
    ctx.fill();
  }
}

// a few puffs of steam off the barrels while they cool; `vent` runs 0..1
function gatlingSteam(ctx, vent) {
  const fade = Math.min(1, (1 - vent) * 2);
  for (let i = 0; i < 4; i++) {
    const q = (vent * 2.6 + i / 4) % 1;
    ctx.fillStyle = `rgba(148, 164, 192, ${0.85 * fade * (1 - q * q)})`;
    ctx.beginPath();
    ctx.arc((43 + Math.sin(q * 7 + i * 2) * 3) * K, (-5 - 24 * q) * K, (2.4 + 4.4 * q) * K, 0, TAU);
    ctx.fill();
  }
}

// The cannon in his hands.
function drawCannon(ctx, A, u, s, mood, R) {
  const { dead, pose, t } = s;
  const { firing, wind, vent } = mood;
  const heat = dead ? 0 : u.heat || 0;
  ctx.save();
  ctx.translate((6 + R.gunX) * K, lerp(14, 13, pose) * K);
  const held = lerp(0.24 + Math.cos(R.phase) * 0.13 * R.move + Math.sin(t * 2.4) * 0.03, u.aim, pose);
  ctx.rotate(dead ? 0.8 : held - mood.lift * 0.72 + R.gunA);
  // it hammers in his grip while it runs, and trembles as it winds up
  if (firing) ctx.translate((Math.random() - 0.75) * 3 * K, (Math.random() - 0.5) * 2 * K);
  else if (wind > 0) ctx.translate(0, Math.sin(t * 70) * wind * 0.6 * K);
  ctx.save();
  ctx.scale(K, K);
  drawGatlingBarrels(ctx, u.spinA || 0, heat);
  ctx.restore();
  const blur = dead ? 0 : Math.max(0, Math.min(1, ((u.spinRate || 0) - 12) / 20));
  if (blur > 0) gatlingBlur(ctx, blur);
  drawLayer(ctx, A.gun);
  drawLayer(ctx, A.hand);
  if (heat > 0.35) botGlow(ctx, 42 * K, 0, (10 + 3 * heat) * K, '255, 112, 35', (heat - 0.35) * 0.9);
  // winding up, a teal charge gathers at the muzzle
  if (wind > 0.04) {
    botGlow(ctx, 47 * K, 0, (6 + 10 * wind) * K, '70, 255, 205', 0.85 * wind);
    ctx.fillStyle = `rgba(235, 255, 250, ${wind})`;
    ctx.beginPath();
    ctx.arc(47 * K, 0, 2.6 * wind * K, 0, TAU);
    ctx.fill();
  }
  if (firing) gatlingMuzzle(ctx, u.flash > 0.02 ? 1 : 0.62);
  if (vent < 1) gatlingSteam(ctx, vent);
  ctx.restore();
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
  const heavy = u.species === 'gatlingtrooper';
  const A = sprites[u.species];
  const d = u.def;
  const size = d.scale || BOT_SCALE;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const pose = u.pose;
  const moving = u.moving && !dead;
  const aiming = pose > 0.6 && !dead;
  // just before he shoots he sinks into it
  const ready = !heavy && aiming && u.target && !(u.burstLeft > 0) && u.cdT > 0 && u.cdT < 0.32 ? 1 - u.cdT / 0.32 : 0;
  const braced = heavy ? u.brace || 0 : 0;
  const R = rigStep(u, {
    age, dead, moving,
    bang: u.flash,
    kick: heavy ? 0.14 : 1,
    cadence: heavy ? 1.8 : 2.25,
    calm: !u.target && !moving,
    busy: u.burstLeft > 0,
    fidgets: heavy ? ['look', 'tinker', 'tinker', 'stretch'] : ['look', 'look', 'tinker', 'stretch'],
    aim: { lean: -0.11 * braced - 0.07 * ready, squash: 0.08 * braced + 0.11 * ready },
  });
  const mood = heavy ? gatlingMood(u, dead, aiming, R) : null;

  placeUnit(ctx, dpr, u, u.hit > 0.14 ? (Math.random() - 0.5) * 1.6 : 0);

  // ---- on the ground: the shockwave of each shot
  const kick = u.recoil || 0;
  if (!heavy && kick > 0.05 && !dead) {
    ctx.strokeStyle = `rgba(120, 190, 235, ${0.5 * kick})`;
    ctx.lineWidth = 0.6 + 1.6 * kick;
    ctx.beginPath();
    ctx.ellipse(-2, FEET + 1, 10 + 17 * (1 - kick), 3.4 + 5.4 * (1 - kick), 0, 0, TAU);
    ctx.stroke();
  }
  if (heavy && mood.firing) botGlow(ctx, 20, FEET, 24, '255, 170, 50', 0.22);

  ctx.translate(0, FEET);
  ctx.scale(size, size);
  ctx.translate(0, -FEET);

  drawBotFeet(ctx, A, R, { spread: 4.5 * braced, clock: t });
  if (!dead) stepDust(ctx, R, heavy ? 1.15 : 1);

  applyBotBody(ctx, R);

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
  ctx.save();
  ctx.translate(0, R.pack * K);
  drawLayer(ctx, A.pack);
  if (heavy) {
    ctx.save();
    ctx.scale(K, K);
    drawGatlingDrum(ctx, -(u.drumA || 0));
    ctx.restore();
  }
  ctx.restore();

  drawLayer(ctx, A.torsoBare);
  if (heavy) drawGatlingFeed(ctx, u);

  // ---- eyes: boot up with a flicker, then look about, blink, narrow and spin up to aim
  let power = 1;
  if (age < 0.5) power = 0;
  else if (age < 0.85) power = Math.sin(age * 70) > 0 ? 1 : 0.15;
  if (!dead && u.hp < d.hp * 0.25 && Math.sin(t * 23) > 0.72) power = 0.2;
  // now and then a double blink
  const blinkT = t % 3.3;
  const again = (t % 9.9) - 0.26;
  let lid = !aiming && blinkT < 0.16 ? Math.sin((blinkT / 0.16) * Math.PI) : 0;
  if (!aiming && again > 0 && again < 0.16) lid = Math.sin((again / 0.16) * Math.PI);
  if (heavy && mood.vent < 1) lid = Math.max(lid, Math.sin(mood.vent * Math.PI) * 0.62);
  if (R.fidget === 'stretch') lid = Math.max(lid, Math.sin(R.q * Math.PI));
  let look = [Math.sin(t * 0.9) * 0.9 + 0.2, Math.sin(t * 1.7) * 0.5];
  if (aiming) look = [1, Math.sin(u.aim) * 1.2];
  else if (R.fidget === 'look') look = [Math.sin(R.q * TAU) * 1.5, -0.2];
  else if (R.fidget === 'tinker') look = [0.9, 0.9];
  else if (moving) look = [0.9, 0.25 + Math.sin(R.phase * 2) * 0.25];
  const calmEye = (heavy && mood.vent < 1) || R.happy;
  ctx.save();
  ctx.scale(K, K);
  if (heavy) ctx.translate(10.6 * (GATLING_WIDE - 1), 0);
  trooperEyes(ctx, { lx: look[0], ly: look[1], lid: R.happy ? 0 : lid, angry: aiming && !calmEye, happy: R.happy, spin: aiming ? t * 5 : Math.sin(t * 0.6) * 0.4, power, dead });
  ctx.restore();
  const eyeX = heavy ? 11.4 : 10.6;
  if (!dead && power > 0.5) botGlow(ctx, eyeX * K, -4.6 * K, (11 + (aiming ? 3 * Math.sin(t * 14) : Math.sin(t * 3))) * K, '70, 255, 205', aiming ? 0.34 : 0.18);

  // ---- helmet and antenna, bouncing on their own spring
  ctx.save();
  applyBotCap(ctx, R);
  botAntennae(ctx, dead ? 7 : R.ant + (heavy && mood.firing ? Math.sin(t * 60) * 2.4 : 0), !dead && t % 1.1 < 0.22);
  drawLayer(ctx, A.cap);
  ctx.restore();

  // a green scanning beam sweeps about while there's nobody to shoot
  if (!dead && !moving && pose < 0.35 && age > 0.9 && R.fidget !== 'tinker' && !R.happy) {
    const sa = (R.fidget === 'look' ? Math.sin(R.q * TAU) * 0.5 : Math.sin(t * 1.25) * 0.5) + 0.05;
    ctx.save();
    ctx.translate((eyeX + 4.4) * K, -4.6 * K);
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

  // ---- the blaster, or the cannon
  if (heavy) drawCannon(ctx, A, u, { dead, pose, t }, mood, R);
  else {
    // waiting about, he brings the blaster up to look it over, and gives it a pat of a shake
    const check = R.fidget === 'tinker' ? Math.sin(Math.min(1, R.q * 1.15) * Math.PI) ** 0.6 : 0;
    ctx.save();
    ctx.translate((8 + R.gunX - 3 * check) * K, (lerp(12, 11, pose) - 5 * check + (R.happy ? R.hop * 0.35 : 0)) * K);
    const held = lerp(0.3 + Math.cos(R.phase) * 0.17 * R.move + Math.sin(t * 2.5) * 0.035, u.aim, pose);
    ctx.rotate(dead ? 0.9 : held + R.gunA - check * 0.95 + (check > 0.7 ? Math.sin(t * 34) * 0.07 : 0) - R.happy * 0.55);
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
  }

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

// ---------------------------------------------------------------- Shield Trooper
// in art px; its back edge is about 41 ahead of his middle. wide / tall: how much bigger than that shape it is drawn
const SHIELD_AT = { top: -52, bottom: 32, mid: -10, wide: 1.18, tall: 1.24 };

function shieldShape(g) {
  const { top, bottom, mid } = SHIELD_AT;
  g.beginPath();
  g.moveTo(40, top + 4);
  g.quadraticCurveTo(48, top - 3, 54, top + 7);
  g.quadraticCurveTo(65, mid, 54, bottom - 7);
  g.quadraticCurveTo(48, bottom + 3, 40, bottom - 4);
  g.quadraticCurveTo(49, mid, 40, top + 4);
  g.closePath();
}

// the cracks that spread over it as it takes hits: some at two thirds gone, more at one third
const SHIELD_CRACKS = [
  [[[56, -34], [49, -27], [52, -19], [45, -13]], [[49, -27], [43, -30]], [[57, 6], [50, 11], [52, 18]]],
  [[[51, -48], [48, -38], [53, -30]], [[60, -12], [52, -8], [55, 0], [47, 6]], [[52, -8], [46, -4]], [[53, 24], [47, 17], [49, 11]]],
];

// strength: how much of it is left, 0..1. flash: just struck, 0..1, `struck` up or down it (-1..1). grow: 0..1 as it
// comes up again
function drawEnergyShield(ctx, { strength, flash, struck, grow, clock }) {
  const { top, bottom, mid } = SHIELD_AT;
  ctx.save();
  ctx.scale(K, K);
  ctx.translate(40, mid);
  ctx.scale(SHIELD_AT.wide, SHIELD_AT.tall * grow);
  ctx.translate(-40, -mid);
  // (nearly gone, it flickers)
  const dim = strength < 0.22 && Math.sin(clock * 31) > 0.35 ? 0.45 : 1;
  ctx.globalAlpha *= dim;
  const gr = ctx.createLinearGradient(40, 0, 62, 0);
  gr.addColorStop(0, 'rgba(120, 250, 230, 0.14)');
  gr.addColorStop(1, 'rgba(22, 206, 188, 0.44)');
  ctx.fillStyle = gr;
  shieldShape(ctx);
  ctx.fill();
  ctx.save();
  shieldShape(ctx);
  ctx.clip();
  // a honeycomb of light drifting up it
  ctx.strokeStyle = 'rgba(10, 164, 152, 0.4)';
  ctx.lineWidth = 0.9;
  ctx.beginPath();
  const rise = (clock * 11) % 11;
  for (let row = -1; row < 10; row++) {
    for (let col = 0; col < 3; col++) {
      const hx = 42 + col * 9.6 + (row % 2) * 4.8;
      const hy = top + row * 11 - rise + 6;
      for (let i = 0; i <= 6; i++) {
        const an = (i / 6) * TAU + TAU / 12;
        const px = hx + Math.cos(an) * 5.6;
        const py = hy + Math.sin(an) * 5.6;
        if (i) ctx.lineTo(px, py);
        else ctx.moveTo(px, py);
      }
    }
  }
  ctx.stroke();
  if (flash > 0) {
    ctx.fillStyle = `rgba(232, 255, 250, ${0.6 * flash})`;
    ctx.fillRect(34, top - 6, 36, bottom - top + 12);
    ctx.strokeStyle = `rgba(255, 255, 255, ${flash})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(52, mid + struck * 34, 4 + 8 * (1 - flash), 7 + 15 * (1 - flash), 0, 0, TAU);
    ctx.stroke();
  }
  ctx.restore();
  ctx.lineJoin = 'round';
  shieldShape(ctx);
  ctx.strokeStyle = 'rgba(6, 140, 134, 0.95)';
  ctx.lineWidth = 2.6;
  ctx.stroke();
  // the bright line down its face
  ctx.strokeStyle = 'rgba(230, 255, 250, 0.95)';
  ctx.lineWidth = 1.5;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(50, top + 7);
  ctx.quadraticCurveTo(61.5, mid, 50, bottom - 8);
  ctx.stroke();
  const stage = strength < 0.34 ? 2 : strength < 0.67 ? 1 : 0;
  for (let n = 0; n < stage; n++) {
    for (const [colour, wide] of [['rgba(4, 82, 84, 0.95)', 1.9], ['rgba(255, 255, 255, 0.9)', 0.7]]) {
      ctx.strokeStyle = colour;
      ctx.lineWidth = wide;
      ctx.beginPath();
      for (const run of SHIELD_CRACKS[n]) run.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawShieldBot(ctx, dpr, sprites, u) {
  const A = sprites.shieldtrooper;
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const moving = u.moving && !dead;
  const rushing = !dead && u.rushT > 0;
  const max = d.guard.hp;
  const left = u.shieldHp === undefined ? max : u.shieldHp;
  const up = !dead && left > 0;
  const R = rigStep(u, {
    age, dead, moving, bang: u.shieldFlash > 0.12 ? 1 : 0, kick: 0.3, cadence: 2.2,
    calm: !u.target && !moving, busy: rushing,
    fidgets: ['look', 'look', 'stretch'],
    aim: { lean: rushing ? 0.26 : 0, squash: rushing ? 0.08 : 0 },
  });

  placeUnit(ctx, dpr, u, u.hit > 0.14 ? (Math.random() - 0.5) * 1.6 : 0);
  const size = d.scale || BOT_SCALE;
  ctx.translate(0, FEET);
  ctx.scale(size, size);
  ctx.translate(0, -FEET);

  // streaking along behind him as he charges
  if (rushing) {
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(40, 200, 184, 0.6)';
    ctx.lineWidth = 2.4 * K;
    ctx.beginPath();
    for (const [y, len] of [[-14, 30], [0, 42], [15, 26]]) {
      ctx.moveTo((-26 - len * (0.7 + 0.3 * Math.sin(t * 40 + y))) * K, y * K);
      ctx.lineTo(-26 * K, y * K);
    }
    ctx.stroke();
  }
  drawBotFeet(ctx, A, R, { clock: t, spread: rushing ? 3 : 0 });
  if (!dead) stepDust(ctx, R, 1.1);
  applyBotBody(ctx, R);

  ctx.save();
  ctx.translate(0, R.pack * K);
  drawLayer(ctx, A.pack);
  ctx.restore();
  drawLayer(ctx, A.torso);

  let power = 1;
  if (age < 0.5) power = 0;
  else if (age < 0.85) power = Math.sin(age * 70) > 0 ? 1 : 0.15;
  const blinkT = t % 3.3;
  const aiming = !dead && !!u.target;
  const lid = !aiming && blinkT < 0.16 ? Math.sin((blinkT / 0.16) * Math.PI) : 0;
  let look = [Math.sin(t * 0.9) * 0.9 + 0.2, Math.sin(t * 1.7) * 0.5];
  if (aiming) look = [1, 0.1];
  else if (R.fidget === 'look') look = [Math.sin(R.q * TAU) * 1.5, -0.2];
  ctx.save();
  ctx.scale(K, K);
  trooperEyes(ctx, { lx: look[0], ly: look[1], lid: R.happy ? 0 : lid, angry: aiming && !R.happy, happy: R.happy, spin: Math.sin(t * 0.6) * 0.4, power, dead });
  ctx.restore();
  if (!dead && power > 0.5) botGlow(ctx, 10.6 * K, -4.6 * K, (11 + Math.sin(t * 3)) * K, '70, 255, 205', 0.2);

  ctx.save();
  applyBotCap(ctx, R);
  botAntennae(ctx, dead ? 7 : R.ant, !dead && t % 1.1 < 0.22);
  drawLayer(ctx, A.cap);
  ctx.restore();

  burnGlow(ctx, u, 20.7 * K, 23 * K);
  if (!dead) drawHitFlash(ctx, u, 20.9 * K, 23.2 * K);

  // ---- the arm that holds it out (lowered while it is down), jolting back as it is struck
  const jolt = u.shieldFlash > 0 ? u.shieldFlash / 0.18 : 0;
  ctx.save();
  ctx.translate((19 - 2.6 * jolt + (rushing ? 3 : 0)) * K, (up || dead ? 11 : 15) * K);
  ctx.rotate(dead ? 0.9 : up ? 0 : 0.42);
  drawLayer(ctx, A.arm);
  ctx.restore();

  if (up) {
    const grow = u.upAge !== undefined && u.upAge < 0.25 ? Math.max(0.05, u.upAge / 0.25) : age < 0.9 ? Math.max(0, Math.min(1, (age - 0.5) / 0.35)) : 1;
    if (grow > 0) {
      ctx.save();
      ctx.translate(((rushing ? 3 : 0) - 2 * jolt) * K, 0);
      drawEnergyShield(ctx, { strength: left / max, flash: jolt, struck: u.struckAt || 0, grow, clock: t });
      ctx.restore();
    }
  } else if (!dead && u.brokenT > 0) {
    // powering up again: the block on his arm glows brighter and brighter, and sputters just before
    const q = 1 - u.brokenT / d.guard.recharge;
    botGlow(ctx, 39 * K, 18 * K, (4 + 12 * q + 2 * Math.sin(t * 17)) * K, '60, 240, 215', 0.35 + 0.55 * q);
    if (u.brokenT < 0.9 && Math.sin(t * 38) > 0.2) {
      ctx.save();
      ctx.globalAlpha *= 0.4;
      drawEnergyShield(ctx, { strength: 1, flash: 0, struck: 0, grow: 1, clock: t });
      ctx.restore();
    }
  }
  if (!dead && u.hit > 0.02) drawZaps(ctx, 2);
}

// ---------------------------------------------------------------- Malfunction Trooper
// his one good eye is cracked
function malfCrack(ctx) {
  ctx.lineCap = 'round';
  for (const [colour, wide] of [['rgba(16, 20, 28, 0.9)', 1], ['rgba(255, 255, 255, 0.75)', 0.45]]) {
    ctx.strokeStyle = colour;
    ctx.lineWidth = wide;
    ctx.beginPath();
    ctx.moveTo(15.4, -9.2);
    ctx.lineTo(12.2, -6.4);
    ctx.lineTo(13, -3.6);
    ctx.lineTo(9, -0.6);
    ctx.moveTo(12.2, -6.4);
    ctx.lineTo(8.6, -7.6);
    ctx.moveTo(13, -3.6);
    ctx.lineTo(15.8, -2);
    ctx.stroke();
  }
}

// two cut wires hanging out of the hole, swinging as he lurches
function malfWires(ctx, swing, t) {
  const hang = [['#e4503c', [-17, 8], [-26, 16], 1], ['#f2c63a', [-13, 17], [-18, 28], 1.7]];
  ctx.lineCap = 'round';
  for (const [colour, [x0, y0], [x1, y1], k] of hang) {
    const sw = swing * 5 * k + Math.sin(t * 2.3 + k * 3) * 1.1;
    for (const [col, wide] of [[OUT, 2.7], [colour, 1.3]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = wide * K;
      ctx.beginPath();
      ctx.moveTo(x0 * K, y0 * K);
      ctx.quadraticCurveTo((x0 - 9) * K, (y0 + 1) * K, (x1 + sw) * K, y1 * K);
      ctx.stroke();
    }
    ctx.fillStyle = '#ffd9a0';
    ctx.beginPath();
    ctx.arc((x1 + sw) * K, y1 * K, 1.2 * K, 0, TAU);
    ctx.fill();
  }
}

// one aerial, bent over in the middle, its light stuttering
function malfAerial(ctx, sway, on) {
  const tip = [-17 + sway, -40 + Math.abs(sway) * 0.3];
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [col, w] of [[OUT, 2.7], ['#7a8494', 1.2]]) {
    ctx.strokeStyle = col;
    ctx.lineWidth = w * K;
    ctx.beginPath();
    ctx.moveTo(1 * K, -26.4 * K);
    ctx.lineTo((-4 + sway * 0.4) * K, -41 * K);
    ctx.lineTo(tip[0] * K, tip[1] * K);
    ctx.stroke();
  }
  if (on) botGlow(ctx, tip[0] * K, tip[1] * K, 7 * K, '255, 90, 70', 0.7);
  ctx.fillStyle = on ? '#ff6a52' : '#8d3b34';
  ctx.strokeStyle = OUT;
  ctx.lineWidth = 0.8 * K;
  ctx.beginPath();
  ctx.arc(tip[0] * K, tip[1] * K, 1.9 * K, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

function drawMalf(ctx, dpr, sprites, u) {
  const A = sprites.malftrooper;
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.737;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  // how near he is to going off, 0..1
  const wind = !dead && u.fuseT !== undefined ? Math.min(1, u.fuseT / d.bomb.wind) : 0;
  const moving = u.moving && !dead;
  // (the rig is told he is standing, so its own even stride never gets going: the limp is worked out below)
  const R = rigStep(u, { age, dead, moving: false, bang: 0, kick: 1, calm: !u.target && !moving, busy: wind > 0, fidgets: ['look'] });
  const L = limpPose(dead ? 0 : u.limp || 0, dead ? 0 : u.limpK || 0);

  placeUnit(ctx, dpr, u, wind > 0 ? (Math.random() - 0.5) * 3 * wind : u.hit > 0.14 ? (Math.random() - 0.5) * 1.6 : 0);
  const size = d.scale || BOT_SCALE;
  ctx.translate(0, FEET);
  ctx.scale(size, size);
  ctx.translate(0, -FEET);

  // how far each foot is from where it rests, in art px, along the way he is heading. (Straight up or down the field he
  // still steps a bit to the side, or you couldn't see that he was stepping at all; and a foot can only go so far up or
  // down before it comes off him)
  const long = (u.stride || d.stride) / (K * size);
  const wx = u.walkX === undefined ? 1 : u.walkX;
  const along = Math.max(0.65, Math.abs(wx));
  const tall = (u.walkY || 0) * 0.35;
  const goodX = 9.5 + L.goodAt * long * along;
  const goodY = 25.7 + L.goodAt * long * tall - L.goodLift + R.hop * 0.8;
  const badX = -5.5 + L.badAt * long * along;
  const badY = 25.8 + L.badAt * long * tall - L.badLift;

  // ---- his shadow, the foot that drags and the good one
  ctx.save();
  ctx.translate(1 * K, 28 * K);
  drawLayer(ctx, A.shade);
  ctx.restore();
  const foot = (layer, x, y, turn) => {
    ctx.save();
    ctx.translate(x * K, y * K);
    ctx.rotate(turn);
    drawLayer(ctx, layer);
    ctx.restore();
  };
  foot(A.badFoot, badX, badY, 0.16 + L.badTurn);
  // (while the good one is stepping it comes round in front of him: behind, his dropping body would hide the whole step)
  const stepping = L.goodLift > 1.2;
  if (!stepping) foot(A.foot, goodX, goodY, L.goodTurn);
  // grit kicked up where it scrapes along, and the puff as the good one stamps down
  if (L.scrape > 0.15) {
    ctx.fillStyle = `rgba(172, 168, 176, ${0.65 * L.scrape})`;
    for (let i = 0; i < 4; i++) {
      const q = (t * 3.2 + i / 4) % 1;
      ctx.beginPath();
      ctx.arc((badX - 4 - q * 11) * K, (badY + 2.4 - q * (3 + i)) * K, (1.3 + q * 2.4) * K, 0, TAU);
      ctx.fill();
    }
  }
  if (L.stamp > 0) {
    ctx.fillStyle = `rgba(176, 172, 180, ${0.6 * L.stamp})`;
    for (const side of [-1, 0.5, 1]) {
      ctx.beginPath();
      ctx.arc((goodX + side * (5 + 9 * (1 - L.stamp))) * K, (goodY + 2.4 - 3 * (1 - L.stamp)) * K, (1.4 + 2 * (1 - L.stamp)) * K, 0, TAU);
      ctx.fill();
    }
  }

  // ---- the body, lurching over it all; swelling as he is about to go
  ctx.save();
  applyBotBody(ctx, { ...R, lean: R.lean + L.lean - (dead ? 0 : 0.05), roll: 0, bob: R.bob + L.bob }, 0.15 * wind * wind);
  ctx.save();
  ctx.translate(0, R.pack * K);
  drawLayer(ctx, A.pack);
  ctx.restore();
  drawLayer(ctx, A.torso);
  ctx.save();
  malfWires(ctx, L.swing + R.ant * 0.03, t);
  ctx.restore();

  // ---- the bomb inside him: a slow throb, faster and fiercer as it goes
  if (!dead) {
    const beat = 0.5 + 0.5 * Math.sin(wind > 0 ? u.fuseT * (22 + 34 * wind) : t * 3.4);
    botGlow(ctx, MALF_CORE[0] * K, MALF_CORE[1] * K, (9 + 4 * beat + 20 * wind) * K, '255, 120, 40', 0.4 + 0.35 * beat + 0.25 * wind);
    if (wind > 0) botGlow(ctx, MALF_CORE[0] * K, MALF_CORE[1] * K, (4 + 8 * wind) * K, '255, 250, 215', wind);
  }

  // ---- one eye, cracked, flickering, drooping
  const flicker = Math.sin(t * 17.3) + Math.sin(t * 7.1) > 1.35;
  const power = age < 0.5 ? 0 : flicker && !wind ? 0.2 : 1;
  const blinkT = t % 4.1;
  const lid = wind > 0 ? 0 : Math.min(0.96, Math.max(0.24 + (blinkT < 0.2 ? Math.sin((blinkT / 0.2) * Math.PI) * 0.7 : 0), L.wince * 0.92, L.heave * 0.46));
  const look = moving || u.target ? [1, 0.25] : [Math.sin(t * 0.7), 0.5];
  ctx.save();
  ctx.scale(K, K);
  trooperEyes(ctx, { lx: look[0], ly: look[1], lid, angry: false, spin: 0, power, dead });
  malfCrack(ctx);
  ctx.restore();
  if (!dead && power > 0.5) botGlow(ctx, 10.6 * K, -4.6 * K, 11 * K, wind > 0 ? '255, 80, 50' : '70, 255, 205', wind > 0 ? 0.6 : 0.16);

  // ---- the helmet sits crooked, and rattles
  ctx.save();
  applyBotCap(ctx, R);
  ctx.translate(0, -17 * K);
  ctx.rotate(-0.13 + L.lean * 0.5 - L.wince * 0.07 + (wind > 0 ? Math.sin(t * 61) * 0.09 * wind : 0));
  ctx.translate(0, 17 * K);
  malfAerial(ctx, R.ant + L.swing * 4, !dead && Math.sin(t * 9) + Math.sin(t * 23) > 0.7);
  drawLayer(ctx, A.cap);
  ctx.restore();

  // ---- smoke leaks out of him
  if (!dead) {
    for (let i = 0; i < 4; i++) {
      const q = (t * 0.75 + i / 4) % 1;
      ctx.fillStyle = `rgba(96, 94, 108, ${0.42 * (1 - q) * Math.min(1, q * 5)})`;
      ctx.beginPath();
      ctx.arc((-24 - 6 * q + Math.sin(q * 7 + i) * 2.5) * K, (-14 - 34 * q) * K, (2.4 + 5 * q) * K, 0, TAU);
      ctx.fill();
    }
  }
  // ---- a crackle jumps across wherever the sparks have just come from
  if (!dead && u.zapT > 0) {
    const [zx, zy] = MALF_SPOTS[u.zapAt || 0];
    ctx.lineJoin = 'miter';
    for (let b = 0; b < 2; b++) {
      let x = zx;
      let y = zy;
      const path = [[x, y]];
      for (let i = 0; i < 3; i++) {
        x += (Math.random() - 0.5) * 13;
        y += (Math.random() - 0.5) * 13;
        path.push([x, y]);
      }
      for (const [col, w] of [['rgba(80, 200, 255, 0.8)', 2.6], ['#ffffff', 0.9]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w * K;
        ctx.beginPath();
        path.forEach(([px, py], i) => (i ? ctx.lineTo(px * K, py * K) : ctx.moveTo(px * K, py * K)));
        ctx.stroke();
      }
    }
  }
  // ---- and in the last moment he flashes red all over
  if (wind > 0 && Math.sin(u.fuseT * (22 + 34 * wind)) > 0.1) {
    ctx.fillStyle = `rgba(255, 84, 50, ${0.25 + 0.45 * wind})`;
    ctx.beginPath();
    ctx.ellipse(0, 0, 20.7 * K, 23 * K, 0, 0, TAU);
    ctx.fill();
  }

  burnGlow(ctx, u, 20.7 * K, 23 * K);
  if (!dead) drawHitFlash(ctx, u, 20.9 * K, 23.2 * K);
  ctx.restore();
  if (stepping) foot(A.foot, goodX, goodY, L.goodTurn);
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

  ctx.translate(0, FEET);
  ctx.scale(d.scale * d.bulk, d.scale);
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

// MechaZaur: Robo Trooper built bulkier, with a dragon's head. He waddles like a trooper; before he breathes, his horns
// light up with lightning between them, then his jaw drops and he pours out fire. Now and then he lifts off on jets.
// Everything is drawn in a trooper's coordinates. m: { jaw (radians open), headTilt, sway (antenna), hand (how far his
// hands are raised), lit (0..1, the grooves in his horns) }; `eyes` paints his eye
function drawZordRig(ctx, A, m, eyes) {
  const art = (fn) => {
    ctx.save();
    ctx.scale(K, K);
    fn();
    ctx.restore();
  };
  const at = (layer, x, y) => {
    ctx.save();
    ctx.translate(x * K, y * K);
    drawLayer(ctx, layer);
    ctx.restore();
  };
  // helmet, horns and antenna ride together
  const capped = (fn) => {
    ctx.save();
    applyBotCap(ctx, { cap: m.cap || 0, capRot: m.capRot || 0 });
    fn();
    ctx.restore();
  };
  // his pack, a size up like the rest of him
  ctx.save();
  ctx.translate(-4 * K, (m.pack || 0) * K);
  ctx.scale(1.1, 1.1);
  drawLayer(ctx, A.pack);
  ctx.restore();
  // before a salvo the noses of his missiles rise out of the top of the pack
  if (m.rack > 0.01) {
    art(() => {
      ctx.lineJoin = 'round';
      for (let i = 0; i < 3; i++) {
        ctx.save();
        ctx.translate(-34 + i * 6.4, -20 - i * 2.6);
        ctx.rotate(-0.5);
        ctx.translate(0, -9 * m.rack);
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = OUT;
        ctx.fillStyle = '#d3d8e3';
        ctx.beginPath();
        ctx.rect(-2.8, 0, 5.6, 9);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = '#e0523c';
        ctx.beginPath();
        ctx.moveTo(-2.8, 0);
        ctx.quadraticCurveTo(0, -9, 2.8, 0);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    });
  }
  // head and body tip together, as a trooper's do
  ctx.save();
  ctx.translate(0, 18 * K);
  ctx.rotate(m.headTilt);
  ctx.translate(0, -18 * K);
  at(A.farHand, 30 + (m.reach || 0), 19 - (m.handFar === undefined ? m.hand * 0.6 : m.handFar));
  capped(() => drawLayer(ctx, A.farHorn));
  drawLayer(ctx, A.bodyBare);
  ctx.save();
  ctx.translate(ZORD_JAW[0] * K, ZORD_JAW[1] * K);
  ctx.rotate(m.jaw);
  ctx.translate(-ZORD_JAW[0] * K, -ZORD_JAW[1] * K);
  drawLayer(ctx, A.jaw);
  ctx.restore();
  eyes(ctx, 'eye');
  capped(() => {
    botAntennae(ctx, m.sway, m.beacon);
    drawLayer(ctx, A.cap);
    drawLayer(ctx, A.nearHorn);
    if (!(m.lit > 0)) return;
    art(() => {
      ctx.lineCap = 'round';
      for (const [x, y, len, rise] of ZORD_HORNS) {
        for (const [col, wide] of [[`rgba(31, 188, 156, ${m.lit})`, 2.6], [`rgba(225, 255, 247, ${m.lit})`, 1]]) {
          ctx.strokeStyle = col;
          ctx.lineWidth = wide;
          ctx.beginPath();
          ctx.moveTo(x - 3, y - 0.6);
          ctx.quadraticCurveTo(x - len * 0.55, y - rise * 0.3, x - len * 0.86, y - rise * 0.78);
          ctx.stroke();
        }
      }
    });
  });
  eyes(ctx, 'fx');
  at(A.nearHand, 1 + (m.reach || 0), 21 - m.hand);
  ctx.restore();
}

const ZORD_STILL = { jaw: 0.16, headTilt: 0, sway: 0, beacon: false, hand: 0, lit: 0, rack: 0, cap: 0, capRot: 0 };
const ZORD_MOUTH = { x: 39, y: 14 };

// a thin four-pointed glint
function zordGlint(g, x, y, long, short, turn, fill) {
  g.fillStyle = fill;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const an = turn + (i / 8) * TAU;
    const r = (i % 2 ? short : i % 4 ? long * 0.62 : long) * K;
    if (i) g.lineTo(x * K + Math.cos(an) * r, y * K + Math.sin(an) * r);
    else g.moveTo(x * K + Math.cos(an) * r, y * K + Math.sin(an) * r);
  }
  g.closePath();
  g.fill();
}

// energy spirals into his open mouth and swells into a crackling ball of it
function zordGather(g, charge, t) {
  const { x, y } = ZORD_MOUTH;
  g.lineCap = 'round';
  for (let i = 0; i < 16; i++) {
    const q = (t * 2.3 + i / 16) % 1;
    const a = i * 2.4 + q * 2.6;
    const far = (1 - q) * 34 + 3;
    const tail = far + 3 + 5 * (1 - q);
    g.strokeStyle = `rgba(${i % 4 ? '30, 220, 175' : '150, 255, 230'}, ${Math.min(1, q * 3) * Math.min(1, charge * 2)})`;
    g.lineWidth = (0.9 + 1.5 * q) * K;
    g.beginPath();
    g.moveTo((x + Math.cos(a - 0.14) * tail) * K, (y + Math.sin(a - 0.14) * tail * 0.85) * K);
    g.lineTo((x + Math.cos(a) * far) * K, (y + Math.sin(a) * far * 0.85) * K);
    g.stroke();
  }
  const r = 2 + 6.4 * charge + Math.sin(t * 44) * 0.6;
  botGlow(g, x * K, y * K, r * 3.2 * K, '70, 255, 205', 0.75 * Math.min(1, charge * 1.6));
  g.strokeStyle = `rgba(215, 255, 245, ${Math.min(1, charge * 1.5)})`;
  g.lineWidth = 0.9 * K;
  for (let i = 0; i < 4; i++) {
    const a = Math.random() * TAU;
    g.beginPath();
    g.moveTo(x * K, y * K);
    g.lineTo((x + Math.cos(a + 0.4) * r * 1.4) * K, (y + Math.sin(a + 0.4) * r * 1.4) * K);
    g.lineTo((x + Math.cos(a) * r * 2.3) * K, (y + Math.sin(a) * r * 2.3) * K);
    g.stroke();
  }
  for (const [col, k] of [['#35e8bd', 1], ['#d9fff4', 0.68], ['#ffffff', 0.38]]) {
    g.fillStyle = col;
    g.beginPath();
    g.arc(x * K, y * K, r * k * K, 0, TAU);
    g.fill();
  }
  zordGlint(g, x, y, r * 2.6 * charge, r * 0.24, t * 3, `rgba(255, 255, 255, ${0.85 * charge})`);
}

// the glare at his mouth while the fire pours out
function zordFlare(g, t) {
  const { x, y } = ZORD_MOUTH;
  const beat = Math.sin(t * 38);
  botGlow(g, x * K, y * K, (23 + 3 * beat) * K, '255, 168, 55', 0.8);
  botGlow(g, x * K, y * K, (13 + 2 * beat) * K, '90, 255, 215', 0.85);
  zordGlint(g, x, y, 17 + 4 * beat, 2.4, t * 5, 'rgba(120, 255, 220, 0.8)');
  zordGlint(g, x, y, 11 - 2 * beat, 2, -t * 7, '#ffffff');
}

// as he powers up, teal fire vents out of the back of his pack
function zordVents(ctx, power, t) {
  BOT_JETS.forEach(([jx, jy], i) => {
    const x = jx * 1.1 - 4;
    const y = jy * 1.1;
    const len = (13 + 5 * Math.sin(t * 47 + i * 2)) * power;
    botGlow(ctx, (x - len * 0.4) * K, y * K, (6 + len * 0.55) * K, '70, 255, 205', 0.6 * power);
    for (const [col, wide, reach] of [['rgba(30, 215, 170, 0.9)', 3.8, 1], ['#e6fff8', 1.9, 0.62]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(x * K, (y - wide) * K);
      ctx.quadraticCurveTo((x - len * reach * 0.6) * K, (y - wide * 0.8) * K, (x - len * reach) * K, (y + (i ? 3 : -3) * reach) * K);
      ctx.quadraticCurveTo((x - len * reach * 0.6) * K, (y + wide * 0.8) * K, x * K, (y + wide) * K);
      ctx.fill();
    }
  });
}

// his eye, the very one Robo Trooper has, set over on his broader egg
const ZORD_EYE = { x: 12.4, y: -4.6 };
function zordLook(g, o) {
  g.save();
  g.translate((ZORD_EYE.x - 10.6) * K, 0);
  g.scale(K, K);
  trooperEyes(g, o);
  g.restore();
}

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
  // the moment before he breathes, his horns light up
  const inRange = u.target && Math.hypot(u.target.x - u.x, u.target.y - u.y) <= d.range;
  const charge = !dead && !firing && inRange && !(u.burstLeft > 0) && u.burstT !== undefined && u.burstT < 0.8 ? Math.max(0, Math.min(1, 1 - u.burstT / 0.8)) : 0;
  // (he no longer roars on arriving or while standing about: after a battle it looked like crowing)
  const roar = 0;
  const swipe = !dead && u.swipeT !== undefined && u.swipeT !== null ? Math.min(1, u.swipeT / d.swipe.time) : null;
  // the great beam: gathering it, then firing it, his head following where it points
  const beam = !dead && u.beam ? u.beam : null;
  const gather = beam && beam.t < d.beam.charge ? beam.t / d.beam.charge : 0;
  const blast = !!beam && beam.t >= d.beam.charge;
  const beamAim = beam ? Math.max(-0.38, Math.min(0.38, Math.atan2(Math.sin(beam.angle), Math.cos(beam.angle) * u.facing) * 0.65)) : 0;
  const R = rigStep(u, {
    age, dead, moving, alt,
    bang: u.launch || 0, // each missile leaving kicks him
    kick: 0.6,
    cadence: 1.55,
    calm: !u.target && !moving && alt < 0.1 && age > 2.2 && swipe === null && !beam,
    busy: firing || u.salvo > 0 || swipe !== null || !!beam,
    fidgets: ['look', 'chomp', 'yawn', 'sniff', 'stretch'],
    // he gathers himself back to charge, then throws his weight into the breath
    aim: beam ? { lean: blast ? 0.12 : -0.2 * gather, squash: blast ? 0.03 : 0.1 * gather, head: beamAim - (blast ? 0 : 0.24 * (1 - gather * 0.6)), jaw: blast ? 0.76 : 0.1 + 0.58 * gather } : {
      lean: firing ? 0.11 : -0.19 * charge - 0.08 * roar + (alt > 0.12 ? 0.08 : 0),
      squash: firing ? 0.02 : 0.1 * charge,
      head: firing ? Math.max(-0.2, Math.min(0.3, u.aim * 0.55)) : roar > 0 ? -0.3 * roar : -0.18 * charge,
      jaw: roar > 0 ? 0.64 * roar : firing ? 0.56 : dead ? 0.3 : 0.05 + charge * 0.36,
    },
  });
  // letting fly rocks his whole body; shutting off, his jaws snap to
  if (u.rig && firing !== !!u.wasBreathing) {
    const s = u.rig.s;
    if (firing) {
      s.lean.v += 3.4;
      s.squash.v += 2.8;
      s.cap.v -= 110;
      s.ant.v -= 150;
      s.jaw.v += 8;
    } else {
      s.jaw.v -= 9;
      s.squash.v += 1.4;
      s.lean.v -= 1.2;
    }
  }
  u.wasBreathing = firing;
  // the beam bursting out kicks him back on his heels
  if (u.rig && blast && !u.wasBlasting) {
    const s = u.rig.s;
    s.lean.v -= 3.6;
    s.squash.v += 3.4;
    s.cap.v -= 130;
    s.ant.v -= 170;
    s.jaw.v += 9;
  }
  u.wasBlasting = blast;
  if (u.rig && swipe !== null && !u.wasSwiping) {
    u.rig.s.squash.v += 3.2;
    u.rig.s.lean.v -= 2.4;
    u.rig.s.cap.v -= 40;
  }
  if (u.rig && swipe !== null && swipe >= 0.26 && u.wasSwiping < 0.26) {
    u.rig.s.lean.v += 4.2;
    u.rig.s.cap.v -= 95;
    u.rig.s.ant.v -= 140;
  }
  u.wasSwiping = swipe === null ? 0 : swipe || 0.001;

  placeUnit(ctx, dpr, u, u.hit > 0.16 ? (Math.random() - 0.5) * 1.4 : 0);
  const ring = (x, y, rx, col, width) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx * 0.34, 0, 0, TAU);
    ctx.stroke();
  };
  // each heavy step puffs out a little ring of dust
  if (moving && alt < 0.1 && R.since.step < 0.26) {
    const q = R.since.step / 0.26;
    ring((R.foot ? 8 : -5) * K * d.scale, FEET + 1, 7 + 21 * q, `rgba(150, 148, 160, ${0.6 * (1 - q)})`, 1.2);
  }

  // his shadow stays on the ground, shrinking as he climbs
  ctx.save();
  if (dead) ctx.globalAlpha = 0;
  ctx.translate(0, FEET + 1);
  ctx.scale(1, 0.3);
  const wideBy = d.scale * K * 34 * (1 - alt * 0.25);
  const sh = ctx.createRadialGradient(0, 0, wideBy * 0.2, 0, 0, wideBy);
  sh.addColorStop(0, `rgba(0, 0, 0, ${0.4 - alt * 0.2})`);
  sh.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = sh;
  ctx.beginPath();
  ctx.arc(0, 0, wideBy, 0, TAU);
  ctx.fill();
  ctx.restore();

  if (!dead && (charge > 0 || firing)) {
    const base = d.scale * K * 30;
    botGlow(ctx, firing ? 14 : 0, FEET, base * (firing ? 1.9 : 1.5), firing ? '255, 160, 50' : '70, 255, 205', firing ? 0.3 : 0.28 * charge);
    for (let i = 0; i < 3; i++) {
      const q = (t * (firing ? 1.7 : 2.1) + i / 3) % 1;
      // drawing in toward him while he charges, thrown outward once he lets fly
      ring(0, FEET + 1, base * (firing ? 0.7 + 1.2 * q : 1.9 - 1.2 * q), `rgba(40, 225, 180, ${0.7 * (firing ? 1 - q : q * charge)})`, 1.3);
    }
  }
  if (alt > 0.01) ctx.translate(0, -alt * (d.hoverH + Math.sin(t * 3.2) * 1.4));
  ctx.translate(0, FEET);
  ctx.scale(d.scale, d.scale);
  ctx.translate(0, -FEET);
  // roaring he shudders
  if (roar > 0) ctx.translate(Math.sin(t * 62) * 0.5 * roar, 0);

  // his long legs stand on the ground; the hips ride with his body
  const legs = {
    phase: R.phase,
    move: dead ? 0 : R.move,
    ride: R.hop + R.bob * 0.8 + (R.sx - 1) * 34,
    hop: R.hop,
    spread: swipe !== null ? 6 : beam ? 5 : firing ? 3.5 : 3 * charge,
    air: alt > 0.12 ? alt : 0,
    clock: t,
  };
  const ground = ctx.getTransform();
  const tail = zordTail(dead ? 0 : t * (R.move > 0.3 ? 6.5 : 2.2), dead ? 0 : 0.9 + R.move * 0.5, alt, swipe);
  const tailLit = swipe !== null || beam ? 1 : firing ? 0.8 : charge;
  drawZordLeg(ctx, 1, legs);

  // drawing breath he swells up; firing, he trembles with it
  applyBotBody(ctx, R, 0.065 * charge);
  ctx.translate(0, -ZORD_LIFT * K);
  if (firing || blast) ctx.translate(Math.sin(t * 83) * (blast ? 0.75 : 0.35), 0);
  drawSwoosh(ctx, swipe, false);
  if (!tail.front) drawZordTail(ctx, tail, tailLit);

  const power = age < 0.55 ? 0 : age < 0.9 ? (Math.sin(age * 70) > 0 ? 1 : 0.15) : 1;
  const angry = firing || charge > 0 || roar > 0.3 || !!beam;
  const blink = !angry && t % 3.7 < 0.16 ? Math.sin(((t % 3.7) / 0.16) * Math.PI) : 0;
  // his little hands paddle as he walks, come up to roar, and clap along when he is pleased
  const paddle = Math.sin(R.phase) * 4 * R.move;
  const lifted = roar * 7.5 + charge * 3.5 + (R.happy ? -R.hop * 0.9 : 0) - R.gunA * 6 + Math.sin(t * 2.5) * 0.7;
  const m = {
    jaw: R.jaw + (roar > 0 ? Math.sin(t * 40) * 0.04 * roar : firing ? Math.sin(t * 38) * 0.05 : 0),
    // head thrown back to roar or drawn back to charge, then dipped toward whoever he is burning
    headTilt: R.head + (firing ? Math.sin(t * 34) * 0.012 : 0),
    sway: dead ? 7 : R.ant,
    beacon: !dead && t % 1.1 < 0.22,
    cap: R.cap,
    capRot: R.capRot,
    pack: R.pack - (u.salvo > 0 ? 2 : 0),
    reach: R.happy ? 2 : R.gunX * 0.3,
    hand: dead ? 0 : lifted + paddle,
    handFar: dead ? 0 : lifted * 0.7 - paddle,
    lit: dead ? 0 : firing || blast ? 0.8 + 0.2 * Math.sin(t * 16) : Math.max(charge, roar, gather),
    rack: dead ? 0 : u.salvo > 0 ? 1 : u.missileT !== undefined && u.missileT < 0.7 && u.target ? 1 - Math.max(0, u.missileT) / 0.7 : 0,
  };
  if (!dead && (firing || charge > 0.15 || beam)) zordVents(ctx, firing || blast ? 1 : Math.max(charge, gather), t);
  let lid = blink;
  if (R.fidget === 'yawn') lid = Math.max(lid, Math.min(1, Math.sin(R.q * Math.PI) * 1.3));
  const gaze = angry ? [1, 0.2] : R.fidget === 'look' ? [Math.sin(R.q * TAU) * 1.5, -0.2] : R.fidget === 'sniff' ? [0.9, 1] : [Math.sin(t * 0.8) * 0.8 + 0.2, Math.sin(t * 1.5) * 0.5];
  drawZordRig(ctx, A, m, (g, layer) => {
    if (layer === 'eye') {
      zordLook(g, { lx: gaze[0], ly: gaze[1], lid: R.happy ? 0 : lid, angry: angry && !R.happy, happy: R.happy, power, dead });
      return;
    }
    if (!dead && power > 0.5) botGlow(g, ZORD_EYE.x * K, ZORD_EYE.y * K, (angry ? 15 : 11) * K, '70, 255, 205', angry ? 0.42 : 0.2);
    // his eye blazes, with a glare right across it
    if (!dead && (firing || charge > 0.3 || beam)) {
      const k = firing || beam ? 1 : charge;
      zordGlint(g, ZORD_EYE.x, ZORD_EYE.y, (19 + 2 * Math.sin(t * 29)) * k, 0.9, 0, `rgba(185, 255, 235, ${0.9 * k})`);
    }
    if (firing) zordFlare(g, t);
    else if (charge > 0.04) zordGather(g, charge, t);
    // lightning jumps between the tips of his horns and his antenna as the fire builds
    if (charge > 0.2 && Math.random() < 0.7) {
      const tips = ZORD_HORNS.map(([x, y, len, rise]) => [x - len, y - rise]).reverse();
      tips.push([-8 + m.sway, -45]);
      g.save();
      g.scale(K, K);
      g.lineCap = 'round';
      for (const [col, wide] of [['rgba(60, 235, 200, 0.85)', 2.2], ['#f2fffc', 0.8]]) {
        g.strokeStyle = col;
        g.lineWidth = wide;
        g.beginPath();
        tips.forEach(([x, y], i) => {
          if (!i) return g.moveTo(x, y);
          const [px, py] = tips[i - 1];
          g.lineTo((px + x) / 2 + (Math.random() - 0.5) * 9, (py + y) / 2 + (Math.random() - 0.5) * 9);
          g.lineTo(x, y);
        });
        g.stroke();
      }
      g.restore();
    }
  });

  const raised = ctx.getTransform();
  ctx.setTransform(ground);
  drawZordLeg(ctx, 0, legs);
  ctx.setTransform(raised);
  // coming past the near side, the tail goes in front of everything
  if (tail.front) drawZordTail(ctx, tail, tailLit);
  drawSwoosh(ctx, swipe, true);

  burnGlow(ctx, u, 24 * K, 23 * K);
  // he is shot at too much to flash solid white like the others (his face would hardly ever show): a soft glow instead
  if (!dead && u.hit > 0) botGlow(ctx, 0, 0, 30 * K, '235, 244, 255', Math.min(0.6, u.hit * 3));
  // sparks crawl over him when he is badly hurt
  if (!dead && u.hp < d.hp * 0.4 && Math.sin(t * 7.3) > 0.9) drawZaps(ctx, 3);
}

// the next rocket flipping up out of his pack, over his helmet and into the launcher. q runs 0..1
function jetReload(ctx, q, angle) {
  const gx = 8;
  const gy = 10;
  const ex = gx + Math.cos(angle) * 36 - Math.sin(angle) * -1;
  const ey = gy + Math.sin(angle) * 36 + Math.cos(angle) * -1;
  const at = (k) => [lerp(lerp(-24, 4, k), lerp(4, ex, k), k), lerp(lerp(-12, -62, k), lerp(-62, ey, k), k)];
  const e = q * q * (3 - 2 * q);
  const [x, y] = at(e);
  ctx.save();
  ctx.scale(K, K);
  // it turns end over end on the way and comes in nose first
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 2 + (Math.PI * 2.5 + angle) * e);
  ctx.lineJoin = 'round';
  ctx.lineWidth = 1.5;
  ctx.strokeStyle = OUT;
  for (const [col, pts] of [
    ['#1fbc9c', [[-6, 0], [-11, -6.5], [-9, 0], [-11, 6.5]]],
    ['#d3d8e3', [[-9, -3.4], [4, -3.4], [4, 3.4], [-9, 3.4]]],
    ['#e0523c', [[4, -3.4], [12, 0], [4, 3.4]]],
  ]) {
    ctx.fillStyle = col;
    ctx.beginPath();
    pts.forEach(([px, py], i) => (i ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
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
  const pose = u.pose;
  const aiming = pose > 0.6 && !!u.target && !dead;
  const reload = u.reload || 0;
  const ready = aiming && !air && reload > 0 && reload < 0.3 ? 1 - reload / 0.3 : 0;
  const drift = u.rig ? u.rig.vx * u.facing : 0;
  const R = rigStep(u, {
    age, dead, moving, alt,
    bang: u.flash,
    kick: 2,
    cadence: 2.25,
    calm: !u.target && !moving && !air,
    fidgets: ['look', 'look', 'tinker', 'stretch'],
    // in the air he banks the way he is flying
    aim: { lean: air ? Math.max(-0.2, Math.min(0.3, drift * 0.004)) + 0.05 : -0.07 * ready, squash: 0.12 * ready },
  });
  // the rocket clacks home
  if (u.rig && u.wasReload > 0.45 && reload <= 0.45) {
    u.rig.s.gunX.v -= 75;
    u.rig.s.gunA.v += 3.5;
    u.rig.s.cap.v -= 25;
  }
  u.wasReload = reload;

  placeUnit(ctx, dpr, u, u.hit > 0.14 ? (Math.random() - 0.5) * 1.6 : 0);
  // his shadow stays on the ground, shrinking as he climbs
  if (air) {
    ctx.fillStyle = `rgba(40, 42, 54, ${0.28 - 0.12 * alt})`;
    ctx.beginPath();
    ctx.ellipse(0, FEET + 2, 10 - 3 * alt, 3.2 - alt, 0, 0, TAU);
    ctx.fill();
  }
  ctx.translate(0, -alt * (d.fly.height + Math.sin(t * 3.4) * 2));
  ctx.translate(0, FEET);
  ctx.scale(d.scale, d.scale);
  ctx.translate(0, -FEET);

  drawBotFeet(ctx, A, R, { air: alt, clock: t, shadow: !air });
  if (!dead && !air) stepDust(ctx, R, 1);
  applyBotBody(ctx, R);

  ctx.save();
  ctx.translate(0, R.pack * K);
  drawLayer(ctx, A.pack);
  ctx.restore();
  drawLayer(ctx, A.torsoBare);

  const power = age < 0.5 ? 0 : age < 0.85 ? (Math.sin(age * 70) > 0 ? 1 : 0.15) : 1;
  let lid = !aiming && t % 3.3 < 0.16 ? Math.sin(((t % 3.3) / 0.16) * Math.PI) : 0;
  if (R.fidget === 'stretch') lid = Math.max(lid, Math.sin(R.q * Math.PI));
  let look = [Math.sin(t * 0.9) * 0.9, Math.sin(t * 1.7) * 0.5];
  if (aiming) look = [1, Math.sin(u.aim)];
  else if (R.fidget === 'look') look = [Math.sin(R.q * TAU) * 1.5, -0.3];
  else if (R.fidget === 'tinker') look = [0.9, 0.9];
  else if (moving || air) look = [0.9, air ? 0.8 : 0.25];
  // he watches the new rocket go over
  if (!dead && reload > 0.45 && reload < 1.05) look = [Math.sin(((1.05 - reload) / 0.6) * Math.PI - 1.4) * 1.4, -1.1];
  ctx.save();
  ctx.scale(K, K);
  trooperEyes(ctx, { lx: look[0], ly: look[1], lid: R.happy ? 0 : lid, angry: aiming && !R.happy && !(reload > 0.45 && reload < 1.05), happy: R.happy, power, dead });
  ctx.restore();
  if (!dead && power > 0.5) botGlow(ctx, 10.6 * K, -4.6 * K, 11 * K, '70, 255, 205', aiming ? 0.32 : 0.18);

  ctx.save();
  applyBotCap(ctx, R);
  drawLayer(ctx, A.cap);
  ctx.restore();

  burnGlow(ctx, u, 20.7 * K, 23 * K);
  if (!dead) drawHitFlash(ctx, u, 20.9 * K, 23.2 * K);

  const check = R.fidget === 'tinker' ? Math.sin(Math.min(1, R.q * 1.15) * Math.PI) ** 0.6 : 0;
  const held = lerp(0.28 + Math.cos(R.phase) * 0.15 * R.move + Math.sin(t * 2.5) * 0.035, u.aim, pose);
  const angle = dead ? 0.9 : held + R.gunA - check * 0.8 + (check > 0.7 ? Math.sin(t * 30) * 0.06 : 0) - R.happy * 0.55;
  ctx.save();
  ctx.translate((8 + R.gunX - 3 * check) * K, (lerp(12, 10, pose) - 4 * check + (R.happy ? R.hop * 0.35 : 0)) * K);
  ctx.rotate(angle);
  drawLayer(ctx, reload < 0.45 && !dead ? A.gunLoaded : A.gun);
  ctx.restore();
  if (!dead && reload > 0.45 && reload < 1.05) jetReload(ctx, (1.05 - reload) / 0.6, angle);
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

// His cape: midnight blue like his hat, lined in purple, with a gold hem and two little stars. `sweep` carries its tail
// out behind him and `wave` ripples the hem. Drawn behind his body, in art units.
function drawWizardCape(g, sweep, wave) {
  g.save();
  g.scale(K, K);
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const tx = -33 - sweep * 9;
  const ty = 23 - sweep * 8 + wave * 2.4;
  const hem = () => {
    g.moveTo(tx, ty);
    g.quadraticCurveTo(tx + 6, ty - 1.5 + wave * 1.6, -22 - sweep * 4, 24.5 - sweep * 2 - wave * 1.2);
    g.quadraticCurveTo(-15, 21 + wave * 1.4, -6, 23.5);
  };
  g.beginPath();
  hem();
  g.quadraticCurveTo(8, 10, 8, -6);
  g.lineTo(-13, -9);
  g.bezierCurveTo(-24 - sweep * 3, -2, -25 - sweep * 6 + wave * 2, 13, tx, ty);
  g.closePath();
  g.fillStyle = '#2c3573';
  g.fill();
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.stroke();
  // a fold showing the lining at its tail
  g.beginPath();
  g.moveTo(tx, ty);
  g.quadraticCurveTo(-27 - sweep * 6, 13 - sweep * 4 + wave * 1.5, -20, 7);
  g.quadraticCurveTo(-23 - sweep * 3, 18, -22 - sweep * 4, 24.5 - sweep * 2 - wave * 1.2);
  g.quadraticCurveTo(tx + 6, ty - 1.5 + wave * 1.6, tx, ty);
  g.fillStyle = '#6c3f8f';
  g.fill();
  // the gold hem
  for (const [col, wide] of [[OUT, 4.4], ['#f1bd36', 2.4]]) {
    g.strokeStyle = col;
    g.lineWidth = wide;
    g.beginPath();
    hem();
    g.stroke();
  }
  g.fillStyle = '#f4c23c';
  for (const [x, y, r] of [[-23.5 - sweep * 2, 3 + wave, 2.7], [-17 - sweep * 2, 17.5 - sweep * 2, 1.9]]) {
    g.beginPath();
    for (let i = 0; i < 8; i++) {
      const an = (i / 8) * TAU - Math.PI / 2;
      const rr = i % 2 ? r * 0.36 : r;
      if (i) g.lineTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
      else g.moveTo(x + Math.cos(an) * rr, y + Math.sin(an) * rr);
    }
    g.closePath();
    g.fill();
  }
  g.restore();
}

// a ring of runes that turns on the ground under him while he casts, in the spell's colour
function drawRuneRing(ctx, rgb, power, turn) {
  const a = Math.min(1, power * 2.2);
  const r = (24 + 8 * Math.min(1, power * 1.5)) * K;
  ctx.save();
  ctx.translate(0, FEET + 1);
  ctx.scale(1, 0.36);
  botGlow(ctx, 0, 0, r * 1.25, rgb, 0.3 * a);
  ctx.strokeStyle = `rgba(${rgb}, ${0.95 * a})`;
  ctx.lineWidth = 1.2;
  for (const k of [1, 0.72]) {
    ctx.beginPath();
    ctx.arc(0, 0, r * k, 0, TAU);
    ctx.stroke();
  }
  ctx.lineWidth = 0.8;
  // two triangles make the star inside it
  for (const off of [0, Math.PI / 3]) {
    ctx.beginPath();
    for (let i = 0; i <= 3; i++) {
      const an = turn + off + (i / 3) * TAU;
      if (i) ctx.lineTo(Math.cos(an) * r * 0.72, Math.sin(an) * r * 0.72);
      else ctx.moveTo(Math.cos(an) * r * 0.72, Math.sin(an) * r * 0.72);
    }
    ctx.stroke();
  }
  // the runes between the two circles
  for (let i = 0; i < 10; i++) {
    const an = -turn * 0.8 + (i / 10) * TAU;
    ctx.save();
    ctx.rotate(an);
    ctx.translate(r * 0.86, 0);
    ctx.beginPath();
    if (i % 2) {
      ctx.moveTo(-1.4, -1.2);
      ctx.lineTo(1.4, 0);
      ctx.lineTo(-1.4, 1.2);
    } else {
      ctx.moveTo(-1.5, 0);
      ctx.lineTo(1.5, 0);
      ctx.moveTo(0, -1.3);
      ctx.lineTo(0, 1.3);
    }
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// three sparks circling the orb of his staff; `front` picks the half of their ring that passes in front of it
function drawOrbMotes(ctx, y, rgb, clock, power, front) {
  for (let i = 0; i < 3; i++) {
    const an = clock * (2.4 + power * 5) + (i / 3) * TAU;
    if ((Math.sin(an) > 0) !== front) continue;
    const x = Math.cos(an) * (12 + 3 * power) * K;
    const my = y + (Math.sin(an) * 4.6 + Math.cos(an) * 3) * K;
    const r = (front ? 2.1 : 1.6) * K;
    botGlow(ctx, x, my, r * 3.2, rgb, 0.75);
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = `rgb(${rgb})`;
    ctx.lineWidth = 0.9 * K;
    ctx.beginPath();
    ctx.arc(x, my, r, 0, TAU);
    ctx.fill();
    ctx.stroke();
  }
}

// The wizard: as he casts, runes turn under his feet, his staff tips forward and a six-pointed light swells round the
// orb, pink for the bursting bolt, pale blue for lightning; as the spell leaves, the staff swings back and the light
// flashes. His cape ripples behind him and three sparks circle the orb.
function drawWizard(ctx, dpr, sprites, u) {
  const A = sprites.mage;
  const dead = !!u.tilt;
  const casting = u.castT > 0 && u.castFire;
  const p = casting ? 1 - u.castT / u.def.castTime : 0;
  const flash = (u.castFlash || 0) / 0.24;
  const clock = performance.now() / 1000 + (u.id || 0);
  const pink = casting && u.spell === 'burst';
  const rgb = pink ? '255, 100, 232' : '140, 235, 255';
  const power = casting ? p : flash;
  const inTower = u.perch && u.perch.state !== 'walk';
  if (!dead && !inTower && power > 0.02) {
    placeUnit(ctx, dpr, u);
    drawRuneRing(ctx, rgb, power, clock * 1.8);
  }
  const moving = u.moving && !dead;
  eggBase(ctx, dpr, sprites, A, u, () => {
    const sweep = moving ? 0.75 + Math.sin(u.anim * Math.PI) * 0.12 : dead ? 0 : Math.max(0.12 + Math.sin(clock * 1.9) * 0.12, power);
    drawWizardCape(ctx, sweep, dead ? 0 : Math.sin(clock * (moving || power > 0.02 ? 11 : 2.7)));
  });
  const tilt = 0.12 + (casting ? 0.31 * (1 - (1 - p) ** 2) : flash > 0.6 ? 0.16 * ((flash - 0.6) / 0.4) : 0);
  ctx.translate(14 * K, 29 * K);
  ctx.rotate(tilt);
  const oy = -WIZ_STAFF * K;
  if (!dead) drawOrbMotes(ctx, oy, rgb, clock, power, false);
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
  if (!dead) drawOrbMotes(ctx, oy, rgb, clock, power, true);
}

// his spells: pink bolts with a soft tail, the round pink burst where one lands, and the lightning
const WIZARD_ARC = [['150, 190, 255', 0.22, 6.5], ['160, 200, 255', 0.55, 3], ['255, 255, 255', 1, 1.1]];

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
    drawArcLine(ctx, a.pts, a.age, Math.floor(a.pts[0][0] * 7) + 5, fade, WIZARD_ARC);
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
  gatlingtrooper: drawTrooper,
  malftrooper: drawMalf,
  shieldtrooper: drawShieldBot,
  gibbondore: (ctx, dpr, sprites, u) => drawGibbondore(ctx, dpr, sprites, u, burnOverlay),
  gandalligator: (ctx, dpr, sprites, u) => drawGandalligator(ctx, dpr, sprites, u, burnOverlay),
  chimera: (ctx, dpr, sprites, u) => drawChimera(ctx, dpr, sprites, u, burnOverlay),
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
  const rx = zord ? 28 * K * s : big || (wide ? 36 : 23) * K * s;
  const ry = zord ? 27 * K * s : big ? big * 0.8 : (wide ? 29 : 25) * K * s;
  const cx = u.x - (wide ? u.facing * 2 * K * s : 0);
  const cy = u.y + FEET + ((zord ? -ZORD_LIFT : wide ? -8 : 0) * K - FEET) * s;
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
    plasma: mk('36, 224, 206'),
    core: mk('246, 255, 244'),
    // the deep red in the Chimera's fire
    red: mk('226, 78, 34'),
    // and the teal of his great beam
    tpale: mk('176, 255, 236'),
    tbright: mk('24, 208, 180'),
    tdark: mk('10, 132, 136'),
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

const BEAM_BURN = 300; // how far a puff of his beam goes as it changes from white heat to full green fire
// (a puff of the beam swells steadily the further it gets, `k` of the way to its full size)
const flamePuff = (f) => (f.beam ? f.size + (f.full - f.size) * f.k : f.size + f.grow * (f.age / f.life)) * (f.small ? 1 : 1.12);

// a puff of the beam goes through the same changes as one of his breath, teal for orange
function drawBeamPuff(ctx, f) {
  const t = Math.min(1, f.far / BEAM_BURN);
  const r = flamePuff(f);
  // (it thins away over the last of its reach, as his breath does)
  const fade = Math.min(1, Math.max(0, (1 - f.age / f.life) / 0.28));
  const alpha = (t < 0.1 ? 0.75 + t * 2 : 0.92) * fade;
  if (alpha <= 0) return;
  ctx.globalAlpha = alpha;
  if (t < 0.17) {
    // (bold teal round a white heart, which gives the same bubbling rings his breath starts with)
    ctx.drawImage(blobs.tbright, f.x - r * 1.25, f.y - r * 1.25, r * 2.5, r * 2.5);
    ctx.drawImage(blobs.core, f.x - r * 0.58, f.y - r * 0.58, r * 1.16, r * 1.16);
    return;
  }
  const spr = t < 0.3 ? blobs.tpale : f.dark && t > 0.62 ? blobs.tdark : blobs.tbright;
  ctx.drawImage(spr, f.x - r, f.y - r, r * 2, r * 2);
  if (t < 0.42) {
    ctx.globalAlpha = alpha * (1 - (t - 0.17) / 0.25);
    ctx.drawImage(blobs.core, f.x - r * 0.8, f.y - r * 0.8, r * 1.6, r * 1.6);
  }
}

function drawFlame(ctx, f) {
  if (f.beam) {
    drawBeamPuff(ctx, f);
    return;
  }
  const t = f.age / f.life;
  const r = flamePuff(f);
  // (the Chimera's goes on through a deep red before it chars)
  const spr = t < 0.3 ? blobs.yellow : f.dark && t > (f.blaze ? 0.72 : 0.62) ? blobs.brown : f.blaze && t > 0.5 && (f.dark || t > 0.64) ? blobs.red : blobs.orange;
  ctx.globalAlpha = Math.max(0, (t < 0.1 ? 0.75 + t * 2 : 0.92) * (1 - t * t * t));
  if (f.blaze && t < 0.26) {
    // white-hot where it leaves the goat's mouth
    ctx.drawImage(blobs.yellow, f.x - r * 1.18, f.y - r * 1.18, r * 2.36, r * 2.36);
    ctx.drawImage(blobs.core, f.x - r * 0.66, f.y - r * 0.66, r * 1.32, r * 1.32);
    return;
  }
  if (f.blaze && t < 0.55) {
    // with a bright yellow lick down the middle of the orange
    ctx.drawImage(spr, f.x - r, f.y - r, r * 2, r * 2);
    ctx.globalAlpha *= (0.55 - t) / 0.29;
    ctx.drawImage(blobs.yellow, f.x - r * 0.66, f.y - r * 0.66, r * 1.32, r * 1.32);
    return;
  }
  // teal laid over yellow turns green, so his goes by way of white heat: teal, then white, and only then fire
  if (f.hot && t < 0.17) {
    ctx.drawImage(blobs.plasma, f.x - r * 1.12, f.y - r * 1.12, r * 2.24, r * 2.24);
    ctx.drawImage(blobs.core, f.x - r * 0.72, f.y - r * 0.72, r * 1.44, r * 1.44);
  } else {
    ctx.drawImage(spr, f.x - r, f.y - r, r * 2, r * 2);
    if (f.hot && t < 0.34) {
      ctx.globalAlpha *= 1 - (t - 0.17) / 0.17;
      ctx.drawImage(blobs.core, f.x - r * 0.8, f.y - r * 0.8, r * 1.6, r * 1.6);
    }
  }
}

// A lot of fire is a lot of big see-through puffs on top of one another, which is slow to fill in. They are so soft
// that at half the sharpness they look the same, so past a certain number that is how they are drawn.
const FINE_FLAMES = 36;
let coarse = null;
function drawFlamesCoarse(ctx, flames, under) {
  const { width, height } = ctx.canvas;
  const w = Math.ceil(width / 2);
  const h = Math.ceil(height / 2);
  if (!coarse) coarse = document.createElement('canvas');
  if (coarse.width !== w || coarse.height !== h) {
    coarse.width = w;
    coarse.height = h;
  }
  const m = ctx.getTransform();
  const g = coarse.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, w, h);
  g.setTransform(m.a / 2, m.b / 2, m.c / 2, m.d / 2, m.e / 2, m.f / 2);
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const f of flames) {
    if (!!f.under !== under) continue;
    drawFlame(g, f);
    const r = flamePuff(f) * 1.2;
    x0 = Math.min(x0, f.x - r);
    y0 = Math.min(y0, f.y - r);
    x1 = Math.max(x1, f.x + r);
    y1 = Math.max(y1, f.y + r);
  }
  // only the part with fire in it is laid back over the field
  const px = Math.max(0, Math.floor((x0 * m.a + m.e) / 2));
  const py = Math.max(0, Math.floor((y0 * m.d + m.f) / 2));
  const pw = Math.min(w, Math.ceil((x1 * m.a + m.e) / 2)) - px;
  const ph = Math.min(h, Math.ceil((y1 * m.d + m.f) / 2)) - py;
  if (pw <= 0 || ph <= 0) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.drawImage(coarse, px, py, pw, ph, px * 2, py * 2, pw * 2, ph * 2);
  ctx.restore();
}

export function drawFlames(ctx, world, under) {
  if (!blob) blob = makeBlob();
  if (under) {
    drawZordGround(ctx, world);
    drawGatlingGround(ctx, world);
    drawGibbonGround(ctx, world);
    drawGatorGround(ctx, world);
    drawChimeraGround(ctx, world);
  }
  let many = 0;
  for (const f of world.flames) if (!!f.under === under) many++;
  if (many > FINE_FLAMES) drawFlamesCoarse(ctx, world.flames, under);
  else for (const f of world.flames) if (!!f.under === under) drawFlame(ctx, f);
  ctx.globalAlpha = 1;
  if (!under) {
    drawSpells(ctx, world);
    drawZordAir(ctx, world);
    drawGatlingAir(ctx, world);
    drawGibbonAir(ctx, world);
    drawGatorAir(ctx, world);
    drawChimeraAir(ctx, world);
    drawMalfAir(ctx, world);
    drawShieldAir(ctx, world);
  }
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
  jettrooper: [106, 55, 52, (g, S) => {
    g.save();
    g.scale(K, K);
    trooperEyes(g, { lx: 0.7, ly: 0.2 });
    g.restore();
    g.translate(8 * K, 12 * K);
    g.rotate(0.2);
    drawLayer(g, S.gunLoaded);
  }],
  juggernaut: [104, 52, 68, null],
  malftrooper: [96, 46, 46, null],
  shieldtrooper: [96, 45, 44, null],
  gatlingtrooper: [108, 47, 48, (g, S) => {
    g.save();
    g.scale(K, K);
    drawGatlingBelt(g, 0);
    g.translate(10.6 * (GATLING_WIDE - 1), 0);
    trooperEyes(g, { lx: 0.7, ly: 0.2 });
    g.restore();
    g.translate(6 * K, 13 * K);
    g.rotate(0.16);
    g.save();
    g.scale(K, K);
    drawGatlingBarrels(g, 0.5, 0);
    g.restore();
    drawLayer(g, S.gun);
    drawLayer(g, S.hand);
  }],
  gibbondore: [134, 63, 68, null],
  gandalligator: [102, 47, 50, null],
  chimera: [174, 83, 118, null],
  mechazord: [122, 70, 60, null],
  trooper: [96, 45, 44, (g, S) => {
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
  mage: [104, 48, 48, (g, S) => {
    g.translate(14 * K, 29 * K);
    g.rotate(0.12);
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
  if (species === 'trooper' || species === 'jettrooper' || species === 'gatlingtrooper') drawLayer(g, S.pack);
  if (species === 'shieldtrooper') {
    drawLayer(g, S.pack);
    drawLayer(g, S.feet[0]);
  }
  if (species === 'malftrooper') {
    drawLayer(g, S.pack);
    for (const [layer, x, y, turn] of [[S.badFoot, -7, 25.8, 0.2], [S.foot, 9.5, 25.7, 0]]) {
      g.save();
      g.translate(x * K, y * K);
      g.rotate(turn);
      drawLayer(g, layer);
      g.restore();
    }
  }
  if (species === 'gatlingtrooper') {
    g.save();
    g.scale(K, K);
    drawGatlingDrum(g, 0);
    g.restore();
  }
  if (species === 'mechazord') {
    drawZordLeg(g, 1, {});
    g.save();
    g.translate(0, -ZORD_LIFT * K);
    drawZordTail(g, zordTail(0, 0, 0, null));
    drawZordRig(g, S, ZORD_STILL, (c, layer) => {
      if (layer === 'eye') zordLook(c, { lx: 0.7, ly: 0.2 });
    });
    g.restore();
    drawZordLeg(g, 0, {});
  } else if (species === 'gibbondore') {
    drawGibbonStill(g, S);
  } else if (species === 'gandalligator') {
    drawGatorStill(g);
  } else if (species === 'chimera') {
    drawChimeraStill(g);
  } else if (species === 'shieldtrooper') {
    drawLayer(g, S.torso);
    g.save();
    g.scale(K, K);
    trooperEyes(g, { lx: 0.7, ly: 0.2 });
    g.restore();
    drawLayer(g, S.cap);
    g.save();
    g.translate(19 * K, 11 * K);
    drawLayer(g, S.arm);
    g.restore();
  } else if (species === 'malftrooper') {
    drawLayer(g, S.torso);
    malfWires(g, 0, 0);
    botGlow(g, MALF_CORE[0] * K, MALF_CORE[1] * K, 12 * K, '255, 120, 40', 0.6);
    g.save();
    g.scale(K, K);
    trooperEyes(g, { lx: 0.7, ly: 0.2, lid: 0.24 });
    malfCrack(g);
    g.restore();
    g.translate(0, -17 * K);
    g.rotate(-0.13);
    g.translate(0, 17 * K);
    malfAerial(g, 0, true);
    drawLayer(g, S.cap);
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
    if (species === 'mage') drawWizardCape(g, 0.2, 0);
    drawLayer(g, S.torso);
    extra(g, S);
  }
  g.restore();
}
