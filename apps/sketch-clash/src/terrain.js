import { TAU, K } from './config.js?v=170';
import { makeLayer, drawLayer, OUT } from './sprites.js?v=170';
import { vgrad, fs, ell, circ, blob, poly, stick, rrect } from './art_kit.js?v=170';

// ------------------------------------------------------------------ the painted terrain
// Wall, water and ice are brush strokes: each is a polyline with a width. A coarse mask
// records which of them covers a point, so units can ask "what am I standing on?".
export const WATER = 1;
export const ICE = 2;
export const WALL = 4;
export const STROKE_W = { wall: 14.5, water: 24, ice: 21 };
export const WALL_H = 5.2; // the front face of a wall hangs this far below its top

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

  begin(kind, x, y, w = STROKE_W[kind]) {
    const s = { kind, w, pts: [[x, y]] };
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
// Water and ice are flat colour with a thin edge; a wall is a raised slab of flagstones with a bricked front.
function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

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
  // water and ice are drawn as a chain of slightly uneven discs, so the banks wobble
  const blobPath = (s, grow) => {
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
    for (const [x, y] of pts) {
      const n = Math.sin(x * 0.09 + y * 0.06) * 0.5 + Math.sin(x * 0.037 - y * 0.08 + 1.7) * 0.5 + Math.sin(x * 0.23 + y * 0.19 + 0.6) * 0.35;
      const r = (s.w / 2) * (0.9 + 0.2 * n) + grow;
      ctx.moveTo(x + r, y);
      ctx.arc(x, y, r, 0, TAU);
    }
  };
  for (const [kind, edge, fill] of [
    ['water', '#76bccb', '#8dd3de'],
    ['ice', '#b4d4e6', '#dcecf9'],
  ]) {
    const list = of(kind);
    if (!list.length) continue;
    ctx.fillStyle = edge;
    for (const s of list) {
      blobPath(s, 0.7);
      ctx.fill();
    }
    ctx.fillStyle = fill;
    for (const s of list) {
      blobPath(s, 0);
      ctx.fill();
    }
    // the original's water is a smooth cyan that is lightest along the middle of the stroke and darker toward the banks;
    // ice is flat pale blue with soft white sheen at the ends
    for (const s of list) {
      ctx.save();
      blobPath(s, 0);
      ctx.clip();
      ctx.filter = 'blur(5px)';
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (kind === 'water') {
        ctx.strokeStyle = 'rgba(196, 248, 250, 0.85)';
        ctx.lineWidth = s.w * 0.5;
        ctx.beginPath();
        s.pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        if (s.pts.length === 1) ctx.lineTo(s.pts[0][0] + 0.1, s.pts[0][1]);
        ctx.stroke();
      } else {
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
        ctx.lineWidth = s.w * 0.34;
        for (const [x, y] of [s.pts[0], s.pts[s.pts.length - 1]]) {
          ctx.beginPath();
          ctx.moveTo(x - s.w * 0.22, y + s.w * 0.28);
          ctx.lineTo(x + s.w * 0.22, y - s.w * 0.28);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
  const walls = of('wall');
  if (!walls.length) return;
  const sc = ctx.getTransform().a || 1;
  // soft shadow under the slab
  ctx.save();
  ctx.shadowColor = 'rgba(30, 30, 40, 0.28)';
  ctx.shadowBlur = 9 * sc;
  ctx.shadowOffsetY = 3.5 * sc;
  ctx.strokeStyle = '#1e1e22';
  for (const s of walls) {
    ctx.lineWidth = s.w + 1.8;
    path(s, WALL_H);
    ctx.stroke();
  }
  ctx.restore();
  // the front face, with rows of bricks
  ctx.strokeStyle = '#1e1e22';
  for (const s of walls) {
    ctx.lineWidth = s.w + 1.8;
    path(s, WALL_H);
    ctx.stroke();
    path(s, 0);
    ctx.stroke();
  }
  ctx.strokeStyle = '#4b4b4f';
  for (const s of walls) {
    ctx.lineWidth = s.w;
    path(s, WALL_H);
    ctx.stroke();
  }
  // two rows of bricks along the front: a seam between the rows and staggered upright joints
  ctx.strokeStyle = 'rgba(150, 150, 158, 0.75)';
  for (const s of walls) {
    ctx.lineWidth = 0.6;
    path(s, s.w * 0.5 + WALL_H * 0.52);
    ctx.stroke();
    ctx.lineWidth = WALL_H * 0.42;
    ctx.lineCap = 'butt';
    ctx.setLineDash([0.7, 6.3]);
    path(s, s.w * 0.5 + WALL_H * 0.27);
    ctx.stroke();
    ctx.lineDashOffset = 3.5;
    path(s, s.w * 0.5 + WALL_H * 0.77);
    ctx.stroke();
    ctx.lineDashOffset = 0;
    ctx.setLineDash([]);
    ctx.lineCap = 'round';
  }
  // the flagstone top
  ctx.strokeStyle = '#7e7c7b';
  for (const s of walls) {
    ctx.lineWidth = s.w;
    path(s, 0);
    ctx.stroke();
  }
  const mk = () => {
    const c = document.createElement('canvas');
    c.width = Math.ceil(W * sc);
    c.height = Math.ceil(H * sc);
    const g = c.getContext('2d');
    g.scale(sc, sc);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    return [c, g];
  };
  const [mask, mg] = mk();
  mg.strokeStyle = '#000';
  for (const s of walls) {
    mg.lineWidth = s.w - 0.6;
    mg.beginPath();
    mg.moveTo(s.pts[0][0], s.pts[0][1]);
    if (s.pts.length === 1) mg.lineTo(s.pts[0][0] + 0.01, s.pts[0][1]);
    for (let i = 1; i < s.pts.length; i++) mg.lineTo(s.pts[i][0], s.pts[i][1]);
    mg.stroke();
  }
  const [pat, pg] = mk();
  let x0 = W;
  let x1 = 0;
  let y0 = H;
  let y1 = 0;
  for (const s of walls) {
    for (const [x, y] of s.pts) {
      x0 = Math.min(x0, x - s.w);
      x1 = Math.max(x1, x + s.w);
      y0 = Math.min(y0, y - s.w);
      y1 = Math.max(y1, y + s.w);
    }
  }
  pg.strokeStyle = 'rgba(84, 82, 82, 0.5)';
  pg.lineWidth = 0.75;
  const cell = 13.5;
  for (let j = Math.floor(y0 / cell) - 1; j <= Math.ceil(y1 / cell) + 1; j++) {
    for (let i = Math.floor(x0 / cell) - 1; i <= Math.ceil(x1 / cell) + 1; i++) {
      const cx = (i + (j & 1 ? 0.5 : 0)) * cell + (hash2(i, j) - 0.5) * 5;
      const cy = j * cell * 0.9 + (hash2(j, i + 9) - 0.5) * 5;
      for (let k = 0; k < 6; k++) {
        const a = (k / 6) * TAU + hash2(i + k, j) * 0.5;
        const r = cell * (0.52 + hash2(k, i * 3 + j) * 0.1);
        const px = cx + Math.cos(a) * r;
        const py = cy + Math.sin(a) * r;
        if (k === 0) {
          pg.beginPath();
          pg.moveTo(px, py);
        } else pg.lineTo(px, py);
      }
      pg.closePath();
      const v = 112 + Math.floor(hash2(i * 7 + 3, j * 5 + 1) * 22);
      pg.fillStyle = `rgb(${v}, ${v - 1}, ${v - 2})`;
      pg.fill();
      pg.stroke();
    }
  }
  pg.globalCompositeOperation = 'destination-in';
  pg.setTransform(1, 0, 0, 1, 0, 0);
  pg.drawImage(mask, 0, 0);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.drawImage(pat, 0, 0);
  ctx.restore();
  // a lighter edge along the top of the slab
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
  for (const s of walls) {
    ctx.lineWidth = 1.2;
    path(s, -s.w * 0.36);
    ctx.stroke();
  }
}

// ------------------------------------------------------------------ single props
// Drawn like the original's icons: bold black outlines, flat colours, one soft shadow.
const INK = '#17141a';

function shadowEll(g, rx, ry = 5, y = 2) {
  g.save();
  g.translate(0, y);
  g.scale(1, ry / rx);
  const gr = g.createRadialGradient(0, 0, rx * 0.2, 0, 0, rx);
  gr.addColorStop(0, 'rgba(40, 42, 54, 0.30)');
  gr.addColorStop(1, 'rgba(40, 42, 54, 0)');
  g.fillStyle = gr;
  g.beginPath();
  g.arc(0, 0, rx, 0, TAU);
  g.fill();
  g.restore();
}

function ink(g, lw) {
  g.strokeStyle = INK;
  g.lineWidth = lw;
  g.lineJoin = 'round';
  g.lineCap = 'round';
}

// A land mine: a squat olive disc, rings on top and a red button in the middle.
function drawMine(g, lit) {
  shadowEll(g, 30, 6, 3);
  ink(g, 1.7);
  // the thick olive side
  g.beginPath();
  g.ellipse(0, -4.5, 22.5, 9.6, 0, 0, TAU);
  g.fillStyle = '#4e5b35';
  g.fill();
  g.stroke();
  // the lighter top with two rings and a dark red button
  g.beginPath();
  g.ellipse(0, -12, 22, 9.4, 0, 0, TAU);
  g.fillStyle = vgrad(g, -22, -2, '#808d58', '#6c794a');
  g.fill();
  g.stroke();
  g.strokeStyle = 'rgba(38, 48, 26, 0.7)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.ellipse(0, -12, 15.5, 6.4, 0, 0, TAU);
  g.stroke();
  g.beginPath();
  g.ellipse(0, -12, 9.6, 4, 0, 0, TAU);
  g.stroke();
  g.fillStyle = lit ? '#ff4b2e' : '#7c2318';
  g.beginPath();
  g.ellipse(0, -12, 3.8, 2, 0, 0, TAU);
  g.fill();
}

// An oil drum: red, banded, with a yellow warning diamond.
function drawBarrel(g, glow) {
  shadowEll(g, 26, 5, 2);
  const body = () => {
    g.beginPath();
    g.moveTo(-17, -54);
    g.quadraticCurveTo(-21.5, -28, -17, -3);
    g.quadraticCurveTo(0, 3, 17, -3);
    g.quadraticCurveTo(21.5, -28, 17, -54);
    g.closePath();
  };
  const hg = g.createLinearGradient(-20, 0, 20, 0);
  hg.addColorStop(0, '#b32d28');
  hg.addColorStop(0.22, '#e04a3e');
  hg.addColorStop(0.5, '#d83c33');
  hg.addColorStop(1, '#a62624');
  body();
  g.fillStyle = hg;
  g.fill();
  ink(g, 1.7);
  g.stroke();
  g.save();
  body();
  g.clip();
  g.strokeStyle = '#8f211f';
  g.lineWidth = 1.8;
  for (const yy of [-41, -13]) {
    g.beginPath();
    g.moveTo(-24, yy);
    g.quadraticCurveTo(0, yy + 4.6, 24, yy);
    g.stroke();
  }
  g.restore();
  g.strokeStyle = 'rgba(255, 190, 170, 0.45)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-13, -48);
  g.quadraticCurveTo(-16.5, -28, -13, -9);
  g.stroke();
  g.beginPath();
  g.ellipse(0, -54, 17, 5.8, 0, 0, TAU);
  g.fillStyle = vgrad(g, -60, -48, '#cf3a31', '#aa2b27');
  g.fill();
  ink(g, 1.7);
  g.stroke();
  g.fillStyle = INK;
  g.beginPath();
  g.ellipse(7, -54.3, 2.4, 1.2, 0, 0, TAU);
  g.fill();
  g.beginPath();
  g.moveTo(0, -37);
  g.lineTo(9.5, -28);
  g.lineTo(0, -19);
  g.lineTo(-9.5, -28);
  g.closePath();
  g.fillStyle = glow ? '#fff08a' : '#f6c935';
  g.fill();
  ink(g, 1.6);
  g.stroke();
  g.fillStyle = INK;
  g.fillRect(-1, -33, 2, 6.6);
  g.beginPath();
  g.arc(0, -23.2, 1.2, 0, TAU);
  g.fill();
}

// A tree: one lumpy green crown on a slim brown trunk with flared roots.
function drawTree(g) {
  // measured off the original: a big lumpy crown with a dark outline, light patches up on the left, a darker underside
  // with a few brown speckles, and a trunk that flares into two roots, with a soft shadow beside it
  g.save();
  g.translate(-6, 0);
  shadowEll(g, 28, 5.6, 1);
  g.restore();
  g.beginPath();
  g.moveTo(-13, 2);
  g.quadraticCurveTo(-6, -2, -6, -13);
  g.lineTo(-5, -46);
  g.lineTo(5.4, -46);
  g.lineTo(6.2, -13);
  g.quadraticCurveTo(6.6, -2, 13, 2);
  g.quadraticCurveTo(0, 5, -13, 2);
  g.closePath();
  const tg = g.createLinearGradient(-6, 0, 7, 0);
  tg.addColorStop(0, '#a87343');
  tg.addColorStop(0.55, '#7d5230');
  tg.addColorStop(1, '#5a3a1f');
  g.fillStyle = tg;
  g.fill();
  ink(g, 2.2);
  g.stroke();
  g.strokeStyle = 'rgba(255, 220, 170, 0.35)';
  g.lineWidth = 1.2;
  g.beginPath();
  g.moveTo(-2.6, -42);
  g.lineTo(-3.2, -10);
  g.stroke();
  g.strokeStyle = 'rgba(40, 20, 8, 0.45)';
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(2.6, -40);
  g.lineTo(3, -12);
  g.stroke();
  const crown = [[0, -66, 25], [-21, -58, 17], [21, -58, 17], [-13, -80, 17], [13, -79, 18], [0, -48, 19]];
  ink(g, 4.6);
  for (const [x, y, r] of crown) {
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.stroke();
  }
  for (const [x, y, r] of crown) {
    g.fillStyle = vgrad(g, y - r, y + r, '#5fae4f', '#3f8236');
    g.beginPath();
    g.arc(x, y, r, 0, TAU);
    g.fill();
  }
  g.save();
  g.beginPath();
  for (const [x, y, r] of crown) {
    g.moveTo(x + r, y);
    g.arc(x, y, r, 0, TAU);
  }
  g.clip();
  g.fillStyle = 'rgba(176, 226, 140, 0.42)';
  for (const [x, y, rx, ry] of [[-14, -78, 22, 13], [8, -88, 16, 8], [-22, -60, 12, 9]]) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, -0.3, 0, TAU);
    g.fill();
  }
  g.fillStyle = 'rgba(28, 82, 34, 0.5)';
  for (const [x, y, rx, ry] of [[14, -46, 28, 11], [-16, -50, 20, 8], [24, -66, 10, 14]]) {
    g.beginPath();
    g.ellipse(x, y, rx, ry, 0.2, 0, TAU);
    g.fill();
  }
  g.fillStyle = 'rgba(122, 74, 38, 0.8)';
  for (const [x, y] of [[12, -52], [-4, -46], [22, -62]]) {
    g.beginPath();
    g.ellipse(x, y, 4.4, 1.7, 0.1, 0, TAU);
    g.fill();
  }
  g.restore();
  g.fillStyle = 'rgba(214, 240, 196, 0.85)';
  g.beginPath();
  g.arc(-14, -84, 4.6, 0, TAU);
  g.fill();
  g.beginPath();
  g.arc(8, -78, 4, 0, TAU);
  g.fill();
}

export function buildTerrainArt() {
  return {
    mine: makeLayer(-30, -26, 30, 8, (g) => drawMine(g, false)),
    mineLit: makeLayer(-30, -28, 30, 8, (g) => drawMine(g, true)),
    barrel: makeLayer(-26, -64, 26, 8, (g) => drawBarrel(g, false)),
    barrelHot: makeLayer(-26, -64, 26, 8, (g) => drawBarrel(g, true)),
    tree: makeLayer(-46, -106, 46, 8, drawTree),
  };
}

// ------------------------------------------------------------------ palette icons
function iconWall(g) {
  shadowEll(g, 34, 5, 1);
  const slab = (x, y, w, h, c) => {
    g.beginPath();
    g.moveTo(x + c, y);
    g.lineTo(x + w - c, y);
    g.lineTo(x + w, y + c);
    g.lineTo(x + w, y + h - c);
    g.lineTo(x + w - c, y + h);
    g.lineTo(x + c, y + h);
    g.lineTo(x, y + h - c);
    g.lineTo(x, y + c);
    g.closePath();
  };
  slab(-28, -26, 56, 27, 6);
  g.fillStyle = '#4b4b4d';
  g.fill();
  ink(g, 3);
  g.stroke();
  slab(-23, -21.5, 46, 18, 4);
  g.fillStyle = vgrad(g, -22, -3, '#70707a', '#5a5a62');
  g.fill();
  g.strokeStyle = '#2f2f33';
  g.lineWidth = 1.4;
  g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.35)';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-17, -18.5);
  g.lineTo(17, -18.5);
  g.stroke();
}

function iconWater(g) {
  shadowEll(g, 0.01, 1, 0);
  g.beginPath();
  g.moveTo(0, -46);
  g.bezierCurveTo(5, -36, 21, -23, 21, -10);
  g.bezierCurveTo(21, 0, 12, 5, 0, 5);
  g.bezierCurveTo(-12, 5, -21, 0, -21, -10);
  g.bezierCurveTo(-21, -23, -5, -36, 0, -46);
  g.closePath();
  g.fillStyle = vgrad(g, -46, 5, '#4aa2dc', '#63b8ee');
  g.fill();
  ink(g, 3.2);
  g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.85)';
  g.lineWidth = 2.2;
  g.beginPath();
  g.arc(-3, -9, 12.5, Math.PI * 0.64, Math.PI * 0.98);
  g.stroke();
}

