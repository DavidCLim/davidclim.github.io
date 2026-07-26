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
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 4.5;
  ctx.fillStyle = "#f8efe1";

  ctx.beginPath();
  ctx.arc(0, -34, 20, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Back-of-head curve from the drawing, no front face.
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 2.7;
  ctx.beginPath();
  ctx.arc(0, -36, 13, Math.PI * 0.08, Math.PI * 0.92);
  ctx.stroke();

  ctx.fillStyle = "#fff7ec";
  ctx.beginPath();
  ctx.roundRect(-12, -13, 24, 42, 12);
  ctx.fill();
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 4.5;
  ctx.stroke();

  ctx.beginPath(); ctx.moveTo(-12, -2); ctx.lineTo(-30, 12 + step); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(12, -2); ctx.lineTo(30, 12 - step); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-7, 28); ctx.lineTo(-22, 52 - step); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(7, 28); ctx.lineTo(22, 52 + step); ctx.stroke();

  ctx.fillStyle = "#101721";
  ctx.beginPath(); ctx.arc(-22, 52 - step, 3.5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(22, 52 + step, 3.5, 0, Math.PI * 2); ctx.fill();
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
