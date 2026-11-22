import { INK, TEAMS, TAU } from './config.js';

// Every soldier pose is drawn once into a small offscreen canvas and
// stamped with drawImage, so thousands of units stay cheap to render.
export const SCALE = 3;
export const BOX = { w: 64, h: 48 };
export const ANCHOR = { x: 22, y: 42 };

function makeSprite(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(w * SCALE);
  c.height = Math.ceil(h * SCALE);
  const g = c.getContext('2d');
  g.scale(SCALE, SCALE);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  draw(g);
  return c;
}

function roundRect(g, x, y, w, h, r) {
  g.beginPath();
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.lineTo(x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.lineTo(x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

// Origin is the soldier's feet, facing right.
function drawFigure(g, team, { phase = 0, stand = false, firing = false, dead = false }) {
  const t = TEAMS[team];
  const idle = stand || dead;
  const bob = idle ? 0 : -Math.abs(Math.cos(phase)) * 0.9;
  const hipY = -11 + bob;
  const swing = Math.sin(phase);
  const lift = Math.cos(phase);
  const feet = idle
    ? [[-2.6, 0], [2.6, 0]]
    : [[swing * 5.5, -Math.max(0, lift) * 2.8], [-swing * 5.5, -Math.max(0, -lift) * 2.8]];

  g.strokeStyle = INK;
  g.lineWidth = 3.6;
  for (const [fx, fy] of feet) {
    g.beginPath();
    g.moveTo(0, hipY);
    g.lineTo(fx, fy);
    g.stroke();
  }
  g.strokeStyle = '#bba878';
  g.lineWidth = 1.8;
  for (const [fx, fy] of feet) {
    g.beginPath();
    g.moveTo(0, hipY);
    g.lineTo(fx, fy);
    g.stroke();
  }
  g.fillStyle = INK;
  for (const [fx, fy] of feet) {
    g.beginPath();
    g.ellipse(fx + 1.4, fy - 0.4, 2.6, 1.5, 0, 0, TAU);
    g.fill();
  }

  g.fillStyle = t.fill;
  g.strokeStyle = INK;
  g.lineWidth = 1.8;
  roundRect(g, -4.2, -24 + bob, 8.4, 13.5, 2.5);
  g.fill();
  g.stroke();
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-4.2, -14.5 + bob);
  g.lineTo(4.2, -14.5 + bob);
  g.stroke();

  const ry0 = -16.5 + bob;
  const ry1 = -19.5 + bob;
  g.strokeStyle = INK;
  g.lineWidth = 3.8;
  g.beginPath();
  g.moveTo(-6, ry0);
  g.lineTo(18, ry1);
  g.stroke();
  g.strokeStyle = '#94622f';
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-5.5, ry0);
  g.lineTo(7, ry0 + (ry1 - ry0) * 0.52);
  g.stroke();
  g.strokeStyle = '#59595c';
  g.beginPath();
  g.moveTo(7, ry0 + (ry1 - ry0) * 0.52);
  g.lineTo(17.5, ry1);
  g.stroke();

  g.strokeStyle = INK;
  g.lineWidth = 3.2;
  g.beginPath();
  g.moveTo(1.5, -21.5 + bob);
  g.lineTo(9, -18.2 + bob);
  g.stroke();
  g.strokeStyle = t.fill;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(1.5, -21.5 + bob);
  g.lineTo(8.2, -18.5 + bob);
  g.stroke();
  g.fillStyle = '#f7e2c6';
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(9.2, -18.1 + bob, 1.7, 0, TAU);
  g.fill();
  g.stroke();

  const hy = -29.5 + bob;
  g.fillStyle = '#f7e2c6';
  g.strokeStyle = INK;
  g.lineWidth = 1.8;
  g.beginPath();
  g.arc(1, hy, 5.3, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = t.dark;
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(1, hy - 0.5, 5.9, Math.PI * 1.02, Math.PI * 1.98);
  g.closePath();
  g.fill();
  g.stroke();
  g.beginPath();
  g.moveTo(-5.2, hy - 0.5);
  g.lineTo(7.6, hy - 0.5);
  g.stroke();

  g.strokeStyle = INK;
  if (dead) {
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(2, hy + 0.2);
    g.lineTo(4.4, hy + 2.6);
    g.moveTo(4.4, hy + 0.2);
    g.lineTo(2, hy + 2.6);
    g.stroke();
  } else {
    g.fillStyle = INK;
    g.beginPath();
    g.arc(3.4, hy + 1.2, 0.95, 0, TAU);
    g.fill();
  }

  if (firing) {
    g.fillStyle = '#ffd23f';
    g.strokeStyle = '#e8812a';
    g.lineWidth = 1.2;
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const r = i % 2 === 0 ? 6.5 : 2.6;
      const px = 22 + Math.cos(a) * r;
      const py = ry1 + Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
    g.stroke();
  }
}

export function buildSprites() {
  const sprites = {};
  for (const team of Object.keys(TEAMS)) {
    const mk = (opts) => makeSprite(BOX.w, BOX.h, (g) => {
      g.translate(ANCHOR.x, ANCHOR.y);
      drawFigure(g, team, opts);
    });
    const phases = [0, 1, 2, 3].map((i) => (i * Math.PI) / 2);
    sprites[team] = {
      stand: mk({ stand: true }),
      standFire: mk({ stand: true, firing: true }),
      walk: phases.map((phase) => mk({ phase })),
      walkFire: phases.map((phase) => mk({ phase, firing: true })),
      corpse: makeSprite(52, 52, (g) => {
        g.translate(26, 26);
        g.rotate(1.4);
        g.translate(0, 17);
        drawFigure(g, team, { dead: true });
      }),
    };
  }
  return sprites;
}

function splat(g, color, x, y) {
  g.fillStyle = color;
  for (let i = 0; i < 7; i++) {
    const a = Math.random() * TAU;
    const r = 3 + Math.random() * 10;
    g.beginPath();
    g.ellipse(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.5, 2 + Math.random() * 5, 1.5 + Math.random() * 3.5, Math.random() * Math.PI, 0, TAU);
    g.fill();
  }
}

// Fallen soldiers are stamped once onto a persistent "ground" layer, so
// the battlefield slowly fills with doodled casualties at no per-frame cost.
export function stampCorpse(g, sprites, team, x, y) {
  splat(g, TEAMS[team].splat, x, y + 8);
  g.save();
  g.translate(x, y + 8);
  if (Math.random() < 0.5) g.scale(-1, 1);
  g.rotate((Math.random() - 0.5) * 0.5);
  g.globalAlpha = 0.9;
  g.drawImage(sprites[team].corpse, -26, -26, 52, 52);
  g.restore();
}
