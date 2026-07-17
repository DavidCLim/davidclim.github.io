(() => {
  const bossEvery = 3;
  const originalStartRound = startRound;
  const originalSetupRound = setupRound;
  const originalSpawnZombie = spawnZombie;

  function isBossWave() {
    return state.wave >= 3 && state.wave % bossEvery === 0;
  }

  function resetBossState() {
    state.bossSpawnedForWave = false;
    state.bossWarningShown = false;
  }

  setupRound = function upgradedSetupRound(message) {
    originalSetupRound(message);
    resetBossState();
  };

  startRound = function upgradedStartRound() {
    originalStartRound();
    resetBossState();
    if (state.phase === "running" && isBossWave()) {
      setMessage(`Wave ${state.wave}: giant zombie`, "A giant zombie will enter once the wave is underway. Save sun for heavy defenses.");
    }
  };

  function spawnGiantZombie() {
    const hp = 640 + state.wave * 135;
    const row = Math.floor(Math.random() * rows);
    state.zombies.push({
      id: state.nextId += 1,
      row,
      x: cols + 0.55,
      hp,
      maxHp: hp,
      speed: 0.000095,
      slow: 0,
      poison: 0,
      eat: 0,
      damage: 48 + state.wave * 2,
      kind: "giant",
      armor: 0.16,
      shield: 140 + state.wave * 20,
      boss: true,
      stompTimer: 1450,
      roarTimer: 3200,
      stompFlash: 0,
      roarFlash: 0,
      toxic: false,
    });
    state.spawned += 1;
    state.spawnTimer = 1700;
    state.bossSpawnedForWave = true;
    setMessage("GIANT ZOMBIE!", "It stomps nearby plants and roars to slow your defenses. Focus fire before it reaches the house.");
  }

  spawnZombie = function upgradedSpawnZombie() {
    const bossMoment = isBossWave() && !state.bossSpawnedForWave && state.spawned >= Math.max(5, Math.floor(state.target * 0.38));
    if (bossMoment) return spawnGiantZombie();
    originalSpawnZombie();
  };

  function pulse(zombie, key, duration) {
    zombie[key] = duration;
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

      if (zombie.kind === "runner" && !zombie.dashed && zombie.x < cols - 1.4) {
        zombie.dashed = true;
        zombie.dashFlash = 900;
      }

      if (zombie.poison > 0) {
        zombie.poison = Math.max(0, zombie.poison - dt);
        damageZombie(zombie, 0.008 * dt);
      }

      if (zombie.healer) {
        zombie.healTimer -= dt;
        if (zombie.healTimer <= 0) {
          state.zombies
            .filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.35)
            .forEach((other) => { other.hp = Math.min(other.maxHp, other.hp + 18); other.healFlash = 520; });
          zombie.healFlash = 620;
          zombie.healTimer = 1200;
        }
      }

      if (zombie.boss) {
        zombie.stompTimer -= dt;
        zombie.roarTimer -= dt;
        if (zombie.stompTimer <= 0) {
          state.plants
            .filter((plant) => Math.abs(plant.row - zombie.row) <= 1 && Math.abs(plant.col - zombie.x) <= 1.15)
            .forEach((plant) => { plant.hp -= 34 + state.wave * 2; plant.action = Math.max(plant.action, 360); });
          pulse(zombie, "stompFlash", 540);
          zombie.stompTimer = 1900;
        }
        if (zombie.roarTimer <= 0) {
          state.plants
            .filter((plant) => Math.abs(plant.row - zombie.row) <= 1 && Math.abs(plant.col - zombie.x) <= 3.1)
            .forEach((plant) => { plant.cooldown += 560; plant.action = Math.max(plant.action, 260); });
          pulse(zombie, "roarFlash", 700);
          zombie.roarTimer = 4200;
        }
      }

      const blocker = state.plants.find((plant) => plant.row === zombie.row && Math.abs(zombie.x - plant.col) < (zombie.boss ? 0.62 : 0.42));
      if (blocker && zombie.leaper && !zombie.leaped && zombie.x > blocker.col) {
        zombie.x -= 0.95;
        zombie.leaped = true;
        pulse(zombie, "leapFlash", 650);
        continue;
      }

      if (blocker) {
        zombie.eat -= dt;
        if (zombie.eat <= 0) {
          blocker.hp -= zombie.damage + (zombie.toxic ? 8 : 0);
          if (zombie.boss) blocker.hp -= 12;
          zombie.eat = zombie.boss ? 560 : zombie.toxic ? 360 : 480;
        }
      } else {
        const dashBoost = zombie.dashFlash > 0 ? 1.85 : 1;
        const flagBoost = flagRows.has(zombie.row) && !zombie.aura ? 1.18 : 1;
        zombie.x -= zombie.speed * (zombie.slow > 0 ? 0.42 : 1) * dashBoost * flagBoost * dt;
      }

      if (zombie.x < -0.35) loseGame();
    }
  };

  renderZombie = function upgradedRenderZombie(zombie) {
    const limp = Math.sin((state.clock + zombie.id * 37) / (zombie.boss ? 240 : 170)) * (zombie.boss ? 1.5 : 3);
    const hurt = Math.max(0, 1 - zombie.hp / zombie.maxHp);
    const status = `${zombie.slow > 0 ? " slow" : ""}${zombie.poison > 0 ? " poison" : ""}${zombie.shield > 0 ? " shielded" : ""}${zombie.boss ? " boss" : ""}${zombie.healFlash > 0 ? " healing" : ""}${zombie.dashFlash > 0 ? " dashing" : ""}${zombie.leapFlash > 0 ? " leaping" : ""}${zombie.stompFlash > 0 ? " stomping" : ""}${zombie.roarFlash > 0 ? " roaring" : ""}`;
    const label = zombie.boss ? "GIANT" : zombie.kind.toUpperCase();
    const hpPct = Math.max(0, Math.round((zombie.hp / zombie.maxHp) * 100));
    return `<div class="zombie ${zombie.kind}${status}" style="${position(zombie.row, zombie.x)}--limp:${limp.toFixed(2)}deg;--hurt:${hurt.toFixed(2)};--hp:${hpPct}%;"><span class="ability-tag">${label}</span><span class="helmet"></span><span class="cone"></span><span class="flag"></span><span class="shield-plate"></span><span class="eye"></span><span class="arm"></span><span class="ability-aura"></span><span class="boss-bar"></span></div>`;
  };
})();
