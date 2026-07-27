// Final button layer: keep the useful buttons visible after all other visual patches.
(function () {
  function backToDock() {
    state.mode = "dock";
    state.cast = null;
    state.castPower = null;
    say("Back to the dock.");
  }

  function openBag() {
    state.previousMode = state.mode === "inventory" ? "dock" : state.mode;
    state.mode = "inventory";
    say("Inventory opened.");
  }

  function doCastOrReel() {
    if (state.mode !== "fishing") {
      state.mode = "fishing";
      state.cast = null;
      state.castPower = null;
      say("Fishing dock: tap CAST to start.");
      return;
    }
    if (state.castPower && typeof stopCastBar === "function") stopCastBar();
    else if (state.cast && state.cast.phase === "bite" && typeof reel === "function") reel();
    else if (typeof castLine === "function") castLine();
  }

  drawGameButtons = function drawCleanHyperFishiesButtons() {
    var y = 500;
    if (state.mode === "menu") return;

    if (state.mode === "sell") {
      drawUiButton(24, y, 120, 42, "BACK", typeof exitSellShop === "function" ? exitSellShop : backToDock);
      drawUiButton(395, y, 170, 42, "SELL ALL", sellFish);
      return;
    }

    if (state.mode === "rodshop") {
      drawUiButton(24, y, 120, 42, "BACK", typeof exitRodShop === "function" ? exitRodShop : backToDock);
      return;
    }

    if (state.mode === "inventory") return;

    drawUiButton(18, y, 104, 42, "HOME", typeof goHome === "function" ? goHome : function () { state.mode = "menu"; });
    drawUiButton(134, y, 112, 42, "RESET", typeof resetGame === "function" ? resetGame : backToDock);
    drawUiButton(392, y, 176, 42, state.cast && state.cast.phase === "bite" ? "REEL!" : "CAST", doCastOrReel);
    drawUiButton(584, y, 108, 42, "BAG", openBag);
  };
})();
