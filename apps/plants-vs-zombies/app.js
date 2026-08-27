const rows = 5;
const cols = 9;
const maxEquipped = 5;
const accountsKey = "david-pvz-accounts-v1";
const activeAccountKey = "david-pvz-active-account";
const legacyStorageKey = "david-pvz-save-v2";

const plantCatalog = [
  { id: "pea", name: "Peashooter", price: 0, cost: 50, role: "Balanced pea shots", hp: 90, fireRate: 1250, damage: 20, shot: "pea", family: "shooter", element: "plain" },
  { id: "ice", name: "Ice Bloom", price: 0, cost: 75, role: "Slows zombies", hp: 90, fireRate: 1500, damage: 14, shot: "ice", slow: 1700, family: "shooter", element: "ice" },
  { id: "fire", name: "Fire Bloom", price: 0, cost: 100, role: "Splash fireballs", hp: 85, fireRate: 1750, damage: 30, shot: "fire", splash: 0.72, family: "shooter", element: "fire" },
  { id: "spike", name: "Walnut", price: 0, cost: 75, role: "Tough blocker with no damage", hp: 420, blocker: true, family: "wall", element: "plain" },
  { id: "sunflower", name: "Sunflower", price: 0, cost: 50, role: "Produces extra sun", hp: 80, sunRate: 6200, sunAmount: 50, family: "sun", element: "sun" },
  { id: "chomper", name: "Chomper", price: 360, cost: 150, role: "Huge bite", hp: 170, fireRate: 2500, damage: 145, melee: true, family: "chomper", element: "plain" },
  { id: "volt", name: "Volt Sprout", price: 180, cost: 125, role: "Chains lightning", hp: 80, fireRate: 1900, damage: 24, shot: "volt", chain: 2, family: "shooter", element: "volt" },
  { id: "angry", name: "Angry Pea", price: 230, cost: 125, role: "Fast heavy shots", hp: 95, fireRate: 930, damage: 18, shot: "angry", family: "shooter", element: "fire" },
  { id: "vine", name: "Vine Snare", price: 300, cost: 100, role: "Grabs and weakens", hp: 120, fireRate: 720, damage: 8, trap: true, slowAura: 900, family: "vine", element: "thorn" },
  { id: "toxic", name: "Toxic Pea", price: 380, cost: 125, role: "Poison shots", hp: 90, fireRate: 1450, damage: 15, shot: "toxic", poison: 2500, family: "shooter", element: "toxic" },
  { id: "triple", name: "Triple Pea", price: 520, cost: 175, role: "Three-lane shots", hp: 100, fireRate: 1500, damage: 17, shot: "triple", multiRows: [-1, 0, 1], family: "shooter", element: "plain" },
  { id: "cannon", name: "Pea Cannon", price: 700, cost: 200, role: "Heavy pod blasts", hp: 135, fireRate: 2350, damage: 62, shot: "cannon", splash: 0.95, family: "cannon", element: "plain" },
  { id: "ironNut", name: "Iron Nut", price: 260, cost: 125, role: "Even tougher blocker", hp: 680, blocker: true, family: "wall", element: "plain" },
  { id: "melonSmasher", name: "Melon Smasher", price: 600, cost: 250, role: "Massive splash blasts", hp: 150, fireRate: 2700, damage: 78, shot: "cannon", splash: 1.15, family: "cannon", element: "plain" },
  { id: "starburst", name: "Starburst", price: 650, cost: 250, role: "Five-lane pea bursts", hp: 105, fireRate: 1700, damage: 15, shot: "pea", multiRows: [-2, -1, 0, 1, 2], family: "shooter", element: "plain" },
  { id: "snapTrap", name: "Snap Trap", price: 300, cost: 150, role: "Thorny one-bite killer", hp: 140, fireRate: 2600, damage: 210, melee: true, family: "chomper", element: "thorn" },
  { id: "frostSpike", name: "Frost Spike", price: 220, cost: 110, role: "Blocker that chills attackers", hp: 480, blocker: true, onHitSlow: 1400, family: "wall", element: "ice" },
  { id: "emberVine", name: "Ember Vine", price: 260, cost: 130, role: "Burning snare trap", hp: 115, fireRate: 700, damage: 12, trap: true, splash: 0.5, family: "vine", element: "fire" },
  { id: "galePea", name: "Gale Pea", price: 240, cost: 130, role: "Very rapid light shots", hp: 85, fireRate: 620, damage: 9, shot: "pea", family: "shooter", element: "plain" },
  { id: "bloomGuard", name: "Bloom Guard", price: 280, cost: 130, role: "Sunflower with extra hp", hp: 160, sunRate: 5800, sunAmount: 55, family: "sun", element: "sun" },
  { id: "frostFern", name: "Frost Fern", price: 320, cost: 100, role: "Rapid icy shots", hp: 85, fireRate: 1050, damage: 12, shot: "ice", slow: 1400, family: "shooter", element: "ice" },
  { id: "blazeBud", name: "Blaze Bud", price: 340, cost: 140, role: "Single heavy fireball", hp: 90, fireRate: 2100, damage: 42, shot: "fire", family: "shooter", element: "fire" },
  { id: "thunderReed", name: "Thunder Reed", price: 360, cost: 145, role: "Long chain lightning", hp: 85, fireRate: 2000, damage: 22, shot: "volt", chain: 4, family: "shooter", element: "volt" },
  { id: "bogSprout", name: "Bog Sprout", price: 380, cost: 140, role: "Stacking poison shots", hp: 90, fireRate: 1300, damage: 10, shot: "toxic", poison: 3400, family: "shooter", element: "toxic" },
  { id: "boulderRoot", name: "Boulder Root", price: 300, cost: 140, role: "Massive tough blocker", hp: 900, blocker: true, family: "wall", element: "plain" },
  { id: "crystalWard", name: "Crystal Ward", price: 340, cost: 150, role: "Blocker that slows attackers", hp: 620, blocker: true, onHitSlow: 2200, family: "wall", element: "crystal" },
  { id: "shadowRoot", name: "Shadow Root", price: 360, cost: 160, role: "Wall that scratches nearby zombies", hp: 700, blocker: true, auraDamage: 0.011, family: "wall", element: "shadow" },
  { id: "gatorJaw", name: "Gator Jaw", price: 380, cost: 155, role: "Heavy single bite", hp: 175, fireRate: 2300, damage: 165, melee: true, family: "chomper", element: "plain" },
  { id: "frostFang", name: "Frost Fang", price: 400, cost: 165, role: "Fast freezing bite", hp: 180, fireRate: 2100, damage: 120, melee: true, slowBite: 2600, family: "chomper", element: "ice" },
  { id: "thornWhip", name: "Thorn Whip", price: 320, cost: 110, role: "Sharp snaring trap", hp: 125, fireRate: 640, damage: 10, trap: true, slowAura: 1100, family: "vine", element: "thorn" },
  { id: "mistVine", name: "Mist Vine", price: 340, cost: 135, role: "Scalding, slowing trap", hp: 130, fireRate: 700, damage: 13, trap: true, slowAura: 1000, splash: 0.4, family: "vine", element: "steam" },
  { id: "cometCannon", name: "Comet Cannon", price: 620, cost: 240, role: "Fiery long-range blast", hp: 140, fireRate: 2450, damage: 66, shot: "fire", splash: 1.0, family: "cannon", element: "fire" },
  { id: "ionCannon", name: "Ion Cannon", price: 640, cost: 245, role: "Chaining cannon blast", hp: 140, fireRate: 2400, damage: 50, shot: "volt", chain: 3, splash: 0.6, family: "cannon", element: "volt" },
  { id: "radiantBloom", name: "Radiant Bloom", price: 300, cost: 135, role: "Big bursts of sun", hp: 100, sunRate: 5200, sunAmount: 70, family: "sun", element: "sun" },
  { id: "eclipseBloom", name: "Eclipse Bloom", price: 420, cost: 160, role: "Makes sun and saps nearby zombies", hp: 130, sunRate: 5000, sunAmount: 55, auraDamage: 0.005, family: "sun", element: "shadow" },
  { id: "starlightPea", name: "Starlight Pea", price: 440, cost: 165, role: "Slowing crystal shots", hp: 95, fireRate: 1350, damage: 19, shot: "ice", slow: 2000, family: "shooter", element: "crystal" },
  { id: "voidChomper", name: "Void Chomper", price: 460, cost: 190, role: "Shadowy bite that weakens", hp: 200, fireRate: 2450, damage: 155, melee: true, slowBite: 1800, family: "chomper", element: "shadow" },
];

