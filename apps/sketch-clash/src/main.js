import { TEAMS, TAU, K, UNIT, PIVOT, IDLE_PIVOT, IDLE_AIM, FEET, SPECIES, SPECIES_ORDER } from './config.js?v=12';
import { World } from './world.js?v=12';
import { buildSprites, drawLayer, paintIcon } from './sprites.js?v=12';
import { buildUnitArt } from './art_units.js?v=12';
import { drawUnit, drawFx, stampDrop, stampArrow, hasIcon, paintUnitIcon } from './draw_units.js?v=12';

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
const brushInput = $('brush');
const brushDot = $('brush-dot');
const palette = $('palette');

const sprites = { ...buildSprites(), ...buildUnitArt() };
const world = new World();

let W = 1;
let H = 1;
let dpr = 1;
let brush = 22;
let paused = false;
let erasing = false;
let over = false;
const ptr = { x: 0, y: 0, inside: false, down: false };

// A fallen unit leaves its headgear on the ground (a cavalry just becomes
// a knight); blasts throw it into the air first, arrows stay stuck in.
world.onDeath = (u) => stampDrop(gctx, u.species, u.x, u.y + FEET - 4);
world.onDebrisLand = (d) => stampDrop(gctx, d.species, d.x, d.y + FEET - 4);
world.onArrowLand = (a) => stampArrow(gctx, a);

function paintAny(canvas, id) {
  if (hasIcon(id)) paintUnitIcon(canvas, sprites, id);
  else paintIcon(canvas, sprites, id);
}

