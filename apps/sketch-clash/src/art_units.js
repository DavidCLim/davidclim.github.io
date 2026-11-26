import { TAU, K } from './config.js?v=201';
import { makeLayer, rr, star, FEET_POSES, drawFeet, OUT, drawSniperBody, drawSniperEyes, drawSniperHat, neckScarf } from './sprites.js?v=201';

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
    // his hood plate
    botPoly(g, JUG.mid, [[-13, -2], [-5, -9], [11, -7], [14, 1], [7, 6], [-6, 4]], 1.6);
    botPoly(g, JUG.pale, [[-3, -5], [7, -4], [1, 1]], 1);
  },
  jugpipe(g) {
    botPoly(g, JUG.pale, [[-4, -10], [5, -10], [5, 9], [-4, 9]], 1.5);
    botBall(g, JUG.black, 0.5, -10, 3.4, 1.2);
  },
  jugspike(g) {
    botPoly(g, JUG.steel, [[-6, 6], [0, -9], [6, 6]], 1.5);
  },
  jugshell(g) {
    botPoly(g, JUG.lite, [[-15, -3], [-4, -11], [13, -6], [15, 6], [-2, 11], [-13, 6]], 1.8);
    botBall(g, JUG.steel, -6, 0, 2, 0.9);
    botBall(g, JUG.steel, 7, 1, 2, 0.9);
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
  g.stroke();
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
// A hulking hunched war machine with a great axe and a spiked claw, in Robo Trooper's colours. Drawn part by part
// from the shapes of a reference photo (in its 960px coordinates), mirrored so the axe leads when he faces right,
// and shaded like a painted model: bevelled plates, shadows where they overlap, rivets and chipped paint.
export const JS = 0.168; // reference px to art units
export const JUG_AXE_PIVOT = [27.7, -38.4];
export const JUG_CLAW_PIVOT = [-46.2, -40];
export const JUG_EYE = [3.7, -35.4];
const JUG = { glint: '#ded4f2', lite: '#b8abd3', mid: '#9385b1', dark: '#6b5d8f', deep: '#443869', teal: '#5f7a74', tealDark: '#33463f', steel: '#d3d8e3', iron: '#8b93a8', ironDark: '#4b5166', black: '#1f212c', pale: '#b4ced8', line: '#1a1722' };

// a layer drawn at three and a half times the usual resolution, so all the parts stay crisp
function jugLayer(minX, minY, maxX, maxY, draw) {
  const res = 3.5;
  const l = makeLayer(minX * res, minY * res, maxX * res, maxY * res, (g) => {
    g.scale(res, res);
    g.scale(-JS, JS);
    g.translate(-500, -795 + 28 / JS);
    g.lineJoin = 'round';
    g.lineCap = 'round';
    draw(g);
  });
  return { canvas: l.canvas, x: l.x / res, y: l.y / res, w: l.w / res, h: l.h / res };
}

function jPath(g, pts) {
  g.beginPath();
  pts.forEach((p, i) => {
    if (i === 0) g.moveTo(p[0], p[1]);
    else if (p.length === 4) g.quadraticCurveTo(p[2], p[3], p[0], p[1]); // [x, y, cx, cy]
    else g.lineTo(p[0], p[1]);
  });
  g.closePath();
}

function jPoly(g, fill, pts, lw = 8) {
  jPath(g, pts);
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  g.strokeStyle = JUG.line;
  g.lineWidth = lw;
  g.stroke();
}

function jShade(g, x0, y0, x1, y1, a = JUG.lite, b = JUG.dark, m) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, a);
  if (m) gr.addColorStop(0.5, m);
  gr.addColorStop(1, b);
  return gr;
}

// brushed metal: bright and dark bands
function jMetal(g, x0, y0, x1, y1) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  [[0, '#f4f6fa'], [0.22, '#a9b1c4'], [0.48, '#dfe3ec'], [0.7, '#737a91'], [1, '#42475c']].forEach(([o, c]) => gr.addColorStop(o, c));
  return gr;
}

