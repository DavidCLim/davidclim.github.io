import { TAU, K } from './config.js?v=225';
import { makeLayer, drawLayer, rr, star, FEET_POSES, drawFeet, OUT, drawSniperBody, drawSniperEyes, drawSniperHat, neckScarf } from './sprites.js?v=225';

// Art for the rest of the Army, drawn from the supplied showcase video.
// Same conventions as the soldier: art px, origin at the body centre, y
// down, facing right, feet about 25 below the centre.

// Pupil offsets for the idle gaze variants: right, centre, left.
export const GAZE3 = [[1.6, -2], [0, -2.5], [-1.6, -2]];

export function eggBody(g, top, bot, rx = 20.7, ry = 23) {
  const gr = g.createLinearGradient(0, -ry, 0, ry);
  gr.addColorStop(0, top);
  gr.addColorStop(1, bot);
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, rx, ry, 0, 0, TAU);
  g.fill();
  g.stroke();
}

export function bigEyes(g, xs, gz, y = -4.8, rx = 4.4, ry = 4.6, ring = 1.6, pr = 2.8, squint = false) {
  // white discs in a dark ring, with big plain pupils sitting low and to the right
  for (const x of xs) {
    if (squint) {
      // eyelid pulled down: only a low crescent of white and pupil under a flat dark lid
      g.save();
      g.beginPath();
      g.rect(x - rx - 2, y - 0.2, rx * 2 + 4, ry + 3);
      g.clip();
      g.fillStyle = '#fdfdf8';
      g.beginPath();
      g.ellipse(x, y, rx, ry, 0, 0, TAU);
      g.fill();
      g.fillStyle = '#0d0b10';
      g.beginPath();
      g.arc(x + rx - pr + 0.3 + gz[0] * 0.5, y + 0.9 + gz[1] * 0.4, pr, 0, TAU);
      g.fill();
      g.strokeStyle = OUT;
      g.lineWidth = ring;
      g.beginPath();
      g.ellipse(x, y, rx, ry, 0, 0, TAU);
      g.stroke();
      g.restore();
      g.strokeStyle = OUT;
      g.lineWidth = ring + 1.1;
      g.beginPath();
      g.moveTo(x - rx - 0.6, y - 0.2);
      g.lineTo(x + rx + 0.6, y - 0.2);
      g.stroke();
      continue;
    }
    g.fillStyle = '#fdfdf8';
    g.strokeStyle = OUT;
    g.lineWidth = ring;
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#0d0b10';
    g.beginPath();
    g.arc(x + rx - pr + 0.3 + gz[0] * 0.5, y + 0.5 + gz[1] * 0.4, pr, 0, TAU);
    g.fill();
  }
}

export function smile(g, mx, my, r = 4.4) {
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  g.arc(mx, my, r, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
}

function dome(g, color, rx, ry, cy) {
  g.fillStyle = color;
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  g.beginPath();
  g.ellipse(0, cy, rx, ry, 0, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.stroke();
}

// ---------------------------------------------------------------- minigunner
// A steel-grey egg with a dark helmet, a diagonal belt of gold rounds and an ammo box on his back.
function drawMiniBody(g, front, gz) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // the fuel tank on his back: a silver cylinder with an orange band and a red cap
  const tg = g.createLinearGradient(-28, 0, -17, 0);
  tg.addColorStop(0, '#dfe3eb');
  tg.addColorStop(0.5, '#aab2c1');
  tg.addColorStop(1, '#7c8497');
  g.fillStyle = tg;
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  rr(g, -28.6, -9, 11.6, 27, 4.6);
  g.fill();
  g.stroke();
  g.fillStyle = '#ee8a2a';
  g.fillRect(-28.4, 3.4, 11.2, 4);
  g.strokeStyle = OUT;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-28.4, 3.4);
  g.lineTo(-17.2, 3.4);
  g.moveTo(-28.4, 7.4);
  g.lineTo(-17.2, 7.4);
  g.stroke();
  g.fillStyle = '#d23d36';
  rr(g, -26.4, -12, 7.6, 4.2, 1.4);
  g.fill();
  g.stroke();
  // a red egg
  eggBody(g, '#ea5a3c', '#b8321f');
  // two silver reflective stripes round the belly
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.clip();
  g.fillStyle = '#e9ecf3';
  g.fillRect(-22, 8.6, 44, 3);
  g.fillRect(-22, 13.6, 44, 3);
  g.strokeStyle = OUT;
  g.lineWidth = 1;
  g.beginPath();
  for (const y of [8.6, 11.6, 13.6, 16.6]) {
    g.moveTo(-22, y);
    g.lineTo(22, y);
  }
  g.stroke();
  g.restore();
  bigEyes(g, front ? [-7.4, 7.4] : [-1.6, 11.4], gz, -2.4, 4.2, 4.4, 1.4, 2.6);
  if (front) smile(g, 0, 5, 3.4);
  else smile(g, 6, 5, 3);
  // a yellow firefighter's helmet with a long back brim, a ridge and a badge
  const hg = g.createLinearGradient(0, -26, 0, -8);
  hg.addColorStop(0, '#ffd83e');
  hg.addColorStop(1, '#e8a31c');
  g.fillStyle = hg;
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.moveTo(-18.6, -8.4);
  g.bezierCurveTo(-19.8, -25, 19.8, -25, 18.6, -8.4);
  g.quadraticCurveTo(0, -11.4, -18.6, -8.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#f5b524';
  rr(g, -2.4, -25.6, 4.8, 15.6, 2);
  g.fill();
  g.stroke();
  g.fillStyle = '#e29a1a';
  g.beginPath();
  g.moveTo(-22.8, -9.4);
  g.quadraticCurveTo(0, -5.6, 22.8, -9.4);
  g.lineTo(21.4, -6.6);
  g.quadraticCurveTo(0, -3, -21.4, -6.6);
  g.closePath();
  g.fill();
  g.stroke();
  const bx = front ? 0 : 6.6;
  g.fillStyle = '#d23d36';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(bx - 4, -20.6);
  g.lineTo(bx + 4, -20.6);
  g.lineTo(bx + 4, -14.6);
  g.quadraticCurveTo(bx, -11.8, bx - 4, -14.6);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#fff6d6';
  g.beginPath();
  g.moveTo(bx, -19.4);
  g.quadraticCurveTo(bx + 2.6, -16.6, bx, -14.4);
  g.quadraticCurveTo(bx - 2.6, -16.6, bx, -19.4);
  g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.4)';
  g.beginPath();
  g.ellipse(-10, -17, 2.4, 5, 0.4, 0, TAU);
  g.fill();
}

// Origin: the grip. A fat cluster of barrels pointing right.
function drawMinigun(g, firing) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // the hose coiling back to the tank
  g.strokeStyle = OUT;
  g.lineWidth = 5.2;
  g.beginPath();
  g.moveTo(-2, 3);
  g.quadraticCurveTo(-12, 8, -16, 1);
  g.stroke();
  g.strokeStyle = '#3b3f4b';
  g.lineWidth = 3.2;
  g.stroke();
  // the pistol grip
  g.fillStyle = '#4a3322';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  rr(g, -5, -1, 8, 11, 2);
  g.fill();
  g.stroke();
  // the gun body, a steel barrel and the nozzle
  g.fillStyle = '#d23d36';
  rr(g, -3, -5, 22, 9, 2.4);
  g.fill();
  g.stroke();
  g.fillStyle = '#9aa3b4';
  rr(g, 18, -3, 24, 6, 1.6);
  g.fill();
  g.stroke();
  g.fillStyle = '#5a6172';
  rr(g, 32, -4.4, 3.4, 8.8, 1);
  g.fill();
  g.stroke();
  g.fillStyle = '#2f3340';
  rr(g, 40, -4.8, 6, 9.6, 1.6);
  g.fill();
  g.stroke();
  // a little blue pilot light, flaring up when it fires
  if (firing) {
    const r = g.createRadialGradient(50, 0, 1, 50, 0, 13);
    r.addColorStop(0, 'rgba(255, 244, 170, 0.98)');
    r.addColorStop(0.5, 'rgba(255, 170, 60, 0.7)');
    r.addColorStop(1, 'rgba(255, 130, 30, 0)');
    g.fillStyle = r;
    g.beginPath();
    g.arc(50, 0, 13, 0, TAU);
    g.fill();
  } else {
    g.fillStyle = '#7fd0ff';
    g.strokeStyle = OUT;
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(47, 1.6);
    g.quadraticCurveTo(46, -2, 49.6, -4.4);
    g.quadraticCurveTo(51, -1.4, 48.8, 1.6);
    g.closePath();
    g.fill();
    g.stroke();
  }
}

// ---------------------------------------------------------------- chef (the old Roman's mechanics)
function drawRomanBody(g, front, gz, angry) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const ox = front ? 0 : 3;
  // a sandy, freshly baked egg in a double-breasted white coat
  eggBody(g, '#f3c984', '#d79b4a');
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.clip();
  g.fillStyle = '#ffffff';
  g.strokeStyle = 'rgba(70, 56, 40, 0.8)';
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(-23, 7);
  g.lineTo(-5 + ox, 7);
  g.lineTo(ox, 13);
  g.lineTo(5 + ox, 7);
  g.lineTo(23, 7);
  g.lineTo(23, 26);
  g.lineTo(-23, 26);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(ox, 13);
  g.lineTo(ox, 26);
  g.stroke();
  g.fillStyle = '#2b2a30';
  for (const [x, y] of [[-5.4, 15], [5.4, 15], [-5.4, 20.4], [5.4, 20.4]]) {
    g.beginPath();
    g.arc(x + ox, y, 1.5, 0, TAU);
    g.fill();
  }
  g.restore();
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.stroke();
  // rosy cheeks
  g.fillStyle = 'rgba(232, 96, 96, 0.5)';
  for (const x of front ? [-13.4, 13.4] : [-9, 16.4]) {
    g.beginPath();
    g.ellipse(x, 3.2, 3.2, 2, 0, 0, TAU);
    g.fill();
  }
  bigEyes(g, front ? [-8, 8] : [-2.4, 11.6], gz, -4.4, 4.4, 4.6, 1.5, 2.7);
  if (angry) {
    g.strokeStyle = OUT;
    g.lineWidth = 2;
    g.beginPath();
    for (const [x, sx] of front ? [[-8, 1], [8, -1]] : [[-2.4, 1], [11.6, -1]]) {
      g.moveTo(x - 5 * sx, -10.6);
      g.lineTo(x + 4 * sx, -8);
    }
    g.stroke();
  }
  if (front) smile(g, 0, 3.8, 3.4);
  else smile(g, 5.2, 4, 3.2);
  // a tall pleated toque with a band
  const tx = ox * 0.3;
  g.fillStyle = '#ffffff';
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.moveTo(-12 + tx, -12);
  g.lineTo(-14 + tx, -26);
  g.bezierCurveTo(-20 + tx, -35, -8 + tx, -40, 0 + tx, -37);
  g.bezierCurveTo(8 + tx, -40, 20 + tx, -35, 14 + tx, -26);
  g.lineTo(12 + tx, -12);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = '#cfd4de';
  g.lineWidth = 1;
  g.beginPath();
  for (const x of [-8, -3, 3, 8]) {
    g.moveTo(x + tx, -13);
    g.lineTo(x * 1.2 + tx, -30);
  }
  g.stroke();
  g.fillStyle = '#ffffff';
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.roundRect(-14 + tx, -16, 28, 7.6, 3);
  g.fill();
  g.stroke();
  g.strokeStyle = '#cfd4de';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-13 + tx, -12);
  g.lineTo(13 + tx, -12);
  g.stroke();
}

