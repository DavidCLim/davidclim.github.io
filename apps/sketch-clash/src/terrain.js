import { TAU, K } from './config.js?v=224';
import { makeLayer, drawLayer, OUT } from './sprites.js?v=224';
import { vgrad, fs, ell, circ, blob, poly, stick, rrect } from './art_kit.js?v=224';

// ------------------------------------------------------------------ the painted terrain
// Wall, water and ice are brush strokes: each is a polyline with a width. A coarse mask
// records which of them covers a point, so units can ask "what am I standing on?".
export const WATER = 1;
export const ICE = 2;
export const WALL = 4;
export const STROKE_W = { wall: 13.5, water: 24.5, ice: 24.5 };
export const WALL_H = 4.9; // the front face of a wall hangs this far below its top

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
    ['water', '#6fb2c0', '#98dee5'],
    ['ice', '#b5d3ec', '#dff0fb'],
  ]) {
    const list = of(kind);
    if (!list.length) continue;
    ctx.fillStyle = edge;
    for (const s of list) {
      blobPath(s, 0.65);
      ctx.fill();
    }
    ctx.fillStyle = fill;
    for (const s of list) {
      blobPath(s, 0);
      ctx.fill();
    }
    // water is flat with big soft patches, a shade lighter and a shade darker by turns;
    // ice is flat pale blue, crossed now and then by one broad, faint slanting sheen
    for (const s of list) {
      ctx.save();
      blobPath(s, 0);
      ctx.clip();
      const gap = kind === 'water' ? 37 : 118;
      const marks = [s.pts[0]];
      let walked = 0;
      let next = gap;
      for (let i = 1; i < s.pts.length; i++) {
        walked += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
        if (walked >= next) {
          marks.push(s.pts[i]);
          next += gap;
        }
      }
      if (kind === 'water') {
        marks.forEach(([x, y], i) => {
          const light = i % 2 === 0;
          const jx = x + (hash2(x, y) - 0.5) * s.w * 0.35;
          const jy = y + (hash2(y, x) - 0.5) * s.w * 0.35;
          const r = s.w * (light ? 0.92 : 1.05);
          const rgb = light ? '162, 236, 241' : '138, 202, 212';
          const gr = ctx.createRadialGradient(jx, jy, 0, jx, jy, r);
          gr.addColorStop(0, `rgba(${rgb}, 1)`);
          gr.addColorStop(0.4, `rgba(${rgb}, 0.75)`);
          gr.addColorStop(1, `rgba(${rgb}, 0)`);
          ctx.fillStyle = gr;
          ctx.fillRect(jx - r, jy - r, r * 2, r * 2);
        });
      } else {
        ctx.filter = 'blur(0.9px)';
        ctx.lineCap = 'butt';
        ctx.strokeStyle = 'rgba(240, 249, 255, 0.7)';
        ctx.lineWidth = 11;
        for (const [x, y] of marks.length > 1 ? marks.slice(1) : marks) {
          ctx.beginPath();
          ctx.moveTo(x - s.w * 0.55, y - s.w * 0.75);
          ctx.lineTo(x + s.w * 0.55, y + s.w * 0.75);
          ctx.stroke();
        }
      }
      ctx.restore();
    }
  }
  const walls = of('wall');
  if (!walls.length) return;
  const sc = ctx.getTransform().a || 1;
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
  const pad = 8;
  const bx = Math.max(0, Math.floor(x0 - pad));
  const by = Math.max(0, Math.floor(y0 - pad));
  const bw = Math.max(1, Math.min(W, Math.ceil(x1 + pad)) - bx);
  const bh = Math.max(1, Math.min(H, Math.ceil(y1 + pad)) - by);
  // the slab's outline is worked out pixel by pixel, so at no finer than this many pixels to a unit (painting stays smooth)
  const rs = Math.min(sc, 1.9);
  const pw = Math.ceil(bw * rs);
  const ph = Math.ceil(bh * rs);
  // a canvas covering just the walls, drawn in world units
  const layer = () => {
    const c = document.createElement('canvas');
    c.width = pw;
    c.height = ph;
    const g = c.getContext('2d');
    g.setTransform(rs, 0, 0, rs, -bx * rs, -by * rs);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    return [c, g];
  };
  const [raw, rg] = layer();
  rg.strokeStyle = '#000';
  for (const s of walls) {
    rg.lineWidth = s.w;
    rg.beginPath();
    rg.moveTo(s.pts[0][0], s.pts[0][1]);
    if (s.pts.length === 1) rg.lineTo(s.pts[0][0] + 0.01, s.pts[0][1]);
    for (let i = 1; i < s.pts.length; i++) rg.lineTo(s.pts[i][0], s.pts[i][1]);
    rg.stroke();
  }
  // blur (through a shadow thrown from off the canvas, which every browser can do)
  const sigma = 2.5;
  const soft = document.createElement('canvas');
  soft.width = pw;
  soft.height = ph;
  const so = soft.getContext('2d', { willReadFrequently: true });
  so.shadowColor = '#000';
  so.shadowBlur = sigma * rs * 2;
  so.shadowOffsetX = pw + 50;
  so.drawImage(raw, -pw - 50, 0);
  const blurred = so.getImageData(0, 0, pw, ph).data;
  // cut the blur back to sharp shapes, all three in one pass: wherever it is at least `level` thick, with a smooth
  // one-pixel edge. A lower level gives a slightly fatter shape, which makes the black rim.
  const shapes = [[0.36, [29, 28, 34]], [0.5, [64, 62, 60]], [0.53, [122, 118, 114]]].map(([level, [r, g, b]]) => {
    const c = document.createElement('canvas');
    c.width = pw;
    c.height = ph;
    const img = c.getContext('2d').createImageData(pw, ph);
    return { c, img, px: new Uint32Array(img.data.buffer), rgb: (b << 16) | (g << 8) | r, cut: level * 255 };
  });
  const gain = (sigma * rs * 2.5) / 255;
  const floor = shapes[0].cut - 0.5 / gain;
  for (let i = 0, n = pw * ph; i < n; i++) {
    const v = blurred[i * 4 + 3];
    if (v <= floor) continue;
    for (let k = 0; k < 3; k++) {
      const s = shapes[k];
      const a = (v - s.cut) * gain + 0.5;
      if (a > 0) s.px[i] = ((a >= 1 ? 255 : (a * 255) | 0) << 24) | s.rgb;
    }
  }
  for (const s of shapes) s.c.getContext('2d').putImageData(s.img, 0, 0);
  const [ink, lipFill, topMask] = shapes.map((s) => s.c);
  const put = (img, dy) => ctx.drawImage(img, bx, by + dy, pw / rs, ph / rs);
  // a soft grey shadow thrown below the slab (the blurred paint itself, faint)
  ctx.save();
  ctx.globalAlpha = 0.24;
  put(soft, WALL_H + 3.2);
  ctx.restore();
  const steps = 5;
  for (let i = steps; i >= 0; i--) put(ink, (WALL_H * i) / steps);
  // the dark front lip, as tall as the slab is thick, with the seams between its blocks
  const [lip, lg] = layer();
  const flat = (img, dy) => lg.drawImage(img, bx, by + dy, pw / rs, ph / rs);
  for (let i = steps; i >= 1; i--) flat(lipFill, (WALL_H * i) / steps);
  lg.globalCompositeOperation = 'source-atop';
  lg.strokeStyle = 'rgba(22, 20, 22, 0.5)';
  lg.lineWidth = 0.55;
  lg.beginPath();
  for (let x = Math.floor(x0 / 12) * 12; x <= x1; x += 12) {
    const jx = x + (hash2(x, 3) - 0.5) * 6;
    lg.moveTo(jx, by);
    lg.lineTo(jx + (hash2(x, 8) - 0.5) * 3, by + bh);
  }
  lg.stroke();
  put(lip, 0);
  put(ink, 0);

  // the top: big irregular flagstones fitted tightly together
  const [top, tg] = layer();
  const cell = 15.5;
  const seed = (i, j) => [(i + 0.5 + (hash2(i, j) - 0.5) * 0.78) * cell, (j + 0.5 + (hash2(j + 31, i + 7) - 0.5) * 0.78) * cell];
  const shades = ['#767370', '#7a7672', '#7f7c78', '#787470', '#7c7975'];
  tg.strokeStyle = 'rgba(96, 92, 89, 0.68)';
  tg.lineWidth = 0.55;
  for (let j = Math.floor(y0 / cell) - 1; j <= Math.ceil(y1 / cell) + 1; j++) {
    for (let i = Math.floor(x0 / cell) - 1; i <= Math.ceil(x1 / cell) + 1; i++) {
      const [px, py] = seed(i, j);
      // a stone is all the ground nearer its own middle than any neighbour's
      let poly = [[px - cell * 1.5, py - cell * 1.5], [px + cell * 1.5, py - cell * 1.5], [px + cell * 1.5, py + cell * 1.5], [px - cell * 1.5, py + cell * 1.5]];
      for (let dj = -2; dj <= 2; dj++) {
        for (let di = -2; di <= 2; di++) {
          if (!di && !dj) continue;
          const [qx, qy] = seed(i + di, j + dj);
          const side = (p) => (p[0] - (px + qx) / 2) * (qx - px) + (p[1] - (py + qy) / 2) * (qy - py);
          const next = [];
          for (let k = 0; k < poly.length; k++) {
            const a = poly[k];
            const b = poly[(k + 1) % poly.length];
            const fa = side(a);
            const fb = side(b);
            if (fa <= 0) next.push(a);
            if (fa * fb < 0) next.push([a[0] + ((b[0] - a[0]) * fa) / (fa - fb), a[1] + ((b[1] - a[1]) * fa) / (fa - fb)]);
          }
          poly = next;
        }
      }
      tg.beginPath();
      poly.forEach(([x, y], k) => (k ? tg.lineTo(x, y) : tg.moveTo(x, y)));
      tg.closePath();
      tg.fillStyle = shades[Math.floor(hash2(i * 7 + 3, j * 5 + 1) * shades.length) % shades.length];
      tg.fill();
      tg.stroke();
    }
  }
  tg.globalCompositeOperation = 'destination-in';
  tg.setTransform(1, 0, 0, 1, 0, 0);
  tg.drawImage(topMask, 0, 0);
  put(topMask, 0);
  put(top, 0);
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

