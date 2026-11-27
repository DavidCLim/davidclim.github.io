import { TAU } from './config.js?v=245';
import { OUT } from './sprites.js?v=245';
import { G, vgrad, fs, ell, circ, blob, poly, stick, ribbon, eye, shadow, leg } from './art_kit.js?v=245';

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

export const MYTHIC = {
  slime: { draw: slime, box: [-32, -34, 32, 30] },
  giant: { draw: giant, box: [-34, -72, 86, 30] },
  dragon: { draw: dragon, box: [-82, -60, 66, 30] },
};
