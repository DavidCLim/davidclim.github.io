// Expanded fish roster, rarities, and cheaper rod ladder.
rarityWeights.Common = 54;
rarityWeights.Rare = 24;
rarityWeights.Epic = 12;
rarityWeights.Legendary = 6;
rarityWeights.Mythical = 2.4;
rarityWeights.Extinct = 1.1;
rarityWeights.Gargantuan = 0.45;
rarityWeights.Abyss = 0.16;
rarityWeights["???"] = 0.045;

rarityColors.Common = "#ecfffb";
rarityColors.Rare = "#80bdff";
rarityColors.Epic = "#d594ff";
rarityColors.Legendary = "#ffe36e";
rarityColors.Mythical = "#ff83ef";
rarityColors.Extinct = "#d8c49b";
rarityColors.Gargantuan = "#ff8f4d";
rarityColors.Abyss = "#5ef7ff";
rarityColors["???"] = "#ffffff";

fishTypes.splice(0, fishTypes.length,
  // From your drawing sheet.
  { name: "Clownfish", rarity: "Common", value: 1, color: "#ff9b48", design: "clown" },
  { name: "Angel Fish", rarity: "Common", value: 2, color: "#ffe07a", design: "angel" },
  { name: "Starfish", rarity: "Rare", value: 4, color: "#ffd86b", design: "star" },
  { name: "Squid", rarity: "Rare", value: 5, color: "#c68dff", design: "squid" },
  { name: "Sailfish", rarity: "Epic", value: 9, color: "#9edbff", design: "sail" },
  { name: "Angler Fish", rarity: "Epic", value: 12, color: "#72e48a", design: "angler" },
  { name: "Swordfish", rarity: "Legendary", value: 19, color: "#b8d7ff", design: "sword" },
  { name: "Bone Fish", rarity: "Legendary", value: 23, color: "#e9f3e8", design: "bone" },
  { name: "Starborn Shark", rarity: "Mythical", value: 42, color: "#8de7ff", design: "shark" },
  { name: "Sail Shark", rarity: "Mythical", value: 48, color: "#72f0ff", design: "sailshark" },
  { name: "Monster Fish", rarity: "Extinct", value: 78, color: "#6fe27d", design: "monster" },
  { name: "Manta Ray", rarity: "Extinct", value: 92, color: "#8cc5ff", design: "ray" },
  { name: "Needle Fish", rarity: "Extinct", value: 105, color: "#eaf8ff", design: "needle" },
  { name: "Stone Fish", rarity: "Gargantuan", value: 180, color: "#b7a58f", design: "stone" },
  { name: "Treasure Chest", rarity: "Gargantuan", value: 220, color: "#c7833c", design: "treasure" },
  { name: "Mythical Whale", rarity: "Abyss", value: 420, color: "#d9fbff", design: "whale" },
  { name: "Lost Whale", rarity: "Abyss", value: 520, color: "#d6f2ff", design: "lostwhale" },
  { name: "Slope Fish", rarity: "???", value: 1200, color: "#ffffff", design: "slope" },

  // New Hyper Fishies originals.
  { name: "Bubble Guppy", rarity: "Common", value: 1, color: "#85ffdf", design: "guppy" },
  { name: "Lantern Eel", rarity: "Rare", value: 6, color: "#b2ff6b", design: "eel" },
  { name: "Crown Crab", rarity: "Epic", value: 11, color: "#ff7770", design: "crab" },
  { name: "Crystal Pike", rarity: "Legendary", value: 30, color: "#8ffff5", design: "pike" },
  { name: "Moon Jelly", rarity: "Mythical", value: 56, color: "#e8d4ff", design: "jelly" },
  { name: "Fossil Ray", rarity: "Extinct", value: 110, color: "#d8c49b", design: "fossilray" },
  { name: "Titan Turtle", rarity: "Gargantuan", value: 260, color: "#73d17b", design: "turtle" },
  { name: "Abyss Serpent", rarity: "Abyss", value: 650, color: "#3df6ff", design: "serpent" },
  { name: "Glitch Leviathan", rarity: "???", value: 1600, color: "#ffffff", design: "glitch" }
);

