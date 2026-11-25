import { TAU } from './config.js?v=161';
import { OUT } from './sprites.js?v=161';
import { G, vgrad, fs, ell, circ, blob, poly, stick, ribbon, eye, shadow, leg } from './art_kit.js?v=161';

// Mythical creatures that aren't egg-shaped: slime, giant, dragon.

function slime(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  // hopping: squashes flat on landing, stretches tall in the air
  const hop = mv ? Math.abs(Math.sin(ph * TAU)) : 0;
  const sy = mv ? 1 + hop * 0.2 - (1 - hop) * 0.04 : 1 + Math.sin(ph * TAU * 2) * 0.02;
  const sx = 1 / Math.sqrt(sy);
  shadow(g, 0, 32 - hop * 6, 0.2 - hop * 0.07);
  g.save();
  g.translate(0, G - hop * 8);
  g.scale(sx, sy);
  const body = [[-25, 0], [-24.5, -10], [-17, -22], [0, -27], [17, -22], [24.5, -10], [25, 0], [12, 1.5], [-12, 1.5]];
  const gr = g.createLinearGradient(0, -27, 0, 2);
  gr.addColorStop(0, '#ff9fd6');
  gr.addColorStop(1, '#ec5aa8');
  blob(g, body, gr, 2);
  // glossy highlights
  g.fillStyle = 'rgba(255, 255, 255, 0.55)';
  g.beginPath();
  g.ellipse(-12, -18, 6, 3, -0.6, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(255, 255, 255, 0.25)';
  g.beginPath();
  g.ellipse(14, -6, 5, 3, 0.3, 0, TAU);
  g.ellipse(-17, -6, 2.4, 1.6, 0, 0, TAU);
  g.fill();
  eye(g, -6.5, -11, 5, 2.8, 0.55, 1.6);
  eye(g, 8.5, -11, 5, 2.8, 0.55, 1.6);
  g.strokeStyle = OUT;
  g.lineWidth = 1.4;
  g.beginPath();
  if (st.open) {
    g.fillStyle = '#7a1f4a';
    g.ellipse(1.5, -2.6, 3.6, 2.8, 0, 0, TAU);
    g.fill();
    g.stroke();
  } else {
    g.arc(1.5, -5.4, 4, Math.PI * 0.15, Math.PI * 0.85);
    g.stroke();
  }
  g.restore();
}

function giant(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  const pose = st.pose || 'rest';
  const bob = mv ? Math.abs(Math.sin(ph * TAU * 2)) * 1.3 : 0;
  const skin = '#d9977f';
  const skinDark = '#b87560';
  shadow(g, 2, 46);
  // legs
  const stomp = (off) => (mv ? Math.max(0, Math.cos((ph + off) * TAU)) * 4 : 0);
  stick(g, [[-9, 8], [-10, G - 3 - stomp(0.5)]], 13, skinDark, 1.4);
  ell(g, -10, G - 1.6 - stomp(0.5), 8.5, 3.4, '#8a5a48', 1.4);
  stick(g, [[10, 8], [11, G - 3 - stomp(0)]], 13.5, skin, 1.4);
  ell(g, 11, G - 1.6 - stomp(0), 9, 3.5, '#9a6650', 1.4);
  g.save();
  g.translate(0, -bob);
  // far arm resting on the belly
  stick(g, [[-12, -22], [-22, -8], [-12, 0]], 10, skinDark, 1.3);
  // big potbelly body
  blob(g, [[-27, -8], [-22, -30], [0, -38], [22, -30], [28, -8], [22, 12], [0, 18], [-22, 12]], vgrad(g, -38, 18, '#e3a58c', '#c88670'), 2.1);
  g.fillStyle = 'rgba(255, 220, 200, 0.28)';
  g.beginPath();
  g.ellipse(4, -2, 15, 13, 0, 0, TAU);
  g.fill();
  // hairy patches on the chest
  g.strokeStyle = '#7a4d38';
  g.lineWidth = 1;
  for (const [x, y] of [[-12, -24], [-4, -26], [6, -25], [14, -22], [-14, -16], [18, -14]]) {
    g.beginPath();
    g.moveTo(x, y);
    g.lineTo(x + 1.6, y + 3.4);
    g.moveTo(x + 2.6, y);
    g.lineTo(x + 3.6, y + 3);
    g.stroke();
  }
  // loincloth
  g.beginPath();
  g.moveTo(-23, 4);
  g.quadraticCurveTo(0, 10, 23, 4);
  g.lineTo(21, 14);
  g.lineTo(15, 11);
  g.lineTo(10, 18);
  g.lineTo(4, 12);
  g.lineTo(-2, 19);
  g.lineTo(-8, 12);
  g.lineTo(-15, 17);
  g.lineTo(-21, 12);
  g.closePath();
  fs(g, '#8d7a4a', 1.7);
  stick(g, [[-22, 4], [22, 4]], 3, '#5a4a2a', 0.9);
  // head: sits low and wide on the shoulders
  blob(g, [[-14, -40], [-8, -53], [8, -57], [20, -48], [22, -35], [10, -28], [-8, -29]], vgrad(g, -57, -28, '#e6aa91', '#c88a73'), 2);
  // ear
  ell(g, -9, -41, 4.2, 5.4, skinDark, 1.5);
  // scruffy hair
  g.fillStyle = '#7a4d2e';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-10, -52);
  g.lineTo(-12, -60);
  g.lineTo(-5, -55);
  g.lineTo(-3, -63);
  g.lineTo(3, -57);
  g.lineTo(7, -63);
  g.lineTo(10, -55);
  g.lineTo(16, -58);
  g.lineTo(14, -50);
  g.closePath();
  g.fill();
  g.stroke();
  // one big eye
  circ(g, 12, -43, 7.8, '#fdfdf8', 1.8);
  g.fillStyle = '#0d0b10';
  g.beginPath();
  g.arc(14.2, -42.4, 3.9, 0, TAU);
  g.fill();
  g.fillStyle = '#fff';
  g.beginPath();
  g.arc(15.4, -43.8, 1.1, 0, TAU);
  g.fill();
  g.strokeStyle = '#4a2a1c';
  g.lineWidth = 2.4;
  g.beginPath();
  g.moveTo(3.4, -51);
  g.lineTo(19.8, -47.4);
  g.stroke();
  // bumpy nose, mouth and tusks
  circ(g, 20.8, -38.5, 3.1, '#d78a76', 1.4);
  g.strokeStyle = '#4a2a1c';
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(7, -33.5);
  g.quadraticCurveTo(14, st.open ? -29 : -32, 20, -33.6);
  g.stroke();
  poly(g, [[8.4, -33.4], [10.4, -33], [9.6, -37.6]], '#fbf8ea', 1);
  poly(g, [[16, -33.2], [18, -33.8], [18, -38]], '#fbf8ea', 1);
  // scar
  g.strokeStyle = '#a04a42';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-3, -36);
  g.lineTo(2, -32);
  g.stroke();
  g.restore();
  // near arm and club
  g.save();
  g.translate(0, -bob);
  const shoulder = [20, -22];
  const hand = pose === 'raise' ? [24, -36] : pose === 'slam' ? [34, -8] : [31, -9];
  stick(g, [shoulder, [27, pose === 'raise' ? -30 : -16], hand], 11, skin, 1.4);
  g.save();
  g.translate(hand[0], hand[1]);
  g.rotate(pose === 'raise' ? -1.85 : pose === 'slam' ? 0.7 : -1.1);
  // wooden club, thin handle to a thick studded head
  g.beginPath();
  g.moveTo(-6, -2.2);
  g.lineTo(22, -3.4);
  g.quadraticCurveTo(40, -9.4, 52, -7.4);
  g.quadraticCurveTo(58, -1, 52, 6.4);
  g.quadraticCurveTo(40, 8, 22, 3.4);
  g.lineTo(-6, 2.2);
  g.closePath();
  fs(g, vgrad(g, -9, 8, '#9a6a3a', '#6e4624'), 1.9);
  g.fillStyle = '#4b2f18';
  for (const [x, y] of [[36, -4], [44, 1], [40, 4.4], [48, -5]]) {
    g.beginPath();
    g.arc(x, y, 1.3, 0, TAU);
    g.fill();
  }
  g.strokeStyle = 'rgba(40, 22, 10, 0.5)';
  g.lineWidth = 0.9;
  g.beginPath();
  g.moveTo(14, -1.5);
  g.lineTo(30, -1.8);
  g.stroke();
  g.restore();
  // fist over the handle
  circ(g, hand[0] + 1.5, hand[1] + 0.5, 5.8, skin, 1.5);
  g.restore();
}

