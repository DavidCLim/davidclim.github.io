// Fisherman satchel: view caught fish anywhere, and sell individual fish only from B-LA-KA's shop.
(function () {
  const oldFreshState = freshState;
  freshState = function freshStateWithSatchel() {
    const next = oldFreshState();
    next.satchelOpen = false;
    next.sellSatchelOpen = false;
    return next;
  };

  // Hide the old paper-shop YES/NO and sell-inventory boxes. The new shop flow is satchel-only.
  drawSketchChoice = function hiddenOldSellChoice() {};
  drawSketchInventory = function hiddenOldSellInventory() {};

  function toggleSatchel() {
    state.satchelOpen = !state.satchelOpen;
    state.sellSatchelOpen = false;
    say(state.satchelOpen ? "Fisherman satchel opened. Selling only works at B-LA-KA's shop." : "Fisherman satchel closed.");
  }

  function openSellSatchel() {
    if (!state.bag.length) return say("B-LA-KA says yer satchel is empty.");
    state.sellSatchelOpen = true;
    state.satchelOpen = false;
    say("Pick a fish from the satchel to sell it.");
  }

  function closeSellSatchel() {
    state.sellSatchelOpen = false;
    say("B-LA-KA waits behind the counter.");
  }

  function sellOneFish(index) {
    if (state.mode !== "sell") return say("You can only sell fish at B-LA-KA's shop.");
    if (index < 0 || index >= state.bag.length) return;
    const fish = state.bag.splice(index, 1)[0];
    state.progress.coins += fish.value;
    burst(560, 318, rarityColors[fish.rarity] || "#ffe36e", 16);
    saveGame();
    say(`Sold ${fish.rarity} ${fish.name} for ${fish.value} coins.`);
    if (!state.bag.length) state.sellSatchelOpen = false;
  }

  sellFish = function sellFishSatchelVersion() {
    if (state.mode === "dock") return enterSellShop();
    if (state.mode !== "sell") return;
    return openSellSatchel();
  };

  function leatherFill(x, y, w, h) {
    const fill = ctx.createLinearGradient(x, y, x + w, y + h);
    fill.addColorStop(0, "#c7833c");
    fill.addColorStop(0.42, "#8f5427");
    fill.addColorStop(1, "#4b2713");
    return fill;
  }

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

  function drawLeatherSatchelPanel(x, y, w, h) {
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, .36)";
    ctx.shadowBlur = 22;
    ctx.shadowOffsetY = 10;
    ctx.fillStyle = leatherFill(x, y, w, h);
    ctx.strokeStyle = "#2a1408";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(x + 44, y + 70);
    ctx.quadraticCurveTo(x + w / 2, y - 18, x + w - 44, y + 70);
    ctx.lineTo(x + w - 26, y + h - 38);
    ctx.quadraticCurveTo(x + w / 2, y + h + 26, x + 26, y + h - 38);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.shadowBlur = 0;

    ctx.fillStyle = "rgba(255, 218, 128, .18)";
    ctx.beginPath();
    ctx.moveTo(x + 64, y + 84);
    ctx.quadraticCurveTo(x + w / 2, y + 28, x + w - 64, y + 84);
    ctx.lineTo(x + w - 92, y + 138);
    ctx.quadraticCurveTo(x + w / 2, y + 95, x + 92, y + 138);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#5a2f16";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = "rgba(255, 229, 154, .62)";
    ctx.lineWidth = 3;
    ctx.setLineDash([7, 8]);
    ctx.beginPath();
    ctx.roundRect(x + 28, y + 86, w - 56, h - 120, 24);
    ctx.stroke();
    ctx.setLineDash([]);

    ctx.fillStyle = "#f2c06b";
    ctx.strokeStyle = "#2a1408";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.roundRect(x + w / 2 - 38, y + 112, 76, 38, 11);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#4b2713";
    ctx.beginPath();
    ctx.arc(x + w / 2, y + 131, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawFishBadge(fish, x, y, w, h, action, label) {
    const rarityColor = rarityColors[fish.rarity] || "#ecfffb";
    buttonZones.push({ x, y, w, h, action });
    rounded(x, y, w, h, 13, "rgba(39, 18, 7, .78)", rarityColor, 3);
    drawSmallFish(x + 34, y + h / 2, 17, fish.color || rarityColor);
    ctx.textAlign = "left";
    ctx.fillStyle = rarityColor;
    ctx.font = "900 13px Trebuchet MS";
    ctx.fillText(fish.rarity.toUpperCase(), x + 66, y + 20);
    ctx.fillStyle = "#fff4c4";
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
    const y = selling ? 88 : 70;
    const w = selling ? 620 : 648;
    const h = selling ? 378 : 410;
    drawLeatherSatchelPanel(x, y, w, h);

    drawSatchelIcon(x + 58, y + 74, 1.2);
    ctx.textAlign = "left";
    ctx.fillStyle = "#fff4c4";
    ctx.font = "900 27px Trebuchet MS";
    ctx.fillText(selling ? "B-LA-KA'S SATCHEL" : "FISHERMAN SATCHEL", x + 100, y + 60);
    ctx.fillStyle = "#ffe36e";
    ctx.font = "900 15px Trebuchet MS";
    ctx.fillText(state.bag.length ? (selling ? "Click a fish to sell it" : "Check your fish anywhere - selling only at B-LA-KA") : "Your leather satchel is empty", x + 102, y + 84);

    if (!state.bag.length) {
      ctx.textAlign = "center";
      ctx.fillStyle = "rgba(255,244,196,.9)";
      ctx.font = "900 22px Trebuchet MS";
      ctx.fillText("Catch some fish first!", x + w / 2, y + 218);
    } else {
      const cols = 2;
      const itemW = (w - 100) / cols;
      const itemH = 66;
      state.bag.slice(0, 8).forEach(function (fish, i) {
        const ix = x + 40 + (i % cols) * (itemW + 20);
        const iy = y + 142 + Math.floor(i / cols) * 76;
        drawFishBadge(fish, ix, iy, itemW, itemH, selling ? function () { sellOneFish(i); } : function () { say("Bring your satchel to B-LA-KA if you want to sell this fish."); }, selling ? "SELL" : "IN BAG");
      });
    }

    drawUiButton(x + w - 132, y + h - 62, 94, 42, "CLOSE", selling ? closeSellSatchel : toggleSatchel);
  }

  const oldDrawGameHud = drawGameHud;
  drawGameHud = function drawGameHudWithSatchel() {
    oldDrawGameHud();
    if (state.mode === "sell") return;
    buttonZones.push({ x: 812, y: 10, w: 128, h: 40, action: toggleSatchel });
    rounded(808, 10, 134, 40, 12, "rgba(39, 18, 7, .54)", "rgba(255, 227, 110, .7)", 2);
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
      drawUiButton(398, y, 164, 42, "OPEN SATCHEL", openSellSatchel);
      return;
    }

    oldDrawGameButtons();
    drawUiButton(482, y, 108, 42, "SATCHEL", toggleSatchel);
    if (state.satchelOpen) drawSatchelPanel("view");
  };

  const oldDrawSellShopView = drawSellShopView;
  drawSellShopView = function drawSellShopViewWithSatchelPrompt() {
    oldDrawSellShopView();
    if (!state.sellSatchelOpen) {
      ctx.save();
      drawSatchelIcon(420, 394, 1.05);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fff4c4";
      ctx.strokeStyle = "#2a1408";
      ctx.lineWidth = 5;
      ctx.font = "900 17px Trebuchet MS";
      ctx.strokeText("OPEN SATCHEL TO SELL FISH", 520, 440);
      ctx.fillText("OPEN SATCHEL TO SELL FISH", 520, 440);
      ctx.restore();
    }
  };

  if (typeof say === "function") say("The satchel can now open anywhere. Selling still belongs to B-LA-KA.");
})();
