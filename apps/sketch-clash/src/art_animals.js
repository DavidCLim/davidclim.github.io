import { TAU } from './config.js?v=139';
import { OUT } from './sprites.js?v=139';
import { G, vgrad, fs, ell, circ, blob, poly, stick, ribbon, eye, shadow, leg } from './art_kit.js?v=139';

// The Animals tab, all facing right with their feet on y = 25.
// Each drawer gets (g, st): st.ph is the walk cycle (0..1), st.moving, st.open (mouth),
// st.pose for the special poses.

function boar(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  const bob = mv ? Math.abs(Math.sin(ph * TAU * 2)) * 0.9 : 0;
  shadow(g, 3, 36);
  leg(g, -15, 17, 8, 5.4, '#4a3224', ph, 0.5, 4.5, 3, '#241a16', !mv);
  leg(g, 18, 17, 8, 5.4, '#4a3224', ph, 0, 4.5, 3, '#241a16', !mv);
  g.save();
  g.translate(0, -bob);
  // tail
  stick(g, [[-26, 3], [-32, -1]], 2.6, '#6b4329');
  ell(g, 0, 6, 27, 15.5, vgrad(g, -9, 22, '#a4733f', '#6a4226'), 1.9);
  g.fillStyle = 'rgba(40, 22, 12, 0.18)';
  g.beginPath();
  g.ellipse(0, 14, 22, 6, 0, 0, Math.PI);
  g.fill();
  // bristly mane down the back
  const tips = [5.5, 7, 5, 7.5, 5.5, 7, 5, 6.5, 5];
  g.beginPath();
  let first = true;
  for (let i = 0; i < tips.length; i++) {
    const x = -23 + i * 4.6;
    const yt = 6 - 15.5 * Math.sqrt(Math.max(0, 1 - (x / 27) ** 2));
    if (first) {
      g.moveTo(x - 2, yt + 3);
      first = false;
    }
    g.lineTo(x, yt - tips[i]);
    g.lineTo(x + 2.3, yt + 0.4);
  }
  const xe = -23 + (tips.length - 1) * 4.6 + 2.3;
  g.lineTo(xe + 1, 6 - 15.5 * Math.sqrt(Math.max(0, 1 - (xe / 27) ** 2)) + 3);
  g.closePath();
  fs(g, '#3d2515', 1.2);
  // head
  ell(g, 27, 8, 11, 9.5, vgrad(g, -2, 18, '#9a6a3a', '#76492a'), 1.8);
  // ear
  poly(g, [[19, 0], [24, -9], [28, 0]], '#5a3a22', 1.4);
  // snout
  ell(g, 36.5, 11.5, 6.6, 5.4, '#e9a5a8', 1.6);
  g.fillStyle = '#6b2f36';
  g.beginPath();
  g.ellipse(39.4, 10.2, 1.1, 1.6, 0, 0, TAU);
  g.fill();
  // tusk
  poly(g, [[32, 16.5], [35.5, 11], [35.8, 17]], '#fbf8ea', 1.1);
  // eye
  eye(g, 28.5, 5, 3, 1.7, 0.6);
  g.strokeStyle = OUT;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(25, 1.8);
  g.lineTo(32, 3.4);
  g.stroke();
  g.restore();
  leg(g, -7, 18, 7, 5.8, '#6a4630', ph, 0, 4.5, 3, '#2a1d17', !mv);
  leg(g, 24, 18, 7, 5.8, '#6a4630', ph, 0.5, 4.5, 3, '#2a1d17', !mv);
}

