const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const scoreText = document.getElementById("scoreText");
const fishText = document.getElementById("fishText");
const levelText = document.getElementById("levelText");
const oxygenBar = document.getElementById("oxygenBar");
const healthBar = document.getElementById("healthBar");
const panel = document.getElementById("messagePanel");
const startButton = document.getElementById("startButton");
const restartButton = document.getElementById("restartButton");

const keys = new Set();
let pointerTarget = null;
let lastTime = 0;
let state;

const rand = (min, max) => min + Math.random() * (max - min);
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const distance = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

function freshState() {
  return {
    running: false,
    level: 1,
    score: 0,
    rescued: 0,
    target: 5,
    oxygen: 100,
    health: 100,
    dash: 0,
    hurtCooldown: 0,
    player: { x: 145, y: 280, r: 24, vx: 0, vy: 0, face: 1 },
    fishies: [],
    bubbles: [],
    hazards: [],
    currents: [],
    particles: []
  };
}

function resetRun() {
  state = freshState();
  buildLevel();
  updateHud();
  showMessage("HYPER FISHIES", "Rescue the glowing fishies, grab bubbles for oxygen, and dodge jelly shocks.", "START GAME");
}

function startRun() {
  panel.classList.remove("show");
  state.running = true;
  lastTime = performance.now();
}

function buildLevel() {
  const level = state.level;
  state.target = 4 + level;
  state.rescued = 0;
  state.player.x = 130;
  state.player.y = canvas.height / 2;
  state.player.vx = 0;
  state.player.vy = 0;
  state.oxygen = clamp(105 - level * 4, 65, 100);
  state.health = 100;
  state.fishies = Array.from({ length: state.target }, (_, i) => ({
    x: rand(250, canvas.width - 70),
    y: rand(70, canvas.height - 90),
    r: 15,
    hue: 170 + i * 28,
    wobble: rand(0, Math.PI * 2)
  }));
  state.bubbles = Array.from({ length: 7 }, () => makeBubble());
  state.hazards = Array.from({ length: 3 + level }, (_, i) => makeHazard(i));
  state.currents = Array.from({ length: 2 + Math.floor(level / 2) }, () => ({
    x: rand(210, canvas.width - 160),
    y: rand(90, canvas.height - 110),
    r: rand(44, 72),
    pushX: rand(-40, 50),
    pushY: rand(-30, 30)
  }));
}

function makeBubble() {
  return { x: rand(70, canvas.width - 70), y: rand(70, canvas.height - 80), r: rand(10, 17), bob: rand(0, Math.PI * 2) };
}

function makeHazard(i) {
  return {
    x: rand(260, canvas.width - 80),
    y: rand(80, canvas.height - 90),
    r: rand(20, 30),
    vx: rand(-55, 55) || 35,
    vy: rand(-40, 40) || 25,
    phase: i * 0.8,
    zap: 0
  };
}

function showMessage(title, text, buttonText) {
  panel.querySelector("h1").textContent = title;
  panel.querySelector("p").textContent = text;
  startButton.textContent = buttonText;
  panel.classList.add("show");
}

function updateHud() {
  scoreText.textContent = state.score;
  fishText.textContent = `${state.rescued}/${state.target}`;
  levelText.textContent = state.level;
  oxygenBar.style.width = `${clamp(state.oxygen, 0, 100)}%`;
  healthBar.style.width = `${clamp(state.health, 0, 100)}%`;
}

