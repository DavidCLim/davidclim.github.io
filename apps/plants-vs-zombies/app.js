const rows = 5;
const cols = 9;
const costs = { pea: 50, ice: 75, fire: 100, wall: 50, chomper: 125 };
const plantStats = {
  pea: { hp: 90, fireRate: 1250, damage: 20, shot: "pea" },
  ice: { hp: 85, fireRate: 1500, damage: 14, shot: "ice", slow: 1600 },
  fire: { hp: 80, fireRate: 1800, damage: 34, shot: "fire" },
  wall: { hp: 360, fireRate: 0, damage: 0 },
  chomper: { hp: 150, fireRate: 2600, damage: 120, melee: true },
};

const state = {
  sun: 75,
  wave: 1,
  selected: "pea",
  running: true,
  won: false,
  lost: false,
  nextId: 1,
  plants: [],
  zombies: [],
  shots: [],
  spawned: 0,
  target: 24,
  spawnTimer: 2200,
  sunTimer: 0,
  lastTime: 0,
};

const els = {
  lawn: document.querySelector("#lawn"),
  sun: document.querySelector("#sun-count"),
  wave: document.querySelector("#wave-count"),
  zombiesLeft: document.querySelector("#zombies-left"),
  status: document.querySelector("#status-label"),
  messageTitle: document.querySelector("#message-title"),
  message: document.querySelector("#message"),
  newGame: document.querySelector("#new-game"),
  seedBank: document.querySelector(".seed-bank"),
};

function startGame() {
  Object.assign(state, {
    sun: 75,
    wave: 1,
    selected: "pea",
    running: true,
    won: false,
    lost: false,
    nextId: 1,
    plants: [],
    zombies: [],
    shots: [],
    spawned: 0,
    target: 24,
    spawnTimer: 2200,
    sunTimer: 0,
    lastTime: performance.now(),
  });
  setMessage("Defend the lawn", "Choose a plant, then click a lawn tile. Stop the zombies before they cross the left edge.");
  buildTiles();
  render();
}

function buildTiles() {
  els.lawn.innerHTML = "";
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const tile = document.createElement("button");
      tile.type = "button";
      tile.className = "tile";
      tile.dataset.row = row;
      tile.dataset.col = col;
      tile.setAttribute("aria-label", `Plant tile row ${row + 1}, column ${col + 1}`);
      tile.addEventListener("click", () => plantAt(row, col));
      els.lawn.append(tile);
    }
  }
  const entityLayer = document.createElement("div");
  entityLayer.className = "entity-layer";
  const shotLayer = document.createElement("div");
  shotLayer.className = "shot-layer";
  els.lawn.append(entityLayer, shotLayer);
}

function plantAt(row, col) {
  if (!state.running || state.lost || state.won) return;
  if (col > 5) {
    setMessage("Too far forward", "Plant closer to the house. Zombies enter from the right side.");
    return;
  }
  if (state.plants.some((plant) => plant.row === row && plant.col === col)) return;
  const cost = costs[state.selected];
  if (state.sun < cost) {
    setMessage("Need more sun", `${plantName(state.selected)} costs ${cost} sun.`);
    return;
  }
  state.sun -= cost;
  state.plants.push({
    id: state.nextId += 1,
    type: state.selected,
    row,
    col,
    hp: plantStats[state.selected].hp,
    cooldown: 420,
  });
  setMessage(`${plantName(state.selected)} planted`, "Hold the lanes. More zombies are coming.");
  render();
}

function plantName(type) {
  return { pea: "Peashooter", ice: "Ice Bloom", fire: "Fire Bloom", wall: "Wall Leaf", chomper: "Chomper" }[type];
}

function loop(now) {
  const dt = Math.min(40, now - state.lastTime || 16);
  state.lastTime = now;
  if (state.running) update(dt);
  window.requestAnimationFrame(loop);
}

function update(dt) {
  state.sunTimer += dt;
  if (state.sunTimer >= 2400) {
    state.sun += 25;
    state.sunTimer = 0;
  }

  state.spawnTimer -= dt;
  if (state.spawned < state.target && state.spawnTimer <= 0) spawnZombie();

  updatePlants(dt);
  updateShots(dt);
  updateZombies(dt);
  cleanup();
  checkEnd();
  render();
}

function spawnZombie() {
  const row = Math.floor(Math.random() * rows);
  const armored = state.spawned > 10 && Math.random() < 0.25;
  const sprinter = state.spawned > 15 && Math.random() < 0.18;
  state.zombies.push({
    id: state.nextId += 1,
    row,
    x: cols + 0.35,
    hp: armored ? 170 : sprinter ? 85 : 120,
    maxHp: armored ? 170 : sprinter ? 85 : 120,
    speed: sprinter ? 0.00033 : 0.00022,
    slow: 0,
    eat: 0,
    kind: armored ? "armored" : sprinter ? "sprinter" : "normal",
  });
  state.spawned += 1;
  state.spawnTimer = Math.max(850, 2700 - state.spawned * 45);
}