// Origin: the hand. A long steel ladle, used as a club.
function drawSpear(g) {
  g.lineJoin = 'round';
  const hg = g.createLinearGradient(0, -3, 0, 3);
  hg.addColorStop(0, '#e1e5ee');
  hg.addColorStop(1, '#8e98ac');
  g.fillStyle = hg;
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  rr(g, -9, -2.2, 44, 4.4, 2);
  g.fill();
  g.stroke();
  g.fillStyle = '#7a4a2a';
  rr(g, -9, -2.6, 14, 5.2, 2.2);
  g.fill();
  g.stroke();
  const bg = g.createRadialGradient(46, -3, 1, 47, 0, 13);
  bg.addColorStop(0, '#f2f5fa');
  bg.addColorStop(1, '#8590a6');
  g.fillStyle = bg;
  g.beginPath();
  g.arc(47, 0, 11.4, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#4a4f5c';
  g.beginPath();
  g.ellipse(48.4, 0, 7.4, 8, 0, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.35)';
  g.beginPath();
  g.ellipse(46, -3, 3.2, 1.6, -0.5, 0, TAU);
  g.fill();
}

// Origin: the middle of the shield.
// ---------------------------------------------------------------- grenadier
// A wide-brimmed hat in the cowboy's shape; origin: the bottom edge of the crown.
function westernHat(g, c0, c1, band, feather) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const felt = g.createLinearGradient(0, -20, 0, 4);
  felt.addColorStop(0, c0);
  felt.addColorStop(1, c1);
  g.fillStyle = felt;
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.moveTo(-31, -9);
  g.quadraticCurveTo(-30, -1, -18, 1.6);
  g.quadraticCurveTo(0, 5.6, 18, 1.6);
  g.quadraticCurveTo(30, -1, 31, -9);
  g.quadraticCurveTo(26, -3.4, 16, -3.6);
  g.quadraticCurveTo(0, -4.6, -16, -3.6);
  g.quadraticCurveTo(-26, -3.4, -31, -9);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(-12.4, -3.4);
  g.quadraticCurveTo(-13.4, -14, -9, -17.6);
  g.quadraticCurveTo(-4.6, -21, -1.2, -16.6);
  g.quadraticCurveTo(0, -15.2, 1.2, -16.6);
  g.quadraticCurveTo(4.6, -21, 9, -17.6);
  g.quadraticCurveTo(13.4, -14, 12.4, -3.4);
  g.quadraticCurveTo(0, -1.6, -12.4, -3.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = band;
  g.beginPath();
  g.moveTo(-12.6, -3.4);
  g.quadraticCurveTo(0, -1.4, 12.6, -3.4);
  g.lineTo(12.4, -7.6);
  g.quadraticCurveTo(0, -5.6, -12.6, -7.6);
  g.closePath();
  g.fill();
  g.stroke();
  if (feather) {
    g.fillStyle = feather;
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(8, -5.6);
    g.quadraticCurveTo(20, -9, 19.4, -21);
    g.quadraticCurveTo(13, -13, 7, -4);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-9, -12);
  g.quadraticCurveTo(-7, -16.4, -3.4, -17);
  g.stroke();
}

function drawBowler(g) {
  // a cream explorer's pith helmet with a brown band; origin: the bottom edge of the crown
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const bg = g.createLinearGradient(0, -22, 0, 2);
  bg.addColorStop(0, '#f6ecd0');
  bg.addColorStop(1, '#cdb98a');
  g.fillStyle = bg;
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.moveTo(-17, -2.4);
  g.bezierCurveTo(-18.6, -23, 18.6, -23, 17, -2.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(-23.6, -0.6);
  g.quadraticCurveTo(-22, -5.6, -15, -4.6);
  g.quadraticCurveTo(0, -3.2, 15, -4.6);
  g.quadraticCurveTo(22, -5.6, 23.6, -0.6);
  g.quadraticCurveTo(0, 6.4, -23.6, -0.6);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#7a5230';
  g.beginPath();
  g.moveTo(-16.6, -4.4);
  g.quadraticCurveTo(0, -2, 16.6, -4.4);
  g.lineTo(16.8, -9.2);
  g.quadraticCurveTo(0, -6.8, -16.8, -9.2);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#e5b94d';
  rr(g, -2.4, -8, 4.8, 3.6, 0.8);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(110, 90, 50, 0.55)';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(0, -21);
  g.lineTo(0, -9.4);
  g.moveTo(-8, -19.6);
  g.quadraticCurveTo(-10, -14, -9.4, -9.4);
  g.moveTo(8, -19.6);
  g.quadraticCurveTo(10, -14, 9.4, -9.4);
  g.stroke();
  g.fillStyle = '#d8c79a';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(0, -20.6, 2, 0, TAU);
  g.fill();
  g.stroke();
}

function drawGrenBody(g, front, gz) {
  eggBody(g, '#66b1bd', '#4f95a2');
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.clip();
  g.lineCap = 'butt';
  // the bandolier runs from the left side, just under the hat, down to the bomb
  g.strokeStyle = OUT;
  g.lineWidth = 8.4;
  g.beginPath();
  g.moveTo(-23, -5.5);
  g.lineTo(15, 17);
  g.stroke();
  g.strokeStyle = '#46603a';
  g.lineWidth = 6.4;
  g.beginPath();
  g.moveTo(-23, -5.5);
  g.lineTo(15, 17);
  g.stroke();
  g.strokeStyle = '#d7c27a';
  g.lineWidth = 1;
  g.setLineDash([2.2, 1.8]);
  g.beginPath();
  g.moveTo(-22, -8);
  g.lineTo(16, 14.6);
  g.stroke();
  g.setLineDash([]);
  // two little canvas pouches with brass snaps
  for (const [px, py] of [[-0.2, 8.4], [7.6, 13]]) {
    g.fillStyle = '#5b7a45';
    g.strokeStyle = OUT;
    g.lineWidth = 1.2;
    rr(g, px - 3.6, py - 3.2, 7.2, 7.4, 1.6);
    g.fill();
    g.stroke();
    g.fillStyle = '#e5b94d';
    g.beginPath();
    g.arc(px, py - 0.4, 1, 0, TAU);
    g.fill();
  }
  g.lineCap = 'round';
  g.restore();
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.stroke();

  bigEyes(g, front ? [-8.4, 8.4] : [-2.4, 11], gz, -2, 4.5, 4.6, 1.9, 2.7);
  if (front) smile(g, 0, 3.8, 3.4);
  else smile(g, 4.6, 4.4, 3.2);
  // a black bowler hat
  g.save();
  g.translate(0, -8.4);
  drawBowler(g);
  g.restore();
}

// Origin: the middle of the bomb.
function drawBomb(g, lit) {
  g.scale(1.22, 1.22);
  g.fillStyle = '#1b1a20';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  g.arc(0, 0, 6.6, 0, TAU);
  g.fill();
  g.stroke();
  // the small pale highlight
  g.fillStyle = '#a4a6b2';
  g.beginPath();
  g.arc(-2, -2.4, 1.6, 0, TAU);
  g.fill();
  // a small yellow spark up by the fuse
  g.fillStyle = '#ffd94a';
  g.strokeStyle = '#e8902a';
  g.lineWidth = 0.6;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 3.1 : 1.1;
    const a = (i / 8) * TAU - Math.PI / 2;
    const px = 5.2 + Math.cos(a) * r;
    const py = -11 + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
  g.stroke();
}

// ---------------------------------------------------------------- archer
// The archer: a lavender egg in a green knit beanie with a folded cuff, and a wooden bow.

// Origin: the bottom edge of the cap. Used on the head and for the dropped hat.
// The original's cap is a soft green hood with a bent-over point.
function drawBushHat(g) {
  westernHat(g, '#9a7448', '#664a28', '#3f7a3a', '#f2eddc');
}

function drawArcherBody(g, front, gz, squint) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // a quiver of arrows on the back
  g.save();
  g.translate(-22.4, 4);
  g.rotate(-0.12);
  for (const [x, h, c] of [[-2.8, 14, '#d84a3a'], [0, 17, '#f2eddc'], [2.8, 13, '#d84a3a']]) {
    g.strokeStyle = OUT;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(x, -6);
    g.lineTo(x, -6 - h);
    g.stroke();
    g.fillStyle = c;
    g.beginPath();
    g.ellipse(x, -6 - h + 1.6, 1.5, 3, 0, 0, TAU);
    g.fill();
    g.stroke();
  }
  g.fillStyle = '#7a4a2a';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  rr(g, -5.2, -7, 10.4, 22, 2.4);
  g.fill();
  g.stroke();
  g.fillStyle = '#e5b94d';
  g.fillRect(-5, 1, 10, 1.8);
  g.restore();
  // a moss-green egg
  eggBody(g, '#9cc16b', '#6a9444');
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.stroke();

  bigEyes(g, front ? [-8.4, 8.4] : [-2.2, 12.6], gz, -3.8, 4.5, 4.7, 1.1, 3, !!squint);
  if (front) smile(g, 0, 6.6, 3.2);
  else smile(g, 5.2, 7, 2.8);
  // a wide hat with a feather
  g.save();
  g.translate(0, -11.2);
  drawBushHat(g);
  g.restore();
}

// Origin: the grip. A wooden recurve: the bow bulges toward +x; the string is on the left.
function drawBow(g, drawn) {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  const limb = () => {
    g.beginPath();
    g.moveTo(-2, -24);
    g.bezierCurveTo(1, -22, 11.5, -17, 8.6, -8);
    g.lineTo(8.6, 8);
    g.bezierCurveTo(11.5, 17, 1, 22, -2, 24);
  };
  g.strokeStyle = OUT;
  g.lineWidth = 4.6;
  limb();
  g.stroke();
  g.strokeStyle = '#dd9a3a';
  g.lineWidth = 2.8;
  limb();
  g.stroke();
  g.strokeStyle = 'rgba(255, 220, 140, 0.55)';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(8.6, -14);
  g.lineTo(8.6, -4);
  g.stroke();
  // leather grip
  g.fillStyle = '#6a4326';
  g.strokeStyle = OUT;
  g.lineWidth = 1;
  rr(g, 6.4, -4.4, 4.4, 8.8, 1.4);
  g.fill();
  g.stroke();
  // string
  g.strokeStyle = '#e8e2d2';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(-2, -24);
  if (drawn) g.lineTo(-10, 0);
  g.lineTo(-2, 24);
  g.stroke();
}

// Origin: the nock. Points right; used in hand and in flight.
function drawArrow(g) {
  g.lineCap = 'round';
  g.strokeStyle = '#7b8089';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(31, 0);
  g.stroke();
  // red fletching
  g.fillStyle = '#e24b3d';
  g.strokeStyle = OUT;
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(-4, -3);
  g.lineTo(5.4, -0.2);
  g.lineTo(5.4, 0.2);
  g.lineTo(-4, 3);
  g.closePath();
  g.fill();
  g.stroke();
  // a small steel head
  g.fillStyle = '#b8bdc8';
  g.strokeStyle = '#3a3c48';
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(30, -2.4);
  g.lineTo(37, 0);
  g.lineTo(30, 2.4);
  g.closePath();
  g.fill();
  g.stroke();
}

// ---------------------------------------------------------------- knight / rider
function drawRiderHead(g, front, gz) {
  dome(g, '#a9aeb8', 18.5, 11.5, -12.5);
  g.fillStyle = '#3b3d46';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  rr(g, -23, -14, 46, 3.6, 1.8);
  g.fill();
  g.stroke();
  g.fillStyle = '#d8c24a';
  g.beginPath();
  g.arc(0, -24.6, 2, 0, TAU);
  g.fill();
  g.stroke();
}

function drawKnightBody(g, front, gz) {
  eggBody(g, '#f6d04c', '#e0aa28');
  const xs = front ? [-8, 8] : [-1.4, 12.4];
  bigEyes(g, xs, gz, -3.6, 3.7, 4.1);
  if (front) smile(g, 0, 4.6, 3.8);
  else smile(g, 6.4, 4.4, 3.4);
  drawRiderHead(g);
}

// Origin: the hand. A long thin gold shaft with a gold-and-grey head.
function drawLance(g) {
  g.lineCap = 'butt';
  g.strokeStyle = OUT;
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(-16, 0);
  g.lineTo(58, 0);
  g.stroke();
  g.strokeStyle = '#d9a64a';
  g.lineWidth = 1.7;
  g.beginPath();
  g.moveTo(-15.5, 0);
  g.lineTo(58, 0);
  g.stroke();
  g.lineCap = 'round';
  g.fillStyle = '#f0cc4a';
  g.strokeStyle = OUT;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(56, -2.4);
  g.lineTo(62, -3.6);
  g.lineTo(70, 0);
  g.lineTo(62, 3.6);
  g.lineTo(56, 2.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#c9ccd6';
  g.beginPath();
  g.moveTo(62, -3.2);
  g.lineTo(70, 0);
  g.lineTo(62, 3.2);
  g.closePath();
  g.fill();
  g.stroke();
  // the brown glove
  g.fillStyle = '#6e4326';
  g.beginPath();
  g.arc(0, 0, 2.6, 0, TAU);
  g.fill();
}

// ---------------------------------------------------------------- cavalry (the horse)
// Thin grey legs that scissor as the horse gallops. Per gait pose:
// [hip x, foot dx, knee bend].
const LEGS = [
  [17, [13, 3, -9, 2, 1]],
  [11, [8, 5, -4, 1, 2]],
  [-11, [-9, -2, 8, -1, -2]],
  [-17, [-14, -6, 4, -3, -1]],
];

function drawHorse(g, gait) {
  const leg = (hipX, dx, near) => {
    const fx = hipX + dx;
    g.strokeStyle = OUT;
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(hipX, 7);
    g.lineTo(hipX + dx * 0.55 + 1.5, 17);
    g.lineTo(fx, 26);
    g.stroke();
    g.strokeStyle = near ? '#c9c4b8' : '#aaa598';
    g.lineWidth = 1.9;
    g.beginPath();
    g.moveTo(hipX, 7);
    g.lineTo(hipX + dx * 0.55 + 1.5, 17);
    g.lineTo(fx, 26);
    g.stroke();
    g.fillStyle = '#4a4650';
    g.beginPath();
    g.ellipse(fx + 0.8, 26.6, 2.3, 1.5, 0, 0, TAU);
    g.fill();
  };
  leg(LEGS[1][0], LEGS[1][1][gait], false);
  leg(LEGS[3][0], LEGS[3][1][gait], false);

  // tail, a dark brown sweep down and back
  g.fillStyle = '#5d4339';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(-23, -4);
  g.bezierCurveTo(-34, -7, -41, 2, -43, 13);
  g.bezierCurveTo(-37, 7, -31, 6, -22, 4);
  g.closePath();
  g.fill();
  g.stroke();

  // neck and head
  g.fillStyle = '#e6dfcf';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(12, -9);
  g.lineTo(21, -27);
  g.lineTo(30, -23);
  g.lineTo(24, 0);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(22, -29);
  g.quadraticCurveTo(26, -34, 34, -31);
  g.quadraticCurveTo(42, -26, 44, -17);
  g.quadraticCurveTo(43, -12, 39, -13);
  g.quadraticCurveTo(33, -17, 27, -19);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#d5cdbb';
  g.beginPath();
  g.ellipse(41.5, -15.5, 3, 2.4, 0.5, 0, TAU);
  g.fill();
  g.fillStyle = '#26232b';
  g.beginPath();
  g.arc(32, -26, 1.1, 0, TAU);
  g.arc(43, -15.8, 0.8, 0, TAU);
  g.fill();
  // ears
  g.fillStyle = '#e6dfcf';
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(24, -31);
  g.lineTo(25, -38.5);
  g.lineTo(29.5, -31.5);
  g.closePath();
  g.fill();
  g.stroke();
  // dark mane along the neck
  g.strokeStyle = '#5d4339';
  g.lineWidth = 2.8;
  g.beginPath();
  g.moveTo(22, -30);
  g.quadraticCurveTo(14, -22, 10, -11);
  g.stroke();

  // body, with a brown patch up by the shoulder
  const gr = g.createLinearGradient(0, -13, 0, 13);
  gr.addColorStop(0, '#ece6d7');
  gr.addColorStop(1, '#d7d0bd');
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.ellipse(0, 0, 27, 12.6, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 26, 11.8, 0, 0, TAU);
  g.clip();
  g.fillStyle = '#9a6e55';
  g.beginPath();
  g.ellipse(12, -5, 5.5, 3.4, 0.5, 0, TAU);
  g.fill();
  g.restore();

  leg(LEGS[0][0], LEGS[0][1][gait], true);
  leg(LEGS[2][0], LEGS[2][1][gait], true);
}

// Origin: the rider's body centre. A yellow rounded block under a grey helmet.
function drawRider(g) {
  const gr = g.createLinearGradient(0, -11, 0, 11);
  gr.addColorStop(0, '#f8d84e');
  gr.addColorStop(1, '#e3ac2a');
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  rr(g, -8.6, -9, 17.2, 20, 5);
  g.fill();
  g.stroke();
  // the belt
  g.fillStyle = '#7a4c2c';
  g.fillRect(-8, 6, 16, 3.4);
  // eyes and a little smile
  for (const x of [1.4, 6.2]) {
    g.fillStyle = '#fffdf4';
    g.strokeStyle = OUT;
    g.lineWidth = 0.9;
    g.beginPath();
    g.ellipse(x, -2.4, 2.1, 2.3, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#14121a';
    g.beginPath();
    g.arc(x + 0.7, -2.2, 1.15, 0, TAU);
    g.fill();
  }
  g.strokeStyle = OUT;
  g.lineWidth = 0.9;
  g.beginPath();
  g.arc(4, 2.2, 1.8, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
  // grey helmet with a gold spike
  g.fillStyle = '#9fa5b6';
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  g.beginPath();
  g.ellipse(0, -8.6, 9.2, 6.4, 0, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#4c5062';
  rr(g, -10.4, -9.6, 20.8, 2.8, 1.4);
  g.fill();
  g.fillStyle = '#e9c13a';
  g.beginPath();
  g.moveTo(-1.4, -14.6);
  g.lineTo(0, -18.2);
  g.lineTo(1.4, -14.6);
  g.closePath();
  g.fill();
  g.stroke();
}

// ---------------------------------------------------------------- cowboy
// The sniper's tan egg and half-lidded eyes, but under a proper cowboy hat, with a
// big handlebar mustache and a flintlock pistol.

// Origin: the middle of the brim. A tall pinched crown, a leather hatband and a
// wide brim that curls up at both sides.
function drawCowboyHat(g) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const felt = g.createLinearGradient(0, -20, 0, 4);
  felt.addColorStop(0, '#7e5030');
  felt.addColorStop(1, '#5e3a20');
  g.fillStyle = felt;
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  // brim: scooped down at the front and curled up at the ends
  g.beginPath();
  g.moveTo(-31, -9);
  g.quadraticCurveTo(-30, -1, -18, 1.6);
  g.quadraticCurveTo(0, 5.6, 18, 1.6);
  g.quadraticCurveTo(30, -1, 31, -9);
  g.quadraticCurveTo(26, -3.4, 16, -3.6);
  g.quadraticCurveTo(0, -4.6, -16, -3.6);
  g.quadraticCurveTo(-26, -3.4, -31, -9);
  g.closePath();
  g.fill();
  g.stroke();
  // crown: tall, with a dent pinched into the top
  g.beginPath();
  g.moveTo(-12.4, -3.4);
  g.quadraticCurveTo(-13.4, -14, -9, -17.6);
  g.quadraticCurveTo(-4.6, -21, -1.2, -16.6);
  g.quadraticCurveTo(0, -15.2, 1.2, -16.6);
  g.quadraticCurveTo(4.6, -21, 9, -17.6);
  g.quadraticCurveTo(13.4, -14, 12.4, -3.4);
  g.quadraticCurveTo(0, -1.6, -12.4, -3.4);
  g.closePath();
  g.fill();
  g.stroke();
  // the dark leather band with a brass buckle
  g.fillStyle = '#2a1a0e';
  g.beginPath();
  g.moveTo(-12.6, -3.4);
  g.quadraticCurveTo(0, -1.4, 12.6, -3.4);
  g.lineTo(12.4, -7.6);
  g.quadraticCurveTo(0, -5.6, -12.6, -7.6);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#d7aa3f';
  g.strokeStyle = OUT;
  g.lineWidth = 0.9;
  rr(g, 2.4, -6.8, 4.6, 3.8, 0.8);
  g.fill();
  g.stroke();
  // shine on the crown
  g.strokeStyle = 'rgba(255, 220, 170, 0.35)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-9, -12);
  g.quadraticCurveTo(-7, -16.4, -3.4, -17);
  g.stroke();
}

function drawCowboyTorso(g, look, blink) {
  // a rust-orange egg: nothing like the sniper's tan or the hunter's green
  const gr = g.createLinearGradient(0, -22, 0, 24);
  gr.addColorStop(0, '#e8924a');
  gr.addColorStop(1, '#c4682f');
  g.fillStyle = gr;
  g.strokeStyle = '#1d1a22';
  g.lineWidth = 1.7;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#f2b074';
  g.beginPath();
  g.ellipse(-10.7, -5.4, 2.6, 2.3, 0, 0, TAU);
  g.fill();
  drawSniperEyes(g, [-1.5, 14.2], look, blink);
  // a big handlebar mustache under the nose
  g.fillStyle = '#3b2a1b';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-3.4, 6.2);
  g.quadraticCurveTo(-3, 0.4, 3.4, 1.2);
  g.quadraticCurveTo(6.2, 1.6, 7, 2.2);
  g.quadraticCurveTo(7.8, 1.6, 10.6, 1.2);
  g.quadraticCurveTo(17, 0.4, 17.4, 6.2);
  g.quadraticCurveTo(14, 4.4, 10.4, 5.4);
  g.quadraticCurveTo(7, 6.2, 3.6, 5.4);
  g.quadraticCurveTo(0, 4.4, -3.4, 6.2);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.18)';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(-1.6, 2.6);
  g.quadraticCurveTo(2, 1.8, 5, 2.8);
  g.moveTo(9, 2.8);
  g.quadraticCurveTo(12, 1.8, 15.6, 2.6);
  g.stroke();
  // a small smile below it
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  g.arc(7, 8.4, 2.8, Math.PI * 0.2, Math.PI * 0.8);
  g.stroke();
  // a red bandana knotted at the neck
  g.fillStyle = '#c8302f';
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(-12.4, 13);
  g.quadraticCurveTo(0, 16.4, 12.4, 13);
  g.lineTo(0, 22.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255,255,255,0.85)';
  for (const [x, y] of [[-6, 14.8], [0, 17.2], [6, 14.8]]) {
    g.beginPath();
    g.arc(x, y, 0.7, 0, TAU);
    g.fill();
  }
  // the wide hat
  g.save();
  g.translate(0, -11.2);
  drawCowboyHat(g);
  g.restore();
}

// Origin: the hand on the grip. The barrel points along +x. A proper flintlock
// pistol: walnut stock with a brass butt cap, a long steel barrel with brass
// bands and a flared muzzle, a ramrod underneath, and a lock with a serpentine
// cock, flint, frizzen and pan.
function drawFlintlock(g, firing) {
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  // walnut stock: a curved grip swelling into the fore-end
  g.fillStyle = '#9a6234';
  g.beginPath();
  g.moveTo(-3, -2.6);
  g.lineTo(9, -2.6);
  g.lineTo(21, -1);
  g.lineTo(21, 2.4);
  g.lineTo(8, 2.4);
  g.quadraticCurveTo(5.4, 6, 3.8, 11.6);
  g.lineTo(-5.4, 11);
  g.quadraticCurveTo(-4.6, 5, -3, -2.6);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(70, 40, 16, 0.7)';
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(-2.4, 2);
  g.quadraticCurveTo(0, 6, 0.6, 10);
  g.moveTo(10, -0.2);
  g.lineTo(19, 0.2);
  g.stroke();
  // brass butt cap and trigger guard
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.fillStyle = '#d7aa3f';
  g.beginPath();
  g.moveTo(-5.6, 10.4);
  g.lineTo(4, 11.2);
  g.lineTo(4.4, 13.2);
  g.lineTo(-6, 12.6);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(5, 2.6);
  g.quadraticCurveTo(6, 8, 11.6, 6.4);
  g.quadraticCurveTo(12, 3.6, 10, 2.6);
  g.stroke();
  g.strokeStyle = '#d7aa3f';
  g.lineWidth = 0.9;
  g.stroke();
  g.strokeStyle = OUT;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(8.4, 2.6);
  g.lineTo(8, 5.2);
  g.stroke();
  // ramrod under the barrel, with a brass tip
  g.fillStyle = '#d6bd8a';
  rr(g, 19, 2.6, 15, 1.6, 0.6);
  g.fill();
  g.stroke();
  g.fillStyle = '#d7aa3f';
  g.fillRect(33, 2.4, 1.8, 2);
  // long steel barrel with a flared muzzle and brass bands
  g.fillStyle = '#4c505c';
  rr(g, 8, -5, 26, 4.6, 0.8);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(33.4, -5.8);
  g.lineTo(37.6, -6.4);
  g.lineTo(37.6, 0.6);
  g.lineTo(33.4, -0.2);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#d7aa3f';
  for (const x of [14, 21.5, 28.4]) {
    g.fillRect(x, -5.3, 1.8, 5.2);
    g.strokeRect(x, -5.3, 1.8, 5.2);
  }
  g.fillStyle = 'rgba(190, 194, 208, 0.7)';
  g.fillRect(9, -4.4, 23, 0.9);
  // the lock: plate, pan, frizzen, and the serpentine cock holding a flint
  g.fillStyle = '#9ea1ad';
  g.beginPath();
  g.moveTo(-1.6, -3);
  g.lineTo(10.4, -3);
  g.quadraticCurveTo(12, 0.4, 9, 2.6);
  g.lineTo(-0.4, 2.6);
  g.quadraticCurveTo(-2.4, -0.2, -1.6, -3);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(60, 62, 72, 0.8)';
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(1, -0.8);
  g.quadraticCurveTo(4, -2.4, 7.6, -0.6);
  g.stroke();
  g.fillStyle = '#d7aa3f';
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  rr(g, 8.4, -6, 3.8, 2.4, 0.6);
  g.fill();
  g.stroke();
  g.fillStyle = '#2d2e36';
  g.beginPath();
  g.moveTo(11, -6.2);
  g.lineTo(11.8, -9.4);
  g.lineTo(14.2, -9.4);
  g.lineTo(13.2, -6.2);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#2d2e36';
  g.beginPath();
  g.moveTo(1.2, -3);
  g.quadraticCurveTo(-2.4, -6.4, 1.2, -9.4);
  g.quadraticCurveTo(3.8, -11.4, 6.2, -8.6);
  g.lineTo(4.4, -8);
  g.quadraticCurveTo(3, -9, 1.8, -7.6);
  g.quadraticCurveTo(3.4, -5.6, 3.6, -3);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#e6e0cf';
  g.fillRect(5.2, -10, 2.2, 1.7);
  if (firing) {
    star(g, 41, -3, 10, 4);
    g.fillStyle = 'rgba(255, 244, 190, 0.95)';
    g.beginPath();
    g.arc(12, -7, 2.4, 0, TAU);
    g.fill();
  }
}

// ---------------------------------------------------------------- ninja
function drawNinjaBody(g, front, gz) {
  // the samurai: a slate-grey egg under a wide conical straw hat, with a red sash
  eggBody(g, '#69788c', '#3f4a5c');
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.clip();
  g.fillStyle = '#c93a34';
  g.fillRect(-22, 11, 44, 4.6);
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-22, 11);
  g.lineTo(22, 11);
  g.moveTo(-22, 15.6);
  g.lineTo(22, 15.6);
  g.stroke();
  g.restore();
  // lacquered shoulder plates (sode) laced in red
  const sode = (x, y, w, h) => {
    g.fillStyle = '#2f3644';
    g.strokeStyle = OUT;
    g.lineWidth = 1.6;
    rr(g, x - w / 2, y - h / 2, w, h, 2.4);
    g.fill();
    g.stroke();
    g.strokeStyle = '#c93a34';
    g.lineWidth = 1.2;
    g.beginPath();
    for (const k of [-0.22, 0.12, 0.46]) {
      g.moveTo(x - w / 2 + 1, y + h * k);
      g.lineTo(x + w / 2 - 1, y + h * k);
    }
    g.stroke();
  };
  if (front) {
    sode(-18.2, 2, 8.4, 12.4);
    sode(18.2, 2, 8.4, 12.4);
  } else sode(-12, 3, 8.4, 12.4);
  bigEyes(g, front ? [-7.4, 7.4] : [-1.8, 11.4], gz, -3.2, 4.2, 4.4, 1.4, 2.6);
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  for (const x of front ? [-7.4, 7.4] : [-1.8, 11.4]) {
    g.moveTo(x - 4.6, -8.2);
    g.lineTo(x + 4.2, -6.2);
  }
  g.stroke();
  if (front) smile(g, 0, 8, 3);
  else smile(g, 6, 8, 2.6);
  // the straw hat
  const hg = g.createLinearGradient(0, -32, 0, -8);
  hg.addColorStop(0, '#ecd08a');
  hg.addColorStop(1, '#c9a24e');
  g.fillStyle = hg;
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.moveTo(-27, -9.4);
  g.quadraticCurveTo(-12, -14, -2, -32);
  g.quadraticCurveTo(0, -33.4, 2, -32);
  g.quadraticCurveTo(12, -14, 27, -9.4);
  g.quadraticCurveTo(0, -4.6, -27, -9.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(120, 84, 30, 0.55)';
  g.lineWidth = 0.9;
  g.beginPath();
  for (const t of [-0.66, -0.33, 0, 0.33, 0.66]) {
    g.moveTo(0, -31);
    g.lineTo(t * 22, -8.4 - Math.abs(t) * 2.4);
  }
  g.stroke();
  g.strokeStyle = 'rgba(120, 84, 30, 0.6)';
  g.beginPath();
  g.moveTo(-14.6, -13.6);
  g.quadraticCurveTo(0, -9.4, 14.6, -13.6);
  g.stroke();
}

// Origin: the hilt. The blade runs along +x.
function drawKatana(g) {
  g.fillStyle = '#3a2f4a';
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  rr(g, -10, -1.9, 10, 3.8, 1.2);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.28)';
  g.lineWidth = 0.9;
  g.beginPath();
  for (let x = -8; x < -1; x += 2.4) {
    g.moveTo(x, -1.6);
    g.lineTo(x + 1.2, 1.6);
  }
  g.stroke();
  g.fillStyle = '#d9b24a';
  g.strokeStyle = OUT;
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(0.4, 0, 1.7, 4.8, 0, 0, TAU);
  g.fill();
  g.stroke();
  const gr = g.createLinearGradient(0, -2, 0, 2);
  gr.addColorStop(0, '#f0f2f6');
  gr.addColorStop(1, '#b4b8c4');
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(1.5, -1.5);
  g.lineTo(46, -1.8);
  g.quadraticCurveTo(52, -2.6, 56, -5.4);
  g.quadraticCurveTo(52, 0.8, 46, 1.6);
  g.lineTo(1.5, 1.6);
  g.closePath();
  g.fill();
  g.stroke();
}

// ---------------------------------------------------------------- ghosts, drops
export function ghostBody(g) {
  // the original's ghost: a pale periwinkle dome with three scallops at the foot, two small dark eyes and a round mouth,
  // all shifted toward the side it faces; the same ghost for every unit
  g.lineJoin = 'round';
  const W = 19.5;
  g.beginPath();
  g.moveTo(-W, 21);
  g.lineTo(-W, -4);
  g.bezierCurveTo(-W, -28, W, -28, W, -4);
  g.lineTo(W, 21);
  g.quadraticCurveTo(W - 6.5, 14, W - 13, 21);
  g.quadraticCurveTo(W - 19.5, 14, W - 26, 21);
  g.quadraticCurveTo(W - 32.5, 14, -W, 21);
  g.closePath();
  const gr = g.createLinearGradient(0, -22, 0, 21);
  gr.addColorStop(0, '#dde8fc');
  gr.addColorStop(1, '#bccbee');
  g.fillStyle = gr;
  g.fill();
  g.strokeStyle = '#68708a';
  g.lineWidth = 1.7;
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.9)';
  g.beginPath();
  g.ellipse(9.4, -12, 2.6, 6, 0.25, 0, TAU);
  g.fill();
  g.fillStyle = '#3b3f52';
  g.beginPath();
  g.ellipse(-9.2, -7, 1.9, 3.2, 0, 0, TAU);
  g.ellipse(-2.6, -7, 1.9, 3.2, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(-5.9, 2, 1.7, 2.3, 0, 0, TAU);
  g.fill();
}

// What each unit loses when it dies, also used for the flying debris.
// Drawn centred on the origin, about 30 art px wide.
export const DROPS = {
  soldier(g) {
    g.fillStyle = '#2e4358';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 0, 11.5, 7, 0, Math.PI, TAU);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#1b1920';
    rr(g, -14.5, -0.6, 29, 2.4, 1.2);
    g.fill();
  },
  sniper(g) {
    g.fillStyle = '#5a4e32';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 0, 9, 7, 0, Math.PI, TAU);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.ellipse(0, 0.4, 19, 2.8, 0, 0, TAU);
    g.fill();
    g.stroke();
  },
  flamethrower(g) {
    g.fillStyle = '#f2b81c';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 0, 11, 7.5, 0, Math.PI, TAU);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#c63a2e';
    rr(g, -11, -2, 22, 3, 1.4);
    g.fill();
    g.stroke();
  },
  oldflamethrower(g) {
    for (const x of [-5.5, 5.5]) {
      g.fillStyle = '#15141a';
      g.beginPath();
      g.arc(x, 0, 5, 0, TAU);
      g.fill();
      g.fillStyle = '#f2bf1f';
      g.beginPath();
      g.arc(x, 0, 3.6, 0, TAU);
      g.fill();
    }
  },
  trooper(g) {
    g.save();
    g.scale(0.66, 0.66);
    g.translate(0, 18);
    drawTrooperCap(g);
    g.restore();
  },
  juggernaut(g) {
    g.save();
    g.scale(0.7, 0.7);
    g.translate(0, 18);
    drawTrooperCap(g);
    botPoly(g, BOT.lite, [[-10, -25], [-7, -32.5], [9, -33], [14, -26.5], [11, -23], [-8, -22.6]], 1.6);
    botPoly(g, '#b4ced8', [[-3.5, -30.6], [8, -30.8], [2, -24.8]], 1.1);
    g.restore();
  },
  jugfist(g) {
    g.save();
    g.scale(0.75, 0.75);
    drawJugFist(g);
    g.restore();
  },
  jettrooper(g) {
    g.save();
    g.scale(0.72, 0.72);
    g.translate(0, 20);
    drawJetCrest(g);
    drawTrooperCap(g);
    g.restore();
  },
  zordspine(g) {
    drawZordSpine(g, -8, 0, 0, 20, 0, false);
  },
  zordhead(g) {
    g.save();
    g.scale(0.62, 0.62);
    g.translate(-46, 108);
    drawZordHead(g);
    drawZordJaw(g);
    g.restore();
  },
  botpod(g) {
    botPoly(g, BOT.noz, [[-4, -4], [-13, -8], [-12, 3], [-4, 4]]);
    botBall(g, BOT.pod, 0, 0, 8, 1.6);
  },
  botlens(g) {
    botBall(g, '#7d749f', 0, 0, 8, 1.6);
    botBall(g, '#1fbc9c', 0, 0, 4.8, 1.2);
  },
  botplate(g) {
    botPoly(g, BOT.mid, [[-10, -4], [8, -7], [12, 3], [-3, 8]], 1.6);
    botBall(g, BOT.lite, -1, 0, 2.4, 1);
  },
  roman(g) {
    g.fillStyle = '#ffffff';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-7, 3);
    g.lineTo(-8, -6);
    g.bezierCurveTo(-12, -12, -4, -14, 0, -12);
    g.bezierCurveTo(4, -14, 12, -12, 8, -6);
    g.lineTo(7, 3);
    g.closePath();
    g.fill();
    g.stroke();
    rr(g, -8, 0, 16, 5, 2);
    g.fill();
    g.stroke();
  },



  grenadier(g) {
    g.fillStyle = '#3c4a36';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 0, 11.5, 7, 0, Math.PI, TAU);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#1b1920';
    rr(g, -14.5, -0.6, 29, 2.4, 1.2);
    g.fill();
  },
  archer(g) {
    // the beanie
    g.save();
    g.scale(0.7, 0.7);
    g.translate(0, 6);
    drawBushHat(g);
    g.restore();
  },
  cavalry(g) {
    DROPS.knight(g);
  },
  cowboy(g) {
    g.save();
    g.scale(0.55, 0.55);
    g.translate(0, 8);
    drawCowboyHat(g);
    g.restore();
  },
  knight(g) {
    g.fillStyle = '#a9aeb8';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 0, 10, 7, 0, Math.PI, TAU);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#3b3d46';
    rr(g, -12, -0.6, 24, 2.4, 1.2);
    g.fill();
  },
  ninja(g) {
    g.fillStyle = '#2c3150';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 0, 11, 7.5, 0, Math.PI, TAU);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#e8c24e';
    g.beginPath();
    g.moveTo(-2, -6);
    g.quadraticCurveTo(-4, -11, -9, -13);
    g.quadraticCurveTo(-5, -9, -5, -5);
    g.closePath();
    g.moveTo(2, -6);
    g.quadraticCurveTo(4, -11, 9, -13);
    g.quadraticCurveTo(5, -9, 5, -5);
    g.closePath();
    g.fill();
  },
};

