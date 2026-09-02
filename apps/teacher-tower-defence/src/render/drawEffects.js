// Every effect here is a plain {kind, start, duration, ...} object pushed
// onto game state's `effects` array by game/combat.js and pruned once
// `t > start + duration` — this module only ever reads progress (0..1)
// from that and draws accordingly, no effect owns a timer of its own.
function progress(effect, t) {
  return Math.max(0, Math.min(1, (t - effect.start) / effect.duration));
}

export function drawProjectile(ctx, e) {
  const { x, y, color, angle = 0, melee } = e;
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.fillStyle = color;
  if (melee) {
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.beginPath();
    ctx.ellipse(0, 0, 7, 2.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(-8, 0, 6, 1.6, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawImpact(ctx, e, t) {
  const p = progress(e, t);
  const r = (e.radius || 30) * p;
  ctx.save();
  ctx.globalAlpha = (1 - p) * 0.8;
  ctx.strokeStyle = e.color;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(e.x, e.y, r, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

// A quick comic-book "POW" — a bright flash core with a few short spikes
// radiating out, at the point of contact — for melee hits, which read
// poorly as the plain expanding ring drawImpact makes for splash/AoE.
function drawPunch(ctx, e, t) {
  const p = progress(e, t);
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.globalAlpha = 1 - p;
  const color = e.color || '#fff6ea';
  const r = 3 + p * 9;

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = color;
  ctx.lineWidth = 2.2;
  const spikes = 6;
  for (let i = 0; i < spikes; i++) {
    const a = (i / spikes) * Math.PI * 2 + p * 0.6;
    const inner = r * 0.55;
    const outer = inner + 9 * (1 - p * 0.5);
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * inner, Math.sin(a) * inner);
    ctx.lineTo(Math.cos(a) * outer, Math.sin(a) * outer);
    ctx.stroke();
  }
  ctx.restore();
}

function drawDeathBurst(ctx, e, t) {
  const p = progress(e, t);
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.fillStyle = e.color;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const d = 4 + p * 22;
    ctx.beginPath();
    ctx.arc(e.x + Math.cos(a) * d, e.y + Math.sin(a) * d, 2.4 * (1 - p) + 0.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawFloatingText(ctx, e, t) {
  const p = progress(e, t);
  ctx.save();
  ctx.globalAlpha = 1 - p;
  ctx.translate(e.x, e.y - p * 26);
  ctx.font = `bold ${e.big ? 15 : 12}px 'Baloo 2', sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillStyle = e.color || '#fff6ea';
  ctx.shadowColor = 'rgba(0,0,0,0.7)';
  ctx.shadowBlur = 3;
  ctx.fillText(e.text, 0, 0);
  ctx.restore();
}

// The Principal's ultimate — a full "domain expansion" flourish: a hard
// flash, a dark radial vignette slamming in, concentric golden rings
// racing outward, and spoke lines like a giant sigil snapping into place.
// Deliberately the single biggest, most theatrical effect in the game —
// it should feel like a completely different tier of attack from every
// regular tower's projectile.
function drawDomainBurst(ctx, e, t) {
  const p = progress(e, t);
  ctx.save();
  ctx.translate(e.x, e.y);

  if (p < 0.15) {
    ctx.globalAlpha = 1 - p / 0.15;
    ctx.fillStyle = '#fffef2';
    ctx.beginPath();
    ctx.arc(0, 0, 40, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = (1 - p) * 0.5;
  const vignette = ctx.createRadialGradient(0, 0, e.radius * 0.3, 0, 0, e.radius * 1.05);
  vignette.addColorStop(0, 'rgba(10, 5, 20, 0)');
  vignette.addColorStop(1, 'rgba(10, 5, 20, 0.85)');
  ctx.fillStyle = vignette;
  ctx.beginPath();
  ctx.arc(0, 0, e.radius * 1.05, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 3; i++) {
    const ringP = Math.max(0, Math.min(1, p * 1.4 - i * 0.18));
    if (ringP <= 0 || ringP >= 1) continue;
    ctx.globalAlpha = (1 - ringP) * 0.9;
    ctx.strokeStyle = '#ffd670';
    ctx.lineWidth = 3 - i * 0.6;
    ctx.beginPath();
    ctx.arc(0, 0, e.radius * ringP, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.globalAlpha = (1 - p) * 0.6;
  ctx.strokeStyle = '#fff3c8';
  ctx.lineWidth = 1.2;
  ctx.rotate(p * 1.2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * 20, Math.sin(a) * 20);
    ctx.lineTo(Math.cos(a) * e.radius * p, Math.sin(a) * e.radius * p);
    ctx.stroke();
  }

  ctx.restore();
}

export function drawEffect(ctx, e, t) {
  switch (e.kind) {
    case 'projectile': return drawProjectile(ctx, e);
    case 'impact': return drawImpact(ctx, e, t);
    case 'punch': return drawPunch(ctx, e, t);
    case 'death': return drawDeathBurst(ctx, e, t);
    case 'text': return drawFloatingText(ctx, e, t);
    case 'domain': return drawDomainBurst(ctx, e, t);
    default: return null;
  }
}
