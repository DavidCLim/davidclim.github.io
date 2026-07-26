// Expanded lighter sea fortress. Loaded last for the final dock shape.
const expandedFortressZones = {
  keep: { x: 238, y: 132, w: 484, h: 316 },
  fish: { x: 380, y: 28, w: 200, h: 132 },
  sell: { x: 44, y: 198, w: 206, h: 156 },
  shop: { x: 710, y: 198, w: 206, h: 156 },
  leftBridge: { x: 238, y: 248, w: 58, h: 76 },
  rightBridge: { x: 664, y: 248, w: 58, h: 76 },
  fishBridge: { x: 430, y: 146, w: 100, h: 58 },
  lowerDeck: { x: 336, y: 416, w: 288, h: 72 }
};

atFishingDock = function atExpandedFishingDock(p) { return inRect(p, expandedFortressZones.fish.x, expandedFortressZones.fish.y, expandedFortressZones.fish.w, expandedFortressZones.fish.h); };
atSellDock = function atExpandedSellDock(p) { return inRect(p, expandedFortressZones.sell.x, expandedFortressZones.sell.y, expandedFortressZones.sell.w, expandedFortressZones.sell.h); };
atShopDock = function atExpandedRodShopDock(p) { return inRect(p, expandedFortressZones.shop.x, expandedFortressZones.shop.y, expandedFortressZones.shop.w, expandedFortressZones.shop.h); };

constrainToDock = function constrainToExpandedFortressDock(p) {
  const areas = Object.values(expandedFortressZones);
  if (areas.some(rect => inRect(p, rect.x, rect.y, rect.w, rect.h))) return;
  p.x -= p.vx * 0.04;
  p.y -= p.vy * 0.04;
  p.x = clamp(p.x, 44, 916);
  p.y = clamp(p.y, 28, 488);
};

exitSellShop = function exitExpandedSellShop() {
  state.mode = "dock";
  state.player.x = 282;
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
  deck.addColorStop(.42, "#c77a32");
  deck.addColorStop(1, "#7d3e17");
  ctx.fillStyle = deck;
  ctx.beginPath();
  ctx.roundRect(x + 8, y + 8, w - 16, h - 16, Math.max(4, r - 4));
  ctx.fill();
  ctx.strokeStyle = "rgba(62, 27, 8, .58)";
  ctx.lineWidth = 4;
  for (let px = x + 26; px < x + w - 8; px += 38) {
    ctx.beginPath();
    ctx.moveTo(px, y + 10);
    ctx.lineTo(px + 10, y + h - 10);
    ctx.stroke();
  }
  ctx.lineWidth = 3;
  for (let py = y + 32; py < y + h - 8; py += 46) {
    ctx.beginPath();
    ctx.moveTo(x + 10, py);
    ctx.lineTo(x + w - 10, py - 5);
    ctx.stroke();
  }
}

function fortressWall(x, y, w, h) {
  rounded(x, y, w, h, 10, "#8d4a1f", "#2f1406", 6);
  ctx.fillStyle = "rgba(255, 229, 165, .18)";
  ctx.fillRect(x + 8, y + 8, w - 16, h - 16);
}

function fortressCrenels(x, y, w, count) {
  const gap = w / count;
  for (let i = 0; i < count; i++) {
    const px = x + i * gap + 4;
    rounded(px, y, gap - 10, 24, 4, "#9c5627", "#2f1406", 3);
  }
}

function fortressTower(x, y, w, h, label, fill) {
  fortressWood(x, y, w, h, 16, 8);
  fortressCrenels(x + 10, y - 20, w - 20, 5);
  rounded(x + 22, y + 46, w - 44, 46, 10, fill, "#2f1406", 4);
  ctx.fillStyle = "#2a1307";
  ctx.font = "900 16px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 75);

  ctx.strokeStyle = "rgba(255, 238, 190, .44)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 24, y + h - 25);
  ctx.lineTo(x + w - 24, y + 26);
  ctx.stroke();
}

function ropePost(x, y, h = 58) {
  rounded(x - 10, y - h / 2, 20, h, 5, "#6d3514", "#2b1004", 4);
  ctx.fillStyle = "#3a1808";
  ctx.beginPath();
  ctx.arc(x, y - h / 2, 10, 0, Math.PI * 2);
  ctx.fill();
}

function drawRope(points) {
  ctx.strokeStyle = "#f0c98a";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.stroke();
}