// A land mine: a squat olive disc with a ring on top and a dark red button in the middle.
function drawMine(g, lit) {
  g.save();
  g.translate(4, 3);
  shadowEll(g, 30, 12, 1);
  g.restore();
  ink(g, 2.4);
  // the side
  g.beginPath();
  g.ellipse(0, 0, 22, 13, 0, 0, Math.PI);
  g.lineTo(-22, -9);
  g.ellipse(0, -9, 22, 13, 0, Math.PI, TAU);
  g.closePath();
  g.fillStyle = '#4a5130';
  g.fill();
  g.stroke();
  // the top
  g.beginPath();
  g.ellipse(0, -9, 22, 13, 0, 0, TAU);
  g.fillStyle = '#5f6b3f';
  g.fill();
  g.stroke();
  g.beginPath();
  g.ellipse(0, -9, 12.5, 7.7, 0, 0, TAU);
  g.fillStyle = '#7d8658';
  g.fill();
  ink(g, 1.6);
  g.stroke();
  g.fillStyle = lit ? '#ff5532' : '#5e1610';
  g.beginPath();
  g.ellipse(0, -9, 5.3, 5, 0, 0, TAU);
  g.fill();
  g.stroke();
  g.fillStyle = lit ? 'rgba(255, 214, 190, 0.9)' : 'rgba(255, 170, 150, 0.55)';
  g.beginPath();
  g.ellipse(-1.8, -10.8, 1.5, 1.1, -0.5, 0, TAU);
  g.fill();
}

