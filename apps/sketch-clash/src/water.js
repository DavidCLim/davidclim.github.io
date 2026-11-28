// The water, as measured on screen in the original: a pale rim all round it, darker deep water further in than the rim
// is wide, a thin line at the shore and another where it drops off, and two long soft waves of light and shade drifting
// across the lot, nearly at right angles. It has a canvas of its own under the rest of the ground, so that it can move
// without anything else being painted again.
import { bankDiscs, fillDiscs } from './terrain.js?v=266';

const SHORE = 0.62; // the width of the lines, in world units
const SHORE_INK = 'rgb(108, 166, 186)';
const DROP_INK = 'rgb(110, 176, 201)';
const DEEP_AT = 13.4; // how far in from the shore the deep water starts: just more than half a single stroke
const DEEP_MUL = 'rgb(168, 209, 253)'; // deep water is the rim's colour multiplied by this
const CELL = 1.6; // world units to a square of the grid the depth is worked out on
const SAMPLE = 5; // and to a point of the moving colour
const EVERY = 50; // ms between pictures of it moving
const REDEPTH = 110; // ms between working the depth out again while it is being painted

// rim colour = base + the first wave x a + the second x b, for red, green and blue
const BASE = [151.1, 218.9, 226];
const AMP_1 = [3.54, 5.43, 5.63];
const AMP_2 = [4.95, 7.59, 7.86];
// each wave: how its crests lie (radians a world unit) and how fast they travel (radians a second)
const WAVE_1 = { kx: 0.0589, ky: -0.107, w: 0.7 };
const WAVE_2 = { kx: 0.0749, ky: 0.0482, w: 0.9 };

const sheet = (w, h) => {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return c;
};