rodCatalog.splice(0, rodCatalog.length,
  { id: 1, name: "Driftwood Rod", price: 0, luck: 1.00, control: 1.00, color: "#8b5a2b", glow: "#f3c47b", note: "Free starter rod." },
  { id: 2, name: "Bamboo Rod", price: 260, luck: 1.10, control: 1.07, color: "#7fd36b", glow: "#d7ffc7", note: "Cheap and clean." },
  { id: 3, name: "Coral Rod", price: 700, luck: 1.24, control: 1.15, color: "#ff7f73", glow: "#ffd2a7", note: "A reef upgrade." },
  { id: 4, name: "Tide Rod", price: 1600, luck: 1.42, control: 1.25, color: "#4ed8ff", glow: "#d9fbff", note: "Better cast flow." },
  { id: 5, name: "Pearl Rod", price: 3600, luck: 1.66, control: 1.38, color: "#fff0c8", glow: "#ffffff", note: "Smooth and lucky." },
  { id: 6, name: "Storm Rod", price: 8200, luck: 1.98, control: 1.54, color: "#8c77ff", glow: "#f0dcff", note: "Stronger control." },
  { id: 7, name: "Royal Rod", price: 17000, luck: 2.38, control: 1.72, color: "#ffd85f", glow: "#fff4ad", note: "Fancy luck." },
  { id: 8, name: "Abyss Rod", price: 39000, luck: 2.88, control: 1.94, color: "#192a68", glow: "#88ffea", note: "Deep-water power." },
  { id: 9, name: "Mythic Rod", price: 90000, luck: 3.50, control: 2.18, color: "#ff66e5", glow: "#ffd6fb", note: "Mythical fish wake up." },
  { id: 10, name: "Hyper Rod", price: 185000, luck: 4.25, control: 2.48, color: "#6dffcb", glow: "#ffffff", note: "A serious rod." },
  { id: 11, name: "Extinct Rod", price: 390000, luck: 5.10, control: 2.82, color: "#c7a76c", glow: "#fff0b6", note: "Pulls old things from old water." },
  { id: 12, name: "Gargantuan Rod", price: 840000, luck: 6.05, control: 3.20, color: "#ff8f4d", glow: "#ffd2a7", note: "For huge catches." },
  { id: 13, name: "Void Rod", price: 1700000, luck: 7.15, control: 3.62, color: "#32145f", glow: "#8fffff", note: "The abyss answers." },
  { id: 14, name: "Question Rod", price: 3600000, luck: 8.45, control: 4.10, color: "#ffffff", glow: "#ffffff", note: "For ??? catches." },
  { id: 15, name: "Omega Hyper Rod", price: 7800000, luck: 10.00, control: 4.75, color: "#39ffb6", glow: "#ffffff", note: "The ocean cheats for you." }
);

normalizeRodProgress();

rollFish = function rollFishWithBigRarityLadder() {
  const rod = currentRod();
  const rarityPower = {
    Common: -0.32,
    Rare: 0.78,
    Epic: 1.15,
    Legendary: 1.62,
    Mythical: 2.1,
    Extinct: 2.72,
    Gargantuan: 3.45,
    Abyss: 4.25,
    "???": 5.35
  };
  const weighted = fishTypes.map(fish => {
    const base = rarityWeights[fish.rarity] || 1;
    const power = rarityPower[fish.rarity] || 1;
    const boost = fish.rarity === "Common"
      ? Math.max(0.18, 1 + (rod.luck - 1) * power)
      : 1 + (rod.luck - 1) * power;
    return { fish, weight: Math.max(0.025, base * boost) };
  });
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = rand(0, total);
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.fish;
  }
  return fishTypes[0];
};

