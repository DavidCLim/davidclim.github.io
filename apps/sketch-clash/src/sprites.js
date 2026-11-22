import { TEAMS, TAU, K, UNIT, PIVOT } from './config.js?v=5';

// The soldier is drawn from "art" coordinates matching the reference
// sprite (origin at the body centre, y down) into small offscreen layers,
// then stamped with drawImage. Layers, so each part can move on its own:
//   feet  - dark feet + soft shadow, glued to the ground (4 walk poses)
//   torso - egg body, helmet, eyes (hops and tilts while walking)
//   rifle - swings about the pivot to aim at the target
export const SCALE = 3; // canvas pixels per board pixel
const ART = SCALE * K; // canvas pixels per art pixel
const OUT = '#1c1a22';

function makeLayer(minX, minY, maxX, maxY, draw) {
  const c = document.createElement('canvas');
  c.width = Math.ceil((maxX - minX) * ART);
  c.height = Math.ceil((maxY - minY) * ART);
  const g = c.getContext('2d');
  g.scale(ART, ART);
  g.translate(-minX, -minY);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  draw(g);
  // x/y: offset of the layer's top-left from the anchor, in board pixels
  return { canvas: c, x: minX * K, y: minY * K, w: (maxX - minX) * K, h: (maxY - minY) * K };
}

function rr(g, x, y, w, h, r) {
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

const FEET_POSES = [
  [[-4.3, 24.8], [8.8, 24.8]],
  [[-1, 21.8], [8.8, 24.8]],
  [[-8, 24.8], [12, 24.8]],
  [[-4.3, 24.8], [12, 21.8]],
];

function drawFeet(g, pose) {
  g.save();
  g.translate(1, 28);
  g.scale(1, 0.27);
  const gr = g.createRadialGradient(0, 0, 2, 0, 0, 27);
  gr.addColorStop(0, 'rgba(0, 0, 0, 0.32)');
  gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, 27, 0, TAU);
  g.fill();
  g.restore();

  g.fillStyle = '#26242e';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  for (const [x, y] of pose) {
    g.beginPath();
    g.ellipse(x, y, 6.2, 3.4, 0, 0, TAU);
    g.fill();
    g.stroke();
  }
}

// Pupil offsets from the eye centre: right, up, up-left, up-right, left.
const GAZES = [[1.9, 0.8], [0, -2.6], [-1.7, -2.2], [1.7, -2.2], [-2.2, 0.3]];

// `front` is the idle pose (both eyes centred, facing the viewer); the
// default is the side-on pose used while walking and shooting.
function drawTorso(g, front, gaze) {
  const gr = g.createLinearGradient(0, -22, 0, 22);
  gr.addColorStop(0, '#5088ea');
  gr.addColorStop(1, '#3365cf');
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 20.6, 22, 0, 0, TAU);
  g.fill();
  g.stroke();

  g.fillStyle = 'rgba(255, 255, 255, 0.28)';
  g.beginPath();
  g.ellipse(-10.5, -6, 3.4, 5.6, -0.25, 0, TAU);
  g.fill();

  for (const ex of front ? [-8.4, 8.4] : [-2.5, 13.8]) {
    g.fillStyle = '#fbfbf6';
    g.strokeStyle = OUT;
    g.lineWidth = 1.4;
    g.beginPath();
    g.ellipse(ex, -5.9, 5.2, 6, 0, 0, TAU);
    g.fill();
    g.stroke();
    const px = ex + gaze[0];
    const py = -5.9 + gaze[1];
    g.fillStyle = '#121016';
    g.beginPath();
    g.arc(px, py, 3.4, 0, TAU);
    g.fill();
    g.fillStyle = 'rgba(255, 255, 255, 0.9)';
    g.beginPath();
    g.arc(px - 1, py - 2, 0.95, 0, TAU);
    g.fill();
  }

  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  g.beginPath();
  if (front) g.arc(0, 3.2, 5, Math.PI * 0.15, Math.PI * 0.85);
  else g.arc(6.9, 3.6, 4, Math.PI * 0.15, Math.PI * 0.85);
  g.stroke();

  g.fillStyle = '#2e4358';
  g.strokeStyle = OUT;
  g.lineWidth = 1.6;
  g.beginPath();
  g.ellipse(0, -12.7, 18.8, 12, 0, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(0, -12.7, 15.5, 9.2, 0, Math.PI * 1.08, Math.PI * 1.42);
  g.stroke();
  g.fillStyle = '#1b1920';
  rr(g, -23.5, -14.3, 49, 3.6, 1.8);
  g.fill();
}