const plantStats = Object.fromEntries(plantCatalog.map((plant) => [plant.id, plant]));
const costs = Object.fromEntries(plantCatalog.map((plant) => [plant.id, plant.cost]));
const starterPlants = ["pea", "ice", "fire", "spike", "sunflower"];
const paidPlants = plantCatalog.filter((plant) => plant.price > 0).map((plant) => plant.id);
const defaultSave = { coins: 0, unlocked: starterPlants, equipped: starterPlants, wave: 1 };

const zombieTypes = [
  { kind: "normal", min: 0, weight: 38, hp: 120, speed: 0.00022, damage: 16 },
  { kind: "flag", min: 3, weight: 10, hp: 110, speed: 0.00027, damage: 14, aura: true },
  { kind: "runner", min: 5, weight: 14, hp: 85, speed: 0.00036, damage: 12 },
  { kind: "cone", min: 7, weight: 18, hp: 165, speed: 0.0002, damage: 18 },
  { kind: "bucket", min: 10, weight: 12, hp: 230, speed: 0.00018, damage: 22, armor: 0.18 },
  { kind: "shield", min: 12, weight: 10, hp: 180, speed: 0.00019, damage: 18, shield: 85 },
  { kind: "healer", min: 14, weight: 8, hp: 150, speed: 0.0002, damage: 12, healer: true },
  { kind: "leaper", min: 16, weight: 8, hp: 135, speed: 0.00028, damage: 15, leaper: true },
  { kind: "toxic", min: 18, weight: 7, hp: 170, speed: 0.00021, damage: 14, toxic: true },
  { kind: "brute", min: 20, weight: 6, hp: 320, speed: 0.00015, damage: 30, armor: 0.24 },
];

