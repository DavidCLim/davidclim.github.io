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

// A soft pulsing halo behind a base — additive blending so it reads as
// light rather than a flat colored disc — plus a handful of motes that
// rise, fade in, then fade out on a loop. Both bases get this treatment
// (tinted to match their side) so they read as actual living objectives
// instead of static painted props.
function drawGlowAura(ctx, x, y, t, rgb, radius) {
  // Plain alpha blending, not additive — against a bright sky, "lighter"
  // compositing just pushes already-light pixels toward white instead of
  // reading as a colored glow, so a normal soft-edged tinted disc shows
  // up far more reliably here.
  const pulse = 0.75 + Math.sin(t * 1.6) * 0.2;
  const r = radius * pulse;
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, `rgba(${rgb}, 0.5)`);
  g.addColorStop(0.55, `rgba(${rgb}, 0.22)`);
  g.addColorStop(1, `rgba(${rgb}, 0)`);
  ctx.save();
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawRisingMotes(ctx, x, y, t, rgb, count, spreadX, riseHeight, cycle) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 12.9898;
    const phase = (((t + seed * 3.7) % cycle) + cycle) % cycle / cycle;
    const px = x + Math.sin(seed) * spreadX;
    const py = y - phase * riseHeight;
    ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.85;
    ctx.fillStyle = `rgb(${rgb})`;
    ctx.beginPath();
    ctx.arc(px, py, 1.6 + (i % 3) * 0.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

// The Teacher's Base — an actual squat fortress tower (a wide stone
// plinth, a tapered hatched body, crenellated battlements, and a
// glowing-eyed arched doorway with a hanging sign) instead of one flat
// rounded rectangle. The tower's taper + battlements are what read as
// "a base" at a glance instead of "a slab."
function drawTeacherBase(ctx, p, theme, baseState, t) {
  const { hp, maxHp, shakeUntil, flashUntil } = baseState;
  const { dx, dy } = shakeOffset(t, shakeUntil);

  drawGlowAura(ctx, p.x, p.y - 45, t, '124, 58, 237', 90);
  drawRisingMotes(ctx, p.x, p.y - 95, t + 100, '150, 110, 220', 5, 20, 95, 3.2);

  ctx.save();
  ctx.translate(p.x + dx, p.y + dy);

  // Stone foundation plinth — wider than the tower, grounding it as a
  // real structure sitting on the earth instead of floating.
  ctx.fillStyle = '#170f07';
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-40, 14); ctx.lineTo(40, 14); ctx.lineTo(30, -2); ctx.lineTo(-30, -2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-36, 7); ctx.lineTo(36, 7); ctx.stroke();

  // Tapered tower body — narrower at the top than the base.
  const TOWER = [[-28, -2], [28, -2], [20, -82], [-20, -82]];
  ctx.fillStyle = '#241708';
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(TOWER[0][0], TOWER[0][1]);
  for (const [px2, py2] of TOWER.slice(1)) ctx.lineTo(px2, py2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(TOWER[0][0], TOWER[0][1]);
  for (const [px2, py2] of TOWER.slice(1)) ctx.lineTo(px2, py2);
  ctx.closePath();
  ctx.clip();
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  for (let hx = -24; hx < 26; hx += 6) {
    ctx.beginPath(); ctx.moveTo(hx, -2); ctx.lineTo(hx, -90); ctx.stroke();
  }
  ctx.restore();

  // Crenellated battlements along the top edge, instead of a flat/rounded
  // top — the single biggest cue that this is a tower, not a rectangle.
  ctx.fillStyle = '#241708';
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2.2;
  for (const mx of [-15, -2.5, 10]) {
    ctx.beginPath();
    ctx.rect(mx, -95, 9, 14);
    ctx.fill(); ctx.stroke();
  }

  // Two jagged corner spikes flanking the battlements, plus a floating,
  // pulsing crystal orb impaled on a spire above them — the roofline
  // silhouette that actually reads as "menacing", not just "boxy".
  ctx.fillStyle = '#241708';
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  for (const sx of [-22, 22]) {
    ctx.beginPath();
    ctx.moveTo(sx - 5, -95);
    ctx.lineTo(sx, -112);
    ctx.lineTo(sx + 5, -95);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, -95); ctx.lineTo(0, -116); ctx.stroke();
  const orbPulse = 0.75 + Math.sin(t * 3) * 0.25;
  const orbGlow = ctx.createRadialGradient(0, -122, 0, 0, -122, 14 * orbPulse);
  orbGlow.addColorStop(0, 'rgba(200, 140, 255, 0.9)');
  orbGlow.addColorStop(1, 'rgba(200, 140, 255, 0)');
  ctx.fillStyle = orbGlow;
  ctx.beginPath(); ctx.arc(0, -122, 14 * orbPulse, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c88cff';
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.arc(0, -122, 6, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  // Arched glowing doorway near the base, with two blinking eye-lights
  // watching from inside it.
  ctx.fillStyle = '#0d0803';
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-9, -2);
  ctx.lineTo(-9, -24);
  ctx.quadraticCurveTo(-9, -34, 0, -34);
  ctx.quadraticCurveTo(9, -34, 9, -24);
  ctx.lineTo(9, -2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  const blinkA = Math.sin(t * 4) > 0.3;
  const blinkB = Math.sin(t * 4 + 2.4) > 0.3;
  ctx.fillStyle = blinkA ? '#ff5c5c' : 'rgba(255,92,92,0.18)';
  ctx.beginPath(); ctx.arc(-4, -22, 2.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = blinkB ? '#ff5c5c' : 'rgba(255,92,92,0.18)';
  ctx.beginPath(); ctx.arc(4, -22, 2.2, 0, Math.PI * 2); ctx.fill();

  // A hanging sign above the door, on a small bracket, instead of text
  // stamped flat onto the body.
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, -34); ctx.lineTo(0, -46); ctx.stroke();
  ctx.fillStyle = '#3a2814';
  ctx.strokeStyle = theme.line;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-23, -58, 46, 14, 2);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#fff6ea';
  ctx.font = '700 9px "Baloo 2", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TEACHER', 0, -51);

  const flash = flashAlpha(t, flashUntil);
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-40, -98, 80, 116, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  // HP bar — same treatment as the Student Base's, so it's clear this
  // structure can actually be worn down, not just a spawn marker.
  const w = 56;
  const pct = Math.max(0, hp / maxHp);
  ctx.save();
  ctx.translate(p.x - w / 2 + dx, p.y - 108 + dy);
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, w, 6);
  ctx.fillStyle = pct > 0.5 ? '#8fe98f' : pct > 0.25 ? '#ffd670' : '#ff6f6f';
  ctx.fillRect(0, 0, w * pct, 6);
  ctx.strokeStyle = '#2c1e10';
  ctx.lineWidth = 1;
  ctx.strokeRect(0, 0, w, 6);
  ctx.restore();
}

