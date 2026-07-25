const polishBaseUpdate = update;
const polishBaseDrawHud = drawGameHud;
const polishBaseDrawButtons = drawGameButtons;

function openHomeMenu() {
  state.mode = "menu";
  state.menuPage = "home";
  state.player.vx = 0;
  state.player.vy = 0;
  say("Welcome to Hyper Fishies.");
}

function playFromMenu() {
  state.mode = "dock";
  state.menuPage = "";
  state.player.x = 480;
  state.player.y = 340;
  say("Walk to FISH, SELL, or SHOP. Progress saves automatically.");
}

function creditsFromMenu() {
  state.menuPage = "credits";
  say("Credits opened.");
}

function shopFromMenu() {
  state.menuPage = "";
  enterRodShop();
}

update = function updateWithHomeMenu(dt) {
  if (state.mode === "menu") {
    state.ripples = state.ripples.filter(r => (r.life -= dt) > 0);
    return;
  }
  polishBaseUpdate(dt);
};

draw = function drawWithHomeMenu() {
  buttonZones.length = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.mode === "menu") drawHomeScreen();
  else if (state.mode === "dock") drawDockView();
  else if (state.mode === "fishing") drawFishingView();
  else if (state.mode === "rodshop") drawRodShopView();
  else drawSellShopView();
  drawGameHud();
  drawGameButtons();
  drawSavingIcon();
};

drawGameHud = function drawGameHudPolished() {
  if (state.mode === "menu" || state.mode === "sell" || state.mode === "rodshop") return;
  polishBaseDrawHud();
};

drawGameButtons = function drawGameButtonsPolished() {
  if (state.mode === "menu") return;
  polishBaseDrawButtons();
};

drawTopWater = function drawTopWaterPolished() {
  const water = ctx.createLinearGradient(0, 0, 0, canvas.height);
  water.addColorStop(0, "#74e6ff");
  water.addColorStop(0.38, "#1ca8dc");
  water.addColorStop(0.72, "#0871b1");
  water.addColorStop(1, "#063b76");
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.save();
  ctx.globalAlpha = 0.22;
  for (let i = 0; i < 8; i++) {
    const x = -120 + i * 155;
    const ray = ctx.createLinearGradient(x, 0, x + 170, 560);
    ray.addColorStop(0, "rgba(255,255,255,.55)");
    ray.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = ray;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 82, 0);
    ctx.lineTo(x + 230, 560);
    ctx.lineTo(x - 60, 560);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  for (let i = 0; i < 28; i++) {
    const bx = (i * 83 + performance.now() / (28 + i)) % 1010 - 40;
    const by = 40 + ((i * 47 + performance.now() / (18 + i)) % 500);
    ctx.globalAlpha = 0.12 + (i % 4) * 0.05;
    ctx.strokeStyle = "#ecfffb";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bx, by, 4 + (i % 5) * 2, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();

  drawSeaPlants();
};

function drawSeaPlants() {
  ctx.save();
  for (let i = 0; i < 13; i++) {
    const baseX = i * 84 - 20;
    const h = 44 + (i % 5) * 18;
    ctx.strokeStyle = i % 2 ? "rgba(17,148,100,.38)" : "rgba(45,211,139,.34)";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(baseX, 560);
    ctx.quadraticCurveTo(baseX + Math.sin(performance.now() / 700 + i) * 18, 560 - h * 0.45, baseX + 8, 560 - h);
    ctx.stroke();
  }
  ctx.restore();
}

drawIslandAndDock = function drawIslandAndDockPolished() {
  ctx.save();
  rounded(225, 82, 510, 402, 40, "#f2d28a", "#8b6e39", 6);
  rounded(246, 102, 468, 356, 20, "#c17b37", "#62370f", 7);

  const plank = ctx.createLinearGradient(246, 102, 714, 458);
  plank.addColorStop(0, "rgba(255,214,133,.28)");
  plank.addColorStop(1, "rgba(65,32,9,.24)");
  ctx.fillStyle = plank;
  ctx.fillRect(252, 108, 456, 344);

  ctx.strokeStyle = "rgba(65,32,9,.62)";
  ctx.lineWidth = 5;
  for (let x = 274; x < 704; x += 44) {
    ctx.beginPath();
    ctx.moveTo(x, 108);
    ctx.lineTo(x + 9, 452);
    ctx.stroke();
  }
  for (let y = 142; y < 452; y += 58) {
    ctx.beginPath();
    ctx.moveTo(252, y);
    ctx.lineTo(708, y - 5);
    ctx.stroke();
  }

  rounded(410, 42, 140, 112, 16, "#bb7432", "#62370f", 7);
  rounded(452, 104, 56, 52, 8, "#bb7432", "#62370f", 5);
  rounded(66, 96, 220, 108, 18, "#bb7432", "#62370f", 7);
  rounded(66, 368, 220, 108, 18, "#bb7432", "#62370f", 7);

  rounded(392, 232, 176, 102, 24, "rgba(255,238,140,.28)", "rgba(255,255,255,.6)", 3);
  drawSign(88, 122, "ROD SHOP");
  drawSign(88, 390, "SELL FISH");
  drawSign(423, 70, "FISH");
  ctx.restore();
};

drawFishingView = function drawFishingViewPolished() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#91efff");
  sky.addColorStop(0.36, "#39b9e8");
  sky.addColorStop(0.46, "#1682bf");
  sky.addColorStop(1, "#042e66");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,.18)";
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.ellipse(318 + i * 92, 378 + Math.sin(performance.now() / 480 + i) * 9, 52, 9, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  rounded(0, 298, 242, 100, 0, "#bf7835", "#62370f", 6);
  ctx.strokeStyle = "rgba(65,32,9,.65)";
  ctx.lineWidth = 6;
  for (let x = 12; x < 236; x += 42) {
    ctx.beginPath();
    ctx.moveTo(x, 300);
    ctx.lineTo(x + 8, 395);
    ctx.stroke();
  }

  drawFisherCircle();
  drawFishSilhouettes();
  drawFishingLine();
  drawFightMeter();
  drawRipples();
};

