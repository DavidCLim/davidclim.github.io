import { shadeColor } from '../util/color.js';

// Rune glyph icons — same reusable-archetype pattern as render/drawBaitIcon.js,
// but plated on a dark carved stone instead of parchment, since these are
// witch-conjured charms, not tackle. Icons are drawn inside a local
// [-1,1] box, then scaled/translated to size. A couple of glyphs carry a
// small extra flourish (the eye's iris ring, the shield's rivets) so they
// read as engraved charms rather than flat icon-font glyphs.
const GLYPHS = {
  eye(ctx) {
    ctx.beginPath();
    ctx.moveTo(-0.8, 0);
    ctx.quadraticCurveTo(0, -0.55, 0.8, 0);
    ctx.quadraticCurveTo(0, 0.55, -0.8, 0);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha *= 0.55;
    ctx.beginPath(); ctx.arc(0, 0, 0.26, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha /= 0.55;
    ctx.globalAlpha *= 0.7;
    ctx.strokeStyle = '#160f20'; ctx.lineWidth = 0.05;
    ctx.beginPath(); ctx.arc(0, 0, 0.13, 0, Math.PI * 2); ctx.stroke();
    ctx.globalAlpha /= 0.7;
  },
  spiral(ctx) {
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.16; ctx.lineCap = 'round';
    ctx.beginPath();
    let a = 0, r = 0.05;
    ctx.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    for (let i = 1; i <= 40; i++) {
      a = i * 0.45;
      r = 0.05 + (i / 40) * 0.75;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.stroke();
  },
  bolt(ctx) {
    ctx.beginPath();
    ctx.moveTo(0.15, -0.85);
    ctx.lineTo(-0.5, 0.1);
    ctx.lineTo(-0.05, 0.1);
    ctx.lineTo(-0.15, 0.85);
    ctx.lineTo(0.5, -0.15);
    ctx.lineTo(0.05, -0.15);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha *= 0.5;
    ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 0.04;
    ctx.beginPath(); ctx.moveTo(0.1, -0.7); ctx.lineTo(-0.15, 0.02); ctx.stroke();
    ctx.globalAlpha /= 0.5;
  },
  coin(ctx) {
    ctx.lineWidth = 0.14; ctx.strokeStyle = ctx.fillStyle;
    ctx.beginPath(); ctx.arc(0, 0, 0.72, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, 0.34, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha *= 0.5;
    ctx.strokeStyle = '#1a1220'; ctx.lineWidth = 0.045;
    for (let i = 0; i < 8; i++) {
      const a = (Math.PI * 2 * i) / 8;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * 0.5, Math.sin(a) * 0.5);
      ctx.lineTo(Math.cos(a) * 0.62, Math.sin(a) * 0.62);
      ctx.stroke();
    }
    ctx.globalAlpha /= 0.5;
  },
  wave(ctx) {
    ctx.strokeStyle = ctx.fillStyle; ctx.lineWidth = 0.16; ctx.lineCap = 'round';
    for (const dy of [-0.32, 0.1, 0.5]) {
      ctx.beginPath();
      ctx.moveTo(-0.75, dy);
      ctx.quadraticCurveTo(-0.35, dy - 0.3, 0, dy);
      ctx.quadraticCurveTo(0.35, dy + 0.3, 0.75, dy);
      ctx.stroke();
    }
  },
  shield(ctx) {
    ctx.beginPath();
    ctx.moveTo(0, -0.85);
    ctx.quadraticCurveTo(0.7, -0.6, 0.7, -0.1);
    ctx.quadraticCurveTo(0.7, 0.55, 0, 0.85);
    ctx.quadraticCurveTo(-0.7, 0.55, -0.7, -0.1);
    ctx.quadraticCurveTo(-0.7, -0.6, 0, -0.85);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha *= 0.5;
    ctx.beginPath();
    ctx.moveTo(0, -0.5); ctx.lineTo(0, 0.5); ctx.moveTo(-0.35, -0.05); ctx.lineTo(0.35, -0.05);
    ctx.lineWidth = 0.12; ctx.strokeStyle = '#1a1220'; ctx.stroke();
    ctx.globalAlpha /= 0.5;
    ctx.globalAlpha *= 0.6;
    ctx.fillStyle = '#1a1220';
    for (const [rx, ry] of [[-0.5, -0.3], [0.5, -0.3], [-0.4, 0.4], [0.4, 0.4]]) {
      ctx.beginPath(); ctx.arc(rx, ry, 0.06, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha /= 0.6;
  },
};

// A ring of small etched tick marks around the plate border — like a
// witch's rune circle, and different from bait's smooth emboss ring so a
// rune reads as "carved sigil," not "coin."
function drawRuneCircle(ctx, radius, color, count) {
  ctx.save();
  ctx.strokeStyle = color + '99';
  ctx.lineWidth = 1;
  ctx.lineCap = 'round';
  for (let i = 0; i < count; i++) {
    const a = (Math.PI * 2 * i) / count;
    const inner = radius - 2.5;
    const outer = radius - (i % 3 === 0 ? 6.5 : 4.5);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

export function drawRuneIcon(ctx, glyph, x, y, size, color) {
  const fn = GLYPHS[glyph] || GLYPHS.eye;

  // A dark carved-stone plate behind every glyph, given real bevel with a
  // highlight arc + shadowed rim, plus an etched rune-circle of tick marks
  // around the border — reads as "carved magic sigil," not a flat icon.
  ctx.save();
  ctx.translate(x, y);
  const plate = ctx.createRadialGradient(-size * 0.12, -size * 0.16, 1, 0, 0, size / 2);
  plate.addColorStop(0, '#3a3050');
  plate.addColorStop(0.65, '#241c34');
  plate.addColorStop(1, '#120b1c');
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = color + 'aa';
  ctx.lineWidth = 1;
  ctx.stroke();
  // Inner shadow rim for a carved-in bevel, and a thin bright highlight arc
  // along the upper-left edge, like light catching a polished groove.
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2 - 1.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.16)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2 - 3, Math.PI * 0.9, Math.PI * 1.65);
  ctx.stroke();
  drawRuneCircle(ctx, size / 2, color, 16);
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, size * 0.55);
  glow.addColorStop(0, color + '70');
  glow.addColorStop(0.5, color + '30');
  glow.addColorStop(1, color + '00');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, size * 0.55, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale((size * 0.62) / 2, (size * 0.62) / 2);
  const glyphGrad = ctx.createLinearGradient(-0.8, -0.8, 0.8, 0.8);
  glyphGrad.addColorStop(0, shadeColor(color, 0.45));
  glyphGrad.addColorStop(0.55, color);
  glyphGrad.addColorStop(1, shadeColor(color, -0.2));
  ctx.fillStyle = glyphGrad;
  fn(ctx);
  ctx.restore();

  // Two small four-point sparkles near the glyph — the one unambiguous
  // "this is enchanted" cue.
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  drawSparkle(ctx, size * 0.32, -size * 0.3, size * 0.07);
  ctx.globalAlpha = 0.7;
  drawSparkle(ctx, -size * 0.28, size * 0.26, size * 0.05);
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawSparkle(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.lineTo(r * 0.28, -r * 0.28);
  ctx.lineTo(r, 0); ctx.lineTo(r * 0.28, r * 0.28);
  ctx.lineTo(0, r); ctx.lineTo(-r * 0.28, r * 0.28);
  ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.28, -r * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
