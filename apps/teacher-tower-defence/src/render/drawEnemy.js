// Each enemy archetype gets a distinct silhouette instead of a
// palette-swapped circle — shape is what actually sells "these are
// different threats," color is just backup.
const SHAPES = {
  popquiz(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(r * 0.8, r * 0.5);
    ctx.lineTo(-r * 0.8, r * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#2a0a0a';
    ctx.font = `bold ${r * 1.1}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('!', 0, r * 0.05);
  },
  lateslip(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.quadraticCurveTo(r, -r * 0.3, r * 0.7, r * 0.4);
    ctx.quadraticCurveTo(r * 0.3, r * 0.1, 0, r * 0.6);
    ctx.quadraticCurveTo(-r * 0.3, r * 0.1, -r * 0.7, r * 0.4);
    ctx.quadraticCurveTo(-r, -r * 0.3, 0, -r);
    ctx.closePath();
    ctx.fill();
  },
  truant(ctx, r) {
    ctx.globalAlpha *= 0.85;
    ctx.beginPath();
    ctx.ellipse(0, 0, r * 0.75, r, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, r * 0.6);
    ctx.lineTo(-r * 0.2, r);
    ctx.lineTo(0.1, r * 0.6);
    ctx.lineTo(r * 0.4, r);
    ctx.lineTo(r * 0.6, r * 0.6);
    ctx.closePath();
    ctx.fill();
  },
  detention(ctx, r) {
    ctx.beginPath();
    ctx.roundRect(-r * 0.85, -r * 0.85, r * 1.7, r * 1.7, r * 0.25);
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.fillRect(-r * 0.5, -r * 0.15, r, r * 0.1);
  },
  finalexam(ctx, r) {
    ctx.beginPath();
    ctx.roundRect(-r * 0.7, -r, r * 1.4, r * 2, r * 0.15);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    for (let i = 0; i < 4; i++) ctx.fillRect(-r * 0.45, -r * 0.6 + i * r * 0.35, r * 0.9, r * 0.08);
    ctx.fillStyle = '#ff2050';
    ctx.beginPath(); ctx.arc(-r * 0.28, -r * 1.05, r * 0.14, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(r * 0.28, -r * 1.05, r * 0.14, 0, Math.PI * 2); ctx.fill();
  },
};

export function drawEnemy(ctx, enemy, t) {
  const { x, y, size, color, glow, hp, maxHp, slowUntil, evasive } = enemy;
  ctx.save();
  ctx.translate(x, y);

  const flicker = evasive && Math.sin(t * 14 + x) > 0.6 ? 0.35 : 1;
  ctx.globalAlpha = flicker;

  ctx.shadowColor = glow;
  ctx.shadowBlur = 10;
  ctx.fillStyle = color;
  const shapeFn = SHAPES[enemy.typeId] || SHAPES.popquiz;
  shapeFn(ctx, size);
  ctx.shadowBlur = 0;

  // A cold purple tint + drifting flakes while slowed (Art Teacher's
  // Paint Splash) — visually distinct from the boss/evasive treatments.
  if (slowUntil && slowUntil > t) {
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = '#c896ff';
    ctx.beginPath();
    ctx.arc(0, 0, size * 1.15, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // HP bar, only once damaged — keeps a fresh wave visually clean.
  if (hp < maxHp) {
    const w = size * 1.8;
    const pct = Math.max(0, hp / maxHp);
    ctx.save();
    ctx.translate(x - w / 2, y - size - 10);
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, 5);
    ctx.fillStyle = pct > 0.5 ? '#8fe98f' : pct > 0.25 ? '#ffd670' : '#ff6f6f';
    ctx.fillRect(0, 0, w * pct, 5);
    ctx.restore();
  }
}