function drawHomeScreen() {
  drawTopWater();
  drawMenuFish(734, 194, 54, "#ffd45f");
  drawMenuFish(214, 126, 32, "#ff7c87");
  drawMenuFish(780, 402, 36, "#8dffda");

  ctx.save();
  rounded(190, 86, 580, 388, 0, "rgba(235,249,238,.92)", "#09283d", 5);
  ctx.fillStyle = "#09283d";
  ctx.font = "900 18px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("If you see this icon in the bottom right corner, do not leave, it's saving your game.", 214, 100);
  drawSavingIcon(476, 82, true);

  drawHandTitle(480, 212);
  drawMenuButton(382, 302, 196, 46, "PLAY", playFromMenu);
  drawMenuButton(382, 360, 196, 46, "CREDITS", creditsFromMenu);
  drawMenuButton(382, 418, 196, 46, "SHOP", shopFromMenu);

  if (state.menuPage === "credits") drawCreditsPanel();
  ctx.restore();
}

function drawHandTitle(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#09283d";
  ctx.fillStyle = "rgba(108,220,255,.28)";
  ctx.lineWidth = 3.5;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const letters = [
    { ch: "H", x: -190, y: -34, r: -0.03 },
    { ch: "Y", x: -116, y: -34, r: 0.04 },
    { ch: "P", x: -43, y: -34, r: -0.02 },
    { ch: "E", x: 35, y: -34, r: 0.03 },
    { ch: "R", x: 108, y: -34, r: -0.04 }
  ];
  ctx.font = "900 72px Trebuchet MS";
  ctx.textAlign = "center";
  for (const letter of letters) {
    ctx.save();
    ctx.translate(letter.x, letter.y);
    ctx.rotate(letter.r);
    ctx.strokeText(letter.ch, 0, 0);
    ctx.fillText(letter.ch, 0, 0);
    ctx.restore();
  }
  ctx.font = "44px Comic Sans MS, Trebuchet MS, cursive";
  ctx.fillStyle = "transparent";
  ctx.strokeText("fishies", 0, 62);
  ctx.fillStyle = "#09283d";
  ctx.fillText("fishies", 0, 62);
  drawMenuFish(202, -62, 36, "#f7d46c");
  ctx.restore();
}

