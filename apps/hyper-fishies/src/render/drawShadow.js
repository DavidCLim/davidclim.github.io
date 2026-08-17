// Soft flattened ellipse shadow — the one trick every standing object
// (player, stalls, posts, props) uses to read as having height.
export function drawShadow(ctx, x, y, rx, ry, alpha = 0.32) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fillStyle = `rgba(2, 10, 14, ${alpha})`;
  ctx.fill();
  ctx.restore();
}
