const rows = 5;
const cols = 9;
const maxEquipped = 5;

const plantCatalog = [
  { id: "pea", name: "Peashooter", cost: 50, role: "Balanced pea shots", hp: 90, fireRate: 1250, damage: 20, shot: "pea" },
  { id: "ice", name: "Ice Bloom", cost: 75, role: "Slows zombies", hp: 90, fireRate: 1500, damage: 14, shot: "ice", slow: 1700 },
  { id: "fire", name: "Fire Bloom", cost: 100, role: "Splash fireballs", hp: 85, fireRate: 1750, damage: 30, shot: "fire", splash: 0.72 },
  { id: "volt", name: "Volt Sprout", cost: 125, role: "Chains lightning", hp: 80, fireRate: 1900, damage: 24, shot: "volt", chain: 2 },
  { id: "angry", name: "Angry Pea", cost: 125, role: "Fast heavy shots", hp: 95, fireRate: 930, damage: 18, shot: "angry" },
  { id: "spike", name: "Spike Leaf", cost: 75, role: "Lane spike trap", hp: 170, fireRate: 420, damage: 12, trap: true },
  { id: "vine", name: "Vine Snare", cost: 100, role: "Grabs and weakens", hp: 120, fireRate: 720, damage: 8, trap: true, slowAura: 900 },
  { id: "toxic", name: "Toxic Pea", cost: 125, role: "Poison shots", hp: 90, fireRate: 1450, damage: 15, shot: "toxic", poison: 2500 },
  { id: "triple", name: "Triple Pea", cost: 175, role: "Three-lane shots", hp: 100, fireRate: 1500, damage: 17, shot: "triple", multiRows: [-1, 0, 1] },
  { id: "chomper", name: "Chomper", cost: 150, role: "Huge bite", hp: 170, fireRate: 2500, damage: 145, melee: true },
  { id: "cannon", name: "Pea Cannon", cost: 200, role: "Heavy pod blasts", hp: 135, fireRate: 2350, damage: 62, shot: "cannon", splash: 0.95 },
];

const plantStats = Object.fromEntries(plantCatalog.map((plant) => [plant.id, plant]));
const costs = Object.fromEntries(plantCatalog.map((plant) => [plant.id, plant.cost]));

const zombieTypes = [
  { kind: "normal", min: 0, weight: 48, hp: 120, speed: 0.00022, damage: 16 },
  { kind: "flag", min: 4, weight: 13, hp: 110, speed: 0.00027, damage: 14 },
  { kind: "runner", min: 6, weight: 16, hp: 85, speed: 0.00035, damage: 12 },
  { kind: "cone", min: 8, weight: 20, hp: 165, speed: 0.0002, damage: 18 },
  { kind: "bucket", min: 12, weight: 15, hp: 230, speed: 0.00018, damage: 22 },
  { kind: "brute", min: 18, weight: 7, hp: 310, speed: 0.00015, damage: 28 },
];

const state = {
  sun: 75,
  wave: 1,
  selected: "pea",
  equipped: ["pea", "ice", "fire", "wall", "chomper"].filter((id) => plantStats[id]),
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
  clock: 0,
};

if (!state.equipped.includes("wall")) state.equipped = ["pea", "ice", "fire", "spike", "chomper"];

const els = {
  lawn: document.querySelector("#lawn"),
  sun: document.querySelector("#sun-count"),
  wave: document.querySelector("#wave-count"),
  zombiesLeft: document.querySelector("#zombies-left"),
  status: document.querySelector("#status-label"),
  messageTitle: document.querySelector("#message-title"),
  message: document.querySelector("#message"),
  newGame: document.querySelector("#new-game"),
  seedBank: document.querySelector("#seed-bank"),
  plantShop: document.querySelector("#plant-shop"),
  loadoutCount: document.querySelector("#loadout-count"),
};

function startGame() {
  Object.assign(state, {
    sun: 75,
    wave: 1,
    selected: state.equipped.includes(state.selected) ? state.selected : state.equipped[0],
    running: true,
    won: false,
    lost: false,
    nextId: 1,
    plants: [],
    zombies: [],
    shots: [],
    spawned: 0,
    target: 28,
    spawnTimer: 2200,
    sunTimer: 0,
    lastTime: performance.now(),
    clock: 0,
  });
  setMessage("Defend the lawn", "Pick from your five equipped plants, then plant on the lawn. Use the shop to swap your lineup.");
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
  if (!state.equipped.includes(state.selected)) return;
  if (col > 5) {
    setMessage("Too far forward", "Plant closer to the house. Zombies enter from the right side.");
    return;
  }
  if (state.plants.some((plant) => plant.row === row && plant.col === col)) return;
  const stats = plantStats[state.selected];
  if (state.sun < stats.cost) {
    setMessage("Need more sun", `${stats.name} costs ${stats.cost} sun.`);
    return;
  }
  state.sun -= stats.cost;
  state.plants.push({
    id: state.nextId += 1,
    type: state.selected,
    row,
    col,
    hp: stats.hp,
    cooldown: 420,
    action: 0,
  });
  setMessage(`${stats.name} planted`, stats.role);
  render();
}