// Light, tinted ghosts that keep the unit's headgear.
const GHOSTS = {
  flamethrower: ['#fff3dd', '#e8d3a8', (g) => dome(g, '#f2b81c', 11, 8, -10)],
  roman: ['#fff0f4', '#e8c4d0', (g) => {
    g.fillStyle = '#ffffff';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, -14, 12, 7, -0.1, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#d23d36';
    rr(g, -11.6, -10.6, 23.2, 3.6, 1.6);
    g.fill();
    g.stroke();
  }],
  grenadier: ['#ecf4f4', '#c4d3d3', (g) => dome(g, '#3c4a36', 12, 8, -10)],
  archer: ['#efeaf6', '#c9bfd9', (g) => {
    g.save();
    g.scale(0.7, 0.7);
    g.translate(0, -2);
    drawBushHat(g);
    g.restore();
  }],
  ninja: ['#eeedf0', '#cbcad0', (g) => {
    dome(g, '#2c3150', 12, 8, -10);
    g.fillStyle = '#e8c24e';
    g.strokeStyle = OUT;
    g.lineWidth = 0.8;
    g.beginPath();
    g.moveTo(-2, -16);
    g.quadraticCurveTo(-4, -21, -9, -23);
    g.quadraticCurveTo(-5, -19, -5, -15);
    g.closePath();
    g.moveTo(2, -16);
    g.quadraticCurveTo(4, -21, 9, -23);
    g.quadraticCurveTo(5, -19, 5, -15);
    g.closePath();
    g.fill();
    g.stroke();
  }],
  knight: ['#f9f4dd', '#dad2ac', (g) => dome(g, '#a9aeb8', 11.5, 8, -10)],
  cavalry: ['#f5f1e6', '#d8d2c2', (g) => dome(g, '#a9aeb8', 11.5, 8, -10)],
  cowboy: ['#f4eddb', '#d1c6a6', (g) => {
    g.fillStyle = '#5a4e32';
    g.strokeStyle = OUT;
    g.lineWidth = 1.1;
    g.beginPath();
    g.ellipse(0, -10, 8, 6, 0, Math.PI, TAU);
    g.closePath();
    g.fill();
    g.stroke();
    g.beginPath();
    g.ellipse(0, -9.4, 16, 2.4, 0, 0, TAU);
    g.fill();
    g.stroke();
  }],
};