// An oil drum: red and a little bulged, with two dark bands and a yellow warning diamond.
function drawBarrel(g, glow) {
  g.save();
  g.translate(3, 0);
  shadowEll(g, 29, 7, 1);
  g.restore();
  const body = () => {
    g.beginPath();
    g.moveTo(-17.4, -50);
    g.bezierCurveTo(-20.4, -36, -20.4, -15, -17.4, -3);
    g.quadraticCurveTo(0, 5, 17.4, -3);
    g.bezierCurveTo(20.4, -15, 20.4, -36, 17.4, -50);
    g.closePath();
  };
  const hg = g.createLinearGradient(-19, 0, 19, 0);
  hg.addColorStop(0, '#b4302c');
  hg.addColorStop(0.2, '#d5453c');
  hg.addColorStop(0.55, '#c93a34');
  hg.addColorStop(0.72, '#aa2c29');
  hg.addColorStop(1, '#8e2221');
  body();
  g.fillStyle = hg;
  g.fill();
  g.save();
  body();
  g.clip();
  g.fillStyle = '#ee8078';
  g.fillRect(-12.6, -52, 4, 56);
  g.strokeStyle = '#6f1510';
  g.lineWidth = 3.4;
  for (const yy of [-40, -17]) {
    g.beginPath();
    g.moveTo(-23, yy);
    g.quadraticCurveTo(0, yy + 8, 23, yy);
    g.stroke();
  }
  g.restore();
  ink(g, 2.4);
  body();
  g.stroke();
  g.beginPath();
  g.ellipse(0, -50, 17.6, 5.8, 0, 0, TAU);
  g.fillStyle = '#d85048';
  g.fill();
  g.stroke();
  g.fillStyle = '#4a0f0c';
  g.beginPath();
  g.ellipse(8, -51, 3.2, 1.8, 0, 0, TAU);
  g.fill();
  const diamond = (half) => {
    g.beginPath();
    g.moveTo(0.5, -26 - half);
    g.lineTo(0.5 + half, -26);
    g.lineTo(0.5, -26 + half);
    g.lineTo(0.5 - half, -26);
    g.closePath();
  };
  diamond(10);
  g.fillStyle = glow ? '#fff08a' : '#f6c933';
  g.fill();
  ink(g, 1.8);
  g.stroke();
  g.save();
  g.strokeStyle = '#7a5a10';
  g.lineWidth = 1;
  g.setLineDash([2.2, 1.6]);
  diamond(7.2);
  g.stroke();
  g.restore();
  g.fillStyle = '#2a1c08';
  g.beginPath();
  g.roundRect(-0.9, -31, 2.8, 6.8, 1.2);
  g.fill();
  g.beginPath();
  g.arc(0.5, -21.8, 1.5, 0, TAU);
  g.fill();
}