updateFishing = function updateFishingWithMegaRarities(dt) {
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
      cast.biteIn = rand(0.72, 2.05) / (1 + rod.id * 0.065);
      makeRipple(cast.hookX, cast.hookY);
      say("Bobber is in the water. Wait for a bite...");
    }
  } else if (cast.phase === "waiting") {
    cast.biteIn -= dt;
    cast.hookY += Math.sin(performance.now() / 160) * 0.15;
    if (cast.biteIn <= 0) {
      cast.phase = "bite";
      cast.reel = 0.36;
      cast.fish = rollFish();
      cast.shake = rand(0.85, 1.55);
      say(`${cast.fish.rarity.toUpperCase()} BITE! Tap REEL fast!`);
    }
  } else if (cast.phase === "bite") {
    const pain = { Common: .04, Rare: .07, Epic: .105, Legendary: .15, Mythical: .22, Extinct: .29, Gargantuan: .36, Abyss: .46, "???": .62 }[cast.fish.rarity] || .08;
    cast.reel -= (0.13 + pain + cast.fish.value / 3000 - rod.control * 0.035) * dt;
    cast.hookX += Math.sin(performance.now() / 84) * cast.shake * 0.22;
    if (cast.reel <= 0) {
      state.cast = null;
      say("The fish broke loose. Better rods help with rarer fish.");
    }
  }
};

reel = function reelBigRarities() {
  if (!state.cast) return castLine();
  if (state.cast.phase !== "bite") return;
  const rod = currentRod();
  state.cast.reel += 0.17 + rod.control * 0.05;
  makeRipple(state.cast.hookX, state.cast.hookY);
  if (state.cast.reel >= 1) catchFish(state.cast.fish);
};

