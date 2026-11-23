import { TEAMS, TAU, K, UNIT, PIVOT, IDLE_PIVOT, IDLE_AIM, FEET, SPECIES, SPECIES_ORDER } from './config.js?v=23';
import { World } from './world.js?v=23';
import { buildSprites, drawLayer, paintIcon } from './sprites.js?v=23';
import { buildUnitArt } from './art_units.js?v=23';
import { drawUnit, drawFx, placeUnit, dropMark, arrowMark, stepMarks, drawMarks, hasIcon, paintUnitIcon } from './draw_units.js?v=23';

const $ = (id) => document.getElementById(id);
const wrap = $('stage-wrap');
const groundCanvas = $('ground');
const stageCanvas = $('stage');
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

// The battlefield is a fixed ~860 units wide whatever the screen: units, ranges
// and speeds always keep the same size relative to the screen, as in the original.
const LOGICAL_W = 860;
let W = 1; // field size in world units
let H = 1;
let Z = 1; // screen px per world unit
let cssW = 0;
let cssH = 0;
let ratio = 1; // device pixels per screen px
let dpr = 1; // device pixels per world unit
let brush = 16;
let paused = false;
let erasing = false;
let over = false;
const ptr = { x: 0, y: 0, inside: false, down: false };

// A fallen unit leaves its headgear on the ground (a cavalry just becomes
// a knight); blasts throw it into the air first, arrows stay stuck in. All of
// it fades away after a while.
let marks = [];
world.onDeath = (u) => marks.push(dropMark(u.species, u.x, u.y + FEET - 4));
world.onDebrisLand = (d) => marks.push(dropMark(d.species, d.x, d.y + FEET - 4));
world.onArrowLand = (a) => marks.push(arrowMark(a));

function paintAny(canvas, id) {
  if (hasIcon(id)) paintUnitIcon(canvas, sprites, id);
  else paintIcon(canvas, sprites, id);
}

// The palette icons are the same art as on the field.
let species = 'soldier';
const unitButtons = [...document.querySelectorAll('.unit-btn')];
const unitTip = $('unit-tip');
function pickUnit(b) {
  species = b.dataset.species;
  for (const o of unitButtons) o.setAttribute('aria-pressed', String(o === b));
}
unitButtons.forEach((b, i) => {
  paintAny(b.querySelector('canvas'), b.dataset.species);
  b.addEventListener('click', () => pickUnit(b));
  // hovering shows the name and the number key that picks it
  b.addEventListener('pointerenter', () => {
    unitTip.innerHTML = `<b>${SPECIES[b.dataset.species].label}</b> <i>${i + 1}</i>`;
    unitTip.hidden = false;
    const pr = palette.getBoundingClientRect();
    const br = b.getBoundingClientRect();
    unitTip.style.left = `${br.left - pr.left + br.width / 2}px`;
    unitTip.style.bottom = `${pr.bottom - document.querySelector('.units').getBoundingClientRect().top + 3}px`;
  });
  b.addEventListener('pointerleave', () => {
    unitTip.hidden = true;
  });
});
document.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const n = Number(e.key);
  if (n >= 1 && n <= unitButtons.length) pickUnit(unitButtons[n - 1]);
});

