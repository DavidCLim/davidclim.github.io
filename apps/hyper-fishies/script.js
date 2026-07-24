const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const coinsText = document.getElementById("coinsText");
const cargoText = document.getElementById("cargoText");
const depthText = document.getElementById("depthText");
const rodText = document.getElementById("rodText");
const oxygenBar = document.getElementById("oxygenBar");
const pressureBar = document.getElementById("pressureBar");
const statusText = document.getElementById("statusText");
const panel = document.getElementById("messagePanel");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");
const castButton = document.getElementById("castButton");
const sellButton = document.getElementById("sellButton");
const upgradeButton = document.getElementById("upgradeButton");

const keys = new Set();
const saveKey = "hyperFishiesSaveV1";
let pointerTarget = null;
let lastTime = 0;
let state;

const zones = [
  { name: "SUNLIT REEF", min: 0, color: "#76eef8", fish: ["Bubblefin", "Coral Skipper", "Glass Guppy"] },
  { name: "BLUE DROP", min: 320, color: "#178bc6", fish: ["Moon Mackerel", "Lantern Minnow", "Ribbon Ray"] },
  { name: "THE ABYSS", min: 760, color: "#062b62", fish: ["Void Eel", "Prism Angler", "Shadow Tuna"] },
  { name: "MIDNIGHT TRENCH", min: 1250, color: "#02091c", fish: ["Abyss Crown", "Ghost Leviathan", "Starless Koi"] }
];

const rarities = [
  { name: "Common", color: "#d8fff9", mult: 1, chance: 52 },
  { name: "Unusual", color: "#83ffdf", mult: 1.8, chance: 28 },
  { name: "Rare", color: "#7eb6ff", mult: 3.2, chance: 14 },
  { name: "Mythic", color: "#d985ff", mult: 6, chance: 5 },
  { name: "Abyssal", color: "#ffe36e", mult: 11, chance: 1 }
];

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function loadProgress() {
  try {
    return JSON.parse(localStorage.getItem(saveKey)) || { coins: 0, rod: 1, tank: 1, hull: 1, bestDepth: 0, collection: {} };
  } catch {
    return { coins: 0, rod: 1, tank: 1, hull: 1, bestDepth: 0, collection: {} };
  }
}

function saveProgress() {
  localStorage.setItem(saveKey, JSON.stringify(state.progress));
}

function freshState() {
  const progress = loadProgress();
  return {
    running: false,
    depth: 0,
    oxygen: 100,
    pressure: 0,
    cargo: [],
    cargoLimit: 4 + progress.rod,
    cast: null,
    biteTimer: 0,
    catchFlash: 0,
    player: { x: 160, y: 120, r: 22, vx: 0, vy: 0, face: 1 },
    schools: [],
    predators: [],
    bubbles: [],
    particles: [],
    progress
  };
}

function resetRun() {
  const progress = state ? state.progress : loadProgress();
  state = freshState();
  state.progress = progress;
  state.depth = 0;
  buildSea();
  updateHud();
  showMessage("HYPER FISHIES", "Dive, cast near fish schools, sell catches at the surface, and upgrade to reach the abyss.", "START DIVE");
}

function startRun() {
  panel.classList.remove("show");
  state.running = true;
  lastTime = performance.now();
  say("Dive deeper for rarer fish. Return to 0m to sell safely.");
}

function buildSea() {
  state.schools = Array.from({ length: 14 }, (_, i) => makeSchool(i));
  state.predators = Array.from({ length: 5 }, (_, i) => makePredator(i));
  state.bubbles = Array.from({ length: 9 }, () => makeBubble());
}

function makeSchool(i) {
  const depth = rand(40, 1580);
  const zone = zoneFor(depth);
  return {
    x: rand(110, canvas.width - 80),
    depth,
    y: worldToScreen(depth),
    size: rand(14, 26),
    sway: rand(0, Math.PI * 2),
    hue: 170 + i * 23,
    zone
  };
}

function makePredator(i) {
  return {
    x: rand(120, canvas.width - 70),
    depth: rand(500, 1650),
    size: rand(30, 46),
    vx: rand(-55, 55) || 35,
    phase: i,
    bite: 0
  };
}

