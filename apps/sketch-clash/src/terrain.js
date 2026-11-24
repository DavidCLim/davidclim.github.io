import { TAU, K } from './config.js?v=58';
import { makeLayer, drawLayer, OUT } from './sprites.js?v=58';
import { vgrad, fs, ell, circ, blob, poly, stick, rrect } from './art_kit.js?v=58';

// ------------------------------------------------------------------ the painted terrain
// Wall, water and ice are brush strokes: each is a polyline with a width. A coarse mask
// records which of them covers a point, so units can ask "what am I standing on?".
export const WATER = 1;
export const ICE = 2;
export const WALL = 4;
export const STROKE_W = { wall: 22, water: 30, ice: 26 };
export const WALL_H = 7; // the front face of a wall hangs this far below its top

export class TerrainMap {
  constructor() {
    this.cell = 5;
    this.strokes = [];
    this.version = 0;
    this.resize(860, 600);
  }

  resize(w, h) {
    this.cols = Math.ceil(w / this.cell) + 1;
    this.rows = Math.ceil(h / this.cell) + 1;
    this.restamp();
  }

  restamp() {
    this.mask = new Uint8Array(this.cols * this.rows);
    for (const s of this.strokes) {
      for (let i = 0; i < s.pts.length; i++) this.stampSeg(s, i === 0 ? s.pts[0] : s.pts[i - 1], s.pts[i]);
    }
  }

  stampDisc(x, y, r, bit) {
    const c = this.cell;
    const c0 = Math.max(0, Math.floor((x - r) / c));
    const c1 = Math.min(this.cols - 1, Math.floor((x + r) / c));
    const r0 = Math.max(0, Math.floor((y - r) / c));
    const r1 = Math.min(this.rows - 1, Math.floor((y + r) / c));
    for (let j = r0; j <= r1; j++) {
      for (let i = c0; i <= c1; i++) {
        const dx = (i + 0.5) * c - x;
        const dy = (j + 0.5) * c - y;
        if (dx * dx + dy * dy <= r * r) this.mask[j * this.cols + i] |= bit;
      }
    }
  }

  stampSeg(s, a, b) {
    const bit = s.kind === 'water' ? WATER : s.kind === 'ice' ? ICE : WALL;
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const n = Math.max(1, Math.ceil(d / 3));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      const x = a[0] + (b[0] - a[0]) * t;
      const y = a[1] + (b[1] - a[1]) * t;
      this.stampDisc(x, y, s.w / 2, bit);
      if (s.kind === 'wall') this.stampDisc(x, y + WALL_H * 0.6, s.w / 2, bit);
    }
  }

  begin(kind, x, y) {
    const s = { kind, w: STROKE_W[kind], pts: [[x, y]] };
    this.strokes.push(s);
    this.stampSeg(s, s.pts[0], s.pts[0]);
    this.version++;
    return s;
  }

  extend(s, x, y) {
    const last = s.pts[s.pts.length - 1];
    if (Math.hypot(x - last[0], y - last[1]) < 2) return;
    s.pts.push([x, y]);
    this.stampSeg(s, last, [x, y]);
    this.version++;
  }

  // the mask value under a point (a foot position)
  at(x, y) {
    const i = (x / this.cell) | 0;
    const j = (y / this.cell) | 0;
    if (i < 0 || j < 0 || i >= this.cols || j >= this.rows) return 0;
    return this.mask[j * this.cols + i];
  }

  // is there water or a bank of it within r of the point
  near(x, y, r, bit) {
    for (let a = 0; a < 8; a++) {
      const t = (a / 8) * TAU;
      if (this.at(x + Math.cos(t) * r, y + Math.sin(t) * r) & bit) return true;
    }
    return !!(this.at(x, y) & bit);
  }

  erase(x, y, r) {
    const keep = this.strokes.filter((s) => !s.pts.some((p) => Math.hypot(p[0] - x, p[1] - y) <= r + s.w / 2));
    if (keep.length === this.strokes.length) return false;
    this.strokes = keep;
    this.restamp();
    this.version++;
    return true;
  }

  clear() {
    this.strokes = [];
    this.mask.fill(0);
    this.version++;
  }
}

