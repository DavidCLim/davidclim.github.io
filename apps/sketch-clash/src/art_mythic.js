import { TAU } from './config.js?v=166';
import { OUT } from './sprites.js?v=166';
import { G, vgrad, fs, ell, circ, blob, poly, stick, ribbon, eye, shadow, leg } from './art_kit.js?v=166';

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
  // MechaZord drawn after a chibi Mechagodzilla: a hunched, stocky silver-and-brown armoured biped with a big skull-like head
  // (exposed teeth, a black eye socket with a red eye), a hood of plates over the back with a row of red blade plates down
  // it, huge forward-hanging arms with curved claws, thick panelled legs with three-toed claw feet and a ringed tail that
  // curls up into a pincer.
  const ph = st.ph;
  const mv = st.moving;
  const bob = mv ? Math.abs(Math.sin(ph * TAU * 2)) * 1.2 : Math.sin(ph * TAU) * 0.4;
  const sway = mv ? Math.sin(ph * TAU * 2) * 1.6 : Math.sin(ph * TAU) * 0.8;
  const lite = '#eceff3';
  const silver = '#cdd2da';
  const mid = '#a4aab5';
  const warm = '#a59490';
  const warmDark = '#7d6c69';
  const line = 'rgba(50, 40, 42, 0.8)';
  const red = '#e2432c';
  const redDark = '#a82a1b';
  const iron = '#2b2528';
  const bolt = (x, y, r = 1.2) => {
    g.fillStyle = '#f1f3f6';
    g.strokeStyle = OUT;
    g.lineWidth = 0.7;
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
    g.stroke();
  };
  const panel = (x, y, w, h, fill) => {
    g.fillStyle = fill;
    g.strokeStyle = OUT;
    g.lineWidth = 1.2;
    g.beginPath();
    g.roundRect(x, y, w, h, 1.6);
    g.fill();
    g.stroke();
  };
  const slash = (x, y, w, h) => {
    g.strokeStyle = line;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(x + 1, y + h - 1);
    g.lineTo(x + w - 1, y + 1);
    g.stroke();
  };
  // drawn big, scaled about the ground line
  g.save();
  g.translate(0, G);
  g.scale(2.9, 2.9);
  g.translate(0, -G);
  // ---- the ringed tail, curling up into a pincer
  const tail = [[-14, 4], [-36, 11 + sway * 0.3], [-58, 14 + sway * 0.7], [-76, 6 + sway], [-86, -10 + sway], [-88, -28 + sway]];
  ribbon(g, tail, 30, 10, vgrad(g, -30, 20, '#e4e7ec', '#8d8683'), 1.9);
  g.strokeStyle = line;
  g.lineWidth = 1.2;
  for (let i = 0; i < tail.length - 1; i++) {
    const [ax, ay] = tail[i];
    const [bx, by] = tail[i + 1];
    const dx = bx - ax;
    const dy = by - ay;
    const L = Math.hypot(dx, dy);
    const nx = -dy / L;
    const ny = dx / L;
    for (let k = 0; k < 3; k++) {
      const f = (k + 0.5) / 3;
      const px = ax + dx * f;
      const py = ay + dy * f;
      const w = (30 - 20 * ((i + f) / (tail.length - 1))) / 2;
      g.beginPath();
      g.moveTo(px - nx * w, py - ny * w);
      g.quadraticCurveTo(px + dx * 0.04, py + dy * 0.04 + 1.4, px + nx * w, py + ny * w);
      g.stroke();
    }
  }
  // the pincer: three curved claws
  for (const [pts, fill] of [
    [[[-90, -26 + sway], [-104, -40 + sway], [-98, -58 + sway], [-93, -42 + sway], [-87, -28 + sway]], silver],
    [[[-88, -28 + sway], [-90, -44 + sway], [-85, -60 + sway], [-82, -44 + sway], [-83, -28 + sway]], lite],
    [[[-84, -26 + sway], [-76, -40 + sway], [-76, -56 + sway], [-71, -42 + sway], [-79, -26 + sway]], mid],
  ]) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    g.quadraticCurveTo(pts[1][0], pts[1][1], pts[2][0], pts[2][1]);
    g.quadraticCurveTo(pts[3][0], pts[3][1], pts[4][0], pts[4][1]);
    g.closePath();
    fs(g, fill, 1.6);
  }
  // ---- a leg: a panelled thigh, a heavy knee, a shin and a big three-toed claw foot
  const legAt = (hx, off, far) => {
    const t = (ph + off) * TAU;
    const swing = mv ? Math.sin(t) * 7 : 0;
    const lift = mv ? Math.max(0, Math.cos(t)) * 6 : 0;
    const hip = [hx, 0];
    const knee = [hx + 12 + swing * 0.4, 12 - lift * 0.4];
    const ankle = [hx + 4 + swing, 20 - lift];
    const body = far ? [warmDark, '#5d504d'] : [silver, warm];
    ribbon(g, [hip, knee], 28, 20, vgrad(g, -6, 16, body[0], body[1]), 1.9);
    ribbon(g, [knee, ankle], 20, 13, vgrad(g, 8, 22, body[0], body[1]), 1.9);
    // panels and bolts on the thigh and shin
    panel(hx + 1, -2, 9, 7, far ? '#8b7a77' : '#e9ecf0');
    bolt(hx + 3, 0);
    bolt(hx + 8, 3);
    g.strokeStyle = line;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(hx + 12, 4);
    g.lineTo(knee[0] + 2, knee[1] - 4);
    g.moveTo(knee[0] - 4, knee[1] + 2);
    g.lineTo(ankle[0] - 3, ankle[1] - 2);
    g.stroke();
    // the knee pad with a spike
    g.fillStyle = far ? '#8b7a77' : '#dfe3e9';
    g.strokeStyle = OUT;
    g.lineWidth = 1.5;
    g.beginPath();
    g.ellipse(knee[0] + 1, knee[1], 7.4, 6, -0.3, 0, TAU);
    g.fill();
    g.stroke();
    poly(g, [[knee[0] + 5, knee[1] - 4], [knee[0] + 13, knee[1] - 1], [knee[0] + 5, knee[1] + 3]], far ? '#9a8a86' : lite, 1.2);
    bolt(knee[0], knee[1] - 1);
    // the foot: a wide wedge with three long curved claws
    g.save();
    g.translate(ankle[0], ankle[1]);
    blob(g, [[-8, -1], [8, -2], [18, 2], [21, 5], [-6, 5]], vgrad(g, -2, 5, far ? '#8b7a77' : '#d4d8df', iron), 1.7);
    for (const [dx, dy, len] of [[20, 5, 9], [16, 3, 9], [11, 1.4, 8]]) {
      g.beginPath();
      g.moveTo(dx - 3, dy - 2);
      g.quadraticCurveTo(dx + len * 0.7, dy - 1.4, dx + len, dy + 3.6);
      g.quadraticCurveTo(dx + len * 0.4, dy + 1.4, dx - 2, dy + 2.4);
      g.closePath();
      fs(g, far ? '#b4a7a3' : lite, 1.1);
    }
    g.restore();
  };
  legAt(8, 0.5, true);
  g.save();
  g.translate(0, -bob);
  // ---- the hunched torso, with the hood of plates over the back
  const torso = [[-22, 0], [-29, -16], [-25, -36], [-8, -49], [14, -48], [28, -35], [30, -12], [20, 5], [-2, 10]];
  blob(g, torso, vgrad(g, -44, 10, '#e9ecf0', '#9b8f8c'), 2.1);
  // overlapping armour plates along the back and shoulder
  for (const [x, y, w, h, rot, fill] of [
    [-22, -34, 22, 12, -0.5, silver],
    [-26, -24, 22, 12, -0.32, lite],
    [-28, -13, 20, 12, -0.18, silver],
    [-27, -3, 18, 10, -0.08, mid],
  ]) {
    g.save();
    g.translate(x, y);
    g.rotate(rot);
    g.fillStyle = fill;
    g.strokeStyle = OUT;
    g.lineWidth = 1.5;
    g.beginPath();
    g.roundRect(0, 0, w, h, 3);
    g.fill();
    g.stroke();
    g.strokeStyle = line;
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(3, h * 0.5);
    g.lineTo(w - 4, h * 0.5);
    g.stroke();
    bolt(3, 3);
    bolt(w - 3, 3);
    g.restore();
  }
  // the chest: a column of three window plates and a grid panel
  for (let k = 0; k < 3; k++) {
    panel(6, -37 + k * 9, 9, 7.4, '#f3f5f8');
    slash(6, -37 + k * 9, 9, 7.4);
  }
  panel(17, -30, 8, 14, '#e2e6ec');
  g.strokeStyle = line;
  g.lineWidth = 0.9;
  g.beginPath();
  for (const y of [-26, -22, -18]) {
    g.moveTo(18, y);
    g.lineTo(24, y);
  }
  g.moveTo(21, -29);
  g.lineTo(21, -17);
  g.stroke();
  // belly plates
  for (let k = 0; k < 3; k++) {
    panel(-2 + k * 0, -12 + k * 6, 22, 5.4, k % 2 ? '#d6dae1' : '#e8ebef');
    bolt(1, -9.6 + k * 6);
    bolt(18, -9.6 + k * 6);
  }
  // ---- the red blade plates down the back, neck to tail
  const spine = [[4, -56], [-4, -52], [-12, -47], [-19, -40], [-25, -31], [-29, -22], [-31, -12], [-31, -2], [-38, 4 + sway * 0.2], [-50, 7 + sway * 0.5], [-62, 6 + sway * 0.8], [-72, -1 + sway]];
  spine.forEach(([x, y], i) => {
    const s = 1.15 - i * 0.045;
    const a = -0.5 - i * 0.12;
    g.save();
    g.translate(x, y);
    g.rotate(a);
    g.beginPath();
    g.moveTo(-5 * s, 0);
    g.lineTo(-4 * s, -13 * s);
    g.lineTo(2 * s, -15 * s);
    g.lineTo(6 * s, -2 * s);
    g.lineTo(5 * s, 2 * s);
    g.closePath();
    g.fillStyle = vgrad(g, -15 * s, 2 * s, '#ff6a4e', redDark);
    g.fill();
    g.strokeStyle = OUT;
    g.lineWidth = 1.5;
    g.stroke();
    g.fillStyle = lite;
    g.beginPath();
    g.moveTo(-5 * s, 0);
    g.lineTo(-5.4 * s, 3 * s);
    g.lineTo(5 * s, 3.6 * s);
    g.lineTo(5 * s, 2 * s);
    g.closePath();
    g.fill();
    g.stroke();
    g.restore();
  });
  // ---- the neck and the big skull-like head
  ribbon(g, [[6, -40], [13, -49], [20, -57]], 26, 20, vgrad(g, -56, -34, '#e6e9ee', '#9b8f8c'), 1.9);
  g.strokeStyle = line;
  g.lineWidth = 1.1;
  for (const [x, y] of [[8, -42], [13, -46], [18, -49]]) {
    g.beginPath();
    g.moveTo(x - 4, y + 7);
    g.lineTo(x + 3, y - 7);
    g.stroke();
  }
  g.save();
  g.translate(8, -57);
  g.rotate(0.05);
  g.scale(1.25, 1.25);
  // the lower jaw swings open
  g.save();
  g.translate(8, 6);
  g.rotate(st.open ? 0.55 : 0.02);
  if (st.open) {
    g.fillStyle = '#ff7a2a';
    g.beginPath();
    g.moveTo(4, 0);
    g.lineTo(46, 0);
    g.lineTo(26, -10);
    g.closePath();
    g.fill();
    g.fillStyle = '#ffd36a';
    g.beginPath();
    g.moveTo(14, -0.4);
    g.lineTo(40, -0.4);
    g.lineTo(26, -6);
    g.closePath();
    g.fill();
  }
  blob(g, [[-2, -2], [34, -3], [50, -2], [54, 2], [44, 6], [14, 8], [0, 5]], vgrad(g, -3, 8, '#e1e4e9', '#8c8582'), 1.8);
  g.strokeStyle = line;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(6, 2);
  g.lineTo(40, 1);
  g.stroke();
  g.fillStyle = '#f7f8fa';
  g.strokeStyle = OUT;
  g.lineWidth = 0.9;
  for (const x of [14, 21, 28, 35, 42, 49]) {
    g.beginPath();
    g.moveTo(x - 2.6, -2.2);
    g.lineTo(x, -8.6);
    g.lineTo(x + 2.6, -2);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.restore();
  // the skull: stacked plates running back from a long flat snout
  blob(g, [[-8, 2], [-6, -12], [6, -18], [24, -17], [44, -12], [56, -5], [57, 0], [40, 3], [14, 5]], vgrad(g, -18, 5, '#f1f3f6', '#a79d9a'), 1.9);
  for (const [x, y, w, h] of [[-4, -14, 14, 7], [8, -17, 16, 7], [22, -16, 16, 7], [36, -12, 16, 7]]) {
    g.fillStyle = '#e4e7ec';
    g.strokeStyle = OUT;
    g.lineWidth = 1.1;
    g.beginPath();
    g.roundRect(x, y, w, h, 1.6);
    g.fill();
    g.stroke();
  }
  g.strokeStyle = line;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-4, -4);
  g.lineTo(52, -2);
  g.stroke();
  // the black eye socket with a glowing red eye
  g.fillStyle = iron;
  g.strokeStyle = OUT;
  g.lineWidth = 1.2;
  g.beginPath();
  g.roundRect(2, -12, 15, 11, 3);
  g.fill();
  g.stroke();
  const eg = g.createRadialGradient(9, -6, 0.5, 9, -6, 9);
  eg.addColorStop(0, 'rgba(255, 90, 60, 0.9)');
  eg.addColorStop(1, 'rgba(255, 40, 30, 0)');
  g.fillStyle = eg;
  g.beginPath();
  g.arc(9, -6, 9, 0, TAU);
  g.fill();
  g.fillStyle = red;
  g.beginPath();
  g.arc(9, -6, 3.6, 0, TAU);
  g.fill();
  g.fillStyle = '#fff1d0';
  g.beginPath();
  g.arc(8, -7, 1.2, 0, TAU);
  g.fill();
  // a side vent behind the eye and the nostril
  g.strokeStyle = line;
  g.lineWidth = 1.2;
  g.beginPath();
  for (const k of [0, 1, 2]) {
    g.moveTo(-3 + k * 2.4, -6);
    g.lineTo(-4 + k * 2.4, 0);
  }
  g.stroke();
  g.fillStyle = iron;
  g.beginPath();
  g.ellipse(52, -4, 1.8, 1.2, 0, 0, TAU);
  g.fill();
  // the upper teeth
  g.fillStyle = '#f7f8fa';
  g.strokeStyle = OUT;
  g.lineWidth = 0.9;
  for (const x of [18, 25, 32, 39, 46, 52]) {
    g.beginPath();
    g.moveTo(x - 2.4, 2.4);
    g.lineTo(x + 0.4, 8.6);
    g.lineTo(x + 2.8, 2.2);
    g.closePath();
    g.fill();
    g.stroke();
  }
  g.restore();
  // ---- the huge forward-hanging arms, with panelled sleeves and three big curved claws
  const arm = (ox, shade, far) => {
    g.save();
    g.translate(ox, 0);
    ribbon(g, [[16, -28], [27, -14]], 22, 20, vgrad(g, -34, -8, shade[0], shade[1]), 1.9);
    ribbon(g, [[27, -14], [31, 0]], 20, 15, vgrad(g, -16, 6, shade[0], shade[1]), 1.9);
    panel(19, -26, 9, 7, far ? '#8b7a77' : '#eef0f4');
    slash(19, -26, 9, 7);
    bolt(21, -23);
    g.fillStyle = far ? '#8b7a77' : '#dfe3e9';
    g.strokeStyle = OUT;
    g.lineWidth = 1.5;
    g.beginPath();
    g.ellipse(27, -14, 7.6, 6.4, 0, 0, TAU);
    g.fill();
    g.stroke();
    bolt(27, -14);
    g.strokeStyle = line;
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(27, -8);
    g.lineTo(30, -2);
    g.stroke();
    // the hand: a knuckle block and three long claws curling forward
    blob(g, [[26, -2], [36, -4], [40, 3], [32, 8], [25, 5]], far ? '#9a8a86' : '#d9dde4', 1.5);
    for (const [dx, dy, len] of [[36, -2, 12], [38, 2, 12], [34, 6, 11]]) {
      g.beginPath();
      g.moveTo(dx - 3, dy - 2.4);
      g.quadraticCurveTo(dx + len * 0.6, dy - 4, dx + len, dy + 4);
      g.quadraticCurveTo(dx + len * 0.4, dy, dx - 2, dy + 2.4);
      g.closePath();
      fs(g, far ? '#b4a7a3' : lite, 1.1);
    }
    g.restore();
  };
  arm(-6, [warmDark, '#5d504d'], true);
  arm(0, [silver, warm], false);
  g.restore();
  // ---- the near leg in front
  legAt(-12, 0, false);
  g.restore();
}

export const MYTHIC = {
  slime: { draw: slime, box: [-32, -34, 32, 30] },
  giant: { draw: giant, box: [-34, -72, 86, 30] },
  dragon: { draw: dragon, box: [-82, -60, 66, 30] },
  mechazord: { draw: mechazord, box: [-312, -288, 240, 38] },
};
