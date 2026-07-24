const canvas = document.querySelector("#game");
const ctx = canvas.getContext("2d");
const scoreEl = document.querySelector("#score");
const pearlsEl = document.querySelector("#pearls");
const timerEl = document.querySelector("#timer");
const statusEl = document.querySelector("#status");
const card = document.querySelector("#message-card");
const titleEl = document.querySelector("#message-title");
const messageEl = document.querySelector("#message");
const startButton = document.querySelector("#start-game");
const newGameButton = document.querySelector("#new-game");
const keys = new Set();
const fish = { x: 150, y: 280, vx: 0, vy: 0, r: 26 };
let pearls = [];
let hazards = [];
let bubbles = [];
let score = 0;
let collected = 0;
let timeLeft = 60;
let running = false;
let last = 0;
let spawnClock = 0;
let bubbleClock = 0;
let pointerActive = false;
let pointerTarget = { x: fish.x, y: fish.y };
function rand(min, max) { return min + Math.random() * (max - min); }
function resetGame() {
  fish.x = 150; fish.y = canvas.height / 2; fish.vx = 0; fish.vy = 0;
  score = 0; collected = 0; timeLeft = 60; pearls = []; hazards = []; bubbles = [];
  for (let i = 0; i < 10; i += 1) addPearl();
  for (let i = 0; i < 18; i += 1) addBubble(true);
  updateHud("SWIM");
  showCard("DIVE IN", "Use arrow keys, WASD, or drag/touch to collect glowing pearls. Avoid jellyfish and hooks.", "START SWIM");
  draw();
}
function startGame() { running = true; last = performance.now(); card.classList.add("hidden"); window.requestAnimationFrame(loop); }
function showCard(title, message, button) { titleEl.textContent = title; messageEl.textContent = message; startButton.textContent = button; card.classList.remove("hidden"); }
function updateHud(status) { scoreEl.textContent = score; pearlsEl.textContent = `${collected} / 10`; timerEl.textContent = Math.max(0, Math.ceil(timeLeft)); statusEl.textContent = status; }
function addPearl() { pearls.push({ x: rand(120, canvas.width - 70), y: rand(70, canvas.height - 80), r: rand(10, 16), glow: rand(0, Math.PI * 2) }); }
function addHazard() { const jelly = Math.random() > 0.35; hazards.push({ type: jelly ? "jelly" : "hook", x: canvas.width + 60, y: rand(70, canvas.height - 80), vx: rand(95, 155), bob: rand(0, Math.PI * 2), r: jelly ? 27 : 24 }); }
function addBubble(randomX = false) { bubbles.push({ x: rand(0, canvas.width), y: randomX ? rand(0, canvas.height) : canvas.height + 20, r: rand(3, 11), vy: rand(20, 58), wobble: rand(0, Math.PI * 2) }); }
function loop(now) { if (!running) return; const dt = Math.min(0.04, (now - last) / 1000 || 0.016); last = now; update(dt); draw(); if (running) window.requestAnimationFrame(loop); }
function update(dt) {
  timeLeft -= dt; spawnClock -= dt; bubbleClock -= dt;
  if (spawnClock <= 0) { addHazard(); spawnClock = rand(0.8, 1.35); }
  if (bubbleClock <= 0) { addBubble(); bubbleClock = rand(0.08, 0.18); }
  let ax = 0; let ay = 0;
  if (keys.has("ArrowLeft") || keys.has("a")) ax -= 1;
  if (keys.has("ArrowRight") || keys.has("d")) ax += 1;
  if (keys.has("ArrowUp") || keys.has("w")) ay -= 1;
  if (keys.has("ArrowDown") || keys.has("s")) ay += 1;
  if (pointerActive) { ax += Math.sign(pointerTarget.x - fish.x) * Math.min(1, Math.abs(pointerTarget.x - fish.x) / 80); ay += Math.sign(pointerTarget.y - fish.y) * Math.min(1, Math.abs(pointerTarget.y - fish.y) / 80); }
  fish.vx += ax * 520 * dt; fish.vy += ay * 520 * dt; fish.vx *= 0.9; fish.vy *= 0.9; fish.x += fish.vx * dt; fish.y += fish.vy * dt;
  fish.x = Math.max(fish.r, Math.min(canvas.width - fish.r, fish.x)); fish.y = Math.max(fish.r, Math.min(canvas.height - fish.r, fish.y));
  bubbles.forEach((b) => { b.y -= b.vy * dt; b.x += Math.sin(performance.now() / 500 + b.wobble) * 14 * dt; }); bubbles = bubbles.filter((b) => b.y > -30);
  hazards.forEach((h) => { h.x -= h.vx * dt; h.y += Math.sin(performance.now() / 400 + h.bob) * 22 * dt; }); hazards = hazards.filter((h) => h.x > -80);
  pearls = pearls.filter((p) => { const hit = Math.hypot(p.x - fish.x, p.y - fish.y) < p.r + fish.r; if (hit) { score += 100; collected += 1; addPearl(); } return !hit; });
  for (const h of hazards) { if (Math.hypot(h.x - fish.x, h.y - fish.y) < h.r + fish.r * 0.78) { endGame(false); return; } }
  if (collected >= 10) endGame(true); else if (timeLeft <= 0) endGame(false); else updateHud("SWIM");
}
function endGame(won) { running = false; updateHud(won ? "WIN" : "TRY AGAIN"); showCard(won ? "HYPER WIN" : "THE SEA GOT WILD", won ? `You collected 10 pearls and scored ${score}.` : "Try again. Dodge the jellyfish and hooks while collecting pearls.", "PLAY AGAIN"); }
function drawBackground() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height); g.addColorStop(0, "#0ca2c9"); g.addColorStop(0.48, "#07627d"); g.addColorStop(1, "#03253c"); ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.globalAlpha = 0.3; ctx.strokeStyle = "#b9fff8"; ctx.lineWidth = 3;
  for (let i = 0; i < 8; i += 1) { ctx.beginPath(); const y = 38 + i * 45; ctx.moveTo(0, y); for (let x = 0; x <= canvas.width; x += 80) ctx.quadraticCurveTo(x + 40, y + Math.sin(i + x) * 18, x + 80, y); ctx.stroke(); }
  ctx.globalAlpha = 1;
  for (let x = 0; x < canvas.width; x += 42) { ctx.fillStyle = x % 84 === 0 ? "#0e7b5d" : "#0b634f"; ctx.beginPath(); ctx.moveTo(x, canvas.height); ctx.quadraticCurveTo(x + 10, canvas.height - 70, x + 24, canvas.height); ctx.fill(); }
}
function drawFish() { ctx.save(); ctx.translate(fish.x, fish.y); ctx.rotate(Math.max(-0.35, Math.min(0.35, fish.vy / 260))); ctx.scale(fish.vx < -8 ? -1 : 1, 1); ctx.lineWidth = 5; ctx.strokeStyle = "#06111a"; ctx.fillStyle = "#ffd766"; ctx.beginPath(); ctx.ellipse(0, 0, 36, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ff8a4d"; ctx.beginPath(); ctx.moveTo(-32, 0); ctx.lineTo(-62, -22); ctx.lineTo(-55, 0); ctx.lineTo(-62, 22); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#52f2ff"; ctx.beginPath(); ctx.ellipse(8, -24, 18, 9, -0.35, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#06111a"; ctx.beginPath(); ctx.arc(18, -7, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#06111a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(22, 6, 10, 0.1, 1.1); ctx.stroke(); ctx.restore(); }
function drawPearl(p) { const glow = 0.5 + Math.sin(performance.now() / 250 + p.glow) * 0.2; ctx.save(); ctx.shadowBlur = 22; ctx.shadowColor = "#fff27e"; ctx.fillStyle = `rgba(255, 242, 126, ${0.86 + glow * 0.1})`; ctx.strokeStyle = "#fffbe0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }
function drawHazard(h) { ctx.save(); ctx.translate(h.x, h.y); ctx.lineWidth = 4; ctx.strokeStyle = "#06111a"; if (h.type === "jelly") { ctx.fillStyle = "#ff6bd6"; ctx.beginPath(); ctx.arc(0, -4, 26, Math.PI, Math.PI * 2); ctx.quadraticCurveTo(24, 28, -24, 28); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#ffd9f5"; for (let i = -2; i <= 2; i += 1) { ctx.beginPath(); ctx.moveTo(i * 10, 22); ctx.quadraticCurveTo(i * 12 + 8, 42, i * 8, 58); ctx.stroke(); } } else { ctx.strokeStyle = "#d7f6ff"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(0, -35); ctx.lineTo(0, 16); ctx.quadraticCurveTo(0, 42, 28, 30); ctx.stroke(); ctx.strokeStyle = "#06111a"; ctx.lineWidth = 3; ctx.stroke(); } ctx.restore(); }
function drawBubble(b) { ctx.save(); ctx.globalAlpha = .62; ctx.strokeStyle = "#d8fffb"; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2); ctx.stroke(); ctx.restore(); }
function draw() { drawBackground(); bubbles.forEach(drawBubble); pearls.forEach(drawPearl); hazards.forEach(drawHazard); drawFish(); }
function pointerPos(event) { const rect = canvas.getBoundingClientRect(); return { x: (event.clientX - rect.left) * (canvas.width / rect.width), y: (event.clientY - rect.top) * (canvas.height / rect.height) }; }
window.addEventListener("keydown", (event) => keys.add(event.key));
window.addEventListener("keyup", (event) => keys.delete(event.key));
canvas.addEventListener("pointerdown", (event) => { pointerActive = true; pointerTarget = pointerPos(event); });
canvas.addEventListener("pointermove", (event) => { if (pointerActive) pointerTarget = pointerPos(event); });
window.addEventListener("pointerup", () => { pointerActive = false; });
startButton.addEventListener("click", () => { resetGame(); startGame(); });
newGameButton.addEventListener("click", resetGame);
resetGame();
