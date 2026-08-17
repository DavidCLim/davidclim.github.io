import { drawFishIcon } from './drawFishIcon.js';

// The boot screen's title card. Used to be a ship's-wheel-and-crossed-rods
// crest (all pirate, one small koi as the only "this is a fishing game"
// cue) — flipped the emphasis the other way: two leaping fish are now the
// whole centerpiece, breaking the surface through a ripple ring with
// bubbles drifting up around them, no wheel or rods left standing in for
// pirate iconography at all. Wordmark keeps the same carved-gold plaque
// treatment (stroke pass + gradient fill pass + clipped highlight sliver)
// that already reads well, just with a paler icy-aqua top stop so it ties
// into the water scene instead of a pure treasure-gold look. Drawn once,
// no animation loop — same "cheap one-shot render" choice every other
// static portrait canvas in this game already makes (ui/profilePanel.js's
// own portrait, ui/shopBanner.js).
export function drawTitleCard(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const sceneY = h * 0.4;
  const r = h * 0.36;

  drawFishScene(ctx, cx, sceneY, r);
  drawWordmark(ctx, cx, h * 0.82, w);
}

// Just the fish scene, no wordmark, sized to a square icon instead of the
// title card's wide banner proportions. For anywhere the game's mark needs
// to stand alone next to its own text (the portfolio homepage card
// supplies its own "Hyper Fishies" heading).
export function drawEmblem(ctx, w, h) {
  ctx.clearRect(0, 0, w, h);
  const cx = w / 2;
  const cy = h * 0.52;
  const r = Math.min(w, h) * 0.42;

  drawFishScene(ctx, cx, cy, r);
}

function drawFishScene(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);

  // A cool aqua glow behind everything, standing in for the wheel's old
  // warm-gold backdrop — the water is the light source now, not brass.
  const glow = ctx.createRadialGradient(0, 0, r * 0.2, 0, 0, r * 1.7);
  glow.addColorStop(0, 'rgba(95, 227, 192, 0.32)');
  glow.addColorStop(1, 'rgba(95, 227, 192, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2);
  ctx.fill();

  // Ripple rings, as if the fish just broke the surface.
  for (const ringR of [r * 1.15, r * 1.4, r * 1.62]) {
    ctx.strokeStyle = `rgba(200, 245, 235, ${0.22 - ringR / r * 0.08})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, r * 0.55, ringR, ringR * 0.3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Rising bubbles, a few fixed sizes/positions so they read as scattered
  // rather than a repeating pattern.
  const bubbles = [
    [-r * 1.05, -r * 0.35, r * 0.06], [-r * 0.82, r * 0.15, r * 0.04],
    [r * 0.95, -r * 0.55, r * 0.05], [r * 1.1, -r * 0.05, r * 0.035],
    [-r * 0.55, -r * 0.95, r * 0.045], [r * 0.4, -r * 1.05, r * 0.03],
  ];
  ctx.fillStyle = 'rgba(230, 250, 245, 0.4)';
  for (const [bx, by, br] of bubbles) {
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // A curved foam streak beneath the fish, like the wake of a splash.
  ctx.strokeStyle = 'rgba(230, 250, 245, 0.35)';
  ctx.lineWidth = r * 0.05;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.arc(0, r * 0.3, r * 1.0, Math.PI * 0.15, Math.PI * 0.85);
  ctx.stroke();

  // Smaller companion fish, trailing lower-left — an angelfish in cool
  // teal, `fade` patterned so it reads as a distinct second silhouette
  // rather than a mirrored copy of the hero koi.
  ctx.save();
  ctx.translate(-r * 0.72, r * 0.5);
  ctx.rotate(0.5);
  drawFishIcon(ctx, 'angel', 0, 0, r * 0.85, '#5fe3c0', { pattern: 'fade', patternColor: '#0c1a1e', flip: true });
  ctx.restore();

  // Hero koi, big and leaping front-and-center.
  ctx.save();
  ctx.rotate(-0.3);
  drawFishIcon(ctx, 'koi', 0, 0, r * 1.85, '#ffb454', { pattern: 'spots', patternColor: '#fff3c8' });
  ctx.restore();

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

  // Gold gradient fill pass on top, paled to icy-aqua at the very top edge
  // so the wordmark reads as "gold caught underwater" rather than plain
  // treasure gold.
  const grad = ctx.createLinearGradient(cx, cy - fontSize / 2, cx, cy + fontSize / 2);
  grad.addColorStop(0, '#eafffa');
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