function drawRifle(g, firing) {
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  g.fillStyle = '#2a2b33';
  rr(g, 7, 1.5, 4, 7.5, 1);
  g.fill();
  g.stroke();
  g.fillStyle = '#3b3d48';
  rr(g, 3.5, -2.8, 33, 5.6, 1.2);
  g.fill();
  g.stroke();
  g.fillStyle = '#2b2c35';
  g.fillRect(6, 0.5, 30, 1.7);
  g.fillStyle = '#cf9b58';
  rr(g, -7, -3.6, 11.5, 7.2, 1.4);
  g.fill();
  g.stroke();

  if (firing) {
    g.fillStyle = '#ffd23f';
    g.strokeStyle = '#e8812a';
    g.lineWidth = 1.2;
    g.beginPath();
    for (let i = 0; i < 16; i++) {
      const a = (i / 16) * TAU;
      const r = i % 2 === 0 ? 9 : 3.6;
      const px = 42 + Math.cos(a) * r;
      const py = Math.sin(a) * r;
      if (i === 0) g.moveTo(px, py);
      else g.lineTo(px, py);
    }
    g.closePath();
    g.fill();
    g.stroke();
  }
}

function drawGhost(g) {
  g.fillStyle = '#f6f6fb';
  g.strokeStyle = '#bfc1cc';
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

export function buildSprites() {
  const sprites = {
    feet: FEET_POSES.map((pose) => makeLayer(-30, 16, 32, 37, (g) => drawFeet(g, pose))),
    torso: makeLayer(-26, -27, 27, 23, (g) => drawTorso(g, false, GAZES[0])),
    torsoFront: GAZES.map((gz) => makeLayer(-26, -27, 27, 23, (g) => drawTorso(g, true, gz))),
    rifle: makeLayer(-9, -11, 51, 11, (g) => drawRifle(g, false)),
    rifleFire: makeLayer(-9, -11, 51, 11, (g) => drawRifle(g, true)),
    ghost: makeLayer(-18, -24, 18, 28, drawGhost),
    ring: {},
  };
  for (const t of Object.values(TEAMS)) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(36 * UNIT * SCALE);
    c.height = Math.ceil(14 * UNIT * SCALE);
    const g = c.getContext('2d');
    g.scale(SCALE * UNIT, SCALE * UNIT);
    g.fillStyle = t.ring;
    g.strokeStyle = t.ringDark;
    g.lineWidth = 1.3;
    g.beginPath();
    g.ellipse(18, 7, 15, 5.4, 0, 0, TAU);
    g.fill();
    g.stroke();
    sprites.ring[t.id] = { canvas: c, x: -18 * UNIT, y: -7 * UNIT, w: 36 * UNIT, h: 14 * UNIT };
  }
  return sprites;
}

export function drawLayer(ctx, layer) {
  ctx.drawImage(layer.canvas, layer.x, layer.y, layer.w, layer.h);
}

// A full standing soldier into any canvas (palette / legend icons).
// The canvas should be about 84:61; the soldier fits that box (in art px).
export function paintSoldierIcon(canvas, sprites) {
  const g = canvas.getContext('2d');
  const m = canvas.width / (84 * K);
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  g.translate((32.3 * canvas.width) / 84, (29 * canvas.width) / 84);
  g.scale(m, m);
  drawLayer(g, sprites.feet[0]);
  drawLayer(g, sprites.torso);
  g.translate(PIVOT.x, PIVOT.y);
  drawLayer(g, sprites.rifle);
  g.restore();
}

// A soldier's helmet is left behind on the ground when they die.
export function stampHelmet(g, x, y) {
  g.save();
  g.translate(x + (Math.random() - 0.5) * 22 * UNIT, y + (Math.random() - 0.5) * 8 * UNIT);
  g.rotate((Math.random() - 0.5) * 1.7);
  g.scale(UNIT, UNIT);
  g.globalAlpha = 0.92;
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
  g.restore();
}