// a bevelled armour plate: a soft shadow cast beneath it, light caught on its upper edges and shade along the lower
function jArmor(g, fill, pts, o = {}) {
  const lw = o.lw === undefined ? 8 : o.lw;
  const bevel = o.bevel === undefined ? 11 : o.bevel;
  g.save();
  if (o.cast !== false) {
    g.shadowColor = 'rgba(18, 10, 36, 0.6)';
    g.shadowBlur = 7;
    g.shadowOffsetY = 4;
  }
  jPath(g, pts);
  g.fillStyle = fill;
  g.fill();
  g.restore();
  g.save();
  jPath(g, pts);
  g.clip();
  const edge = (dx, dy, col, w) => {
    g.save();
    g.translate(dx, dy);
    jPath(g, pts);
    g.strokeStyle = col;
    g.lineWidth = w;
    g.stroke();
    g.restore();
  };
  edge(bevel * 0.7, bevel, 'rgba(236, 228, 255, 0.55)', bevel);
  edge(-bevel * 0.7, -bevel, 'rgba(30, 18, 58, 0.5)', bevel * 1.5);
  g.restore();
  jPath(g, pts);
  g.strokeStyle = JUG.line;
  g.lineWidth = lw;
  g.stroke();
}

function jBall(g, fill, x, y, r, lw = 6) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  g.strokeStyle = JUG.line;
  g.lineWidth = lw;
  g.stroke();
}

function jLine(g, col, lw, pts) {
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
}

// a panel seam: a dark groove with a thread of light under it
function jSeam(g, pts, w = 5) {
  jLine(g, 'rgba(34, 22, 62, 0.75)', w, pts);
  jLine(g, 'rgba(232, 224, 255, 0.45)', w * 0.45, pts.map(([x, y]) => [x + 2, y + w * 0.75]));
}

function jRivets(g, list, r = 6.5) {
  for (const [x, y] of list) {
    jBall(g, 'rgba(30, 20, 56, 0.55)', x + 1.5, y + 3, r * 1.1, 0);
    const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.4, 0.5, x, y, r);
    gr.addColorStop(0, '#ffffff');
    gr.addColorStop(0.5, '#c2c8d8');
    gr.addColorStop(1, '#666d85');
    jBall(g, gr, x, y, r, 2.6);
  }
}

// chips knocked out of the paint, showing bare steel, and a few scratches
function jWear(g, spots) {
  for (const [x, y, s = 1] of spots) {
    jPoly(g, 'rgba(48, 34, 66, 0.85)', [[x - 7 * s, y], [x - 2 * s, y - 5 * s], [x + 6 * s, y - 2 * s], [x + 3 * s, y + 4 * s], [x - 3 * s, y + 3 * s]], 0);
    jPoly(g, '#cfd4e0', [[x - 4 * s, y - s], [x - s, y - 3 * s], [x + 4 * s, y - s], [x + s, y + 2 * s]], 0);
    jLine(g, 'rgba(230, 232, 244, 0.7)', 1.8, [[x + 6 * s, y + 3 * s], [x + 17 * s, y + 10 * s]]);
    jLine(g, 'rgba(36, 24, 60, 0.35)', 3.5 * s, [[x, y + 6 * s], [x - 2, y + 22 * s]]);
  }
}

// a steel rod or piston between two points, round and shiny, with a collar at each end
function jRod(g, x0, y0, x1, y1, w, dim = false) {
  const a = Math.atan2(y1 - y0, x1 - x0);
  const nx = -Math.sin(a);
  const ny = Math.cos(a);
  jLine(g, JUG.line, w + 9, [[x0, y0], [x1, y1]]);
  const gr = g.createLinearGradient(x0 - nx * w * 0.5, y0 - ny * w * 0.5, x0 + nx * w * 0.5, y0 + ny * w * 0.5);
  (dim ? [[0, '#8d95aa'], [0.35, '#5b6279'], [1, '#2e3244']] : [[0, '#f1f3f8'], [0.4, '#9aa2b8'], [0.62, '#c9cfdc'], [1, '#4d546a']]).forEach(([o, c]) => gr.addColorStop(o, c));
  jLine(g, gr, w, [[x0, y0], [x1, y1]]);
  for (const f of [0.16, 0.84]) {
    const x = x0 + (x1 - x0) * f;
    const y = y0 + (y1 - y0) * f;
    jLine(g, JUG.line, 4, [[x - nx * w * 0.55, y - ny * w * 0.55], [x + nx * w * 0.55, y + ny * w * 0.55]]);
  }
}

