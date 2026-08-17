import { shadeColor } from '../util/color.js';

// Reusable procedural bait "shape archetypes" — every bait reuses one of
// these with a different hue instead of needing bespoke art, same pattern
// as render/drawFishIcon.js. Icons are drawn inside a local [-1,1] box,
// then scaled/translated to size. Each shape also carries a couple of
// fine detail strokes (segment lines, eyes, veins, an emboss mark...) drawn
// in a darker shade of the same hue on top of the gradient fill, so they
// read as small crafted objects instead of flat silhouettes.
const SHAPES = {
  worm(ctx) {
    ctx.lineCap = 'round';
    ctx.lineWidth = 0.34;
    ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(-0.7, 0.3);
    ctx.quadraticCurveTo(-0.3, -0.5, 0.1, 0.1);
    ctx.quadraticCurveTo(0.4, 0.5, 0.75, -0.2);
    ctx.stroke();
    // Segment ticks along the body — reads as a real earthworm, not a noodle.
    ctx.globalAlpha *= 0.5;
    ctx.lineWidth = 0.05;
    for (const t of [0.2, 0.4, 0.6, 0.8]) {
      const p = quadPoint(-0.7, 0.3, -0.3, -0.5, 0.1, 0.1, t < 0.5 ? t * 2 : null) ||
        quadPoint(0.1, 0.1, 0.4, 0.5, 0.75, -0.2, (t - 0.5) * 2);
      if (!p) continue;
      ctx.beginPath();
      ctx.moveTo(p.x - p.ny * 0.14, p.y + p.nx * 0.14);
      ctx.lineTo(p.x + p.ny * 0.14, p.y - p.nx * 0.14);
      ctx.stroke();
    }
    ctx.globalAlpha /= 0.5;
  },
  bug(ctx) {
    // Wings first, underneath the body.
    ctx.globalAlpha *= 0.6;
    ctx.beginPath(); ctx.ellipse(-0.5, -0.1, 0.35, 0.5, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0.5, -0.1, 0.35, 0.5, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha /= 0.6;
    ctx.beginPath();
    ctx.ellipse(0, 0.1, 0.38, 0.55, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(0, -0.55, 0.2, 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    // Wing veins + antennae + eyes — the bits that make it read as an insect.
    ctx.globalAlpha *= 0.55;
    ctx.lineWidth = 0.04;
    ctx.beginPath();
    ctx.moveTo(-0.5, -0.35); ctx.lineTo(-0.5, 0.2);
    ctx.moveTo(0.5, -0.35); ctx.lineTo(0.5, 0.2);
    ctx.stroke();
    ctx.globalAlpha /= 0.55;
    ctx.lineWidth = 0.045; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.08, -0.68); ctx.quadraticCurveTo(-0.2, -0.95, -0.32, -0.9);
    ctx.moveTo(0.08, -0.68); ctx.quadraticCurveTo(0.2, -0.95, 0.32, -0.9);
    ctx.stroke();
    ctx.fillStyle = '#1a1410';
    ctx.beginPath(); ctx.arc(-0.08, -0.58, 0.045, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(0.08, -0.58, 0.045, 0, Math.PI * 2); ctx.fill();
  },
  shrimp(ctx) {
    ctx.beginPath();
    ctx.moveTo(-0.6, -0.1);
    ctx.quadraticCurveTo(0.2, -0.85, 0.75, -0.2);
    ctx.quadraticCurveTo(0.9, 0.1, 0.55, 0.25);
    ctx.quadraticCurveTo(0.1, 0.15, -0.3, 0.45);
    ctx.quadraticCurveTo(-0.75, 0.3, -0.6, -0.1);
    ctx.closePath();
    ctx.fill();
    // Shell-segment arcs + a dark eye dot at the head.
    ctx.globalAlpha *= 0.4;
    ctx.lineWidth = 0.045;
    for (const [cx, cy, r] of [[-0.15, -0.3, 0.32], [0.15, -0.15, 0.3], [0.4, 0.0, 0.28]]) {
      ctx.beginPath();
      ctx.arc(cx, cy, r, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
    }
    ctx.globalAlpha /= 0.4;
    ctx.fillStyle = '#241810';
    ctx.beginPath(); ctx.arc(-0.55, -0.15, 0.05, 0, Math.PI * 2); ctx.fill();
  },
  jig(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -0.8);
    ctx.quadraticCurveTo(0.5, -0.2, 0.3, 0.3);
    ctx.quadraticCurveTo(0, 0.6, -0.3, 0.3);
    ctx.quadraticCurveTo(-0.5, -0.2, 0, -0.8);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.12; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 0.5);
    ctx.quadraticCurveTo(0.3, 0.85, 0.05, 0.95);
    ctx.stroke();
    // Faceted lead-head highlight lines.
    ctx.globalAlpha *= 0.45;
    ctx.lineWidth = 0.045;
    ctx.beginPath();
    ctx.moveTo(0, -0.75); ctx.lineTo(-0.16, 0.05);
    ctx.moveTo(0, -0.75); ctx.lineTo(0.16, 0.05);
    ctx.stroke();
    ctx.globalAlpha /= 0.45;
  },
  shell(ctx) {
    for (const [dx, s] of [[-0.4, 0.5], [0, 0.65], [0.4, 0.5]]) {
      ctx.beginPath();
      ctx.moveTo(dx - s * 0.45, 0.45);
      ctx.quadraticCurveTo(dx, -0.6 * s, dx + s * 0.45, 0.45);
      ctx.closePath();
      ctx.fill();
      // A ridge line down the middle of each scallop.
      ctx.globalAlpha *= 0.35;
      ctx.lineWidth = 0.04;
      ctx.beginPath();
      ctx.moveTo(dx, 0.4);
      ctx.lineTo(dx, -0.5 * s);
      ctx.stroke();
      ctx.globalAlpha /= 0.35;
    }
  },
  claw(ctx) {
    ctx.beginPath();
    ctx.moveTo(-0.7, 0.4);
    ctx.quadraticCurveTo(-0.9, -0.4, -0.1, -0.5);
    ctx.quadraticCurveTo(0.6, -0.55, 0.65, -0.05);
    ctx.quadraticCurveTo(0.3, -0.05, 0.15, -0.3);
    ctx.quadraticCurveTo(0.05, -0.05, -0.2, 0.05);
    ctx.quadraticCurveTo(0.1, 0.25, 0, 0.55);
    ctx.quadraticCurveTo(-0.4, 0.65, -0.7, 0.4);
    ctx.closePath();
    ctx.fill();
    // A pincer joint line + a couple of serration ticks.
    ctx.globalAlpha *= 0.4;
    ctx.lineWidth = 0.045;
    ctx.beginPath();
    ctx.moveTo(0.15, -0.3); ctx.lineTo(-0.15, 0.15);
    ctx.stroke();
    for (const [px, py] of [[0.5, -0.2], [0.25, -0.42]]) {
      ctx.beginPath();
      ctx.moveTo(px, py); ctx.lineTo(px + 0.08, py - 0.06);
      ctx.stroke();
    }
    ctx.globalAlpha /= 0.4;
  },
  strip(ctx) {
    ctx.lineCap = 'round'; ctx.lineWidth = 0.28; ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath();
    ctx.moveTo(-0.7, -0.5);
    ctx.quadraticCurveTo(0, 0.1, 0.7, -0.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-0.6, 0.15);
    ctx.quadraticCurveTo(0, 0.65, 0.6, 0.15);
    ctx.stroke();
    // A lighter center vein down each strip, like real cut flesh.
    ctx.globalAlpha *= 0.4;
    ctx.lineWidth = 0.05;
    ctx.beginPath();
    ctx.moveTo(-0.55, -0.42); ctx.quadraticCurveTo(0, 0.02, 0.55, -0.42);
    ctx.moveTo(-0.48, 0.22); ctx.quadraticCurveTo(0, 0.55, 0.48, 0.22);
    ctx.stroke();
    ctx.globalAlpha /= 0.4;
  },
  algae(ctx) {
    ctx.lineCap = 'round'; ctx.lineWidth = 0.16; ctx.strokeStyle = ctx.fillStyle;
    for (const dx of [-0.3, 0, 0.3]) {
      ctx.beginPath();
      ctx.moveTo(dx, 0.8);
      ctx.quadraticCurveTo(dx + 0.25, 0, dx - 0.1, -0.8);
      ctx.stroke();
    }
    // Tiny bubble dots drifting off the fronds.
    ctx.globalAlpha *= 0.5;
    for (const [bx, by, r] of [[0.42, -0.3, 0.05], [-0.5, -0.5, 0.04], [0.1, -0.75, 0.035]]) {
      ctx.beginPath(); ctx.arc(bx, by, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha /= 0.5;
  },
  vial(ctx) {
    ctx.beginPath();
    ctx.rect(-0.28, -0.15, 0.56, 0.85);
    ctx.fill();
    ctx.beginPath();
    ctx.rect(-0.12, -0.75, 0.24, 0.65);
    ctx.fill();
    ctx.globalAlpha *= 0.4;
    ctx.fillRect(-0.28, 0.15, 0.56, 0.35);
    ctx.globalAlpha /= 0.4;
    // Cork stopper + a glassy highlight streak down the side.
    ctx.fillStyle = '#8a6a44';
    ctx.fillRect(-0.14, -0.9, 0.28, 0.18);
    ctx.globalAlpha *= 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(-0.2, -0.1, 0.08, 0.75);
    ctx.globalAlpha /= 0.5;
  },
  coin(ctx) {
    ctx.beginPath();
    ctx.arc(0, 0, 0.75, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha *= 0.5;
    ctx.beginPath();
    ctx.arc(0, 0, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha /= 0.5;
    // A stamped anchor emboss in the middle, plus milled-edge ticks.
    ctx.globalAlpha *= 0.55;
    ctx.strokeStyle = '#2c1e10'; ctx.lineWidth = 0.06; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -0.22); ctx.lineTo(0, 0.22);
    ctx.moveTo(-0.16, 0.06); ctx.quadraticCurveTo(0, 0.26, 0.16, 0.06);
    ctx.moveTo(-0.12, -0.14); ctx.lineTo(0.12, -0.14);
    ctx.stroke();
    ctx.globalAlpha /= 0.55;
    ctx.globalAlpha *= 0.3;
    ctx.lineWidth = 0.045;
    for (let i = 0; i < 16; i++) {
      const a = (Math.PI * 2 * i) / 16;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 0.68, Math.sin(a) * 0.68);
      ctx.lineTo(Math.cos(a) * 0.78, Math.sin(a) * 0.78);
      ctx.stroke();
    }
    ctx.globalAlpha /= 0.3;
  },
  star(ctx) {
    ctx.beginPath();
    const spikes = 4, outerR = 0.85, innerR = 0.28;
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      const a = (Math.PI * i) / spikes;
      const x = Math.cos(a) * r, y = Math.sin(a) * r;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // A bright cross-glint through the middle, like starlight catching glass.
    ctx.globalAlpha *= 0.6;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.05; ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-0.85, 0); ctx.lineTo(0.85, 0);
    ctx.moveTo(0, -0.85); ctx.lineTo(0, 0.85);
    ctx.stroke();
    ctx.globalAlpha /= 0.6;
  },
  chum(ctx) {
    ctx.beginPath();
    ctx.moveTo(-0.6, -0.3);
    ctx.quadraticCurveTo(-0.2, -0.8, 0.4, -0.5);
    ctx.quadraticCurveTo(0.85, -0.1, 0.5, 0.4);
    ctx.quadraticCurveTo(0.1, 0.85, -0.4, 0.5);
    ctx.quadraticCurveTo(-0.85, 0.2, -0.6, -0.3);
    ctx.closePath();
    ctx.fill();
    // Fleck texture — small dark speckle dots scattered across the chunk.
    ctx.globalAlpha *= 0.35;
    ctx.fillStyle = '#1a1008';
    for (const [fx, fy, r] of [[-0.2, -0.1, 0.05], [0.15, 0.2, 0.045], [-0.05, 0.35, 0.04], [0.3, -0.15, 0.045]]) {
      ctx.beginPath(); ctx.arc(fx, fy, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha /= 0.35;
  },
};

// Helper for worm's segment ticks: a point + local normal along a quadratic
// bezier at parameter t (returns null for an out-of-range t so the caller
// can fall through to the second curve segment).
function quadPoint(x0, y0, cx, cy, x1, y1, t) {
  if (t == null || t < 0 || t > 1) return null;
  const mt = 1 - t;
  const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
  const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
  const dx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx);
  const dy = 2 * mt * (cy - y0) + 2 * t * (y1 - cy);
  const len = Math.hypot(dx, dy) || 1;
  return { x, y, nx: dx / len, ny: dy / len };
}

export function drawBaitIcon(ctx, shape, x, y, size, color) {
  const fn = SHAPES[shape] || SHAPES.chum;

  // A parchment plate behind every icon, upgraded with a soft radial
  // gradient + inner emboss ring for real dimensionality instead of a flat
  // cream disc — several bait hues (phantom ink, kraken ink, deep chum) are
  // also dark enough to vanish into the dark themed row backgrounds without
  // something behind them to read against.
  ctx.save();
  ctx.translate(x, y);
  const plate = ctx.createRadialGradient(-size * 0.12, -size * 0.14, 1, 0, 0, size / 2);
  plate.addColorStop(0, '#fff8ea');
  plate.addColorStop(0.72, 'rgba(240, 226, 196, 0.94)');
  plate.addColorStop(1, 'rgba(206, 186, 146, 0.92)');
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(58, 42, 22, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2 - 2.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // A soft dropped shadow of the shape itself, offset slightly down —
  // reuses the same shape function with a flat dark fill, so every bait
  // gets a matching shadow for free with no per-shape extra work.
  ctx.save();
  ctx.translate(x, y + size * 0.06);
  ctx.scale((size * 0.8) / 2, (size * 0.8) / 2);
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = '#1a1008';
  fn(ctx);
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale((size * 0.8) / 2, (size * 0.8) / 2);
  const grad = ctx.createLinearGradient(-0.85, -0.85, 0.85, 0.85);
  grad.addColorStop(0, shadeColor(color, 0.4));
  grad.addColorStop(0.55, color);
  grad.addColorStop(1, shadeColor(color, -0.25));
  ctx.fillStyle = grad;
  fn(ctx);
  ctx.restore();
}
