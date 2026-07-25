const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const coinsText = document.getElementById("coinsText");
const bagText = document.getElementById("bagText");
const areaText = document.getElementById("areaText");
const rodText = document.getElementById("rodText");
const latestText = document.getElementById("latestText");
const statusText = document.getElementById("statusText");
const panel = document.getElementById("messagePanel");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const castButton = document.getElementById("castButton");
const sellButton = document.getElementById("sellButton");
const upgradeButton = document.getElementById("upgradeButton");
const joystick = document.getElementById("joystick");
const joystickKnob = document.getElementById("joystickKnob");

const saveKey = "hyperFishiesFischPrototypeV1";
const keys = new Set();
let joy = { active: false, x: 0, y: 0 };
let lastTime = 0;
let state;

const fishTypes = [
  { name: "Sweetfish", rarity: "Common", value: 18, color: "#ffe07a" },
  { name: "Clownfish", rarity: "Common", value: 24, color: "#ff9b48" },
  { name: "Saltfish", rarity: "Unusual", value: 42, color: "#d8f7ff" },
  { name: "Flying Fish", rarity: "Unusual", value: 55, color: "#94d9ff" },
  { name: "Shrimp", rarity: "Rare", value: 80, color: "#ff7c87" },
  { name: "Monster Fish", rarity: "Rare", value: 120, color: "#6fe27d" },
  { name: "Swordfish", rarity: "Epic", value: 190, color: "#b8d7ff" },
  { name: "Sea Star", rarity: "Epic", value: 220, color: "#ffd86b" },
  { name: "Golden Shark", rarity: "Legendary", value: 420, color: "#ffe34f" }
];
const rarityWeights = { Common: 50, Unusual: 28, Rare: 14, Epic: 6, Legendary: 2 };
const rarityColors = { Common: "#ecfffb", Unusual: "#84ffd7", Rare: "#80bdff", Epic: "#d594ff", Legendary: "#ffe36e" };
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

function loadProgress() {
  try { return JSON.parse(localStorage.getItem(saveKey)) || { coins: 0, rod: 1, bestFish: "None", caught: {} }; }
  catch { return { coins: 0, rod: 1, bestFish: "None", caught: {} }; }
}
function saveProgress() { localStorage.setItem(saveKey, JSON.stringify(state.progress)); }
function roman(value) { return ["0", "I", "II", "III", "IV", "V", "VI", "VII"][value] || String(value); }
function say(text) { statusText.textContent = text; }
function inRect(p, x, y, w, h) { return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h; }
function atFishingDock(p) { return inRect(p, 388, 40, 184, 118); }
function atSellDock(p) { return inRect(p, 66, 368, 220, 104); }
function atShopDock(p) { return inRect(p, 66, 100, 220, 104); }

function freshState() {
  const progress = loadProgress();
  return {
    running: false,
    mode: "dock",
    player: { x: 480, y: 340, r: 18, vx: 0, vy: 0 },
    bag: [],
    bagLimit: 5 + progress.rod,
    latest: "None",
    cast: null,
    ripples: [],
    progress
  };
}

function resetGame() {
  const progress = state ? state.progress : loadProgress();
  state = freshState();
  state.progress = progress;
  updateHud();
  showMessage("HYPER FISHIES", "Walk around the wooden dock. Go to the small top fishing dock, then press CAST to fish.", "PLAY");
}
function showMessage(title, text, buttonText) {
  panel.querySelector("h1").textContent = title;
  panel.querySelector("p").textContent = text;
  startButton.textContent = buttonText;
  panel.classList.add("show");
}
function startGame() {
  panel.classList.remove("show");
  state.running = true;
  lastTime = performance.now();
  say("Walk into SELL FISH to meet the pirate merchant, or go to the FISH dock to cast.");
}

