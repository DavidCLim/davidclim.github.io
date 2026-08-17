import { drawShadow } from './drawShadow.js';

// 2.5D prop rendering: plain top-down footprints drawn with rising walls,
// an angled "roof/lid" plane, and a drop shadow so they read as tall
// objects despite everything underneath being flat 2D math.
export function drawStall(ctx, stall) {
  const baseX = stall.x + stall.w / 2;
  const baseY = stall.y + stall.h;
  const height = 78;

  drawShadow(ctx, baseX, baseY - 2, stall.w * 0.58, stall.w * 0.22);

  const wallTop = baseY - height * 0.5;
  ctx.fillStyle = stall.wallColor;
  ctx.fillRect(stall.x, wallTop, stall.w, baseY - wallTop);

  // Plank seams on the wall for texture
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  for (let x = stall.x + 10; x < stall.x + stall.w; x += 14) {
    ctx.beginPath();
    ctx.moveTo(x, wallTop + 6);
    ctx.lineTo(x, baseY - 3);
    ctx.stroke();
  }

  // Counter highlight strip
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(stall.x, wallTop, stall.w, 6);

  // Counter shadow at the base (grounds it against the deck)
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(stall.x, baseY - 5, stall.w, 5);

  // Roof "lid" plane (lighter, angled back) + front eave (darker edge)
  const overhang = 12;
  const roofBackY = wallTop - height * 0.42;
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(stall.x - overhang, wallTop);
  ctx.lineTo(stall.x + stall.w + overhang, wallTop);
  ctx.lineTo(stall.x + stall.w - overhang * 0.4, roofBackY);
  ctx.lineTo(stall.x + overhang * 0.4, roofBackY);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = stall.roofColor;
  ctx.fillRect(stall.x - overhang, roofBackY, stall.w + overhang * 2, wallTop - roofBackY);
  // Awning stripes for a market-stall feel
  const stripeW = 10;
  for (let x = stall.x - overhang - stripeW; x < stall.x + stall.w + overhang; x += stripeW * 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.14)';
    ctx.fillRect(x, roofBackY, stripeW, wallTop - roofBackY);
  }
  ctx.restore();

  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(stall.x - overhang, wallTop, stall.w + overhang * 2, 5);

  // Sign
  ctx.fillStyle = stall.accent;
  ctx.fillRect(stall.x + stall.w / 2 - 28, wallTop + 13, 56, 17);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(stall.x + stall.w / 2 - 28, wallTop + 13, 56, 17);
  ctx.fillStyle = '#241708';
  ctx.font = '11px "Pirata One", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stall.label, stall.x + stall.w / 2, wallTop + 22);

  // Small hanging lantern under the eave
  const lx = stall.x + stall.w / 2, ly = wallTop + 4;
  const glow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 18);
  glow.addColorStop(0, 'rgba(255,180,84,0.5)');
  glow.addColorStop(1, 'rgba(255,180,84,0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(lx, ly, 18, 0, Math.PI * 2);
  ctx.fill();
}