// A tree: a bumpy cloud of leaves with a lighter lump on top, on a slim trunk that flares at the foot.
function drawTree(g) {
  shadowEll(g, 30, 7, 1);
  const trunk = () => {
    g.beginPath();
    g.moveTo(-13, 2);
    g.quadraticCurveTo(-6, -1, -6, -15);
    g.lineTo(-5.4, -56);
    g.lineTo(5.4, -56);
    g.lineTo(6, -15);
    g.quadraticCurveTo(6, -1, 13, 2);
    g.quadraticCurveTo(6, 1, 3, 4);
    g.quadraticCurveTo(0, 1, -3, 4);
    g.quadraticCurveTo(-7, 1, -13, 2);
    g.closePath();
  };
  trunk();
  g.fillStyle = '#5c3b22';
  g.fill();
  g.save();
  trunk();
  g.clip();
  g.fillStyle = '#82562f';
  g.fillRect(-3.4, -56, 3.8, 56);
  g.restore();
  ink(g, 2.2);
  trunk();
  g.stroke();

  const puffs = (list, grow) => {
    g.beginPath();
    for (const [x, y, r] of list) {
      g.moveTo(x + r + grow, y);
      g.arc(x, y, r + grow, 0, TAU);
    }
  };
  const outer = [[0, -90, 22], [-19, -83, 17], [20, -83, 16], [-25, -69, 13], [26, -70, 12], [-8, -66, 17], [12, -65, 16], [8, -101, 12], [-12, -99, 12],
    [-30, -78, 8.5], [-28, -93, 7.5], [-18, -105, 7.5], [-2, -110, 9], [18, -104, 8], [29, -92, 7.5], [33, -77, 7], [27, -59, 8], [-24, -58, 8], [3, -54, 9], [-10, -53, 7.5], [16, -53, 7]];
  g.save();
  g.translate(0, -52);
  g.scale(1, 0.93);
  g.translate(0, 52);
  // outline first, then fill over it, so only the rim of the whole cloud shows
  puffs(outer, 1.8);
  g.fillStyle = '#1c2218';
  g.fill();
  puffs(outer, 0);
  g.fillStyle = '#41702f';
  g.fill();
  const inner = [[0, -92, 19], [-17, -86, 13], [17, -86, 12], [-6, -76, 14], [12, -76, 13], [6, -100, 11], [-10, -98, 11]];
  puffs(inner, 0);
  g.fillStyle = '#649551';
  g.fill();
  // little scallops that pick out the clumps
  g.strokeStyle = '#3a6632';
  g.lineWidth = 1.7;
  g.lineCap = 'round';
  for (const [x, y, r, a, b] of [[-17, -79, 8, 0.15, 0.85], [-5, -68, 9, 0.1, 0.85], [12, -69, 8, 0.12, 0.9], [22, -81, 7, 0.1, 0.75], [-24, -62, 7, 0.2, 0.8], [3, -55, 8, 0.15, 0.8], [23, -59, 6, 0.15, 0.8], [-12, -52, 6, 0.2, 0.75]]) {
    g.beginPath();
    g.arc(x, y, r, Math.PI * a, Math.PI * b);
    g.stroke();
  }
  g.fillStyle = '#9cc88e';
  g.beginPath();
  g.arc(10, -100, 5.5, 0, TAU);
  g.fill();
  g.beginPath();
  g.arc(-14, -92, 2.2, 0, TAU);
  g.fill();
  g.strokeStyle = '#5a3a22';
  g.lineWidth = 2.2;
  g.beginPath();
  g.moveTo(-23, -66);
  g.lineTo(-15, -62);
  g.moveTo(-18.4, -63.6);
  g.lineTo(-18, -68.4);
  g.stroke();
  g.restore();
  // toes of root at the foot
  ink(g, 1.6);
  g.beginPath();
  g.moveTo(-10, 0);
  g.lineTo(-17, 1.5);
  g.moveTo(-14, 0.8);
  g.lineTo(-16, -3);
  g.moveTo(10, 0);
  g.lineTo(17, 1);
  g.stroke();
}