// ---------------------------------------------------------------- Robo Trooper
// Built like the rest of the army (an egg on two little feet under a helmet), but armoured: a visor band with a big
// green lens for an eye, one antenna and a pair of thruster pods on his back.
const BOT = { lite: '#b9add2', mid: '#9b8db6', dark: '#746796', teal: '#5f7a74', tealDark: '#465e59', pod: '#b4ced8', podDark: '#7d98a6', noz: '#4a5a6b', hole: '#1f2730', slate: '#8c9bbd', gun: '#4f5a80', gunDark: '#353e60', gunLite: '#737fa6' };

function botPart(g, fill, lw, path) {
  g.beginPath();
  path();
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  g.strokeStyle = OUT;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  // (roundRect leaves a lone point behind, which a round line cap would show as a speck at its corner)
  const cap = g.lineCap;
  g.lineCap = 'butt';
  g.stroke();
  g.lineCap = cap;
}

function botPoly(g, fill, pts, lw = 1.4) {
  botPart(g, fill, lw, () => pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))));
}

function botBall(g, fill, x, y, r, lw = 1.4) {
  botPart(g, fill, lw, () => g.arc(x, y, r, 0, TAU));
}

// the thruster pack, drawn behind the body; the nozzle mouths are at BOT_JETS
export const BOT_JETS = [[-33, -15], [-32, 11]];
function drawTrooperPack(g) {
  botPoly(g, BOT.noz, [[-22, -12], [-14, -8], [-14, 8], [-22, 10]]);
  for (const [y, tip] of [[-11, -4], [8, 3]]) {
    botPoly(g, BOT.noz, [[-26, y - 5], [-34, y + tip - 5], [-33, y + tip + 4], [-25, y + 5]]);
    g.fillStyle = BOT.hole;
    g.beginPath();
    g.ellipse(-33.4, y + tip - 0.4, 1.9, 4.2, tip * 0.05, 0, TAU);
    g.fill();
    const gr = g.createRadialGradient(-23, y - 3, 1, -21, y, 10);
    gr.addColorStop(0, '#dcedf3');
    gr.addColorStop(1, BOT.podDark);
    botBall(g, gr, -21, y, 8.2, 1.7);
  }
}

