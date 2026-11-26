import { TAU, K, UNIT, FEET } from './config.js?v=211';
import { drawLayer, OUT } from './sprites.js?v=211';
import { drawDrop, trooperEyes, BOT_JETS } from './art_units.js?v=211';
import { drawCreature, paintCreatureIcon, CREATURE_IDS } from './creatures.js?v=211';
import { EGG_DROPS } from './art_eggs.js?v=211';

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

// Robot Juggernaut: drawn the same way as Robo Trooper, only bigger. He chops with the axe, and spins it when crowded.
// where the axe is (angle) and where his hand is, at `s` seconds into a chop
function jugAxeAt(d, s) {
  const rest = { a: -1.25, x: 15, y: 11 };
  const up = { a: -2.75, x: 5, y: -3 };
  const down = { a: 0.72, x: 19, y: 12 };
  const blend = (p, q, k) => ({ a: p.a + (q.a - p.a) * k, x: p.x + (q.x - p.x) * k, y: p.y + (q.y - p.y) * k });
  if (s <= 0) return rest;
  const strike = 0.1;
  if (s < d.windup - strike) return blend(rest, up, 1 - (1 - s / (d.windup - strike)) ** 2);
  if (s < d.windup) return blend(up, down, ((s - (d.windup - strike)) / strike) ** 2);
  const after = (s - d.windup) / d.recover;
  return after < 0.45 ? down : blend(down, rest, (after - 0.45) / 0.55);
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
  const s = dead ? 0 : u.swing || 0;
  const spinning = s > 0 && u.atkKind === 'spin';
  const chopping = s > 0 && !spinning;

  placeUnit(ctx, dpr, u, u.hit > 0.16 ? (Math.random() - 0.5) * 1.4 : 0);

  const ring = (x, y, rx, col, width) => {
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, rx * 0.34, 0, 0, TAU);
    ctx.stroke();
  };
  // ---- on the ground: his landing dust, and the thump where the axe lands
  if (age > 0.26 && age < 0.8) {
    const q = (age - 0.26) / 0.54;
    ring(0, FEET + 1, 12 + 28 * q, `rgba(150, 148, 160, ${0.6 * (1 - q)})`, 3 * (1 - q) + 0.5);
  }
  if (chopping && s >= d.windup && s < d.windup + 0.32) {
    const q = (s - d.windup) / 0.32;
    const x = (u.strikeX || u.facing * d.slamAt) * u.facing;
    const y = (u.strikeY || 0) + FEET;
    ring(x, y, d.slamRadius * (0.25 + 0.85 * q), `rgba(90, 225, 205, ${0.85 * (1 - q)})`, 3.2 * (1 - q) + 0.4);
    ring(x, y, d.slamRadius * (0.15 + 0.5 * q), `rgba(255, 255, 255, ${0.9 * (1 - q)})`, 2 * (1 - q) + 0.3);
  }

  // ---- he drops in and squashes as he lands, like Robo Trooper
  if (age < 0.28) ctx.translate(0, -60 * (1 - (age / 0.28) ** 2));
  const squash = age >= 0.28 && age < 0.55 ? Math.sin(((age - 0.28) / 0.27) * Math.PI) : 0;
  ctx.translate(0, FEET);
  ctx.scale(d.scale * (1 + 0.2 * squash), d.scale * (1 - 0.22 * squash));
  ctx.translate(0, -FEET);
  if (spinning && s >= d.spin.windup) {
    // flashing round: each half turn faces the other way
    const c = Math.cos(((s - d.spin.windup) / 0.28) * TAU);
    ctx.scale((c < 0 ? -1 : 1) * Math.max(0.4, Math.abs(c)), 1);
  }

  drawLayer(ctx, A.feet[moving ? (u.anim | 0) & 3 : 0]);
  if (moving) {
    const wk = Math.abs(Math.sin(ph));
    ctx.translate(0, FEET);
    ctx.rotate((boosting ? 0.16 : 0.07) + Math.sin(ph) * 0.04);
    ctx.scale(1 + 0.05 * (1 - wk), 1 - 0.07 * (1 - wk));
    ctx.translate(0, -FEET - wk * 2);
  } else if (!dead) ctx.translate(0, Math.sin(t * 2.2) * 0.6);
  if (chopping) {
    // leans back with the axe up, then throws his weight into it
    const lean = s < d.windup - 0.1 ? -0.13 * Math.min(1, s / (d.windup - 0.1)) : s < d.windup + 0.12 ? 0.17 : 0.17 * Math.max(0, 1 - (s - d.windup - 0.12) / (d.recover - 0.12));
    ctx.translate(0, FEET);
    ctx.rotate(lean);
    ctx.translate(0, -FEET);
  }

  if (boosting) {
    for (const [jx, jy] of BOT_JETS) {
      botGlow(ctx, (jx - 5) * K, jy * K, 13 * K, '90, 180, 255', 0.5);
      botJet(ctx, jx, jy, 20, 4.2, t);
    }
  }
  drawLayer(ctx, A.pack);
  // the claw fist hangs at his back side, swinging as he walks and flung back as he chops
  ctx.save();
  const swingBack = chopping ? Math.sin(Math.min(1, s / (d.windup + d.recover)) * Math.PI) : 0;
  ctx.translate((-24 - 5 * swingBack + (moving ? Math.sin(ph) * 3 : 0)) * K, (13 - 6 * swingBack + (moving ? 0 : Math.sin(t * 2.2 + 1) * 1.2)) * K);
  ctx.rotate(0.35 + (moving ? Math.sin(ph) * 0.22 : Math.sin(t * 1.6) * 0.06) + 0.8 * swingBack);
  drawLayer(ctx, A.fist);
  ctx.restore();
  drawLayer(ctx, A.torso);

  // soft puffs from the stacks
  if (!dead && age > 0.9) {
    for (let i = 0; i < 3; i++) {
      const q = (t * (moving ? 1.2 : 0.55) + i / 3) % 1;
      botGlow(ctx, (-11 - 9 * q) * K, (-37 - (moving ? 20 : 13) * q) * K, (3.4 + 5 * q) * K, '140, 138, 156', 0.6 * (1 - q));
    }
  }

  // ---- one eye: boots up, looks about, blinks, narrows to attack
  const power = age < 0.5 ? 0 : age < 0.85 ? (Math.sin(age * 70) > 0 ? 1 : 0.15) : 1;
  const attacking = s > 0 || (u.pose > 0.6 && !!u.target);
  const blink = !attacking && t % 3.3 < 0.16 ? Math.sin(((t % 3.3) / 0.16) * Math.PI) : 0;
  ctx.save();
  ctx.scale(K, K);
  trooperEyes(ctx, { lx: attacking ? 1 : Math.sin(t * 0.9) * 0.9, ly: attacking ? 0 : Math.sin(t * 1.7) * 0.5, lid: blink, angry: attacking, power, dead });
  ctx.restore();
  if (!dead && power > 0.5) botGlow(ctx, 10.6 * K, -4.6 * K, (attacking ? 14 : 11) * K, '70, 255, 205', attacking ? 0.34 : 0.18);

  burnGlow(ctx, u, 20.7 * K, 23 * K);
  if (!dead) drawHitFlash(ctx, u, 20.9 * K, 23.2 * K);

  // ---- the axe
  let axe = jugAxeAt(d, chopping ? s : 0);
  if (spinning) axe = { a: 0.05, x: 18, y: 8 };
  else if (!chopping && !dead) {
    if (moving) axe = { a: axe.a + Math.sin(ph) * 0.14, x: axe.x, y: axe.y };
    // now and then, while he waits, he twirls it round in his hand
    else if (t % 6 < 0.75) {
      const q = (t % 6) / 0.75;
      axe = { a: axe.a + q * q * (3 - 2 * q) * TAU, x: axe.x + 3 * Math.sin(q * Math.PI), y: axe.y - 3 * Math.sin(q * Math.PI) };
    } else axe = { a: axe.a + Math.sin(t * 2.2) * 0.05, x: axe.x, y: axe.y };
  }
  if (dead) axe = { a: 0.9, x: 16, y: 13 };
  // a bright streak follows the blade down
  if (chopping && s > d.windup - 0.07 && s < d.windup + 0.14) {
    const fade = s < d.windup ? 1 : 1 - (s - d.windup) / 0.14;
    ctx.save();
    ctx.translate(axe.x * K, axe.y * K);
    for (const [outer, inner, col] of [[46, 22, `rgba(110, 235, 215, ${0.5 * fade})`], [44, 36, `rgba(255, 255, 255, ${0.95 * fade})`]]) {
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.arc(0, 0, outer * K, -2.1, axe.a + 0.42);
      ctx.arc(0, 0, inner * K, axe.a + 0.42, -1.6, true);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }
  ctx.save();
  ctx.translate(axe.x * K, axe.y * K);
  ctx.rotate(axe.a);
  drawLayer(ctx, A.axe);
  ctx.restore();

  // ---- the spin leaves a ring of cut air round him
  if (spinning && s >= d.spin.windup && s < d.spin.windup + 0.4) {
    const q = (s - d.spin.windup) / 0.4;
    placeUnit(ctx, dpr, u);
    ring(0, FEET - 7, d.spin.radius * (0.65 + 0.35 * q), `rgba(100, 235, 215, ${0.8 * (1 - q)})`, 6 * (1 - q) + 0.5);
    ring(0, FEET - 7, d.spin.radius * (0.6 + 0.35 * q), `rgba(255, 255, 255, ${0.95 * (1 - q)})`, 2.4 * (1 - q) + 0.3);
    return;
  }

  // ---- sparks crawl over him when he's hit
  if (!dead && (u.hit > 0.14 || (u.hp < d.hp * 0.4 && Math.sin(t * 7.3) > 0.9))) {
    ctx.lineJoin = 'miter';
    for (let b = 0; b < 2; b++) {
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
  juggernaut: [112, 54, 68, (g, S) => {
    g.save();
    g.scale(K, K);
    trooperEyes(g, { lx: 0.7, ly: 0.2 });
    g.restore();
    g.translate(15 * K, 11 * K);
    g.rotate(-1.15);
    drawLayer(g, S.axe);
  }],
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
  if (species === 'trooper' || species === 'juggernaut') drawLayer(g, S.pack);
  if (species === 'juggernaut') {
    g.save();
    g.translate(-24 * K, 13 * K);
    g.rotate(0.35);
    drawLayer(g, S.fist);
    g.restore();
  }
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