// ---------- Layout ----------
function resize() {
  const r = wrap.getBoundingClientRect();
  const w = Math.max(1, Math.floor(r.width));
  const h = Math.max(1, Math.floor(r.height));
  const px = Math.min(window.devicePixelRatio || 1, 2);
  if (w === cssW && h === cssH && px === ratio) return;
  cssW = w;
  cssH = h;
  ratio = px;
  Z = w / LOGICAL_W;
  W = LOGICAL_W;
  H = h / Z;
  dpr = ratio * Z;
  for (const c of [groundCanvas, stageCanvas]) {
    c.width = Math.floor(w * ratio);
    c.height = Math.floor(h * ratio);
  }
  world.resize(W, H);
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

// Units go down on a lattice. A drag lays columns along the path of the stroke
// (so curves bend the formation, as in the original); a tap fills a patch.
// Romans stand in a square grid, everyone else in staggered rows.
// Cells are [along, across, staggered].
const LATTICE = { default: [15.5, 12.5, true], roman: [17.4, 17.6, false], cavalry: [34, 22, true] };
let stroke = null;

function startStroke(x, y) {
  stroke = {
    ox: x,
    oy: y,
    sp: species,
    occ: new Set(),
    started: false,
    dragged: false,
    s: 0,
    nextI: 0,
    lx: x,
    ly: y,
    made: [],
    ang: 0,
    angSet: false,
  };
}

function canPlace(px, py, team) {
  if (px < 14 || px > W - 14 || py < 24 || py > H - 24) return false;
  const half = W / 2;
  if (team === 'red' && px > half - 10) return false;
  if (team === 'blue' && px < half + 10) return false;
  return true;
}

// A tap or a held press: a patch of the lattice around the pointer.
function dab(x, y) {
  if (erasing) {
    world.eraseAt(x, y, brush);
    return;
  }
  if (!stroke) startStroke(x, y);
  stroke.started = true;
  if (stroke.sp === 'roman') {
    // Romans go down thick and overlapping; they sort themselves into ranks when you let go
    const team = teamAt(x);
    const n = Math.max(2, Math.min(14, Math.round((brush * brush) / 150)));
    for (let i = 0; i < n; i++) {
      const a = Math.random() * TAU;
      const r = Math.sqrt(Math.random()) * brush;
      const px = x + Math.cos(a) * r;
      const py = y + Math.sin(a) * r;
      if (canPlace(px, py, team)) stroke.made.push(world.addUnit('roman', team, px, py));
    }
    return;
  }
  const { ox, oy, occ, sp } = stroke;
  const [sx, sy, stag] = LATTICE[sp] || LATTICE.default;
  const team = teamAt(x);
  for (let j = Math.floor((y - oy - brush) / sy); j <= Math.ceil((y - oy + brush) / sy); j++) {
    const off = stag && j & 1 ? 0.5 : 0;
    for (let i = Math.floor((x - ox - brush) / sx - off); i <= Math.ceil((x - ox + brush) / sx - off); i++) {
      const px = ox + (i + off) * sx;
      const py = oy + j * sy;
      if ((px - x) ** 2 + (py - y) ** 2 > brush * brush) continue;
      const key = `t${i},${j}`;
      if (occ.has(key)) continue;
      if (!canPlace(px, py, team)) continue;
      occ.add(key);
      stroke.made.push(world.addUnit(sp, team, px, py));
    }
  }
}

// A drag: columns every `sx` along the path, `brush` wide either side.
function layPath(x0, y0, x1, y1) {
  const st = stroke;
  const d = Math.hypot(x1 - x0, y1 - y0);
  if (!st || !d) return;
  st.started = true;
  const ux = (x1 - x0) / d;
  const uy = (y1 - y0) / d;
  if (!st.angSet) {
    st.ang = Math.atan2(uy, ux);
    st.angSet = true;
  }
  const nx = -uy;
  const ny = ux;
  const [sx, sy, stag] = LATTICE[st.sp] || LATTICE.default;
  const team = teamAt(x1);
  const s1 = st.s + d;
  while (st.nextI * sx <= s1) {
    const t = st.nextI * sx - st.s;
    const cx = x0 + ux * t;
    const cy = y0 + uy * t;
    const off0 = stag && st.nextI & 1 ? 0.5 : 0;
    for (let j = -Math.ceil(brush / sy); j <= Math.ceil(brush / sy); j++) {
      const off = (j + off0) * sy;
      if (Math.abs(off) > brush) continue;
      const key = `p${st.nextI},${j}`;
      if (st.occ.has(key)) continue;
      const px = cx + nx * off;
      const py = cy + ny * off;
      if (!canPlace(px, py, teamAt(px))) continue;
      st.occ.add(key);
      st.made.push(world.addUnit(st.sp, teamAt(px), px, py));
    }
    st.nextI++;
  }
  st.s = s1;
}

let distAcc = 0;
let timeAcc = 0;
let lastPaint = null;

function setPointer(e) {
  const r = wrap.getBoundingClientRect();
  ptr.x = (e.clientX - r.left) / Z;
  ptr.y = (e.clientY - r.top) / Z;
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
  stroke = null;
  if (erasing) {
    if (canPaint()) dab(ptr.x, ptr.y);
  } else if (canPaint()) {
    startStroke(ptr.x, ptr.y);
  }
});