function drawTrooperBody(g) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  eggBody(g, BOT.lite, BOT.dark);
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.2, 22.5, 0, 0, TAU);
  g.clip();
  // the visor band the lenses sit in
  botPart(g, BOT.teal, 1.3, () => {
    g.moveTo(-24, -13);
    g.quadraticCurveTo(2, -16, 24, -13);
    g.lineTo(24, 3);
    g.quadraticCurveTo(2, 8, -24, 2);
  });
  g.fillStyle = 'rgba(190, 220, 208, 0.35)';
  g.fillRect(-22, -11.6, 26, 2);
  botPoly(g, BOT.dark, [[-23, 17], [23, 16], [20, 26], [-20, 26]], 1.2);
  g.restore();
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.stroke();
  drawTrooperCap(g);
}

// the armoured helmet, with a brim like the soldiers'
function drawTrooperCap(g) {
  const gr = g.createLinearGradient(0, -29, 0, -13);
  gr.addColorStop(0, '#a99cc4');
  gr.addColorStop(1, '#675a88');
  botPart(g, gr, 1.8, () => {
    g.moveTo(-19, -13.4);
    g.bezierCurveTo(-18, -31, 19, -31, 20, -13.6);
    g.quadraticCurveTo(1, -16.6, -19, -13.4);
  });
  botPart(g, '#58497a', 1.6, () => g.roundRect(-22, -15.2, 45, 3.8, 1.9));
  g.fillStyle = 'rgba(232, 226, 255, 0.55)';
  g.beginPath();
  g.ellipse(-9, -22.4, 4, 2, -0.5, 0, TAU);
  g.fill();
}

// The eyes are drawn live so they can look about, blink, narrow, spin up and die.
//   o: { lx, ly (where they look, -1..1), lid (0 open .. 1 shut), angry, spin, power (0..1), dead }
export function trooperEyes(g, o) {
  const lx = o.lx || 0;
  const ly = o.ly || 0;
  const power = o.power === undefined ? 1 : o.power;
  const eye = (x, y, r, iris, deep, glow) => {
    botBall(g, '#7d749f', x, y, r, 1.5);
    botBall(g, '#242838', x, y, r * 0.76, 0.8);
    if (o.dead) {
      g.strokeStyle = glow;
      g.globalAlpha = 0.8;
      g.lineWidth = 1.4;
      g.beginPath();
      g.moveTo(x - r * 0.4, y - r * 0.4);
      g.lineTo(x + r * 0.4, y + r * 0.4);
      g.moveTo(x + r * 0.4, y - r * 0.4);
      g.lineTo(x - r * 0.4, y + r * 0.4);
      g.stroke();
      g.globalAlpha = 1;
      return;
    }
    if (power > 0.02) {
      g.globalAlpha = power;
      const gr = g.createRadialGradient(x - r * 0.2, y - r * 0.2, 0.3, x, y, r * 0.7);
      gr.addColorStop(0, glow);
      gr.addColorStop(0.6, iris);
      gr.addColorStop(1, deep);
      g.fillStyle = gr;
      g.beginPath();
      g.arc(x, y, r * 0.66, 0, TAU);
      g.fill();
      g.fillStyle = '#10141c';
      g.beginPath();
      g.arc(x + lx * r * 0.24, y + ly * r * 0.2, r * 0.27, 0, TAU);
      g.fill();
      g.fillStyle = '#ffffff';
      g.beginPath();
      g.arc(x + lx * r * 0.24 - r * 0.18, y + ly * r * 0.2 - r * 0.2, r * 0.14, 0, TAU);
      g.fill();
      g.globalAlpha = 1;
    }
    const lid = Math.max(o.lid || 0, o.angry ? 0.3 : 0);
    if (lid > 0.02) {
      g.save();
      g.beginPath();
      g.arc(x, y, r * 0.82, 0, TAU);
      g.clip();
      g.translate(x, y);
      if (o.angry) g.rotate(x > 4 ? -0.28 : 0.28);
      g.fillStyle = BOT.mid;
      g.fillRect(-r, -r, r * 2, r * 2 * lid);
      g.strokeStyle = OUT;
      g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(-r, -r + r * 2 * lid);
      g.lineTo(r, -r + r * 2 * lid);
      g.stroke();
      g.restore();
    }
  };
  eye(10.6, -4.6, 7.3, '#1fbc9c', '#0d6f60', '#9ffbe4');
}

// Origin: the grip. A chunky blue blaster with a scope and a power cell.
function drawTrooperGun(g) {
  g.lineJoin = 'round';
  botPoly(g, BOT.gunDark, [[-10, -3], [-3, -4.4], [-2, 4], [-11, 6]]);
  botPoly(g, BOT.gun, [[-4, -5.6], [15, -5.6], [17, 3.6], [-3, 4.4]], 1.6);
  botPoly(g, BOT.gunLite, [[16, -4.2], [31, -3.6], [31, 1.6], [16, 2.4]]);
  botPoly(g, BOT.gunDark, [[30, -5.8], [38.5, -5.8], [38.5, 3.6], [30, 3.6]], 1.6);
  g.fillStyle = '#12151f';
  g.fillRect(36.4, -3.4, 2, 4.6);
  g.fillStyle = 'rgba(255, 255, 255, 0.4)';
  g.fillRect(0, -4.6, 13, 1.2);
  // the window of the power cell (lit live)
  botPoly(g, '#1e2b42', [[1.5, -2.4], [12, -2.4], [12, 1.2], [1.5, 1.2]], 0.9);
  // his hand round the grip
  botBall(g, BOT.lite, 0.5, 3.6, 4.2, 1.5);
}

// ---------------------------------------------------------------- Robot Juggernaut
const JUGC = { steel: '#d3d8e3', band: '#4f6a62', pale: '#b4ced8' };

function jugSpikeSmall(g, x0, y0, tx, ty, w) {
  const a = Math.atan2(ty - y0, tx - x0) + Math.PI / 2;
  botPoly(g, JUGC.steel, [[x0 + Math.cos(a) * w, y0 + Math.sin(a) * w], [tx, ty], [x0 - Math.cos(a) * w, y0 - Math.sin(a) * w]], 1.3);
}

// Robot Juggernaut: Robo Trooper's armour and iron fists on a gorilla's frame. A high hump of shoulders slopes away
// to a low rump, his legs are short and bent, his head is carried forward under a heavy brow, and he walks on long
// arms with his knuckles down. Origin: the same as Robo Trooper's, with the ground about 28 below. This is the torso, back and all.
function drawJugBody(g) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // two exhaust stacks rising out of the hump
  for (const [x, y, w] of [[-15, -49, 7.5], [-27, -43, 7.5]]) {
    botPoly(g, JUGC.pale, [[x, y], [x + w, y - 0.8], [x + w + 5, y + 18], [x + 5, y + 19]], 1.6);
    g.fillStyle = '#1f2730';
    g.strokeStyle = OUT;
    g.lineWidth = 1.4;
    g.beginPath();
    g.ellipse(x + w / 2, y - 0.4, w / 2 + 0.6, 2.5, -0.1, 0, TAU);
    g.fill();
    g.stroke();
  }
  const torso = () => {
    g.moveTo(11, 2);
    g.bezierCurveTo(4, 6, -8, 9, -17, 6);
    g.bezierCurveTo(-21, 9, -28, 9, -31, 6);
    g.bezierCurveTo(-39, 3, -40, -11, -35, -19);
    g.bezierCurveTo(-30, -28, -21, -34, -10, -36);
    g.bezierCurveTo(-2, -39, 8, -38, 13, -31);
    g.bezierCurveTo(19, -21, 18, -6, 11, 2);
  };
  const gr = g.createLinearGradient(0, -37, 0, 9);
  gr.addColorStop(0, BOT.lite);
  gr.addColorStop(1, BOT.dark);
  botPart(g, gr, 0, torso);
  g.save();
  g.beginPath();
  torso();
  g.closePath();
  g.clip();
  // the armour's seams round his haunch, and the darker underside
  botPoly(g, BOT.dark, [[-33, 1], [16, -3], [16, 12], [-31, 14]], 1.2);
  g.strokeStyle = 'rgba(40, 34, 58, 0.55)';
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(-14, -35);
  g.bezierCurveTo(-26, -26, -29, -13, -26, 1);
  g.stroke();
  // a chest plate between his arms, and two seams along his flank
  botPart(g, BOT.teal, 1.4, () => {
    g.moveTo(-4, -10);
    g.quadraticCurveTo(10, -18, 22, -9);
    g.quadraticCurveTo(18, 5, 5, 4);
    g.quadraticCurveTo(-6, 2, -4, -10);
  });
  g.strokeStyle = 'rgba(40, 34, 58, 0.6)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-11, -1);
  g.lineTo(-14, 5);
  g.moveTo(-6, 1);
  g.lineTo(-8.4, 6);
  g.stroke();
  g.restore();
  g.strokeStyle = OUT;
  g.lineWidth = 2;
  g.beginPath();
  torso();
  g.closePath();
  g.stroke();
}