const initial = loadSave();
const state = {
  account: initial.account,
  coins: initial.coins,
  unlocked: initial.unlocked,
  equipped: initial.equipped,
  phase: "setup",
  sun: 75,
  wave: initial.wave,
  selected: initial.equipped[0],
  deleteMode: false,
  dirty: false,
  running: false,
  won: false,
  lost: false,
  nextId: 1,
  plants: [],
  zombies: [],
  shots: [],
  spawned: 0,
  target: 0,
  spawnTimer: 2200,
  sunTimer: 0,
  lastTime: 0,
  clock: 0,
  saveNote: initial.account ? "Loaded" : "Sign in",
};

const els = {
  lawn: document.querySelector("#lawn"),
  coins: document.querySelector("#coin-count"),
  saveStatus: document.querySelector("#save-status"),
  sun: document.querySelector("#sun-count"),
  wave: document.querySelector("#wave-count"),
  zombiesLeft: document.querySelector("#zombies-left"),
  status: document.querySelector("#status-label"),
  messageTitle: document.querySelector("#message-title"),
  message: document.querySelector("#message"),
  newGame: document.querySelector("#new-game"),
  startRound: document.querySelector("#start-round"),
  shopButton: document.querySelector("#shop-button"),
  deletePlant: document.querySelector("#delete-plant"),
  saveProgress: document.querySelector("#save-progress"),
  accountForm: document.querySelector("#account-form"),
  accountUsername: document.querySelector("#account-username"),
  accountPassword: document.querySelector("#account-password"),
  accountLabel: document.querySelector("#account-label"),
  logoutAccount: document.querySelector("#logout-account"),
  closeShop: document.querySelector("#close-shop"),
  shopBackdrop: document.querySelector("#shop-backdrop"),
  shopModal: document.querySelector("#shop-modal"),
  shopNote: document.querySelector("#shop-note"),
  seedBank: document.querySelector("#seed-bank"),
  plantShop: document.querySelector("#plant-shop"),
  loadoutCount: document.querySelector("#loadout-count"),
};

let lastSeedHtml = "";
let lastShopHtml = "";

function getAccounts() {
  try {
    return JSON.parse(localStorage.getItem(accountsKey) || "{}");
  } catch {
    return {};
  }
}

function writeAccounts(accounts) {
  localStorage.setItem(accountsKey, JSON.stringify(accounts));
}

