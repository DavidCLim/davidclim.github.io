import { TAU, K } from './config.js?v=71';
import { makeLayer, rr, star, FEET_POSES, drawFeet, OUT, drawSniperBody, drawSniperEyes, drawSniperHat } from './sprites.js?v=71';

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
    g.fillStyle = '#f7c317';
    g.beginPath();
    g.arc(x, -7, 4.6, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.9)';
    g.beginPath();
    g.arc(x - 1.7, -8.8, 1.5, 0, TAU);
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
  rr(g, 0, -3.2, 40, 6.4, 1.4);
  g.fill();
  g.stroke();
  g.fillStyle = '#f6c866';
  g.fillRect(1.5, -2.3, 36, 1.4);
  g.fillStyle = '#c98a22';
  g.fillRect(1.5, 1.2, 36, 1.3);
  g.fillStyle = firing ? '#fff2a8' : '#f58a2c';
  g.beginPath();
  g.arc(41.5, 0, 3.5, 0, TAU);
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
  // egg: bright red, lit from the upper left
  const gr = g.createLinearGradient(-14, -22, 16, 24);
  gr.addColorStop(0, '#e23c3e');
  gr.addColorStop(0.45, '#d3252d');
  gr.addColorStop(1, '#b21c25');
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.9;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.22)';
  g.beginPath();
  g.ellipse(-12, 2, 3.4, 8, 0.1, 0, TAU);
  g.fill();

  // The eyes, measured off the large icon: a white egg with a heavy outline and
  // a big black pupil pushed against its right edge; the far eye is mostly behind
  // the spear, its pupil jammed against the body's edge.
  const eyes = front ? [[-8, -7.2, 4.5, 3.6, 1.2], [8, -7.2, 4.5, 3.6, 1.2]] : [[-2.4, -7, 4.7, 3.7, 1.9], [12.8, -7, 4.7, 3.7, 2.6]];
  eyes.forEach(([x, y, rx, ry, px], i) => {
    g.save();
    g.translate(x, y);
    g.rotate(i === 0 ? -0.1 : 0.04);
    g.fillStyle = '#fbf4f1';
    g.strokeStyle = OUT;
    g.lineWidth = 2;
    g.beginPath();
    g.ellipse(0, 0, rx, ry, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#0d0a0b';
    g.beginPath();
    g.arc(px + gz[0] * 0.4, 0.3 + gz[1] * 0.3, 2.7, 0, TAU);
    g.fill();
    if (angry) {
      g.strokeStyle = OUT;
      g.lineWidth = 2.6;
      g.beginPath();
      g.moveTo(-6.4, -3.6);
      g.lineTo(6, 0.2);
      g.stroke();
    }
    g.restore();
  });
  // the mouth: a short curl that starts with a little hook and sweeps right
  g.strokeStyle = OUT;
  g.lineWidth = 1.9;
  g.beginPath();
  if (front) {
    g.arc(0, 4, 3.4, Math.PI * 0.15, Math.PI * 0.85);
  } else {
    g.moveTo(3.4, 3.6);
    g.quadraticCurveTo(4, 5.8, 6.6, 5.8);
    g.quadraticCurveTo(8.2, 5.9, 9.6, 7.2);
  }
  g.stroke();

  // red dome of the helmet, a half-ellipse sitting on the visor
  const dg = g.createLinearGradient(0, -32, 0, -20);
  dg.addColorStop(0, '#f24545');
  dg.addColorStop(1, '#cc2026');
  g.fillStyle = dg;
  g.strokeStyle = OUT;
  g.lineWidth = 1.9;
  g.beginPath();
  g.ellipse(-1.6, -13, 16.2, 18.6, 0, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.4)';
  g.beginPath();
  g.ellipse(-5, -28.2, 6.2, 1.6, -0.12, 0, TAU);
  g.fill();
  // the orange visor: a half-disc with a flat underside, as wide as the body
  g.fillStyle = '#eda83f';
  g.strokeStyle = OUT;
  g.lineWidth = 1.9;
  g.beginPath();
  g.ellipse(0, -10.8, 20.6, 10.4, 0, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.28)';
  g.beginPath();
  g.ellipse(-3, -16, 12, 1.5, 0, 0, TAU);
  g.fill();
}

// Origin: the hand. A thin gold shaft with a round grey head.
function drawSpear(g) {
  g.lineCap = 'butt';
  g.strokeStyle = OUT;
  g.lineWidth = 3.6;
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(52, 0);
  g.stroke();
  g.strokeStyle = '#e1a645';
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(0.4, 0);
  g.lineTo(52, 0);
  g.stroke();
  g.strokeStyle = 'rgba(255, 224, 150, 0.8)';
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(1, -0.4);
  g.lineTo(52, -0.4);
  g.stroke();
  // the broad grey head
  g.lineCap = 'round';
  g.fillStyle = '#a3a8b4';
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  g.beginPath();
  g.ellipse(55.5, 0, 7.4, 3.2, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.45)';
  g.beginPath();
  g.ellipse(55, -0.8, 5, 1.3, 0, 0, TAU);
  g.fill();
}

