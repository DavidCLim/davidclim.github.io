// Hyper Fishies adventure update: lower fish values, better cast power, diving bars, tropical dock, stickman player.
fishTypes.splice(0, fishTypes.length,
  { name: "Clownfish", rarity: "Common", value: 3, color: "#ff9b48", design: "clown" },
  { name: "Angel Fish", rarity: "Common", value: 4, color: "#ffe07a", design: "angel" },
  { name: "Starfish", rarity: "Unusual", value: 7, color: "#ffd86b", design: "star" },
  { name: "Squid", rarity: "Unusual", value: 9, color: "#c68dff", design: "squid" },
  { name: "Sailfish", rarity: "Rare", value: 15, color: "#9edbff", design: "sail" },
  { name: "Angler Fish", rarity: "Rare", value: 21, color: "#72e48a", design: "angler" },
  { name: "Swordfish", rarity: "Epic", value: 34, color: "#b8d7ff", design: "sword" },
  { name: "Bone Fish", rarity: "Epic", value: 42, color: "#e9f3e8", design: "bone" },
  { name: "Starborn Shark", rarity: "Legendary", value: 78, color: "#8de7ff", design: "shark" },
  { name: "Mythical Whale", rarity: "Legendary", value: 115, color: "#d9fbff", design: "whale" }
);

const advUpdate = update;
const advDock = updateDock;
const advFishing = updateFishing;
const advButtons = drawGameButtons;
const advDockView = drawDockView;
const advFishingView = drawFishingView;

function advStats() {
  if (typeof state.health !== "number") state.health = 100;
  if (typeof state.oxygen !== "number") state.oxygen = 100;
  if (typeof state.diving !== "boolean") state.diving = false;
  if (typeof state.walkFrame !== "number") state.walkFrame = 0;
  if (!state.direction) state.direction = "down";
}

update = function updateAdventure(dt) {
  advStats();
  advUpdate(dt);
  const moving = Math.hypot(state.player.vx || 0, state.player.vy || 0);
  state.walkFrame += dt * (moving > 25 ? 9 : 2);
  if (Math.abs(state.player.vx || 0) > Math.abs(state.player.vy || 0)) state.direction = state.player.vx > 0 ? "right" : "left";
  else if (Math.abs(state.player.vy || 0) > 8) state.direction = state.player.vy > 0 ? "down" : "up";
  if (state.diving) {
    state.oxygen = Math.max(0, state.oxygen - dt * 9);
    if (state.oxygen <= 0) state.health = Math.max(0, state.health - dt * 13);
    if (state.health <= 0) {
      state.diving = false; state.health = 100; state.oxygen = 100;
      state.player.x = 480; state.player.y = 340;
      say("You blacked out underwater and woke up on the dock.");
    }
  } else state.oxygen = Math.min(100, state.oxygen + dt * 18);
};

updateDock = function updateDockAdventure(dt) {
  advStats();
  if (!state.diving) return advDock(dt);
  const p = state.player;
  let ax = 0, ay = 0;
  if (keys.has("arrowleft") || keys.has("a")) ax--;
  if (keys.has("arrowright") || keys.has("d")) ax++;
  if (keys.has("arrowup") || keys.has("w")) ay--;
  if (keys.has("arrowdown") || keys.has("s")) ay++;
  ax += joy.x; ay += joy.y;
  const mag = Math.hypot(ax, ay) || 1;
  p.vx += ax / mag * 390 * dt; p.vy += ay / mag * 390 * dt;
  p.vx *= Math.pow(0.05, dt); p.vy *= Math.pow(0.05, dt);
  p.x = clamp(p.x + p.vx * dt, 36, 924); p.y = clamp(p.y + p.vy * dt, 40, 520);
  say("Diving: explore the water, but watch oxygen.");
};

updateFishing = function updateFishingAdventure(dt) {
  if (state.castPower) {
    state.castPower.power += state.castPower.dir * dt * 1.65;
    if (state.castPower.power > 1) { state.castPower.power = 1; state.castPower.dir = -1; }
    if (state.castPower.power < 0) { state.castPower.power = 0; state.castPower.dir = 1; }
    return;
  }
  advFishing(dt);
};

