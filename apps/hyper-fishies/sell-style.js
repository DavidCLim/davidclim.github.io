function sellShopWoodFill() {
  const fill = ctx.createLinearGradient(0, 70, 0, 520);
  fill.addColorStop(0, "#d89045");
  fill.addColorStop(0.52, "#9d5724");
  fill.addColorStop(1, "#5c2d13");
  return fill;
}

function drawSellShopView() {
  drawTopWater();

  rounded(58, 64, 844, 418, 24, sellShopWoodFill(), "#271307", 7);
  rounded(44, 48, 872, 86, 18, "#693418", "#180b05", 7);
  rounded(112, 382, 748, 92, 14, "#7d411b", "#2a1408", 6);

  ctx.save();
  ctx.strokeStyle = "rgba(52,25,8,.48)";
  ctx.lineWidth = 5;
  for (let x = 94; x < 884; x += 58) {
    ctx.beginPath();
    ctx.moveTo(x, 70);
    ctx.lineTo(x + 14, 474);
    ctx.stroke();
  }
  for (let y = 146; y < 462; y += 66) {
    ctx.beginPath();
    ctx.moveTo(70, y);
    ctx.lineTo(894, y - 8);
    ctx.stroke();
  }
  ctx.restore();

  drawShopBarrelsAndCoins();
  drawSketchPirate(318, 314);
  drawSketchSellSign(714, 112);
  drawSketchSpeech(492, 178);
  drawSketchChoice(582, 360, "YES");
  drawSketchChoice(714, 360, "NO");
  drawSketchInventory(324, 430, "sell inventory");
  drawSketchInventory(506, 430, "sell held item");

  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[458, 404], [486, 424], [514, 404]]);
  ctx.restore();
  drawRipples();
}