// A wizard tower, after the sketch it was asked to look like: a tall roof of stacked faceted tiles with a leaning point,
// a wide upper floor with latticed windows held up on carved wooden blocks, three pointed windows stepping down the
// stone shaft, a little turret on one side and a roofed bay on the other, a door in a chunky stone arch, and a round
// stepped plinth with blocks jutting from it. Origin: the middle of the ground.
const TW = {
  tile: ['#8b7fc6', '#7a6eb8', '#695da6', '#9a8fd2'],
  tileDark: '#4a4189',
  stone: '#d3c9b2',
  stoneLite: '#e4dcc6',
  stoneShade: '#a79c86',
  base: '#b3b0aa',
  baseShade: '#8f8c88',
  wood: '#a8723f',
  woodDark: '#6e4524',
};

// one flat-sided piece, outlined
function slab(g, pts, fill, lw = 1.7) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  ink(g, lw);
  g.stroke();
}

function crease(g, pts, col = 'rgba(55, 44, 30, 0.4)', lw = 0.9) {
  g.strokeStyle = col;
  g.lineWidth = lw;
  g.lineCap = 'round';
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.stroke();
}

function across(g, x0, x1, light, dark) {
  const gr = g.createLinearGradient(x0, 0, x1, 0);
  gr.addColorStop(0, light);
  gr.addColorStop(1, dark);
  return gr;
}

// a round stone step: its side wall and its top
function drum(g, cx, top, rx, ry, h, side, face) {
  g.beginPath();
  g.moveTo(cx - rx, top);
  g.lineTo(cx - rx, top + h);
  g.ellipse(cx, top + h, rx, ry, 0, Math.PI, 0, true);
  g.lineTo(cx + rx, top);
  g.closePath();
  g.fillStyle = side;
  g.fill();
  ink(g, 1.9);
  g.stroke();
  g.beginPath();
  g.ellipse(cx, top, rx, ry, 0, 0, TAU);
  g.fillStyle = face;
  g.fill();
  g.stroke();
}

// a window with a pointed arch, lit from inside
function pointed(g, x, y, w, h) {
  g.beginPath();
  g.moveTo(x - w / 2, y + h / 2);
  g.lineTo(x - w / 2, y - h * 0.08);
  g.quadraticCurveTo(x - w / 2, y - h * 0.42, x, y - h / 2);
  g.quadraticCurveTo(x + w / 2, y - h * 0.42, x + w / 2, y - h * 0.08);
  g.lineTo(x + w / 2, y + h / 2);
  g.closePath();
  const lamp = g.createRadialGradient(x, y + 1, 0.5, x, y + 1, h * 0.7);
  lamp.addColorStop(0, '#ffe9a0');
  lamp.addColorStop(1, '#b7641c');
  g.fillStyle = lamp;
  g.fill();
  ink(g, 1.5);
  g.stroke();
  crease(g, [[x - w * 0.18, y - h * 0.28], [x - w * 0.18, y + h * 0.4]], 'rgba(60, 30, 6, 0.55)', 0.8);
}

// a latticed window set in one face of the upper floor: its four corners, split into panes
function lattice(g, tl, tr, br, bl) {
  slab(g, [tl, tr, br, bl], '#8a7c62', 1.5);
  const at = (u, v) => {
    const top = [tl[0] + (tr[0] - tl[0]) * u, tl[1] + (tr[1] - tl[1]) * u];
    const bot = [bl[0] + (br[0] - bl[0]) * u, bl[1] + (br[1] - bl[1]) * u];
    return [top[0] + (bot[0] - top[0]) * v, top[1] + (bot[1] - top[1]) * v];
  };
  for (let i = 0; i < 4; i++) {
    for (let j = 0; j < 3; j++) {
      slab(g, [at(0.07 + i * 0.22, 0.09 + j * 0.29), at(0.27 + i * 0.22, 0.09 + j * 0.29), at(0.27 + i * 0.22, 0.33 + j * 0.29), at(0.07 + i * 0.22, 0.33 + j * 0.29)], (i + j) % 3 === 0 ? '#ffe28a' : '#f5b847', 0);
    }
  }
}