function updateHud() {
  coinsText.textContent = state.progress.coins;
  bagText.textContent = `${state.bag.length}/${state.bagLimit}`;
  areaText.textContent = state.mode === "fishing" ? "BANK" : state.mode === "sell" ? "SELL" : "DOCK";
  rodText.textContent = roman(state.progress.rod);
  latestText.textContent = state.latest;

  const canReel = state.mode === "fishing" && state.cast && state.cast.phase === "bite";
  const canCast = state.mode === "fishing" && !state.cast && state.bag.length < state.bagLimit;
  const canDockCast = state.mode === "dock" && atFishingDock(state.player) && state.bag.length < state.bagLimit;
  castButton.textContent = canReel ? "REEL!" : state.cast ? "WAIT" : "CAST";
  castButton.disabled = !(canReel || canCast || canDockCast);

  sellButton.textContent = state.mode === "sell" ? "YES SELL" : "SELL FISH";
  sellButton.disabled = state.mode === "sell" ? state.bag.length === 0 : !(state.mode === "dock" && atSellDock(state.player));

  upgradeButton.textContent = state.mode === "sell" ? "NO LEAVE" : "UPGRADE ROD";
  upgradeButton.disabled = state.mode === "sell" ? false : !(state.mode === "dock" && atShopDock(state.player));
}

function update(dt) {
  if (!state.running) return;
  if (state.mode === "dock") updateDock(dt);
  if (state.mode === "fishing") updateFishing(dt);
  state.ripples = state.ripples.filter(r => (r.life -= dt) > 0);
  updateHud();
}

function updateDock(dt) {
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
  else if (atFishingDock(p)) say("Fishing dock: press CAST, SPACE, or F to switch to side view and fish.");
  else if (atShopDock(p)) say(`Shop: upgrade rod for ${upgradeCost()} coins.`);
  else say("Walk around the dock. The circle is you.");
}

function constrainToDock(p) {
  const areas = [
    { x: 250, y: 112, w: 460, h: 342 },
    { x: 410, y: 48, w: 140, h: 104 },
    { x: 66, y: 100, w: 220, h: 104 },
    { x: 66, y: 368, w: 220, h: 104 }
  ];
  if (areas.some(rect => inRect(p, rect.x, rect.y, rect.w, rect.h))) return;
  p.x -= p.vx * 0.03;
  p.y -= p.vy * 0.03;
  p.x = clamp(p.x, 66, 710);
  p.y = clamp(p.y, 48, 472);
}

function enterFishing() {
  state.mode = "fishing";
  state.player.x = 150;
  state.player.y = 324;
  state.cast = null;
  say("Camera changed to side view. Press CAST, SPACE, or F to throw your line.");
}
function exitFishing() {
  state.mode = "dock";
  state.player.x = 480;
  state.player.y = 158;
  state.cast = null;
  say("Back on the dock. Sell fish or upgrade your rod.");
}
function enterSellShop() {
  state.mode = "sell";
  state.player.vx = 0;
  state.player.vy = 0;
  say(state.bag.length ? "B-LA-KA! Pirate merchant asks: sell your fish? Press YES SELL or NO LEAVE." : "B-LA-KA! Your bag is empty. Press NO LEAVE to return.");
}
function exitSellShop() {
  state.mode = "dock";
  state.player.x = 300;
  state.player.y = 420;
  state.player.vx = 0;
  state.player.vy = 0;
  say("Back on the dock. Catch more fish or return to the pirate later.");
}

function updateFishing(dt) {
  if (!state.cast) return;
  const cast = state.cast;
  cast.timer += dt;
  if (cast.phase === "fly") {
    cast.hookX += cast.vx * dt;
    cast.hookY += cast.vy * dt;
    cast.vy += 520 * dt;
    if (cast.hookY >= cast.waterY) {
      cast.hookY = cast.waterY;
      cast.phase = "waiting";
      cast.biteIn = rand(0.8, 2.2) / (1 + state.progress.rod * 0.08);
      makeRipple(cast.hookX, cast.hookY);
      say("Bobber is in the water. Wait for a bite...");
    }
  } else if (cast.phase === "waiting") {
    cast.biteIn -= dt;
    cast.hookY += Math.sin(performance.now() / 160) * 0.15;
    if (cast.biteIn <= 0) {
      cast.phase = "bite";
      cast.reel = 0.45;
      cast.fish = rollFish();
      say("BITE! Press REEL, CAST, SPACE, F, or tap the water fast!");
    }
  } else if (cast.phase === "bite") {
    cast.reel -= (0.08 + cast.fish.value / 3000) * dt;
    if (cast.reel <= 0) {
      state.cast = null;
      say("The fish got away. Cast again.");
    }
  }
}

