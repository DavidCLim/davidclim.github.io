const baseMaxHealth = 100;

function resetBaseHealth() {
  state.baseMaxHealth = baseMaxHealth;
  state.baseHealth = baseMaxHealth;
}

function ensureBaseHud() {
  if (document.querySelector("#base-health")) return;
  const hud = document.querySelector(".hud");
  if (!hud) return;
  const card = document.createElement("div");
  card.className = "stat-card base-card";
  card.innerHTML = '<span>BASE HEALTH</span><strong id="base-health">100</strong><div class="base-health-bar"><i id="base-health-fill"></i></div>';
  hud.append(card);
}

function ensureBaseMarker() {
  if (!els.lawn || els.lawn.querySelector(".base-marker")) return;
  const marker = document.createElement("div");
  marker.className = "base-marker";
  marker.innerHTML = '<span class="base-roof"></span><span class="base-door"></span><strong>BASE</strong>';
  els.lawn.append(marker);
}

function damageBase(zombie) {
  const damage = Math.max(12, Math.round((zombie.damage || 16) * 1.75));
  state.baseHealth = Math.max(0, (state.baseHealth ?? baseMaxHealth) - damage);
  zombie.hp = 0;
  zombie.escaped = true;
  setMessage("Base hit", `A ${zombie.kind} zombie reached the base and dealt ${damage} damage.`);
  if (state.baseHealth <= 0) loseGame();
}

ensureBaseHud();
resetBaseHealth();
ensureBaseMarker();

const originalBuildTilesForBase = buildTiles;
buildTiles = function buildTilesWithBase() {
  originalBuildTilesForBase();
  ensureBaseMarker();
};

const originalSetupRoundForBase = setupRound;
setupRound = function setupRoundWithBase(message) {
  originalSetupRoundForBase(message);
  resetBaseHealth();
  ensureBaseMarker();
  render();
};

els.startRound?.addEventListener("click", () => {
  if (state.phase !== "running") resetBaseHealth();
}, true);

const originalUpdateZombiesForBase = updateZombies;
updateZombies = function updateZombiesWithBase(dt) {
  const flagRows = new Set(state.zombies.filter((zombie) => zombie.aura).map((zombie) => zombie.row));
  for (const zombie of state.zombies) {
    zombie.slow = Math.max(0, zombie.slow - dt);
    if (zombie.poison > 0) {
      zombie.poison = Math.max(0, zombie.poison - dt);
      damageZombie(zombie, 0.008 * dt);
    }
    if (zombie.healer) {
      zombie.healTimer -= dt;
      if (zombie.healTimer <= 0) {
        state.zombies
          .filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.35)
          .forEach((other) => { other.hp = Math.min(other.maxHp, other.hp + 16); });
        zombie.healTimer = 1200;
      }
    }
    const blocker = state.plants.find((plant) => plant.row === zombie.row && Math.abs(zombie.x - plant.col) < 0.42);
    if (blocker && zombie.leaper && !zombie.leaped && zombie.x > blocker.col) {
      zombie.x -= 0.95;
      zombie.leaped = true;
      continue;
    }
    if (blocker) {
      zombie.eat -= dt;
      if (zombie.eat <= 0) {
        blocker.hp -= zombie.damage + (zombie.toxic ? 8 : 0);
        zombie.eat = zombie.toxic ? 360 : 480;
      }
    } else {
      zombie.x -= zombie.speed * (zombie.slow > 0 ? 0.42 : 1) * (flagRows.has(zombie.row) && !zombie.aura ? 1.18 : 1) * dt;
    }
    if (zombie.x < -0.35 && !zombie.escaped) damageBase(zombie);
  }
};

const originalRenderForBase = render;
render = function renderWithBase() {
  originalRenderForBase();
  ensureBaseHud();
  ensureBaseMarker();
  const health = Math.max(0, Math.round(state.baseHealth ?? baseMaxHealth));
  const healthLabel = document.querySelector("#base-health");
  const healthFill = document.querySelector("#base-health-fill");
  const baseMarker = document.querySelector(".base-marker");
  if (healthLabel) healthLabel.textContent = health;
  if (healthFill) healthFill.style.width = `${Math.max(0, Math.min(100, health))}%`;
  if (baseMarker) baseMarker.classList.toggle("damaged", health < 45);
};

render();
