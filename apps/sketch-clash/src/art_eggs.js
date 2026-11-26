import { TAU } from './config.js?v=231';
import { makeLayer, rr, OUT } from './sprites.js?v=231';
import { eggBody, bigEyes, feetSet, eggSet, ghostBody, GAZE3 } from './art_units.js?v=231';

// The egg-shaped mythical units: zombie, mage, necromancer and the necromancer's skeletons.

function vg(g, y0, y1, c0, c1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, c0);
  gr.addColorStop(1, c1);
  return gr;
}

function star5(g, cx, cy, outer, inner) {
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * TAU - Math.PI / 2;
    const r = i % 2 === 0 ? outer : inner;
    if (i === 0) g.moveTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    else g.lineTo(cx + Math.cos(a) * r, cy + Math.sin(a) * r);
  }
  g.closePath();
}

// ------------------------------------------------------------ zombie
// A green egg with wisps of hair, mismatched eyes, a gaping mouth and two arms held straight out.
function drawZombieBody(g, front, gz) {
  eggBody(g, '#83a352', '#5a7538');
  g.fillStyle = 'rgba(60, 84, 38, 0.45)';
  g.beginPath();
  g.ellipse(-9, 12, 7, 5, 0.4, 0, TAU);
  g.ellipse(10, 14, 6, 3.4, -0.2, 0, TAU);
  g.fill();
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  for (const [x, h] of [[-5, 9], [1, 11], [7, 8]]) {
    g.moveTo(x, -22);
    g.quadraticCurveTo(x - 1.5, -22 - h * 0.5, x - 2.4, -22 - h);
  }
  g.stroke();
  const xs = front ? [-8.4, 8.4] : [-2.6, 11.4];
  bigEyes(g, [xs[0]], gz, -7, 4.9, 5.1, 1.6, 2.4);
  bigEyes(g, [xs[1]], gz, -3.4, 3.7, 3.9, 1.5, 2.2);
  const mx = front ? 0 : 6.4;
  g.fillStyle = '#24121a';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.ellipse(mx, 10.4, 3.6, 4.6, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#e9e3c0';
  g.fillRect(mx - 2.2, 6.6, 1.6, 2.2);
  g.fillRect(mx + 0.6, 6.6, 1.6, 2.2);
  const arm = (y, fill, stripe) => {
    g.fillStyle = fill;
    g.strokeStyle = OUT;
    g.lineWidth = 1.6;
    rr(g, 9, y, 28, 6.4, 3);
    g.fill();
    g.stroke();
    g.strokeStyle = stripe;
    g.lineWidth = 1.5;
    g.beginPath();
    for (const x of [16, 23, 30]) {
      g.moveTo(x, y + 0.9);
      g.lineTo(x, y + 5.5);
    }
    g.stroke();
  };
  arm(16.8, '#6a8a42', '#4a6430');
  arm(4.6, '#83a352', '#5a7538');
}

// ------------------------------------------------------------ the wizard
// The original's mage: a purple egg with a gold band, a wide-brimmed navy hat with a gold star, and a staff with a
// glowing orb. Older and wiser here: heavy lids, bushy white brows, a drooping moustache and a beard down to his feet.
function drawWizardBody(g, front, gz) {
  const cx = front ? 0 : 5;
  eggBody(g, '#a655c0', '#87359f');
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.2, 22.5, 0, 0, TAU);
  g.clip();
  g.fillStyle = '#f0bd38';
  g.beginPath();
  g.moveTo(-24, 11);
  g.quadraticCurveTo(0, 17, 24, 10);
  g.lineTo(24, 15);
  g.quadraticCurveTo(0, 22, -24, 16);
  g.closePath();
  g.fill();
  g.restore();

  // eyes half hidden under the brim, their lids heavy and unhurried
  const xs = [cx - 6.4, cx + 7.6];
  bigEyes(g, xs, gz, -3.8, 4.6, 4.8, 1.9, 2.6);
  for (const x of xs) {
    g.beginPath();
    g.ellipse(x, -3.8, 4.6, 4.8, 0, Math.PI * 1.08, Math.PI * 1.92);
    g.quadraticCurveTo(x, -4.8, x - 4.4, -5.4);
    g.closePath();
    g.fillStyle = '#8b3fa6';
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = 1.2;
    g.stroke();
  }

  // the beard: long, soft and tapering past his body to his toes, with a little curl at the end
  g.fillStyle = vg(g, -2, 31, '#fdfcf7', '#e2e0d8');
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(cx - 9.5, 0);
  g.quadraticCurveTo(cx + 1, -3.4, cx + 11.5, 0);
  g.bezierCurveTo(cx + 15, 7, cx + 10, 13, cx + 8.6, 17);
  g.quadraticCurveTo(cx + 12, 19, cx + 6.6, 21.4);
  g.bezierCurveTo(cx + 6, 26, cx + 3, 29, cx + 6.5, 32.5);
  g.bezierCurveTo(cx - 1, 33, cx - 3.4, 28, cx - 4.4, 22.6);
  g.quadraticCurveTo(cx - 10, 22, cx - 7.4, 17.4);
  g.bezierCurveTo(cx - 11.5, 12, cx - 13, 6, cx - 9.5, 0);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(130, 128, 140, 0.55)';
  g.lineWidth = 0.9;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(cx - 4, 6);
  g.quadraticCurveTo(cx - 6, 14, cx - 1.6, 22);
  g.moveTo(cx + 2.4, 8);
  g.quadraticCurveTo(cx + 3.6, 17, cx + 0.4, 27);
  g.moveTo(cx + 7, 5);
  g.quadraticCurveTo(cx + 8.4, 11, cx + 4.6, 17);
  g.stroke();
  // moustache, drooping out to both sides
  g.fillStyle = '#ffffff';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  for (const side of [-1, 1]) {
    g.beginPath();
    g.moveTo(cx + 1, 0);
    g.quadraticCurveTo(cx + 1 + side * 7, -2.6, cx + 1 + side * 14, 5.4);
    g.quadraticCurveTo(cx + 1 + side * 8, 3.6, cx + 1 + side * 5.4, 4.6);
    g.quadraticCurveTo(cx + 1 + side * 2, 4, cx + 1, 2.4);
    g.closePath();
    g.fill();
    g.stroke();
  }
  // a round nose over it
  g.beginPath();
  g.ellipse(cx + 1, 0.4, 3, 2.6, 0, 0, TAU);
  g.fillStyle = '#b86cc9';
  g.fill();
  g.stroke();

  drawWizardHat(g, cx);

  // bushy white brows, poking out from under the brim and trailing at the ends
  g.fillStyle = '#ffffff';
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  for (const [x, side] of [[xs[0], -1], [xs[1], 1]]) {
    g.beginPath();
    g.moveTo(x - side * 4, -9.8);
    g.quadraticCurveTo(x + side * 1.5, -12.4, x + side * 6.4, -9);
    g.quadraticCurveTo(x + side * 9.4, -6.6, x + side * 9.8, -2.6);
    g.quadraticCurveTo(x + side * 6.6, -7.4, x + side * 3, -7.8);
    g.quadraticCurveTo(x - side * 1, -8.8, x - side * 4, -8);
    g.closePath();
    g.fill();
    g.stroke();
  }
}

