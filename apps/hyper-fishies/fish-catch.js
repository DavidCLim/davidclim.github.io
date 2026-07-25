fishTypes.splice(0, fishTypes.length,
  { name: "Clownfish", rarity: "Common", value: 22, color: "#ff9b48", design: "clown" },
  { name: "Angel Fish", rarity: "Common", value: 28, color: "#ffe07a", design: "angel" },
  { name: "Starfish", rarity: "Unusual", value: 45, color: "#ffd86b", design: "star" },
  { name: "Squid", rarity: "Unusual", value: 60, color: "#c68dff", design: "squid" },
  { name: "Sailfish", rarity: "Rare", value: 95, color: "#9edbff", design: "sail" },
  { name: "Angler Fish", rarity: "Rare", value: 130, color: "#72e48a", design: "angler" },
  { name: "Swordfish", rarity: "Epic", value: 190, color: "#b8d7ff", design: "sword" },
  { name: "Bone Fish", rarity: "Epic", value: 230, color: "#e9f3e8", design: "bone" },
  { name: "Starborn Shark", rarity: "Legendary", value: 430, color: "#8de7ff", design: "shark" },
  { name: "Mythical Whale", rarity: "Legendary", value: 620, color: "#d9fbff", design: "whale" }
);

const catchBaseUpdate = update;
const catchBaseDraw = draw;
const catchBaseCatchFish = catchFish;

catchFish = function catchFishWithReveal(fish) {
  const value = Math.round(fish.value * (1 + currentRod().luck * 0.1) * rand(0.9, 1.28));
  state.bag.push({ ...fish, value });
  state.latest = `${fish.rarity} ${fish.name}`;
  state.progress.bestFish = state.latest;
  state.progress.caught[fish.name] = (state.progress.caught[fish.name] || 0) + 1;
  state.catchReveal = { fish: { ...fish, value }, life: 2.8, age: 0 };
  burst(state.cast ? state.cast.hookX : 500, state.cast ? state.cast.hookY : 330, rarityColors[fish.rarity], 28);
  state.cast = null;
  saveGame();
  say(`Caught ${fish.rarity} ${fish.name}! It jumped out of the water.`);
};

update = function updateWithCatchReveal(dt) {
  catchBaseUpdate(dt);
  if (state.catchReveal) {
    state.catchReveal.life -= dt;
    state.catchReveal.age += dt;
    if (state.catchReveal.life <= 0) state.catchReveal = null;
  }
};

draw = function drawWithCatchReveal() {
  catchBaseDraw();
  drawCaughtFishReveal();
};

drawFishSilhouettes = function drawDesignedFishSilhouettes() {
  const designs = ["clown", "angel", "star", "squid", "sail", "angler", "sword", "bone", "shark"];
  for (let i = 0; i < designs.length; i++) {
    const x = 320 + i * 72 + Math.sin(performance.now() / 650 + i) * 16;
    const y = 412 + (i % 3) * 34 + Math.cos(performance.now() / 760 + i) * 5;
    ctx.save();
    ctx.globalAlpha = 0.36;
    drawFishDesign(designs[i], x, y, 0.42 + (i % 3) * 0.06, "rgba(3,35,70,.72)");
    ctx.restore();
  }
};

function drawCaughtFishReveal() {
  if (!state.catchReveal) return;
  const reveal = state.catchReveal;
  const t = reveal.age;
  const pop = Math.min(1, t / 0.35);
  const bob = Math.sin(t * 9) * 8;
  ctx.save();
  ctx.globalAlpha = Math.min(1, reveal.life / 0.45);
  rounded(238, 78, 484, 360, 28, "rgba(3,30,58,.82)", rarityColors[reveal.fish.rarity] || "#ecfffb", 5);
  ctx.fillStyle = rarityColors[reveal.fish.rarity] || "#ecfffb";
  ctx.font = "900 24px Trebuchet MS";
  ctx.textAlign = "center";
  ctx.fillText(`${reveal.fish.rarity.toUpperCase()} CATCH!`, 480, 120);
  ctx.fillStyle = "#ecfffb";
  ctx.font = "900 34px Trebuchet MS";
  ctx.fillText(reveal.fish.name.toUpperCase(), 480, 390);
  ctx.fillStyle = "#ffe36e";
  ctx.font = "900 22px Trebuchet MS";
  ctx.fillText(`${reveal.fish.value} COINS`, 480, 420);
  ctx.translate(480, 250 + bob);
  ctx.scale(pop, pop);
  drawFishDesign(reveal.fish.design || reveal.fish.name, 0, 0, 1.42, reveal.fish.color);
  ctx.restore();
}

