(() => {
  const fusionVersion = "fusion-v3";

  const fusionPlants = {
    repeater: { id: "repeater", name: "Repeater", cost: 100, role: "Fused pea shooter that fires two peas", hp: 135, fireRate: 1120, damage: 20, shot: "pea", repeat: 2, fusion: true },
    gatlingPea: { id: "gatlingPea", name: "Gatling Pea", cost: 150, role: "Rapid four-pea burst shooter", hp: 165, fireRate: 980, damage: 18, shot: "pea", repeat: 4, fusion: true },
    snowRepeater: { id: "snowRepeater", name: "Snow Repeater", cost: 130, role: "Double icy shots that slow zombies", hp: 140, fireRate: 1250, damage: 15, shot: "ice", slow: 1900, repeat: 2, fusion: true },
    flameRepeater: { id: "flameRepeater", name: "Flame Repeater", cost: 165, role: "Double fire shots with splash", hp: 135, fireRate: 1350, damage: 24, shot: "fire", splash: 0.58, repeat: 2, fusion: true },
    steamPea: { id: "steamPea", name: "Steam Pea", cost: 175, role: "Hot-cold shots slow and splash", hp: 130, fireRate: 1400, damage: 23, shot: "ice", slow: 1100, splash: 0.62, repeat: 2, fusion: true },
    twinSunflower: { id: "twinSunflower", name: "Twin Sunflower", cost: 100, role: "Produces bigger bursts of sun", hp: 120, sunRate: 4300, sunAmount: 85, fusion: true },
    solarFlare: { id: "solarFlare", name: "Solar Flare", cost: 150, role: "Makes sun faster and burns nearby zombies", hp: 120, sunRate: 3800, sunAmount: 70, auraDamage: 0.006, fusion: true },
    frostFlower: { id: "frostFlower", name: "Frost Flower", cost: 125, role: "Makes sun and chills nearby zombies", hp: 130, sunRate: 4500, sunAmount: 65, auraSlow: 900, fusion: true },
    stormFlower: { id: "stormFlower", name: "Storm Flower", cost: 165, role: "Makes sun and zaps nearby zombies", hp: 125, sunRate: 4600, sunAmount: 75, auraDamage: 0.008, auraSlow: 350, fusion: true },
    toxicSunflower: { id: "toxicSunflower", name: "Toxic Sunflower", cost: 165, role: "Makes sun and poisons nearby zombies", hp: 125, sunRate: 4700, sunAmount: 75, auraPoison: 900, fusion: true },
    tallnut: { id: "tallnut", name: "Tallnut", cost: 100, role: "Blocks two rows with thick health", hp: 920, blocker: true, coverRows: 2, fusion: true },
    juggernut: { id: "juggernut", name: "Juggernut", cost: 200, role: "Massive two-row, two-tile wall", hp: 1650, blocker: true, coverRows: 2, coverCols: 2, fusion: true },
    frostnut: { id: "frostnut", name: "Frostnut", cost: 125, role: "Wall that chills zombies chewing it", hp: 760, blocker: true, onHitSlow: 1700, fusion: true },
    embernut: { id: "embernut", name: "Embernut", cost: 150, role: "Wall that burns zombies chewing it", hp: 700, blocker: true, onHitDamage: 22, fusion: true },
    zapnut: { id: "zapnut", name: "Zapnut", cost: 175, role: "Wall that shocks zombies chewing it", hp: 720, blocker: true, onHitDamage: 16, onHitChain: true, fusion: true },
    venomnut: { id: "venomnut", name: "Venomnut", cost: 175, role: "Wall that poisons zombies chewing it", hp: 720, blocker: true, onHitPoison: 2200, fusion: true },
    brambleNut: { id: "brambleNut", name: "Bramble Nut", cost: 150, role: "Spiky wall that scratches nearby zombies", hp: 820, blocker: true, auraDamage: 0.01, fusion: true },
    iceChomper: { id: "iceChomper", name: "Ice Chomper", cost: 225, role: "Huge frozen bite that slows targets", hp: 220, fireRate: 2450, damage: 155, melee: true, slowBite: 2300, biteRange: 1.45, fusion: true },
    doubleIceChomper: { id: "doubleIceChomper", name: "Ice Double Chomper", cost: 300, role: "Twin frozen jaws with heavier bite", hp: 330, fireRate: 2150, damage: 235, melee: true, slowBite: 3200, biteRange: 1.7, fusion: true },
    fireChomper: { id: "fireChomper", name: "Fire Chomper", cost: 250, role: "Huge burning bite with splash", hp: 230, fireRate: 2380, damage: 175, melee: true, biteSplash: 0.8, biteRange: 1.48, fusion: true },
    toxicChomper: { id: "toxicChomper", name: "Toxic Chomper", cost: 250, role: "Huge poison bite", hp: 230, fireRate: 2380, damage: 145, melee: true, bitePoison: 3500, biteRange: 1.48, fusion: true },
    voltChomper: { id: "voltChomper", name: "Volt Chomper", cost: 265, role: "Huge electric bite that chains", hp: 225, fireRate: 2300, damage: 150, melee: true, biteChain: 2, biteRange: 1.5, fusion: true },
    vineChomper: { id: "vineChomper", name: "Vine Chomper", cost: 240, role: "Snaring bite that holds zombies back", hp: 250, fireRate: 2300, damage: 125, melee: true, slowBite: 3800, biteRange: 1.55, fusion: true },
    sunChomper: { id: "sunChomper", name: "Sun Chomper", cost: 200, role: "Bites zombies and blooms sun", hp: 210, fireRate: 2500, damage: 135, melee: true, biteSun: 20, biteRange: 1.38, fusion: true },
    voltRepeater: { id: "voltRepeater", name: "Volt Repeater", cost: 175, role: "Double electric shots that chain", hp: 135, fireRate: 1420, damage: 20, shot: "volt", chain: 2, repeat: 2, fusion: true },
    toxicRepeater: { id: "toxicRepeater", name: "Toxic Repeater", cost: 175, role: "Double poison shots", hp: 135, fireRate: 1350, damage: 14, shot: "toxic", poison: 2800, repeat: 2, fusion: true },
    peaBattery: { id: "peaBattery", name: "Pea Battery", cost: 225, role: "Triple pea upgrade with stronger lanes", hp: 145, fireRate: 1300, damage: 20, shot: "triple", multiRows: [-1, 0, 1], repeat: 2, fusion: true },
    snowThreepeater: { id: "snowThreepeater", name: "Snow Threepeater", cost: 250, role: "Three lanes of icy shots", hp: 155, fireRate: 1400, damage: 16, shot: "ice", slow: 1800, multiRows: [-1, 0, 1], repeat: 2, fusion: true },
    flameThreepeater: { id: "flameThreepeater", name: "Flame Threepeater", cost: 275, role: "Three lanes of fire splash", hp: 150, fireRate: 1500, damage: 22, shot: "fire", splash: 0.55, multiRows: [-1, 0, 1], repeat: 2, fusion: true },
    voltThreepeater: { id: "voltThreepeater", name: "Volt Threepeater", cost: 300, role: "Three lanes of chaining lightning", hp: 150, fireRate: 1550, damage: 18, shot: "volt", chain: 2, multiRows: [-1, 0, 1], repeat: 2, fusion: true },
    toxicThreepeater: { id: "toxicThreepeater", name: "Toxic Threepeater", cost: 300, role: "Three lanes of poison shots", hp: 150, fireRate: 1500, damage: 14, shot: "toxic", poison: 3200, multiRows: [-1, 0, 1], repeat: 2, fusion: true },
    cannonRepeater: { id: "cannonRepeater", name: "Cannon Repeater", cost: 250, role: "Double pod blasts with heavy splash", hp: 170, fireRate: 2100, damage: 55, shot: "cannon", splash: 1.08, repeat: 2, fusion: true },
    meteorCannon: { id: "meteorCannon", name: "Meteor Cannon", cost: 300, role: "Huge fire cannon splash", hp: 180, fireRate: 2200, damage: 72, shot: "fire", splash: 1.25, repeat: 1, fusion: true },
    glacierCannon: { id: "glacierCannon", name: "Glacier Cannon", cost: 300, role: "Huge ice cannon blast", hp: 185, fireRate: 2250, damage: 54, shot: "ice", slow: 3200, splash: 1.18, repeat: 1, fusion: true },
    railCannon: { id: "railCannon", name: "Rail Cannon", cost: 325, role: "Electric cannon chains through crowds", hp: 180, fireRate: 2200, damage: 54, shot: "volt", chain: 4, splash: 0.55, repeat: 1, fusion: true },
    sludgeCannon: { id: "sludgeCannon", name: "Sludge Cannon", cost: 325, role: "Poison cannon blast", hp: 180, fireRate: 2250, damage: 46, shot: "toxic", poison: 4500, splash: 1.05, repeat: 1, fusion: true },
    frostVine: { id: "frostVine", name: "Frost Vine", cost: 175, role: "Snare that freezes nearby zombies", hp: 150, fireRate: 640, damage: 7, trap: true, slowAura: 1900, fusion: true },
    fireVine: { id: "fireVine", name: "Fire Vine", cost: 200, role: "Snare that burns nearby zombies", hp: 145, fireRate: 660, damage: 18, trap: true, splash: 0.55, fusion: true },
    voltVine: { id: "voltVine", name: "Volt Vine", cost: 225, role: "Snare that shocks nearby zombies", hp: 145, fireRate: 680, damage: 14, trap: true, chain: 2, slowAura: 450, fusion: true },
    toxicVine: { id: "toxicVine", name: "Toxic Vine", cost: 225, role: "Snare that poisons nearby zombies", hp: 145, fireRate: 650, damage: 9, trap: true, poisonAura: 2200, fusion: true },
  };

  Object.entries(fusionPlants).forEach(([id, stats]) => {
    plantStats[id] = stats;
  });

  const rules = new Map();
  function key(a, b) {
    return [a, b].sort().join("+");
  }
  function addFusion(a, b, result) {
    rules.set(key(a, b), result);
  }

  addFusion("pea", "pea", "repeater");
  addFusion("repeater", "pea", "gatlingPea");
  addFusion("ice", "ice", "snowRepeater");
  addFusion("fire", "fire", "flameRepeater");
  addFusion("fire", "ice", "steamPea");
  addFusion("sunflower", "sunflower", "twinSunflower");
  addFusion("sunflower", "fire", "solarFlare");
  addFusion("sunflower", "ice", "frostFlower");
  addFusion("sunflower", "volt", "stormFlower");
  addFusion("sunflower", "toxic", "toxicSunflower");
  addFusion("spike", "spike", "tallnut");
  addFusion("tallnut", "tallnut", "juggernut");
  addFusion("tallnut", "spike", "juggernut");
  addFusion("spike", "ice", "frostnut");
  addFusion("spike", "fire", "embernut");
  addFusion("spike", "volt", "zapnut");
  addFusion("spike", "toxic", "venomnut");
  addFusion("spike", "vine", "brambleNut");
  addFusion("ice", "chomper", "iceChomper");
  addFusion("fire", "chomper", "fireChomper");
  addFusion("toxic", "chomper", "toxicChomper");
  addFusion("volt", "chomper", "voltChomper");
  addFusion("vine", "chomper", "vineChomper");
  addFusion("iceChomper", "iceChomper", "doubleIceChomper");
  addFusion("iceChomper", "ice", "doubleIceChomper");
  addFusion("iceChomper", "chomper", "doubleIceChomper");
  addFusion("pea", "volt", "voltRepeater");
  addFusion("pea", "toxic", "toxicRepeater");
  addFusion("pea", "triple", "peaBattery");
  addFusion("sunflower", "chomper", "sunChomper");
  addFusion("pea", "cannon", "cannonRepeater");
  addFusion("triple", "ice", "snowThreepeater");
  addFusion("triple", "fire", "flameThreepeater");
  addFusion("triple", "volt", "voltThreepeater");
  addFusion("triple", "toxic", "toxicThreepeater");
  addFusion("cannon", "fire", "meteorCannon");
  addFusion("cannon", "ice", "glacierCannon");
  addFusion("cannon", "volt", "railCannon");
  addFusion("cannon", "toxic", "sludgeCannon");
  addFusion("vine", "ice", "frostVine");
  addFusion("vine", "fire", "fireVine");
  addFusion("vine", "volt", "voltVine");
  addFusion("vine", "toxic", "toxicVine");

  function fusionResult(a, b) {
    return rules.get(key(a, b));
  }

  function canSelectForFusion(id) {
    return Boolean(plantStats[id]) && state.equipped.includes(id);
  }

  const originalPlantAt = plantAt;
  plantAt = function plantOrFuseAt(row, col) {
    if (!state.running || state.lost || state.won || state.deleteMode) return originalPlantAt(row, col);
    const existingIndex = state.plants.findIndex((plant) => plant.row === row && plant.col === col);
    if (existingIndex === -1) return originalPlantAt(row, col);

    const base = state.plants[existingIndex];
    const selected = state.selected;
    const result = fusionResult(base.type, selected);
    if (!result || !canSelectForFusion(selected)) {
      setMessage("No fusion", `${plantStats[base.type].name} does not fuse with ${plantStats[selected]?.name || "that plant"}.`);
      return;
    }

    const selectedStats = plantStats[selected];
    if (state.sun < selectedStats.cost) {
      setMessage("Need more sun", `Fusing with ${selectedStats.name} costs ${selectedStats.cost} sun.`);
      return;
    }

    state.sun -= selectedStats.cost;
    const fusionStats = plantStats[result];
    Object.assign(base, {
      type: result,
      hp: fusionStats.hp,
      cooldown: fusionStats.sunRate || Math.min(fusionStats.fireRate || 900, 900),
      action: 900,
    });
    setMessage(`${fusionStats.name} fused`, fusionStats.role);
    render();
  };

  updatePlants = function updatePlantsWithFusions(dt) {
    for (const plant of state.plants) {
      const stats = plantStats[plant.type];
      plant.action = Math.max(0, plant.action - dt);
      const auraVictims = state.zombies.filter((zombie) => zombie.row === plant.row && Math.abs(zombie.x - plant.col) <= 1.15);
      if (stats.auraDamage) auraVictims.forEach((zombie) => damageZombie(zombie, stats.auraDamage * dt));
      if (stats.auraSlow) auraVictims.forEach((zombie) => { zombie.slow = Math.max(zombie.slow, stats.auraSlow); });
      if (stats.auraPoison) auraVictims.forEach((zombie) => { zombie.poison = Math.max(zombie.poison, stats.auraPoison); });

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
        const victims = state.zombies.filter((zombie) => zombie.row === plant.row && Math.abs(zombie.x - plant.col) < 0.72);
        if (victims.length && plant.cooldown <= 0) {
          victims.forEach((zombie) => {
            damageZombie(zombie, stats.damage);
            if (stats.slowAura) zombie.slow = Math.max(zombie.slow, stats.slowAura);
            if (stats.poisonAura) zombie.poison = Math.max(zombie.poison, stats.poisonAura);
            if (stats.chain) state.zombies.filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.1).slice(0, stats.chain).forEach((other) => damageZombie(other, Math.round(stats.damage * 0.72)));
          });
          plant.action = 320;
          plant.cooldown = stats.fireRate;
        }
        continue;
      }
      const target = nearestZombieInLane(plant.row, plant.col);
      if (!target || plant.cooldown > 0) continue;
      if (stats.melee) {
        if (target.x - plant.col < (stats.biteRange || 1.32)) {
          damageZombie(target, stats.damage);
          if (stats.slowBite) target.slow = Math.max(target.slow, stats.slowBite);
          if (stats.bitePoison) target.poison = Math.max(target.poison, stats.bitePoison);
          if (stats.biteSun) state.sun += stats.biteSun;
          if (stats.biteSplash) state.zombies.filter((zombie) => zombie !== target && zombie.row === target.row && Math.abs(zombie.x - target.x) <= stats.biteSplash).forEach((zombie) => damageZombie(zombie, Math.round(stats.damage * 0.45)));
          if (stats.biteChain) state.zombies.filter((zombie) => zombie !== target && Math.abs(zombie.row - target.row) <= 1 && Math.abs(zombie.x - target.x) <= 1.4).slice(0, stats.biteChain).forEach((zombie) => { damageZombie(zombie, Math.round(stats.damage * 0.55)); zombie.slow = Math.max(zombie.slow, 500); });
          plant.action = 620;
          plant.cooldown = stats.fireRate;
        }
        continue;
      }
      (stats.multiRows || [0]).forEach((offset) => {
        const shotRow = plant.row + offset;
        if (shotRow < 0 || shotRow >= rows || !nearestZombieInLane(shotRow, plant.col)) return;
        for (let i = 0; i < (stats.repeat || 1); i += 1) {
          state.shots.push({
            id: state.nextId += 1,
            row: shotRow,
            x: plant.col + 0.62 - i * 0.12,
            type: stats.shot,
            damage: stats.damage,
            slow: stats.slow || 0,
            poison: stats.poison || 0,
            chain: stats.chain || 0,
            splash: stats.splash || 0,
            speed: shotSpeed(stats.shot),
          });
        }
      });
      plant.action = 330;
      plant.cooldown = stats.fireRate;
    }
  };

  function plantBlocksZombie(plant, zombie) {
    const stats = plantStats[plant.type];
    const coverRows = stats.coverRows || 1;
    const coverCols = stats.coverCols || 1;
    const rowBlocked = zombie.row >= plant.row && zombie.row < Math.min(rows, plant.row + coverRows);
    const centerX = plant.col + (coverCols - 1) / 2;
    const hitWidth = coverCols > 1 ? 0.98 : 0.42;
    return rowBlocked && Math.abs(zombie.x - centerX) < hitWidth;
  }

  updateZombies = function updateZombiesWithFusionWalls(dt) {
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
          state.zombies.filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.35).forEach((other) => {
            other.hp = Math.min(other.maxHp, other.hp + 16);
          });
          zombie.healTimer = 1200;
        }
      }
      const blocker = state.plants.find((plant) => plantBlocksZombie(plant, zombie));
      if (blocker && zombie.leaper && !zombie.leaped && zombie.x > blocker.col) {
        const blockerStats = plantStats[blocker.type];
        if (blockerStats.blocker || blockerStats.coverRows) {
          zombie.leaped = true;
        } else {
          zombie.x -= 0.95;
          zombie.leaped = true;
        }
        continue;
      }
      if (blocker) {
        zombie.eat -= dt;
        if (zombie.eat <= 0) {
          const blockerStats = plantStats[blocker.type];
          const wallBonus = blockerStats.blocker ? 0.75 : 1;
          blocker.hp -= (zombie.damage + (zombie.toxic ? 8 : 0)) * wallBonus;
          if (blockerStats.onHitSlow) zombie.slow = Math.max(zombie.slow, blockerStats.onHitSlow);
          if (blockerStats.onHitPoison) zombie.poison = Math.max(zombie.poison, blockerStats.onHitPoison);
          if (blockerStats.onHitDamage) damageZombie(zombie, blockerStats.onHitDamage);
          if (blockerStats.onHitChain) state.zombies.filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.2).slice(0, 2).forEach((other) => damageZombie(other, 12));
          zombie.eat = zombie.toxic ? 360 : 480;
        }
      } else {
        zombie.x -= zombie.speed * (zombie.slow > 0 ? 0.42 : 1) * (flagRows.has(zombie.row) && !zombie.aura ? 1.18 : 1) * dt;
      }
      if (zombie.x < -0.35) loseGame();
    }
  };

  const originalRenderSeedBank = renderSeedBank;
  renderSeedBank = function renderSeedBankWithFusionHint() {
    originalRenderSeedBank();
    els.seedBank.querySelectorAll(".seed-card").forEach((card) => {
      if (!card.querySelector(".fusion-hint")) {
        card.insertAdjacentHTML("beforeend", '<span class="fusion-hint">FUSE</span>');
      }
    });
  };

  window.davidPvzFusions = { version: fusionVersion, rules: [...rules.entries()] };
  if (typeof render === "function") render();
})();
