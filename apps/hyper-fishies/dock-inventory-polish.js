const dockInventoryPreviousDraw = draw;
const dockInventoryPreviousButtons = drawGameButtons;

function openInventory() {
  state.previousMode = state.mode === "inventory" ? "dock" : state.mode;
  state.mode = "inventory";
  say("Inventory opened. These are the fish in your bag.");
}

function closeInventory() {
  state.mode = state.previousMode && state.previousMode !== "inventory" ? state.previousMode : "dock";
  state.previousMode = "";
  say("Back to the dock. Keep fishing or sell your catch.");
}

draw = function drawWithInventoryScreen() {
  if (state.mode === "inventory") {
    buttonZones.length = 0;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawInventoryView();
    drawInventoryButtons();
    drawSavingIcon();
    return;
  }
  dockInventoryPreviousDraw();
};

drawGameButtons = function drawGameButtonsWithInventory() {
  dockInventoryPreviousButtons();
  if (state.mode === "dock" || state.mode === "fishing") {
    drawUiButton(482, 500, 108, 42, "BAG", openInventory);
  }
};

window.addEventListener("keydown", event => {
  const key = event.key.toLowerCase();
  if (state.mode === "inventory" && (key === "escape" || key === "b" || key === "i")) closeInventory();
  else if ((state.mode === "dock" || state.mode === "fishing") && (key === "b" || key === "i")) openInventory();
});

function drawInventoryButtons() {
  drawUiButton(24, 500, 110, 42, "BACK", closeInventory);
  if (state.bag.length) drawUiButton(766, 500, 150, 42, "SELL ALL", () => { state.mode = "sell"; sellFish(); closeInventory(); });
}

function drawInventoryView() {
  drawTopWater();
  rounded(74, 62, 812, 418, 28, "rgba(3, 30, 58, .86)", "#ecfffb", 5);
  rounded(102, 86, 756, 62, 18, "rgba(255, 227, 110, .96)", "#09283d", 4);
  ctx.fillStyle = "#09283d";
  ctx.font = "900 34px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText("FISH BAG", 480, 128);
  ctx.font = "900 17px Trebuchet MS";
  ctx.fillText(`${state.bag.length}/${state.bagLimit} FISH  |  COINS ${state.progress.coins}`, 480, 154);

  if (!state.bag.length) {
    ctx.fillStyle = "#ecfffb";
    ctx.font = "900 25px Trebuchet MS";
    ctx.fillText("YOUR BAG IS EMPTY", 480, 268);
    ctx.font = "800 18px Trebuchet MS";
    ctx.fillText("Go to the fishing dock and catch something first.", 480, 304);
    return;
  }

  const startX = 126;
  const startY = 184;
  const cardW = 168;
  const cardH = 118;
  state.bag.slice(0, 8).forEach((fish, index) => {
    const col = index % 4;
    const row = Math.floor(index / 4);
    const x = startX + col * 182;
    const y = startY + row * 132;
    rounded(x, y, cardW, cardH, 16, "rgba(236, 255, 251, .94)", rarityColors[fish.rarity] || "#ecfffb", 4);
    ctx.save();
    ctx.translate(x + cardW / 2, y + 42);
    drawFishDesign(fish.design || fish.name, 0, 0, 0.45, fish.color);
    ctx.restore();
    ctx.fillStyle = "#09283d";
    ctx.font = "900 14px Trebuchet MS";
    ctx.textAlign = "center";
    ctx.fillText(fish.name.toUpperCase(), x + cardW / 2, y + 82);
    ctx.fillStyle = rarityColors[fish.rarity] || "#0b72ad";
    ctx.fillText(fish.rarity.toUpperCase(), x + cardW / 2, y + 101);
    ctx.fillStyle = "#09283d";
    ctx.fillText(`${fish.value} COINS`, x + cardW / 2, y + 116);
  });

  if (state.bag.length > 8) {
    ctx.fillStyle = "#ffe36e";
    ctx.font = "900 16px Trebuchet MS";
    ctx.fillText(`+${state.bag.length - 8} MORE IN BAG`, 480, 456);
  }
}

