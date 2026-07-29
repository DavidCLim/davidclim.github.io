// New reeling minigame: keep your hook marker inside the moving fish zone.
(function () {
  const SIDE_ROD_TIP = { x: 306, y: 190 };

  function reelStats(cast) {
    const rarity = cast.fish ? cast.fish.rarity : "Common";
    const zone = {
      Common: 0.46,
      Unusual: 0.43,
      Rare: 0.40,
      Epic: 0.36,
      Legendary: 0.32,
      Mythical: 0.29,
      Extinct: 0.265,
      Gargantuan: 0.245,
      Abyss: 0.225,
      Abyssal: 0.225,
      "???": 0.20
    }[rarity] || 0.38;
    const speed = {
      Common: 0.22,
      Unusual: 0.25,
      Rare: 0.29,
      Epic: 0.35,
      Legendary: 0.42,
      Mythical: 0.49,
      Extinct: 0.56,
      Gargantuan: 0.64,
      Abyss: 0.72,
      Abyssal: 0.72,
      "???": 0.86
    }[rarity] || 0.32;
    return { zone, speed };
  }

  function setupReelGame(cast) {
    if (cast.reelGame) return;
    cast.reelGame = {
      hook: 0.50,
      hookVel: 0,
      fish: rand(0.30, 0.70),
      fishVel: rand(0.12, 0.24) * (Math.random() < 0.5 ? -1 : 1),
      focus: 0.18
    };
  }

  function drawHookZoneGame(cast) {
    if (!cast || cast.phase !== "bite") return;
    setupReelGame(cast);
    const game = cast.reelGame;
    const stats = reelStats(cast);
    const x = 248;
    const y = 424;
    const w = 464;
    const h = 44;
    const fishX = x + game.fish * w;
    const hookX = x + game.hook * w;
    const zoneW = stats.zone * w;

    ctx.save();
    rounded(x, y, w, h, 20, "rgba(3, 32, 61, .9)", "#ecfffb", 4);

    const water = ctx.createLinearGradient(x, y, x + w, y);
    water.addColorStop(0, "#1ba7e8");
    water.addColorStop(0.5, "#63ffdd");
    water.addColorStop(1, "#0d5ea8");
    ctx.fillStyle = water;
    ctx.beginPath();
    ctx.roundRect(x + 10, y + 10, w - 20, h - 20, 12);
    ctx.fill();

    ctx.fillStyle = "rgba(255, 227, 110, .38)";
    ctx.strokeStyle = "#ffe36e";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(fishX - zoneW / 2, y + 6, zoneW, h - 12, 13);
    ctx.fill();
    ctx.stroke();

    drawSmallFish(fishX, y + h / 2, 18, cast.fish.color || rarityColors[cast.fish.rarity] || "#ffe36e");

    ctx.strokeStyle = "#05263d";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(hookX, y - 7);
    ctx.lineTo(hookX, y + h + 8);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#05263d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(hookX, y + h / 2, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#05263d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(hookX, y + h / 2 + 4, 7, 0.2, Math.PI * 1.32);
    ctx.stroke();

    const progressX = x;
    const progressY = y - 34;
    rounded(progressX, progressY, w, 18, 9, "rgba(3, 32, 61, .75)", "rgba(236,255,251,.7)", 2);
    ctx.fillStyle = "#ffe36e";
    ctx.beginPath();
    ctx.roundRect(progressX + 4, progressY + 4, (w - 8) * clamp(cast.reel, 0, 1), 10, 5);
    ctx.fill();

    ctx.textAlign = "center";
    ctx.font = "900 14px Trebuchet MS";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "rgba(3, 32, 61, .95)";
    ctx.fillStyle = "#ffffff";
    ctx.strokeText("TAP TO PULL THE HOOK INTO THE FISH ZONE", x + w / 2, y - 46);
    ctx.fillText("TAP TO PULL THE HOOK INTO THE FISH ZONE", x + w / 2, y - 46);
    ctx.restore();
  }

  drawFishingLine = function drawHookZoneFishingLine() {
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

    if (c.phase === "bite") drawHookZoneGame(c);
  };

  updateFishing = function updateFishingHookZone(dt) {
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
        cast.reel = 0.22;
        cast.fish = rollFish();
        cast.shake = rand(0.7, 1.25);
        cast.reelGame = null;
        say(`${cast.fish.rarity.toUpperCase()} BITE! Keep the hook in the fish zone!`);
      }
    } else if (cast.phase === "bite") {
      setupReelGame(cast);
      const game = cast.reelGame;
      const stats = reelStats(cast);

      game.fish += game.fishVel * stats.speed * dt;
      if (game.fish < 0.16 || game.fish > 0.84) {
        game.fish = clamp(game.fish, 0.16, 0.84);
        game.fishVel *= -1;
      }
      game.fishVel += Math.sin(performance.now() / 620) * 0.045 * dt;
      game.fishVel = clamp(game.fishVel, -0.48, 0.48);

      game.hookVel -= 1.05 * dt;
      game.hook += game.hookVel * dt;
      game.hookVel *= Math.pow(0.12, dt);
      game.hook = clamp(game.hook, 0.04, 0.96);
      if (game.hook <= 0.04 || game.hook >= 0.96) game.hookVel *= -0.16;

      const distance = Math.abs(game.hook - game.fish);
      const inZone = distance <= stats.zone / 2;
      if (inZone) {
        cast.reel += (0.32 + rod.control * 0.065) * dt;
      } else {
        cast.reel -= (0.035 + distance * 0.055) * dt;
      }
      cast.reel = clamp(cast.reel, 0, 1);

      cast.hookX += Math.sin(performance.now() / 70) * cast.shake * 0.18;
      cast.hookY += Math.cos(performance.now() / 84) * cast.shake * 0.06;
      if (cast.reel <= 0 && cast.timer > 2.0) {
        state.cast = null;
        say("The fish escaped. Keep the hook inside the moving zone.");
      } else if (cast.reel >= 1) {
        catchFish(cast.fish);
      }
    }
  };

  reel = function pullHookTowardFishZone() {
    if (!state.cast) return castLine();
    if (state.cast.phase !== "bite") return;
    setupReelGame(state.cast);
    const game = state.cast.reelGame;
    const rod = currentRod();
    game.hookVel += 0.42 + rod.control * 0.045;
    game.hookVel = clamp(game.hookVel, -1.0, 1.9);
    makeRipple(state.cast.hookX, state.cast.hookY);
  };

  if (typeof say === "function") say("Reeling is easier: bigger fish zone, slower movement, and gentler misses.");
})();