stageCanvas.addEventListener('pointermove', (e) => {
  setPointer(e);
  ptr.inside = true;
  if (!ptr.down || !canPaint() || !lastPaint) return;
  if (erasing) {
    paintSegment(lastPaint.x, lastPaint.y, ptr.x, ptr.y);
    lastPaint = { x: ptr.x, y: ptr.y };
    return;
  }
  if (!stroke) return;
  if (stroke.sp === 'roman') {
    stroke.started = true;
    stroke.dragged = true;
    paintSegment(lastPaint.x, lastPaint.y, ptr.x, ptr.y);
    lastPaint = { x: ptr.x, y: ptr.y };
    return;
  }
  if (!stroke.dragged) {
    if (Math.hypot(ptr.x - stroke.ox, ptr.y - stroke.oy) < 5) return;
    stroke.dragged = true;
    stroke.lx = stroke.ox;
    stroke.ly = stroke.oy;
  }
  layPath(stroke.lx, stroke.ly, ptr.x, ptr.y);
  stroke.lx = ptr.x;
  stroke.ly = ptr.y;
});

function endPaint(e) {
  // a tap that never travelled still drops a patch
  if (ptr.down && stroke && !stroke.started && canPaint() && !erasing) dab(stroke.ox, stroke.oy);
  // Romans snap into a rectangle, however they were painted
  if (stroke && SPECIES[stroke.sp].def.formation) {
    const [fx, fy] = LATTICE[stroke.sp] || LATTICE.default;
    world.formRectangle(stroke.made, stroke.ang, fx, fy);
  }
  ptr.down = false;
  stroke = null;
  if (e.pointerType !== 'mouse') ptr.inside = false;
}
stageCanvas.addEventListener('pointerup', endPaint);
stageCanvas.addEventListener('pointercancel', endPaint);
stageCanvas.addEventListener('pointerleave', () => {
  if (!ptr.down) ptr.inside = false;
});

// The brush size lives in a drawer that slides out from the right edge.
function setBrush(v) {
  brush = Math.min(90, Math.max(8, Math.round(v)));
  brushInput.value = String(brush);
  brushDot.style.setProperty('--dot', `${6 + ((brush - 8) / 82) * 14}px`);
}
brushInput.addEventListener('input', () => setBrush(Number(brushInput.value)));
setBrush(brush);
const drawer = $('drawer');
$('drawer-handle').addEventListener('click', () => {
  const open = drawer.classList.toggle('open');
  $('drawer-handle').setAttribute('aria-expanded', String(open));
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
  marks = [];
  over = false;
  result.hidden = true;
  modal.hidden = true;
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
  $('paused').hidden = !paused;
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
    world.beginBattle();
    world.started = true;
    startBtn.hidden = true;
  }
});

const result = $('result');
const modal = $('modal');
$('new-battle').addEventListener('click', () => {
  reset();
  startBtn.hidden = world.mode !== 'team';
});
$('stats-btn').addEventListener('click', () => {
  buildStats();
  modal.hidden = false;
});
function closeStats() {
  modal.hidden = true;
}
$('modal-close').addEventListener('click', closeStats);
modal.addEventListener('pointerdown', (e) => {
  if (e.target === modal) closeStats();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeStats();
});

// The "units standing" step chart, red against blue.
function niceStep(max, target) {
  const raw = Math.max(1, max / target);
  const pow = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (m * pow >= raw) return m * pow;
  return 10 * pow;
}

