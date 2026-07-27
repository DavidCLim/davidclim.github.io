(() => {
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const joy = document.getElementById("joystick");
  const knob = document.getElementById("joystickKnob");
  const W = canvas.width;
  const H = canvas.height;
  const saveKey = "hyperFishiesCleanSaveV1";

  const rarities = [
    ["Common", "#dff8ff", 38],
    ["Rare", "#73d8ff", 24],
    ["Epic", "#b785ff", 15],
    ["Legendary", "#ffd95c", 9],
    ["Mythical", "#ff74c8", 5],
    ["Extinct", "#ff8e55", 3.3],
    ["Gargantuan", "#9aff77", 2.4],
    ["Abyssal", "#5e7cff", 1.5],
    ["???", "#ffffff", 0.5],
  ];

  const fish = [
    ["Clownfish", "Common", 13, "clown"],
    ["Angel Fish", "Common", 15, "angel"],
    ["Starfish", "Rare", 24, "star"],
    ["Sailfish", "Rare", 32, "sail"],
    ["Squid", "Epic", 45, "squid"],
    ["Asterfish", "Epic", 52, "aster"],
    ["Swordfish", "Legendary", 80, "sword"],
    ["Shark", "Legendary", 96, "shark"],
    ["More Fish", "Mythical", 138, "more"],
    ["Stone Fish", "Mythical", 155, "stone"],
    ["Lost Treasure", "Extinct", 230, "treasure"],
    ["Ancient Whale", "Gargantuan", 360, "whale"],
    ["Abyss Eel", "Abyssal", 520, "eel"],
    ["Void Fish", "???", 900, "void"],
  ].map(([name, rarity, value, design]) => ({ name, rarity, value, design }));

  const rods = [
    { name: "Starter Rod", price: 0, luck: 1, control: 1, color: "#315cbd" },
    { name: "Bluefin Rod", price: 110, luck: 1.25, control: 1.1, color: "#25b9ff" },
    { name: "Coral Rod", price: 260, luck: 1.55, control: 1.25, color: "#ff7d74" },
    { name: "Storm Rod", price: 620, luck: 2.0, control: 1.55, color: "#8d7bff" },
    { name: "Abyss Rod", price: 1350, luck: 2.8, control: 2.0, color: "#1d2eff" },
    { name: "??? Rod", price: 2800, luck: 4.0, control: 2.7, color: "#f8f8ff" },
  ];

  const state = {
    mode: "home",
    coins: 0,
    rod: 0,
    owned: [0],
    bag: [],
    best: "None",
    player: { x: 480, y: 300, vx: 0, vy: 0, dir: 1, frame: 0 },
    castPower: null,
    cast: null,
    reveal: null,
    message: "Welcome to Hyper Fishies.",
    buttons: [],
    keys: {},
    joy: { active: false, x: 0, y: 0 },
  };

  try {
    const saved = JSON.parse(localStorage.getItem(saveKey) || "{}");
    if (Number.isFinite(saved.coins)) state.coins = saved.coins;
    if (Number.isFinite(saved.rod)) state.rod = saved.rod;
    if (Array.isArray(saved.owned)) state.owned = saved.owned;
    if (Array.isArray(saved.bag)) state.bag = saved.bag;
    if (saved.best) state.best = saved.best;
  } catch {}

  function save() {
    localStorage.setItem(saveKey, JSON.stringify({
      coins: state.coins,
      rod: state.rod,
      owned: state.owned,
      bag: state.bag,
      best: state.best,
    }));
  }

  function say(text) { state.message = text; }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function rarityColor(r) { return (rarities.find(x => x[0] === r) || rarities[0])[1]; }
  function currentRod() { return rods[state.rod] || rods[0]; }

  function rounded(x, y, w, h, r, fill, stroke, line = 3) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fillStyle = fill;
    ctx.fill();
    if (stroke) {
      ctx.strokeStyle = stroke;
      ctx.lineWidth = line;
      ctx.stroke();
    }
  }

  function text(t, x, y, size, color = "#fff", align = "center", weight = 900) {
    ctx.fillStyle = color;
    ctx.font = `${weight} ${size}px Trebuchet MS, Arial`;
    ctx.textAlign = align;
    ctx.fillText(t, x, y);
  }

  function button(x, y, w, h, label, fn) {
    rounded(x, y, w, h, 14, "rgba(255,238,154,.95)", "#06334b", 4);
    text(label, x + w / 2, y + h / 2 + 7, 18, "#06334b");
    state.buttons.push({ x, y, w, h, fn, label });
  }

  function bg() {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, "#64d8ff");
    g.addColorStop(.5, "#0877a8");
    g.addColorStop(1, "#02314f");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 30; i++) {
      const x = (i * 137 + performance.now() / (35 + i)) % (W + 70) - 35;
      const y = 25 + (i * 67) % 430;
      ctx.globalAlpha = .1 + (i % 5) * .03;
      ctx.fillStyle = "#e8ffff";
      ctx.beginPath();
      ctx.arc(x, y, 4 + (i % 4), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  function drawHome() {
    bg();
    rounded(190, 56, 580, 420, 28, "rgba(5,63,93,.72)", "#dff8ff", 5);
    drawLogo(480, 150, 1);
    text("FISHIES", 480, 225, 44, "#effcff", "center", 500);
    button(365, 265, 230, 54, "PLAY", () => { state.mode = "dock"; say("Walk to the top fishing dock, left sell shop, or right rod shop."); });
    button(365, 332, 230, 54, "CREDITS", () => { state.mode = "credits"; });
    text(`Coins: ${state.coins}  |  Best: ${state.best}`, 480, 430, 18, "#dff8ff");
  }

  function drawLogo(x, y, s) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const letters = [[-210, "H", "#74e4ff"], [-145, "Y", "#ffe36e"], [-76, "P", "#ff8e70"], [-7, "E", "#92ffad"], [60, "R", "#b68cff"]];
    letters.forEach(([lx, l, c]) => {
      text(l, lx, 0, 72, c);
      ctx.strokeStyle = "#052c46";
      ctx.lineWidth = 3;
      ctx.strokeText(l, lx, 0);
    });
    ctx.restore();
  }

  function drawDock() {
    bg();
    drawFortress();
    updatePlayer();
    drawPlayer(state.player.x, state.player.y, .78, false);
    drawHud();
    if (state.player.y < 120 && state.player.x > 370 && state.player.x < 590) button(390, 24, 180, 42, "START FISHING", () => startFishing());
    if (state.player.x < 170 && state.player.y > 195 && state.player.y < 365) button(70, 76, 160, 42, "SELL SHOP", () => state.mode = "sell");
    if (state.player.x > 790 && state.player.y > 195 && state.player.y < 365) button(730, 76, 160, 42, "ROD SHOP", () => state.mode = "rodshop");
    button(24, 482, 130, 40, "BAG", () => state.mode = "bag");
  }

  function drawFortress() {
    const wood = "#b5793f", dark = "#573313", light = "#d4a66a";
    rounded(120, 165, 720, 250, 22, wood, dark, 7);
    rounded(375, 64, 210, 120, 16, wood, dark, 7);
    rounded(38, 205, 145, 140, 16, "#8a5228", dark, 6);
    rounded(777, 205, 145, 140, 16, "#8a5228", dark, 6);
    rounded(426, 36, 108, 38, 12, light, dark, 5);
    for (let x = 142; x < 820; x += 44) {
      ctx.strokeStyle = "rgba(70,37,14,.45)";
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, 170); ctx.lineTo(x - 10, 410); ctx.stroke();
    }
    for (let x = 137; x < 830; x += 70) {
      rounded(x, 151, 40, 28, 6, light, dark, 4);
      rounded(x, 402, 40, 28, 6, light, dark, 4);
    }
    text("FISHING BANK", 480, 118, 22, "#fff3ba");
    text("SELL", 110, 282, 25, "#fff3ba");
    text("RODS", 850, 282, 25, "#fff3ba");
    ctx.fillStyle = "rgba(255,255,255,.16)";
    ctx.beginPath(); ctx.arc(480, 255, 36, 0, Math.PI * 2); ctx.fill();
  }

  function updatePlayer() {
    if (state.mode !== "dock") return;
    let ax = 0, ay = 0;
    if (state.keys.ArrowLeft || state.keys.a) ax--;
    if (state.keys.ArrowRight || state.keys.d) ax++;
    if (state.keys.ArrowUp || state.keys.w) ay--;
    if (state.keys.ArrowDown || state.keys.s) ay++;
    ax += state.joy.x; ay += state.joy.y;
    const len = Math.hypot(ax, ay) || 1;
    if (Math.abs(ax) + Math.abs(ay) > .05) {
      state.player.vx = (ax / len) * 4.2;
      state.player.vy = (ay / len) * 4.2;
      if (Math.abs(ax) > .15) state.player.dir = ax > 0 ? 1 : -1;
    } else {
      state.player.vx *= .45; state.player.vy *= .45;
    }
    state.player.x = clamp(state.player.x + state.player.vx, 88, 872);
    state.player.y = clamp(state.player.y + state.player.vy, 82, 420);
    state.player.frame += Math.hypot(state.player.vx, state.player.vy) * .14;
  }

  function drawPlayer(x, y, s = 1, rod = false) {
    const walk = Math.sin(state.player.frame) * 4;
    ctx.save(); ctx.translate(x, y); ctx.scale(s * state.player.dir, s);
    ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.fillStyle = "rgba(0,0,0,.25)"; ctx.beginPath(); ctx.ellipse(0, 37, 24, 7, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#0e2230"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-8, 17); ctx.lineTo(-15 - walk, 36); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(8, 17); ctx.lineTo(15 + walk, 36); ctx.stroke();
    rounded(-19, -19, 38, 42, 14, "#f4c94d", "#0e2230", 5);
    ctx.fillStyle = "#2f75a8"; ctx.beginPath(); ctx.moveTo(-15, -12); ctx.lineTo(0, 20); ctx.lineTo(15, -12); ctx.lineTo(13, 20); ctx.quadraticCurveTo(0, 29, -13, 20); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.strokeStyle = "#0e2230"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(-15, -8); ctx.lineTo(-30, 7 + walk * .25); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(15, -8); ctx.lineTo(34, -8); ctx.stroke();
    ctx.fillStyle = "#f2c696"; ctx.strokeStyle = "#0e2230"; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.ellipse(0, -43, 22, 24, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#275f88"; ctx.beginPath(); ctx.ellipse(0, -63, 22, 9, 0, Math.PI, 0); ctx.lineTo(19, -51); ctx.quadraticCurveTo(0, -44, -19, -51); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(10, -55, 22, 5, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#0e2230"; ctx.beginPath(); ctx.arc(8, -42, 2.6, 0, Math.PI * 2); ctx.fill();
    if (rod) drawRodLocal();
    ctx.restore();
  }

  function drawRodLocal() {
    ctx.strokeStyle = "#102052"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(30, -6); ctx.quadraticCurveTo(95, -82, 150, -112); ctx.stroke();
    ctx.strokeStyle = "#fff0b8"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(30, -6); ctx.quadraticCurveTo(95, -82, 150, -112); ctx.stroke();
    ctx.fillStyle = currentRod().color; ctx.strokeStyle = "#102052"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(51, 5, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  function drawHud() {
    rounded(18, 16, 260, 72, 18, "rgba(4,44,68,.75)", "#dff8ff", 3);
    text(`COINS ${state.coins}`, 38, 44, 18, "#ffe36e", "left");
    text(`ROD ${currentRod().name}`, 38, 70, 15, "#eaffff", "left", 800);
    rounded(300, 16, 360, 42, 18, "rgba(4,44,68,.65)", "#dff8ff", 3);
    text(state.message, 480, 43, 15, "#eaffff", "center", 800);
  }

  function startFishing() { state.mode = "fishing"; state.cast = null; state.castPower = null; say("Tap CAST, then tap the screen to stop the bars."); }

  function drawFishing() {
    bg(); ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.fillRect(0, 318, W, 4);
    drawPlayer(145, 293, .9, true);
    if (state.cast) drawLine();
    if (state.castPower) drawCastBars();
    if (state.cast?.phase === "bite") {
      text("BITE! TAP ANYWHERE TO REEL!", 480, 92, 26, "#ffe36e");
      rounded(310, 112, 340, 24, 12, "#09283d", "#dff8ff", 3);
      rounded(314, 116, 332 * state.cast.reel, 16, 8, "#ffe36e", null);
    }
    if (state.reveal) drawReveal();
    drawHud();
    button(24, 482, 130, 40, "BACK", () => { state.mode = "dock"; state.cast = null; state.castPower = null; });
    button(400, 482, 160, 40, "CAST", () => castLine());
    button(806, 482, 130, 40, "BAG", () => state.mode = "bag");
  }

  function castLine() {
    if (state.cast?.phase === "bite") return reel();
    if (state.cast || state.castPower) return;
    state.castPower = { phase: "distance", power: 0, dir: 1, distance: 0 };
    say("CAST FOR DISTANCE: tap the screen at the strongest point.");
  }

  function stopCastBar() {
    if (!state.castPower) return;
    if (state.castPower.phase === "distance") {
      state.castPower.distance = state.castPower.power; state.castPower.phase = "luck"; state.castPower.power = 0; state.castPower.dir = 1;
      say("CAST FOR LUCK: tap near the glowing middle.");
    } else {
      const distance = state.castPower.distance;
      const luck = 1 - Math.abs(state.castPower.power - .72);
      state.castPower = null;
      const reach = 210 + distance * 430;
      state.cast = { phase: "fly", x: 277, y: 193, vx: reach, vy: -190 - luck * 70, waterY: 338 + rand(-20, 24), luck, timer: 0, reel: 0 };
      say("Nice cast. Wait for a bite.");
    }
  }

  function updateFishing(dt) {
    if (state.castPower) {
      state.castPower.power += state.castPower.dir * dt * 1.55;
      if (state.castPower.power >= 1) { state.castPower.power = 1; state.castPower.dir = -1; }
      if (state.castPower.power <= 0) { state.castPower.power = 0; state.castPower.dir = 1; }
    }
    const c = state.cast;
    if (!c) return;
    if (c.phase === "fly") {
      c.x += c.vx * dt; c.y += c.vy * dt; c.vy += 520 * dt;
      if (c.y >= c.waterY) { c.y = c.waterY; c.phase = "wait"; c.wait = rand(.6, 1.6); }
    } else if (c.phase === "wait") {
      c.wait -= dt * (1 + currentRod().luck * .04); c.y += Math.sin(performance.now() / 160) * .12;
      if (c.wait <= 0) { c.phase = "bite"; c.fish = rollFish(c.luck); c.reel = .38; }
    } else if (c.phase === "bite") {
      const hard = .05 + fishValue(c.fish) / 6000 - currentRod().control * .015;
      c.reel -= hard * dt;
      if (c.reel <= 0) { state.cast = null; say("The fish escaped."); }
    }
  }

  function drawLine() {
    const c = state.cast;
    ctx.strokeStyle = "#eaffff"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(277, 193); ctx.quadraticCurveTo((277 + c.x) / 2, 150, c.x, c.y); ctx.stroke();
    ctx.fillStyle = c.phase === "bite" ? "#ffe36e" : "#fff"; ctx.strokeStyle = "#06334b"; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(c.x, c.y, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  }

  function drawCastBars() {
    const cp = state.castPower;
    const label = cp.phase === "distance" ? "CAST FOR DISTANCE" : "CAST FOR LUCK";
    text(label, 480, 118, 24, "#ffe36e");
    rounded(250, 138, 460, 30, 15, "#073852", "#dff8ff", 3);
    if (cp.phase === "luck") rounded(555, 142, 80, 22, 11, "rgba(255,227,110,.35)", null);
    rounded(254, 142, 452 * cp.power, 22, 11, cp.phase === "distance" ? "#55d8ff" : "#ffe36e", null);
  }

  function reel() {
    if (!state.cast || state.cast.phase !== "bite") return;
    state.cast.reel = Math.min(1, state.cast.reel + .23 + currentRod().control * .05);
    if (state.cast.reel >= 1) {
      const caught = { ...state.cast.fish, value: fishValue(state.cast.fish) };
      state.bag.push(caught); state.best = `${caught.rarity} ${caught.name}`; state.reveal = { fish: caught, t: 2.5 }; state.cast = null;
      say(`Caught ${caught.rarity} ${caught.name}!`); save();
    }
  }

  function rollFish(luck = 0) {
    const rod = currentRod();
    const table = fish.map(f => {
      const base = (rarities.find(r => r[0] === f.rarity) || rarities[0])[2];
      const rareBoost = f.rarity === "Common" ? 1 : 1 + (rod.luck - 1) * .65 + luck * .8;
      return { f, w: base * rareBoost };
    });
    let total = table.reduce((s, x) => s + x.w, 0), r = rand(0, total);
    for (const item of table) { r -= item.w; if (r <= 0) return item.f; }
    return fish[0];
  }

  function fishValue(f) { return Math.round(f.value * (1 + currentRod().luck * .06) * rand(.9, 1.25)); }

  function drawFishDesign(type, x, y, s, color = "#8eeaff") {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.fillStyle = color; ctx.strokeStyle = "#062638"; ctx.lineWidth = 5;
    if (type === "star") {
      ctx.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const r = i % 2 ? 22 : 48; ctx.lineTo(Math.cos(a) * r, Math.sin(a) * r); } ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (type === "squid") {
      ctx.beginPath(); ctx.ellipse(0, -12, 28, 48, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * 10, 28); ctx.quadraticCurveTo(i * 15, 62, i * 4, 82); ctx.stroke(); }
    } else if (type === "treasure") {
      rounded(-45, -25, 90, 55, 8, "#b8783d", "#062638", 5); ctx.fillStyle = "#ffd95c"; ctx.fillRect(-35, 0, 70, 10);
    } else if (type === "whale") {
      ctx.beginPath(); ctx.ellipse(0, 0, 76, 38, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(70, 0); ctx.lineTo(118, -30); ctx.lineTo(105, 0); ctx.lineTo(118, 30); ctx.closePath(); ctx.fill(); ctx.stroke();
    } else if (type === "eel" || type === "void") {
      ctx.beginPath(); ctx.moveTo(-70, 10); ctx.quadraticCurveTo(-20, -55, 35, -10); ctx.quadraticCurveTo(70, 20, 20, 40); ctx.quadraticCurveTo(-30, 55, -70, 10); ctx.fill(); ctx.stroke();
    } else {
      ctx.beginPath(); ctx.ellipse(0, 0, 48, 26, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(43, 0); ctx.lineTo(82, -26); ctx.lineTo(73, 0); ctx.lineTo(82, 26); ctx.closePath(); ctx.fill(); ctx.stroke();
      if (type === "clown") { ctx.strokeStyle = "#fff"; ctx.lineWidth = 9; ctx.beginPath(); ctx.moveTo(-22, -20); ctx.lineTo(-10, 20); ctx.stroke(); ctx.beginPath(); ctx.moveTo(18, -22); ctx.lineTo(27, 20); ctx.stroke(); }
      if (type === "shark") { ctx.fillStyle = "#062638"; ctx.beginPath(); ctx.moveTo(5, -25); ctx.lineTo(25, -58); ctx.lineTo(31, -21); ctx.closePath(); ctx.fill(); }
      if (type === "sword" || type === "sail") { ctx.strokeStyle = "#062638"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-48, 0); ctx.lineTo(-94, -3); ctx.stroke(); }
    }
    ctx.restore();
  }

  function drawReveal() {
    const r = state.reveal; r.t -= 1 / 60;
    rounded(310, 84, 340, 144, 22, "rgba(255,255,255,.94)", rarityColor(r.fish.rarity), 5);
    drawFishDesign(r.fish.design, 480, 145, .72, rarityColor(r.fish.rarity)); text(`${r.fish.rarity} ${r.fish.name}`, 480, 202, 22, "#06334b");
    if (r.t <= 0) state.reveal = null;
  }

  function drawSell() {
    bg(); drawShopStall("SELL SHOP", "#8b2e22"); drawPirate(254, 260, 1);
    rounded(430, 125, 410, 220, 20, "rgba(255,249,218,.95)", "#4d250b", 5);
    text("B-LA-KA!", 635, 170, 28, "#4d250b"); text("Got fish for me, fisher?", 635, 210, 20, "#4d250b"); text(`Bag value: ${state.bag.reduce((s, f) => s + f.value, 0)} coins`, 635, 250, 18, "#4d250b");
    button(480, 286, 150, 45, "SELL ALL", () => sellAll()); button(650, 286, 120, 45, "NO", () => state.mode = "dock"); button(24, 482, 120, 40, "BACK", () => state.mode = "dock");
  }

  function sellAll() { const value = state.bag.reduce((s, f) => s + f.value, 0); state.coins += value; state.bag = []; save(); say(value ? `Sold fish for ${value} coins.` : "You have no fish to sell."); state.mode = "dock"; }

  function drawRodShop() {
    bg(); drawShopStall("ROD SHOP", "#1f5c82"); drawRodSeller(246, 264, 1); rounded(390, 74, 520, 390, 22, "rgba(232,252,255,.94)", "#073852", 5); text("FISHY RODS", 650, 116, 30, "#073852");
    rods.forEach((r, i) => { const y = 142 + i * 50; rounded(420, y, 460, 38, 12, i === state.rod ? "#ffe36e" : "#fff", r.color, 3); drawTinyRod(448, y + 24, r.color); text(`${r.name}  ${i === 0 ? "FREE" : r.price + " COINS"}`, 650, y + 25, 16, "#073852"); state.buttons.push({ x: 420, y, w: 460, h: 38, fn: () => buyRod(i), label: r.name }); });
    button(24, 482, 120, 40, "BACK", () => state.mode = "dock");
  }

  function buyRod(i) { if (state.owned.includes(i)) { state.rod = i; save(); say(`Equipped ${rods[i].name}.`); return; } if (state.coins < rods[i].price) { say("Not enough coins yet."); return; } state.coins -= rods[i].price; state.owned.push(i); state.rod = i; save(); say(`Bought ${rods[i].name}.`); }

  function drawTinyRod(x, y, color) { ctx.save(); ctx.translate(x, y); ctx.scale(.28, .28); ctx.strokeStyle = "#102052"; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(100, -70, 170, -120); ctx.stroke(); ctx.strokeStyle = "#fff0b8"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(100, -70, 170, -120); ctx.stroke(); ctx.fillStyle = color; ctx.strokeStyle = "#102052"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(55, 0, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); ctx.restore(); }

  function drawShopStall(label, color) { rounded(120, 120, 250, 260, 20, "#b5793f", "#4d250b", 7); rounded(90, 95, 310, 55, 16, color, "#4d250b", 6); text(label, 245, 132, 24, "#fff3ba"); rounded(105, 345, 280, 60, 8, "#744015", "#4d250b", 5); }

  function drawPirate(x, y, s) {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.fillStyle = "#8b2e22"; ctx.strokeStyle = "#20100a"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(-45, -22); ctx.lineTo(45, -22); ctx.lineTo(31, 58); ctx.lineTo(-31, 58); ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.fillStyle = "#f0c090"; ctx.beginPath(); ctx.roundRect(-28, -86, 56, 58, 14); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#111"; ctx.fillRect(-26, -68, 24, 10); ctx.beginPath(); ctx.arc(12, -62, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#111"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, -44); ctx.quadraticCurveTo(0, -34, 14, -43); ctx.stroke();
    ctx.fillStyle = "#141414"; ctx.beginPath(); ctx.moveTo(-52, -87); ctx.quadraticCurveTo(0, -132, 52, -87); ctx.lineTo(35, -77); ctx.quadraticCurveTo(0, -91, -35, -77); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#ffe36e"; ctx.beginPath(); ctx.arc(0, -100, 8, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#20100a"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-40, -4); ctx.lineTo(-85, -38); ctx.stroke(); ctx.beginPath(); ctx.moveTo(40, -4); ctx.lineTo(78, -43); ctx.stroke(); ctx.strokeStyle = "#dff8ff"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(88, -43, 13, Math.PI * .35, Math.PI * 1.65); ctx.stroke();
    ctx.strokeStyle = "#20100a"; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(-18, 56); ctx.lineTo(-18, 108); ctx.stroke(); ctx.beginPath(); ctx.moveTo(18, 56); ctx.lineTo(24, 100); ctx.stroke(); ctx.strokeStyle = "#6a3a16"; ctx.beginPath(); ctx.moveTo(24, 100); ctx.lineTo(24, 123); ctx.stroke(); ctx.restore();
  }

  function drawRodSeller(x, y, s) { ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.fillStyle = "#f3d04f"; ctx.strokeStyle = "#10202c"; ctx.lineWidth = 6; ctx.beginPath(); ctx.roundRect(-38, -28, 76, 84, 22); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f0c090"; ctx.beginPath(); ctx.roundRect(-30, -92, 60, 62, 18); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#15265a"; ctx.beginPath(); ctx.ellipse(0, -102, 34, 12, 0, Math.PI, 0); ctx.lineTo(28, -84); ctx.quadraticCurveTo(0, -73, -28, -84); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#10202c"; ctx.beginPath(); ctx.arc(-10, -68, 4, 0, Math.PI * 2); ctx.arc(10, -68, 4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = "#10202c"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-10, -50); ctx.quadraticCurveTo(0, -42, 12, -50); ctx.stroke(); ctx.strokeStyle = "#10202c"; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(-37, -4); ctx.lineTo(-74, 24); ctx.stroke(); ctx.beginPath(); ctx.moveTo(37, -4); ctx.lineTo(74, 24); ctx.stroke(); ctx.restore(); }

  function drawBag() { bg(); rounded(74, 54, 812, 430, 28, "rgba(3,30,58,.9)", "#dff8ff", 5); text("FISH BAG", 480, 105, 34, "#ffe36e"); text(`${state.bag.length} fish`, 480, 134, 18, "#dff8ff"); if (!state.bag.length) { text("Your bag is empty. Go fish first.", 480, 280, 25, "#dff8ff"); } else { state.bag.slice(0, 12).forEach((f, i) => { const x = 120 + (i % 4) * 185; const y = 160 + Math.floor(i / 4) * 105; rounded(x, y, 165, 88, 16, "rgba(255,255,255,.94)", rarityColor(f.rarity), 4); drawFishDesign(f.design, x + 42, y + 42, .38, rarityColor(f.rarity)); text(f.name, x + 98, y + 34, 14, "#073852"); text(f.rarity, x + 98, y + 55, 13, rarityColor(f.rarity)); text(`${f.value} coins`, x + 98, y + 75, 12, "#073852"); }); } button(24, 482, 120, 40, "BACK", () => state.mode = "dock"); if (state.bag.length) button(750, 482, 150, 40, "SELL ALL", sellAll); }

  function drawCredits() { bg(); rounded(190, 80, 580, 370, 28, "rgba(5,63,93,.8)", "#dff8ff", 5); text("CREDITS", 480, 145, 38, "#ffe36e"); text("Hyper Fishies by David and friends", 480, 210, 22, "#dff8ff"); text("Built on davidclim.github.io", 480, 250, 18, "#dff8ff"); button(365, 340, 230, 54, "BACK", () => state.mode = "home"); }

  function click(x, y) { if (state.castPower) return stopCastBar(); if (state.cast?.phase === "bite") return reel(); const hit = state.buttons.find(b => x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h); if (hit) hit.fn(); }
  function canvasPoint(e) { const rect = canvas.getBoundingClientRect(); return { x: (e.clientX - rect.left) * W / rect.width, y: (e.clientY - rect.top) * H / rect.height }; }
  canvas.addEventListener("pointerdown", e => { const p = canvasPoint(e); click(p.x, p.y); });
  window.addEventListener("keydown", e => { state.keys[e.key] = true; state.keys[e.key.toLowerCase()] = true; if (e.key.toLowerCase() === "i" || e.key.toLowerCase() === "b") state.mode = state.mode === "bag" ? "dock" : "bag"; });
  window.addEventListener("keyup", e => { state.keys[e.key] = false; state.keys[e.key.toLowerCase()] = false; });

  function setupJoystick() { if (!joy || !knob) return; joy.style.width = "86px"; joy.style.height = "86px"; joy.style.left = "12px"; joy.style.bottom = "76px"; joy.style.opacity = ".52"; joy.style.display = "block"; const reset = () => { state.joy.active = false; state.joy.x = 0; state.joy.y = 0; knob.style.transform = "translate(0px, 0px)"; }; joy.addEventListener("pointerdown", e => { state.joy.active = true; joy.setPointerCapture(e.pointerId); }); joy.addEventListener("pointermove", e => { if (!state.joy.active) return; const rect = joy.getBoundingClientRect(); const cx = rect.left + rect.width / 2; const cy = rect.top + rect.height / 2; const dx = clamp(e.clientX - cx, -30, 30); const dy = clamp(e.clientY - cy, -30, 30); state.joy.x = dx / 30; state.joy.y = dy / 30; knob.style.transform = `translate(${dx}px, ${dy}px)`; }); joy.addEventListener("pointerup", reset); joy.addEventListener("pointercancel", reset); }
  setupJoystick();

  let last = performance.now();
  function loop(now) { const dt = Math.min(.033, (now - last) / 1000); last = now; state.buttons = []; updateFishing(dt); ctx.clearRect(0, 0, W, H); if (state.mode === "home") drawHome(); else if (state.mode === "dock") drawDock(); else if (state.mode === "fishing") drawFishing(); else if (state.mode === "sell") drawSell(); else if (state.mode === "rodshop") drawRodShop(); else if (state.mode === "bag") drawBag(); else if (state.mode === "credits") drawCredits(); requestAnimationFrame(loop); }
  requestAnimationFrame(loop);
})();
