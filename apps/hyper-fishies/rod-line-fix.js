// Fix the fishing rod art and make the bobber line connect to the rod tip.
(function () {
  const ROD_TIP = { x: 310, y: 160 };
  const ROD_HANDLE = { x: 164, y: 274 };

  function drawBetterRod() {
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // Dark outline behind the whole rod.
    ctx.strokeStyle = "#142052";
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.moveTo(102, 340);
    ctx.lineTo(160, 276);
    ctx.quadraticCurveTo(226, 204, ROD_TIP.x, ROD_TIP.y);
    ctx.stroke();

    // Cream main rod like the reference.
    const rodGradient = ctx.createLinearGradient(102, 340, ROD_TIP.x, ROD_TIP.y);
    rodGradient.addColorStop(0, "#fff2bf");
    rodGradient.addColorStop(0.45, "#fff7d6");
    rodGradient.addColorStop(1, "#f5edc5");
    ctx.strokeStyle = rodGradient;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(102, 340);
    ctx.lineTo(160, 276);
    ctx.quadraticCurveTo(226, 204, ROD_TIP.x, ROD_TIP.y);
    ctx.stroke();

    // Blue handle and grip pieces.
    ctx.strokeStyle = "#142052";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(102, 340);
    ctx.lineTo(138, 300);
    ctx.stroke();
    ctx.strokeStyle = "#315cbd";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(102, 340);
    ctx.lineTo(138, 300);
    ctx.stroke();

    rounded(132, 294, 24, 22, 6, "#c7f7ff", "#142052", 4);
    rounded(150, 270, 50, 22, 8, "#315cbd", "#142052", 4);

    // Reel.
    ctx.fillStyle = "#bdf4ff";
    ctx.strokeStyle = "#142052";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(190, 302, 27, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#315cbd";
    ctx.beginPath();
    ctx.arc(190, 302, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(212, 293);
    ctx.quadraticCurveTo(230, 282, 226, 306);
    ctx.stroke();

    // Line guides along the rod. These are rings only, not fishing line.
    const guides = [
      { x: 214, y: 220, r: 9, a: -0.78 },
      { x: 248, y: 195, r: 7, a: -0.78 },
      { x: 278, y: 174, r: 5.5, a: -0.78 },
      { x: 305, y: 158, r: 4.5, a: -0.78 }
    ];
    for (const guide of guides) {
      ctx.save();
      ctx.translate(guide.x, guide.y);
      ctx.rotate(guide.a);
      rounded(-6, -11, 12, 16, 3, "#315cbd", "#142052", 3);
      ctx.strokeStyle = "#142052";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(2, 10, guide.r, Math.PI * 0.2, Math.PI * 1.75);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawFishingHero() {
    const t = state.walkFrame || 0;
    const bob = Math.sin(t * 1.8) * 1.1;
    ctx.save();
    ctx.translate(142, 285 - bob);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    ctx.fillStyle = "rgba(0,22,34,.28)";
    ctx.beginPath();
    ctx.ellipse(0, 44 + bob, 25, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-7, 16);
    ctx.lineTo(-18, 42);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(8, 16);
    ctx.lineTo(20, 42);
    ctx.stroke();

    ctx.fillStyle = "#101b25";
    ctx.beginPath();
    ctx.roundRect(-18, -14, 36, 38, 14);
    ctx.fill();
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(-14, -4);
    ctx.lineTo(-31, 10);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, -3);
    ctx.lineTo(30, -8);
    ctx.stroke();

    ctx.fillStyle = "#f4fbff";
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.ellipse(0, -34, 21, 23, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#071923";
    ctx.beginPath();
    ctx.ellipse(-7, -35, 3.2, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(7, -35, 3.2, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#f4fbff";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-14, -54);
    ctx.quadraticCurveTo(-25, -67, -38, -70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, -54);
    ctx.quadraticCurveTo(25, -67, 38, -70);
    ctx.stroke();
    ctx.strokeStyle = "#071923";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-14, -54);
    ctx.quadraticCurveTo(-25, -67, -38, -70);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(14, -54);
    ctx.quadraticCurveTo(25, -67, 38, -70);
    ctx.stroke();

    ctx.restore();
  }

  drawFisherCircle = function drawConnectedRodFisher() {
    drawFishingHero();
    drawBetterRod();
  };

  drawFishingLine = function drawConnectedFishingLine() {
    if (!state.cast) return;
    const c = state.cast;

    ctx.strokeStyle = "rgba(236,255,251,.82)";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(ROD_TIP.x, ROD_TIP.y);
    ctx.quadraticCurveTo((ROD_TIP.x + c.hookX) / 2, Math.min(ROD_TIP.y, c.hookY) - 18, c.hookX, c.hookY);
    ctx.stroke();

    ctx.fillStyle = c.phase === "bite" ? "#ffe36e" : "#ffffff";
    ctx.strokeStyle = "#05263d";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(c.hookX, c.hookY, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    if (c.phase === "bite") {
      ctx.strokeStyle = rarityColors[c.fish.rarity] || "#ecfffb";
      ctx.lineWidth = 8;
      ctx.beginPath();
      ctx.arc(c.hookX, c.hookY, 28, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * clamp(c.reel, 0, 1));
      ctx.stroke();
    }
  };

  say("Rod fixed: one line, connected bobber, cooler rod art.");
})();