export class WaterLayer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.scale = 1;
    this.w = 1;
    this.h = 1;
    this.painted = new Map(); // stroke -> how many of its points are in
    this.version = -1;
    this.stamp = 0; // goes up every time the shape of the water changes
    this.stale = false;
    this.depthAt = 0;
    this.drawnAt = 0;
    this.shown = false;
  }

  // w, h: the field in world units; scale: device pixels to a unit
  resize(w, h, scale) {
    this.w = w;
    this.h = h;
    this.scale = scale;
    const pw = this.canvas.width;
    const ph = this.canvas.height;
    this.mask = sheet(pw, ph); // the shape of all the water
    this.grown = sheet(pw, ph); // the same, fatter by the shore line
    this.lines = sheet(pw, ph);
    this.deep = sheet(pw, ph);
    this.gw = Math.ceil(w / CELL) + 3;
    this.gh = Math.ceil(h / CELL) + 3;
    this.reset();
    this.version = -1;
  }

  reset() {
    this.painted.clear();
    this.box = null;
    this.inside = new Uint8Array(this.gw * this.gh);
    for (const c of [this.mask, this.grown, this.lines, this.deep]) c.getContext('2d').clearRect(0, 0, c.width, c.height);
    this.stale = true;
    this.depthAt = 0;
  }

  // takes in whatever has been painted (or rubbed out) since last time
  gather(terrain) {
    if (terrain.version === this.version) return;
    this.version = terrain.version;
    const list = terrain.strokes.filter((s) => s.kind === 'water');
    const have = new Set(list);
    for (const s of this.painted.keys()) {
      if (!have.has(s)) {
        this.reset();
        this.stamp++;
        break;
      }
    }
    for (const s of list) {
      const from = this.painted.get(s) || 0;
      if (from >= s.pts.length) continue;
      this.painted.set(s, s.pts.length);
      this.add(bankDiscs(s, from));
    }
  }

  add(discs) {
    for (const [c, grow, ink] of [[this.mask, 0, '#000'], [this.grown, SHORE, SHORE_INK]]) {
      const g = c.getContext('2d');
      g.setTransform(this.scale, 0, 0, this.scale, 0, 0);
      g.fillStyle = ink;
      fillDiscs(g, discs, grow);
    }
    const { gw, gh, inside } = this;
    for (const [x, y, r] of discs) {
      const b = this.box || (this.box = [x, y, x, y]);
      b[0] = Math.min(b[0], x - r - 3);
      b[1] = Math.min(b[1], y - r - 3);
      b[2] = Math.max(b[2], x + r + 3);
      b[3] = Math.max(b[3], y + r + 3);
      // grid point (i, j) stands for the world point ((i - 1) * CELL, (j - 1) * CELL)
      const j1 = Math.min(gh - 2, Math.floor((y + r) / CELL) + 1);
      for (let j = Math.max(1, Math.ceil((y - r) / CELL) + 1); j <= j1; j++) {
        const dy = (j - 1) * CELL - y;
        const half = Math.sqrt(Math.max(0, r * r - dy * dy));
        const i0 = Math.max(1, Math.ceil((x - half) / CELL) + 1);
        const i1 = Math.min(gw - 2, Math.floor((x + half) / CELL) + 1);
        if (i1 >= i0) inside.fill(1, j * gw + i0, j * gw + i1 + 1);
      }
    }
    this.stale = true;
    this.stamp++;
  }

  // the part of the canvases the water is in, in device pixels
  pixelBox() {
    const [x0, y0, x1, y1] = this.box;
    const k = this.scale;
    const px = Math.max(0, Math.floor(x0 * k));
    const py = Math.max(0, Math.floor(y0 * k));
    return [px, py, Math.max(1, Math.min(this.canvas.width, Math.ceil(x1 * k)) - px), Math.max(1, Math.min(this.canvas.height, Math.ceil(y1 * k)) - py)];
  }

  // the shore line, and the deep water: everywhere further than DEEP_AT from any bank
  redepth() {
    this.stale = false;
    const lg = this.lines.getContext('2d');
    const dg = this.deep.getContext('2d');
    for (const g of [lg, dg]) {
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, g.canvas.width, g.canvas.height);
    }
    if (!this.box) return;
    const [px, py, pw, ph] = this.pixelBox();
    lg.drawImage(this.grown, px, py, pw, ph, px, py, pw, ph);
    lg.globalCompositeOperation = 'destination-out';
    lg.drawImage(this.mask, px, py, pw, ph, px, py, pw, ph);
    lg.globalCompositeOperation = 'source-over';

    // how far each point of the grid is from dry land, over just the box the water is in
    const { gw, gh } = this;
    const i0 = Math.max(0, Math.floor(this.box[0] / CELL));
    const j0 = Math.max(0, Math.floor(this.box[1] / CELL));
    const W = Math.min(gw - 1, Math.ceil(this.box[2] / CELL) + 2) - i0 + 1;
    const H = Math.min(gh - 1, Math.ceil(this.box[3] / CELL) + 2) - j0 + 1;
    if (W < 4 || H < 4) return;
    const far = new Float32Array(W * H);
    let any = false;
    for (let j = 2; j < H - 2; j++) {
      for (let i = 2; i < W - 2; i++) if (this.inside[(j + j0) * gw + i + i0]) far[j * W + i] = 1e4;
    }
    const steps = [[-1, 0, 1], [0, -1, 1], [-1, -1, 1.414], [1, -1, 1.414], [-2, -1, 2.236], [2, -1, 2.236], [-1, -2, 2.236], [1, -2, 2.236]];
    const offs = steps.map(([dx, dy, d]) => [dy * W + dx, d]);
    for (const dir of [1, -1]) {
      for (let n = 0; n < (H - 4) * (W - 4); n++) {
        const m = dir > 0 ? n : (H - 4) * (W - 4) - 1 - n;
        const at = (2 + ((m / (W - 4)) | 0)) * W + 2 + (m % (W - 4));
        let v = far[at];
        if (v === 0) continue;
        for (let k = 0; k < 8; k++) {
          const c = far[at + offs[k][0] * dir] + offs[k][1];
          if (c < v) v = c;
        }
        far[at] = v;
      }
    }
    const level = new Float32Array(W * H);
    const cut = DEEP_AT / CELL + 0.5;
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) {
        const at = j * W + i;
        if (i < 1 || j < 1 || i > W - 2 || j > H - 2) {
          level[at] = -cut;
          continue;
        }
        // (smoothed a little, so the line doesn't follow the squares of the grid)
        const v = (far[at] * 4 + (far[at - 1] + far[at + 1] + far[at - W] + far[at + W]) * 2 + far[at - W - 1] + far[at - W + 1] + far[at + W - 1] + far[at + W + 1]) / 16;
        level[at] = v - cut;
        if (v > cut) any = true;
      }
    }
    if (!any) return;

    // trace round the deep water: where a side of a square crosses the line there is a point, joined to two others
    const links = new Map();
    const spots = new Map();
    const spot = (key, a, b, ax, ay, bx, by) => {
      if (spots.has(key)) return key;
      const t = a / (a - b);
      spots.set(key, [(ax + (bx - ax) * t + i0 - 1) * CELL, (ay + (by - ay) * t + j0 - 1) * CELL]);
      links.set(key, []);
      return key;
    };
    const join = (a, b) => {
      links.get(a).push(b);
      links.get(b).push(a);
    };
    for (let j = 0; j < H - 1; j++) {
      for (let i = 0; i < W - 1; i++) {
        const at = j * W + i;
        const a = level[at];
        const b = level[at + 1];
        const c = level[at + W + 1];
        const d = level[at + W];
        const sides = [];
        if (a > 0 !== b > 0) sides.push(spot(at * 2, a, b, i, j, i + 1, j));
        if (b > 0 !== c > 0) sides.push(spot((at + 1) * 2 + 1, b, c, i + 1, j, i + 1, j + 1));
        if (d > 0 !== c > 0) sides.push(spot((at + W) * 2, d, c, i, j + 1, i + 1, j + 1));
        if (a > 0 !== d > 0) sides.push(spot(at * 2 + 1, a, d, i, j, i, j + 1));
        if (sides.length >= 2) join(sides[0], sides[1]);
        if (sides.length === 4) join(sides[2], sides[3]);
      }
    }
    const path = new Path2D();
    const seen = new Set();
    for (const start of links.keys()) {
      if (seen.has(start)) continue;
      let at = start;
      let from = -1;
      let first = true;
      while (at !== undefined && !seen.has(at)) {
        seen.add(at);
        const [x, y] = spots.get(at);
        if (first) path.moveTo(x, y);
        else path.lineTo(x, y);
        first = false;
        const [p, q] = links.get(at);
        const next = p !== from ? p : q;
        from = at;
        at = next;
      }
      path.closePath();
    }
    dg.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    dg.fillStyle = DEEP_MUL;
    dg.fill(path, 'evenodd');
    lg.setTransform(this.scale, 0, 0, this.scale, 0, 0);
    lg.strokeStyle = DROP_INK;
    lg.lineWidth = SHORE;
    lg.lineJoin = 'round';
    lg.stroke(path);
    lg.setTransform(1, 0, 0, 1, 0, 0);
  }

  // the moving colour, worked out coarsely (the waves are long) and stretched over the water
  waves(t) {
    const [x0, y0, x1, y1] = this.box;
    const nx = Math.ceil((x1 - x0) / SAMPLE) + 1;
    const ny = Math.ceil((y1 - y0) / SAMPLE) + 1;
    if (!this.tint || this.tint.width !== nx || this.tint.height !== ny) {
      this.tint = sheet(nx, ny);
      this.tintData = this.tint.getContext('2d').createImageData(nx, ny);
    }
    const out = this.tintData.data;
    let p = 0;
    for (let j = 0; j < ny; j++) {
      const y = y0 + (j + 0.5) * SAMPLE;
      for (let i = 0; i < nx; i++) {
        const x = x0 + (i + 0.5) * SAMPLE;
        const a = Math.cos(WAVE_1.kx * x + WAVE_1.ky * y + WAVE_1.w * t);
        const b = Math.cos(WAVE_2.kx * x + WAVE_2.ky * y + WAVE_2.w * t);
        out[p] = BASE[0] + AMP_1[0] * a + AMP_2[0] * b + 0.5;
        out[p + 1] = BASE[1] + AMP_1[1] * a + AMP_2[1] * b + 0.5;
        out[p + 2] = BASE[2] + AMP_1[2] * a + AMP_2[2] * b + 0.5;
        out[p + 3] = 255;
        p += 4;
      }
    }
    this.tint.getContext('2d').putImageData(this.tintData, 0, 0);
    return [this.tint, x0, y0, nx * SAMPLE, ny * SAMPLE];
  }

  // call every frame; `painting` while the brush is down
  update(terrain, now, painting) {
    this.gather(terrain);
    const g = this.ctx;
    if (!this.box) {
      if (this.shown) {
        g.setTransform(1, 0, 0, 1, 0, 0);
        g.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.shown = false;
        this.stale = false;
      }
      return;
    }
    const redo = this.stale && (!painting || now - this.depthAt >= REDEPTH);
    if (redo) {
      this.redepth();
      this.depthAt = now;
    }
    if (!redo && !this.stale && now - this.drawnAt < EVERY) return;
    this.drawnAt = now;
    this.shown = true;
    const [px, py, pw, ph] = this.pixelBox();
    const [tint, x, y, w, h] = this.waves(now / 1000);
    const k = this.scale;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalCompositeOperation = 'source-over';
    g.clearRect(0, 0, this.canvas.width, this.canvas.height);
    g.drawImage(tint, x * k, y * k, w * k, h * k);
    g.globalCompositeOperation = 'destination-in';
    g.drawImage(this.mask, px, py, pw, ph, px, py, pw, ph);
    g.globalCompositeOperation = 'multiply';
    g.drawImage(this.deep, px, py, pw, ph, px, py, pw, ph);
    g.globalCompositeOperation = 'source-over';
    g.drawImage(this.lines, px, py, pw, ph, px, py, pw, ph);
  }
}
