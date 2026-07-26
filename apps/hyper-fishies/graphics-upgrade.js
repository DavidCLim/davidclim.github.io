// Hyper Fishies graphics upgrade. Loaded last for the cleanest final visuals.
function glossyShape(fill, stroke = "#08243a", width = 4) {
  ctx.fillStyle = fill;
  ctx.strokeStyle = stroke;
  ctx.lineWidth = width;
  ctx.fill();
  ctx.stroke();
}

function drawCoinMedal(x, y, r) {
  const coin = ctx.createRadialGradient(x - r * .35, y - r * .35, 2, x, y, r);
  coin.addColorStop(0, "#fff7ad");
  coin.addColorStop(.55, "#ffd04c");
  coin.addColorStop(1, "#bc7f18");
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  glossyShape(coin, "#5c370d", 3);
  ctx.fillStyle = "#5c370d";
  ctx.font = `900 ${Math.round(r * 1.05)}px Trebuchet MS`;
  ctx.textAlign = "center";
  ctx.fillText("$", x, y + r * .38);
}

function drawPirateSellerBody(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Cape/coat silhouette like the sketch: wide shoulders, long coat tails.
  ctx.beginPath();
  ctx.moveTo(-70, -34);
  ctx.quadraticCurveTo(-30, -66, 0, -50);
  ctx.quadraticCurveTo(34, -66, 76, -32);
  ctx.lineTo(48, 114);
  ctx.quadraticCurveTo(18, 96, 0, 126);
  ctx.quadraticCurveTo(-18, 96, -48, 114);
  ctx.closePath();
  const coat = ctx.createLinearGradient(-72, -60, 72, 120);
  coat.addColorStop(0, "#d13f37");
  coat.addColorStop(.55, "#8f241f");
  coat.addColorStop(1, "#32120d");
  glossyShape(coat, "#101721", 5);

  // Open cream shirt and buttons.
  ctx.beginPath();
  ctx.moveTo(-22, -42);
  ctx.lineTo(22, -42);
  ctx.lineTo(16, 84);
  ctx.quadraticCurveTo(0, 98, -16, 84);
  ctx.closePath();
  glossyShape("#ffe1ad", "#101721", 4);
  ctx.fillStyle = "#101721";
  for (let yy = -12; yy <= 54; yy += 18) {
    ctx.beginPath(); ctx.arc(-7, yy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, yy, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Legs: one boot, one peg leg.
  ctx.beginPath(); ctx.roundRect(-44, 92, 24, 62, 8); glossyShape("#1a1413", "#101721", 4);
  ctx.beginPath(); ctx.roundRect(-58, 146, 50, 18, 8); glossyShape("#131313", "#101721", 4);
  ctx.beginPath(); ctx.roundRect(18, 90, 18, 76, 7); glossyShape("#8b5625", "#101721", 4);
  ctx.beginPath(); ctx.roundRect(8, 160, 40, 15, 7); glossyShape("#20140d", "#101721", 4);

  // Left arm raised with sword.
  ctx.beginPath();
  ctx.moveTo(-55, -28);
  ctx.quadraticCurveTo(-88, -80, -94, -152);
  ctx.lineTo(-62, -158);
  ctx.quadraticCurveTo(-52, -86, -34, -48);
  glossyShape("#a92d28", "#101721", 5);
  ctx.beginPath(); ctx.roundRect(-106, -174, 44, 30, 9); glossyShape("#f0bd67", "#101721", 4);
  ctx.strokeStyle = "#dce8ef";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(-92, -166);
  ctx.quadraticCurveTo(-30, -238, 92, -284);
  ctx.stroke();
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-94, -166);
  ctx.quadraticCurveTo(-30, -238, 92, -284);
  ctx.stroke();

  // Right arm with hook hand.
  ctx.beginPath();
  ctx.moveTo(54, -26);
  ctx.quadraticCurveTo(88, 0, 72, 40);
  ctx.lineTo(36, 10);
  glossyShape("#a92d28", "#101721", 5);
  ctx.strokeStyle = "#eef7ff";
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.arc(88, 34, 23, 1.05, 5.15);
  ctx.stroke();
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Head.
  const skin = ctx.createRadialGradient(-16, -122, 8, 0, -96, 58);
  skin.addColorStop(0, "#ffe7bd");
  skin.addColorStop(.75, "#d89f66");
  skin.addColorStop(1, "#9a5d35");
  ctx.beginPath();
  ctx.roundRect(-50, -138, 100, 92, 13);
  glossyShape(skin, "#101721", 5);

  // Eyepatch, eye, nose, moustache/mouth.
  ctx.fillStyle = "#101721";
  ctx.beginPath();
  ctx.ellipse(-24, -108, 21, 14, -0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-50, -116);
  ctx.lineTo(50, -96);
  ctx.stroke();
  ctx.fillStyle = "#101721";
  ctx.beginPath();
  ctx.arc(18, -100, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-3, -101);
  ctx.lineTo(-12, -87);
  ctx.lineTo(2, -85);
  ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-32, -72);
  ctx.quadraticCurveTo(-16, -58, 0, -72);
  ctx.quadraticCurveTo(16, -58, 34, -69);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-22, -79);
  ctx.quadraticCurveTo(0, -74, 22, -80);
  ctx.stroke();

  // Pirate hat with curled right feather.
  ctx.beginPath();
  ctx.moveTo(-76, -150);
  ctx.quadraticCurveTo(-4, -214, 70, -150);
  ctx.lineTo(42, -128);
  ctx.quadraticCurveTo(-8, -156, -66, -126);
  ctx.closePath();
  glossyShape("#111216", "#101721", 4);
  drawCoinMedal(-18, -176, 11);
  ctx.beginPath();
  ctx.moveTo(42, -143);
  ctx.quadraticCurveTo(78, -164, 96, -132);
  ctx.quadraticCurveTo(70, -126, 42, -116);
  ctx.closePath();
  glossyShape("#e8f2ff", "#101721", 3);
  ctx.strokeStyle = "#101721";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(58, -136);
  ctx.lineTo(86, -148);
  ctx.stroke();

  // Money cape/coin to match the seller sketch.
  ctx.beginPath();
  ctx.moveTo(42, -58);
  ctx.quadraticCurveTo(110, -78, 138, -20);
  ctx.quadraticCurveTo(100, 0, 48, -18);
  ctx.closePath();
  glossyShape("#ead19e", "#101721", 4);
  drawCoinMedal(94, -40, 25);
  ctx.restore();
}