// Paints all strokes onto the ground canvas (already scaled to world units).
export function renderGround(ctx, W, H, strokes, clock) {
  ctx.clearRect(0, 0, W, H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const path = (s, dy = 0) => {
    ctx.beginPath();
    ctx.moveTo(s.pts[0][0], s.pts[0][1] + dy);
    if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] + 0.01, s.pts[0][1] + dy);
    for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i][0], s.pts[i][1] + dy);
  };
  const of = (kind) => strokes.filter((s) => s.kind === kind);
  // water and ice are drawn as a chain of slightly uneven discs, so the banks wobble like the originals
  const blobPath = (s, grow, dy = 0, shrink = 1) => {
    ctx.beginPath();
    const pts = [];
    for (let i = 0; i < s.pts.length; i++) {
      if (i === 0) pts.push(s.pts[0]);
      else {
        const a = s.pts[i - 1];
        const b = s.pts[i];
        const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
        for (let k = 1; k <= n; k++) pts.push([a[0] + ((b[0] - a[0]) * k) / n, a[1] + ((b[1] - a[1]) * k) / n]);
      }
    }
    for (let i = 0; i < pts.length; i += 1) {
      const [x, y] = pts[i];
      const n = Math.sin(x * 0.11 + y * 0.07) * 0.5 + Math.sin(x * 0.043 - y * 0.09 + 1.7) * 0.5;
      const r = (s.w / 2) * shrink * (0.9 + 0.13 * n) + grow;
      ctx.moveTo(x + r, y + dy);
      ctx.arc(x, y + dy, r, 0, TAU);
    }
  };
  for (const [kind, edge, fill, shine] of [
    ['water', '#47a6c2', '#92e1ee', 'rgba(255,255,255,0.3)'],
    ['ice', '#a6cbe0', '#e0f1fb', 'rgba(255,255,255,0.8)'],
  ]) {
    const list = of(kind);
    if (!list.length) continue;
    ctx.fillStyle = edge;
    for (const s of list) {
      blobPath(s, 1.5);
      ctx.fill();
    }
    ctx.fillStyle = fill;
    for (const s of list) {
      blobPath(s, 0);
      ctx.fill();
    }
    ctx.fillStyle = shine;
    for (const s of list) {
      blobPath(s, 0, -s.w * 0.14, 0.52);
      ctx.fill();
    }
    if (kind === 'water') {
      // little wavelets
      ctx.strokeStyle = 'rgba(255,255,255,0.5)';
      ctx.lineWidth = 1;
      for (const s of list) {
        for (let i = 0; i < s.pts.length; i += 6) {
          const [x, y] = s.pts[i];
          const o = Math.sin(x * 0.7 + y * 0.3) * 5;
          ctx.beginPath();
          ctx.moveTo(x - 4 + o, y + 3);
          ctx.quadraticCurveTo(x + o, y + 1, x + 4 + o, y + 3);
          ctx.stroke();
        }
      }
    }
  }
  const walls = of('wall');
  if (walls.length) {
    // front faces first, then the tops, so overlapping walls merge
    ctx.strokeStyle = '#1e1e24';
    for (const s of walls) {
      ctx.lineWidth = s.w + 3.4;
      path(s, WALL_H);
      ctx.stroke();
      path(s, 0);
      ctx.stroke();
    }
    ctx.strokeStyle = '#46464d';
    for (const s of walls) {
      ctx.lineWidth = s.w;
      path(s, WALL_H);
      ctx.stroke();
    }
    for (const s of walls) {
      ctx.strokeStyle = '#8a8a90';
      ctx.lineWidth = s.w;
      path(s, 0);
      ctx.stroke();
      // cobbles
      ctx.strokeStyle = '#7a7a81';
      ctx.lineWidth = s.w - 6;
      ctx.setLineDash([11, 2.2]);
      path(s, 0);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
      ctx.lineWidth = 2.2;
      path(s, -s.w * 0.3);
      ctx.stroke();
    }
  }
}

// ------------------------------------------------------------------ single props
function drawMine(g, lit) {
  g.fillStyle = 'rgba(30,30,40,0.2)';
  g.beginPath();
  g.ellipse(0, 1, 26, 6, 0, 0, TAU);
  g.fill();
  ell(g, 0, -3, 22, 9, '#333c22', 1.9);
  ell(g, 0, -7, 22, 9, vgrad(g, -16, 2, '#667443', '#4b5830'), 1.9);
  ell(g, 0, -11.5, 21, 8.6, vgrad(g, -20, -3, '#7a8a50', '#5f6e3b'), 1.9);
  ell(g, 0, -11.5, 11, 4.6, '#4a5731', 1.3);
  if (lit) {
    const gr = g.createRadialGradient(0, -11.5, 1, 0, -11.5, 14);
    gr.addColorStop(0, 'rgba(255,90,60,0.85)');
    gr.addColorStop(1, 'rgba(255,90,60,0)');
    g.fillStyle = gr;
    g.beginPath();
    g.arc(0, -11.5, 14, 0, TAU);
    g.fill();
  }
  ell(g, 0, -11.5, 4.6, 2.4, lit ? '#ff8c6a' : '#d83a26', 1.1);
  g.fillStyle = '#2e3620';
  for (const x of [-15, 15]) {
    g.beginPath();
    g.arc(x, -11, 1.2, 0, TAU);
    g.fill();
  }
}

