import { el, clearChildren } from '../util/dom.js';
import { REGIONS, MAINLAND_COASTLINE, ABYSSAL_COASTLINE, STRAIT_ISLET, REGION_BORDERS, regionById, isRegionLocked } from '../data/regions.js';
import { closeOverlay } from './overlayShell.js';
import { showToast } from './toast.js';
import { morrisPickRegionId, morrisTravelMultiplier } from '../data/morris.js';
import { BASE_TRAVEL_DURATION } from '../world/travel.js';
import { RARITY } from '../data/rarity.js';

// A clean, flat-vector treasure chart — single-tone paper, single-line
// coastlines, and a handful of simple line-art icons (mountain, palms,
// compass, skull). A previous pass leaned hard into a "hand-engraved
// parchment" look (nested contour rings, torn edges, wave-line hatching
// over the whole sheet, a cluster of corner flourishes) that read as
// cluttered rather than detailed — this redraws it closer to the plain
// poster-style reference it was asked to match.
const MAP_W = 520;
const MAP_H = 340;
// The frame's rendered width at the panel's full `min(680px, 94vw)` (see
// styles.css) — 680 minus map-body's 12px padding each side minus the
// frame's 2px border each side. Marker tags are sized off of this as
// --map-tag-scale (see render() below) so their text/padding shrinks in
// step with the frame on any window narrower than that, keeping every
// tag's size proportional to the room between markers instead of
// overlapping once the panel's own 94vw cap kicks in.
const MAP_REFERENCE_FRAME_W = 652;
const PAPER = '#e8c977';
const INK = '#6b4a2a';
const INK_SOFT = 'rgba(107, 74, 42, 0.55)';

function toPoints(coastline) {
  return coastline.map(([fx, fy]) => ({ x: fx * MAP_W, y: fy * MAP_H }));
}

// Traces a closed, gently-wobbly path through a point list — reads as a
// hand-drawn coastline rather than a rigid polygon. Used for the mainland
// and the little strait islet.
function traceSmoothPath(ctx, points) {
  ctx.beginPath();
  const n = points.length;
  ctx.moveTo((points[0].x + points[n - 1].x) / 2, (points[0].y + points[n - 1].y) / 2);
  for (let i = 0; i < n; i++) {
    const p = points[i];
    const next = points[(i + 1) % n];
    const midX = (p.x + next.x) / 2, midY = (p.y + next.y) / 2;
    ctx.quadraticCurveTo(p.x, p.y, midX, midY);
  }
  ctx.closePath();
}

// Straight segments, no smoothing — a sharp, broken coastline. Used only
// for the Abyssal Lands so it reads as jagged and dangerous rather than
// the soft rounded islands everywhere else.
function traceJaggedPath(ctx, points) {
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  ctx.closePath();
}

// A single ink outline, filled with the same flat paper tone as the sea —
// land is distinguished from water by its outline and the icons on it, not
// by a separate fill color, matching the reference's flat poster look.
function drawLandmass(ctx, points, trace) {
  trace(ctx, points);
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.4;
  ctx.stroke();
}

function drawStraitIslet(ctx) {
  const cx = STRAIT_ISLET.cx * MAP_W, cy = STRAIT_ISLET.cy * MAP_H, r = STRAIT_ISLET.r * MAP_W;
  const points = [];
  const spikes = 7;
  for (let i = 0; i < spikes; i++) {
    const a = (Math.PI * 2 * i) / spikes;
    const jitter = 0.75 + 0.35 * Math.abs(Math.sin(i * 2.1));
    points.push({ x: cx + Math.cos(a) * r * jitter, y: cy + Math.sin(a) * r * jitter });
  }
  drawLandmass(ctx, points, traceSmoothPath);
}

