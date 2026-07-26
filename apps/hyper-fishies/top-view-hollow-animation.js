// Restore the top-view map while keeping a more animated direction-changing player.
(function () {
  const topViewZones = {
    keep: { x: 260, y: 150, w: 440, h: 286 },
    fish: { x: 386, y: 42, w: 188, h: 124 },
    sell: { x: 64, y: 210, w: 190, h: 136 },
    shop: { x: 706, y: 210, w: 190, h: 136 },
    leftBridge: { x: 248, y: 258, w: 42, h: 54 },
    rightBridge: { x: 670, y: 258, w: 42, h: 54 },
    fishBridge: { x: 438, y: 154, w: 84, h: 46 }
  };

  function ensureTopAnim() {
    if (!state.player) return;
    if (!state.player.facing) state.player.facing = "down";
    if (!state.player.pose) state.player.pose = "idle";
    if (typeof state.walkFrame !== "number") state.walkFrame = 0;
  }

  atFishingDock = function atTopFishingDock(p) {
    return inRect(p, topViewZones.fish.x, topViewZones.fish.y, topViewZones.fish.w, topViewZones.fish.h);
  };

  atSellDock = function atTopSellDock(p) {
    return inRect(p, topViewZones.sell.x, topViewZones.sell.y, topViewZones.sell.w, topViewZones.sell.h);
  };

  atShopDock = function atTopShopDock(p) {
    return inRect(p, topViewZones.shop.x, topViewZones.shop.y, topViewZones.shop.w, topViewZones.shop.h);
  };

  constrainToDock = function constrainTopViewDock(p) {
    const areas = Object.values(topViewZones);
    if (areas.some(rect => inRect(p, rect.x, rect.y, rect.w, rect.h))) return;
    p.x -= p.vx * 0.04;
    p.y -= p.vy * 0.04;
    p.x = clamp(p.x, 64, 896);
    p.y = clamp(p.y, 42, 436);
  };

  updateDock = function updateTopViewDock(dt) {
    ensureTopAnim();
    if (typeof normalizeRodProgress === "function") normalizeRodProgress();

    const p = state.player;
    let ax = 0;
    let ay = 0;
    if (keys.has("arrowleft") || keys.has("a")) ax -= 1;
    if (keys.has("arrowright") || keys.has("d")) ax += 1;
    if (keys.has("arrowup") || keys.has("w")) ay -= 1;
    if (keys.has("arrowdown") || keys.has("s")) ay += 1;
    ax += joy.x;
    ay += joy.y;

    const mag = Math.hypot(ax, ay);
    if (mag > 0.12) {
      ax /= mag;
      ay /= mag;
      p.pose = "walk";
      if (Math.abs(ax) > Math.abs(ay)) p.facing = ax < 0 ? "left" : "right";
      else p.facing = ay < 0 ? "up" : "down";
      state.walkFrame += dt * 10;
    } else {
      ax = 0;
      ay = 0;
      p.pose = "idle";
      state.walkFrame += dt * 2.1;
    }

    const targetVx = ax * 220;
    const targetVy = ay * 220;
    const follow = mag > 0.12 ? 0.46 : 0.72;
    p.vx += (targetVx - p.vx) * follow;
    p.vy += (targetVy - p.vy) * follow;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    constrainToDock(p);

    if (atSellDock(p)) enterSellShop();
    else if (atShopDock(p) && typeof enterRodShop === "function") enterRodShop();
    else if (atFishingDock(p)) say("Fishing dock: tap CAST or press Space/F.");
    else say("Top-view fortress restored. Walk to FISH, SELL, or ROD SHOP.");
  };

  function fortressWood(x, y, w, h, r, line) {
    rounded(x, y, w, h, r || 14, "#c7833c", "#2f1406", line || 7);
    const deck = ctx.createLinearGradient(x, y, x + w, y + h);
    deck.addColorStop(0, "#f0bd72");
    deck.addColorStop(0.55, "#c77a32");
    deck.addColorStop(1, "#8a451a");
    ctx.fillStyle = deck;
    ctx.beginPath();
    ctx.roundRect(x + 8, y + 8, w - 16, h - 16, Math.max(4, (r || 14) - 4));
    ctx.fill();
    ctx.strokeStyle = "rgba(62, 27, 8, .48)";
    ctx.lineWidth = 4;
    for (let px = x + 30; px < x + w - 8; px += 48) {
      ctx.beginPath();
      ctx.moveTo(px, y + 10);
      ctx.lineTo(px + 8, y + h - 10);
      ctx.stroke();
    }
    ctx.lineWidth = 3;
    for (let py = y + 40; py < y + h - 8; py += 64) {
      ctx.beginPath();
      ctx.moveTo(x + 10, py);
      ctx.lineTo(x + w - 10, py - 4);
      ctx.stroke();
    }
  }

  function crenels(x, y, w, count) {
    const gap = w / count;
    for (let i = 0; i < count; i++) {
      rounded(x + i * gap + 5, y, gap - 12, 22, 4, "#9c5627", "#2f1406", 3);
    }
  }

  function tower(x, y, w, h, label, fill) {
    fortressWood(x, y, w, h, 16, 8);
    crenels(x + 12, y - 18, w - 24, 4);
    rounded(x + 28, y + 46, w - 56, 44, 10, fill, "#2f1406", 4);
    ctx.fillStyle = "#2a1307";
    ctx.font = "900 16px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(label, x + w / 2, y + 73);
  }

  function ropePost(x, y, h) {
    rounded(x - 9, y - (h || 54) / 2, 18, h || 54, 5, "#6d3514", "#2b1004", 4);
    ctx.fillStyle = "#3a1808";
    ctx.beginPath();
    ctx.arc(x, y - (h || 54) / 2, 9, 0, Math.PI * 2);
    ctx.fill();
  }

  function rope(points) {
    ctx.strokeStyle = "#f0c98a";
    ctx.lineWidth = 5;
    ctx.lineCap = "round";
    ctx.beginPath();
    points.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]));
    ctx.stroke();
  }

  drawIslandAndDock = function drawTopViewFortress() {
    ctx.save();
    ctx.fillStyle = "rgba(0, 19, 36, .34)";
    ctx.beginPath();
    ctx.ellipse(480, 318, 404, 186, 0, 0, Math.PI * 2);
    ctx.fill();

    fortressWood(260, 150, 440, 286, 18, 10);
    crenels(280, 124, 400, 10);
    crenels(280, 430, 400, 10);

    fortressWood(248, 258, 42, 54, 9, 6);
    fortressWood(670, 258, 42, 54, 9, 6);
    tower(64, 210, 190, 136, "SELL FISH", "#ff9a73");
    tower(706, 210, 190, 136, "ROD SHOP", "#91eaff");

    fortressWood(438, 154, 84, 46, 9, 6);
    tower(386, 42, 188, 124, "FISH", "#ffe36e");

    fortressWood(304, 190, 76, 72, 12, 6);
    fortressWood(580, 190, 76, 72, 12, 6);

    rounded(394, 248, 172, 92, 18, "rgba(255, 236, 150, .22)", "rgba(255, 246, 210, .72)", 4);
    ctx.strokeStyle = "rgba(255, 246, 210, .86)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(480, 294, 32, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,246,210,.95)";
    ctx.font = "900 13px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("SEA KEEP", 480, 298);

    const upper = [[278,166],[382,154],[480,154],[578,154],[682,166]];
    const lower = [[278,420],[382,436],[480,440],[578,436],[682,420]];
    upper.concat(lower).forEach(p => ropePost(p[0], p[1], 52));
    rope(upper);
    rope(lower);

    rounded(420, 366, 48, 32, 8, "#a75b25", "#2f1406", 4);
    rounded(500, 366, 48, 32, 8, "#a75b25", "#2f1406", 4);
    ctx.restore();
  };

  drawDockLabels = function drawTopViewLabel() {
    ctx.fillStyle = "rgba(255,245,209,.96)";
    ctx.font = "900 18px Trebuchet MS";
    ctx.textAlign = "left";
    ctx.fillText("TOP-VIEW SEA FORTRESS", 18, 74);
  };

  function animatedAdventurer(x, y, scale) {
    ensureTopAnim();
    const facing = state.player.facing || "down";
    const walking = state.player.pose === "walk";
    const t = state.walkFrame || 0;
    const step = walking ? Math.sin(t) : Math.sin(t) * 0.15;
    const bob = walking ? Math.abs(Math.sin(t)) * 2.5 : Math.sin(t * 1.7) * 1;
    const side = facing === "left" ? -1 : 1;

    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(scale, scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle = "rgba(0, 18, 28, .32)";
    ctx.beginPath();
    ctx.ellipse(0, 31 + bob, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (facing === "left" || facing === "right") ctx.scale(side, 1);

    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-8, 10);
    ctx.lineTo(-19, 30 - step * 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 10);
    ctx.lineTo(19, 30 + step * 6);
    ctx.stroke();

    ctx.fillStyle = "#101b25";
    ctx.beginPath();
    ctx.roundRect(-19, -15, 38, 34, 14);
    ctx.fill();
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "#183b52";
    ctx.beginPath();
    ctx.moveTo(-18, 3);
    ctx.quadraticCurveTo(0, 28, 18, 3);
    ctx.lineTo(14, 24);
    ctx.quadraticCurveTo(0, 38, -14, 24);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 6;
    const armSwing = step * 5;
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(-34, 7 + armSwing);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(16, -4);
    ctx.lineTo(34, 7 - armSwing);
    ctx.stroke();

    ctx.fillStyle = "#f4fbff";
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, -33, 24, 25, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (facing !== "up") {
      ctx.fillStyle = "#071923";
      const eyeShift = facing === "right" || facing === "left" ? 4 : 0;
      ctx.beginPath();
      ctx.ellipse(-7 + eyeShift, -35, 3.6, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(7 + eyeShift, -35, 3.6, 6, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "#dff7ff";
      ctx.beginPath();
      ctx.ellipse(0, -39, 15, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.strokeStyle = "#f4fbff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-16, -53);
    ctx.quadraticCurveTo(-27, -67, -42, -70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(16, -53);
    ctx.quadraticCurveTo(27, -67, 42, -70);
    ctx.stroke();
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-16, -53);
    ctx.quadraticCurveTo(-27, -67, -42, -70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(16, -53);
    ctx.quadraticCurveTo(27, -67, 42, -70);
    ctx.stroke();

    ctx.fillStyle = "#54f5df";
    ctx.beginPath();
    ctx.moveTo(-18, -11);
    ctx.quadraticCurveTo(-42, 8, -63, 0);
    ctx.quadraticCurveTo(-42, 25, -18, 12);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  }

  drawCirclePlayer = function drawTopViewAnimatedPlayer() {
    if (!state.player) return;
    animatedAdventurer(state.player.x, state.player.y, 0.66);
  };

  drawDockView = function drawTopViewMapWithAnimatedPlayer() {
    drawTopWater();
    drawIslandAndDock();
    drawDockLabels();
    drawCirclePlayer();
  };

  say("Top-view map restored. Player keeps the new direction animations.");
  updateHud();
})();