function dragon(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  const bob = mv ? Math.abs(Math.sin(ph * TAU * 2)) * 1 : Math.sin(ph * TAU) * 0.4;
  const flap = st.pose === 'breath' ? Math.sin(ph * TAU * 3) * 0.2 - 0.2 : Math.sin(ph * TAU * (mv ? 2 : 1)) * 0.1;
  const red = '#cf3b2c';
  const redDark = '#9c2a20';
  // tail
  ribbon(g, [[-28, 8], [-42, 11], [-54, 7], [-64, -1], [-70, -4]], 12, 2.4, vgrad(g, 0, 20, '#cf3b2c', '#a02c22'), 1.9);
  poly(g, [[-66, -3], [-76, -9], [-72, 1]], '#e8b84a', 1.4);
  // far legs
  leg(g, -18, 15, 10, 8, redDark, ph, 0.5, 4.5, 3.4, '#4a1a14', !mv);
  leg(g, 16, 15, 10, 8, redDark, ph, 0, 4.5, 3.4, '#4a1a14', !mv);
  g.save();
  g.translate(0, -bob);
  // far wing
  const wing = (dx, col, alpha) => {
    g.save();
    g.translate(-6, -4);
    g.rotate(flap + dx);
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(-14, -34);
    g.quadraticCurveTo(-8, -26, -2, -33);
    g.quadraticCurveTo(2, -24, 8, -30);
    g.quadraticCurveTo(10, -18, 14, -16);
    g.quadraticCurveTo(8, -10, 8, 0);
    g.closePath();
    fs(g, col, 1.7);
    g.strokeStyle = `rgba(28, 26, 34, ${alpha})`;
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(0, 0);
    g.lineTo(-14, -34);
    g.moveTo(0, 0);
    g.lineTo(8, -30);
    g.stroke();
    g.restore();
  };
  wing(-0.35, '#8a2a24', 0.9);
  // body and belly
  blob(g, [[-32, 8], [-24, -6], [0, -9], [24, -4], [32, 8], [24, 20], [0, 24], [-26, 19]], vgrad(g, -9, 24, '#d9402f', '#a42b21'), 2.1);
  g.save();
  g.beginPath();
  g.ellipse(0, 8, 31, 16, 0, 0, TAU);
  g.clip();
  g.fillStyle = vgrad(g, 12, 26, '#f3d06a', '#e0aa3a');
  g.beginPath();
  g.moveTo(-34, 16);
  g.quadraticCurveTo(0, 12, 34, 14);
  g.lineTo(34, 30);
  g.lineTo(-34, 30);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(150, 90, 20, 0.55)';
  g.lineWidth = 0.9;
  for (let x = -26; x <= 26; x += 6.4) {
    g.beginPath();
    g.moveTo(x, 15.5);
    g.lineTo(x + 1, 24);
    g.stroke();
  }
  g.restore();
  ell(g, 0, 8, 31, 16, null, 2.1);
  // yellow spikes along the back
  g.fillStyle = '#ecc04e';
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  for (let i = 0; i < 6; i++) {
    const x = -24 + i * 8.6;
    const y = -8.2 + Math.abs(x) * 0.07;
    g.beginPath();
    g.moveTo(x - 2.8, y + 1.6);
    g.lineTo(x + 0.4, y - 5.2);
    g.lineTo(x + 3.2, y + 1.6);
    g.closePath();
    g.fill();
    g.stroke();
  }
  // neck and head
  ribbon(g, [[20, 0], [29, -7], [35, -15]], 15, 11, vgrad(g, -16, 4, '#d9402f', '#b2301f'), 1.9);
  g.save();
  g.translate(37, -18);
  g.rotate(st.open ? -0.12 : 0.05);
  // horns and frill
  poly(g, [[-6, -6], [-17, -14], [-9, -1]], '#e8d9a0', 1.3);
  poly(g, [[-2, -8], [-8, -19], [2, -9]], '#e8d9a0', 1.3);
  // skull and upper jaw
  blob(g, [[-9, -2], [-4, -9], [6, -9], [16, -6], [24, -3], [24, 2], [8, 5], [-6, 5]], vgrad(g, -9, 5, '#dc4531', '#b02d20'), 1.9);
  g.fillStyle = '#17141a';
  g.beginPath();
  g.ellipse(21, -2.4, 1.2, 0.9, 0, 0, TAU);
  g.fill();
  // eye
  circ(g, 5, -4, 3.2, '#f5d22e', 1.4);
  g.fillStyle = '#17141a';
  g.beginPath();
  g.ellipse(5.8, -4, 0.8, 2.2, 0, 0, TAU);
  g.fill();
  g.strokeStyle = OUT;
  g.lineWidth = 1.7;
  g.beginPath();
  g.moveTo(0, -8.6);
  g.lineTo(9.6, -6.2);
  g.stroke();
  // lower jaw
  g.save();
  g.translate(2, 4);
  g.rotate(st.open ? 0.5 : 0.02);
  blob(g, [[0, 0], [10, -0.4], [21, -1], [22, 3], [8, 5], [-2, 3.4]], vgrad(g, -1, 5, '#cc3a29', '#9c2a20'), 1.6);
  if (st.open) {
    g.fillStyle = '#ffb347';
    g.beginPath();
    g.moveTo(2, -0.6);
    g.lineTo(20, -0.8);
    g.lineTo(12, -4);
    g.closePath();
    g.fill();
  }
  g.restore();
  // teeth
  g.fillStyle = '#fbf8ea';
  g.strokeStyle = OUT;
  g.lineWidth = 0.7;
  for (const x of [12, 17, 21]) {
    g.beginPath();
    g.moveTo(x - 1.2, 3.4);
    g.lineTo(x, 6.4);
    g.lineTo(x + 1.2, 3.2);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.restore();
  // near wing
  wing(0.18, '#a82f26', 1);
  g.restore();
  leg(g, -10, 16, 9, 8.6, red, ph, 0, 4.5, 3.4, '#4a1a14', !mv);
  leg(g, 24, 16, 9, 8.6, red, ph, 0.5, 4.5, 3.4, '#4a1a14', !mv);
}

function mechazord(g, st) {
  // MechaZord: a huge upright kaiju in silver armour, part Mecha-Godzilla (tall dorsal fins, a heavy snout and jaw,
  // a thick tail) and part Iron Man (a glowing arc-reactor chest, a faceplate with light-blue eye slits, repulsor palms and
  // boot jets). He hovers.
  const ph = st.ph;
  const mv = st.moving;
  const bob = mv ? Math.abs(Math.sin(ph * TAU * 2)) * 1 : Math.sin(ph * TAU) * 0.4;
  const red = '#bcc4d1';
  const redDark = '#6c7689';
  const gold = '#e3e8f0';
  const goldDark = '#59637a';
  const iron = '#2a303c';
  const steel = '#b8c2d3';
  const glow = '#ff4a2a';
  const bolt = (x, y) => {
    g.fillStyle = '#e9edf4';
    g.strokeStyle = OUT;
    g.lineWidth = 0.8;
    g.beginPath();
    g.arc(x, y, 1.3, 0, TAU);
    g.fill();
    g.stroke();
  };
  const joint = (x, y, r) => {
    g.fillStyle = steel;
    g.strokeStyle = OUT;
    g.lineWidth = 1.2;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = iron;
    g.beginPath();
    g.arc(x, y, r * 0.42, 0, TAU);
    g.fill();
  };
  // everything is drawn bigger, scaled about the ground line
  g.save();
  g.translate(0, 26);
  g.scale(1.8, 1.8);
  g.translate(0, -26);
  // a thick tail of armoured segments with gold bands, ending in a blade
  ribbon(g, [[-16, 8], [-32, 11], [-50, 6], [-66, -5], [-80, -15]], 22, 2.6, vgrad(g, -14, 20, '#dde3ec', '#566073'), 1.9);
  g.strokeStyle = goldDark;
  g.lineWidth = 2;
  for (const [x, y, h] of [[-26, 8, 9], [-38, 9, 8], [-50, 4, 7], [-62, -4, 5.5], [-72, -10, 4]]) {
    g.beginPath();
    g.moveTo(x, y - h);
    g.lineTo(x + 1.4, y + h);
    g.stroke();
  }
  poly(g, [[-76, -12], [-94, -23], [-85, -6]], gold, 1.4);
  // far leg
  leg(g, 8, 17, 12, 11, redDark, ph, 0.5, 5, 4, iron, !mv);
  g.save();
  g.translate(0, -bob);
  // the dorsal fins: gold maple-leaf plates with a glowing cyan core, tallest in the middle
  const fin = (x, y, s, rot) => {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.beginPath();
    g.moveTo(-5 * s, 0);
    g.lineTo(-7 * s, -9 * s);
    g.lineTo(-3 * s, -7 * s);
    g.lineTo(-2 * s, -18 * s);
    g.lineTo(2.4 * s, -9 * s);
    g.lineTo(6 * s, -15 * s);
    g.lineTo(6.5 * s, -4 * s);
    g.lineTo(7 * s, 0);
    g.closePath();
    g.fillStyle = vgrad(g, -18 * s, 0, '#f2f4f9', '#8793a8');
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = 1.5;
    g.stroke();
    g.strokeStyle = glow;
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-2 * s, -16 * s);
    g.lineTo(-0.5 * s, -3 * s);
    g.stroke();
    g.restore();
  };
  fin(-22, 8, 0.8, -1.25);
  fin(-24, -2, 1.0, -1.1);
  fin(-23, -13, 1.15, -0.95);
  fin(-17, -24, 1.25, -0.7);
  fin(-8, -32, 1.05, -0.4);
  // the torso: a tall red armoured barrel chest with a gold belly plate
  const torso = [[-18, 8], [-22, -8], [-15, -27], [1, -34], [16, -27], [22, -9], [19, 11], [2, 21], [-12, 19]];
  blob(g, torso, vgrad(g, -34, 21, '#e1e6ee', '#6b758a'), 2.1);
  g.save();
  g.beginPath();
  torso.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.clip();
  g.fillStyle = vgrad(g, 4, 22, '#c8cfdb', '#7a8497');
  g.beginPath();
  g.moveTo(-8, 4);
  g.quadraticCurveTo(8, 1, 22, 4);
  g.lineTo(22, 24);
  g.lineTo(-8, 24);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(36, 42, 56, 0.7)';
  g.lineWidth = 1;
  for (const y of [9, 14, 19]) {
    g.beginPath();
    g.moveTo(-6, y);
    g.quadraticCurveTo(8, y - 2, 22, y);
    g.stroke();
  }
  // panel seams and vents on the red chest
  g.strokeStyle = 'rgba(18, 22, 32, 0.7)';
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(-14, -20);
  g.lineTo(-6, 2);
  g.moveTo(14, -22);
  g.lineTo(8, -10);
  for (const x of [-12, -9, -6]) {
    g.moveTo(x, -4);
    g.lineTo(x - 1.5, 3);
  }
  g.stroke();
  g.restore();
  bolt(-14, -14);
  bolt(-9, 4);
  bolt(18, -14);
  bolt(16, 8);
  // shoulder spikes and a big gold pauldron
  poly(g, [[-6, -30], [-4, -44], [2, -31]], gold, 1.4);
  poly(g, [[14, -28], [24, -42], [22, -25]], gold, 1.4);
  g.fillStyle = vgrad(g, -30, -14, '#f2f4f9', '#7a8497');
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(14, -19, 9.6, 8, -0.3, 0, TAU);
  g.fill();
  g.stroke();
  g.strokeStyle = '#a7b0c1';
  g.lineWidth = 2;
  g.beginPath();
  g.ellipse(14, -19, 6.4, 5, -0.3, Math.PI * 0.1, Math.PI * 0.9);
  g.stroke();
  // the arc reactor: a gold ring around a blazing light-blue core
  const core = g.createRadialGradient(8, -4, 0.5, 8, -4, 12);
  core.addColorStop(0, '#ffffff');
  core.addColorStop(0.3, glow);
  core.addColorStop(1, 'rgba(124, 243, 255, 0)');
  g.fillStyle = core;
  g.beginPath();
  g.arc(8, -4, 12, 0, TAU);
  g.fill();
  g.fillStyle = goldDark;
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(8, -4, 6.2, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#ffe2c0';
  g.beginPath();
  g.arc(8, -4, 4.2, 0, TAU);
  g.fill();
  g.strokeStyle = glow;
  g.lineWidth = 1.2;
  g.beginPath();
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * TAU;
    g.moveTo(8 + Math.cos(a) * 1.6, -4 + Math.sin(a) * 1.6);
    g.lineTo(8 + Math.cos(a) * 4.2, -4 + Math.sin(a) * 4.2);
  }
  g.stroke();
  // an armoured arm ending in a glowing repulsor palm
  g.save();
  g.translate(16, -18);
  g.strokeStyle = OUT;
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(8, 9);
  g.lineTo(16, 6);
  g.stroke();
  g.strokeStyle = red;
  g.lineWidth = 4.4;
  g.stroke();
  g.strokeStyle = gold;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(9, 9.4);
  g.lineTo(16, 6);
  g.stroke();
  joint(8, 9, 3.1);
  const palm = g.createRadialGradient(18, 6, 0.5, 18, 6, 7);
  palm.addColorStop(0, '#ffffff');
  palm.addColorStop(0.45, glow);
  palm.addColorStop(1, 'rgba(124, 243, 255, 0)');
  g.fillStyle = palm;
  g.beginPath();
  g.arc(18, 6, 7, 0, TAU);
  g.fill();
  circ(g, 18, 6, 3, glow, 1.3);
  for (const [dx, dy] of [[6, -3.4], [7.4, 1.4], [5, 5.6]]) {
    g.strokeStyle = OUT;
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(16, 6);
    g.lineTo(16 + dx, 6 + dy);
    g.stroke();
    g.strokeStyle = gold;
    g.lineWidth = 1.4;
    g.stroke();
  }
  g.restore();
  // the head: a heavy gold faceplate snout, light-blue eye slits, a hinged jaw full of steel teeth
  g.save();
  g.translate(10, -40);
  g.rotate(st.open ? -0.12 : 0.04);
  poly(g, [[-8, -8], [-17, -19], [-4, -10]], red, 1.3);
  poly(g, [[-2, -10], [-7, -24], [4, -12]], red, 1.3);
  blob(g, [[-10, -3], [-5, -11], [8, -12], [20, -9], [30, -4], [31, 3], [10, 6], [-8, 5]], vgrad(g, -12, 6, '#eef1f7', '#7c869a'), 1.9);
  g.strokeStyle = 'rgba(110, 70, 10, 0.7)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-6, 0);
  g.lineTo(6, 2);
  g.moveTo(14, -8);
  g.lineTo(14, 3);
  g.stroke();
  // two slanted glowing eye slits
  g.fillStyle = iron;
  g.beginPath();
  g.moveTo(-3, -8);
  g.lineTo(16, -11);
  g.lineTo(16, -5);
  g.lineTo(-1, -3);
  g.closePath();
  g.fill();
  const eyeG = g.createLinearGradient(0, -7, 15, -8);
  eyeG.addColorStop(0, '#ffd8c8');
  eyeG.addColorStop(1, glow);
  g.fillStyle = eyeG;
  g.beginPath();
  g.moveTo(0, -6.6);
  g.lineTo(14.6, -9.4);
  g.lineTo(14.6, -6.6);
  g.lineTo(1, -4.4);
  g.closePath();
  g.fill();
  g.fillStyle = 'rgba(255, 60, 40, 0.38)';
  g.beginPath();
  g.ellipse(8, -7, 11, 5, -0.12, 0, TAU);
  g.fill();
  g.fillStyle = iron;
  g.beginPath();
  g.ellipse(27, -2, 1.5, 1.1, 0, 0, TAU);
  g.fill();
  g.save();
  g.translate(0, 4);
  g.rotate(st.open ? 0.55 : 0.02);
  blob(g, [[0, 0], [12, -0.5], [26, -1], [28, 3.6], [10, 6.4], [-2, 4]], vgrad(g, -1, 6, '#ccd3de', '#626c80'), 1.6);
  if (st.open) {
    g.fillStyle = '#ffb347';
    g.beginPath();
    g.moveTo(2, -0.6);
    g.lineTo(25, -0.8);
    g.lineTo(14, -5);
    g.closePath();
    g.fill();
  }
  g.restore();
  g.fillStyle = '#f3f5f9';
  g.strokeStyle = OUT;
  g.lineWidth = 0.7;
  for (const x of [11, 15.5, 20, 24.5, 28]) {
    g.beginPath();
    g.moveTo(x - 1.4, 3.8);
    g.lineTo(x, 7.6);
    g.lineTo(x + 1.4, 3.6);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.restore();
  joint(2, -29, 3.4);
  g.restore();
  // near leg and a bright repulsor jet under each foot
  leg(g, -10, 17, 12, 11, red, ph, 0, 5, 4, iron, !mv);
  joint(-10, 14, 3);
  joint(8, 14, 3);
  const jet = 0.75 + 0.25 * Math.sin(ph * TAU * 3);
  for (const x of [-10, 8]) {
    const jg = g.createLinearGradient(0, 26, 0, 26 + 8 * jet);
    jg.addColorStop(0, 'rgba(255, 244, 210, 0.95)');
    jg.addColorStop(0.4, 'rgba(255, 150, 50, 0.7)');
    jg.addColorStop(1, 'rgba(255, 150, 50, 0)');
    g.fillStyle = jg;
    g.beginPath();
    g.moveTo(x - 5, 26);
    g.lineTo(x, 26 + 8 * jet);
    g.lineTo(x + 5, 26);
    g.closePath();
    g.fill();
  }
  g.restore();
}

export const MYTHIC = {
  slime: { draw: slime, box: [-32, -34, 32, 30] },
  giant: { draw: giant, box: [-34, -72, 86, 30] },
  dragon: { draw: dragon, box: [-82, -60, 66, 30] },
  mechazord: { draw: mechazord, box: [-176, -142, 90, 48] },
};