function startCastPower() { state.castPower = { power: 0, dir: 1 }; say("Cast power: tap CAST again near the gold end."); }
function releaseCastPower() {
  const rod = currentRod();
  const power = clamp(state.castPower.power, 0.12, 1);
  state.castPower = null;
  state.cast = { phase: "fly", timer: 0, hookX: 184, hookY: 300, vx: 190 + power * 280 + rod.id * 18, vy: -135 - power * 155 - rod.id * 6, waterY: 345, reel: 0, fish: null };
  say(power > .82 ? "Huge cast!" : power > .52 ? "Good cast!" : "Short cast.");
}

castLine = function castLineAdventure() {
  advStats();
  if (state.mode === "sell") return;
  if (state.mode === "dock") {
    if (!atFishingDock(state.player)) return say("Walk onto the small FISH dock first.");
    enterFishing(); startCastPower(); return;
  }
  if (state.mode !== "fishing") return;
  if (state.bag.length >= state.bagLimit) return say("Your bag is full. Go sell your fish.");
  if (state.castPower) return releaseCastPower();
  if (state.cast) return reel();
  startCastPower();
};

catchFish = function catchFishCheap(fish) {
  const value = Math.max(1, Math.round(fish.value * (1 + currentRod().luck * 0.04) * rand(0.82, 1.12)));
  state.bag.push({ ...fish, value });
  state.latest = `${fish.rarity} ${fish.name}`;
  state.progress.bestFish = state.latest;
  state.progress.caught[fish.name] = (state.progress.caught[fish.name] || 0) + 1;
  state.catchReveal = { fish: { ...fish, value }, life: 2.8, age: 0 };
  burst(state.cast ? state.cast.hookX : 500, state.cast ? state.cast.hookY : 330, rarityColors[fish.rarity], 28);
  state.cast = null; saveGame();
  say(`Caught ${fish.rarity} ${fish.name}! Value: ${value} coins.`);
};

function toggleDive() {
  advStats();
  if (state.mode !== "dock" && state.mode !== "fishing") return;
  state.diving = !state.diving;
  if (state.diving) { state.mode = "dock"; state.cast = null; state.castPower = null; say("Dive mode on. Oxygen drains underwater."); }
  else say("Back above water. Oxygen refills.");
}
window.addEventListener("keydown", e => { const k = e.key.toLowerCase(); if ((k === "e" || k === "shift") && (state.mode === "dock" || state.mode === "fishing")) toggleDive(); });

drawGameButtons = function drawButtonsAdventure() {
  advButtons();
  if (state.mode === "dock" || state.mode === "fishing") drawUiButton(360, 500, 110, 42, state.diving ? "SURFACE" : "DIVE", toggleDive);
};