function makeBubble() {
  return { x: rand(60, canvas.width - 60), depth: rand(20, 1500), r: rand(9, 16), drift: rand(0, Math.PI * 2) };
}

function zoneFor(depth) {
  return zones.reduce((found, zone) => depth >= zone.min ? zone : found, zones[0]);
}

function worldToScreen(depth) {
  return 150 + (depth - state.depth) * 0.55;
}

function showMessage(title, text, buttonText) {
  panel.querySelector("h1").textContent = title;
  panel.querySelector("p").textContent = text;
  startButton.textContent = buttonText;
  panel.classList.add("show");
}

function say(text) {
  statusText.textContent = text;
}

function updateHud() {
  coinsText.textContent = state.progress.coins;
  cargoText.textContent = `${state.cargo.length}/${state.cargoLimit}`;
  depthText.textContent = `${Math.round(state.depth)}m`;
  rodText.textContent = roman(state.progress.rod);
  oxygenBar.style.width = `${clamp(state.oxygen, 0, 100)}%`;
  pressureBar.style.width = `${clamp(state.pressure, 0, 100)}%`;

  const atSurface = state.depth < 35;
  sellButton.disabled = !atSurface || state.cargo.length === 0;
  upgradeButton.disabled = !atSurface;
  castButton.disabled = !!state.cast || state.cargo.length >= state.cargoLimit;
}

function roman(value) {
  return ["0", "I", "II", "III", "IV", "V", "VI"][value] || String(value);
}

function update(dt) {
  if (!state.running) return;
  movePlayer(dt);
  updateDepth(dt);
  updateOxygenAndPressure(dt);
  updateBubbles(dt);
  updatePredators(dt);
  updateCast(dt);
  updateParticles(dt);

  state.progress.bestDepth = Math.max(state.progress.bestDepth, Math.round(state.depth));
  state.catchFlash = Math.max(0, state.catchFlash - dt);

  if (state.oxygen <= 0 || state.pressure >= 100) {
    emergencySurface();
  }

  updateHud();
}

function movePlayer(dt) {
  const p = state.player;
  let ax = 0;
  let ay = 0;
  if (keys.has("arrowleft") || keys.has("a")) ax -= 1;
  if (keys.has("arrowright") || keys.has("d")) ax += 1;
  if (keys.has("arrowup") || keys.has("w")) ay -= 1;
  if (keys.has("arrowdown") || keys.has("s")) ay += 1;

  if (pointerTarget) {
    const dx = pointerTarget.x - p.x;
    const dy = pointerTarget.y - p.y;
    const mag = Math.hypot(dx, dy) || 1;
    ax += dx / mag;
    ay += dy / mag;
  }

  const mag = Math.hypot(ax, ay) || 1;
  ax /= mag;
  ay /= mag;
  p.vx += ax * 380 * dt;
  p.vy += ay * 360 * dt;
  p.vx *= Math.pow(0.1, dt);
  p.vy *= Math.pow(0.1, dt);
  p.x = clamp(p.x + p.vx * dt, p.r, canvas.width - p.r);
  p.y = clamp(p.y + p.vy * dt, 64, canvas.height - 64);
  if (Math.abs(p.vx) > 14) p.face = Math.sign(p.vx);
}

function updateDepth(dt) {
  const p = state.player;
  const desiredDepthChange = (p.y - 145) * 0.7;
  state.depth = clamp(state.depth + desiredDepthChange * dt, 0, maxDepth());
}

function maxDepth() {
  return 450 + state.progress.hull * 360;
}

function updateOxygenAndPressure(dt) {
  const tankBonus = state.progress.tank * 0.32;
  const drain = 2.1 + state.depth / 620 - tankBonus;
  state.oxygen = clamp(state.oxygen - Math.max(0.7, drain) * dt, 0, 100);
  if (state.depth < 45) state.oxygen = clamp(state.oxygen + 18 * dt, 0, 100);

  const safeDepth = 260 + state.progress.hull * 300;
  const targetPressure = clamp(((state.depth - safeDepth) / 520) * 100, 0, 100);
  state.pressure += (targetPressure - state.pressure) * Math.min(1, dt * 2.2);
}

