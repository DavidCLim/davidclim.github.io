import { drawStudentBody, drawHead, drawProp, drawJointedLimb } from './drawFigure.js';

// The actual arms-and-legs figure from the sketches (round head + a
// footie-pajama body with a two-leg notch), rarity-tinted, holding a prop
// that matches its combat archetype — a wand, a club, a thrown ball, or a
// glowing domain ring — instead of an icon badge. Flips to face whichever
// side it's fighting toward, for the side-view battle camera.
function archetypeOf(u) {
  if (u.domain) return 'domain';
  if (u.pierce > 1) return 'pierce';
  if (u.melee) return 'melee';
  if (u.splash) return 'splash';
  return 'plain';
}

// Rendered much larger than the old badge-scale towers, so every
// position that used to be a hand-tuned constant is scaled by SCALE
// instead — keeps the pips/star/HP-bar sitting correctly relative to the
// bigger body instead of sinking into it.
const SCALE = 1.8;

// Units drawn from the player's own flat cropped artwork instead of the
// procedural stick-figure (currently the Starter Student and 67 Kid) —
// loaded once per path and cached here, keyed by `battleSprite`. Drawing
// is skipped until an image finishes loading, so a not-yet-ready sprite
// just falls back to the procedural figure for a frame or two rather than
// throwing.
const spriteCache = {};
function getSprite(path) {
  let img = spriteCache[path];
  if (!img) {
    img = new Image();
    img.src = path;
    spriteCache[path] = img;
  }
  return img;
}

// Where the sprite art's torso gives way to its legs, as a fraction of the
// drawn height — split out so the two halves can animate independently
// (a scissoring stride below, a steadier counter-sway above) instead of
// the whole flat image sliding as one rigid cutout.
const HIP_FRAC = 0.6;

