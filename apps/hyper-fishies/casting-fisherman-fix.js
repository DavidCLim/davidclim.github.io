// Final casting character fix: make the casting minigame use the fisherman, not the old hollow-style sprite.
(function () {
  const HAND = { x: 174, y: 276 };
  const TIP = { x: 314, y: 154 };

  function drawAttachedRod() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const rod = currentRod ? currentRod() : { glow: "#8eeaff" };
    ctx.shadowColor = rod.glow || "#8eeaff";
    ctx.shadowBlur = 7;

    ctx.strokeStyle = "#102052";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(HAND.x - 42, HAND.y + 52);
    ctx.lineTo(HAND.x - 10, HAND.y + 17);
    ctx.quadraticCurveTo(HAND.x + 42, HAND.y - 65, TIP.x, TIP.y);
    ctx.stroke();

    const shine = ctx.createLinearGradient(HAND.x - 42, HAND.y + 52, TIP.x, TIP.y);
    shine.addColorStop(0, "#fff0b8");
    shine.addColorStop(0.48, "#fff8d7");
    shine.addColorStop(1, "#f6edc6");
    ctx.strokeStyle = shine;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(HAND.x - 42, HAND.y + 52);
    ctx.lineTo(HAND.x - 10, HAND.y + 17);
    ctx.quadraticCurveTo(HAND.x + 42, HAND.y - 65, TIP.x, TIP.y);
    ctx.stroke();

    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#315cbd";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(HAND.x - 44, HAND.y + 52);
    ctx.lineTo(HAND.x - 8, HAND.y + 16);
    ctx.stroke();

    ctx.fillStyle = "#bdf4ff";
    ctx.strokeStyle = "#102052";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(HAND.x + 11, HAND.y + 23, 17, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#315cbd";
    ctx.beginPath();
    ctx.arc(HAND.x + 11, HAND.y + 23, 8, 0, Math.PI * 2);
    ctx.fill();

    [{ x: 230, y: 216 }, { x: 268, y: 184 }, { x: 300, y: 160 }].forEach((g, i) => {
      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.rotate(-0.7);
      rounded(-5, -8, 10, 13, 3, "#315cbd", "#102052", 3);
      ctx.strokeStyle = "#102052";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(1, 8, 6 - i, Math.PI * 0.15, Math.PI * 1.72);
      ctx.stroke();
      ctx.restore();
    });

    ctx.restore();
  }

  function drawBackViewFisherman() {
    const moving = Math.abs(state.player?.vx || 0) + Math.abs(state.player?.vy || 0) > 0.15;
    const t = performance.now() / 160;
    const walk = moving ? Math.sin(t) : 0;

    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Soft cover to hide the older hollow-style casting sprite underneath.
    const cover = ctx.createRadialGradient(148, 278, 18, 148, 278, 94);
    cover.addColorStop(0, "rgba(19, 117, 154, .96)");
    cover.addColorStop(1, "rgba(19, 117, 154, .08)");
    ctx.fillStyle = cover;
    ctx.beginPath();
    ctx.ellipse(148, 278, 78, 94, 0, 0, Math.PI * 2);
    ctx.fill();

    // Shadow.
    ctx.fillStyle = "rgba(0, 20, 28, .28)";
    ctx.beginPath();
    ctx.ellipse(144, 336, 30, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Legs.
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(133, 300);
    ctx.lineTo(124 - walk * 2, 331);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(153, 300);
    ctx.lineTo(166 + walk * 2, 331);
    ctx.stroke();

    // Body with fishing vest.
    ctx.fillStyle = "#f4c94d";
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(121, 246, 44, 58, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#2f75a8";
    ctx.beginPath();
    ctx.moveTo(124, 252);
    ctx.lineTo(143, 294);
    ctx.lineTo(162, 252);
    ctx.lineTo(158, 296);
    ctx.quadraticCurveTo(143, 309, 127, 296);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Arms, with right hand locked onto rod handle.
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(123, 260);
    ctx.lineTo(100, 279 + walk);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(160, 259);
    ctx.lineTo(HAND.x, HAND.y);
    ctx.stroke();

    ctx.fillStyle = "#f3c99b";
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(100, 279 + walk, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(HAND.x, HAND.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Head and cap from back view. No hollow mask.
    ctx.fillStyle = "#f3c99b";
    ctx.beginPath();
    ctx.ellipse(143, 220, 23, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#275f88";
    ctx.beginPath();
    ctx.ellipse(143, 201, 23, 10, 0, Math.PI, 0);
    ctx.lineTo(164, 216);
    ctx.quadraticCurveTo(143, 224, 122, 216);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(156, 211, 22, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.restore();

    drawAttachedRod();
  }

  drawFisherCircle = function drawFinalFishermanHoldingRod() {
    drawBackViewFisherman();
  };

  drawFishingLine = function drawLineFromRodTipOnly() {
    if (!state.cast) return;
    const c = state.cast;
    ctx.strokeStyle = "rgba(236,255,251,.88)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(TIP.x, TIP.y);
    ctx.quadraticCurveTo((TIP.x + c.hookX) / 2, Math.min(TIP.y, c.hookY) - 22, c.hookX, c.hookY);
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

  const oldDrawUiButton = drawUiButton;
  drawUiButton = function drawUiButtonWithoutDeadShopShortcuts(x, y, w, h, label, action) {
    const text = String(label || "").toUpperCase();
    const isBottomRightShortcut = (state.mode === "dock" || state.mode === "fishing") && x >= 650 && y >= 455;
    if (isBottomRightShortcut && (text.includes("SELL") || text.includes("ROD"))) return;
    oldDrawUiButton(x, y, w, h, label, action);
  };

  const oldDraw = draw;
  draw = function drawWithFinalCastingFisherman() {
    oldDraw();
    if (state.mode === "fishing" && state.castPower) {
      drawBackViewFisherman();
    }
  };

  say("Casting minigame fisherman now holds the rod. Dead bottom-right shop buttons removed.");
})();