function updatePlants(dt) {
  for (const plant of state.plants) {
    const stats = plantStats[plant.type];
    if (!stats.fireRate) continue;
    plant.cooldown -= dt;
    const target = nearestZombieInLane(plant.row, plant.col);
    if (!target || plant.cooldown > 0) continue;
    if (stats.melee) {
      if (target.x - plant.col < 1.3) {
        target.hp -= stats.damage;
        plant.cooldown = stats.fireRate;
      }
      continue;
    }
    state.shots.push({
      id: state.nextId += 1,
      row: plant.row,
      x: plant.col + 0.68,
      type: stats.shot,
      damage: stats.damage,
      slow: stats.slow || 0,
      speed: stats.shot === "fire" ? 0.009 : 0.0072,
    });
    plant.cooldown = stats.fireRate;
  }
}

function nearestZombieInLane(row, col) {
  return state.zombies
    .filter((zombie) => zombie.row === row && zombie.x > col - 0.25)
    .sort((a, b) => a.x - b.x)[0];
}

function updateShots(dt) {
  for (const shot of state.shots) {
    shot.x += shot.speed * dt;
    const hit = state.zombies.find((zombie) => zombie.row === shot.row && zombie.x <= shot.x + 0.25 && zombie.x >= shot.x - 0.45);
    if (hit) {
      hit.hp -= shot.damage;
      if (shot.slow) hit.slow = Math.max(hit.slow, shot.slow);
      shot.hit = true;
    }
  }
}

function updateZombies(dt) {
  for (const zombie of state.zombies) {
    zombie.slow = Math.max(0, zombie.slow - dt);
    const blocker = state.plants.find((plant) => plant.row === zombie.row && Math.abs(zombie.x - plant.col) < 0.42);
    if (blocker) {
      zombie.eat -= dt;
      if (zombie.eat <= 0) {
        blocker.hp -= zombie.kind === "armored" ? 22 : 16;
        zombie.eat = 480;
      }
    } else {
      const slowFactor = zombie.slow > 0 ? 0.42 : 1;
      zombie.x -= zombie.speed * slowFactor * dt;
    }
    if (zombie.x < -0.35) loseGame();
  }
}

function cleanup() {
  state.shots = state.shots.filter((shot) => !shot.hit && shot.x < cols + 0.6);
  state.zombies = state.zombies.filter((zombie) => zombie.hp > 0);
  state.plants = state.plants.filter((plant) => plant.hp > 0);
}

function checkEnd() {
  if (state.lost || state.won) return;
  if (state.spawned >= state.target && state.zombies.length === 0) {
    state.won = true;
    state.running = false;
    setMessage("You defended the lawn", "The final zombie fell. Your plants win this wave.");
  }
}

function loseGame() {
  if (state.lost) return;
  state.lost = true;
  state.running = false;
  setMessage("The zombies got through", "Start a new game and plant earlier in the weak lanes.");
}

function render() {
  els.sun.textContent = state.sun;
  els.wave.textContent = state.wave;
  els.zombiesLeft.textContent = Math.max(0, state.target - state.spawned + state.zombies.length);
  els.status.textContent = state.won ? "Win" : state.lost ? "Lost" : "Plant!";

  document.querySelectorAll(".seed-card").forEach((button) => {
    const type = button.dataset.plant;
    button.classList.toggle("active", type === state.selected);
    button.classList.toggle("locked", state.sun < costs[type]);
  });

  const entityLayer = els.lawn.querySelector(".entity-layer");
  const shotLayer = els.lawn.querySelector(".shot-layer");
  if (!entityLayer || !shotLayer) return;
  entityLayer.innerHTML = state.plants.map(renderPlant).join("") + state.zombies.map(renderZombie).join("");
  shotLayer.innerHTML = state.shots.map(renderShot).join("");
}

function position(row, x) {
  return `left:${(x + 0.5) * (100 / cols)}%;top:${(row + 0.56) * (100 / rows)}%;`;
}

function renderPlant(plant) {
  return `<div class="plant ${plant.type}" style="${position(plant.row, plant.col)}"><div class="plant-head"><span class="crown"></span><span class="mouth"></span></div><span class="stem"></span><span class="leaves"></span></div>`;
}

function renderZombie(zombie) {
  return `<div class="zombie ${zombie.kind}" style="${position(zombie.row, zombie.x)}"><span class="eye"></span><span class="arm"></span></div>`;
}

function renderShot(shot) {
  return `<span class="shot ${shot.type}" style="${position(shot.row, shot.x)}"></span>`;
}

function setMessage(title, message) {
  els.messageTitle.textContent = title;
  els.message.textContent = message;
}

els.seedBank.addEventListener("click", (event) => {
  const card = event.target.closest(".seed-card[data-plant]");
  if (!card) return;
  state.selected = card.dataset.plant;
  setMessage(`${plantName(state.selected)} selected`, `Click a lawn tile to plant it for ${costs[state.selected]} sun.`);
  render();
});

els.newGame.addEventListener("click", startGame);
startGame();
window.requestAnimationFrame(loop);