function drawFishDesign(design, x, y, scale, color) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineWidth = 5;
  ctx.strokeStyle = "#09283d";
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  const key = String(design || "").toLowerCase();
  if (key.includes("clown")) drawClownfish(color);
  else if (key.includes("angel")) drawAngelfish(color);
  else if (key.includes("star")) drawStarfish(color);
  else if (key.includes("squid")) drawSquid(color);
  else if (key.includes("sail")) drawSailfish(color);
  else if (key.includes("angler")) drawAnglerFish(color);
  else if (key.includes("sword")) drawSwordfish(color);
  else if (key.includes("bone")) drawBoneFish(color);
  else if (key.includes("shark")) drawShark(color);
  else if (key.includes("whale")) drawWhale(color);
  else drawClownfish(color);
  ctx.restore();
}

function fishBody(fill) {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.ellipse(0, 0, 54, 28, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(48, 0); ctx.lineTo(88, -28); ctx.lineTo(78, 0); ctx.lineTo(88, 28); ctx.closePath();
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = "#09283d";
  ctx.beginPath(); ctx.arc(-28, -7, 5, 0, Math.PI * 2); ctx.fill();
}
function drawClownfish(color) { fishBody(color || "#ff9b48"); ctx.fillStyle = "#ecfffb"; for (const x of [-13, 18]) { ctx.beginPath(); ctx.ellipse(x, 0, 8, 27, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); } }
function drawAngelfish(color) { ctx.fillStyle = color || "#ffe07a"; ctx.beginPath(); ctx.moveTo(-55,0); ctx.lineTo(0,-58); ctx.lineTo(48,0); ctx.lineTo(0,58); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(38,0); ctx.lineTo(82,-30); ctx.lineTo(74,0); ctx.lineTo(82,30); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle="#09283d"; ctx.beginPath(); ctx.arc(-18,-8,5,0,Math.PI*2); ctx.fill(); }
function drawStarfish(color) { ctx.fillStyle = color || "#ffd86b"; ctx.beginPath(); for (let i=0;i<10;i++){ const a=-Math.PI/2+i*Math.PI/5; const r=i%2?24:58; const px=Math.cos(a)*r, py=Math.sin(a)*r; if(i===0)ctx.moveTo(px,py); else ctx.lineTo(px,py);} ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle="#fff3a2"; ctx.beginPath(); ctx.arc(0,0,18,0,Math.PI*2); ctx.fill(); }
function drawSquid(color) { ctx.fillStyle = color || "#c68dff"; ctx.beginPath(); ctx.moveTo(0,-70); ctx.quadraticCurveTo(38,-28,22,20); ctx.quadraticCurveTo(0,42,-22,20); ctx.quadraticCurveTo(-38,-28,0,-70); ctx.fill(); ctx.stroke(); for(let i=-2;i<=2;i++){ ctx.beginPath(); ctx.moveTo(i*10,18); ctx.quadraticCurveTo(i*16,58, i*8,86); ctx.stroke(); } ctx.fillStyle="#09283d"; ctx.beginPath(); ctx.arc(-9,-12,5,0,Math.PI*2); ctx.arc(9,-12,5,0,Math.PI*2); ctx.fill(); }
function drawSailfish(color) { ctx.fillStyle = color || "#9edbff"; ctx.beginPath(); ctx.moveTo(-62,6); ctx.quadraticCurveTo(-10,-26,55,-10); ctx.lineTo(114,-6); ctx.lineTo(56,8); ctx.quadraticCurveTo(-8,30,-62,6); ctx.fill(); ctx.stroke(); ctx.fillStyle="#5ab9ff"; ctx.beginPath(); ctx.moveTo(-24,-22); ctx.lineTo(22,-76); ctx.lineTo(40,-12); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle="#09283d"; ctx.beginPath(); ctx.arc(-34,0,5,0,Math.PI*2); ctx.fill(); }
function drawAnglerFish(color) { fishBody(color || "#72e48a"); ctx.strokeStyle="#09283d"; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(-22,-26); ctx.quadraticCurveTo(-55,-64,-78,-28); ctx.stroke(); ctx.fillStyle="#ffe36e"; ctx.beginPath(); ctx.arc(-82,-27,8,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle="#09283d"; for(let x=-8;x<30;x+=12){ctx.beginPath();ctx.moveTo(x,14);ctx.lineTo(x+8,2);ctx.lineTo(x+14,14);ctx.fill();} }
function drawSwordfish(color) { ctx.fillStyle = color || "#b8d7ff"; ctx.beginPath(); ctx.ellipse(0,0,66,24,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-60,0); ctx.lineTo(-130,-8); ctx.lineTo(-60,8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(58,0); ctx.lineTo(96,-24); ctx.lineTo(88,0); ctx.lineTo(96,24); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle="#09283d"; ctx.beginPath(); ctx.arc(-30,-7,5,0,Math.PI*2); ctx.fill(); }
function drawBoneFish(color) { ctx.strokeStyle="#09283d"; ctx.lineWidth=7; ctx.beginPath(); ctx.moveTo(-70,0); ctx.lineTo(45,0); ctx.stroke(); for(let x=-42;x<36;x+=22){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x+16,-18); ctx.moveTo(x,0); ctx.lineTo(x+16,18); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(45,0); ctx.lineTo(82,-24); ctx.lineTo(72,0); ctx.lineTo(82,24); ctx.stroke(); ctx.fillStyle=color||"#e9f3e8"; ctx.beginPath(); ctx.ellipse(-74,0,22,14,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); }
function drawShark(color) { ctx.fillStyle = color || "#8de7ff"; ctx.beginPath(); ctx.moveTo(-70,0); ctx.quadraticCurveTo(-20,-46,72,-22); ctx.lineTo(116,-2); ctx.lineTo(74,22); ctx.quadraticCurveTo(-22,43,-70,0); ctx.fill(); ctx.stroke(); ctx.fillStyle="#ecfffb"; ctx.beginPath(); ctx.moveTo(-30,14); ctx.quadraticCurveTo(8,36,48,18); ctx.lineTo(6,8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle="#09283d"; ctx.beginPath(); ctx.arc(-40,-9,5,0,Math.PI*2); ctx.fill(); }
function drawWhale(color) { ctx.fillStyle = color || "#d9fbff"; ctx.beginPath(); ctx.ellipse(-4,0,88,42,0,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.beginPath(); ctx.moveTo(78,0); ctx.lineTo(128,-34); ctx.lineTo(114,0); ctx.lineTo(128,34); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle="#09283d"; ctx.beginPath(); ctx.arc(-45,-13,6,0,Math.PI*2); ctx.fill(); }

function drawSketchPirate(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle = "#111"; ctx.lineWidth = 5; ctx.lineCap = "round"; ctx.lineJoin = "round";
  // Clean version of the user's pirate design: long coat, square head, cape coin, raised sword.
  ctx.fillStyle="#221610"; roundedLocal(-48,-36,84,106,8,"#221610");
  ctx.fillStyle="#f2c06b"; roundedLocal(-34,-130,70,78,8,"#f2c06b"); roundedLocal(-12,-54,24,20,4,"#f2c06b");
  ctx.fillStyle="#b8332d"; sketchClosed([[-29,-34],[-4,-18],[22,-34],[24,62],[-24,62]]);
  ctx.fillStyle="#f8d8a0"; roundedLocal(-9,-34,18,88,4,"#f8d8a0");
  ctx.strokeStyle="#111"; ctx.lineWidth=4; sketchLine([[-34,-26],[-17,8],[-17,58]]); sketchLine([[34,-26],[16,8],[16,58]]);
  ctx.fillStyle="#221610"; roundedLocal(-44,62,34,70,7,"#221610"); roundedLocal(6,62,34,70,7,"#221610"); ctx.fillStyle="#111"; roundedLocal(-62,122,55,22,7,"#111"); roundedLocal(0,122,55,22,7,"#111");
  ctx.fillStyle="#221610"; ctx.save(); ctx.rotate(-0.57); roundedLocal(-118,-76,34,112,7,"#221610"); ctx.restore(); ctx.save(); ctx.rotate(0.48); roundedLocal(58,-60,34,86,7,"#221610"); ctx.restore();
  ctx.fillStyle="#f2c06b"; ctx.save(); ctx.rotate(-0.57); roundedLocal(-124,-102,42,28,8,"#f2c06b"); ctx.restore(); sketchClosed([[86,18],[104,4],[101,29],[118,18],[109,44],[88,39]]);
  ctx.strokeStyle="#111"; ctx.lineWidth=4; sketchLine([[-100,-166],[-38,-238],[72,-278]]); sketchLine([[-94,-160],[44,-250]]);
  ctx.fillStyle="#111"; sketchLine([[-34,-103],[33,-91]]); ctx.beginPath(); ctx.ellipse(-23,-100,16,11,-0.15,0,Math.PI*2); ctx.fill(); ctx.beginPath(); ctx.arc(10,-94,5,0,Math.PI*2); ctx.fill(); sketchLine([[-36,-76],[-20,-66],[-3,-74]]); sketchLine([[-34,-68],[-4,-68]]);
  ctx.fillStyle="#111"; ctx.beginPath(); ctx.moveTo(-62,-142); ctx.quadraticCurveTo(-8,-196,54,-144); ctx.lineTo(31,-126); ctx.quadraticCurveTo(-18,-148,-58,-122); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle="#f7d46c"; ctx.beginPath(); ctx.arc(-14,-166,10,0,Math.PI*2); ctx.fill(); ctx.stroke(); sketchLine([[31,-139],[66,-154],[80,-134]]);
  ctx.fillStyle="#f4d36c"; ctx.beginPath(); ctx.arc(82,-42,27,0,Math.PI*2); ctx.fill(); ctx.stroke(); ctx.fillStyle="#111"; ctx.font="900 25px Trebuchet MS"; ctx.textAlign="center"; ctx.fillText("$",82,-34);
  ctx.restore();
}

function drawRodShopKeeper(x, y) {
  ctx.save(); ctx.translate(x, y); ctx.strokeStyle="#111"; ctx.lineWidth=5; ctx.lineCap="round"; ctx.lineJoin="round";
  ctx.fillStyle="#f2c06b"; roundedLocal(-40,-88,80,78,9,"#f2c06b"); roundedLocal(-12,-12,24,20,4,"#f2c06b");
  ctx.fillStyle="#264f7c"; roundedLocal(-52,8,104,112,9,"#264f7c"); ctx.fillStyle="#eaf7ff"; roundedLocal(-17,12,34,102,5,"#eaf7ff");
  ctx.fillStyle="#264f7c"; ctx.save(); ctx.rotate(-0.72); roundedLocal(-130,-36,34,112,7,"#264f7c"); ctx.restore(); ctx.save(); ctx.rotate(0.72); roundedLocal(94,-36,34,112,7,"#264f7c"); ctx.restore();
  ctx.fillStyle="#334159"; roundedLocal(-46,112,38,70,7,"#334159"); roundedLocal(8,112,38,70,7,"#334159"); ctx.fillStyle="#111"; roundedLocal(-58,174,54,20,7,"#111"); roundedLocal(4,174,54,20,7,"#111");
  ctx.fillStyle="#111"; ctx.beginPath(); ctx.arc(-15,-56,5,0,Math.PI*2); ctx.arc(17,-56,5,0,Math.PI*2); ctx.fill(); sketchLine([[-16,-34],[2,-24],[24,-36]]);
  ctx.fillStyle="#2a160d"; ctx.beginPath(); ctx.moveTo(-56,-92); ctx.quadraticCurveTo(0,-128,58,-92); ctx.lineTo(43,-78); ctx.quadraticCurveTo(0,-94,-43,-78); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.strokeStyle="#111"; ctx.lineWidth=10; ctx.beginPath(); ctx.moveTo(-160,-84); ctx.bezierCurveTo(-100,-132,-62,-74,-10,-100); ctx.bezierCurveTo(40,-126,92,-72,166,-114); ctx.stroke(); ctx.strokeStyle="#f4d36c"; ctx.lineWidth=6; ctx.beginPath(); ctx.moveTo(-158,-86); ctx.bezierCurveTo(-100,-126,-62,-78,-10,-98); ctx.bezierCurveTo(40,-120,92,-76,164,-112); ctx.stroke();
  ctx.restore();
}
