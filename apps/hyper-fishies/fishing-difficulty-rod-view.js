// Final fishing pass: clearer side-view rod plus harder cast and reel minigames.
(function () {
  const CAST_BAR_SPEED = 2.85;
  const SIDE_ROD_TIP = { x: 306, y: 190 };

  function drawVisibleBrownRod(x, y, scale, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale || 1, scale || 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Shadow makes the rod readable against the water.
    ctx.strokeStyle = "rgba(3, 18, 24, .45)";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(-78, 74);
    ctx.lineTo(-42, 38);
    ctx.quadraticCurveTo(32, -34, 162, -68);
    ctx.stroke();

    // Dark outline.
    ctx.strokeStyle = "#2b1608";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-78, 74);
    ctx.lineTo(-42, 38);
    ctx.quadraticCurveTo(32, -34, 162, -68);
    ctx.stroke();

    // Brown rod body.
    const wood = ctx.createLinearGradient(-78, 74, 162, -68);
    wood.addColorStop(0, "#5b2d10");
    wood.addColorStop(0.5, "#9a5721");
    wood.addColorStop(1, "#d8a04d");
    ctx.strokeStyle = wood;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-78, 74);
    ctx.lineTo(-42, 38);
    ctx.quadraticCurveTo(32, -34, 162, -68);
    ctx.stroke();

    // Handle.
    ctx.strokeStyle = "#1b0d05";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-106, 100);
    ctx.lineTo(-74, 70);
    ctx.stroke();
    ctx.strokeStyle = "#734019";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-106, 100);
    ctx.lineTo(-74, 70);
    ctx.stroke();

    // Reel.
    ctx.fillStyle = "#c88b42";
    ctx.strokeStyle = "#1b0d05";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(-26, 66, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#744019";
    ctx.beginPath();
    ctx.arc(-26, 66, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Guides.
    [
      { x: 20, y: -18, r: 7 },
      { x: 62, y: -39, r: 6 },
      { x: 105, y: -56, r: 5 },
      { x: 154, y: -68, r: 4 }
    ].forEach(function (guide) {
      ctx.strokeStyle = "#1b0d05";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(guide.x, guide.y + 9, guide.r, Math.PI * 0.1, Math.PI * 1.85);
      ctx.stroke();
      ctx.fillStyle = "#9a5721";
      ctx.beginPath();
      ctx.roundRect(guide.x - 5, guide.y - 4, 10, 11, 3);
      ctx.fill();
      ctx.strokeStyle = "#1b0d05";
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    ctx.restore();
  }

  function drawFishingPersonHoldingRod() {
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

    // Front arm grips the rod.
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-15, -4); ctx.lineTo(-31, 10); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, -4); ctx.lineTo(47, -20); ctx.stroke();
    ctx.fillStyle = "#f3c99b";
    ctx.beginPath(); ctx.arc(47, -20, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();

    ctx.fillStyle = "#f3c99b";
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 5;
    ctx.beginPath(); ctx.ellipse(0, -36, 21, 23, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#275f88";
    ctx.beginPath(); ctx.ellipse(0, -54, 21, 9, 0, Math.PI, 0); ctx.lineTo(18, -43); ctx.quadraticCurveTo(0, -37, -18, -43); ctx.closePath(); ctx.fill(); ctx.stroke();

    ctx.restore();
  }

  window.drawFisherCircle = function drawClearlyVisibleSideFishingRod() {
    drawFishingPersonHoldingRod();
    drawVisibleBrownRod(186, 252, 0.62, -0.22);
  };

  window.drawFishingLine = function drawLineConnectedToVisibleRod() {
    if (!state.cast) return;
    const c = state.cast;
    ctx.strokeStyle = "rgba(236,255,251,.84)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(SIDE_ROD_TIP.x, SIDE_ROD_TIP.y);
    ctx.quadraticCurveTo((SIDE_ROD_TIP.x + c.hookX) / 2, Math.min(SIDE_ROD_TIP.y, c.hookY) - 18, c.hookX, c.hookY);
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

  window.updateFishing = function updateFishingHardest(dt) {
    if (state.castPower) {
      state.castPower.power += state.castPower.dir * dt * CAST_BAR_SPEED;
      if (state.castPower.power > 1) {
        state.castPower.power = 1;
        state.castPower.dir = -1;
      }
      if (state.castPower.power < 0) {
        state.castPower.power = 0;
        state.castPower.dir = 1;
      }
      return;
    }

    if (!state.cast) return;
    const cast = state.cast;
    const rod = currentRod();
    cast.timer += dt;

    if (cast.phase === "fly") {
      cast.hookX += cast.vx * dt;
      cast.hookY += cast.vy * dt;
      cast.vy += 560 * dt;
      if (cast.hookY >= cast.waterY) {
        cast.hookY = cast.waterY;
        cast.phase = "waiting";
        cast.biteIn = rand(0.82, 2.2) / (1 + rod.id * 0.055);
        makeRipple(cast.hookX, cast.hookY);
        say("Bobber landed. Wait for a bite...");
      }
    } else if (cast.phase === "waiting") {
      cast.biteIn -= dt;
      cast.hookY += Math.sin(performance.now() / 130) * 0.2;
      if (cast.biteIn <= 0) {
        cast.phase = "bite";
        cast.reel = 0.28;
        cast.fish = rollFish();
        cast.shake = rand(1.15, 2.25);
        say(`${cast.fish.rarity.toUpperCase()} BITE! Tap fast or it escapes!`);
      }
    } else if (cast.phase === "bite") {
      const rarityDrain = {
        Common: 0.11,
        Unusual: 0.15,
        Rare: 0.21,
        Epic: 0.29,
        Legendary: 0.39,
        Mythical: 0.48,
        Extinct: 0.58,
        Gargantuan: 0.68,
        Abyss: 0.78,
        Abyssal: 0.78,
        "???": 0.95
      }[cast.fish.rarity] || 0.18;
      cast.reel -= (0.20 + rarityDrain - rod.control * 0.045) * dt;
      cast.hookX += Math.sin(performance.now() / 62) * cast.shake * 0.36;
      cast.hookY += Math.cos(performance.now() / 75) * cast.shake * 0.10;
      if (cast.reel <= 0) {
        state.cast = null;
        say("The fish fought free. Faster taps and better rods help.");
      }
    }
  };

  window.reel = function reelHarderFinal() {
    if (!state.cast) return castLine();
    if (state.cast.phase !== "bite") return;
    const rod = currentRod();
    state.cast.reel += 0.105 + rod.control * 0.034;
    makeRipple(state.cast.hookX, state.cast.hookY);
    if (state.cast.reel >= 1) catchFish(state.cast.fish);
  };

  const oldCastLine = castLine;
  window.castLine = function castLineHarderFinal() {
    if (state.mode === "sell" || state.mode === "rodshop") return;
    if (state.mode === "dock") {
      if (!atFishingDock(state.player)) return say("Walk onto the FISHING PIER first.");
      enterFishing();
      state.castPower = { power: 0, dir: 1 };
      say("CAST FOR LUCK: the meter is faster now.");
      return;
    }
    if (state.mode !== "fishing") return oldCastLine();
    if (state.bag.length >= state.bagLimit) return say("Your bag is full. Go sell your fish.");
    if (state.castPower) {
      const rod = currentRod();
      const rawPower = clamp(state.castPower.power, 0.05, 1);
      const accuracy = 1 - Math.abs(rawPower - 0.86) / 0.86;
      const power = clamp(rawPower * 0.74 + Math.max(0, accuracy) * 0.26, 0.12, 1);
      state.castPower = null;
      state.cast = {
        phase: "fly",
        timer: 0,
        hookX: 184,
        hookY: 300,
        vx: 170 + power * 270 + rod.id * 12,
        vy: -116 - power * 135 - rod.id * 4,
        waterY: 345,
        reel: 0,
        fish: null
      };
      say(power > 0.82 ? "Great cast!" : power > 0.55 ? "Decent cast." : "Weak cast. Better timing helps.");
      return;
    }
    if (state.cast) return reel();
    state.castPower = { power: 0, dir: 1 };
    say("CAST FOR LUCK: the meter is faster now.");
  };

  window.drawPowerMeter = function drawHarderPowerMeter() {
    if (!state.castPower) return;
    const x = 240;
    const y = 422;
    const w = 480;
    const h = 38;
    rounded(x, y, w, h, 19, "rgba(3, 32, 61, .88)", "#ecfffb", 4);

    const grad = ctx.createLinearGradient(x + 10, y, x + w - 10, y);
    grad.addColorStop(0, "#4db9ff");
    grad.addColorStop(.56, "#63ff93");
    grad.addColorStop(.82, "#ffe36e");
    grad.addColorStop(.91, "#ffffff");
    grad.addColorStop(1, "#ff7a52");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 9, w - 20, h - 18, 10);
    ctx.fill();

    // Smaller perfect zone makes casting harder.
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x + w * 0.83, y + 5, w * 0.065, h - 10, 8);
    ctx.stroke();

    const px = x + 10 + state.castPower.power * (w - 20);
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#05263d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(px, y + h / 2, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.save();
    ctx.textAlign = "center";
    ctx.font = "900 17px Trebuchet MS";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "rgba(3, 32, 61, .95)";
    ctx.fillStyle = "#ffe36e";
    ctx.strokeText("CAST FOR LUCK", x + w / 2, y - 12);
    ctx.fillText("CAST FOR LUCK", x + w / 2, y - 12);
    ctx.restore();
  };

  if (typeof say === "function") {
    say("Fishing minigames are harder, and the side-view rod is clearly visible.");
  }
})();
