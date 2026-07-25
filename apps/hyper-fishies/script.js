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

const saveKey = "hyperFishiesFischPrototypeV2";
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
const defaultProgress = { coins: 0, rod: 1, bestFish: "None", caught: {} };
const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const buttonZones = [];

function loadSave() {
  try {
    const saved = JSON.parse(localStorage.getItem(saveKey));
    if (!saved) return { progress: { ...defaultProgress }, bag: [], latest: "None" };
    if (saved.progress) return { progress: { ...defaultProgress, ...saved.progress }, bag: saved.bag || [], latest: saved.latest || "None" };
    return { progress: { ...defaultProgress, ...saved }, bag: [], latest: saved.bestFish || "None" };
  } catch {
    return { progress: { ...defaultProgress }, bag: [], latest: "None" };
  }
}
function saveGame() {
  localStorage.setItem(saveKey, JSON.stringify({ progress: state.progress, bag: state.bag, latest: state.latest }));
}
function roman(value) { return ["0", "I", "II", "III", "IV", "V", "VI", "VII"][value] || String(value); }
function say(text) { state.message = text; if (statusText) statusText.textContent = text; }
function inRect(p, x, y, w, h) { return p.x >= x && p.x <= x + w && p.y >= y && p.y <= y + h; }
function atFishingDock(p) { return inRect(p, 388, 40, 184, 118); }
function atSellDock(p) { return inRect(p, 66, 368, 220, 104); }
function atShopDock(p) { return inRect(p, 66, 100, 220, 104); }

function freshState() {
  const saved = loadSave();
  return {
    running: true,
    mode: "dock",
    player: { x: 480, y: 340, r: 18, vx: 0, vy: 0 },
    bag: saved.bag,
    bagLimit: 5 + saved.progress.rod,
    latest: saved.latest,
    cast: null,
    ripples: [],
    message: "Auto-saved. Walk to FISH, SELL, or SHOP.",
    progress: saved.progress
  };
}

function resetGame() {
  const saved = loadSave();
  state = freshState();
  state.progress = saved.progress;
  state.bag = saved.bag;
  state.latest = saved.latest;
  state.running = true;
  panel.classList.remove("show");
  say("Auto-saved. Walk to FISH, SELL, or SHOP.");
  updateHud();
}
function showMessage() { panel.classList.remove("show"); }
function startGame() { panel.classList.remove("show"); state.running = true; }

function updateHud() {
  coinsText.textContent = state.progress.coins;
  bagText.textContent = `${state.bag.length}/${state.bagLimit}`;
  areaText.textContent = state.mode === "fishing" ? "BANK" : state.mode === "sell" ? "SELL" : "DOCK";
  rodText.textContent = roman(state.progress.rod);
  latestText.textContent = state.latest;
}

function update(dt) {
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
  else if (atFishingDock(p)) say("Fishing dock: tap CAST or press Space/F.");
  else if (atShopDock(p)) say(`Shop: upgrade rod for ${upgradeCost()} coins.`);
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
  say("Side view. Tap CAST, Space, or F to throw your line.");
}
function exitFishing() {
  state.mode = "dock";
  state.player.x = 480;
  state.player.y = 158;
  state.cast = null;
  say("Back on the dock. Auto-saved.");
  saveGame();
}
function enterSellShop() {
  state.mode = "sell";
  state.player.vx = 0;
  state.player.vy = 0;
  say(state.bag.length ? "B-LA-KA! Tap YES to sell, NO to leave." : "B-LA-KA! Yer bag be empty. Tap NO to leave.");
}
function exitSellShop() {
  state.mode = "dock";
  state.player.x = 300;
  state.player.y = 420;
  state.player.vx = 0;
  state.player.vy = 0;
  say("Back on the dock. Auto-saved.");
  saveGame();
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
      say("BITE! Tap REEL fast!");
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
  if (state.mode === "sell") return;
  if (state.mode === "dock") {
    if (!atFishingDock(state.player)) return say("Walk onto the small FISH dock first.");
    enterFishing();
  }
  if (state.bag.length >= state.bagLimit) return say("Your bag is full. Go sell your fish.");
  if (state.cast) return reel();
  state.cast = { phase: "fly", timer: 0, hookX: 184, hookY: 300, vx: 260 + state.progress.rod * 22, vy: -170 - state.progress.rod * 8, waterY: 345, reel: 0, fish: null };
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
  burst(state.cast.hookX, state.cast.hookY, rarityColors[fish.rarity], 18);
  state.cast = null;
  saveGame();
  say(`Caught ${fish.rarity} ${fish.name}! Auto-saved.`);
}
function sellFish() {
  if (state.mode === "dock") return enterSellShop();
  if (state.mode !== "sell") return;
  if (!state.bag.length) return say("The pirate has nothing to buy yet. Catch fish first.");
  const total = state.bag.reduce((sum, fish) => sum + fish.value, 0);
  state.progress.coins += total;
  state.bag = [];
  burst(520, 310, "#ffe36e", 26);
  saveGame();
  say(`B-LA-KA! Sold for ${total} coins. Auto-saved.`);
}
function upgradeCost() { return state.progress.rod * 150; }
function upgradeRod() {
  if (state.mode === "sell") return exitSellShop();
  if (state.mode !== "dock" || !atShopDock(state.player)) return say("Walk onto SHOP first.");
  const cost = upgradeCost();
  if (state.progress.coins < cost) return say(`Need ${cost} coins for the next rod upgrade.`);
  state.progress.coins -= cost;
  state.progress.rod += 1;
  state.bagLimit = 5 + state.progress.rod;
  saveGame();
  say(`Rod upgraded to ${roman(state.progress.rod)}. Auto-saved.`);
}
function goHome() { window.location.href = "../../"; }

