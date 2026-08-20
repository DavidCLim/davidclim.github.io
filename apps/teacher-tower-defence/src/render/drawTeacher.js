// A shared chibi-teacher base silhouette (round head + trapezoid body),
// with a small per-archetype accessory on top so all five towers read as
// "the same character kit, different job" rather than five unrelated
// shapes — glasses for Math, a whistle for Gym, a beret for Art, a cape
// for the Principal.
function drawBase(ctx, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-11, 14);
  ctx.lineTo(-8, -6);
  ctx.lineTo(8, -6);
  ctx.lineTo(11, 14);
  ctx.closePath();
  ctx.fill();
  ctx.beginPath();
  ctx.arc(0, -14, 9, 0, Math.PI * 2);
  ctx.fill();
}

const ACCESSORY = {
  substitute(ctx) {
    ctx.fillStyle = '#5a3f28';
    ctx.fillRect(6, -4, 7, 9);
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    ctx.strokeRect(6, -4, 7, 9);
  },
  math(ctx) {
    ctx.strokeStyle = '#1c1006';
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(-4, -14, 3, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(4, -14, 3, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-1, -14); ctx.lineTo(1, -14); ctx.stroke();
  },
  gym(ctx) {
    ctx.strokeStyle = '#2c1e10';
    ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(0, -8); ctx.lineTo(3, -2); ctx.stroke();
    ctx.fillStyle = '#fff6ea';
    ctx.beginPath(); ctx.ellipse(3, -1, 2.4, 1.8, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fff6ea';
    ctx.fillRect(-9, -19, 18, 3);
  },
  art(ctx) {
    ctx.fillStyle = '#3a2a4a';
    ctx.beginPath();
    ctx.ellipse(0, -20, 9, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#c896ff';
    ctx.beginPath(); ctx.arc(6, -22, 2, 0, Math.PI * 2); ctx.fill();
  },
  principal(ctx) {
    ctx.fillStyle = '#7a1f1f';
    ctx.beginPath();
    ctx.moveTo(-8, -5);
    ctx.lineTo(-2, 2);
    ctx.lineTo(-4, 15);
    ctx.lineTo(0, 8);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#ffd670';
    ctx.beginPath(); ctx.moveTo(-4, -18); ctx.lineTo(4, -18); ctx.lineTo(0, -12); ctx.closePath(); ctx.fill();
  },
};

export function drawTeacher(ctx, tower, t) {
  const { x, y, typeId, color, glow, attackFlashUntil, range, selected } = tower;
  ctx.save();
  ctx.translate(x, y);

  if (selected) {
    ctx.strokeStyle = 'rgba(160, 220, 255, 0.55)';
    ctx.setLineDash([5, 6]);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, range, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // Plinth / magic circle underfoot.
  ctx.save();
  ctx.rotate(t * 0.4);
  ctx.strokeStyle = `${glow}55`;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(0, 15, 15, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  const flashing = attackFlashUntil && attackFlashUntil > t;
  if (flashing) {
    ctx.shadowColor = glow;
    ctx.shadowBlur = 18;
  }

  drawBase(ctx, color);
  const accessory = ACCESSORY[typeId];
  if (accessory) accessory(ctx);

  ctx.shadowBlur = 0;

  // Level pips under the character.
  const level = tower.level || 0;
  for (let i = 0; i <= level; i++) {
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(-6 + i * 6, 22, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.restore();
}

// A ghost/preview version rendered under the cursor while a shop slot is
// selected but not yet placed — same silhouette, half-transparent.
export function drawTeacherGhost(ctx, x, y, typeId, color) {
  ctx.save();
  ctx.globalAlpha = 0.5;
  ctx.translate(x, y);
  drawBase(ctx, color);
  const accessory = ACCESSORY[typeId];
  if (accessory) accessory(ctx);
  ctx.restore();
}