function bar(x, y, label, val, a, b) {
  rounded(x, y, 184, 24, 12, "rgba(3,24,45,.72)", "rgba(236,255,251,.82)", 2);
  const g = ctx.createLinearGradient(x, y, x + 184, y); g.addColorStop(0, a); g.addColorStop(1, b);
  ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x + 4, y + 4, Math.max(0, 176 * val / 100), 16, 8); ctx.fill();
  ctx.fillStyle = "#ecfffb"; ctx.font = "900 12px Trebuchet MS"; ctx.textAlign = "left"; ctx.fillText(label, x + 10, y + 16);
}
function drawBars() { advStats(); bar(746, 66, "HP", state.health, "#ff5369", "#ff9b73"); bar(746, 96, "O2", state.oxygen, "#65f2ff", "#2997ff"); }
function drawPowerMeter() {
  if (!state.castPower) return;
  const x = 300, y = 438, w = 360, h = 28;
  rounded(x, y, w, h, 14, "rgba(3,32,61,.82)", "#ecfffb", 3);
  const g = ctx.createLinearGradient(x + 8, y, x + w - 8, y); g.addColorStop(0, "#65f2ff"); g.addColorStop(.6, "#5dff8f"); g.addColorStop(1, "#ffe36e");
  ctx.fillStyle = g; ctx.fillRect(x + 8, y + 7, w - 16, h - 14);
  ctx.fillStyle = "#ff5d68"; ctx.strokeStyle = "#05263d"; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(x + 8 + state.castPower.power * (w - 16), y + h / 2, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ecfffb"; ctx.font = "900 15px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText("CAST DISTANCE", x + w / 2, y - 9);
}

function stickman(x, y, scale, dir, swim) {
  const t = state.walkFrame || 0, walk = Math.sin(t);
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); if (dir === "left") ctx.scale(-1, 1);
  ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#05263d"; ctx.lineWidth = 4; ctx.fillStyle = "#ffe8c8";
  if (swim) ctx.rotate(Math.sin(t * .7) * .08);
  ctx.beginPath(); ctx.arc(0, -28, 17, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#ff5d68"; ctx.beginPath(); ctx.roundRect(-15, -10, 30, 44, 12); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-13, 1); ctx.lineTo(-30, 17 + walk * 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(13, 1); ctx.lineTo(30, 17 - walk * 7); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, 32); ctx.lineTo(-19, 55 - walk * 8); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7, 32); ctx.lineTo(19, 55 + walk * 8); ctx.stroke();
  if (!swim && dir !== "up") { ctx.fillStyle = "#05263d"; ctx.beginPath(); ctx.arc(-6, -30, 2.5, 0, Math.PI * 2); ctx.fill(); ctx.beginPath(); ctx.arc(6, -30, 2.5, 0, Math.PI * 2); ctx.fill(); }
  if (swim) { ctx.fillStyle = "#65f2ff"; ctx.beginPath(); ctx.arc(9, -30, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); }
  ctx.restore();
}
drawCirclePlayer = function drawStickPlayer() { advStats(); stickman(state.player.x, state.player.y, state.diving ? .72 : .62, state.direction, state.diving); };
drawFisherCircle = function drawFisherStick() { stickman(142, 285, .62, "right", false); ctx.strokeStyle = "#5a310d"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(160, 270); ctx.quadraticCurveTo(235, 220, 308, 246); ctx.stroke(); };

drawTopWater = function drawWaterAdventure() {
  const g = ctx.createLinearGradient(0, 0, 0, canvas.height); g.addColorStop(0, "#7cf0ff"); g.addColorStop(.36, "#18b9df"); g.addColorStop(1, "#04326d");
  ctx.fillStyle = g; ctx.fillRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < 12; i++) drawSmallFish((i * 118 + performance.now() / (35 + i)) % 1050 - 40, 70 + ((i * 41 + performance.now() / (55 + i)) % 420), 10 + (i % 4) * 3, "rgba(236,255,251,.22)");
};

drawIslandAndDock = function drawTropicalDock() {
  rounded(206, 72, 548, 420, 54, "#f7d991", "#806231", 7);
  rounded(238, 94, 484, 370, 24, "#c57936", "#552c0d", 8);
  const shine = ctx.createLinearGradient(238, 94, 722, 464); shine.addColorStop(0, "rgba(255,229,157,.42)"); shine.addColorStop(1, "rgba(55,25,7,.34)"); ctx.fillStyle = shine; ctx.fillRect(248, 104, 464, 350);
  ctx.strokeStyle = "rgba(55,26,8,.7)"; ctx.lineWidth = 5;
  for (let x = 262; x < 710; x += 36) { ctx.beginPath(); ctx.moveTo(x, 100); ctx.lineTo(x + 10, 458); ctx.stroke(); }
  ctx.lineWidth = 4; for (let y = 126; y < 456; y += 48) { ctx.beginPath(); ctx.moveTo(246, y); ctx.lineTo(714, y - 6); ctx.stroke(); }
  rounded(406, 38, 150, 120, 18, "#b96e31", "#552c0d", 8); rounded(452, 104, 58, 54, 8, "#b96e31", "#552c0d", 5);
  rounded(52, 92, 236, 116, 22, "#b96e31", "#552c0d", 8); rounded(52, 366, 236, 116, 22, "#b96e31", "#552c0d", 8);
  drawMiniAwning(78, 98, "#1fd2ff", "#fff0a4"); drawMiniAwning(78, 372, "#ff6554", "#fff0a4");
  rounded(392, 232, 176, 102, 24, "rgba(255,238,140,.30)", "rgba(255,255,255,.7)", 3);
  drawSign(88, 122, "ROD SHOP"); drawSign(88, 390, "SELL FISH"); drawSign(423, 70, "FISH");
};