function castLine() {
  if (!state.running || state.mode === "sell") return;
  if (state.mode === "dock") {
    if (!atFishingDock(state.player)) {
      say("Walk onto the small FISH dock first, then press CAST.");
      return;
    }
    enterFishing();
  }
  if (state.bag.length >= state.bagLimit) {
    say("Your bag is full. Go sell your fish.");
    return;
  }
  if (state.cast) {
    reel();
    return;
  }
  state.cast = {
    phase: "fly", timer: 0, hookX: 184, hookY: 300,
    vx: 260 + state.progress.rod * 22,
    vy: -170 - state.progress.rod * 8,
    waterY: 345, reel: 0, fish: null
  };
  say("Cast! Watch the bobber land.");
}
function reel() {
  if (!state.cast) return castLine();
  if (state.cast.phase !== "bite") return;
  state.cast.reel += 0.26 + state.progress.rod * 0.065;
  makeRipple(state.cast.hookX, state.cast.hookY);
  if (state.cast.reel >= 1) catchFish(state.cast.fish);
}
function rollFish() {
  const bonus = state.progress.rod * 2.5;
  const weighted = fishTypes.map(fish => ({ fish, weight: Math.max(1, rarityWeights[fish.rarity] + (["Epic", "Legendary"].includes(fish.rarity) ? bonus : 0)) }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let roll = rand(0, total);
  for (const item of weighted) {
    roll -= item.weight;
    if (roll <= 0) return item.fish;
  }
  return fishTypes[0];
}
function catchFish(fish) {
  const value = Math.round(fish.value * (1 + state.progress.rod * 0.08) * rand(0.85, 1.25));
  state.bag.push({ ...fish, value });
  state.latest = `${fish.rarity} ${fish.name}`;
  state.progress.bestFish = state.latest;
  state.progress.caught[fish.name] = (state.progress.caught[fish.name] || 0) + 1;
  saveProgress();
  burst(state.cast.hookX, state.cast.hookY, rarityColors[fish.rarity], 18);
  state.cast = null;
  say(`Caught ${fish.rarity} ${fish.name}! Worth ${value} coins.`);
}
function sellFish() {
  if (state.mode === "dock") {
    if (atSellDock(state.player)) enterSellShop();
    return;
  }
  if (state.mode !== "sell") return;
  if (!state.bag.length) {
    say("The pirate has nothing to buy. Press NO LEAVE.");
    return;
  }
  const total = state.bag.reduce((sum, fish) => sum + fish.value, 0);
  state.progress.coins += total;
  state.bag = [];
  saveProgress();
  burst(520, 310, "#ffe36e", 26);
  say(`B-LA-KA! Sold everything for ${total} coins.`);
}
function upgradeCost() { return state.progress.rod * 150; }
function upgradeRod() {
  if (state.mode === "sell") return exitSellShop();
  if (state.mode !== "dock" || !atShopDock(state.player)) return;
  const cost = upgradeCost();
  if (state.progress.coins < cost) return say(`Need ${cost} coins for the next rod upgrade.`);
  state.progress.coins -= cost;
  state.progress.rod += 1;
  state.bagLimit = 5 + state.progress.rod;
  saveProgress();
  say(`Rod upgraded to ${roman(state.progress.rod)}. Better casts and better fish chances.`);
}

function makeRipple(x, y) { state.ripples.push({ x, y, life: 0.65 }); }
function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    state.ripples.push({ x: x + Math.cos(a) * rand(4, 20), y: y + Math.sin(a) * rand(2, 12), life: rand(0.25, 0.8), color });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (!state || state.mode === "dock") drawDockView();
  else if (state.mode === "fishing") drawFishingView();
  else drawSellShopView();
}
function drawDockView() {
  drawTopWater();
  drawIslandAndDock();
  drawDockLabels();
  drawCirclePlayer();
}
function drawTopWater() {
  const water = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  water.addColorStop(0, "#45c7e8");
  water.addColorStop(1, "#0872ad");
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255,255,255,.18)";
  ctx.lineWidth = 3;
  for (let i = 0; i < 18; i++) {
    const y = 30 + i * 34;
    ctx.beginPath();
    ctx.moveTo(-30, y);
    for (let x = -30; x < canvas.width + 30; x += 70) ctx.quadraticCurveTo(x + 35, y + Math.sin(i + performance.now() / 900) * 8, x + 70, y);
    ctx.stroke();
  }
}
function drawIslandAndDock() {
  rounded(235, 88, 490, 390, 34, "#e7ca83", "#8b6e39", 5);
  rounded(252, 105, 456, 350, 18, "#b97838", "#704217", 6);
  ctx.strokeStyle = "rgba(70,39,12,.55)";
  ctx.lineWidth = 4;
  for (let x = 272; x < 704; x += 46) { ctx.beginPath(); ctx.moveTo(x, 112); ctx.lineTo(x, 450); ctx.stroke(); }
  for (let y = 146; y < 446; y += 58) { ctx.beginPath(); ctx.moveTo(252, y); ctx.lineTo(708, y); ctx.stroke(); }
  rounded(410, 48, 140, 104, 14, "#b97838", "#704217", 6);
  rounded(452, 104, 56, 48, 8, "#b97838", "#704217", 5);
  rounded(66, 100, 220, 104, 18, "#b97838", "#704217", 6);
  rounded(66, 368, 220, 104, 18, "#b97838", "#704217", 6);
  rounded(392, 236, 176, 98, 20, "rgba(255,238,140,.24)", "rgba(255,255,255,.5)", 3);
  drawSign(88, 122, "SHOP");
  drawSign(88, 390, "SELL FISH");
  drawSign(423, 70, "FISH");
}
function drawSign(x, y, text) {
  rounded(x, y, 114, 42, 10, "#ffe36e", "#704217", 4);
  ctx.fillStyle = "#48270c";
  ctx.font = "900 18px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(text, x + 57, y + 27);
  ctx.textAlign = "left";
}
function drawDockLabels() {
  ctx.fillStyle = "rgba(255,255,255,.9)";
  ctx.font = "900 18px Trebuchet MS";
  ctx.fillText("TOP VIEW DOCK", 18, 32);
  ctx.fillText("Walk into SELL FISH to visit the pirate merchant", 18, 56);
}
function drawCirclePlayer() {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.fillStyle = "#ff5d68";
  ctx.strokeStyle = "#05263d";
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.55)";
  ctx.beginPath(); ctx.arc(-6, -7, 5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}
