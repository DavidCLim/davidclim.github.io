import { WORLD_W, WORLD_H } from '../core/constants.js';
import { WALKABLE_RECT, LOCKER_BANKS } from '../data/campusMap.js';
import { drawShadow } from './drawShadow.js';

// A waxed-tile hallway floor — same "gradient base + row/column seam
// lines" technique Hyper Fishies' drawBoardwalk.js uses for planks, just
// square checkerboard tiles instead of wood strips, since a school hall
// reads instantly as a school hall by its floor tiling.
function drawFloor(ctx) {
  const grad = ctx.createLinearGradient(0, WALKABLE_RECT.y, 0, WORLD_H);
  grad.addColorStop(0, '#e4cf9c');
  grad.addColorStop(1, '#c9a876');
  ctx.fillStyle = grad;
  ctx.fillRect(0, WALKABLE_RECT.y, WORLD_W, WORLD_H - WALKABLE_RECT.y);

  const TILE = 40;
  for (let ty = WALKABLE_RECT.y; ty < WORLD_H; ty += TILE) {
    for (let tx = 0; tx < WORLD_W; tx += TILE) {
      const alt = ((tx / TILE) + (ty / TILE)) % 2 === 0;
      if (alt) {
        ctx.fillStyle = 'rgba(0,0,0,0.05)';
        ctx.fillRect(tx, ty, TILE, TILE);
      }
      ctx.strokeStyle = 'rgba(58,42,22,0.15)';
      ctx.lineWidth = 1;
      ctx.strokeRect(tx, ty, TILE, TILE);
    }
  }

  // A soft vignette so the floor darkens toward the bottom edge instead of
  // reading as an infinite flat plane.
  const vgrad = ctx.createLinearGradient(0, WORLD_H - 80, 0, WORLD_H);
  vgrad.addColorStop(0, 'rgba(20,12,6,0)');
  vgrad.addColorStop(1, 'rgba(20,12,6,0.22)');
  ctx.fillStyle = vgrad;
  ctx.fillRect(0, WORLD_H - 80, WORLD_W, 80);
}

// Wainscoted back wall — a dark wood lower band and a warm plaster upper
// band, a couple of glowing windows, and a trophy case, filling the strip
// above WALKABLE_RECT.
function drawBackWall(ctx) {
  ctx.fillStyle = '#3c2a1a';
  ctx.fillRect(0, 0, WORLD_W, WALKABLE_RECT.y);
  ctx.fillStyle = '#2c1e10';
  ctx.fillRect(0, WALKABLE_RECT.y - 22, WORLD_W, 22);
  ctx.fillStyle = 'rgba(255,255,255,0.04)';
  for (let x = 0; x < WORLD_W; x += 60) ctx.fillRect(x, 0, 2, WALKABLE_RECT.y - 22);

  // Windows, warm evening light glowing through.
  for (const wx of [430, 490]) {
    const grad = ctx.createLinearGradient(0, 20, 0, 90);
    grad.addColorStop(0, '#ffe0a0');
    grad.addColorStop(1, '#d69a4a');
    ctx.fillStyle = grad;
    ctx.fillRect(wx, 20, 40, 70);
    ctx.strokeStyle = '#241708';
    ctx.lineWidth = 3;
    ctx.strokeRect(wx, 20, 40, 70);
    ctx.beginPath(); ctx.moveTo(wx + 20, 20); ctx.lineTo(wx + 20, 90); ctx.moveTo(wx, 55); ctx.lineTo(wx + 40, 55); ctx.stroke();
  }

  // Trophy case, off to one side — small "school pride" prop.
  const tcX = 760, tcY = 26, tcW = 70, tcH = 84;
  drawShadow(ctx, tcX + tcW / 2, tcY + tcH + 4, tcW * 0.5, 6, 0.3);
  ctx.fillStyle = '#5a3f28';
  ctx.fillRect(tcX, tcY, tcW, tcH);
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 2;
  ctx.strokeRect(tcX, tcY, tcW, tcH);
  ctx.fillStyle = 'rgba(180, 220, 255, 0.18)';
  ctx.fillRect(tcX + 5, tcY + 5, tcW - 10, tcH - 10);
  ctx.font = '26px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('🏆', tcX + tcW / 2, tcY + tcH / 2 + 9);

  // Corkboard on the other side.
  const cbX = 130, cbY = 26, cbW = 70, cbH = 84;
  drawShadow(ctx, cbX + cbW / 2, cbY + cbH + 4, cbW * 0.5, 6, 0.3);
  ctx.fillStyle = '#a3835a';
  ctx.fillRect(cbX, cbY, cbW, cbH);
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 2;
  ctx.strokeRect(cbX, cbY, cbW, cbH);
  const pins = [[-18, -22, '#ff6f59'], [10, -14, '#5fe3c0'], [-6, 10, '#ffb454'], [16, 20, '#c896ff']];
  for (const [px, py, col] of pins) {
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(cbX + cbW / 2 + px - 9, cbY + cbH / 2 + py - 6, 18, 13);
    ctx.strokeStyle = 'rgba(0,0,0,0.2)';
    ctx.lineWidth = 1;
    ctx.strokeRect(cbX + cbW / 2 + px - 9, cbY + cbH / 2 + py - 6, 18, 13);
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.arc(cbX + cbW / 2 + px, cbY + cbH / 2 + py - 6, 1.6, 0, Math.PI * 2); ctx.fill();
  }
}

function drawLocker(ctx, x, y, accent) {
  const w = 30, h = 60;
  ctx.fillStyle = accent;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#241708';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(x, y, w, h);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  for (let vy = y + 8; vy < y + h - 6; vy += 6) {
    ctx.beginPath(); ctx.moveTo(x + 4, vy); ctx.lineTo(x + w - 8, vy); ctx.stroke();
  }
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(x + w - 7, y + h / 2 - 4, 3, 8);
  ctx.fillStyle = 'rgba(255,255,255,0.12)';
  ctx.fillRect(x + 2, y + 2, 4, h - 4);
}

function drawLockers(ctx) {
  const ACCENTS = ['#7a2e2e', '#4a7a5a', '#ffb454'];
  for (const bank of LOCKER_BANKS) {
    for (let i = 0; i < bank.count; i++) {
      drawLocker(ctx, bank.x + i * 34, bank.y, ACCENTS[i % ACCENTS.length]);
    }
  }
}

export function drawHallway(ctx) {
  drawFloor(ctx);
  drawBackWall(ctx);
  drawLockers(ctx);
}
