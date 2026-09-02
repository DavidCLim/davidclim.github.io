import { LOGICAL_W, LOGICAL_H } from '../data/maps.js';

// A single-lane side-view battlefield, matching the player's own outdoor
// reference: a blue sky with a soft cloud band, a strip of grass, and a
// flat dirt layer below it — instead of the plain indoor paper/floor
// look this replaces. The hatched locker-like
// Teacher Portal and horned pedestal-mounted Student Portal are unchanged
// — the "Teacher Portal"/"Student Portal" label arrows were only ever
// annotations on the player's own sketch to identify which building was
// which, not a UI element meant to ship in the game, so they're gone.
const SKY_TOP = '#5fbdf7';
const SKY_HORIZON = '#e3f4fc';
const GRASS_TOP = '#a9e065';
const GRASS_BOTTOM = '#7cc244';
const GRASS_LINE = '#4a8c2a';
const DIRT_TOP = '#8a5a34';
const DIRT_BOTTOM = '#5c3a20';

const THEMES = {
  classroom: { line: '#7a3fd6' },
  hallway: { line: '#1f9c7c' },
  lounge: { line: '#c9622a' },
};

const GRASS_Y = 350;
const DIRT_Y = 396;

// A soft, hazy cloud band (blurred radial-gradient blobs melting into
// each other) instead of distinct cartoon puffs — matches the player's
// stage-backdrop reference (sky + soft cloud haze + grass, minus the
// curtains framing it).
function drawCloudBlob(ctx, x, y, rx, ry, alpha) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, ry / rx);
  // gradient defined in local (post-transform) space, centered on the
  // shape it's filling — defining it in the pre-transform space instead
  // double-applies the translate/scale and pushes it off the shape
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx);
  g.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
  g.addColorStop(0.7, `rgba(255, 255, 255, ${alpha * 0.6})`);
  g.addColorStop(1, 'rgba(255, 255, 255, 0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, rx, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCloudBand(ctx) {
  const bandY = GRASS_Y - 60;
  drawCloudBlob(ctx, LOGICAL_W * 0.15, bandY + 25, 150, 70, 0.9);
  drawCloudBlob(ctx, LOGICAL_W * 0.45, bandY, 190, 90, 0.95);
  drawCloudBlob(ctx, LOGICAL_W * 0.78, bandY + 20, 160, 75, 0.85);
  drawCloudBlob(ctx, LOGICAL_W * 0.95, bandY + 40, 120, 60, 0.7);
  drawCloudBlob(ctx, LOGICAL_W * -0.05, bandY + 35, 120, 60, 0.7);
}

function drawLane(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, GRASS_Y);
  sky.addColorStop(0, SKY_TOP);
  sky.addColorStop(1, SKY_HORIZON);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LOGICAL_W, GRASS_Y);

  drawCloudBand(ctx);

  const grass = ctx.createLinearGradient(0, GRASS_Y, 0, DIRT_Y);
  grass.addColorStop(0, GRASS_TOP);
  grass.addColorStop(1, GRASS_BOTTOM);
  ctx.fillStyle = grass;
  ctx.fillRect(0, GRASS_Y, LOGICAL_W, DIRT_Y - GRASS_Y);
  ctx.strokeStyle = GRASS_LINE;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, GRASS_Y); ctx.lineTo(LOGICAL_W, GRASS_Y); ctx.stroke();

  const dirt = ctx.createLinearGradient(0, DIRT_Y, 0, LOGICAL_H);
  dirt.addColorStop(0, DIRT_TOP);
  dirt.addColorStop(1, DIRT_BOTTOM);
  ctx.fillStyle = dirt;
  ctx.fillRect(0, DIRT_Y, LOGICAL_W, LOGICAL_H - DIRT_Y);
  ctx.closePath();
  ctx.fill();
}

// The Teacher Portal — a tall hatched locker teachers step out of,
// matching the player's own sketch (a dark, heavily-hatched slab with
// "TEACHER" written on the front and a labeled arrow pointing at it).
function drawTeacherPortal(ctx, p, theme) {
  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.fillStyle = '#241708';
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-24, -92, 48, 102, 4);
  ctx.fill(); ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.roundRect(-24, -92, 48, 102, 4);
  ctx.clip();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  for (let hx = -19; hx < 24; hx += 6) {
    ctx.beginPath(); ctx.moveTo(hx, -92); ctx.lineTo(hx, 10); ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = '#fff6ea';
  ctx.font = '700 9px "Baloo 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('TEACHER', 0, -72);
  ctx.restore();
}

// The Student Portal — your base. Light and mostly blank like the sketch
// (not a dark slab), sitting on a small pedestal, with two curved horns
// on a flat lid.
function drawStudentPortal(ctx, p, hp, maxHp) {
  ctx.save();
  ctx.translate(p.x, p.y);

  ctx.fillStyle = '#d8cba8';
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 2;
  ctx.fillRect(-20, 0, 6, 26); ctx.strokeRect(-20, 0, 6, 26);
  ctx.fillRect(14, 0, 6, 26); ctx.strokeRect(14, 0, 6, 26);
  ctx.fillRect(-25, -5, 50, 8); ctx.strokeRect(-25, -5, 50, 8);

  ctx.fillStyle = '#f8f3e5';
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.roundRect(-27, -64, 54, 62, 6);
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#f8f3e5';
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-19, -64);
  ctx.quadraticCurveTo(-40, -74, -32, -90);
  ctx.quadraticCurveTo(-25, -76, -12, -66);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(19, -64);
  ctx.quadraticCurveTo(40, -74, 32, -90);
  ctx.quadraticCurveTo(25, -76, 12, -66);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.fillStyle = '#241708';
  ctx.fillRect(-27, -66, 54, 4);

  ctx.font = '22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎓', 0, -30);
  ctx.restore();

  const w = 50;
  const pct = Math.max(0, hp / maxHp);
  ctx.save();
  ctx.translate(p.x - w / 2, p.y - 100);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, 6);
  ctx.fillStyle = pct > 0.5 ? '#8fe98f' : pct > 0.25 ? '#ffd670' : '#ff6f6f';
  ctx.fillRect(0, 0, w * pct, 6);
  ctx.strokeStyle = '#2c1e10';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, 6);
  ctx.restore();
}

export function drawMap(ctx, map, t, base) {
  void t;
  const theme = THEMES[map.theme] || THEMES.classroom;
  drawLane(ctx);
  drawTeacherPortal(ctx, map.spawn, theme);
  drawStudentPortal(ctx, map.base, base.hp, base.maxHp);
}
