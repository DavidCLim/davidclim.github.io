function drawSketchPirate(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Roblox-like blocky body: clear head, torso, arms, and legs.
  ctx.fillStyle = "#2f1c12";
  roundedLocal(-50, -40, 96, 112, 10, "#2f1c12");
  ctx.fillStyle = "#bb3c2e";
  roundedLocal(-24, -34, 44, 100, 6, "#bb3c2e");
  ctx.fillStyle = "#f7d6a0";
  roundedLocal(-10, -38, 18, 94, 5, "#f7d6a0");
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3.5;
  sketchLine([[-48,-30],[-24,4],[-18,62]]);
  sketchLine([[45,-30],[20,4],[16,62]]);
  for (let yy = -14; yy < 34; yy += 16) {
    ctx.beginPath(); ctx.arc(-4, yy, 2.5, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(8, yy, 2.5, 0, Math.PI * 2); ctx.stroke();
  }

  // Legs and boots, attached under the torso.
  ctx.fillStyle = "#2f1c12";
  roundedLocal(-44, 62, 35, 70, 8, "#2f1c12");
  roundedLocal(6, 62, 35, 70, 8, "#2f1c12");
  ctx.fillStyle = "#17100b";
  roundedLocal(-60, 122, 54, 22, 8, "#17100b");
  roundedLocal(0, 122, 54, 22, 8, "#17100b");

  // Block arms: one raised with sword, one bent toward the speech bubble.
  ctx.fillStyle = "#2f1c12";
  ctx.save();
  ctx.rotate(-0.58);
  roundedLocal(-118, -74, 34, 104, 8, "#2f1c12");
  ctx.restore();
  ctx.fillStyle = "#f2c06b";
  ctx.save();
  ctx.rotate(-0.58);
  roundedLocal(-122, -94, 40, 28, 9, "#f2c06b");
  ctx.restore();

  ctx.fillStyle = "#2f1c12";
  ctx.save();
  ctx.rotate(0.48);
  roundedLocal(58, -58, 34, 88, 8, "#2f1c12");
  ctx.restore();
  ctx.fillStyle = "#f2c06b";
  sketchClosed([[86,18],[104,4],[101,29],[118,18],[109,44],[88,39]]);

  // Sword.
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[-97,-160],[-38,-238],[70,-278]]);
  sketchLine([[-91,-156],[44,-250]]);
  sketchLine([[-114,-145],[-76,-181],[-51,-153]]);

  // Neck and square Roblox-style head.
  ctx.fillStyle = "#f2c06b";
  roundedLocal(-14, -58, 22, 22, 5, "#f2c06b");
  roundedLocal(-54, -132, 88, 82, 10, "#f2c06b");

  // Face, eyepatch, moustache.
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[-52,-106],[34,-88]]);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(-28, -101, 17, 11, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(8, -94, 5, 0, Math.PI * 2);
  ctx.fill();
  sketchLine([[-12,-98],[-18,-90],[-8,-89]]);
  sketchLine([[-37,-76],[-20,-66],[-2,-75]]);
  sketchLine([[-34,-68],[-4,-68]]);

  // Big pirate hat connected on top.
  ctx.fillStyle = "#191919";
  ctx.beginPath();
  ctx.moveTo(-68, -142);
  ctx.quadraticCurveTo(-10, -202, 54, -144);
  ctx.lineTo(30, -126);
  ctx.quadraticCurveTo(-18, -150, -58, -122);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7d46c";
  ctx.beginPath();
  ctx.arc(-15, -166, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  sketchLine([[30,-138],[66,-154],[80,-134]]);

  // Coin medallion/cape detail from the drawing.
  ctx.fillStyle = "#f4d36c";
  ctx.beginPath();
  ctx.arc(82, -42, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = "900 25px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("$", 82, -34);
  ctx.restore();
}

function drawRodShopKeeper(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Roblox-like shopkeeper with a big wavy rod across the shoulders.
  ctx.fillStyle = "#ffd982";
  roundedLocal(-44, -88, 88, 82, 12, "#ffd982");
  roundedLocal(-12, -10, 24, 20, 5, "#ffd982");

  ctx.fillStyle = "#6bd3ff";
  roundedLocal(-52, 8, 104, 112, 10, "#6bd3ff");
  ctx.fillStyle = "#fff0b9";
  roundedLocal(-17, 12, 34, 102, 6, "#fff0b9");
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3.5;
  sketchLine([[-50,18],[-18,46],[-14,116]]);
  sketchLine([[50,18],[18,46],[14,116]]);

  ctx.fillStyle = "#6bd3ff";
  ctx.save();
  ctx.rotate(-0.7);
  roundedLocal(-130, -36, 34, 112, 8, "#6bd3ff");
  ctx.restore();
  ctx.save();
  ctx.rotate(0.7);
  roundedLocal(94, -36, 34, 112, 8, "#6bd3ff");
  ctx.restore();
  ctx.fillStyle = "#ffd982";
  roundedLocal(-132, -69, 38, 26, 9, "#ffd982");
  roundedLocal(108, -69, 38, 26, 9, "#ffd982");

  ctx.fillStyle = "#334159";
  roundedLocal(-46, 112, 38, 70, 8, "#334159");
  roundedLocal(8, 112, 38, 70, 8, "#334159");
  ctx.fillStyle = "#17100b";
  roundedLocal(-58, 174, 54, 20, 7, "#17100b");
  roundedLocal(4, 174, 54, 20, 7, "#17100b");

  // Face: clear but simple, more Roblox block head than floppy sketch.
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(-16, -56, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(18, -56, 5, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[-16,-34],[2,-24],[24,-36]]);
  ctx.fillStyle = "#2f1c12";
  ctx.beginPath();
  ctx.moveTo(-56, -92);
  ctx.quadraticCurveTo(0, -128, 58, -92);
  ctx.lineTo(43, -78);
  ctx.quadraticCurveTo(0, -94, -43, -78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wavy decorated rod, inspired by the user's drawing.
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-160, -84);
  ctx.bezierCurveTo(-100, -132, -62, -74, -10, -100);
  ctx.bezierCurveTo(40, -126, 92, -72, 166, -114);
  ctx.stroke();
  ctx.strokeStyle = "#f4d36c";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-158, -86);
  ctx.bezierCurveTo(-100, -126, -62, -78, -10, -98);
  ctx.bezierCurveTo(40, -120, 92, -76, 164, -112);
  ctx.stroke();
  ctx.fillStyle = "#111";
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(-118 + i * 40, -92 + Math.sin(i) * 13, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function roundedLocal(x, y, w, h, r, fill) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.stroke();
}