// A procedural arm drawn on top of the flat sprite art (which has none),
// reusing the same shoulder/elbow/hand geometry drawStudentBody's punch
// uses so the motion — chamber back on windup, drive forward on the
// attack flash — matches what every procedural unit already does.
function drawPunchArm(ctx, shoulderX, shoulderY, phase, windup, punching, scale, skin, outline, outlineWidth) {
  const s = scale;
  const armSwing = Math.sin(phase) * 0.3;
  const neutralHandX = shoulderX + Math.sin(armSwing) * 9 * s;
  const neutralHandY = shoulderY + Math.cos(armSwing) * 9 * s;
  const neutralElbowX = shoulderX + (neutralHandX - shoulderX) * 0.5;
  const neutralElbowY = shoulderY + (neutralHandY - shoulderY) * 0.5;

  let handX, handY, elbowX, elbowY;
  if (punching) {
    handX = shoulderX + 15 * s;
    handY = shoulderY - 1 * s;
    elbowX = shoulderX + 8 * s;
    elbowY = shoulderY - 2.5 * s;
  } else {
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

// The "67!" gesture's two-arms-up flourish, ported the same way — both
// hands chamber up beside the head as windup ramps toward 1, instead of
// only the punch pose being available to sprite-based units.
function drawRaiseArms(ctx, originX, shoulderY, headCenterY, phase, windup, punching, scale, skin, outline, outlineWidth) {
  const s = scale;
  const armSwing = Math.sin(phase) * 0.3;
  const tRaise = punching ? 1 : windup;
  const backShoulderX = originX - 6 * s;
  const frontShoulderX = originX + 6 * s;
  const backNeutralX = backShoulderX + Math.sin(-armSwing) * 9 * s;
  const backNeutralY = shoulderY + Math.cos(-armSwing) * 9 * s;
  const frontNeutralX = frontShoulderX + Math.sin(armSwing) * 9 * s;
  const frontNeutralY = shoulderY + Math.cos(armSwing) * 9 * s;
  const backHandX = backNeutralX + (originX - 13 * s - backNeutralX) * tRaise;
  const backHandY = backNeutralY + (headCenterY - backNeutralY) * tRaise;
  const frontHandX = frontNeutralX + (originX + 13 * s - frontNeutralX) * tRaise;
  const frontHandY = frontNeutralY + (headCenterY - frontNeutralY) * tRaise;
  drawJointedLimb(ctx, backShoulderX, shoulderY, (backShoulderX + backHandX) / 2, (shoulderY + backHandY) / 2, backHandX, backHandY, 3 * s, skin, outline, outlineWidth);
  drawJointedLimb(ctx, frontShoulderX, shoulderY, (frontShoulderX + frontHandX) / 2, (shoulderY + frontHandY) / 2, frontHandX, frontHandY, 3 * s, skin, outline, outlineWidth);
}

export function drawUnit(ctx, tower, t) {
  const { x, y, color, accent, attackFlashUntil, attackWindup, hitFlashUntil, level, star, dir, hp, maxHp, gesture, battleSprite } = tower;
  ctx.save();

  const flashing = attackFlashUntil && attackFlashUntil > t;
  const hitFlashing = hitFlashUntil && hitFlashUntil > t;
  // A brief knockback flinch away from whatever just hit it (opposite the
  // way it's facing), decaying to 0 over the hit-flash window, plus a red
  // tint — so getting hit by a teacher reads the same as a punch landing,
  // not just a silently shrinking HP bar.
  const hitProgress = hitFlashing ? Math.max(0, (hitFlashUntil - t) / 0.15) : 0;
  const flinchX = -dir * 4 * hitProgress;

  ctx.translate(x + flinchX, y);

  // Idle marching-in-place stride, desynced a little per unit by x so a
  // row of them doesn't all step in lockstep.
  const phase = t * 11 + x * 0.08;

  const sprite = battleSprite ? getSprite(battleSprite) : null;

  ctx.save();
  ctx.scale(dir < 0 ? -1 : 1, 1);
  if (sprite && sprite.complete && sprite.naturalWidth) {
    // The player's own drawing, sized to roughly the same head-to-feet
    // footprint the stick-figure occupied so it doesn't look out of scale
    // next to teachers or the base. The photo's own lean faces the
    // opposite way from the outer dir flip's "forward", so it gets one
    // extra horizontal mirror on top of that, scoped to just this block.
    ctx.save();
    ctx.scale(-1, 1);
    const h = 46 * SCALE;
    const w = h * (sprite.naturalWidth / sprite.naturalHeight);
    const top = -30 * SCALE;
    const hipY = top + h * HIP_FRAC;
    const skin = '#fff6ea';
    const outline = '#241708';
    const outlineWidth = 1.6;

    // A single static frame gets its "walking" from a whole-body footstep
    // bounce (double-bounce per stride, since both feet land within one
    // cycle) with a springy squash at the bottom of each bounce, plus the
    // torso and legs animating independently instead of together: the
    // legs scissor into a shear each way (a real stride, not just a
    // slide) while the torso only counter-sways a little on top of them —
    // the same top-heavier/legs-busier split a real walk cycle has.
    const bounce = Math.abs(Math.sin(phase));
    const bob = bounce * 3;
    const squash = 1 - bounce * 0.05;
    const torsoTilt = Math.sin(phase * 2) * 0.04;
    const legSkew = Math.sin(phase) * 0.16;

    // Legs: clipped to the band below the hip line, sheared around that
    // line so the pants swing like they're actually stepping.
    ctx.save();
    ctx.beginPath();
    ctx.rect(-w / 2 - 12, hipY - bob - 1, w + 24, h - h * HIP_FRAC + 8);
    ctx.clip();
    ctx.translate(0, hipY - bob);
    ctx.transform(1, 0, legSkew, 1, 0, 0);
    ctx.scale(1, squash);
    ctx.drawImage(sprite, -w / 2, top - hipY, w, h);
    ctx.restore();

    // Torso + head: clipped to the band above the hip line, with the
    // bounce and a much smaller counter-tilt than the legs get.
    ctx.save();
    ctx.beginPath();
    // Padded generously on x so the drawn-on punch arm (which reaches
    // well past the art's own silhouette) doesn't get clipped off.
    ctx.rect(-w / 2 - 45, top - bob - 6, w + 90, h * HIP_FRAC + 8);
    ctx.clip();
    ctx.translate(0, -bob);
    ctx.rotate(torsoTilt);
    ctx.drawImage(sprite, -w / 2, top, w, h);

    // The art has no arms at all — none are drawn while idle or walking.
    // One only appears for the instant of the actual attack flash (a punch,
    // or the 67 Kid's two-hands-up "67!" shout), anchored near the
    // neckline, using the torso's own bounce/tilt transform so it stays
    // attached for that one frame instead of floating independently.
    if (flashing) {
      const shoulderX = w * 0.16;
      const shoulderY = top + h * 0.4;
      const headCenterY = top + h * 0.19;
      if (gesture === 'raise') {
        drawRaiseArms(ctx, w * 0.02, shoulderY, headCenterY, phase, 1, true, SCALE, skin, outline, outlineWidth);
      } else {
        drawPunchArm(ctx, shoulderX, shoulderY, phase, 1, true, SCALE, skin, outline, outlineWidth);
      }
    }
    ctx.restore();

    // Same get-hit/attack tint the procedural figure used, reapplied as a
    // compositing overlay clipped to the sprite's own opaque pixels
    // (and the arm just drawn) instead of a fillStyle swap, so the
    // feedback isn't lost just because the art is a bitmap now.
    if (hitFlashing || flashing) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = hitFlashing ? 0.5 : 0.35;
      ctx.fillStyle = hitFlashing ? '#ff3b3b' : '#fff6ea';
      ctx.fillRect(-w / 2 - 10, top - bob - 10, w + 20, h + 20);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  } else {
    // Body + prop face left/right (mirrored); the level pips and star are
    // drawn afterward, unflipped. Flat fill, no gradient/glow — plain 2D
    // like the sketch.
    ctx.fillStyle = hitFlashing ? '#ff8a8a' : flashing ? '#fff6ea' : color;
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 1.6;
    // lean=0 keeps the figure centered/upright in the lane (only the small
    // per-step stride wobble remains) instead of holding the old constant
    // forward tilt. `flashing` snaps the front arm into a punch during the
    // attack window; `attackWindup` pulls it back into an anticipation pose
    // in the moments just before that, instead of the punch appearing out
    // of nowhere.
    drawStudentBody(ctx, SCALE, accent, phase, 0, flashing, attackWindup || 0, gesture || 'punch');
    drawHead(ctx, 9 * SCALE, -20 * SCALE);
    drawProp(ctx, archetypeOf(tower), color, accent, SCALE);
  }
  ctx.restore();

  const lvl = level || 0;
  for (let i = 0; i <= lvl; i++) {
    ctx.fillStyle = '#fff6ea';
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc((-6 + i * 6) * SCALE, 22 * SCALE, 2 * SCALE, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }

  if (star) {
    ctx.fillStyle = '#ffd670';
    ctx.font = `${Math.round(9 * SCALE)}px sans-serif`;
    ctx.fillText('★'.repeat(star), -6 * SCALE, -30 * SCALE);
  }

  ctx.restore();

  // HP bar, only once damaged — keeps the lane readable when nothing's hurt.
  if (hp < maxHp) {
    const w = 26 * SCALE;
    const pct = Math.max(0, hp / maxHp);
    ctx.save();
    ctx.translate(x - w / 2, y - 42 * SCALE);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, 4);
    ctx.fillStyle = pct > 0.5 ? '#8fe98f' : pct > 0.25 ? '#ffd670' : '#ff6f6f';
    ctx.fillRect(0, 0, w * pct, 4);
    ctx.restore();
  }
}