function update(dt) {
  if (!state.running) return;

  const player = state.player;
  let ax = 0;
  let ay = 0;

  if (keys.has("arrowleft") || keys.has("a")) ax -= 1;
  if (keys.has("arrowright") || keys.has("d")) ax += 1;
  if (keys.has("arrowup") || keys.has("w")) ay -= 1;
  if (keys.has("arrowdown") || keys.has("s")) ay += 1;

  if (pointerTarget) {
    const dx = pointerTarget.x - player.x;
    const dy = pointerTarget.y - player.y;
    const mag = Math.hypot(dx, dy) || 1;
    ax += dx / mag;
    ay += dy / mag;
  }

  const mag = Math.hypot(ax, ay) || 1;
  ax /= mag;
  ay /= mag;

  const dashBoost = state.dash > 0 ? 1.9 : 1;
  const speed = 410 * dashBoost;
  player.vx += ax * speed * dt;
  player.vy += ay * speed * dt;

  for (const current of state.currents) {
    if (distance(player, current) < current.r) {
      player.vx += current.pushX * dt;
      player.vy += current.pushY * dt;
    }
  }

  player.vx *= Math.pow(0.08, dt);
  player.vy *= Math.pow(0.08, dt);
  player.x = clamp(player.x + player.vx * dt, player.r, canvas.width - player.r);
  player.y = clamp(player.y + player.vy * dt, player.r, canvas.height - player.r);
  if (Math.abs(player.vx) > 15) player.face = Math.sign(player.vx);

  state.dash = Math.max(0, state.dash - dt);
  state.hurtCooldown = Math.max(0, state.hurtCooldown - dt);
  state.oxygen -= (4.4 + state.level * 0.35) * dt;

  for (const bubble of state.bubbles) {
    bubble.y -= (12 + Math.sin(performance.now() / 450 + bubble.bob) * 8) * dt;
    if (bubble.y < -20) Object.assign(bubble, makeBubble(), { y: canvas.height + 20 });
    if (distance(player, bubble) < player.r + bubble.r) {
      state.oxygen = clamp(state.oxygen + 18, 0, 100);
      state.score += 20;
      burst(bubble.x, bubble.y, "#c9fff8", 8);
      Object.assign(bubble, makeBubble());
    }
  }

  state.fishies = state.fishies.filter(fishy => {
    fishy.wobble += dt * 4;
    if (distance(player, fishy) < player.r + fishy.r + 4) {
      state.rescued += 1;
      state.score += 100;
      burst(fishy.x, fishy.y, `hsl(${fishy.hue} 95% 70%)`, 16);
      return false;
    }
    return true;
  });

  for (const hazard of state.hazards) {
    hazard.x += hazard.vx * dt;
    hazard.y += hazard.vy * dt;
    hazard.phase += dt * 3;
    hazard.zap = Math.max(0, hazard.zap - dt);
    if (hazard.x < hazard.r || hazard.x > canvas.width - hazard.r) hazard.vx *= -1;
    if (hazard.y < hazard.r || hazard.y > canvas.height - hazard.r) hazard.vy *= -1;
    if (distance(player, hazard) < player.r + hazard.r && state.hurtCooldown <= 0) {
      state.health -= 20;
      state.hurtCooldown = 0.85;
      hazard.zap = 0.4;
      player.vx -= Math.sign(hazard.x - player.x || 1) * 260;
      burst(player.x, player.y, "#ffec62", 12);
    }
  }

  state.particles = state.particles.filter(p => {
    p.life -= dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    return p.life > 0;
  });

  if (state.oxygen <= 0 || state.health <= 0) {
    state.running = false;
    updateHud();
    showMessage("RUN OVER", `Final score: ${state.score}. Grab more bubbles and avoid jelly shocks next run.`, "TRY AGAIN");
    return;
  }

  if (state.rescued >= state.target) {
    state.score += 250 * state.level;
    state.level += 1;
    buildLevel();
    showMessage("LEVEL CLEAR", `Nice rescue. Level ${state.level} has stronger currents and more hazards.`, "NEXT LEVEL");
    state.running = false;
  }

  updateHud();
}

function burst(x, y, color, count) {
  for (let i = 0; i < count; i++) {
    const a = rand(0, Math.PI * 2);
    const s = rand(50, 180);
    state.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, r: rand(2, 5), color, life: rand(0.35, 0.8) });
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  drawWater();
  state.currents.forEach(drawCurrent);
  state.bubbles.forEach(drawBubble);
  state.fishies.forEach(drawFishy);
  state.hazards.forEach(drawJelly);
  drawPlayer();
  state.particles.forEach(drawParticle);
}

