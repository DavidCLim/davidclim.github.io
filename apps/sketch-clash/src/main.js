import { TEAMS, TAU } from './config.js?v=2';
import { World } from './world.js?v=2';
import { buildSprites, stampCorpse, ANCHOR, BOX, SCALE, FEET } from './sprites.js?v=2';

const $ = (id) => document.getElementById(id);
const wrap = $('stage-wrap');
const groundCanvas = $('ground');
const stageCanvas = $('stage');
const gctx = groundCanvas.getContext('2d');
const ctx = stageCanvas.getContext('2d');
const hint = $('hint');
const banner = $('banner');
const midline = $('midline');
const countsBox = $('counts');
const countRed = $('count-red');
const countBlue = $('count-blue');
const brushInput = $('brush');
const brushBtn = $('brush-btn');
const brushPop = $('brush-pop');
const clearBtn = $('clear');
const pauseBtn = $('pause');
const teamToggle = $('team-toggle');
const startBtn = $('start');

const sprites = buildSprites();
const world = new World();

let W = 1;
let H = 1;
let dpr = 1;
let brush = Number(brushInput.value);
let paused = false;
let over = false;
const ptr = { x: 0, y: 0, inside: false, down: false };

world.onDeath = (u) => stampCorpse(gctx, sprites, u.x, u.y);

// The palette icon is the same soldier art as on the field.
(function drawPaletteIcon() {
  const c = $('soldier-icon');
  const g = c.getContext('2d');
  const sx = (ANCHOR.x - 14) * SCALE;
  const sy = (ANCHOR.y - 26) * SCALE;
  const sw = 40 * SCALE;
  const sh = 29 * SCALE;
  g.drawImage(sprites.stand, sx, sy, sw, sh, 0, 0, c.width, c.height);
})();

// ---------- Layout ----------
function resize() {
  const r = wrap.getBoundingClientRect();
  const w = Math.max(1, Math.floor(r.width));
  const h = Math.max(1, Math.floor(r.height));
  const ratio = Math.min(window.devicePixelRatio || 1, 2);
  if (w === W && h === H && ratio === dpr) return;

  const old = document.createElement('canvas');
  old.width = groundCanvas.width;
  old.height = groundCanvas.height;
  if (old.width && old.height) old.getContext('2d').drawImage(groundCanvas, 0, 0);

  W = w;
  H = h;
  dpr = ratio;
  for (const c of [groundCanvas, stageCanvas]) {
    c.width = Math.floor(w * dpr);
    c.height = Math.floor(h * dpr);
  }
  gctx.drawImage(old, 0, 0);
  gctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  world.resize(w, h);
}
new ResizeObserver(resize).observe(wrap);
window.addEventListener('resize', resize);

// ---------- Painting ----------
function canPaint() {
  return !(world.mode === 'team' && world.started);
}

// Team battle: red owns the left half, blue the right.
function teamAt(x) {
  return world.mode === 'team' ? (x < W / 2 ? 'red' : 'blue') : null;
}

function dab(x, y) {
  const n = Math.min(6, Math.max(1, Math.round(brush / 18)));
  const team = teamAt(x);
  const half = W / 2;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * brush;
    let px = Math.min(W - 16, Math.max(16, x + Math.cos(a) * r));
    const py = Math.min(H - 26, Math.max(26, y + Math.sin(a) * r));
    if (team) px = team === 'red' ? Math.min(px, half - 12) : Math.max(px, half + 12);
    world.addSoldier(team, px, py);
  }
  hint.hidden = true;
}

let distAcc = 0;
let timeAcc = 0;
let lastPaint = null;

function setPointer(e) {
  const r = wrap.getBoundingClientRect();
  ptr.x = e.clientX - r.left;
  ptr.y = e.clientY - r.top;
}

// Drops a dab every `step` pixels of travel, carrying the leftover
// distance across pointer events so spacing stays even.
function paintSegment(x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  if (!dist) return;
  const step = Math.max(8, brush * 0.5);
  let pos = step - distAcc;
  while (pos <= dist) {
    const t = pos / dist;
    dab(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t);
    pos += step;
  }
  distAcc = dist - (pos - step);
}

stageCanvas.addEventListener('pointerdown', (e) => {
  setPointer(e);
  ptr.inside = true;
  ptr.down = true;
  closeBrushPop();
  try {
    stageCanvas.setPointerCapture(e.pointerId);
  } catch {
    // capture is only a convenience; painting still works without it
  }
  distAcc = 0;
  timeAcc = 0;
  lastPaint = { x: ptr.x, y: ptr.y };
  if (canPaint()) dab(ptr.x, ptr.y);
});

stageCanvas.addEventListener('pointermove', (e) => {
  setPointer(e);
  ptr.inside = true;
  if (ptr.down && canPaint() && lastPaint) {
    paintSegment(lastPaint.x, lastPaint.y, ptr.x, ptr.y);
    lastPaint = { x: ptr.x, y: ptr.y };
  }
});

function endPaint(e) {
  ptr.down = false;
  if (e.pointerType !== 'mouse') ptr.inside = false;
}
stageCanvas.addEventListener('pointerup', endPaint);
stageCanvas.addEventListener('pointercancel', endPaint);
stageCanvas.addEventListener('pointerleave', () => {
  if (!ptr.down) ptr.inside = false;
});