// the wide flat brim and a straight cone leaning back, with a gold band and star
function drawWizardHat(g, cx) {
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.lineJoin = 'round';
  g.beginPath();
  g.moveTo(cx - 14.5, -13);
  g.lineTo(cx - 12, -42);
  g.quadraticCurveTo(cx + 3, -31, cx + 14.5, -13);
  g.closePath();
  g.fillStyle = '#2b3474';
  g.fill();
  g.stroke();
  g.fillStyle = '#f0bd38';
  g.beginPath();
  g.moveTo(cx - 14.2, -18.2);
  g.lineTo(cx + 11.6, -17.6);
  g.lineTo(cx + 14, -13.6);
  g.lineTo(cx - 14.5, -14);
  g.closePath();
  g.fill();
  g.beginPath();
  g.ellipse(cx, -13.4, 28, 5.4, 0, 0, TAU);
  g.fillStyle = '#2b3474';
  g.fill();
  g.stroke();
  g.fillStyle = '#f5c63e';
  star5(g, cx - 3.6, -26, 4.6, 2);
  g.fill();
}

// A plain wooden staff topped by an orb in the colour of the spell. Origin: its foot.
function drawWizardStaff(g, orb) {
  g.lineCap = 'round';
  for (const [col, wide] of [[OUT, 4.8], ['#c8964e', 2.8]]) {
    g.strokeStyle = col;
    g.lineWidth = wide;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(0, -WIZ_STAFF);
    g.stroke();
  }
  g.beginPath();
  g.arc(0, -WIZ_STAFF, 6.4, 0, TAU);
  g.fillStyle = orb;
  g.fill();
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.stroke();
  g.beginPath();
  g.arc(2, -WIZ_STAFF + 1.8, 1.8, 0, TAU);
  g.fillStyle = '#ffffff';
  g.fill();
}

export const WIZ_STAFF = 52;