function drawBanana(g) {
  g.fillStyle = 'rgba(30,30,40,0.18)';
  g.beginPath();
  g.ellipse(2, 1, 34, 5, 0, 0, TAU);
  g.fill();
  const y = (a, b) => vgrad(g, a, b, '#fbe44a', '#e7b822');
  blob(g, [[3, -8], [18, -12], [38, -7], [44, -2], [22, -1], [3, -2]], y(-12, 0), 1.8);
  blob(g, [[-3, -8], [-18, -12], [-31, -5], [-37, -1], [-16, -1], [-3, -2]], y(-12, 0), 1.8);
  blob(g, [[-2, -4], [-8, -17], [-3, -27], [5, -19], [3, -4]], '#e4b520', 1.7);
  blob(g, [[-5.5, -3], [-5, -22], [-2, -34], [3.5, -32], [4, -20], [5.5, -3]], y(-34, -2), 1.9);
  g.fillStyle = '#17141a';
  g.beginPath();
  g.arc(-1.5, -35.5, 2.3, 0, TAU);
  g.fill();
  g.fillStyle = 'rgba(120, 80, 20, 0.5)';
  for (const [x, yy] of [[26, -6], [-22, -5], [0, -16]]) {
    g.beginPath();
    g.arc(x, yy, 1, 0, TAU);
    g.fill();
  }
}

function drawBarrel(g, glow) {
  g.fillStyle = 'rgba(30,30,40,0.22)';
  g.beginPath();
  g.ellipse(0, 1, 22, 5, 0, 0, TAU);
  g.fill();
  const body = () => {
    g.beginPath();
    g.moveTo(-16, -50);
    g.quadraticCurveTo(-22, -26, -16, -4);
    g.quadraticCurveTo(0, 2, 16, -4);
    g.quadraticCurveTo(22, -26, 16, -50);
    g.closePath();
  };
  const hg = g.createLinearGradient(-20, 0, 20, 0);
  hg.addColorStop(0, '#9a1c1c');
  hg.addColorStop(0.3, '#e23a30');
  hg.addColorStop(0.55, '#e84a3c');
  hg.addColorStop(1, '#a21e1e');
  body();
  fs(g, hg, 2);
  g.strokeStyle = '#6e1010';
  g.lineWidth = 2.6;
  for (const yy of [-38, -14]) {
    g.beginPath();
    g.moveTo(-19.6, yy);
    g.quadraticCurveTo(0, yy + 4.4, 19.6, yy);
    g.stroke();
  }
  ell(g, 0, -50, 16, 5.4, vgrad(g, -55, -45, '#cf3a30', '#a82424'), 1.8);
  ell(g, 0, -50, 10.5, 3.4, '#b82a28', 1.1);
  // warning diamond
  poly(g, [[0, -34], [8, -26], [0, -18], [-8, -26]], glow ? '#fff08a' : '#f6c935', 1.5);
  g.fillStyle = '#17141a';
  g.fillRect(-0.9, -31, 1.8, 5.6);
  g.beginPath();
  g.arc(0, -22.2, 1.1, 0, TAU);
  g.fill();
}

