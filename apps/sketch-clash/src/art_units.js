import { TAU, K } from './config.js?v=198';
import { makeLayer, rr, star, FEET_POSES, drawFeet, OUT, drawSniperBody, drawSniperEyes, drawSniperHat, neckScarf } from './sprites.js?v=198';

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
// from the shapes of a reference photo (in its 960px coordinates), mirrored so the axe leads when he faces right.
export const JS = 0.168; // reference px to art units
export const JUG_AXE_PIVOT = [27.7, -38.4];
export const JUG_CLAW_PIVOT = [-46.2, -40];
export const JUG_EYE = [3.7, -35.4];
const JUG = { lite: '#bcb0d5', mid: '#9a8cb5', dark: '#746795', deep: '#52467a', teal: '#5f7a74', tealDark: '#40564f', steel: '#c6ccd8', iron: '#8c94a8', ironDark: '#575e72', black: '#2a2d3a', pale: '#b4ced8' };

// a layer drawn at three times the usual resolution, so all the parts stay crisp
function jugLayer(minX, minY, maxX, maxY, draw) {
  const res = 3;
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

function jPoly(g, fill, pts, lw = 10) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  g.strokeStyle = OUT;
  g.lineWidth = lw;
  g.stroke();
}

function jBall(g, fill, x, y, r, lw = 8) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  g.strokeStyle = OUT;
  g.lineWidth = lw;
  g.stroke();
}

function jShade(g, x0, y0, x1, y1, a = JUG.lite, b = JUG.dark) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  return gr;
}

function jLine(g, col, lw, pts) {
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
}

function jRivets(g, list, r = 7) {
  for (const [x, y] of list) {
    jBall(g, JUG.steel, x, y, r, 4);
    jBall(g, '#ffffff', x + 2, y - 2, r * 0.3, 0);
  }
}

// a steel rod or piston between two points
function jRod(g, x0, y0, x1, y1, w, col = JUG.iron) {
  jLine(g, OUT, w + 12, [[x0, y0], [x1, y1]]);
  jLine(g, col, w, [[x0, y0], [x1, y1]]);
  jLine(g, 'rgba(255, 255, 255, 0.4)', w * 0.22, [[x0 - w * 0.18, y0], [x1 - w * 0.18, y1]]);
}

// a cone spike from its base (bx, by) to its tip
function jSpike(g, bx, by, tx, ty, w) {
  const a = Math.atan2(ty - by, tx - bx) + Math.PI / 2;
  jPoly(g, JUG.steel, [[bx + Math.cos(a) * w, by + Math.sin(a) * w], [tx, ty], [bx - Math.cos(a) * w, by - Math.sin(a) * w]], 7);
  jLine(g, '#ffffff', 4, [[bx, by], [bx + (tx - bx) * 0.7, by + (ty - by) * 0.7]]);
}

// a disc-headed bolt with a slot across it
function jBolt(g, x, y, r) {
  jBall(g, JUG.iron, x, y, r);
  jBall(g, JUG.steel, x, y, r * 0.62, 5);
  jLine(g, OUT, 6, [[x - r * 0.45, y + r * 0.2], [x + r * 0.45, y - r * 0.2]]);
}

// one hanging armour plate: a teal rim round a bevelled face, riveted
function jPlate(g, outer, inner, rivets) {
  jPoly(g, JUG.tealDark, outer);
  jPoly(g, jShade(g, inner[0][0], inner[0][1], inner[0][0] + 60, inner[0][1] + 170, JUG.mid, JUG.deep), inner, 6);
  jRivets(g, rivets, 6);
}

// the leg on the axe side, and the one on the claw side
function drawJugLegA(g) {
  jRod(g, 455, 540, 405, 640, 34);
  jPoly(g, jShade(g, 350, 600, 450, 720), [[368, 604], [412, 584], [446, 612], [436, 722], [374, 720], [354, 650]]);
  jBall(g, JUG.iron, 408, 722, 24);
  jPoly(g, jShade(g, 300, 712, 450, 792, JUG.steel, JUG.ironDark), [[298, 764], [318, 730], [354, 712], [422, 716], [448, 746], [444, 786], [300, 788]]);
  jLine(g, OUT, 7, [[300, 764], [446, 756]]);
  jLine(g, OUT, 6, [[366, 764], [368, 786]]);
  jRivets(g, [[330, 748], [366, 736], [404, 734], [434, 752], [328, 776], [412, 776]], 6);
}

