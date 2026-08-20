// Shared "cartoon" outline primitive, same convention Hyper Fishies uses
// throughout — a dark stroke applied after a fill so every character's
// major shapes read as clean flat-shaded cartoon art with defined edges.
export const TOON_OUTLINE = 'rgba(35, 24, 14, 0.65)';

export function toonOutline(ctx, width = 1.5) {
  ctx.strokeStyle = TOON_OUTLINE;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.stroke();
}

// A single straight shoulder-to-hand arm with an outline and a rounded
// hand cap — no elbow bend, shared so every character's arms match.
export function drawStraightArm(ctx, x0, y0, x1, y1, thickness, color) {
  ctx.strokeStyle = TOON_OUTLINE;
  ctx.lineWidth = thickness + 1.3;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();

  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();

  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x1, y1, thickness * 0.5, 0, Math.PI * 2); ctx.fill();
  toonOutline(ctx, 1);
}
