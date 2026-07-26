// Final reset + fortress redraw. Loaded last.
const rodResetFlag = "hyperFishiesRodReset20260726V1";
try {
  if (localStorage.getItem(rodResetFlag) !== "done") {
    state.progress.ownedRods = [1];
    state.progress.currentRod = 1;
    state.progress.rod = 1;
    state.bagLimit = 6;
    localStorage.setItem(rodResetFlag, "done");
    saveGame();
  }
} catch {}
normalizeRodProgress();

const fortressZones = {
  keep: { x: 260, y: 150, w: 440, h: 284 },
  fish: { x: 390, y: 44, w: 180, h: 122 },
  sell: { x: 70, y: 210, w: 180, h: 140 },
  shop: { x: 710, y: 210, w: 180, h: 140 },
  leftBridge: { x: 246, y: 254, w: 24, h: 62 },
  rightBridge: { x: 690, y: 254, w: 24, h: 62 },
  fishBridge: { x: 442, y: 158, w: 76, h: 44 }
};

atFishingDock = function atFortressFishingDock(p) { return inRect(p, fortressZones.fish.x, fortressZones.fish.y, fortressZones.fish.w, fortressZones.fish.h); };
atSellDock = function atFortressSellDock(p) { return inRect(p, fortressZones.sell.x, fortressZones.sell.y, fortressZones.sell.w, fortressZones.sell.h); };
atShopDock = function atFortressRodShopDock(p) { return inRect(p, fortressZones.shop.x, fortressZones.shop.y, fortressZones.shop.w, fortressZones.shop.h); };

constrainToDock = function constrainToFortressDock(p) {
  const areas = [fortressZones.keep, fortressZones.fish, fortressZones.sell, fortressZones.shop, fortressZones.leftBridge, fortressZones.rightBridge, fortressZones.fishBridge];
  if (areas.some(rect => inRect(p, rect.x, rect.y, rect.w, rect.h))) return;
  p.x -= p.vx * 0.04;
  p.y -= p.vy * 0.04;
  p.x = clamp(p.x, 70, 890);
  p.y = clamp(p.y, 44, 434);
};

exitSellShop = function exitFortressSellShop() {
  state.mode = "dock";
  state.player.x = 284;
  state.player.y = 282;
  state.player.vx = 0;
  state.player.vy = 0;
  say("Back at the fortress. Auto-saved.");
  saveGame();
};

function keepPost(x, y, h = 70) {
  rounded(x - 12, y - h / 2, 24, h, 5, "#4b260f", "#150804", 4);
  ctx.fillStyle = "#1d0d04";
  ctx.beginPath();
  ctx.arc(x, y - h / 2 + 2, 11, 0, Math.PI * 2);
  ctx.fill();
}

function keepPlanks(x, y, w, h) {
  const deck = ctx.createLinearGradient(x, y, x + w, y + h);
  deck.addColorStop(0, "#d3994f");
  deck.addColorStop(.48, "#945120");
  deck.addColorStop(1, "#3d1b09");
  ctx.fillStyle = deck;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(35,14,4,.74)";
  ctx.lineWidth = 5;
  for (let px = x + 24; px < x + w; px += 42) {
    ctx.beginPath();
    ctx.moveTo(px, y);
    ctx.lineTo(px + 8, y + h);
    ctx.stroke();
  }
  ctx.lineWidth = 4;
  for (let py = y + 34; py < y + h; py += 52) {
    ctx.beginPath();
    ctx.moveTo(x, py);
    ctx.lineTo(x + w, py - 5);
    ctx.stroke();
  }
}

function battlement(x, y, w) {
  for (let px = x; px < x + w; px += 34) rounded(px, y, 22, 24, 4, "#5a2c10", "#150804", 3);
}

function fortressLabel(x, y, w, text, fill) {
  rounded(x, y, w, 42, 8, fill, "#160804", 4);
  ctx.fillStyle = "#231006";
  ctx.font = "900 15px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(text, x + w / 2, y + 27);
}

function drawFortressTower(x, y, label, fill) {
  rounded(x, y, 180, 140, 12, "#6a3718", "#160804", 8);
  keepPlanks(x + 11, y + 14, 158, 112);
  battlement(x + 15, y - 18, 150);
  fortressLabel(x + 28, y + 50, 124, label, fill);
  keepPost(x + 16, y + 26, 58);
  keepPost(x + 164, y + 26, 58);
  ctx.strokeStyle = "rgba(255,235,176,.45)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 26, y + 116);
  ctx.lineTo(x + 154, y + 24);
  ctx.stroke();
}

