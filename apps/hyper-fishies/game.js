// Hyper Fishies base engine. Later polish files build on these globals.
var canvas = document.getElementById("gameCanvas");
var ctx = canvas.getContext("2d");
var W = canvas.width;
var H = canvas.height;
var buttonZones = [];
var particles = [];
var keys = {};
var lastTime = performance.now();

var rarityWeights = {
  Common: 42,
  Rare: 24,
  Epic: 14,
  Legendary: 7,
  Mythical: 3.8,
  Extinct: 2,
  Gargantuan: 1,
  Abyss: 0.55,
  Abyssal: 0.55,
  "???": 0.16
};

var rarityColors = {
  Common: "#dff8ff",
  Rare: "#62d8ff",
  Epic: "#b985ff",
  Legendary: "#ffe36e",
  Mythical: "#ff70c9",
  Extinct: "#ff8a52",
  Gargantuan: "#99ff72",
  Abyss: "#516cff",
  Abyssal: "#516cff",
  "???": "#ffffff"
};

var fishTypes = [
  { name: "Clownfish", rarity: "Common", value: 14, color: "#ff9b42", design: "clown" },
  { name: "Angel Fish", rarity: "Common", value: 16, color: "#ffe070", design: "angel" },
  { name: "Starfish", rarity: "Rare", value: 28, color: "#ffb84d", design: "star" },
  { name: "Sailfish", rarity: "Rare", value: 35, color: "#79d9ff", design: "sail" },
  { name: "Squid", rarity: "Epic", value: 52, color: "#a68cff", design: "squid" },
  { name: "Asterfish", rarity: "Epic", value: 60, color: "#83f0ff", design: "aster" },
  { name: "Swordfish", rarity: "Legendary", value: 90, color: "#bfeeff", design: "sword" },
  { name: "Shark", rarity: "Legendary", value: 110, color: "#9db7c8", design: "shark" },
  { name: "More Fish", rarity: "Mythical", value: 150, color: "#ff7fe0", design: "more" },
  { name: "Stone Fish", rarity: "Mythical", value: 170, color: "#8f9b95", design: "stone" },
  { name: "Lost Treasure", rarity: "Extinct", value: 250, color: "#f7b64b", design: "treasure" },
  { name: "Ancient Whale", rarity: "Gargantuan", value: 420, color: "#7ee7ff", design: "whale" },
  { name: "Abyss Eel", rarity: "Abyssal", value: 620, color: "#4c56ff", design: "eel" },
  { name: "Void Fish", rarity: "???", value: 1100, color: "#f7f7ff", design: "void" }
];

var rods = [
  { id: 0, name: "Starter Rod", price: 0, luck: 1, control: 1, glow: "#8eeaff", color: "#315cbd" },
  { id: 1, name: "Bluefin Rod", price: 90, luck: 1.25, control: 1.1, glow: "#45d7ff", color: "#25b9ff" },
  { id: 2, name: "Coral Rod", price: 220, luck: 1.55, control: 1.25, glow: "#ff8b76", color: "#ff7d74" },
  { id: 3, name: "Storm Rod", price: 520, luck: 2, control: 1.55, glow: "#a68cff", color: "#8d7bff" },
  { id: 4, name: "Abyss Rod", price: 1150, luck: 2.8, control: 2, glow: "#5367ff", color: "#1d2eff" },
  { id: 5, name: "??? Rod", price: 2350, luck: 4, control: 2.7, glow: "#ffffff", color: "#f8f8ff" }
];

var state = {
  mode: "home",
  previousMode: "",
  progress: { coins: 0, caught: {}, bestFish: "None", ownedRods: [0], rod: 0 },
  coins: 0,
  bag: [],
  bagLimit: 24,
  latest: "None",
  player: { x: 480, y: 300, vx: 0, vy: 0, dir: 1 },
  walkFrame: 0,
  castPower: null,
  cast: null,
  catchReveal: null,
  message: "Welcome to Hyper Fishies."
};

