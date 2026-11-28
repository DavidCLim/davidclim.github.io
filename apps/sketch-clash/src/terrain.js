import { TAU, K } from './config.js?v=269';
import { makeLayer, drawLayer, OUT } from './sprites.js?v=269';
import { vgrad, fs, ell, circ, blob, poly, stick, rrect } from './art_kit.js?v=269';

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
    const v = this.mask[j * this.cols + i];
    // ice lies over water: whatever is there is standing on the ice
    return v & ICE ? v & ~WATER : v;
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

// Paints the ice and walls onto the ground canvas (already scaled to world units); the water has a layer of its own
// under it (water.js). Nothing is painted twice that needn't be: ice is added to as the brush goes, and walls are only
// rebuilt when one is finished, with a quick stand-in for the one still being drawn.
function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

// a stroke of water or ice is a chain of slightly uneven discs, so that its banks wobble
export function bankRadius(s, x, y) {
  const n = Math.sin(x * 0.09 + y * 0.06) * 0.5 + Math.sin(x * 0.037 - y * 0.08 + 1.7) * 0.5 + Math.sin(x * 0.23 + y * 0.19 + 0.6) * 0.35;
  return (s.w / 2) * (0.91 + 0.17 * n);
}

// the discs along a stroke from point `from` on, as [x, y, radius]
export function bankDiscs(s, from) {
  const out = [];
  for (let i = from; i < s.pts.length; i++) {
    const b = s.pts[i];
    if (i === 0) {
      out.push([b[0], b[1], bankRadius(s, b[0], b[1])]);
      continue;
    }
    const a = s.pts[i - 1];
    const n = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / 3));
    for (let k = 1; k <= n; k++) {
      const x = a[0] + ((b[0] - a[0]) * k) / n;
      const y = a[1] + ((b[1] - a[1]) * k) / n;
      out.push([x, y, bankRadius(s, x, y)]);
    }
  }
  return out;
}

export function fillDiscs(g, discs, grow) {
  g.beginPath();
  for (const [x, y, r] of discs) {
    g.moveTo(x + r + grow, y);
    g.arc(x, y, r + grow, 0, TAU);
  }
  g.fill();
}

// the original's ice: flat and pale with a fine edge and a broad faint slanting sheen now and then; where it lies over
// water it is a deeper blue, softly shading off, with none of the water's movement showing through
const ICE_FILL = 'rgb(223, 240, 250)';
const ICE_EDGE = 'rgb(185, 215, 235)';
const ICE_ON_WATER = 'rgb(168, 215, 239)';
const SHEEN_GAP = 118;

const sheet = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

let ice = null;
function iceLayers(pw, ph, scale, list) {
  const gone = ice && [...ice.painted.keys()].some((s) => !list.includes(s));
  if (!ice || gone || ice.pw !== pw || ice.ph !== ph || ice.scale !== scale) {
    ice = { pw, ph, scale, edge: sheet(pw, ph), fill: sheet(pw, ph), shine: sheet(pw, ph), done: sheet(pw, ph), under: null, painted: new Map(), stamp: 0, drawn: '' };
  }
  const on = (c) => {
    const g = c.getContext('2d');
    g.setTransform(scale, 0, 0, scale, 0, 0);
    return g;
  };
  for (const s of list) {
    let p = ice.painted.get(s);
    if (!p) ice.painted.set(s, (p = { n: 0, walked: 0, next: 30 }));
    if (p.n >= s.pts.length) continue;
    const discs = bankDiscs(s, p.n);
    for (const [c, grow, ink] of [[ice.edge, 0.65, ICE_EDGE], [ice.fill, 0, ICE_FILL]]) {
      const g = on(c);
      g.fillStyle = ink;
      fillDiscs(g, discs, grow);
    }
    const g = on(ice.shine);
    g.lineCap = 'butt';
    for (let i = Math.max(1, p.n); i < s.pts.length; i++) {
      p.walked += Math.hypot(s.pts[i][0] - s.pts[i - 1][0], s.pts[i][1] - s.pts[i - 1][1]);
      if (p.walked < p.next) continue;
      p.next += SHEEN_GAP;
      const [x, y] = s.pts[i];
      for (const [wide, a] of [[13, 0.17], [9, 0.26], [4.5, 0.2]]) {
        g.strokeStyle = `rgba(246, 251, 255, ${a})`;
        g.lineWidth = wide;
        g.beginPath();
        g.moveTo(x - s.w * 0.55, y - s.w * 0.75);
        g.lineTo(x + s.w * 0.55, y + s.w * 0.75);
        g.stroke();
      }
    }
    p.n = s.pts.length;
    ice.stamp++;
  }
  return ice;
}