function makeRipple(x, y) { state.ripples.push({ x, y, life: 0.65 }); }
function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    state.ripples.push({ x: x + Math.cos(a) * rand(4, 20), y: y + Math.sin(a) * rand(2, 12), life: rand(0.25, 0.8), color });
  }
}

function draw() {
  buttonZones.length = 0;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (state.mode === "dock") drawDockView();
  else if (state.mode === "fishing") drawFishingView();
  else drawSellShopView();
  drawGameHud();
  drawGameButtons();
}
function drawDockView() { drawTopWater(); drawIslandAndDock(); drawDockLabels(); drawCirclePlayer(); }
function drawTopWater() {
  const water = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  water.addColorStop(0, "#45c7e8"); water.addColorStop(1, "#0872ad");
  ctx.fillStyle = water; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.strokeStyle = "rgba(255,255,255,.18)"; ctx.lineWidth = 3;
  for (let i = 0; i < 18; i++) { const y = 30 + i * 34; ctx.beginPath(); ctx.moveTo(-30, y); for (let x = -30; x < canvas.width + 30; x += 70) ctx.quadraticCurveTo(x + 35, y + Math.sin(i + performance.now() / 900) * 8, x + 70, y); ctx.stroke(); }
}
function drawIslandAndDock() {
  rounded(235, 88, 490, 390, 34, "#e7ca83", "#8b6e39", 5);
  rounded(252, 105, 456, 350, 18, "#b97838", "#704217", 6);
  ctx.strokeStyle = "rgba(70,39,12,.55)"; ctx.lineWidth = 4;
  for (let x = 272; x < 704; x += 46) { ctx.beginPath(); ctx.moveTo(x, 112); ctx.lineTo(x, 450); ctx.stroke(); }
  for (let y = 146; y < 446; y += 58) { ctx.beginPath(); ctx.moveTo(252, y); ctx.lineTo(708, y); ctx.stroke(); }
  rounded(410, 48, 140, 104, 14, "#b97838", "#704217", 6);
  rounded(452, 104, 56, 48, 8, "#b97838", "#704217", 5);
  rounded(66, 100, 220, 104, 18, "#b97838", "#704217", 6);
  rounded(66, 368, 220, 104, 18, "#b97838", "#704217", 6);
  rounded(392, 236, 176, 98, 20, "rgba(255,238,140,.24)", "rgba(255,255,255,.5)", 3);
  drawSign(88, 122, "SHOP"); drawSign(88, 390, "SELL FISH"); drawSign(423, 70, "FISH");
}
function drawSign(x, y, text) { rounded(x, y, 114, 42, 10, "#ffe36e", "#704217", 4); ctx.fillStyle = "#48270c"; ctx.font = "900 18px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText(text, x + 57, y + 27); ctx.textAlign = "left"; }
function drawDockLabels() { ctx.fillStyle = "rgba(255,255,255,.9)"; ctx.font = "900 18px Trebuchet MS"; ctx.fillText("TOP VIEW DOCK", 18, 74); }
function drawCirclePlayer() { const p = state.player; ctx.save(); ctx.translate(p.x, p.y); ctx.fillStyle = "#ff5d68"; ctx.strokeStyle = "#05263d"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(0, 0, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,.55)"; ctx.beginPath(); ctx.arc(-6, -7, 5, 0, Math.PI * 2); ctx.fill(); ctx.restore(); }
function drawFishingView() {
  const sky = ctx.createLinearGradient(0, 0, 0, canvas.height); sky.addColorStop(0, "#84eaff"); sky.addColorStop(0.46, "#36aee0"); sky.addColorStop(0.47, "#0f78b8"); sky.addColorStop(1, "#074a87");
  ctx.fillStyle = sky; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#b97838"; ctx.fillRect(0, 300, 230, 92); ctx.strokeStyle = "#704217"; ctx.lineWidth = 6;
  for (let x = 12; x < 220; x += 42) { ctx.beginPath(); ctx.moveTo(x, 302); ctx.lineTo(x, 390); ctx.stroke(); }
  ctx.fillStyle = "rgba(255,255,255,.2)"; for (let i = 0; i < 7; i++) { ctx.beginPath(); ctx.ellipse(320 + i * 95, 380 + Math.sin(performance.now() / 400 + i) * 12, 48, 9, 0, 0, Math.PI * 2); ctx.fill(); }
  drawFisherCircle(); drawFishSilhouettes(); drawFishingLine(); drawRipples();
}
function drawSellShopView() {
  drawTopWater();
  rounded(98, 80, 765, 392, 18, "#fbf4dd", "#1b120b", 7);
  drawSellBanner(688, 94);
  drawPirateMerchant(285, 302);
  drawSpeechBubble(478, 170, state.bag.length ? "Arrr... Do ya have anything ya like to sell to aye?" : "B-LA-KA! Yer bag be empty.");
  drawChoiceButton(542, 286, 106, 44, "YES"); drawChoiceButton(674, 286, 106, 44, "NO");
  drawFishInventory(492, 380); drawRipples();
}
function drawSellBanner(x, y) { ctx.save(); ctx.translate(x, y); ctx.fillStyle = "#fff4ce"; ctx.strokeStyle = "#17100a"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-78, -28); ctx.quadraticCurveTo(0, -50, 78, -28); ctx.lineTo(62, 34); ctx.quadraticCurveTo(0, 51, -62, 34); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#20130b"; ctx.font = "900 42px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText("SELL", 0, 15); ctx.beginPath(); ctx.arc(96, -4, 18, 0, Math.PI * 2); ctx.fillStyle = "#fff0a4"; ctx.fill(); ctx.stroke(); ctx.fillStyle = "#20130b"; ctx.font = "900 21px Trebuchet MS"; ctx.fillText("$", 96, 3); ctx.restore(); }
function drawChoiceButton(x, y, w, h, text) { rounded(x, y, w, h, 3, "#fffdf1", "#17100a", 4); ctx.fillStyle = "#17100a"; ctx.font = "900 22px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText(text, x + w / 2, y + 29); }
function drawPirateMerchant(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = "#14100c"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.fillStyle = "#213f57"; ctx.beginPath(); ctx.moveTo(-26, -128); ctx.lineTo(16, -128); ctx.lineTo(6, -36); ctx.lineTo(-54, -34); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f4c481"; ctx.beginPath(); ctx.roundRect(-56, -140, 72, 78, 6); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#101010"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-56, -112); ctx.lineTo(15, -92); ctx.stroke();
  ctx.fillStyle = "#101010"; ctx.beginPath(); ctx.ellipse(-31, -105, 16, 12, -0.2, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(-1, -102, 6, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "#111"; ctx.beginPath(); ctx.arc(0, -102, 3, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#2a160b"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-42, -78); ctx.quadraticCurveTo(-22, -62, 0, -80); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-35, -75); ctx.lineTo(-5, -76); ctx.stroke();
  ctx.fillStyle = "#f7f0d7"; ctx.beginPath(); ctx.moveTo(-63, -151); ctx.quadraticCurveTo(-18, -190, 28, -148); ctx.lineTo(18, -134); ctx.quadraticCurveTo(-22, -153, -56, -132); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#fff4ce"; ctx.beginPath(); ctx.arc(-18, -168, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f4c481"; ctx.beginPath(); ctx.roundRect(-74, -38, 40, 90, 8); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(-2, -40, 40, 90, 8); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f7f0d7"; ctx.beginPath(); ctx.roundRect(-78, 40, 48, 22, 4); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.roundRect(0, 40, 48, 22, 4); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#101010"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-2, -40); ctx.quadraticCurveTo(26, -92, 73, -142); ctx.stroke(); ctx.strokeStyle = "#e9eef2"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(73, -142); ctx.quadraticCurveTo(115, -186, 166, -204); ctx.stroke(); ctx.strokeStyle = "#101010"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(73, -142); ctx.quadraticCurveTo(115, -186, 166, -204); ctx.stroke();
  ctx.fillStyle = "#fff4ce"; ctx.beginPath(); ctx.arc(58, -32, 28, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#20130b"; ctx.font = "900 25px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText("$", 58, -22);
  ctx.strokeStyle = "#101010"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-64, -36); ctx.lineTo(-98, -54); ctx.lineTo(-88, -14); ctx.stroke();
  ctx.restore();
}
function drawSpeechBubble(x, y, text) { rounded(x, y, 340, 144, 2, "#fffdf1", "#17100a", 5); ctx.beginPath(); ctx.moveTo(x, y + 42); ctx.lineTo(x - 32, y + 70); ctx.lineTo(x, y + 72); ctx.closePath(); ctx.fillStyle = "#fffdf1"; ctx.fill(); ctx.strokeStyle = "#17100a"; ctx.lineWidth = 5; ctx.stroke(); ctx.fillStyle = "#17100a"; ctx.font = "900 20px Trebuchet MS"; ctx.textAlign = "left"; ctx.fillText("B-LA-KA", x + 242, y + 25); wrapText(text, x + 22, y + 58, 280, 25); }
function wrapText(text, x, y, width, gap) { const words = text.split(" "); let line = ""; for (const word of words) { const test = line + word + " "; if (ctx.measureText(test).width > width) { ctx.fillText(line, x, y); line = word + " "; y += gap; } else line = test; } ctx.fillText(line, x, y); }
function drawFishInventory(x, y) { const total = state.bag.reduce((sum, fish) => sum + fish.value, 0); rounded(x, y, 290, 56, 2, "#fffdf1", "#17100a", 4); ctx.fillStyle = "#17100a"; ctx.font = "900 16px Trebuchet MS"; ctx.textAlign = "left"; ctx.fillText(`SELL INVENTORY ${state.bag.length}/${state.bagLimit}`, x + 14, y + 23); ctx.fillText(`SELL HELD ITEM: ${total} COINS`, x + 14, y + 45); }
function drawFisherCircle() { ctx.fillStyle = "#ff5d68"; ctx.strokeStyle = "#05263d"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(142, 285, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#5a310d"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(160, 270); ctx.quadraticCurveTo(235, 220, 308, 246); ctx.stroke(); }
function drawFishSilhouettes() { for (let i = 0; i < 8; i++) drawSmallFish(330 + i * 80 + Math.sin(performance.now() / 700 + i) * 20, 420 + (i % 3) * 34 + Math.cos(performance.now() / 800 + i) * 6, 18 + (i % 3) * 4, "rgba(0,35,70,.38)"); }
function drawFishingLine() { if (!state.cast) return; const c = state.cast; ctx.strokeStyle = "rgba(255,255,255,.82)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(305, 245); ctx.lineTo(c.hookX, c.hookY); ctx.stroke(); ctx.fillStyle = c.phase === "bite" ? "#ffe36e" : "#ffffff"; ctx.strokeStyle = "#05263d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.hookX, c.hookY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); if (c.phase === "bite") { ctx.strokeStyle = rarityColors[c.fish.rarity]; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(c.hookX, c.hookY, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(c.reel, 0, 1)); ctx.stroke(); } }
function drawRipples() { for (const r of state.ripples) { ctx.globalAlpha = clamp(r.life, 0, 1); ctx.strokeStyle = r.color || "rgba(255,255,255,.65)"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(r.x, r.y, (1 - r.life) * 42 + 8, (1 - r.life) * 13 + 3, 0, 0, Math.PI * 2); ctx.stroke(); } ctx.globalAlpha = 1; }
function drawSmallFish(x, y, size, color) { ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(x, y, size, size * 0.56, 0, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.moveTo(x - size * 0.8, y); ctx.lineTo(x - size * 1.45, y - size * 0.55); ctx.lineTo(x - size * 1.25, y); ctx.lineTo(x - size * 1.45, y + size * 0.55); ctx.closePath(); ctx.fill(); }
function drawGameHud() { rounded(12, 8, 936, 46, 12, "rgba(2,35,62,.62)", "rgba(236,255,251,.65)", 2); ctx.fillStyle = "#ecfffb"; ctx.font = "900 16px Trebuchet MS"; ctx.textAlign = "left"; ctx.fillText(`COINS ${state.progress.coins}`, 28, 37); ctx.fillText(`BAG ${state.bag.length}/${state.bagLimit}`, 140, 37); ctx.fillText(`AREA ${state.mode.toUpperCase()}`, 250, 37); ctx.fillText(`ROD ${roman(state.progress.rod)}`, 370, 37); ctx.fillStyle = "#ffe36e"; ctx.fillText(state.message, 470, 37); }
function drawGameButtons() { const y = 500; drawUiButton(18, y, 104, 42, "HOME", goHome); drawUiButton(132, y, 108, 42, "RESET", resetGame); if (state.mode === "sell") { drawUiButton(604, y, 142, 42, "YES SELL", sellFish); drawUiButton(760, y, 142, 42, "NO LEAVE", exitSellShop); return; } drawUiButton(604, y, 94, 42, state.cast && state.cast.phase === "bite" ? "REEL!" : "CAST", castLine); drawUiButton(710, y, 108, 42, "SELL", sellFish); drawUiButton(830, y, 108, 42, "UPGRADE", upgradeRod); }
function drawUiButton(x, y, w, h, text, action) { buttonZones.push({ x, y, w, h, action }); rounded(x, y, w, h, 12, "#fff58e", "#05263d", 3); ctx.fillStyle = "#05263d"; ctx.font = "900 15px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText(text, x + w / 2, y + 27); }
function rounded(x, y, w, h, r, fill, stroke, line = 3) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = stroke; ctx.lineWidth = line; ctx.stroke(); }
function canvasPoint(event) { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) }; }
function loop(now) { const dt = Math.min(0.033, (now - lastTime) / 1000 || 0); lastTime = now; update(dt); draw(); requestAnimationFrame(loop); }
function joystickVector(event) { const rect = joystick.getBoundingClientRect(); const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2; const dx = event.clientX - cx, dy = event.clientY - cy; const len = Math.hypot(dx, dy), max = rect.width * 0.34, scale = len > max ? max / len : 1; joy.x = clamp(dx / max, -1, 1); joy.y = clamp(dy / max, -1, 1); joystickKnob.style.transform = `translate(calc(-50% + ${dx * scale}px), calc(-50% + ${dy * scale}px))`; }
function stopJoystick() { joy = { active: false, x: 0, y: 0 }; joystickKnob.style.transform = "translate(-50%, -50%)"; }

window.addEventListener("keydown", event => { const key = event.key.toLowerCase(); keys.add(key); if ((key === "f" || event.code === "Space") && state.running) { event.preventDefault(); castLine(); } if (state.mode === "fishing" && (key === "s" || key === "arrowdown") && !state.cast) exitFishing(); if (state.mode === "sell" && (key === "n" || key === "escape" || key === "s" || key === "arrowdown")) exitSellShop(); if (state.mode === "sell" && key === "y") sellFish(); });
window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));
canvas.addEventListener("pointerdown", event => { const point = canvasPoint(event); const ui = buttonZones.find(b => inRect(point, b.x, b.y, b.w, b.h)); if (ui) return ui.action(); if (state.mode === "sell") { if (inRect(point, 542, 286, 106, 44)) sellFish(); if (inRect(point, 674, 286, 106, 44)) exitSellShop(); return; } if (state.mode === "fishing" && state.cast && state.cast.phase === "bite") reel(); });
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
panel.classList.remove("show");
lastTime = performance.now();
requestAnimationFrame(loop);