function setBrush(v) {
  brush = Math.min(Number(brushInput.max), Math.max(Number(brushInput.min), v));
  brushInput.value = String(brush);
}
stageCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  setBrush(brush - Math.sign(e.deltaY) * 4);
}, { passive: false });
brushInput.addEventListener('input', () => setBrush(Number(brushInput.value)));

// ---------- Controls ----------
function closeBrushPop() {
  brushPop.hidden = true;
  brushBtn.setAttribute('aria-expanded', 'false');
}
brushBtn.addEventListener('click', () => {
  const open = brushPop.hidden;
  brushPop.hidden = !open;
  brushBtn.setAttribute('aria-expanded', String(open));
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeBrushPop();
});

function reset() {
  world.clear();
  gctx.save();
  gctx.setTransform(1, 0, 0, 1, 0, 0);
  gctx.clearRect(0, 0, groundCanvas.width, groundCanvas.height);
  gctx.restore();
  over = false;
  banner.hidden = true;
  hint.hidden = false;
}
clearBtn.addEventListener('click', reset);

const PAUSE_ICON = '<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>';
const PLAY_ICON = '<path d="M8 5v14l11-7z"/>';
pauseBtn.addEventListener('click', () => {
  paused = !paused;
  $('pause-icon').innerHTML = paused ? PLAY_ICON : PAUSE_ICON;
  pauseBtn.setAttribute('aria-label', paused ? 'Resume' : 'Pause');
  pauseBtn.title = paused ? 'Resume' : 'Pause';
});

function setMode(mode) {
  if (mode === world.mode) return;
  world.mode = mode;
  const team = mode === 'team';
  teamToggle.checked = team;
  startBtn.hidden = !team;
  midline.hidden = !team;
  countsBox.hidden = !team;
  reset();
}
teamToggle.addEventListener('change', () => setMode(teamToggle.checked ? 'team' : 'free'));

startBtn.addEventListener('click', () => {
  if ((world.counts.red || 0) > 0 && (world.counts.blue || 0) > 0) {
    world.started = true;
    hint.hidden = true;
  }
});

function syncUi() {
  if (world.mode !== 'team') return;
  const red = world.counts.red || 0;
  const blue = world.counts.blue || 0;
  countRed.textContent = String(red);
  countBlue.textContent = String(blue);
  startBtn.disabled = world.started || !(red > 0 && blue > 0);
  startBtn.textContent = over ? 'Done' : world.started ? 'Fighting…' : 'Start';
  if (world.started && !over && (red === 0 || blue === 0)) {
    over = true;
    const winner = red > 0 ? 'red' : blue > 0 ? 'blue' : null;
    banner.className = `banner ${winner || ''}`;
    banner.textContent = winner ? `${TEAMS[winner].label} wins!` : 'Draw!';
    banner.hidden = false;
  }
}

// ---------- Render ----------
function drawBrushRing() {
  if (!ptr.inside) return;
  const team = teamAt(ptr.x);
  const rgb = team === 'red' ? '229, 72, 77' : '70, 110, 225';
  ctx.fillStyle = `rgba(${rgb}, 0.1)`;
  ctx.strokeStyle = canPaint() ? `rgba(${rgb}, 0.65)` : 'rgba(35, 38, 47, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ptr.x, ptr.y, brush, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const units = world.units;
  units.sort((a, b) => a.y - b.y);
  for (const u of units) {
    const feetY = u.y + FEET;
    if (u.team) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.drawImage(sprites.ring[u.team], u.x - 15, feetY - 5.5, 30, 12);
    }
    const frame = u.anim | 0;
    const firing = u.flash > 0;
    const img = u.moving
      ? (firing ? sprites.walkFire : sprites.walk)[frame & 3]
      : (firing ? sprites.standFire : sprites.stand);
    const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
    ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, feetY * dpr);
    ctx.drawImage(img, -ANCHOR.x, -ANCHOR.y, BOX.w, BOX.h);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#3a3a44';
  ctx.beginPath();
  for (const b of world.bullets) {
    ctx.moveTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();

  ctx.fillStyle = '#23262f';
  for (const s of world.sparks) {
    ctx.globalAlpha = Math.max(0, s.life / s.max);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.5, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const u of units) {
    if (u.hp >= 100) continue;
    const bw = 16;
    const bx = u.x - bw / 2;
    const by = u.y - 20;
    ctx.fillStyle = 'rgba(35, 38, 47, 0.25)';
    ctx.fillRect(bx, by, bw, 3);
    ctx.fillStyle = u.hp > 40 ? '#4caf50' : '#e5484d';
    ctx.fillRect(bx, by, (bw * Math.max(0, u.hp)) / 100, 3);
  }

  drawBrushRing();
}

// ---------- Loop ----------
const STEP = 1 / 60;
let last = performance.now();
let acc = 0;
function frame(now) {
  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.1) dt = 0.1;

  if (ptr.down && ptr.inside && canPaint()) {
    timeAcc += dt;
    while (timeAcc > 0.18) {
      timeAcc -= 0.18;
      dab(ptr.x, ptr.y);
    }
  }

  if (!paused) {
    acc += dt;
    let steps = 0;
    while (acc >= STEP && steps < 4) {
      world.update(STEP);
      acc -= STEP;
      steps++;
    }
    if (steps === 4) acc = 0;
  }

  syncUi();
  render();
  requestAnimationFrame(frame);
}

resize();
requestAnimationFrame(frame);