function drawShopBarrelsAndCoins() {
  ctx.save();
  rounded(86, 362, 76, 78, 20, "#70401f", "#211008", 5);
  rounded(806, 352, 78, 88, 20, "#70401f", "#211008", 5);
  ctx.fillStyle = "#ffd85f";
  ctx.strokeStyle = "#5c360d";
  ctx.lineWidth = 3;
  for (const coin of [[124,340],[146,352],[826,330],[850,348],[796,344]]) {
    ctx.beginPath();
    ctx.arc(coin[0], coin[1], 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  }
  ctx.restore();
}

function drawSketchSellSign(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#111";
  ctx.fillStyle = "#f4c15d";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(-82, -24);
  ctx.quadraticCurveTo(0, -48, 82, -24);
  ctx.lineTo(66, 34);
  ctx.quadraticCurveTo(0, 56, -66, 34);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.font = "900 50px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillStyle = "#111";
  ctx.fillText("SELL", 0, 18);
  ctx.beginPath();
  ctx.arc(106, 0, 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = "900 22px Trebuchet MS";
  ctx.fillText("$", 106, 8);
  ctx.restore();
}

function drawSketchSpeech(x, y) {
  const text = state.bag.length ? "Arrr... Do ya' have anything ya like to sell to aye?" : "B-LA-KA! Yer bag be empty. Tap NO to leave.";
  ctx.save();
  ctx.strokeStyle = "#111";
  ctx.fillStyle = "#ffe2a9";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(x, y + 10);
  ctx.lineTo(x + 340, y);
  ctx.lineTo(x + 350, y + 156);
  ctx.lineTo(x + 8, y + 162);
  ctx.lineTo(x - 42, y + 76);
  ctx.lineTo(x + 5, y + 64);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = "900 25px Trebuchet MS";
  ctx.textAlign = "left";
  ctx.fillText("B-LA-KA", x + 242, y + 33);
  ctx.font = "900 22px Trebuchet MS";
  wrapText(text, x + 34, y + 66, 230, 29);
  ctx.restore();
}

function drawSketchChoice(x, y, text) {
  ctx.save();
  rounded(x, y, 84, 46, 8, text === "YES" ? "#8ff06d" : "#f6d06f", "#111", 4);
  ctx.fillStyle = "#111";
  ctx.font = "900 23px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(text, x + 42, y + 31);
  ctx.restore();
}

function drawSketchInventory(x, y, text) {
  ctx.save();
  rounded(x, y, 130, 56, 8, "#f5c978", "#111", 4);
  ctx.fillStyle = "#111";
  ctx.font = "900 15px Trebuchet MS";
  ctx.textAlign = "center";
  const parts = text.split(" ");
  ctx.fillText(parts[0], x + 65, y + 23);
  ctx.fillText(parts.slice(1).join(" "), x + 65, y + 42);
  ctx.restore();
}

function drawSketchPirate(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // One connected body silhouette so the pirate reads as a single person.
  ctx.fillStyle = "#3b2414";
  ctx.beginPath();
  ctx.moveTo(-48, -42);
  ctx.bezierCurveTo(-72, -36, -98, -20, -116, 6);
  ctx.bezierCurveTo(-126, 22, -112, 40, -94, 34);
  ctx.bezierCurveTo(-78, 28, -62, 18, -49, 8);
  ctx.lineTo(-42, 82);
  ctx.bezierCurveTo(-58, 102, -64, 122, -50, 133);
  ctx.bezierCurveTo(-34, 144, -18, 126, -10, 107);
  ctx.bezierCurveTo(-3, 125, 15, 144, 32, 132);
  ctx.bezierCurveTo(48, 120, 39, 99, 25, 82);
  ctx.lineTo(31, 8);
  ctx.bezierCurveTo(49, 25, 70, 38, 90, 38);
  ctx.bezierCurveTo(111, 37, 120, 16, 106, 2);
  ctx.bezierCurveTo(84, -20, 58, -36, 34, -42);
  ctx.bezierCurveTo(15, -50, -25, -50, -48, -42);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Coat collar and shirt are drawn inside the same body.
  ctx.fillStyle = "#c84a2f";
  sketchClosed([[-28,-39],[-7,-24],[16,-39],[20,28],[4,54],[-18,31]]);
  ctx.fillStyle = "#f7d6a0";
  sketchClosed([[-14,-38],[7,-38],[5,36],[-12,36]]);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 3.5;
  sketchLine([[-43,-33],[-18,3],[-12,80]]);
  sketchLine([[31,-33],[13,3],[8,80]]);
  for (let yy = -18; yy < 30; yy += 16) {
    ctx.beginPath();
    ctx.arc(-5, yy, 2.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(7, yy, 2.3, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Connected head and neck.
  ctx.fillStyle = "#f2c06b";
  sketchClosed([[-14,-54],[7,-54],[9,-42],[-17,-42]]);
  ctx.beginPath();
  ctx.roundRect(-52, -128, 84, 78, 10);
  ctx.fill();
  ctx.stroke();

  // Face.
  ctx.fillStyle = "#111";
  sketchLine([[-52,-103],[32,-88]]);
  ctx.beginPath();
  ctx.ellipse(-29, -101, 17, 11, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(7, -94, 5, 0, Math.PI * 2);
  ctx.stroke();
  sketchLine([[-12,-98],[-18,-90],[-8,-89]]);
  sketchLine([[-36,-76],[-20,-66],[-1,-74]]);
  sketchLine([[-34,-68],[-4,-68]]);

  // Pirate hat attached to the head.
  ctx.fillStyle = "#191919";
  ctx.beginPath();
  ctx.moveTo(-66, -141);
  ctx.quadraticCurveTo(-10, -198, 52, -143);
  ctx.lineTo(27, -127);
  ctx.quadraticCurveTo(-18, -147, -57, -122);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7d46c";
  ctx.beginPath();
  ctx.arc(-15, -165, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  sketchLine([[28,-138],[64,-154],[78,-134]]);

  // Sword arm, drawn as one connected raised sleeve and hand.
  ctx.fillStyle = "#3b2414";
  sketchClosed([[-70,-26],[-91,-82],[-102,-155],[-76,-165],[-53,-61],[-39,-39]]);
  ctx.fillStyle = "#f2c06b";
  sketchClosed([[-104,-164],[-75,-181],[-55,-160],[-84,-148]]);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  sketchLine([[-96,-176],[-38,-238],[70,-278]]);
  sketchLine([[-90,-172],[44,-250]]);

  // Other connected hand.
  ctx.fillStyle = "#f2c06b";
  sketchClosed([[86,18],[104,4],[100,30],[117,18],[108,44],[88,39]]);

  // Coin medallion/cape detail.
  ctx.fillStyle = "#f4d36c";
  ctx.beginPath();
  ctx.arc(82, -42, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = "900 25px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("$", 82, -34);

  // Boots.
  ctx.fillStyle = "#1c120b";
  sketchClosed([[-46,116],[-15,112],[-7,128],[-35,139],[-59,132]]);
  sketchClosed([[6,113],[36,116],[51,130],[25,139],[0,128]]);
  ctx.restore();
}

function sketchClosed(points) {
  ctx.beginPath();
  ctx.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}