function rat(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  const bob = mv ? Math.abs(Math.sin(ph * TAU * 2)) * 0.8 : 0;
  shadow(g, 0, 28);
  // long pink tail
  const tp = [];
  for (let i = 0; i < 9; i++) {
    const w = Math.sin(i * 0.75 - ph * TAU) * (mv ? 1.6 + i * 0.5 : 0.8 + i * 0.25);
    tp.push([-16 - i * 4.4, 20 + w - i * 0.1]);
  }
  ribbon(g, tp, 3, 1.2, '#eba9b1', 1.1);
  // feet
  const fx = (o) => (mv ? Math.sin((ph + o) * TAU) * 4 : 0);
  ell(g, -6 + fx(0), G - 1.8, 4.4, 2.4, '#eba9b1', 1.2);
  ell(g, 12 + fx(0.5), G - 1.8, 4.4, 2.4, '#eba9b1', 1.2);
  g.save();
  g.translate(0, -bob);
  // body
  ell(g, 0, 16.5, 18, 10.5, vgrad(g, 6, 27, '#a39ba4', '#797280'), 1.8);
  g.fillStyle = 'rgba(40, 30, 50, 0.15)';
  g.beginPath();
  g.ellipse(-2, 12, 14, 4, 0, Math.PI, TAU);
  g.fill();
  // pointed face
  poly(g, [[14, 9], [32, 16.5], [14, 24]], vgrad(g, 8, 24, '#aaa2ab', '#807984'), 1.8);
  circ(g, 31.4, 16.8, 2.4, '#ee8fa0', 1.2);
  // ear
  circ(g, 11.5, 8.6, 5.6, '#8c858f', 1.6);
  circ(g, 11.9, 8.9, 3.4, '#f2b0bb', 0);
  eye(g, 21, 14.2, 2.2, 1.5, 0.3, 1);
  // whiskers
  g.strokeStyle = 'rgba(28, 26, 34, 0.75)';
  g.lineWidth = 0.7;
  g.beginPath();
  for (const [dx, dy] of [[9, -4], [10, 0], [9, 4.5]]) {
    g.moveTo(29, 17.5);
    g.lineTo(29 + dx, 17.5 + dy);
  }
  g.stroke();
  g.restore();
}

function ant(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  shadow(g, 0, 34);
  const legs = [[-3, 0], [2.5, 0.5], [8, 0]];
  const drawLegs = (far) => {
    for (let i = 0; i < legs.length; i++) {
      const [hx, off] = legs[i];
      const t = ((ph + off + (far ? 0.5 : 0)) % 1) * TAU;
      const s = mv ? Math.sin(t) * 3.5 : 0;
      const up = mv ? Math.max(0, Math.cos(t)) * 2.5 : 0;
      const dir = i === 0 ? -1 : i === 2 ? 1 : 0.2;
      const kx = hx + dir * 6 + s * 0.5;
      const fx = hx + dir * 9 + s;
      stick(g, [[hx, 16], [kx, 8 + (far ? 1 : 0)], [fx, G - 0.5 - up]], 1.7, far ? '#1a1417' : '#22191c', 0.8);
    }
  };
  drawLegs(true);
  const bob = mv ? Math.abs(Math.sin(ph * TAU * 2)) * 0.5 : 0;
  g.save();
  g.translate(0, -bob);
  // waist links
  stick(g, [[-7, 15], [-1, 15]], 3.4, '#5f1a17');
  stick(g, [[7, 14.5], [12, 13.5]], 3, '#5f1a17');
  ell(g, -19, 13.5, 14, 10, vgrad(g, 3, 24, '#c13c31', '#8c241e'), 1.9);
  g.fillStyle = 'rgba(255, 190, 170, 0.35)';
  g.beginPath();
  g.ellipse(-22, 9.4, 6, 2.8, -0.3, 0, TAU);
  g.fill();
  ell(g, 2, 14.5, 7, 6.2, vgrad(g, 8, 21, '#bb372d', '#8c241e'), 1.8);
  ell(g, 19, 12.5, 8.2, 7.6, vgrad(g, 5, 20, '#c13c31', '#8c241e'), 1.9);
  // eye and mandibles
  circ(g, 22.4, 10.4, 2, '#161216', 0);
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.arc(23, 9.7, 0.7, 0, TAU);
  g.fill();
  stick(g, [[26, 15], [30, 17.5]], 1.6, '#2a1a1a', 0.6);
  // antennae
  const wig = mv ? Math.sin(ph * TAU) * 1.4 : 0;
  stick(g, [[22, 6.5], [25, -1], [32, -3 + wig]], 1.4, '#22191c', 0.7);
  stick(g, [[18, 6], [17, -1.5], [22, -6 + wig]], 1.4, '#22191c', 0.7);
  g.restore();
  drawLegs(false);
}

