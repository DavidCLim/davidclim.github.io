import { drawShadow } from './drawShadow.js';

// A school-building facade — same construction recipe as Hyper Fishies'
// shop stalls (drawProps.js's drawStall: shadow -> wall -> roof plane ->
// sign -> glow), reskinned as a hallway door instead of a market stall:
// a triangular pediment cap instead of an awning, and a glass-paned door
// instead of a counter.
export function drawBuilding(ctx, footprint, opts) {
  const { x, y, w, h } = footprint;
  const baseX = x + w / 2, baseY = y + h;

  drawShadow(ctx, baseX, baseY - 2, w * 0.56, w * 0.2);

  // Wall
  ctx.fillStyle = opts.wallColor;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.18)';
  ctx.lineWidth = 1;
  for (let px = x + 10; px < x + w; px += 16) {
    ctx.beginPath(); ctx.moveTo(px, y + 6); ctx.lineTo(px, baseY - 4); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  ctx.fillRect(x, y, w, 6);
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.fillRect(x, baseY - 5, w, 5);

  // Triangular pediment roof cap.
  const overhang = 10;
  ctx.fillStyle = opts.roofColor;
  ctx.beginPath();
  ctx.moveTo(x - overhang, y);
  ctx.lineTo(x + w + overhang, y);
  ctx.lineTo(x + w / 2, y - h * 0.32);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.fillRect(x - overhang, y, w + overhang * 2, 4);

  // Door, centered, with a glowing glass pane.
  const doorW = w * 0.42, doorH = h * 0.62;
  const doorX = baseX - doorW / 2, doorY = baseY - doorH;
  ctx.fillStyle = opts.doorColor;
  ctx.fillRect(doorX, doorY, doorW, doorH);
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 2;
  ctx.strokeRect(doorX, doorY, doorW, doorH);
  const paneGrad = ctx.createLinearGradient(0, doorY, 0, doorY + doorH * 0.5);
  paneGrad.addColorStop(0, opts.glow);
  paneGrad.addColorStop(1, opts.accent);
  ctx.fillStyle = paneGrad;
  ctx.fillRect(doorX + doorW * 0.18, doorY + doorH * 0.12, doorW * 0.64, doorH * 0.42);
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.4;
  ctx.strokeRect(doorX + doorW * 0.18, doorY + doorH * 0.12, doorW * 0.64, doorH * 0.42);
  ctx.fillStyle = '#ffe0a0';
  ctx.beginPath();
  ctx.arc(doorX + doorW - 6, baseY - doorH * 0.42, 1.6, 0, Math.PI * 2);
  ctx.fill();

  // Sign plaque above the door.
  const signW = 74, signH = 20;
  ctx.fillStyle = opts.accent;
  ctx.fillRect(baseX - signW / 2, y + 10, signW, signH);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.lineWidth = 1;
  ctx.strokeRect(baseX - signW / 2, y + 10, signW, signH);
  ctx.fillStyle = '#2c1e10';
  ctx.font = '11px "Pirata One", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(opts.label, baseX, y + 10 + signH / 2 + 1);

  // Icon over the pediment.
  ctx.font = '22px sans-serif';
  ctx.fillText(opts.icon, baseX, y - h * 0.32 - 6);

  // A soft glow pooling at the base of the doorway, like light spilling
  // out — the same "hanging lantern" trick the market stalls use.
  const glow = ctx.createRadialGradient(baseX, baseY, 4, baseX, baseY, 46);
  glow.addColorStop(0, opts.glow + '55');
  glow.addColorStop(1, opts.glow + '00');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(baseX, baseY, 46, 0, Math.PI * 2); ctx.fill();
}
