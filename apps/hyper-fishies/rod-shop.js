const rodCatalog = [
  { id: 1, name: "Driftwood Rod", price: 0, luck: 1.00, control: 1.00, color: "#8b5a2b", glow: "#f3c47b", note: "Free starter rod. Honest, bendy, slightly embarrassing." },
  { id: 2, name: "Coral Rod", price: 180, luck: 1.18, control: 1.08, color: "#ff7f73", glow: "#ffd2a7", note: "Coral grip. Better luck with unusual fish." },
  { id: 3, name: "Tide Rod", price: 420, luck: 1.38, control: 1.17, color: "#4ed8ff", glow: "#d9fbff", note: "Smooth casts. Rare fish notice this one." },
  { id: 4, name: "Storm Rod", price: 900, luck: 1.68, control: 1.28, color: "#8c77ff", glow: "#f0dcff", note: "Lightning-fast reel. Epic fish start showing up more." },
  { id: 5, name: "Abyss Rod", price: 1600, luck: 2.05, control: 1.42, color: "#192a68", glow: "#88ffea", note: "Deep-sea magic. Legendary fish become less impossible." }
];

function normalizeRodProgress() {
  if (!state || !state.progress) return;
  if (!Array.isArray(state.progress.ownedRods)) state.progress.ownedRods = [state.progress.rod || 1];
  if (!state.progress.ownedRods.includes(1)) state.progress.ownedRods.push(1);
  if (!state.progress.currentRod) state.progress.currentRod = state.progress.rod || 1;
  if (!state.progress.ownedRods.includes(state.progress.currentRod)) state.progress.currentRod = 1;
  state.progress.rod = state.progress.currentRod;
  state.bagLimit = 5 + state.progress.currentRod;
}

function currentRod() {
  normalizeRodProgress();
  return rodCatalog.find(rod => rod.id === state.progress.currentRod) || rodCatalog[0];
}

function enterRodShop() {
  normalizeRodProgress();
  state.mode = "rodshop";
  state.player.vx = 0;
  state.player.vy = 0;
  say("Welcome to Hooker's Lucky Rods. Pick a rod, kid. The ocean likes style.");
}

function exitRodShop() {
  normalizeRodProgress();
  state.mode = "dock";
  state.player.x = 300;
  state.player.y = 152;
  state.player.vx = 0;
  state.player.vy = 0;
  say("Back on the dock. Auto-saved.");
  saveGame();
}

function buyOrEquipRod(rodId) {
  normalizeRodProgress();
  const rod = rodCatalog.find(item => item.id === rodId);
  if (!rod) return;
  const owned = state.progress.ownedRods.includes(rod.id);
  if (owned) {
    state.progress.currentRod = rod.id;
    state.progress.rod = rod.id;
    state.bagLimit = 5 + rod.id;
    saveGame();
    say(`${rod.name} equipped. Luck x${rod.luck.toFixed(2)}. Auto-saved.`);
    return;
  }
  if (state.progress.coins < rod.price) {
    say(`Need ${rod.price} coins for ${rod.name}. Sell more fish first.`);
    return;
  }
  state.progress.coins -= rod.price;
  state.progress.ownedRods.push(rod.id);
  state.progress.currentRod = rod.id;
  state.progress.rod = rod.id;
  state.bagLimit = 5 + rod.id;
  burst(700, 170 + rod.id * 62, rod.glow, 20);
  saveGame();
  say(`Bought and equipped ${rod.name}! Better luck unlocked.`);
}

updateDock = function updateDockWithRodShop(dt) {
  normalizeRodProgress();
  const p = state.player;
  let ax = 0, ay = 0;
  if (keys.has("arrowleft") || keys.has("a")) ax -= 1;
  if (keys.has("arrowright") || keys.has("d")) ax += 1;
  if (keys.has("arrowup") || keys.has("w")) ay -= 1;
  if (keys.has("arrowdown") || keys.has("s")) ay += 1;
  ax += joy.x; ay += joy.y;
  const mag = Math.hypot(ax, ay) || 1;
  p.vx += (ax / mag) * 520 * dt;
  p.vy += (ay / mag) * 520 * dt;
  p.vx *= Math.pow(0.04, dt);
  p.vy *= Math.pow(0.04, dt);
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  constrainToDock(p);
  if (atSellDock(p)) enterSellShop();
  else if (atShopDock(p)) enterRodShop();
  else if (atFishingDock(p)) say("Fishing dock: tap CAST or press Space/F.");
};