function drawTower(g) {
  const PI = Math.PI;
  shadowEll(g, 40, 8, 3);

  // ---- the plinth: a wide round step, a smaller one on it, blocks jutting out
  slab(g, [[-31, -13], [-22, -14], [-21, -4], [-30, -2]], TW.base);
  slab(g, [[27, -15], [37, -13], [36, -4], [27, -3]], TW.baseShade);
  drum(g, 0, -11, 31, 7.4, 9, across(g, -31, 31, '#a5a29c', '#77746f'), TW.base);
  drum(g, -1, -17, 24, 5.6, 6, across(g, -25, 23, '#b6b3ad', '#87847e'), '#c6c3bc');
  slab(g, [[-37, -3], [-27, 0], [-28, 10], [-38, 6]], across(g, -38, -27, '#c0bdb6', '#96938d'));
  crease(g, [[-37, -3], [-31, -5], [-22, -2], [-27, 0]], '#17141a', 1.5);

  // ---- the stone shaft
  slab(g, [[-19, -17], [-15.5, -88], [15, -88], [18, -17]], across(g, -19, 18, TW.stoneLite, TW.stoneShade), 1.9);
  for (const [x, y, w] of [[6, -69, 7], [9, -65.6, 6], [-15, -77, 5], [10, -28, 6], [-17, -31, 6], [-12, -27.6, 5], [8, -83, 5]]) {
    slab(g, [[x, y], [x + w, y - 0.3], [x + w, y + 3.2], [x, y + 3.5]], 'rgba(255, 250, 235, 0.18)', 0);
    crease(g, [[x, y], [x + w, y - 0.3], [x + w, y + 3.2], [x, y + 3.5], [x, y]]);
  }
  // three pointed windows, stepping down from right to left
  pointed(g, 3.5, -75.5, 6.6, 10);
  pointed(g, -2.6, -63.5, 6.6, 10);
  pointed(g, -8.6, -52, 6.6, 10);

  // ---- the door in its arch of big uneven stones
  const doorPath = () => {
    g.beginPath();
    g.moveTo(-8.5, -14);
    g.lineTo(-8.5, -31);
    g.bezierCurveTo(-8.5, -43, 12.5, -43, 12.5, -31);
    g.lineTo(12.5, -14);
    g.closePath();
  };
  doorPath();
  g.fillStyle = across(g, -9, 13, '#b57c46', '#7a4b26');
  g.fill();
  ink(g, 1.8);
  g.stroke();
  for (const x of [-2, 4.5]) crease(g, [[x, -39.2], [x, -14.5]], 'rgba(50, 26, 8, 0.7)', 1.1);
  g.beginPath();
  g.arc(8.6, -25.5, 1.7, 0, TAU);
  g.fillStyle = '#f0c25a';
  g.fill();
  ink(g, 1.1);
  g.stroke();
  for (const [pts, c] of [
    [[[-15, -13], [-8.5, -14], [-8.5, -22], [-14.5, -22.6]], TW.stone],
    [[[-14.5, -22.6], [-8.5, -22], [-8.5, -31.5], [-15.6, -32.4]], TW.stoneLite],
    [[[-15.6, -32.4], [-8.5, -31.5], [-5.6, -38], [-10.8, -44]], TW.stone],
    [[[-10.8, -44], [-5.6, -38], [0.4, -40.2], [-0.6, -48.4]], TW.stoneLite],
    [[[-0.6, -48.4], [0.4, -40.2], [7.4, -39.4], [10, -46.6]], '#efe8d4'],
    [[[10, -46.6], [7.4, -39.4], [11.6, -35], [17.6, -39.4]], TW.stone],
    [[[17.6, -39.4], [11.6, -35], [12.5, -26], [19, -27]], TW.stoneShade],
    [[[19, -27], [12.5, -26], [12.5, -14], [19.4, -13]], '#b6ab93'],
  ]) slab(g, pts, c, 1.7);

  // ---- front steps up to the door
  slab(g, [[-12, -15], [16, -15], [19, -8], [-14, -8]], '#cfccc5');
  slab(g, [[-14, -8], [19, -8], [19, -3], [-14, -3]], TW.base);
  g.beginPath();
  g.moveTo(-17, -3);
  g.lineTo(22, -3);
  g.quadraticCurveTo(31, 1, 27, 5);
  g.quadraticCurveTo(3, 11, -19, 5);
  g.quadraticCurveTo(-22, 1, -17, -3);
  g.closePath();
  g.fillStyle = '#cfccc5';
  g.fill();
  ink(g, 1.9);
  g.stroke();
  slab(g, [[-19, 5], [-8, 7.6], [6, 8], [27, 5], [26, 11], [6, 14.5], [-8, 14], [-18, 11]], across(g, -19, 27, '#aba8a2', '#84817c'));

  // ---- the little turret on the left, with its own stacked roof
  g.beginPath();
  g.moveTo(-31, -62);
  g.lineTo(-30, -46);
  g.quadraticCurveTo(-27, -36, -18, -34);
  g.lineTo(-14, -46);
  g.lineTo(-14, -62);
  g.closePath();
  g.fillStyle = across(g, -31, -14, TW.stoneLite, TW.stoneShade);
  g.fill();
  ink(g, 1.8);
  g.stroke();
  crease(g, [[-30, -45], [-22, -43], [-15, -45]], '#17141a', 1.3);
  pointed(g, -24, -52.5, 5, 8);
  slab(g, [[-38, -62], [-32, -69], [-23, -67], [-23, -59]], TW.tile[1]);
  slab(g, [[-23, -67], [-14, -69], [-10, -62], [-23, -59]], TW.tile[2]);
  slab(g, [[-34, -69], [-28, -76], [-22, -74], [-23, -67]], TW.tile[0]);
  slab(g, [[-22, -74], [-16, -75], [-13, -69], [-23, -67]], TW.tile[1]);
  slab(g, [[-29, -75], [-23, -83], [-17, -75], [-22, -74]], TW.tile[3]);

  // ---- the roofed bay on the right, on a rounded stone bracket
  g.beginPath();
  g.moveTo(10, -53);
  g.lineTo(26, -53);
  g.quadraticCurveTo(26, -42, 15, -40);
  g.quadraticCurveTo(10, -43, 10, -53);
  g.closePath();
  g.fillStyle = across(g, 10, 26, TW.stone, TW.stoneShade);
  g.fill();
  ink(g, 1.8);
  g.stroke();
  slab(g, [[6, -52], [10, -61], [17, -61], [17, -50]], TW.tile[3]);
  slab(g, [[17, -61], [23, -61], [25, -51], [17, -50]], TW.tile[1]);
  slab(g, [[23, -61], [27, -59], [31, -52], [25, -51]], TW.tile[2]);
  slab(g, [[9, -60], [13, -68], [19, -68], [18, -60]], TW.tile[0]);
  slab(g, [[19, -68], [23, -66], [26, -59], [18, -60]], TW.tile[2]);
  slab(g, [[13, -67], [17, -72], [22, -67]], TW.tile[3]);

  // ---- carved wooden blocks holding up the top floor
  const block = (pts, x, y, r) => {
    slab(g, pts, across(g, pts[0][0], pts[1][0], '#bd874f', TW.woodDark), 1.8);
    // the swirl of the grain
    g.strokeStyle = 'rgba(70, 38, 14, 0.8)';
    g.lineWidth = 1;
    g.beginPath();
    for (let a = 0; a < PI * 4.4; a += 0.35) {
      const rr = r * (a / (PI * 4.4));
      const px = x + Math.cos(a) * rr;
      const py = y + Math.sin(a) * rr;
      if (a) g.lineTo(px, py);
      else g.moveTo(px, py);
    }
    g.stroke();
  };
  block([[-25, -89], [-10, -88], [-11, -74], [-22, -76]], -17, -82, 5);
  block([[16, -88], [27, -90], [24, -76], [17, -74]], 21.4, -82, 4);

  // ---- the wide upper floor: three faces with latticed windows, between two ledges
  slab(g, [[-34, -108], [-15, -104], [-15, -85], [-32, -91]], across(g, -34, -15, '#e0d5bb', '#bcae90'), 1.9);
  slab(g, [[-15, -104], [18, -104], [18, -85], [-15, -85]], TW.stone, 1.9);
  slab(g, [[18, -104], [36, -109], [33, -92], [18, -85]], across(g, 18, 36, '#b3a68a', '#8d8169'), 1.9);
  lattice(g, [-30.5, -104], [-20, -101.6], [-20, -91.6], [-29.5, -94.5]);
  lattice(g, [-11, -100.5], [4, -100.5], [4, -89], [-11, -89]);
  lattice(g, [21.5, -101], [32, -104], [30.6, -94.6], [21.5, -91]);
  slab(g, [[-34, -92], [-15, -86], [18, -86], [35, -93], [33, -89], [18, -82], [-15, -82], [-32, -88]], '#c3b598', 1.8);

  // ---- the roof, from the great eave up. Deep shadow tucked under it first
  slab(g, [[-40, -110], [-15, -105.5], [18, -105.5], [41, -111], [20, -116], [-20, -116]], '#2e2856', 0);
  // the slope of the great eave, in facets
  slab(g, [[-49, -112], [-34, -119], [-24, -133], [-37, -127]], TW.tile[0]);
  slab(g, [[-34, -119], [-12, -123], [-9, -137], [-24, -133]], TW.tile[3]);
  slab(g, [[-12, -123], [14, -134], [11, -141], [-9, -137]], TW.tile[0]);
  slab(g, [[14, -134], [37, -119], [24, -135], [11, -141]], TW.tile[1]);
  slab(g, [[37, -119], [51, -103], [37, -123], [24, -135]], TW.tile[2]);
  // and its thick front edge, a ring of big uneven tiles
  slab(g, [[-49, -112], [-34, -119], [-32, -105], [-46, -101]], TW.tile[1], 2);
  slab(g, [[-34, -119], [-12, -123], [-11, -107], [-32, -105]], TW.tile[0], 2);
  slab(g, [[-12, -123], [14, -134], [16, -117], [-11, -107]], TW.tile[3], 2);
  slab(g, [[14, -134], [37, -119], [38, -105], [16, -117]], TW.tile[2], 2);
  slab(g, [[37, -119], [51, -103], [47, -93], [38, -105]], TW.tileDark, 2);
  for (const [x0, y0, x1, y1] of [[-43, -108, -37, -110], [-27, -111, -17, -112.6], [-4, -118, 8, -123], [21, -122, 31, -115]]) {
    crease(g, [[x0, y0], [x1, y1]], 'rgba(225, 218, 255, 0.5)', 1.2);
  }
  // two more rings of tiles, each smaller and flaring over the one below
  const ring = (tiles) => {
    for (const [pts] of tiles) slab(g, pts.map(([x, y]) => [x * 1.04, y + 3.4]), '#2e2856', 0);
    for (const [pts, c] of tiles) slab(g, pts, c, 1.8);
  };
  ring([
    [[[-29, -130], [-18, -143], [-8, -141], [-10, -132.5], [-19, -136]], TW.tile[1]],
    [[[-10, -132.5], [-8, -141], [8, -145], [12, -137.5], [0, -133]], TW.tile[3]],
    [[[12, -137.5], [8, -145], [19, -144], [30, -132], [20, -135]], TW.tile[2]],
  ]);
  ring([
    [[[-19, -141], [-9, -151], [-2, -150], [-1, -142.5], [-9, -144.5]], TW.tile[0]],
    [[[-1, -142.5], [-2, -150], [10, -154], [14, -146], [6, -142]], TW.tile[3]],
    [[[14, -146], [10, -154], [16, -152], [23, -141.5], [16, -144]], TW.tile[2]],
  ]);
  // the leaning point on top
  slab(g, [[-3, -149], [3, -157], [1, -158], [10, -166], [12, -156], [15, -151], [6, -152]], TW.tile[1], 1.8);
  slab(g, [[5, -154], [10, -166], [12, -156]], TW.tile[3], 1.3);
}