function drawWater() {
  const bg = ctx.createLinearGradient(0, 0, 0, canvas.height);
  bg.addColorStop(0, "#71edf6");
  bg.addColorStop(0.52, "#158cc2");
  bg.addColorStop(1, "#073767");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,.16)";
  for (let i = 0; i < 20; i++) {
    const x = (i * 127 + performance.now() * 0.012) % (canvas.width + 80) - 40;
    const y = 34 + (i * 43) % (canvas.height - 90);
    ctx.beginPath();
    ctx.ellipse(x, y, 46, 9, -0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#d6ad64";
  ctx.fillRect(0, canvas.height - 42, canvas.width, 42);
  ctx.fillStyle = "rgba(6,120,88,.85)";
  for (let x = 18; x < canvas.width; x += 38) {
    const h = 24 + Math.sin(x + performance.now() / 320) * 8;
    ctx.beginPath();
    ctx.ellipse(x, canvas.height - 22, 8, h, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawPlayer() {
  const p = state.player;
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.scale(p.face, 1);
  ctx.fillStyle = state.hurtCooldown > 0 ? "#ffe36e" : "#ff7d87";
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
  ctx.fillStyle = "#05263d";
  ctx.beginPath();
  ctx.arc(14, -7, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFishy(fishy) {
  ctx.save();
  ctx.translate(fishy.x, fishy.y + Math.sin(fishy.wobble) * 4);
  ctx.fillStyle = `hsl(${fishy.hue} 95% 68%)`;
  ctx.strokeStyle = "#05263d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.ellipse(0, 0, 19, 13, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(-34, -12);
  ctx.lineTo(-30, 0);
  ctx.lineTo(-34, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.arc(7, -4, 3.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBubble(bubble) {
  ctx.strokeStyle = "rgba(232,255,255,.9)";
  ctx.lineWidth = 3;
  ctx.fillStyle = "rgba(207,255,250,.18)";
  ctx.beginPath();
  ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "rgba(255,255,255,.85)";
  ctx.beginPath();
  ctx.arc(bubble.x - bubble.r * 0.25, bubble.y - bubble.r * 0.3, bubble.r * 0.22, 0, Math.PI * 2);
  ctx.fill();
}

function drawJelly(jelly) {
  ctx.save();
  ctx.translate(jelly.x, jelly.y);
  ctx.fillStyle = jelly.zap > 0 ? "#ffe36e" : "#b77cff";
  ctx.strokeStyle = "#05263d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(0, 0, jelly.r, Math.PI, 0);
  ctx.lineTo(jelly.r, jelly.r * 0.45);
  for (let i = 0; i < 5; i++) {
    const x = jelly.r - i * jelly.r * 0.5;
    ctx.quadraticCurveTo(x - jelly.r * 0.18, jelly.r * 0.8, x - jelly.r * 0.32, jelly.r * 0.45);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = jelly.zap > 0 ? "#fff58e" : "#d9bdff";
  ctx.lineWidth = 3;
  for (let i = -1; i <= 1; i++) {
    ctx.beginPath();
    ctx.moveTo(i * jelly.r * 0.4, jelly.r * 0.38);
    ctx.quadraticCurveTo(i * jelly.r * 0.65, jelly.r * (0.95 + Math.sin(jelly.phase + i) * 0.2), i * jelly.r * 0.3, jelly.r * 1.45);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCurrent(current) {
  ctx.strokeStyle = "rgba(224,255,255,.22)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(current.x, current.y, current.r, 0.4, Math.PI * 1.55);
  ctx.stroke();
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
  keys.add(event.key.toLowerCase());
  if (event.code === "Space" && state.running && state.dash <= 0) {
    state.dash = 0.18;
    state.oxygen = Math.max(0, state.oxygen - 5);
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

resetRun();
requestAnimationFrame(loop);
