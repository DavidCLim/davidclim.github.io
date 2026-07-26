// Final dock theme: floating wooden fortress, no tropical decoration.
function fortressPost(x, y, h = 62) {
  rounded(x - 13, y - h / 2, 26, h, 6, "#4d2710", "#170b04", 4);
  ctx.fillStyle = "rgba(255,220,135,.20)";
  ctx.fillRect(x - 8, y - h / 2 + 6, 5, h - 12);
  ctx.fillStyle = "#231006";
  ctx.beginPath();
  ctx.arc(x, y - h / 2 + 4, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#170b04";
  ctx.lineWidth = 3;
  ctx.stroke();
}

function fortressRope(points) {
  ctx.strokeStyle = "#d6b077";
  ctx.lineWidth = 6;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.stroke();
  ctx.strokeStyle = "rgba(62,31,10,.65)";
  ctx.lineWidth = 2;
  ctx.stroke();
}

function fortressTower(x, y, w, h, label, color) {
  rounded(x, y, w, h, 10, "#71401d", "#1d0d04", 7);
  const shade = ctx.createLinearGradient(x, y, x + w, y + h);
  shade.addColorStop(0, "rgba(255,221,145,.30)");
  shade.addColorStop(.55, "rgba(119,64,25,.12)");
  shade.addColorStop(1, "rgba(20,9,3,.42)");
  ctx.fillStyle = shade;
  ctx.fillRect(x + 7, y + 7, w - 14, h - 14);

  ctx.fillStyle = "#482309";
  for (let i = 0; i < 4; i++) {
    rounded(x + 12 + i * ((w - 34) / 3), y - 15, 22, 24, 5, "#5b2e12", "#1d0d04", 3);
  }

  ctx.strokeStyle = "rgba(34,15,4,.65)";
  ctx.lineWidth = 4;
  for (let px = x + 22; px < x + w - 12; px += 34) {
    ctx.beginPath();
    ctx.moveTo(px, y + 8);
    ctx.lineTo(px + 7, y + h - 8);
    ctx.stroke();
  }

  rounded(x + 20, y + h / 2 - 22, w - 40, 44, 8, color, "#1d0d04", 4);
  ctx.fillStyle = "#201006";
  ctx.font = "900 16px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + h / 2 + 6);
}

drawIslandAndDock = function drawFloatingWoodenFortress() {
  ctx.save();

  // Dark floating shadow under the fortress.
  ctx.fillStyle = "rgba(0, 24, 49, .38)";
  ctx.beginPath();
  ctx.ellipse(480, 312, 360, 205, 0, 0, Math.PI * 2);
  ctx.fill();

  // Heavy central raft.
  rounded(230, 92, 500, 380, 18, "#7b421b", "#1d0d04", 10);
  const deck = ctx.createLinearGradient(230, 92, 730, 472);
  deck.addColorStop(0, "#c5853f");
  deck.addColorStop(.52, "#8b4a1f");
  deck.addColorStop(1, "#3b1a08");
  ctx.fillStyle = deck;
  ctx.fillRect(242, 104, 476, 356);

  // Thick planks.
  ctx.strokeStyle = "rgba(38,16,5,.78)";
  ctx.lineWidth = 6;
  for (let x = 260; x <= 700; x += 38) {
    ctx.beginPath();
    ctx.moveTo(x, 102);
    ctx.lineTo(x + 9, 462);
    ctx.stroke();
  }
  ctx.lineWidth = 5;
  for (let y = 128; y <= 448; y += 44) {
    ctx.beginPath();
    ctx.moveTo(242, y);
    ctx.lineTo(718, y - 6);
    ctx.stroke();
  }

  // Metal braces and bolted fortress details.
  ctx.strokeStyle = "#2a170b";
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(250, 118); ctx.lineTo(710, 446); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(710, 118); ctx.lineTo(250, 446); ctx.stroke();
  ctx.fillStyle = "#171717";
  for (const [bx, by] of [[292,142],[668,142],[292,422],[668,422],[480,282],[360,230],[600,230],[360,338],[600,338]]) {
    ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();
  }

  // Battlement-style edge posts and ropes.
  [[238,106],[318,96],[398,94],[480,92],[562,94],[642,96],[722,106],[238,456],[318,468],[398,472],[480,474],[562,472],[642,468],[722,456]].forEach(p => fortressPost(p[0], p[1], 58));
  fortressRope([[238,110],[318,101],[398,99],[480,97],[562,99],[642,101],[722,110]]);
  fortressRope([[238,460],[318,471],[398,475],[480,477],[562,475],[642,471],[722,460]]);

  // Fishing battlement at the top.
  rounded(396, 34, 168, 126, 12, "#72401d", "#1d0d04", 8);
  rounded(448, 104, 64, 58, 8, "#72401d", "#1d0d04", 6);
  fortressPost(410, 52, 54);
  fortressPost(550, 52, 54);
  rounded(422, 66, 116, 42, 8, "#ffe36e", "#1d0d04", 4);
  ctx.fillStyle = "#201006";
  ctx.font = "900 17px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("FISH", 480, 93);

  // Shop towers as proper fortress side rooms, not tropical huts.
  rounded(276, 142, 56, 36, 8, "#70401d", "#1d0d04", 5);
  fortressTower(96, 94, 184, 112, "ROD SHOP", "#78dfff");
  rounded(276, 390, 56, 36, 8, "#70401d", "#1d0d04", 5);
  fortressTower(96, 346, 184, 112, "SELL FISH", "#ff8a67");

  // Center command circle.
  rounded(388, 230, 184, 108, 18, "rgba(255,227,110,.22)", "rgba(255,241,190,.75)", 4);
  ctx.strokeStyle = "rgba(255,241,190,.82)";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(480, 284, 35, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(255,241,190,.75)";
  ctx.font = "900 13px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("FORTRESS DOCK", 480, 289);

  // Floating barrels and crates, no palms/coral.
  rounded(760, 158, 58, 40, 8, "#8a5327", "#1d0d04", 4);
  rounded(792, 206, 42, 42, 8, "#6a3a18", "#1d0d04", 4);
  rounded(142, 470, 64, 38, 8, "#7a451d", "#1d0d04", 4);
  ctx.strokeStyle = "#d6b077";
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.arc(820, 396, 24, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(820, 396, 13, 0, Math.PI * 2); ctx.stroke();

  ctx.restore();
};

drawDockLabels = function drawFortressDockLabel() {
  ctx.fillStyle = "rgba(255,245,209,.94)";
  ctx.font = "900 18px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("FLOATING WOODEN FORTRESS", 18, 74);
};

drawDockView = function drawFortressDockView() {
  drawTopWater();
  drawIslandAndDock();
  drawDockLabels();
  drawCirclePlayer();
};
