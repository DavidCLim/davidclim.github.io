import { TEAMS, TAU, PIVOT, IDLE_PIVOT, IDLE_AIM, FEET, SPECIES } from './config.js?v=4';
import { World } from './world.js?v=4';
import { buildSprites, drawLayer, paintSoldierIcon, stampHelmet } from './sprites.js?v=4';

const $ = (id) => document.getElementById(id);
const wrap = $('stage-wrap');
const groundCanvas = $('ground');
const stageCanvas = $('stage');
const gctx = groundCanvas.getContext('2d');
const ctx = stageCanvas.getContext('2d');
const banner = $('banner');
const midline = $('midline');
const labelRed = $('label-red');
const labelBlue = $('label-blue');
const legend = $('legend');
const clearBtn = $('clear');
const eraserBtn = $('eraser');
const pauseBtn = $('pause');
const teamToggle = $('team-toggle');
const startBtn = $('start');
const palette = $('palette');

const sprites = buildSprites();
const world = new World();

let W = 1;
let H = 1;
let dpr = 1;
let brush = 22;
let paused = false;
let erasing = false;
let over = false;
const ptr = { x: 0, y: 0, inside: false, down: false };

world.onDeath = (u) => stampHelmet(gctx, u.x, u.y + FEET - 4);

paintSoldierIcon($('soldier-icon'), sprites);

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
  return erasing || !(world.mode === 'team' && world.started);
}

// Team battle: red owns the left half, blue the right.
function teamAt(x) {
  return world.mode === 'team' ? (x < W / 2 ? 'red' : 'blue') : null;
}

function dab(x, y) {
  if (erasing) {
    world.eraseAt(x, y, brush);
    return;
  }
  const n = Math.min(6, Math.max(1, Math.round(brush / 18)));
  const team = teamAt(x);
  const half = W / 2;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * brush;
    let px = Math.min(W - 20, Math.max(20, x + Math.cos(a) * r));
    const py = Math.min(H - 30, Math.max(30, y + Math.sin(a) * r));
    if (team) px = team === 'red' ? Math.min(px, half - 14) : Math.max(px, half + 14);
    world.addSoldier(team, px, py);
  }
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

function setBrush(v) {
  brush = Math.min(90, Math.max(10, v));
}
stageCanvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  setBrush(brush - Math.sign(e.deltaY) * 3);
}, { passive: false });
document.addEventListener('keydown', (e) => {
  if (e.key === '[') setBrush(brush - 4);
  else if (e.key === ']') setBrush(brush + 4);
});

// ---------- Draggable palette ----------
// Press and hold anywhere on the palette and move it around the screen.
// A press that doesn't travel is still a normal click on a tab or unit.
const DRAG_THRESHOLD = 5;
let drag = null;
let dragMoved = false;

palette.addEventListener('pointerdown', (e) => {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  const pr = palette.getBoundingClientRect();
  const wr = wrap.getBoundingClientRect();
  drag = {
    id: e.pointerId,
    sx: e.clientX,
    sy: e.clientY,
    left: pr.left - wr.left,
    top: pr.top - wr.top,
    w: pr.width,
    h: pr.height,
  };
  dragMoved = false;
  // Follow the pointer on the window, so a fast flick that leaves the
  // palette between two events still drags it.
  window.addEventListener('pointermove', onDragMove);
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);
});

function onDragMove(e) {
  if (!drag || e.pointerId !== drag.id) return;
  const dx = e.clientX - drag.sx;
  const dy = e.clientY - drag.sy;
  if (!dragMoved) {
    if (Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    dragMoved = true;
    palette.classList.add('dragging');
  }
  const wr = wrap.getBoundingClientRect();
  const left = Math.min(wr.width - drag.w, Math.max(0, drag.left + dx));
  const top = Math.min(wr.height - drag.h, Math.max(0, drag.top + dy));
  palette.style.transform = 'none';
  palette.style.bottom = 'auto';
  palette.style.left = `${left}px`;
  palette.style.top = `${top}px`;
}

function endDrag(e) {
  if (!drag || e.pointerId !== drag.id) return;
  drag = null;
  palette.classList.remove('dragging');
  window.removeEventListener('pointermove', onDragMove);
  window.removeEventListener('pointerup', endDrag);
  window.removeEventListener('pointercancel', endDrag);
}
// A drag that ends over a button must not also click it.
palette.addEventListener('click', (e) => {
  if (dragMoved) {
    e.stopPropagation();
    e.preventDefault();
    dragMoved = false;
  }
}, true);

// ---------- Controls ----------
function reset() {
  world.clear();
  gctx.save();
  gctx.setTransform(1, 0, 0, 1, 0, 0);
  gctx.clearRect(0, 0, groundCanvas.width, groundCanvas.height);
  gctx.restore();
  over = false;
  banner.hidden = true;
}
clearBtn.addEventListener('click', reset);

eraserBtn.addEventListener('click', () => {
  erasing = !erasing;
  eraserBtn.setAttribute('aria-pressed', String(erasing));
});

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
  midline.hidden = !team;
  labelRed.hidden = !team;
  labelBlue.hidden = !team;
  startBtn.hidden = !team;
  reset();
}
teamToggle.addEventListener('change', () => setMode(teamToggle.checked ? 'team' : 'free'));

