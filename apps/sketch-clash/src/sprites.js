import { TEAMS, TAU } from './config.js?v=2';

// Every pose is drawn once into a small offscreen canvas and stamped with
// drawImage, so thousands of units stay cheap to render.
export const SCALE = 3;
export const BOX = { w: 52, h: 40 };
export const ANCHOR = { x: 20, y: 34 }; // feet position inside the sprite box
export const FEET = 11; // feet sit this far below a unit's body centre

const BODY = '#4a8de6';
const EDGE = '#26468c';
const DARK = '#2c2d3b';

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

// A round blue blob in a dark cap, holding a rifle. Origin is the feet,
// facing right. `frame` (0-3) is the walk cycle: feet alternate and the
// body hops on the step frames.
function drawSoldier(g, { frame = 0, stand = true, firing = false, dead = false }) {
  const walking = !stand && !dead;
  const bob = walking && (frame === 1 || frame === 3) ? -1.1 : 0;
  const liftA = walking && frame === 1 ? 2.2 : 0;
  const liftB = walking && frame === 3 ? 2.2 : 0;

  g.fillStyle = DARK;
  g.beginPath();
  g.ellipse(-4.2, -1.5 - liftA, 3.4, 2, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.ellipse(4.4, -1.5 - liftB, 3.4, 2, 0, 0, TAU);
  g.fill();

  const cy = -11 + bob;
  g.fillStyle = BODY;
  g.beginPath();
  g.ellipse(0, cy, 10.8, 10.2, 0, 0, TAU);
  g.fill();

  g.save();
  g.beginPath();
  g.ellipse(0, cy, 10.8, 10.2, 0, 0, TAU);
  g.clip();
  g.fillStyle = DARK;
  g.fillRect(-12, cy - 12, 24, 9.2);
  g.restore();

  g.strokeStyle = EDGE;
  g.lineWidth = 1.4;
  g.beginPath();
  g.ellipse(0, cy, 10.8, 10.2, 0, 0, TAU);
  g.stroke();

  g.fillStyle = DARK;
  g.beginPath();
  g.ellipse(7, cy - 3.2, 6, 1.7, 0, 0, TAU);
  g.fill();

  const eyes = [[1.4, 3.1, 3.8], [7.9, 2.8, 3.5]];
  for (const [ex, rx, ry] of eyes) {
    if (dead) {
      g.strokeStyle = DARK;
      g.lineWidth = 1.3;
      g.beginPath();
      g.moveTo(ex - 1.8, cy - 0.4 - 1.8);
      g.lineTo(ex + 1.8, cy - 0.4 + 1.8);
      g.moveTo(ex + 1.8, cy - 0.4 - 1.8);
      g.lineTo(ex - 1.8, cy - 0.4 + 1.8);
      g.stroke();
    } else {
      g.fillStyle = '#ffffff';
      g.strokeStyle = '#1d2a4d';
      g.lineWidth = 0.8;
      g.beginPath();
      g.ellipse(ex, cy + 0.7, rx, ry, 0, 0, TAU);
      g.fill();
      g.stroke();
      g.fillStyle = '#111';
      g.beginPath();
      g.arc(ex + 1.2, cy + 1, 1.5, 0, TAU);
      g.fill();
    }
  }

  const gy = -6 + bob;
  g.lineWidth = 3.6;
  g.strokeStyle = '#9a6330';
  g.beginPath();
  g.moveTo(-3, gy + 0.6);
  g.lineTo(7, gy);
  g.stroke();
  g.lineWidth = 2.6;
  g.strokeStyle = '#33343b';
  g.beginPath();
  g.moveTo(6, gy);
  g.lineTo(21, gy - 1);
  g.stroke();
  g.fillStyle = BODY;
  g.strokeStyle = EDGE;
  g.lineWidth = 1;
  g.beginPath();
  g.arc(6.4, gy + 0.3, 2.1, 0, TAU);
  g.fill();
  g.stroke();

  if (firing) {
    g.fillStyle = '#ffd23f';
    g.strokeStyle = '#e8812a';
    g.lineWidth = 1.2;
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const r = i % 2 === 0 ? 7 : 3;
      const px = 24.5 + Math.cos(a) * r;
      const py = gy - 1 + Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
    g.stroke();
  }
}

export function buildSprites() {
  const mk = (opts) => makeSprite(BOX.w, BOX.h, (g) => {
    g.translate(ANCHOR.x, ANCHOR.y);
    drawSoldier(g, opts);
  });
  const frames = [0, 1, 2, 3];
  const sprites = {
    stand: mk({ stand: true }),
    standFire: mk({ stand: true, firing: true }),
    walk: frames.map((frame) => mk({ stand: false, frame })),
    walkFire: frames.map((frame) => mk({ stand: false, frame, firing: true })),
    corpse: makeSprite(44, 44, (g) => {
      g.translate(22, 22);
      g.rotate(1.45);
      g.translate(0, FEET);
      drawSoldier(g, { dead: true });
    }),
    ring: {},
  };
  for (const t of Object.values(TEAMS)) {
    sprites.ring[t.id] = makeSprite(30, 12, (g) => {
      g.fillStyle = t.ring;
      g.strokeStyle = t.ringDark;
      g.lineWidth = 1.2;
      g.beginPath();
      g.ellipse(15, 6, 12.5, 4.6, 0, 0, TAU);
      g.fill();
      g.stroke();
    });
  }
  return sprites;
}

// Fallen soldiers are stamped once onto a persistent ground layer, so
// the board slowly fills with flopped-over blobs at no per-frame cost.
export function stampCorpse(g, sprites, x, y) {
  g.save();
  g.translate(x, y + 6);
  if (Math.random() < 0.5) g.scale(-1, 1);
  g.rotate((Math.random() - 0.5) * 0.6);
  g.globalAlpha = 0.55;
  g.drawImage(sprites.corpse, -22, -22, 44, 44);
  g.restore();
}