// the head: Robo Trooper's, set forward on the hump. His helmet rises to a crest toward the back, like a gorilla's
// crown, and carries the old hood plate. No nose and no mouth, only the one eye (drawn live).
// Drawn in Robo Trooper's own coordinates, then shrunk into place by JUG_HEAD.
export const JUG_HEAD = { x: 21, y: -17, k: 0.76 };
function inJugHead(g, draw) {
  g.save();
  g.translate(JUG_HEAD.x, JUG_HEAD.y);
  g.scale(JUG_HEAD.k, JUG_HEAD.k);
  draw();
  g.restore();
}

function drawJugHead(g) {
  inJugHead(g, () => {
    g.lineJoin = 'round';
    g.lineCap = 'round';
    const skull = () => g.ellipse(0, -1, 21, 20, 0, 0, TAU);
    const gr = g.createLinearGradient(0, -21, 0, 19);
    gr.addColorStop(0, BOT.lite);
    gr.addColorStop(1, BOT.dark);
    botPart(g, gr, 0, skull);
    g.save();
    g.beginPath();
    skull();
    g.clip();
    botPart(g, BOT.teal, 1.5, () => {
      g.moveTo(-24, -13);
      g.quadraticCurveTo(2, -16, 26, -13);
      g.lineTo(26, 7);
      g.quadraticCurveTo(2, 12, -24, 6);
    });
    g.restore();
    g.strokeStyle = OUT;
    g.lineWidth = 2.3;
    g.beginPath();
    skull();
    g.stroke();
    // the helmet, peaked toward the back
    const hg = g.createLinearGradient(0, -36, 0, -12);
    hg.addColorStop(0, '#a99cc4');
    hg.addColorStop(1, '#675a88');
    botPart(g, hg, 2.3, () => {
      g.moveTo(-20, -11);
      g.bezierCurveTo(-20, -27, -14, -36, -5, -38);
      g.bezierCurveTo(8, -34, 21, -27, 22, -12);
      g.quadraticCurveTo(1, -16, -20, -11);
    });
    botPoly(g, BOT.lite, [[-13, -27], [-10, -37.5], [4, -37], [13, -28.5], [8, -25], [-10, -25]], 2);
    botPoly(g, JUGC.pale, [[-6, -34.5], [6, -34], [-0.5, -27.6]], 1.4);
    g.fillStyle = 'rgba(232, 226, 255, 0.55)';
    g.beginPath();
    g.ellipse(-13, -20, 4, 2, -0.7, 0, TAU);
    g.fill();
  });
}

// the helmet's brim, heavy as a gorilla's brow and jutting out over his eye (drawn after the eye)
function drawJugBrow(g) {
  inJugHead(g, () => {
    g.lineJoin = 'round';
    botPart(g, '#58497a', 2.3, () => {
      g.moveTo(-22, -14.5);
      g.quadraticCurveTo(0, -19, 23, -15.5);
      g.quadraticCurveTo(29, -13.5, 28, -8.5);
      g.quadraticCurveTo(15, -11.5, 2, -11);
      g.quadraticCurveTo(-10, -10.6, -22, -9);
    });
  });
}

// the outline of one tapered length of limb, thick at one end and thinner at the other
function jugTaper(g, x0, y0, r0, x1, y1, r1) {
  const d = Math.hypot(x1 - x0, y1 - y0) || 0.01;
  const ang = Math.atan2(y1 - y0, x1 - x0);
  const off = Math.acos(Math.max(-1, Math.min(1, (r0 - r1) / d)));
  g.beginPath();
  g.arc(x0, y0, r0, ang + off, ang - off + TAU);
  g.arc(x1, y1, r1, ang - off, ang + off);
  g.closePath();
}

// a limb of several lengths drawn as one smooth shape: every part outlined first, then all filled over, so only the
// outer edge of the whole shows. `parts` are [x0, y0, r0, x1, y1, r1].
function jugLimbShape(g, parts, fill) {
  g.strokeStyle = OUT;
  g.lineWidth = 3.8;
  g.lineJoin = 'round';
  for (const p of parts) {
    jugTaper(g, ...p);
    g.stroke();
  }
  g.fillStyle = fill;
  for (const p of parts) {
    jugTaper(g, ...p);
    g.fill();
  }
}

// A long thick arm from shoulder (sx, sy) to wrist (wx, wy), nearly straight like a gorilla's, the elbow easing out
// behind. Returns the way the forearm points, for the fist on the end of it. `far` is the arm behind his body.
export const JUG_ARM = { upper: 14.4, fore: 14.4 };
export function drawJugArm(g, sx, sy, wx, wy, far) {
  const dx = wx - sx;
  const dy = wy - sy;
  const d = Math.hypot(dx, dy) || 0.01;
  const stretch = Math.max(1, d / (JUG_ARM.upper + JUG_ARM.fore - 0.3)); // a punch stretches a little, as cartoons do
  const l1 = JUG_ARM.upper * stretch;
  const l2 = JUG_ARM.fore * stretch;
  const reach = Math.max(Math.abs(l1 - l2) + 0.5, d);
  const bend = Math.acos(Math.max(-1, Math.min(1, (l1 * l1 + reach * reach - l2 * l2) / (2 * l1 * reach))));
  const base = Math.atan2(dy, dx);
  const e1 = [sx + Math.cos(base + bend) * l1, sy + Math.sin(base + bend) * l1];
  const e2 = [sx + Math.cos(base - bend) * l1, sy + Math.sin(base - bend) * l1];
  const [ex, ey] = e1[0] < e2[0] ? e1 : e2; // whichever elbow sticks out backwards
  const gr = g.createLinearGradient(sx, sy, wx, wy);
  gr.addColorStop(0, far ? '#6f618f' : BOT.mid);
  gr.addColorStop(1, far ? '#7d6f9f' : BOT.lite);
  jugLimbShape(g, [
    [sx, sy, far ? 8.6 : 10, ex, ey, 7],
    [ex, ey, 7.2, wx, wy, 8],
  ], gr);
  return { fore: Math.atan2(wy - ey, wx - ex), upper: Math.atan2(ey - sy, ex - sx) };
}

// the great spiked armour over a shoulder, with the shoulder joint at the origin
function drawJugShoulder(g) {
  g.lineJoin = 'round';
  jugSpikeSmall(g, -7, -7, -16, -20, 4.4);
  jugSpikeSmall(g, -11, 0, -26, -4, 4.4);
  jugSpikeSmall(g, 2, -9, 1, -22, 3.8);
  botPart(g, JUGC.band, 2.1, () => {
    g.moveTo(-14, 6);
    g.bezierCurveTo(-17, -16, 16, -17, 13.5, 5);
    g.quadraticCurveTo(0, 11, -14, 6);
  });
  g.fillStyle = 'rgba(206, 234, 224, 0.5)';
  g.beginPath();
  g.ellipse(-5.5, -7, 5.4, 2.3, -0.45, 0, TAU);
  g.fill();
}

// a short back leg: a round thigh, a bent shin and a flat foot reaching forward; (ax, ay) is the ankle
export function drawJugLeg(g, hx, hy, ax, ay, far) {
  const kx = (hx + ax) / 2 + 4.5;
  const ky = (hy + ay) / 2 + 2;
  const fill = far ? '#6f618f' : BOT.mid;
  jugLimbShape(g, [
    [hx, hy, far ? 9 : 11, kx, ky, 6.6],
    [kx, ky, 6.4, ax, ay, 5.6],
  ], fill);
  jugLimbShape(g, [[ax, ay + 0.6, 5.2, ax + 12, ay + 3.4, 3.8]], far ? '#3d4766' : '#4a5478');
}

// Origin: the middle of the fist. A big blunt armoured gauntlet with a teal cuff; knuckles toward +x.
function drawJugFist(g) {
  g.lineJoin = 'round';
  botPoly(g, JUGC.band, [[-13, -6.5], [-6, -8], [-6, 8], [-13, 6.5]], 1.7);
  const gr = g.createLinearGradient(0, -11, 0, 11);
  gr.addColorStop(0, BOT.lite);
  gr.addColorStop(1, BOT.dark);
  botPart(g, gr, 2, () => g.roundRect(-8, -10.5, 19, 21, 7.5));
  // three knuckle plates
  for (const y of [-6.4, 0, 6.4]) botPart(g, BOT.mid, 1.3, () => g.roundRect(7, y - 3, 7, 6, 2.6));
  g.fillStyle = 'rgba(232, 224, 255, 0.5)';
  g.beginPath();
  g.ellipse(-0.5, -6.4, 5.2, 2.2, -0.15, 0, TAU);
  g.fill();
}

// ---------------------------------------------------------------- MechaZord
// A mechanical dinosaur in Robo Trooper's colours, drawn the way the other robots are: bold outlines, a few chunky shapes and
// one big lens eye. He stands upright on two armoured legs with clawed feet, a long segmented tail trailing behind and
// two rows of blades down his back. Drawn in art units, facing +x, with the ground about 27 below the origin.
// lilac armour, deep teal-grey panels, bright teal trim (his eye and lights), pale blue steel and navy feet
const ZC = { lite: '#cfc4e6', light: '#b9add2', mid: '#9b8db6', dim: '#746796', dark: BOT.teal, deep: BOT.tealDark, trim: '#1fbc9c', trimDark: '#0d6f60', trimLite: '#9ffbe4', steel: '#d3d8e3', pod: BOT.pod, claw: BOT.pod, clawDark: BOT.podDark, foot: '#4a5478', footDark: '#353e60' };

const zordSteel = (g, y0, y1, a = ZC.lite, b = ZC.mid) => {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  return gr;
};

function zordLine(g, pts, col, w) {
  g.strokeStyle = col;
  g.lineWidth = w;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
}

// a round red light in a steel ring
function zordLamp(g, x, y, r) {
  botBall(g, ZC.lite, x, y, r, 1.6);
  botBall(g, ZC.trim, x, y, r * 0.56, 1);
}

// one armoured block with softened corners
function zordBlock(g, fill, pts, r = 4, lw = 2.2) {
  botPart(g, fill, lw, () => {
    const n = pts.length;
    for (let i = 0; i < n; i++) {
      const [x, y] = pts[i];
      const [px, py] = pts[(i + n - 1) % n];
      const [nx, ny] = pts[(i + 1) % n];
      const a = Math.min(r, Math.hypot(px - x, py - y) / 2);
      const b = Math.min(r, Math.hypot(nx - x, ny - y) / 2);
      const da = Math.hypot(px - x, py - y) || 1;
      const db = Math.hypot(nx - x, ny - y) || 1;
      const sx = x + ((px - x) / da) * a;
      const sy = y + ((py - y) / da) * a;
      if (i) g.lineTo(sx, sy);
      else g.moveTo(sx, sy);
      g.quadraticCurveTo(x, y, x + ((nx - x) / db) * b, y + ((ny - y) / db) * b);
    }
  });
}

function zordClaw(g, x, y, far) {
  botPart(g, far ? ZC.clawDark : ZC.claw, 1.8, () => {
    g.moveTo(x - 6, y - 5);
    g.quadraticCurveTo(x + 7, y - 5, x + 9, y + 3);
    g.lineTo(x - 5, y + 3.4);
  });
}