function drawJugLegB(g) {
  jRod(g, 600, 540, 672, 640, 34);
  jPoly(g, jShade(g, 640, 590, 740, 712), [[652, 598], [694, 580], [728, 610], [738, 706], [668, 716], [648, 650]]);
  jBall(g, JUG.iron, 704, 716, 24);
  jPoly(g, jShade(g, 650, 712, 800, 796, JUG.steel, JUG.ironDark), [[650, 748], [672, 722], [722, 712], [772, 730], [802, 768], [794, 796], [654, 792]]);
  jLine(g, OUT, 7, [[652, 764], [800, 770]]);
  jLine(g, OUT, 6, [[728, 767], [728, 793]]);
  jRivets(g, [[676, 744], [712, 732], [752, 742], [780, 762], [682, 780], [766, 782]], 6);
}

function drawJugBody(g) {
  // ---- the four perforated stacks on his back
  for (const [x, y, w] of [[702, 92, 30], [678, 78, 34], [634, 56, 46], [590, 62, 46]]) {
    jPoly(g, jShade(g, x, y, x + w, y, '#dcecf2', '#7d98a6'), [[x, y], [x + w, y], [x + w, y + 96], [x, y + 96]], 8);
    g.beginPath();
    g.ellipse(x + w / 2, y, w / 2, 12, 0, 0, TAU);
    g.fillStyle = JUG.black;
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = 8;
    g.stroke();
    for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) jBall(g, '#33424f', x + w * (0.3 + i * 0.4), y + 30 + j * 22 + i * 8, 5, 0);
  }
  // ---- the great humped hull
  jPoly(g, jShade(g, 420, 120, 760, 470), [[362, 300], [398, 205], [478, 135], [566, 112], [692, 122], [746, 184], [790, 252], [798, 338], [760, 436], [664, 474], [482, 472], [386, 420]]);
  // ---- the waist: a bundle of pistons under the hull
  jRod(g, 532, 450, 536, 628, 30);
  jRod(g, 578, 450, 570, 606, 36, JUG.ironDark);
  jRod(g, 500, 548, 618, 566, 26);
  jRod(g, 478, 470, 440, 560, 24, JUG.ironDark);
  jRod(g, 622, 470, 668, 552, 24, JUG.ironDark);
  jBolt(g, 576, 504, 22);
  jBolt(g, 534, 582, 18);
  jPoly(g, JUG.ironDark, [[508, 448], [616, 448], [604, 486], [520, 486]]);
  // ---- the hood plate on top, with its slot and a plain chevron marking
  jPoly(g, jShade(g, 500, 100, 680, 270, JUG.lite, JUG.mid), [[480, 140], [558, 94], [692, 118], [716, 182], [696, 252], [640, 290], [574, 256], [468, 188]]);
  jLine(g, 'rgba(60, 48, 92, 0.8)', 9, [[478, 188], [578, 238], [642, 270], [690, 244]]);
  jLine(g, JUG.black, 13, [[532, 190], [574, 204]]);
  jPoly(g, JUG.pale, [[552, 122], [642, 136], [592, 184]], 8);
  jPoly(g, JUG.tealDark, [[574, 134], [618, 141], [594, 164]], 0);
  jRivets(g, [[668, 140], [688, 170], [686, 206], [670, 240], [496, 158]]);
  // ---- the shoulder on the claw side: banded pauldron, spikes and big bolts
  jPoly(g, jShade(g, 680, 200, 800, 360), [[662, 204], [742, 190], [802, 262], [794, 332], [702, 366], [654, 300]]);
  jSpike(g, 812, 348, 868, 320, 20);
  jSpike(g, 836, 388, 894, 374, 20);
  jSpike(g, 832, 424, 866, 470, 20);
  jPoly(g, jShade(g, 700, 340, 830, 470), [[690, 336], [764, 326], [840, 428], [798, 478], [702, 444]]);
  jPoly(g, JUG.tealDark, [[714, 292], [782, 256], [852, 372], [822, 424], [740, 366]]);
  for (const [x, y] of [[760, 306], [776, 324], [792, 342], [806, 362], [822, 380]]) jLine(g, '#e4ecee', 9, [[x - 10, y + 8], [x + 6, y - 6]]);
  jRivets(g, [[700, 232], [742, 214], [776, 262], [782, 316], [716, 428], [776, 456]]);
  jBolt(g, 702, 357, 33);
  // ---- the shoulder on the axe side, with a white burst painted on it
  jSpike(g, 334, 262, 292, 232, 19);
  jSpike(g, 318, 300, 270, 292, 19);
  jSpike(g, 322, 338, 280, 362, 19);
  jPoly(g, JUG.tealDark, [[308, 306], [350, 232], [436, 206], [428, 330], [362, 356]]);
  const star = [];
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const r = i % 2 === 0 ? 30 : 14;
    star.push([366 + Math.cos(a) * r, 288 + Math.sin(a) * r]);
  }
  jPoly(g, '#e8eef0', star, 0);
  jBall(g, JUG.tealDark, 366, 288, 7, 0);
  jRivets(g, [[342, 330], [412, 226]]);
  // ---- the chest under the collar: a vented panel
  jPoly(g, jShade(g, 540, 380, 660, 480, JUG.mid, JUG.deep), [[536, 388], [660, 380], [652, 462], [574, 482], [540, 448]]);
  for (const x of [578, 596, 614, 632]) jLine(g, JUG.black, 9, [[x, 428], [x - 2, 464]]);
  // ---- the two collar flaps curling over his head, edged in teal
  jPoly(g, jShade(g, 470, 270, 640, 440), [[470, 268], [566, 280], [648, 300], [664, 366], [642, 438], [580, 466], [546, 398], [516, 334]]);
  jPoly(g, jShade(g, 390, 260, 520, 400), [[386, 300], [452, 258], [524, 278], [562, 338], [530, 420], [504, 388], [470, 366], [420, 392], [394, 352]]);
  jLine(g, OUT, 30, [[420, 390], [468, 364], [506, 390], [530, 418]]);
  jLine(g, JUG.teal, 18, [[420, 390], [468, 364], [506, 390], [530, 418]]);
  jLine(g, OUT, 24, [[646, 436], [584, 464], [552, 410]]);
  jLine(g, JUG.teal, 13, [[646, 436], [584, 464], [552, 410]]);
  jRivets(g, [[412, 304], [456, 280], [510, 292], [540, 336], [596, 296], [640, 316], [650, 366], [634, 414]]);
  jBolt(g, 604, 394, 25);
  // ---- the small low head: a perforated mask with a glowing slit
  jBall(g, JUG.ironDark, 492, 398, 34);
  jPoly(g, jShade(g, 440, 380, 530, 480, JUG.steel, JUG.dark), [[438, 386], [482, 368], [528, 390], [536, 434], [502, 480], [478, 488], [452, 444]]);
  for (const [x, y] of [[462, 432], [478, 442], [496, 434], [512, 424], [470, 456], [488, 460], [504, 448], [480, 474], [516, 408], [458, 412]]) jBall(g, '#3c3a52', x, y, 5, 0);
  jLine(g, OUT, 27, [[448, 394], [478, 420], [520, 396]]);
  jLine(g, OUT, 25, [[478, 420], [481, 456]]);
  jLine(g, '#1d6f63', 14, [[448, 394], [478, 420], [520, 396]]);
  jLine(g, '#1d6f63', 12, [[478, 420], [481, 454]]);
  // ---- three hanging plates over the hips
  jPlate(g, [[376, 524], [406, 502], [480, 508], [496, 560], [466, 668], [418, 694], [390, 642], [370, 562]], [[400, 530], [416, 520], [466, 524], [476, 562], [450, 652], [422, 670], [406, 634], [390, 564]], [[408, 538], [458, 536], [404, 604], [448, 640]]);
  jPlate(g, [[628, 526], [690, 508], [724, 558], [718, 642], [680, 694], [644, 642], [628, 574]], [[646, 540], [684, 528], [706, 562], [700, 634], [678, 668], [660, 632], [646, 574]], [[660, 546], [698, 570], [694, 630]]);
  jPlate(g, [[540, 620], [628, 610], [648, 700], [600, 780], [558, 762], [542, 692]], [[558, 636], [612, 628], [628, 698], [596, 754], [572, 742], [560, 690]], [[570, 648], [608, 646], [572, 722], [606, 720]]);
}

