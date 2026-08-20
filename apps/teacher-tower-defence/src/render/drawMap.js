import { PATH, LOGICAL_W, LOGICAL_H, TOWER_SLOTS } from '../data/path.js';

// A handful of fixed decorative motes drifting around the scene — computed
// once so they don't re-randomize (and jump around) every frame.
const MOTES = Array.from({ length: 46 }, (_, i) => ({
  x: (i * 137.5) % LOGICAL_W,
  y: (i * 71.3 + i * i * 3.1) % LOGICAL_H,
  r: 0.6 + ((i * 37) % 10) / 6,
  speed: 6 + ((i * 53) % 10),
  drift: ((i * 19) % 10) / 10 - 0.5,
  phase: (i * 2.3) % (Math.PI * 2),
  hue: i % 3,
}));

const MOTE_COLORS = ['rgba(150, 110, 255, 0.55)', 'rgba(90, 200, 255, 0.5)', 'rgba(255, 120, 200, 0.45)'];

function roundedPath(ctx, points, radius) {
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
}

// The dark campus backdrop — a vignetted gradient plus two silhouetted
// school-building wings in the far corners, so the path reads as cutting
// through a real place instead of floating on a flat void.
function drawBackground(ctx) {
  const grad = ctx.createRadialGradient(
    LOGICAL_W / 2, LOGICAL_H / 2, 80,
    LOGICAL_W / 2, LOGICAL_H / 2, LOGICAL_W * 0.75,
  );
  grad.addColorStop(0, '#141225');
  grad.addColorStop(0.55, '#0a0916');
  grad.addColorStop(1, '#040309');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);

  // Faint ground grid, like PE-court lines swallowed by the dark.
  ctx.strokeStyle = 'rgba(140, 110, 220, 0.05)';
  ctx.lineWidth = 1;
  for (let x = 0; x < LOGICAL_W; x += 40) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, LOGICAL_H); ctx.stroke();
  }
  for (let y = 0; y < LOGICAL_H; y += 40) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(LOGICAL_W, y); ctx.stroke();
  }

  drawSchoolSilhouette(ctx, -40, -30, 1);
  drawSchoolSilhouette(ctx, LOGICAL_W - 250, LOGICAL_H - 190, -1);
}

function drawSchoolSilhouette(ctx, x, y, flip) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(flip, 1);
  ctx.fillStyle = 'rgba(15, 10, 30, 0.85)';
  ctx.beginPath();
  ctx.moveTo(0, 220);
  ctx.lineTo(0, 90);
  ctx.lineTo(60, 40);
  ctx.lineTo(120, 90);
  ctx.lineTo(120, 60);
  ctx.lineTo(170, 60);
  ctx.lineTo(170, 220);
  ctx.closePath();
  ctx.fill();
  // A few glowing broken windows.
  ctx.fillStyle = 'rgba(180, 130, 255, 0.35)';
  [[20, 120], [50, 150], [90, 130], [140, 160]].forEach(([wx, wy]) => {
    ctx.fillRect(wx, wy, 14, 18);
  });
  ctx.restore();
}

