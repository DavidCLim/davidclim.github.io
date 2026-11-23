import { TAU, K } from './config.js?v=25';
import { makeLayer, rr, star, FEET_POSES, drawFeet, OUT } from './sprites.js?v=25';

// Art for the rest of the Army, drawn from the supplied showcase video.
// Same conventions as the soldier: art px, origin at the body centre, y
// down, facing right, feet about 25 below the centre.

// Pupil offsets for the idle gaze variants: right, centre, left.
export const GAZE3 = [[1.6, -2], [0, -2.5], [-1.6, -2]];

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
  rr(g, -27, -12, 10, 26, 2.4);
  g.fill();
  g.stroke();

  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.clip();
  const gr = g.createLinearGradient(0, -23, 0, 23);
  gr.addColorStop(0, '#2f2e36');
  gr.addColorStop(0.58, '#27262d');
  gr.addColorStop(0.59, '#c8392c');
  gr.addColorStop(1, '#b02f24');
  g.fillStyle = gr;
  g.fillRect(-22, -24, 44, 48);
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.restore();
  g.fillStyle = 'rgba(255, 255, 255, 0.13)';
  g.beginPath();
  g.ellipse(-11, -11, 3.4, 7, 0.4, 0, TAU);
  g.fill();
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
  const fx = front ? 0 : 7;
  g.fillStyle = '#868892';
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  g.beginPath();
  g.ellipse(fx, 4.4, 5.3, 4.3, 0, 0, TAU);
  g.fill();
  g.stroke();
}

// Origin: where the nozzle leaves the hip. Points right.
function drawNozzle(g, firing) {
  g.fillStyle = '#e9a53a';
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  rr(g, 0, -2, 40, 4, 1.3);
  g.fill();
  g.stroke();
  g.fillStyle = '#fbd36a';
  g.fillRect(1.5, -1.3, 36, 0.9);
  g.fillStyle = firing ? '#fff2a8' : '#f2872a';
  g.beginPath();
  g.arc(41.5, 0, 2.5, 0, TAU);
  g.fill();
  if (firing) {
    const r = g.createRadialGradient(44, 0, 1, 44, 0, 9);
    r.addColorStop(0, 'rgba(255, 240, 160, 0.95)');
    r.addColorStop(1, 'rgba(255, 150, 30, 0)');
    g.fillStyle = r;
    g.beginPath();
    g.arc(44, 0, 9, 0, TAU);
    g.fill();
  }
}

// ---------------------------------------------------------------- roman
function drawRomanBody(g, front, gz, angry) {
  eggBody(g, '#d82f3f', '#b8222f');
  g.fillStyle = 'rgba(255, 255, 255, 0.2)';
  g.beginPath();
  g.ellipse(-11, -3, 2.6, 5.4, -0.15, 0, TAU);
  g.fill();

  // big eyes under the visor; the far one is half hidden by the spear
  const xs = front ? [-8, 8] : [-3.5, 13.5];
  for (const x of xs) {
    g.fillStyle = '#fbf1ee';
    g.strokeStyle = OUT;
    g.lineWidth = 1.1;
    g.beginPath();
    g.ellipse(x, 1.6, 5.8, 4.8, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#17100f';
    g.beginPath();
    g.arc(x + gz[0] * 1.3, 1.4 + gz[1] * 0.6, 2.7, 0, TAU);
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(x, 1.6, 5.8, 4.8, 0, Math.PI * 1.05, Math.PI * 1.95);
    g.stroke();
  }
  if (angry) {
    g.strokeStyle = OUT;
    g.lineWidth = 2.2;
    g.beginPath();
    for (const x of xs) {
      g.moveTo(x - 6, -5.6);
      g.lineTo(x + 6, -2);
    }
    g.stroke();
  }
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  if (front) g.arc(0, 9, 3.4, Math.PI * 0.15, Math.PI * 0.85);
  else g.arc(7.5, 9.4, 3, Math.PI * 0.12, Math.PI * 0.8);
  g.stroke();

  // the small red dome (with a shine), a diamond crest, and the visor
  const dg = g.createLinearGradient(0, -25, 0, -12);
  dg.addColorStop(0, '#ec3b48');
  dg.addColorStop(1, '#cc2a38');
  g.fillStyle = dg;
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(-1, -14, 15.5, 13, 0, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.35)';
  g.beginPath();
  g.ellipse(-4, -24, 5.5, 1.8, -0.1, 0, TAU);
  g.fill();
  g.strokeStyle = '#f7e9e6';
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(-12.5, -26);
  g.lineTo(-9.8, -28.8);
  g.lineTo(-7.1, -26);
  g.lineTo(-9.8, -23.2);
  g.closePath();
  g.stroke();
  g.fillStyle = '#eda83f';
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-21, -8.4);
  g.quadraticCurveTo(-20.5, -17.2, -2, -17.4);
  g.quadraticCurveTo(17, -17.6, 22.5, -8.4);
  g.quadraticCurveTo(1, -5.4, -21, -8.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.3)';
  g.beginPath();
  g.moveTo(-14, -13.8);
  g.quadraticCurveTo(-2, -16.2, 14, -13.8);
  g.quadraticCurveTo(-2, -14.6, -14, -13.8);
  g.fill();
}

