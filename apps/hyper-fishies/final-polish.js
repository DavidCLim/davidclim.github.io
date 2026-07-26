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
  [[238,106],[350,94],[480,92],[610,94],[722,106],[238,458],[350,472],[480,474],[610,472],[722,458]].forEach(p => finalDockPost(p[0], p[1]));
  ctx.strokeStyle = "#f4d292";
  ctx.lineWidth = 6;
  sketchLine([[238,110],[350,100],[480,98],[610,100],[722,110]]);
  sketchLine([[238,462],[350,474],[480,476],[610,474],[722,462]]);
  rounded(398, 34, 164, 124, 18, "#bc7130", "#4e280b", 8);
  rounded(448, 102, 64, 58, 10, "#bc7130", "#4e280b", 5);
  finalDockPost(410, 52);
  finalDockPost(550, 52);
  rounded(214, 128, 52, 40, 10, "#b96c31", "#4e280b", 5);
  rounded(214, 392, 52, 40, 10, "#b96c31", "#4e280b", 5);
  finalShopHut(44, 82, "ROD SHOP", "#20d6ff", "#fff3aa");
  finalShopHut(44, 358, "SELL FISH", "#ff6654", "#fff3aa");
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

function finalBubbleField() {
  ctx.save();
  for (let i = 0; i < 34; i++) {
    const x = (i * 73 + performance.now() / (22 + i)) % 1000 - 20;
    const y = 28 + ((i * 41 + performance.now() / (28 + i)) % 500);
    ctx.globalAlpha = 0.14 + (i % 3) * 0.06;
    ctx.strokeStyle = "#ecfffb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(x, y, 4 + (i % 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function finalTitleFish(x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  drawMenuFish(0, 0, 28, color);
  ctx.restore();
}

function drawHomeScreen() {
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#72f4ff");
  bg.addColorStop(.38, "#17b7e8");
  bg.addColorStop(.72, "#0877c4");
  bg.addColorStop(1, "#05336f");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  finalBubbleField();
  finalPalm(88, 418, .78);
  finalPalm(858, 104, .72, -1);
  finalCoral(92, 510, "#ff6e91");
  finalCoral(816, 492, "#b47cff");
  finalTitleFish(160, 150, 1.1, "#ff8a74");
  finalTitleFish(810, 210, 1.35, "#ffe36e");
  finalTitleFish(760, 420, .9, "#8dffda");

  rounded(166, 56, 628, 436, 26, "rgba(224, 255, 239, .94)", "#09283d", 6);
  const shine = ctx.createLinearGradient(166, 56, 794, 492);
  shine.addColorStop(0, "rgba(113, 238, 255, .45)");
  shine.addColorStop(.45, "rgba(255, 227, 110, .28)");
  shine.addColorStop(1, "rgba(87, 255, 154, .35)");
  ctx.fillStyle = shine;
  ctx.fillRect(173, 63, 614, 422);

  ctx.save();
  ctx.translate(0, Math.sin(performance.now() / 900) * 4);
  drawHandTitle(480, 214);
  ctx.restore();
  drawSavingIcon(480, 82, true);
  drawMenuButton(376, 314, 208, 50, "PLAY", playFromMenu);
  drawMenuButton(376, 382, 208, 50, "CREDITS", creditsFromMenu);
  if (state.menuPage === "credits") drawCreditsPanel();
}

function drawPowerMeter() {
  if (!state.castPower) return;
  const x = 240, y = 422, w = 480, h = 38;
  rounded(x, y, w, h, 19, "rgba(3, 32, 61, .88)", "#ecfffb", 4);
  const grad = ctx.createLinearGradient(x + 10, y, x + w - 10, y);
  grad.addColorStop(0, "#4db9ff");
  grad.addColorStop(.48, "#63ff93");
  grad.addColorStop(.76, "#ffe36e");
  grad.addColorStop(1, "#ff7a52");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 9, w - 20, h - 18, 10);
  ctx.fill();
  const px = x + 10 + state.castPower.power * (w - 20);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#05263d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(px, y + h / 2, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe36e";
  ctx.font = "900 17px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("CAST DISTANCE - TAP AGAIN FOR POWER", x + w / 2, y - 12);
}