function ape(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  const raise = st.pose === 'raise';
  const bob = mv ? Math.abs(Math.sin(ph * TAU * 2)) * 1.2 : 0;
  shadow(g, 0, 32);
  // legs
  stick(g, [[-8, 16], [-9, G - 1.5]], 9, '#3a3a45', 1.2);
  ell(g, -8, G - 1.6, 6.5, 2.6, '#2a2a33', 1.2);
  stick(g, [[6, 16], [7, G - 1.5]], 9.5, '#454552', 1.2);
  ell(g, 7, G - 1.6, 6.8, 2.7, '#2a2a33', 1.2);
  // far arm
  const sw = mv ? Math.sin(ph * TAU) * 5 : 0;
  if (!raise) {
    stick(g, [[-2, -6 - bob], [-8 - sw, 10], [-6 - sw, G - 3]], 9, '#363640', 1.2);
    circ(g, -6 - sw, G - 2, 5, '#2a2a33', 1.3);
  } else {
    stick(g, [[-2, -6], [-2, -22], [6, -34]], 8.5, '#363640', 1.2);
    circ(g, 6.5, -35, 5.2, '#2a2a33', 1.3);
  }
  g.save();
  g.translate(0, -bob);
  blob(
    g,
    [[-23, 4], [-19, -13], [-5, -20], [9, -17], [18, -4], [19, 13], [10, 22], [-9, 22], [-20, 16]],
    vgrad(g, -20, 22, '#5d5d6c', '#3e3e4a'),
    2,
  );
  // lighter chest and belly
  g.fillStyle = 'rgba(150, 150, 168, 0.25)';
  g.beginPath();
  g.ellipse(7, 6, 9.5, 11, 0, 0, TAU);
  g.fill();
  // head
  blob(g, [[6, -16], [10, -25], [19, -26], [25, -19], [24, -10], [14, -8]], '#40404c', 1.9);
  ell(g, 18.6, -15.8, 6.7, 5.7, '#2d2d36', 1.4);
  // brow ridge and eyes
  g.strokeStyle = '#17161c';
  g.lineWidth = 1.8;
  g.beginPath();
  g.moveTo(13.4, -19.5);
  g.lineTo(24, -18.6);
  g.stroke();
  eye(g, 16.8, -16.4, 1.9, 1.2, 0.4, 0.9);
  eye(g, 22.4, -16, 1.9, 1.2, 0.4, 0.9);
  g.fillStyle = '#121116';
  g.beginPath();
  g.ellipse(21.5, -12.4, 1.1, 0.7, 0, 0, TAU);
  g.fill();
  g.strokeStyle = '#121116';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(17, -10.2);
  g.quadraticCurveTo(20.5, -9, 24, -10.6);
  g.stroke();
  g.restore();
  // near arm
  g.save();
  g.translate(0, -bob);
  if (!raise) {
    stick(g, [[8, -6], [16 + sw, 9], [14 + sw, G - 3]], 10, '#4b4b59', 1.2);
    circ(g, 14 + sw, G - 2, 5.4, '#32323c', 1.3);
  } else {
    stick(g, [[8, -6], [16, -22], [24, -32]], 9.5, '#4b4b59', 1.2);
    circ(g, 24.5, -33, 5.6, '#32323c', 1.3);
  }
  g.restore();
}

