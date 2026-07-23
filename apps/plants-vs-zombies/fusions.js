(() => {
  const fusionVersion = "fusion-v1";

  const fusionPlants = {
    repeater: { id: "repeater", name: "Repeater", cost: 100, role: "Fused pea shooter that fires two peas", hp: 135, fireRate: 1120, damage: 20, shot: "pea", repeat: 2, fusion: true },
    snowRepeater: { id: "snowRepeater", name: "Snow Repeater", cost: 130, role: "Double icy shots that slow zombies", hp: 140, fireRate: 1250, damage: 15, shot: "ice", slow: 1900, repeat: 2, fusion: true },
    flameRepeater: { id: "flameRepeater", name: "Flame Repeater", cost: 165, role: "Double fire shots with splash", hp: 135, fireRate: 1350, damage: 24, shot: "fire", splash: 0.58, repeat: 2, fusion: true },
    twinSunflower: { id: "twinSunflower", name: "Twin Sunflower", cost: 100, role: "Produces bigger bursts of sun", hp: 120, sunRate: 4300, sunAmount: 85, fusion: true },
    tallnut: { id: "tallnut", name: "Tallnut", cost: 100, role: "Blocks two rows with thick health", hp: 920, blocker: true, coverRows: 2, fusion: true },
    juggernut: { id: "juggernut", name: "Juggernut", cost: 200, role: "Massive two-row, two-tile wall", hp: 1650, blocker: true, coverRows: 2, coverCols: 2, fusion: true },
    iceChomper: { id: "iceChomper", name: "Ice Chomper", cost: 225, role: "Huge frozen bite that slows targets", hp: 220, fireRate: 2450, damage: 155, melee: true, slowBite: 2300, biteRange: 1.45, fusion: true },
    doubleIceChomper: { id: "doubleIceChomper", name: "Ice Double Chomper", cost: 300, role: "Twin frozen jaws with heavier bite", hp: 330, fireRate: 2150, damage: 235, melee: true, slowBite: 3200, biteRange: 1.7, fusion: true },
    voltRepeater: { id: "voltRepeater", name: "Volt Repeater", cost: 175, role: "Double electric shots that chain", hp: 135, fireRate: 1420, damage: 20, shot: "volt", chain: 2, repeat: 2, fusion: true },
    toxicRepeater: { id: "toxicRepeater", name: "Toxic Repeater", cost: 175, role: "Double poison shots", hp: 135, fireRate: 1350, damage: 14, shot: "toxic", poison: 2800, repeat: 2, fusion: true },
    peaBattery: { id: "peaBattery", name: "Pea Battery", cost: 225, role: "Triple pea upgrade with stronger lanes", hp: 145, fireRate: 1300, damage: 20, shot: "triple", multiRows: [-1, 0, 1], repeat: 2, fusion: true },
    sunChomper: { id: "sunChomper", name: "Sun Chomper", cost: 200, role: "Bites zombies and blooms sun", hp: 210, fireRate: 2500, damage: 135, melee: true, biteSun: 20, biteRange: 1.38, fusion: true },
    cannonRepeater: { id: "cannonRepeater", name: "Cannon Repeater", cost: 250, role: "Double pod blasts with heavy splash", hp: 170, fireRate: 2100, damage: 55, shot: "cannon", splash: 1.08, repeat: 2, fusion: true },
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
  addFusion("ice", "ice", "snowRepeater");
  addFusion("fire", "fire", "flameRepeater");
  addFusion("sunflower", "sunflower", "twinSunflower");
  addFusion("spike", "spike", "tallnut");
  addFusion("tallnut", "tallnut", "juggernut");
  addFusion("ice", "chomper", "iceChomper");
  addFusion("iceChomper", "iceChomper", "doubleIceChomper");
  addFusion("pea", "volt", "voltRepeater");
  addFusion("pea", "toxic", "toxicRepeater");
  addFusion("pea", "triple", "peaBattery");
  addFusion("sunflower", "chomper", "sunChomper");
  addFusion("pea", "cannon", "cannonRepeater");

  function fusionResult(a, b) {
    return rules.get(key(a, b));
  }

  function canSelectForFusion(id) {
    return Boolean(plantStats[id]) && (state.equipped.includes(id) || plantStats[id].fusion);
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
          victims.forEach((zombie) => {
            damageZombie(zombie, stats.damage);
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
        if (target.x - plant.col < (stats.biteRange || 1.32)) {
          damageZombie(target, stats.damage);
          if (stats.slowBite) target.slow = Math.max(target.slow, stats.slowBite);
          if (stats.biteSun) state.sun += stats.biteSun;
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
})();