drawIslandAndDock = function drawIslandAndDockCooler() {
  ctx.save();

  // Sand island glow under the dock.
  rounded(212, 72, 536, 424, 48, "#f5d993", "#7e6130", 7);
  ctx.fillStyle = "rgba(255,255,255,.16)";
  ctx.beginPath();
  ctx.ellipse(480, 286, 224, 160, -0.08, 0, Math.PI * 2);
  ctx.fill();

  // Main dock deck with richer planks.
  rounded(240, 96, 480, 366, 22, "#bf7332", "#5b310d", 8);
  const shine = ctx.createLinearGradient(242, 98, 718, 458);
  shine.addColorStop(0, "rgba(255, 225, 150, .38)");
  shine.addColorStop(.48, "rgba(255, 184, 93, .10)");
  shine.addColorStop(1, "rgba(55, 25, 7, .28)");
  ctx.fillStyle = shine;
  ctx.fillRect(250, 106, 460, 348);

  ctx.strokeStyle = "rgba(57, 29, 8, .72)";
  ctx.lineWidth = 5;
  for (let x = 266; x < 706; x += 38) {
    ctx.beginPath(); ctx.moveTo(x, 104); ctx.lineTo(x + 10, 456); ctx.stroke();
  }
  ctx.lineWidth = 4;
  for (let y = 132; y < 454; y += 52) {
    ctx.beginPath(); ctx.moveTo(248, y); ctx.lineTo(712, y - 6); ctx.stroke();
  }

  // Posts and rope rails.
  const posts = [[250,112],[360,104],[600,104],[710,112],[250,446],[360,456],[600,456],[710,446]];
  for (const [px, py] of posts) {
    rounded(px - 10, py - 18, 20, 48, 6, "#6c3a15", "#301706", 4);
  }
  ctx.strokeStyle = "#f0d088";
  ctx.lineWidth = 5;
  sketchLine([[250,116],[360,108],[600,108],[710,116]]);
  sketchLine([[250,448],[360,458],[600,458],[710,448]]);

  // Three little connected docks/areas.
  rounded(408, 40, 144, 116, 16, "#b86f31", "#5b310d", 7);
  rounded(452, 106, 56, 52, 8, "#b86f31", "#5b310d", 5);
  rounded(58, 90, 230, 118, 20, "#b86f31", "#5b310d", 7);
  rounded(58, 362, 230, 118, 20, "#b86f31", "#5b310d", 7);

  // Shop awnings and crates.
  drawMiniAwning(82, 96, "#3dd7ff", "#fff2a4");
  drawMiniAwning(82, 368, "#ff6a54", "#fff2a4");
  rounded(115, 162, 42, 28, 6, "#7b4a20", "#301706", 3);
  rounded(178, 164, 54, 30, 6, "#7b4a20", "#301706", 3);
  rounded(112, 434, 48, 28, 6, "#7b4a20", "#301706", 3);
  rounded(185, 432, 48, 30, 6, "#7b4a20", "#301706", 3);

  // Center marker.
  rounded(392, 232, 176, 102, 24, "rgba(255,238,140,.30)", "rgba(255,255,255,.7)", 3);
  ctx.strokeStyle = "rgba(255,255,255,.55)";
  ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(480, 283, 30, 0, Math.PI * 2); ctx.stroke();

  drawSign(88, 122, "ROD SHOP");
  drawSign(88, 390, "SELL FISH");
  drawSign(423, 70, "FISH");
  ctx.restore();
};

function drawMiniAwning(x, y, c1, c2) {
  rounded(x, y, 156, 34, 12, c1, "#301706", 4);
  ctx.fillStyle = c2;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(x + 10 + i * 30, y + 2);
    ctx.lineTo(x + 25 + i * 30, y + 32);
    ctx.lineTo(x + 40 + i * 30, y + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }
}