// Origin: the middle of the shield.
function drawShield(g) {
  g.fillStyle = '#eca83d';
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  rr(g, -5.65, -16.5, 11.3, 33, 1.5);
  g.fill();
  g.stroke();
  g.fillStyle = '#f4b94d';
  g.strokeStyle = 'rgba(120, 72, 12, 0.7)';
  g.lineWidth = 0.8;
  rr(g, -4, -15, 8, 30, 0.8);
  g.fill();
  g.stroke();
  g.fillStyle = '#a9afbb';
  g.strokeStyle = '#4b4f5c';
  g.lineWidth = 1.1;
  g.beginPath();
  g.arc(0, 0, 2.7, 0, TAU);
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
  // the bandolier runs from the left side, just under the hat, down to the bomb
  g.strokeStyle = OUT;
  g.lineWidth = 8.4;
  g.beginPath();
  g.moveTo(-23, -5.5);
  g.lineTo(15, 17);
  g.stroke();
  g.strokeStyle = '#7d4b1f';
  g.lineWidth = 6.4;
  g.beginPath();
  g.moveTo(-23, -5.5);
  g.lineTo(15, 17);
  g.stroke();
  g.strokeStyle = '#a56b34';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-22, -8);
  g.lineTo(16, 14.6);
  g.stroke();
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

  // a squat dark-green helmet with a thin black brim, sitting low on the head
  dome(g, '#323f30', 16.8, 9.8, -7.2);
  g.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  g.lineWidth = 1.3;
  g.beginPath();
  g.ellipse(0, -7.2, 13.4, 7.6, 0, Math.PI * 1.1, Math.PI * 1.42);
  g.stroke();
  g.fillStyle = '#17151b';
  rr(g, -22.4, -8.9, 44.8, 3.4, 1.7);
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

// Origin: the middle of the cuff. Used on the head and for the dropped hat.
function drawBushHat(g) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  const knit = g.createLinearGradient(0, -15, 0, 3);
  knit.addColorStop(0, '#3f8a45');
  knit.addColorStop(1, '#245c2c');
  g.fillStyle = knit;
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  // soft round crown
  g.beginPath();
  g.moveTo(-16.6, -1);
  g.bezierCurveTo(-18, -13, -8, -15.4, 0, -15.4);
  g.bezierCurveTo(8, -15.4, 18, -13, 16.6, -1);
  g.closePath();
  g.fill();
  g.stroke();
  // knit ribbing up the crown
  g.strokeStyle = 'rgba(10, 50, 20, 0.45)';
  g.lineWidth = 0.9;
  g.beginPath();
  for (let x = -12; x <= 12; x += 4) {
    g.moveTo(x * 0.95, -3);
    g.lineTo(x * 0.62, -13.6 + Math.abs(x) * 0.18);
  }
  g.stroke();
  // a soft highlight
  g.fillStyle = 'rgba(255, 255, 255, 0.2)';
  g.beginPath();
  g.ellipse(-6, -10, 4.4, 2, -0.5, 0, TAU);
  g.fill();
  // the turned-up cuff
  g.fillStyle = '#397d3f';
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  rr(g, -18.4, -3.4, 36.8, 6.6, 3.2);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(30, 90, 40, 0.4)';
  g.lineWidth = 0.9;
  g.beginPath();
  for (let x = -15; x <= 15; x += 3.4) {
    g.moveTo(x, -2.4);
    g.lineTo(x, 2.2);
  }
  g.stroke();
}

