// Final dock perspective view: less top-down, more back-view/forward-facing.
function isoPoly(points, fill, stroke = "#2f1406", line = 5) {
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = line;
  ctx.stroke();
}

function plankLines(points, count, vertical = true) {
  ctx.save();
  ctx.strokeStyle = "rgba(66, 28, 8, .45)";
  ctx.lineWidth = 3;
  if (vertical) {
    for (let i = 1; i < count; i++) {
      const t = i / count;
      const ax = points[0][0] + (points[1][0] - points[0][0]) * t;
      const ay = points[0][1] + (points[1][1] - points[0][1]) * t;
      const bx = points[3][0] + (points[2][0] - points[3][0]) * t;
      const by = points[3][1] + (points[2][1] - points[3][1]) * t;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
  } else {
    for (let i = 1; i < count; i++) {
      const t = i / count;
      const ax = points[0][0] + (points[3][0] - points[0][0]) * t;
      const ay = points[0][1] + (points[3][1] - points[0][1]) * t;
      const bx = points[1][0] + (points[2][0] - points[1][0]) * t;
      const by = points[1][1] + (points[2][1] - points[1][1]) * t;
      ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    }
  }
  ctx.restore();
}

function perspectiveDeck(points) {
  const wood = ctx.createLinearGradient(420, 140, 520, 462);
  wood.addColorStop(0, "#f3c57a");
  wood.addColorStop(.58, "#cb7d36");
  wood.addColorStop(1, "#8b461b");
  isoPoly(points, wood, "#2f1406", 8);
  plankLines(points, 9, true);
  plankLines(points, 5, false);
}

function perspectiveSign(x, y, w, label, fill) {
  rounded(x, y, w, 42, 9, fill, "#2f1406", 4);
  ctx.fillStyle = "#2a1307";
  ctx.font = "900 15px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 27);
}

function perspectiveShop(x, y, side, label, fill) {
  const roof = side === "left"
    ? [[x + 12, y], [x + 162, y - 32], [x + 198, y + 8], [x + 38, y + 42]]
    : [[x + 26, y + 8], [x + 62, y - 32], [x + 212, y], [x + 184, y + 42]];
  const body = side === "left"
    ? [[x + 28, y + 42], [x + 190, y + 8], [x + 184, y + 120], [x + 16, y + 144]]
    : [[x + 32, y + 8], [x + 194, y + 42], [x + 206, y + 144], [x + 38, y + 120]];
  isoPoly(body, "#c7833c", "#2f1406", 7);
  plankLines(body, 5, true);
  isoPoly(roof, "#7a3119", "#2f1406", 6);
  perspectiveSign(x + 48, y + 58, 112, label, fill);
}

function perspectiveTower(x, y) {
  const body = [[x - 86, y + 18], [x + 86, y + 18], [x + 76, y + 122], [x - 76, y + 122]];
  isoPoly(body, "#c7833c", "#2f1406", 7);
  plankLines(body, 5, true);
  const roof = [[x - 100, y + 20], [x, y - 36], [x + 100, y + 20], [x + 70, y + 48], [x, y + 20], [x - 70, y + 48]];
  isoPoly(roof, "#783116", "#2f1406", 6);
  perspectiveSign(x - 55, y + 62, 110, "FISH", "#ffe36e");
}

function perspectivePost(x, y, h = 70) {
  rounded(x - 9, y - h, 18, h, 5, "#6d3514", "#2b1004", 4);
  ctx.fillStyle = "#3a1808";
  ctx.beginPath(); ctx.arc(x, y - h, 9, 0, Math.PI * 2); ctx.fill();
}

function drawPerspectiveRopes(points) {
  points.forEach(p => perspectivePost(p[0], p[1], p[2] || 58));
  ctx.strokeStyle = "#f0c98a";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.beginPath();
  points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1] - (p[2] || 58) + 10) : ctx.moveTo(p[0], p[1] - (p[2] || 58) + 10));
  ctx.stroke();
}

drawIslandAndDock = function drawBackViewFortressDock() {
  ctx.save();

  ctx.fillStyle = "rgba(0, 18, 38, .34)";
  ctx.beginPath();
  ctx.ellipse(480, 430, 418, 96, 0, 0, Math.PI * 2);
  ctx.fill();

  // Main deck is now a trapezoid, so it reads like a forward/back view instead of top-down.
  const mainDeck = [[330, 154], [630, 154], [760, 444], [200, 444]];
  perspectiveDeck(mainDeck);

  // Far fishing dock and angled walkway.
  perspectiveDeck([[432, 132], [528, 132], [540, 190], [420, 190]]);
  perspectiveTower(480, 42);

  // Side shops are parallel left/right buildings in perspective.
  perspectiveDeck([[238, 262], [294, 254], [304, 320], [220, 330]]);
  perspectiveDeck([[666, 254], [722, 262], [740, 330], [656, 320]]);
  perspectiveShop(48, 212, "left", "SELL FISH", "#ff9a73");
  perspectiveShop(704, 212, "right", "ROD SHOP", "#91eaff");

  // Simple guard blocks near the back of the deck.
  isoPoly([[324, 186], [386, 176], [396, 238], [318, 248]], "#bd7432", "#2f1406", 6);
  isoPoly([[574, 176], [636, 186], [642, 248], [564, 238]], "#bd7432", "#2f1406", 6);

  // Center mark on the floor follows the perspective.
  isoPoly([[410, 270], [550, 270], [584, 350], [376, 350]], "rgba(255, 236, 150, .23)", "rgba(255, 246, 210, .72)", 4);
  ctx.fillStyle = "rgba(255,246,210,.95)";
  ctx.font = "900 13px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("SEA KEEP", 480, 315);

  // Ropes in perspective: near posts taller and farther apart.
  drawPerspectiveRopes([[312, 176, 42], [404, 166, 46], [480, 164, 48], [556, 166, 46], [648, 176, 42]]);
  drawPerspectiveRopes([[224, 438, 74], [356, 456, 82], [480, 464, 86], [604, 456, 82], [736, 438, 74]]);

  // A couple of simple crates only.
  rounded(404, 370, 48, 32, 8, "#a75b25", "#2f1406", 4);
  rounded(510, 370, 48, 32, 8, "#a75b25", "#2f1406", 4);

  ctx.restore();
};

drawDockLabels = function drawPerspectiveDockLabel() {
  ctx.fillStyle = "rgba(255,245,209,.96)";
  ctx.font = "900 18px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("SEA FORTRESS", 18, 74);
};

drawDockView = function drawPerspectiveDockView() {
  drawTopWater();
  drawIslandAndDock();
  drawDockLabels();
  drawCirclePlayer();
};

say("The dock is now drawn in a back-view perspective instead of flat top view.");
updateHud();
