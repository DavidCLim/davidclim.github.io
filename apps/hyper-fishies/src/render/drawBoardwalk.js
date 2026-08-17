import { WALKABLE_RECTS } from '../world/worldObjects.js';
import { groundBase } from './groundPalette.js';

// Wooden boardwalk fill with alternating plank-row shading, a grain streak
// per plank, nail dots, weathering patches, and a proper raised fascia
// board along every edge that actually faces open water — that fascia +
// the pilings in drawPier.js are what sell "built pier" over "wood block".
const PLANK_H = 22;
const PLANK_W = 80;

// Which sides of each WALKABLE_RECTS entry border water (matched by index —
// see world/worldObjects.js: [0] is the main boardwalk, [1] is the fishing
// jetty).
const WATER_EDGES = [['top'], ['top', 'left', 'right']];

function weatheringPatches(ctx, rect) {
  ctx.fillStyle = 'rgba(20, 30, 24, 0.06)';
  const seedCount = Math.round((rect.w * rect.h) / 9000);
  for (let i = 0; i < seedCount; i++) {
    const px = rect.x + ((i * 8171) % rect.w);
    const py = rect.y + ((i * 5147 + 37) % rect.h);
    const r = 5 + (i % 3) * 2;
    ctx.beginPath();
    ctx.ellipse(px, py, r, r * 0.6, i * 0.7, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawFascia(ctx, rect, edges, region) {
  const t = 6; // trim thickness
  for (const edge of edges) {
    ctx.save();
    let w, h, horizontal;
    if (edge === 'top') {
      ctx.translate(rect.x, rect.y - t);
      w = rect.w; h = t; horizontal = true;
    } else if (edge === 'left') {
      ctx.translate(rect.x - t, rect.y);
      w = t; h = rect.h; horizontal = false;
    } else {
      ctx.translate(rect.x + rect.w, rect.y);
      w = t; h = rect.h; horizontal = false;
    }

    const grad = horizontal
      ? ctx.createLinearGradient(0, 0, 0, h)
      : ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#6b4a30');
    grad.addColorStop(1, '#3c2a1a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = 'rgba(0,0,0,0.3)';
    ctx.lineWidth = 1;
    ctx.strokeRect(0.5, 0.5, w - 1, h - 1);

    // End-grain plank caps along the fascia, echoing the posts beneath.
    ctx.fillStyle = 'rgba(255, 200, 150, 0.16)';
    if (horizontal) {
      for (let x = 6; x < w; x += 32) ctx.fillRect(x, 1, 3, h - 2);
    } else {
      for (let y = 6; y < h; y += 32) ctx.fillRect(1, y, w - 2, 3);
    }

    if (region && region.deckTint) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = region.deckTint;
      ctx.fillRect(0, 0, w, h);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
    }

    ctx.restore();
  }
}

// `region` (optional) recolors the deck itself via its `deckTint` — not
// just a translucent screen wash, but the actual plank material — so each
// island's dock reads as a different build (bleached driftwood, frost-grey
// timber, near-black abyssal wood...), not just the same planks under
// different lighting.
export function drawBoardwalk(ctx, region) {
  WALKABLE_RECTS.forEach((rect, idx) => {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();

    const ground = groundBase(region && region.id);
    const base = ctx.createLinearGradient(0, rect.y, 0, rect.y + rect.h);
    base.addColorStop(0, ground.top);
    base.addColorStop(1, ground.bottom);
    ctx.fillStyle = base;
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);

    let row = 0;
    for (let y = rect.y; y < rect.y + rect.h; y += PLANK_H, row++) {
      const h = Math.min(PLANK_H, rect.y + rect.h - y);
      ctx.fillStyle = row % 2 === 0 ? 'rgba(255, 220, 180, 0.035)' : 'rgba(0, 0, 0, 0.06)';
      ctx.fillRect(rect.x, y, rect.w, h);

      // Wood-grain streaks within the plank row.
      ctx.strokeStyle = 'rgba(0,0,0,0.08)';
      ctx.lineWidth = 1;
      for (let x = rect.x + 8; x < rect.x + rect.w; x += 26) {
        const wobble = ((x * 7 + row * 13) % 9) - 4;
        ctx.beginPath();
        ctx.moveTo(x, y + 3);
        ctx.lineTo(x + wobble, y + h - 3);
        ctx.stroke();
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.22)';
    ctx.lineWidth = 1;
    for (let y = rect.y; y < rect.y + rect.h; y += PLANK_H) {
      ctx.beginPath();
      ctx.moveTo(rect.x, y);
      ctx.lineTo(rect.x + rect.w, y);
      ctx.stroke();
    }

    let col = 0;
    for (let x = rect.x; x < rect.x + rect.w; x += PLANK_W, col++) {
      const offset = (col % 2) * (PLANK_H / 2);
      ctx.strokeStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath();
      ctx.moveTo(x, rect.y + offset);
      ctx.lineTo(x, rect.y + rect.h);
      ctx.stroke();

      // Nail dots at each plank joint.
      ctx.fillStyle = 'rgba(20, 12, 6, 0.4)';
      for (let y = rect.y + offset + 4; y < rect.y + rect.h; y += PLANK_H) {
        ctx.fillRect(x + 3, y, 1.5, 1.5);
      }
    }

    weatheringPatches(ctx, rect);

    if (region && region.deckTint) {
      ctx.globalCompositeOperation = 'multiply';
      ctx.globalAlpha = 0.55;
      ctx.fillStyle = region.deckTint;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 0.14;
      ctx.fillStyle = region.deckTint;
      ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      ctx.globalAlpha = 1;
    }

    ctx.strokeStyle = 'rgba(255, 180, 84, 0.14)';
    ctx.lineWidth = 3;
    ctx.strokeRect(rect.x + 1.5, rect.y + 1.5, rect.w - 3, rect.h - 3);

    ctx.restore();

    drawFascia(ctx, rect, WATER_EDGES[idx] || [], region);
  });
}
