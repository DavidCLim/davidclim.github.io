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

// A dedicated figure for the Starter Student only. Rebuilt around the
// same technique Hyper Fishies' own player character uses (see
// hyper-fishies/src/render/limbs.js drawJointedLimb + drawPlayer.js):
// a symmetric body — both arms, both legs, both drawn the same as their
// mirror — animated with a walking bob (legs swing opposite each other,
// arms swing opposite the legs), plus a subtle whole-body lean synced to
// the stride, instead of a one-sided "true profile" pose built from
// staggered front/back limbs. Each limb is one thick rounded stroke
// through pivot -> joint -> tip (lineCap/lineJoin: round handles the
// elbow/knee bend natively, no separate seam) with a small end-cap
// circle for the hand/foot, exactly like drawJointedLimb. Direction is
// carried entirely by the outer ctx.scale(dir<0?-1:1,1) flip in
// drawUnit.js plus this lean, not by an asymmetric silhouette.
// drawHumanBody (used by teachers) is untouched.
function drawJointedLimb(ctx, x0, y0, x1, y1, x2, y2, thickness, color, outline, outlineWidth) {
  ctx.strokeStyle = outline;
  ctx.lineWidth = thickness + outlineWidth * 2;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.fillStyle = color;
  ctx.strokeStyle = outline;
  ctx.lineWidth = outlineWidth;
  ctx.beginPath();
  ctx.arc(x2, y2, thickness * 0.42, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

export function drawStudentBody(ctx, scale = 1, accent, phase = 0, lean = 0.12, punching = false, windup = 0, gesture = 'punch') {
  const s = scale;
  const skin = ctx.fillStyle;
  const outline = ctx.strokeStyle;
  const outlineWidth = ctx.lineWidth;
  const trim = accent || skin;
  const stride = Math.sin(phase);

  // A constant forward lean toward local +x (the direction the outer
  // ctx.scale(dir<0?-1:1,1) flip in drawUnit.js treats as "forward"), on
  // top of Hyper Fishies' own stride wobble (ctx.rotate(lean)). With no
  // face to turn toward the target the way Hyper Fishies' beard/eyes do,
  // this lean is what makes the shirt/whole body read as oriented toward
  // wherever the unit is actually facing, instead of standing bolt
  // upright no matter which way it's walking. Callers that want the
  // figure dead-center instead (a portrait) pass lean=0.
  ctx.save();
  ctx.rotate(lean + stride * 0.05);

  function drawLeg(hipX, hipY, swing) {
    const kneeX = hipX + Math.sin(swing) * 6 * s;
    const kneeY = hipY + Math.cos(swing) * 6 * s;
    const footX = kneeX + Math.sin(swing * 1.3) * 6 * s;
    const footY = kneeY + Math.cos(swing * 1.3) * 6 * s;
    drawJointedLimb(ctx, hipX, hipY, kneeX, kneeY, footX, footY, 3.6 * s, skin, outline, outlineWidth);
  }

  const legSwing = stride * 0.5;
  drawLeg(-3 * s, 6 * s, -legSwing);
  drawLeg(3 * s, 6 * s, legSwing);

  // torso — narrow, with a V-neck collar
  ctx.fillStyle = skin;
  ctx.strokeStyle = outline;
  ctx.lineWidth = outlineWidth;
  ctx.beginPath();
  ctx.moveTo(-6 * s, -11 * s);
  ctx.lineTo(-6.5 * s, 6 * s);
  ctx.quadraticCurveTo(-6.5 * s, 8 * s, -4 * s, 8 * s);
  ctx.lineTo(4 * s, 8 * s);
  ctx.quadraticCurveTo(6.5 * s, 8 * s, 6.5 * s, 6 * s);
  ctx.lineTo(6 * s, -11 * s);
  ctx.quadraticCurveTo(0, -9 * s, -6 * s, -11 * s);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // V-neck collar line — centered, matching the now-upright (lean=0)
  // body; direction is carried entirely by the outer L/R flip in
  // drawUnit.js, not by skewing the collar off-center.
  ctx.strokeStyle = outline;
  ctx.lineWidth = 1.3 * s;
  ctx.beginPath();
  ctx.moveTo(-3.5 * s, -10.5 * s);
  ctx.lineTo(0, -5.5 * s);
  ctx.lineTo(3.5 * s, -10.5 * s);
  ctx.stroke();

  // buttons down the front, below the collar
  ctx.fillStyle = 'rgba(0,0,0,0.4)';
  ctx.beginPath(); ctx.arc(0, -2 * s, 1.1 * s, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, 2.5 * s, 1.1 * s, 0, Math.PI * 2); ctx.fill();

  // shorts — a band across the waist, just above the legs
  ctx.fillStyle = trim;
  ctx.beginPath();
  ctx.moveTo(-6.3 * s, 3 * s);
  ctx.lineTo(6.3 * s, 3 * s);
  ctx.lineTo(6 * s, 8 * s);
  ctx.lineTo(-6 * s, 8 * s);
  ctx.closePath();
  ctx.fill();

  // arms swing opposite the legs, same as Hyper Fishies' player — a
  // straight shoulder-to-hand stroke (the 3-point helper collapses to a
  // straight line when the midpoint sits exactly on it), not a bent elbow.
  function drawArm(shoulderX, swing, reach) {
    const shoulderY = -9 * s;
    const handX = shoulderX + Math.sin(swing) * reach * s;
    const handY = shoulderY + Math.cos(swing) * reach * s;
    const midX = shoulderX + (handX - shoulderX) * 0.5;
    const midY = shoulderY + (handY - shoulderY) * 0.5;
    drawJointedLimb(ctx, shoulderX, shoulderY, midX, midY, handX, handY, 3 * s, skin, outline, outlineWidth);
  }
  const armSwing = -legSwing;
  if (gesture === 'raise') {
    // Both hands go up near the head instead of a punch — the "67!"
    // meme gesture — chambering up as `windup` ramps toward 1, fully
    // raised for the brief `punching` flash, interpolated in from each
    // arm's own normal walk-swing pose.
    const t = punching ? 1 : windup;
    const raiseSwing = Math.PI * 0.92;
    const raiseReach = 8;
    const backSwing = -armSwing + (raiseSwing - (-armSwing)) * t;
    const backReach = 9 + (raiseReach - 9) * t;
    const frontSwing = armSwing + (raiseSwing - armSwing) * t;
    const frontReach = 9 + (raiseReach - 9) * t;
    drawArm(-6 * s, backSwing, backReach);
    drawArm(6 * s, frontSwing, frontReach);
  } else {
    drawArm(-6 * s, -armSwing, 9);

    // The front (local +x) arm — the one that ends up leading after
    // drawUnit.js's L/R flip — throws an actual boxer's jab instead of
    // just swinging to a wide angle: elbow tucks in and the fist
    // chambers back near the ribs as `windup` ramps toward 1, then the
    // elbow straightens and the fist drives straight forward past the
    // shoulder for the brief `punching` flash. A real elbow joint (not a
    // straight shoulder-to-fist line) is what sells "wind up, then
    // strike" instead of a limb just rotating to a strange angle.
    const shoulderX = 6 * s;
    const shoulderY = -9 * s;
    const neutralHandX = shoulderX + Math.sin(armSwing) * 9 * s;
    const neutralHandY = shoulderY + Math.cos(armSwing) * 9 * s;
    const neutralElbowX = shoulderX + (neutralHandX - shoulderX) * 0.5;
    const neutralElbowY = shoulderY + (neutralHandY - shoulderY) * 0.5;

    let handX, handY, elbowX, elbowY;
    if (punching) {
      // Full extension, fist leading, elbow only slightly bent forward.
      handX = shoulderX + 15 * s;
      handY = shoulderY - 1 * s;
      elbowX = shoulderX + 8 * s;
      elbowY = shoulderY - 2.5 * s;
    } else {
      // Chambered: fist pulled back near the ribs, elbow flared out
      // behind — interpolated in from the neutral walk-swing pose.
      const cockedHandX = shoulderX - 3.5 * s;
      const cockedHandY = shoulderY + 6 * s;
      const cockedElbowX = shoulderX - 7 * s;
      const cockedElbowY = shoulderY + 1.5 * s;
      handX = neutralHandX + (cockedHandX - neutralHandX) * windup;
      handY = neutralHandY + (cockedHandY - neutralHandY) * windup;
      elbowX = neutralElbowX + (cockedElbowX - neutralElbowX) * windup;
      elbowY = neutralElbowY + (cockedElbowY - neutralElbowY) * windup;
    }
    drawJointedLimb(ctx, shoulderX, shoulderY, elbowX, elbowY, handX, handY, 3 * s, skin, outline, outlineWidth);
  }

  ctx.fillStyle = skin;
  ctx.strokeStyle = outline;
  ctx.lineWidth = outlineWidth;
  ctx.restore();
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
// reads as the same limb, just repositioned. `scale` matches whatever the
// caller drew the body at (drawUnit.js's SCALE) — every coordinate here
// was originally tuned for the old scale-1 body and needs to grow with it
// or it ends up disconnected from the shoulder.
export function drawArm(ctx, toX, toY, color, accent, scale = 1) {
  const s = scale;
  ctx.save();
  ctx.strokeStyle = color || 'rgba(0,0,0,0.55)';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3 * s;
  ctx.beginPath();
  ctx.moveTo(4.5 * s, -9 * s);
  ctx.lineTo(toX * s, toY * s);
  ctx.stroke();
  if (accent) {
    const cuffX = 4.5 * s + (toX * s - 4.5 * s) * 0.7;
    const cuffY = -9 * s + (toY * s + 9 * s) * 0.7;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 4 * s;
    ctx.beginPath();
    ctx.moveTo(cuffX - 1.4 * s, cuffY - 1.4 * s);
    ctx.lineTo(cuffX + 1.4 * s, cuffY + 1.4 * s);
    ctx.stroke();
  }
  ctx.restore();
}

// A held prop appropriate to the unit's combat archetype — a wand for
// pierce, a lobbed ball for splash, a glowing ring for domain units,
// nothing for plain ranged units or melee ones (the Starter Student
// punches with its own arm — see drawStudentBody's `punching` — not a
// third held-weapon limb).
export function drawProp(ctx, kind, bodyColor, accent, scale = 1) {
  const s = scale;
  ctx.save();
  ctx.lineCap = 'round';
  switch (kind) {
    case 'pierce':
      drawArm(ctx, 19, -11, bodyColor, accent, s);
      ctx.strokeStyle = '#fff6ea';
      ctx.lineWidth = 2 * s;
      ctx.beginPath(); ctx.moveTo(15 * s, -8 * s); ctx.lineTo(23 * s, -14 * s); ctx.stroke();
      break;
    case 'splash':
      drawArm(ctx, 16, -9, bodyColor, accent, s);
      ctx.fillStyle = '#fff6ea';
      ctx.strokeStyle = 'rgba(0,0,0,0.4)';
      ctx.lineWidth = 1.2 * s;
      ctx.beginPath(); ctx.arc(18 * s, -12 * s, 4 * s, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      break;
    case 'domain':
      ctx.strokeStyle = 'rgba(255,255,255,0.55)';
      ctx.lineWidth = 1.4 * s;
      ctx.beginPath(); ctx.arc(0, -8 * s, 16 * s, 0, Math.PI * 2); ctx.stroke();
      break;
    default:
      // Plain ranged units stay empty-handed — the two resting arms
      // drawStudentBody already drew are enough.
      break;
  }
  ctx.restore();
}
