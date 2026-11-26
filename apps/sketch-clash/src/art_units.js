import { TAU, K } from './config.js?v=192';
import { makeLayer, rr, star, FEET_POSES, drawFeet, OUT, drawSniperBody, drawSniperEyes, drawSniperHat, neckScarf } from './sprites.js?v=192';

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
    // a knocked-off lens turret
    botBall(g, '#7d77a2', 0, 0, 5.4, 1.2);
    botBall(g, '#20b097', 0, 0, 3.2, 0.8);
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
// Drawn part by part in the coordinates of a 1500px reference view (three-quarter, facing right), then mapped
// into art units: the antenna tips sit at the top and the soles at y = 28.
const BS = 80 / 700;
const BOT = { lite: '#b4a9ca', mid: '#9588ae', dark: '#6f638c', teal: '#637872', tealDark: '#4c5f5a', pod: '#abc6d0', podDark: '#7d98a6', noz: '#4d606e', hole: '#222b34', slate: '#8392b2', gun: '#4d577b', gunDark: '#374061', gunLite: '#6a759b', line: '#25212f' };

function botSpace(g) {
  g.scale(BS, BS);
  g.translate(-760, -1115 + 28 / BS);
}

// a layer drawn at three times the usual resolution, so all the small parts stay crisp
function botLayer(minX, minY, maxX, maxY, draw) {
  const res = 3;
  const l = makeLayer(minX * res, minY * res, maxX * res, maxY * res, (g) => {
    g.scale(res, res);
    draw(g);
  });
  return { canvas: l.canvas, x: l.x / res, y: l.y / res, w: l.w / res, h: l.h / res };
}

function botPart(g, fill, lw, path) {
  g.beginPath();
  path();
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  g.strokeStyle = BOT.line;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  g.stroke();
}

function botPoly(g, fill, pts, lw = 7) {
  botPart(g, fill, lw, () => pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))));
}

function botBall(g, fill, x, y, r, lw = 7) {
  botPart(g, fill, lw, () => g.arc(x, y, r, 0, TAU));
}

function botOval(g, fill, x, y, rx, ry, rot = 0, lw = 6) {
  botPart(g, fill, lw, () => g.ellipse(x, y, rx, ry, rot, 0, TAU));
}

function botShade(g, x0, y0, x1, y1, a, b) {
  const gr = g.createLinearGradient(x0, y0, x1, y1);
  gr.addColorStop(0, a);
  gr.addColorStop(1, b);
  return gr;
}

function botLine(g, col, lw, pts) {
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
}

// a thruster nozzle seen end on: a slate rim round a dark mouth
function botNozzle(g, x, y, rx, ry, rot) {
  botOval(g, BOT.noz, x, y, rx, ry, rot);
  botOval(g, BOT.hole, x, y, rx * 0.62, ry * 0.64, rot, 0);
}

function botPod(g, x, y, r) {
  botBall(g, botShade(g, x - r, y - r, x + r, y + r, '#c3dae2', BOT.podDark), x, y, r);
}

// the legs: hip joint, rounded knee armour, shin and a flat clawed foot; frames 1 and 3 are the steps
function drawTrooperLegs(g, frame) {
  botSpace(g);
  const step = [0, 1, 0, -1][frame];
  // the black tube slung behind, between the legs
  botPoly(g, '#262832', [[690, 1040], [750, 1046], [748, 1090], [690, 1082]]);
  botOval(g, '#14151c', 692, 1061, 11, 21, 0, 5);
  const leg = (dir, parts) => {
    g.save();
    g.translate(step * dir * 22, step * dir > 0 ? -14 : 0);
    parts();
    g.restore();
  };
  leg(-1, () => {
    botPoly(g, BOT.slate, [[652, 905], [716, 912], [702, 990], [642, 978]]);
    botPoly(g, botShade(g, 625, 970, 710, 1045, BOT.mid, BOT.dark), [[628, 978], [660, 962], [695, 968], [713, 1006], [694, 1046], [638, 1038], [618, 1006]]);
    botBall(g, BOT.lite, 668, 996, 17, 5);
    botPoly(g, BOT.dark, [[634, 1036], [690, 1042], [680, 1086], [626, 1080]]);
    botPoly(g, '#666a94', [[600, 1080], [692, 1076], [700, 1106], [668, 1108], [660, 1096], [652, 1115], [628, 1114], [630, 1100], [616, 1114], [598, 1108]]);
  });
  leg(1, () => {
    botPoly(g, BOT.slate, [[842, 912], [905, 902], [928, 966], [866, 986]]);
    botPoly(g, botShade(g, 840, 950, 935, 1030, BOT.lite, BOT.mid), [[846, 966], [878, 948], [912, 952], [938, 992], [916, 1030], [860, 1024], [838, 992]]);
    botBall(g, BOT.lite, 888, 986, 19, 5);
    botLine(g, BOT.dark, 6, [[872, 1028], [918, 1000]]);
    botPoly(g, BOT.mid, [[864, 1022], [918, 1018], [932, 1064], [880, 1072]]);
    botPoly(g, '#8279a4', [[850, 1062], [934, 1056], [954, 1084], [920, 1086], [908, 1074], [898, 1092], [872, 1090], [874, 1080], [858, 1090], [842, 1084]]);
  });
}

