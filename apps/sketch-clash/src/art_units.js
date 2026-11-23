import { TAU, K } from './config.js?v=10';
import { makeLayer, rr, star, FEET_POSES, drawFeet, OUT } from './sprites.js?v=10';

// Art for the rest of the Army, drawn from the supplied showcase video.
// Same conventions as the soldier: art px, origin at the body centre, y
// down, facing right, feet about 25 below the centre.

// Pupil offsets for the idle gaze variants: right, centre, left.
export const GAZE3 = [[2.1, 0.6], [0, 0.6], [-2.1, 0.6]];

function eggBody(g, top, bot, rx = 20.7, ry = 23) {
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

function bigEyes(g, xs, gz, y = -4.8, rx = 5.2, ry = 5.8) {
  for (const x of xs) {
    g.fillStyle = '#fbfbf6';
    g.strokeStyle = OUT;
    g.lineWidth = 1.4;
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#121016';
    g.beginPath();
    g.arc(x + gz[0], y + gz[1], 3.3, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.9)';
    g.beginPath();
    g.arc(x + gz[0] - 1, y + gz[1] - 2, 0.95, 0, TAU);
    g.fill();
  }
}

function smile(g, mx, my, r = 4.4) {
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

// ---------------------------------------------------------------- flamethrower
function drawFlameBody(g, front, gz) {
  g.fillStyle = '#c63a2e';
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  rr(g, -31.5, -7, 14, 24, 3.2);
  g.fill();
  g.stroke();
  g.fillStyle = '#9e2c23';
  rr(g, -30, -5, 3.6, 20, 1.6);
  g.fill();
  g.fillStyle = '#55545c';
  rr(g, -28.5, -11, 7, 4.5, 1.2);
  g.fill();
  g.stroke();

  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.clip();
  const gr = g.createLinearGradient(0, -23, 0, 23);
  gr.addColorStop(0, '#2f2e36');
  gr.addColorStop(0.54, '#27262d');
  gr.addColorStop(0.55, '#dc4331');
  gr.addColorStop(1, '#b93025');
  g.fillStyle = gr;
  g.fillRect(-22, -24, 44, 48);
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-22, 2.4);
  g.lineTo(22, 2.4);
  g.stroke();
  g.restore();
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.stroke();

  for (const x of front ? [-8.6, 8.6] : [-1, 12.4]) {
    g.fillStyle = '#15141a';
    g.beginPath();
    g.arc(x, -7, 5.9, 0, TAU);
    g.fill();
    g.fillStyle = '#f2bf1f';
    g.beginPath();
    g.arc(x, -7, 4.4, 0, TAU);
    g.fill();
    g.fillStyle = '#e58a14';
    g.beginPath();
    g.arc(x + 0.7 + gz[0] * 0.3, -6.5, 2.1, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.85)';
    g.beginPath();
    g.arc(x - 1.5, -8.7, 1.1, 0, TAU);
    g.fill();
  }
  const fx = front ? 0 : 8;
  g.fillStyle = '#8f8f99';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.ellipse(fx, 0.9, 4.3, 3.3, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#3a3a42';
  g.beginPath();
  g.arc(fx - 1.5, 0.9, 0.8, 0, TAU);
  g.arc(fx + 1.5, 0.9, 0.8, 0, TAU);
  g.fill();
}

// Origin: where the nozzle leaves the hip. Points right.
function drawNozzle(g, firing) {
  g.fillStyle = '#4a4954';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  rr(g, -5, -3.3, 8, 6.6, 1.4);
  g.fill();
  g.stroke();
  g.fillStyle = '#f0ad3c';
  rr(g, 2, -2.6, 38, 5.2, 1.2);
  g.fill();
  g.stroke();
  g.fillStyle = '#c98421';
  g.fillRect(3, 0.6, 36, 1.7);
  g.fillStyle = '#ffe08a';
  g.fillRect(3, -2, 36, 1);
  g.fillStyle = '#ffd23a';
  rr(g, 38.5, -3.5, 5, 7, 1.2);
  g.fill();
  g.stroke();
  if (firing) {
    const r = g.createRadialGradient(46, 0, 1, 46, 0, 10);
    r.addColorStop(0, 'rgba(255, 244, 170, 1)');
    r.addColorStop(1, 'rgba(255, 150, 30, 0)');
    g.fillStyle = r;
    g.beginPath();
    g.arc(46, 0, 10, 0, TAU);
    g.fill();
  }
}

// ---------------------------------------------------------------- roman
function drawRomanBody(g, front, gz, angry) {
  eggBody(g, '#d33336', '#b92529');
  g.fillStyle = 'rgba(255, 255, 255, 0.22)';
  g.beginPath();
  g.ellipse(-11, -3, 3, 4.6, -0.2, 0, TAU);
  g.fill();

  const xs = front ? [-8.4, 8.4] : [-1.5, 12.8];
  bigEyes(g, xs, gz, -3.2, 4.8, 5);
  if (angry) {
    g.strokeStyle = OUT;
    g.lineWidth = 1.6;
    g.beginPath();
    for (const x of xs) {
      g.moveTo(x - 5.4, -9);
      g.lineTo(x + 4.6, -6.2);
    }
    g.stroke();
  }
  if (front) smile(g, 0, 5, 4.2);
  else {
    g.strokeStyle = OUT;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(3.5, 8);
    g.lineTo(11, 8);
    g.stroke();
  }

  dome(g, '#d43234', 18.8, 11.5, -13);
  g.fillStyle = '#f0a53a';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  rr(g, -23, -15.3, 46, 7, 3.4);
  g.fill();
  g.stroke();
  g.fillStyle = '#f8c968';
  g.fillRect(-19, -14, 38, 1.4);
  g.fillStyle = '#d6322f';
  g.strokeStyle = '#f6efe6';
  g.lineWidth = 1.4;
  g.beginPath();
  g.ellipse(-8, -25.6, 4.2, 3, 0, 0, TAU);
  g.fill();
  g.stroke();
}

// Origin: where the spear is gripped. Shaft runs along +x.
function drawSpear(g) {
  g.strokeStyle = OUT;
  g.lineWidth = 3.8;
  g.lineCap = 'butt';
  g.beginPath();
  g.moveTo(-17, 0);
  g.lineTo(36, 0);
  g.stroke();
  g.strokeStyle = '#c8923c';
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(-16.5, 0);
  g.lineTo(36, 0);
  g.stroke();
  g.lineCap = 'round';
  g.fillStyle = '#8a5a2b';
  g.fillRect(33, -2.2, 2.6, 4.4);
  g.fillStyle = '#b9bcc6';
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(35.5, -3.4);
  g.lineTo(47, 0);
  g.lineTo(35.5, 3.4);
  g.closePath();
  g.fill();
  g.stroke();
}

// Origin: the middle of the shield.
function drawShield(g) {
  g.fillStyle = '#e8a42c';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  rr(g, -5.2, -13.5, 10.4, 27, 2.2);
  g.fill();
  g.stroke();
  g.fillStyle = '#f5c35c';
  g.fillRect(-3.4, -11.5, 2.2, 23);
  g.fillStyle = '#f6e7b0';
  g.strokeStyle = '#7b5a22';
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(0, 0, 3.4, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#b98a2c';
  g.beginPath();
  g.arc(0, 0, 1.3, 0, TAU);
  g.fill();
}

// ---------------------------------------------------------------- grenadier
function drawGrenBody(g, front, gz) {
  eggBody(g, '#66b1bd', '#4f95a2');
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.clip();
  g.lineCap = 'butt';
  g.strokeStyle = OUT;
  g.lineWidth = 8.6;
  g.beginPath();
  g.moveTo(-18, -16);
  g.lineTo(19, 15);
  g.stroke();
  g.strokeStyle = '#8c5a2e';
  g.lineWidth = 6.4;
  g.beginPath();
  g.moveTo(-18, -16);
  g.lineTo(19, 15);
  g.stroke();
  g.strokeStyle = '#b07a43';
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(-17, -19);
  g.lineTo(20, 12);
  g.stroke();
  g.lineCap = 'round';
  g.restore();
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.stroke();

  bigEyes(g, front ? [-8.4, 8.4] : [-1.8, 12.6], gz, -4.4);
  if (!front) {
    g.fillStyle = '#f2b22c';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(21.4, -2.6, 2.4, 1.5, 0, 0, TAU);
    g.fill();
    g.stroke();
  }
  if (front) smile(g, 0, 4, 4.2);
  else smile(g, 6.6, 3.8, 3.6);

  dome(g, '#3c4a36', 18.8, 12, -12.7);
  g.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  g.lineWidth = 1.4;
  g.beginPath();
  g.ellipse(0, -12.7, 15.5, 9.2, 0, Math.PI * 1.08, Math.PI * 1.42);
  g.stroke();
  g.fillStyle = '#1b1920';
  rr(g, -23.5, -14.3, 49, 3.6, 1.8);
  g.fill();
}

// Origin: the middle of the bomb.
function drawBomb(g, lit) {
  g.fillStyle = '#1e1d24';
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  g.beginPath();
  g.arc(0, 0, 6.6, 0, TAU);
  g.fill();
  g.stroke();
  g.strokeStyle = '#6b6b78';
  g.lineWidth = 1.4;
  g.beginPath();
  g.arc(0, 0, 4.4, Math.PI * 1.1, Math.PI * 1.55);
  g.stroke();
  g.strokeStyle = '#9a7a4a';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(2, -6.2);
  g.quadraticCurveTo(4, -9, 6, -9.4);
  g.stroke();
  if (lit) star(g, 6.4, -9.8, 4.4, 1.9);
}

// ---------------------------------------------------------------- archer
function drawArcherBody(g, front, gz) {
  eggBody(g, '#9e81c7', '#8567af');
  bigEyes(g, front ? [-8.4, 8.4] : [-1.8, 12.6], gz, -3.6);
  if (front) smile(g, 0, 4.6, 4.2);
  else smile(g, 6.8, 4.2, 3.8);

  // a soft green cap, swept back into a point at the upper left
  const cg = g.createLinearGradient(0, -31, 0, -8);
  cg.addColorStop(0, '#5a9a4c');
  cg.addColorStop(1, '#46803c');
  g.fillStyle = cg;
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.moveTo(-20.4, -7.5);
  g.bezierCurveTo(-23, -17, -21, -27, -15, -31);
  g.bezierCurveTo(-8, -30, 6, -28, 13.5, -19);
  g.bezierCurveTo(17, -15, 19, -11.5, 20, -7);
  g.quadraticCurveTo(0, -12, -20.4, -7.5);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(-15, -26);
  g.quadraticCurveTo(-2, -26, 8, -21);
  g.stroke();
}

// Origin: the grip. The bow bulges toward +x; the string is on the left.
function drawBow(g, drawn) {
  g.lineCap = 'round';
  g.strokeStyle = OUT;
  g.lineWidth = 4.8;
  g.beginPath();
  g.moveTo(0, -23);
  g.quadraticCurveTo(13, 0, 0, 23);
  g.stroke();
  g.strokeStyle = '#d6a13a';
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(0, -23);
  g.quadraticCurveTo(13, 0, 0, 23);
  g.stroke();
  g.fillStyle = '#6b4a22';
  g.fillRect(5.2, -3.2, 2.6, 6.4);
  g.strokeStyle = 'rgba(70, 58, 44, 0.95)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, -23);
  if (drawn) g.lineTo(-10, 0);
  g.lineTo(0, 23);
  g.stroke();
}

// Origin: the nock. Points right; used in hand and in flight.
function drawArrow(g) {
  g.strokeStyle = OUT;
  g.lineWidth = 2.6;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(30, 0);
  g.stroke();
  g.strokeStyle = '#8a6a3c';
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(30, 0);
  g.stroke();
  g.fillStyle = '#d83a35';
  g.strokeStyle = OUT;
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(-3, -3.4);
  g.lineTo(5, -0.3);
  g.lineTo(5, 0.3);
  g.lineTo(-3, 3.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#b9bcc6';
  g.beginPath();
  g.moveTo(29.5, -2.6);
  g.lineTo(38, 0);
  g.lineTo(29.5, 2.6);
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

// Origin: the hand. The shaft runs along +x.
function drawLance(g) {
  g.lineCap = 'butt';
  g.strokeStyle = OUT;
  g.lineWidth = 3.6;
  g.beginPath();
  g.moveTo(-18, 0);
  g.lineTo(58, 0);
  g.stroke();
  g.strokeStyle = '#c8923c';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-17.5, 0);
  g.lineTo(58, 0);
  g.stroke();
  g.lineCap = 'round';
  g.fillStyle = '#b9bcc6';
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(56, -3.2);
  g.lineTo(70, 0);
  g.lineTo(56, 3.2);
  g.closePath();
  g.fill();
  g.stroke();
}

// ---------------------------------------------------------------- cavalry (the horse)
const LEGS = [
  // [hipX, [foot dx per gait pose]]  gait: stretched, gathered, reversed, gathered
  [21, [11, 2, -9, 3]],
  [14, [14, 4, -5, 5]],
  [-14, [-12, -3, 9, -2]],
  [-21, [-15, -5, 7, -4]],
];

function drawHorse(g, gait) {
  // far legs first, then the body, then the near legs
  const leg = (hipX, dx, near) => {
    g.strokeStyle = OUT;
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(hipX, 8);
    g.quadraticCurveTo(hipX + dx * 0.4, 18, hipX + dx, 26);
    g.stroke();
    g.strokeStyle = near ? '#dcd6c6' : '#bdb8ab';
    g.lineWidth = 2.4;
    g.beginPath();
    g.moveTo(hipX, 8);
    g.quadraticCurveTo(hipX + dx * 0.4, 18, hipX + dx, 26);
    g.stroke();
    g.fillStyle = '#3a3a40';
    g.beginPath();
    g.ellipse(hipX + dx + 0.6, 27, 2.6, 1.8, 0, 0, TAU);
    g.fill();
  };
  leg(LEGS[1][0], LEGS[1][1][gait], false);
  leg(LEGS[3][0], LEGS[3][1][gait], false);

  // tail
  g.strokeStyle = OUT;
  g.lineWidth = 5.2;
  g.beginPath();
  g.moveTo(-29, -5);
  g.bezierCurveTo(-42, -6, -46, 6, -44, 14);
  g.stroke();
  g.strokeStyle = '#55494f';
  g.lineWidth = 3.4;
  g.beginPath();
  g.moveTo(-29, -5);
  g.bezierCurveTo(-42, -6, -46, 6, -44, 14);
  g.stroke();

  // neck, head
  g.fillStyle = '#e7e0cf';
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(16, -8);
  g.lineTo(29, -27);
  g.lineTo(38, -20);
  g.lineTo(27, 2);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(39.5, -23.5, 10.5, 6, 0.55, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#d7d0be';
  g.beginPath();
  g.ellipse(45, -20, 4.4, 3.4, 0.55, 0, TAU);
  g.fill();
  g.fillStyle = '#2a2830';
  g.beginPath();
  g.arc(38, -26, 1.2, 0, TAU);
  g.arc(48, -20, 0.9, 0, TAU);
  g.fill();
  g.fillStyle = '#e7e0cf';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(31, -29);
  g.lineTo(33, -36);
  g.lineTo(36, -28);
  g.closePath();
  g.fill();
  g.stroke();
  // mane
  g.strokeStyle = '#4a4350';
  g.lineWidth = 3.2;
  g.beginPath();
  g.moveTo(31, -31);
  g.quadraticCurveTo(22, -22, 16, -12);
  g.stroke();

  // body
  const gr = g.createLinearGradient(0, -14, 0, 14);
  gr.addColorStop(0, '#eee8d8');
  gr.addColorStop(1, '#d9d2bf');
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 31, 13.6, 0, 0, TAU);
  g.fill();
  g.stroke();

  leg(LEGS[0][0], LEGS[0][1][gait], true);
  leg(LEGS[2][0], LEGS[2][1][gait], true);
}

// Origin: the rider's body centre.
function drawRider(g) {
  const gr = g.createLinearGradient(0, -11, 0, 11);
  gr.addColorStop(0, '#f6d04c');
  gr.addColorStop(1, '#e0aa28');
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  g.beginPath();
  g.ellipse(0, 0, 10, 11.5, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#1b1920';
  g.beginPath();
  g.arc(2.6, -1, 1.3, 0, TAU);
  g.arc(7.4, -1, 1.3, 0, TAU);
  g.fill();
  g.strokeStyle = OUT;
  g.lineWidth = 1;
  g.beginPath();
  g.arc(5, 3.2, 2.4, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();
  g.fillStyle = '#a9aeb8';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  g.ellipse(0, -7, 9.2, 7, 0, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#3b3d46';
  rr(g, -11, -7.6, 22, 2.8, 1.4);
  g.fill();
  g.fillStyle = '#d8c24a';
  g.beginPath();
  g.arc(0, -14.4, 1.6, 0, TAU);
  g.fill();
}

// ---------------------------------------------------------------- ninja
function drawNinjaBody(g, front, gz) {
  // headband tails, behind the head
  g.fillStyle = '#d92b2f';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-18, -13);
  g.quadraticCurveTo(-30, -20, -37, -13);
  g.quadraticCurveTo(-30, -12, -22, -9.5);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(-19, -11);
  g.quadraticCurveTo(-31, -7, -38, 0);
  g.quadraticCurveTo(-30, -6, -21, -7);
  g.closePath();
  g.fill();
  g.stroke();

  eggBody(g, '#3d3b47', '#25242c');
  // the opening of the hood
  g.fillStyle = '#d9c5a2';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  rr(g, -17.5, -11.5, 35, 11.5, 5);
  g.fill();
  g.stroke();
  const xs = front ? [-7.4, 7.4] : [-1, 11];
  for (const x of xs) {
    g.fillStyle = '#fbfbf6';
    g.strokeStyle = OUT;
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(x, -5.6, 4.6, 3.7, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#121016';
    g.beginPath();
    g.arc(x + gz[0] * 0.8, -5.4, 2.4, 0, TAU);
    g.fill();
  }
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(front ? -6 : -1, -9);
  g.lineTo(front ? -1.5 : 3, -8.4);
  g.moveTo(front ? 6 : 12, -9);
  g.lineTo(front ? 1.5 : 7, -8.4);
  g.stroke();

  // the red headband
  g.fillStyle = '#d92b2f';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  rr(g, -21, -17.4, 42, 5.4, 2.4);
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.25)';
  g.fillRect(-18, -16.6, 36, 1.2);
  g.fillStyle = '#d92b2f';
  g.beginPath();
  g.arc(-21, -14.7, 3.1, 0, TAU);
  g.fill();
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
function ghostBody(g, tint, edge) {
  g.fillStyle = tint;
  g.strokeStyle = edge;
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-15, 18);
  g.lineTo(-15, -6);
  g.bezierCurveTo(-15, -22, 15, -22, 15, -6);
  g.lineTo(15, 18);
  g.quadraticCurveTo(10, 11, 5, 18);
  g.quadraticCurveTo(0, 25, -5, 18);
  g.quadraticCurveTo(-10, 11, -15, 18);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#7a7c8a';
  g.beginPath();
  g.ellipse(-5.5, -4, 2.2, 3, 0, 0, TAU);
  g.ellipse(5.5, -4, 2.2, 3, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(0, 6, 2.2, 3, 0, 0, TAU);
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
  roman(g) {
    g.fillStyle = '#d43234';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 0, 10.5, 8, 0, 0, Math.PI);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#f0a53a';
    rr(g, -13, -4, 26, 4.6, 2.2);
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
    g.fillStyle = '#4d8a46';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-11, 2);
    g.quadraticCurveTo(-12, -8, -4, -10);
    g.quadraticCurveTo(7, -7, 11, 2);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#3a6c36';
    g.beginPath();
    g.ellipse(0, 2, 12.5, 2.6, 0, 0, TAU);
    g.fill();
    g.stroke();
  },
  cavalry(g) {
    DROPS.knight(g);
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
    g.fillStyle = '#d92b2f';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    rr(g, -11, -2, 22, 4.2, 2);
    g.fill();
    g.stroke();
  },
};

// Light, tinted ghosts that keep the unit's headgear.
const GHOSTS = {
  flamethrower: ['#f2dcd8', '#c9aaa6', (g) => dome(g, '#2f2e36', 11, 8, -10)],
  roman: ['#f8d9dc', '#cfa7ac', (g) => {
    dome(g, '#d43234', 11, 8, -10);
    g.fillStyle = '#f0a53a';
    rr(g, -13.5, -12.5, 27, 4.6, 2.2);
    g.fill();
    g.stroke();
  }],
  grenadier: ['#d6ecf0', '#a3c4ca', (g) => dome(g, '#3c4a36', 12, 8, -10)],
  archer: ['#e6dcf2', '#b9aacd', (g) => {
    g.fillStyle = '#4d8a46';
    g.strokeStyle = OUT;
    g.lineWidth = 1.2;
    g.beginPath();
    g.moveTo(-12, -8);
    g.quadraticCurveTo(-14, -16, -8, -19);
    g.quadraticCurveTo(4, -17, 12, -8);
    g.closePath();
    g.fill();
    g.stroke();
  }],
  ninja: ['#dedee4', '#aeaeb8', (g) => {
    g.fillStyle = '#d92b2f';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    rr(g, -13, -13, 26, 4, 2);
    g.fill();
    g.stroke();
  }],
  knight: ['#faf1cf', '#d6c78f', (g) => dome(g, '#a9aeb8', 11.5, 8, -10)],
  cavalry: ['#f1ede2', '#c9c3b2', (g) => dome(g, '#a9aeb8', 11.5, 8, -10)],
};

// ---------------------------------------------------------------- build
function feetSet(color) {
  return FEET_POSES.map((pose) => makeLayer(-30, 16, 32, 38, (g) => drawFeet(g, pose, true, color)));
}

function eggSet(drawBody, gazes = GAZE3, extra = {}) {
  return {
    torso: makeLayer(-40, -34, 36, 26, (g) => drawBody(g, false, gazes[0], false)),
    torsoAngry: makeLayer(-40, -34, 36, 26, (g) => drawBody(g, false, gazes[0], true)),
    torsoFront: gazes.map((gz) => makeLayer(-40, -34, 36, 26, (g) => drawBody(g, true, gz, false))),
    ...extra,
  };
}

export function buildUnitArt() {
  const dark = feetSet('#25232e');
  const art = {};

  art.flamethrower = {
    feet: dark,
    ...eggSet(drawFlameBody),
    nozzle: makeLayer(-8, -14, 58, 14, (g) => drawNozzle(g, false)),
    nozzleFire: makeLayer(-8, -14, 58, 14, (g) => drawNozzle(g, true)),
  };

  art.roman = {
    feet: feetSet('#6b4023'),
    ...eggSet(drawRomanBody),
    spear: makeLayer(-20, -6, 50, 6, drawSpear),
    shield: makeLayer(-8, -16, 8, 16, drawShield),
  };

  art.grenadier = {
    feet: dark,
    ...eggSet(drawGrenBody),
    bomb: makeLayer(-10, -18, 12, 9, (g) => drawBomb(g, false)),
    bombLit: makeLayer(-10, -18, 12, 9, (g) => drawBomb(g, true)),
  };

  art.archer = {
    feet: dark,
    ...eggSet(drawArcherBody),
    bow: makeLayer(-14, -27, 12, 27, (g) => drawBow(g, false)),
    bowDrawn: makeLayer(-14, -27, 12, 27, (g) => drawBow(g, true)),
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

  art.cavalry = {
    horse: [0, 1, 2, 3].map((gait) => makeLayer(-50, -40, 56, 32, (g) => drawHorse(g, gait))),
    rider: makeLayer(-14, -18, 14, 14, drawRider),
    lance: makeLayer(-20, -6, 72, 6, drawLance),
    shadow: makeLayer(-46, 18, 50, 36, (g) => {
      g.save();
      g.translate(2, 27);
      g.scale(1, 0.18);
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
    art[id].ghost = makeLayer(-30, -34, 30, 28, (g) => {
      ghostBody(g, tint, edge);
      g.save();
      g.translate(0, -3);
      head(g);
      g.restore();
    });
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
