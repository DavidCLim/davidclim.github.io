// Final gameplay polish: reel fix, inventory restore, mobile joystick, smaller rods, shop rod art, better values and rarity rates.
(function () {
  const ROD_TIP = { x: 278, y: 190 };
  const ROD_START = { x: 116, y: 322 };

  // Make fish worth more and make high rarities slightly less impossible.
  rarityWeights.Common = 45;
  rarityWeights.Rare = 24;
  rarityWeights.Epic = 13;
  rarityWeights.Legendary = 9;
  rarityWeights.Mythical = 4.2;
  rarityWeights.Extinct = 2.1;
  rarityWeights.Gargantuan = 0.9;
  rarityWeights.Abyss = 0.5;
  rarityWeights.Abyssal = 0.5;
  rarityWeights["???"] = 0.11;

  fishTypes.forEach(fish => {
    if (!fish.baseValue) fish.baseValue = fish.value;
    const rarityBonus = {
      Common: 4,
      Rare: 4.2,
      Epic: 4.5,
      Legendary: 5,
      Mythical: 5.4,
      Extinct: 5.8,
      Gargantuan: 6.2,
      Abyss: 6.8,
      Abyssal: 6.8,
      "???": 7.5
    }[fish.rarity] || 4;
    fish.value = Math.max(4, Math.round(fish.baseValue * rarityBonus));
  });

  rollFish = function rollFishBetterRareRates() {
    const rod = currentRod();
    const rarityPower = {
      Common: -0.22,
      Rare: 0.75,
      Epic: 1.1,
      Legendary: 1.55,
      Mythical: 2.0,
      Extinct: 2.55,
      Gargantuan: 3.15,
      Abyss: 3.85,
      Abyssal: 3.85,
      "???": 4.8
    };
    const weighted = fishTypes.map(fish => {
      const base = rarityWeights[fish.rarity] || 1;
      const power = rarityPower[fish.rarity] || 1;
      const boost = fish.rarity === "Common"
        ? Math.max(0.25, 1 + (rod.luck - 1) * power)
        : 1 + (rod.luck - 1) * power;
      return { fish, weight: Math.max(0.05, base * boost) };
    });
    const total = weighted.reduce((sum, item) => sum + item.weight, 0);
    let roll = rand(0, total);
    for (const item of weighted) {
      roll -= item.weight;
      if (roll <= 0) return item.fish;
    }
    return fishTypes[0];
  };

  updateFishing = function updateFishingReliableReel(dt) {
    if (state.castPower) {
      state.castPower.power += state.castPower.dir * dt * 1.65;
      if (state.castPower.power > 1) { state.castPower.power = 1; state.castPower.dir = -1; }
      if (state.castPower.power < 0) { state.castPower.power = 0; state.castPower.dir = 1; }
      return;
    }
    if (!state.cast) return;

    const cast = state.cast;
    const rod = currentRod();
    cast.timer += dt;

    if (cast.phase === "fly") {
      cast.hookX += cast.vx * dt;
      cast.hookY += cast.vy * dt;
      cast.vy += 520 * dt;
      if (cast.hookY >= cast.waterY) {
        cast.hookY = cast.waterY;
        cast.phase = "waiting";
        cast.biteIn = rand(0.65, 1.8) / (1 + rod.id * 0.07);
        makeRipple(cast.hookX, cast.hookY);
        say("Bobber landed. Wait for a bite...");
      }
    } else if (cast.phase === "waiting") {
      cast.biteIn -= dt;
      cast.hookY += Math.sin(performance.now() / 150) * 0.16;
      if (cast.biteIn <= 0) {
        cast.phase = "bite";
        cast.reel = 0.42;
        cast.fish = rollFish();
        cast.shake = rand(0.75, 1.45);
        say(`${cast.fish.rarity.toUpperCase()} BITE! Tap anywhere to reel!`);
      }
    } else if (cast.phase === "bite") {
      const pain = {
        Common: 0.022,
        Rare: 0.043,
        Epic: 0.07,
        Legendary: 0.102,
        Mythical: 0.14,
        Extinct: 0.19,
        Gargantuan: 0.24,
        Abyss: 0.31,
        Abyssal: 0.31,
        "???": 0.42
      }[cast.fish.rarity] || 0.055;
      cast.reel -= (0.08 + pain + cast.fish.value / 9000 - rod.control * 0.032) * dt;
      cast.hookX += Math.sin(performance.now() / 84) * cast.shake * 0.18;
      if (cast.reel <= 0) {
        state.cast = null;
        say("The fish broke loose. Tap faster next bite.");
      }
    }
  };

  reel = function reelThatAlwaysWorks() {
    if (!state.cast) return castLine();
    if (state.cast.phase !== "bite") return;
    const rod = currentRod();
    state.cast.reel = Math.min(1.08, state.cast.reel + 0.24 + rod.control * 0.065);
    makeRipple(state.cast.hookX, state.cast.hookY);
    if (state.cast.reel >= 1) catchFish(state.cast.fish);
  };

  catchFish = function catchFishMoreCoins(fish) {
    const rarityMultiplier = {
      Common: 1.1,
      Rare: 1.16,
      Epic: 1.25,
      Legendary: 1.42,
      Mythical: 1.62,
      Extinct: 1.82,
      Gargantuan: 2.05,
      Abyss: 2.35,
      Abyssal: 2.35,
      "???": 2.9
    }[fish.rarity] || 1.15;
    const value = Math.max(5, Math.round(fish.value * rarityMultiplier * (1 + currentRod().luck * 0.04) * rand(0.88, 1.22)));
    state.bag.push({ ...fish, value });
    state.latest = `${fish.rarity} ${fish.name}`;
    state.progress.bestFish = state.latest;
    state.progress.caught[fish.name] = (state.progress.caught[fish.name] || 0) + 1;
    state.catchReveal = { fish: { ...fish, value }, life: 2.8, age: 0 };
    burst(state.cast ? state.cast.hookX : 500, state.cast ? state.cast.hookY : 330, rarityColors[fish.rarity] || "#ecfffb", 30);
    state.cast = null;
    saveGame();
    say(`Caught ${fish.rarity} ${fish.name}! Value: ${value} coins.`);
  };

  // Tap anywhere on the fishing screen during a bite to reel. This catches mobile misses.
  canvas.addEventListener("pointerdown", event => {
    if (!state || state.mode !== "fishing" || !state.cast || state.cast.phase !== "bite") return;
    const point = canvasPoint(event);
    const ui = buttonZones.find(b => inRect(point, b.x, b.y, b.w, b.h));
    if (ui) return;
    event.preventDefault();
    reel();
  }, true);

  // Smaller, less screen-eating fishing rod using the same blue/cream style.
  function drawGameRod(x, y, scale) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "#142052";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(42, -42);
    ctx.quadraticCurveTo(105, -105, 176, -132);
    ctx.stroke();

    const g = ctx.createLinearGradient(0, 0, 176, -132);
    g.addColorStop(0, "#fff2bf");
    g.addColorStop(0.52, "#fff7d6");
    g.addColorStop(1, "#f5edc5");
    ctx.strokeStyle = g;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(42, -42);
    ctx.quadraticCurveTo(105, -105, 176, -132);
    ctx.stroke();

    ctx.strokeStyle = "#315cbd";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(34, -34);
    ctx.stroke();
    rounded(32, -48, 24, 20, 6, "#c7f7ff", "#142052", 4);
    rounded(50, -68, 44, 20, 8, "#315cbd", "#142052", 4);

    ctx.fillStyle = "#bdf4ff";
    ctx.strokeStyle = "#142052";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(84, -34, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#315cbd";
    ctx.beginPath();
    ctx.arc(84, -34, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    [{ x: 104, y: -86, r: 8 }, { x: 132, y: -108, r: 6 }, { x: 160, y: -126, r: 4.5 }].forEach(guide => {
      ctx.save();
      ctx.translate(guide.x, guide.y);
      ctx.rotate(-0.78);
      rounded(-5, -9, 10, 14, 3, "#315cbd", "#142052", 3);
      ctx.strokeStyle = "#142052";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(2, 9, guide.r, Math.PI * 0.2, Math.PI * 1.75);
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
  }

  function drawFishingHeroSmallRod() {
    const t = state.walkFrame || 0;
    const bob = Math.sin(t * 1.8) * 1.1;
    ctx.save();
    ctx.translate(142, 285 - bob);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "rgba(0,22,34,.28)";
    ctx.beginPath();
    ctx.ellipse(0, 44 + bob, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-7, 16); ctx.lineTo(-18, 42); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 16); ctx.lineTo(20, 42); ctx.stroke();
    ctx.fillStyle = "#f4c94d";
    ctx.beginPath(); ctx.roundRect(-18, -14, 36, 38, 14); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#2f75a8";
    ctx.beginPath(); ctx.moveTo(-15, -4); ctx.lineTo(0, 20); ctx.lineTo(15, -4); ctx.lineTo(12, 20); ctx.quadraticCurveTo(0, 29, -12, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-14, -4); ctx.lineTo(-31, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(14, -3); ctx.lineTo(30, -8); ctx.stroke();
    ctx.fillStyle = "#f3c99b";
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, -34, 21, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#275f88";
    ctx.beginPath(); ctx.ellipse(0, -52, 20, 9, 0, Math.PI, 0); ctx.lineTo(18, -42); ctx.quadraticCurveTo(0, -36, -18, -42); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(8, -46, 19, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#10202c";
    ctx.beginPath(); ctx.arc(-7, -35, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, -35, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  drawFisherCircle = function drawSmallerRodFisher() {
    drawFishingHeroSmallRod();
    drawGameRod(ROD_START.x, ROD_START.y, 0.88);
  };

  drawFishingLine = function drawSmallerConnectedLine() {
    if (!state.cast) return;
    const c = state.cast;
    ctx.strokeStyle = "rgba(236,255,251,.84)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ROD_TIP.x, ROD_TIP.y);
    ctx.quadraticCurveTo((ROD_TIP.x + c.hookX) / 2, Math.min(ROD_TIP.y, c.hookY) - 16, c.hookX, c.hookY);
    ctx.stroke();
    ctx.fillStyle = c.phase === "bite" ? "#ffe36e" : "#ffffff";
    ctx.strokeStyle = "#05263d";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(c.hookX, c.hookY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    if (c.phase === "bite") {
      ctx.strokeStyle = rarityColors[c.fish.rarity] || "#ecfffb";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(c.hookX, c.hookY, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(c.reel, 0, 1));
      ctx.stroke();
    }
  };

  drawTinyRod = function drawShopRodTexture(x, y, rod) {
    ctx.save();
    ctx.translate(x - 5, y + 3);
    ctx.scale(0.26, 0.26);
    ctx.shadowColor = rod.glow;
    ctx.shadowBlur = 12;
    drawGameRod(0, 0, 1);
    ctx.shadowBlur = 0;
    ctx.restore();
  };

  // Bring inventory back after all later draw overrides.
  function openInventoryFinal() {
    state.previousMode = state.mode === "inventory" ? "dock" : state.mode;
    state.mode = "inventory";
    say("Inventory opened. These are the fish in your bag.");
  }

  function closeInventoryFinal() {
    state.mode = state.previousMode && state.previousMode !== "inventory" ? state.previousMode : "dock";
    state.previousMode = "";
    say("Back to the dock. Keep fishing or sell your catch.");
  }

  const previousDraw = draw;
  draw = function drawWithFinalInventory() {
    if (state.mode === "inventory") {
      buttonZones.length = 0;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawInventoryScreenFinal();
      drawUiButton(24, 500, 110, 42, "BACK", closeInventoryFinal);
      if (state.bag.length) drawUiButton(760, 500, 160, 42, "SELL ALL", () => { state.mode = "sell"; sellFish(); closeInventoryFinal(); });
      if (typeof drawSavingIcon === "function") drawSavingIcon();
      return;
    }
    previousDraw();
  };

  const previousButtons = drawGameButtons;
  drawGameButtons = function drawButtonsWithFinalBag() {
    previousButtons();
    if (state.mode === "dock" || state.mode === "fishing") drawUiButton(360, 500, 108, 42, "BAG", openInventoryFinal);
  };

  function drawInventoryScreenFinal() {
    drawTopWater();
    rounded(74, 62, 812, 418, 28, "rgba(3, 30, 58, .88)", "#ecfffb", 5);
    rounded(102, 86, 756, 62, 18, "rgba(255, 227, 110, .96)", "#09283d", 4);
    ctx.fillStyle = "#09283d";
    ctx.font = "900 34px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("FISH BAG", 480, 128);
    ctx.font = "900 17px Trebuchet MS";
    ctx.fillText(`${state.bag.length}/${state.bagLimit} FISH  |  COINS ${state.progress.coins}`, 480, 154);

    if (!state.bag.length) {
      ctx.fillStyle = "#ecfffb";
      ctx.font = "900 25px Trebuchet MS";
      ctx.fillText("YOUR BAG IS EMPTY", 480, 268);
      ctx.font = "800 18px Trebuchet MS";
      ctx.fillText("Go to the fishing dock and catch something first.", 480, 304);
      return;
    }

    const startX = 126, startY = 184, cardW = 168, cardH = 118;
    state.bag.slice(0, 8).forEach((fish, index) => {
      const col = index % 4;
      const row = Math.floor(index / 4);
      const x = startX + col * 182;
      const y = startY + row * 132;
      rounded(x, y, cardW, cardH, 16, "rgba(236,255,251,.94)", rarityColors[fish.rarity] || "#ecfffb", 4);
      ctx.save();
      ctx.translate(x + cardW / 2, y + 42);
      drawFishDesign(fish.design || fish.name, 0, 0, 0.45, fish.color);
      ctx.restore();
      ctx.fillStyle = "#09283d";
      ctx.font = "900 14px Trebuchet MS";
      ctx.textAlign = "center";
      ctx.fillText(fish.name.toUpperCase(), x + cardW / 2, y + 82);
      ctx.fillStyle = rarityColors[fish.rarity] || "#0b72ad";
      ctx.fillText(fish.rarity.toUpperCase(), x + cardW / 2, y + 101);
      ctx.fillStyle = "#09283d";
      ctx.fillText(`${fish.value} COINS`, x + cardW / 2, y + 116);
    });
  }

  window.addEventListener("keydown", event => {
    const key = event.key.toLowerCase();
    if (state.mode === "inventory" && (key === "escape" || key === "b" || key === "i")) closeInventoryFinal();
    else if ((state.mode === "dock" || state.mode === "fishing") && (key === "b" || key === "i")) openInventoryFinal();
  });

  // Move and shrink mobile joystick so it does not sit over the character as much.
  const style = document.createElement("style");
  style.textContent = `
    @media (max-width: 760px), (pointer: coarse) {
      #joystick {
        width: 84px !important;
        height: 84px !important;
        left: 10px !important;
        bottom: 74px !important;
        opacity: .48 !important;
      }
      #joystick:active { opacity: .88 !important; }
      #joystickKnob {
        width: 34px !important;
        height: 34px !important;
      }
    }
  `;
  document.head.appendChild(style);

  say("Reeling, inventory, mobile joystick, rod art, fish values, and rare chances updated.");
})();