function drawTrooperBody(g) {
  botSpace(g);
  // ---- backpack: the pod peeking out behind the head on the right
  botPoly(g, BOT.podDark, [[752, 498], [830, 488], [836, 548], [758, 546]]);
  botPod(g, 846, 496, 46);
  botPoly(g, BOT.noz, [[860, 478], [894, 504], [878, 552], [840, 530]]);
  botNozzle(g, 882, 527, 19, 29, -0.55);
  // ---- the equipment box on its back and the struts to the pods
  botPoly(g, '#55666e', [[556, 566], [668, 548], [676, 625], [560, 640]]);
  botPoly(g, '#6d8086', [[575, 556], [650, 545], [654, 570], [578, 580]], 6);
  botPoly(g, BOT.noz, [[505, 548], [540, 528], [640, 604], [612, 640]]);
  botPoly(g, BOT.noz, [[520, 878], [600, 800], [632, 832], [555, 912]]);
  // ---- the upper pair of pods on the left
  botPoly(g, BOT.pod, [[425, 545], [488, 532], [496, 612], [436, 608]]);
  botNozzle(g, 428, 578, 19, 31, 0.15);
  botPoly(g, BOT.noz, [[392, 486], [434, 468], [482, 522], [452, 556], [404, 526]]);
  botNozzle(g, 412, 505, 22, 39, -0.62);
  botPod(g, 492, 554, 62);
  botLine(g, 'rgba(60, 90, 104, 0.7)', 6, [[452, 508], [468, 556], [456, 602]]);
  botNozzle(g, 524, 546, 27, 34, -0.2);
  // ---- the lower pair of pods
  botPod(g, 540, 884, 36);
  botPoly(g, BOT.noz, [[420, 872], [452, 862], [476, 912], [440, 922]]);
  botNozzle(g, 432, 892, 21, 31, -0.3);
  botPoly(g, BOT.noz, [[414, 978], [458, 944], [500, 976], [454, 1010]]);
  botNozzle(g, 434, 994, 19, 29, 0.78);
  botPod(g, 494, 928, 57);
  botLine(g, 'rgba(60, 90, 104, 0.7)', 6, [[462, 884], [486, 930], [468, 978]]);
  botNozzle(g, 548, 930, 23, 31, -0.15);
  // ---- twin antennae
  botLine(g, BOT.line, 15, [[808, 548], [729, 419]]);
  botLine(g, BOT.line, 15, [[836, 548], [765, 417]]);
  botLine(g, '#6b7681', 8, [[808, 548], [729, 419]]);
  botLine(g, '#6b7681', 8, [[836, 548], [765, 417]]);
  // ---- the far arm: small shoulder, strut, forearm and hand
  botPoly(g, BOT.slate, [[925, 686], [962, 690], [968, 770], [932, 772]]);
  botBall(g, botShade(g, 900, 610, 990, 700, BOT.lite, BOT.dark), 943, 652, 49);
  botLine(g, BOT.dark, 6, [[950, 614], [972, 650], [958, 692]]);
  botPoly(g, botShade(g, 915, 750, 1005, 910, BOT.lite, BOT.dark), [[918, 748], [972, 756], [1004, 826], [992, 898], [938, 914], [914, 852]]);
  botPoly(g, BOT.mid, [[938, 778], [972, 786], [982, 844], [944, 852]], 5);
  botBall(g, BOT.lite, 954, 872, 15, 5);
  botPoly(g, BOT.dark, [[936, 902], [992, 890], [990, 952], [972, 962], [966, 928], [958, 958], [940, 956], [944, 928], [930, 940]]);
  // ---- the domed hull
  botPart(g, botShade(g, 680, 520, 920, 860, BOT.lite, BOT.dark), 9, () => {
    g.moveTo(626, 668);
    g.bezierCurveTo(624, 576, 692, 522, 784, 522);
    g.bezierCurveTo(872, 522, 924, 584, 924, 662);
    g.lineTo(916, 790);
    g.lineTo(896, 848);
    g.quadraticCurveTo(780, 866, 690, 840);
    g.lineTo(634, 776);
  });
  // the raised plate on top of the dome and the seams
  botPart(g, 'rgba(208, 200, 228, 0.5)', 0, () => {
    g.moveTo(700, 562);
    g.bezierCurveTo(740, 524, 828, 522, 868, 556);
    g.lineTo(866, 580);
    g.quadraticCurveTo(780, 556, 700, 590);
  });
  botLine(g, 'rgba(62, 52, 86, 0.75)', 6, [[790, 524], [842, 538], [876, 566]]);
  botLine(g, 'rgba(62, 52, 86, 0.75)', 6, [[700, 566], [716, 548], [752, 530]]);
  botLine(g, 'rgba(62, 52, 86, 0.75)', 6, [[636, 712], [700, 722], [772, 736], [868, 728], [918, 708]]);
  botLine(g, 'rgba(62, 52, 86, 0.6)', 5, [[774, 736], [776, 764]]);
  // ---- the visor band wrapped round the head, with its hinge and slit
  botPart(g, botShade(g, 700, 580, 780, 712, '#6e857d', BOT.tealDark), 8, () => {
    g.moveTo(622, 606);
    g.quadraticCurveTo(760, 560, 922, 592);
    g.lineTo(926, 684);
    g.quadraticCurveTo(792, 724, 628, 688);
  });
  botLine(g, 'rgba(170, 200, 188, 0.6)', 6, [[636, 615], [712, 596], [790, 590]]);
  botLine(g, 'rgba(30, 40, 38, 0.7)', 6, [[664, 603], [668, 694]]);
  botBall(g, BOT.tealDark, 636, 648, 22);
  botBall(g, BOT.teal, 636, 648, 9, 5);
  botLine(g, '#161c1e', 16, [[768, 652], [816, 657]]);
  // ---- the lens turret: toothed ring and green eye, red eye, and the little sight below
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * TAU;
    botBall(g, '#76709a', 858 + Math.cos(a) * 42, 634 + Math.sin(a) * 42, 9, 4);
  }
  botBall(g, '#7d77a2', 858, 634, 41, 6);
  botBall(g, '#55597a', 861, 636, 31, 5);
  const eye = g.createRadialGradient(854, 628, 3, 862, 637, 27);
  eye.addColorStop(0, '#5fe6cc');
  eye.addColorStop(0.55, '#20b097');
  eye.addColorStop(1, '#13806f');
  botBall(g, eye, 862, 637, 24, 4);
  botBall(g, '#fff', 853, 627, 6, 0);
  botBall(g, '#7d77a2', 901, 657, 24, 6);
  botBall(g, '#dd3f37', 901, 657, 14, 4);
  botBall(g, '#ff9a8c', 896, 652, 4, 0);
  botPart(g, '#8079a6', 6, () => g.roundRect(822, 668, 62, 46, 18));
  botBall(g, '#1f8f80', 851, 690, 10, 4);
  botBall(g, '#6ff0d2', 851, 690, 4, 0);
  for (const [x, y, dx, dy] of [[833, 690, 8, 0], [861, 690, 8, 0], [851, 672, 0, 8], [851, 700, 0, 8]]) botLine(g, '#26233c', 4, [[x, y], [x + dx, y + dy]]);
  // ---- chest: the slate hatch with its handle, and the slatted vent
  botPoly(g, botShade(g, 780, 760, 790, 846, '#93a1bf', '#6f7d9e'), [[774, 766], [916, 758], [912, 828], [868, 850], [782, 838]]);
  botLine(g, 'rgba(40, 48, 76, 0.7)', 6, [[776, 782], [914, 773]]);
  botPart(g, '#9aa8c6', 6, () => g.roundRect(826, 788, 72, 19, 9));
  botPoly(g, BOT.lite, [[688, 722], [764, 736], [768, 794], [702, 791]]);
  for (const x of [710, 727, 744]) botLine(g, '#4a4066', 9, [[x, 744], [x + 7, 776]]);
  // ---- waist and skirt plates
  botPoly(g, BOT.dark, [[636, 806], [702, 846], [704, 936], [644, 924]]);
  botPoly(g, botShade(g, 706, 850, 850, 945, BOT.mid, BOT.dark), [[704, 842], [852, 856], [846, 946], [708, 934]]);
  botLine(g, 'rgba(52, 42, 74, 0.75)', 6, [[766, 850], [764, 938]]);
  botLine(g, 'rgba(52, 42, 74, 0.75)', 6, [[766, 880], [848, 884]]);
  botPoly(g, '#5f6a8c', [[744, 934], [826, 940], [812, 962], [756, 958]], 6);
  botPoly(g, BOT.lite, [[854, 848], [916, 844], [924, 934], [862, 946]]);
  for (const y of [874, 887, 900, 913]) botLine(g, '#4a4066', 7, [[872, y], [901, y - 2]]);
  botPoly(g, BOT.dark, [[920, 826], [956, 848], [950, 920], [924, 930]]);
  // ---- the near arm: big domed shoulder with its round cap, strut, and the blocky forearm
  botPoly(g, BOT.slate, [[556, 722], [604, 726], [614, 796], [570, 806]]);
  botPart(g, botShade(g, 520, 600, 620, 740, '#bdb2d2', BOT.dark), 9, () => {
    g.moveTo(496, 690);
    g.bezierCurveTo(488, 622, 530, 590, 572, 592);
    g.bezierCurveTo(622, 596, 646, 636, 640, 692);
    g.lineTo(630, 728);
    g.quadraticCurveTo(566, 750, 502, 726);
  });
  botLine(g, 'rgba(62, 52, 86, 0.7)', 6, [[500, 708], [566, 724], [636, 708]]);
  botBall(g, BOT.lite, 517, 642, 28);
  botBall(g, BOT.mid, 515, 640, 13, 5);
  botPoly(g, botShade(g, 530, 775, 640, 910, BOT.lite, BOT.dark), [[534, 782], [602, 766], [646, 802], [642, 896], [588, 914], [546, 882], [524, 830]]);
  botPoly(g, BOT.mid, [[546, 812], [588, 800], [606, 862], [564, 876]], 5);
  botBall(g, BOT.lite, 574, 786, 20, 6);
  botLine(g, BOT.dark, 7, [[588, 890], [634, 872]]);
}