// The living part of it, drawn over every frame: lamplight breathing in the windows. Same coordinates as drawTower.
export function drawTowerMagic(ctx, t) {
  const glow = (x, y, r, al) => {
    const gr = ctx.createRadialGradient(x * K, y * K, 0, x * K, y * K, r * K);
    gr.addColorStop(0, `rgba(255, 200, 90, ${al})`);
    gr.addColorStop(1, 'rgba(255, 200, 90, 0)');
    ctx.fillStyle = gr;
    ctx.beginPath();
    ctx.arc(x * K, y * K, r * K, 0, TAU);
    ctx.fill();
  };
  const breathe = 0.5 + 0.5 * Math.sin(t * 2.2);
  const other = 0.5 + 0.5 * Math.sin(t * 2.9 + 2);
  glow(-3.5, -95, 13, 0.16 + 0.16 * breathe);
  glow(26.5, -97.5, 10, 0.12 + 0.14 * other);
  glow(-25, -98, 10, 0.1 + 0.12 * other);
  glow(3.5, -75.5, 7, 0.14 + 0.18 * other);
  glow(-2.6, -63.5, 7, 0.14 + 0.18 * breathe);
  glow(-8.6, -52, 7, 0.14 + 0.18 * other);
  glow(-24, -52.5, 6, 0.12 + 0.18 * breathe);
}

export function buildTerrainArt() {
  return {
    mine: makeLayer(-34, -26, 40, 22, (g) => drawMine(g, false)),
    mineLit: makeLayer(-34, -26, 40, 22, (g) => drawMine(g, true)),
    barrel: makeLayer(-30, -62, 36, 10, (g) => drawBarrel(g, false)),
    barrelHot: makeLayer(-30, -62, 36, 10, (g) => drawBarrel(g, true)),
    tree: makeLayer(-48, -128, 48, 10, drawTree),
    tower: makeLayer(-54, -172, 54, 20, drawTower),
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
    g.scale(0.42, 0.42);
    drawTree(g);
  },
  tower: (g) => {
    g.scale(0.3, 0.3);
    drawTower(g);
  },
};
const ICON_BASE = { wall: 0.82, water: 0.86, ice: 0.84, mine: 0.64, barrel: 0.9, tree: 0.94, tower: 0.9 };

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
