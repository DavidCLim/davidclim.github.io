// Compatibility bridge for the restored polished Hyper Fishies script stack.
(function () {
  window.joy = window.joy || { x: 0, y: 0, active: false };
  if (typeof keys !== "undefined" && typeof keys.has !== "function") {
    keys.has = function hasKey(key) {
      return !!this[key] || !!this[String(key).toLowerCase()];
    };
  }

  if (typeof state !== "undefined") {
    state.ripples = state.ripples || [];
    state.menuPage = state.menuPage || "";
    state.progress = state.progress || { coins: 0, caught: {}, bestFish: "None", ownedRods: [0], rod: 0 };
    state.progress.ownedRods = state.progress.ownedRods || [0];
    state.progress.caught = state.progress.caught || {};
    if (state.mode === "home") {
      state.mode = "menu";
      state.menuPage = "home";
    }
  }

  if (typeof drawGameHud !== "function") {
    window.drawGameHud = function drawGameHudBase() {
      rounded(18, 16, 260, 72, 18, "rgba(4,44,68,.75)", "#dff8ff", 3);
      writeText(`COINS ${state.progress.coins || 0}`, 38, 44, 18, "#ffe36e", "left");
      writeText(`ROD ${currentRod().name}`, 38, 70, 15, "#eaffff", "left", 800);
      rounded(300, 16, 360, 42, 18, "rgba(4,44,68,.65)", "#dff8ff", 3);
      writeText(state.message || "", 480, 43, 15, "#eaffff", "center", 800);
    };
  }

  if (typeof updateHud !== "function") {
    window.updateHud = function updateHudBase() {
      saveGame();
    };
  }

  if (typeof enterSellShop !== "function") {
    window.enterSellShop = function enterSellShopBase() {
      state.mode = "sell";
      say("Sell your fish here.");
    };
  }

  if (typeof enterRodShop !== "function") {
    window.enterRodShop = function enterRodShopBase() {
      state.mode = "rodshop";
      say("Choose a rod to buy or equip.");
    };
  }

  if (typeof drawHomeScreen !== "function") {
    window.drawHomeScreen = function drawHomeScreenBase() {
      drawTopWater();
      rounded(150, 46, 660, 438, 28, "rgba(5,63,93,.76)", "#dff8ff", 5);
      writeText("HYPER", 480, 152, 72, "#ffe36e");
      writeText("FISHIES", 480, 214, 44, "#effcff", "center", 500);
      writeText(`Coins: ${state.progress.coins || 0}  |  Best: ${state.progress.bestFish || "None"}`, 480, 252, 16, "#dff8ff");
      drawUiButton(365, 292, 230, 56, "PLAY", function () { state.mode = "dock"; state.menuPage = ""; });
      drawUiButton(365, 364, 230, 56, "CREDITS", function () { state.menuPage = "credits"; });
      if (state.menuPage === "credits") {
        rounded(236, 270, 488, 124, 18, "rgba(236,255,251,.92)", "#06334b", 4);
        writeText("BY DAVID, LUCAS, AND FRIENDS", 480, 326, 22, "#06334b");
        drawUiButton(405, 344, 150, 42, "BACK", function () { state.menuPage = "home"; });
      }
    };
  }

  if (typeof drawDockView !== "function") {
    window.drawDockView = function drawDockViewBase() {
      drawTopWater();
      rounded(120, 165, 720, 250, 22, "#b5793f", "#573313", 7);
      rounded(375, 64, 210, 120, 16, "#b5793f", "#573313", 7);
      writeText("FISHING BANK", 480, 118, 22, "#fff3ba");
      writeText("SELL", 110, 282, 25, "#fff3ba");
      writeText("RODS", 850, 282, 25, "#fff3ba");
    };
  }

  if (typeof drawFishingView !== "function") {
    window.drawFishingView = function drawFishingViewBase() {
      drawTopWater();
      ctx.fillStyle = "rgba(255,255,255,.18)";
      ctx.fillRect(0, 318, canvas.width, 4);
      drawFisherCircle();
      drawFishingLine();
      if (state.castPower) {
        const label = state.castPower.phase === "distance" ? "CAST FOR DISTANCE" : "CAST FOR LUCK";
        writeText(label, 480, 118, 24, "#ffe36e");
        rounded(250, 138, 460, 30, 15, "#073852", "#dff8ff", 3);
        rounded(254, 142, 452 * state.castPower.power, 22, 11, state.castPower.phase === "distance" ? "#55d8ff" : "#ffe36e", null);
      }
      if (state.cast && state.cast.phase === "bite") writeText("BITE! TAP ANYWHERE TO REEL!", 480, 92, 26, "#ffe36e");
    };
  }

  if (typeof drawSellShopView !== "function") {
    window.drawSellShopView = function drawSellShopViewBase() {
      drawTopWater();
      rounded(125, 110, 710, 340, 24, "rgba(255,249,218,.94)", "#4d250b", 5);
      writeText("SELL SHOP", 480, 160, 34, "#4d250b");
      writeText(`Bag value: ${state.bag.reduce((sum, fish) => sum + (fish.value || 0), 0)} coins`, 480, 220, 22, "#4d250b");
      drawUiButton(350, 270, 150, 45, "SELL ALL", function () { sellFish(); state.mode = "dock"; });
      drawUiButton(520, 270, 120, 45, "BACK", function () { state.mode = "dock"; });
    };
  }

  if (typeof drawRodShopView !== "function") {
    window.drawRodShopView = function drawRodShopViewBase() {
      drawTopWater();
      rounded(90, 65, 780, 420, 24, "rgba(232,252,255,.94)", "#073852", 5);
      writeText("ROD SHOP", 480, 115, 34, "#073852");
      rods.forEach(function (rod, index) {
        const y = 148 + index * 50;
        rounded(170, y, 620, 38, 12, state.progress.rod === index ? "#ffe36e" : "#fff", rod.color || rod.glow, 3);
        writeText(`${rod.name}  ${index === 0 ? "FREE" : rod.price + " COINS"}`, 480, y + 25, 16, "#073852");
        buttonZones.push({ x: 170, y, w: 620, h: 38, label: rod.name, action: function () {
          if ((state.progress.ownedRods || []).includes(index)) {
            state.progress.rod = index;
            say(`Equipped ${rod.name}.`);
          } else if ((state.progress.coins || 0) >= rod.price) {
            state.progress.coins -= rod.price;
            state.progress.ownedRods.push(index);
            state.progress.rod = index;
            say(`Bought ${rod.name}.`);
          } else {
            say("Not enough coins yet.");
          }
          saveGame();
        }});
      });
      drawUiButton(24, 482, 120, 40, "BACK", function () { state.mode = "dock"; });
    };
  }
})();