rollFish = function rollFishWithRodLuck() {
  const rod = currentRod();
  const weighted = fishTypes.map(fish => {
    let weight = rarityWeights[fish.rarity];
    if (fish.rarity === "Unusual") weight *= 1 + (rod.luck - 1) * 0.65;
    if (fish.rarity === "Rare") weight *= 1 + (rod.luck - 1) * 1.05;
    if (fish.rarity === "Epic") weight *= 1 + (rod.luck - 1) * 1.75;
    if (fish.rarity === "Legendary") weight *= 1 + (rod.luck - 1) * 2.55;
    if (fish.rarity === "Common") weight *= Math.max(0.58, 1 - (rod.luck - 1) * 0.34);
    return { fish, weight: Math.max(1, weight) };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = rand(0, total);
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.fish;
  }
  return fishTypes[0];
};

updateFishing = function updateFishingHarder(dt) {
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
      say("Bobber is in the water. Wait for a bite...");
    }
  } else if (cast.phase === "waiting") {
    cast.biteIn -= dt;
    cast.hookY += Math.sin(performance.now() / 160) * 0.15;
    if (cast.biteIn <= 0) {
      cast.phase = "bite";
      cast.reel = 0.38;
      cast.fish = rollFish();
      cast.shake = rand(0.8, 1.4);
      say("BITE! Tap REEL fast. Stronger fish fight harder now!");
    }
  } else if (cast.phase === "bite") {
    const rarityPain = { Common: 0.03, Unusual: 0.05, Rare: 0.08, Epic: 0.115, Legendary: 0.16 }[cast.fish.rarity] || 0.05;
    cast.reel -= (0.16 + rarityPain + cast.fish.value / 2400 - rod.control * 0.025) * dt;
    cast.hookX += Math.sin(performance.now() / 95) * cast.shake * 0.22;
    if (cast.reel <= 0) {
      state.cast = null;
      say("The fish broke loose. Better rod control helps with hard catches.");
    }
  }
};

reel = function reelHarder() {
  if (!state.cast) return castLine();
  if (state.cast.phase !== "bite") return;
  const rod = currentRod();
  state.cast.reel += 0.17 + rod.control * 0.045;
  makeRipple(state.cast.hookX, state.cast.hookY);
  if (state.cast.reel >= 1) catchFish(state.cast.fish);
};

upgradeRod = function openRodShopFromButton() {
  if (state.mode === "rodshop") return exitRodShop();
  if (state.mode === "sell") return exitSellShop();
  if (state.mode !== "dock" || !atShopDock(state.player)) return say("Walk onto SHOP first.");
  enterRodShop();
};

draw = function drawWithRodShop() {
  buttonZones.length = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.mode === "dock") drawDockView();
  else if (state.mode === "fishing") drawFishingView();
  else if (state.mode === "rodshop") drawRodShopView();
  else drawSellShopView();
  drawGameHud();
  drawGameButtons();
};

drawGameButtons = function drawGameButtonsWithRodShop() {
  const y = 500;
  if (state.mode === "sell") {
    buttonZones.push({ x: 582, y: 360, w: 84, h: 46, action: sellFish });
    buttonZones.push({ x: 714, y: 360, w: 84, h: 46, action: exitSellShop });
    return;
  }
  if (state.mode === "rodshop") {
    drawUiButton(20, y, 104, 42, "BACK", exitRodShop);
    return;
  }
  drawUiButton(18, y, 104, 42, "HOME", goHome);
  drawUiButton(132, y, 108, 42, "RESET", resetGame);
  drawUiButton(604, y, 94, 42, state.cast && state.cast.phase === "bite" ? "REEL!" : "CAST", castLine);
  drawUiButton(710, y, 108, 42, "SELL", sellFish);
  drawUiButton(830, y, 108, 42, "RODS", upgradeRod);
};

drawGameHud = function drawGameHudWithRodShop() {
  if (state.mode === "sell" || state.mode === "rodshop") return;
  const rod = currentRod();
  rounded(12, 8, 936, 46, 12, "rgba(2,35,62,.62)", "rgba(236,255,251,.65)", 2);
  ctx.fillStyle = "#ecfffb";
  ctx.font = "900 16px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText(`COINS ${state.progress.coins}`, 28, 37);
  ctx.fillText(`BAG ${state.bag.length}/${state.bagLimit}`, 140, 37);
  ctx.fillText(`AREA ${state.mode.toUpperCase()}`, 250, 37);
  ctx.fillText(`${rod.name.toUpperCase()} LUCK x${rod.luck.toFixed(2)}`, 370, 37);
  ctx.fillStyle = "#ffe36e";
  ctx.fillText(state.message, 670, 37);
};