function chartSvg(st) {
  const w = 770;
  const h = 300;
  const L = 52;
  const R = 56;
  const T = 24;
  const Bm = 46;
  const maxY = Math.max(1, ...st.samples.map((p) => Math.max(p[1], p[2])));
  const stepY = maxY <= 5 ? 1 : niceStep(maxY, 3);
  const topY = Math.ceil(maxY / stepY) * stepY;
  const dur = Math.max(1, st.duration);
  const stepX = dur <= 12 ? 2 : niceStep(dur, 5);
  const X = (t) => L + ((w - L - R) * t) / dur;
  const Y = (v) => T + (h - T - Bm) * (1 - v / topY);
  let out = `<svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Units standing over time">`;
  for (let v = 0; v <= topY; v += stepY) {
    out += `<line x1="${L}" x2="${w - R}" y1="${Y(v)}" y2="${Y(v)}" stroke="${v === 0 ? '#cfd2db' : '#eef0f5'}" stroke-width="1.5"/>`;
    out += `<text x="${L - 14}" y="${Y(v) + 5}" text-anchor="end" fill="#6d707c" font-size="15">${v}</text>`;
  }
  for (let t = 0; t <= dur + 0.001; t += stepX) {
    out += `<text x="${X(t)}" y="${h - 14}" text-anchor="middle" fill="#6d707c" font-size="15">${t}s</text>`;
  }
  for (const [idx, color] of [[1, '#ef4444'], [2, '#3b6cf0']]) {
    let d = '';
    let prev = null;
    for (const p of st.samples) {
      const x = X(Math.min(p[0], dur));
      if (prev === null) d += `M${x} ${Y(p[idx])}`;
      else if (p[idx] !== prev) d += ` H${x} V${Y(p[idx])}`;
      prev = p[idx];
    }
    d += ` H${X(dur)}`;
    out += `<path d="${d}" fill="none" stroke="${color}" stroke-width="2.6" stroke-linejoin="round"/>`;
    const end = st.samples[st.samples.length - 1][idx];
    out += `<circle cx="${X(dur)}" cy="${Y(end)}" r="4.5" fill="${color}"/>`;
    out += `<text x="${X(dur) + 14}" y="${Y(end) + 5}" fill="#23262f" font-size="16" font-weight="700">${end}</text>`;
  }
  return out + '</svg>';
}

function speciesRows(team, st) {
  return Object.keys(st.initial[team])
    .sort((a, b) => SPECIES_ORDER.indexOf(a) - SPECIES_ORDER.indexOf(b))
    .map((id) => {
      const icon = document.createElement('canvas');
      icon.width = 66;
      icon.height = 54;
      paintAny(icon, id);
      const row = document.createElement('div');
      row.className = 'tm-row';
      const name = document.createElement('span');
      name.className = 'tm-name';
      name.textContent = SPECIES[id].label;
      const nums = document.createElement('span');
      nums.className = 'tm-nums';
      nums.innerHTML = `<i>${st.initial[team][id]}</i><em>\u2192</em><b>${st.final[team][id] || 0}</b>`;
      row.append(icon, name, nums);
      return row;
    });
}