function drawTree(g) {
  g.fillStyle = 'rgba(30,30,40,0.2)';
  g.beginPath();
  g.ellipse(0, 1, 28, 6, 0, 0, TAU);
  g.fill();
  // trunk with a flared base
  g.beginPath();
  g.moveTo(-11, 0);
  g.quadraticCurveTo(-5, -4, -5.5, -14);
  g.lineTo(-4.4, -52);
  g.lineTo(5, -52);
  g.lineTo(5.6, -14);
  g.quadraticCurveTo(6, -4, 12, 0);
  g.closePath();
  fs(g, vgrad(g, -52, 0, '#855a34', '#5e3d22'), 2);
  g.strokeStyle = 'rgba(40, 22, 10, 0.5)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(-1.6, -48);
  g.lineTo(-2.4, -10);
  g.moveTo(2.4, -44);
  g.lineTo(2.8, -6);
  g.stroke();
  // leafy crown: a cluster of round blobs
  const crown = [[0, -78, 27], [-22, -66, 20], [22, -66, 20], [-12, -94, 20], [14, -92, 21], [0, -62, 22]];
  g.strokeStyle = OUT;
  g.lineWidth = 4;
  for (const [x, y, r] of crown) {
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.stroke();
  }
  for (const [x, y, r] of crown) {
    g.fillStyle = vgrad(g, y - r, y + r, '#4f9c45', '#357a34');
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  // lighter leaf clumps catch the sun
  g.fillStyle = 'rgba(160, 225, 110, 0.5)';
  for (const [x, y, r] of [[-8, -98, 9], [-20, -72, 7], [14, -94, 8], [4, -80, 7], [-2, -60, 6]]) {
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  g.fillStyle = 'rgba(20, 70, 30, 0.28)';
  for (const [x, y, r] of [[18, -62, 8], [-6, -68, 6], [10, -76, 5]]) {
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
}

export function buildTerrainArt() {
  return {
    mine: makeLayer(-28, -24, 28, 6, (g) => drawMine(g, false)),
    mineLit: makeLayer(-28, -26, 28, 6, (g) => drawMine(g, true)),
    banana: makeLayer(-40, -40, 48, 6, drawBanana),
    barrel: makeLayer(-26, -58, 26, 6, (g) => drawBarrel(g, false)),
    barrelHot: makeLayer(-26, -58, 26, 6, (g) => drawBarrel(g, true)),
    tree: makeLayer(-50, -122, 50, 6, drawTree),
  };
}

// ------------------------------------------------------------------ palette icons
function iconWall(g) {
  g.fillStyle = 'rgba(30,30,40,0.22)';
  g.beginPath();
  g.ellipse(0, 2, 30, 5, 0, 0, TAU);
  g.fill();
  poly(g, [[-26, -17], [-19, -25], [19, -25], [26, -17], [26, -5], [19, 3], [-19, 3], [-26, -5]], vgrad(g, -25, 3, '#6a6a6a', '#454545'), 3);
  g.fillStyle = 'rgba(255,255,255,0.18)';
  rrect(g, -19, -21, 38, 4, 2, 'rgba(255,255,255,0.18)', 0);
  g.strokeStyle = 'rgba(0,0,0,0.25)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-23, -8);
  g.lineTo(23, -8);
  g.stroke();
}

function iconWater(g) {
  g.fillStyle = 'rgba(30,30,40,0.0)';
  g.beginPath();
  g.moveTo(0, -42);
  g.bezierCurveTo(5, -30, 20, -20, 20, -9);
  g.bezierCurveTo(20, 0, 10, 4, 0, 4);
  g.bezierCurveTo(-10, 4, -20, 0, -20, -9);
  g.bezierCurveTo(-20, -20, -5, -30, 0, -42);
  g.closePath();
  fs(g, vgrad(g, -42, 4, '#6cc0ec', '#3a8fca'), 3);
  g.strokeStyle = 'rgba(255,255,255,0.7)';
  g.lineWidth = 2.6;
  g.beginPath();
  g.arc(-3, -9, 11, Math.PI * 0.62, Math.PI * 0.95);
  g.stroke();
}

function iconIce(g) {
  g.fillStyle = 'rgba(30,30,40,0.22)';
  g.beginPath();
  g.ellipse(0, 2, 26, 5, 0, 0, TAU);
  g.fill();
  poly(g, [[0, -42], [23, -30], [0, -18], [-23, -30]], '#e4f5fd', 2.6);
  poly(g, [[-23, -30], [0, -18], [0, 3], [-23, -10]], '#b9ddf7', 2.6);
  poly(g, [[23, -30], [0, -18], [0, 3], [23, -10]], '#a3cfef', 2.6);
  g.strokeStyle = 'rgba(80, 130, 175, 0.8)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-10, -33);
  g.lineTo(-2, -28);
  g.lineTo(6, -34);
  g.stroke();
}

const ICON_DRAW = {
  wall: iconWall,
  water: iconWater,
  ice: iconIce,
  mine: (g) => drawMine(g, false),
  banana: (g) => {
    g.scale(0.92, 0.92);
    drawBanana(g);
  },
  barrel: (g) => {
    g.scale(0.7, 0.7);
    drawBarrel(g, false);
  },
  tree: (g) => {
    g.scale(0.4, 0.4);
    drawTree(g);
  },
};
const ICON_BASE = { wall: 0.82, water: 0.86, ice: 0.86, mine: 0.76, banana: 0.8, barrel: 0.9, tree: 0.94 };

export function hasTerrainIcon(id) {
  return id in ICON_DRAW;
}

export function paintTerrainIcon(canvas, id) {
  const g = canvas.getContext('2d');
  g.clearRect(0, 0, canvas.width, canvas.height);
  g.save();
  const m = canvas.width / 66;
  g.translate(canvas.width / 2, canvas.height * ICON_BASE[id]);
  g.scale(m, m);
  g.lineCap = 'round';
  g.lineJoin = 'round';
  ICON_DRAW[id](g);
  g.restore();
}

export { drawLayer };
