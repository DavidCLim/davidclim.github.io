// Final cast meter label. Loaded last so only one label appears.
drawPowerMeter = function drawCastForLuckMeter() {
  if (!state.castPower) return;

  const x = 240;
  const y = 422;
  const w = 480;
  const h = 38;

  rounded(x, y, w, h, 19, "rgba(3, 32, 61, .88)", "#ecfffb", 4);

  const grad = ctx.createLinearGradient(x + 10, y, x + w - 10, y);
  grad.addColorStop(0, "#4db9ff");
  grad.addColorStop(.48, "#63ff93");
  grad.addColorStop(.76, "#ffe36e");
  grad.addColorStop(1, "#ff7a52");
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x + 10, y + 9, w - 20, h - 18, 10);
  ctx.fill();

  const px = x + 10 + state.castPower.power * (w - 20);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#05263d";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(px, y + h / 2, 17, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "900 17px Trebuchet MS";
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(3, 32, 61, .95)";
  ctx.fillStyle = "#ffe36e";
  ctx.strokeText("CAST FOR LUCK", x + w / 2, y - 12);
  ctx.fillText("CAST FOR LUCK", x + w / 2, y - 12);
  ctx.restore();
};
