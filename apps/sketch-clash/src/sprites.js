import { TEAMS, TAU, K, UNIT, PIVOT, SNIPER } from './config.js?v=7';

// Units are drawn from "art" coordinates matching the reference sprites
// (origin at the body centre, y down) into small offscreen layers, then
// stamped with drawImage. Layers, so each part can move on its own:
//   feet  - dark feet + soft shadow, glued to the ground (4 walk poses)
//   torso - egg body and eyes (hops and tilts while walking)
//   rifle - swings about the pivot to aim at the target
//   hat   - the sniper's hat, so it can be tipped
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

function star(g, cx, cy, outer, inner) {
  g.fillStyle = '#ffd23f';
  g.strokeStyle = '#e8812a';
  g.lineWidth = 1.2;
  g.beginPath();
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * TAU;
    const r = i % 2 === 0 ? outer : inner;
    const px = cx + Math.cos(a) * r;
    const py = cy + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
  g.stroke();
}

// ---------- shared: feet, shadow ----------
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

// Scratch marks that appear on a unit as it gets hurt.
function drawHurt(g, level) {
  g.strokeStyle = 'rgba(28, 26, 34, 0.7)';
  g.lineWidth = 1.3;
  g.beginPath();
  for (const [x0, y0, x1, y1] of [[7, 2, 12, 8], [10, 0, 15, 6], [13, -2, 17, 3]]) {
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
  }
  if (level >= 2) {
    for (const [x0, y0, x1, y1] of [[-12, 6, -7, 12], [-9, 4, -4, 10], [-14, 2, -9, 8], [-2, 11, 3, 16]]) {
      g.moveTo(x0, y0);
      g.lineTo(x1, y1);
    }
  }
  g.stroke();
  if (level >= 2) {
    g.fillStyle = 'rgba(28, 26, 34, 0.35)';
    g.beginPath();
    g.ellipse(-6, 8, 3.2, 2.2, 0.5, 0, TAU);
    g.fill();
  }
}

// ---------- soldier ----------
// Pupil offsets from the eye centre: right, up, up-left, up-right, left.
const GAZES = [[1.9, 0.8], [0, -2.6], [-1.7, -2.2], [1.7, -2.2], [-2.2, 0.3]];