function plantName(type) {
  return plantStats[type]?.name || "Plant";
}

function loop(now) {
  const dt = Math.min(40, now - state.lastTime || 16);
  state.lastTime = now;
  if (state.running) update(dt);
  window.requestAnimationFrame(loop);
}

function update(dt) {
  state.clock += dt;
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

function chooseZombieType() {
  const options = zombieTypes.filter((type) => state.spawned >= type.min);
  const total = options.reduce((sum, type) => sum + type.weight, 0);
  let roll = Math.random() * total;
  for (const type of options) {
    roll -= type.weight;
    if (roll <= 0) return type;
  }
  return options[0];
}

function spawnZombie() {
  const row = Math.floor(Math.random() * rows);
  const type = chooseZombieType();
  state.zombies.push({
    id: state.nextId += 1,
    row,
    x: cols + 0.35,
    hp: type.hp,
    maxHp: type.hp,
    speed: type.speed,
    slow: 0,
    poison: 0,
    eat: 0,
    damage: type.damage,
    kind: type.kind,
  });
  state.spawned += 1;
  state.spawnTimer = Math.max(720, 2550 - state.spawned * 46);
}

function updatePlants(dt) {
  for (const plant of state.plants) {
    const stats = plantStats[plant.type];
    plant.action = Math.max(0, plant.action - dt);
    if (!stats.fireRate) continue;
    plant.cooldown -= dt;

    if (stats.trap) {
      const victims = state.zombies.filter((zombie) => zombie.row === plant.row && Math.abs(zombie.x - plant.col) < 0.62);
      if (victims.length && plant.cooldown <= 0) {
        victims.forEach((zombie) => {
          zombie.hp -= stats.damage;
          if (stats.slowAura) zombie.slow = Math.max(zombie.slow, stats.slowAura);
        });
        plant.action = 320;
        plant.cooldown = stats.fireRate;
      }
      continue;
    }

    const target = nearestZombieInLane(plant.row, plant.col);
    if (!target || plant.cooldown > 0) continue;
    if (stats.melee) {
      if (target.x - plant.col < 1.32) {
        target.hp -= stats.damage;
        plant.action = 520;
        plant.cooldown = stats.fireRate;
      }
      continue;
    }

    const rowsToShoot = stats.multiRows || [0];
    rowsToShoot.forEach((offset) => {
      const shotRow = plant.row + offset;
      if (shotRow < 0 || shotRow >= rows) return;
      const laneTarget = nearestZombieInLane(shotRow, plant.col);
      if (!laneTarget) return;
      state.shots.push({
        id: state.nextId += 1,
        row: shotRow,
        x: plant.col + 0.68,
        type: stats.shot,
        damage: stats.damage,
        slow: stats.slow || 0,
        poison: stats.poison || 0,
        chain: stats.chain || 0,
        splash: stats.splash || 0,
        speed: shotSpeed(stats.shot),
      });
    });
    plant.action = 280;
    plant.cooldown = stats.fireRate;
  }
}

function shotSpeed(type) {
  return { fire: 0.0085, cannon: 0.0062, volt: 0.0092, angry: 0.0095, toxic: 0.0075 }[type] || 0.0072;
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
    if (!hit) continue;
    hit.hp -= shot.damage;
    if (shot.slow) hit.slow = Math.max(hit.slow, shot.slow);
    if (shot.poison) hit.poison = Math.max(hit.poison, shot.poison);
    if (shot.splash) {
      state.zombies
        .filter((zombie) => zombie !== hit && zombie.row === hit.row && Math.abs(zombie.x - hit.x) <= shot.splash)
        .forEach((zombie) => { zombie.hp -= Math.round(shot.damage * 0.52); });
    }
    if (shot.chain) {
      state.zombies
        .filter((zombie) => zombie !== hit && Math.abs(zombie.row - hit.row) <= 1 && Math.abs(zombie.x - hit.x) <= 1.4)
        .slice(0, shot.chain)
        .forEach((zombie) => {
          zombie.hp -= Math.round(shot.damage * 0.7);
          zombie.slow = Math.max(zombie.slow, 500);
        });
    }
    shot.hit = true;
  }
}

