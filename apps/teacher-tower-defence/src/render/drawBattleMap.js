import { LOGICAL_W, LOGICAL_H } from '../data/maps.js';

// A single-lane side-view battlefield, matching the player's own outdoor
// reference: a blue sky with a soft cloud band, a strip of grass, and a
// flat dirt layer below it — instead of the plain indoor paper/floor
// look this replaces. The hatched locker-like Teacher's Base and horned
// pedestal-mounted Student Base are unchanged — the "Teacher Portal"/
// "Student Portal" label arrows were only ever annotations on the
// player's own sketch to identify which building was which, not a UI
// element meant to ship in the game, so they're gone.
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
// curtains framing it). Each cloud now drifts slowly to the right and
// wraps back around, instead of sitting frozen in place.
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

const CLOUDS = [
  { baseX: 0.15, y: 25, rx: 150, ry: 70, alpha: 0.9, speed: 6 },
  { baseX: 0.45, y: 0, rx: 190, ry: 90, alpha: 0.95, speed: 4 },
  { baseX: 0.78, y: 20, rx: 160, ry: 75, alpha: 0.85, speed: 8 },
  { baseX: 0.95, y: 40, rx: 120, ry: 60, alpha: 0.7, speed: 10 },
  { baseX: -0.05, y: 35, rx: 120, ry: 60, alpha: 0.7, speed: 5 },
];

function drawCloudBand(ctx, t) {
  const bandY = GRASS_Y - 60;
  const span = LOGICAL_W + 400;
  for (const c of CLOUDS) {
    const x = (((c.baseX * LOGICAL_W + t * c.speed) % span) + span) % span - 200;
    drawCloudBlob(ctx, x, bandY + c.y, c.rx, c.ry, c.alpha);
  }
}

// Soft diagonal sun rays fanning down from a high corner — cheap
// atmosphere that reads as "bright outdoor afternoon" instead of a flat
// gradient sky doing all the work alone.
function drawSunRays(ctx, t) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  const originX = LOGICAL_W * 0.82;
  const originY = -40;
  const rayCount = 5;
  for (let i = 0; i < rayCount; i++) {
    const wobble = Math.sin(t * 0.15 + i) * 0.03;
    const angle = 2.1 + i * 0.22 + wobble;
    const spread = 0.09;
    const len = 620;
    ctx.save();
    ctx.translate(originX, originY);
    ctx.rotate(angle);
    const g = ctx.createLinearGradient(0, 0, len, 0);
    g.addColorStop(0, 'rgba(255, 250, 210, 0.16)');
    g.addColorStop(1, 'rgba(255, 250, 210, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(len, -len * Math.tan(spread));
    ctx.lineTo(len, len * Math.tan(spread));
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  ctx.restore();
}

// A row of thin grass blades swaying in a light breeze along the
// grass/dirt seam — small, cheap, but it's the difference between a flat
// green rectangle and a lane that feels alive.
const BLADE_COUNT = 34;
function drawGrassBlades(ctx, t) {
  ctx.save();
  ctx.strokeStyle = GRASS_LINE;
  ctx.lineCap = 'round';
  for (let i = 0; i < BLADE_COUNT; i++) {
    const x = (i + 0.5) * (LOGICAL_W / BLADE_COUNT) + Math.sin(i * 7.3) * 8;
    const h = 8 + (i % 3) * 3;
    const sway = Math.sin(t * 1.6 + i * 1.7) * 3.5;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(x, GRASS_Y + 2);
    ctx.quadraticCurveTo(x + sway * 0.6, GRASS_Y - h * 0.6, x + sway, GRASS_Y - h);
    ctx.stroke();
  }
  ctx.restore();
}

function drawLane(ctx, t) {
  const sky = ctx.createLinearGradient(0, 0, 0, GRASS_Y);
  sky.addColorStop(0, SKY_TOP);
  sky.addColorStop(1, SKY_HORIZON);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LOGICAL_W, GRASS_Y);

  drawSunRays(ctx, t);
  drawCloudBand(ctx, t);

  const grass = ctx.createLinearGradient(0, GRASS_Y, 0, DIRT_Y);
  grass.addColorStop(0, GRASS_TOP);
  grass.addColorStop(1, GRASS_BOTTOM);
  ctx.fillStyle = grass;
  ctx.fillRect(0, GRASS_Y, LOGICAL_W, DIRT_Y - GRASS_Y);
  ctx.strokeStyle = GRASS_LINE;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(0, GRASS_Y); ctx.lineTo(LOGICAL_W, GRASS_Y); ctx.stroke();

  drawGrassBlades(ctx, t);

  const dirt = ctx.createLinearGradient(0, DIRT_Y, 0, LOGICAL_H);
  dirt.addColorStop(0, DIRT_TOP);
  dirt.addColorStop(1, DIRT_BOTTOM);
  ctx.fillStyle = dirt;
  ctx.fillRect(0, DIRT_Y, LOGICAL_W, LOGICAL_H - DIRT_Y);
  ctx.closePath();
  ctx.fill();
}