// the arm with the great axe (swings from JUG_AXE_PIVOT)
function drawJugAxeArm(g) {
  jRod(g, 338, 398, 266, 474, 44);
  // the gun housing along the forearm, with two dark barrels
  jRod(g, 320, 540, 424, 466, 56, JUG.ironDark);
  jBall(g, JUG.black, 430, 462, 25);
  jPoly(g, jShade(g, 236, 420, 400, 600), [[238, 436], [332, 416], [394, 446], [378, 508], [322, 596], [240, 588], [226, 500]]);
  jRod(g, 316, 596, 258, 636, 38, JUG.ironDark);
  jBall(g, JUG.black, 252, 642, 17);
  jLine(g, JUG.deep, 9, [[262, 450], [352, 446], [300, 572]]);
  jRivets(g, [[262, 452], [326, 436], [372, 458], [300, 568], [250, 566]]);
  jBolt(g, 268, 476, 30);
  // the haft, with a knurled grip and a pommel
  jRod(g, 214, 292, 226, 696, 34, JUG.ironDark);
  for (let y = 520; y < 686; y += 18) {
    jLine(g, '#c3c9d4', 4, [[208, y], [238, y + 16]]);
    jLine(g, '#c3c9d4', 4, [[238, y], [208, y + 16]]);
  }
  jPoly(g, JUG.iron, [[202, 684], [250, 682], [248, 714], [206, 716]]);
  // the hammer spike on top
  jPoly(g, jShade(g, 230, 262, 300, 304, JUG.steel, JUG.ironDark), [[222, 268], [276, 266], [298, 252], [300, 312], [276, 298], [222, 300]]);
  // the huge blade, its bright cutting edge, and the riveted bracket that holds it
  jPoly(g, jShade(g, 80, 300, 210, 560, '#e6e9f0', '#7b8296'), [[52, 428], [78, 390], [152, 298], [206, 288], [220, 338], [208, 522], [190, 578], [66, 552], [50, 520]], 12);
  jPoly(g, '#f4f6fa', [[56, 430], [80, 396], [152, 306], [150, 334], [92, 412], [80, 446], [82, 546], [66, 546], [54, 520]], 0);
  jPoly(g, jShade(g, 120, 320, 210, 510, JUG.mid, JUG.deep), [[126, 326], [204, 318], [216, 498], [182, 516], [124, 504], [118, 356]]);
  for (let y = 346; y < 490; y += 24) jBall(g, JUG.pale, 190, y, 8, 4);
  jRivets(g, [[138, 342], [140, 488], [156, 410]], 9);
  // the gauntlet and steel fingers wrapped round the haft
  jPoly(g, jShade(g, 160, 510, 300, 610), [[176, 516], [262, 512], [310, 556], [300, 606], [232, 596], [196, 566]]);
  jRivets(g, [[214, 530], [264, 534], [288, 566]]);
  for (const [x0, y0, x1, y1] of [[176, 548, 232, 556], [172, 584, 236, 594], [182, 622, 232, 626]]) {
    jRod(g, x0, y0, x1, y1, 24, JUG.steel);
    jBall(g, JUG.iron, x0, y0, 12, 5);
  }
  jBolt(g, 284, 598, 20);
  jRod(g, 164, 600, 150, 646, 22, JUG.steel);
}