drawSketchPirate = function drawImprovedPirateSeller(x, y) {
  drawPirateSellerBody(x, y + 10, 1.05);
};

function drawDeepGradientWater() {
  const water = ctx.createLinearGradient(0, 0, 0, canvas.height);
  water.addColorStop(0, "#95f5ff");
  water.addColorStop(.28, "#22c7ef");
  water.addColorStop(.65, "#0879bf");
  water.addColorStop(1, "#042c65");
  ctx.fillStyle = water;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  for (let i = 0; i < 8; i++) {
    const x = -130 + i * 155;
    const ray = ctx.createLinearGradient(x, 0, x + 180, 560);
    ray.addColorStop(0, "rgba(255,255,255,.34)");
    ray.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = ray;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 80, 0);
    ctx.lineTo(x + 230, 560);
    ctx.lineTo(x - 50, 560);
    ctx.closePath();
    ctx.fill();
  }
  ctx.globalAlpha = .22;
  for (let i = 0; i < 18; i++) {
    drawSmallFish((i * 93 + performance.now() / (32 + i)) % 1040 - 45, 54 + ((i * 37 + performance.now() / (47 + i)) % 450), 9 + (i % 5) * 3, "#ecfffb");
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

drawTopWater = function drawTopWaterGraphicsUpgrade() {
  drawDeepGradientWater();
};

const graphicsDockView = drawDockView;
drawDockView = function drawDockGraphicsUpgrade() {
  graphicsDockView();
  ctx.save();
  ctx.globalAlpha = .18;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(480, 286, 365, 234, 0, 0, Math.PI * 2);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
};
