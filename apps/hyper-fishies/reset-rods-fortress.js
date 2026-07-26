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

function keepPost(x, y, h = 70) {
  rounded(x - 12, y - h / 2, 24, h, 5, "#4b260f", "#150804", 4);
  ctx.fillStyle = "#1d0d04";
  ctx.beginPath();
  ctx.arc(x, y - h / 2 + 2, 11, 0, Math.PI * 2);
  ctx.fill();
}

function keepPlanks(x, y, w, h) {
  const deck = ctx.createLinearGradient(x, y, x + w, y + h);
  deck.addColorStop(0, "#c88843");
  deck.addColorStop(.5, "#8b4a1f");
  deck.addColorStop(1, "#43200c");
  ctx.fillStyle = deck;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = "rgba(35,14,4,.72)";
  ctx.lineWidth = 5;
  for (let px = x + 22; px < x + w; px += 42) {
    ctx.beginPath(); ctx.moveTo(px, y); ctx.lineTo(px + 8, y + h); ctx.stroke();
  }
  ctx.lineWidth = 4;
  for (let py = y + 34; py < y + h; py += 52) {
    ctx.beginPath(); ctx.moveTo(x, py); ctx.lineTo(x + w, py - 5); ctx.stroke();
  }
}

function battlement(x, y, w) {
  ctx.fillStyle = "#5a2c10";
  ctx.strokeStyle = "#150804";
  ctx.lineWidth = 3;
  for (let px = x; px < x + w; px += 34) rounded(px, y, 22, 24, 4, "#5a2c10", "#150804", 3);
}

function fortressLabel(x, y, w, text, fill) {
  rounded(x, y, w, 42, 8, fill, "#160804", 4);
  ctx.fillStyle = "#231006";
  ctx.font = "900 16px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(text, x + w / 2, y + 27);
}

function drawFortressTower(x, y, label, fill) {
  rounded(x, y, 170, 130, 12, "#70401d", "#160804", 8);
  keepPlanks(x + 10, y + 12, 150, 106);
  battlement(x + 12, y - 18, 146);
  fortressLabel(x + 26, y + 45, 118, label, fill);
  keepPost(x + 14, y + 22, 54);
  keepPost(x + 156, y + 22, 54);
}

drawIslandAndDock = function drawBetterWoodFortress() {
  ctx.save();

  // One strong floating silhouette, no random tropical pieces.
  ctx.fillStyle = "rgba(0, 18, 38, .42)";
  ctx.beginPath();
  ctx.ellipse(480, 324, 348, 188, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main keep platform.
  rounded(248, 112, 464, 324, 16, "#5d2e12", "#160804", 10);
  keepPlanks(260, 124, 440, 300);
  battlement(260, 92, 430);
  battlement(260, 424, 430);

  // Side towers are aligned and connected to the keep.
  rounded(202, 176, 62, 70, 10, "#6b3918", "#160804", 6);
  rounded(696, 176, 62, 70, 10, "#6b3918", "#160804", 6);
  drawFortressTower(72, 130, "ROD SHOP", "#81e8ff");
  drawFortressTower(718, 130, "SELL FISH", "#ff8a67");

  // Top fishing tower.
  rounded(382, 34, 196, 132, 14, "#70401d", "#160804", 8);
  keepPlanks(394, 48, 172, 106);
  battlement(398, 18, 160);
  rounded(442, 154, 76, 44, 8, "#70401d", "#160804", 5);
  fortressLabel(424, 78, 112, "FISH", "#ffe36e");

  // Clean rail posts and ropes.
  const topPosts = [[262,128],[342,118],[422,118],[502,118],[582,118],[690,128]];
  const bottomPosts = [[262,420],[342,432],[422,434],[502,434],[582,432],[690,420]];
  topPosts.concat(bottomPosts).forEach(p => keepPost(p[0], p[1], 58));
  ctx.strokeStyle = "#d6b077";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath(); topPosts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();
  ctx.beginPath(); bottomPosts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.stroke();

  // Fortress braces are organized, not messy Xs everywhere.
  ctx.strokeStyle = "rgba(34,15,4,.74)";
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(282, 156); ctx.lineTo(678, 156); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(282, 386); ctx.lineTo(678, 386); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(314, 190); ctx.lineTo(314, 354); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(646, 190); ctx.lineTo(646, 354); ctx.stroke();

  // Center command circle.
  rounded(388, 226, 184, 112, 18, "rgba(255,227,110,.20)", "rgba(255,241,190,.78)", 4);
  ctx.strokeStyle = "rgba(255,241,190,.86)";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(480, 282, 36, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "rgba(255,241,190,.90)";
  ctx.font = "900 13px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("SEA KEEP", 480, 286);

  // A few fortress props only.
  rounded(742, 420, 58, 40, 8, "#7a451d", "#160804", 4);
  rounded(166, 428, 58, 40, 8, "#7a451d", "#160804", 4);
  ctx.strokeStyle = "#d6b077";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(812, 282, 24, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(812, 282, 13, 0, Math.PI * 2); ctx.stroke();

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

say("Rods reset. Welcome back to the floating sea fortress.");
updateHud();
