// The one thing that sells "this is a pier standing on pilings over water"
// rather than "a big wooden rectangle": visible support posts driven into
// the water along every edge that actually touches water, drawn *before*
// the boardwalk fill so the deck reads as resting on top of them.
import { WORLD_W, WATER_LINE } from '../core/constants.js';

// The fishing jetty, jutting out into the water (see data/spots.js /
// world/worldObjects.js).
const JETTIES = [
  { x: 700, y: 130, w: 120, h: 90 },
];

function drawPost(ctx, x, y, len, angle, t, deckTint) {
  const flicker = 0.9 + Math.sin(t * 1.4 + x * 0.7 + y * 0.3) * 0.06;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);

  // Ripple where the post breaks the surface
  ctx.strokeStyle = 'rgba(230, 240, 235, 0.28)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(0, 0, 6, 2.4, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Submerged shaft, darkened by the water
  ctx.fillStyle = `rgba(10, 20, 22, ${0.55 * flicker})`;
  ctx.fillRect(-2.6, -len, 5.2, len + 3);

  // Waterline-lit cap
  ctx.fillStyle = '#2c2117';
  ctx.fillRect(-2.6, -len, 5.2, 5);
  ctx.fillStyle = 'rgba(255, 180, 84, 0.18)';
  ctx.fillRect(-2.6, -len, 5.2, 1.4);

  if (deckTint) {
    ctx.globalCompositeOperation = 'multiply';
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = deckTint;
    ctx.fillRect(-2.6, -len, 5.2, len + 5);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  ctx.restore();
}

export function drawPierPilings(ctx, t, region) {
  const deckTint = region && region.deckTint;

  // Along the main boardwalk's water-facing edge (skip where a jetty
  // already has its own posts so they don't double up).
  for (let x = 20; x < WORLD_W - 20; x += 64) {
    if (JETTIES.some(j => x > j.x - 24 && x < j.x + j.w + 24)) continue;
    drawPost(ctx, x, WATER_LINE, 30, 0, t, deckTint);
  }

  // Flanking each jetty on both sides, and a couple under its far end.
  for (const jetty of JETTIES) {
    for (let y = jetty.y + 14; y < jetty.y + jetty.h; y += 34) {
      drawPost(ctx, jetty.x - 3, y, 22, Math.PI / 2, t, deckTint);
      drawPost(ctx, jetty.x + jetty.w + 3, y, 22, -Math.PI / 2, t, deckTint);
    }
    drawPost(ctx, jetty.x + 26, jetty.y - 2, 20, Math.PI, t, deckTint);
    drawPost(ctx, jetty.x + jetty.w - 26, jetty.y - 2, 20, Math.PI, t, deckTint);
  }
}