function normalizeSave(data) {
  const coins = Math.max(0, Math.floor(Number(data.coins) || 0));
  const unlocked = [...new Set([...(data.unlocked || []), ...starterPlants])].filter((id) => plantStats[id]);
  const paidUnlocked = unlocked.filter((id) => paidPlants.includes(id));
  const cleanUnlocked = [...starterPlants, ...paidUnlocked];
  const equipped = (data.equipped || starterPlants).map((id) => id === "chomper" && !cleanUnlocked.includes("chomper") ? "sunflower" : id).filter((id) => cleanUnlocked.includes(id)).slice(0, maxEquipped);
  return { coins, unlocked: cleanUnlocked, equipped: equipped.length === maxEquipped ? equipped : starterPlants, wave: Math.max(1, Number(data.wave) || 1) };
}

function loadSave() {
  const active = sessionStorage.getItem(activeAccountKey) || "";
  const accounts = getAccounts();
  if (active && accounts[active]) return { account: active, ...normalizeSave(accounts[active].save || defaultSave) };
  return { account: "", ...defaultSave };
}

function snapshotSave() {
  return { coins: state.coins, unlocked: state.unlocked, equipped: state.equipped, wave: state.wave };
}

function markUnsaved(note = "Unsaved") {
  state.dirty = true;
  state.saveNote = note;
  if (els.saveStatus) els.saveStatus.textContent = note;
}

function saveGame(note = "Saved") {
  if (!state.account) {
    state.saveNote = "Sign in first";
    if (els.saveStatus) els.saveStatus.textContent = state.saveNote;
    setMessage("Sign in first", "Create or sign into an account, then press Save to store your progress.");
    render();
    return;
  }
  const accounts = getAccounts();
  if (!accounts[state.account]) {
    state.saveNote = "Account missing";
    if (els.saveStatus) els.saveStatus.textContent = state.saveNote;
    return;
  }
  accounts[state.account].save = snapshotSave();
  writeAccounts(accounts);
  state.dirty = false;
  state.saveNote = note;
  if (els.saveStatus) els.saveStatus.textContent = note;
  setMessage("Progress saved", `${state.account}'s plants, coins, and wave were saved.`);
  render();
}

function signInOrCreate(event) {
  event.preventDefault();
  const username = els.accountUsername.value.trim().replace(/\s+/g, "_").slice(0, 18);
  const password = els.accountPassword.value;
  if (!username || !password) return setMessage("Account needed", "Type a username and password first.");

  const accounts = getAccounts();
  if (accounts[username]) {
    if (accounts[username].password !== password) return setMessage("Wrong password", "That username already exists. Try the right password.");
  } else {
    accounts[username] = { password, save: normalizeSave(defaultSave) };
    writeAccounts(accounts);
  }

  const save = normalizeSave(accounts[username].save || defaultSave);
  sessionStorage.setItem(activeAccountKey, username);
  Object.assign(state, { account: username, coins: save.coins, unlocked: save.unlocked, equipped: save.equipped, wave: save.wave, selected: save.equipped[0], dirty: false, saveNote: "Loaded" });
  els.accountPassword.value = "";
  lastSeedHtml = "";
  lastShopHtml = "";
  setupRound(`${username} is signed in. Progress only saves when you press Save.`);
}

function logoutAccount() {
  sessionStorage.removeItem(activeAccountKey);
  Object.assign(state, { account: "", coins: 0, unlocked: starterPlants, equipped: starterPlants, wave: 1, selected: starterPlants[0], dirty: false, saveNote: "Sign in" });
  lastSeedHtml = "";
  lastShopHtml = "";
  setupRound("Signed out. Create or sign into an account before playing if you want to save progress.");
}

function setupRound(message = "Sign in or create an account, open the shop, equip exactly five plants, then start the round. Progress only saves when you press Save.") {
  Object.assign(state, { phase: "setup", sun: 75, selected: state.equipped[0], deleteMode: false, running: false, won: false, lost: false, nextId: 1, plants: [], zombies: [], shots: [], spawned: 0, target: 0, spawnTimer: 2200, sunTimer: 0, lastTime: performance.now(), clock: 0 });
  lastSeedHtml = "";
  buildTiles();
  setMessage("Prepare the lawn", message);
  render();
}