// The route itself — a wide dark-purple ribbon with a brighter animated
// pulse running down its center and a soft outer glow, so it visibly
// carries cursed energy instead of just being a paved walkway.
function drawPath(ctx, t) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.shadowColor = 'rgba(130, 90, 255, 0.55)';
  ctx.shadowBlur = 22;
  ctx.strokeStyle = 'rgba(40, 20, 70, 0.92)';
  ctx.lineWidth = 54;
  roundedPath(ctx, PATH);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.strokeStyle = 'rgba(80, 40, 120, 0.9)';
  ctx.lineWidth = 46;
  roundedPath(ctx, PATH);
  ctx.stroke();

  // Cracked-edge texture — thin lighter lines just inside the border.
  ctx.strokeStyle = 'rgba(180, 140, 255, 0.18)';
  ctx.lineWidth = 44;
  roundedPath(ctx, PATH);
  ctx.stroke();

  // Center energy line, pulsing brightness via a slow sine.
  const pulse = 0.55 + 0.35 * Math.sin(t * 2.2);
  ctx.strokeStyle = `rgba(180, 220, 255, ${pulse})`;
  ctx.lineWidth = 4;
  roundedPath(ctx, PATH);
  ctx.stroke();

  // Traveling glyph pips down the centerline for extra "cursed circuitry"
  // motion, offset by time so they crawl from portal to exit.
  ctx.fillStyle = 'rgba(220, 200, 255, 0.85)';
  const segCount = 26;
  for (let i = 0; i < segCount; i++) {
    const frac = ((i / segCount) + (t * 0.06)) % 1;
    const p = pointOnPolyline(PATH, frac);
    if (!p) continue;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

function pointOnPolyline(points, frac) {
  let total = 0;
  const segLens = [];
  for (let i = 1; i < points.length; i++) {
    const l = Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    segLens.push(l);
    total += l;
  }
  let target = frac * total;
  for (let i = 0; i < segLens.length; i++) {
    if (target <= segLens[i]) {
      const t2 = segLens[i] > 0 ? target / segLens[i] : 0;
      const a = points[i], b = points[i + 1];
      return { x: a.x + (b.x - a.x) * t2, y: a.y + (b.y - a.y) * t2 };
    }
    target -= segLens[i];
  }
  return null;
}

// The spawn portal — a swirling violet vortex at the path's start.
function drawPortal(ctx, t) {
  const p = PATH[0];
  ctx.save();
  ctx.translate(p.x + 40, p.y);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 50);
  glow.addColorStop(0, 'rgba(200, 150, 255, 0.9)');
  glow.addColorStop(0.5, 'rgba(120, 60, 200, 0.45)');
  glow.addColorStop(1, 'rgba(120, 60, 200, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 50, 0, Math.PI * 2); ctx.fill();

  for (let i = 0; i < 3; i++) {
    ctx.save();
    ctx.rotate(t * (1.2 + i * 0.4) + i * 2);
    ctx.strokeStyle = `rgba(220, 190, 255, ${0.5 - i * 0.12})`;
    ctx.lineWidth = 2.5 - i * 0.5;
    ctx.beginPath();
    ctx.ellipse(0, 0, 30 - i * 6, 14 - i * 3, 0, 0, Math.PI * 1.5);
    ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// The exit — the Faculty Lounge door, a warm gold glow standing in
// contrast to the cursed-purple path leading up to it.
function drawExit(ctx) {
  const p = PATH[PATH.length - 1];
  ctx.save();
  ctx.translate(p.x - 45, p.y);
  const glow = ctx.createRadialGradient(0, 0, 4, 0, 0, 46);
  glow.addColorStop(0, 'rgba(255, 224, 160, 0.85)');
  glow.addColorStop(1, 'rgba(255, 224, 160, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 46, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#2c1e10';
  ctx.strokeStyle = 'rgba(255, 214, 112, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-16, -30, 32, 55, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = 'rgba(255, 214, 112, 0.9)';
  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🏫', 0, -2);
  ctx.restore();
}

function drawMotes(ctx, t) {
  for (const m of MOTES) {
    const y = ((m.y - t * m.speed) % (LOGICAL_H + 20) + LOGICAL_H + 20) % (LOGICAL_H + 20) - 10;
    const x = m.x + Math.sin(t * 0.5 + m.phase) * 10 * m.drift;
    ctx.fillStyle = MOTE_COLORS[m.hue];
    ctx.beginPath();
    ctx.arc(x, y, m.r, 0, Math.PI * 2);
    ctx.fill();
  }
}

// A faint magic-circle glyph marking each empty placement slot — brighter
// and slightly larger when it's a valid drop target for whatever's
// currently selected in the shop (see ui/shop.js).
function drawSlots(ctx, occupiedIds, hoverId, canPlace, t) {
  for (const slot of TOWER_SLOTS) {
    if (occupiedIds.has(slot.id)) continue;
    const isHover = slot.id === hoverId;
    const r = 26 + (isHover ? 4 : 0);
    ctx.save();
    ctx.translate(slot.x, slot.y);
    ctx.rotate(t * 0.3);
    ctx.strokeStyle = isHover
      ? (canPlace ? 'rgba(140, 255, 200, 0.9)' : 'rgba(255, 110, 110, 0.9)')
      : 'rgba(160, 140, 220, 0.35)';
    ctx.lineWidth = isHover ? 2.4 : 1.4;
    ctx.setLineDash([4, 5]);
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.restore();
  }
}

export function drawMap(ctx, t) {
  drawBackground(ctx);
  drawMotes(ctx, t);
  drawPath(ctx, t);
  drawPortal(ctx, t);
  drawExit(ctx);
}

export function drawTowerSlots(ctx, occupiedIds, hoverId, canPlace, t) {
  drawSlots(ctx, occupiedIds, hoverId, canPlace, t);
}
