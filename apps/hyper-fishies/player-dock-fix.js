// Final player/dock fix: remove diving for now, simplify dock, and make the player match David's sketch better.
state.diving = false;
state.oxygen = 100;
state.health = 100;

const fixUpdate = update;
const fixButtons = drawGameButtons;
const fixDockView = drawDockView;
const fixFishingView = drawFishingView;

update = function updateNoDiving(dt) {
  state.diving = false;
  state.oxygen = 100;
  state.health = 100;
  fixUpdate(dt);
};

drawGameButtons = function drawButtonsNoDive() {
  fixButtons();
  for (let i = buttonZones.length - 1; i >= 0; i--) {
    const b = buttonZones[i];
    if (b && b.x === 360 && b.y === 500 && b.w === 110 && b.h === 42) buttonZones.splice(i, 1);
  }
};

function drawBars() {}
function toggleDive() { say("Diving is removed for now. Fishing is the main focus."); }

function sketchPlayer(x, y, scale, direction, fishing = false) {
  const t = state.walkFrame || 0;
  const step = Math.sin(t) * 6;
  const side = direction === "left" || direction === "right";
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale * (direction === "left" ? -1 : 1), scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 4.5;
  ctx.fillStyle = "#f8efe1";

  // Tiny round head, exactly the simple circle-person idea from the sketch.
  ctx.beginPath();
  ctx.arc(0, -34, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Simple body, not a chunky red blob.
  ctx.fillStyle = "#fff7ec";
  ctx.beginPath();
  ctx.roundRect(-12, -13, 24, 42, 12);
  ctx.fill();
  ctx.stroke();

  // Face only when not back-facing.
  if (direction !== "up") {
    ctx.fillStyle = "#101721";
    ctx.beginPath(); ctx.arc(-6, -38, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(6, -38, 2.6, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#101721";
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    ctx.arc(0, -30, 7, 0.08, Math.PI - 0.08);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "#101721";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, -36, 13, Math.PI * .08, Math.PI * .92);
    ctx.stroke();
  }

  // Little side-view nose like the reference sketches.
  if (side) {
    ctx.strokeStyle = "#101721";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(14, -36);
    ctx.lineTo(22, -32);
    ctx.lineTo(14, -30);
    ctx.stroke();
  }

  // Stick arms and legs with tiny walking motion.
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 4.5;
  const armSwing = fishing ? 0 : step;
  ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-30, 12 + armSwing); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(30, 12 - armSwing); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, 28); ctx.lineTo(-22, 52 - step); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7, 28); ctx.lineTo(22, 52 + step); ctx.stroke();

  // Small feet dots like the drawing.
  ctx.fillStyle = "#101721";
  ctx.beginPath(); ctx.arc(-22, 52 - step, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(22, 52 + step, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

drawCirclePlayer = function drawSketchPlayerOnDock() {
  if (state.player) sketchPlayer(state.player.x, state.player.y, 0.72, state.direction || "up", false);
};

drawFisherCircle = function drawSketchPlayerFishing() {
  sketchPlayer(142, 286, 0.70, "right", true);
  const rod = typeof currentRod === "function" ? currentRod() : { color: "#5a310d", glow: "#f3c47b", id: 1 };
  ctx.save();
  ctx.strokeStyle = rod.color || "#5a310d";
  ctx.shadowColor = rod.glow || "#f3c47b";
  ctx.shadowBlur = 9;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(164, 270);
  ctx.quadraticCurveTo(236, 214, 310, 246);
  ctx.stroke();
  ctx.restore();
};

function simpleDockPost(x, y) {
  rounded(x - 10, y - 18, 20, 46, 6, "#754118", "#321606", 4);
}

function smallDockSign(x, y, label, color) {
  rounded(x, y, 116, 42, 10, color, "#3d2109", 4);
  ctx.fillStyle = "#2b1607";
  ctx.font = "900 16px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(label, x + 58, y + 27);
}

drawIslandAndDock = function drawCleanDock() {
  ctx.save();
  // A calmer island so the playable path is readable.
  rounded(190, 78, 580, 406, 52, "#f4d990", "#806033", 6);
  ctx.fillStyle = "rgba(255,255,255,.18)";
  ctx.beginPath();
  ctx.ellipse(480, 282, 250, 160, 0, 0, Math.PI * 2);
  ctx.fill();

  // One clean main pier.
  rounded(260, 108, 440, 338, 20, "#b86b2f", "#4a260b", 8);
  const wood = ctx.createLinearGradient(260, 108, 700, 446);
  wood.addColorStop(0, "rgba(255,226,153,.34)");
  wood.addColorStop(1, "rgba(59,26,6,.30)");
  ctx.fillStyle = wood;
  ctx.fillRect(270, 118, 420, 318);
  ctx.strokeStyle = "rgba(65,31,8,.68)";
  ctx.lineWidth = 5;
  for (let x = 288; x <= 680; x += 44) {
    ctx.beginPath(); ctx.moveTo(x, 112); ctx.lineTo(x + 7, 440); ctx.stroke();
  }
  ctx.lineWidth = 4;
  for (let y = 150; y <= 420; y += 54) {
    ctx.beginPath(); ctx.moveTo(268, y); ctx.lineTo(692, y - 5); ctx.stroke();
  }

  // Clear top fishing dock.
  rounded(404, 42, 152, 116, 16, "#b86b2f", "#4a260b", 7);
  rounded(452, 104, 56, 54, 9, "#b86b2f", "#4a260b", 5);
  smallDockSign(422, 66, "FISH", "#ffe36e");

  // Cleaner shop and sell pads attached with bridges, no weird huge blocks.
  rounded(122, 116, 158, 78, 16, "#b86b2f", "#4a260b", 7);
  rounded(228, 136, 48, 36, 8, "#b86b2f", "#4a260b", 5);
  smallDockSign(144, 134, "ROD SHOP", "#81e8ff");

  rounded(122, 374, 158, 78, 16, "#b86b2f", "#4a260b", 7);
  rounded(228, 394, 48, 36, 8, "#b86b2f", "#4a260b", 5);
  smallDockSign(144, 392, "SELL FISH", "#ff8a67");

  // Posts and rope rails, simple and tidy.
  [[270,120],[392,112],[568,112],[690,120],[270,432],[392,444],[568,444],[690,432],[410,54],[550,54]].forEach(p => simpleDockPost(p[0], p[1]));
  ctx.strokeStyle = "#efd08e";
  ctx.lineWidth = 5;
  sketchLine([[270,122],[392,114],[568,114],[690,122]]);
  sketchLine([[270,434],[392,446],[568,446],[690,434]]);

  // Tropical, but less cluttered.
  finalPalm(792, 118, .62, -1);
  finalPalm(180, 470, .58, 1);
  finalCoral(788, 488, "#ff7193");
  finalCoral(130, 96, "#ffae63");
  ctx.restore();
};

drawDockView = function drawCleanDockView() {
  drawTopWater();
  drawIslandAndDock();
  drawDockLabels();
  drawCirclePlayer();
};

drawFishingView = function drawFishingNoBars() {
  fixFishingView();
  if (typeof drawPowerMeter === "function") drawPowerMeter();
};