function startRound() {
  if (state.phase === "running") return;
  if (state.equipped.length !== maxEquipped) {
    setMessage("Choose exactly five", "Open the shop and equip five unlocked plants before starting.");
    openShop();
    return;
  }
  Object.assign(state, { phase: "running", sun: 75, selected: state.equipped[0], deleteMode: false, running: true, won: false, lost: false, plants: [], zombies: [], shots: [], spawned: 0, target: 24 + state.wave * 4, spawnTimer: 1800, sunTimer: 0, lastTime: performance.now(), clock: 0 });
  closeShop();
  buildTiles();
  setMessage(`Wave ${state.wave}`, "The loadout is locked. Spend sun to plant and stop the special zombies.");
  lastSeedHtml = "";
  lastShopHtml = "";
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
  els.lawn.insertAdjacentHTML("beforeend", '<div class="entity-layer"></div><div class="shot-layer"></div>');
}

function plantAt(row, col) {
  if (!state.running || state.lost || state.won) return;
  const existingIndex = state.plants.findIndex((plant) => plant.row === row && plant.col === col);
  if (state.deleteMode) {
    if (existingIndex === -1) return setMessage("No plant there", "Click a planted tile to remove that plant.");
    const [removed] = state.plants.splice(existingIndex, 1);
    setMessage("Plant removed", `${plantStats[removed.type].name} was deleted from the lawn.`);
    render();
    return;
  }
  if (!state.equipped.includes(state.selected)) return;
  if (col > 5) return setMessage("Too far forward", "Plant closer to the house. Zombies enter from the right side.");
  if (existingIndex !== -1) return;
  const stats = plantStats[state.selected];
  if (state.sun < stats.cost) return setMessage("Need more sun", `${stats.name} costs ${stats.cost} sun.`);
  state.sun -= stats.cost;
  state.plants.push({ id: state.nextId += 1, type: state.selected, row, col, hp: stats.hp, cooldown: stats.sunRate || 420, action: 0 });
  setMessage(`${stats.name} planted`, stats.role);
  render();
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
  const options = zombieTypes.filter((type) => state.spawned >= type.min || state.wave >= Math.ceil(type.min / 4));
  let roll = Math.random() * options.reduce((sum, type) => sum + type.weight, 0);
  for (const type of options) {
    roll -= type.weight;
    if (roll <= 0) return type;
  }
  return options[0];
}

function spawnZombie() {
  const type = chooseZombieType();
  state.zombies.push({ id: state.nextId += 1, row: Math.floor(Math.random() * rows), x: cols + 0.35, hp: type.hp, maxHp: type.hp, speed: type.speed, slow: 0, poison: 0, eat: 0, damage: type.damage, kind: type.kind, armor: type.armor || 0, shield: type.shield || 0, healer: !!type.healer, healTimer: 900, aura: !!type.aura, leaper: !!type.leaper, leaped: false, toxic: !!type.toxic });
  state.spawned += 1;
  state.spawnTimer = Math.max(610, 2450 - state.spawned * 45 - state.wave * 35);
}

function updatePlants(dt) {
  for (const plant of state.plants) {
    const stats = plantStats[plant.type];
    plant.action = Math.max(0, plant.action - dt);
    if (stats.sunRate) {
      plant.cooldown -= dt;
      if (plant.cooldown <= 0) {
        state.sun += stats.sunAmount || 25;
        plant.action = 500;
        plant.cooldown = stats.sunRate;
      }
      continue;
    }
    if (!stats.fireRate) continue;
    plant.cooldown -= dt;
    if (stats.trap) {
      const victims = state.zombies.filter((zombie) => zombie.row === plant.row && Math.abs(zombie.x - plant.col) < 0.62);
      if (victims.length && plant.cooldown <= 0) {
        victims.forEach((zombie) => { damageZombie(zombie, stats.damage); if (stats.slowAura) zombie.slow = Math.max(zombie.slow, stats.slowAura); });
        plant.action = 320;
        plant.cooldown = stats.fireRate;
      }
      continue;
    }
    const target = nearestZombieInLane(plant.row, plant.col);
    if (!target || plant.cooldown > 0) continue;
    if (stats.melee) {
      if (target.x - plant.col < 1.32) {
        damageZombie(target, stats.damage);
        plant.action = 520;
        plant.cooldown = stats.fireRate;
      }
      continue;
    }
    (stats.multiRows || [0]).forEach((offset) => {
      const shotRow = plant.row + offset;
      if (shotRow < 0 || shotRow >= rows || !nearestZombieInLane(shotRow, plant.col)) return;
      state.shots.push({ id: state.nextId += 1, row: shotRow, x: plant.col + 0.68, type: stats.shot, damage: stats.damage, slow: stats.slow || 0, poison: stats.poison || 0, chain: stats.chain || 0, splash: stats.splash || 0, speed: shotSpeed(stats.shot) });
    });
    plant.action = 280;
    plant.cooldown = stats.fireRate;
  }
}

