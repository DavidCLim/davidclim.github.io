import { TAU } from './config.js?v=162';
import { OUT } from './sprites.js?v=162';
import { G, vgrad, fs, ell, circ, blob, poly, stick, ribbon, eye, shadow, leg } from './art_kit.js?v=162';

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
  // MechaZord, built on Mechagodzilla's body: an upright bipedal kaiju in dented silver armour with a thick tapering tail,
  // huge thighs and three-toed claw feet, a barrel chest with a glowing core, short arms with finger missiles, spiked
  // shoulders, a long neck and a snouted, crowned head with red eyes, and a row of tall dorsal plates from neck to tail.
  // He walks on the ground.
  const ph = st.ph;
  const mv = st.moving;
  const sway = mv ? Math.sin(ph * TAU * 2) * 0.8 : Math.sin(ph * TAU) * 0.4;
  const lite = '#e6eaf1';
  const silver = '#bcc4d1';
  const mid = '#8a95a9';
  const dark = '#59637a';
  const iron = '#262c38';
  const red = '#ff3b2a';
  const orange = '#ffa132';
  const bolt = (x, y, r = 1.3) => {
    g.fillStyle = '#eef1f7';
    g.strokeStyle = OUT;
    g.lineWidth = 0.8;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.stroke();
  };
  const joint = (x, y, r) => {
    g.fillStyle = '#c9d0dc';
    g.strokeStyle = OUT;
    g.lineWidth = 1.3;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.stroke();
    g.fillStyle = iron;
    g.beginPath();
    g.arc(x, y, r * 0.42, 0, TAU);
    g.fill();
    bolt(x + r * 0.62, y - r * 0.5, 0.9);
  };
  // everything is drawn big, scaled about the ground line
  g.save();
  g.translate(0, G);
  g.scale(1.7, 1.7);
  g.translate(0, -G);
  // ground shadow
  g.save();
  g.translate(-6, G + 0.5);
  g.scale(1, 0.16);
  const sg = g.createRadialGradient(0, 0, 8, 0, 0, 70);
  sg.addColorStop(0, 'rgba(30, 30, 40, 0.3)');
  sg.addColorStop(1, 'rgba(30, 30, 40, 0)');
  g.fillStyle = sg;
  g.beginPath();
  g.arc(0, 0, 70, 0, TAU);
  g.fill();
  g.restore();
  // the tail: a thick armoured taper that swings a little, ending in a spiked blade
  const tw = sway;
  ribbon(g, [[-12, -2], [-34, 5 + tw], [-58, 10 + tw * 1.6], [-82, 10 + tw * 2.2], [-104, 2 + tw * 2.6]], 28, 3, vgrad(g, -12, 24, '#d3d9e4', '#5d687c'), 1.9);
  g.strokeStyle = 'rgba(24, 28, 40, 0.75)';
  g.lineWidth = 1.2;
  for (const [x, y, h] of [[-26, 3, 12], [-40, 7, 11], [-54, 10, 9.5], [-68, 11, 8], [-82, 10, 6.4], [-94, 7, 4.6]]) {
    g.beginPath();
    g.moveTo(x, y - h + tw);
    g.lineTo(x + 2, y + h + tw);
    g.stroke();
  }
  poly(g, [[-100, 1 + tw * 2.6], [-118, -8 + tw * 2.8], [-106, 8 + tw * 2.6]], lite, 1.5);
  // the far leg, then the torso, arm, head and near leg
  const legAt = (hx, off, shade, foot) => {
    const t = (ph + off) * TAU;
    const swing = mv ? Math.sin(t) * 7.5 : 0;
    const lift = mv ? Math.max(0, Math.cos(t)) * 6.5 : 0;
    const hip = [hx, 2];
    const ankle = [hx + 3 + swing, 21 - lift];
    const knee = [hx + 9 + swing * 0.45, 12 - lift * 0.45];
    ribbon(g, [hip, knee], 19, 14, vgrad(g, 0, 16, shade[0], shade[1]), 1.9);
    ribbon(g, [knee, ankle], 14, 10, vgrad(g, 10, 22, shade[0], shade[1]), 1.9);
    g.strokeStyle = 'rgba(24, 28, 40, 0.7)';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(hx + 2, 6);
    g.lineTo(knee[0] - 3, knee[1] - 3);
    g.stroke();
    joint(knee[0], knee[1], 5.4);
    // a three-toed claw foot
    g.save();
    g.translate(ankle[0], ankle[1]);
    blob(g, [[-7, 0], [8, -0.6], [14, 2], [17, 4], [-5, 4.4]], vgrad(g, -1, 4.4, foot, iron), 1.6);
    for (const [dx, dy] of [[17, 4], [15, 2.4], [12, 0.8]]) {
      poly(g, [[dx - 2.2, dy - 1.2], [dx + 4.6, dy + 1.2], [dx - 1.6, dy + 2.6]], lite, 1);
    }
    g.restore();
  };
  legAt(6, 0.5, ['#a3adbf', '#566073'], '#7a859a');
  g.save();
  g.translate(0, -sway * 0.5);
  // the dorsal plates: tall silver maple leaves with a glowing red edge, from the neck down the tail
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
    g.fillStyle = vgrad(g, -18 * s, 0, '#f6f8fb', '#8793a8');
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = 1.5;
    g.stroke();
    g.strokeStyle = red;
    g.lineWidth = 1.3;
    g.beginPath();
    g.moveTo(-2 * s, -15 * s);
    g.lineTo(-0.5 * s, -3 * s);
    g.stroke();
    g.restore();
  };
  fin(-70, 8, 0.7, -1.45);
  fin(-54, 6, 0.85, -1.4);
  fin(-40, 3, 1.0, -1.3);
  fin(-27, -2, 1.1, -1.18);
  fin(-27, -12, 1.25, -1.0);
  fin(-27, -23, 1.35, -0.82);
  fin(-23, -34, 1.35, -0.6);
  fin(-14, -43, 1.2, -0.38);
  // pelvis and a lean, forward-set torso
  blob(g, [[-20, -4], [-19, 10], [-4, 14], [12, 9], [14, -4]], vgrad(g, -4, 14, '#c3cad7', '#6d778c'), 2);
  const torso = [[-22, -4], [-27, -20], [-23, -38], [-8, -50], [14, -47], [27, -31], [26, -12], [14, 4], [-6, 8]];
  blob(g, torso, vgrad(g, -50, 8, '#e9edf3', '#7c869b'), 2.1);
  g.save();
  g.beginPath();
  torso.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.clip();
  // pectoral plates, abdomen bands and seams
  g.fillStyle = vgrad(g, -42, -14, '#f4f6fa', '#aab3c4');
  g.beginPath();
  g.moveTo(-2, -42);
  g.quadraticCurveTo(14, -48, 30, -34);
  g.lineTo(28, -16);
  g.quadraticCurveTo(10, -12, -2, -18);
  g.closePath();
  g.fill();
  g.strokeStyle = 'rgba(24, 28, 42, 0.72)';
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(-2, -42);
  g.quadraticCurveTo(-4, -30, -2, -18);
  g.moveTo(-2, -30);
  g.quadraticCurveTo(14, -34, 30, -24);
  for (const y of [-12, -6, 0]) {
    g.moveTo(-10, y);
    g.quadraticCurveTo(8, y - 3, 26, y - 1);
  }
  g.moveTo(-14, -34);
  g.lineTo(-8, -14);
  for (const x of [-18, -15, -12]) {
    g.moveTo(x, -10);
    g.lineTo(x - 1.5, -3);
  }
  g.stroke();
  g.restore();
  for (const [x, y] of [[-18, -30], [-17, -12], [20, -40], [22, -20], [10, 0], [-6, 4]]) bolt(x, y);
  // the glowing core
  const core = g.createRadialGradient(13, -28, 0.5, 13, -28, 11);
  core.addColorStop(0, '#fff3d6');
  core.addColorStop(0.3, orange);
  core.addColorStop(1, 'rgba(255, 90, 40, 0)');
  g.fillStyle = core;
  g.beginPath();
  g.arc(13, -28, 11, 0, TAU);
  g.fill();
  g.fillStyle = dark;
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.arc(13, -28, 5.6, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = '#ffd9a8';
  g.beginPath();
  g.arc(13, -28, 3.6, 0, TAU);
  g.fill();
  // the neck, thick and leaning forward
  ribbon(g, [[4, -42], [14, -54], [24, -62]], 26, 18, vgrad(g, -66, -38, '#dde2eb', '#7c869b'), 1.9);
  g.strokeStyle = 'rgba(24, 28, 42, 0.7)';
  g.lineWidth = 1.1;
  for (const [x, y] of [[8, -46], [14, -53], [20, -59]]) {
    g.beginPath();
    g.moveTo(x - 6, y + 6);
    g.lineTo(x + 5, y - 6);
    g.stroke();
  }
  // a spiked shoulder pauldron
  poly(g, [[4, -46], [8, -62], [16, -46]], lite, 1.5);
  poly(g, [[14, -46], [24, -58], [26, -42]], lite, 1.5);
  g.fillStyle = vgrad(g, -48, -30, '#f6f8fb', '#8793a8');
  g.strokeStyle = OUT;
  g.lineWidth = 1.8;
  g.beginPath();
  g.ellipse(14, -38, 11, 9, -0.3, 0, TAU);
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(24, 28, 42, 0.7)';
  g.lineWidth = 1.1;
  g.beginPath();
  g.ellipse(14, -38, 7, 5.6, -0.3, Math.PI * 0.1, Math.PI * 0.9);
  g.stroke();
  bolt(8, -41);
  bolt(20, -37);
  // the short arm: upper arm, a bent forearm and a hand of finger missiles
  g.save();
  g.translate(14, -34);
  g.strokeStyle = OUT;
  g.lineWidth = 9;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(9, 11);
  g.lineTo(21, 7);
  g.stroke();
  g.strokeStyle = silver;
  g.lineWidth = 6;
  g.stroke();
  g.strokeStyle = lite;
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(10, 11);
  g.lineTo(21, 7);
  g.stroke();
  joint(9, 11, 3.8);
  for (const [dx, dy] of [[9, -4.4], [11, 1.4], [8, 7]]) {
    g.strokeStyle = OUT;
    g.lineWidth = 3.4;
    g.beginPath();
    g.moveTo(21, 7);
    g.lineTo(21 + dx, 7 + dy);
    g.stroke();
    g.strokeStyle = '#d7dce6';
    g.lineWidth = 1.7;
    g.stroke();
    g.fillStyle = red;
    g.beginPath();
    g.moveTo(21 + dx + 3.4, 7 + dy - 0.4);
    g.lineTo(21 + dx - 0.4, 7 + dy - 2);
    g.lineTo(21 + dx - 0.4, 7 + dy + 2);
    g.closePath();
    g.fill();
  }
  g.restore();
  // the head: crowned, with a long armoured snout, red eyes and a hinged jaw full of steel teeth
  g.save();
  g.translate(26, -64);
  g.rotate(st.open ? -0.14 : 0.05);
  poly(g, [[-10, -8], [-24, -20], [-8, -2]], lite, 1.4);
  poly(g, [[-4, -12], [-14, -28], [4, -12]], lite, 1.4);
  poly(g, [[4, -14], [2, -32], [12, -13]], lite, 1.4);
  blob(g, [[-14, -4], [-8, -15], [8, -18], [24, -14], [38, -7], [41, 2], [12, 7], [-12, 6]], vgrad(g, -18, 7, '#edf0f6', '#7c869b'), 1.9);
  g.strokeStyle = 'rgba(24, 28, 42, 0.7)';
  g.lineWidth = 1.1;
  g.beginPath();
  g.moveTo(-4, 1);
  g.lineTo(10, 3);
  g.moveTo(18, -13);
  g.lineTo(18, 4);
  g.moveTo(26, -10);
  g.lineTo(26, 3);
  g.stroke();
  g.fillStyle = iron;
  g.beginPath();
  g.moveTo(-5, -10);
  g.lineTo(20, -14);
  g.lineTo(19, -7);
  g.lineTo(-3, -5);
  g.closePath();
  g.fill();
  const eg = g.createRadialGradient(7, -8, 0.5, 7, -8, 8);
  eg.addColorStop(0, 'rgba(255, 90, 60, 0.95)');
  eg.addColorStop(1, 'rgba(255, 40, 30, 0)');
  g.fillStyle = eg;
  g.beginPath();
  g.arc(7, -8, 8, 0, TAU);
  g.fill();
  g.fillStyle = red;
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(1, -9.6);
  g.lineTo(14, -11.4);
  g.lineTo(14, -6.4);
  g.lineTo(2, -5.4);
  g.closePath();
  g.fill();
  g.stroke();
  g.fillStyle = '#fff1d0';
  g.beginPath();
  g.ellipse(5, -8.6, 2.6, 1, -0.1, 0, TAU);
  g.fill();
  g.fillStyle = iron;
  g.beginPath();
  g.ellipse(36, -3, 1.7, 1.2, 0, 0, TAU);
  g.fill();
  g.save();
  g.translate(0, 5);
  g.rotate(st.open ? 0.55 : 0.02);
  blob(g, [[0, 0], [14, -0.5], [30, -1], [33, 4], [12, 7.4], [-3, 4.6]], vgrad(g, -1, 7, '#c7ced9', '#5d687c'), 1.6);
  if (st.open) {
    g.fillStyle = '#ff7a2a';
    g.beginPath();
    g.moveTo(2, -0.6);
    g.lineTo(30, -0.8);
    g.lineTo(16, -6);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffd36a';
    g.beginPath();
    g.moveTo(8, -0.8);
    g.lineTo(26, -0.9);
    g.lineTo(16, -4);
    g.closePath();
    g.fill();
  }
  g.restore();
  g.fillStyle = '#f3f5f9';
  g.strokeStyle = OUT;
  g.lineWidth = 0.7;
  for (const x of [11, 16, 21, 26, 31, 35]) {
    g.beginPath();
    g.moveTo(x - 1.5, 4.2);
    g.lineTo(x, 8.4);
    g.lineTo(x + 1.5, 4);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.restore();
  g.restore();
  // the near leg in front
  legAt(-12, 0, ['#d5dbe5', '#6d778c'], '#9aa5b9');
  g.restore();
}

export const MYTHIC = {
  slime: { draw: slime, box: [-32, -34, 32, 30] },
  giant: { draw: giant, box: [-34, -72, 86, 30] },
  dragon: { draw: dragon, box: [-82, -60, 66, 30] },
  mechazord: { draw: mechazord, box: [-210, -190, 122, 34] },
};
