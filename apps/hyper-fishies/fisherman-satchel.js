// Fisherman satchel: view caught fish anywhere, and sell one or all from B-LA-KA's shop.
(function () {
  const oldFreshState = freshState;
  freshState = function freshStateWithSatchel() {
    const next = oldFreshState();
    next.satchelOpen = false;
    next.sellSatchelOpen = false;
    return next;
  };

  function toggleSatchel() {
    state.satchelOpen = !state.satchelOpen;
    state.sellSatchelOpen = false;
    say(state.satchelOpen ? "Fisherman satchel opened." : "Fisherman satchel closed.");
  }

  function openSellSatchel() {
    if (!state.bag.length) return say("B-LA-KA says yer satchel is empty.");
    state.sellSatchelOpen = true;
    state.satchelOpen = false;
    say("Pick a fish from the satchel, or sell the whole inventory.");
  }

  function closeSellSatchel() {
    state.sellSatchelOpen = false;
    say("B-LA-KA waits behind the counter.");
  }

  function sellOneFish(index) {
    if (index < 0 || index >= state.bag.length) return;
    const fish = state.bag.splice(index, 1)[0];
    state.progress.coins += fish.value;
    burst(560, 318, rarityColors[fish.rarity] || "#ffe36e", 16);
    saveGame();
    say(`Sold ${fish.rarity} ${fish.name} for ${fish.value} coins.`);
    if (!state.bag.length) state.sellSatchelOpen = false;
  }

  function sellWholeSatchel() {
    if (!state.bag.length) return say("No fish to sell yet.");
    const total = state.bag.reduce((sum, fish) => sum + fish.value, 0);
    state.progress.coins += total;
    state.bag = [];
    state.sellSatchelOpen = false;
    burst(560, 318, "#ffe36e", 24);
    saveGame();
    say(`B-LA-KA bought the whole satchel for ${total} coins.`);
  }

  sellFish = function sellFishSatchelVersion() {
    if (state.mode === "dock") return enterSellShop();
    if (state.mode !== "sell") return;
    return openSellSatchel();
  };

  function drawSatchelIcon(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale || 1, scale || 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#8f5427";
    ctx.strokeStyle = "#2a1408";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(-20, -8, 40, 34, 9);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#f2c06b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(0, -6, 18, Math.PI * 1.05, Math.PI * 1.95);
    ctx.stroke();
    ctx.fillStyle = "#f5c978";
    ctx.beginPath();
    ctx.roundRect(-13, 1, 26, 11, 5);
    ctx.fill();
    ctx.strokeStyle = "#2a1408";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.fillStyle = "#ffe36e";
    ctx.beginPath();
    ctx.arc(0, 16, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFishBadge(fish, x, y, w, h, action, label) {
    const rarityColor = rarityColors[fish.rarity] || "#ecfffb";
    buttonZones.push({ x, y, w, h, action });
    rounded(x, y, w, h, 13, "rgba(6, 46, 66, .92)", rarityColor, 3);
    drawSmallFish(x + 34, y + h / 2, 17, fish.color || rarityColor);
    ctx.textAlign = "left";
    ctx.fillStyle = rarityColor;
    ctx.font = "900 13px Trebuchet MS";
    ctx.fillText(fish.rarity.toUpperCase(), x + 66, y + 20);
    ctx.fillStyle = "#ecfffb";
    ctx.font = "900 16px Trebuchet MS";
    ctx.fillText(fish.name, x + 66, y + 42);
    ctx.textAlign = "right";
    ctx.fillStyle = "#ffe36e";
    ctx.font = "900 15px Trebuchet MS";
    ctx.fillText(`${fish.value}c`, x + w - 16, y + 28);
    ctx.fillStyle = "rgba(255,255,255,.78)";
    ctx.font = "900 11px Trebuchet MS";
    ctx.fillText(label, x + w - 16, y + 48);
  }

  function drawSatchelPanel(mode) {
    const selling = mode === "sell";
    const x = selling ? 170 : 156;
    const y = selling ? 112 : 82;
    const w = selling ? 620 : 648;
    const h = selling ? 352 : 396;
    rounded(x, y, w, h, 24, "rgba(7, 49, 66, .96)", "#f2c06b", 5);

    drawSatchelIcon(x + 45, y + 48, 1.15);
    ctx.textAlign = "left";
    ctx.fillStyle = "#ffe36e";
    ctx.font = "900 27px Trebuchet MS";
    ctx.fillText(selling ? "B-LA-KA'S SELL SATCHEL" : "FISHERMAN SATCHEL", x + 86, y + 42);
    ctx.fillStyle = "#ecfffb";
    ctx.font = "900 15px Trebuchet MS";
    ctx.fillText(state.bag.length ? "Caught fish in your bag" : "Your satchel is empty", x + 88, y + 66);

    if (!state.bag.length) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(236,255,251,.82)";
      ctx.font = "900 22px Trebuchet MS";
      ctx.fillText("Catch some fish first!", x + w / 2, y + 178);
    } else {
      const cols = 2;
      const itemW = (w - 80) / cols;
      const itemH = 66;
      state.bag.slice(0, 8).forEach(function (fish, i) {
        const ix = x + 30 + (i % cols) * (itemW + 20);
        const iy = y + 92 + Math.floor(i / cols) * 78;
        drawFishBadge(fish, ix, iy, itemW, itemH, selling ? function () { sellOneFish(i); } : function () {}, selling ? "SELL ONE" : "IN BAG");
      });
    }

    if (selling) {
      const total = state.bag.reduce((sum, fish) => sum + fish.value, 0);
      drawUiButton(x + w - 314, y + h - 58, 176, 42, `SELL ALL ${total}c`, sellWholeSatchel);
      drawUiButton(x + w - 126, y + h - 58, 94, 42, "CLOSE", closeSellSatchel);
    } else {
      drawUiButton(x + w - 126, y + h - 58, 94, 42, "CLOSE", toggleSatchel);
    }
  }

  const oldDrawGameHud = drawGameHud;
  drawGameHud = function drawGameHudWithSatchel() {
    oldDrawGameHud();
    if (state.mode === "sell") return;
    drawSatchelIcon(836, 31, 0.75);
    ctx.fillStyle = "#ecfffb";
    ctx.font = "900 13px Trebuchet MS";
    ctx.textAlign = "left";
    ctx.fillText("SATCHEL", 858, 36);
  };

  const oldDrawGameButtons = drawGameButtons;
  drawGameButtons = function drawGameButtonsWithSatchel() {
    const y = 500;
    if (state.mode === "sell") {
      if (state.sellSatchelOpen) {
        drawSatchelPanel("sell");
        return;
      }
      buttonZones.push({ x: 582, y: 360, w: 84, h: 46, action: openSellSatchel });
      buttonZones.push({ x: 714, y: 360, w: 84, h: 46, action: exitSellShop });
      drawUiButton(344, y, 162, 42, "OPEN SATCHEL", openSellSatchel);
      drawUiButton(520, y, 162, 42, "SELL ALL", sellWholeSatchel);
      drawUiButton(696, y, 116, 42, "LEAVE", exitSellShop);
      return;
    }

    oldDrawGameButtons();
    drawUiButton(482, y, 108, 42, "SATCHEL", toggleSatchel);
    if (state.satchelOpen) drawSatchelPanel("dock");
  };

  const oldDrawSellShopView = drawSellShopView;
  drawSellShopView = function drawSellShopViewWithSatchelPrompt() {
    oldDrawSellShopView();
    if (!state.sellSatchelOpen) {
      ctx.save();
      drawSatchelIcon(420, 394, 0.9);
      ctx.textAlign = "center";
      ctx.fillStyle = "#2a1408";
      ctx.font = "900 16px Trebuchet MS";
      ctx.fillText("OPEN SATCHEL TO PICK FISH", 520, 440);
      ctx.restore();
    }
  };

  if (typeof say === "function") say("Fisherman satchel added. Open it to inspect fish.");
})();