function shotSpeed(type) {
  return { fire: 0.0085, cannon: 0.0062, volt: 0.0092, angry: 0.0095, toxic: 0.0075 }[type] || 0.0072;
}

function nearestZombieInLane(row, col) {
  return state.zombies.filter((zombie) => zombie.row === row && zombie.x > col - 0.25).sort((a, b) => a.x - b.x)[0];
}

function damageZombie(zombie, amount) {
  let damage = amount * (1 - zombie.armor);
  if (zombie.shield > 0) {
    const blocked = Math.min(zombie.shield, damage * 0.65);
    zombie.shield -= blocked;
    damage -= blocked;
  }
  zombie.hp -= Math.max(1, damage);
}

function updateShots(dt) {
  for (const shot of state.shots) {
    shot.x += shot.speed * dt;
    const hit = state.zombies.find((zombie) => zombie.row === shot.row && zombie.x <= shot.x + 0.25 && zombie.x >= shot.x - 0.45);
    if (!hit) continue;
    damageZombie(hit, shot.damage);
    if (shot.slow) hit.slow = Math.max(hit.slow, shot.slow);
    if (shot.poison) hit.poison = Math.max(hit.poison, shot.poison);
    if (shot.splash) state.zombies.filter((zombie) => zombie !== hit && zombie.row === hit.row && Math.abs(zombie.x - hit.x) <= shot.splash).forEach((zombie) => damageZombie(zombie, Math.round(shot.damage * 0.52)));
    if (shot.chain) state.zombies.filter((zombie) => zombie !== hit && Math.abs(zombie.row - hit.row) <= 1 && Math.abs(zombie.x - hit.x) <= 1.4).slice(0, shot.chain).forEach((zombie) => { damageZombie(zombie, Math.round(shot.damage * 0.7)); zombie.slow = Math.max(zombie.slow, 500); });
    shot.hit = true;
  }
}

function updateZombies(dt) {
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
        state.zombies.filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.35).forEach((other) => { other.hp = Math.min(other.maxHp, other.hp + 16); });
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
    if (zombie.x < -0.35) loseGame();
  }
}

function cleanup() {
  state.shots = state.shots.filter((shot) => !shot.hit && shot.x < cols + 0.6);
  state.zombies = state.zombies.filter((zombie) => zombie.hp > 0);
  state.plants = state.plants.filter((plant) => plant.hp > 0);
}

function checkEnd() {
  if (!state.lost && !state.won && state.spawned >= state.target && state.zombies.length === 0) {
    const reward = 85 + state.wave * 25;
    state.coins += reward;
    state.wave += 1;
    state.won = true;
    state.running = false;
    state.phase = "setup";
    closeShop();
    markUnsaved("Unsaved win");
    setMessage("You defended the lawn", `You earned ${reward} Seed Coins. Press Save to keep this progress.`);
    lastShopHtml = "";
  }
}

function loseGame() {
  if (state.lost) return;
  state.lost = true;
  state.running = false;
  state.phase = "setup";
  closeShop();
  markUnsaved("Unsaved retry");
  setMessage("The zombies got through", "Adjust your loadout, then try again. Press Save if you want to keep account progress changes.");
}

function render() {
  els.coins.textContent = state.coins;
  if (els.saveStatus) els.saveStatus.textContent = state.saveNote;
  if (els.accountLabel) els.accountLabel.textContent = state.account ? `Signed in as ${state.account}` : "No account signed in";
  els.sun.textContent = Math.floor(state.sun);
  els.wave.textContent = state.wave;
  els.zombiesLeft.textContent = state.phase === "running" ? Math.max(0, state.target - state.spawned + state.zombies.length) : 0;
  els.status.textContent = state.deleteMode ? "Delete" : state.phase === "running" ? "Round" : state.won ? "Win" : state.lost ? "Retry" : "Setup";
  els.startRound.disabled = state.phase === "running" || state.equipped.length !== maxEquipped;
  els.shopButton.disabled = state.phase === "running";
  if (els.deletePlant) els.deletePlant.classList.toggle("active", state.deleteMode);
  renderSeedBank();
  renderShop();
  const entityLayer = els.lawn.querySelector(".entity-layer");
  const shotLayer = els.lawn.querySelector(".shot-layer");
  if (!entityLayer || !shotLayer) return;
  entityLayer.innerHTML = state.plants.map(renderPlant).join("") + state.zombies.map(renderZombie).join("");
  shotLayer.innerHTML = state.shots.map(renderShot).join("");
}

