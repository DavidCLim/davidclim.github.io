// Final Hyper Fishies fix: restore cast/reel minigames and switch the dock/player to a side-view 2D feel.
(function () {
  const WALK_SPEED = 220;
  const GROUND_Y = 392;
  const PLAYER_SCALE = 0.82;

  function ensurePlayerAnimationState() {
    if (!state.player) return;
    if (!state.player.facing) state.player.facing = "right";
    if (!state.player.pose) state.player.pose = "idle";
    if (typeof state.walkFrame !== "number") state.walkFrame = 0;
    state.diving = false;
    state.oxygen = 100;
    state.health = 100;
  }

  atSellDock = function atSellDockSide(p) {
    return inRect(p, 78, 300, 190, 128);
  };

  atShopDock = function atShopDockSide(p) {
    return inRect(p, 692, 300, 190, 128);
  };

  atFishingDock = function atFishingDockSide(p) {
    return inRect(p, 360, 236, 240, 112);
  };

  constrainToDock = function constrainSideDock(p) {
    const onMain = p.x >= 62 && p.x <= 900 && p.y >= 322 && p.y <= 430;
    const onFishingPier = p.x >= 342 && p.x <= 618 && p.y >= 236 && p.y <= 358;
    const inLeftShop = p.x >= 78 && p.x <= 268 && p.y >= 286 && p.y <= 430;
    const inRightShop = p.x >= 692 && p.x <= 888 && p.y >= 286 && p.y <= 430;
    if (onMain || onFishingPier || inLeftShop || inRightShop) return;

    p.x = clamp(p.x, 62, 900);
    if (p.x >= 342 && p.x <= 618 && p.y < 322) p.y = clamp(p.y, 236, 358);
    else p.y = clamp(p.y, 322, 430);
    p.vx *= 0.08;
    p.vy *= 0.08;
  };

  updateDock = function updateDockSideScroller(dt) {
    ensurePlayerAnimationState();
    if (typeof normalizeRodProgress === "function") normalizeRodProgress();

    const p = state.player;
    let ax = 0;
    let ay = 0;
    if (keys.has("arrowleft") || keys.has("a")) ax -= 1;
    if (keys.has("arrowright") || keys.has("d")) ax += 1;
    if (keys.has("arrowup") || keys.has("w")) ay -= 1;
    if (keys.has("arrowdown") || keys.has("s")) ay += 1;
    ax += joy.x;
    ay += joy.y;

    const mag = Math.hypot(ax, ay);
    if (mag > 0.12) {
      ax /= mag;
      ay /= mag;
      p.pose = "walk";
      if (Math.abs(ax) >= Math.abs(ay) * 0.55) p.facing = ax < 0 ? "left" : "right";
      state.walkFrame += dt * 9.5;
    } else {
      ax = 0;
      ay = 0;
      p.pose = "idle";
      state.walkFrame += dt * 2.2;
    }

    const targetVx = ax * WALK_SPEED;
    const targetVy = ay * (WALK_SPEED * 0.62);
    const follow = mag > 0.12 ? 0.42 : 0.68;
    p.vx += (targetVx - p.vx) * follow;
    p.vy += (targetVy - p.vy) * follow;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    constrainToDock(p);

    if (atSellDock(p)) enterSellShop();
    else if (atShopDock(p) && typeof enterRodShop === "function") enterRodShop();
    else if (atFishingDock(p)) say("Fishing pier: tap CAST or press Space/F.");
    else say("Walk to the left seller, right rod shop, or upper fishing pier.");
  };

  updateFishing = function updateFishingRestored(dt) {
    if (state.castPower) {
      state.castPower.power += state.castPower.dir * dt * 1.65;
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
      cast.vy += 520 * dt;
      if (cast.hookY >= cast.waterY) {
        cast.hookY = cast.waterY;
        cast.phase = "waiting";
        cast.biteIn = rand(0.68, 1.95) / (1 + rod.id * 0.065);
        makeRipple(cast.hookX, cast.hookY);
        say("Bobber landed. Wait for a bite...");
      }
    } else if (cast.phase === "waiting") {
      cast.biteIn -= dt;
      cast.hookY += Math.sin(performance.now() / 150) * 0.16;
      if (cast.biteIn <= 0) {
        cast.phase = "bite";
        cast.reel = 0.38;
        cast.fish = rollFish();
        cast.shake = rand(0.85, 1.65);
        say(`${cast.fish.rarity.toUpperCase()} BITE! Tap the screen or REEL fast!`);
      }
    } else if (cast.phase === "bite") {
      const pain = {
        Common: 0.035,
        Rare: 0.07,
        Epic: 0.105,
        Legendary: 0.15,
        Mythical: 0.22,
        Extinct: 0.29,
        Gargantuan: 0.36,
        Abyss: 0.46,
        "???": 0.62
      }[cast.fish.rarity] || 0.08;
      cast.reel -= (0.13 + pain + cast.fish.value / 3200 - rod.control * 0.035) * dt;
      cast.hookX += Math.sin(performance.now() / 84) * cast.shake * 0.24;
      if (cast.reel <= 0) {
        state.cast = null;
        say("The fish broke loose. Better rods help with rarer fish.");
      }
    }
  };

  reel = function reelRestored() {
    if (!state.cast) return castLine();
    if (state.cast.phase !== "bite") return;
    const rod = currentRod();
    state.cast.reel += 0.17 + rod.control * 0.05;
    makeRipple(state.cast.hookX, state.cast.hookY);
    if (state.cast.reel >= 1) catchFish(state.cast.fish);
  };

  const previousCastLine = castLine;
  castLine = function castLineRestored() {
    if (state.mode === "sell") return;
    if (state.mode === "rodshop") return;
    if (state.mode === "dock") {
      if (!atFishingDock(state.player)) return say("Walk onto the upper FISHING PIER first.");
      enterFishing();
      state.castPower = { power: 0, dir: 1 };
      say("CAST FOR LUCK: tap the screen near the gold end.");
      return;
    }
    if (state.mode !== "fishing") return previousCastLine();
    if (state.bag.length >= state.bagLimit) return say("Your bag is full. Go sell your fish.");
    if (state.castPower) {
      const rod = currentRod();
      const power = clamp(state.castPower.power, 0.12, 1);
      state.castPower = null;
      state.cast = {
        phase: "fly",
        timer: 0,
        hookX: 184,
        hookY: 300,
        vx: 190 + power * 300 + rod.id * 18,
        vy: -135 - power * 155 - rod.id * 6,
        waterY: 345,
        reel: 0,
        fish: null
      };
      say(power > 0.82 ? "Huge cast! Watch the bobber." : power > 0.52 ? "Good cast!" : "Short cast, but it still counts.");
      return;
    }
    if (state.cast) return reel();
    state.castPower = { power: 0, dir: 1 };
    say("CAST FOR LUCK: tap the screen near the gold end.");
  };

  drawGameButtons = function drawButtonsNoDive() {
    const y = 500;
    if (state.mode === "sell") {
      buttonZones.push({ x: 582, y: 360, w: 74, h: 42, action: sellFish });
      buttonZones.push({ x: 714, y: 360, w: 74, h: 42, action: exitSellShop });
      return;
    }
    if (state.mode === "rodshop") {
      drawUiButton(18, y, 104, 42, "BACK", exitRodShop);
      return;
    }
    drawUiButton(18, y, 104, 42, "HOME", goHome);
    drawUiButton(132, y, 108, 42, "RESET", resetGame);
    drawUiButton(604, y, 94, 42, state.cast && state.cast.phase === "bite" ? "REEL!" : "CAST", castLine);
    drawUiButton(710, y, 108, 42, "SELL", sellFish);
    drawUiButton(830, y, 108, 42, "RODS", upgradeRod);
  };

  function platform(x, y, w, h, fill) {
    rounded(x, y, w, h, 10, fill || "#bd7b3a", "#4a2a12", 5);
    ctx.strokeStyle = "rgba(75,42,18,.55)";
    ctx.lineWidth = 3;
    for (let i = x + 22; i < x + w; i += 48) {
      ctx.beginPath();
      ctx.moveTo(i, y + 5);
      ctx.lineTo(i - 6, y + h - 5);
      ctx.stroke();
    }
    for (let j = y + 22; j < y + h; j += 32) {
      ctx.beginPath();
      ctx.moveTo(x + 8, j);
      ctx.lineTo(x + w - 8, j - 4);
      ctx.stroke();
    }
  }

  function hut(x, y, label, accent) {
    ctx.save();
    rounded(x, y, 178, 116, 12, "#9f602e", "#321b0b", 5);
    ctx.fillStyle = accent;
    ctx.beginPath();
    ctx.moveTo(x - 16, y + 24);
    ctx.lineTo(x + 89, y - 42);
    ctx.lineTo(x + 194, y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#321b0b";
    ctx.lineWidth = 5;
    ctx.stroke();
    rounded(x + 54, y + 48, 70, 68, 8, "#543019", "#321b0b", 4);
    rounded(x + 30, y + 16, 118, 32, 8, "#ffe36e", "#321b0b", 3);
    ctx.fillStyle = "#321b0b";
    ctx.font = "900 15px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(label, x + 89, y + 38);
    ctx.restore();
  }

  drawDockView = function drawSideDockView() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#76e7ff");
    sky.addColorStop(0.44, "#22aada");
    sky.addColorStop(0.45, "#0875b7");
    sky.addColorStop(1, "#052a63");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "rgba(255,255,255,.36)";
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.ellipse(80 + i * 135, 98 + Math.sin(performance.now() / 900 + i) * 8, 54, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(255,255,255,.2)";
    for (let i = 0; i < 14; i++) {
      ctx.beginPath();
      ctx.ellipse(26 + i * 76, 454 + Math.sin(performance.now() / 520 + i) * 10, 44, 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    platform(54, 380, 852, 58, "#c98a49");
    platform(346, 298, 268, 48, "#d49a58");
    for (let x = 84; x <= 860; x += 96) {
      rounded(x, 428, 18, 74, 6, "#7a461f", "#321b0b", 3);
    }
    rounded(456, 336, 36, 46, 8, "#8a5429", "#321b0b", 4);

    hut(80, 268, "SELL FISH", "#c93c3c");
    hut(704, 268, "ROD SHOP", "#39c9ff");
    rounded(384, 238, 192, 52, 12, "#ffe36e", "#321b0b", 4);
    ctx.fillStyle = "#321b0b";
    ctx.font = "900 22px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText("FISHING PIER", 480, 272);

    drawCirclePlayer();
  };

  function drawHero(x, y, scale, holdingRod) {
    ensurePlayerAnimationState();
    const facing = state.player && state.player.facing === "left" ? -1 : 1;
    const walking = state.player && state.player.pose === "walk";
    const t = state.walkFrame || 0;
    const step = walking ? Math.sin(t) : Math.sin(t) * 0.18;
    const bob = walking ? Math.abs(Math.sin(t)) * 3 : Math.sin(t * 1.8) * 1.2;

    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(scale * facing, scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle = "rgba(0,22,34,.28)";
    ctx.beginPath();
    ctx.ellipse(0, 54 + bob, 32, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(-8, 18);
    ctx.lineTo(-22, 48 - step * 8);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 18);
    ctx.lineTo(22, 48 + step * 8);
    ctx.stroke();

    ctx.fillStyle = "#101b25";
    ctx.beginPath();
    ctx.roundRect(-22, -12, 44, 42, 16);
    ctx.fill();
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 5;
    ctx.stroke();

    ctx.fillStyle = "#183b52";
    ctx.beginPath();
    ctx.moveTo(-22, 4);
    ctx.quadraticCurveTo(0, 34, 22, 4);
    ctx.lineTo(18, 34);
    ctx.quadraticCurveTo(0, 48, -18, 34);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-18, -4);
    ctx.lineTo(-38, 12 + step * 5);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(18, -4);
    ctx.lineTo(38, 12 - step * 5);
    ctx.stroke();

    if (holdingRod) {
      ctx.strokeStyle = "#6b3d18";
      ctx.lineWidth = 5;
      ctx.beginPath();
      ctx.moveTo(30, -4);
      ctx.quadraticCurveTo(92, -72, 168, -44);
      ctx.stroke();
      ctx.strokeStyle = "rgba(236,255,251,.72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(168, -44);
      ctx.lineTo(198, 36);
      ctx.stroke();
    }

    ctx.fillStyle = "#f4fbff";
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, -36, 25, 27, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#071923";
    ctx.beginPath();
    ctx.ellipse(-8, -38, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(8, -38, 4, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f4fbff";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-17, -58);
    ctx.quadraticCurveTo(-28, -72, -44, -76);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(17, -58);
    ctx.quadraticCurveTo(28, -72, 44, -76);
    ctx.stroke();
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-17, -58);
    ctx.quadraticCurveTo(-28, -72, -44, -76);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(17, -58);
    ctx.quadraticCurveTo(28, -72, 44, -76);
    ctx.stroke();

    ctx.fillStyle = "#54f5df";
    ctx.beginPath();
    ctx.moveTo(-20, -12);
    ctx.quadraticCurveTo(-48, 10, -74, 0);
    ctx.quadraticCurveTo(-48, 28, -20, 15);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 3;
    ctx.stroke();

    ctx.restore();
  }

  drawCirclePlayer = function drawHollowInspiredPlayer() {
    if (!state.player) return;
    drawHero(state.player.x, state.player.y, PLAYER_SCALE, false);
  };

  drawFisherCircle = function drawHollowInspiredFisher() {
    if (!state.player) return;
    const oldFacing = state.player.facing;
    state.player.facing = "right";
    drawHero(142, 285, 0.78, true);
    state.player.facing = oldFacing;
  };

  drawFishingView = function drawFishingViewFixed() {
    const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
    sky.addColorStop(0, "#7eeaff");
    sky.addColorStop(0.46, "#36aee0");
    sky.addColorStop(0.47, "#0f78b8");
    sky.addColorStop(1, "#06427c");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    platform(0, 300, 230, 92, "#c98a49");
    ctx.fillStyle = "rgba(255,255,255,.2)";
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(320 + i * 95, 380 + Math.sin(performance.now() / 400 + i) * 12, 48, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    drawFisherCircle();
    drawFishSilhouettes();
    drawFishingLine();
    drawRipples();
    if (typeof drawPowerMeter === "function") drawPowerMeter();
  };

  say("Minigames fixed. The dock is now 2D side-view with animated facing.");
})();