function drawSketchPirate(x, y) {
  ctx.save();
  ctx.translate(x, y);
  ctx.strokeStyle = "#111";
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.translate(-8, 2);
  ctx.rotate(-0.08);

  // Exact colored design pass from the reference: long coat, raised sword, right cape coin.
  ctx.fillStyle = "#2a1b13";
  ctx.beginPath(); ctx.moveTo(-56,-40); ctx.lineTo(-12,-20); ctx.lineTo(34,-42); ctx.lineTo(20,86); ctx.lineTo(-24,88); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f4d49d";
  ctx.beginPath(); ctx.moveTo(-18,-25); ctx.lineTo(10,-25); ctx.lineTo(13,76); ctx.lineTo(-13,78); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#8f2d28";
  ctx.beginPath(); ctx.moveTo(-52,-36); ctx.lineTo(-17,-18); ctx.lineTo(-10,82); ctx.lineTo(-34,78); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(32,-38); ctx.lineTo(11,-18); ctx.lineTo(18,82); ctx.lineTo(38,74); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.lineWidth = 3.5;
  for (let yy=-10; yy<44; yy+=16) { ctx.beginPath(); ctx.arc(-5,yy,2.4,0,Math.PI*2); ctx.stroke(); ctx.beginPath(); ctx.arc(7,yy,2.4,0,Math.PI*2); ctx.stroke(); }

  ctx.fillStyle = "#111";
  roundedLocal(-35,82,18,55,6,"#111"); roundedLocal(8,82,18,55,6,"#111"); roundedLocal(-46,130,36,16,6,"#111"); roundedLocal(2,130,36,16,6,"#111");

  ctx.fillStyle = "#8f2d28";
  ctx.beginPath(); ctx.moveTo(-48,-38); ctx.lineTo(-78,-86); ctx.lineTo(-90,-158); ctx.lineTo(-62,-162); ctx.lineTo(-39,-56); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f2c06b";
  ctx.beginPath(); ctx.roundRect(-98,-174,38,27,8); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#111"; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-92,-166); ctx.quadraticCurveTo(-35,-238,82,-270); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-84,-160); ctx.quadraticCurveTo(-22,-224,58,-250); ctx.stroke();
  sketchLine([[-111,-151],[-78,-184],[-51,-151]]);

  ctx.fillStyle = "#8f2d28";
  ctx.beginPath(); ctx.moveTo(29,-34); ctx.lineTo(72,-4); ctx.lineTo(58,35); ctx.lineTo(27,8); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f2c06b";
  sketchClosed([[63,28],[84,12],[79,36],[98,24],[86,50],[65,44]]);

  ctx.fillStyle = "#f2c06b";
  roundedLocal(-15,-58,26,22,5,"#f2c06b");
  ctx.beginPath(); ctx.roundRect(-48,-132,86,82,8); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = "#111"; ctx.lineWidth = 4;
  sketchLine([[-46,-106],[38,-90]]);
  ctx.fillStyle = "#111";
  ctx.beginPath(); ctx.ellipse(-23,-101,17,11,-0.15,0,Math.PI*2); ctx.fill();
  ctx.beginPath(); ctx.arc(13,-94,5.5,0,Math.PI*2); ctx.fill();
  ctx.lineWidth = 3; sketchLine([[-6,-96],[-13,-84],[0,-82]]);
  ctx.lineWidth = 5; sketchLine([[-31,-72],[-15,-62],[2,-72],[20,-64]]);
  ctx.lineWidth = 3; sketchLine([[-22,-78],[-6,-74],[10,-78]]);

  ctx.fillStyle = "#101010";
  ctx.beginPath(); ctx.moveTo(-68,-142); ctx.quadraticCurveTo(-10,-198,54,-144); ctx.lineTo(29,-126); ctx.quadraticCurveTo(-19,-150,-58,-122); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f7d46c"; ctx.beginPath(); ctx.arc(-15,-166,10,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#e9f1ff";
  ctx.beginPath(); ctx.moveTo(33,-137); ctx.quadraticCurveTo(69,-159,82,-132); ctx.quadraticCurveTo(62,-126,36,-119); ctx.closePath(); ctx.fill(); ctx.stroke(); sketchLine([[49,-135],[70,-144]]);

  ctx.fillStyle = "#ead1a0";
  ctx.beginPath(); ctx.moveTo(32,-58); ctx.quadraticCurveTo(92,-74,116,-22); ctx.quadraticCurveTo(86,-5,39,-17); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#f4d36c"; ctx.beginPath(); ctx.arc(78,-40,22,0,Math.PI*2); ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#111"; ctx.font = "900 22px Trebuchet MS"; ctx.textAlign = "center"; ctx.fillText("$",78,-33);

  ctx.save(); ctx.translate(-72,-44); ctx.rotate(-0.98); roundedLocal(-11,-28,22,70,6,"#d8c1a0"); sketchLine([[-11,-14],[11,-14]]); sketchLine([[-11,24],[11,24]]); ctx.restore();
  ctx.restore();
}