function alligator(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  const sway = mv ? Math.sin(ph * TAU) * 2.5 : Math.sin(ph * TAU) * 0.8;
  shadow(g, 2, 46);
  leg(g, 12, 19, 6, 5, '#356a2a', ph, 0, 4, 2.5, '#1f3b19', !mv);
  leg(g, -16, 19, 6, 5, '#356a2a', ph, 0.5, 4, 2.5, '#1f3b19', !mv);
  // body and tail
  const pts = [[26, 17.5], [14, 17], [0, 17.5], [-14, 18.5], [-26, 19.5 + sway * 0.5], [-39, 21 + sway]];
  ribbon(g, pts, 16, 2.6, vgrad(g, 9, 26, '#5d9a43', '#3a7230'), 1.9);
  // lighter belly
  g.fillStyle = 'rgba(214, 232, 150, 0.4)';
  g.beginPath();
  g.ellipse(2, 22.5, 20, 2.6, 0, 0, TAU);
  g.fill();
  // bumpy ridge down the back
  g.fillStyle = '#2f5f27';
  g.strokeStyle = OUT;
  g.lineWidth = 0.9;
  for (let i = 0; i < 9; i++) {
    const x = 20 - i * 6.2;
    const y = 10.4 + (i > 4 ? (i - 4) * 1.05 : 0) + (i > 5 ? sway * 0.12 * (i - 5) : 0);
    g.beginPath();
    g.moveTo(x - 2.6, y + 1.8);
    g.lineTo(x, y - 2.2);
    g.lineTo(x + 2.6, y + 1.8);
    g.closePath();
    g.fill();
    g.stroke();
  }
  leg(g, 19, 19, 6, 5.2, '#4a8a3a', ph, 0.5, 4, 2.5, '#26481f', !mv);
  leg(g, -9, 19, 6, 5.2, '#4a8a3a', ph, 0, 4, 2.5, '#26481f', !mv);
  // head
  const open = st.open ? 0.42 : 0.04;
  // lower jaw first
  g.save();
  g.translate(25, 19);
  g.rotate(open);
  blob(g, [[0, 0], [10, 1], [26, 0.5], [27, 3.4], [10, 4.6], [0, 4]], '#6fa650', 1.7);
  if (st.open) {
    g.fillStyle = '#e8838a';
    g.beginPath();
    g.moveTo(1, 0.4);
    g.lineTo(25, 0.4);
    g.lineTo(18, -1.2);
    g.lineTo(5, -1.2);
    g.closePath();
    g.fill();
  }
  g.restore();
  // upper jaw
  blob(g, [[22, 11], [32, 11.5], [50, 14.6], [52, 18.4], [36, 19.6], [22, 20.6]], vgrad(g, 10, 21, '#62a046', '#46823a'), 1.9);
  // teeth
  g.fillStyle = '#fbf8ea';
  g.strokeStyle = OUT;
  g.lineWidth = 0.7;
  for (let i = 0; i < 6; i++) {
    const x = 33 + i * 3;
    g.beginPath();
    g.moveTo(x, 19);
    g.lineTo(x + 1.2, 19 + (st.open ? 3.4 : 2));
    g.lineTo(x + 2.4, 18.6);
    g.fill();
    g.stroke();
  }
  // eye bump and nostril
  circ(g, 28.5, 10, 3.6, '#4f8f3d', 1.5);
  circ(g, 29, 9.8, 2.2, '#e0d94a', 0.9);
  g.fillStyle = '#101010';
  g.beginPath();
  g.ellipse(29.3, 9.8, 0.7, 1.9, 0, 0, TAU);
  g.fill();
  circ(g, 48.5, 13.6, 1.6, '#2f5f27', 1);
}