// a cone spike: a lit face and a shaded one on a dark collar
function jSpike(g, bx, by, tx, ty, w) {
  const a = Math.atan2(ty - by, tx - bx) + Math.PI / 2;
  const ax = Math.cos(a) * w;
  const ay = Math.sin(a) * w;
  jBall(g, JUG.ironDark, bx, by, w * 0.92, 5);
  jPoly(g, '#e9ecf3', [[bx + ax, by + ay], [tx, ty], [bx, by]], 0);
  jPoly(g, '#737a92', [[bx, by], [tx, ty], [bx - ax, by - ay]], 0);
  jLine(g, JUG.line, 5, [[bx + ax, by + ay], [tx, ty], [bx - ax, by - ay]]);
  jLine(g, '#ffffff', 2.6, [[bx + ax * 0.45, by + ay * 0.45], [tx - (tx - bx) * 0.12, ty - (ty - by) * 0.12]]);
}

// a square pyramid stud seen from above
function jStud(g, x, y, r) {
  const faces = [['#eef0f6', [[x, y - r], [x - r, y]]], ['#b9c0d1', [[x, y - r], [x + r, y]]], ['#8189a0', [[x - r, y], [x, y + r]]], ['#4f566c', [[x + r, y], [x, y + r]]]];
  for (const [c, [p, q]] of faces) jPoly(g, c, [p, q, [x - r * 0.15, y - r * 0.22]], 4);
}

function jBolt(g, x, y, r) {
  jBall(g, 'rgba(22, 12, 40, 0.5)', x + 3, y + 5, r * 1.08, 0);
  jBall(g, jMetal(g, x - r, y - r, x + r, y + r), x, y, r, 6);
  jBall(g, jMetal(g, x + r, y + r, x - r, y - r), x, y, r * 0.66, 4);
  jLine(g, JUG.line, r * 0.2, [[x - r * 0.46, y + r * 0.2], [x + r * 0.46, y - r * 0.2]]);
  jLine(g, 'rgba(255, 255, 255, 0.7)', 3, [[x - r * 0.4, y + r * 0.34], [x + r * 0.5, y - r * 0.08]]);
}

// one hanging armour plate: a dark teal rim round a bevelled face, riveted
function jTasset(g, outer, inner, rivets) {
  jArmor(g, jShade(g, outer[0][0], outer[0][1], outer[0][0] + 40, outer[0][1] + 180, JUG.teal, JUG.tealDark), outer, { bevel: 8 });
  jArmor(g, jShade(g, inner[0][0], inner[0][1], inner[0][0] + 50, inner[0][1] + 150, JUG.mid, JUG.deep), inner, { lw: 5, cast: false });
  jRivets(g, rivets, 6);
}

// a wide round-toed iron boot
function jBoot(g, pts, toeLine, rivets) {
  jArmor(g, jMetal(g, pts[1][0], pts[1][1] - 20, pts[0][0] + 60, pts[0][1] + 40), pts, { bevel: 9 });
  jSeam(g, toeLine, 6);
  jRivets(g, rivets, 6);
}

// the leg on the axe side, and the one on the claw side
function drawJugLegA(g) {
  jRod(g, 462, 530, 408, 636, 38, true);
  jRod(g, 440, 560, 428, 628, 16);
  jArmor(g, jShade(g, 360, 596, 450, 720), [[366, 612], [412, 584, 378, 586], [450, 616, 446, 592], [434, 724], [378, 720], [352, 654, 354, 700]]);
  jSeam(g, [[380, 624], [432, 618], [424, 704]]);
  jRivets(g, [[382, 636], [384, 700], [426, 704]]);
  jWear(g, [[400, 660, 1.2], [420, 690, 0.7]]);
  jBolt(g, 408, 724, 25);
  jBoot(g, [[296, 786], [298, 750], [352, 712, 302, 716], [424, 716], [450, 750, 450, 722], [448, 788], [372, 794]], [[300, 764], [446, 756]], [[326, 746], [358, 732], [394, 728], [428, 740], [322, 776], [358, 780], [420, 776]]);
  jSeam(g, [[368, 764], [370, 790]]);
}

function drawJugLegB(g) {
  jRod(g, 600, 530, 676, 636, 38, true);
  jRod(g, 626, 556, 652, 628, 16);
  jArmor(g, jShade(g, 640, 590, 744, 712), [[650, 600], [696, 578, 668, 576], [732, 612, 728, 586], [740, 706], [668, 718], [644, 652, 646, 700]]);
  jSeam(g, [[668, 612], [714, 604], [722, 696]]);
  jRivets(g, [[666, 624], [716, 622], [724, 694], [674, 700]]);
  jWear(g, [[696, 662, 1.1], [680, 690, 0.7]]);
  jBolt(g, 706, 718, 25);
  jBoot(g, [[648, 790], [650, 752], [706, 712, 656, 716], [778, 726, 756, 710], [804, 768, 806, 740], [796, 794], [722, 798]], [[652, 766], [800, 772]], [[676, 744], [706, 730], [744, 732], [778, 748], [678, 780], [718, 784], [776, 784]]);
  jSeam(g, [[730, 768], [730, 794]]);
}