// ------------------------------------------------------------ necromancer
function drawNecroBody(g, front, gz) {
  const cx = front ? 0 : 3;
  g.fillStyle = '#2a1f42';
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(cx - 15, -14);
  g.quadraticCurveTo(cx - 8, -34, cx - 2, -36);
  g.quadraticCurveTo(cx + 8, -31, cx + 15, -14);
  g.closePath();
  g.fill();
  g.stroke();
  eggBody(g, '#33264f', '#1c1430');
  g.fillStyle = 'rgba(255, 255, 255, 0.05)';
  g.beginPath();
  g.ellipse(0, 11, 17, 10, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#0c0714';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(cx, -4, front ? 15 : 13, 11.5, 0, 0, TAU);
  g.fill();
  g.stroke();
  const xs = front ? [-6.2, 6.2] : [-2, 9];
  for (const x of xs) {
    const gr = g.createRadialGradient(x, -4.4, 0.5, x, -4.4, 5.6);
    gr.addColorStop(0, 'rgba(210, 150, 255, 0.85)');
    gr.addColorStop(1, 'rgba(210, 150, 255, 0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(x, -4.4, 5.6, 0, TAU);
    g.fill();
    g.fillStyle = '#c590ff';
    g.beginPath();
    g.ellipse(x, -4.4, 2.5, 1.8, 0, 0, TAU);
    g.fill();
  }
  g.fillStyle = '#4b3a68';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-20, 8);
  g.quadraticCurveTo(0, 12, 20, 8);
  g.lineTo(19.4, 13.6);
  g.quadraticCurveTo(0, 17.4, -19.4, 13.6);
  g.closePath();
  g.fill();
  g.stroke();
}

function drawNecroStaff(g, glow) {
  g.lineCap = 'round';
  g.strokeStyle = OUT;
  g.lineWidth = 4.6;
  g.beginPath();
  g.moveTo(0, -34);
  g.lineTo(0.4, 26);
  g.stroke();
  g.strokeStyle = '#3d2f52';
  g.lineWidth = 2.8;
  g.beginPath();
  g.moveTo(0, -34);
  g.lineTo(0.4, 26);
  g.stroke();
  if (glow) {
    const gr = g.createRadialGradient(0, -43, 1, 0, -43, 17);
    gr.addColorStop(0, 'rgba(150, 255, 150, 0.7)');
    gr.addColorStop(1, 'rgba(150, 255, 150, 0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, -43, 17, 0, TAU);
    g.fill();
  }
  g.fillStyle = '#f1ecdc';
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(0, -44, 7.4, Math.PI * 0.92, Math.PI * 2.08);
  g.lineTo(5, -36);
  g.lineTo(-5, -36);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = glow ? '#7dff7d' : '#120d1c';
  g.beginPath();
  g.ellipse(-2.9, -44, 2, 2.4, 0, 0, TAU);
  g.ellipse(2.9, -44, 2, 2.4, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#120d1c';
  g.beginPath();
  g.moveTo(0, -41.4);
  g.lineTo(-1.2, -39.2);
  g.lineTo(1.2, -39.2);
  g.closePath();
  g.fill();
  g.strokeStyle = '#120d1c';
  g.lineWidth = 0.8;
  g.beginPath();
  for (const x of [-2.4, 0, 2.4]) {
    g.moveTo(x, -37.6);
    g.lineTo(x, -36);
  }
  g.stroke();
}

// ------------------------------------------------------------ skeleton
function drawSkelBody(g, front, gz) {
  eggBody(g, '#f1eddf', '#cdc6b0');
  g.strokeStyle = 'rgba(70, 64, 50, 0.65)';
  g.lineWidth = 1.2;
  g.beginPath();
  for (const y of [10, 15, 20]) {
    g.moveTo(-14 + (y - 10) * 0.2, y);
    g.quadraticCurveTo(0, y + 3, 14 - (y - 10) * 0.2, y);
  }
  g.moveTo(0, 8);
  g.lineTo(0, 22);
  g.stroke();
  const xs = front ? [-7.6, 7.6] : [-2.4, 11.6];
  for (const x of xs) {
    g.fillStyle = '#17141a';
    g.beginPath();
    g.ellipse(x, -4.6, 5.2, 5.8, 0, 0, TAU);
    g.fill();
    g.fillStyle = '#fdfdf8';
    g.beginPath();
    g.arc(x + gz[0] * 0.9 + 1, -4 + gz[1] * 0.7, 1.4, 0, TAU);
    g.fill();
  }
  const mx = front ? 0 : 4.6;
  g.fillStyle = '#17141a';
  g.beginPath();
  g.moveTo(mx, 1.6);
  g.lineTo(mx - 1.9, 4.8);
  g.lineTo(mx + 1.9, 4.8);
  g.closePath();
  g.fill();
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(mx - 6.5, 7.4);
  g.quadraticCurveTo(mx, 9.6, mx + 6.5, 7.4);
  for (let x = -5; x <= 5; x += 2.5) {
    g.moveTo(mx + x, 7.9);
    g.lineTo(mx + x, 9.6);
  }
  g.stroke();
}

function drawBoneSword(g) {
  g.lineCap = 'round';
  g.strokeStyle = OUT;
  g.lineWidth = 3.6;
  g.beginPath();
  g.moveTo(-6, 0);
  g.lineTo(30, 0);
  g.stroke();
  g.strokeStyle = '#a9adb8';
  g.lineWidth = 1.9;
  g.beginPath();
  g.moveTo(2, 0);
  g.lineTo(30, 0);
  g.stroke();
  g.strokeStyle = '#6b4a2a';
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(-5, 0);
  g.lineTo(0, 0);
  g.stroke();
  g.strokeStyle = OUT;
  g.lineWidth = 3.2;
  g.beginPath();
  g.moveTo(1.4, -4);
  g.lineTo(1.4, 4);
  g.stroke();
  g.strokeStyle = '#d6b24a';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(1.4, -4);
  g.lineTo(1.4, 4);
  g.stroke();
}

// What a mage drops, and the ghosts all four leave behind.
export const EGG_DROPS = {
  mage(g) {
    g.scale(0.55, 0.55);
    g.translate(0, 20);
    drawWizardHat(g, 0);
  },
};

const GHOSTS = {
  zombie: ['#eef3e8', '#c4d2b8', (g) => {
    g.strokeStyle = '#a3b494';
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-3, -17);
    g.lineTo(-5, -25);
    g.moveTo(2, -18);
    g.lineTo(1, -27);
    g.stroke();
  }],
  mage: ['#f4eff9', '#d1c4e0', (g) => {
    g.fillStyle = '#b9bde6';
    g.strokeStyle = '#8f93c4';
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, -9, 15, 3.6, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(-8, -9);
    g.quadraticCurveTo(-3, -22, 3, -28);
    g.quadraticCurveTo(5, -20, 8, -9);
    g.closePath();
    g.fill();
    g.stroke();
  }],
  necromancer: ['#ece8f4', '#c8bfd9', (g) => {
    g.fillStyle = '#c3b8d8';
    g.strokeStyle = '#a094ba';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(-9, -12);
    g.quadraticCurveTo(-4, -26, 0, -27);
    g.quadraticCurveTo(5, -22, 9, -12);
    g.closePath();
    g.fill();
    g.stroke();
  }],
  skeleton: ['#faf8f0', '#dcd8c8', (g) => {
    g.fillStyle = '#6b6860';
    g.beginPath();
    g.ellipse(-4, -14, 2.2, 2.6, 0, 0, TAU);
    g.ellipse(4, -14, 2.2, 2.6, 0, 0, TAU);
    g.fill();
  }],
};

export function buildEggArt() {
  const art = {
    zombie: { feet: feetSet('#4d6630'), ...eggSet(drawZombieBody) },
    mage: {
      feet: feetSet('#25232e'),
      // taller layers than the other eggs, for his hat above and his beard below
      torso: makeLayer(-40, -48, 40, 36, (g) => drawWizardBody(g, false, GAZE3[0])),
      torsoAngry: makeLayer(-40, -48, 40, 36, (g) => drawWizardBody(g, false, GAZE3[0])),
      torsoSide: GAZE3.map((gz) => makeLayer(-40, -48, 40, 36, (g) => drawWizardBody(g, false, gz))),
      staff: makeLayer(-10, -62, 10, 6, (g) => drawWizardStaff(g, '#8ff0fb')),
      staffPink: makeLayer(-10, -62, 10, 6, (g) => drawWizardStaff(g, '#ff62ea')),
    },
    necromancer: {
      feet: feetSet('#1c1430'),
      ...eggSet(drawNecroBody),
      staff: makeLayer(-12, -56, 12, 28, (g) => drawNecroStaff(g, false)),
      staffGlow: makeLayer(-22, -64, 22, 28, (g) => drawNecroStaff(g, true)),
    },
    skeleton: {
      feet: feetSet('#d9d3bd'),
      ...eggSet(drawSkelBody),
      sword: makeLayer(-8, -6, 34, 6, drawBoneSword),
    },
  };
  for (const [id, [tint, edge, head]] of Object.entries(GHOSTS)) {
    art[id].ghost = makeLayer(-26, -30, 26, 26, (g) => ghostBody(g));
  }
  return art;
}