drawDockView = function drawDockFinal() { advDockView(); drawBars(); };
drawFishingView = function drawFishingFinal() { advFishingView(); drawPowerMeter(); drawBars(); };

function drawHomeScreen() {
  drawTopWater(); drawMenuFish(734, 190, 54, "#ffd45f"); drawMenuFish(214, 126, 32, "#ff7c87"); drawMenuFish(780, 402, 36, "#8dffda");
  rounded(190, 72, 580, 408, 0, "rgba(222,255,239,.94)", "#09283d", 5);
  const glow = ctx.createLinearGradient(190, 72, 770, 480); glow.addColorStop(0, "rgba(128,242,255,.45)"); glow.addColorStop(.5, "rgba(255,227,110,.24)"); glow.addColorStop(1, "rgba(77,255,158,.34)"); ctx.fillStyle = glow; ctx.fillRect(195, 77, 570, 398);
  drawSavingIcon(480, 75, true); drawHandTitle(480, 210); drawMenuButton(382, 304, 196, 46, "PLAY", playFromMenu); drawMenuButton(382, 366, 196, 46, "CREDITS", creditsFromMenu);
  if (state.menuPage === "credits") drawCreditsPanel();
}

drawSketchPirate = function drawColoredPirate(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = "#101721"; ctx.lineWidth = 4.5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  ctx.fillStyle = "#7d2424"; ctx.beginPath(); ctx.moveTo(-58,-44); ctx.lineTo(-12,-20); ctx.lineTo(34,-44); ctx.lineTo(23,88); ctx.lineTo(-28,88); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f5d7a7"; ctx.beginPath(); ctx.roundRect(-48,-130,88,84,9); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#101721"; ctx.beginPath(); ctx.ellipse(-22,-101,17,11,-.15,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(14,-94,6,0,Math.PI*2); ctx.fill();
  ctx.strokeStyle = "#101721"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-31,-72); ctx.lineTo(-15,-62); ctx.lineTo(2,-72); ctx.lineTo(20,-64); ctx.stroke();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.moveTo(-70,-142); ctx.quadraticCurveTo(-10,-199,56,-144); ctx.lineTo(30,-126); ctx.quadraticCurveTo(-19,-151,-60,-122); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f7d46c"; ctx.beginPath(); ctx.arc(-15,-167,10,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#2a1b13"; ctx.beginPath(); ctx.moveTo(-56,-44); ctx.lineTo(-20,-19); ctx.lineTo(-12,82); ctx.lineTo(-36,78); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(34,-44); ctx.lineTo(12,-19); ctx.lineTo(20,82); ctx.lineTo(42,76); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#111"; ctx.beginPath(); ctx.roundRect(-35,82,18,55,6); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#6a3f20"; ctx.beginPath(); ctx.roundRect(4,82,18,76,6); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#111"; ctx.beginPath(); ctx.roundRect(-48,130,36,16,6); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#7d2424"; ctx.beginPath(); ctx.moveTo(-52,-38); ctx.lineTo(-82,-88); ctx.lineTo(-94,-160); ctx.lineTo(-66,-164); ctx.lineTo(-40,-58); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#101721"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-96,-168); ctx.quadraticCurveTo(-32,-238,84,-270); ctx.stroke();
  ctx.fillStyle = "#7d2424"; ctx.beginPath(); ctx.moveTo(32,-38); ctx.lineTo(74,-4); ctx.lineTo(58,34); ctx.lineTo(27,8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "#d9d9d9"; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(82,26,20,1.15,5.15); ctx.stroke();
  ctx.fillStyle = "#ead1a0"; ctx.beginPath(); ctx.moveTo(32,-58); ctx.quadraticCurveTo(92,-74,116,-22); ctx.quadraticCurveTo(86,-5,39,-17); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#f4d36c"; ctx.beginPath(); ctx.arc(78,-40,22,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle = "#101721"; ctx.font = "900 22px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText("$",78,-33);
  ctx.restore();
};