// The palette icons are the same art as on the field.
let species = 'soldier';
const unitButtons = [...document.querySelectorAll('.unit-btn')];
for (const b of unitButtons) {
  paintAny(b.querySelector('canvas'), b.dataset.species);
  b.addEventListener('click', () => {
    species = b.dataset.species;
    for (const o of unitButtons) o.setAttribute('aria-pressed', String(o === b));
  });
}

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
  const n = Math.min(9, Math.max(1, Math.round(brush / 12)));
  const team = teamAt(x);
  const half = W / 2;
  for (let i = 0; i < n; i++) {
    const a = Math.random() * TAU;
    const r = Math.sqrt(Math.random()) * brush;
    let px = Math.min(W - 20, Math.max(20, x + Math.cos(a) * r));
    const py = Math.min(H - 30, Math.max(30, y + Math.sin(a) * r));
    if (team) px = team === 'red' ? Math.min(px, half - 14) : Math.max(px, half + 14);
    world.addUnit(species, team, px, py);
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
  brush = Math.min(90, Math.max(10, Math.round(v)));
  brushInput.value = String(brush);
  brushDot.style.setProperty('--dot', `${6 + ((brush - 10) / 80) * 14}px`);
}
brushInput.addEventListener('input', () => setBrush(Number(brushInput.value)));
setBrush(brush);
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
  const present = SPECIES_ORDER.filter((id) => world.speciesCounts[id] > 0).map((id) => [id, world.speciesCounts[id]]);
  legend.hidden = present.length === 0;
  for (const [id, n] of present) {
    let row = legendRows.get(id);
    if (!row) {
      const icon = document.createElement('canvas');
      icon.width = 104;
      icon.height = 76;
      paintAny(icon, id);
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

function smooth(a, b, x) {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
}
function lerp(a, b, t) {
  return a + (b - a) * t;
}

// Scratch marks appear as a unit gets hurt.
function drawHurt(u) {
  if (u.hp >= 65) return;
  drawLayer(ctx, sprites.hurt[u.hp < 30 ? 1 : 0]);
}

function drawSoldier(u) {
  const S = sprites.soldier;
  const f = u.facing;
  const ph = (u.anim * Math.PI) / 2;
  const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;

  ctx.setTransform(f * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
  drawLayer(ctx, S.feet[u.moving ? (u.anim | 0) & 3 : 0]);

  const pose = u.pose;
  if (u.moving) {
    ctx.translate(0, -Math.abs(Math.sin(ph)) * 2.4);
    ctx.rotate(Math.sin(ph) * 0.07);
  } else if (pose < 1) {
    ctx.translate(0, Math.sin(u.breath * 2.2) * 0.55 * (1 - pose));
  }
  drawLayer(ctx, pose < 0.5 ? S.torsoFront[u.gaze] : S.torso);
  drawHurt(u);

  // Standing around the rifle is held upright at the side; it swings
  // down to aim as the soldier readies up.
  ctx.translate(
    IDLE_PIVOT.x + (PIVOT.x - IDLE_PIVOT.x) * pose,
    IDLE_PIVOT.y + (PIVOT.y - IDLE_PIVOT.y) * pose,
  );
  ctx.rotate(IDLE_AIM + (u.aim - IDLE_AIM) * pose + Math.sin(u.breath * 1.6) * 0.03 * (1 - pose));
  drawLayer(ctx, u.flash > 0 ? S.rifleFire : S.rifle);
}

// The sniper's own idle routine (see SNIPER_IDLES in world.js): rifle
// planted like a walking stick, slow scans, a hat tip, blinks, and a peek
// through the scope.
function sniperIdle(u) {
  const p = Math.min(1, u.idleT / u.idleDur);
  const bell = Math.sin(Math.PI * p);
  const out = { look: 1, blink: (u.breath % 4.3) < 0.13, tip: 0, lift: 0 };
  switch (u.idleKind) {
    case 'scan': {
      const s = Math.sin(p * TAU);
      out.look = s < -0.35 ? 0 : s > 0.35 ? 2 : 1;
      break;
    }
    case 'tip':
      out.tip = bell * 0.4;
      break;
    case 'scope':
      out.lift = Math.min(1, bell * 1.7);
      break;
    case 'blink':
      out.blink = p > 0.15 && p < 0.5;
      break;
    default:
  }
  return out;
}

const CANE = { x: 25 * K, y: 18 * K }; // rifle planted on the ground at his side
const PEEK = { x: 6 * K, y: 2 * K }; // rifle up at his eye
const LENS = { x: 25.6 * K, y: -7.9 * K }; // scope lens, in rifle space

function drawSniper(u) {
  const S = sprites.sniper;
  const d = u.def;
  const f = u.facing;
  const ph = (u.anim * Math.PI) / 2;
  const wobble = u.hit > 0 ? (Math.random() - 0.5) * 2 : 0;
  const pr = u.prone;
  // A hard swap at the halfway point: cross-fading the two poses lets the
  // white page show through as a flash.
  const standA = pr < 0.5 ? 1 : 0;
  const proneA = pr < 0.5 ? 0 : 1;

  if (standA > 0.01) {
    ctx.globalAlpha = standA;
    ctx.setTransform(f * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
    drawLayer(ctx, S.feet[u.moving ? (u.anim | 0) & 3 : 0]);

    const pose = u.pose;
    const idle = pose < 1 ? sniperIdle(u) : null;
    if (pr > 0) {
      // dropping to the ground: lean over and squash down onto the feet
      const drop = Math.min(1, pr / 0.5);
      ctx.translate(0, FEET);
      ctx.rotate(0.5 * drop);
      ctx.scale(1, 1 - 0.45 * drop);
      ctx.translate(0, -FEET);
    } else if (u.moving) {
      ctx.translate(0, -Math.abs(Math.sin(ph)) * 2.4);
      ctx.rotate(Math.sin(ph) * 0.07);
    } else if (pose < 1) {
      ctx.translate(0, Math.sin(u.breath * 1.7) * 0.5 * (1 - pose));
    }
    if (pose < 0.5) drawLayer(ctx, S.torsoFront[idle.blink ? 3 : idle.look]);
    else drawLayer(ctx, S.torso);
    drawHurt(u);

    ctx.save();
    ctx.translate(0, -11.6 * K);
    if (idle) ctx.rotate(idle.tip * (1 - pose));
    drawLayer(ctx, S.hat);
    ctx.restore();

    const lift = idle ? idle.lift : 0;
    const ix = lerp(CANE.x, PEEK.x, lift);
    const iy = lerp(CANE.y, PEEK.y, lift);
    const ia = lerp(-1.5, -0.08, lift) + Math.sin(u.breath * 1.4) * 0.025;
    ctx.translate(lerp(ix, d.pivot.x, pose), lerp(iy, d.pivot.y, pose));
    ctx.rotate(lerp(ia, u.aim, pose));
    drawLayer(ctx, u.flash > 0 ? S.rifleFire : S.rifle);
    if (idle && lift > 0.85 && pose < 0.3) {
      // sun glint off the scope
      ctx.globalAlpha = standA * ((lift - 0.85) / 0.15);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.moveTo(LENS.x, LENS.y - 4.5);
      ctx.lineTo(LENS.x + 1.2, LENS.y - 1.2);
      ctx.lineTo(LENS.x + 4.5, LENS.y);
      ctx.lineTo(LENS.x + 1.2, LENS.y + 1.2);
      ctx.lineTo(LENS.x, LENS.y + 4.5);
      ctx.lineTo(LENS.x - 1.2, LENS.y + 1.2);
      ctx.lineTo(LENS.x - 4.5, LENS.y);
      ctx.lineTo(LENS.x - 1.2, LENS.y - 1.2);
      ctx.closePath();
      ctx.fill();
    }
  }

  if (proneA > 0.01) {
    // lying on his belly, the whole body pointed at the target
    ctx.globalAlpha = proneA;
    ctx.setTransform(f * dpr, 0, 0, dpr, (u.x + wobble) * dpr, u.y * dpr);
    ctx.translate(0, d.prone.cy);
    ctx.rotate(u.aim);
    const settle = 0.88 + 0.12 * smooth(0.5, 1, pr);
    ctx.scale(settle, settle);
    ctx.translate(-u.recoil * 2.2, 0);
    drawLayer(ctx, u.flash > 0 ? S.proneFire : S.prone);
  }
  ctx.globalAlpha = 1;
}

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
    if (u.species === 'sniper') drawSniper(u);
    else if (u.species === 'soldier') drawSoldier(u);
    else drawUnit(ctx, dpr, sprites, u);
  }

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.lineCap = 'round';

  // red laser sights on whatever a lying-down sniper is lining up
  ctx.lineWidth = 1.2;
  ctx.strokeStyle = 'rgba(239, 68, 68, 0.5)';
  ctx.beginPath();
  for (const u of units) {
    if (!u.laser || !u.target || u.target.dead) continue;
    const m = world.muzzleOf(u);
    const t = u.target;
    const dx = t.x - m.x;
    const dy = t.y - m.y;
    const len = Math.hypot(dx, dy) || 1;
    ctx.moveTo(m.x, m.y);
    ctx.lineTo(t.x + (dx / len) * 70, t.y + (dy / len) * 70);
  }
  ctx.stroke();
  ctx.fillStyle = 'rgba(239, 68, 68, 0.85)';
  for (const u of units) {
    if (!u.laser || !u.target || u.target.dead) continue;
    ctx.beginPath();
    ctx.arc(u.target.x, u.target.y, 2.2, 0, TAU);
    ctx.fill();
  }

  ctx.lineWidth = 1.8;
  ctx.strokeStyle = '#3a3a44';
  ctx.beginPath();
  for (const b of world.bullets) {
    ctx.moveTo(b.x - b.vx * 0.03, b.y - b.vy * 0.03);
    ctx.lineTo(b.x, b.y);
  }
  ctx.stroke();

  // sniper shots leave a long streak that fades
  for (const sk of world.streaks) {
    const a = 1 - sk.age / sk.life;
    ctx.strokeStyle = `rgba(88, 92, 104, ${0.75 * a})`;
    ctx.lineWidth = 0.7 + 2 * a;
    ctx.beginPath();
    ctx.moveTo(sk.x0, sk.y0);
    ctx.lineTo(sk.x1, sk.y1);
    ctx.stroke();
  }

  for (const p of world.puffs) {
    const t = p.age / p.life;
    ctx.fillStyle = p.white ? `rgba(250, 250, 252, ${0.75 * (1 - t)})` : `rgba(165, 167, 176, ${(p.size > 10 ? 0.26 : 0.45) * (1 - t)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size * (1 + 1.8 * t), 0, TAU);
    ctx.fill();
  }

  for (const c of world.casings) {
    ctx.setTransform(dpr, 0, 0, dpr, c.x * dpr, c.y * dpr);
    ctx.rotate(c.rot);
    ctx.globalAlpha = 1 - c.age / c.life;
    ctx.fillStyle = '#6b5a2a';
    ctx.fillRect(-1.6, -0.7, 3.2, 1.4);
  }
  ctx.globalAlpha = 1;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  ctx.fillStyle = '#23262f';
  for (const s of world.sparks) {
    ctx.globalAlpha = Math.max(0, s.life / s.max);
    ctx.beginPath();
    ctx.arc(s.x, s.y, 1.5, 0, TAU);
    ctx.fill();
  }

  drawFx(ctx, dpr, sprites, world);

  // Ghosts drift up and fade where a unit fell, keeping their headgear.
  for (const g of world.ghosts) {
    const gl = sprites[g.species].ghost;
    const t = g.age / GHOST_LIFE;
    ctx.globalAlpha = (1 - t) * 0.9;
    const sway = Math.sin(g.age * 4 + g.seed * 6) * 3;
    ctx.drawImage(gl.canvas, g.x + gl.x + sway, g.y + gl.y - (4 + t * 36) * UNIT, gl.w, gl.h);
  }
  ctx.globalAlpha = 1;

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
