// Save/player/cast final fix.
// Resets old coin balances once, forces the drawn player to back view, and lets screen taps release cast power.
const coinResetFlag = "hyperFishiesCoinsReset20260726V1";
try {
  if (localStorage.getItem(coinResetFlag) !== "done") {
    state.progress.coins = 0;
    localStorage.setItem(coinResetFlag, "done");
    saveGame();
  }
} catch {}

function drawBackViewStickman(x, y, scale = 1) {
  const t = state.walkFrame || 0;
  const step = Math.sin(t) * 6;
  const bob = Math.abs(Math.sin(t)) * 2;

  ctx.save();
  ctx.translate(x, y - bob);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Soft shadow so the player sits on the dock instead of floating visually.
  ctx.fillStyle = "rgba(9, 18, 24, .24)";
  ctx.beginPath();
  ctx.ellipse(0, 59 + bob, 28, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs first, with simple walking motion.
  ctx.strokeStyle = "#0b1720";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-9, 24);
  ctx.lineTo(-22, 52 - step);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(9, 24);
  ctx.lineTo(22, 52 + step);
  ctx.stroke();

  ctx.fillStyle = "#102338";
  ctx.beginPath();
  ctx.ellipse(-23, 54 - step, 9, 5, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(23, 54 + step, 9, 5, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Body: round, small adventurer vest, still matching the drawing's simple shape.
  ctx.fillStyle = "#fff3df";
  ctx.strokeStyle = "#0b1720";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-18, -12, 36, 43, 15);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#ff665f";
  ctx.beginPath();
  ctx.roundRect(-16, -9, 32, 34, 12);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#75e8ff";
  ctx.beginPath();
  ctx.roundRect(-8, -4, 16, 22, 6);
  ctx.fill();
  ctx.stroke();

  // Tiny backpack/oxygen pouch for a cooler explorer look.
  ctx.fillStyle = "#21496b";
  ctx.beginPath();
  ctx.roundRect(-28, -6, 13, 28, 6);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#ffe36e";
  ctx.beginPath();
  ctx.arc(-21.5, -10, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Arms with a clearer walk pose.
  ctx.strokeStyle = "#0b1720";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-17, -2);
  ctx.lineTo(-33, 14 + step * 0.55);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(17, -2);
  ctx.lineTo(33, 14 - step * 0.55);
  ctx.stroke();
  ctx.fillStyle = "#fff3df";
  ctx.beginPath();
  ctx.arc(-34, 15 + step * 0.55, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(34, 15 - step * 0.55, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head: back view, no face, but now with hair/hood details like a real character.
  ctx.fillStyle = "#ffe9c8";
  ctx.strokeStyle = "#0b1720";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -36, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#3b2314";
  ctx.beginPath();
  ctx.arc(0, -42, 22, Math.PI * 1.05, Math.PI * 1.95);
  ctx.quadraticCurveTo(17, -46, 16, -30);
  ctx.quadraticCurveTo(4, -38, -2, -31);
  ctx.quadraticCurveTo(-10, -40, -18, -29);
  ctx.quadraticCurveTo(-21, -42, -13, -51);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Back-of-head curve from the drawing.
  ctx.strokeStyle = "rgba(11, 23, 32, .72)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(0, -37, 13, Math.PI * 0.08, Math.PI * 0.92);
  ctx.stroke();

  // Little fishing badge makes the character feel like Hyper Fishies, not a generic dot.
  ctx.fillStyle = "#ffe36e";
  ctx.strokeStyle = "#0b1720";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(14, 2, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#0b1720";
  ctx.font = "900 8px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("F", 14, 5);

  ctx.restore();
}

drawCirclePlayer = function drawBackViewPlayerOnly() {
  if (state.player) drawBackViewStickman(state.player.x, state.player.y, 0.72);
};

const oldReleaseCastPower = typeof releaseCastPower === "function" ? releaseCastPower : null;
function releaseCastPowerFromScreen() {
  if (!state.castPower || state.mode !== "fishing") return false;
  if (oldReleaseCastPower) oldReleaseCastPower();
  else castLine();
  return true;
}

canvas.addEventListener("pointerdown", event => {
  if (!state || !state.castPower || state.mode !== "fishing") return;
  const point = canvasPoint(event);
  const ui = buttonZones.find(b => inRect(point, b.x, b.y, b.w, b.h));
  if (ui) return;
  event.preventDefault();
  releaseCastPowerFromScreen();
}, true);

say("Coins reset. Tap anywhere during the cast meter to release your cast.");
updateHud();
