// The shared body shape behind every unit and teacher — a round head over
// a soft "footie pajama" body (one blob with a two-leg notch at the
// bottom), matching the actual silhouette in the player's sketches rather
// than an abstract badge shape. Callers set fillStyle/strokeStyle before
// calling these; color-coding is layered on by the caller, not baked in
// here, so the same shape works for a rarity-tinted student or a
// flat-colored teacher.
export function drawBlobBody(ctx, scale = 1) {
  const s = scale;
  ctx.beginPath();
  ctx.moveTo(-9 * s, 15 * s);
  ctx.lineTo(-9 * s, 4 * s);
  ctx.quadraticCurveTo(-13 * s, -3 * s, -7 * s, -10 * s);
  ctx.quadraticCurveTo(0, -14 * s, 7 * s, -10 * s);
  ctx.quadraticCurveTo(13 * s, -3 * s, 9 * s, 4 * s);
  ctx.lineTo(9 * s, 15 * s);
  ctx.lineTo(3 * s, 15 * s);
  ctx.lineTo(3 * s, 7 * s);
  ctx.lineTo(-3 * s, 7 * s);
  ctx.lineTo(-3 * s, 15 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

// The humanoid silhouette from the player's own reference drawing — a
// SIDE-VIEW running figure (one bent arm crossing in front, legs
// staggered mid-stride), not a front-facing symmetric one. Torso tapers
// to a waist, with white sneakers and (when the caller passes an accent
// color) a thin diagonal sash and shorts band. The base fillStyle set by
// the caller is captured as the "skin" color, and accent stays invisible
// (same as skin) if the caller doesn't pass one — so teachers with no
// accent render exactly as before. Callers flip the whole draw via
// ctx.scale(-1,1) to face left/right, so this only needs one fixed pose.
export function drawHumanBody(ctx, scale = 1, accent, phase = 0) {
  const s = scale;
  const skin = ctx.fillStyle;
  const outline = ctx.strokeStyle;
  const trim = accent || skin;
  const stride = Math.sin(phase);
  const legShift = stride * 2.6 * s;
  const armShift = -stride * 2.2 * s;

  // back (trailing) leg, drawn first so the front leg overlaps it
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-4.5 * s, 6.5 * s);
  ctx.lineTo(-8 * s + legShift, 11 * s);
  ctx.lineTo(-4 * s + legShift, 12.5 * s);
  ctx.lineTo(-1 * s, 7 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // torso
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(-7 * s, -12 * s);
  ctx.lineTo(-8 * s, 5 * s);
  ctx.quadraticCurveTo(-8 * s, 8 * s, -5 * s, 8 * s);
  ctx.lineTo(5 * s, 8 * s);
  ctx.quadraticCurveTo(8 * s, 8 * s, 8 * s, 5 * s);
  ctx.lineTo(7 * s, -12 * s);
  ctx.quadraticCurveTo(0, -9 * s, -7 * s, -12 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // sash — a thin diagonal strap over the shoulder
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.moveTo(-6.6 * s, -11.5 * s);
  ctx.lineTo(-4.6 * s, -12 * s);
  ctx.lineTo(2.6 * s, 7.5 * s);
  ctx.lineTo(0.4 * s, 8 * s);
  ctx.closePath();
  ctx.fill();

  // shorts — a band across the waist, just above the legs
  ctx.beginPath();
  ctx.moveTo(-7.3 * s, 2.5 * s);
  ctx.lineTo(7.3 * s, 2.5 * s);
  ctx.lineTo(6.5 * s, 8 * s);
  ctx.lineTo(-6.5 * s, 8 * s);
  ctx.closePath();
  ctx.fill();

  // front leg, forward and bent at the knee (drawn after the torso)
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(3 * s, 6.5 * s);
  ctx.lineTo(8.5 * s - legShift, 10 * s);
  ctx.lineTo(6 * s - legShift, 14 * s);
  ctx.lineTo(0.5 * s, 7 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // one bent arm, crossing down in front of the body — the running pose
  ctx.fillStyle = skin;
  ctx.beginPath();
  ctx.moveTo(4.5 * s, -9 * s);
  ctx.lineTo(8.5 * s + armShift, -3 * s);
  ctx.lineTo(3.5 * s + armShift, 5 * s);
  ctx.lineTo(1.5 * s, -8 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (accent) {
    ctx.strokeStyle = trim;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(4.6 * s + armShift * 0.7, 1.4 * s);
    ctx.lineTo(7 * s + armShift * 0.7, -1.4 * s);
    ctx.stroke();
  }

  // sneakers
  ctx.fillStyle = '#fbfff2';
  ctx.strokeStyle = outline;
  ctx.beginPath(); ctx.ellipse(-5 * s + legShift, 12 * s, 3 * s, 1.7 * s, -0.2, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(6.5 * s - legShift, 13.2 * s, 3.1 * s, 1.8 * s, 0.15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

  ctx.fillStyle = skin;
}

// Two small buttons down the chest, like the blazer in the sketch.
export function drawButtons(ctx, scale = 1) {
  const s = scale;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.arc(0, -6 * s, 1.1 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -1.5 * s, 1.1 * s, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

export function drawRoundBlob(ctx, scale = 1) {
  const s = scale;
  ctx.beginPath();
  ctx.ellipse(0, 4 * s, 13 * s, 11 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawHead(ctx, r = 9, cy = -20) {
  ctx.beginPath();
  ctx.arc(0, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

// A reaching arm that overrides the front resting arm from drawHumanBody
// with a raised/extended pose for units that hold a combat prop. Starts
// from the same shoulder point the front resting arm attaches to, so it
// reads as the same limb, just repositioned.
export function drawArm(ctx, toX, toY, color, accent) {
  ctx.save();
  ctx.strokeStyle = color || 'rgba(0,0,0,0.55)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(4.5, -9);
  ctx.lineTo(toX, toY);
  ctx.stroke();
  if (accent) {
    const cuffX = 4.5 + (toX - 4.5) * 0.7;
    const cuffY = -9 + (toY + 9) * 0.7;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cuffX - 1.4, cuffY - 1.4);
    ctx.lineTo(cuffX + 1.4, cuffY + 1.4);
    ctx.stroke();
  }
  ctx.restore();
}

// A held prop appropriate to the unit's combat archetype — a wand for
// pierce, a club for melee, a lobbed ball for splash, a glowing ring for
// domain units, nothing for plain ranged ones (matches "Starter Student"
// being drawn empty-handed in the sketch).
export function drawProp(ctx, kind, bodyColor, accent) {
  ctx.save();
  ctx.lineCap = 'round';
  switch (kind) {
    case 'pierce':
      drawArm(ctx, 19, -11, bodyColor, accent);
      ctx.strokeStyle = '#fff6ea';
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(15, -8); ctx.lineTo(23, -14); ctx.stroke();
      break;
    case 'melee':
      drawArm(ctx, 17, 4, bodyColor, accent);
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.beginPath(); ctx.ellipse(19, 7, 4.4, 3, 0.6, 0, Math.PI * 2); ctx.fill();
      break;
    case 'splash':
      drawArm(ctx, 16, -9, bodyColor, accent);
      ctx.fillStyle = '#fff6ea';
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.arc(18, -12, 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    case 'domain':
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(0, -8, 16, 0, Math.PI * 2); ctx.stroke();
      break;
    default:
      // Plain ranged units (like the Starter Student) stay empty-handed —
      // the two resting arms drawHumanBody already drew are enough.
      break;
  }
  ctx.restore();
}
