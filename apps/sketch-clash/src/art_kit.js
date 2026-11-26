import { TAU } from './config.js?v=195';
import { OUT } from './sprites.js?v=195';

// Small drawing helpers shared by the creature and terrain art. Everything is
// drawn in "art" units (the egg units are ~41 wide), the ground line is y = 25.
export const G = 25;

export function vgrad(g, y0, y1, c0, c1) {
  const gr = g.createLinearGradient(0, y0, 0, y1);
  gr.addColorStop(0, c0);
  gr.addColorStop(1, c1);
  return gr;
}

export function fs(g, fill, lw = 1.8, stroke = OUT) {
  if (fill) {
    g.fillStyle = fill;
    g.fill();
  }
  if (lw > 0) {
    g.strokeStyle = stroke;
    g.lineWidth = lw;
    g.stroke();
  }
}

export function ell(g, x, y, rx, ry, fill, lw = 1.8, rot = 0) {
  g.beginPath();
  g.ellipse(x, y, rx, ry, rot, 0, TAU);
  fs(g, fill, lw);
}

export function circ(g, x, y, r, fill, lw = 1.8) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  fs(g, fill, lw);
}

// A closed smooth blob through the points.
export function blob(g, pts, fill, lw = 1.8) {
  const n = pts.length;
  g.beginPath();
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  const m0 = mid(pts[n - 1], pts[0]);
  g.moveTo(m0[0], m0[1]);
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    g.quadraticCurveTo(p[0], p[1], m[0], m[1]);
  }
  g.closePath();
  fs(g, fill, lw);
}

export function poly(g, pts, fill, lw = 1.6) {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  g.closePath();
  fs(g, fill, lw);
}

// A rounded line (limb, whisker, tail) with a dark edge under it.
export function stick(g, pts, w, color, edge = 1.2) {
  const path = () => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
  };
  g.lineCap = 'round';
  g.lineJoin = 'round';
  if (edge > 0) {
    g.strokeStyle = OUT;
    g.lineWidth = w + edge * 2;
    path();
    g.stroke();
  }
  g.strokeStyle = color;
  g.lineWidth = w;
  path();
  g.stroke();
}

// A smooth curve through points drawn as a thick tapering ribbon (tails, snakes).
export function ribbon(g, pts, w0, w1, fill, lw = 1.6) {
  const n = pts.length;
  const L = [];
  const R = [];
  for (let i = 0; i < n; i++) {
    const a = pts[Math.max(0, i - 1)];
    const b = pts[Math.min(n - 1, i + 1)];
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const d = Math.hypot(dx, dy) || 1;
    dx /= d;
    dy /= d;
    const w = (w0 + (w1 - w0) * (i / (n - 1))) / 2;
    L.push([pts[i][0] - dy * w, pts[i][1] + dx * w]);
    R.push([pts[i][0] + dy * w, pts[i][1] - dx * w]);
  }
  const all = [...L, ...R.reverse()];
  g.beginPath();
  g.moveTo(all[0][0], all[0][1]);
  for (let i = 1; i < all.length; i++) g.lineTo(all[i][0], all[i][1]);
  g.closePath();
  fs(g, fill, lw);
}

// A white eye with a dark pupil that looks toward +x.
export function eye(g, x, y, r = 3, pr = 1.7, look = 0.5, ring = 1.3) {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  g.fillStyle = '#fdfdf8';
  g.fill();
  g.strokeStyle = OUT;
  g.lineWidth = ring;
  g.stroke();
  g.fillStyle = '#0d0b10';
  g.beginPath();
  g.arc(x + (r - pr) * look, y + 0.25, pr, 0, TAU);
  g.fill();
}

export function shadow(g, cx, rx, alpha = 0.2) {
  g.save();
  g.translate(cx, G + 0.5);
  g.scale(1, 0.2);
  const gr = g.createRadialGradient(0, 0, rx * 0.15, 0, 0, rx);
  gr.addColorStop(0, `rgba(30, 30, 40, ${alpha})`);
  gr.addColorStop(1, 'rgba(30, 30, 40, 0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, rx, 0, TAU);
  g.fill();
  g.restore();
}

// Rounded rectangle path + fill/stroke.
export function rrect(g, x, y, w, h, r, fill, lw = 1.6) {
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
  fs(g, fill, lw);
}

// One leg of a walking animal: swings about the hip, lifts the foot.
// ph in 0..1 is the walk cycle, off shifts this leg's timing.
export function leg(g, hx, hy, len, w, color, ph, off, amp = 5, lift = 3.5, foot = '#2a2026', still = false) {
  const t = (ph + off) * TAU;
  const swing = still ? 0 : Math.sin(t) * amp;
  const up = still ? 0 : Math.max(0, Math.cos(t)) * lift;
  const fx = hx + swing;
  const fy = Math.min(G, hy + len) - up;
  stick(g, [[hx, hy], [fx, fy - 1]], w, color, 1.2);
  g.beginPath();
  g.ellipse(fx + 0.8, fy - 0.4, w * 0.62, w * 0.4, 0, 0, TAU);
  fs(g, foot, 1.1);
}