function drawMenuButton(x, y, w, h, label, action) {
  buttonZones.push({ x, y, w, h, action });
  ctx.save();
  ctx.strokeStyle = "#09283d";
  ctx.fillStyle = "#e9f8f4";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(x + 22, y);
  ctx.lineTo(x + w - 22, y);
  ctx.lineTo(x + w, y + h / 2);
  ctx.lineTo(x + w - 22, y + h);
  ctx.lineTo(x + 22, y + h);
  ctx.lineTo(x, y + h / 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#09283d";
  ctx.font = "900 27px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(label, x + w / 2, y + 31);
  ctx.restore();
}

function drawCreditsPanel() {
  rounded(608, 300, 136, 112, 12, "rgba(255,240,185,.96)", "#09283d", 4);
  ctx.fillStyle = "#09283d";
  ctx.font = "900 16px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("CREDITS", 676, 326);
  ctx.font = "800 13px Trebuchet MS";
  ctx.fillText("David", 676, 350);
  ctx.fillText("Lucas Tan", 676, 370);
  ctx.fillText("Valerius Koh", 676, 390);
}

function drawMenuFish(x, y, size, color) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.strokeStyle = "#09283d";
  ctx.lineWidth = Math.max(2, size / 12);
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.48, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + size * 0.78, y);
  ctx.lineTo(x + size * 1.42, y - size * 0.45);
  ctx.lineTo(x + size * 1.24, y);
  ctx.lineTo(x + size * 1.42, y + size * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#09283d";
  ctx.beginPath();
  ctx.arc(x - size * 0.42, y - size * 0.08, size * 0.1, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSavingIcon(x = 910, y = 528, force = false) {
  if (!force && state.mode === "menu") return;
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = "rgba(236,255,251,.92)";
  ctx.strokeStyle = "#09283d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 19, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  drawMenuFish(-4, 0, 10, "#6bd3ff");
  ctx.fillStyle = "#09283d";
  ctx.font = "900 12px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("G", 7, -7);
  ctx.restore();
}

updateFishing = function updateFishingFischStyle(dt) {
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
      cast.biteIn = rand(0.75, 2.05) / (1 + rod.id * 0.07);
      makeRipple(cast.hookX, cast.hookY);
      say("Bobber landed. Wait for a bite...");
    }
  } else if (cast.phase === "waiting") {
    cast.biteIn -= dt;
    cast.hookY += Math.sin(performance.now() / 160) * 0.15;
    if (cast.biteIn <= 0) {
      cast.phase = "bite";
      cast.reel = 0.28;
      cast.fish = rollFish();
      cast.marker = 0.5;
      cast.markerVelocity = rand(0.42, 0.72) * (Math.random() < 0.5 ? -1 : 1);
      cast.target = rand(0.18, 0.68);
      cast.targetWidth = Math.max(0.16, 0.34 - cast.fish.value / 1600);
      say("BITE! Tap when the marker is inside the green zone.");
    }
  } else if (cast.phase === "bite") {
    cast.marker += cast.markerVelocity * dt;
    if (cast.marker < 0.03 || cast.marker > 0.97) {
      cast.marker = clamp(cast.marker, 0.03, 0.97);
      cast.markerVelocity *= -1;
    }
    cast.target += Math.sin(performance.now() / 520) * 0.0018;
    cast.target = clamp(cast.target, 0.08, 0.86 - cast.targetWidth);
    const drain = 0.06 + cast.fish.value / 3600 - rod.control * 0.012;
    cast.reel -= drain * dt;
    if (cast.reel <= 0) {
      state.cast = null;
      say("The fish escaped. Better rods make the fight easier.");
    }
  }
};

reel = function reelFischStyle() {
  if (!state.cast) return castLine();
  if (state.cast.phase !== "bite") return;
  const cast = state.cast;
  const rod = currentRod();
  const hit = cast.marker >= cast.target && cast.marker <= cast.target + cast.targetWidth;
  cast.reel += hit ? 0.18 + rod.control * 0.055 : -0.09;
  burst(cast.hookX, cast.hookY, hit ? "#8ff06d" : "#ff5d68", hit ? 8 : 5);
  say(hit ? "Good reel! Keep it in the green." : "Missed! Time your reel taps.");
  if (cast.reel >= 1) catchFish(cast.fish);
};

function drawFightMeter() {
  if (!state.cast || state.cast.phase !== "bite") return;
  const c = state.cast;
  const x = 292, y = 470, w = 380, h = 22;
  rounded(x, y, w, h, 12, "rgba(3,32,61,.72)", "#ecfffb", 3);
  ctx.fillStyle = "#53f08b";
  ctx.fillRect(x + 8 + c.target * (w - 16), y + 5, c.targetWidth * (w - 16), h - 10);
  ctx.fillStyle = "#ffe36e";
  ctx.beginPath();
  ctx.arc(x + 8 + c.marker * (w - 16), y + h / 2, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#05263d";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.fillStyle = rarityColors[c.fish.rarity];
  ctx.font = "900 15px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(`${c.fish.rarity.toUpperCase()} FISH FIGHT`, x + w / 2, y - 10);
}

openHomeMenu();
