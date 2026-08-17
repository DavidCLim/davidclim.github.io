// A small reusable primitive for jointed arms/legs: a thick rounded stroke
// through shoulder/hip -> elbow/knee -> hand/foot, with a little end cap.
// Used everywhere a character needs a defined limb instead of a single
// blob ellipse (drawPlayer.js, drawDockScene.js, drawNPC.js, drawShopNPCs.js).
export function drawJointedLimb(ctx, x0, y0, x1, y1, x2, y2, thickness, color, capColor) {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  ctx.fillStyle = capColor || color;
  ctx.beginPath();
  ctx.arc(x2, y2, thickness * 0.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}