function drawRodShopView() {
  drawTopWater();
  const shop = ctx.createLinearGradient(0, 50, 0, 530);
  shop.addColorStop(0, "#f7c56e");
  shop.addColorStop(0.56, "#a6652f");
  shop.addColorStop(1, "#5b311a");
  rounded(58, 58, 844, 424, 24, shop, "#251205", 7);
  rounded(70, 382, 820, 92, 14, "#71401e", "#231006", 6);
  drawRodShopKeeper(245, 238);
  drawRodShopSpeech(390, 92);
  drawRodRack(420, 224);
}

function drawRodShopKeeper(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.fillStyle = "#ffd982";
  ctx.beginPath();
  ctx.arc(8, 2, 44, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(-8, -6, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(21, -4, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#111";
  sketchLine([[-9, 18], [8, 28], [28, 14]]);
  ctx.fillStyle = "#6bd3ff";
  sketchClosed([[-38, 54], [54, 54], [74, 150], [-58, 150]]);
  ctx.fillStyle = "#ff665b";
  sketchClosed([[-58, 70], [-140, 36], [-150, 74], [-74, 104]]);
  sketchClosed([[70, 70], [148, 26], [162, 62], [86, 108]]);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-154, 36);
  ctx.bezierCurveTo(-180, -38, -116, -96, -30, -72);
  ctx.bezierCurveTo(62, -44, 120, -64, 172, -114);
  ctx.stroke();
  ctx.lineWidth = 4;
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(-116 + i * 28, -55 + Math.sin(i) * 18, 3, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRodShopSpeech(x, y) {
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.fillStyle = "#fff0b9";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + 450, y + 4);
  ctx.lineTo(x + 438, y + 96);
  ctx.lineTo(x + 20, y + 106);
  ctx.lineTo(x - 42, y + 82);
  ctx.lineTo(x + 10, y + 62);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = "900 22px Trebuchet MS";
  ctx.textAlign = "left";
  wrapText("Hooker's Lucky Rods! Better rods look flashier, boost luck, and help with the tougher reel fight.", x + 24, y + 34, 390, 27);
  ctx.restore();
}

function drawRodRack(x, y) {
  normalizeRodProgress();
  ctx.save();
  ctx.font = "900 16px Trebuchet MS";
  ctx.textAlign = "left";
  rodCatalog.forEach((rod, index) => {
    const yPos = y + index * 48;
    const owned = state.progress.ownedRods.includes(rod.id);
    const equipped = state.progress.currentRod === rod.id;
    rounded(x, yPos, 432, 38, 10, equipped ? "#d9fff4" : owned ? "#b9efff" : "#ffe59a", "#111", 3);
    drawTinyRod(x + 22, yPos + 22, rod);
    ctx.fillStyle = "#111";
    ctx.fillText(rod.name.toUpperCase(), x + 58, yPos + 24);
    ctx.fillStyle = "#0b4e4d";
    ctx.fillText(`LUCK x${rod.luck.toFixed(2)}`, x + 214, yPos + 24);
    const label = equipped ? "EQUIPPED" : owned ? "EQUIP" : `${rod.price} COINS`;
    ctx.fillStyle = equipped ? "#0b6f34" : "#111";
    ctx.textAlign = "right";
    ctx.fillText(label, x + 412, yPos + 24);
    ctx.textAlign = "left";
    buttonZones.push({ x, y: yPos, w: 432, h: 38, action: () => buyOrEquipRod(rod.id) });
  });
  ctx.fillStyle = "#ffe36e";
  ctx.font = "900 18px Trebuchet MS";
  ctx.fillText(`COINS ${state.progress.coins}`, x, y + 264);
  ctx.restore();
}

function drawTinyRod(x, y, rod) {
  ctx.save();
  ctx.strokeStyle = rod.color;
  ctx.lineWidth = 5;
  ctx.shadowColor = rod.glow;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  ctx.moveTo(x - 10, y + 8);
  ctx.quadraticCurveTo(x + 22, y - 18, x + 42, y - 12);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.fillStyle = rod.glow;
  ctx.beginPath();
  ctx.arc(x + 43, y - 12, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const oldDrawFisherCircle = drawFisherCircle;
drawFisherCircle = function drawFisherCircleWithRodLook() {
  const rod = currentRod();
  ctx.fillStyle = "#ff5d68";
  ctx.strokeStyle = "#05263d";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(142, 285, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = rod.color;
  ctx.shadowColor = rod.glow;
  ctx.shadowBlur = 12;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(160, 270);
  ctx.quadraticCurveTo(235, 210 - rod.id * 4, 308, 246);
  ctx.stroke();
  ctx.shadowBlur = 0;
};

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (state.mode === "rodshop" && (key === "escape" || key === "n" || key === "s" || key === "arrowdown")) exitRodShop();
});

normalizeRodProgress();
saveGame();