startBtn.addEventListener('click', () => {
  if ((world.counts.red || 0) > 0 && (world.counts.blue || 0) > 0) {
    world.started = true;
    startBtn.hidden = true;
  }
});

// Bottom-left legend: how many of each unit are on the field.
const legendRows = new Map();
function syncLegend() {
  const present = Object.entries(world.speciesCounts).filter(([, n]) => n > 0);
  legend.hidden = present.length === 0;
  for (const [id, n] of present) {
    let row = legendRows.get(id);
    if (!row) {
      const icon = document.createElement('canvas');
      icon.width = 104;
      icon.height = 76;
      paintSoldierIcon(icon, sprites);
      const count = document.createElement('b');
      const label = document.createElement('span');
      label.textContent = SPECIES[id].label;
      const el = document.createElement('div');
      el.className = 'legend-row';
      el.append(icon, count, label);
      legend.append(el);
      row = { el, count, last: -1 };
      legendRows.set(id, row);
    }
    if (row.last !== n) {
      row.count.textContent = String(n);
      row.last = n;
    }
  }
  for (const [id, row] of legendRows) {
    row.el.hidden = !(world.speciesCounts[id] > 0);
  }
}

// A thick dark outline plus a hard drop shadow, built from shadow copies
// of the glyphs so it works in every browser (em units: scales with size).
function outlineShadow(color, r, dx, dy, n = 20) {
  const parts = [];
  for (const [ox, oy] of [[0, 0], [dx, dy]]) {
    for (let i = 0; i < n; i++) {
      const a = (i / n) * TAU;
      parts.push(`${(ox + Math.cos(a) * r).toFixed(3)}em ${(oy + Math.sin(a) * r).toFixed(3)}em 0 ${color}`);
    }
  }
  return parts.join(',');
}
banner.style.textShadow = outlineShadow('#1f1c24', 0.075, 0.05, 0.09);

function syncUi() {
  syncLegend();
  if (world.mode !== 'team') return;
  const red = world.counts.red || 0;
  const blue = world.counts.blue || 0;
  startBtn.disabled = !(red > 0 && blue > 0);
  if (world.started && !over && (red === 0 || blue === 0)) {
    over = true;
    const winner = red > 0 ? 'red' : blue > 0 ? 'blue' : null;
    banner.className = `banner ${winner || ''}`;
    banner.textContent = winner ? `${TEAMS[winner].label} team wins!` : 'Draw!';
    banner.hidden = false;
  }
}

// ---------- Render ----------
function drawBrushRing() {
  if (!ptr.inside) return;
  const team = teamAt(ptr.x);
  let rgb = '70, 110, 225';
  if (erasing) rgb = '120, 124, 140';
  else if (team === 'red') rgb = '229, 72, 77';
  ctx.fillStyle = `rgba(${rgb}, 0.1)`;
  ctx.strokeStyle = canPaint() ? `rgba(${rgb}, 0.6)` : 'rgba(35, 38, 47, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(ptr.x, ptr.y, brush, 0, TAU);
  ctx.fill();
  ctx.stroke();
}

const GHOST_LIFE = 1.7;

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  const units = world.units;
  units.sort((a, b) => a.y - b.y);
  for (const u of units) {
    if (u.team) {
      ctx.setTransform(dpr, 0, 0, dpr, u.x * dpr, (u.y + FEET + 1) * dpr);
      drawLayer(ctx, sprites.ring[u.team]);
    }
    const f = u.facing;
    const ph = (u.anim * Math.PI) / 2;
    const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;

    ctx.setTransform(f * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
    drawLayer(ctx, sprites.feet[u.moving ? (u.anim | 0) & 3 : 0]);

    const pose = u.pose;
    if (u.moving) {
      ctx.translate(0, -Math.abs(Math.sin(ph)) * 2.4);
      ctx.rotate(Math.sin(ph) * 0.07);
    } else if (pose < 1) {
      ctx.translate(0, Math.sin(u.breath * 2.2) * 0.55 * (1 - pose));
    }
    drawLayer(ctx, pose < 0.5 ? sprites.torsoFront[u.gaze] : sprites.torso);

    // Standing around the rifle is held upright at the side; it swings
    // down to aim as the soldier readies up.
    ctx.translate(
      IDLE_PIVOT.x + (PIVOT.x - IDLE_PIVOT.x) * pose,
      IDLE_PIVOT.y + (PIVOT.y - IDLE_PIVOT.y) * pose,
    );
    ctx.rotate(IDLE_AIM + (u.aim - IDLE_AIM) * pose + Math.sin(u.breath * 1.6) * 0.03 * (1 - pose));
    drawLayer(ctx, u.flash > 0 ? sprites.rifleFire : sprites.rifle);
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

  // Ghosts drift up and fade where a soldier fell.
  const gl = sprites.ghost;
  for (const g of world.ghosts) {
    const t = g.age / GHOST_LIFE;
    ctx.globalAlpha = (1 - t) * 0.9;
    const sway = Math.sin(g.age * 4 + g.seed * 6) * 3;
    ctx.drawImage(gl.canvas, g.x + gl.x + sway, g.y + gl.y - 4 - t * 36, gl.w, gl.h);
  }
  ctx.globalAlpha = 1;

  for (const u of units) {
    if (u.hp >= 100) continue;
    const bw = 18;
    const bx = u.x - bw / 2;
    const by = u.y - 24;
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