// Origin: the grip. The long rifle, drawn as it hangs in the reference and then turned to lie along +x.
function drawTrooperGun(g, firing) {
  g.rotate(-1.41);
  g.scale(BS, BS);
  g.translate(-665, -850);
  botPoly(g, BOT.gunDark, [[668, 728], [694, 736], [702, 800], [654, 796], [640, 758]]);
  botBall(g, '#1d2233', 668, 755, 8, 4);
  botBall(g, '#1d2233', 678, 780, 8, 4);
  botPoly(g, botShade(g, 625, 800, 712, 930, BOT.gunLite, BOT.gunDark), [[630, 790], [692, 796], [714, 880], [700, 942], [654, 936], [624, 858]]);
  botLine(g, '#252c45', 7, [[652, 806], [676, 926]]);
  // the long thin parts under the receiver: rail, barrel and the tube beside it
  botPoly(g, BOT.gun, [[628, 990], [650, 982], [670, 1078], [650, 1086]]);
  for (const y of [1006, 1032, 1058]) botBall(g, '#1d2233', 644 + (y - 1006) * 0.2, y, 5, 0);
  botPoly(g, BOT.gun, [[658, 934], [706, 936], [718, 1012], [672, 1016]]);
  botPoly(g, BOT.gunLite, [[700, 946], [728, 950], [734, 1074], [708, 1076]]);
  botPoly(g, BOT.gunDark, [[670, 1010], [696, 1006], [732, 1096], [708, 1106]]);
  botPoly(g, BOT.gun, [[704, 1092], [742, 1082], [756, 1136], [718, 1148]]);
  botOval(g, '#14161f', 737, 1142, 18, 9, -0.25, 4);
  // the hexagonal block on its side, and the fingers round the grip
  botPoly(g, BOT.gun, [[614, 872], [656, 866], [674, 905], [656, 946], [618, 944], [600, 906]]);
  botPoly(g, BOT.gunLite, [[624, 896], [648, 894], [650, 920], [626, 922]], 5);
  botPoly(g, BOT.mid, [[640, 832], [686, 826], [694, 858], [646, 866]], 6);
  botLine(g, '#4a4066', 5, [[656, 832], [662, 862]]);
  if (firing) {
    botPoly(g, '#ffd65c', [[726, 1140], [704, 1190], [734, 1170], [746, 1220], [760, 1168], [792, 1182], [754, 1134]], 0);
    botPoly(g, '#fff3c0', [[732, 1142], [728, 1172], [742, 1162], [748, 1190], [756, 1158], [750, 1138]], 0);
  }
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
    feet: [0, 1, 2, 3].map((i) => botLayer(-26, -4, 28, 32, (g) => drawTrooperLegs(g, i))),
    torso: botLayer(-46, -56, 34, 20, drawTrooperBody),
    gun: botLayer(-18, -14, 40, 14, (g) => drawTrooperGun(g, false)),
    gunFire: botLayer(-18, -16, 56, 16, (g) => drawTrooperGun(g, true)),
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