// A leg below the hip; origin at the hip joint.
function drawZordLeg(g, far) {
  const dx = far ? -2 : 0;
  const drop = far ? -8 : 0;
  const steel = far ? zordSteel(g, 6, 40, ZC.dim, ZC.dark) : zordSteel(g, 6, 40);
  // thigh strut up into the haunch
  zordBlock(g, far ? ZC.deep : ZC.dark, [[dx - 8, -4], [dx + 14, -2], [dx + 20, 18 + drop], [dx - 2, 20 + drop]], 6);
  // a blade off the knee, then the great knee and shin armour
  botPoly(g, far ? BOT.podDark : ZC.steel, [[dx + 19, 10 + drop], [dx + 39, 1 + drop], [dx + 27, 20 + drop]], 1.9);
  zordBlock(g, steel, [[dx - 8, 12 + drop], [dx + 17, 6 + drop], [dx + 28, 16 + drop], [dx + 24, 36 + drop], [dx - 6, 37 + drop], [dx - 11, 24 + drop]], 8);
  zordLine(g, [[dx - 8, 25 + drop], [dx + 6, 22 + drop], [dx + 25, 25 + drop]], far ? ZC.deep : ZC.dark, 1.8);
  zordBlock(g, far ? ZC.dark : ZC.mid, [[dx - 2, 9 + drop], [dx + 15, 6 + drop], [dx + 16, 14 + drop], [dx, 16 + drop]], 3, 1.6);
  // the foot
  zordBlock(g, far ? ZC.footDark : ZC.foot, [[dx - 10, 38 + drop], [dx + 24, 36 + drop], [dx + 34, 45 + drop], [dx + 31, 51 + drop], [dx - 11, 52 + drop]], 6);
  zordLine(g, [[dx - 8, 42 + drop], [dx + 24, 41 + drop]], ZC.trim, far ? 2 : 2.6);
  for (const x of [dx + 8, dx + 20, dx + 31]) zordClaw(g, x, 49 + drop, far);
}

// the big round hip armour on the near side, with its red ring
function drawZordHaunch(g) {
  botBall(g, zordSteel(g, -50, -2), -12, -26, 23.5, 2.4);
  g.strokeStyle = 'rgba(40, 34, 58, 0.6)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(-12, -26, 17.5, -2.5, 0.6);
  g.stroke();
  botBall(g, ZC.trim, -12, -26, 11, 2);
  botBall(g, ZC.deep, -12, -26, 7, 1.3);
  botBall(g, ZC.trim, -12, -26, 3.4, 1);
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  g.beginPath();
  g.ellipse(-23, -41, 7, 3, -0.65, 0, TAU);
  g.fill();
}

export const ZORD_CORE = { x: 37, y: -61 };

// trunk and neck
function drawZordBody(g) {
  g.lineJoin = 'round';
  const trunk = () => {
    g.moveTo(10, -106);
    g.bezierCurveTo(18, -108, 28, -105, 34, -100);
    g.lineTo(37, -86);
    g.bezierCurveTo(55, -78, 57, -52, 44, -36);
    g.bezierCurveTo(40, -16, 22, -3, 2, -5);
    g.lineTo(-22, -6);
    g.bezierCurveTo(-45, -13, -46, -40, -31, -55);
    g.bezierCurveTo(-18, -73, -10, -98, 10, -106);
  };
  botPart(g, zordSteel(g, -106, -4), 0, trunk);
  g.save();
  g.beginPath();
  trunk();
  g.closePath();
  g.clip();
  // the darker segmented belly
  botPart(g, ZC.dark, 1.8, () => {
    g.moveTo(36, -52);
    g.bezierCurveTo(24, -40, 16, -20, 16, 4);
    g.lineTo(62, 4);
    g.lineTo(62, -52);
  });
  for (const y of [-40, -29, -18, -8]) zordLine(g, [[17, y + 4], [60, y - 3]], ZC.deep, 2);
  for (const [x, y] of [[33, -36], [28, -24], [22, -13]]) zordLine(g, [[x - 9, y - 4], [x, y + 2], [x + 12, y - 7]], ZC.trim, 3.4);
  // the chest plate
  zordBlock(g, ZC.deep, [[20, -82], [45, -74], [52, -56], [36, -43], [18, -58]], 5, 2);
  zordLine(g, [[22, -62], [28, -50], [38, -45]], ZC.trim, 3);
  zordBlock(g, ZC.mid, [[27, -80], [43, -76], [37, -71]], 2, 1.4);
  // the socket of the core in his chest (its light is painted live)
  botBall(g, ZC.steel, ZORD_CORE.x, ZORD_CORE.y, 8.4, 2);
  botBall(g, ZC.trimDark, ZORD_CORE.x, ZORD_CORE.y, 5.6, 1.3);
  botBall(g, ZC.trim, ZORD_CORE.x, ZORD_CORE.y, 3, 0);
  // rings of the neck, with a red stripe and its lights along them
  for (const [ax, ay, bx, by] of [[3, -95, 24, -82], [11, -103, 34, -90]]) zordLine(g, [[ax, ay], [bx, by]], ZC.dark, 2.2);
  zordLine(g, [[-6, -84], [8, -93], [21, -97], [36, -93]], ZC.trim, 3);
  // seams down his back
  zordLine(g, [[-8, -80], [2, -62], [-4, -48]], 'rgba(40, 34, 58, 0.65)', 1.8);
  zordLine(g, [[-26, -56], [-8, -48], [8, -50]], 'rgba(40, 34, 58, 0.65)', 1.8);
  g.fillStyle = 'rgba(255, 255, 255, 0.4)';
  g.beginPath();
  g.ellipse(-16, -66, 5, 11, 0.6, 0, TAU);
  g.fill();
  g.restore();
  g.strokeStyle = OUT;
  g.lineWidth = 2.4;
  g.beginPath();
  trunk();
  g.closePath();
  g.stroke();
  zordLamp(g, 6, -94, 3.6);
  zordLamp(g, 22, -99, 3.2);
}

// the shoulder armour, drawn over the top of the near arm
function drawZordPauldron(g) {
  zordBlock(g, zordSteel(g, -92, -62), [[-6, -80], [4, -90], [22, -88], [29, -76], [24, -63], [0, -61], [-7, -69]], 8, 2.4);
  zordBlock(g, ZC.mid, [[-2, -92], [14, -96], [22, -86], [4, -85]], 3, 2);
  zordLine(g, [[2, -75], [18, -73]], ZC.trim, 4);
  zordLine(g, [[-3, -67], [21, -67]], ZC.dark, 1.8);
  g.fillStyle = 'rgba(255, 255, 255, 0.5)';
  g.beginPath();
  g.ellipse(2, -82, 5, 2.4, -0.55, 0, TAU);
  g.fill();
}

// An arm with a heavy clawed hand; origin at the shoulder.
function drawZordArm(g, far) {
  const steel = far ? zordSteel(g, -6, 24, ZC.dim, ZC.dark) : zordSteel(g, -6, 24);
  botPoly(g, far ? BOT.podDark : ZC.steel, [[11, 17], [-8, 28], [4, 8]], 1.9);
  zordBlock(g, far ? ZC.deep : ZC.dark, [[-7, -2], [7, -5], [19, 13], [8, 21]], 6);
  zordBlock(g, steel, [[5, 9], [22, 0], [31, 14], [14, 24]], 6);
  zordLine(g, [[12, 12], [24, 6]], ZC.trim, 2.8);
  // the hand: a block with three thick talons
  for (const [x, y] of [[40, 1], [42, 8], [39, 15]]) {
    botPart(g, far ? ZC.dim : ZC.mid, 1.8, () => {
      g.moveTo(x - 7, y - 3.4);
      g.quadraticCurveTo(x + 6, y - 4, x + 9, y + 4);
      g.quadraticCurveTo(x, y + 2, x - 7, y + 3.4);
    });
  }
  zordBlock(g, steel, [[21, -2], [34, -4], [37, 16], [25, 20]], 5);
}

// the head: a flat armoured snout with two swept-back fins, drawn without its lower jaw
function drawZordHead(g) {
  g.lineJoin = 'round';
  // fins and nose horn
  for (const [a, b, c] of [[[27, -118], [8, -137], [36, -123]], [[41, -123], [30, -143], [50, -122]]]) {
    botPoly(g, ZC.pod, [a, b, c], 2);
    botPoly(g, ZC.trim, [[(a[0] + b[0]) / 2 + 1, (a[1] + b[1]) / 2 + 1], b, [(c[0] + b[0]) / 2 - 1, (c[1] + b[1]) / 2 + 1]], 1.3);
  }
  botPoly(g, ZC.pod, [[62, -116], [68, -127], [71, -112]], 1.8);
  botPoly(g, ZC.steel, [[26, -108], [3, -112], [25, -100]], 1.8);
  botPoly(g, ZC.steel, [[27, -100], [9, -95], [29, -95]], 1.6);
  // the dark inside of the mouth, seen when the jaw drops
  botPoly(g, '#241c33', [[36, -101], [70, -101], [61, -90], [40, -90]], 1.8);
  zordBlock(g, zordSteel(g, -124, -98), [[19, -110], [26, -121], [43, -124], [58, -118], [77, -109], [76, -101], [44, -99], [30, -94], [20, -100]], 5, 2.4);
  zordBlock(g, ZC.dark, [[22, -109], [38, -107], [37, -99], [28, -95], [22, -101]], 3, 1.6);
  zordLine(g, [[33, -119], [46, -118], [62, -112]], ZC.trim, 3.2);
  // upper teeth
  for (const x of [50, 57, 64, 71]) botPoly(g, '#f4f6fb', [[x - 2.8, -100.6], [x + 2.8, -100.8], [x + 0.4, -95]], 1.2);
  botBall(g, ZC.deep, 72, -106, 1.7, 0);
  zordLamp(g, 29, -102, 3);
}

// the lower jaw, hinged at ZORD_JAW
export const ZORD_JAW = [38, -99];
function drawZordJaw(g) {
  for (const x of [53, 60, 66]) botPoly(g, '#f4f6fb', [[x - 2.6, -97.4], [x + 2.6, -97.6], [x + 0.6, -102.6]], 1.2);
  zordBlock(g, zordSteel(g, -99, -88, ZC.light, ZC.dim), [[35, -99], [72, -99], [67, -92], [51, -88], [38, -91]], 4, 2.2);
  zordLine(g, [[44, -93.5], [60, -94]], ZC.trim, 2.2);
}

export const ZORD_EYE = { x: 47, y: -110, r: 6.8 };
// The eye, Robo Trooper's own teal lens. o: { lx, ly, lid, angry, power, dead }
export function zordEye(g, o) {
  const { x, y, r } = ZORD_EYE;
  const power = o.power === undefined ? 1 : o.power;
  botBall(g, '#7d749f', x, y, r, 1.8);
  botBall(g, '#242838', x, y, r * 0.74, 0.8);
  if (o.dead) {
    zordLine(g, [[x - r * 0.38, y - r * 0.38], [x + r * 0.38, y + r * 0.38]], ZC.trimLite, 1.5);
    zordLine(g, [[x + r * 0.38, y - r * 0.38], [x - r * 0.38, y + r * 0.38]], ZC.trimLite, 1.5);
    return;
  }
  if (power > 0.02) {
    g.globalAlpha = power;
    const gr = g.createRadialGradient(x - r * 0.2, y - r * 0.2, 0.3, x, y, r * 0.7);
    gr.addColorStop(0, '#9ffbe4');
    gr.addColorStop(0.6, '#1fbc9c');
    gr.addColorStop(1, '#0d6f60');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, y, r * 0.64, 0, TAU);
    g.fill();
    g.fillStyle = '#10141c';
    g.beginPath();
    g.arc(x + (o.lx || 0) * r * 0.22, y + (o.ly || 0) * r * 0.2, r * 0.25, 0, TAU);
    g.fill();
    g.fillStyle = '#ffffff';
    g.beginPath();
    g.arc(x - r * 0.18, y - r * 0.22, r * 0.14, 0, TAU);
    g.fill();
    g.globalAlpha = 1;
  }
  const lid = Math.max(o.lid || 0, o.angry ? 0.3 : 0);
  if (lid > 0.02) {
    g.save();
    g.beginPath();
    g.arc(x, y, r * 0.82, 0, TAU);
    g.clip();
    g.translate(x, y);
    if (o.angry) g.rotate(0.3);
    g.fillStyle = ZC.mid;
    g.fillRect(-r, -r, r * 2, r * 2 * lid);
    zordLine(g, [[-r, -r + r * 2 * lid], [r, -r + r * 2 * lid]], OUT, 1.6);
    g.restore();
  }
}

// ---- the parts that move on their own, painted live

// The tail's joints, root first: [x, y, half thickness].
export const ZORD_TAIL = [[-24, -26, 22], [-54, -6, 17.5], [-80, 8, 13.5], [-105, 14, 10], [-129, 12, 7], [-152, 1, 2.6]];