try {
  var saved = JSON.parse(localStorage.getItem("hyperFishiesSave") || "{}");
  if (saved.progress) state.progress = Object.assign(state.progress, saved.progress);
  if (Array.isArray(saved.bag)) state.bag = saved.bag;
  state.latest = state.progress.bestFish || "None";
} catch (error) {}

function saveGame() {
  localStorage.setItem("hyperFishiesSave", JSON.stringify({ progress: state.progress, bag: state.bag }));
}

function rand(a, b) { return a + Math.random() * (b - a); }
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function say(message) { state.message = message; }
function currentRod() { return rods[state.progress.rod] || rods[0]; }
function inRect(point, x, y, w, h) { return point.x >= x && point.x <= x + w && point.y >= y && point.y <= y + h; }
function canvasPoint(event) {
  var rect = canvas.getBoundingClientRect();
  return { x: (event.clientX - rect.left) * W / rect.width, y: (event.clientY - rect.top) * H / rect.height };
}

function rounded(x, y, w, h, r, fill, stroke, line) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r || 8);
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = line || 3;
    ctx.stroke();
  }
}

function writeText(text, x, y, size, color, align, weight) {
  ctx.fillStyle = color || "#fff";
  ctx.font = `${weight || 900} ${size}px Trebuchet MS, Arial`;
  ctx.textAlign = align || "center";
  ctx.fillText(text, x, y);
}

function drawUiButton(x, y, w, h, label, action) {
  rounded(x, y, w, h, 14, "rgba(255,238,154,.95)", "#06334b", 4);
  writeText(label, x + w / 2, y + h / 2 + 7, 17, "#06334b");
  buttonZones.push({ x, y, w, h, action, label });
}

