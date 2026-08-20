import { drawShadow } from './drawShadow.js';
import { toonOutline, drawStraightArm } from './toon.js';

// The player, out of uniform for the Academy hallway rather than a fishing
// dock: a gold varsity cardigan over a parchment shirt, dark trousers,
// sneakers, and a backpack — but built with exactly the same recipe Hyper
// Fishies' own drawPlayer.js uses (same head/body proportions, the same
// toon-outline-after-every-fill convention, straight no-elbow arms that
// swing opposite the legs, the same bob/lean/leg-offset walk-cycle math),
// so it reads as the same house style even though the character is new.
const COLORS = {
  skin: '#e8b78a',
  hair: '#3c2a1a',
  hairDark: '#241708',
  shirt: '#ead9ae',
  sweaterLight: '#ffb454',
  sweaterDark: '#c9922a',
  pants: '#4a5568',
  pantsDark: '#333d4d',
  shoe: '#241708',
  shoeCuff: '#ead9ae',
  bag: '#7a2e2e',
  bagTrim: '#ffb454',
};

export function drawStudent(ctx, p) {
  const { x, y, facing, moving, animTime } = p;
  const bob = moving ? Math.sin(animTime * 10) * 2.2 : Math.sin(animTime * 2) * 0.6;
  const lean = moving ? Math.sin(animTime * 10) * 0.05 : 0;
  const legOffset = moving ? Math.sin(animTime * 10) * 5 : 0;
  const armSwing = -legOffset * 1.3;

  drawShadow(ctx, x, y + 2, 13, 5.5, 0.34);

  ctx.save();
  ctx.translate(x, y - 4 + bob * 0.2);
  ctx.rotate(lean);

  // Backpack, worn on the back — visible as a rounded block behind the
  // shoulders when facing away, and as little strap tabs over the
  // shoulders from every other angle (drawn later, after the sweater).
  if (facing === 'up') {
    ctx.fillStyle = COLORS.bag;
    ctx.beginPath();
    ctx.roundRect(-7, -28, 14, 20, 4);
    ctx.fill(); toonOutline(ctx, 1.2);
    ctx.strokeStyle = COLORS.bagTrim;
    ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.moveTo(-5, -24); ctx.lineTo(-5, -12); ctx.moveTo(5, -24); ctx.lineTo(5, -12); ctx.stroke();
  }

  // Shoes
  ctx.fillStyle = COLORS.shoe;
  ctx.beginPath(); ctx.ellipse(-4, 2 + legOffset * 0.3, 3.6, 5.6, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);
  ctx.beginPath(); ctx.ellipse(4, 2 - legOffset * 0.3, 3.6, 5.6, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);
  ctx.fillStyle = COLORS.shoeCuff;
  ctx.beginPath(); ctx.ellipse(-4, -1 + legOffset * 0.3, 3.8, 2.2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(4, -1 - legOffset * 0.3, 3.8, 2.2, 0, 0, Math.PI * 2); ctx.fill();

  // Trousers
  ctx.fillStyle = COLORS.pants;
  ctx.beginPath(); ctx.moveTo(-8, 2); ctx.lineTo(-7, -6); ctx.lineTo(-1, -6); ctx.lineTo(-1, 2); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(8, 2); ctx.lineTo(7, -6); ctx.lineTo(1, -6); ctx.lineTo(1, 2); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = COLORS.pantsDark;
  ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-4, -6); ctx.lineTo(-4.5, 2); ctx.moveTo(4, -6); ctx.lineTo(4.5, 2); ctx.stroke();
  toonOutline(ctx, 1);

  // Shirt collar, visible beneath the open cardigan
  ctx.fillStyle = COLORS.shirt;
  ctx.beginPath();
  ctx.moveTo(-8, 4);
  ctx.quadraticCurveTo(-10, -16, -5, -25);
  ctx.quadraticCurveTo(0, -29, 5, -25);
  ctx.quadraticCurveTo(10, -16, 8, 4);
  ctx.closePath();
  ctx.fill();

  // Cardigan — same "open vest" silhouette as Hyper Fishies' vest, just a
  // gradient gold instead of tan.
  const sweaterGrad = ctx.createLinearGradient(0, -26, 0, 2);
  sweaterGrad.addColorStop(0, COLORS.sweaterLight);
  sweaterGrad.addColorStop(1, COLORS.sweaterDark);
  ctx.fillStyle = sweaterGrad;
  ctx.beginPath();
  ctx.moveTo(-9, 2); ctx.quadraticCurveTo(-11, -14, -6, -23); ctx.lineTo(-2, -20); ctx.lineTo(-2, 0); ctx.lineTo(-9, 2);
  ctx.closePath(); ctx.fill(); toonOutline(ctx, 1.2);
  ctx.beginPath();
  ctx.moveTo(9, 2); ctx.quadraticCurveTo(11, -14, 6, -23); ctx.lineTo(2, -20); ctx.lineTo(2, 0); ctx.lineTo(9, 2);
  ctx.closePath(); ctx.fill(); toonOutline(ctx, 1.2);

  ctx.fillStyle = 'rgba(255,255,255,0.1)';
  ctx.beginPath(); ctx.moveTo(-8, -2); ctx.lineTo(-6.5, -18); ctx.lineTo(-4.5, -18); ctx.lineTo(-5.5, -2); ctx.closePath(); ctx.fill();

  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-2, -20); ctx.lineTo(-2, 0); ctx.moveTo(2, -20); ctx.lineTo(2, 0); ctx.stroke();

  // Backpack shoulder straps, when not facing away (the pack itself is
  // hidden behind the body from this angle, but the straps still show).
  if (facing !== 'up') {
    ctx.strokeStyle = COLORS.bag;
    ctx.lineWidth = 2.6;
    ctx.beginPath(); ctx.moveTo(-6, -23); ctx.lineTo(-7, 1); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(6, -23); ctx.lineTo(7, 1); ctx.stroke();
  }

  // Arms
  drawStraightArm(ctx, -7, -22, -9, -4 + armSwing, 4.2, COLORS.skin);
  drawStraightArm(ctx, 7, -22, 9, -4 - armSwing, 4.2, COLORS.skin);

  // Head
  ctx.fillStyle = COLORS.skin;
  ctx.beginPath(); ctx.arc(0, -32.5, 9.5, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.4);

  // Hair — a simple tousled cap instead of a hat, drawn regardless of
  // facing (unlike the beard, it doesn't need to "point" anywhere).
  ctx.fillStyle = COLORS.hair;
  ctx.beginPath();
  ctx.moveTo(-9.5, -33);
  ctx.quadraticCurveTo(-10.5, -42, -2, -43.5);
  ctx.quadraticCurveTo(6, -44.5, 9.5, -37);
  ctx.quadraticCurveTo(10.5, -32.5, 8, -30);
  ctx.quadraticCurveTo(6, -37, 0, -37.5);
  ctx.quadraticCurveTo(-6, -37.5, -8.5, -31);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.3);
  ctx.fillStyle = COLORS.hairDark;
  ctx.globalAlpha = 0.4;
  ctx.beginPath(); ctx.moveTo(-1, -43); ctx.quadraticCurveTo(2, -40, -1, -37); ctx.stroke();
  ctx.globalAlpha = 1;

  // Face — same shift-with-facing convention as Hyper Fishies (skip
  // entirely when facing away).
  if (facing !== 'up') {
    const eyeX = facing === 'left' ? -2.8 : facing === 'right' ? 2.8 : 0;
    const spread = facing === 'left' || facing === 'right' ? 0 : 3.1;
    ctx.fillStyle = '#241a10';
    if (spread > 0.01) {
      ctx.beginPath(); ctx.ellipse(eyeX - spread, -32.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(eyeX + spread, -32.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    } else {
      ctx.beginPath(); ctx.ellipse(eyeX, -32.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    }
  }

  ctx.restore();
}