catchFish = function catchFishExpandedRoster(fish) {
  const value = Math.max(1, Math.round(fish.value * (1 + currentRod().luck * 0.022) * rand(0.70, 1.05)));
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

function drawFishDesign(design, x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#09283d";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const key = String(design || "").toLowerCase();
  if (key.includes("clown")) drawClownfish(color);
  else if (key.includes("angel")) drawAngelfish(color);
  else if (key.includes("star") && !key.includes("shark")) drawStarfish(color);
  else if (key.includes("squid")) drawSquid(color);
  else if (key.includes("sailshark")) drawSailShark(color);
  else if (key.includes("sail")) drawSailfish(color);
  else if (key.includes("angler")) drawAnglerFish(color);
  else if (key.includes("sword")) drawSwordfish(color);
  else if (key.includes("bone")) drawBoneFish(color);
  else if (key.includes("shark")) drawShark(color);
  else if (key.includes("whale") || key.includes("lost")) drawLostWhale(color);
  else if (key.includes("monster")) drawMonsterFish(color);
  else if (key.includes("ray")) drawMantaRay(color);
  else if (key.includes("needle")) drawNeedleFish(color);
  else if (key.includes("stone")) drawStoneFish(color);
  else if (key.includes("treasure")) drawTreasureChest(color);
  else if (key.includes("slope")) drawSlopeFish(color);
  else if (key.includes("guppy")) drawGuppy(color);
  else if (key.includes("eel")) drawLanternEel(color);
  else if (key.includes("crab")) drawCrownCrab(color);
  else if (key.includes("pike")) drawCrystalPike(color);
  else if (key.includes("jelly")) drawMoonJelly(color);
  else if (key.includes("turtle")) drawTitanTurtle(color);
  else if (key.includes("serpent")) drawAbyssSerpent(color);
  else if (key.includes("glitch")) drawGlitchLeviathan(color);
  else drawClownfish(color);
  ctx.restore();
}

function drawSailShark(color) {
  drawShark(color || "#72f0ff");
  ctx.fillStyle = "#4ca6ff";
  ctx.beginPath(); ctx.moveTo(-10, -25); ctx.lineTo(26, -78); ctx.lineTo(42, -12); ctx.closePath(); ctx.fill(); ctx.stroke();
}
function drawMonsterFish(color) {
  ctx.fillStyle = color || "#6fe27d";
  ctx.beginPath(); ctx.moveTo(-70, 6); ctx.quadraticCurveTo(-15, -52, 76, -18); ctx.lineTo(112, 0); ctx.lineTo(76, 26); ctx.quadraticCurveTo(-25, 50, -70, 6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#09283d"; ctx.beginPath(); ctx.arc(-36, -10, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; for (let x = -6; x < 42; x += 12) { ctx.beginPath(); ctx.moveTo(x, 12); ctx.lineTo(x + 7, 0); ctx.lineTo(x + 14, 12); ctx.fill(); ctx.stroke(); }
}
function drawMantaRay(color) {
  ctx.fillStyle = color || "#8cc5ff";
  ctx.beginPath(); ctx.moveTo(-84, 0); ctx.quadraticCurveTo(-20, -60, 0, -14); ctx.quadraticCurveTo(25, -60, 88, 0); ctx.quadraticCurveTo(24, 42, 0, 20); ctx.quadraticCurveTo(-24, 42, -84, 0); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, 20); ctx.quadraticCurveTo(10, 70, 0, 100); ctx.stroke();
}
function drawNeedleFish(color) {
  ctx.fillStyle = color || "#eaf8ff";
  ctx.beginPath(); ctx.ellipse(0, 0, 50, 12, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-48, 0); ctx.lineTo(-144, -5); ctx.lineTo(-48, 5); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(48, 0); ctx.lineTo(86, -20); ctx.lineTo(78, 0); ctx.lineTo(86, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
}
function drawStoneFish(color) {
  ctx.fillStyle = color || "#b7a58f";
  ctx.beginPath(); ctx.moveTo(-70, 20); ctx.quadraticCurveTo(-44, -46, 18, -36); ctx.quadraticCurveTo(88, -16, 72, 30); ctx.quadraticCurveTo(0, 52, -70, 20); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "rgba(9,40,61,.55)"; for (let x = -36; x < 52; x += 28) { ctx.beginPath(); ctx.moveTo(x, -24); ctx.lineTo(x + 14, 28); ctx.stroke(); }
}
function drawTreasureChest(color) {
  rounded(-64, -32, 128, 72, 10, color || "#c7833c", "#09283d", 5);
  ctx.fillStyle = "#ffe36e"; ctx.fillRect(-58, -4, 116, 10); ctx.strokeRect(-58, -4, 116, 10);
  for (let x = -40; x <= 40; x += 40) { ctx.beginPath(); ctx.arc(x, 46, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
}
function drawLostWhale(color) { drawWhale(color || "#d6f2ff"); ctx.strokeStyle = "#09283d"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-62, 18); ctx.quadraticCurveTo(-22, 30, 24, 18); ctx.stroke(); }
function drawSlopeFish(color) {
  ctx.save(); ctx.rotate(-0.22); drawBoneFish(color || "#ffffff"); ctx.restore();
  ctx.strokeStyle = "#ffffff"; ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 14; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, 74, 0, Math.PI * 2); ctx.stroke(); ctx.shadowBlur = 0;
}
function drawGuppy(color) { fishBody(color || "#85ffdf"); }
function drawLanternEel(color) {
  ctx.strokeStyle = color || "#b2ff6b"; ctx.lineWidth = 18; ctx.beginPath(); ctx.moveTo(-90, 0); ctx.bezierCurveTo(-45, -42, 0, 44, 84, -4); ctx.stroke();
  ctx.fillStyle = "#ffe36e"; ctx.beginPath(); ctx.arc(90, -7, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
}
function drawCrownCrab(color) {
  ctx.fillStyle = color || "#ff7770"; ctx.beginPath(); ctx.ellipse(0, 8, 52, 30, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-20, -22); ctx.lineTo(-8, -48); ctx.lineTo(4, -22); ctx.lineTo(18, -48); ctx.lineTo(30, -22); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#09283d"; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 18, 28); ctx.lineTo(i * 24, 52); ctx.stroke(); }
}
function drawCrystalPike(color) { drawSwordfish(color || "#8ffff5"); ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.beginPath(); ctx.moveTo(-10, -26); ctx.lineTo(8, -56); ctx.lineTo(24, -18); ctx.closePath(); ctx.fill(); ctx.stroke(); }
function drawMoonJelly(color) {
  ctx.fillStyle = color || "#e8d4ff"; ctx.beginPath(); ctx.arc(0, -12, 48, Math.PI, 0); ctx.quadraticCurveTo(36, 38, -36, 38); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#9ff7ff"; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 14, 28); ctx.quadraticCurveTo(i * 20, 68, i * 8, 94); ctx.stroke(); }
}
function drawTitanTurtle(color) {
  ctx.fillStyle = color || "#73d17b"; ctx.beginPath(); ctx.ellipse(0, 0, 72, 44, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#4aa853"; ctx.beginPath(); ctx.arc(-66, -2, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "rgba(9,40,61,.5)"; ctx.beginPath(); ctx.moveTo(-40, -30); ctx.lineTo(42, 30); ctx.moveTo(40, -30); ctx.lineTo(-42, 30); ctx.stroke();
}
function drawAbyssSerpent(color) {
  ctx.strokeStyle = color || "#3df6ff"; ctx.lineWidth = 22; ctx.shadowColor = color || "#3df6ff"; ctx.shadowBlur = 14; ctx.beginPath(); ctx.moveTo(-110, 18); ctx.bezierCurveTo(-70, -50, -28, 48, 18, -18); ctx.bezierCurveTo(48, -60, 80, -4, 112, -30); ctx.stroke(); ctx.shadowBlur = 0;
  ctx.fillStyle = "#09283d"; ctx.beginPath(); ctx.arc(112, -30, 8, 0, Math.PI * 2); ctx.fill();
}
function drawGlitchLeviathan(color) {
  ctx.save();
  ctx.shadowColor = "#ffffff"; ctx.shadowBlur = 18;
  drawMonsterFish(color || "#ffffff");
  ctx.strokeStyle = "#ff4dff"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-80, -48); ctx.lineTo(-30, -22); ctx.lineTo(20, -54); ctx.lineTo(70, -24); ctx.stroke();
  ctx.strokeStyle = "#42fff6"; ctx.beginPath(); ctx.moveTo(-70, 44); ctx.lineTo(-20, 22); ctx.lineTo(30, 48); ctx.lineTo(82, 12); ctx.stroke();
  ctx.restore();
}

drawFishSilhouettes = function drawExpandedFishSilhouettes() {
  const designs = fishTypes.slice(0, 14).map(f => f.design);
  for (let i = 0; i < designs.length; i++) {
    const x = 300 + i * 52 + Math.sin(performance.now() / 650 + i) * 14;
    const y = 404 + (i % 3) * 35 + Math.cos(performance.now() / 760 + i) * 5;
    ctx.save();
    ctx.globalAlpha = 0.28;
    drawFishDesign(designs[i], x, y, 0.31 + (i % 3) * 0.045, "rgba(3,35,70,.72)");
    ctx.restore();
  }
};

function drawRodRack(x, y) {
  normalizeRodProgress();
  ctx.save();
  ctx.font = "900 10px Trebuchet MS";
  const colW = 220;
  const rowH = 34;
  rodCatalog.forEach((rod, index) => {
    const col = index % 2;
    const row = Math.floor(index / 2);
    const rx = x + col * colW;
    const ry = y + row * rowH;
    const owned = state.progress.ownedRods.includes(rod.id);
    const equipped = state.progress.currentRod === rod.id;
    rounded(rx, ry, 210, 29, 8, equipped ? "#d9fff4" : owned ? "#b9efff" : "#ffe59a", "#111", 2);
    drawTinyRod(rx + 14, ry + 17, rod);
    ctx.fillStyle = "#111";
    ctx.textAlign = "left";
    ctx.fillText(rod.name.toUpperCase(), rx + 38, ry + 13);
    ctx.fillStyle = "#0b4e4d";
    ctx.fillText(`x${rod.luck.toFixed(2)}`, rx + 38, ry + 25);
    ctx.textAlign = "right";
    ctx.fillStyle = equipped ? "#0b6f34" : "#111";
    ctx.fillText(equipped ? "ON" : owned ? "EQUIP" : `${rod.price}`, rx + 202, ry + 21);
    buttonZones.push({ x: rx, y: ry, w: 210, h: 29, action: () => buyOrEquipRod(rod.id) });
  });
  ctx.fillStyle = "#ffe36e";
  ctx.font = "900 17px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText(`COINS ${state.progress.coins}`, x, y + 286);
  ctx.restore();
}

saveGame();
say("New fish and rarities added: Mythical, Extinct, Gargantuan, Abyss, and ???.");
updateHud();