// Origin: the hand. A thin gold shaft with a round grey head.
function drawSpear(g) {
  g.lineCap = 'butt';
  g.strokeStyle = OUT;
  g.lineWidth = 3.1;
  g.beginPath();
  g.moveTo(-10, 0);
  g.lineTo(44, 0);
  g.stroke();
  g.strokeStyle = '#d9a64a';
  g.lineWidth = 1.9;
  g.beginPath();
  g.moveTo(-9.5, 0);
  g.lineTo(44, 0);
  g.stroke();
  // twisted-rope stripes along the shaft
  g.strokeStyle = 'rgba(120, 78, 30, 0.6)';
  g.lineWidth = 0.8;
  g.beginPath();
  for (let x = -8; x < 42; x += 5) {
    g.moveTo(x, -1.5);
    g.lineTo(x + 2, 1.5);
  }
  g.stroke();
  // the broad grey leaf of the head
  g.lineCap = 'round';
  g.fillStyle = '#a9adb8';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(40, -1.2);
  g.quadraticCurveTo(45, -4.4, 55, 0);
  g.quadraticCurveTo(45, 4.4, 40, 1.2);
  g.closePath();
  g.fill();
  g.stroke();
}

// Origin: the middle of the shield.
function drawShield(g) {
  g.fillStyle = '#eaa534';
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  rr(g, -4.6, -13.5, 9.2, 27, 1.6);
  g.fill();
  g.stroke();
  g.fillStyle = '#f6c564';
  g.fillRect(-3.2, -11.8, 1.8, 23.6);
  g.fillStyle = '#aeb4c0';
  g.strokeStyle = '#4b4f5c';
  g.lineWidth = 1.1;
  g.beginPath();
  g.arc(0, 0, 2.6, 0, TAU);
  g.fill();
  g.stroke();
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
  g.lineWidth = 6.2;
  g.beginPath();
  g.moveTo(-18, -16);
  g.lineTo(19, 15);
  g.stroke();
  g.strokeStyle = '#7d4b1f';
  g.lineWidth = 4.4;
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
  g.scale(1.22, 1.22);
  g.fillStyle = '#1b1a20';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  g.arc(0, 0, 6.6, 0, TAU);
  g.fill();
  g.stroke();
  // the little pale highlight
  g.fillStyle = '#9a9ba8';
  g.beginPath();
  g.arc(-0.6, -0.4, 1.7, 0, TAU);
  g.fill();
  // a small yellow spark beside the fuse
  g.fillStyle = '#ffd84a';
  g.strokeStyle = '#e8902a';
  g.lineWidth = 0.7;
  g.beginPath();
  for (let i = 0; i < 8; i++) {
    const r = i % 2 === 0 ? 3.4 : 1.2;
    const a = (i / 8) * TAU - Math.PI / 2;
    const px = 6.6 + Math.cos(a) * r;
    const py = -7.4 + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
  g.stroke();
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
  g.lineWidth = 3.4;
  g.beginPath();
  g.moveTo(0, -19);
  g.quadraticCurveTo(12, 0, 0, 19);
  g.stroke();
  g.strokeStyle = '#d49e4e';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(0, -19);
  g.quadraticCurveTo(12, 0, 0, 19);
  g.stroke();
  g.strokeStyle = '#efe3c4';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(0, -19);
  if (drawn) g.lineTo(-10, 0);
  g.lineTo(0, 19);
  g.stroke();
}

// Origin: the nock. Points right; used in hand and in flight.
function drawArrow(g) {
  g.strokeStyle = '#5a4030';
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(31, 0);
  g.stroke();
  g.fillStyle = '#e03a35';
  g.beginPath();
  g.moveTo(-3.5, -2.6);
  g.lineTo(4.5, -0.2);
  g.lineTo(4.5, 0.2);
  g.lineTo(-3.5, 2.6);
  g.closePath();
  g.fill();
  g.fillStyle = '#9aa0ae';
  g.strokeStyle = '#3a3c48';
  g.lineWidth = 0.7;
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

  eggBody(g, '#383742', '#2b2a33');
  g.fillStyle = 'rgba(255, 255, 255, 0.07)';
  g.beginPath();
  g.ellipse(0, 11, 18, 11, 0, 0, TAU);
  g.fill();
  g.strokeStyle = 'rgba(10, 9, 14, 0.55)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-19.5, 4);
  g.quadraticCurveTo(0, 9, 19.5, 4);
  g.stroke();
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
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-15, 20);
  g.lineTo(-15.5, -4);
  g.bezierCurveTo(-16, -24, 16, -24, 15.5, -4);
  g.lineTo(15, 20);
  g.quadraticCurveTo(10, 14, 5, 20);
  g.quadraticCurveTo(0, 14, -5, 20);
  g.quadraticCurveTo(-10, 14, -15, 20);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#9b9ba6';
  g.beginPath();
  g.ellipse(-5.5, -4, 2.4, 3.4, 0, 0, TAU);
  g.ellipse(5.5, -4, 2.4, 3.4, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(0, 6, 1.9, 2.6, 0, 0, TAU);
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
    g.fillStyle = '#e8647a';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 1, 10, 6.5, 0, 0, Math.PI);
    g.closePath();
    g.fill();
    g.stroke();
    g.fillStyle = '#f0a63c';
    g.beginPath();
    g.moveTo(-13, -4);
    g.quadraticCurveTo(0, -6, 13, -4);
    g.quadraticCurveTo(10, 2, 0, 2);
    g.quadraticCurveTo(-10, 2, -13, -4);
    g.closePath();
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
    // the cap comes off as a curled green crescent
    g.fillStyle = '#4d8a46';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-12, 3);
    g.bezierCurveTo(-13, -8, -4, -12, 6, -9);
    g.bezierCurveTo(12, -7, 14, -1, 14, 3);
    g.quadraticCurveTo(0, -3, -12, 3);
    g.closePath();
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
  flamethrower: ['#f6efe9', '#d5cbc4', (g) => dome(g, '#2f2e36', 11, 8, -10)],
  roman: ['#f9eded', '#d9c4c4', (g) => {
    dome(g, '#d43234', 11, 8, -10);
    g.fillStyle = '#f0a53a';
    rr(g, -13.5, -12.5, 27, 4.6, 2.2);
    g.fill();
    g.stroke();
  }],
  grenadier: ['#ecf4f4', '#c4d3d3', (g) => dome(g, '#3c4a36', 12, 8, -10)],
  archer: ['#f1ecf6', '#cfc6d8', (g) => {
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
  ninja: ['#eeedf0', '#cbcad0', (g) => {
    g.fillStyle = '#d92b2f';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    rr(g, -13, -13, 26, 4, 2);
    g.fill();
    g.stroke();
  }],
  knight: ['#f9f4dd', '#dad2ac', (g) => dome(g, '#a9aeb8', 11.5, 8, -10)],
  cavalry: ['#f5f1e6', '#d8d2c2', (g) => dome(g, '#a9aeb8', 11.5, 8, -10)],
};

// ---------------------------------------------------------------- build
function feetSet(color) {
  return FEET_POSES.map((pose) => makeLayer(-30, 16, 32, 38, (g) => drawFeet(g, pose, true, color)));
}

function eggSet(drawBody, gazes = GAZE3, extra = {}) {
  return {
    torso: makeLayer(-40, -34, 36, 26, (g) => drawBody(g, false, gazes[0], false)),
    torsoAngry: makeLayer(-40, -34, 36, 26, (g) => drawBody(g, false, gazes[0], true)),
    // standing around they face the same way as when fighting, eyes wandering
    torsoSide: gazes.map((gz) => makeLayer(-40, -34, 36, 26, (g) => drawBody(g, false, gz, false))),
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
    // the Romans' pupils drift up and to the sides, the first (used for the icon) looks down-left
    ...eggSet(drawRomanBody, [[-1.7, 0.7], [0.6, -1.8], [1.7, -1.3]]),
    spear: makeLayer(-20, -6, 50, 6, drawSpear),
    shield: makeLayer(-8, -16, 8, 16, drawShield),
  };

  art.grenadier = {
    feet: dark,
    ...eggSet(drawGrenBody),
    bomb: makeLayer(-10, -18, 14, 10, (g) => drawBomb(g, false)),
    bombLit: makeLayer(-10, -18, 14, 10, (g) => drawBomb(g, true)),
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
    horse: [0, 1, 2, 3, 4].map((gait) => makeLayer(-50, -40, 56, 32, (g) => {
      g.translate(0, 4.7);
      g.scale(0.82, 0.82);
      drawHorse(g, gait);
    })),
    rider: makeLayer(-14, -18, 14, 14, drawRider),
    lance: makeLayer(-20, -6, 72, 6, drawLance),
    shadow: makeLayer(-46, 18, 50, 36, (g) => {
      g.save();
      g.translate(2, 27);
      g.scale(0.82, 0.16);
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