function drawArcherBody(g, front, gz, squint) {
  g.lineJoin = 'round';
  g.lineCap = 'round';
  // a lavender egg
  eggBody(g, '#b49ad3', '#8d72b4');
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.stroke();

  bigEyes(g, front ? [-8.4, 8.4] : [-2.2, 12.6], gz, -3.8, 4.5, 4.7, 1.1, 3, !!squint);
  if (front) smile(g, 0, 6.6, 3.2);
  else smile(g, 5.2, 7, 2.8);

  g.save();
  g.translate(0, -11.8);
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
  g.ellipse(0, 0, 20.8, 24, 0, 0, TAU);
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
  // the samurai: crimson armour with gold lacing, navy shoulder plates, a kabuto helmet with golden horns
  const cx = front ? 0 : 3;
  // neck guard of the helmet, behind the head
  g.fillStyle = '#2c3150';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(-17, -15);
  g.lineTo(-26, -12);
  g.lineTo(-25, -1);
  g.lineTo(-18, -4);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = '#d8b04a';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(-24.5, -8);
  g.lineTo(-18, -9);
  g.moveTo(-24.8, -4.5);
  g.lineTo(-18.4, -6);
  g.stroke();

  eggBody(g, '#bd3a32', '#8c2421');
  // gold lacing across the armour
  g.strokeStyle = '#e1b94b';
  g.lineWidth = 1.3;
  g.beginPath();
  for (const y of [8, 13.5, 19]) {
    g.moveTo(-19 + (y - 8) * 0.18, y);
    g.quadraticCurveTo(0, y + 3.4, 19 - (y - 8) * 0.18, y);
  }
  g.stroke();
  g.strokeStyle = 'rgba(40, 14, 14, 0.55)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, 7);
  g.lineTo(0, 22);
  g.stroke();
  // shoulder plates
  g.fillStyle = '#2c3150';
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  rr(g, -22.5, -1, 9, 9, 3);
  g.fill();
  g.stroke();
  rr(g, 13.5, -1, 9, 9, 3);
  g.fill();
  g.stroke();
  g.strokeStyle = '#e1b94b';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-21, 3.4);
  g.lineTo(-15, 3.4);
  g.moveTo(15, 3.4);
  g.lineTo(21, 3.4);
  g.stroke();
  // face
  g.fillStyle = '#ecc9a0';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  rr(g, front ? -15 : -9.4, -11.6, front ? 30 : 24, 10.4, 3.2);
  g.fill();
  g.stroke();
  const xs = front ? [-6.8, 6.8] : [-3.4, 9.2];
  for (const x of xs) {
    g.fillStyle = '#fdfdf8';
    g.strokeStyle = OUT;
    g.lineWidth = 1.5;
    g.beginPath();
    g.ellipse(x, -6.2, 3.8, 3, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#0d0b10';
    g.beginPath();
    g.arc(x + 1.2 + gz[0] * 0.4, -6, 2.2, 0, TAU);
    g.fill();
    // stern brow
    g.strokeStyle = OUT;
    g.lineWidth = 1.5;
    g.beginPath();
    g.moveTo(x - 4.4, -10.6);
    g.lineTo(x + 3.8, -9);
    g.stroke();
  }
  // kabuto: navy dome, a gold rim and two golden horns
  g.fillStyle = '#2c3150';
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-20, -11.4);
  g.bezierCurveTo(-21, -27, 21, -27, 20, -11.4);
  g.quadraticCurveTo(0, -14.4, -20, -11.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = '#e1b94b';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-19.4, -12.4);
  g.quadraticCurveTo(0, -15.6, 19.4, -12.4);
  g.stroke();
  g.fillStyle = '#e8c24e';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  for (const sg of [-1, 1]) {
    g.beginPath();
    g.moveTo(sg * 3, -22);
    g.quadraticCurveTo(sg * 6, -30, sg * 13, -33);
    g.quadraticCurveTo(sg * 8, -27, sg * 7.4, -21);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.beginPath();
  g.arc(0, -19.6, 2.1, 0, TAU);
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
export function ghostBody(g, tint, edge) {
  // the same pale periwinkle ghost for everyone, as in the original; only the headgear differs
  g.fillStyle = '#cfdaf7';
  g.strokeStyle = '#575c72';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(-14, 21);
  g.lineTo(-14.5, -4);
  g.bezierCurveTo(-15, -24, 15, -24, 14.5, -4);
  g.lineTo(14, 21);
  g.quadraticCurveTo(9.4, 15, 4.6, 21);
  g.quadraticCurveTo(0, 15, -4.6, 21);
  g.quadraticCurveTo(-9.4, 15, -14, 21);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#3b3f52';
  g.beginPath();
  g.ellipse(-5, -3, 2, 3.4, 0, 0, TAU);
  g.ellipse(5, -3, 2, 3.4, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(0, 6, 1.6, 2.2, 0, 0, TAU);
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
  flamethrower: ['#f6efe9', '#d5cbc4', (g) => dome(g, '#2f2e36', 11, 8, -10)],
  roman: ['#f9eded', '#d9c4c4', (g) => {
    dome(g, '#d43234', 11, 8, -10);
    g.fillStyle = '#f0a53a';
    rr(g, -13.5, -12.5, 27, 4.6, 2.2);
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
    ...eggSet(drawFlameBody),
    nozzle: makeLayer(-8, -14, 58, 14, (g) => drawNozzle(g, false)),
    nozzleFire: makeLayer(-8, -14, 58, 14, (g) => drawNozzle(g, true)),
  };

  art.roman = {
    feet: feetSet('#85501f'),
    // the Romans' pupils drift up and to the sides, the first (used for the icon) looks down-left
    ...eggSet(drawRomanBody, [[-1.7, 0.7], [0.6, -1.8], [1.7, -1.3]]),
    spear: makeLayer(-4, -6, 68, 6, drawSpear),
    shield: makeLayer(-8, -18, 8, 18, drawShield),
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