// The Student Base — your base. A small bright temple of learning: a
// stone plinth, two columns flanking the doorway, a triangular pediment
// roof with the graduation-cap emblem set into it, and a flag on top —
// instead of one flat-lidded box with two decorative horns.
function drawStudentBase(ctx, p, baseState, t) {
  const { hp, maxHp, shakeUntil, flashUntil } = baseState;
  const { dx, dy } = shakeOffset(t, shakeUntil);

  drawGlowAura(ctx, p.x, p.y - 45, t + 50, '255, 214, 112', 85);
  drawRisingMotes(ctx, p.x, p.y - 40, t, '255, 236, 170', 6, 26, 85, 2.6);

  ctx.save();
  ctx.translate(p.x + dx, p.y + dy);

  // Stone foundation plinth, wider than the building above it.
  ctx.fillStyle = '#c9b98f';
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(-36, 14); ctx.lineTo(36, 14); ctx.lineTo(28, -2); ctx.lineTo(-28, -2);
  ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-32, 7); ctx.lineTo(32, 7); ctx.stroke();

  // Recessed doorway between where the columns will sit.
  ctx.fillStyle = '#e4d6b3';
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(-13, -46, 26, 44, [4, 4, 0, 0]);
  ctx.fill(); ctx.stroke();

  // Two columns flanking the door — base, shaft, capital.
  for (const cx of [-22, 16]) {
    ctx.fillStyle = '#f8f3e5';
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 2;
    ctx.fillRect(cx, -50, 6, 52); ctx.strokeRect(cx, -50, 6, 52);
    ctx.fillRect(cx - 2, -2, 10, 5); ctx.strokeRect(cx - 2, -2, 10, 5);
    ctx.fillRect(cx - 2, -54, 10, 5); ctx.strokeRect(cx - 2, -54, 10, 5);
  }

  // Architrave beam across the column tops.
  ctx.fillStyle = '#f8f3e5';
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.roundRect(-30, -60, 60, 8, 2);
  ctx.fill(); ctx.stroke();

  // Triangular pediment roof, with the cap emblem set into it.
  ctx.fillStyle = '#f8f3e5';
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-34, -60);
  ctx.lineTo(34, -60);
  ctx.lineTo(0, -96);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  // A slow-turning golden sunburst behind the cap — the emblem reading as
  // a proper crest instead of just an emoji stuck on a wall.
  ctx.save();
  ctx.translate(0, -74);
  ctx.rotate(t * 0.3);
  ctx.strokeStyle = 'rgba(255, 214, 112, 0.8)';
  ctx.lineWidth = 1.6;
  for (let i = 0; i < 8; i++) {
    const ang = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(ang) * 7, Math.sin(ang) * 7);
    ctx.lineTo(Math.cos(ang) * 15, Math.sin(ang) * 15);
    ctx.stroke();
  }
  ctx.restore();

  ctx.font = '20px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('🎓', 0, -72);

  // Twin pennants on the corners of the architrave beam, fluttering in
  // sync with the roof flag.
  for (const px3 of [-27, 27]) {
    const pf = Math.sin(t * 3 + px3) * 2.5;
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 1.3;
    ctx.beginPath(); ctx.moveTo(px3, -60); ctx.lineTo(px3, -70); ctx.stroke();
    ctx.fillStyle = '#7cc4ff';
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 1.1;
    ctx.beginPath();
    ctx.moveTo(px3, -70);
    ctx.lineTo(px3 + (px3 < 0 ? -9 : 9) + pf, -66);
    ctx.lineTo(px3, -62);
    ctx.closePath();
    ctx.fill(); ctx.stroke();
  }

  // A small flag fluttering from the peak of the roof.
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(0, -96); ctx.lineTo(0, -112); ctx.stroke();
  const flutter = Math.sin(t * 3) * 3;
  ctx.fillStyle = '#ffd670';
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -112);
  ctx.lineTo(16 + flutter, -108);
  ctx.lineTo(0, -103);
  ctx.closePath();
  ctx.fill(); ctx.stroke();

  const flash = flashAlpha(t, flashUntil);
  if (flash > 0) {
    ctx.globalAlpha = flash;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-36, -100, 72, 116, 4);
    ctx.fill();
    ctx.globalAlpha = 1;
  }
  ctx.restore();

  const w = 56;
  const pct = Math.max(0, hp / maxHp);
  ctx.save();
  ctx.translate(p.x - w / 2 + dx, p.y - 122 + dy);
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