function drawBridge(x, y, w, h) {
  rounded(x, y, w, h, 8, "#6f3b19", "#160804", 6);
  keepPlanks(x + 4, y + 6, w - 8, h - 12);
}

drawIslandAndDock = function drawParallelFortressDock() {
  ctx.save();

  ctx.fillStyle = "rgba(0, 18, 38, .42)";
  ctx.beginPath();
  ctx.ellipse(480, 322, 396, 188, 0, 0, Math.PI * 2);
  ctx.fill();

  // Strong central floating keep.
  rounded(260, 150, 440, 284, 16, "#5d2e12", "#160804", 10);
  keepPlanks(272, 162, 416, 260);
  battlement(272, 126, 404);
  battlement(272, 424, 404);

  // Parallel shop wings: sell left, rod shop right.
  drawBridge(246, 254, 28, 62);
  drawBridge(686, 254, 28, 62);
  drawFortressTower(70, 210, "SELL FISH", "#ff8a67");
  drawFortressTower(710, 210, "ROD SHOP", "#81e8ff");

  // Fishing tower above the keep.
  rounded(390, 44, 180, 122, 14, "#70401d", "#160804", 8);
  keepPlanks(402, 58, 156, 94);
  battlement(404, 20, 146);
  drawBridge(442, 158, 76, 44);
  fortressLabel(424, 82, 112, "FISH", "#ffe36e");

  // Watch towers and side structures make it fortress-like without clutter.
  rounded(292, 182, 72, 74, 12, "#70401d", "#160804", 7);
  keepPlanks(302, 194, 52, 50);
  battlement(298, 162, 58);
  rounded(596, 182, 72, 74, 12, "#70401d", "#160804", 7);
  keepPlanks(606, 194, 52, 50);
  battlement(602, 162, 58);
  rounded(292, 328, 72, 74, 12, "#70401d", "#160804", 7);
  keepPlanks(302, 340, 52, 50);
  rounded(596, 328, 72, 74, 12, "#70401d", "#160804", 7);
  keepPlanks(606, 340, 52, 50);

  // Organized rails and ropes.
  const topPosts = [[276,166],[354,154],[432,154],[528,154],[606,154],[684,166]];
  const bottomPosts = [[276,418],[354,434],[432,436],[528,436],[606,434],[684,418]];
  topPosts.concat(bottomPosts).forEach(p => keepPost(p[0], p[1], 58));
  ctx.strokeStyle = "#d6b077";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath(); topPosts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  ctx.beginPath(); bottomPosts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();

  // Clean braces and main command area.
  ctx.strokeStyle = "rgba(34,15,4,.74)";
  ctx.lineWidth = 7;
  [[300,282,660,282],[318,200,318,382],[642,200,642,382],[376,174,584,410],[584,174,376,410]].forEach(line => {
    ctx.beginPath();
    ctx.moveTo(line[0], line[1]);
    ctx.lineTo(line[2], line[3]);
    ctx.stroke();
  });

  rounded(394, 226, 172, 112, 18, "rgba(255,227,110,.20)", "rgba(255,241,190,.78)", 4);
  ctx.strokeStyle = "rgba(255,241,190,.86)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(480, 282, 36, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,241,190,.90)";
  ctx.font = "900 13px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("SEA KEEP", 480, 286);

  // Structural props.
  rounded(410, 364, 54, 36, 8, "#7a451d", "#160804", 4);
  rounded(500, 364, 54, 36, 8, "#7a451d", "#160804", 4);
  ctx.strokeStyle = "#d6b077";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(188, 390, 24, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(188, 390, 13, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(772, 390, 24, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(772, 390, 13, 0, Math.PI * 2); ctx.stroke();

  ctx.restore();
};

drawDockLabels = function drawBetterFortressLabel() {
  ctx.fillStyle = "rgba(255,245,209,.94)";
  ctx.font = "900 18px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("FLOATING SEA FORTRESS", 18, 74);
};

drawDockView = function drawBetterFortressDockView() {
  drawTopWater();
  drawIslandAndDock();
  drawDockLabels();
  drawCirclePlayer();
};

say("Rods reset. Sell shop is left, rod shop is right.");
updateHud();