// `front` is the idle pose (both eyes centred, facing the viewer); the
// default is the side-on pose used while walking and shooting.
function drawSoldierTorso(g, front, gaze) {
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

function drawSoldierRifle(g, firing) {
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
  if (firing) star(g, 42, 0, 9, 3.6);
}

function drawGhost(g, withHat) {
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
  if (withHat) {
    g.save();
    g.translate(0, -14);
    g.scale(0.75, 0.75);
    drawSniperHat(g);
    g.restore();
  }
}

// ---------- sniper ----------
const TAN_TOP = '#cdb27d';
const TAN_BOT = '#a98d58';
const HAT = '#56482a';
const HAT_BRIM = '#4a3e23';
const LID = '#2a2418';

function drawSniperBody(g) {
  const gr = g.createLinearGradient(0, -22, 0, 22);
  gr.addColorStop(0, TAN_TOP);
  gr.addColorStop(1, TAN_BOT);
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
}

function drawSniperFace(g, ex, mx, look, blink) {
  // Half-lidded eyes: a heavy dark lid over the top of each.
  for (const x of ex) {
    if (blink) {
      g.strokeStyle = LID;
      g.lineWidth = 1.7;
      g.beginPath();
      g.arc(x, -6.8, 4.6, Math.PI * 0.12, Math.PI * 0.88);
      g.stroke();
      continue;
    }
    g.fillStyle = '#fbfbf6';
    g.strokeStyle = OUT;
    g.lineWidth = 1.2;
    g.beginPath();
    g.ellipse(x, -5.8, 5.6, 3.7, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#16120c';
    g.beginPath();
    g.ellipse(x + look * 2.3, -5.3, 2.5, 2.7, 0, 0, TAU);
    g.fill();
    g.save();
    g.beginPath();
    g.ellipse(x, -5.8, 5.6, 3.7, 0, 0, TAU);
    g.clip();
    g.fillStyle = LID;
    g.fillRect(x - 7, -10.2, 14, 5.2);
    g.restore();
  }
  // A small dark moustache.
  g.fillStyle = LID;
  g.beginPath();
  g.moveTo(mx - 4.6, 5.8);
  g.quadraticCurveTo(mx - 2.6, 2.8, mx, 4.6);
  g.quadraticCurveTo(mx + 2.6, 2.8, mx + 4.6, 5.8);
  g.quadraticCurveTo(mx + 2.4, 8.2, mx, 6.6);
  g.quadraticCurveTo(mx - 2.4, 8.2, mx - 4.6, 5.8);
  g.closePath();
  g.fill();
}

// look: -1 left, 0 centre, 1 right. front: facing the viewer (idle).
function drawSniperTorso(g, front, look, blink) {
  drawSniperBody(g);
  if (front) drawSniperFace(g, [-8.4, 8.4], 0, look, blink);
  else drawSniperFace(g, [-1.6, 12.8], 7.5, 1, false);
}

// Origin is the centre of the brim, so the hat can tip about it.
function drawSniperHat(g) {
  g.fillStyle = HAT;
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(0, 0, 13.7, 12.3, 0, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.14)';
  g.lineWidth = 1.4;
  g.beginPath();
  g.ellipse(0, 0, 11, 9.4, 0, Math.PI * 1.1, Math.PI * 1.45);
  g.stroke();
  g.strokeStyle = '#3b311c';
  g.lineWidth = 1.3;
  g.beginPath();
  g.moveTo(-13.3, -1.6);
  g.quadraticCurveTo(0, 1, 13.3, -1.6);
  g.stroke();
  g.fillStyle = HAT_BRIM;
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.ellipse(0, 0.4, 32, 3.7, 0, 0, TAU);
  g.fill();
  g.stroke();
}

// Receiver, barrel and scope; origin is the centre of the receiver.
function drawSniperRifleParts(g, firing) {
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  g.fillStyle = '#2a2b33';
  rr(g, 7, 2.5, 3.6, 6, 1);
  g.fill();
  g.stroke();
  g.fillStyle = '#3b3d48';
  rr(g, 5.4, -3.1, 38.6, 4, 1);
  g.fill();
  g.stroke();
  g.fillStyle = '#5a5d6a';
  g.fillRect(6, -2.6, 37, 0.9);
  g.fillStyle = '#22232a';
  g.fillRect(12, -5.7, 2, 2.7);
  g.fillRect(22, -5.7, 2, 2.7);
  g.fillStyle = '#2b2c35';
  rr(g, 9.6, -10.4, 16.2, 5, 2);
  g.fill();
  g.stroke();
  g.fillStyle = '#7e97b4';
  g.beginPath();
  g.ellipse(25.6, -7.9, 1.2, 2, 0, 0, TAU);
  g.fill();
  g.fillStyle = '#d79c58';
  g.strokeStyle = OUT;
  rr(g, -5.4, -3, 10.8, 6, 1.3);
  g.fill();
  g.stroke();
  if (firing) star(g, 49, -1.1, 9, 3.6);
}

// Lying on his belly, head to the right, rifle out front. Origin is the
// body centre; the whole thing is rotated to point at the target.
function drawSniperProne(g, firing) {
  g.save();
  g.translate(0, 13);
  g.scale(1, 0.2);
  const sh = g.createRadialGradient(0, 0, 3, 0, 0, 40);
  sh.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
  sh.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = sh;
  g.beginPath();
  g.arc(0, 0, 40, 0, TAU);
  g.fill();
  g.restore();

  g.fillStyle = '#26242e';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  for (const [x, y] of [[-31, 3.5], [-30, 11.5]]) {
    g.beginPath();
    g.ellipse(x, y, 3.6, 5, 0, 0, TAU);
    g.fill();
    g.stroke();
  }

  const gr = g.createLinearGradient(0, -14, 0, 15);
  gr.addColorStop(0, TAN_TOP);
  gr.addColorStop(1, TAN_BOT);
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(-3, 1, 25, 14.5, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(255, 255, 255, 0.26)';
  g.beginPath();
  g.ellipse(-14, -6, 5.5, 2.8, -0.15, 0, TAU);
  g.fill();

  g.save();
  g.translate(8, 7.5);
  drawSniperRifleParts(g, firing);
  g.restore();

  drawSniperFace(g, [5, 15], 10, 1, false);

  g.save();
  g.translate(13, -8);
  g.rotate(0.22);
  g.scale(0.85, 0.85);
  drawSniperHat(g);
  g.restore();
}

export function buildSprites() {
  const soldierFeet = FEET_POSES.map((pose) => makeLayer(-30, 16, 32, 37, (g) => drawFeet(g, pose)));
  const sprites = {
    soldier: {
      feet: soldierFeet,
      torso: makeLayer(-26, -27, 27, 23, (g) => drawSoldierTorso(g, false, GAZES[0])),
      torsoFront: GAZES.map((gz) => makeLayer(-26, -27, 27, 23, (g) => drawSoldierTorso(g, true, gz))),
      rifle: makeLayer(-9, -11, 51, 11, (g) => drawSoldierRifle(g, false)),
      rifleFire: makeLayer(-9, -11, 51, 11, (g) => drawSoldierRifle(g, true)),
      ghost: makeLayer(-18, -24, 18, 28, (g) => drawGhost(g, false)),
    },
    sniper: {
      feet: soldierFeet,
      torso: makeLayer(-26, -24, 27, 23, (g) => drawSniperTorso(g, false, 1, false)),
      // idle faces the viewer: look left, centre, right, then a blink
      torsoFront: [-1, 0, 1].map((look) => makeLayer(-26, -24, 27, 23, (g) => drawSniperTorso(g, true, look, false)))
        .concat([makeLayer(-26, -24, 27, 23, (g) => drawSniperTorso(g, true, 0, true))]),
      hat: makeLayer(-36, -16, 36, 8, drawSniperHat),
      rifle: makeLayer(-9, -14, 56, 12, (g) => drawSniperRifleParts(g, false)),
      rifleFire: makeLayer(-9, -14, 60, 12, (g) => drawSniperRifleParts(g, true)),
      prone: makeLayer(-38, -24, 64, 24, (g) => drawSniperProne(g, false)),
      proneFire: makeLayer(-38, -24, 64, 24, (g) => drawSniperProne(g, true)),
      ghost: makeLayer(-30, -34, 30, 28, (g) => drawGhost(g, true)),
    },
    hurt: [1, 2].map((level) => makeLayer(-26, -27, 27, 23, (g) => drawHurt(g, level))),
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

// Palette / legend icon: a standing unit, rifle out. The canvas should be
// about 84:61 (soldier) or 96:61 (sniper) in art px; the unit fits it.
const ICON = {
  soldier: { w: 84, ox: 32.3 },
  sniper: { w: 88, ox: 34 },
};
export function paintIcon(canvas, sprites, species) {
  const cfg = ICON[species];
  const S = sprites[species];
  const g = canvas.getContext('2d');
  const m = canvas.width / (cfg.w * K);
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  g.translate((cfg.ox * canvas.width) / cfg.w, (29 * canvas.width) / cfg.w);
  g.scale(m, m);
  drawLayer(g, S.feet[0]);
  drawLayer(g, S.torso);
  if (species === 'sniper') {
    g.save();
    g.translate(0, -12.7 * K);
    drawLayer(g, S.hat);
    g.restore();
    g.translate(SNIPER.pivot.x, SNIPER.pivot.y);
  } else {
    g.translate(PIVOT.x, PIVOT.y);
  }
  drawLayer(g, S.rifle);
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

// ...and a sniper leaves his wide-brimmed hat.
export function stampHat(g, x, y) {
  g.save();
  g.translate(x + (Math.random() - 0.5) * 22 * UNIT, y + (Math.random() - 0.5) * 8 * UNIT);
  g.rotate((Math.random() - 0.5) * 1.7);
  g.scale(UNIT, UNIT);
  g.globalAlpha = 0.92;
  g.fillStyle = HAT;
  g.strokeStyle = OUT;
  g.lineWidth = 1;
  g.beginPath();
  g.ellipse(0, 0, 9, 7, 0, Math.PI, TAU);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = HAT_BRIM;
  g.beginPath();
  g.ellipse(0, 0.4, 19, 2.8, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.restore();
}
