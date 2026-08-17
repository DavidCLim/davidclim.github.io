import { drawRodIcon } from './drawRodIcon.js';
import { drawFishIcon } from './drawFishIcon.js';

// The boot screen's title card — used to be a single line of plain gold
// text sitting above the save-slot grid. This draws a real emblem instead:
// a ship's wheel medallion with a koi leaping through the hub, two crossed
// fishing rods standing in for crossed cutlasses behind it, and the
// wordmark itself carved gold-on-dark (a stroked outline pass under a
// gradient fill pass, same "embossed plaque" trick the panel trim's gold
// rivets already lean on) rather than just colored text. Drawn once, no
// animation loop — same "cheap one-shot render" choice every other static
// portrait canvas in this game already makes (ui/profilePanel.js's own
// portrait, ui/shopBanner.js).
export function drawTitleCard(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;

  // Crossed rods behind everything, angled like crossed cutlasses on a
  // ship's crest.
  ctx.save();
  ctx.translate(cx, h * 0.6);
  ctx.save(); ctx.rotate(-0.6); drawRodIcon(ctx, 'brass', 0, 0, h * 0.85); ctx.restore();
  ctx.save(); ctx.rotate(0.6); ctx.scale(-1, 1); drawRodIcon(ctx, 'brass', 0, 0, h * 0.85); ctx.restore();
  ctx.restore();

  // Ship's wheel medallion, upper-center.
  const wheelY = h * 0.34;
  const wheelR = h * 0.32;
  drawShipWheel(ctx, cx, wheelY, wheelR);

  // A koi leaping straight through the wheel's hub — the one "this is a
  // fishing game" cue in an otherwise pure-nautical emblem.
  ctx.save();
  ctx.translate(cx, wheelY);
  ctx.rotate(-0.32);
  drawFishIcon(ctx, 'koi', 0, 0, wheelR * 1.15, '#ffb454', { pattern: 'spots', patternColor: '#fff3c8' });
  ctx.restore();

  drawWordmark(ctx, cx, h * 0.78, w);
}

function drawShipWheel(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);

  // A soft warm glow behind the whole wheel, so the medallion reads as the
  // page's own light source rather than a flat sticker on a dark backdrop.
  const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.6);
  glow.addColorStop(0, 'rgba(255, 180, 84, 0.35)');
  glow.addColorStop(1, 'rgba(255, 180, 84, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Spokes + handle knobs, drawn before the rim so the rim's own stroke
  // caps them off cleanly at the outer edge.
  const spokes = 8;
  for (let i = 0; i < spokes; i++) {
    const a = (Math.PI * 2 * i) / spokes;
    ctx.save();
    ctx.rotate(a);
    ctx.strokeStyle = '#8a6239';
    ctx.lineWidth = r * 0.11;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.15);
    ctx.lineTo(0, -r * 0.92);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(20,12,6,0.5)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = '#2c1e10';
    ctx.beginPath();
    ctx.arc(0, -r * 1.02, r * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // Outer rim.
  const rimGrad = ctx.createLinearGradient(-r, -r, r, r);
  rimGrad.addColorStop(0, '#ffd670');
  rimGrad.addColorStop(0.5, '#c9a227');
  rimGrad.addColorStop(1, '#6b4a1c');
  ctx.strokeStyle = rimGrad;
  ctx.lineWidth = r * 0.14;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.84, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(20,12,6,0.55)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  // Hub.
  const hubGrad = ctx.createRadialGradient(-r * 0.06, -r * 0.1, 1, 0, 0, r * 0.26);
  hubGrad.addColorStop(0, '#ffd670');
  hubGrad.addColorStop(1, '#6b4a1c');
  ctx.fillStyle = hubGrad;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.26, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(20,12,6,0.55)';
  ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.restore();
}

function drawWordmark(ctx, cx, cy, w) {
  const fontSize = Math.min(58, w * 0.088);
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `${fontSize}px "Pirata One", cursive`;

  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 4;

  // Dark outline pass first — a wide stroke reads as a carved bevel once
  // the gold fill lands on top of it, the same layering trick every
  // pirate-gold badge in this game (tier badges, rune badges) already uses
  // via border+background instead of a plain flat color.
  ctx.strokeStyle = '#1c1006';
  ctx.lineWidth = fontSize * 0.17;
  ctx.lineJoin = 'round';
  ctx.strokeText('HYPER FISHIES', cx, cy);

  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Gold gradient fill pass on top.
  const grad = ctx.createLinearGradient(cx, cy - fontSize / 2, cx, cy + fontSize / 2);
  grad.addColorStop(0, '#fff3c8');
  grad.addColorStop(0.45, '#ffb454');
  grad.addColorStop(1, '#a86a1e');
  ctx.fillStyle = grad;
  ctx.fillText('HYPER FISHIES', cx, cy);

  // A thin bright sliver clipped to just the top third of the letterforms —
  // the one highlight that sells "polished metal" instead of "flat gold."
  ctx.save();
  ctx.beginPath();
  ctx.rect(cx - w / 2, cy - fontSize / 2, w, fontSize * 0.3);
  ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  ctx.fillText('HYPER FISHIES', cx, cy);
  ctx.restore();

  ctx.restore();
}
