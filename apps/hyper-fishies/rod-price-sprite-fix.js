// Final rod fix: cheaper rod prices plus one shared smaller brown rod sprite for shop and casting.
(function () {
  const cheapPrices = {
    1: 0,
    2: 80,
    3: 180,
    4: 420,
    5: 900,
    6: 1900,
    7: 4200,
    8: 9500,
    9: 21000,
    10: 45000,
    11: 95000,
    12: 190000,
    13: 390000,
    14: 780000,
    15: 1500000
  };

  if (typeof rodCatalog !== "undefined") {
    rodCatalog.forEach(function (rod) {
      if (cheapPrices[rod.id] !== undefined) rod.price = cheapPrices[rod.id];
    });
  }

  function drawSharedBrownRod(x, y, scale, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale || 1, scale || 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Rod outline and warm wooden body.
    ctx.strokeStyle = "#2b1608";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-58, 50);
    ctx.lineTo(-18, 14);
    ctx.quadraticCurveTo(42, -36, 126, -50);
    ctx.stroke();

    const wood = ctx.createLinearGradient(-58, 50, 126, -50);
    wood.addColorStop(0, "#5f3214");
    wood.addColorStop(0.42, "#9b5a22");
    wood.addColorStop(1, "#d49a48");
    ctx.strokeStyle = wood;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-58, 50);
    ctx.lineTo(-18, 14);
    ctx.quadraticCurveTo(42, -36, 126, -50);
    ctx.stroke();

    // Grip.
    ctx.strokeStyle = "#1b0d05";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-82, 74);
    ctx.lineTo(-52, 46);
    ctx.stroke();
    ctx.strokeStyle = "#744019";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-82, 74);
    ctx.lineTo(-52, 46);
    ctx.stroke();

    // Reel.
    ctx.fillStyle = "#c88b42";
    ctx.strokeStyle = "#1b0d05";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-4, 42, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#754118";
    ctx.beginPath();
    ctx.arc(-4, 42, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Line guides, same on shop and casting rod.
    const guides = [
      { x: 28, y: -14, r: 7 },
      { x: 62, y: -32, r: 5.5 },
      { x: 94, y: -43, r: 4.5 },
      { x: 123, y: -50, r: 3.5 }
    ];
    guides.forEach(function (guide) {
      ctx.strokeStyle = "#1b0d05";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guide.x, guide.y + 8, guide.r, Math.PI * 0.12, Math.PI * 1.85);
      ctx.stroke();
      ctx.fillStyle = "#2b1608";
      ctx.beginPath();
      ctx.roundRect(guide.x - 5, guide.y - 4, 10, 11, 3);
      ctx.fill();
    });

    ctx.restore();
  }

  window.drawTinyRod = function drawTinyBrownRod(x, y) {
    drawSharedBrownRod(x + 2, y - 1, 0.18, -0.16);
  };

  const sideRodTip = { x: 265, y: 202 };

  function drawCastingFisherman() {
    ctx.save();
    ctx.translate(136, 300);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle = "rgba(0,22,34,.24)";
    ctx.beginPath();
    ctx.ellipse(0, 43, 28, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-8, 16); ctx.lineTo(-20, 42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, 16); ctx.lineTo(22, 42); ctx.stroke();

    ctx.fillStyle = "#f4c94d";
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.roundRect(-18, -15, 36, 39, 13); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2f75a8";
    ctx.beginPath(); ctx.moveTo(-16, -6); ctx.lineTo(0, 22); ctx.lineTo(16, -6); ctx.lineTo(12, 20); ctx.quadraticCurveTo(0, 30, -12, 20); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-15, -4); ctx.lineTo(-31, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, -4); ctx.lineTo(40, -21); ctx.stroke();

    ctx.fillStyle = "#f3c99b";
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, -36, 21, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#275f88";
    ctx.beginPath(); ctx.ellipse(0, -54, 21, 9, 0, Math.PI, 0); ctx.lineTo(18, -43); ctx.quadraticCurveTo(0, -37, -18, -43); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.restore();
  }

  window.drawFisherCircle = function drawSmallBrownRodCastingPose() {
    drawCastingFisherman();
    drawSharedBrownRod(178, 252, 0.58, -0.22);
  };

  window.drawFishingLine = function drawLineFromSmallBrownRod() {
    if (!state.cast) return;
    const c = state.cast;
    ctx.strokeStyle = "rgba(236,255,251,.82)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(sideRodTip.x, sideRodTip.y);
    ctx.quadraticCurveTo((sideRodTip.x + c.hookX) / 2, Math.min(sideRodTip.y, c.hookY) - 12, c.hookX, c.hookY);
    ctx.stroke();

    ctx.fillStyle = c.phase === "bite" ? "#ffe36e" : "#ffffff";
    ctx.strokeStyle = "#05263d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.hookX, c.hookY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (c.phase === "bite") {
      ctx.strokeStyle = rarityColors[c.fish.rarity] || "#ecfffb";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(c.hookX, c.hookY, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(c.reel, 0, 1));
      ctx.stroke();
    }
  };

  if (typeof say === "function") {
    say("Rod prices fixed. Casting rod is now smaller, brown, and matches the shop sprite.");
  }
})();
