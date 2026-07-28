// Final rod fix: cheaper rod prices plus shared rod sprite shape for shop and casting.
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

  function drawSharedRod(x, y, scale, angle, options) {
    options = options || {};
    const mainColor = options.color || "#9b5a22";
    const glowColor = options.glow || "#d49a48";
    const gripColor = options.grip || "#744019";
    const reelColor = options.reel || mainColor;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale || 1, scale || 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.shadowColor = glowColor;
    ctx.shadowBlur = options.glowSize || 0;

    // Rod outline and colored body.
    ctx.strokeStyle = "#2b1608";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-58, 50);
    ctx.lineTo(-18, 14);
    ctx.quadraticCurveTo(42, -36, 126, -50);
    ctx.stroke();

    const rodGradient = ctx.createLinearGradient(-58, 50, 126, -50);
    rodGradient.addColorStop(0, gripColor);
    rodGradient.addColorStop(0.44, mainColor);
    rodGradient.addColorStop(1, glowColor);
    ctx.strokeStyle = rodGradient;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-58, 50);
    ctx.lineTo(-18, 14);
    ctx.quadraticCurveTo(42, -36, 126, -50);
    ctx.stroke();

    ctx.shadowBlur = 0;

    // Grip.
    ctx.strokeStyle = "#1b0d05";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-82, 74);
    ctx.lineTo(-52, 46);
    ctx.stroke();
    ctx.strokeStyle = gripColor;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-82, 74);
    ctx.lineTo(-52, 46);
    ctx.stroke();

    // Reel.
    ctx.fillStyle = reelColor;
    ctx.strokeStyle = "#1b0d05";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-4, 42, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = gripColor;
    ctx.beginPath();
    ctx.arc(-4, 42, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Line guides, same shape for every rod.
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
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.roundRect(guide.x - 5, guide.y - 4, 10, 11, 3);
      ctx.fill();
      ctx.strokeStyle = "#1b0d05";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawBrownCastingRod(x, y, scale, angle) {
    drawSharedRod(x, y, scale, angle, {
      color: "#9b5a22",
      glow: "#d49a48",
      grip: "#744019",
      reel: "#c88b42",
      glowSize: 0
    });
  }

  window.drawTinyRod = function drawTinyColoredRod(x, y, rod) {
    const catalogRod = rod || { color: "#9b5a22", glow: "#d49a48" };
    drawSharedRod(x + 2, y - 1, 0.18, -0.16, {
      color: catalogRod.color || "#9b5a22",
      glow: catalogRod.glow || catalogRod.color || "#d49a48",
      grip: "#5f3214",
      reel: catalogRod.color || "#c88b42",
      glowSize: 10
    });
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
    drawBrownCastingRod(178, 252, 0.58, -0.22);
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
    say("Shop rods now keep their own colors. Casting rod stays small and brown.");
  }
})();
