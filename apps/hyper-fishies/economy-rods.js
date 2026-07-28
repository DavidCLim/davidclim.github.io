// Final economy layer: bigger fish payouts and a cheaper rod ladder.
fishTypes.splice(0, fishTypes.length,
  { name: "Clownfish", rarity: "Common", value: 1, color: "#ff9b48", design: "clown" },
  { name: "Angel Fish", rarity: "Common", value: 2, color: "#ffe07a", design: "angel" },
  { name: "Starfish", rarity: "Unusual", value: 3, color: "#ffd86b", design: "star" },
  { name: "Squid", rarity: "Unusual", value: 4, color: "#c68dff", design: "squid" },
  { name: "Sailfish", rarity: "Rare", value: 7, color: "#9edbff", design: "sail" },
  { name: "Angler Fish", rarity: "Rare", value: 10, color: "#72e48a", design: "angler" },
  { name: "Swordfish", rarity: "Epic", value: 16, color: "#b8d7ff", design: "sword" },
  { name: "Bone Fish", rarity: "Epic", value: 21, color: "#e9f3e8", design: "bone" },
  { name: "Starborn Shark", rarity: "Legendary", value: 38, color: "#8de7ff", design: "shark" },
  { name: "Mythical Whale", rarity: "Legendary", value: 55, color: "#d9fbff", design: "whale" }
);

rodCatalog.splice(0, rodCatalog.length,
  { id: 1, name: "Driftwood Rod", price: 0, luck: 1.00, control: 1.00, color: "#8b5a2b", glow: "#f3c47b", note: "Free starter rod." },
  { id: 2, name: "Bamboo Rod", price: 80, luck: 1.08, control: 1.05, color: "#7fd36b", glow: "#d7ffc7", note: "A careful first upgrade." },
  { id: 3, name: "Coral Rod", price: 180, luck: 1.18, control: 1.10, color: "#ff7f73", glow: "#ffd2a7", note: "Bright reef luck." },
  { id: 4, name: "Tide Rod", price: 420, luck: 1.32, control: 1.18, color: "#4ed8ff", glow: "#d9fbff", note: "Casts farther into the tide." },
  { id: 5, name: "Pearl Rod", price: 900, luck: 1.50, control: 1.28, color: "#fff0c8", glow: "#ffffff", note: "Polished and reliable." },
  { id: 6, name: "Storm Rod", price: 1900, luck: 1.74, control: 1.41, color: "#8c77ff", glow: "#f0dcff", note: "Good for hard fights." },
  { id: 7, name: "Royal Rod", price: 4200, luck: 2.02, control: 1.56, color: "#ffd85f", glow: "#fff4ad", note: "A rich fisher's rod." },
  { id: 8, name: "Abyss Rod", price: 9500, luck: 2.36, control: 1.74, color: "#192a68", glow: "#88ffea", note: "Deep-water luck." },
  { id: 9, name: "Mythic Rod", price: 21000, luck: 2.76, control: 1.95, color: "#ff66e5", glow: "#ffd6fb", note: "For serious collectors." },
  { id: 10, name: "Hyper Rod", price: 45000, luck: 3.24, control: 2.18, color: "#6dffcb", glow: "#ffffff", note: "The first true endgame rod." },
  { id: 11, name: "Leviathan Rod", price: 95000, luck: 3.82, control: 2.44, color: "#00a6ff", glow: "#b8f7ff", note: "Made for monster water." },
  { id: 12, name: "Sunken Crown Rod", price: 190000, luck: 4.50, control: 2.74, color: "#f7d65a", glow: "#fff7bd", note: "Royal treasure from below." },
  { id: 13, name: "Kraken Rod", price: 390000, luck: 5.30, control: 3.08, color: "#6e37ff", glow: "#d8c7ff", note: "A rod with teeth." },
  { id: 14, name: "Celestial Rod", price: 780000, luck: 6.25, control: 3.48, color: "#fff9ff", glow: "#cce9ff", note: "Almost unreal." },
  { id: 15, name: "Omega Hyper Rod", price: 1500000, luck: 7.40, control: 3.95, color: "#39ffb6", glow: "#ffffff", note: "The ocean bows a little." }
);

normalizeRodProgress();

catchFish = function catchFishTinyEconomy(fish) {
  const value = Math.max(1, Math.round(fish.value * (1 + currentRod().luck * 0.025) * rand(0.72, 1.02)));
  state.bag.push({ ...fish, value });
  state.latest = `${fish.rarity} ${fish.name}`;
  state.progress.bestFish = state.latest;
  state.progress.caught[fish.name] = (state.progress.caught[fish.name] || 0) + 1;
  state.catchReveal = { fish: { ...fish, value }, life: 2.8, age: 0 };
  burst(state.cast ? state.cast.hookX : 500, state.cast ? state.cast.hookY : 330, rarityColors[fish.rarity], 28);
  state.cast = null;
  saveGame();
  say(`Caught ${fish.rarity} ${fish.name}! Value: ${value} coins.`);
};

function drawRodRack(x, y) {
  normalizeRodProgress();
  ctx.save();
  ctx.font = "900 11px Trebuchet MS";
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
  ctx.font = "900 19px Trebuchet MS";
  ctx.textAlign = "left";
  wrapText("Rod prices are cheaper now. Catch, sell, upgrade, and climb the ladder faster!", x + 24, y + 34, 390, 24);
  ctx.restore();
}

saveGame();
