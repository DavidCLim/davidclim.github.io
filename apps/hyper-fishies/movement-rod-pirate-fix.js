// Final movement, fishing pose, and pirate design polish.
const smoothDockSpeed = 220;

updateDock = function updateDockLessSlippery(dt) {
  const p = state.player;
  let ax = 0, ay = 0;
  if (keys.has("arrowleft") || keys.has("a")) ax -= 1;
  if (keys.has("arrowright") || keys.has("d")) ax += 1;
  if (keys.has("arrowup") || keys.has("w")) ay -= 1;
  if (keys.has("arrowdown") || keys.has("s")) ay += 1;
  ax += joy.x;
  ay += joy.y;

  const mag = Math.hypot(ax, ay);
  const targetVx = mag ? (ax / mag) * smoothDockSpeed : 0;
  const targetVy = mag ? (ay / mag) * smoothDockSpeed : 0;
  const snap = mag ? 0.34 : 0.58;
  p.vx += (targetVx - p.vx) * snap;
  p.vy += (targetVy - p.vy) * snap;

  if (Math.abs(p.vx) < 1.4) p.vx = 0;
  if (Math.abs(p.vy) < 1.4) p.vy = 0;
  p.x += p.vx * dt;
  p.y += p.vy * dt;
  constrainToDock(p);

  if (atSellDock(p)) enterSellShop();
  else if (atFishingDock(p)) say("Fishing dock: tap CAST or press Space/F.");
  else if (atShopDock(p)) say("Rod shop: choose a better rod for more luck.");
};

