// Final fishing pass: clearer side-view rod, easier casting, and a more skill-based reeling minigame.
(function () {
  const CAST_BAR_SPEED = 1.45;
  const SIDE_ROD_TIP = { x: 306, y: 190 };

  function drawVisibleBrownRod(x, y, scale, angle) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle || 0);
    ctx.scale(scale || 1, scale || 1);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.strokeStyle = "rgba(3, 18, 24, .45)";
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.moveTo(-78, 74);
    ctx.lineTo(-42, 38);
    ctx.quadraticCurveTo(32, -34, 162, -68);
    ctx.stroke();

    ctx.strokeStyle = "#2b1608";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(-78, 74);
    ctx.lineTo(-42, 38);
    ctx.quadraticCurveTo(32, -34, 162, -68);
    ctx.stroke();

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

  function reelTimingStats(cast) {
    const rarity = cast.fish ? cast.fish.rarity : "Common";
    const size = {
      Common: 0.24,
      Unusual: 0.22,
      Rare: 0.19,
      Epic: 0.16,
      Legendary: 0.135,
      Mythical: 0.115,
      Extinct: 0.10,
      Gargantuan: 0.09,
      Abyss: 0.08,
      Abyssal: 0.08,
      "???": 0.065
    }[rarity] || 0.18;
    const speed = {
      Common: 0.72,
      Unusual: 0.82,
      Rare: 0.96,
      Epic: 1.12,
      Legendary: 1.32,
      Mythical: 1.48,
      Extinct: 1.66,
      Gargantuan: 1.84,
      Abyss: 2.02,
      Abyssal: 2.02,
      "???": 2.28
    }[rarity] || 1;
    return { size, speed };
  }

  function circularDistance(a, b) {
    const diff = Math.abs(a - b) % 1;
    return Math.min(diff, 1 - diff);
  }

  function drawReelTimingRing(cast) {
    if (!cast || cast.phase !== "bite") return;
    const stats = reelTimingStats(cast);
    const cx = cast.hookX;
    const cy = cast.hookY;
    const radius = 46;
    const target = cast.reelTarget || 0.78;
    const needle = cast.reelNeedle || 0;
    const start = -Math.PI / 2 + (target - stats.size / 2) * Math.PI * 2;
    const end = -Math.PI / 2 + (target + stats.size / 2) * Math.PI * 2;
    const needleAngle = -Math.PI / 2 + needle * Math.PI * 2;

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(236,255,251,.28)";
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#ffe36e";
    ctx.lineWidth = 11;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, start, end);
    ctx.stroke();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + Math.cos(needleAngle) * (radius + 12), cy + Math.sin(needleAngle) * (radius + 12));
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.font = "900 12px Trebuchet MS";
    ctx.lineWidth = 4;
    ctx.strokeStyle = "rgba(3, 32, 61, .95)";
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("TIME TAP", cx, cy - radius - 16);
    ctx.fillText("TIME TAP", cx, cy - radius - 16);
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
      drawReelTimingRing(c);
    }
  };

  window.updateFishing = function updateFishingBalanced(dt) {
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
        cast.reel = 0.34;
        cast.fish = rollFish();
        cast.shake = rand(1.15, 2.25);
        cast.reelNeedle = 0;
        cast.reelTarget = rand(0.12, 0.88);
        say(`${cast.fish.rarity.toUpperCase()} BITE! Tap when the needle hits gold!`);
      }
    } else if (cast.phase === "bite") {
      const stats = reelTimingStats(cast);
      const rarityDrain = {
        Common: 0.09,
        Unusual: 0.13,
        Rare: 0.18,
        Epic: 0.25,
        Legendary: 0.34,
        Mythical: 0.43,
        Extinct: 0.52,
        Gargantuan: 0.62,
        Abyss: 0.72,
        Abyssal: 0.72,
        "???": 0.88
      }[cast.fish.rarity] || 0.16;
      cast.reelNeedle = (cast.reelNeedle + dt * stats.speed) % 1;
      cast.reel -= (0.16 + rarityDrain - rod.control * 0.045) * dt;
      cast.hookX += Math.sin(performance.now() / 62) * cast.shake * 0.36;
      cast.hookY += Math.cos(performance.now() / 75) * cast.shake * 0.10;
      if (cast.reel <= 0) {
        state.cast = null;
        say("The fish fought free. Time your taps on the gold ring.");
      }
    }
  };

  window.reel = function reelTimingTap() {
    if (!state.cast) return castLine();
    if (state.cast.phase !== "bite") return;
    const cast = state.cast;
    const rod = currentRod();
    const stats = reelTimingStats(cast);
    const distance = circularDistance(cast.reelNeedle || 0, cast.reelTarget || 0.78);

    if (distance <= stats.size / 2) {
      cast.reel += 0.17 + rod.control * 0.044;
      cast.reelTarget = rand(0.08, 0.92);
      cast.reelNeedle = (cast.reelNeedle + 0.18) % 1;
      makeRipple(cast.hookX, cast.hookY);
      say("Perfect reel!");
    } else if (distance <= stats.size) {
      cast.reel += 0.07 + rod.control * 0.024;
      makeRipple(cast.hookX, cast.hookY);
      say("Good reel.");
    } else {
      cast.reel -= 0.065;
      say("Missed timing!");
    }

    if (cast.reel >= 1) catchFish(cast.fish);
  };

  const oldCastLine = castLine;
  window.castLine = function castLineBalanced() {
    if (state.mode === "sell" || state.mode === "rodshop") return;
    if (state.mode === "dock") {
      if (!atFishingDock(state.player)) return say("Walk onto the FISHING PIER first.");
      enterFishing();
      state.castPower = { power: 0, dir: 1 };
      say("CAST FOR LUCK: easier timing, bigger sweet spot.");
      return;
    }
    if (state.mode !== "fishing") return oldCastLine();
    if (state.bag.length >= state.bagLimit) return say("Your bag is full. Go sell your fish.");
    if (state.castPower) {
      const rod = currentRod();
      const rawPower = clamp(state.castPower.power, 0.05, 1);
      const accuracy = 1 - Math.abs(rawPower - 0.78) / 0.78;
      const power = clamp(rawPower * 0.62 + Math.max(0, accuracy) * 0.38, 0.2, 1);
      state.castPower = null;
      state.cast = {
        phase: "fly",
        timer: 0,
        hookX: 184,
        hookY: 300,
        vx: 185 + power * 285 + rod.id * 12,
        vy: -120 - power * 135 - rod.id * 4,
        waterY: 345,
        reel: 0,
        fish: null
      };
      say(power > 0.78 ? "Great cast!" : power > 0.45 ? "Good cast." : "Short cast, but still fishable.");
      return;
    }
    if (state.cast) return reel();
    state.castPower = { power: 0, dir: 1 };
    say("CAST FOR LUCK: easier timing, bigger sweet spot.");
  };

  window.drawPowerMeter = function drawEasierPowerMeter() {
    if (!state.castPower) return;
    const x = 240;
    const y = 422;
    const w = 480;
    const h = 38;
    rounded(x, y, w, h, 19, "rgba(3, 32, 61, .88)", "#ecfffb", 4);

    const grad = ctx.createLinearGradient(x + 10, y, x + w - 10, y);
    grad.addColorStop(0, "#4db9ff");
    grad.addColorStop(.52, "#63ff93");
    grad.addColorStop(.74, "#ffe36e");
    grad.addColorStop(.88, "#ffffff");
    grad.addColorStop(1, "#ff7a52");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 9, w - 20, h - 18, 10);
    ctx.fill();

    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(x + w * 0.68, y + 5, w * 0.20, h - 10, 8);
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
    say("Casting is easier now. Reeling uses timing taps on the gold ring.");
  }
})();