function buildStats() {
  const st = world.stats;
  const body = $('modal-body');
  body.textContent = '';
  if (!st || !st.final) return;
  const red = Object.values(st.final.red).reduce((a, b) => a + b, 0);
  const blue = Object.values(st.final.blue).reduce((a, b) => a + b, 0);
  const winner = red > 0 ? 'red' : blue > 0 ? 'blue' : null;
  const secs = Math.max(1, Math.round(st.duration));
  const start = (t) => Object.values(st.initial[t]).reduce((a, b) => a + b, 0);
  const left = winner ? (winner === 'red' ? red / start('red') : blue / start('blue')) : 0;
  const title = $('modal-title');
  title.className = `modal-title ${winner || ''}`;
  title.textContent = winner ? `${TEAMS[winner].label} team wins` : 'Draw';
  $('modal-sub').textContent = !winner
    ? `Everyone fell in ${secs} seconds`
    : `${left >= 0.5 ? 'Decisive' : left >= 0.2 ? 'Hard-fought' : 'Narrow'} victory in ${secs} seconds`;

  const chart = document.createElement('section');
  chart.className = 'tm-card';
  chart.innerHTML = `<header><h3>Units standing</h3><span class="tm-key"><i class="r"></i>Red team<i class="b"></i>Blue team</span></header>${chartSvg(st)}`;
  body.append(chart);

  const teams = document.createElement('div');
  teams.className = 'tm-teams';
  for (const t of ['red', 'blue']) {
    const card = document.createElement('section');
    card.className = `tm-card tm-team ${t}${winner === t ? ' win' : ''}`;
    const head = document.createElement('header');
    head.innerHTML = `<h3>${TEAMS[t].label} team</h3>${winner === t ? '<span class="tm-badge">WINNER</span>' : ''}`;
    card.append(head, ...speciesRows(t, st));
    teams.append(card);
  }
  body.append(teams);

  const first = st.deaths.find((d) => d.killer);
  if (first) {
    const card = document.createElement('section');
    card.className = 'tm-card tm-first';
    const icon = document.createElement('canvas');
    icon.width = 132;
    icon.height = 108;
    paintAny(icon, first.killer);
    const t = document.createElement('div');
    t.innerHTML = `<h3>First blood</h3><p>A ${first.killerTeam} ${SPECIES[first.killer].label.toLowerCase()} took down a ${first.team} ${SPECIES[first.species].label.toLowerCase()} ${Math.max(1, Math.round(first.t))}s in</p>`;
    card.append(icon, t);
    body.append(card);
  }
}

// Bottom-left legend: how many of each unit are on the field.
const legendRows = new Map();
const LEGEND_MAX = 7;
const legendMore = document.createElement('div');
legendMore.className = 'legend-more';
legendMore.hidden = true;
legend.append(legendMore);
function syncLegend() {
  const present = SPECIES_ORDER.filter((id) => world.speciesCounts[id] > 0).map((id) => [id, world.speciesCounts[id]]);
  legend.hidden = present.length === 0;
  for (const [id, n] of present) {
    let row = legendRows.get(id);
    if (!row) {
      const icon = document.createElement('canvas');
      icon.width = 104;
      icon.height = 85;
      paintAny(icon, id);
      const count = document.createElement('b');
      const label = document.createElement('span');
      label.textContent = SPECIES[id].label;
      const el = document.createElement('div');
      el.className = 'legend-row';
      el.append(icon, count, label);
      row = { el, count, last: -1 };
      legendRows.set(id, row);
      for (const sid of SPECIES_ORDER) {
        const r = legendRows.get(sid);
        if (r) legend.insertBefore(r.el, legendMore);
      }
    }
    if (row.last !== n) {
      row.count.textContent = String(n);
      row.last = n;
    }
  }
  let shown = 0;
  for (const [id, row] of legendRows) {
    const here = world.speciesCounts[id] > 0;
    row.el.hidden = !here || shown >= LEGEND_MAX;
    if (here) shown++;
  }
  legendMore.hidden = shown <= LEGEND_MAX;
  if (shown > LEGEND_MAX) legendMore.textContent = `+${shown - LEGEND_MAX} more`;
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
    world.endBattle();
    const winner = red > 0 ? 'red' : blue > 0 ? 'blue' : null;
    banner.className = `banner ${winner || ''}`;
    banner.textContent = winner ? `${TEAMS[winner].label} team wins!` : 'Draw!';
    result.hidden = false;
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

const smokeSprite = (() => {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(48, 48, 6, 48, 48, 48);
  gr.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
  gr.addColorStop(0.6, 'rgba(250, 250, 252, 0.8)');
  gr.addColorStop(1, 'rgba(240, 242, 246, 0)');
  g.fillStyle = gr;
  g.fillRect(0, 0, 96, 96);
  return c;
})();

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

  placeUnit(ctx, dpr, u, wobble);
  drawLayer(ctx, S.feet[u.moving ? (u.anim | 0) & 3 : 0]);

  const pose = u.pose;
  if (u.moving) {
    ctx.translate(0, -Math.abs(Math.sin(ph)) * 2.4);
    ctx.rotate(Math.sin(ph) * 0.07);
  } else if (pose < 1) {
    ctx.translate(0, Math.sin(u.breath * 2.2) * 0.55 * (1 - pose));
  }
  drawLayer(ctx, pose < 0.5 ? S.torsoSide[u.gaze] : S.torso);
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

const CANE = { x: 8 * K, y: 14 * K }; // rifle held across the body, barrel up and forward
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
    placeUnit(ctx, dpr, u, wobble);
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
    if (pose < 0.5) drawLayer(ctx, S.torsoSide[idle.blink ? 3 : idle.look]);
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
    const ia = lerp(-0.62, -0.08, lift) + Math.sin(u.breath * 1.4) * 0.025;
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
    placeUnit(ctx, dpr, u, wobble);
    ctx.translate(0, d.prone.cy);
    ctx.rotate(u.aim);
    const settle = 0.88 + 0.12 * smooth(0.5, 1, pr);
    ctx.scale(settle, settle);
    ctx.translate(-u.recoil * 2.2, 0);
    drawLayer(ctx, u.flash > 0 ? S.proneFire : S.prone);
  }
  ctx.globalAlpha = 1;
}

