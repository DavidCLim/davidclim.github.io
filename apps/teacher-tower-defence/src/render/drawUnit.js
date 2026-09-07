import { drawStudentBody, drawHead, drawProp } from './drawFigure.js';

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
// instead — keeps the star/HP-bar sitting correctly relative to the
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

// Must match game/engine.js's ATTACK_FLASH_TIME — there's no shared
// import between the two, same as drawUnit's existing hardcoded 0.15
// below for the hit-flash window (game/engine.js's applyDamageToUnit).
const FLASH_TIME = 0.18;

// The target head-to-feet height every sprite image (the idle art and
// each attack frame) is scaled to, regardless of that image's own native
// size — keeps a unit's silhouette a consistent size next to teachers and
// the base even though every hand-drawn frame was cropped to a slightly
// different bounding box.
const SPRITE_H = 46 * SCALE;
const SPRITE_TOP = -30 * SCALE;

function drawScaledSprite(ctx, img, dx = 0) {
  const w = SPRITE_H * (img.naturalWidth / img.naturalHeight);
  ctx.drawImage(img, -w / 2 + dx, SPRITE_TOP, w, SPRITE_H);
  return w;
}

export function drawUnit(ctx, tower, t) {
  const { x, y, color, accent, attackFlashUntil, attackWindup, hitFlashUntil, star, dir, hp, maxHp, gesture, battleSprite, attackFrames } = tower;
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

  // During the attack flash, step through the player's own hand-drawn
  // attack frames (a punch throw, or the 67 Kid's two-hands-up "67!"
  // shout) instead of the idle art — one frame per quarter of the flash
  // window, the same swap-a-whole-picture approach the idle sprite
  // already uses rather than an arm drawn separately on top of it.
  let attackFrame = null;
  if (flashing && attackFrames && attackFrames.length) {
    const punchT = Math.max(0, Math.min(0.999, 1 - (attackFlashUntil - t) / FLASH_TIME));
    const frameIdx = Math.floor(punchT * attackFrames.length);
    const frameSprite = getSprite(attackFrames[frameIdx]);
    if (frameSprite.complete && frameSprite.naturalWidth) attackFrame = frameSprite;
  }

  const spriteReady = attackFrame || (sprite && sprite.complete && sprite.naturalWidth);

  ctx.save();
  ctx.scale(dir < 0 ? -1 : 1, 1);
  if (spriteReady) {
    // The player's own drawing, sized to a consistent head-to-feet
    // footprint so it doesn't look out of scale next to teachers or the
    // base. The art's own lean faces the opposite way from the outer dir
    // flip's "forward", so it gets one extra horizontal mirror on top of
    // that, scoped to just this block.
    ctx.save();
    ctx.scale(-1, 1);

    let w;
    if (attackFrame) {
      // Held still for the attack — no walk bounce/tilt, since the
      // drawing itself already carries the whole pose.
      w = drawScaledSprite(ctx, attackFrame);
    } else {
      // A single static frame gets its "walking" from a whole-body
      // footstep bounce (double-bounce per stride, since both feet land
      // within one cycle) with a springy squash at the bottom of each
      // bounce, plus a small counter-tilt — applied to the whole image as
      // one piece, not split into separately animated legs.
      const bounce = Math.abs(Math.sin(phase));
      const bob = bounce * 4;
      const squash = 1 - bounce * 0.05;
      const tilt = Math.sin(phase * 2) * 0.05;
      ctx.translate(0, -bob);
      ctx.rotate(tilt);
      ctx.scale(1, squash);
      w = drawScaledSprite(ctx, sprite);
    }

    // Get-hit tint, reapplied as a compositing overlay clipped to the
    // sprite's own opaque pixels instead of a fillStyle swap, so the
    // feedback isn't lost just because the art is a bitmap now. The
    // attack itself no longer needs its own flash tint — the drawn pose
    // already reads as the attack.
    if (hitFlashing) {
      ctx.globalCompositeOperation = 'source-atop';
      ctx.globalAlpha = 0.5;
      ctx.fillStyle = '#ff3b3b';
      ctx.fillRect(-w / 2 - 10, SPRITE_TOP - 10, w + 20, SPRITE_H + 20);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  } else {
    // Body + prop face left/right (mirrored); the star is drawn
    // afterward, unflipped. Flat fill, no gradient/glow — plain 2D like
    // the sketch.
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
