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

// Must match game/engine.js's ATTACK_FLASH_TIME — there's no shared
// import between the two, same as drawUnit's existing hardcoded 0.15
// below for the hit-flash window (game/engine.js's applyDamageToUnit).
const FLASH_TIME = 0.18;

// Sub-frame easing for the attack flash: 0 at the instant it starts, 1 at
// the instant it ends. Rather than holding one static extended pose for
// the whole window, the arm snaps out PAST full extension, springs back
// to it, holds, then eases into a slight recoil right at the end — a
// thrown punch, not a limb teleporting into a pose.
function easeOutBack(x) {
  const c1 = 1.70158, c3 = c1 + 1;
  return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
}
function attackReach(pt) {
  if (pt < 0.4) return easeOutBack(pt / 0.4);
  if (pt < 0.7) return 1;
  return 1 - ((pt - 0.7) / 0.3) * 0.2;
}

// A procedural arm drawn on top of the flat sprite art (which has none) —
// invisible until the attack flash, then it snaps from a cocked-at-the-
// ribs start straight through to a full extended jab along `attackReach`'s
// curve, thicker than a resting limb for a bit more punch.
function drawPunchArm(ctx, shoulderX, shoulderY, reach, scale, skin, outline, outlineWidth) {
  const s = scale;
  const cockedHandX = shoulderX - 4 * s, cockedHandY = shoulderY + 7 * s;
  const cockedElbowX = shoulderX - 8 * s, cockedElbowY = shoulderY + 2 * s;
  const extHandX = shoulderX + 20 * s, extHandY = shoulderY - 1.5 * s;
  const extElbowX = shoulderX + 9 * s, extElbowY = shoulderY - 3 * s;
  const handX = cockedHandX + (extHandX - cockedHandX) * reach;
  const handY = cockedHandY + (extHandY - cockedHandY) * reach;
  const elbowX = cockedElbowX + (extElbowX - cockedElbowX) * reach;
  const elbowY = cockedElbowY + (extElbowY - cockedElbowY) * reach;
  drawJointedLimb(ctx, shoulderX, shoulderY, elbowX, elbowY, handX, handY, 3.6 * s, skin, outline, outlineWidth);
}

// The "67!" gesture's two-arms-up flourish — both hands snap up past the
// head and spring back into place the same way the punch does, then
// shiver in place for the rest of the hold (a fist-pump shake, not a
// frozen pose) while "67!" is up on screen.
function drawRaiseArms(ctx, originX, shoulderY, headCenterY, reach, shakeX, scale, skin, outline, outlineWidth) {
  const s = scale;
  const backShoulderX = originX - 6 * s;
  const frontShoulderX = originX + 6 * s;
  const startBackX = backShoulderX - 2 * s, startBackY = shoulderY + 5 * s;
  const startFrontX = frontShoulderX + 2 * s, startFrontY = shoulderY + 5 * s;
  const upBackX = originX - 16 * s, upBackY = headCenterY - 5 * s;
  const upFrontX = originX + 16 * s, upFrontY = headCenterY - 5 * s;
  const backHandX = startBackX + (upBackX - startBackX) * reach - shakeX;
  const backHandY = startBackY + (upBackY - startBackY) * reach;
  const frontHandX = startFrontX + (upFrontX - startFrontX) * reach + shakeX;
  const frontHandY = startFrontY + (upFrontY - startFrontY) * reach;
  drawJointedLimb(ctx, backShoulderX, shoulderY, (backShoulderX + backHandX) / 2, (shoulderY + backHandY) / 2, backHandX, backHandY, 3.6 * s, skin, outline, outlineWidth);
  drawJointedLimb(ctx, frontShoulderX, shoulderY, (frontShoulderX + frontHandX) / 2, (shoulderY + frontHandY) / 2, frontHandX, frontHandY, 3.6 * s, skin, outline, outlineWidth);
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
    // cycle) with a springy squash at the bottom of each bounce, on top of
    // which the torso only counter-sways a little while the two legs are
    // animated as separate pieces (see drawLeg below) instead of the whole
    // silhouette sliding or shearing as one rigid cutout.
    const bounce = Math.abs(Math.sin(phase));
    const bob = bounce * 4;
    const torsoTilt = Math.sin(phase * 2) * 0.05;

    // Each leg is the SAME full image, clipped to its own half of the
    // lower band and given its own lift/reach/squash a half-cycle out of
    // phase from the other — one leg is airborne (lifted, swung forward)
    // exactly while the other is planted (squashed flat under the body's
    // weight), which is what actually reads as a stride instead of a
    // single shape wobbling in place.
    function drawLeg(sign, legPhase) {
      const swing = Math.sin(legPhase);
      const lift = Math.max(0, swing) * 6;
      const stepX = swing * 5;
      const plant = Math.max(0, -swing);
      const legSquash = 1 - plant * 0.08;
      ctx.save();
      ctx.beginPath();
      const clipX0 = sign < 0 ? -w / 2 - 16 : -1;
      ctx.rect(clipX0, hipY - bob - lift - 1, w / 2 + 17, h - h * HIP_FRAC + lift + 10);
      ctx.clip();
      ctx.translate(stepX, hipY - bob - lift);
      ctx.scale(1, legSquash);
      ctx.drawImage(sprite, -w / 2, top - hipY, w, h);
      ctx.restore();
    }
    drawLeg(-1, phase);
    drawLeg(1, phase + Math.PI);

    // Torso + head: clipped to the band above the hip line, with the
    // bounce and a much smaller counter-tilt than the legs get.
    ctx.save();
    ctx.beginPath();
    // Padded generously on x so the drawn-on punch arm (which reaches
    // well past the art's own silhouette) doesn't get clipped off.
    ctx.rect(-w / 2 - 55, top - bob - 6, w + 110, h * HIP_FRAC + 8);
    ctx.clip();
    ctx.translate(0, -bob);
    ctx.rotate(torsoTilt);

    // The art has no arms at all — none are drawn while idle or walking.
    // One only appears for the actual attack flash (a punch, or the 67
    // Kid's two-hands-up "67!" shout), driven by `attackReach`'s
    // snap-past-full-extension-then-settle curve across that window
    // instead of one static held pose, plus a small forward body lunge so
    // the whole torso leans into the punch instead of just the arm moving.
    const punchT = flashing ? Math.max(0, Math.min(1, 1 - (attackFlashUntil - t) / FLASH_TIME)) : 0;
    const reach = flashing ? attackReach(punchT) : 0;
    const lunge = flashing ? Math.min(1, reach) * 4 * SCALE : 0;
    ctx.translate(lunge, 0);
    ctx.drawImage(sprite, -w / 2, top, w, h);

    if (flashing) {
      const shoulderX = w * 0.16;
      const shoulderY = top + h * 0.4;
      const headCenterY = top + h * 0.19;
      if (gesture === 'raise') {
        // A quick shiver on the hands through the hold portion of the
        // flash — a fist-pump shake instead of a frozen raised pose.
        const shakeX = punchT > 0.4 && punchT < 0.9 ? Math.sin(t * 50) * 1.2 * SCALE : 0;
        drawRaiseArms(ctx, w * 0.02, shoulderY, headCenterY, reach, shakeX, SCALE, skin, outline, outlineWidth);
      } else {
        drawPunchArm(ctx, shoulderX, shoulderY, reach, SCALE, skin, outline, outlineWidth);
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
      ctx.fillRect(-w / 2 - 60, top - bob - 10, w + 120, h + 20);
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