function updateZombies(dt) {
  for (const zombie of state.zombies) {
    zombie.slow = Math.max(0, zombie.slow - dt);
    if (zombie.poison > 0) {
      zombie.poison = Math.max(0, zombie.poison - dt);
      zombie.hp -= 0.008 * dt;
    }
    const blocker = state.plants.find((plant) => plant.row === zombie.row && Math.abs(zombie.x - plant.col) < 0.42);
    if (blocker) {
      zombie.eat -= dt;
      if (zombie.eat <= 0) {
        blocker.hp -= zombie.damage;
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
  els.sun.textContent = Math.floor(state.sun);
  els.wave.textContent = state.wave;
  els.zombiesLeft.textContent = Math.max(0, state.target - state.spawned + state.zombies.length);
  els.status.textContent = state.won ? "Win" : state.lost ? "Lost" : "Plant!";
  renderSeedBank();
  renderShop();

  const entityLayer = els.lawn.querySelector(".entity-layer");
  const shotLayer = els.lawn.querySelector(".shot-layer");
  if (!entityLayer || !shotLayer) return;
  entityLayer.innerHTML = state.plants.map(renderPlant).join("") + state.zombies.map(renderZombie).join("");
  shotLayer.innerHTML = state.shots.map(renderShot).join("");
}

function renderSeedBank() {
  els.seedBank.innerHTML = state.equipped.map((id) => {
    const plant = plantStats[id];
    return `<button class="seed-card ${id === state.selected ? "active" : ""} ${state.sun < plant.cost ? "locked" : ""}" data-plant="${id}" type="button">
      <span class="mini-plant ${id}"></span>
      <strong>${plant.name}</strong>
      <small>${plant.cost} sun</small>
    </button>`;
  }).join("");
}

function renderShop() {
  els.loadoutCount.textContent = `${state.equipped.length} / ${maxEquipped} equipped`;
  els.plantShop.innerHTML = plantCatalog.map((plant) => {
    const equipped = state.equipped.includes(plant.id);
    return `<button class="shop-card ${equipped ? "equipped" : ""}" data-shop-plant="${plant.id}" type="button">
      <span class="mini-plant ${plant.id}"></span>
      <span class="shop-copy"><strong>${plant.name}</strong><small>${plant.role}</small><em>${equipped ? "Equipped" : "Tap to equip"}</em></span>
    </button>`;
  }).join("");
}

function position(row, x) {
  return `left:${(x + 0.5) * (100 / cols)}%;top:${(row + 0.56) * (100 / rows)}%;`;
}

function renderPlant(plant) {
  const bob = Math.sin((state.clock + plant.id * 113) / 360) * 3;
  const tilt = Math.sin((state.clock + plant.id * 71) / 520) * 4;
  const action = plant.action > 0 ? " action" : "";
  const actionScale = plant.action > 0 ? 1.08 : 1;
  const style = `${position(plant.row, plant.col)}--bob:${bob.toFixed(2)}px;--tilt:${tilt.toFixed(2)}deg;--pulse:${actionScale};`;
  return `<div class="plant ${plant.type}${action}" style="${style}"><div class="plant-head"><span class="crown"></span><span class="mouth"></span></div><span class="stem"></span><span class="leaves"></span></div>`;
}

function renderZombie(zombie) {
  const limp = Math.sin((state.clock + zombie.id * 37) / 170) * 3;
  const hurt = Math.max(0, 1 - zombie.hp / zombie.maxHp);
  const status = `${zombie.slow > 0 ? " slow" : ""}${zombie.poison > 0 ? " poison" : ""}`;
  const style = `${position(zombie.row, zombie.x)}--limp:${limp.toFixed(2)}deg;--hurt:${hurt.toFixed(2)};`;
  return `<div class="zombie ${zombie.kind}${status}" style="${style}"><span class="helmet"></span><span class="cone"></span><span class="flag"></span><span class="eye"></span><span class="arm"></span></div>`;
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

els.plantShop.addEventListener("click", (event) => {
  const card = event.target.closest(".shop-card[data-shop-plant]");
  if (!card) return;
  const id = card.dataset.shopPlant;
  if (state.equipped.includes(id)) {
    if (state.equipped.length <= 1) return;
    state.equipped = state.equipped.filter((plantId) => plantId !== id);
    if (state.selected === id) state.selected = state.equipped[0];
    setMessage(`${plantName(id)} unequipped`, "You can equip up to five plants from the shop.");
  } else {
    if (state.equipped.length >= maxEquipped) {
      setMessage("Loadout full", "Unequip one plant first. You can only carry five plants at a time.");
      return;
    }
    state.equipped.push(id);
    state.selected = id;
    setMessage(`${plantName(id)} equipped`, plantStats[id].role);
  }
  render();
});

els.newGame.addEventListener("click", startGame);
startGame();
window.requestAnimationFrame(loop);
