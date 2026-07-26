function drawSketchPirate(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // Colored version of the user's exact pirate design: small coat body, raised sword,
  // square face, eye patch, right-side cape/coin, feather, and little boots.
  ctx.save();
  ctx.translate(-8, 2);
  ctx.rotate(-0.08);

  // Long skinny coat and shirt from the drawing.
  ctx.fillStyle = "#2a1b13";
  ctx.beginPath();
  ctx.moveTo(-56, -40);
  ctx.lineTo(-12, -20);
  ctx.lineTo(34, -42);
  ctx.lineTo(20, 86);
  ctx.lineTo(-24, 88);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#f4d49d";
  ctx.beginPath();
  ctx.moveTo(-18, -25);
  ctx.lineTo(10, -25);
  ctx.lineTo(13, 76);
  ctx.lineTo(-13, 78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = "#8f2d28";
  ctx.beginPath();
  ctx.moveTo(-52, -36);
  ctx.lineTo(-17, -18);
  ctx.lineTo(-10, 82);
  ctx.lineTo(-34, 78);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(32, -38);
  ctx.lineTo(11, -18);
  ctx.lineTo(18, 82);
  ctx.lineTo(38, 74);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3.5;
  for (let yy = -10; yy < 44; yy += 16) {
    ctx.beginPath(); ctx.arc(-5, yy, 2.4, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(7, yy, 2.4, 0, Math.PI * 2); ctx.stroke();
  }

  // Boots: one side boot/peg feel, one little boot like the reference.
  ctx.fillStyle = "#111";
  roundedLocal(-35, 82, 18, 55, 6, "#111");
  roundedLocal(8, 82, 18, 55, 6, "#111");
  roundedLocal(-46, 130, 36, 16, 6, "#111");
  roundedLocal(2, 130, 36, 16, 6, "#111");

  // Left sleeve raised with hand gripping the sword.
  ctx.fillStyle = "#8f2d28";
  ctx.beginPath();
  ctx.moveTo(-48, -38);
  ctx.lineTo(-78, -86);
  ctx.lineTo(-90, -158);
  ctx.lineTo(-62, -162);
  ctx.lineTo(-39, -56);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f2c06b";
  ctx.beginPath();
  ctx.roundRect(-98, -174, 38, 27, 8);
  ctx.fill();
  ctx.stroke();

  // Sword curved upward just like the drawing.
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(-92, -166);
  ctx.quadraticCurveTo(-35, -238, 82, -270);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(-84, -160);
  ctx.quadraticCurveTo(-22, -224, 58, -250);
  ctx.stroke();
  sketchLine([[-111, -151], [-78, -184], [-51, -151]]);

  // Right short sleeve and claw/fingers beside the body.
  ctx.fillStyle = "#8f2d28";
  ctx.beginPath();
  ctx.moveTo(29, -34);
  ctx.lineTo(72, -4);
  ctx.lineTo(58, 35);
  ctx.lineTo(27, 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f2c06b";
  sketchClosed([[63, 28], [84, 12], [79, 36], [98, 24], [86, 50], [65, 44]]);

  // Neck and square head.
  ctx.fillStyle = "#f2c06b";
  roundedLocal(-15, -58, 26, 22, 5, "#f2c06b");
  ctx.beginPath();
  ctx.roundRect(-48, -132, 86, 82, 8);
  ctx.fill();
  ctx.stroke();

  // Face: aligned eyepatch strap, one visible eye, nose, moustache/mouth.
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[-46, -106], [38, -90]]);
  ctx.fillStyle = "#111";
  ctx.beginPath();
  ctx.ellipse(-23, -101, 17, 11, -0.15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(13, -94, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3;
  sketchLine([[-6, -96], [-13, -84], [0, -82]]);
  ctx.lineWidth = 5;
  sketchLine([[-31, -72], [-15, -62], [2, -72], [20, -64]]);
  ctx.lineWidth = 3;
  sketchLine([[-22, -78], [-6, -74], [10, -78]]);

  // Tricorn/bandana hat and little feather to the right.
  ctx.fillStyle = "#101010";
  ctx.beginPath();
  ctx.moveTo(-68, -142);
  ctx.quadraticCurveTo(-10, -198, 54, -144);
  ctx.lineTo(29, -126);
  ctx.quadraticCurveTo(-19, -150, -58, -122);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7d46c";
  ctx.beginPath();
  ctx.arc(-15, -166, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#e9f1ff";
  ctx.beginPath();
  ctx.moveTo(33, -137);
  ctx.quadraticCurveTo(69, -159, 82, -132);
  ctx.quadraticCurveTo(62, -126, 36, -119);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  sketchLine([[49, -135], [70, -144]]);

  // Big cape/shoulder piece on the right with the coin symbol, as in the sketch.
  ctx.fillStyle = "#ead1a0";
  ctx.beginPath();
  ctx.moveTo(32, -58);
  ctx.quadraticCurveTo(92, -74, 116, -22);
  ctx.quadraticCurveTo(86, -5, 39, -17);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f4d36c";
  ctx.beginPath();
  ctx.arc(78, -40, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = "900 22px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("$", 78, -33);

  // Rolled tube/gun-like shape behind the left shoulder from the drawing.
  ctx.save();
  ctx.translate(-72, -44);
  ctx.rotate(-0.98);
  roundedLocal(-11, -28, 22, 70, 6, "#d8c1a0");
  ctx.strokeStyle = "#111";
  sketchLine([[-11, -14], [11, -14]]);
  sketchLine([[-11, 24], [11, 24]]);
  ctx.restore();

  ctx.restore();
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

  ctx.fillStyle = "#264f7c";
  ctx.save();
  ctx.translate(-48, 18);
  ctx.rotate(-1.18);
  roundedLocal(-12, -6, 34, 112, 8, "#264f7c");
  ctx.restore();
  ctx.fillStyle = "#f2c06b";
  roundedLocal(-132, -82, 38, 26, 8, "#f2c06b");

  ctx.fillStyle = "#264f7c";
  ctx.save();
  ctx.translate(48, 18);
  ctx.rotate(1.18);
  roundedLocal(-22, -6, 34, 112, 8, "#264f7c");
  ctx.restore();
  ctx.fillStyle = "#f2c06b";
  roundedLocal(95, -82, 38, 26, 8, "#f2c06b");

  ctx.fillStyle = "#334159";
  roundedLocal(-46, 112, 38, 70, 7, "#334159");
  roundedLocal(8, 112, 38, 70, 7, "#334159");
  ctx.fillStyle = "#111";
  roundedLocal(-58, 174, 54, 20, 7, "#111");
  roundedLocal(4, 174, 54, 20, 7, "#111");

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
