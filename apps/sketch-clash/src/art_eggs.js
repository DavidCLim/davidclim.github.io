import { TAU } from './config.js?v=85';
import { makeLayer, rr, OUT } from './sprites.js?v=85';
import { eggBody, bigEyes, feetSet, eggSet, ghostBody } from './art_units.js?v=85';

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

// ------------------------------------------------------------ mage
function drawMageBody(g, front, gz) {
  const cx = front ? 0 : 4.6;
  eggBody(g, '#9356bf', '#6b3694');
  // white beard
  g.fillStyle = '#f6f5ef';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(cx - 12, 2);
  g.quadraticCurveTo(cx, 6, cx + 12, 0);
  g.quadraticCurveTo(cx + 15, 12, cx + 5, 24);
  g.quadraticCurveTo(cx, 27, cx - 5, 23);
  g.quadraticCurveTo(cx - 14, 14, cx - 12, 2);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(120, 120, 130, 0.5)';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(cx - 3, 8);
  g.quadraticCurveTo(cx - 5, 15, cx - 1, 21);
  g.moveTo(cx + 4, 7);
  g.quadraticCurveTo(cx + 6, 14, cx + 3, 20);
  g.stroke();
  const xs = front ? [-7.4, 7.4] : [-2.8, 11.2];
  bigEyes(g, xs, gz, -4.8, 3.6, 3.9, 1.4, 2.2);
  // wizard hat: wide brim, bent cone, star and a gold band
  g.fillStyle = '#2f3b8c';
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.ellipse(cx, -11.4, 25, 6.2, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(cx - 14, -12);
  g.quadraticCurveTo(cx - 8, -30, cx - 1, -40);
  g.quadraticCurveTo(cx + 5, -47, cx + 14, -43);
  g.quadraticCurveTo(cx + 6, -37, cx + 12, -12);
  g.quadraticCurveTo(cx, -8, cx - 14, -12);
  g.closePath();
  g.fillStyle = vg(g, -46, -10, '#4352bd', '#2b367e');
  g.fill();
  g.stroke();
  g.fillStyle = '#e8b94a';
  rr(g, cx - 13, -15, 26, 3.4, 1.4);
  g.fill();
  g.fillStyle = '#f2cd5a';
  g.strokeStyle = OUT;
  g.lineWidth = 0.8;
  star5(g, cx + 1.5, -26, 4.2, 1.8);
  g.fill();
  g.stroke();
}

// A wooden staff with a glowing cyan orb. Origin: the hand, standing upright.
function drawMageStaff(g, glow) {
  g.lineCap = 'round';
  g.strokeStyle = OUT;
  g.lineWidth = 4.6;
  g.beginPath();
  g.moveTo(0, -38);
  g.lineTo(0.4, 26);
  g.stroke();
  g.strokeStyle = '#a8763c';
  g.lineWidth = 2.8;
  g.beginPath();
  g.moveTo(0, -38);
  g.lineTo(0.4, 26);
  g.stroke();
  g.strokeStyle = OUT;
  g.lineWidth = 3.2;
  g.beginPath();
  g.moveTo(-4, -38);
  g.quadraticCurveTo(-5, -45, -1, -47);
  g.moveTo(4, -38);
  g.quadraticCurveTo(5, -45, 1, -47);
  g.stroke();
  const r = glow ? 8.4 : 6.2;
  const R = r + (glow ? 10 : 5);
  const gr = g.createRadialGradient(0, -45, 1, 0, -45, R);
  gr.addColorStop(0, 'rgba(180, 245, 255, 0.95)');
  gr.addColorStop(0.45, 'rgba(120, 220, 245, 0.55)');
  gr.addColorStop(1, 'rgba(120, 220, 245, 0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, -45, R, 0, TAU);
  g.fill();
  g.fillStyle = '#c8f4fb';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(0, -45, r * 0.78, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.85)';
  g.beginPath();
  g.arc(-1.6, -46.6, 1.7, 0, TAU);
  g.fill();
}

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
    g.fillStyle = '#2f3b8c';
    g.strokeStyle = OUT;
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(0, 3, 14, 3.6, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.beginPath();
    g.moveTo(-7, 3);
    g.quadraticCurveTo(-3, -9, 0, -13);
    g.quadraticCurveTo(3, -9, 7, 3);
    g.closePath();
    g.fill();
    g.stroke();
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
      ...eggSet(drawMageBody),
      staff: makeLayer(-12, -56, 12, 28, (g) => drawMageStaff(g, false)),
      staffGlow: makeLayer(-22, -66, 22, 28, (g) => drawMageStaff(g, true)),
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
    art[id].ghost = makeLayer(-30, -34, 30, 28, (g) => {
      ghostBody(g, tint, edge);
      g.save();
      g.translate(0, -3);
      head(g);
      g.restore();
    });
  }
  return art;
}