function drawLittleRoof(x, y, w) {
  ctx.fillStyle = "#6f2a16";
  ctx.strokeStyle = "#2f1406";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 28);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w, y + 28);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(255, 223, 150, .35)";
  ctx.lineWidth = 3;
  for (let px = x + 18; px < x + w - 14; px += 30) {
    ctx.beginPath();
    ctx.moveTo(px, y + 22);
    ctx.lineTo(x + w / 2, y + 4);
    ctx.stroke();
  }
}

drawIslandAndDock = function drawExpandedLightFortress() {
  ctx.save();

  ctx.fillStyle = "rgba(0, 19, 36, .36)";
  ctx.beginPath();
  ctx.ellipse(480, 330, 430, 202, 0, 0, Math.PI * 2);
  ctx.fill();

  // Expanded lower deck and side bridges give the fortress more footprint.
  fortressWood(336, 416, 288, 72, 14, 7);
  fortressWood(238, 132, 484, 316, 18, 10);
  fortressCrenels(258, 106, 444, 12);
  fortressCrenels(258, 442, 444, 12);

  fortressWood(238, 248, 58, 76, 10, 7);
  fortressWood(664, 248, 58, 76, 10, 7);
  fortressWood(430, 146, 100, 58, 10, 7);

  // Left and right shops are parallel and clearly labeled.
  fortressTower(44, 198, 206, 156, "SELL FISH", "#ff9a73");
  fortressTower(710, 198, 206, 156, "ROD SHOP", "#91eaff");

  // Fishing tower plus small roofed gate.
  fortressTower(380, 28, 200, 132, "FISH", "#ffe36e");
  drawLittleRoof(404, 34, 152);

  // Four guard towers and wall sections.
  [[266,160],[622,160],[266,346],[622,346]].forEach(([x, y]) => {
    fortressWood(x, y, 86, 82, 12, 7);
    fortressCrenels(x + 8, y - 18, 70, 3);
  });
  fortressWall(366, 162, 228, 38);
  fortressWall(366, 382, 228, 38);
  fortressWall(286, 254, 74, 58);
  fortressWall(600, 254, 74, 58);

  // Clean braces and a command circle.
  ctx.strokeStyle = "rgba(58, 24, 7, .68)";
  ctx.lineWidth = 7;
  [[296,284,664,284],[382,176,578,404],[578,176,382,404],[480,168,480,410],[310,218,650,350],[650,218,310,350]].forEach(line => {
    ctx.beginPath();
    ctx.moveTo(line[0], line[1]);
    ctx.lineTo(line[2], line[3]);
    ctx.stroke();
  });

  rounded(392, 232, 176, 106, 18, "rgba(255, 236, 150, .24)", "rgba(255, 246, 210, .78)", 4);
  ctx.strokeStyle = "rgba(255, 246, 210, .92)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(480, 285, 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,246,210,.95)";
  ctx.font = "900 13px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("SEA KEEP", 480, 289);

  // Rail posts and ropes around the expanded fortress.
  const upper = [[246,154],[340,138],[432,136],[528,136],[620,138],[714,154]];
  const lower = [[246,426],[340,450],[432,462],[528,462],[620,450],[714,426]];
  upper.concat(lower).forEach(p => ropePost(p[0], p[1], 58));
  drawRope(upper);
  drawRope(lower);
  [[96,360],[198,360],[762,360],[864,360],[390,484],[570,484]].forEach(p => ropePost(p[0], p[1], 48));

  // Fortress objects: crates, barrels, anchor rings.
  rounded(394, 354, 56, 38, 8, "#a75b25", "#2f1406", 4);
  rounded(510, 354, 56, 38, 8, "#a75b25", "#2f1406", 4);
  rounded(308, 216, 34, 42, 8, "#8a421a", "#2f1406", 4);
  rounded(618, 216, 34, 42, 8, "#8a421a", "#2f1406", 4);
  ctx.strokeStyle = "#f0c98a";
  ctx.lineWidth = 4;
  [158, 802].forEach(x => {
    ctx.beginPath(); ctx.arc(x, 386, 24, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x, 386, 13, 0, Math.PI * 2); ctx.stroke();
  });

  ctx.restore();
};

drawDockLabels = function drawExpandedFortressLabel() {
  ctx.fillStyle = "rgba(255,245,209,.96)";
  ctx.font = "900 18px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("EXPANDED SEA FORTRESS", 18, 74);
};

drawDockView = function drawExpandedFortressDockView() {
  drawTopWater();
  drawIslandAndDock();
  drawDockLabels();
  drawCirclePlayer();
};

say("The fortress has expanded with lighter wood and bigger structures.");
updateHud();
