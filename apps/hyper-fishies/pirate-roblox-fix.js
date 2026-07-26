// Final pirate override: clean Roblox-like anatomy with aligned face and connected parts.
function pirateGrad(x1, y1, x2, y2, stops) {
  const g = ctx.createLinearGradient(x1, y1, x2, y2);
  stops.forEach(stop => g.addColorStop(stop[0], stop[1]));
  return g;
}

function robloxPart(x, y, w, h, r, fill, stroke = "#101721", line = 4) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = stroke;
  ctx.lineWidth = line;
  ctx.stroke();
}

function drawRobloxPirate(x, y, scale = 1) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const outline = "#101721";
  const skin = pirateGrad(-50, -150, 50, -60, [[0, "#ffe7bd"], [.7, "#d99b63"], [1, "#a6683e"]]);
  const coat = pirateGrad(-80, -50, 80, 140, [[0, "#d63d34"], [.55, "#8e211d"], [1, "#35110d"]]);

  // Back cape, broad like the sketch but attached to the torso.
  ctx.beginPath();
  ctx.moveTo(-78, -44);
  ctx.quadraticCurveTo(-36, -76, 0, -58);
  ctx.quadraticCurveTo(38, -76, 80, -44);
  ctx.lineTo(58, 118);
  ctx.quadraticCurveTo(22, 96, 0, 132);
  ctx.quadraticCurveTo(-22, 96, -58, 118);
  ctx.closePath();
  ctx.fillStyle = coat;
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.stroke();

  // Blocky Roblox torso and shirt.
  robloxPart(-42, -46, 84, 118, 10, coat, outline, 5);
  ctx.beginPath();
  ctx.moveTo(-20, -42);
  ctx.lineTo(20, -42);
  ctx.lineTo(16, 72);
  ctx.quadraticCurveTo(0, 86, -16, 72);
  ctx.closePath();
  ctx.fillStyle = "#ffe4b7";
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 4;
  ctx.stroke();
  ctx.fillStyle = outline;
  for (let yy = -14; yy <= 48; yy += 18) {
    ctx.beginPath(); ctx.arc(-7, yy, 3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(7, yy, 3, 0, Math.PI * 2); ctx.fill();
  }

  // Legs: one normal boot, one peg leg. Both attached under body.
  robloxPart(-36, 68, 24, 62, 8, "#171412", outline, 4);
  robloxPart(-48, 122, 46, 18, 8, "#111111", outline, 4);
  robloxPart(14, 68, 22, 76, 8, "#7b4b22", outline, 4);
  robloxPart(4, 136, 42, 16, 8, "#26170c", outline, 4);

  // Left raised arm and sword, connected at shoulder.
  ctx.beginPath();
  ctx.moveTo(-42, -36);
  ctx.lineTo(-72, -88);
  ctx.lineTo(-78, -146);
  ctx.lineTo(-48, -152);
  ctx.lineTo(-34, -52);
  ctx.closePath();
  ctx.fillStyle = "#b42a25";
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.stroke();
  robloxPart(-88, -166, 42, 28, 8, skin, outline, 4);
  ctx.strokeStyle = "#eaf6ff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(-70, -154);
  ctx.quadraticCurveTo(-12, -222, 96, -264);
  ctx.stroke();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-70, -154);
  ctx.quadraticCurveTo(-12, -222, 96, -264);
  ctx.stroke();

  // Right arm with hook. No floating pieces.
  ctx.beginPath();
  ctx.moveTo(42, -34);
  ctx.lineTo(78, -10);
  ctx.lineTo(70, 44);
  ctx.lineTo(40, 18);
  ctx.closePath();
  ctx.fillStyle = "#b42a25";
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.strokeStyle = "#f2fbff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(82, 42, 22, 1.05, 5.2);
  ctx.stroke();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Head as a blocky rounded square, centered above torso.
  robloxPart(-50, -138, 100, 90, 12, skin, outline, 5);

  // Hat brim and top, centered. Feather on right like drawing.
  ctx.beginPath();
  ctx.moveTo(-74, -150);
  ctx.quadraticCurveTo(0, -214, 74, -150);
  ctx.lineTo(44, -130);
  ctx.quadraticCurveTo(0, -154, -44, -130);
  ctx.closePath();
  ctx.fillStyle = "#111216";
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.fillStyle = "#f7d46c";
  ctx.beginPath(); ctx.arc(0, -169, 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#e8f2ff";
  ctx.beginPath();
  ctx.moveTo(42, -141);
  ctx.quadraticCurveTo(82, -166, 96, -130);
  ctx.quadraticCurveTo(68, -125, 42, -116);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(56, -136); ctx.lineTo(86, -148); ctx.stroke();

  // Face: all parts aligned to the head, no mismatched eyes/mouth.
  ctx.strokeStyle = outline;
  ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-50, -116); ctx.lineTo(50, -98); ctx.stroke();
  ctx.fillStyle = outline;
  ctx.beginPath(); ctx.ellipse(-24, -108, 19, 12, -0.15, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(19, -101, 6, 0, Math.PI * 2); ctx.fill();
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(-5, -101); ctx.lineTo(-13, -88); ctx.lineTo(2, -86); ctx.stroke();
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-30, -72);
  ctx.quadraticCurveTo(-15, -61, 0, -72);
  ctx.quadraticCurveTo(15, -61, 30, -70);
  ctx.stroke();
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-19, -80); ctx.quadraticCurveTo(0, -75, 19, -80); ctx.stroke();

  // Coin cape on the right, attached to shoulder.
  ctx.beginPath();
  ctx.moveTo(38, -56);
  ctx.quadraticCurveTo(100, -74, 128, -22);
  ctx.quadraticCurveTo(96, 0, 42, -18);
  ctx.closePath();
  ctx.fillStyle = "#ead19e";
  ctx.fill();
  ctx.strokeStyle = outline;
  ctx.lineWidth = 4;
  ctx.stroke();
  const coin = ctx.createRadialGradient(90, -40, 3, 90, -40, 25);
  coin.addColorStop(0, "#fff7ad");
  coin.addColorStop(.62, "#ffd04c");
  coin.addColorStop(1, "#b87914");
  ctx.fillStyle = coin;
  ctx.beginPath(); ctx.arc(90, -40, 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = outline;
  ctx.font = "900 25px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("$", 90, -31);

  ctx.restore();
}

drawSketchPirate = function drawRobloxPirateSeller(x, y) {
  drawRobloxPirate(x, y + 8, 1.03);
};