function drawJugBody(g) {
  // ---- the four perforated stacks on his back
  for (const [x, y, w] of [[704, 94, 28], [678, 76, 36], [636, 52, 46], [590, 58, 46]]) {
    jArmor(g, jShade(g, x, y, x + w, y, '#e2f0f5', '#4f6a7a', '#a3bfca'), [[x, y], [x + w, y], [x + w, y + 104], [x, y + 104]], { bevel: 5, lw: 7 });
    for (let j = 0; j < 4; j++) for (let i = 0; i < 2; i++) {
      const hx = x + w * (0.3 + i * 0.4);
      const hy = y + 28 + j * 19 + i * 8;
      jBall(g, JUG.black, hx, hy, 5.6, 0);
      jBall(g, 'rgba(255, 255, 255, 0.55)', hx + 1, hy + 5, 2, 0);
    }
    for (const yy of [y + 14, y + 92]) jLine(g, JUG.line, 7, [[x, yy], [x + w, yy]]);
    g.beginPath();
    g.ellipse(x + w / 2, y, w / 2 + 2, 13, 0, 0, TAU);
    g.fillStyle = '#9db6c2';
    g.fill();
    g.strokeStyle = JUG.line;
    g.lineWidth = 7;
    g.stroke();
    g.beginPath();
    g.ellipse(x + w / 2, y + 1, w / 2 - 8, 7, 0, 0, TAU);
    g.fillStyle = '#0e1016';
    g.fill();
  }
  // ---- the dark underside of the hull, then the waist machinery hanging from it
  jPoly(g, JUG.black, [[420, 360], [760, 360], [724, 456], [626, 500], [498, 500], [428, 440]], 6);
  jRod(g, 524, 440, 530, 632, 30, true);
  jRod(g, 578, 440, 568, 612, 40);
  jRod(g, 614, 452, 604, 590, 20, true);
  jRod(g, 474, 462, 436, 560, 28);
  jRod(g, 636, 462, 680, 552, 28);
  jRod(g, 490, 546, 624, 568, 28);
  jRod(g, 506, 596, 606, 604, 20, true);
  for (const [x, y, r] of [[576, 504, 25], [532, 582, 20], [496, 548, 16], [622, 566, 16]]) jBolt(g, x, y, r);
  jArmor(g, jShade(g, 508, 444, 616, 496, JUG.iron, JUG.black), [[506, 444], [618, 444], [604, 488], [522, 488]]);
  for (const x of [530, 548, 566, 584, 600]) jLine(g, JUG.black, 7, [[x, 456], [x - 2, 480]]);
  // ---- the great humped hull behind everything else
  jArmor(g, jShade(g, 420, 120, 760, 470), [[366, 300], [402, 206, 372, 236], [480, 142, 430, 160], [566, 116], [690, 124], [748, 186, 736, 150], [796, 254, 790, 206], [798, 336], [758, 436, 792, 404], [664, 472], [482, 470], [388, 418, 418, 462]], { cast: false, bevel: 15 });
  // the rounded cheeks of the shell either side of the hood
  jArmor(g, jShade(g, 390, 180, 500, 320, JUG.glint, JUG.dark, JUG.mid), [[390, 296], [398, 222, 380, 248], [474, 180, 424, 184], [486, 216], [458, 268, 476, 246], [412, 302]]);
  jRivets(g, [[406, 262], [420, 226], [454, 202]]);
  jArmor(g, jShade(g, 660, 180, 800, 340, JUG.lite, JUG.deep, JUG.mid), [[660, 206], [746, 188, 716, 178], [800, 262, 794, 212], [790, 322], [716, 362, 760, 356], [652, 298], [668, 252]]);
  jSeam(g, [[676, 222], [740, 214], [776, 266], [772, 308]]);
  jRivets(g, [[692, 226], [736, 204], [776, 244], [786, 296]]);
  jWear(g, [[742, 252, 1.3], [690, 300, 0.9]]);
  // ---- the hood: a front face with a slot, and the lid above it carrying a plain chevron
  jArmor(g, jShade(g, 480, 190, 650, 290, JUG.mid, JUG.deep), [[470, 190], [574, 214], [662, 226], [648, 292], [572, 270], [474, 222]]);
  jArmor(g, jShade(g, 500, 100, 690, 230, JUG.glint, JUG.mid, JUG.lite), [[470, 190], [514, 126], [548, 94, 520, 98], [692, 118, 660, 96], [718, 168, 724, 134], [662, 226], [574, 214]], { bevel: 13 });
  jArmor(g, jShade(g, 660, 140, 720, 270, JUG.dark, JUG.deep), [[662, 226], [718, 168], [716, 206], [648, 292]], { cast: false, bevel: 6 });
  jRivets(g, [[690, 212], [704, 188], [672, 242], [660, 268]], 6);
  jArmor(g, jShade(g, 540, 112, 640, 190, '#e4f3f7', '#6f929d'), [[548, 124], [646, 137], [592, 188]], { bevel: 6, lw: 7 });
  jPoly(g, JUG.tealDark, [[569, 136], [622, 143], [595, 168]], 0);
  jPoly(g, '#9fb9c2', [[584, 142], [607, 145], [596, 156]], 0);
  jLine(g, JUG.line, 17, [[528, 196], [572, 210]]);
  jLine(g, '#6f7690', 5, [[530, 192], [570, 205]]);
  jRivets(g, [[486, 184], [524, 130], [556, 108], [676, 124], [700, 150], [696, 176]]);
  jWear(g, [[520, 160, 1], [660, 190, 0.8], [622, 104, 0.8]]);
  // ---- the shoulder on the claw side: upper arm, banded pauldron, spikes and big bolts
  jSpike(g, 806, 348, 872, 318, 22);
  jSpike(g, 834, 388, 900, 372, 22);
  jSpike(g, 826, 428, 866, 482, 22);
  jArmor(g, jShade(g, 690, 340, 830, 480, JUG.lite, JUG.deep, JUG.mid), [[686, 336], [766, 326], [844, 430, 842, 362], [800, 484, 834, 478], [704, 446, 744, 482]]);
  jArmor(g, jShade(g, 716, 260, 856, 420, '#7d9a92', '#1f2c28', '#486259'), [[712, 292], [784, 252, 742, 244], [856, 372, 848, 282], [822, 428, 856, 418], [740, 368, 770, 404]], { bevel: 8 });
  jLine(g, '#c9b6e8', 8, [[722, 366], [746, 386], [790, 414], [818, 420]]);
  for (const [x, y] of [[757, 300], [775, 318], [791, 337], [806, 358], [820, 380]]) {
    jLine(g, '#e8eef0', 8, [[x - 11, y + 9], [x + 7, y - 6]]);
    jLine(g, '#e8eef0', 4, [[x - 5, y - 4], [x + 3, y + 9]]);
  }
  jRivets(g, [[728, 288], [776, 272], [836, 346], [840, 396], [716, 428], [772, 460], [808, 462]]);
  jWear(g, [[756, 436, 1.1]]);
  jBolt(g, 703, 357, 35);
  // ---- the shoulder on the axe side, with a white burst painted on its band
  jSpike(g, 332, 262, 286, 228, 20);
  jSpike(g, 314, 300, 262, 292, 20);
  jSpike(g, 318, 340, 272, 368, 20);
  jArmor(g, jShade(g, 310, 220, 436, 360, '#7d9a92', '#1f2c28', '#486259'), [[304, 308], [356, 226, 308, 238], [438, 204, 396, 198], [432, 330], [362, 358, 398, 360]], { bevel: 9 });
  const star = [];
  for (let i = 0; i < 18; i++) {
    const a = (i / 18) * TAU;
    const r = i % 2 === 0 ? 32 : 17;
    star.push([368 + Math.cos(a) * r, 286 + Math.sin(a) * r]);
  }
  jPoly(g, '#eef3f4', star, 0);
  jBall(g, '#33463f', 368, 286, 11, 0);
  jBall(g, '#eef3f4', 368, 286, 5, 0);
  jLine(g, 'rgba(232, 240, 242, 0.9)', 7, [[392, 232], [418, 222]]);
  jRivets(g, [[330, 306], [350, 342], [412, 316], [422, 246], [346, 248]]);
  // ---- the chest under the collar: a vented panel
  jArmor(g, jShade(g, 540, 380, 660, 490, JUG.mid, JUG.deep), [[534, 384], [664, 376], [652, 466], [574, 486], [538, 450]]);
  jPoly(g, JUG.black, [[568, 424], [642, 418], [638, 462], [576, 472]], 5);
  for (const x of [580, 598, 616, 632]) jLine(g, '#7c849b', 7, [[x, 428], [x - 3, 464]]);
  jRivets(g, [[552, 402], [648, 396], [644, 456]]);
  // ---- the two collar flaps curling over his head, edged in teal
  jArmor(g, jShade(g, 480, 260, 650, 450, JUG.lite, JUG.deep, JUG.mid), [[466, 270], [566, 282, 516, 262], [650, 300], [666, 368, 668, 322], [642, 440], [578, 466], [546, 398, 556, 440], [514, 332]]);
  jArmor(g, jShade(g, 390, 255, 540, 420, JUG.glint, JUG.dark, JUG.lite), [[384, 300], [452, 256, 400, 262], [526, 278, 496, 258], [566, 340, 556, 296], [532, 424], [504, 388], [470, 366], [420, 394], [392, 352, 390, 390]], { bevel: 13 });
  for (const path of [[[420, 391], [469, 363], [506, 389], [531, 420]], [[648, 438], [580, 464], [548, 404]]]) {
    jLine(g, JUG.line, 28, path);
    jLine(g, JUG.teal, 17, path);
    jLine(g, 'rgba(206, 234, 224, 0.65)', 5, path.map(([x, y]) => [x - 2, y - 4]));
  }
  jSeam(g, [[400, 320], [454, 282], [516, 296], [546, 342], [530, 392]]);
  jRivets(g, [[408, 306], [454, 278], [506, 290], [538, 330], [540, 380], [590, 298], [638, 314], [652, 366], [634, 420]]);
  jWear(g, [[440, 330, 1.4], [602, 340, 1], [480, 300, 0.8], [628, 396, 0.7]]);
  jBolt(g, 604, 394, 26);
  // ---- the small low head: a pointed perforated mask under a round sensor, with a glowing slit
  jBall(g, JUG.black, 490, 398, 42);
  jBolt(g, 536, 402, 15);
  jBolt(g, 442, 396, 13);
  jArmor(g, jMetal(g, 442, 372, 530, 482), [[436, 388], [484, 366, 450, 366], [530, 390, 520, 368], [538, 436], [502, 480], [479, 492], [450, 446, 458, 478]], { bevel: 8 });
  for (let j = 0; j < 5; j++) for (let i = 0; i < 6 - j; i++) {
    const x = 458 + i * 13 + j * 6.5;
    const y = 426 + j * 12;
    if (Math.abs(x - 480) > 9) jBall(g, '#2a2740', x, y, 4.2, 0);
  }
  jArmor(g, jShade(g, 452, 372, 520, 418, JUG.glint, JUG.dark), [[444, 390], [482, 370, 454, 368], [524, 392, 514, 368], [500, 404], [481, 422], [462, 404]], { bevel: 6, lw: 6 });
  jBall(g, JUG.black, 482, 392, 13, 5);
  jBall(g, '#2fbfa2', 482, 392, 7, 0);
  jLine(g, JUG.line, 26, [[452, 400], [480, 424], [516, 402]]);
  jLine(g, JUG.line, 24, [[480, 424], [481, 462]]);
  jLine(g, '#17594f', 13, [[452, 400], [480, 424], [516, 402]]);
  jLine(g, '#17594f', 11, [[480, 424], [481, 460]]);
  // ---- the three hanging plates over the hips
  jTasset(g, [[374, 524], [406, 500], [482, 508], [498, 560], [468, 668], [418, 696], [388, 642], [368, 562]], [[398, 532], [416, 520], [466, 525], [478, 562], [452, 652], [422, 672], [405, 636], [388, 564]], [[408, 538], [458, 538], [398, 566], [466, 566], [410, 636], [446, 646]]);
  jTasset(g, [[626, 526], [690, 506], [726, 558], [720, 642], [680, 696], [642, 642], [626, 574]], [[646, 542], [684, 529], [706, 563], [701, 634], [679, 668], [660, 632], [645, 575]], [[658, 548], [696, 556], [656, 590], [695, 628]]);
  jWear(g, [[428, 600, 1.3], [672, 604, 1]]);
  jTasset(g, [[538, 620], [630, 608], [650, 700], [600, 784], [556, 764], [540, 692]], [[557, 637], [612, 628], [629, 698], [597, 754], [573, 742], [559, 690]], [[569, 648], [609, 645], [566, 694], [616, 698], [578, 730], [600, 732]]);
  jWear(g, [[596, 672, 1.4], [582, 712, 0.8]]);
}