// `pts` are ZORD_TAIL's joints, wherever they have swung to this frame
export function drawZordTail(g, pts) {
  const normal = (i) => {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(pts.length - 1, i + 1)];
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
    // across the tail, pointing down toward its underside
    let nx = -(b[1] - a[1]) / d;
    let ny = (b[0] - a[0]) / d;
    if (ny < 0) {
      nx = -nx;
      ny = -ny;
    }
    return [nx, ny];
  };
  const at = (i, k) => {
    const [nx, ny] = normal(i);
    return [pts[i][0] + nx * pts[i][2] * k, pts[i][1] + ny * pts[i][2] * k];
  };
  // from the tip forward, so each segment overlaps the one behind it
  for (let i = pts.length - 2; i >= 0; i--) {
    botPoly(g, i % 2 ? ZC.mid : ZC.light, [at(i, -1), at(i + 1, -1), at(i + 1, 1), at(i, 1)], 2.4);
    botPoly(g, ZC.dark, [at(i, 0.3), at(i + 1, 0.3), at(i + 1, 1), at(i, 1)], 1.8);
    const m0 = at(i, 0.36);
    const m1 = at(i + 1, 0.36);
    const n0 = at(i, 0.8);
    const n1 = at(i + 1, 0.8);
    zordLine(g, [m0, [(n0[0] + n1[0]) / 2, (n0[1] + n1[1]) / 2], m1], ZC.trim, Math.max(1.6, pts[i][2] * 0.17));
  }
  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y] = at(i, -0.22);
    zordLamp(g, x, y, Math.max(2.2, pts[i][2] * 0.27));
  }
}

// one blade of his back: from (x, y), pointing along `ang`; `glow` 0..1 lights its red core
export function drawZordSpine(g, x, y, ang, len, glow, far) {
  const w = Math.max(6, len * 0.46);
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  botPoly(g, far ? BOT.podDark : ZC.steel, [[-5, -w * 0.55], [len * 0.92, -w * 0.3], [len, w * 0.06], [len * 0.7, w * 0.36], [-5, w * 0.55]], 2.1);
  const core = glow > 0.5 ? '#7dffe0' : far ? ZC.trimDark : ZC.trim;
  botPoly(g, core, [[-1, -w * 0.12], [len * 0.8, -w * 0.08], [len * 0.62, w * 0.2], [-1, w * 0.28]], 1.2);
  if (glow > 0.5) botPoly(g, '#eafffa', [[2, 0], [len * 0.62, 0], [len * 0.5, w * 0.1], [2, w * 0.12]], 0);
  g.restore();
}

// ---------------------------------------------------------------- Jet Trooper
// The one in between: the same egg and eye, a finned helmet, a twin-tank jetpack and a rocket launcher.
function drawJetPack(g) {
  g.lineJoin = 'round';
  // little swept wings
  botPoly(g, BOT.teal, [[-20, -10], [-38, -20], [-36, -10], [-22, 1]], 1.6);
  for (const [x, y] of [[-29, -10], [-21, -13]]) {
    const gr = g.createLinearGradient(x, 0, x + 9, 0);
    gr.addColorStop(0, '#dcedf3');
    gr.addColorStop(1, BOT.podDark);
    botPart(g, gr, 1.7, () => g.roundRect(x, y, 9, 24, 4.5));
    botPoly(g, BOT.noz, [[x + 1.6, y + 24], [x + 7.4, y + 24], [x + 9, y + 31], [x, y + 31]], 1.5);
    g.fillStyle = BOT.hole;
    g.beginPath();
    g.ellipse(x + 4.5, y + 31, 3.6, 1.4, 0, 0, TAU);
    g.fill();
    g.strokeStyle = 'rgba(52, 82, 98, 0.75)';
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(x + 0.6, y + 8);
    g.lineTo(x + 8.4, y + 8);
    g.stroke();
  }
}

function drawJetCrest(g) {
  botPoly(g, BOT.teal, [[-4, -27], [-17, -37], [-3, -36], [10, -27.6]], 1.6);
}

function drawJetBody(g) {
  drawJetCrest(g);
  drawTrooperBody(g);
  // the harness strap that holds the pack on
  for (const [col, w] of [[OUT, 5], [BOT.teal, 3]]) {
    g.strokeStyle = col;
    g.lineWidth = w;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-18, 3);
    g.quadraticCurveTo(-4, 14, 6, 21);
    g.stroke();
  }
}

// Origin: the grip. A stubby rocket launcher.
function drawJetLauncher(g, loaded) {
  g.lineJoin = 'round';
  if (loaded) {
    // the next rocket's nose peeking out once he has reloaded
    botPoly(g, '#e0523c', [[31, -5], [38, -3.6], [42, -0.6], [38, 2.4], [31, 3.8]], 1.4);
  }
  botPoly(g, BOT.gunDark, [[-14, -6.5], [-8, -5], [-8, 4], [-14, 5.5]], 1.5);
  botPoly(g, BOT.gun, [[-9, -5.6], [29, -5.6], [29, 4.4], [-9, 4.4]], 1.7);
  botPoly(g, BOT.gunDark, [[27, -7], [33, -7], [33, 5.8], [27, 5.8]], 1.6);
  botPoly(g, BOT.teal, [[2, -5.6], [8, -5.6], [8, 4.4], [2, 4.4]], 1.1);
  botPoly(g, BOT.gunDark, [[8, 4.4], [13, 4.4], [11, 10], [7, 10]], 1.3);
  g.fillStyle = 'rgba(255, 255, 255, 0.4)';
  g.fillRect(-6, -4.4, 30, 1.2);
  botBall(g, BOT.lite, 1, 5, 4.4, 1.5);
}

// ---------------------------------------------------------------- build
export function feetSet(color) {
  return FEET_POSES.map((pose) => makeLayer(-30, 16, 32, 38, (g) => drawFeet(g, pose, true, color)));
}

export function eggSet(drawBody, gazes = GAZE3, extra = {}) {
  return {
    torso: makeLayer(-40, -38, 36, 26, (g) => drawBody(g, false, gazes[0], false)),
    torsoAngry: makeLayer(-40, -38, 36, 26, (g) => drawBody(g, false, gazes[0], true)),
    // standing around they face the same way as when fighting, eyes wandering
    torsoSide: gazes.map((gz) => makeLayer(-40, -38, 36, 26, (g) => drawBody(g, false, gz, false))),
    ...extra,
  };
}

export function buildUnitArt() {
  const dark = feetSet('#25232e');
  const art = {};

  art.flamethrower = {
    feet: dark,
    ...eggSet(drawMiniBody),
    gun: makeLayer(-20, -14, 66, 16, (g) => drawMinigun(g, false)),
    gunFire: makeLayer(-20, -14, 66, 16, (g) => drawMinigun(g, true)),
  };

  art.trooper = {
    feet: feetSet('#4a5478'),
    pack: makeLayer(-40, -26, -8, 22, drawTrooperPack),
    torso: makeLayer(-40, -38, 36, 26, drawTrooperBody),
    gun: makeLayer(-18, -14, 44, 14, drawTrooperGun),
    ghost: makeLayer(-26, -30, 26, 26, (g) => ghostBody(g)),
  };

  art.jettrooper = {
    feet: art.trooper.feet,
    pack: makeLayer(-42, -24, -8, 24, drawJetPack),
    torso: makeLayer(-40, -42, 36, 26, drawJetBody),
    gun: makeLayer(-18, -12, 46, 14, (g) => drawJetLauncher(g, false)),
    gunLoaded: makeLayer(-18, -12, 46, 14, (g) => drawJetLauncher(g, true)),
    ghost: makeLayer(-26, -30, 26, 26, (g) => ghostBody(g)),
  };

  art.juggernaut = {
    pack: art.trooper.pack,
    torso: makeLayer(-52, -56, 26, 14, drawJugBody),
    head: makeLayer(0, -50, 46, 2, drawJugHead),
    brow: makeLayer(0, -36, 46, -18, drawJugBrow),
    shoulder: makeLayer(-30, -26, 18, 14, drawJugShoulder),
    fist: makeLayer(-18, -15, 18, 15, drawJugFist),
    ghost: makeLayer(-26, -30, 26, 26, (g) => ghostBody(g)),
  };

  art.mechazord = {
    farLeg: makeLayer(-18, -12, 44, 52, (g) => drawZordLeg(g, true)),
    nearLeg: makeLayer(-18, -12, 48, 60, (g) => drawZordLeg(g, false)),
    farArm: makeLayer(-12, -10, 56, 32, (g) => drawZordArm(g, true)),
    nearArm: makeLayer(-12, -10, 56, 32, (g) => drawZordArm(g, false)),
    body: makeLayer(-50, -114, 62, 2, drawZordBody),
    haunch: makeLayer(-40, -54, 16, 2, drawZordHaunch),
    pauldron: makeLayer(-12, -100, 34, -56, drawZordPauldron),
    head: makeLayer(-2, -148, 82, -86, drawZordHead),
    jaw: makeLayer(30, -108, 78, -82, drawZordJaw),
    ghost: makeLayer(-26, -30, 26, 26, (g) => ghostBody(g)),
  };

  art.roman = {
    feet: feetSet('#85501f'),
    // the Romans' pupils drift up and to the sides, the first (used for the icon) looks down-left
    ...eggSet(drawRomanBody, [[-1.7, 0.7], [0.6, -1.8], [1.7, -1.3]]),
    spear: makeLayer(-14, -16, 68, 16, drawSpear),
  };

  art.grenadier = {
    feet: dark,
    ...eggSet(drawGrenBody),
    bomb: makeLayer(-10, -18, 14, 10, (g) => drawBomb(g, false)),
    bombLit: makeLayer(-10, -18, 14, 10, (g) => drawBomb(g, true)),
  };

  art.archer = {
    feet: feetSet('#2c2a22'),
    ...eggSet(drawArcherBody),
    bow: makeLayer(-14, -27, 22, 27, (g) => drawBow(g, false)),
    bowDrawn: makeLayer(-14, -27, 22, 27, (g) => drawBow(g, true)),
    arrow: makeLayer(-5, -6, 40, 6, drawArrow),
  };

  art.knight = {
    feet: dark,
    ...eggSet(drawKnightBody),
    lance: makeLayer(-20, -6, 72, 6, drawLance),
  };

  art.ninja = {
    feet: dark,
    ...eggSet(drawNinjaBody),
    katana: makeLayer(-12, -10, 58, 8, drawKatana),
  };

  art.cowboy = {
    feet: [0, 1, 2, 3].map((i) => makeLayer(-30, 16, 32, 38, (g) => drawFeet(g, FEET_POSES[i], true, '#25232e'))),
    torso: makeLayer(-36, -34, 36, 26, (g) => drawCowboyTorso(g, 1, false)),
    torsoSide: [1, 0, -1].map((look) => makeLayer(-36, -34, 36, 26, (g) => drawCowboyTorso(g, look, false))),
    pistol: makeLayer(-12, -14, 42, 15, (g) => drawFlintlock(g, false)),
    pistolFire: makeLayer(-12, -14, 54, 15, (g) => drawFlintlock(g, true)),
  };

  art.cavalry = {
    horse: [0, 1, 2, 3, 4].map((gait) => makeLayer(-50, -40, 56, 32, (g) => {
      g.translate(0, 2.1);
      g.scale(0.92, 0.92);
      drawHorse(g, gait);
    })),
    rider: makeLayer(-14, -18, 14, 14, drawRider),
    lance: makeLayer(-20, -6, 72, 6, drawLance),
    shadow: makeLayer(-46, 18, 50, 36, (g) => {
      g.save();
      g.translate(2, 27);
      g.scale(0.92, 0.17);
      const gr = g.createRadialGradient(0, 0, 4, 0, 0, 46);
      gr.addColorStop(0, 'rgba(0, 0, 0, 0.42)');
      gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
      g.fillStyle = gr;
      g.beginPath();
      g.arc(0, 0, 46, 0, TAU);
      g.fill();
      g.restore();
    }),
  };

  for (const [id, [tint, edge, head]] of Object.entries(GHOSTS)) {
    art[id].ghost = makeLayer(-26, -30, 26, 26, (g) => ghostBody(g));
  }

  // small shared bits
  art.shared = {
    arrow: art.archer.arrow,
  };
  return art;
}

export function drawDrop(g, species) {
  (DROPS[species] || DROPS.soldier)(g);
}

// icon helpers use K to size things in board px
export { K };