function drawBody(u) {
  if (u.species === 'sniper') drawSniper(u);
  else if (u.species === 'soldier') drawSoldier(u);
  else drawUnit(ctx, dpr, sprites, u);
}

function render() {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  drawMarks(ctx, dpr, marks);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  for (const c of world.corpses) {
    // knocked over backwards, dizzy stars circling, then fading as the ghost rises
    const k = c.age;
    const fall = 1 - (1 - Math.min(1, k / 0.2)) ** 2;
    const a = k < 0.55 ? 1 : Math.max(0, 1 - (k - 0.55) / 0.4);
    c.u.tilt = -1.45 * fall;
    c.u.breath = 0;
    ctx.globalAlpha = a;
    drawBody(c.u);
    ctx.globalAlpha = a;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = '#f7cd3a';
    ctx.strokeStyle = '#e0902a';
    ctx.lineWidth = 0.6;
    for (let i = 0; i < 3; i++) {
      const ang = k * 9 + (i / 3) * TAU;
      const sx = c.u.x - c.u.facing * 9 * UNIT + Math.cos(ang) * 9 * UNIT;
      const sy = c.u.y + FEET * 0.45 + Math.sin(ang) * 3.5 * UNIT;
      ctx.beginPath();
      for (let p = 0; p < 10; p++) {
        const r = (p % 2 === 0 ? 2.8 : 1.2) * UNIT;
        const q = (p / 10) * TAU - Math.PI / 2;
        if (p === 0) ctx.moveTo(sx + Math.cos(q) * r, sy + Math.sin(q) * r);
        else ctx.lineTo(sx + Math.cos(q) * r, sy + Math.sin(q) * r);
      }
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const units = world.units;
  units.sort((a, b) => a.y - b.y);
  for (const u of units) {
    if (u.team) {
      ctx.setTransform(dpr, 0, 0, dpr, u.x * dpr, (u.y + FEET + 1) * dpr);
      if (u.species === 'cavalry') ctx.scale(1.4, 1.1);
      drawLayer(ctx, sprites.ring[u.team]);
    }
    drawBody(u);
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
    if (p.white) {
      // ninja smoke: a big soft white cloud
      const r = p.size * (1.2 + 1.2 * Math.min(1, t * 2));
      ctx.globalAlpha = 0.62 * (t < 0.5 ? 1 : 1 - (t - 0.5) / 0.5);
      ctx.drawImage(smokeSprite, p.x - r, p.y - r, r * 2, r * 2);
      ctx.globalAlpha = 1;
      continue;
    }
    ctx.fillStyle = `rgba(165, 167, 176, ${(p.size > 10 ? 0.26 : 0.45) * (1 - t)})`;
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

  if (ptr.down && ptr.inside && canPaint() && (erasing || (stroke && (!stroke.dragged || stroke.sp === 'roman')))) {
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
      marks = stepMarks(marks, STEP);
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