// A brief decaying random jitter while `shakeUntil` is in the future, and
// a fading white overlay while `flashUntil` is — both driven straight off
// a hit's own timestamps (engine.js sets them the instant a punch lands),
// so a base actually reacts to being hit instead of just quietly losing HP.
function shakeOffset(t, shakeUntil) {
  if (!shakeUntil || t > shakeUntil) return { dx: 0, dy: 0 };
  const mag = 4 * Math.max(0, (shakeUntil - t) / 0.22);
  return { dx: (Math.random() - 0.5) * mag, dy: (Math.random() - 0.5) * mag * 0.5 };
}

function flashAlpha(t, flashUntil) {
  if (!flashUntil || t > flashUntil) return 0;
  return 0.55 * Math.max(0, (flashUntil - t) / 0.1);
}

// The Teacher's Base — a tall hatched locker teachers step out of,
// matching the player's own sketch (a dark, heavily-hatched slab with
// "TEACHER" written on the front and a labeled arrow pointing at it).
function drawTeacherBase(ctx, p, theme, baseState, t) {
  const { hp, maxHp, shakeUntil, flashUntil } = baseState;
  const { dx, dy } = shakeOffset(t, shakeUntil);
  ctx.save();
  ctx.translate(p.x + dx, p.y + dy);

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

  const flash = flashAlpha(t, flashUntil);
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-24, -92, 48, 102, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // HP bar — same treatment as the Student Base's, so it's clear this
  // structure can actually be worn down, not just a spawn marker.
  const w = 50;
  const pct = Math.max(0, hp / maxHp);
  ctx.save();
  ctx.translate(p.x - w / 2 + dx, p.y - 100 + dy);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, 6);
  ctx.fillStyle = pct > 0.5 ? '#8fe98f' : pct > 0.25 ? '#ffd670' : '#ff6f6f';
  ctx.fillRect(0, 0, w * pct, 6);
  ctx.strokeStyle = '#2c1e10';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, 6);
  ctx.restore();
}

// The Student Base — your base. Light and mostly blank like the sketch
// (not a dark slab), sitting on a small pedestal, with two curved horns
// on a flat lid.
function drawStudentBase(ctx, p, baseState, t) {
  const { hp, maxHp, shakeUntil, flashUntil } = baseState;
  const { dx, dy } = shakeOffset(t, shakeUntil);
  ctx.save();
  ctx.translate(p.x + dx, p.y + dy);

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

  const flash = flashAlpha(t, flashUntil);
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-27, -90, 54, 116, 6);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  const w = 50;
  const pct = Math.max(0, hp / maxHp);
  ctx.save();
  ctx.translate(p.x - w / 2 + dx, p.y - 100 + dy);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, 6);
  ctx.fillStyle = pct > 0.5 ? '#8fe98f' : pct > 0.25 ? '#ffd670' : '#ff6f6f';
  ctx.fillRect(0, 0, w * pct, 6);
  ctx.strokeStyle = '#2c1e10';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, 6);
  ctx.restore();
}

export function drawMap(ctx, map, t, base, enemyBase) {
  const theme = THEMES[map.theme] || THEMES.classroom;
  drawLane(ctx, t);
  drawTeacherBase(ctx, map.spawn, theme, enemyBase, t);
  drawStudentBase(ctx, map.base, base, t);
}