function iconIce(g) {
  shadowEll(g, 28, 5, 2);
  const face = (pts, fill) => {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.closePath();
    g.fillStyle = fill;
    g.fill();
  };
  face([[0, -46], [24, -34], [0, -22], [-24, -34]], '#e6f6fd');
  face([[-24, -34], [0, -22], [0, 4], [-24, -10]], '#bde1f6');
  face([[24, -34], [0, -22], [0, 4], [24, -10]], '#a3cfec');
  ink(g, 3);
  g.beginPath();
  g.moveTo(0, -46);
  g.lineTo(24, -34);
  g.lineTo(24, -10);
  g.lineTo(0, 4);
  g.lineTo(-24, -10);
  g.lineTo(-24, -34);
  g.closePath();
  g.stroke();
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(-24, -34);
  g.lineTo(0, -22);
  g.lineTo(24, -34);
  g.moveTo(0, -22);
  g.lineTo(0, 4);
  g.stroke();
  g.strokeStyle = '#86b1d3';
  g.lineWidth = 1.6;
  g.beginPath();
  g.moveTo(-13, -35);
  g.lineTo(-3, -31);
  g.lineTo(5, -38);
  g.lineTo(13, -33);
  g.stroke();
  g.strokeStyle = 'rgba(255, 255, 255, 0.9)';
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(-18, -22);
  g.lineTo(-18, -10);
  g.stroke();
}

const ICON_DRAW = {
  wall: iconWall,
  water: (g) => {
    g.scale(0.84, 0.84);
    iconWater(g);
  },
  ice: (g) => {
    g.scale(0.86, 0.86);
    iconIce(g);
  },
  mine: (g) => drawMine(g, false),
  barrel: (g) => {
    g.scale(0.72, 0.72);
    drawBarrel(g, false);
  },
  tree: (g) => {
    g.scale(0.44, 0.44);
    drawTree(g);
  },
};
const ICON_BASE = { wall: 0.82, water: 0.86, ice: 0.84, mine: 0.78, barrel: 0.9, tree: 0.94 };

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