export function drawLanternPost(ctx, prop, t) {
  const flicker = 0.85 + Math.sin(t * 7 + prop.x) * 0.08 + Math.random() * 0.03;
  drawShadow(ctx, prop.x, prop.y + 4, 9, 4, 0.28);

  ctx.strokeStyle = '#2c2117';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(prop.x, prop.y + 2);
  ctx.lineTo(prop.x, prop.y - 46);
  ctx.stroke();

  const lampY = prop.y - 50;
  const glow = ctx.createRadialGradient(prop.x, lampY, 0, prop.x, lampY, 46 * flicker);
  glow.addColorStop(0, `rgba(255, 180, 84, ${0.45 * flicker})`);
  glow.addColorStop(1, 'rgba(255, 180, 84, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(prop.x, lampY, 46 * flicker, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#3a2c1c';
  ctx.fillRect(prop.x - 5, lampY - 6, 10, 10);
  ctx.fillStyle = `rgba(255, 214, 150, ${0.9 * flicker})`;
  ctx.beginPath();
  ctx.arc(prop.x, lampY - 1, 4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawChest(ctx, prop) {
  const { x, y, w, h } = prop;
  drawShadow(ctx, x, y + h * 0.4, w * 0.65, h * 0.28);
  const top = y - h * 0.7;

  // Body
  ctx.fillStyle = '#4a3320';
  ctx.fillRect(x - w / 2, top + h * 0.35, w, h * 0.65);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.strokeRect(x - w / 2, top + h * 0.35, w, h * 0.65);

  // Domed lid
  ctx.fillStyle = '#5a3f28';
  ctx.beginPath();
  ctx.moveTo(x - w / 2, top + h * 0.38);
  ctx.quadraticCurveTo(x, top - h * 0.3, x + w / 2, top + h * 0.38);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.stroke();

  // Gold binding + lock
  ctx.fillStyle = '#ffb454';
  ctx.fillRect(x - w / 2, top + h * 0.32, w, 2);
  ctx.fillRect(x - 2, top + h * 0.32, 4, h * 0.5);
  ctx.beginPath();
  ctx.arc(x, top + h * 0.5, 2.4, 0, Math.PI * 2);
  ctx.fill();
}

export function drawBarrel(ctx, prop) {
  const { x, y, w, h } = prop;
  drawShadow(ctx, x, y + h * 0.4, w * 0.6, h * 0.26);
  const top = y - h * 0.75;
  ctx.fillStyle = '#5c4630';
  ctx.beginPath();
  ctx.ellipse(x, top + h / 2, w / 2, h / 2, 0, 0, Math.PI * 2);
  ctx.fill();

  // Iron hoops
  ctx.strokeStyle = 'rgba(30,26,20,0.55)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.ellipse(x, top + h * 0.2, w / 2, h * 0.14, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.ellipse(x, top + h * 0.8, w / 2, h * 0.14, 0, 0, Math.PI * 2);
  ctx.stroke();

  ctx.fillStyle = '#7a5c3d';
  ctx.beginPath();
  ctx.ellipse(x, top, w / 2, h * 0.3, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.beginPath();
  ctx.ellipse(x, top, w / 2, h * 0.3, 0, 0, Math.PI * 2);
  ctx.stroke();
}

export function drawAnchor(ctx, prop) {
  const { x, y, w, h } = prop;
  ctx.save();
  ctx.translate(x, y);
  ctx.globalAlpha = 0.9;
  ctx.strokeStyle = '#5a5f63';
  ctx.fillStyle = '#5a5f63';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, -h / 2, 3.4, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, -h / 2 + 3);
  ctx.lineTo(0, h / 2 - 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-w / 2, h / 2 - 6);
  ctx.lineTo(0, h / 2);
  ctx.lineTo(w / 2, h / 2 - 6);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-w / 2 + 2, h / 2 - 2);
  ctx.lineTo(-w / 2 - 3, h / 2 - 8);
  ctx.moveTo(w / 2 - 2, h / 2 - 2);
  ctx.lineTo(w / 2 + 3, h / 2 - 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-6, -h / 2 + 10);
  ctx.lineTo(6, -h / 2 + 10);
  ctx.stroke();
  ctx.restore();
}

export function drawFlag(ctx, prop, t) {
  drawShadow(ctx, prop.x, prop.y + 3, 6, 3, 0.28);
  ctx.strokeStyle = '#2c2117';
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(prop.x, prop.y + 2);
  ctx.lineTo(prop.x, prop.y - 58);
  ctx.stroke();

  const wave = Math.sin(t * 2.2) * 4;
  const fx = prop.x, fy = prop.y - 58;
  ctx.fillStyle = '#141010';
  ctx.beginPath();
  ctx.moveTo(fx, fy);
  ctx.lineTo(fx + 26 + wave, fy + 6);
  ctx.lineTo(fx + 20 + wave, fy + 14);
  ctx.lineTo(fx, fy + 12);
  ctx.closePath();
  ctx.fill();

  // Skull-and-crossbones hint
  ctx.fillStyle = '#f0e2c4';
  ctx.beginPath();
  ctx.arc(fx + 11 + wave * 0.5, fy + 8, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#f0e2c4';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(fx + 7 + wave * 0.5, fy + 11);
  ctx.lineTo(fx + 15 + wave * 0.5, fy + 6);
  ctx.moveTo(fx + 7 + wave * 0.5, fy + 6);
  ctx.lineTo(fx + 15 + wave * 0.5, fy + 11);
  ctx.stroke();
}

export function drawNetCoil(ctx, prop) {
  const { x, y, w } = prop;
  ctx.strokeStyle = 'rgba(196, 168, 120, 0.6)';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.ellipse(x, y, w / 2 - i * 2.5, w / 4 - i * 1.4, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}

export function drawSignpost(ctx, prop) {
  const { x, y, w, h } = prop;
  drawShadow(ctx, x, y + 6, 8, 3, 0.25);
  ctx.strokeStyle = '#2c2117';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(x, y + 4);
  ctx.lineTo(x, y - 30);
  ctx.stroke();
  ctx.fillStyle = '#4a3320';
  ctx.fillRect(x - w / 2, y - 38, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeRect(x - w / 2, y - 38, w, h);

  // Painted skull-and-crossbones
  const cx = x, cy = y - 38 + h / 2;
  ctx.fillStyle = '#e8d9b5';
  ctx.beginPath();
  ctx.arc(cx, cy - 1.5, 2.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#e8d9b5';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy + 3);
  ctx.lineTo(cx + 4, cy - 2);
  ctx.moveTo(cx - 4, cy - 2);
  ctx.lineTo(cx + 4, cy + 3);
  ctx.stroke();
}

// A little forge glow with sparks popping up out of it — sits just in
// front of the Blacksmith's stall so "there's a working forge here" reads
// even from across the boardwalk, before you're close enough to see Garrick
// himself.
export function drawForgeEmbers(ctx, prop, t) {
  const { x, y } = prop;
  const flicker = 0.7 + Math.sin(t * 6) * 0.2;

  const glow = ctx.createRadialGradient(x, y, 0, x, y, 22);
  glow.addColorStop(0, `rgba(255, 140, 60, ${0.4 * flicker})`);
  glow.addColorStop(1, 'rgba(255, 140, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#2c2c30';
  ctx.beginPath(); ctx.ellipse(x, y + 2, 12, 5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = `rgba(255, 150, 60, ${0.85 * flicker})`;
  ctx.beginPath(); ctx.ellipse(x, y, 6, 2.6, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = `rgba(255, 180, 100, ${0.9 * flicker})`;
  for (let i = 0; i < 5; i++) {
    const cycle = ((t * 1.4 + i * 0.35) % 1);
    const sx = x + Math.sin(t * 3 + i * 2) * 10 * cycle;
    const sy = y - cycle * 26;
    ctx.globalAlpha = 1 - cycle;
    ctx.beginPath(); ctx.arc(sx, sy, 1.3, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function drawProp(ctx, prop, t) {
  switch (prop.type) {
    case 'lanternPost': drawLanternPost(ctx, prop, t); break;
    case 'chest': drawChest(ctx, prop); break;
    case 'barrel': drawBarrel(ctx, prop); break;
    case 'netCoil': drawNetCoil(ctx, prop); break;
    case 'anchor': drawAnchor(ctx, prop); break;
    case 'flag': drawFlag(ctx, prop, t); break;
    case 'sign': drawSignpost(ctx, prop); break;
    case 'forgeEmbers': drawForgeEmbers(ctx, prop, t); break;
  }
}
