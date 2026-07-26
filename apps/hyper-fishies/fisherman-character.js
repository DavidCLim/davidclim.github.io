// Fisherman character override: keeps top-view animation, removes the masked look.
(function () {
  function ensureFishermanAnim() {
    if (!state.player) return;
    if (!state.player.facing) state.player.facing = "down";
    if (!state.player.pose) state.player.pose = "idle";
    if (typeof state.walkFrame !== "number") state.walkFrame = 0;
  }

  function fisherman(x, y, scale) {
    ensureFishermanAnim();
    const facing = state.player.facing || "down";
    const walking = state.player.pose === "walk";
    const t = state.walkFrame || 0;
    const step = walking ? Math.sin(t) : Math.sin(t) * 0.15;
    const bob = walking ? Math.abs(Math.sin(t)) * 2.2 : Math.sin(t * 1.5) * 0.8;
    const side = facing === "left" ? -1 : 1;
    const sideView = facing === "left" || facing === "right";

    ctx.save();
    ctx.translate(x, y - bob);
    ctx.scale(scale, scale);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle = "rgba(0, 18, 28, .30)";
    ctx.beginPath();
    ctx.ellipse(0, 31 + bob, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    if (sideView) ctx.scale(side, 1);

    // Boots and legs.
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(-8, 11);
    ctx.lineTo(-19, 31 - step * 6);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 11);
    ctx.lineTo(19, 31 + step * 6);
    ctx.stroke();
    ctx.fillStyle = "#263747";
    ctx.beginPath();
    ctx.ellipse(-20, 32 - step * 6, 8, 5, -0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(20, 32 + step * 6, 8, 5, 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Yellow rain jacket body.
    ctx.fillStyle = "#f4c94d";
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.roundRect(-19, -15, 38, 35, 12);
    ctx.fill();
    ctx.stroke();

    // Blue vest and little tackle pockets.
    ctx.fillStyle = "#2f75a8";
    ctx.beginPath();
    ctx.moveTo(-17, -7);
    ctx.lineTo(0, 18);
    ctx.lineTo(17, -7);
    ctx.lineTo(14, 18);
    ctx.quadraticCurveTo(0, 28, -14, 18);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#ffe28a";
    ctx.beginPath();
    ctx.roundRect(-13, 2, 9, 8, 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.roundRect(4, 2, 9, 8, 2);
    ctx.fill();
    ctx.stroke();

    // Arms with walking swing.
    const armSwing = step * 5;
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-16, -4);
    ctx.lineTo(-34, 8 + armSwing);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(16, -4);
    ctx.lineTo(34, 8 - armSwing);
    ctx.stroke();
    ctx.fillStyle = "#f3c99b";
    ctx.beginPath();
    ctx.arc(-35, 9 + armSwing, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(35, 9 - armSwing, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // Small fishing rod strapped over the back.
    ctx.strokeStyle = "#6f451e";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-25, 18);
    ctx.quadraticCurveTo(0, -36, 38, -58);
    ctx.stroke();
    ctx.strokeStyle = "#e8d7a1";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-24, 17);
    ctx.quadraticCurveTo(2, -34, 38, -57);
    ctx.stroke();

    // Head and fisherman cap.
    ctx.fillStyle = "#f3c99b";
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.ellipse(0, -34, 22, 23, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#275f88";
    ctx.beginPath();
    ctx.ellipse(0, -52, 21, 10, 0, Math.PI, 0);
    ctx.lineTo(18, -41);
    ctx.quadraticCurveTo(0, -35, -18, -41);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    if (facing !== "up") {
      ctx.beginPath();
      ctx.ellipse(sideView ? 17 : 0, -45, 20, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    }

    if (facing !== "up") {
      ctx.fillStyle = "#10202c";
      const eyeShift = sideView ? 4 : 0;
      ctx.beginPath();
      ctx.arc(-7 + eyeShift, -35, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(7 + eyeShift, -35, 2.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#10202c";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(eyeShift, -27, 7, 0.12 * Math.PI, 0.88 * Math.PI);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#275f88";
      ctx.beginPath();
      ctx.ellipse(0, -43, 13, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tiny fish badge on the vest.
    ctx.fillStyle = "#ecfffb";
    ctx.strokeStyle = "#10202c";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(0, 8, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-6, 8);
    ctx.lineTo(-12, 4);
    ctx.lineTo(-12, 12);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }

  drawCirclePlayer = function drawAnimatedFishermanPlayer() {
    if (!state.player) return;
    fisherman(state.player.x, state.player.y, 0.68);
  };

  say("Player updated: same animations, more fisherman style.");
})();
