import { drawShadow } from './drawShadow.js';
import { resolveAppearance } from './playerAppearance.js';
import { materialColors } from './drawRodIcon.js';
import { toonOutline, TOON_OUTLINE } from './toon.js';

// A rugged outdoorsman fisherman: tan wide-brim hat, a full beard, a
// satchel strap over a tan work vest, blue trousers, and boots — a working
// angler, not a pirate. Calm, simple eyes rather than an exaggerated
// cartoon face. Colors come from playerAppearance.js so this always reads
// as the exact same character as the dock-scene angler.
export function drawPlayer(ctx, player, rodMaterial) {
  const { x, y, facing, moving, animTime } = player;
  const A = resolveAppearance(player.avatar);
  const bob = moving ? Math.sin(animTime * 10) * 2.2 : Math.sin(animTime * 2) * 0.6;
  const lean = moving ? Math.sin(animTime * 10) * 0.05 : 0;
  const rod = materialColors(rodMaterial);

  drawShadow(ctx, x, y + 2, 13, 5.5, 0.36);

  ctx.save();
  ctx.translate(x, y - 4 + bob * 0.2);
  ctx.rotate(lean);

  // Rod slung across the back, tinted by the equipped rod's material
  const rodGrad = ctx.createLinearGradient(-9, -2, 11, -34);
  rodGrad.addColorStop(0, rod.dark);
  rodGrad.addColorStop(1, rod.base);
  ctx.strokeStyle = rodGrad;
  ctx.lineWidth = 1.8;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-9, -2);
  ctx.lineTo(11, -34);
  ctx.stroke();
  if (rod.glow) {
    ctx.fillStyle = rod.glow;
    ctx.globalAlpha = 0.8;
    ctx.beginPath();
    ctx.arc(11, -34, 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  // Boots
  const legOffset = moving ? Math.sin(animTime * 10) * 5 : 0;
  ctx.fillStyle = A.bootDark;
  ctx.beginPath();
  ctx.ellipse(-4, 2 + legOffset * 0.3, 3.6, 6.4, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);
  ctx.beginPath();
  ctx.ellipse(4, 2 - legOffset * 0.3, 3.6, 6.4, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);
  ctx.fillStyle = A.bootCuff;
  ctx.beginPath();
  ctx.ellipse(-4, -1 + legOffset * 0.3, 3.8, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(4, -1 - legOffset * 0.3, 3.8, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trousers, showing above the boot cuffs
  ctx.fillStyle = A.pants;
  ctx.beginPath();
  ctx.moveTo(-8, 2); ctx.lineTo(-7, -6); ctx.lineTo(-1, -6); ctx.lineTo(-1, 2); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(8, 2); ctx.lineTo(7, -6); ctx.lineTo(1, -6); ctx.lineTo(1, 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = A.pantsDark;
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-4.5, 2); ctx.moveTo(4, -6); ctx.lineTo(4.5, 2); ctx.stroke();
  toonOutline(ctx, 1);

  // Shirt (visible at collar and cuffs, beneath the vest)
  ctx.fillStyle = A.shirt;
  ctx.beginPath();
  ctx.moveTo(-8, 4);
  ctx.quadraticCurveTo(-10, -16, -5, -25);
  ctx.quadraticCurveTo(0, -29, 5, -25);
  ctx.quadraticCurveTo(10, -16, 8, 4);
  ctx.closePath();
  ctx.fill();

  // Vest — shorter and open, showing the shirt down the middle
  const vestGrad = ctx.createLinearGradient(0, -26, 0, 2);
  vestGrad.addColorStop(0, A.vestLight);
  vestGrad.addColorStop(1, A.vestDark);
  ctx.fillStyle = vestGrad;
  ctx.beginPath();
  ctx.moveTo(-9, 2);
  ctx.quadraticCurveTo(-11, -14, -6, -23);
  ctx.lineTo(-2, -20);
  ctx.lineTo(-2, 0);
  ctx.lineTo(-9, 2);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.2);
  ctx.beginPath();
  ctx.moveTo(9, 2);
  ctx.quadraticCurveTo(11, -14, 6, -23);
  ctx.lineTo(2, -20);
  ctx.lineTo(2, 0);
  ctx.lineTo(9, 2);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.2);

  // A soft highlight band down the front of the vest — cheap toon shading
  ctx.fillStyle = 'rgba(255,255,255,0.08)';
  ctx.beginPath();
  ctx.moveTo(-8, -2); ctx.lineTo(-6.5, -18); ctx.lineTo(-4.5, -18); ctx.lineTo(-5.5, -2);
  ctx.closePath();
  ctx.fill();

  // Vest stitching
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(-2, -20); ctx.lineTo(-2, 0);
  ctx.moveTo(2, -20); ctx.lineTo(2, 0);
  ctx.stroke();

  // Satchel strap, worn diagonally across the chest
  ctx.strokeStyle = A.strap;
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(-7, -24);
  ctx.lineTo(6, 1);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.7;
  ctx.stroke();

  // Arms — straight (shoulder to hand, no elbow bend), swinging opposite
  // the legs like a natural stride: when the left leg steps, the right arm
  // swings forward with it.
  const armSwing = -legOffset * 1.3;
  ctx.strokeStyle = TOON_OUTLINE;
  ctx.lineWidth = 5.4;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-7, -22); ctx.lineTo(-9, -4 + armSwing); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7, -22); ctx.lineTo(9, -4 - armSwing); ctx.stroke();

  ctx.strokeStyle = '#d8b98c';
  ctx.lineWidth = 4.2;
  ctx.beginPath();
  ctx.moveTo(-7, -22);
  ctx.lineTo(-9, -4 + armSwing);
  ctx.stroke();
  ctx.fillStyle = '#d8b98c';
  ctx.beginPath();
  ctx.arc(-9, -4 + armSwing, 2.3, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1);

  ctx.beginPath();
  ctx.moveTo(7, -22);
  ctx.lineTo(9, -4 - armSwing);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(9, -4 - armSwing, 2.3, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1);

  // Head
  ctx.fillStyle = A.skin;
  ctx.beginPath();
  ctx.arc(0, -32.5, 9.5, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.4);

  // Facing up (away from camera): just the back of the head/hat, no face.
  // Facing left/right/down: beard + eyes shift together toward the side
  // you're facing, like the front of your face turning that way, so the
  // beard actually reads as pointed at whatever direction you're walking.
  if (facing !== 'up') {
    const faceX = facing === 'left' ? -2.4 : facing === 'right' ? 2.4 : 0;
    const squeeze = facing === 'left' || facing === 'right' ? 0.62 : 1;

    ctx.save();
    ctx.translate(faceX, 0);
    ctx.scale(squeeze, 1);

    // Full beard — the single biggest cue that reads as "grizzled outdoor
    // fisherman" instead of a young pirate deckhand.
    ctx.fillStyle = A.beard;
    ctx.beginPath();
    ctx.moveTo(-7.2, -30);
    ctx.quadraticCurveTo(-8.5, -20, -3, -15.5);
    ctx.quadraticCurveTo(0, -13.5, 3, -15.5);
    ctx.quadraticCurveTo(8.5, -20, 7.2, -30);
    ctx.quadraticCurveTo(4, -33.5, 0, -33.5);
    ctx.quadraticCurveTo(-4, -33.5, -7.2, -30);
    ctx.closePath();
    ctx.fill(); toonOutline(ctx, 1.2);
    ctx.strokeStyle = A.beardDark;
    ctx.lineWidth = 0.7;
    ctx.globalAlpha = 0.6;
    for (const dx of [-3, 0, 3]) {
      ctx.beginPath();
      ctx.moveTo(dx, -28);
      ctx.quadraticCurveTo(dx * 1.2, -22, dx * 0.6, -16);
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Wide-brim tan hat — worn the same regardless of facing
  ctx.fillStyle = A.hat;
  ctx.beginPath();
  ctx.ellipse(0, -37.5, 12, 5, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.3);
  ctx.fillStyle = A.hatDark;
  ctx.beginPath();
  ctx.ellipse(0, -38.1, 12, 3.8, 0, 0, Math.PI, true);
  ctx.fill();
  ctx.fillStyle = A.hat;
  ctx.beginPath();
  ctx.ellipse(0, -42, 6.6, 5.8, 0, Math.PI, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.2);
  ctx.fillStyle = A.hatBand;
  ctx.fillRect(-6.6, -39.2, 13.2, 1.9);

  // Face — simple, calm eyes under the hat brim, shifted the same way as
  // the beard. Skipped when facing directly away.
  if (facing !== 'up') {
    const eyeX = facing === 'left' ? -2.8 : facing === 'right' ? 2.8 : 0;
    const spread = facing === 'left' || facing === 'right' ? 0 : 3.1;
    ctx.fillStyle = '#241a10';
    if (spread > 0.01) {
      ctx.beginPath(); ctx.ellipse(eyeX - spread, -33.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(eyeX + spread, -33.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(eyeX, -33.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.restore();
}
