function playFromMenu() {
  state.mode = "dock";
  state.menuPage = "";
  state.player.x = 480;
  state.player.y = 340;
  say("Walk to FISH or SELL. Progress saves automatically.");
}

updateDock = function updateDockWithoutShop(dt) {
  const p = state.player;
  let ax = 0, ay = 0;
  if (keys.has("arrowleft") || keys.has("a")) ax -= 1;
  if (keys.has("arrowright") || keys.has("d")) ax += 1;
  if (keys.has("arrowup") || keys.has("w")) ay -= 1;
  if (keys.has("arrowdown") || keys.has("s")) ay += 1;
  ax += joy.x;
  ay += joy.y;
  const mag = Math.hypot(ax, ay) || 1;
  p.vx += (ax / mag) * 520 * dt;
  p.vy += (ay / mag) * 520 * dt;
  p.vx *= Math.pow(0.04, dt);
  p.vy *= Math.pow(0.04, dt);
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  constrainToDock(p);
  if (atSellDock(p)) enterSellShop();
  else if (atShopDock(p)) say("Rod shop is closed for now. Go fish or sell your catch.");
  else if (atFishingDock(p)) say("Fishing dock: tap CAST or press Space/F.");
};

drawIslandAndDock = function drawIslandAndDockNoShop() {
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
  rounded(66, 96, 220, 108, 18, "#8d5b34", "#62370f", 7);
  rounded(66, 368, 220, 108, 18, "#bb7432", "#62370f", 7);

  rounded(392, 232, 176, 102, 24, "rgba(255,238,140,.28)", "rgba(255,255,255,.6)", 3);
  drawSign(91, 122, "CLOSED");
  drawSign(88, 390, "SELL FISH");
  drawSign(423, 70, "FISH");
  ctx.restore();
};

drawHomeScreen = function drawHomeScreenNoShop() {
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
  drawMenuButton(382, 320, 196, 46, "PLAY", playFromMenu);
  drawMenuButton(382, 382, 196, 46, "CREDITS", creditsFromMenu);

  if (state.menuPage === "credits") drawCreditsPanel();
  ctx.restore();
};

drawGameButtons = function drawGameButtonsNoShop() {
  const y = 500;
  if (state.mode === "menu") return;
  if (state.mode === "sell") {
    buttonZones.push({ x: 582, y: 360, w: 84, h: 46, action: sellFish });
    buttonZones.push({ x: 714, y: 360, w: 84, h: 46, action: exitSellShop });
    return;
  }
  drawUiButton(18, y, 104, 42, "HOME", goHome);
  drawUiButton(132, y, 108, 42, "RESET", resetGame);
  drawUiButton(650, y, 112, 42, state.cast && state.cast.phase === "bite" ? "REEL!" : "CAST", castLine);
  drawUiButton(778, y, 120, 42, "SELL", sellFish);
};

if (state.mode === "rodshop") playFromMenu();