function drawFishingView() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#84eaff"); sky.addColorStop(0.46, "#36aee0"); sky.addColorStop(0.47, "#0f78b8"); sky.addColorStop(1, "#074a87");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#b97838"; ctx.fillRect(0, 300, 230, 92);
  ctx.strokeStyle = "#704217"; ctx.lineWidth = 6;
  for (let x = 12; x < 220; x += 42) { ctx.beginPath(); ctx.moveTo(x, 302); ctx.lineTo(x, 390); ctx.stroke(); }
  ctx.fillStyle = "rgba(255,255,255,.2)";
  for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(320 + i * 95, 380 + Math.sin(performance.now() / 400 + i) * 12, 48, 9, 0, 0, Math.PI * 2); ctx.fill(); }
  drawFisherCircle(); drawFishSilhouettes(); drawFishingLine(); drawRipples();
  ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "900 18px Trebuchet MS";
  ctx.fillText("SIDE VIEW FISHING BANK", 18, 32);
  ctx.fillText("Press CAST / SPACE / F. When BITE appears, tap REEL fast.", 18, 56);
  ctx.fillText("Press S or DOWN to leave fishing bank.", 18, 80);
}
function drawSellShopView() {
  drawTopWater();
  const hut = ctx.createLinearGradient(0, 70, 0, 500);
  hut.addColorStop(0, "#c9924a"); hut.addColorStop(1, "#6f3d17");
  rounded(130, 95, 700, 370, 34, hut, "#3f220e", 8);
  rounded(112, 72, 736, 78, 24, "#6a2f16", "#2a1208", 7);
  rounded(165, 360, 630, 105, 18, "#8b4d1f", "#3f220e", 7);
  rounded(380, 60, 200, 58, 16, "#ffe36e", "#4a230d", 5);
  ctx.fillStyle = "#4a230d"; ctx.font = "900 36px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText("SELL", 480, 101);
  drawPirateMerchant(275, 300);
  drawSpeechBubble(492, 170, state.bag.length ? "Arrr... do ya have anything ya like to sell to aye?" : "B-LA-KA! Yer bag be empty.");
  drawFishInventory(515, 330); drawRipples();
  ctx.fillStyle = "rgba(255,255,255,.92)"; ctx.font = "900 18px Trebuchet MS"; ctx.textAlign = "left";
  ctx.fillText("FRONT VIEW PIRATE SHOP", 18, 32);
  ctx.fillText("YES SELL sells your bag. NO LEAVE returns to the dock.", 18, 56);
}
function drawPirateMerchant(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = "#1b120c"; ctx.lineWidth = 5;
  ctx.fillStyle = "#f0c17d"; ctx.beginPath(); ctx.roundRect(-42, -92, 84, 72, 16); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#171717"; ctx.beginPath(); ctx.arc(-18, -62, 10, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#171717"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-42, -68); ctx.lineTo(-2, -54); ctx.stroke();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(19, -63, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(20, -63, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#331700"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-12, -34); ctx.quadraticCurveTo(0, -24, 16, -34); ctx.stroke();
  ctx.fillStyle = "#6c2a18"; ctx.beginPath(); ctx.moveTo(-54, -94); ctx.quadraticCurveTo(0, -145, 62, -92); ctx.lineTo(40, -82); ctx.quadraticCurveTo(0, -105, -47, -82); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ffe36e"; ctx.beginPath(); ctx.arc(6, -116, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#174b69"; ctx.beginPath(); ctx.moveTo(-82, -27); ctx.lineTo(82, -27); ctx.lineTo(54, 70); ctx.lineTo(-54, 70); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f0c17d"; ctx.beginPath(); ctx.roundRect(-96, -8, 54, 24, 9); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(42, -8, 54, 24, 9); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#222"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(53, -42); ctx.quadraticCurveTo(88, -82, 105, -132); ctx.stroke();
  ctx.restore();
}
function drawSpeechBubble(x, y, text) {
  rounded(x, y, 330, 122, 18, "#fff7d6", "#3f220e", 5);
  ctx.beginPath(); ctx.moveTo(x, y + 68); ctx.lineTo(x - 36, y + 90); ctx.lineTo(x + 8, y + 88); ctx.closePath(); ctx.fillStyle = "#fff7d6"; ctx.fill(); ctx.strokeStyle = "#3f220e"; ctx.lineWidth = 5; ctx.stroke();
  ctx.fillStyle = "#3f220e"; ctx.font = "900 19px Trebuchet MS"; ctx.textAlign = "left";
  const words = text.split(" "); let line = ""; let yLine = y + 38;
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > 285) { ctx.fillText(line, x + 22, yLine); line = word + " "; yLine += 25; } else line = test;
  }
  ctx.fillText(line, x + 22, yLine);
}
function drawFishInventory(x, y) {
  const total = state.bag.reduce((sum, fish) => sum + fish.value, 0);
  rounded(x, y, 250, 96, 16, "rgba(12,53,71,.72)", "rgba(255,255,255,.78)", 4);
  ctx.fillStyle = "#ecfffb"; ctx.font = "900 18px Trebuchet MS"; ctx.textAlign = "left";
  ctx.fillText(`SELL INVENTORY: ${state.bag.length}/${state.bagLimit}`, x + 18, y + 30);
  ctx.fillText(`TOTAL OFFER: ${total} COINS`, x + 18, y + 60);
  if (!state.bag.length) ctx.fillText("NO FISH HELD", x + 18, y + 86);
  for (let i = 0; i < Math.min(5, state.bag.length); i++) drawSmallFish(x + 24 + i * 39, y + 82, 13, state.bag[i].color);
}
function drawFisherCircle() {
  ctx.fillStyle = "#ff5d68"; ctx.strokeStyle = "#05263d"; ctx.lineWidth = 5;
  ctx.beginPath(); ctx.arc(142, 285, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#5a310d"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(160, 270); ctx.quadraticCurveTo(235, 220, 308, 246); ctx.stroke();
}
function drawFishSilhouettes() {
  for (let i = 0; i < 8; i++) drawSmallFish(330 + i * 80 + Math.sin(performance.now() / 700 + i) * 20, 420 + (i % 3) * 34 + Math.cos(performance.now() / 800 + i) * 6, 18 + (i % 3) * 4, "rgba(0,35,70,.38)");
}
function drawFishingLine() {
  if (!state.cast) return;
  const c = state.cast;
  ctx.strokeStyle = "rgba(255,255,255,.82)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(305, 245); ctx.lineTo(c.hookX, c.hookY); ctx.stroke();
  ctx.fillStyle = c.phase === "bite" ? "#ffe36e" : "#ffffff"; ctx.strokeStyle = "#05263d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.hookX, c.hookY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (c.phase === "bite") { ctx.strokeStyle = rarityColors[c.fish.rarity]; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(c.hookX, c.hookY, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(c.reel, 0, 1)); ctx.stroke(); }
}
function drawRipples() {
  for (const r of state.ripples) {
    ctx.globalAlpha = clamp(r.life, 0, 1); ctx.strokeStyle = r.color || "rgba(255,255,255,.65)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(r.x, r.y, (1 - r.life) * 42 + 8, (1 - r.life) * 13 + 3, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.globalAlpha = 1;
}
function drawSmallFish(x, y, size, color) {
  ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, size, size * 0.56, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - size * 0.8, y); ctx.lineTo(x - size * 1.45, y - size * 0.55); ctx.lineTo(x - size * 1.25, y); ctx.lineTo(x - size * 1.45, y + size * 0.55); ctx.closePath(); ctx.fill();
}
function rounded(x, y, w, h, r, fill, stroke, line = 3) {
  ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke();
}
function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now; update(dt); draw(); requestAnimationFrame(loop);
}
function joystickVector(event) {
  const rect = joystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
  const dx = event.clientX - cx, dy = event.clientY - cy;
  const len = Math.hypot(dx, dy), max = rect.width * 0.34, scale = len > max ? max / len : 1;
  joy.x = clamp(dx / max, -1, 1); joy.y = clamp(dy / max, -1, 1);
  joystickKnob.style.transform = `translate(calc(-50% + ${dx * scale}px), calc(-50% + ${dy * scale}px))`;
}
function stopJoystick() { joy = { active: false, x: 0, y: 0 }; joystickKnob.style.transform = "translate(-50%, -50%)"; }

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if ((key === "f" || event.code === "Space") && state.running) { event.preventDefault(); castLine(); }
  if (state.mode === "fishing" && (key === "s" || key === "arrowdown") && !state.cast) exitFishing();
  if (state.mode === "sell" && (key === "n" || key === "escape" || key === "s" || key === "arrowdown")) exitSellShop();
  if (state.mode === "sell" && key === "y") sellFish();
});
window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));
canvas.addEventListener("pointerdown", () => { if (state.running && state.mode === "fishing" && state.cast && state.cast.phase === "bite") reel(); });
joystick.addEventListener("pointerdown", event => { joy.active = true; joystick.setPointerCapture(event.pointerId); joystickVector(event); });
joystick.addEventListener("pointermove", event => { if (joy.active) joystickVector(event); });
joystick.addEventListener("pointerup", stopJoystick);
joystick.addEventListener("pointercancel", stopJoystick);
startButton.addEventListener("click", startGame);
restartButton.addEventListener("click", resetGame);
castButton.addEventListener("click", castLine);
sellButton.addEventListener("click", sellFish);
upgradeButton.addEventListener("click", upgradeRod);

state = freshState();
resetGame();
requestAnimationFrame(loop);
