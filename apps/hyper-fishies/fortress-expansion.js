// Cleaner lighter sea fortress. Loaded last for the final dock shape.
const expandedFortressZones = {
  keep: { x: 260, y: 150, w: 440, h: 286 },
  fish: { x: 386, y: 42, w: 188, h: 124 },
  sell: { x: 64, y: 210, w: 190, h: 136 },
  shop: { x: 706, y: 210, w: 190, h: 136 },
  leftBridge: { x: 248, y: 258, w: 42, h: 54 },
  rightBridge: { x: 670, y: 258, w: 42, h: 54 },
  fishBridge: { x: 438, y: 154, w: 84, h: 46 }
};

atFishingDock = function atExpandedFishingDock(p) { return inRect(p, expandedFortressZones.fish.x, expandedFortressZones.fish.y, expandedFortressZones.fish.w, expandedFortressZones.fish.h); };
atSellDock = function atExpandedSellDock(p) { return inRect(p, expandedFortressZones.sell.x, expandedFortressZones.sell.y, expandedFortressZones.sell.w, expandedFortressZones.sell.h); };
atShopDock = function atExpandedRodShopDock(p) { return inRect(p, expandedFortressZones.shop.x, expandedFortressZones.shop.y, expandedFortressZones.shop.w, expandedFortressZones.shop.h); };

constrainToDock = function constrainToExpandedFortressDock(p) {
  const areas = Object.values(expandedFortressZones);
  if (areas.some(rect => inRect(p, rect.x, rect.y, rect.w, rect.h))) return;
  p.x -= p.vx * 0.04;
  p.y -= p.vy * 0.04;
  p.x = clamp(p.x, 64, 896);
  p.y = clamp(p.y, 42, 436);
};

exitSellShop = function exitExpandedSellShop() {
  state.mode = "dock";
  state.player.x = 292;
  state.player.y = 286;
  state.player.vx = 0;
  state.player.vy = 0;
  say("Back at the fortress. Auto-saved.");
  saveGame();
};

function fortressWood(x, y, w, h, r = 14, line = 7) {
  rounded(x, y, w, h, r, "#c7833c", "#2f1406", line);
  const deck = ctx.createLinearGradient(x, y, x + w, y + h);
  deck.addColorStop(0, "#f0bd72");
  deck.addColorStop(.55, "#c77a32");
  deck.addColorStop(1, "#8a451a");
  ctx.fillStyle = deck;
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 8, w - 16, h - 16, Math.max(4, r - 4));
  ctx.fill();

  ctx.strokeStyle = "rgba(62, 27, 8, .48)";
  ctx.lineWidth = 4;
  for (let px = x + 30; px < x + w - 8; px += 48) {
    ctx.beginPath();
    ctx.moveTo(px, y + 10);
    ctx.lineTo(px + 8, y + h - 10);
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  for (let py = y + 40; py < y + h - 8; py += 64) {
    ctx.beginPath();
    ctx.moveTo(x + 10, py);
    ctx.lineTo(x + w - 10, py - 4);
    ctx.stroke();
  }
}

function fortressCrenels(x, y, w, count) {
  const gap = w / count;
  for (let i = 0; i < count; i++) {
    rounded(x + i * gap + 5, y, gap - 12, 22, 4, "#9c5627", "#2f1406", 3);
  }
}

function fortressTower(x, y, w, h, label, fill) {
  fortressWood(x, y, w, h, 16, 8);
  fortressCrenels(x + 12, y - 18, w - 24, 4);
  rounded(x + 28, y + 46, w - 56, 44, 10, fill, "#2f1406", 4);
  ctx.fillStyle = "#2a1307";
  ctx.font = "900 16px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 73);
}

function ropePost(x, y, h = 54) {
  rounded(x - 9, y - h / 2, 18, h, 5, "#6d3514", "#2b1004", 4);
  ctx.fillStyle = "#3a1808";
  ctx.beginPath();
  ctx.arc(x, y - h / 2, 9, 0, Math.PI * 2);
  ctx.fill();
}

function drawRope(points) {
  ctx.strokeStyle = "#f0c98a";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.stroke();
}

drawIslandAndDock = function drawCleanLightFortress() {
  ctx.save();

  ctx.fillStyle = "rgba(0, 19, 36, .34)";
  ctx.beginPath();
  ctx.ellipse(480, 318, 404, 186, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main fortress body: lighter, simpler, still strong.
  fortressWood(260, 150, 440, 286, 18, 10);
  fortressCrenels(280, 124, 400, 10);
  fortressCrenels(280, 430, 400, 10);

  // Simple parallel side shops.
  fortressWood(248, 258, 42, 54, 9, 6);
  fortressWood(670, 258, 42, 54, 9, 6);
  fortressTower(64, 210, 190, 136, "SELL FISH", "#ff9a73");
  fortressTower(706, 210, 190, 136, "ROD SHOP", "#91eaff");

  // One upper fishing tower.
  fortressWood(438, 154, 84, 46, 9, 6);
  fortressTower(386, 42, 188, 124, "FISH", "#ffe36e");

  // Just two small guard blocks instead of lots of clutter.
  fortressWood(304, 190, 76, 72, 12, 6);
  fortressWood(580, 190, 76, 72, 12, 6);

  // Clean center area.
  rounded(394, 248, 172, 92, 18, "rgba(255, 236, 150, .22)", "rgba(255, 246, 210, .72)", 4);
  ctx.strokeStyle = "rgba(255, 246, 210, .86)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(480, 294, 32, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,246,210,.95)";
  ctx.font = "900 13px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("SEA KEEP", 480, 298);

  // A few rails to keep the fortress outline readable.
  const upper = [[278,166],[382,154],[480,154],[578,154],[682,166]];
  const lower = [[278,420],[382,436],[480,440],[578,436],[682,420]];
  upper.concat(lower).forEach(p => ropePost(p[0], p[1], 52));
  drawRope(upper);
  drawRope(lower);

  // Minimal props.
  rounded(420, 366, 48, 32, 8, "#a75b25", "#2f1406", 4);
  rounded(500, 366, 48, 32, 8, "#a75b25", "#2f1406", 4);

  ctx.restore();
};

drawDockLabels = function drawExpandedFortressLabel() {
  ctx.fillStyle = "rgba(255,245,209,.96)";
  ctx.font = "900 18px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("SEA FORTRESS", 18, 74);
};

drawDockView = function drawExpandedFortressDockView() {
  drawTopWater();
  drawIslandAndDock();
  drawDockLabels();
  drawCirclePlayer();
};

say("The fortress is cleaner and easier to read now.");
updateHud();