function updateBubbles(dt) {
  for (const bubble of state.bubbles) {
    bubble.depth -= 24 * dt;
    if (bubble.depth < state.depth - 160) Object.assign(bubble, makeBubble(), { depth: state.depth + rand(140, 760) });
    const screen = { x: bubble.x + Math.sin(performance.now() / 500 + bubble.drift) * 8, y: worldToScreen(bubble.depth) };
    if (screen.y > -20 && screen.y < canvas.height + 20 && distance(state.player, screen) < state.player.r + bubble.r) {
      state.oxygen = clamp(state.oxygen + 13, 0, 100);
      burst(screen.x, screen.y, "#c9fff8", 8);
      Object.assign(bubble, makeBubble(), { depth: state.depth + rand(120, 700) });
    }
  }
}

function updatePredators(dt) {
  for (const predator of state.predators) {
    predator.x += predator.vx * dt;
    predator.bite = Math.max(0, predator.bite - dt);
    if (predator.x < predator.size || predator.x > canvas.width - predator.size) predator.vx *= -1;
    if (predator.depth < state.depth - 260) Object.assign(predator, makePredator(0), { depth: state.depth + rand(400, 850) });
    const screen = { x: predator.x, y: worldToScreen(predator.depth) };
    if (screen.y > -60 && screen.y < canvas.height + 60 && distance(state.player, screen) < state.player.r + predator.size && predator.bite <= 0) {
      predator.bite = 1.2;
      state.oxygen = Math.max(0, state.oxygen - 16);
      state.pressure = clamp(state.pressure + 8, 0, 100);
      burst(state.player.x, state.player.y, "#ff7d87", 14);
      say("A deep creature hit your tank. Get away or surface.");
    }
  }
}

function castLine() {
  if (!state.running || state.cast || state.cargo.length >= state.cargoLimit) return;
  state.cast = { x: state.player.x + state.player.face * 42, y: state.player.y, progress: 0, phase: "seeking", target: null, reel: 0 };
  state.biteTimer = rand(0.8, 1.8) / (1 + state.progress.rod * 0.08);
  say("Line cast. Hold steady near a fish school...");
}

function updateCast(dt) {
  if (!state.cast) return;
  const cast = state.cast;
  cast.progress += dt;
  cast.y += Math.sin(performance.now() / 240) * 0.18;

  if (cast.phase === "seeking") {
    state.biteTimer -= dt;
    let closest = null;
    let closestDist = Infinity;
    for (const school of state.schools) {
      const screen = { x: school.x, y: worldToScreen(school.depth) };
      const d = distance(cast, screen);
      if (d < closestDist) {
        closest = school;
        closestDist = d;
      }
    }
    if (state.biteTimer <= 0 && closest && closestDist < 145) {
      cast.phase = "reeling";
      cast.target = closest;
      cast.reel = 0;
      say("BITE! Tap CAST or press F/SPACE to reel before it escapes.");
    } else if (cast.progress > 4) {
      state.cast = null;
      say("Nothing bit. Move closer to a school and cast again.");
    }
  } else if (cast.phase === "reeling") {
    cast.reel -= (0.22 + cast.target.depth / 3600) * dt;
    if (cast.reel <= -1) {
      state.cast = null;
      say("The fish escaped into the dark.");
    }
  }
}

function reel() {
  if (!state.cast || state.cast.phase !== "reeling") {
    castLine();
    return;
  }
  const cast = state.cast;
  cast.reel += 0.28 + state.progress.rod * 0.055;
  if (cast.reel >= 1) catchFish(cast.target);
}

function catchFish(school) {
  const zone = zoneFor(school.depth);
  const rarity = rollRarity(school.depth);
  const name = zone.fish[Math.floor(rand(0, zone.fish.length))];
  const value = Math.round((18 + school.depth / 18) * rarity.mult);
  state.cargo.push({ name, rarity: rarity.name, value, color: rarity.color });
  state.progress.collection[`${rarity.name} ${name}`] = true;
  state.catchFlash = 1;
  burst(school.x, worldToScreen(school.depth), rarity.color, 20);
  Object.assign(school, makeSchool(0), { depth: state.depth + rand(120, 760) });
  state.cast = null;
  saveProgress();
  say(`Caught ${rarity.name} ${name}! Worth ${value} coins.`);
}