// Solid ink boundary lines between neighboring regions on the mainland —
// the actual "borders between areas".
function drawBorders(ctx, mainlandPoints) {
  traceSmoothPath(ctx, mainlandPoints);
  ctx.save();
  ctx.clip();
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 1.2;
  for (const [aId, bId] of REGION_BORDERS) {
    const a = regionById(aId).mapPos, b = regionById(bId).mapPos;
    const ax = a.x * MAP_W, ay = a.y * MAP_H, bx = b.x * MAP_W, by = b.y * MAP_H;
    const midX = (ax + bx) / 2, midY = (ay + by) / 2;
    const dx = bx - ax, dy = by - ay;
    const len = Math.hypot(dx, dy) || 1;
    const px = -dy / len, py = dx / len;
    const spread = len * 0.55;
    ctx.beginPath();
    ctx.moveTo(midX + px * spread, midY + py * spread);
    ctx.quadraticCurveTo(midX, midY, midX - px * spread, midY - py * spread);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCompassRose(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.arc(0, 0, r * 1.3, 0, Math.PI * 2); ctx.stroke();

  for (let i = 0; i < 8; i++) {
    const ang = (Math.PI / 4) * i;
    const long = i % 2 === 0;
    const len = long ? r : r * 0.5;
    ctx.save();
    ctx.rotate(ang);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-len * 0.12, -len * 0.3);
    ctx.lineTo(0, -len);
    ctx.lineTo(len * 0.12, -len * 0.3);
    ctx.closePath();
    ctx.fillStyle = long ? INK : PAPER;
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath(); ctx.arc(0, 0, 1.6, 0, Math.PI * 2); ctx.fillStyle = INK; ctx.fill();

  ctx.fillStyle = INK;
  ctx.font = `bold ${Math.round(r * 0.42)}px "Pirata One", cursive`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('N', 0, -r * 1.65);
  ctx.fillText('S', 0, r * 1.7);
  ctx.font = `${Math.round(r * 0.34)}px "Pirata One", cursive`;
  ctx.fillText('E', r * 1.65, 1);
  ctx.fillText('W', -r * 1.65, 1);
  ctx.restore();
}

function drawSkullAndCrossbones(ctx, x, y, s) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  for (const rot of [0.6, -0.6]) {
    ctx.save();
    ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(-13, 0); ctx.lineTo(13, 0); ctx.stroke();
    for (const bx of [-13, 13]) {
      ctx.beginPath(); ctx.arc(bx, 0, 2.6, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, -1, 8, Math.PI, 0);
  ctx.lineTo(6, 5);
  ctx.lineTo(3, 3);
  ctx.lineTo(0, 6);
  ctx.lineTo(-3, 3);
  ctx.lineTo(-6, 5);
  ctx.closePath();
  ctx.fillStyle = PAPER;
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(-3.4, -1.5, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3.4, -1.5, 2, 2.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(0, 1); ctx.lineTo(-1.3, 4); ctx.lineTo(1.3, 4); ctx.closePath(); ctx.fill();
  ctx.restore();
}

// A simple mountain with a smoking peak — one clear landmark instead of
// three separate small triangle clusters, matching the reference's single
// central volcano.
function drawMountain(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.lineJoin = 'round';
  ctx.fillStyle = PAPER;
  const peaks = [[-20, 0, -9, -20], [0, 0, 5, -30], [20, 0, 11, -18]];
  for (const [bx, , px, py] of peaks) {
    ctx.beginPath();
    ctx.moveTo(bx - 10, 0);
    ctx.lineTo(px, py);
    ctx.lineTo(bx + 10, 0);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  // A thin curl of smoke off the tallest peak
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(5, -30);
  ctx.quadraticCurveTo(10, -38, 4, -44);
  ctx.quadraticCurveTo(-2, -50, 6, -56);
  ctx.stroke();
  ctx.restore();
}

// A simple, single-style palm — a curved trunk and a few fronds, no
// coconuts or shading, reads clearly even tiny.
function drawPalmIcon(ctx, x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(2, -7, 0, -12);
  ctx.stroke();
  for (const ang of [-1.2, -0.5, 0.2, 0.9]) {
    ctx.beginPath();
    ctx.moveTo(0, -12);
    ctx.quadraticCurveTo(Math.cos(ang) * 4, -12 + Math.sin(ang) * 3, Math.cos(ang) * 9, -12 + Math.sin(ang) * 6);
    ctx.stroke();
  }
  ctx.restore();
}

// A soft colored glow behind a region's landmark, in that region's own
// `mapTint` (data/regions.js) — the one thing on this otherwise flat,
// single-tone poster that gives each destination its own identity at a
// glance, before you've even read the label.
function drawRegionHalo(ctx, x, y, r, color) {
  const glow = ctx.createRadialGradient(x, y, 0, x, y, r);
  glow.addColorStop(0, color + '3a');
  glow.addColorStop(1, color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

// The Docks' own landmark — a striped lighthouse with a lit lamp room,
// marking home port the way the mountain/palms/etc. mark everywhere else.
function drawLighthouse(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineWidth = 1.4;
  ctx.lineJoin = 'round';

  // Tapered tower
  ctx.beginPath();
  ctx.moveTo(-5, 0); ctx.lineTo(-3.4, -26); ctx.lineTo(3.4, -26); ctx.lineTo(5, 0);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // Painted stripes
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 1;
  for (const t of [0.3, 0.55, 0.8]) {
    const yy = -t * 26;
    const half = 5 - t * 1.6;
    ctx.beginPath(); ctx.moveTo(-half, yy); ctx.lineTo(half, yy); ctx.stroke();
  }

  // Lamp room + roof
  ctx.fillStyle = PAPER;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.rect(-4, -32, 8, 6); ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-5, -32); ctx.lineTo(0, -38); ctx.lineTo(5, -32);
  ctx.closePath(); ctx.fill(); ctx.stroke();

  // A little starburst of light off the top — the one warm accent on this
  // otherwise ink-only map.
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 1;
  for (const a of [-0.9, -0.3, 0.3, 0.9]) {
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(Math.sin(a) * 11, -35 + Math.cos(a) * 9 - 4);
    ctx.stroke();
  }
  ctx.restore();
}

// Seaside Bay's landmark — a fossil ammonite spiral, echoing the region's
// own "things long gone still surface" blurb (data/regions.js).
function drawFossilSpiral(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  const turns = 2.4;
  const steps = 60;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * Math.PI * 2 * turns;
    const r = 1.5 + t * 12;
    const px = Math.cos(a) * r, py = Math.sin(a) * r;
    if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
  }
  ctx.stroke();
  // A couple of chambered cross-lines, like a real ammonite's septa
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 0.9;
  for (const t of [0.4, 0.65, 0.85]) {
    const a = t * Math.PI * 2 * turns;
    const r = 1.5 + t * 12;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r * 0.4, Math.sin(a) * r * 0.4);
    ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    ctx.stroke();
  }
  ctx.restore();
}

// Dark Waters' landmark — a curling tentacle breaking the surface, for the
// region built around things that "grow much too large."
function drawTentacle(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-4, 4);
  ctx.quadraticCurveTo(-8, -6, -2, -14);
  ctx.quadraticCurveTo(3, -20, -1, -26);
  ctx.quadraticCurveTo(-4, -20, 1, -14);
  ctx.quadraticCurveTo(6, -6, 3, 4);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  // Suckers along the underside
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 0.9;
  for (const t of [0.15, 0.35, 0.55, 0.72]) {
    const yy = 2 - t * 24;
    ctx.beginPath(); ctx.arc(-1 + t * 3, yy, 1, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.restore();
}

// The Abyssal Lands' landmark — a jagged rift with a slit-pupil eye at its
// center, the same possessed-eye motif render/drawNPC.js's Luca uses, so
// the map itself hints at what's actually out there before you ever travel.
function drawRiftEye(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-13, 0);
  ctx.quadraticCurveTo(-6, -8, 0, -3);
  ctx.quadraticCurveTo(6, -8, 13, 0);
  ctx.quadraticCurveTo(6, 7, 0, 3);
  ctx.quadraticCurveTo(-6, 7, -13, 0);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = INK;
  ctx.beginPath(); ctx.ellipse(0, 0, 3.2, 3.6, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = PAPER;
  ctx.lineWidth = 1.1;
  ctx.beginPath(); ctx.moveTo(0, -2.6); ctx.lineTo(0, 2.6); ctx.stroke();

  // Cracks fanning out from the rift, echoing Luca's own possession marks
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 0.8;
  for (const [dx, dy] of [[-16, -6], [16, -6], [-14, 8], [14, 8], [0, -12]]) {
    ctx.beginPath(); ctx.moveTo(dx * 0.5, dy * 0.5); ctx.lineTo(dx, dy); ctx.stroke();
  }
  ctx.restore();
}

// The Frozen Reach's landmark — a jagged iceberg with a crack of blue
// showing through, revealed once the region unlocks (see isRegionLocked).
function drawIceberg(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = INK;
  ctx.fillStyle = PAPER;
  ctx.lineWidth = 1.5;
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(-16, 4);
  ctx.lineTo(-9, -18);
  ctx.lineTo(-2, -8);
  ctx.lineTo(4, -24);
  ctx.lineTo(11, -6);
  ctx.lineTo(16, 4);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // A crack of open water-blue through the ice, echoing the region's own
  // waterTint (data/regions.js) without needing a second fill color.
  ctx.strokeStyle = 'rgba(90, 160, 200, 0.55)';
  ctx.lineWidth = 1.1;
  ctx.beginPath();
  ctx.moveTo(-2, -8);
  ctx.lineTo(1, 0);
  ctx.lineTo(-3, 4);
  ctx.stroke();

  // Waterline
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-18, 4); ctx.lineTo(18, 4); ctx.stroke();
  ctx.restore();
}

// A loose fog swirl for the still-uncharted mystery zones — deliberately
// the vaguest icon on the map, since Morris "won't say what's out there."
function drawFogSwirl(ctx, x, y, s = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(s, s);
  ctx.strokeStyle = INK_SOFT;
  ctx.lineWidth = 1.2;
  ctx.setLineDash([2, 3]);
  for (const r of [5, 9, 13]) {
    ctx.beginPath();
    ctx.arc(0, 0, r, 0.4, Math.PI * 1.7);
    ctx.stroke();
  }
  ctx.setLineDash([]);
  ctx.restore();
}

function starBadge(stars) {
  if (stars <= 0) return '';
  if (stars <= 5) return '★'.repeat(stars);
  return `★ ×${stars}`;
}

// A calm→deadly color read on the star count, so difficulty groups jump out
// at a glance before you've read a single number — green water is safe,
// red water bites back.
function difficultyColor(stars) {
  if (stars == null || stars <= 0) return null;
  if (stars <= 2) return '#4a9d5f';
  if (stars <= 5) return '#c98a2e';
  if (stars <= 7) return '#c9542e';
  return '#8a1f1f';
}

function buildLegend() {
  const swatch = (cls) => el('span', { class: `map-legend-swatch ${cls}` });
  const item = (cls, text) => el('div', { class: 'map-legend-item' }, [swatch(cls), el('span', { class: 'map-legend-text' }, text)]);
  return el('div', { class: 'map-legend' }, [
    item('home', 'Home Port'),
    item('current', 'Current'),
    item('locked', 'Uncharted'),
    el('div', { class: 'map-legend-item map-legend-diff' }, [
      el('span', { class: 'map-legend-text' }, 'Calm'),
      el('span', { class: 'map-legend-scale' }),
      el('span', { class: 'map-legend-text' }, 'Deadly'),
    ]),
  ]);
}

// A region click no longer travels immediately — it selects the region and
// shows this preview card (blurb, difficulty, focus rarity, Morris's
// rapport-adjusted crossing time, and a Morris's Pick callout when it
// applies), with an explicit "Set Sail" to actually confirm the trip.
function buildPreviewCard(state, region, onSail) {
  const pickId = morrisPickRegionId(state);
  const isPick = region.id === pickId;
  const rarity = region.focusRarity ? RARITY[region.focusRarity] : null;
  const duration = BASE_TRAVEL_DURATION * morrisTravelMultiplier(state);
  const diffColor = !region.home ? difficultyColor(region.stars) : null;

  const meta = [el('span', {}, `~${duration.toFixed(1)}s crossing`)];
  if (rarity) meta.push(el('span', { style: `color:${rarity.color}` }, `Favors ${rarity.label}`));

  const rows = [
    el('div', { class: 'map-preview-head' }, [
      el('div', { class: 'map-preview-name' }, region.name),
      el('div', { class: 'map-preview-stars', style: diffColor ? `color:${diffColor};` : '' },
        region.home ? 'Home Port' : starBadge(region.stars)),
    ]),
    el('div', { class: 'map-preview-blurb' }, region.blurb),
    el('div', { class: 'map-preview-meta' }, meta),
  ];
  if (isPick) {
    rows.push(el('div', { class: 'map-preview-pick' }, "🧭 Morris's Pick — word is the water's been kind here today."));
  }
  rows.push(el('button', { class: 'btn btn-primary map-preview-sail', text: '⛵ Set Sail', onClick: onSail }));

  return el('div', { class: 'map-preview' }, rows);
}

export function buildMapPanel(state, root, onTravel) {
  const canvas = el('canvas', { width: MAP_W, height: MAP_H, class: 'map-canvas' });
  const markers = el('div', { class: 'map-markers' });
  const frame = el('div', { class: 'map-frame' }, [canvas, markers]);
  const previewBox = el('div', { class: 'map-preview-wrap' });

  let selectedRegionId = null;
  let markerButtonsByRegion = {};

  function applySelectionHighlight() {
    for (const id in markerButtonsByRegion) {
      markerButtonsByRegion[id].classList.toggle('selected', id === selectedRegionId);
    }
  }

  function renderPreview() {
    clearChildren(previewBox);
    if (!selectedRegionId) {
      previewBox.appendChild(el('div', { class: 'map-preview-empty' }, 'Select a region on the chart to see the crossing details.'));
      return;
    }
    const region = regionById(selectedRegionId);
    previewBox.appendChild(buildPreviewCard(state, region, () => onTravel(selectedRegionId)));
  }

  function selectRegion(regionId) {
    selectedRegionId = regionId;
    applySelectionHighlight();
    renderPreview();
  }

  const closeBtn = el('button', { class: 'panel-close', text: '✕', onClick: () => { closeOverlay(state); state.ui.mapOpen = false; update(); } });
  const wrap = el('div', { class: 'map-wrap hidden' }, [
    el('div', { class: 'panel', id: 'map-panel-inner' }, [
      el('div', { class: 'panel-header' }, [el('h2', {}, "Morris's Chart"), closeBtn]),
      el('div', { class: 'panel-body map-body' }, [frame, previewBox, buildLegend()]),
    ]),
  ]);
  root.appendChild(wrap);

  function render() {
    selectedRegionId = null;
    markerButtonsByRegion = {};
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, MAP_W, MAP_H);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, MAP_W, MAP_H);

    const mainlandPoints = toPoints(MAINLAND_COASTLINE);
    const abyssalPoints = toPoints(ABYSSAL_COASTLINE);

    drawLandmass(ctx, mainlandPoints, traceSmoothPath);
    drawLandmass(ctx, abyssalPoints, traceJaggedPath);
    drawStraitIslet(ctx);
    drawBorders(ctx, mainlandPoints);

    // Every real region gets its own halo (in its own data/regions.js
    // mapTint) plus a landmark unique to it — the "way cooler, each with
    // its own feature" pass. Halos first so the ink linework of every
    // landmark still draws crisp on top of them.
    for (const id of ['dock', 'tropicalIsland', 'seasideBay', 'darkWaters', 'mountainIsle', 'abyssalLands']) {
      const region = regionById(id);
      drawRegionHalo(ctx, region.mapPos.x * MAP_W, region.mapPos.y * MAP_H, 42, region.mapTint);
    }
    // The Frozen Reach only gets its halo + landmark once actually
    // unlocked — while locked it's drawn as a fog swirl below, same as any
    // other uncharted zone.
    const frozenReach = regionById('frozenReach');
    if (!isRegionLocked(state, frozenReach)) {
      drawRegionHalo(ctx, frozenReach.mapPos.x * MAP_W, frozenReach.mapPos.y * MAP_H, 42, frozenReach.mapTint);
    }

    const dock = regionById('dock').mapPos;
    drawLighthouse(ctx, dock.x * MAP_W - 30, dock.y * MAP_H + 20, 1);

    const mountainIsle = regionById('mountainIsle').mapPos;
    drawMountain(ctx, mountainIsle.x * MAP_W, mountainIsle.y * MAP_H + 34, 0.85);

    const tropicalIsland = regionById('tropicalIsland').mapPos;
    drawPalmIcon(ctx, tropicalIsland.x * MAP_W - 10, tropicalIsland.y * MAP_H - 4, 1);
    drawPalmIcon(ctx, tropicalIsland.x * MAP_W + 12, tropicalIsland.y * MAP_H + 10, 0.85);

    const seasideBay = regionById('seasideBay').mapPos;
    drawFossilSpiral(ctx, seasideBay.x * MAP_W + 18, seasideBay.y * MAP_H + 14, 1);

    const darkWaters = regionById('darkWaters').mapPos;
    drawTentacle(ctx, darkWaters.x * MAP_W + 20, darkWaters.y * MAP_H + 20, 1);

    const abyssalLands = regionById('abyssalLands').mapPos;
    drawRiftEye(ctx, abyssalLands.x * MAP_W - 22, abyssalLands.y * MAP_H - 18, 1);

    if (!isRegionLocked(state, frozenReach)) {
      drawIceberg(ctx, frozenReach.mapPos.x * MAP_W + 18, frozenReach.mapPos.y * MAP_H - 14, 1);
    }

    for (const r of REGIONS) {
      if (!isRegionLocked(state, r)) continue;
      drawFogSwirl(ctx, r.mapPos.x * MAP_W + 16, r.mapPos.y * MAP_H - 16, 1.1);
    }

    drawCompassRose(ctx, MAP_W - 46, 42, 17);
    drawSkullAndCrossbones(ctx, 40, MAP_H - 40, 1.1);

    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.strokeRect(1.5, 1.5, MAP_W - 3, MAP_H - 3);

    // How far the frame has actually shrunk below its full-width reference
    // (see MAP_REFERENCE_FRAME_W above) — read by every marker tag's CSS
    // via --map-tag-scale so text/padding shrink right along with the
    // frame instead of staying fixed-size and starting to overlap.
    const uiScale = Math.min(1, frame.getBoundingClientRect().width / MAP_REFERENCE_FRAME_W);
    frame.style.setProperty('--map-tag-scale', String(uiScale));

    clearChildren(markers);
    const pickId = morrisPickRegionId(state);
    for (const r of REGIONS) {
      const isCurrent = state.currentRegion === r.id;
      const locked = isRegionLocked(state, r);
      const isPick = !locked && !r.home && r.id === pickId;
      const cls = ['map-marker'];
      if (locked) cls.push('locked');
      if (r.home) cls.push('home');
      if (isCurrent) cls.push('current');
      if (isPick) cls.push('pick');

      const icon = el('div', { class: 'map-marker-icon' });
      const label = el('div', { class: 'map-marker-label' }, locked ? '???' : r.name);
      const diffColor = !locked && !r.home ? difficultyColor(r.stars) : null;
      const stars = el('div', {
        class: 'map-marker-stars',
        style: diffColor ? `color:${diffColor};` : '',
      }, locked ? '' : (r.home ? 'Home Port' : starBadge(r.stars)));

      const tagChildren = [label, stars];
      if (isPick) tagChildren.push(el('div', { class: 'map-marker-pick-badge' }, '🧭 Pick'));
      const tag = el('div', { class: 'map-marker-tag' }, tagChildren);

      const btn = el('button', {
        class: cls.join(' '),
        style: `left:${r.mapPos.x * 100}%; top:${r.mapPos.y * 100}%;`,
        onClick: () => {
          if (locked) {
            // A level-gated zone gets an actual hint (something to work
            // toward); a permanently-locked one keeps Morris's original
            // "no idea" line, since there's nothing yet to work toward.
            const msg = r.unlockLevel
              ? `The ice hasn't broken yet — reach Level ${r.unlockLevel} to chart a course.`
              : "Uncharted — Morris won't say what's out there.";
            showToast(state, msg);
            return;
          }
          // `isCurrent` alone correctly covers "you're already here" for
          // every region including the Docks — a separate `r.home` check
          // here used to fire unconditionally whenever the Docks marker
          // was clicked, which blocked ever traveling back to it once you
          // were somewhere else.
          if (isCurrent) { showToast(state, r.home ? "You're already here, cap'n." : 'Already anchored here.'); return; }
          // Selects the region and shows the preview card (blurb, stars,
          // focus rarity, crossing time, Morris's Pick callout) rather than
          // traveling immediately — "Set Sail" in the preview confirms.
          selectRegion(r.id);
        },
      }, [icon, tag]);

      markerButtonsByRegion[r.id] = btn;
      markers.appendChild(btn);
    }
    applySelectionHighlight();
    renderPreview();
  }

  // Only (re)builds the marker buttons when the map transitions closed->open.
  // Rebuilding every frame (this is called once per frame from main.js)
  // would destroy and recreate the buttons mid click-gesture, making them
  // impossible to click.
  let wasOpen = false;
  function update() {
    wrap.classList.toggle('hidden', !state.ui.mapOpen);
    if (state.ui.mapOpen && !wasOpen) render();
    wasOpen = state.ui.mapOpen;
  }

  update();
  return { wrap, update };
}