// the arm with the great axe (swings from JUG_AXE_PIVOT)
function drawJugAxeArm(g) {
  jRod(g, 372, 378, 290, 452, 30, true);
  jRod(g, 340, 396, 264, 478, 46);
  jRod(g, 314, 386, 246, 440, 18);
  jBolt(g, 342, 394, 23);
  // the gun along the forearm: a riveted housing and two heavy dark barrels pointing back
  jRod(g, 318, 540, 430, 462, 58, true);
  jBall(g, jMetal(g, 406, 436, 456, 490), 434, 459, 30);
  jBall(g, JUG.black, 436, 458, 18, 4);
  jRod(g, 330, 578, 418, 528, 30, true);
  jBall(g, JUG.black, 420, 527, 15, 5);
  jArmor(g, jShade(g, 236, 420, 400, 600, JUG.lite, JUG.deep, JUG.mid), [[234, 438], [330, 414, 270, 408], [398, 448, 386, 418], [380, 508], [324, 598, 372, 574], [238, 590], [224, 500]], { bevel: 13 });
  jSeam(g, [[260, 452], [352, 444], [372, 470], [318, 566], [252, 566]]);
  jRivets(g, [[258, 438], [300, 428], [346, 430], [380, 456], [368, 500], [340, 552], [306, 580], [262, 576], [244, 532], [240, 476]]);
  jWear(g, [[330, 486, 1.5], [286, 540, 1], [360, 470, 0.7]]);
  jRod(g, 318, 598, 254, 640, 40, true);
  jBall(g, jMetal(g, 232, 622, 274, 664), 252, 643, 21);
  jBall(g, JUG.black, 250, 644, 11, 0);
  jBolt(g, 268, 474, 32);
  // the haft: a steel shaft with a criss-cross grip and a heavy pommel
  jRod(g, 214, 290, 227, 694, 34, true);
  jLine(g, '#6d7389', 38, [[218, 424], [219, 450]]);
  for (let y = 512; y < 686; y += 13) {
    jLine(g, 'rgba(222, 226, 238, 0.85)', 3, [[208, y], [240, y + 15]]);
    jLine(g, 'rgba(16, 18, 28, 0.75)', 3, [[240, y], [209, y + 15]]);
  }
  for (const y of [436, 508, 678]) jArmor(g, jMetal(g, 196, y - 8, 252, y + 12), [[198, y - 9], [244, y - 11], [246, y + 9], [200, y + 11]], { bevel: 4, lw: 6 });
  jArmor(g, jMetal(g, 200, 682, 252, 716), [[200, 684], [252, 681], [246, 716], [208, 719]], { bevel: 5 });
  // the hammer spike on top
  jArmor(g, jMetal(g, 232, 258, 252, 306), [[218, 268], [272, 265], [272, 302], [218, 304]], { bevel: 7 });
  jArmor(g, jMetal(g, 270, 250, 306, 318), [[268, 262], [296, 248], [312, 284], [298, 316], [268, 300]], { bevel: 6 });
  jRivets(g, [[236, 284], [256, 284]], 6);
  // the huge blade: a bevelled slab of steel, its honed edge bright, notched from use
  jArmor(g, jShade(g, 70, 310, 220, 560, '#dce0ea', '#5f667e', '#a3abbf'), [[50, 430], [80, 386], [152, 296], [208, 286], [224, 338], [208, 520], [192, 582], [62, 556], [46, 512, 44, 540]], { bevel: 12, lw: 9 });
  jPoly(g, '#f7f9fc', [[53, 430], [81, 392], [151, 305], [158, 322], [96, 406], [76, 448], [80, 540], [63, 548], [50, 512]], 0);
  jLine(g, 'rgba(70, 76, 96, 0.7)', 4, [[158, 322], [96, 406], [76, 448], [80, 540], [188, 566]]);
  jPoly(g, '#555c74', [[48, 466], [60, 472], [49, 482]], 0);
  jPoly(g, '#555c74', [[112, 348], [120, 354], [108, 362]], 0);
  jLine(g, 'rgba(255, 255, 255, 0.85)', 3, [[92, 470], [122, 420]]);
  jLine(g, 'rgba(255, 255, 255, 0.6)', 2.4, [[102, 508], [118, 484]]);
  jLine(g, 'rgba(60, 66, 86, 0.6)', 2.4, [[86, 504], [112, 536]]);
  // the bracket bolting it to the haft
  jArmor(g, jShade(g, 118, 320, 216, 512, JUG.lite, JUG.deep, JUG.mid), [[124, 326], [206, 316], [218, 498], [182, 520], [122, 506], [140, 452], [116, 356]], { bevel: 10 });
  for (let y = 342; y < 492; y += 21) {
    jBall(g, JUG.black, 195, y, 9, 0);
    jBall(g, JUG.pale, 193, y - 2, 6, 2.4);
  }
  jRivets(g, [[138, 340], [142, 490]], 9);
  jBolt(g, 152, 412, 17);
  jWear(g, [[160, 460, 1.2], [150, 372, 0.8]]);
  // the gauntlet, and jointed steel fingers wrapped round the haft
  jArmor(g, jShade(g, 170, 505, 312, 610, JUG.lite, JUG.deep), [[174, 516], [262, 510], [312, 554, 306, 514], [302, 608], [232, 600], [196, 566]]);
  jRivets(g, [[210, 528], [250, 526], [290, 548], [290, 590]]);
  for (const [x0, y0, x1, y1] of [[178, 546, 236, 556], [170, 582, 240, 594], [180, 620, 236, 626]]) {
    jRod(g, x0, y0, x1, y1, 26);
    jBolt(g, x0, y0, 13);
    jBall(g, jMetal(g, x1 - 12, y1 - 12, x1 + 12, y1 + 12), x1, y1, 12, 4);
  }
  jBolt(g, 286, 598, 21);
  jRod(g, 168, 600, 148, 648, 22);
}

