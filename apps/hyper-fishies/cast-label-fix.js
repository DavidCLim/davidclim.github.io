// Final cast meter label. Loaded last so the wording stays consistent.
const previousDrawPowerMeter = drawPowerMeter;

drawPowerMeter = function drawCastForLuckMeter() {
  if (!state.castPower) return;
  previousDrawPowerMeter();

  const x = 240;
  const y = 422;
  const w = 480;

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
