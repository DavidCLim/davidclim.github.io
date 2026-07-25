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

  ctx.fillStyle = "#3b2414";
  sketchClosed([[-72,-34],[-30,8],[-24,104],[12,104],[20,8],[78,-34],[46,42],[58,112],[18,124],[-5,108],[-34,124],[-64,110],[-48,42]]);
  ctx.fillStyle = "#c84a2f";
  sketchClosed([[-30,8],[-10,-42],[22,-42],[20,8],[8,36],[-20,36]]);
  ctx.fillStyle = "#f2c06b";
  sketchClosed([[-55,-122],[-48,-66],[28,-66],[34,-122],[12,-146],[-34,-146]]);

  ctx.fillStyle = "#111";
  sketchLine([[-54,-104],[30,-86]]);
  ctx.beginPath();
  ctx.ellipse(-28, -100, 17, 11, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(6, -94, 5, 0, Math.PI * 2);
  ctx.stroke();
  sketchLine([[-36,-76],[-20,-66],[-2,-74]]);
  sketchLine([[-34,-68],[-4,-68]]);
  sketchLine([[-10,-98],[-16,-90],[-7,-89]]);

  ctx.fillStyle = "#191919";
  ctx.beginPath();
  ctx.moveTo(-66, -140);
  ctx.quadraticCurveTo(-8, -196, 50, -142);
  ctx.lineTo(25, -126);
  ctx.quadraticCurveTo(-18, -146, -56, -122);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#f7d46c";
  ctx.beginPath();
  ctx.arc(-16, -164, 10, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  sketchLine([[26,-138],[64,-154],[78,-134]]);

  ctx.fillStyle = "#f2c06b";
  sketchClosed([[-76,-32],[-118,-8],[-112,28],[-82,14]]);
  sketchClosed([[68,-30],[98,-6],[88,32],[64,10]]);
  sketchLine([[88,32],[106,18],[100,42],[118,28],[106,52]]);

  ctx.strokeStyle = "#111";
  sketchLine([[-56,-38],[-92,-98],[-104,-168]]);
  sketchLine([[-104,-168],[-72,-184],[-52,-162]]);
  sketchLine([[-96,-178],[-38,-238],[70,-278]]);
  sketchLine([[-90,-174],[44,-250]]);

  ctx.fillStyle = "#f4d36c";
  ctx.beginPath();
  ctx.arc(82, -42, 27, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = "#111";
  ctx.font = "900 25px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("$", 82, -34);

  ctx.strokeStyle = "#111";
  ctx.lineWidth = 4;
  for (let yy = -28; yy < 24; yy += 17) {
    ctx.beginPath();
    ctx.arc(-8, yy, 2, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(8, yy, 2, 0, Math.PI * 2);
    ctx.stroke();
  }
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
