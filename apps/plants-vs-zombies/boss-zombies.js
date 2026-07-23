(() => {
  const originalStartRound = startRound;
  const originalSetupRound = setupRound;
  const originalLoseGame = loseGame;

  const waveBands = [
    { min: 1, name: "Sprout", target: 18, hp: 1, speed: 1, damage: 1, reward: 110 },
    { min: 4, name: "Garden Rush", target: 24, hp: 1.16, speed: 1.06, damage: 1.08, reward: 160 },
    { min: 8, name: "Overgrown", target: 30, hp: 1.34, speed: 1.12, damage: 1.16, reward: 225 },
    { min: 13, name: "Night Lawn", target: 38, hp: 1.58, speed: 1.18, damage: 1.25, reward: 310 },
    { min: 19, name: "Nightmare", target: 48, hp: 1.9, speed: 1.25, damage: 1.38, reward: 430 },
  ];

  const enemyRoster = [
    { kind: "normal", min: 1, weight: 38, hp: 118, speed: 0.00022, damage: 16 },
    { kind: "flag", min: 2, weight: 10, hp: 112, speed: 0.00027, damage: 14, aura: true },
    { kind: "runner", min: 3, weight: 16, hp: 92, speed: 0.00034, damage: 13, dash: true },
    { kind: "cone", min: 4, weight: 18, hp: 168, speed: 0.0002, damage: 18, armor: 0.08 },
    { kind: "bucket", min: 6, weight: 13, hp: 245, speed: 0.00018, damage: 22, armor: 0.2 },
    { kind: "shield", min: 7, weight: 12, hp: 185, speed: 0.00019, damage: 19, shield: 100 },
    { kind: "healer", min: 9, weight: 9, hp: 160, speed: 0.0002, damage: 13, healer: true },
    { kind: "leaper", min: 10, weight: 10, hp: 142, speed: 0.00028, damage: 16, leaper: true },
    { kind: "toxic", min: 12, weight: 9, hp: 178, speed: 0.00021, damage: 15, toxic: true, poisonAura: true },
    { kind: "brute", min: 15, weight: 7, hp: 345, speed: 0.00015, damage: 32, armor: 0.26, smash: true },
    { kind: "giant", min: 999, weight: 0, hp: 900, speed: 0.000082, damage: 58, armor: 0.22, shield: 240, boss: true },
  ];

  function bandForWave(wave = state.wave) {
    return waveBands.reduce((best, band) => wave >= band.min ? band : best, waveBands[0]);
  }

  function bossWave(wave = state.wave) {
    return wave >= 3 && wave % 3 === 0;
  }

  function resetBossState() {
    state.bossSpawnedForWave = false;
    state.bossWarningShown = false;
  }

  function scaledType(base) {
    const band = bandForWave();
    const waveBoost = Math.max(0, state.wave - 1);
    const hpScale = band.hp + waveBoost * 0.018;
    const speedScale = band.speed + Math.min(0.28, waveBoost * 0.006);
    const damageScale = band.damage + waveBoost * 0.012;
    return {
      ...base,
      hp: Math.round(base.hp * hpScale),
      maxHp: Math.round(base.hp * hpScale),
      speed: base.speed * speedScale,
      damage: Math.round(base.damage * damageScale),
      shield: base.shield ? Math.round(base.shield * hpScale) : 0,
    };
  }

  function waveTarget() {
    const band = bandForWave();
    return band.target + state.wave * 5 + Math.floor(Math.pow(state.wave, 1.22));
  }

  function waveReward() {
    const band = bandForWave();
    return band.reward + state.wave * 46 + Math.floor(Math.pow(state.wave, 1.35) * 12) + (bossWave(state.wave) ? 170 : 0);
  }

  setupRound = function upgradedSetupRound(message) {
    originalSetupRound(message);
    resetBossState();
  };

  startRound = function upgradedStartRound() {
    originalStartRound();
    if (state.phase !== "running") return;
    resetBossState();
    const band = bandForWave();
    state.target = waveTarget();
    state.spawnTimer = Math.max(760, 1900 - state.wave * 48);
    setMessage(`${band.name} Wave ${state.wave}`, bossWave() ? "A huge boss zombie will enter this wave. Zombies are stronger, but the Seed Coin reward is bigger." : "Zombies get tougher every wave. Beat this round for a bigger Seed Coin reward.");
    render();
  };

  if (els.startRound) {
    els.startRound.addEventListener("click", () => window.setTimeout(() => {
      if (state.phase === "running") {
        state.target = waveTarget();
        state.spawnTimer = Math.max(760, 1900 - state.wave * 48);
      }
    }, 0));
  }

  function weightedZombieType() {
    const options = enemyRoster.filter((type) => state.wave >= type.min && !type.boss);
    const adjusted = options.map((type) => ({
      ...type,
      weight: type.weight + Math.max(0, state.wave - type.min) * (type.kind === "normal" ? -1.1 : 0.8),
    })).filter((type) => type.weight > 1);
    let roll = Math.random() * adjusted.reduce((sum, type) => sum + type.weight, 0);
    for (const type of adjusted) {
      roll -= type.weight;
      if (roll <= 0) return scaledType(type);
    }
    return scaledType(adjusted[0] || enemyRoster[0]);
  }

  function makeZombie(type, row, x) {
    return {
      id: state.nextId += 1,
      row,
      x,
      hp: type.hp,
      maxHp: type.maxHp || type.hp,
      speed: type.speed,
      slow: 0,
      poison: 0,
      eat: 0,
      damage: type.damage,
      kind: type.kind,
      armor: type.armor || 0,
      shield: type.shield || 0,
      healer: !!type.healer,
      healTimer: 980,
      aura: !!type.aura,
      leaper: !!type.leaper,
      leaped: false,
      toxic: !!type.toxic,
      poisonAura: !!type.poisonAura,
      dash: !!type.dash,
      smash: !!type.smash,
      boss: !!type.boss,
      stompTimer: type.boss ? 1150 : 0,
      roarTimer: type.boss ? 2700 : 0,
      stompFlash: 0,
      roarFlash: 0,
      healFlash: 0,
      dashFlash: 0,
      leapFlash: 0,
      shieldFlash: 0,
      poisonFlash: 0,
    };
  }

  function spawnGiantZombie() {
    const base = enemyRoster.find((type) => type.kind === "giant");
    const band = bandForWave();
    const hp = Math.round((980 + state.wave * 190) * band.hp);
    const type = {
      ...base,
      hp,
      maxHp: hp,
      speed: Math.max(0.000065, base.speed * (0.98 + state.wave * 0.008)),
      damage: Math.round((64 + state.wave * 3) * band.damage),
      shield: Math.round(260 + state.wave * 36),
    };
    state.zombies.push(makeZombie(type, Math.floor(Math.random() * rows), cols + 0.78));
    state.spawned += 1;
    state.spawnTimer = 1450;
    state.bossSpawnedForWave = true;
    setMessage("COLOSSAL ZOMBIE!", "It stomps plants, roars to delay cooldowns, and carries huge armor. Bring heavy damage.");
  }

  spawnZombie = function upgradedSpawnZombie() {
    const bossMoment = bossWave() && !state.bossSpawnedForWave && state.spawned >= Math.max(5, Math.floor(state.target * 0.36));
    if (bossMoment) return spawnGiantZombie();
    const type = weightedZombieType();
    state.zombies.push(makeZombie(type, Math.floor(Math.random() * rows), cols + 0.35));
    state.spawned += 1;
    state.spawnTimer = Math.max(420, 2100 - state.wave * 58 - state.spawned * 28);
  };

  function hurtPlantsNear(zombie, range, damage) {
    state.plants
      .filter((plant) => Math.abs(plant.row - zombie.row) <= range.rows && Math.abs(plant.col - zombie.x) <= range.cols)
      .forEach((plant) => { plant.hp -= damage; plant.action = Math.max(plant.action, 340); });
  }

  updateZombies = function upgradedUpdateZombies(dt) {
    const flagRows = new Set(state.zombies.filter((zombie) => zombie.aura).map((zombie) => zombie.row));
    for (const zombie of state.zombies) {
      zombie.slow = Math.max(0, zombie.slow - dt);
      zombie.stompFlash = Math.max(0, (zombie.stompFlash || 0) - dt);
      zombie.roarFlash = Math.max(0, (zombie.roarFlash || 0) - dt);
      zombie.healFlash = Math.max(0, (zombie.healFlash || 0) - dt);
      zombie.dashFlash = Math.max(0, (zombie.dashFlash || 0) - dt);
      zombie.leapFlash = Math.max(0, (zombie.leapFlash || 0) - dt);
      zombie.shieldFlash = Math.max(0, (zombie.shieldFlash || 0) - dt);
      zombie.poisonFlash = Math.max(0, (zombie.poisonFlash || 0) - dt);

      if (zombie.dash && !zombie.dashed && zombie.x < cols - 1.2) {
        zombie.dashed = true;
        zombie.dashFlash = 980;
      }

      if (zombie.poison > 0) {
        zombie.poison = Math.max(0, zombie.poison - dt);
        damageZombie(zombie, 0.008 * dt);
      }

      if (zombie.poisonAura) {
        zombie.poisonTick = (zombie.poisonTick || 0) - dt;
        if (zombie.poisonTick <= 0) {
          hurtPlantsNear(zombie, { rows: 0, cols: 0.88 }, 7 + Math.floor(state.wave * 0.45));
          zombie.poisonFlash = 420;
          zombie.poisonTick = 900;
        }
      }

      if (zombie.healer) {
        zombie.healTimer -= dt;
        if (zombie.healTimer <= 0) {
          state.zombies
            .filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.45)
            .forEach((other) => { other.hp = Math.min(other.maxHp, other.hp + 20 + state.wave); other.healFlash = 560; });
          zombie.healFlash = 700;
          zombie.healTimer = Math.max(780, 1360 - state.wave * 16);
        }
      }

      if (zombie.boss) {
        zombie.stompTimer -= dt;
        zombie.roarTimer -= dt;
        if (zombie.stompTimer <= 0) {
          hurtPlantsNear(zombie, { rows: 1, cols: 1.32 }, 42 + state.wave * 3);
          zombie.stompFlash = 620;
          zombie.stompTimer = Math.max(1050, 2050 - state.wave * 28);
        }
        if (zombie.roarTimer <= 0) {
          state.plants
            .filter((plant) => Math.abs(plant.row - zombie.row) <= 1 && Math.abs(plant.col - zombie.x) <= 3.4)
            .forEach((plant) => { plant.cooldown += 650; plant.action = Math.max(plant.action, 300); });
          zombie.roarFlash = 820;
          zombie.roarTimer = Math.max(2600, 4300 - state.wave * 32);
        }
      }

      const blocker = state.plants.find((plant) => plant.row === zombie.row && Math.abs(zombie.x - plant.col) < (zombie.boss ? 0.66 : 0.42));
      if (blocker && zombie.leaper && !zombie.leaped && zombie.x > blocker.col) {
        zombie.x -= 0.98;
        zombie.leaped = true;
        zombie.leapFlash = 720;
        continue;
      }

      if (blocker) {
        zombie.eat -= dt;
        if (zombie.eat <= 0) {
          blocker.hp -= zombie.damage + (zombie.toxic ? 8 : 0) + (zombie.boss ? 14 : 0);
          if (zombie.smash) hurtPlantsNear(zombie, { rows: 0, cols: 0.7 }, 8 + Math.floor(state.wave * 0.4));
          zombie.eat = zombie.boss ? 540 : zombie.toxic ? 360 : 480;
        }
      } else {
        const dashBoost = zombie.dashFlash > 0 ? 1.95 : 1;
        const flagBoost = flagRows.has(zombie.row) && !zombie.aura ? 1.2 : 1;
        zombie.x -= zombie.speed * (zombie.slow > 0 ? 0.42 : 1) * dashBoost * flagBoost * dt;
      }

      if (zombie.x < -0.35) originalLoseGame();
    }
  };

  checkEnd = function upgradedCheckEnd() {
    if (!state.lost && !state.won && state.spawned >= state.target && state.zombies.length === 0) {
      const reward = waveReward();
      state.coins += reward;
      state.wave += 1;
      state.won = true;
      state.running = false;
      state.phase = "setup";
      closeShop();
      markUnsaved("Unsaved win");
      setMessage("You defended the lawn", `You earned ${reward} Seed Coins. The next wave will be harder. Press Save to keep this progress.`);
      lastShopHtml = "";
    }
  };

  renderZombie = function upgradedRenderZombie(zombie) {
    const limp = Math.sin((state.clock + zombie.id * 37) / (zombie.boss ? 260 : 170)) * (zombie.boss ? 1.2 : 3);
    const hurt = Math.max(0, 1 - zombie.hp / zombie.maxHp);
    const status = `${zombie.slow > 0 ? " slow" : ""}${zombie.poison > 0 ? " poison" : ""}${zombie.shield > 0 ? " shielded" : ""}${zombie.boss ? " boss" : ""}${zombie.healFlash > 0 ? " healing" : ""}${zombie.dashFlash > 0 ? " dashing" : ""}${zombie.leapFlash > 0 ? " leaping" : ""}${zombie.stompFlash > 0 ? " stomping" : ""}${zombie.roarFlash > 0 ? " roaring" : ""}${zombie.poisonFlash > 0 ? " toxic-pulse" : ""}${zombie.smash ? " smasher" : ""}`;
    const label = zombie.boss ? "COLOSSAL" : zombie.kind.toUpperCase();
    const hpPct = Math.max(0, Math.round((zombie.hp / zombie.maxHp) * 100));
    return `<div class="zombie ${zombie.kind}${status}" style="${position(zombie.row, zombie.x)}--limp:${limp.toFixed(2)}deg;--hurt:${hurt.toFixed(2)};--hp:${hpPct}%;"><span class="ability-tag">${label}</span><span class="helmet"></span><span class="cone"></span><span class="flag"></span><span class="shield-plate"></span><span class="eye"></span><span class="arm"></span><span class="ability-aura"></span><span class="boss-bar"></span></div>`;
  };
})();
