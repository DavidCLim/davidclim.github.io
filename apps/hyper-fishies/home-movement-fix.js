// Load-last fix: remove home SHOP button and make laptop movement direct and reliable.
(function () {
  const previousUpdate = update;
  const pressed = Object.create(null);

  function isDown(name) {
    return !!pressed[name] || !!keys[name] || !!keys[String(name).toLowerCase()];
  }

  function markKey(event, value) {
    const key = String(event.key || "").toLowerCase();
    const code = String(event.code || "").toLowerCase();
    if (!key && !code) return;

    pressed[key] = value;
    pressed[code] = value;
    keys[key] = value;
    keys[code] = value;
    if (key === " ") {
      pressed.space = value;
      keys.space = value;
    }

    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d", "keyw", "keya", "keys", "keyd", " ", "space"].includes(key) || ["keyw", "keya", "keys", "keyd", "space"].includes(code)) {
      event.preventDefault();
    }
  }

  function directLaptopMovement(dt) {
    if (state.mode !== "dock" || !state.player) return;

    const p = state.player;
    let ax = 0;
    let ay = 0;

    if (isDown("arrowleft") || isDown("a") || isDown("keya")) ax -= 1;
    if (isDown("arrowright") || isDown("d") || isDown("keyd")) ax += 1;
    if (isDown("arrowup") || isDown("w") || isDown("keyw")) ay -= 1;
    if (isDown("arrowdown") || isDown("s") || isDown("keys")) ay += 1;

    if (window.joy) {
      ax += joy.x || 0;
      ay += joy.y || 0;
    }

    const mag = Math.hypot(ax, ay);
    if (mag > 0.1) {
      ax /= mag;
      ay /= mag;
      p.x += ax * 235 * dt;
      p.y += ay * 235 * dt;
      p.vx = ax * 235;
      p.vy = ay * 235;
      p.pose = "walk";
      if (Math.abs(ax) > Math.abs(ay)) p.facing = ax < 0 ? "left" : "right";
      else p.facing = ay < 0 ? "up" : "down";
      state.walkFrame = (state.walkFrame || 0) + dt * 11;
    } else {
      p.vx = 0;
      p.vy = 0;
      p.pose = "idle";
      state.walkFrame = (state.walkFrame || 0) + dt * 2;
    }

    p.x = Math.max(76, Math.min(884, p.x));
    p.y = Math.max(54, Math.min(456, p.y));

    if (typeof constrainToDock === "function") constrainToDock(p);
    if (typeof atSellDock === "function" && atSellDock(p)) enterSellShop();
    else if (typeof atShopDock === "function" && atShopDock(p) && typeof enterRodShop === "function") enterRodShop();
    else if (typeof atFishingDock === "function" && atFishingDock(p)) say("Fishing dock: tap CAST or press Space/F.");
  }

  update = function updateWithDirectLaptopMovement(dt) {
    previousUpdate(dt);
    directLaptopMovement(dt);
  };

  drawHomeScreen = function drawHomeScreenNoShop() {
    drawTopWater();
    drawMenuFish(734, 194, 54, "#ffd45f");
    drawMenuFish(214, 126, 32, "#ff7c87");
    drawMenuFish(780, 402, 36, "#8dffda");

    ctx.save();
    rounded(190, 86, 580, 388, 0, "rgba(235,249,238,.92)", "#09283d", 5);
    drawHandTitle(480, 212);
    drawMenuButton(382, 318, 196, 50, "PLAY", playFromMenu);
    drawMenuButton(382, 384, 196, 50, "CREDITS", creditsFromMenu);

    if (state.menuPage === "credits") drawCreditsPanel();
    ctx.restore();
  };

  document.addEventListener("keydown", function (event) {
    markKey(event, true);
    const key = String(event.key || "").toLowerCase();
    const code = String(event.code || "").toLowerCase();
    if ((key === " " || code === "space" || key === "f") && state.mode === "fishing") {
      if (state.castPower) stopCastBar();
      else if (state.cast && state.cast.phase === "bite") reel();
      else castLine();
      event.preventDefault();
    }
  }, true);

  document.addEventListener("keyup", function (event) {
    markKey(event, false);
  }, true);

  canvas.tabIndex = 0;
  canvas.addEventListener("pointerdown", function () { canvas.focus(); });
})();