function drawCoolStickmanBody(x, y, scale, holdingRod = false) {
  const t = state.walkFrame || 0;
  const step = Math.sin(t) * 5;
  const bob = Math.abs(Math.sin(t)) * 1.6;
  ctx.save();
  ctx.translate(x, y - bob);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.fillStyle = "rgba(9, 18, 24, .25)";
  ctx.beginPath();
  ctx.ellipse(0, 58 + bob, 28, 9, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "#071722";
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.moveTo(-9, 24); ctx.lineTo(-22, 52 - step); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(9, 24); ctx.lineTo(22, 52 + step); ctx.stroke();

  ctx.fillStyle = "#12324f";
  ctx.beginPath(); ctx.ellipse(-23, 54 - step, 9, 5, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(23, 54 + step, 9, 5, 0.15, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = "#ff6860";
  ctx.strokeStyle = "#071722";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.roundRect(-18, -12, 36, 43, 15);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#74e8ff";
  ctx.beginPath();
  ctx.roundRect(-8, -4, 16, 22, 6);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#21496b";
  ctx.beginPath();
  ctx.roundRect(-28, -6, 13, 28, 6);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#071722";
  ctx.lineWidth = 7;
  if (holdingRod) {
    ctx.beginPath(); ctx.moveTo(-16, -2); ctx.lineTo(-28, 15); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(16, -2); ctx.lineTo(38, -18); ctx.stroke();
    ctx.strokeStyle = "#6b3a17";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(33, -22);
    ctx.quadraticCurveTo(90, -84, 174, -58);
    ctx.stroke();
    ctx.strokeStyle = "rgba(236,255,251,.85)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(174, -58);
    ctx.quadraticCurveTo(214, 30, 200, 84);
    ctx.stroke();
    ctx.fillStyle = "#fff3df";
    ctx.strokeStyle = "#071722";
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(38, -18, 5, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.moveTo(-17, -2); ctx.lineTo(-33, 14 + step * 0.55); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(17, -2); ctx.lineTo(33, 14 - step * 0.55); ctx.stroke();
  }

  ctx.fillStyle = "#ffe9c8";
  ctx.strokeStyle = "#071722";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.arc(0, -36, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#3b2314";
  ctx.beginPath();
  ctx.arc(0, -42, 22, Math.PI * 1.05, Math.PI * 1.95);
  ctx.quadraticCurveTo(18, -44, 15, -29);
  ctx.quadraticCurveTo(3, -38, -3, -30);
  ctx.quadraticCurveTo(-11, -40, -18, -29);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

drawCirclePlayer = function drawCoolBackPlayer() {
  if (state.player) drawCoolStickmanBody(state.player.x, state.player.y, 0.72, false);
};

drawFisherCircle = function drawFisherHoldingRod() {
  drawCoolStickmanBody(142, 285, 0.68, true);
};

function drawReferencePirate(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  const outline = "#081520";

  // Sketch-inspired coat silhouette: wide shoulders, centered body.
  ctx.fillStyle = "#7d1f1b";
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-82, -40);
  ctx.lineTo(-28, -18);
  ctx.lineTo(-14, 118);
  ctx.lineTo(0, 104);
  ctx.lineTo(18, 118);
  ctx.lineTo(34, -18);
  ctx.lineTo(84, -40);
  ctx.lineTo(58, 84);
  ctx.quadraticCurveTo(22, 70, 0, 92);
  ctx.quadraticCurveTo(-22, 70, -58, 84);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Shirt and buttons.
  ctx.fillStyle = "#f5d7a7";
  ctx.beginPath();
  ctx.moveTo(-24, -32);
  ctx.lineTo(24, -32);
  ctx.lineTo(18, 86);
  ctx.quadraticCurveTo(0, 102, -18, 86);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = outline;
  for (let yy = -8; yy < 62; yy += 17) {
    ctx.beginPath(); ctx.arc(-8, yy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(8, yy, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Legs: boot and peg leg.
  ctx.fillStyle = "#15110e";
  ctx.beginPath(); ctx.roundRect(-38, 86, 25, 52, 7); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.roundRect(-50, 132, 44, 16, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#7a4a23";
  ctx.beginPath(); ctx.roundRect(15, 86, 20, 70, 7); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#20120a";
  ctx.beginPath(); ctx.roundRect(4, 150, 42, 14, 7); ctx.fill(); ctx.stroke();

  // Left raised sword arm.
  ctx.fillStyle = "#9f2924";
  ctx.beginPath();
  ctx.moveTo(-54, -34);
  ctx.lineTo(-92, -78);
  ctx.lineTo(-103, -142);
  ctx.lineTo(-74, -150);
  ctx.lineTo(-38, -48);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f5d7a7";
  ctx.beginPath(); ctx.roundRect(-108, -160, 42, 26, 8); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#edf8ff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-88, -150);
  ctx.quadraticCurveTo(-30, -218, 92, -258);
  ctx.stroke();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Right hook arm and coin cloth.
  ctx.fillStyle = "#9f2924";
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(54, -34);
  ctx.lineTo(92, -4);
  ctx.lineTo(72, 42);
  ctx.lineTo(36, 12);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "#f4fbff";
  ctx.lineWidth = 8;
  ctx.beginPath(); ctx.arc(84, 44, 22, 1.05, 5.18); ctx.stroke();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.fillStyle = "#ead19e";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(36, -54);
  ctx.quadraticCurveTo(104, -76, 132, -20);
  ctx.quadraticCurveTo(100, 2, 42, -18);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  const coin = ctx.createRadialGradient(90, -42, 3, 90, -42, 25);
  coin.addColorStop(0, "#fff6a5"); coin.addColorStop(.65, "#ffd04c"); coin.addColorStop(1, "#b87914");
  ctx.fillStyle = coin;
  ctx.beginPath(); ctx.arc(90, -42, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = outline; ctx.font = "900 25px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText("$", 90, -33);

  // Head, hat, feather, and aligned face.
  const skin = ctx.createLinearGradient(-48, -140, 48, -50);
  skin.addColorStop(0, "#ffe7bd"); skin.addColorStop(.75, "#d89a62"); skin.addColorStop(1, "#a8643b");
  ctx.fillStyle = skin;
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.roundRect(-50, -138, 100, 90, 12); ctx.fill(); ctx.stroke();

  ctx.fillStyle = "#101217";
  ctx.beginPath();
  ctx.moveTo(-78, -150);
  ctx.quadraticCurveTo(0, -214, 78, -150);
  ctx.lineTo(44, -128);
  ctx.quadraticCurveTo(0, -154, -44, -128);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7d46c";
  ctx.beginPath(); ctx.arc(0, -169, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#e8f2ff";
  ctx.beginPath();
  ctx.moveTo(42, -140);
  ctx.quadraticCurveTo(84, -164, 98, -130);
  ctx.quadraticCurveTo(70, -124, 43, -116);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = outline;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-50, -116); ctx.lineTo(50, -99); ctx.stroke();
  ctx.fillStyle = outline;
  ctx.beginPath(); ctx.ellipse(-24, -108, 19, 12, -0.16, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(19, -101, 6, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-5, -100); ctx.lineTo(-13, -88); ctx.lineTo(3, -86); ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-30, -72);
  ctx.quadraticCurveTo(-15, -60, 0, -72);
  ctx.quadraticCurveTo(15, -60, 30, -70);
  ctx.stroke();

  ctx.restore();
}

drawSketchPirate = function drawPirateCloserToReference(x, y) {
  drawReferencePirate(x, y + 8, 1.03);
};

say("Movement is tighter, and the player holds the rod while casting.");
updateHud();