function drawTopWater() {
  var g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, "#5fd7ff");
  g.addColorStop(.48, "#0877a8");
  g.addColorStop(1, "#022f50");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  for (var i = 0; i < 26; i++) {
    var x = (i * 137 + performance.now() / (35 + i)) % (W + 70) - 35;
    var y = 25 + (i * 67) % 430;
    ctx.globalAlpha = .1 + (i % 5) * .03;
    ctx.fillStyle = "#e8ffff";
    ctx.beginPath();
    ctx.arc(x, y, 4 + (i % 4), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawFishDesign(type, x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale || 1, scale || 1);
  ctx.fillStyle = color || "#8eeaff";
  ctx.strokeStyle = "#062638";
  ctx.lineWidth = 5;
  if (type === "star") {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + i * Math.PI / 5;
      var r = i % 2 ? 22 : 48;
      ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (type === "squid") {
    ctx.beginPath(); ctx.ellipse(0, -12, 28, 48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (var j = -2; j <= 2; j++) { ctx.beginPath(); ctx.moveTo(j * 10, 28); ctx.quadraticCurveTo(j * 15, 62, j * 4, 82); ctx.stroke(); }
  } else if (type === "treasure") {
    rounded(-45, -25, 90, 55, 8, "#b8783d", "#062638", 5);
    ctx.fillStyle = "#ffd95c"; ctx.fillRect(-35, 0, 70, 10);
  } else if (type === "whale") {
    ctx.beginPath(); ctx.ellipse(0, 0, 76, 38, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(118, -30); ctx.lineTo(105, 0); ctx.lineTo(118, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
  } else if (type === "eel" || type === "void") {
    ctx.beginPath(); ctx.moveTo(-70, 10); ctx.quadraticCurveTo(-20, -55, 35, -10); ctx.quadraticCurveTo(70, 20, 20, 40); ctx.quadraticCurveTo(-30, 55, -70, 10); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.ellipse(0, 0, 48, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(43, 0); ctx.lineTo(82, -26); ctx.lineTo(73, 0); ctx.lineTo(82, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (type === "clown") {
      ctx.strokeStyle = "#fff"; ctx.lineWidth = 9;
      ctx.beginPath(); ctx.moveTo(-22, -20); ctx.lineTo(-10, 20); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(18, -22); ctx.lineTo(27, 20); ctx.stroke();
    }
    if (type === "shark") { ctx.fillStyle = "#062638"; ctx.beginPath(); ctx.moveTo(5, -25); ctx.lineTo(25, -58); ctx.lineTo(31, -21); ctx.closePath(); ctx.fill(); }
    if (type === "sword" || type === "sail") { ctx.strokeStyle = "#062638"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-48, 0); ctx.lineTo(-94, -3); ctx.stroke(); }
  }
  ctx.restore();
}

function makeRipple(x, y) { particles.push({ x, y, life: .45, color: "#eaffff", type: "ring" }); }
function burst(x, y, color, count) {
  for (var i = 0; i < (count || 14); i++) particles.push({ x, y, vx: rand(-90, 90), vy: rand(-90, 40), life: rand(.35, .8), color: color || "#fff", type: "dot" });
}
function updateParticles(dt) {
  particles.forEach(function(p) { p.life -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; });
  particles = particles.filter(function(p) { return p.life > 0; });
}
function drawParticles() {
  particles.forEach(function(p) {
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.strokeStyle = p.color; ctx.fillStyle = p.color;
    if (p.type === "ring") { ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, (1 - p.life) * 35, 0, Math.PI * 2); ctx.stroke(); }
    else { ctx.beginPath(); ctx.arc(p.x, p.y, 4, 0, Math.PI * 2); ctx.fill(); }
  });
  ctx.globalAlpha = 1;
}

function rollFish() {
  var rod = currentRod();
  var total = 0;
  var table = fishTypes.map(function(fish) {
    var weight = rarityWeights[fish.rarity] || 1;
    if (fish.rarity !== "Common") weight *= 1 + (rod.luck - 1) * .65;
    total += weight;
    return { fish: fish, weight: weight };
  });
  var roll = rand(0, total);
  for (var i = 0; i < table.length; i++) { roll -= table[i].weight; if (roll <= 0) return table[i].fish; }
  return fishTypes[0];
}

function castLine() {
  if (state.cast && state.cast.phase === "bite") return reel();
  if (state.cast || state.castPower) return;
  state.castPower = { phase: "distance", power: 0, dir: 1, distance: 0 };
  say("CAST FOR DISTANCE: tap the screen at the strongest point.");
}

function stopCastBar() {
  if (!state.castPower) return;
  if (state.castPower.phase === "distance") {
    state.castPower.distance = state.castPower.power;
    state.castPower.phase = "luck";
    state.castPower.power = 0;
    state.castPower.dir = 1;
    say("CAST FOR LUCK: tap near the glow.");
  } else {
    var reach = 220 + state.castPower.distance * 430;
    var luck = 1 - Math.abs(state.castPower.power - .72);
    state.castPower = null;
    state.cast = { phase: "fly", hookX: 278, hookY: 190, vx: reach, vy: -190 - luck * 60, waterY: 338 + rand(-16, 22), luck: luck, reel: 0, timer: 0 };
    say("Nice cast. Wait for a bite.");
  }
}

function updateFishing(dt) {
  if (state.castPower) {
    state.castPower.power += state.castPower.dir * dt * 1.55;
    if (state.castPower.power >= 1) { state.castPower.power = 1; state.castPower.dir = -1; }
    if (state.castPower.power <= 0) { state.castPower.power = 0; state.castPower.dir = 1; }
    return;
  }
  var c = state.cast;
  if (!c) return;
  if (c.phase === "fly") {
    c.hookX += c.vx * dt; c.hookY += c.vy * dt; c.vy += 520 * dt;
    if (c.hookY >= c.waterY) { c.hookY = c.waterY; c.phase = "waiting"; c.biteIn = rand(.65, 1.8); makeRipple(c.hookX, c.hookY); }
  } else if (c.phase === "waiting") {
    c.biteIn -= dt * (1 + currentRod().luck * .05);
    if (c.biteIn <= 0) { c.phase = "bite"; c.reel = .4; c.fish = rollFish(); say(`${c.fish.rarity.toUpperCase()} BITE! Tap anywhere to reel!`); }
  } else if (c.phase === "bite") {
    c.reel -= (.08 + c.fish.value / 5500 - currentRod().control * .018) * dt;
    if (c.reel <= 0) { state.cast = null; say("The fish escaped."); }
  }
}

function reel() {
  if (!state.cast || state.cast.phase !== "bite") return;
  state.cast.reel = Math.min(1, state.cast.reel + .22 + currentRod().control * .05);
  makeRipple(state.cast.hookX, state.cast.hookY);
  if (state.cast.reel >= 1) catchFish(state.cast.fish);
}

function catchFish(fish) {
  var value = Math.round(fish.value * (1 + currentRod().luck * .08) * rand(.95, 1.35));
  var caught = Object.assign({}, fish, { value: value });
  state.bag.push(caught);
  state.latest = `${fish.rarity} ${fish.name}`;
  state.progress.bestFish = state.latest;
  state.progress.caught[fish.name] = (state.progress.caught[fish.name] || 0) + 1;
  state.catchReveal = { fish: caught, life: 2.4, age: 0 };
  burst(state.cast ? state.cast.hookX : 480, state.cast ? state.cast.hookY : 330, rarityColors[fish.rarity] || "#fff", 24);
  state.cast = null;
  saveGame();
  say(`Caught ${fish.rarity} ${fish.name}! Value: ${value} coins.`);
}

function sellFish() {
  var value = state.bag.reduce(function(sum, fish) { return sum + (fish.value || 0); }, 0);
  state.progress.coins += value;
  state.bag = [];
  saveGame();
  say(value ? `Sold fish for ${value} coins.` : "No fish to sell yet.");
}

function drawFisherCircle() {
  ctx.save(); ctx.translate(145, 293); ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(0, 40, 28, 8, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#10202c"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-9, 15); ctx.lineTo(-20, 44); ctx.stroke(); ctx.beginPath(); ctx.moveTo(9, 15); ctx.lineTo(21, 44); ctx.stroke();
  rounded(-20, -18, 40, 44, 15, "#f4c94d", "#10202c", 5);
  ctx.fillStyle = "#2f75a8"; ctx.beginPath(); ctx.moveTo(-16, -10); ctx.lineTo(0, 21); ctx.lineTo(16, -10); ctx.lineTo(13, 20); ctx.quadraticCurveTo(0, 29, -13, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#10202c"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-15, -5); ctx.lineTo(-32, 9); ctx.stroke(); ctx.beginPath(); ctx.moveTo(15, -5); ctx.lineTo(35, -6); ctx.stroke();
  ctx.fillStyle = "#f3c99b"; ctx.strokeStyle = "#10202c"; ctx.lineWidth = 4; ctx.beginPath(); ctx.ellipse(0, -43, 22, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#275f88"; ctx.beginPath(); ctx.ellipse(0, -62, 22, 9, 0, Math.PI, 0); ctx.lineTo(19, -51); ctx.quadraticCurveTo(0, -44, -19, -51); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.restore();
}

function drawFishingLine() {
  if (!state.cast) return;
  var c = state.cast;
  ctx.strokeStyle = "rgba(236,255,251,.88)"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(278, 190); ctx.quadraticCurveTo((278 + c.hookX) / 2, 150, c.hookX, c.hookY); ctx.stroke();
  ctx.fillStyle = c.phase === "bite" ? "#ffe36e" : "#fff"; ctx.strokeStyle = "#05263d"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.hookX, c.hookY, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  if (c.phase === "bite") { ctx.strokeStyle = rarityColors[c.fish.rarity] || "#ecfffb"; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(c.hookX, c.hookY, 28, -Math.PI/2, -Math.PI/2 + Math.PI * 2 * clamp(c.reel, 0, 1)); ctx.stroke(); }
}

function drawGameButtons() {
  if (state.mode === "home") {
    drawUiButton(365, 265, 230, 54, "PLAY", function() { state.mode = "dock"; say("Walk to the top fishing dock, left sell shop, or right rod shop."); });
    drawUiButton(365, 332, 230, 54, "CREDITS", function() { state.mode = "credits"; });
  } else if (state.mode === "dock") {
    drawUiButton(24, 482, 130, 40, "BAG", function() { state.mode = "inventory"; });
  } else if (state.mode === "fishing") {
    drawUiButton(24, 482, 130, 40, "BACK", function() { state.mode = "dock"; state.cast = null; state.castPower = null; });
    drawUiButton(400, 482, 160, 40, "CAST", castLine);
  }
}

function drawSavingIcon() {}

function update(dt) {
  updateFishing(dt);
  updateParticles(dt);
}

function draw() {
  buttonZones.length = 0;
  ctx.clearRect(0, 0, W, H);
  drawTopWater();
  if (state.mode === "home") {
    rounded(190, 56, 580, 420, 28, "rgba(5,63,93,.72)", "#dff8ff", 5);
    writeText("HYPER", 480, 165, 70, "#ffe36e");
    writeText("FISHIES", 480, 225, 44, "#effcff", "center", 500);
    writeText(`Coins: ${state.progress.coins}  |  Best: ${state.progress.bestFish}`, 480, 430, 18, "#dff8ff");
  } else if (state.mode === "fishing") {
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(0, 318, W, 4);
    drawFisherCircle();
    drawFishingLine();
    if (state.castPower) {
      var label = state.castPower.phase === "distance" ? "CAST FOR DISTANCE" : "CAST FOR LUCK";
      writeText(label, 480, 118, 24, "#ffe36e");
      rounded(250, 138, 460, 30, 15, "#073852", "#dff8ff", 3);
      rounded(254, 142, 452 * state.castPower.power, 22, 11, state.castPower.phase === "distance" ? "#55d8ff" : "#ffe36e", null);
    }
    if (state.cast && state.cast.phase === "bite") writeText("BITE! TAP ANYWHERE TO REEL!", 480, 92, 26, "#ffe36e");
  } else {
    rounded(120, 165, 720, 250, 22, "#b5793f", "#573313", 7);
    rounded(375, 64, 210, 120, 16, "#b5793f", "#573313", 7);
    writeText("FISHING BANK", 480, 118, 22, "#fff3ba");
    writeText("SELL", 110, 282, 25, "#fff3ba");
    writeText("RODS", 850, 282, 25, "#fff3ba");
  }
  rounded(18, 16, 260, 72, 18, "rgba(4,44,68,.75)", "#dff8ff", 3);
  writeText(`COINS ${state.progress.coins}`, 38, 44, 18, "#ffe36e", "left");
  writeText(`ROD ${currentRod().name}`, 38, 70, 15, "#eaffff", "left", 800);
  rounded(300, 16, 360, 42, 18, "rgba(4,44,68,.65)", "#dff8ff", 3);
  writeText(state.message, 480, 43, 15, "#eaffff", "center", 800);
  drawParticles();
  drawGameButtons();
}

function handlePointer(event) {
  var p = canvasPoint(event);
  if (state.castPower) { stopCastBar(); return; }
  if (state.cast && state.cast.phase === "bite") { reel(); return; }
  var hit = buttonZones.find(function(b) { return inRect(p, b.x, b.y, b.w, b.h); });
  if (hit && hit.action) hit.action();
}
canvas.addEventListener("pointerdown", handlePointer);
window.addEventListener("keydown", function(e) { keys[e.key] = true; keys[e.key.toLowerCase()] = true; });
window.addEventListener("keyup", function(e) { keys[e.key] = false; keys[e.key.toLowerCase()] = false; });

function loop(now) {
  var dt = Math.min(.033, (now - lastTime) / 1000);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