// the finished ice picture: the flat fill, the deeper blue over any water, then the sheen, all kept inside the fill
function composeIce(layers, water) {
  const key = `${layers.stamp}|${water ? water.stamp : 0}`;
  if (layers.drawn === key) return layers.done;
  layers.drawn = key;
  const g = layers.done.getContext('2d');
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-over';
  g.clearRect(0, 0, layers.pw, layers.ph);
  g.drawImage(layers.fill, 0, 0);
  g.globalCompositeOperation = 'source-atop';
  if (water && water.box) {
    if (!layers.under) layers.under = sheet(layers.pw, layers.ph);
    const u = layers.under.getContext('2d');
    u.globalCompositeOperation = 'source-over';
    u.clearRect(0, 0, layers.pw, layers.ph);
    u.drawImage(water.mask, 0, 0);
    u.globalCompositeOperation = 'source-in';
    u.fillStyle = ICE_ON_WATER;
    u.fillRect(0, 0, layers.pw, layers.ph);
    g.filter = `blur(${(2.2 * layers.scale).toFixed(1)}px)`;
    g.drawImage(layers.under, 0, 0);
    g.filter = 'none';
  }
  g.drawImage(layers.shine, 0, 0);
  g.globalCompositeOperation = 'source-over';
  return layers.done;
}

// a box blur run three times, which is very nearly a true soft blur
function soften(src, w, h, radius) {
  const a = new Float32Array(w * h);
  const b = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) a[i] = src[i * 4 + 3];
  const pass = (from, to, n, step, lines, stride) => {
    const size = radius * 2 + 1;
    for (let l = 0; l < lines; l++) {
      const base = l * stride;
      let sum = 0;
      for (let i = 0; i <= radius && i < n; i++) sum += from[base + i * step];
      for (let i = 0; i < n; i++) {
        to[base + i * step] = sum / size;
        if (i + radius + 1 < n) sum += from[base + (i + radius + 1) * step];
        if (i - radius >= 0) sum -= from[base + (i - radius) * step];
      }
    }
  };
  for (let k = 0; k < 3; k++) {
    pass(a, b, w, 1, h, w);
    pass(b, a, h, w, w, 1);
  }
  return a;
}

