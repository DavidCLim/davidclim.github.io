// Final audio patch loaded last so sound hooks attach to the real final game functions.
(function () {
  let ac = null;
  let master = null;
  let music = null;
  let sfx = null;
  let musicOn = false;
  let muted = false;
  let footCooldown = 0;

  function setup() {
    if (ac) return true;
    const AudioClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioClass) {
      say("This browser cannot play WebAudio sounds.");
      return false;
    }
    ac = new AudioClass();
    master = ac.createGain();
    music = ac.createGain();
    sfx = ac.createGain();
    master.gain.value = 0.85;
    music.gain.value = 0.12;
    sfx.gain.value = 0.48;
    music.connect(master);
    sfx.connect(master);
    master.connect(ac.destination);
    return true;
  }

  function unlock() {
    if (!setup()) return;
    if (ac.state === "suspended") ac.resume();
    if (!musicOn) startCalmMusic();
  }

  function t() { return ac ? ac.currentTime : 0; }

  function beep(freq, dur, type, vol, delay) {
    if (!setup()) return;
    const start = t() + (delay || 0);
    const osc = ac.createOscillator();
    const g = ac.createGain();
    osc.type = type || "sine";
    osc.frequency.setValueAtTime(freq, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, vol || 0.06), start + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    osc.connect(g);
    g.connect(sfx);
    osc.start(start);
    osc.stop(start + dur + 0.04);
    return osc;
  }

  function softNoise(dur, vol, filter, delay) {
    if (!setup()) return;
    const start = t() + (delay || 0);
    const length = Math.max(1, Math.floor(ac.sampleRate * dur));
    const buffer = ac.createBuffer(1, length, ac.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ac.createBufferSource();
    const f = ac.createBiquadFilter();
    const g = ac.createGain();
    f.type = "lowpass";
    f.frequency.setValueAtTime(filter || 800, start);
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(vol || 0.05, start + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.buffer = buffer;
    src.connect(f);
    f.connect(g);
    g.connect(sfx);
    src.start(start);
    src.stop(start + dur + 0.03);
  }

  function play(name) {
    unlock();
    if (!ac || muted) return;
    if (name === "step") {
      softNoise(0.04, 0.032, 330);
      beep(95 + Math.random() * 25, 0.055, "triangle", 0.018);
    } else if (name === "tap") {
      beep(520, 0.07, "sine", 0.04);
      beep(760, 0.09, "sine", 0.026, 0.05);
    } else if (name === "shop") {
      beep(330, 0.1, "triangle", 0.05);
      beep(494, 0.14, "triangle", 0.04, 0.07);
      beep(660, 0.18, "sine", 0.034, 0.16);
    } else if (name === "castStart") {
      beep(230, 0.16, "sine", 0.035);
      beep(350, 0.2, "sine", 0.025, 0.07);
    } else if (name === "cast") {
      softNoise(0.16, 0.065, 1700);
      const down = beep(440, 0.28, "sine", 0.045);
      if (down) down.frequency.exponentialRampToValueAtTime(210, t() + 0.25);
    } else if (name === "splash") {
      softNoise(0.24, 0.085, 1150);
      beep(165, 0.15, "sine", 0.034);
    } else if (name === "bite") {
      beep(950, 0.07, "square", 0.045);
      beep(720, 0.07, "square", 0.04, 0.08);
      softNoise(0.08, 0.035, 1800, 0.04);
    } else if (name === "reel") {
      beep(260 + Math.random() * 90, 0.045, "triangle", 0.03);
    } else if (name === "catch") {
      beep(523, 0.08, "sine", 0.05);
      beep(659, 0.08, "sine", 0.05, 0.07);
      beep(784, 0.15, "sine", 0.06, 0.15);
    } else if (name === "sell") {
      beep(880, 0.07, "square", 0.035);
      beep(1175, 0.08, "square", 0.032, 0.06);
      beep(1568, 0.12, "sine", 0.03, 0.14);
    } else if (name === "fail") {
      const down = beep(255, 0.25, "sine", 0.035);
      if (down) down.frequency.exponentialRampToValueAtTime(120, t() + 0.23);
    }
  }

  function startCalmMusic() {
    if (!ac || musicOn) return;
    musicOn = true;
    const melody = [261.63, 329.63, 392.00, 493.88, 440.00, 392.00, 329.63, 293.66];
    const bass = [130.81, 146.83, 164.81, 196.00];
    let cursor = 0;

    function musicTone(freq, start, dur, vol, type) {
      const osc = ac.createOscillator();
      const g = ac.createGain();
      const f = ac.createBiquadFilter();
      osc.type = type || "sine";
      osc.frequency.setValueAtTime(freq, start);
      f.type = "lowpass";
      f.frequency.setValueAtTime(1050, start);
      g.gain.setValueAtTime(0.0001, start);
      g.gain.exponentialRampToValueAtTime(vol, start + 0.08);
      g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
      osc.connect(f);
      f.connect(g);
      g.connect(music);
      osc.start(start);
      osc.stop(start + dur + 0.04);
    }

    function schedule() {
      if (!ac) return;
      const base = t() + 0.08;
      for (let i = 0; i < 16; i++) {
        const start = base + i * 0.72;
        musicTone(melody[(cursor + i) % melody.length], start, 0.52, 0.024, "sine");
        if (i % 2 === 0) musicTone(melody[(cursor + i) % melody.length] * 2, start + 0.18, 0.28, 0.010, "triangle");
        if (i % 4 === 0) musicTone(bass[Math.floor((cursor + i) / 4) % bass.length], start, 1.2, 0.018, "sine");
      }
      cursor = (cursor + 16) % melody.length;
      setTimeout(schedule, 11200);
    }
    schedule();
  }

  const oldUpdateDock = updateDock;
  updateDock = function finalAudioUpdateDock(dt) {
    const px = state.player ? state.player.x : 0;
    const py = state.player ? state.player.y : 0;
    oldUpdateDock(dt);
    footCooldown -= dt;
    if (state.mode === "dock" && state.player) {
      const speed = Math.hypot(state.player.x - px, state.player.y - py) / Math.max(dt, 0.001);
      if (speed > 35 && footCooldown <= 0) {
        play("step");
        footCooldown = 0.26;
      }
    }
  };

  const oldUpdateFishing = updateFishing;
  updateFishing = function finalAudioUpdateFishing(dt) {
    const beforePhase = state.cast && state.cast.phase;
    const beforeCastPower = !!state.castPower;
    oldUpdateFishing(dt);
    const afterPhase = state.cast && state.cast.phase;
    if (beforeCastPower && !state.castPower && state.cast) play("cast");
    if (beforePhase === "fly" && afterPhase === "waiting") play("splash");
    if (beforePhase === "waiting" && afterPhase === "bite") play("bite");
    if (beforePhase === "bite" && !state.cast) play("fail");
  };

  const oldCastLine = castLine;
  castLine = function finalAudioCastLine() {
    const beforePower = !!state.castPower;
    const beforeCast = !!state.cast;
    oldCastLine();
    if (!beforePower && state.castPower) play("castStart");
    else if (beforePower && state.cast) play("cast");
    else if (beforeCast && state.cast && state.cast.phase === "bite") play("reel");
    else play("tap");
  };

  const oldReel = reel;
  reel = function finalAudioReel() {
    oldReel();
    play("reel");
  };

  const oldCatchFish = catchFish;
  catchFish = function finalAudioCatchFish(fish) {
    oldCatchFish(fish);
    play("catch");
  };

  const oldEnterSellShop = enterSellShop;
  enterSellShop = function finalAudioEnterSellShop() {
    if (state.mode !== "sell") play("shop");
    oldEnterSellShop();
  };

  if (typeof enterRodShop === "function") {
    const oldEnterRodShop = enterRodShop;
    enterRodShop = function finalAudioEnterRodShop() {
      if (state.mode !== "rodshop") play("shop");
      oldEnterRodShop();
    };
  }

  const oldSellFish = sellFish;
  sellFish = function finalAudioSellFish() {
    const hadFish = state.bag && state.bag.length > 0;
    oldSellFish();
    play(hadFish ? "sell" : "tap");
  };

  if (typeof buyOrEquipRod === "function") {
    const oldBuyOrEquipRod = buyOrEquipRod;
    buyOrEquipRod = function finalAudioBuyOrEquipRod(rodId) {
      oldBuyOrEquipRod(rodId);
      play("sell");
    };
  }

  const oldDrawGameButtons = drawGameButtons;
  drawGameButtons = function finalAudioDrawButtons() {
    oldDrawGameButtons();
    drawUiButton(484, 500, 108, 42, muted ? "SOUND OFF" : "SOUND ON", function () {
      unlock();
      muted = !muted;
      if (master) master.gain.setTargetAtTime(muted ? 0.0 : 0.85, t(), 0.03);
      say(muted ? "Sound muted." : "Sound on. Music and effects active.");
      if (!muted) play("tap");
    });
  };

  function firstUnlock() {
    unlock();
    play("tap");
    say("Sound active: music and effects are on.");
    window.removeEventListener("pointerdown", firstUnlock, true);
    window.removeEventListener("keydown", firstUnlock, true);
    window.removeEventListener("touchstart", firstUnlock, true);
  }

  window.addEventListener("pointerdown", firstUnlock, true);
  window.addEventListener("keydown", firstUnlock, true);
  window.addEventListener("touchstart", firstUnlock, true);

  say("Tap/click once to unlock sound. Final audio patch loaded.");
})();
