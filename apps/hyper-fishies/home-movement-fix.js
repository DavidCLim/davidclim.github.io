// Load-last fix: remove home SHOP button and make laptop movement run on the dock.
(function () {
  const previousUpdate = update;

  update = function updateWithReliableDockMovement(dt) {
    previousUpdate(dt);
    if (state.mode === "dock" && typeof updateDock === "function") {
      updateDock(dt);
    }
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

  window.addEventListener("keydown", function (event) {
    const key = event.key.toLowerCase();
    if (["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d", " "].includes(key)) {
      keys[key] = true;
      if (key === " ") keys.space = true;
      event.preventDefault();
    }
    if ((key === " " || key === "f") && state.mode === "fishing") {
      if (state.castPower) stopCastBar();
      else if (state.cast && state.cast.phase === "bite") reel();
      else castLine();
      event.preventDefault();
    }
  }, true);

  window.addEventListener("keyup", function (event) {
    const key = event.key.toLowerCase();
    keys[key] = false;
    if (key === " ") keys.space = false;
  }, true);
})();
