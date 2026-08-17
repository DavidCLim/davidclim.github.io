// Per-material color palette, shared by the shop-list icon (drawRodIcon)
// and the actual rod drawn in the player's hands (drawPlayer.js /
// drawDockScene.js) — so the rod you equip is the rod you see, everywhere.
export const MATERIAL_COLORS = {
  wood:        { base: '#8a6239', dark: '#5a3f28', accent: '#c9b28c' },
  bamboo:      { base: '#c7d98a', dark: '#8a9b4e', accent: '#eef2c8' },
  bone:        { base: '#e8ddc0', dark: '#b8a97e', accent: '#fff8e6' },
  steel:       { base: '#9fb4c2', dark: '#5a6f7d', accent: '#e8f2f6' },
  coral:       { base: '#ff9d8c', dark: '#c95f4e', accent: '#ffd6c8' },
  graphite:    { base: '#4a4f57', dark: '#26292e', accent: '#8fe9d9' },
  iron:        { base: '#5c5f63', dark: '#2c2e30', accent: '#ffb454' },
  gold:        { base: '#ffd670', dark: '#c98f2e', accent: '#fff3c8' },
  lanternwood: { base: '#c98a4a', dark: '#7a4a1e', accent: '#ffb454', glow: '#ffb454' },
  obsidian:    { base: '#3a2a4a', dark: '#1c1225', accent: '#c896ff', glow: '#c896ff' },
  void:        { base: '#1c2a3c', dark: '#0a121c', accent: '#43e0ff', glow: '#43e0ff' },
  silver:      { base: '#d8dde2', dark: '#8a949e', accent: '#ffffff' },
  ebony:       { base: '#2c2018', dark: '#140e0a', accent: '#ffb454' },
  crystal:     { base: '#b8e8ff', dark: '#5fa8c2', accent: '#ffffff', glow: '#b8e8ff' },
  starlight:   { base: '#fff3c8', dark: '#e8c94a', accent: '#ffffff', glow: '#fff37a' },
  brass:       { base: '#c9a227', dark: '#8a6f1a', accent: '#fff3c8' },
  pearl:       { base: '#f5eee0', dark: '#c9beA8', accent: '#ffe9c8', glow: '#fff3e0' },
  leviathan:   { base: '#5a1414', dark: '#240808', accent: '#ff6f59', glow: '#ff6f59' },
  scrap:       { base: '#8a8f92', dark: '#4a4f52', accent: '#ffb454' },
  // Devil's Rod — near-black shaft with a bloody-red glow, the one
  // material that should read as unmistakably wrong next to every other
  // color on this list.
  devil:       { base: '#3a0a14', dark: '#12030a', accent: '#ff2050', glow: '#ff2050' },
};

export function materialColors(material) {
  return MATERIAL_COLORS[material] || MATERIAL_COLORS.wood;
}

// Small shop-list icon: a diagonal rod with a reel and a looping line.
export function drawRodIcon(ctx, material, x, y, size) {
  const c = materialColors(material);

  // A dark wood-and-rope roundel behind every rod icon — the same
  // supporting role drawRuneIcon.js's stone plate plays for runes, so a Rod
  // Shop row gets the same per-item polish instead of a bare rod floating
  // straight on the row's background.
  ctx.save();
  ctx.translate(x, y);
  const plate = ctx.createRadialGradient(0, 0, 1, 0, 0, size / 2);
  plate.addColorStop(0, '#5a3f28');
  plate.addColorStop(1, '#241708');
  ctx.fillStyle = plate;
  ctx.beginPath();
  ctx.arc(0, 0, size / 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 180, 84, 0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();
  // A rope-twist inner ring, echoing the rope-and-brass panel trim.
  ctx.strokeStyle = 'rgba(20, 12, 6, 0.45)';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([1.4, 1.6]);
  ctx.beginPath();
  ctx.arc(0, 0, size / 2 - 3, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 32, size / 32);
  ctx.rotate(-0.55);

  if (c.glow) {
    const glow = ctx.createRadialGradient(10, 0, 0, 10, 0, 12);
    glow.addColorStop(0, c.glow + 'aa');
    glow.addColorStop(1, c.glow + '00');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(10, 0, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Shaft
  const grad = ctx.createLinearGradient(-12, 0, 12, 0);
  grad.addColorStop(0, c.dark);
  grad.addColorStop(1, c.base);
  ctx.strokeStyle = grad;
  ctx.lineWidth = 2.4;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-12, 4);
  ctx.lineTo(12, -6);
  ctx.stroke();

  // A thin bright highlight riding along the top edge of the shaft — the
  // one thing that sells "polished rod" instead of "flat colored line."
  ctx.strokeStyle = c.accent;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-11, 3);
  ctx.lineTo(11, -6.6);
  ctx.stroke();
  ctx.globalAlpha = 1;

  // Guides
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 0.8;
  ctx.globalAlpha = 0.8;
  for (const f of [0.15, 0.45, 0.75]) {
    const gx = -12 + f * 24, gy = 4 + f * -10;
    ctx.beginPath();
    ctx.arc(gx, gy, 1.6, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Wrapped-grip hatching near the butt end, where a hand would actually
  // hold it — a few short diagonal ticks instead of a bare shaft.
  ctx.strokeStyle = c.dark;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 0.55;
  ctx.lineCap = 'round';
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const gx = -12 + t * 5.5, gy = 4 + t * -2.3;
    ctx.beginPath();
    ctx.moveTo(gx - 0.9, gy - 1.3);
    ctx.lineTo(gx + 0.9, gy + 1.3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Reel — a proper spool with a crank handle instead of a bare dot.
  ctx.fillStyle = c.dark;
  ctx.beginPath();
  ctx.arc(-9, 6, 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = c.accent;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.arc(-9, 6, 3.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 0.7;
  ctx.lineWidth = 0.4;
  for (let i = 0; i < 5; i++) {
    const a = (Math.PI * 2 * i) / 5;
    ctx.beginPath();
    ctx.moveTo(-9, 6);
    ctx.lineTo(-9 + Math.cos(a) * 3, 6 + Math.sin(a) * 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = c.accent;
  ctx.beginPath();
  ctx.arc(-9 + 3.4, 6, 0.7, 0, Math.PI * 2);
  ctx.fill();

  // Line looping off the tip
  ctx.strokeStyle = 'rgba(240,246,241,0.7)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(12, -6);
  ctx.quadraticCurveTo(18, -2, 14, 4);
  ctx.stroke();

  // A small sparkle at the tip for materials that glow — starlight,
  // obsidian, crystal, void, lanternwood, pearl, leviathan.
  if (c.glow) {
    ctx.fillStyle = '#ffffff';
    drawRodSparkle(ctx, 12, -6, 1.6);
  }

  ctx.restore();
}

function drawRodSparkle(ctx, x, y, r) {
  ctx.save();
  ctx.translate(x, y);
  ctx.beginPath();
  ctx.moveTo(0, -r); ctx.lineTo(r * 0.3, -r * 0.3);
  ctx.lineTo(r, 0); ctx.lineTo(r * 0.3, r * 0.3);
  ctx.lineTo(0, r); ctx.lineTo(-r * 0.3, r * 0.3);
  ctx.lineTo(-r, 0); ctx.lineTo(-r * 0.3, -r * 0.3);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