function rollRarity(depth) {
  const abyssBonus = Math.min(18, depth / 90);
  let roll = rand(0, 100);
  for (let i = rarities.length - 1; i >= 0; i--) {
    const rarity = rarities[i];
    const boost = i >= 2 ? abyssBonus : 0;
    if (roll < rarity.chance + boost) return rarity;
    roll -= rarity.chance;
  }
  return rarities[0];
}

function sellCargo() {
  if (state.depth >= 35 || state.cargo.length === 0) return;
  const total = state.cargo.reduce((sum, fish) => sum + fish.value, 0);
  state.progress.coins += total;
  state.cargo = [];
  saveProgress();
  say(`Sold your catch for ${total} coins.`);
  updateHud();
}

function buyUpgrade() {
  if (state.depth >= 35) return;
  const rodCost = state.progress.rod * 120;
  const tankCost = state.progress.tank * 100;
  const hullCost = state.progress.hull * 150;
  const options = [
    { key: "rod", cost: rodCost, label: "Rod" },
    { key: "tank", cost: tankCost, label: "Oxygen Tank" },
    { key: "hull", cost: hullCost, label: "Pressure Suit" }
  ].sort((a, b) => a.cost - b.cost);
  const upgrade = options.find(option => state.progress.coins >= option.cost);
  if (!upgrade) {
    say(`Need ${options[0].cost} coins for the cheapest upgrade.`);
    return;
  }
  state.progress.coins -= upgrade.cost;
  state.progress[upgrade.key] += 1;
  state.cargoLimit = 4 + state.progress.rod;
  saveProgress();
  say(`${upgrade.label} upgraded for ${upgrade.cost} coins.`);
  updateHud();
}

function emergencySurface() {
  state.running = false;
  state.depth = 0;
  state.oxygen = 100;
  state.pressure = 0;
  state.cast = null;
  saveProgress();
  showMessage("EMERGENCY SURFACE", "The abyss forced you back up. Sell your cargo, upgrade, and dive again.", "DIVE AGAIN");
}

function updateParticles(dt) {
  state.particles = state.particles.filter(p => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return p.life > 0;
  });
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(45, 170);
    state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(2, 5), color, life: rand(0.35, 0.85) });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawSea();
  state.bubbles.forEach(drawBubble);
  state.schools.forEach(drawSchool);
  state.predators.forEach(drawPredator);
  drawCast();
  drawPlayer();
  state.particles.forEach(drawParticle);
  drawDepthLabels();
}