function renderSeedBank() {
  const html = state.equipped.map((id) => {
    const plant = plantStats[id];
    const locked = state.phase === "running" && state.sun < plant.cost;
    return `<button class="seed-card ${id === state.selected && !state.deleteMode ? "active" : ""} ${locked ? "locked" : ""}" data-plant="${id}" type="button"><span class="mini-plant ${id} ${plantVisualClasses(plant)}"></span><strong>${plant.name}</strong><small>${plant.cost} sun</small></button>`;
  }).join("");
  if (html !== lastSeedHtml) {
    els.seedBank.innerHTML = html;
    lastSeedHtml = html;
  }
  els.loadoutCount.textContent = `${state.equipped.length} / ${maxEquipped} equipped`;
}

function renderShop() {
  const lockedDuringRound = state.phase === "running";
  els.shopNote.textContent = lockedDuringRound ? "The shop is locked during a round." : "Only the original five plants are free. Press Save when you want to keep shop changes.";
  const html = plantCatalog.map((plant) => {
    const unlocked = state.unlocked.includes(plant.id);
    const equipped = state.equipped.includes(plant.id);
    const affordable = state.coins >= plant.price;
    const label = unlocked ? (equipped ? "Equipped" : "Equip") : `${plant.price} coins`;
    return `<button class="shop-card ${equipped ? "equipped" : ""} ${unlocked ? "unlocked" : "locked-shop"} ${!affordable && !unlocked ? "too-expensive" : ""}" data-shop-plant="${plant.id}" type="button" ${lockedDuringRound ? "disabled" : ""}><span class="mini-plant ${plant.id} ${plantVisualClasses(plant)}"></span><span class="shop-copy"><strong>${plant.name}</strong><small>${plant.role}</small><em>${label}</em></span></button>`;
  }).join("");
  if (html !== lastShopHtml) {
    els.plantShop.innerHTML = html;
    lastShopHtml = html;
  }
}

function position(row, x) {
  return `left:${(x + 0.5) * (100 / cols)}%;top:${(row + 0.56) * (100 / rows)}%;`;
}

function plantVisualClasses(stats) {
  const family = stats.family || "shooter";
  const element = stats.element || "plain";
  const multi = stats.multiRows && stats.multiRows.length > 1 ? " multi" : "";
  const rapid = stats.repeat >= 4 ? " rapid" : "";
  const wide = (stats.coverCols || 1) > 1 ? " wide" : (stats.coverRows || 1) > 1 ? " tall" : "";
  return `fam-${family} elem-${element}${multi}${rapid}${wide}`;
}

// Shared plant body markup — a fresh, faceless-free design (see sprites.css).
// Deliberately uses new pv-* class names so none of the legacy patch
// stylesheets (which fight over .plant-head/.mouth/.stem/.leaves) can touch it.
function plantBodyHTML() {
  return '<span class="pv-leaves"></span><span class="pv-stem"></span><span class="pv-head"><span class="pv-mouth"></span></span>';
}

function renderPlant(plant) {
  const stats = plantStats[plant.type];
  const bob = Math.sin((state.clock + plant.id * 113) / 360) * 3;
  const tilt = Math.sin((state.clock + plant.id * 71) / 520) * 4;
  const action = plant.action > 0 ? " action" : "";
  const style = `${position(plant.row, plant.col)}--bob:${bob.toFixed(2)}px;--tilt:${tilt.toFixed(2)}deg;--pulse:${plant.action > 0 ? 1.08 : 1};`;
  return `<div class="plant ${plant.type} ${plantVisualClasses(stats)}${action}" style="${style}">${plantBodyHTML()}</div>`;
}

// Shared zombie body markup — new z-* elements for the actual body (head,
// torso, eyes, legs) layered underneath the legacy accessory slots
// (helmet/cone/flag/shield-plate/arm) that boss-zombies.css already knows
// how to dress for special kinds.
function zombieBodyHTML(label) {
  return `<span class="ability-tag">${label || ""}</span><span class="z-leg z-leg-back"></span><span class="z-leg z-leg-front"></span><span class="helmet"></span><span class="cone"></span><span class="flag"></span><span class="z-torso"><span class="z-tear z-tear-l"></span><span class="z-tear z-tear-r"></span></span><span class="shield-plate"></span><span class="z-head"><span class="z-eye"></span><span class="z-mouth"></span></span><span class="arm"></span><span class="ability-aura"></span><span class="boss-bar"></span>`;
}