function piranha(g, st) {
  const ph = st.ph;
  const wag = Math.sin(ph * TAU) * (st.moving ? 0.3 : 0.14);
  const bob = Math.sin(ph * TAU * 0.5) * 1.1;
  shadow(g, 0, 26, 0.18);
  g.save();
  g.translate(0, -2 + bob);
  // tail fin
  g.save();
  g.translate(-20, 9);
  g.rotate(wag);
  poly(g, [[2, 0], [-14, -11], [-9, 0], [-14, 11]], '#4a4f5d', 1.6);
  g.restore();
  // dorsal fin
  poly(g, [[-9, -6], [-1, -19], [7, -6.6]], '#4a4f5d', 1.6);
  // body, grey on top and orange underneath
  g.save();
  g.beginPath();
  g.ellipse(0, 9, 24, 17, 0, 0, TAU);
  g.clip();
  g.fillStyle = vgrad(g, -8, 10, '#7e9db3', '#6a8ba3');
  g.fillRect(-30, -10, 60, 40);
  g.fillStyle = vgrad(g, 8, 26, '#ee6b34', '#d44322');
  g.beginPath();
  g.moveTo(-30, 12);
  g.quadraticCurveTo(-12, 8, 0, 11.5);
  g.quadraticCurveTo(14, 15, 30, 9);
  g.lineTo(30, 30);
  g.lineTo(-30, 30);
  g.closePath();
  g.fill();
  g.restore();
  ell(g, 0, 9, 24, 17, null, 1.9);
  // gill
  g.strokeStyle = 'rgba(30, 30, 44, 0.55)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(6, 9, 10, Math.PI * 0.62, Math.PI * 1.3);
  g.stroke();
  // pectoral fin
  poly(g, [[-3, 14], [3, 22], [-9, 20]], '#ee6b34', 1.2);
  // mouth: lower jaw sticks out with white teeth
  const o = st.open ? 3.4 : 0;
  g.save();
  g.translate(19, 15);
  g.rotate(st.open ? 0.35 : 0);
  poly(g, [[0, 0], [9, -1.5], [11, 2.4 + o * 0.3], [5, 5.6], [-1, 3]], '#e0502a', 1.5);
  g.restore();
  g.fillStyle = '#fbf8ea';
  g.strokeStyle = OUT;
  g.lineWidth = 0.8;
  for (let i = 0; i < 3; i++) {
    g.beginPath();
    g.moveTo(21 + i * 3, 12.2);
    g.lineTo(22.4 + i * 3, 15.6 + o * 0.3);
    g.lineTo(23.8 + i * 3, 12);
    g.closePath();
    g.fill();
    g.stroke();
  }
  // big eye and angry brow
  eye(g, 13, 3.4, 4.5, 2.4, 0.45, 1.4);
  g.strokeStyle = OUT;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(7.5, -3.2);
  g.lineTo(18.4, 0.4);
  g.stroke();
  g.restore();
}

function snake(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  const amp = mv ? 5.6 : 3.2;
  const N = 20;
  const pts = [];
  const raise = st.pose === 'strike' ? 1.25 : 1;
  for (let i = 0; i <= N; i++) {
    const t = i / N; // 0 head .. 1 tail
    const x = 26 - t * 62;
    const wave = Math.sin(t * 7.5 - ph * TAU * (mv ? 1 : 0.4)) * amp * (0.35 + t * 0.8);
    const lift = Math.max(0, 1 - t * 3.2);
    pts.push([x, 21.5 + wave * 0.55 - lift * 12 * raise]);
  }
  shadow(g, -4, 40, 0.16);
  const body = [...pts].reverse();
  ribbon(g, body, 1.4, 9.6, vgrad(g, 8, 26, '#5cc25c', '#3f9c46'), 1.7);
  // diamond markings along the body
  g.fillStyle = '#2d7d3b';
  for (let i = 3; i < N - 1; i += 2) {
    const [x, y] = pts[i];
    const w = 3.4 * (1 - (i / N) * 0.72);
    g.beginPath();
    g.moveTo(x - w, y);
    g.lineTo(x, y - w * 0.8);
    g.lineTo(x + w, y);
    g.lineTo(x, y + w * 0.8);
    g.closePath();
    g.fill();
  }
  // head
  const [hx, hy] = pts[0];
  g.save();
  g.translate(hx + 1, hy);
  g.rotate(st.pose === 'strike' ? -0.15 : 0.1);
  blob(g, [[-6, -5], [3, -6.4], [11, -3], [12.6, 1], [8, 4.8], [-3, 5.2], [-7, 1]], vgrad(g, -6, 6, '#6ccb64', '#46a34c'), 1.8);
  eye(g, 4.2, -2, 2.6, 1.5, 0.5, 1.1);
  g.fillStyle = '#0d0b10';
  g.beginPath();
  g.ellipse(4.6, -2, 0.7, 1.9, 0, 0, TAU);
  g.fill();
  if (st.open) {
    g.fillStyle = '#e8838a';
    poly(g, [[3, 2], [12.4, 1.4], [8, 6.6]], '#e8838a', 1);
    poly(g, [[8, 2], [9, 6], [10, 1.6]], '#fbf8ea', 0.7);
  } else {
    // forked tongue
    g.strokeStyle = '#d93a3f';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(12, 1.6);
    g.lineTo(17, 1.6);
    g.lineTo(19.4, 0);
    g.moveTo(17, 1.6);
    g.lineTo(19.4, 3.2);
    g.stroke();
  }
  g.restore();
}