// the arm with the spiked claw (swings from JUG_CLAW_PIVOT)
function drawJugClawArm(g) {
  jRod(g, 746, 410, 776, 508, 28, true);
  jRod(g, 776, 400, 806, 506, 52);
  jRod(g, 812, 420, 846, 494, 20);
  jBolt(g, 776, 472, 35);
  // the steel hand: a knuckle block and three jointed talons, tucked under the gauntlet
  jArmor(g, jMetal(g, 730, 624, 880, 700), [[734, 626], [872, 636], [868, 690], [742, 682]], { bevel: 7 });
  for (const [x, y, mx, my, tx, ty, w] of [[750, 668, 742, 718, 762, 764, 40], [802, 676, 806, 730, 784, 786, 38], [852, 668, 868, 712, 846, 756, 32]]) {
    jRod(g, x, y, mx, my, w * 0.8);
    jArmor(g, jMetal(g, mx - w / 2, my, mx + w / 2, ty), [[mx - w / 2, my - 4], [mx + w / 2, my], [tx, ty], [mx - w * 0.3, my + 26]], { bevel: 5, lw: 6 });
    jBolt(g, mx, my, w * 0.34);
  }
  jRivets(g, [[754, 646], [808, 652], [854, 656]], 9);
  // the huge gauntlet
  jArmor(g, jShade(g, 736, 480, 926, 706, JUG.glint, JUG.deep, JUG.mid), [[722, 586], [736, 522], [796, 466, 748, 468], [864, 470, 834, 454], [918, 542, 912, 492], [924, 636, 934, 590], [884, 704, 920, 690], [838, 700], [806, 652], [736, 616]], { bevel: 17 });
  jArmor(g, jShade(g, 780, 480, 900, 650, JUG.lite, JUG.dark), [[756, 546], [800, 494, 766, 502], [858, 494, 832, 484], [900, 548, 894, 508], [904, 630], [874, 672, 900, 666], [848, 640], [818, 606], [760, 586]], { cast: false, lw: 5, bevel: 9 });
  jSeam(g, [[800, 500], [838, 546], [900, 566]]);
  jRivets(g, [[742, 556], [758, 516], [796, 480], [850, 478], [896, 514], [912, 562], [912, 622], [890, 676], [850, 690], [746, 604]]);
  jWear(g, [[820, 524, 1.7], [870, 570, 1.1], [784, 560, 0.8], [862, 652, 1.2]]);
  jStud(g, 764, 592, 27);
  jStud(g, 822, 616, 29);
  jStud(g, 886, 622, 25);
  jSpike(g, 862, 508, 908, 462, 24);
  jSpike(g, 742, 562, 704, 530, 21);
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

  art.juggernaut = {
    legA: jugLayer(2, -10, 40, 34, drawJugLegA),
    legB: jugLayer(-56, -10, -12, 34, drawJugLegB),
    body: jugLayer(-72, -102, 42, 34, drawJugBody),
    axeArm: jugLayer(6, -66, 80, 20, drawJugAxeArm),
    clawArm: jugLayer(-76, -52, -36, 30, drawJugClawArm),
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