function renderZombie(zombie) {
  const limp = Math.sin((state.clock + zombie.id * 37) / 170) * 3;
  const hurt = Math.max(0, 1 - zombie.hp / zombie.maxHp);
  const status = `${zombie.slow > 0 ? " slow" : ""}${zombie.poison > 0 ? " poison" : ""}${zombie.shield > 0 ? " shielded" : ""}`;
  return `<div class="zombie ${zombie.kind}${status}" style="${position(zombie.row, zombie.x)}--limp:${limp.toFixed(2)}deg;--hurt:${hurt.toFixed(2)};">${zombieBodyHTML(zombie.kind.toUpperCase())}</div>`;
}

function renderShot(shot) {
  return `<span class="shot ${shot.type}" style="${position(shot.row, shot.x)}"></span>`;
}

function setMessage(title, message) {
  els.messageTitle.textContent = title;
  els.message.textContent = message;
}

function openShop() {
  if (state.phase === "running") return;
  els.shopModal.classList.remove("hidden");
  els.shopModal.setAttribute("aria-hidden", "false");
  renderShop();
}

function closeShop() {
  els.shopModal.classList.add("hidden");
  els.shopModal.setAttribute("aria-hidden", "true");
}

els.accountForm.addEventListener("submit", signInOrCreate);
els.logoutAccount.addEventListener("click", logoutAccount);
els.saveProgress.addEventListener("click", () => saveGame("Saved"));
els.deletePlant.addEventListener("click", () => {
  state.deleteMode = !state.deleteMode;
  setMessage(state.deleteMode ? "Delete mode on" : "Delete mode off", state.deleteMode ? "Click any planted tile to remove that plant." : "Choose a seed card, then click the lawn to plant.");
  render();
});

els.seedBank.addEventListener("click", (event) => {
  const card = event.target.closest(".seed-card[data-plant]");
  if (!card) return;
  state.selected = card.dataset.plant;
  state.deleteMode = false;
  setMessage(`${plantStats[state.selected].name} selected`, state.phase === "running" ? `Click a lawn tile to plant it for ${costs[state.selected]} sun.` : "This plant is ready in your locked-in loadout.");
  render();
});

els.plantShop.addEventListener("click", (event) => {
  if (state.phase === "running") return;
  const card = event.target.closest(".shop-card[data-shop-plant]");
  if (!card) return;
  const id = card.dataset.shopPlant;
  const plant = plantStats[id];
  if (!state.unlocked.includes(id)) {
    if (state.coins < plant.price) return setMessage("Need more Seed Coins", `Beat rounds to earn coins. ${plant.name} costs ${plant.price}.`);
    state.coins -= plant.price;
    state.unlocked.push(id);
    markUnsaved("Unsaved shop");
    setMessage(`${plant.name} bought`, "Press Save if you want to keep this purchase.");
  } else if (state.equipped.includes(id)) {
    state.equipped = state.equipped.filter((plantId) => plantId !== id);
    if (state.selected === id) state.selected = state.equipped[0] || "";
    markUnsaved("Unsaved shop");
    setMessage(`${plant.name} unequipped`, "Equip exactly five plants before starting, then press Save to keep it.");
  } else {
    if (state.equipped.length >= maxEquipped) return setMessage("Loadout full", "Unequip one plant first. You can only carry five plants at a time.");
    state.equipped.push(id);
    state.selected = id;
    markUnsaved("Unsaved shop");
    setMessage(`${plant.name} equipped`, `${plant.role} Press Save to keep this loadout.`);
  }
  lastSeedHtml = "";
  lastShopHtml = "";
  render();
});

els.shopButton.addEventListener("click", openShop);
els.closeShop.addEventListener("click", closeShop);
els.shopBackdrop.addEventListener("click", closeShop);
els.startRound.addEventListener("click", startRound);
els.newGame.addEventListener("click", () => setupRound("Round reset. Shop and equip five plants, then start again. Press Save to keep progress."));
setupRound();
window.requestAnimationFrame(loop);
