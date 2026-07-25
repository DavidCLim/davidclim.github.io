function drawSketchPirate(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Clean single-pose pirate: one square head, matched eyes/mouth, arms connected to shoulders.
  ctx.fillStyle = "#21130c";
  roundedLocal(-52, -34, 104, 114, 10, "#21130c");
  ctx.fillStyle = "#b8332d";
  roundedLocal(-24, -28, 48, 96, 7, "#b8332d");
  ctx.fillStyle = "#f7d8a2";
  roundedLocal(-9, -30, 18, 90, 4, "#f7d8a2");

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[-49, -24], [-23, 10], [-18, 70]]);
  sketchLine([[49, -24], [23, 10], [18, 70]]);
  for (let yy = -10; yy <= 34; yy += 15) {
    ctx.beginPath(); ctx.arc(-5, yy, 2.4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(7, yy, 2.4, 0, Math.PI * 2); ctx.stroke();
  }

  // Attached blocky legs and boots.
  ctx.fillStyle = "#21130c";
  roundedLocal(-43, 70, 34, 68, 7, "#21130c");
  roundedLocal(9, 70, 34, 68, 7, "#21130c");
  ctx.fillStyle = "#0d0a07";
  roundedLocal(-61, 130, 55, 20, 7, "#0d0a07");
  roundedLocal(3, 130, 55, 20, 7, "#0d0a07");

  // Left shoulder to raised sword arm. The sleeve and hand sit on one line.
  ctx.fillStyle = "#21130c";
  ctx.save();
  ctx.translate(-44, -22);
  ctx.rotate(-0.48);
  roundedLocal(-22, -98, 34, 104, 8, "#21130c");
  ctx.fillStyle = "#f2c06b";
  roundedLocal(-25, -122, 40, 28, 9, "#f2c06b");
  ctx.restore();

  // Right arm bends down/out like the reference, with hand beside body.
  ctx.fillStyle = "#21130c";
  ctx.save();
  ctx.translate(48, -20);
  ctx.rotate(0.36);
  roundedLocal(-6, 0, 34, 88, 8, "#21130c");
  ctx.restore();
  ctx.fillStyle = "#f2c06b";
  sketchClosed([[83, 27], [101, 12], [100, 36], [116, 27], [105, 52], [86, 47]]);

  // Sword is lined up with the raised hand.
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[-103, -158], [-42, -238], [72, -279]]);
  sketchLine([[-96, -153], [45, -250]]);
  sketchLine([[-118, -143], [-78, -180], [-52, -151]]);

  // Neck and head.
  ctx.fillStyle = "#f2c06b";
  roundedLocal(-14, -56, 28, 24, 5, "#f2c06b");
  roundedLocal(-48, -132, 88, 82, 9, "#f2c06b");

  // Face: one eyepatch, one visible eye, mouth centered under nose.
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[-45, -104], [38, -91]]);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(-21, -100, 17, 11, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(15, -94, 5.5, 0, Math.PI * 2);
  ctx.fill();
  sketchLine([[-4, -94], [-11, -84], [1, -83]]);
  ctx.lineWidth = 5;
  sketchLine([[-28, -70], [-13, -61], [6, -69], [20, -63]]);
  ctx.lineWidth = 3;
  sketchLine([[-21, -76], [-6, -73], [10, -76]]);

  // Hat and feather/coin details match the reference silhouette.
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.moveTo(-66, -142);
  ctx.quadraticCurveTo(-10, -198, 55, -144);
  ctx.lineTo(31, -126);
  ctx.quadraticCurveTo(-18, -149, -58, -123);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7d46c";
  ctx.beginPath();
  ctx.arc(-14, -166, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  sketchLine([[30, -138], [68, -154], [80, -134]]);

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

  // Corrected rod seller pose: both arms hold the big wavy rod in front/above him.
  ctx.fillStyle = "#f2c06b";
  roundedLocal(-40, -88, 80, 78, 9, "#f2c06b");
  roundedLocal(-12, -12, 24, 20, 4, "#f2c06b");
  ctx.fillStyle = "#264f7c";
  roundedLocal(-52, 8, 104, 112, 9, "#264f7c");
  ctx.fillStyle = "#eaf7ff";
  roundedLocal(-17, 12, 34, 102, 5, "#eaf7ff");

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[-50, 18], [-18, 46], [-14, 116]]);
  sketchLine([[50, 18], [18, 46], [14, 116]]);

  // Left arm reaches left to grip the rod, not backwards.
  ctx.fillStyle = "#264f7c";
  ctx.save();
  ctx.translate(-48, 18);
  ctx.rotate(-1.18);
  roundedLocal(-12, -6, 34, 112, 8, "#264f7c");
  ctx.restore();
  ctx.fillStyle = "#f2c06b";
  roundedLocal(-132, -82, 38, 26, 8, "#f2c06b");

  // Right arm reaches right to grip the rod.
  ctx.fillStyle = "#264f7c";
  ctx.save();
  ctx.translate(48, 18);
  ctx.rotate(1.18);
  roundedLocal(-22, -6, 34, 112, 8, "#264f7c");
  ctx.restore();
  ctx.fillStyle = "#f2c06b";
  roundedLocal(95, -82, 38, 26, 8, "#f2c06b");

  // Legs and boots.
  ctx.fillStyle = "#334159";
  roundedLocal(-46, 112, 38, 70, 7, "#334159");
  roundedLocal(8, 112, 38, 70, 7, "#334159");
  ctx.fillStyle = "#111";
  roundedLocal(-58, 174, 54, 20, 7, "#111");
  roundedLocal(4, 174, 54, 20, 7, "#111");

  // Face is centered and readable.
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.arc(-15, -56, 5, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(17, -56, 5, 0, Math.PI * 2); ctx.fill();
  sketchLine([[-16, -34], [2, -24], [24, -36]]);
  ctx.fillStyle = "#2a160d";
  ctx.beginPath();
  ctx.moveTo(-56, -92);
  ctx.quadraticCurveTo(0, -128, 58, -92);
  ctx.lineTo(43, -78);
  ctx.quadraticCurveTo(0, -94, -43, -78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Wavy shop rod goes left-to-right across the gripped hands.
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.moveTo(-166, -80);
  ctx.bezierCurveTo(-105, -130, -62, -75, -12, -100);
  ctx.bezierCurveTo(40, -126, 94, -72, 170, -112);
  ctx.stroke();
  ctx.strokeStyle = "#f4d36c";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(-164, -82);
  ctx.bezierCurveTo(-105, -124, -62, -79, -12, -98);
  ctx.bezierCurveTo(40, -120, 94, -76, 168, -110);
  ctx.stroke();
  ctx.fillStyle = "#111";
  for (let i = 0; i < 7; i++) {
    ctx.beginPath();
    ctx.arc(-120 + i * 40, -91 + Math.sin(i) * 12, 3.5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
