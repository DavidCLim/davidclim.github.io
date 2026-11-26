import { TAU, K, UNIT, FEET } from './config.js?v=204';
import { drawLayer, OUT } from './sprites.js?v=204';
import { drawDrop, trooperEyes, BOT_JETS, JUG_AXE_PIVOT, JUG_CLAW_PIVOT, JUG_EYE } from './art_units.js?v=204';
import { drawCreature, paintCreatureIcon, CREATURE_IDS } from './creatures.js?v=204';
import { EGG_DROPS } from './art_eggs.js?v=204';

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

function botJet(ctx, x, y, len, wide, t) {
  const flick = 0.82 + 0.18 * Math.sin(t * 61 + y) + 0.1 * Math.sin(t * 97);
  const L = len * flick * K;
  const W = wide * K;
  const tongue = (l, w, col) => {
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(x * K, y * K - w);
    ctx.quadraticCurveTo(x * K - l * 0.55, y * K - w * 0.7, x * K - l, y * K + l * 0.08);
    ctx.quadraticCurveTo(x * K - l * 0.55, y * K + w * 0.9, x * K, y * K + w);
    ctx.closePath();
    ctx.fill();
  };
  tongue(L * 1.2, W * 1.35, 'rgba(70, 150, 255, 0.35)');
  tongue(L, W, 'rgba(88, 196, 255, 0.92)');
  tongue(L * 0.55, W * 0.55, '#eefcff');
}

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

  // ---- thrusters: jets behind him while he walks, a hard flare against the recoil, idle puffs of steam
  const burst = Math.max(moving ? 1 : 0, kick > 0.2 ? kick * 1.5 : 0, age < 0.34 ? 1.2 : 0);
  if (burst > 0 && !dead) {
    for (const [jx, jy] of BOT_JETS) {
      botGlow(ctx, (jx - 5) * K, jy * K, 13 * K * burst, '90, 180, 255', 0.5);
      botJet(ctx, jx, jy, 20 * burst, 4.2, t);
      for (let i = 0; i < 3; i++) {
        const q = (t * 2.6 + i / 3 + jy * 0.1) % 1;
        ctx.fillStyle = `rgba(184, 190, 204, ${0.45 * (1 - q)})`;
        ctx.beginPath();
        ctx.arc((jx - 14 - 22 * q) * K, (jy + 2 - 7 * q) * K, (2 + 3.4 * q) * K, 0, TAU);
        ctx.fill();
      }
    }
  } else if (!dead && !aiming) {
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
  // a glowing, smoking barrel after he has been firing
  if (heat > 0.05) {
    ctx.fillStyle = `rgba(255, 120, 40, ${0.62 * heat})`;
    ctx.fillRect(17 * K, -3.4 * K, 20 * K, 4.8 * K);
    botGlow(ctx, 37 * K, -1 * K, 11 * K, '255, 140, 50', 0.5 * heat);
  }
  if (u.flash > 0) {
    // a blue-white starburst on top of the ordinary muzzle ring
    botGlow(ctx, 41 * K, -1 * K, 22 * K, '120, 220, 255', 0.85);
    ctx.fillStyle = '#f2fdff';
    ctx.beginPath();
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * TAU;
      const r = (i % 2 === 0 ? (i === 0 ? 19 : 11) : 3.4) * K;
      const px = 41 * K + Math.cos(a) * r;
      const py = -1 * K + Math.sin(a) * r * 0.75;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }
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

// Robot Juggernaut. His legs, body and two arms are separate pieces, so he can stomp along, heave the axe over his
// head and smash it down, lunge across with the claw, charge, and show off while he waits. The big effects (craters,
// shockwaves, slashes, the meltdown) are in jug_fx.js; here is everything that moves with him.
function jugSwingAngle(u, s) {
  const d = u.def;
  if (s <= 0) return null;
  const strike = 0.11;
  if (s < d.windup - strike) {
    const q = s / (d.windup - strike);
    return -1.85 * (1 - (1 - q) ** 2.4);
  }
  if (s < d.windup) return -1.85 + 2.55 * ((s - (d.windup - strike)) / strike) ** 2;
  const after = (s - d.windup) / d.recover;
  // a small bounce as the blade bites, a held beat, then he hauls it back
  if (after < 0.45) return 0.7 - 0.12 * Math.sin(Math.min(1, after / 0.16) * Math.PI);
  return 0.7 * (1 - ((after - 0.45) / 0.55) ** 1.4);
}

// the claw's pose during a swipe: [turn, forward, up]
function jugClawPose(u, s) {
  const c = u.def.claw;
  const mix = (a, b, q) => a.map((v, i) => v + (b[i] - v) * q);
  const back = [0.62, -9, -3];
  const out = [-1.38, 66, -13];
  if (s < c.windup - 0.1) return mix([0, 0, 0], back, 1 - (1 - s / (c.windup - 0.1)) ** 2);
  if (s < c.windup) return mix(back, out, ((s - (c.windup - 0.1)) / 0.1) ** 1.6);
  const after = (s - c.windup) / c.recover;
  if (after < 0.35) return out;
  return mix(out, [0, 0, 0], ((after - 0.35) / 0.65) ** 1.3);
}

function jugAt(ctx, pivot, angle, layer) {
  ctx.save();
  ctx.translate(pivot[0] * K, pivot[1] * K);
  ctx.rotate(angle);
  ctx.translate(-pivot[0] * K, -pivot[1] * K);
  drawLayer(ctx, layer);
  ctx.restore();
}

// where a point on the axe arm ends up (art units) when the arm is turned
function jugTurned(pivot, x, y, a) {
  const dx = x - pivot[0];
  const dy = y - pivot[1];
  return [pivot[0] + dx * Math.cos(a) - dy * Math.sin(a), pivot[1] + dx * Math.sin(a) + dy * Math.cos(a)];
}

function jugPuffs(ctx, x, y, t, n, size, rise, rgb, a, rate) {
  for (let i = 0; i < n; i++) {
    const q = (t * rate + i / n) % 1;
    botGlow(ctx, (x + Math.sin(q * 6 + i * 2) * 4 - q * 10) * K, (y - rise * q) * K, size * (0.6 + q * 1.2) * K, rgb, a * (1 - q));
  }
}

// a jet of cold fire pointing along `turn` from (x, y)
function jugJet(ctx, x, y, turn, len, wide, t) {
  ctx.save();
  ctx.translate(x * K, y * K);
  ctx.rotate(turn);
  botJet(ctx, 0, 0, len, wide, t);
  ctx.restore();
}

function drawJuggernaut(ctx, dpr, sprites, u) {
  const A = sprites.juggernaut;
  const d = u.def;
  const dead = !!u.tilt;
  const clock = performance.now() / 1000;
  const t = clock + (u.id || 0) * 0.613;
  if (u.born === undefined) u.born = clock;
  const age = dead ? 9 : clock - u.born;
  const moving = u.moving && !dead;
  const charging = moving && u.chargeT > 0;
  const ph = u.anim * 0.52;
  const s = dead ? 0 : u.swing || 0;
  const claw = u.atkKind === 'claw';
  const cannon = u.atkKind === 'cannon';
  const spinning = u.atkKind === 'spin';
  const atk = claw ? d.claw : cannon ? d.cannon : spinning ? d.spin : d;
  const swing = !dead && !claw && !cannon && !spinning ? jugSwingAngle(u, s) : null;
  // the cannon: arm levelled while it charges, then kicked hard back
  let gun = null;
  if (!dead && cannon && s > 0) {
    const w = d.cannon.windup;
    if (s < w) {
      const q = Math.min(1, s / (w * 0.35));
      gun = { turn: -0.42 * q, fwd: 4 * q, up: -4 * q, charge: s / w, kick: 0 };
    } else {
      const a = (s - w) / d.cannon.recover;
      const kick = Math.max(0, 1 - a * 2.2);
      const back = 1 - Math.max(0, (a - 0.5) / 0.5);
      gun = { turn: -0.42 * back - 0.5 * kick, fwd: 4 * back - 22 * kick, up: -4 * back - 6 * kick, charge: 0, kick };
    }
  }
  // the whirlwind: wind-up, then round and round
  let spin = null;
  if (!dead && spinning && s > 0) {
    const sp = d.spin;
    const on = s >= sp.windup && s <= sp.windup + sp.time;
    const reach = s < sp.windup ? s / sp.windup : on ? 1 : Math.max(0, 1 - (s - sp.windup - sp.time) / sp.recover);
    spin = { on, reach, turn: on ? (s - sp.windup) * TAU * 3.1 : 0 };
  }
  const big = d.scale / 1.25;
  const swipe = !dead && claw && s > 0 ? jugClawPose(u, s) : null;
  const winding = s > 0 && s < atk.windup;
  const charge = winding ? s / atk.windup : 0;
  const resting = !dead && !moving && s <= 0 && age > 1.4;
  // every few seconds while waiting he revs his boilers, snaps the claw and flares his eye
  const show = resting && t % 6.5 < 1.25 ? Math.sin(((t % 6.5) / 1.25) * Math.PI) : 0;

  placeUnit(ctx, dpr, u, u.hit > 0.16 ? (Math.random() - 0.5) * 1.4 : 0);

  // ---- the landing: rings and a burst of dust
  if (age > 0.34 && age < 1.15) {
    const q = (age - 0.34) / 0.81;
    for (const [rx, rgb, w] of [[46, '90, 235, 205', 5], [34, '255, 255, 255', 3], [58, '140, 134, 150', 4]]) {
      ctx.strokeStyle = `rgba(${rgb}, ${0.75 * (1 - q)})`;
      ctx.lineWidth = w * (1 - q) + 0.4;
      ctx.beginPath();
      ctx.ellipse(0, FEET + 2, rx * big * (0.2 + q), rx * big * 0.34 * (0.2 + q), 0, 0, TAU);
      ctx.stroke();
    }
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU + (u.id || 0);
      botGlow(ctx, Math.cos(a) * (14 + 34 * q) * big, FEET + Math.sin(a) * (5 + 11 * q) * big - 8 * q, (7 + 5 * q) * big, '180, 172, 180', 0.8 * (1 - q));
    }
  }

  const raging = !dead && u.rage;
  if (raging) {
    botGlow(ctx, 0, -20 * big, (46 + 5 * Math.sin(t * 9)) * big, '255, 60, 100', 0.34);
    for (let i = 0; i < 10; i++) {
      const q = (t * 0.9 + i * 0.317) % 1;
      ctx.fillStyle = `rgba(255, ${i % 3 === 0 ? 200 : 88}, ${i % 3 === 0 ? 180 : 120}, ${0.9 * (1 - q)})`;
      ctx.beginPath();
      ctx.arc((Math.sin(i * 7.3) * 30 + Math.sin(q * 8 + i) * 3) * big, FEET - q * 58 * big, 1.5 * (1 - q) + 0.4, 0, TAU);
      ctx.fill();
    }
  }
  // rings of cut air, drawn half behind him and half in front
  const vortex = (front) => {
    if (!spin || spin.reach < 0.05) return;
    const R = d.spin.radius * 0.92 * spin.reach;
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const y = FEET - 4 - i * 10.5 * big;
      const rad = R * (1 - Math.abs(i - 1.6) * 0.13);
      const lead = (spin.on ? spin.turn * (1.15 - i * 0.05) : t * 5) + i * 1.9;
      for (let k = 0; k < 2; k++) {
        const a1 = lead + k * Math.PI;
        for (let seg = 0; seg < 9; seg++) {
          const a = a1 - seg * 0.24;
          if (Math.sin(a) > 0 !== front) continue;
          const al = (1 - seg / 9) * (spin.on ? 1 : 0.4) * spin.reach;
          ctx.strokeStyle = i % 2 ? `rgba(255, 255, 255, ${0.9 * al})` : `rgba(80, 245, 212, ${0.85 * al})`;
          ctx.lineWidth = (4.6 - seg * 0.42) * (i === 2 ? 1.5 : 1);
          ctx.beginPath();
          ctx.ellipse(0, y, rad, rad * 0.3, 0, a - 0.25, a);
          ctx.stroke();
        }
      }
    }
  };
  vortex(false);

  // ---- he drops in heavily, with a streak above him, and squashes as he lands
  if (age < 0.36) {
    const fall = 110 * (1 - (age / 0.36) ** 2);
    const sg = ctx.createLinearGradient(0, -fall - 95, 0, -fall - 12);
    sg.addColorStop(0, 'rgba(120, 245, 220, 0)');
    sg.addColorStop(1, 'rgba(180, 255, 240, 0.75)');
    ctx.fillStyle = sg;
    ctx.fillRect(-12, -fall - 95, 24, 83);
    ctx.translate(0, -fall);
  }
  const squash = age >= 0.36 && age < 0.68 ? Math.sin(((age - 0.36) / 0.32) * Math.PI) : 0;
  if (squash) {
    ctx.translate(0, FEET);
    ctx.scale(1 + 0.14 * squash, 1 - 0.17 * squash);
    ctx.translate(0, -FEET);
  }

  ctx.translate(0, FEET);
  ctx.scale(d.scale, d.scale);
  ctx.translate(0, -FEET);

  if (spin) {
    // crouching into it, then flashing round: each half turn shows him facing the other way
    ctx.translate(0, FEET);
    const turnX = spin.on ? Math.cos(spin.turn) : 1;
    const crouch = spin.on ? 0.04 : 0.1 * spin.reach;
    ctx.scale((turnX < 0 ? -1 : 1) * Math.max(0.42, Math.abs(turnX)) * (1 + crouch), 1 - crouch);
    ctx.translate(0, -FEET);
  }

  // ---- legs lift and plant one at a time
  const stepA = moving ? Math.sin(ph) : 0;
  const leg = (layer, v) => {
    ctx.save();
    ctx.translate(v * 6 * K, -Math.max(0, v) * 11 * K);
    drawLayer(ctx, layer);
    ctx.restore();
  };
  leg(A.legB, -stepA);
  leg(A.legA, stepA);

  // ---- the hull heaves with each step, breathes at rest, and throws its weight into every blow
  const bob = moving ? Math.abs(Math.cos(ph)) * 4.2 - 2.8 : Math.sin(t * 1.7) * 0.9 - show * 2.2;
  let lean = moving ? 0.03 + Math.sin(ph) * 0.05 : -0.05 * show;
  if (charging) lean += 0.15;
  let lunge = 0;
  if (swing !== null) lean = swing < 0 ? swing * 0.09 : swing * 0.3;
  if (swipe) {
    lean = swipe[0] > 0 ? -0.11 * (swipe[0] / 0.62) : -swipe[0] * 0.15;
    lunge = swipe[1] * 0.16;
  }
  if (gun) lean = gun.charge > 0 ? -0.06 * gun.charge : -0.2 * gun.kick;
  if (spin) lean = 0;
  const tremble = winding ? (Math.random() - 0.5) * charge * (cannon ? 2.4 : 1.4) : 0;
  ctx.translate(lunge * K * 3 + tremble * K, FEET);
  ctx.rotate(lean);
  ctx.translate(0, -FEET + bob * K);

  // ---- charging: boilers wide open, with speed lines
  if (charging) {
    for (const [jx, jy, len] of [[-34, -90, 40], [-52, -62, 36], [-44, -40, 28]]) {
      botGlow(ctx, (jx - 8) * K, jy * K, 24 * K, '80, 230, 215', 0.6);
      jugJet(ctx, jx, jy, jy < -80 ? 0.5 : 0, len, 8, t);
    }
    ctx.lineCap = 'round';
    for (let i = 0; i < 8; i++) {
      const q = (t * 3.6 + i / 8) % 1;
      const y = (-92 + i * 16) * K;
      ctx.strokeStyle = `rgba(${i % 2 ? '150, 156, 172' : '120, 240, 215'}, ${0.7 * (1 - q)})`;
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.moveTo((-56 - 60 * q) * K, y);
      ctx.lineTo((-96 - 60 * q) * K, y);
      ctx.stroke();
    }
  }

  // ---- the arms
  const idleArm = dead ? 0.25 : Math.sin(t * 1.7 + 1) * 0.035;
  const clawTurn = spin ? 0.85 * spin.reach : gun ? 0.28 * (gun.charge + gun.kick) : swing !== null ? -swing * 0.32 : moving ? Math.sin(ph) * 0.19 : -idleArm + Math.sin(t * 27) * 0.13 * show;
  if (!swipe) jugAt(ctx, JUG_CLAW_PIVOT, clawTurn, A.clawArm);
  drawLayer(ctx, A.body);

  // ---- the furnace glowing through his chest vents, with embers drifting up
  if (!dead) {
    const heat = 0.5 + 0.28 * Math.sin(t * 4.4) + charge * 0.5 + show * 0.4;
    botGlow(ctx, -17.6 * K, -31 * K, (9 + 6 * charge) * K, '80, 255, 210', 0.32 * heat);
    for (let i = 0; i < 4; i++) {
      const q = (t * 0.8 + i * 0.27) % 1;
      ctx.fillStyle = `rgba(150, 255, 225, ${0.85 * (1 - q)})`;
      ctx.beginPath();
      ctx.arc((-17.6 + Math.sin(q * 9 + i * 3) * 6) * K, (-31 - 22 * q) * K, 0.9 * K * (1.6 - q), 0, TAU);
      ctx.fill();
    }
  }

  // ---- the glowing slit in his mask
  const [ex, ey] = JUG_EYE;
  if (!dead) {
    const flick = age < 0.8 ? 0 : age < 1.3 ? (Math.sin(age * 60) > 0 ? 1 : 0.1) : 1;
    const hot = winding || charging ? 1 : 0.66 + 0.18 * Math.sin(t * 3) + show * 0.3;
    ctx.lineCap = 'round';
    const eyeRGB = raging ? '255, 66, 96' : '60, 235, 195';
    for (const [col, w] of [[`rgba(${eyeRGB}, ${flick * hot})`, raging ? 2.8 : 2.2], [`rgba(${raging ? '255, 226, 230' : '225, 255, 246'}, ${flick * hot})`, 0.85]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w * K;
      ctx.beginPath();
      ctx.moveTo((ex + 4.6) * K, (ey - 3.6) * K);
      ctx.lineTo(ex * K, (ey + 0.5) * K);
      ctx.lineTo((ex - 6.4) * K, (ey - 3.2) * K);
      ctx.moveTo(ex * K, (ey + 0.5) * K);
      ctx.lineTo((ex - 0.4) * K, (ey + 6) * K);
      ctx.stroke();
    }
    const flare = winding || charging || show > 0.4 || raging;
    botGlow(ctx, ex * K, ey * K, (flare ? 21 : 11) * K, raging ? '255, 70, 100' : '70, 255, 210', flick * (flare ? 0.68 : 0.3));
    if (flare) {
      // a lens flare streaking out of his eye
      const fl = (26 + 22 * Math.max(charge, show)) * K;
      const fg = ctx.createLinearGradient(ex * K - fl, 0, ex * K + fl, 0);
      fg.addColorStop(0, 'rgba(120, 255, 225, 0)');
      fg.addColorStop(0.5, `rgba(235, 255, 250, ${flick * 0.9})`);
      fg.addColorStop(1, 'rgba(120, 255, 225, 0)');
      ctx.fillStyle = fg;
      ctx.fillRect(ex * K - fl, (ey - 0.55) * K, fl * 2, 1.1 * K);
    }
  }

  // ---- the stacks: smoke at rest and on the march, jets of fire when he revs or lands a blow
  if (!dead) {
    const blast = s >= atk.windup && s < atk.windup + atk.recover * 0.6;
    const heavy = blast || moving;
    jugPuffs(ctx, -23, -99, t, heavy ? 6 : 4, blast ? 10 : heavy ? 7 : 5, blast ? 46 : heavy ? 34 : 24, blast ? '226, 232, 240' : '128, 126, 144', blast ? 0.85 : 0.6, heavy ? 1.35 : 0.55);
    const fire = Math.max(blast && !spinning ? 1 - (s - atk.windup) / (atk.recover * 0.6) : Math.max(show, charge * 0.6), raging ? 0.5 + 0.18 * Math.sin(t * 17) : 0);
    if (fire > 0.05) {
      for (const [sx, sy, turn] of [[-17.5, -95, 1.72], [-25, -96, 1.57], [-33, -91, 1.4]]) jugJet(ctx, sx, sy, turn, 30 * fire * (blast ? 1.4 : 1), 4.6, t + sx);
      botGlow(ctx, -25 * K, -104 * K, 30 * K * fire, '90, 235, 220', 0.5 * fire);
    }
  }

  // ---- winding up: power pours into the weapon and grit lifts off the floor
  const heave = swing !== null && swing < 0 ? [swing * 2.4, swing * 10] : [0, 0];
  if (winding) {
    let tip;
    if (claw) tip = [-60 + swipe[1], -12 + swipe[2]];
    else if (gun) tip = [61, -46];
    else if (spinning) tip = [62, -22];
    else {
      const p = jugTurned(JUG_AXE_PIVOT, 62, -14, swing);
      tip = [p[0] + heave[0], p[1] + heave[1]];
    }
    botGlow(ctx, tip[0] * K, tip[1] * K, (14 + 30 * charge) * K, '80, 255, 210', 0.35 + 0.4 * charge);
    ctx.lineCap = 'round';
    for (let i = 0; i < 16; i++) {
      const q = (t * 2.5 + i / 16) % 1;
      const a = i * 2.399 + t;
      const far = 46 * (1 - q) + 5;
      const near = Math.max(3, far - 11);
      ctx.strokeStyle = `rgba(${i % 3 === 0 ? '240, 255, 250' : '90, 250, 212'}, ${q * Math.min(1, charge * 2.2)})`;
      ctx.lineWidth = 1.2 * K * 2;
      ctx.beginPath();
      ctx.moveTo((tip[0] + Math.cos(a) * far) * K, (tip[1] + Math.sin(a) * far) * K);
      ctx.lineTo((tip[0] + Math.cos(a) * near) * K, (tip[1] + Math.sin(a) * near) * K);
      ctx.stroke();
    }
    for (let i = 0; i < 9; i++) {
      const q = (t * 1.3 + i * 0.37) % 1;
      ctx.fillStyle = `rgba(104, 96, 114, ${charge * (1 - q)})`;
      ctx.fillRect((-58 + i * 15) * K, (24 - 34 * q * charge) * K, 3.6 * K * (1 - q * 0.5), 3 * K * (1 - q * 0.5));
    }
  }

  // ---- the axe arm: ghost images and a broad crescent of light follow the blade down
  const axeTurn = spin ? -0.62 * spin.reach : gun ? gun.turn : swing !== null ? swing : swipe ? -0.4 * Math.min(1, s / atk.windup) : moving ? -Math.sin(ph) * 0.14 : idleArm - 0.05 * show;
  ctx.save();
  ctx.translate(heave[0] * K, heave[1] * K);
  if (gun) ctx.translate(gun.fwd * K, gun.up * K);
  if (swing !== null && s > d.windup - 0.09 && s < d.windup + 0.2) {
    const fade = s < d.windup ? 1 : 1 - (s - d.windup) / 0.2;
    ctx.save();
    ctx.translate(JUG_AXE_PIVOT[0] * K, JUG_AXE_PIVOT[1] * K);
    const a1 = 0.42 + Math.min(0.3, swing);
    const a0 = Math.max(-1.75, a1 - 2.1);
    for (const [outer, inner, col] of [[70, 20, `rgba(70, 235, 205, ${0.3 * fade})`], [66, 40, `rgba(140, 255, 228, ${0.6 * fade})`], [63, 55, `rgba(255, 255, 255, ${0.95 * fade})`]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, 0, outer * K, a0, a1);
      ctx.arc(0, 0, inner * K, a1, a0 + (a1 - a0) * 0.12, true);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
    if (s < d.windup + 0.05) {
      for (let k = 3; k >= 1; k--) {
        const back = jugSwingAngle(u, s - k * 0.019);
        if (back === null) continue;
        ctx.globalAlpha = 0.34 / k;
        jugAt(ctx, JUG_AXE_PIVOT, back, A.axeArm);
      }
      ctx.globalAlpha = 1;
    }
  }
  jugAt(ctx, JUG_AXE_PIVOT, axeTurn, A.axeArm);
  ctx.restore();

  // ---- the plasma swelling at the end of the arm, and the blast as it leaves
  if (gun && gun.charge > 0.04) {
    const c = gun.charge;
    const pulse = 1 + 0.14 * Math.sin(t * 46);
    botGlow(ctx, 61 * K, -46 * K, 30 * c * pulse * K, '70, 240, 215', 0.95);
    botGlow(ctx, 61 * K, -46 * K, 15 * c * pulse * K, '255, 255, 255', 1);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(61 * K, -46 * K, 6.5 * c * K, 0, TAU);
    ctx.fill();
    for (const [col, w] of [['rgba(80, 240, 220, 0.85)', 2.4], ['#ffffff', 0.9]]) {
      ctx.strokeStyle = col;
      ctx.lineWidth = w * K;
      for (let i = 0; i < 4; i++) {
        let x = 61;
        let y = -46;
        ctx.beginPath();
        ctx.moveTo(x * K, y * K);
        const a = t * 9 + (i / 4) * TAU;
        for (let k = 1; k <= 3; k++) {
          x = 61 + Math.cos(a + (Math.random() - 0.5)) * k * 8 * c;
          y = -46 + Math.sin(a + (Math.random() - 0.5)) * k * 8 * c;
          ctx.lineTo(x * K, y * K);
        }
        ctx.stroke();
      }
    }
  }
  if (gun && gun.kick > 0) {
    botGlow(ctx, 66 * K, -46 * K, 54 * gun.kick * K, '150, 255, 234', 0.95);
    ctx.fillStyle = `rgba(255, 255, 255, ${gun.kick})`;
    ctx.beginPath();
    for (let i = 0; i < 14; i++) {
      const a = (i / 14) * TAU;
      const r = (i % 2 === 0 ? (i === 0 ? 62 : 28) : 9) * gun.kick;
      const px = (66 + Math.cos(a) * r) * K;
      const py = (-46 + Math.sin(a) * r * 0.7) * K;
      if (i === 0) ctx.moveTo(px, py);
      else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ---- the claw swipe comes right across the front of him
  if (swipe) {
    if (s > atk.windup - 0.09 && s < atk.windup + 0.07) {
      for (let k = 3; k >= 1; k--) {
        const p = jugClawPose(u, Math.max(0, s - k * 0.02));
        ctx.save();
        ctx.globalAlpha = 0.32 / k;
        ctx.translate(p[1] * K, p[2] * K);
        jugAt(ctx, JUG_CLAW_PIVOT, p[0], A.clawArm);
        ctx.restore();
      }
    }
    ctx.save();
    ctx.translate(swipe[1] * K, swipe[2] * K);
    jugAt(ctx, JUG_CLAW_PIVOT, swipe[0], A.clawArm);
    ctx.restore();
  }

  if (spin) {
    ctx.save();
    placeUnit(ctx, dpr, u);
    vortex(true);
    ctx.restore();
  }

  // ---- damage: a white wince when struck, then fire, smoke and sparks once he's badly hurt
  if (!dead && u.hit > 0.185) botGlow(ctx, 0, -38 * K, 40 * K, '255, 255, 255', 0.2);
  burnGlow(ctx, u, 40 * K, 42 * K);
  if (!dead && u.hp < d.hp * 0.5) {
    jugPuffs(ctx, 12, -62, t + 0.3, 5, 7, 40, '62, 58, 72', 0.75, 0.9);
    if (u.hp < d.hp * 0.25) {
      jugJet(ctx, -38, -62, 1.2, 14 + Math.sin(t * 22) * 4, 3.4, t);
      botGlow(ctx, -38 * K, -66 * K, 13 * K, '255, 150, 60', 0.6 + 0.25 * Math.sin(t * 31));
    }
    if (Math.sin(t * 9) > 0.7) {
      ctx.lineCap = 'round';
      let x = (Math.random() - 0.5) * 50;
      let y = -40 + (Math.random() - 0.5) * 40;
      const path = [[x, y]];
      for (let i = 0; i < 4; i++) {
        x += (Math.random() - 0.5) * 22;
        y += (Math.random() - 0.5) * 22;
        path.push([x, y]);
      }
      for (const [col, w] of [['rgba(80, 220, 255, 0.8)', 2.8], ['#ffffff', 1]]) {
        ctx.strokeStyle = col;
        ctx.lineWidth = w * K;
        ctx.beginPath();
        path.forEach(([px, py], i) => (i ? ctx.lineTo(px * K, py * K) : ctx.moveTo(px * K, py * K)));
        ctx.stroke();
      }
    }
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

const DRAWERS = {
  zombie: drawZombie,
  skeleton: drawSkeleton,
  mage: (ctx, dpr, sprites, u) => drawStaffUnit(ctx, dpr, sprites, u, 'mage'),
  necromancer: (ctx, dpr, sprites, u) => drawStaffUnit(ctx, dpr, sprites, u, 'necromancer'),
  ...Object.fromEntries(CREATURE_IDS.map((id) => [id, (ctx, dpr, sprites, u) => drawCreature(ctx, dpr, sprites, u, burnOverlay)])),
  flamethrower: drawFlamethrower,
  trooper: drawTrooper,
  juggernaut: drawJuggernaut,
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

export function drawFx(ctx, dpr, sprites, world) {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  if (!blob) blob = makeBlob();

  // flamethrower fire (and the flames on burning units): soft blobs that begin as
  // small pale-yellow dots, swell into orange smudges, and end up charred brown
  for (const f of world.flames) {
    const t = f.age / f.life;
    const r = (f.size + f.grow * t) * (f.small ? 1 : 1.12);
    const spr = t < 0.3 ? blobs.yellow : f.dark && t > 0.62 ? blobs.brown : blobs.orange;
    ctx.globalAlpha = Math.max(0, (t < 0.1 ? 0.75 + t * 2 : 0.92) * (1 - t * t * t));
    ctx.drawImage(spr, f.x - r, f.y - r, r * 2, r * 2);
  }
  ctx.globalAlpha = 1;

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
  juggernaut: [172, 88, 118, null],
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
  mage: [128, 54, 68, (g, S) => {
    g.translate(25 * K, 0);
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
  if (species === 'juggernaut') {
    for (const part of ['legB', 'legA', 'clawArm', 'body', 'axeArm']) drawLayer(g, S[part]);
    g.restore();
    return;
  }
  if (species === 'trooper') drawLayer(g, S.pack);
  if (species === 'cavalry') {
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
