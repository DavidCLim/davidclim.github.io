// Final dock polish layer. Loaded last so the tropical dock wins over older layout scripts.
drawDockLabels = function drawDockLabelsFinal() {
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.font = "900 18px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("TROPICAL DOCK", 18, 74);
};

function finalPalm(x, y, scale, flip = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * flip, scale);
  ctx.strokeStyle = "#5f3516";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(0, 86);
  ctx.quadraticCurveTo(12, 38, -8, 0);
  ctx.stroke();
  ctx.fillStyle = "#26d46e";
  ctx.strokeStyle = "#075f35";
  ctx.lineWidth = 3;
  for (let i = 0; i < 7; i++) {
    ctx.save();
    ctx.rotate((i - 3) * 0.43);
    ctx.beginPath();
    ctx.ellipse(26, -8, 48, 13, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.fillStyle = "#8b5a24";
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(-8 + i * 9, 4 + i * 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function finalCoral(x, y, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = color;
  ctx.lineWidth = 7;
  ctx.lineCap = "round";
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(i * 10, 28);
    ctx.quadraticCurveTo(i * 7 - 9, 8, i * 12, -16);
    ctx.stroke();
  }
  ctx.restore();
}

function finalDockPost(x, y) {
  rounded(x - 12, y - 24, 24, 58, 8, "#6b3a17", "#2b1406", 4);
  ctx.fillStyle = "rgba(255,231,157,.25)";
  ctx.fillRect(x - 7, y - 19, 6, 46);
}

function finalShopHut(x, y, label, awningA, awningB) {
  rounded(x, y, 210, 96, 18, "#ad652e", "#4d280c", 7);
  rounded(x + 18, y + 16, 174, 54, 14, "rgba(255,226,151,.34)", "rgba(70,37,12,.55)", 3);
  rounded(x + 10, y - 14, 190, 38, 14, awningA, "#09283d", 4);
  ctx.fillStyle = awningB;
  ctx.strokeStyle = "rgba(9,40,61,.75)";
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 17 + i * 30, y - 11);
    ctx.lineTo(x + 32 + i * 30, y + 20);
    ctx.lineTo(x + 47 + i * 30, y - 11);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
  rounded(x + 40, y + 34, 130, 42, 10, "#ffe36e", "#4d280c", 4);
  ctx.fillStyle = "#3b210b";
  ctx.font = "900 17px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(label, x + 105, y + 61);
}

drawIslandAndDock = function drawIslandAndDockFinalTropical() {
  ctx.save();

  // Sandbank and shallow-water glow.
  rounded(172, 58, 616, 450, 70, "#f8dd9a", "#8b6a31", 7);
  ctx.fillStyle = "rgba(255,255,255,.17)";
  ctx.beginPath();
  ctx.ellipse(480, 282, 275, 178, -0.06, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "rgba(255,255,255,.36)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(480, 282, 305, 204, -0.06, 0, Math.PI * 2);
  ctx.stroke();

  // Main wooden dock, warmer and chunkier.
  rounded(226, 86, 508, 392, 28, "#c57935", "#4e280b", 9);
  const glow = ctx.createLinearGradient(226, 86, 734, 478);
  glow.addColorStop(0, "rgba(255,233,164,.46)");
  glow.addColorStop(.45, "rgba(207,119,48,.10)");
  glow.addColorStop(1, "rgba(45,21,6,.34)");
  ctx.fillStyle = glow;
  ctx.fillRect(238, 98, 484, 368);

  ctx.strokeStyle = "rgba(61,29,8,.72)";
  ctx.lineWidth = 5;
  for (let x = 252; x < 720; x += 34) {
    ctx.beginPath();
    ctx.moveTo(x, 94);
    ctx.lineTo(x + 12, 468);
    ctx.stroke();
  }
  ctx.lineWidth = 4;
  for (let y = 120; y < 466; y += 46) {
    ctx.beginPath();
    ctx.moveTo(236, y);
    ctx.lineTo(724, y - 7);
    ctx.stroke();
  }

  // Posts and rope rails make it feel like one connected dock instead of odd shop boxes.
  [[238,106],[350,94],[480,92],[610,94],[722,106],[238,458],[350,472],[480,474],[610,472],[722,458]].forEach(p => finalDockPost(p[0], p[1]));
  ctx.strokeStyle = "#f4d292";
  ctx.lineWidth = 6;
  sketchLine([[238,110],[350,100],[480,98],[610,100],[722,110]]);
  sketchLine([[238,462],[350,474],[480,476],[610,474],[722,462]]);

  // Fishing pier is smaller and clearly attached at the top.
  rounded(398, 34, 164, 124, 18, "#bc7130", "#4e280b", 8);
  rounded(448, 102, 64, 58, 10, "#bc7130", "#4e280b", 5);
  finalDockPost(410, 52);
  finalDockPost(550, 52);

  // Shop spaces are rounded huts on the sand, connected with little plank bridges.
  rounded(214, 128, 52, 40, 10, "#b96c31", "#4e280b", 5);
  rounded(214, 392, 52, 40, 10, "#b96c31", "#4e280b", 5);
  finalShopHut(44, 82, "ROD SHOP", "#20d6ff", "#fff3aa");
  finalShopHut(44, 358, "SELL FISH", "#ff6654", "#fff3aa");

  // Center mark and tropical decoration.
  rounded(392, 232, 176, 102, 24, "rgba(255,238,140,.30)", "rgba(255,255,255,.72)", 3);
  ctx.strokeStyle = "rgba(255,255,255,.62)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(480, 282, 31, 0, Math.PI * 2);
  ctx.stroke();

  finalPalm(804, 92, .75, -1);
  finalPalm(194, 474, .72, 1);
  finalPalm(770, 438, .52, -1);
  finalCoral(780, 500, "#ff6e91");
  finalCoral(150, 88, "#ff9f5d");
  finalCoral(812, 250, "#b47cff");

  drawSign(423, 68, "FISH");
  ctx.restore();
};