// a wall is a raised slab of flagstones with a bricked front
function paintWalls(ctx, W, H, walls) {
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
  const layer = (readOften) => {
    const c = sheet(pw, ph);
    const g = c.getContext('2d', readOften ? { willReadFrequently: true } : undefined);
    g.setTransform(rs, 0, 0, rs, -bx * rs, -by * rs);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    return [c, g];
  };
  const [, rg] = layer(true);
  rg.strokeStyle = '#000';
  for (const s of walls) {
    rg.lineWidth = s.w;
    rg.beginPath();
    rg.moveTo(s.pts[0][0], s.pts[0][1]);
    if (s.pts.length === 1) rg.lineTo(s.pts[0][0] + 0.01, s.pts[0][1]);
    for (let i = 1; i < s.pts.length; i++) rg.lineTo(s.pts[i][0], s.pts[i][1]);
    rg.stroke();
  }
  const sigma = 2.5;
  const spread = sigma * rs;
  const blurred = soften(rg.getImageData(0, 0, pw, ph).data, pw, ph, Math.max(1, Math.round((Math.sqrt(4 * spread * spread + 1) - 1) / 2)));
  // cut the blur back to sharp shapes, all three in one pass: wherever it is at least `level` thick, with a smooth
  // one-pixel edge. A lower level gives a slightly fatter shape, which makes the black rim.
  const shapes = [[0.36, [29, 28, 34]], [0.5, [64, 62, 60]], [0.53, [122, 118, 114]]].map(([level, [r, g, b]]) => {
    const c = sheet(pw, ph);
    const img = c.getContext('2d').createImageData(pw, ph);
    return { c, img, px: new Uint32Array(img.data.buffer), rgb: (b << 16) | (g << 8) | r, cut: level * 255 };
  });
  const gain = (sigma * rs * 2.5) / 255;
  const floor = shapes[0].cut - 0.5 / gain;
  const soft = sheet(pw, ph);
  const shade = soft.getContext('2d').createImageData(pw, ph);
  for (let i = 0, n = pw * ph; i < n; i++) {
    const v = blurred[i];
    shade.data[i * 4 + 3] = v;
    if (v <= floor) continue;
    for (let k = 0; k < 3; k++) {
      const s = shapes[k];
      const a = (v - s.cut) * gain + 0.5;
      if (a > 0) s.px[i] = ((a >= 1 ? 255 : (a * 255) | 0) << 24) | s.rgb;
    }
  }
  soft.getContext('2d').putImageData(shade, 0, 0);
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
  // (stones of one shade are gathered into one shape, and only those that come near a wall are cut at all)
  const stones = shades.map(() => new Path2D());
  const seams = new Path2D();
  const onWall = (x, y) => {
    const i = Math.round((x - bx) * rs);
    const j = Math.round((y - by) * rs);
    return i >= 0 && j >= 0 && i < pw && j < ph && blurred[j * pw + i] > floor;
  };
  const near = (x, y) => {
    for (let dy = -cell; dy <= cell; dy += cell / 3) {
      for (let dx = -cell; dx <= cell; dx += cell / 3) if (onWall(x + dx, y + dy)) return true;
    }
    return false;
  };
  for (let j = Math.floor(y0 / cell) - 1; j <= Math.ceil(y1 / cell) + 1; j++) {
    for (let i = Math.floor(x0 / cell) - 1; i <= Math.ceil(x1 / cell) + 1; i++) {
      const [px, py] = seed(i, j);
      if (!near(px, py)) continue;
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
      const stone = new Path2D();
      poly.forEach(([x, y], k) => (k ? stone.lineTo(x, y) : stone.moveTo(x, y)));
      stone.closePath();
      stones[Math.floor(hash2(i * 7 + 3, j * 5 + 1) * shades.length) % shades.length].addPath(stone);
      seams.addPath(stone);
    }
  }
  stones.forEach((path, k) => {
    tg.fillStyle = shades[k];
    tg.fill(path);
  });
  tg.strokeStyle = 'rgba(96, 92, 89, 0.68)';
  tg.lineWidth = 0.55;
  tg.stroke(seams);
  tg.globalCompositeOperation = 'destination-in';
  tg.setTransform(1, 0, 0, 1, 0, 0);
  tg.drawImage(topMask, 0, 0);
  put(topMask, 0);
  put(top, 0);
}

let walled = { key: '', canvas: null };
function wallLayer(ctx, W, H, walls) {
  const { width, height } = ctx.canvas;
  const scale = ctx.getTransform().a || 1;
  const key = `${width}x${height}@${scale}:${walls.map((s) => `${s.pts.length},${s.pts[0][0].toFixed(1)},${s.pts[0][1].toFixed(1)},${s.w}`).join(';')}`;
  if (walled.key !== key) {
    const canvas = walled.canvas && walled.canvas.width === width && walled.canvas.height === height ? walled.canvas : sheet(width, height);
    const g = canvas.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, width, height);
    g.setTransform(scale, 0, 0, scale, 0, 0);
    if (walls.length) paintWalls(g, W, H, walls);
    walled = { key, canvas };
  }
  return walled.canvas;
}

// the wall still under the brush: plain grey stone with its dark rim and front, until it is let go
function wallSketch(ctx, s) {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const [dy, ink, wide] of [[WALL_H, '#1d1c22', s.w + 1.6], [WALL_H, '#403e3c', s.w - 0.6], [WALL_H / 2, '#403e3c', s.w - 0.6], [0, '#1d1c22', s.w + 1.2], [0, '#7a7672', s.w - 1]]) {
    ctx.strokeStyle = ink;
    ctx.lineWidth = wide;
    ctx.beginPath();
    ctx.moveTo(s.pts[0][0], s.pts[0][1] + dy);
    ctx.lineTo(s.pts[0][0] + 0.01, s.pts[0][1] + dy);
    for (let i = 1; i < s.pts.length; i++) ctx.lineTo(s.pts[i][0], s.pts[i][1] + dy);
    ctx.stroke();
  }
}

