import { TEAMS, TAU } from './config.js';
import { World } from './world.js';
import { buildSprites, stampCorpse, ANCHOR, BOX } from './sprites.js';

const wrap = document.getElementById('stage-wrap');
const groundCanvas = document.getElementById('ground');
const stageCanvas = document.getElementById('stage');
const gctx = groundCanvas.getContext('2d');
const ctx = stageCanvas.getContext('2d');
const hint = document.getElementById('hint');
const banner = document.getElementById('banner');
const midline = document.getElementById('midline');
const toolbar = document.getElementById('toolbar');
const teamGroup = document.getElementById('team-group');
const countRed = document.getElementById('count-red');
const countBlue = document.getElementById('count-blue');
const brushInput = document.getElementById('brush');
const startBtn = document.getElementById('start');
const clearBtn = document.getElementById('clear');
const modeButtons = [...document.querySelectorAll('[data-mode]')];
const teamButtons = [...document.querySelectorAll('[data-team]')];

const sprites = buildSprites();
const world = new World();

let W = 1;
let H = 1;
let dpr = 1;
let brush = Number(brushInput.value);
let paintTeam = 'red';
let over = false;
const ptr = { x: 0, y: 0, inside: false, down: false };

world.onDeath = (u) => stampCorpse(gctx, sprites, u.team, u.x, u.y);

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

new ResizeObserver(() => {
  document.documentElement.style.setProperty('--bar-h', `${toolbar.offsetHeight}px`);
  resize();
}).observe(toolbar);
new ResizeObserver(resize).observe(wrap);
window.addEventListener('resize', resize);

// ---------- Painting ----------
function canPaint() {
  return !(world.mode === 'team' && world.started);
}

function teamAt(x) {
  return world.mode === 'team' ? (x < W / 2 ? 'red' : 'blue') : paintTeam;
}

function dab(x, y) {
  const n = Math.min(6, Math.max(1, Math.round(brush / 18)));
  const team = teamAt(x);
  const half = W / 2;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * brush;
    let px = Math.min(W - 12, Math.max(12, x + Math.cos(a) * r));
    const py = Math.min(H - 20, Math.max(24, y + Math.sin(a) * r));
    if (world.mode === 'team') px = team === 'red' ? Math.min(px, half - 10) : Math.max(px, half + 10);
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

stageCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  setBrush(brush - Math.sign(e.deltaY) * 4);
}, { passive: false });

function setBrush(v) {
  brush = Math.min(Number(brushInput.max), Math.max(Number(brushInput.min), v));
  brushInput.value = String(brush);
}
brushInput.addEventListener('input', () => setBrush(Number(brushInput.value)));

// ---------- Controls ----------
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

function setMode(mode) {
  if (mode === world.mode) return;
  world.mode = mode;
  for (const b of modeButtons) b.setAttribute('aria-pressed', String(b.dataset.mode === mode));
  teamGroup.hidden = mode === 'team';
  startBtn.hidden = mode !== 'team';
  midline.hidden = mode !== 'team';
  reset();
}

for (const b of modeButtons) b.addEventListener('click', () => setMode(b.dataset.mode));
for (const b of teamButtons) {
  b.addEventListener('click', () => {
    paintTeam = b.dataset.team;
    for (const o of teamButtons) o.setAttribute('aria-pressed', String(o === b));
  });
}
startBtn.addEventListener('click', () => {
  if (world.counts.red > 0 && world.counts.blue > 0) {
    world.started = true;
    hint.hidden = true;
  }
});
clearBtn.addEventListener('click', reset);

function syncUi() {
  countRed.textContent = String(world.counts.red);
  countBlue.textContent = String(world.counts.blue);
  if (world.mode === 'team') {
    startBtn.disabled = world.started || !(world.counts.red > 0 && world.counts.blue > 0);
    startBtn.textContent = over ? 'Done' : world.started ? 'Fighting…' : 'Start';
    if (world.started && !over && (world.counts.red === 0 || world.counts.blue === 0)) {
      over = true;
      const winner = world.counts.red > 0 ? 'red' : world.counts.blue > 0 ? 'blue' : null;
      banner.className = `banner ${winner || ''}`;
      banner.textContent = winner ? `${TEAMS[winner].label} wins!` : 'Draw!';
      banner.hidden = false;
    }
  }
}

// ---------- Render ----------
function drawBrushRing() {
  if (!ptr.inside) return;
  const team = teamAt(ptr.x);
  ctx.strokeStyle = canPaint() ? TEAMS[team].fill : 'rgba(35, 32, 28, 0.3)';
  ctx.lineWidth = 2;
  ctx.setLineDash([6, 5]);
  ctx.beginPath();
  ctx.arc(ptr.x, ptr.y, brush, 0, TAU);
  ctx.stroke();
  ctx.setLineDash([]);
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const units = world.units;
  units.sort((a, b) => a.y - b.y);
  for (const u of units) {
    const set = sprites[u.team];
    const frame = u.anim | 0;
    const firing = u.flash > 0;
    const img = u.moving
      ? (firing ? set.walkFire : set.walk)[frame & 3]
      : (firing ? set.standFire : set.stand);
    const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
    ctx.setTransform(u.facing * dpr, 0, 0, dpr, (u.x + wobble) * dpr, (u.y + 14) * dpr);
    ctx.drawImage(img, -ANCHOR.x, -ANCHOR.y, BOX.w, BOX.h);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';
  ctx.lineWidth = 1.8;
  for (const team of ['red', 'blue']) {
    ctx.strokeStyle = TEAMS[team].dark;
    ctx.beginPath();
    for (const b of world.bullets) {
      if (b.team !== team) continue;
      ctx.moveTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
      ctx.lineTo(b.x, b.y);
    }
    ctx.stroke();
  }

  ctx.fillStyle = '#23201c';
  for (const s of world.sparks) {
    ctx.globalAlpha = Math.max(0, s.life / s.max);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.5, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  for (const u of units) {
    if (u.hp >= 100) continue;
    const bw = 14;
    const bx = u.x - bw / 2;
    const by = u.y - 26;
    ctx.fillStyle = 'rgba(35, 32, 28, 0.35)';
    ctx.fillRect(bx, by, bw, 3);
    ctx.fillStyle = u.hp > 40 ? '#5f9f45' : '#e0573f';
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
  acc += dt;

  if (ptr.down && ptr.inside && canPaint()) {
    timeAcc += dt;
    while (timeAcc > 0.18) {
      timeAcc -= 0.18;
      dab(ptr.x, ptr.y);
    }
  }

  let steps = 0;
  while (acc >= STEP && steps < 4) {
    world.update(STEP);
    acc -= STEP;
    steps++;
  }
  if (steps === 4) acc = 0;

  syncUi();
  render();
  requestAnimationFrame(frame);
}

document.documentElement.style.setProperty('--bar-h', `${toolbar.offsetHeight}px`);
resize();
requestAnimationFrame(frame);