function drawSea() {
  const zone = zoneFor(state.depth);
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, zone.color);
  bg.addColorStop(0.55, state.depth > 700 ? "#03153b" : "#08679e");
  bg.addColorStop(1, state.depth > 1100 ? "#000612" : "#032a5a");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = `rgba(255,255,255,${state.depth > 900 ? 0.06 : 0.15})`;
  for (let i = 0; i < 18; i++) {
    const x = (i * 139 + performance.now() * 0.015) % (canvas.width + 90) - 45;
    const y = 35 + (i * 47 + state.depth * 0.15) % (canvas.height - 80);
    ctx.beginPath();
    ctx.ellipse(x, y, 44, 8, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  if (state.depth < 120) {
    ctx.fillStyle = "#d6ad64";
    ctx.fillRect(0, canvas.height - 42, canvas.width, 42);
  }

  if (state.depth > 850) {
    ctx.fillStyle = `rgba(0,0,0,${clamp((state.depth - 850) / 900, 0, .55)})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}

function drawDepthLabels() {
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.font = "900 18px Trebuchet MS";
  ctx.fillText(`${zoneFor(state.depth).name}  |  BEST ${state.progress.bestDepth}m`, 18, 32);
  if (state.cargo.length) {
    const latest = state.cargo[state.cargo.length - 1];
    ctx.fillStyle = latest.color;
    ctx.fillText(`${latest.rarity} ${latest.name}`, 18, 56);
  }
}

function drawPlayer() {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.face, 1);
  ctx.fillStyle = state.catchFlash > 0 ? "#ffe36e" : "#ff7d87";
  ctx.strokeStyle = "#05263d";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(0, 0, 30, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-27, 0);
  ctx.lineTo(-52, -18);
  ctx.lineTo(-45, 0);
  ctx.lineTo(-52, 18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(12, -7, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawSchool(school) {
  const y = worldToScreen(school.depth) + Math.sin(performance.now() / 420 + school.sway) * 5;
  if (y < -40 || y > canvas.height + 40) return;
  ctx.save();
  ctx.translate(school.x, y);
  for (let i = 0; i < 5; i++) {
    const ox = Math.cos(i * 1.4 + school.sway) * 24;
    const oy = Math.sin(i * 1.2 + school.sway) * 15;
    drawSmallFish(ox, oy, school.size * 0.65, `hsl(${school.hue + i * 12} 88% 65%)`);
  }
  ctx.restore();
}

function drawSmallFish(x, y, size, color) {
  ctx.fillStyle = color;
  ctx.strokeStyle = "#05263d";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y, size, size * 0.62, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x - size * 0.75, y);
  ctx.lineTo(x - size * 1.55, y - size * 0.55);
  ctx.lineTo(x - size * 1.35, y);
  ctx.lineTo(x - size * 1.55, y + size * 0.55);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawBubble(bubble) {
  const x = bubble.x + Math.sin(performance.now() / 500 + bubble.drift) * 8;
  const y = worldToScreen(bubble.depth);
  if (y < -20 || y > canvas.height + 20) return;
  ctx.strokeStyle = "rgba(232,255,255,.85)";
  ctx.lineWidth = 3;
  ctx.fillStyle = "rgba(207,255,250,.16)";
  ctx.beginPath();
  ctx.arc(x, y, bubble.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawPredator(predator) {
  const y = worldToScreen(predator.depth) + Math.sin(performance.now() / 360 + predator.phase) * 8;
  if (y < -70 || y > canvas.height + 70) return;
  ctx.save();
  ctx.translate(predator.x, y);
  ctx.scale(Math.sign(predator.vx), 1);
  ctx.fillStyle = predator.bite > 0 ? "#ff5d68" : "#18203f";
  ctx.strokeStyle = "#97f7ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, predator.size * 1.25, predator.size * 0.58, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-predator.size, 0);
  ctx.lineTo(-predator.size * 1.9, -predator.size * 0.6);
  ctx.lineTo(-predator.size * 1.55, 0);
  ctx.lineTo(-predator.size * 1.9, predator.size * 0.6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe36e";
  ctx.beginPath();
  ctx.arc(predator.size * 0.48, -predator.size * 0.14, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawCast() {
  if (!state.cast) return;
  const cast = state.cast;
  ctx.strokeStyle = "rgba(255,255,255,.8)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(state.player.x, state.player.y);
  ctx.lineTo(cast.x, cast.y);
  ctx.stroke();
  ctx.fillStyle = cast.phase === "reeling" ? "#ffe36e" : "#ecfffb";
  ctx.beginPath();
  ctx.arc(cast.x, cast.y, 8, 0, Math.PI * 2);
  ctx.fill();
  if (cast.phase === "reeling") {
    ctx.strokeStyle = "#ffe36e";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cast.x, cast.y, 25, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp((cast.reel + 1) / 2, 0, 1));
    ctx.stroke();
  }
}

function drawParticle(particle) {
  ctx.globalAlpha = clamp(particle.life, 0, 1);
  ctx.fillStyle = particle.color;
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function loop(now) {
  const dt = Math.min(0.033, (now - lastTime) / 1000 || 0);
  lastTime = now;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

function canvasPoint(event) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * canvas.width,
    y: ((event.clientY - rect.top) / rect.height) * canvas.height
  };
}

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  keys.add(key);
  if (key === "f" || event.code === "Space") {
    event.preventDefault();
    reel();
  }
});
window.addEventListener("keyup", event => keys.delete(event.key.toLowerCase()));

canvas.addEventListener("pointerdown", event => {
  pointerTarget = canvasPoint(event);
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", event => {
  if (event.buttons) pointerTarget = canvasPoint(event);
});
canvas.addEventListener("pointerup", () => { pointerTarget = null; });
canvas.addEventListener("pointercancel", () => { pointerTarget = null; });

startButton.addEventListener("click", startRun);
restartButton.addEventListener("click", resetRun);
castButton.addEventListener("click", reel);
sellButton.addEventListener("click", sellCargo);
upgradeButton.addEventListener("click", buyUpgrade);

state = freshState();
resetRun();
requestAnimationFrame(loop);