// `live` is the stroke still being painted, if any; `water` the water layer, for the ice that lies over it
export function renderGround(ctx, W, H, strokes, live, water) {
  const keep = ctx.getTransform();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  const frozen = strokes.filter((s) => s.kind === 'ice');
  if (frozen.length) {
    const layers = iceLayers(ctx.canvas.width, ctx.canvas.height, keep.a, frozen);
    ctx.drawImage(layers.edge, 0, 0);
    ctx.drawImage(composeIce(layers, water), 0, 0);
  } else ice = null;
  const settled = strokes.filter((s) => s.kind === 'wall' && s !== live);
  ctx.setTransform(keep);
  if (settled.length) {
    const layer = wallLayer(ctx, W, H, settled);
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(layer, 0, 0);
    ctx.setTransform(keep);
  }
  if (live && live.kind === 'wall') wallSketch(ctx, live);
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

// A wizard tower in a few rugged shapes, after its sketch: a small battered roof with a bent point, a crooked stone
// shaft with jutting and loose stones, one barred window, a door in a plain stone arch and a rough-hewn step.
// Origin: the middle of the ground.
const TW = {
  tile: ['#8077b8', '#7067a8', '#605896', '#8e85c4'],
  tileDark: '#4c4480',
  stone: '#ccc4b0',
  stoneLite: '#dbd4c1',
  stoneShade: '#a39a86',
  base: '#b1aea8',
  baseShade: '#908d87',
  wood: '#82562f',
  woodDark: '#5c3b22',
  ink: '#242129',
};

// its outline: finer and softer than a unit's, to sit with the trees and barrels
function twInk(g, lw) {
  ink(g, lw * 0.77);
  g.strokeStyle = TW.ink;
}

// one flat-sided piece, outlined
function slab(g, pts, fill, lw = 1.7) {
  g.beginPath();
  pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
  g.closePath();
  g.fillStyle = fill;
  g.fill();
  if (!lw) return;
  twInk(g, lw);
  g.stroke();
}

function crease(g, pts, col = 'rgba(55, 44, 30, 0.4)', lw = 0.9) {
  g.strokeStyle = col;
  g.lineWidth = lw * 0.74;
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
  twInk(g, 1.9);
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
  twInk(g, 1.5);
  g.stroke();
  crease(g, [[x - w * 0.18, y - h * 0.28], [x - w * 0.18, y + h * 0.4]], 'rgba(60, 30, 6, 0.55)', 0.8);
}

function drawTower(g) {
  g.save();
  g.translate(3, 0);
  shadowEll(g, 38, 9, 2);
  g.restore();

  // ---- the step: a rough-hewn round of stone, its edge uneven
  slab(g, [[-28.5, -11], [-22, -6.5], [-7, -4], [8, -5.5], [20, -5], [28.5, -11], [28, -1], [20, 6], [9, 5.5], [5, 8.5], [-9, 7.5], [-22, 4.5], [-28, 0]], across(g, -29, 29, '#b2afa8', '#7d7a75'), 2.3);
  slab(g, [[-28.5, -11], [-19, -17], [-4, -18], [9, -19.5], [22, -16], [28.5, -11], [20, -5], [8, -5.5], [-7, -4], [-22, -6.5]], '#c2bfb8', 2.3);
  crease(g, [[-7, -4], [-8.5, 1], [-6.5, 3.5]], TW.ink, 1.5);

  // ---- the stone shaft: crooked, with stones jutting out of its sides
  slab(g, [[-18, -14], [-15.8, -52], [-14.8, -62], [-17.6, -64], [-17.1, -73], [-14.6, -74.5], [-15.5, -93], [15, -93], [15.6, -46], [18.5, -44], [18.5, -35], [16.6, -33], [18, -14]],
    across(g, -19, 19, TW.stoneLite, TW.stoneShade), 2.4);
  // a loose stone or two in the wall
  for (const [x, y, w] of [[5, -85, 8], [-13, -50, 8.5]]) {
    slab(g, [[x, y], [x + w, y - 0.8], [x + w - 0.7, y + 4.2], [x + 0.5, y + 4.8]], 'rgba(255, 250, 235, 0.25)', 0);
    crease(g, [[x, y], [x + w, y - 0.8], [x + w - 0.7, y + 4.2], [x + 0.5, y + 4.8], [x, y]], 'rgba(55, 44, 30, 0.6)', 1.2);
  }

  // ---- the window and its stone sill
  pointed(g, 0, -68, 11, 16);
  slab(g, [[-8, -60.5], [7.5, -61], [6.8, -57], [-7.2, -56.6]], '#ded9cc', 1.8);

  // ---- the door in a plain stone arch
  const arch = (half, top, spring) => {
    g.beginPath();
    g.moveTo(-half, -11);
    g.lineTo(-half, spring);
    g.bezierCurveTo(-half, top, half, top, half, spring);
    g.lineTo(half, -11);
    g.closePath();
  };
  arch(12.5, -45, -28);
  g.fillStyle = '#ded9cc';
  g.fill();
  twInk(g, 2.3);
  g.stroke();
  arch(8, -37, -26);
  g.fillStyle = across(g, -8, 8, TW.wood, TW.woodDark);
  g.fill();
  twInk(g, 2);
  g.stroke();
  g.beginPath();
  g.arc(4.4, -21, 2.1, 0, TAU);
  g.fillStyle = '#d9b257';
  g.fill();
  twInk(g, 1.3);
  g.stroke();

  // ---- a small, battered roof: a bent, notched point over a knobbly ledge and a ragged edge of three tiles
  slab(g, [[-33, -105], [-20, -116], [-21.5, -119], [1, -139], [3, -112], [-11, -111]], TW.tile[0], 2.4);
  slab(g, [[1, -139], [14, -152], [9.5, -139.5], [14, -129], [11, -127.5], [24, -117], [34, -103], [13, -112], [3, -112]], TW.tile[2], 2.4);
  drawTowerEave(g);
}

// The ledge and the ragged edge of the roof. Part of the tower, and drawn once more in front of whoever is up there.
function drawTowerEave(g) {
  slab(g, [[-20.5, -98], [20, -99], [18.5, -91], [14, -88.5], [-14, -89], [-19, -91.5]], TW.stone, 2.3);
  slab(g, [[-33, -105], [-11, -111], [-9.5, -94], [-20, -92], [-24, -95.5], [-30, -91.5]], TW.tile[1], 2.5);
  slab(g, [[-11, -111], [13, -112], [14.5, -96.5], [3.5, -93.5], [-9.5, -94]], TW.tile[0], 2.5);
  slab(g, [[13, -112], [34, -103], [32, -90], [22, -94], [14.5, -96.5]], TW.tileDark, 2.5);
  // one split in a tile
  crease(g, [[5, -111], [7.5, -106], [5.5, -103]], 'rgba(38, 30, 70, 0.6)', 1.5);
}

// The opening broken into the roof, that a wizard looks out of: dark inside, its edge jagged.
function drawTowerHole(g) {
  slab(g, [[-18, -111], [-19.5, -119], [-15, -121], [-16, -128], [-9, -130], [-6, -137], [0, -133.5], [6, -138], [10, -131], [16, -129], [14.5, -122], [20, -119], [18, -111]], '#231c4c', 2.2);

}

// The living part of it, drawn over every frame: lamplight breathing in its window. Same coordinates as drawTower.
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
  glow(0, -68, 13, 0.16 + 0.2 * breathe);
}

// a flat one-colour copy of a layer, for flashing it
function tinted(layer, colour) {
  const g = layer.canvas.getContext('2d');
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.globalCompositeOperation = 'source-in';
  g.fillStyle = colour;
  g.fillRect(0, 0, layer.canvas.width, layer.canvas.height);
  g.restore();
  return layer;
}

export function buildTerrainArt() {
  return {
    mine: makeLayer(-34, -26, 40, 22, (g) => drawMine(g, false)),
    mineLit: makeLayer(-34, -26, 40, 22, (g) => drawMine(g, true)),
    barrel: makeLayer(-30, -62, 36, 10, (g) => drawBarrel(g, false)),
    barrelHot: makeLayer(-30, -62, 36, 10, (g) => drawBarrel(g, true)),
    tree: makeLayer(-48, -128, 48, 10, drawTree),
    tower: makeLayer(-54, -172, 54, 20, drawTower),
    towerHole: makeLayer(-54, -172, 54, 20, drawTowerHole),
    towerEave: makeLayer(-54, -172, 54, 20, drawTowerEave),
    towerFlash: tinted(makeLayer(-54, -172, 54, 20, drawTower), '#dce6ff'),
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
    g.scale(0.29, 0.29);
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