// the arm with the spiked claw (swings from JUG_CLAW_PIVOT)
function drawJugClawArm(g) {
  jRod(g, 772, 404, 800, 506, 52);
  jBolt(g, 778, 470, 34);
  // steel talons, drawn first so the gauntlet laps over their roots
  for (const [pts] of [[[[732, 636], [788, 640], [780, 712], [746, 746], [752, 700], [728, 686]]], [[[788, 648], [838, 658], [830, 740], [796, 772], [800, 716], [784, 696]]], [[[842, 636], [880, 646], [874, 708], [846, 738], [848, 692]]]]) {
    jPoly(g, jShade(g, pts[0][0], pts[0][1], pts[0][0] + 50, pts[0][1] + 110, JUG.steel, JUG.ironDark), pts);
  }
  jRivets(g, [[752, 668], [808, 678], [858, 668]], 9);
  jPoly(g, jShade(g, 740, 480, 920, 700), [[724, 588], [738, 520], [792, 468], [862, 470], [916, 540], [924, 638], [882, 702], [800, 690]]);
  jLine(g, JUG.deep, 10, [[744, 540], [796, 492], [858, 494], [896, 546], [902, 630], [872, 672]]);
  jPoly(g, 'rgba(214, 206, 234, 0.45)', [[760, 530], [798, 494], [846, 492], [800, 540]], 0);
  jRivets(g, [[756, 520], [796, 484], [846, 478], [894, 520], [912, 580], [908, 646], [866, 688], [816, 680]]);
  jSpike(g, 760, 596, 722, 572, 24);
  jSpike(g, 814, 610, 796, 566, 24);
  jSpike(g, 876, 622, 916, 598, 24);
  jSpike(g, 858, 520, 902, 480, 22);
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
