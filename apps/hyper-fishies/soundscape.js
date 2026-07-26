// Hyper Fishies soundscape: footsteps, shops, fishing effects, and calm background music.
(function () {
  let audioCtx = null;
  let masterGain = null;
  let musicGain = null;
  let sfxGain = null;
  let musicStarted = false;
  let stepTimer = 0;
  let lastMode = state && state.mode;
  let lastCastPhase = null;
  let lastCastPower = false;
  let lastBagCount = state && state.bag ? state.bag.length : 0;
  let lastCoins = state && state.progress ? state.progress.coins : 0;

  function initAudio() {
    if (audioCtx) return;
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) return;
    audioCtx = new AudioClass();
    masterGain = audioCtx.createGain();
    musicGain = audioCtx.createGain();
    sfxGain = audioCtx.createGain();
    masterGain.gain.value = 0.78;
    musicGain.gain.value = 0.13;
    sfxGain.gain.value = 0.38;
    musicGain.connect(masterGain);
    sfxGain.connect(masterGain);
    masterGain.connect(audioCtx.destination);
  }

  function wakeAudio() {
    initAudio();
    if (!audioCtx) return;
    if (audioCtx.state === "suspended") audioCtx.resume();
    if (!musicStarted) startMusic();
  }

  function now() {
    return audioCtx ? audioCtx.currentTime : 0;
  }

  function tone(freq, duration, type, gain, delay, target) {
    initAudio();
    if (!audioCtx) return;
    const t = now() + (delay || 0);
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, gain || 0.08), t + 0.018);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    osc.connect(g);
    g.connect(target || sfxGain);
    osc.start(t);
    osc.stop(t + duration + 0.04);
    return osc;
  }

  function noise(duration, gain, filterFreq, delay) {
    initAudio();
    if (!audioCtx) return;
    const t = now() + (delay || 0);
    const buffer = audioCtx.createBuffer(1, Math.max(1, audioCtx.sampleRate * duration), audioCtx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = audioCtx.createBufferSource();
    const filt = audioCtx.createBiquadFilter();
    const g = audioCtx.createGain();
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(filterFreq || 900, t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(gain || 0.08, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + duration);
    src.buffer = buffer;
    src.connect(filt);
    filt.connect(g);
    g.connect(sfxGain);
    src.start(t);
    src.stop(t + duration + 0.03);
  }

  const sfx = {
    step() {
      noise(0.045, 0.035, 360);
      tone(96 + Math.random() * 18, 0.06, "triangle", 0.018);
    },
    button() {
      tone(520, 0.08, "sine", 0.045);
      tone(760, 0.11, "sine", 0.032, 0.055);
    },
    shop() {
      tone(330, 0.12, "triangle", 0.05);
      tone(440, 0.14, "triangle", 0.045, 0.07);
      tone(660, 0.18, "sine", 0.035, 0.16);
    },
    sell() {
      tone(880, 0.08, "square", 0.035);
      tone(1175, 0.08, "square", 0.032, 0.06);
      tone(1568, 0.12, "sine", 0.03, 0.14);
    },
    buy() {
      tone(392, 0.1, "triangle", 0.05);
      tone(523, 0.1, "triangle", 0.05, 0.08);
      tone(784, 0.2, "sine", 0.055, 0.16);
    },
    castCharge() {
      tone(240, 0.18, "sine", 0.035);
      tone(360, 0.22, "sine", 0.025, 0.08);
    },
    castRelease() {
      noise(0.18, 0.055, 1600);
      const osc = tone(420, 0.32, "sine", 0.045);
      if (osc) osc.frequency.exponentialRampToValueAtTime(210, now() + 0.30);
    },
    splash() {
      noise(0.24, 0.08, 1200);
      tone(170, 0.16, "sine", 0.035);
    },
    bite() {
      tone(920, 0.08, "square", 0.045);
      tone(720, 0.08, "square", 0.04, 0.09);
      noise(0.09, 0.035, 1800, 0.05);
    },
    reel() {
      tone(260 + Math.random() * 80, 0.045, "triangle", 0.028);
    },
    catch() {
      tone(523, 0.09, "sine", 0.05);
      tone(659, 0.09, "sine", 0.05, 0.08);
      tone(784, 0.16, "sine", 0.06, 0.16);
      noise(0.12, 0.04, 2200, 0.08);
    },
    loseFish() {
      const osc = tone(260, 0.28, "sine", 0.035);
      if (osc) osc.frequency.exponentialRampToValueAtTime(120, now() + 0.25);
      noise(0.12, 0.028, 520, 0.08);
    }
  };

  function startMusic() {
    if (!audioCtx || musicStarted) return;
    musicStarted = true;
    const notes = [261.63, 329.63, 392.00, 493.88, 440.00, 392.00, 329.63, 293.66];
    const bass = [130.81, 146.83, 164.81, 196.00];
    let step = 0;
    function scheduleLoop() {
      if (!audioCtx) return;
      const base = now() + 0.05;
      for (let i = 0; i < 16; i++) {
        const t = base + i * 0.72;
        const note = notes[(step + i) % notes.length];
        const bassNote = bass[Math.floor((step + i) / 4) % bass.length];
        softMusicTone(note, t, 0.52, 0.022, "sine");
        if (i % 2 === 0) softMusicTone(note * 2, t + 0.18, 0.34, 0.011, "triangle");
        if (i % 4 === 0) softMusicTone(bassNote, t, 1.35, 0.018, "sine");
      }
      step = (step + 16) % notes.length;
      setTimeout(scheduleLoop, 16 * 720 - 250);
    }
    scheduleLoop();
  }

  function softMusicTone(freq, start, duration, gain, type) {
    const osc = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    const filt = audioCtx.createBiquadFilter();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    filt.type = "lowpass";
    filt.frequency.setValueAtTime(1200, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(gain, start + 0.08);
    g.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(filt);
    filt.connect(g);
    g.connect(musicGain);
    osc.start(start);
    osc.stop(start + duration + 0.05);
  }

  function play(name) {
    wakeAudio();
    if (sfx[name]) sfx[name]();
  }

  const oldUpdateDock = updateDock;
  updateDock = function updateDockWithFootsteps(dt) {
    const beforeX = state.player ? state.player.x : 0;
    const beforeY = state.player ? state.player.y : 0;
    oldUpdateDock(dt);
    if (state.mode === "dock" && state.player) {
      const speed = Math.hypot(state.player.x - beforeX, state.player.y - beforeY) / Math.max(dt, 0.001);
      stepTimer -= dt;
      if (speed > 28 && stepTimer <= 0) {
        play("step");
        stepTimer = 0.28;
      }
    }
  };

  const oldUpdateFishing = updateFishing;
  updateFishing = function updateFishingWithSound(dt) {
    const hadCastPower = !!state.castPower;
    const beforePhase = state.cast && state.cast.phase;
    oldUpdateFishing(dt);
    const afterPhase = state.cast && state.cast.phase;
    if (hadCastPower && !state.castPower && state.cast) play("castRelease");
    if (beforePhase === "fly" && afterPhase === "waiting") play("splash");
    if (beforePhase === "waiting" && afterPhase === "bite") play("bite");
    if (beforePhase === "bite" && !state.cast) play("loseFish");
    lastCastPhase = afterPhase;
    lastCastPower = !!state.castPower;
  };

  const oldCastLine = castLine;
  castLine = function castLineWithSound() {
    const wasPower = !!state.castPower;
    const wasCast = !!state.cast;
    oldCastLine();
    if (!wasPower && state.castPower) play("castCharge");
    else if (wasPower && state.cast) play("castRelease");
    else if (wasCast && state.cast && state.cast.phase === "bite") play("reel");
    else play("button");
  };

  const oldReel = reel;
  reel = function reelWithSound() {
    oldReel();
    play("reel");
  };

  const oldCatchFish = catchFish;
  catchFish = function catchFishWithSound(fish) {
    oldCatchFish(fish);
    play("catch");
  };

  const oldEnterSellShop = enterSellShop;
  enterSellShop = function enterSellShopWithSound() {
    if (state.mode !== "sell") play("shop");
    oldEnterSellShop();
  };

  if (typeof enterRodShop === "function") {
    const oldEnterRodShop = enterRodShop;
    enterRodShop = function enterRodShopWithSound() {
      if (state.mode !== "rodshop") play("shop");
      oldEnterRodShop();
    };
  }

  const oldSellFish = sellFish;
  sellFish = function sellFishWithSound() {
    const hadFish = state.bag && state.bag.length > 0;
    oldSellFish();
    play(hadFish ? "sell" : "button");
  };

  if (typeof buyOrEquipRod === "function") {
    const oldBuyOrEquipRod = buyOrEquipRod;
    buyOrEquipRod = function buyOrEquipRodWithSound(rodId) {
      const coinsBefore = state.progress ? state.progress.coins : 0;
      oldBuyOrEquipRod(rodId);
      const coinsAfter = state.progress ? state.progress.coins : coinsBefore;
      play(coinsAfter < coinsBefore ? "buy" : "button");
    };
  }

  const oldDrawGameButtons = drawGameButtons;
  drawGameButtons = function drawGameButtonsWithSoundToggle() {
    oldDrawGameButtons();
    const x = 484;
    const y = 500;
    const muted = masterGain && masterGain.gain.value < 0.05;
    drawUiButton(x, y, 108, 42, muted ? "SOUND OFF" : "SOUND ON", toggleSound);
  };

  function toggleSound() {
    wakeAudio();
    if (!masterGain) return;
    const muted = masterGain.gain.value > 0.05;
    masterGain.gain.setTargetAtTime(muted ? 0.0 : 0.78, now(), 0.04);
    play("button");
    say(muted ? "Sound muted." : "Sound on: calm ocean music and effects.");
  }

  function unlockFromInput() {
    wakeAudio();
    window.removeEventListener("pointerdown", unlockFromInput, true);
    window.removeEventListener("keydown", unlockFromInput, true);
  }

  window.addEventListener("pointerdown", unlockFromInput, true);
  window.addEventListener("keydown", unlockFromInput, true);

  say("Sound added. Tap or press a key once to start the calm ocean music.");
})();
