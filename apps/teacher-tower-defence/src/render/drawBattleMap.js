import { LOGICAL_W, LOGICAL_H } from '../data/maps.js';

// A single-lane side-view battlefield, matching the player's own outdoor
// reference: a blue sky with a soft cloud band, a strip of grass, and a
// dirt layer below it with a jagged torn-earth edge — instead of the
// plain indoor paper/floor look this replaces. The hatched locker-like
// Teacher Portal and horned pedestal-mounted Student Portal (with their
// hand-labeled arrows) are unchanged.
const SKY_TOP = '#6ec3f4';
const SKY_HORIZON = '#bfe6fb';
const CLOUD = 'rgba(255, 255, 255, 0.85)';
const GRASS_TOP = '#8fd35c';
const GRASS_BOTTOM = '#63b23a';
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

function drawCloudPuff(ctx, x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.arc(x + r * 0.9, y + r * 0.25, r * 0.75, 0, Math.PI * 2);
  ctx.arc(x - r * 0.9, y + r * 0.25, r * 0.75, 0, Math.PI * 2);
  ctx.arc(x, y + r * 0.4, r * 0.9, 0, Math.PI * 2);
  ctx.fill();
}

function drawLane(ctx) {
  const sky = ctx.createLinearGradient(0, 0, 0, GRASS_Y);
  sky.addColorStop(0, SKY_TOP);
  sky.addColorStop(1, SKY_HORIZON);
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, LOGICAL_W, GRASS_Y);

  ctx.fillStyle = CLOUD;
  for (let cx = -40; cx < LOGICAL_W + 40; cx += 220) {
    drawCloudPuff(ctx, cx, GRASS_Y - 55, 40);
  }
  ctx.globalAlpha = 0.55;
  for (let cx = 70; cx < LOGICAL_W + 40; cx += 240) {
    drawCloudPuff(ctx, cx, GRASS_Y - 20, 30);
  }
  ctx.globalAlpha = 1;

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
  ctx.beginPath();
  ctx.moveTo(0, DIRT_Y);
  const teeth = 16;
  const toothW = LOGICAL_W / teeth;
  for (let i = 0; i <= teeth; i++) {
    const x = i * toothW;
    ctx.lineTo(x, DIRT_Y + (i % 2 === 0 ? 0 : 16));
  }
  ctx.lineTo(LOGICAL_W, LOGICAL_H);
  ctx.lineTo(0, LOGICAL_H);
  ctx.closePath();
  ctx.fill();
}

// A hand-labeled arrow pointing straight down at a portal, exactly like
// the "Teacher Portal" / "Student Portal" call-outs in the sketch.
function drawLabelArrow(ctx, x, labelY, tipY, text, align) {
  ctx.save();
  ctx.fillStyle = '#241708';
  ctx.font = '700 13px "Baloo 2", sans-serif';
  ctx.textAlign = align;
  ctx.fillText(text, x, labelY);

  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(x, labelY + 8);
  ctx.lineTo(x, tipY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - 5, tipY - 7);
  ctx.lineTo(x, tipY);
  ctx.lineTo(x + 5, tipY - 7);
  ctx.stroke();
  ctx.restore();
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

  drawLabelArrow(ctx, p.x - 6, p.y - 122, p.y - 94, 'Teacher Portal', 'left');
}

// The Student Portal — your base. Light and mostly blank like the sketch
// (not a dark slab), sitting on a small pedestal, with two curved horns
// on a flat lid and its own labeled arrow.
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

  drawLabelArrow(ctx, p.x + 6, p.y - 132, p.y - 92, 'Student Portal', 'right');

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
