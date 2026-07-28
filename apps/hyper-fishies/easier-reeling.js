// Makes the timing-ring reeling minigame easier while keeping the skill-based feel.
(function () {
  const SIDE_ROD_TIP = { x: 306, y: 190 };

  function easierReelStats(cast) {
    const rarity = cast.fish ? cast.fish.rarity : "Common";
    const size = {
      Common: 0.36,
      Unusual: 0.33,
      Rare: 0.30,
      Epic: 0.26,
      Legendary: 0.23,
      Mythical: 0.20,
      Extinct: 0.18,
      Gargantuan: 0.165,
      Abyss: 0.15,
      Abyssal: 0.15,
      "???": 0.13
    }[rarity] || 0.28;
    const speed = {
      Common: 0.46,
      Unusual: 0.52,
      Rare: 0.60,
      Epic: 0.70,
      Legendary: 0.82,
      Mythical: 0.94,
      Extinct: 1.05,
      Gargantuan: 1.16,
      Abyss: 1.28,
      Abyssal: 1.28,
      "???": 1.44
    }[rarity] || 0.66;
    return { size, speed };
  }

  function circularDistance(a, b) {
    const diff = Math.abs(a - b) % 1;
    return Math.min(diff, 1 - diff);
  }

  function drawEasierReelRing(cast) {
    if (!cast || cast.phase !== "bite") return;
    const stats = easierReelStats(cast);
    const cx = cast.hookX;
    const cy = cast.hookY;
    const radius = 48;
    const target = cast.reelTarget || 0.78;
    const needle = cast.reelNeedle || 0;
    const start = -Math.PI / 2 + (target - stats.size / 2) * Math.PI * 2;
    const end = -Math.PI / 2 + (target + stats.size / 2) * Math.PI * 2;
    const needleAngle = -Math.PI / 2 + needle * Math.PI * 2;

    ctx.save();
    ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(236,255,251,.28)";
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = "#ffe36e";
    ctx.lineWidth = 13;
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
    ctx.strokeText("EASY TIMING", cx, cy - radius - 16);
    ctx.fillText("EASY TIMING", cx, cy - radius - 16);
    ctx.restore();
  }

  const previousDrawFishingLine = drawFishingLine;
  drawFishingLine = function drawEasierReelFishingLine() {
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
      drawEasierReelRing(c);
    }
  };

  updateFishing = function updateFishingEasierReel(dt) {
    if (state.castPower) {
      state.castPower.power += state.castPower.dir * dt * 1.45;
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
        cast.reel = 0.46;
        cast.fish = rollFish();
        cast.shake = rand(0.85, 1.55);
        cast.reelNeedle = 0;
        cast.reelTarget = rand(0.12, 0.88);
        say(`${cast.fish.rarity.toUpperCase()} BITE! Tap when the needle hits gold!`);
      }
    } else if (cast.phase === "bite") {
      const stats = easierReelStats(cast);
      const rarityDrain = {
        Common: 0.04,
        Unusual: 0.06,
        Rare: 0.085,
        Epic: 0.12,
        Legendary: 0.17,
        Mythical: 0.22,
        Extinct: 0.28,
        Gargantuan: 0.34,
        Abyss: 0.42,
        Abyssal: 0.42,
        "???": 0.52
      }[cast.fish.rarity] || 0.08;
      cast.reelNeedle = (cast.reelNeedle + dt * stats.speed) % 1;
      cast.reel -= (0.08 + rarityDrain - rod.control * 0.035) * dt;
      cast.hookX += Math.sin(performance.now() / 70) * cast.shake * 0.24;
      cast.hookY += Math.cos(performance.now() / 84) * cast.shake * 0.08;
      if (cast.reel <= 0) {
        state.cast = null;
        say("The fish got away. Try tapping when the needle hits gold.");
      }
    }
  };

  reel = function reelEasierTimingTap() {
    if (!state.cast) return castLine();
    if (state.cast.phase !== "bite") return;
    const cast = state.cast;
    const rod = currentRod();
    const stats = easierReelStats(cast);
    const distance = circularDistance(cast.reelNeedle || 0, cast.reelTarget || 0.78);

    if (distance <= stats.size / 2) {
      cast.reel += 0.24 + rod.control * 0.055;
      cast.reelTarget = rand(0.08, 0.92);
      cast.reelNeedle = (cast.reelNeedle + 0.12) % 1;
      makeRipple(cast.hookX, cast.hookY);
      say("Perfect reel!");
    } else if (distance <= stats.size * 1.25) {
      cast.reel += 0.13 + rod.control * 0.035;
      makeRipple(cast.hookX, cast.hookY);
      say("Good reel.");
    } else {
      cast.reel -= 0.025;
      say("Missed timing, but the fish is still close!");
    }

    if (cast.reel >= 1) catchFish(cast.fish);
  };

  if (typeof say === "function") say("Reeling is easier now: wider gold zone, slower needle, softer misses.");
})();