function cheetah(g, st) {
  const ph = st.ph;
  const mv = st.moving;
  const stretch = mv ? Math.sin(ph * TAU * 2) * 1.5 : 0;
  shadow(g, 0, 42);
  const gold = '#e8b53e';
  const legc = '#d9a431';
  leg(g, -19, 12, 14, 4.2, '#c18e2a', ph, 0.3, 8.5, 5, '#8c6a22', !mv);
  leg(g, 17, 12, 14, 4.2, '#c18e2a', ph, 0.8, 8.5, 5, '#8c6a22', !mv);
  g.save();
  g.translate(0, mv ? -Math.abs(Math.sin(ph * TAU * 2)) * 1.4 : 0);
  // tail with dark tip
  ribbon(g, [[-24, 6], [-34, 3], [-44, -2 + stretch], [-52, -4]], 4.8, 3.4, gold, 1.5);
  g.fillStyle = '#2a2220';
  g.beginPath();
  g.ellipse(-52, -4, 2.8, 3.4, 0.4, 0, TAU);
  g.fill();
  // slim body
  blob(g, [[-27, 6], [-20, -2], [-4, -4], [14, -2], [24, 3], [20, 13], [4, 14], [-14, 14], [-25, 12]], vgrad(g, -4, 15, '#f1c755', '#d9a232'), 1.9);
  g.fillStyle = 'rgba(255, 245, 215, 0.55)';
  g.beginPath();
  g.ellipse(2, 12, 18, 2.6, 0, 0, TAU);
  g.fill();
  // neck and head
  blob(g, [[16, 3], [20, -7], [28, -11], [31, -6], [27, 4]], gold, 1.8);
  blob(g, [[26, -12], [32, -14], [40, -10], [41, -4], [33, -2], [27, -5]], vgrad(g, -14, -2, '#f1c755', '#dcaa38'), 1.8);
  ell(g, 39.2, -6, 3.8, 3, '#f6dc92', 1.2);
  g.fillStyle = '#17141a';
  g.beginPath();
  g.ellipse(42.2, -8, 1.3, 1, 0, 0, TAU);
  g.fill();
  // ears and tear marks
  circ(g, 27, -14, 3, gold, 1.3);
  eye(g, 34, -8.4, 1.9, 1.1, 0.5, 0.9);
  g.strokeStyle = '#17141a';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(35.4, -7.4);
  g.quadraticCurveTo(37, -4.6, 37.2, -2);
  g.stroke();
  // spots
  g.fillStyle = '#2a2220';
  const spots = [[-22, 4], [-16, -1], [-9, 6], [-4, 0], [2, 6], [7, -1], [12, 5], [17, 0], [-13, 10], [-1, 10], [9, 10], [18, 9], [-26, 9], [22, 7]];
  for (const [x, y] of spots) {
    g.beginPath();
    g.ellipse(x, y, 1.6, 1.3, 0, 0, TAU);
    g.fill();
  }
  g.restore();
  leg(g, -13, 13, 13, 4.6, legc, ph, 0.8, 8.5, 5, '#8c6a22', !mv);
  leg(g, 22, 13, 13, 4.6, legc, ph, 0.3, 8.5, 5, '#8c6a22', !mv);
}

export const ANIMALS = {
  boar: { draw: boar, box: [-44, -22, 52, 30] },
  rat: { draw: rat, box: [-44, -8, 44, 30] },
  ant: { draw: ant, box: [-40, -14, 46, 30] },
  ape: { draw: ape, box: [-34, -44, 42, 30] },
  alligator: { draw: alligator, box: [-52, -8, 62, 32] },
  piranha: { draw: piranha, box: [-38, -26, 36, 30] },
  snake: { draw: snake, box: [-44, -10, 40, 30] },
  cheetah: { draw: cheetah, box: [-58, -22, 56, 30] },
};
