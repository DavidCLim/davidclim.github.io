import { TEAMS, TAU, K, UNIT, PIVOT, SNIPER } from './config.js?v=260';

// Units are drawn from "art" coordinates matching the reference sprites
// (origin at the body centre, y down) into small offscreen layers, then
// stamped with drawImage. Layers, so each part can move on its own:
//   feet  - dark feet + soft shadow, glued to the ground (4 walk poses)
//   torso - egg body and eyes (hops and tilts while walking)
//   rifle - swings about the pivot to aim at the target
//   hat   - the sniper's hat, so it can be tipped
export const SCALE = 3; // canvas pixels per board pixel
export const ART = SCALE * K; // canvas pixels per art pixel
export const OUT = '#1c1a22';

export function makeLayer(minX, minY, maxX, maxY, draw) {
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

export function rr(g, x, y, w, h, r) {
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

export function star(g, cx, cy, outer, inner) {
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
export const FEET_POSES = [
  [[-4.3, 24.8], [8.8, 24.8]],
  [[-1, 21.8], [8.8, 24.8]],
  [[-8, 24.8], [12, 24.8]],
  [[-4.3, 24.8], [12, 21.8]],
];

export function drawFeet(g, pose, big, color) {
  g.save();
  g.translate(1, 28);
  g.scale(1, 0.27);
  const sr = big ? 31 : 27;
  const gr = g.createRadialGradient(0, 0, 2, 0, 0, sr);
  gr.addColorStop(0, big ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.32)');
  gr.addColorStop(1, 'rgba(0, 0, 0, 0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, sr, 0, TAU);
  g.fill();
  g.restore();

  g.fillStyle = color || '#25232e';
  g.strokeStyle = OUT;
  g.lineWidth = 1.3;
  for (const [x, y] of pose) {
    g.beginPath();
    g.ellipse(x, y + (big ? 0.9 : 0), big ? 6.6 : 6.2, big ? 3.8 : 3.4, 0, 0, TAU);
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
// A small knotted neckerchief, the one cheerful accent the units share with the cowboy.
export function neckScarf(g, front, color) {
  const dx = front ? 0 : 3.6;
  g.fillStyle = color;
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  g.beginPath();
  g.moveTo(-11.6 + dx, 13.2);
  g.quadraticCurveTo(dx, 16.4, 11.6 + dx, 13.2);
  g.lineTo(dx, 21.4);
  g.closePath();
  g.fill();
  g.stroke();
}

// Pupil offsets from the eye centre: right, up, up-left, up-right, left.
const GAZES = [[1.9, 0.8], [0, -2.6], [-1.7, -2.2], [1.7, -2.2], [-2.2, 0.3]];

// `front` is the idle pose (both eyes centred, facing the viewer); the
// default is the side-on pose used while walking and shooting.
function drawSoldierTorso(g, front, gaze) {
  // a little pack with a rolled blanket, behind the body
  g.fillStyle = '#8a7a52';
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  rr(g, -26.4, -4, 9.4, 17, 2.4);
  g.fill();
  g.stroke();
  g.fillStyle = '#566a8a';
  rr(g, -27.6, -8.2, 11.6, 5.2, 2.4);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(20, 24, 36, 0.55)';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(-22.6, -8);
  g.lineTo(-22.6, -3.2);
  g.stroke();
  const gr = g.createLinearGradient(0, -22, 0, 22);
  gr.addColorStop(0, '#5088ea');
  gr.addColorStop(1, '#3365cf');
  g.fillStyle = gr;
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.fill();
  g.stroke();

  g.fillStyle = 'rgba(255, 255, 255, 0.28)';
  g.beginPath();
  g.ellipse(-10.5, -6, 3.4, 5.6, -0.25, 0, TAU);
  g.fill();

  // a webbing belt with a brass buckle and two ammo pouches
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.clip();
  g.fillStyle = '#2b3342';
  g.fillRect(-22, 11.4, 44, 4.4);
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(-22, 11.4);
  g.lineTo(22, 11.4);
  g.moveTo(-22, 15.8);
  g.lineTo(22, 15.8);
  g.stroke();
  g.fillStyle = '#8b7a4e';
  for (const px of front ? [-11.6, 11.6] : [-12.4, 1.8]) {
    rr(g, px - 3.6, 12.2, 7.2, 8, 1.4);
    g.fill();
    g.stroke();
  }
  g.restore();
  g.fillStyle = '#e5b94d';
  g.strokeStyle = OUT;
  g.lineWidth = 1;
  rr(g, front ? -2.8 : 3.8, 11.6, 5.6, 4, 1);
  g.fill();
  g.stroke();

  // eyes: white ovals in a heavy navy ring, a big black pupil pushed to the
  // upper right of each one
  for (const ex of front ? [-8.4, 8.4] : [-3.3, 12.6]) {
    g.fillStyle = '#fbfbf6';
    g.strokeStyle = '#13244a';
    g.lineWidth = 2.3;
    g.beginPath();
    g.ellipse(ex, -4.2, 4.4, 4.9, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = '#0b0c12';
    g.beginPath();
    g.arc(ex + 1.5 + gaze[0] * 0.5, -4.6 + gaze[1] * 0.5, 2.9, 0, TAU);
    g.fill();
  }

  // the smile: a thick navy bowl
  g.strokeStyle = '#13244a';
  g.lineWidth = 2;
  g.beginPath();
  if (front) g.arc(0, 2.8, 4.3, Math.PI * 0.12, Math.PI * 0.88);
  else g.arc(6.5, 2.4, 4.2, Math.PI * 0.12, Math.PI * 0.88);
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
  helmetStar(g, front);
}

// the soldier's helmet badge
function helmetStar(g, front) {
  g.fillStyle = '#e24b3d';
  g.strokeStyle = OUT;
  g.lineWidth = 0.8;
  g.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 4 : 1.7;
    const a = (i / 10) * TAU - Math.PI / 2;
    const px = (front ? 0 : 7) + Math.cos(a) * r;
    const py = -21 + Math.sin(a) * r;
    if (i === 0) g.moveTo(px, py);
    else g.lineTo(px, py);
  }
  g.closePath();
  g.fill();
  g.stroke();
}

// the muzzle flash: a small yellow disc with an orange rim
function muzzleDisc(g, x, y, r) {
  g.fillStyle = '#fff6b4';
  g.strokeStyle = '#ffc61f';
  g.lineWidth = 1.6;
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fill();
  g.stroke();
}

function drawSoldierRifle(g, firing) {
  g.lineJoin = 'round';
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  // curved magazine under the receiver
  g.fillStyle = '#2a2b33';
  g.beginPath();
  g.moveTo(7.6, 1.8);
  g.lineTo(12, 1.8);
  g.quadraticCurveTo(13.4, 6, 12.2, 10.4);
  g.lineTo(8.2, 10.4);
  g.quadraticCurveTo(8.6, 6, 7.6, 1.8);
  g.closePath();
  g.fill();
  g.stroke();
  // barrel with a front sight and a muzzle brake
  g.fillStyle = '#4a4d5a';
  rr(g, 24, -1.3, 14, 2.9, 0.8);
  g.fill();
  g.stroke();
  g.fillStyle = '#2a2b33';
  rr(g, 36.2, -2.1, 4, 4.5, 0.8);
  g.fill();
  g.stroke();
  g.fillStyle = '#2a2b33';
  g.fillRect(31, -3.6, 1.5, 2.4);
  g.strokeRect(31, -3.6, 1.5, 2.4);
  // receiver and a grooved handguard
  g.fillStyle = '#3b3d48';
  rr(g, 3.5, -3.4, 12, 6.4, 1.2);
  g.fill();
  g.stroke();
  g.fillStyle = '#4a4d5a';
  rr(g, 15, -2.9, 12, 5.4, 1);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(20, 20, 28, 0.7)';
  g.lineWidth = 0.8;
  g.beginPath();
  for (let x = 17.6; x < 26; x += 2.6) {
    g.moveTo(x, -2.2);
    g.lineTo(x, 1.8);
  }
  g.stroke();
  // ejection port and a sliver of highlight
  g.fillStyle = '#23242b';
  g.fillRect(8.5, -2.4, 4, 1.4);
  g.fillStyle = 'rgba(190, 192, 205, 0.55)';
  g.fillRect(5, -3, 10, 0.8);
  // wooden stock with a butt plate and grain
  g.strokeStyle = OUT;
  g.lineWidth = 1.1;
  g.fillStyle = '#cf9b58';
  rr(g, -7.6, -3.8, 11.8, 7.6, 1.5);
  g.fill();
  g.stroke();
  g.fillStyle = '#5b4a38';
  g.fillRect(-7.6, -3.4, 1.8, 6.8);
  g.strokeStyle = 'rgba(122, 82, 32, 0.8)';
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(-4.4, -1.8);
  g.lineTo(2.4, -1.8);
  g.moveTo(-4.4, 0.4);
  g.lineTo(2.8, 0.4);
  g.moveTo(-4.4, 2.4);
  g.lineTo(2.2, 2.4);
  g.stroke();
  if (firing) muzzleDisc(g, 48.5, 0, 4);
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
// Matched to the supplied pixel sprite: flat khaki body, flat olive hat,
// big black pupils tucked under the brim, a small smile, thick dark outlines.
const TAN_TOP = '#bfa97a';
const TAN_BOT = '#b69e6b';
const HAT = '#5a4e32';
const HAT_SHADE = '#463b25';
const INK = '#1d1a22';

export function drawSniperBody(g) {
  const gr = g.createLinearGradient(0, -22, 0, 24);
  gr.addColorStop(0, TAN_TOP);
  gr.addColorStop(1, TAN_BOT);
  g.fillStyle = gr;
  g.strokeStyle = INK;
  g.lineWidth = 1.7;
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.fill();
  g.stroke();
  // the small pale patch up by the brim
  g.fillStyle = '#cdb98a';
  g.beginPath();
  g.ellipse(-10.7, -5.4, 2.6, 2.3, 0, 0, TAU);
  g.fill();
  // ghillie camouflage: soft olive blotches and a leather belt with a brass buckle
  g.save();
  g.beginPath();
  g.ellipse(0, 0, 20.7, 23, 0, 0, TAU);
  g.clip();
  g.fillStyle = 'rgba(88, 118, 62, 0.55)';
  for (const [x, y, rx, ry, r] of [[-13, 9, 6, 3.4, 0.5], [12, 14.5, 7, 3.2, -0.3], [16, 3, 3.6, 5, 0.2], [-4, 19, 6, 2.8, 0]]) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, r, 0, TAU);
    g.fill();
  }
  g.fillStyle = '#5b3d28';
  g.fillRect(-22, 11, 44, 3.8);
  g.strokeStyle = INK;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-22, 11);
  g.lineTo(22, 11);
  g.moveTo(-22, 14.8);
  g.lineTo(22, 14.8);
  g.stroke();
  g.restore();
  g.fillStyle = '#d7aa3f';
  g.beginPath();
  g.rect(-9.6, 11.1, 4.2, 3.6);
  g.fill();
  g.stroke();
}

// Two eyes: a big black pupil with a sliver of white, hanging under the
// brim. `look` slides the pupil (-1 left .. 1 right); `blink` shuts them.
export function drawSniperEyes(g, ex, look, blink) {
  for (const x of ex) {
    if (blink) {
      g.strokeStyle = INK;
      g.lineWidth = 1.8;
      g.beginPath();
      g.moveTo(x - 4.8, -6.6);
      g.quadraticCurveTo(x, -3.4, x + 4.8, -6.6);
      g.stroke();
      continue;
    }
    g.save();
    g.beginPath();
    g.ellipse(x, -4.9, 5.5, 3.2, 0, 0, TAU);
    g.clip();
    g.fillStyle = '#fbfbf6';
    g.fillRect(x - 6, -10, 12, 9);
    g.fillStyle = '#14121a';
    g.beginPath();
    g.ellipse(x + 1.5 + look * 1.9, -4.6, 3.7, 4, 0, 0, TAU);
    g.fill();
    g.restore();
    g.strokeStyle = INK;
    g.lineWidth = 1.4;
    g.beginPath();
    g.ellipse(x, -4.9, 5.5, 3.2, 0, 0, TAU);
    g.stroke();
  }
}

// The small smile: a shallow U with a tiny tick at each corner.
function drawSniperSmile(g, mx) {
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(mx, 2.85, 5.55, Math.PI / 2 - 1.01, Math.PI / 2 + 1.01);
  g.stroke();
  g.strokeStyle = 'rgba(29, 26, 34, 0.55)';
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(mx - 4.7, 5.8);
  g.lineTo(mx - 5, 4.3);
  g.moveTo(mx + 4.7, 5.8);
  g.lineTo(mx + 5, 4.3);
  g.stroke();
}

// look: -1 left, 0 centre, 1 right. front: facing the viewer (idle).
function drawSniperTorso(g, front, look, blink) {
  drawSniperBody(g);
  if (front) {
    drawSniperEyes(g, [-8.4, 8.4], look, blink);
    drawSniperSmile(g, 0);
  } else {
    drawSniperEyes(g, [-1.5, 14.2], look, blink);
    drawSniperSmile(g, 6.85);
  }
}

// Origin is the centre of the brim, so the hat can tip about it.
export function drawSniperHat(g) {
  g.fillStyle = HAT;
  g.strokeStyle = INK;
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-13, -2.6);
  g.bezierCurveTo(-13, -9, -9.6, -11.9, -4, -11.9);
  g.lineTo(4, -11.9);
  g.bezierCurveTo(9.6, -11.9, 13, -9, 13, -2.6);
  g.closePath();
  g.fill();
  g.stroke();
  // the long, thin, pointed brim
  g.beginPath();
  g.moveTo(-32.4, 0);
  g.quadraticCurveTo(-16, -5.2, 0, -5.2);
  g.quadraticCurveTo(16, -5.2, 32.4, 0);
  g.quadraticCurveTo(16, 5.4, 0, 5.4);
  g.quadraticCurveTo(-16, 5.4, -32.4, 0);
  g.closePath();
  g.fill();
  g.stroke();
  g.strokeStyle = HAT_SHADE;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-24, 2.7);
  g.quadraticCurveTo(0, 4.7, 24, 2.7);
  g.stroke();
  // two small leaves tucked in the hat band
  g.fillStyle = '#5f9a47';
  g.strokeStyle = INK;
  g.lineWidth = 0.9;
  for (const [x, y, r] of [[-9.6, -8.6, -1.1], [10.2, -8.4, 1.1]]) {
    g.save();
    g.translate(x, y);
    g.rotate(r);
    g.beginPath();
    g.ellipse(0, -2.2, 1.6, 3.2, 0, 0, TAU);
    g.fill();
    g.stroke();
    g.restore();
  }
}

// Receiver, barrel and scope; origin is the centre of the receiver.
function drawSniperRifleParts(g, firing) {
  g.lineJoin = 'round';
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  // magazine / grip
  g.fillStyle = '#3d414c';
  rr(g, 8.3, 1.2, 4, 5.4, 0.6);
  g.fill();
  g.stroke();
  // folded bipod legs under the barrel
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(30, 1);
  g.lineTo(26.5, 6.4);
  g.moveTo(31.5, 1);
  g.lineTo(35, 6.2);
  g.stroke();
  g.strokeStyle = '#6b6f7c';
  g.lineWidth = 0.8;
  g.beginPath();
  g.moveTo(30, 1);
  g.lineTo(26.5, 6.4);
  g.moveTo(31.5, 1);
  g.lineTo(35, 6.2);
  g.stroke();
  // long barrel with its pale top edge, then a fat muzzle brake
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  g.fillStyle = '#3d414c';
  rr(g, 5.5, -3.8, 36, 5, 0.6);
  g.fill();
  g.stroke();
  g.fillStyle = '#2b2d35';
  rr(g, 41, -4.6, 6, 6.6, 0.8);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(190, 192, 205, 0.6)';
  g.lineWidth = 0.7;
  g.beginPath();
  g.moveTo(43, -3.8);
  g.lineTo(43, 1.2);
  g.moveTo(45, -3.8);
  g.lineTo(45, 1.2);
  g.stroke();
  g.fillStyle = 'rgba(150, 152, 162, 0.85)';
  g.fillRect(7, -5, 33, 1.1);
  // scope: a tube on two mounts with lens rings at each end
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  g.fillStyle = '#26272e';
  g.fillRect(5, -6, 3, 2.6);
  g.strokeRect(5, -6, 3, 2.6);
  g.fillRect(24, -6, 3, 2.6);
  g.strokeRect(24, -6, 3, 2.6);
  rr(g, 12, -10.5, 17, 4.6, 1.4);
  g.fill();
  g.stroke();
  g.fillStyle = '#3d414c';
  rr(g, 10.2, -11.2, 3.4, 6, 0.8);
  g.fill();
  g.stroke();
  rr(g, 27.4, -11.6, 3.8, 7, 0.8);
  g.fill();
  g.stroke();
  g.fillStyle = 'rgba(140, 190, 235, 0.8)';
  g.fillRect(30.4, -10.4, 0.9, 4.6);
  g.fillStyle = 'rgba(150, 152, 162, 0.8)';
  g.fillRect(13.5, -10.1, 12, 0.8);
  // bolt handle sticking out of the receiver
  g.strokeStyle = INK;
  g.lineWidth = 1.2;
  g.fillStyle = '#3d414c';
  g.beginPath();
  g.moveTo(3, -2.6);
  g.lineTo(0.6, -6.4);
  g.stroke();
  g.beginPath();
  g.arc(0.2, -6.9, 1.5, 0, TAU);
  g.fill();
  g.stroke();
  // receiver (walnut-and-brass look) and stock sliver
  g.fillStyle = '#cc9957';
  rr(g, -5.5, -2.8, 11, 6, 0.6);
  g.fill();
  g.stroke();
  g.fillStyle = '#5a3d28';
  g.fillRect(-4.9, -2.2, 9.8, 1);
  g.fillStyle = '#a77836';
  rr(g, -9.6, -2.2, 5, 5, 0.8);
  g.fill();
  g.stroke();
  if (firing) muzzleDisc(g, 55.5, -1.4, 4.4);
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
  g.strokeStyle = INK;
  g.lineWidth = 1.7;
  g.beginPath();
  g.ellipse(-3, 1, 25, 14.5, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#cdb98a';
  g.beginPath();
  g.ellipse(-14, -6, 4.6, 2.2, -0.15, 0, TAU);
  g.fill();

  g.save();
  g.translate(8, 7.5);
  drawSniperRifleParts(g, firing);
  g.restore();

  drawSniperEyes(g, [5, 15], 1, false);
  drawSniperSmile(g, 10.5);

  g.save();
  g.translate(13, -8);
  g.rotate(0.22);
  g.scale(0.85, 0.85);
  drawSniperHat(g);
  g.restore();
}

export function buildSprites() {
  const soldierFeet = FEET_POSES.map((pose) => makeLayer(-30, 16, 32, 37, (g) => drawFeet(g, pose, false)));
  const sniperFeet = FEET_POSES.map((pose) => makeLayer(-30, 16, 32, 38, (g) => drawFeet(g, pose, true)));
  const sprites = {
    soldier: {
      feet: soldierFeet,
      torso: makeLayer(-26, -27, 27, 23, (g) => drawSoldierTorso(g, false, GAZES[0])),
      // standing around he faces sideways too, eyes wandering upward
      torsoSide: GAZES.map((gz) => makeLayer(-26, -27, 27, 23, (g) => drawSoldierTorso(g, false, gz))),
      rifle: makeLayer(-9, -11, 51, 11, (g) => drawSoldierRifle(g, false)),
      rifleFire: makeLayer(-9, -11, 51, 11, (g) => drawSoldierRifle(g, true)),
      ghost: makeLayer(-18, -24, 18, 28, (g) => drawGhost(g, false)),
    },
    sniper: {
      feet: sniperFeet,
      torso: makeLayer(-26, -24, 27, 25, (g) => drawSniperTorso(g, false, 1, false)),
      // idle faces the viewer: look left, centre, right, then a blink
      torsoSide: [-1, 0, 1].map((look) => makeLayer(-26, -24, 27, 25, (g) => drawSniperTorso(g, false, look, false)))
        .concat([makeLayer(-26, -24, 27, 25, (g) => drawSniperTorso(g, false, 1, true))]),
      hat: makeLayer(-36, -16, 36, 8, drawSniperHat),
      rifle: makeLayer(-9, -14, 54, 12, (g) => drawSniperRifleParts(g, false)),
      rifleFire: makeLayer(-9, -14, 60, 12, (g) => drawSniperRifleParts(g, true)),
      prone: makeLayer(-38, -24, 64, 24, (g) => drawSniperProne(g, false)),
      proneFire: makeLayer(-38, -24, 64, 24, (g) => drawSniperProne(g, true)),
      ghost: makeLayer(-30, -34, 30, 28, (g) => drawGhost(g, true)),
    },
    hurt: [1, 2].map((level) => makeLayer(-26, -27, 27, 23, (g) => drawHurt(g, level))),
    ring: {},
  };
  // Team battle: a thin coloured ring under the feet with a faint fill.
  for (const t of Object.values(TEAMS)) {
    const w = 50 * K;
    const h = 19 * K;
    const c = document.createElement('canvas');
    c.width = Math.ceil(w * SCALE * 2);
    c.height = Math.ceil(h * SCALE * 2);
    const g = c.getContext('2d');
    g.scale(c.width / w, c.height / h);
    g.fillStyle = t.ring + '33';
    g.strokeStyle = t.ring;
    g.lineWidth = 1.1;
    g.beginPath();
    g.ellipse(w / 2, h / 2, w / 2 - 1, h / 2 - 1, 0, 0, TAU);
    g.fill();
    g.stroke();
    sprites.ring[t.id] = { canvas: c, x: -w / 2, y: -h / 2, w, h };
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
  sniper: { w: 84, ox: 34 },
};
export function paintIcon(canvas, sprites, species) {
  const cfg = ICON[species];
  const S = sprites[species];
  const g = canvas.getContext('2d');
  const m = canvas.width / (cfg.w * K);
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  g.translate((cfg.ox * canvas.width) / cfg.w, (39 * canvas.width) / cfg.w);
  g.scale(m, m);
  drawLayer(g, S.feet[0]);
  drawLayer(g, S.torso);
  if (species === 'sniper') {
    g.save();
    g.translate(0, -11.6 * K);
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
  g.fillStyle = HAT;
  g.beginPath();
  g.ellipse(0, 0.4, 19, 2.8, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.restore();
}

// The Wizard's lightning (Gibbondore's is drawn the same way): a thin line through `pts` with a soft glow round it and a
// white heart. Each leg bends gently, and the bends shift as it burns. `age`: how long it has been there; `layers`:
// [colour as 'r, g, b', strength, width], from the outside in
export function drawArcLine(ctx, pts, age, seed0, fade, layers) {
  let seed = Math.floor(age * 24) * 31 + seed0;
  const rnd = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };
  rnd();
  const path = [pts[0]];
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1];
    const [x1, y1] = pts[i];
    const len = Math.hypot(x1 - x0, y1 - y0) || 1;
    const n = Math.max(2, Math.round(len / 18));
    for (let k = 1; k < n; k++) {
      const off = (rnd() - 0.5) * 6;
      path.push([x0 + ((x1 - x0) * k) / n - ((y1 - y0) / len) * off, y0 + ((y1 - y0) * k) / n + ((x1 - x0) / len) * off]);
    }
    path.push([x1, y1]);
  }
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [rgb, strength, wide] of layers) {
    ctx.strokeStyle = `rgba(${rgb}, ${strength * fade})`;
    ctx.lineWidth = wide;
    ctx.beginPath();
    path.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
    ctx.stroke();
  }
}
