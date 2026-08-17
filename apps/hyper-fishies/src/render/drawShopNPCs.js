import { drawShadow } from './drawShadow.js';
import { drawFishIcon } from './drawFishIcon.js';
import { toonOutline, drawStraightArm } from './toon.js';

// The three shopkeepers — each visually distinct from the player and from
// Morris, and from each other, so nobody reads as a generic blob standing
// near a stall.
function drawAngler(ctx, npc, t) {
  const { x, y } = npc;
  const bob = Math.sin(t * 1.3 + x) * 0.7;
  drawShadow(ctx, x, y + 2, 13, 5.5, 0.36);

  ctx.save();
  ctx.translate(x, y - 4 + bob * 0.2);

  // Boots
  ctx.fillStyle = '#2c2015';
  ctx.beginPath(); ctx.ellipse(-4, 2, 3.6, 6.4, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);
  ctx.beginPath(); ctx.ellipse(4, 2, 3.6, 6.4, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);

  // Waders (tall boots to the knee)
  const waderGrad = ctx.createLinearGradient(-8, -13, 8, 1);
  waderGrad.addColorStop(0, '#5c6e5c'); waderGrad.addColorStop(1, '#374536');
  ctx.fillStyle = waderGrad;
  ctx.beginPath(); ctx.ellipse(-4, -6, 3.9, 7.5, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.9);
  ctx.beginPath(); ctx.ellipse(4, -6, 3.9, 7.5, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.9);
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(-5, -12); ctx.lineTo(-5, -1); ctx.moveTo(3, -12); ctx.lineTo(3, -1); ctx.stroke();

  // Fishing vest, olive, broader than the player's — an older, sturdier build
  const vestGrad = ctx.createLinearGradient(0, -30, 0, 2);
  vestGrad.addColorStop(0, '#5c6b4a');
  vestGrad.addColorStop(1, '#39422c');
  ctx.fillStyle = vestGrad;
  ctx.beginPath();
  ctx.moveTo(-11, 3);
  ctx.quadraticCurveTo(-13, -18, -7, -27);
  ctx.quadraticCurveTo(0, -31, 7, -27);
  ctx.quadraticCurveTo(13, -18, 11, 3);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.3);

  // Lure charms clipped to the vest
  const lureColors = ['#ff6f59', '#ffd08a', '#5fe3c0'];
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = lureColors[i];
    ctx.beginPath();
    ctx.arc(-6 + i * 6, -14 + (i % 2) * 3, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Arms — straight, same no-elbow-bend style as the player
  drawStraightArm(ctx, -8, -26, -12, -6, 4.6, '#d8b98c');
  drawStraightArm(ctx, 8, -26, 12, -6, 4.6, '#d8b98c');

  // Beard — full and grey, marking him as the veteran
  const beardGrad = ctx.createLinearGradient(0, -34.5, 0, -21.5);
  beardGrad.addColorStop(0, '#a8b0b4'); beardGrad.addColorStop(1, '#e2e6e8');
  ctx.fillStyle = beardGrad;
  ctx.beginPath();
  ctx.ellipse(0, -28, 7, 6.5, 0, 0, Math.PI);
  ctx.fill(); toonOutline(ctx, 1);
  ctx.strokeStyle = 'rgba(120,128,132,0.4)'; ctx.lineWidth = 0.6;
  for (const dx of [-3, 0, 3]) {
    ctx.beginPath(); ctx.moveTo(dx, -33); ctx.quadraticCurveTo(dx * 1.1, -28, dx * 0.7, -22); ctx.stroke();
  }

  // Head
  ctx.fillStyle = '#d9ab7c';
  ctx.beginPath();
  ctx.arc(0, -34, 9, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.3);

  // Eyes, behind the glasses — same simple flat-dot ellipse and warm dark
  // color as Morris's ('#241a10'), not a separate cooler-toned circle.
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.ellipse(-3, -34, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3, -34, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();

  // Round glasses
  ctx.strokeStyle = '#2c2117';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(-3, -34, 2.2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.arc(3, -34, 2.2, 0, Math.PI * 2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-0.8, -34); ctx.lineTo(0.8, -34); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.arc(-3.7, -34.7, 1, -0.4, 1.6); ctx.stroke();
  ctx.beginPath(); ctx.arc(2.3, -34.7, 1, -0.4, 1.6); ctx.stroke();

  // Wide-brim canvas hat — raised 3.5 units higher than before. The brim's
  // lower edge used to sit at y=-33.5, actually BELOW his eye line (-34),
  // completely hiding his eyes under its shadow. Morris's bandana clears
  // his eyes by a good 3-unit gap; this now matches that clearance.
  const brimGrad = ctx.createRadialGradient(0, -42.5, 2, 0, -42.5, 13);
  brimGrad.addColorStop(0, '#c2a578'); brimGrad.addColorStop(1, '#8a7048');
  ctx.fillStyle = brimGrad;
  ctx.beginPath();
  ctx.ellipse(0, -42.5, 12.5, 5.5, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.2);
  const domeGrad = ctx.createLinearGradient(-7, -52.5, 7, -40.5);
  domeGrad.addColorStop(0, '#b39568'); domeGrad.addColorStop(1, '#8a7048');
  ctx.fillStyle = domeGrad;
  ctx.beginPath();
  ctx.ellipse(0, -46.5, 7, 6, 0, Math.PI, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);
  ctx.fillStyle = '#5c6b4a';
  ctx.fillRect(-7, -43.5, 14, 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.6;
  ctx.strokeRect(-7, -43.5, 14, 2);

  // A rod resting against his shoulder
  ctx.strokeStyle = '#8a6239';
  ctx.lineWidth = 2;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(10, -6);
  ctx.lineTo(-14, -52);
  ctx.stroke();

  ctx.restore();
}

// Richy: a plain, tidy human gentleman — a tall black top hat worn low
// enough to cover most of his head, a simple calm face (no mustache, no
// monocle, no hair), a red bow tie over a white shirt front, solid black
// sleeves on both arms with just a small hand showing at each cuff, and —
// the one holdover from his old worm-only design — a small pet worm
// curled at his feet. Same boots/coat/head/drawStraightArm vocabulary
// Morris uses (see render/drawNPC.js), just dressed plainer than the other
// shopkeepers instead of fancier.
function drawRichy(ctx, npc, t) {
  const { x, y } = npc;
  const bob = Math.sin(t * 1.3 + x) * 0.6;
  drawShadow(ctx, x, y + 2, 13, 5.5, 0.36);

  ctx.save();
  ctx.translate(x, y - 4 + bob * 0.2);

  // His pet worm, curled up at his feet — small, plain, no clothes, just a
  // little pink segmented body and two dot eyes. Sits well clear of the
  // cane's x position (~10-11) so it doesn't get drawn over.
  ctx.save();
  ctx.translate(19, 4);
  ctx.scale(0.46, 0.46);
  const petGrad = ctx.createLinearGradient(0, 6, 0, -20);
  petGrad.addColorStop(0, '#e0a695'); petGrad.addColorStop(1, '#f0c2b0');
  ctx.fillStyle = petGrad;
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.quadraticCurveTo(-9, -2, -2, -10);
  ctx.quadraticCurveTo(4, -16, 0, -22);
  ctx.quadraticCurveTo(4, -24, 7, -20);
  ctx.quadraticCurveTo(9, -12, 3, -6);
  ctx.quadraticCurveTo(8, 0, 6, 8);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.4);
  ctx.strokeStyle = 'rgba(150, 80, 70, 0.35)'; ctx.lineWidth = 1.3;
  for (let i = 0; i < 3; i++) {
    const segY = 4 - i * 8;
    ctx.beginPath(); ctx.ellipse(0, segY, 6 - i * 0.8, 2.2, 0, 0, Math.PI * 2); ctx.stroke();
  }
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.ellipse(-2, -21, 0.9, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(2, -21, 0.9, 1.1, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  // Boots
  ctx.fillStyle = '#1c1712';
  ctx.beginPath(); ctx.ellipse(-4, 2, 3.6, 6.2, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);
  ctx.beginPath(); ctx.ellipse(4, 2, 3.6, 6.2, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);

  // Black tailcoat — same silhouette Morris's coat uses
  const coatGrad = ctx.createLinearGradient(0, -30, 0, 4);
  coatGrad.addColorStop(0, '#2a2e34'); coatGrad.addColorStop(1, '#101216');
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(-9, 4);
  ctx.quadraticCurveTo(-11, -16, -6, -24);
  ctx.quadraticCurveTo(0, -28, 6, -24);
  ctx.quadraticCurveTo(11, -16, 9, 4);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.3);

  // White shirt front, a plain triangle at the open collar
  ctx.fillStyle = '#f8f2e2';
  ctx.beginPath();
  ctx.moveTo(0, -25.5); ctx.lineTo(-3.2, -19); ctx.lineTo(3.2, -19);
  ctx.closePath(); ctx.fill();

  // Dark lapels flanking the shirt front, same silhouette as the reference's
  // open jacket collar
  ctx.fillStyle = '#1c1f24';
  ctx.beginPath(); ctx.moveTo(-0.4, -25.3); ctx.lineTo(-5.8, -21.5); ctx.lineTo(-1.8, -18.6); ctx.closePath();
  ctx.fill(); toonOutline(ctx, 0.6);
  ctx.beginPath(); ctx.moveTo(0.4, -25.3); ctx.lineTo(5.8, -21.5); ctx.lineTo(1.8, -18.6); ctx.closePath();
  ctx.fill(); toonOutline(ctx, 0.6);

  // Red bow tie
  ctx.fillStyle = '#a52020';
  ctx.beginPath(); ctx.moveTo(-3, -20.6); ctx.lineTo(0, -19.4); ctx.lineTo(-2.6, -18.2); ctx.closePath();
  ctx.fill(); toonOutline(ctx, 0.4);
  ctx.beginPath(); ctx.moveTo(3, -20.6); ctx.lineTo(0, -19.4); ctx.lineTo(2.6, -18.2); ctx.closePath();
  ctx.fill(); toonOutline(ctx, 0.4);
  ctx.fillStyle = '#7a1414';
  ctx.beginPath(); ctx.arc(0, -19.5, 0.9, 0, Math.PI * 2); ctx.fill();

  // Arms — plain black sleeves on both sides, straight down, with just a
  // small hand showing at each cuff instead of a full skin-toned sleeve.
  drawStraightArm(ctx, -7, -20, -9, -3, 4.2, '#101216');
  ctx.fillStyle = '#f0c2b0';
  ctx.beginPath(); ctx.arc(-9, -3, 2.4, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.9);
  drawStraightArm(ctx, 7, -20, 9, -3, 4.2, '#101216');
  ctx.fillStyle = '#f0c2b0';
  ctx.beginPath(); ctx.arc(9, -3, 2.4, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.9);

  // Head — pale, faintly pink skin, a small callback to his old worm hue
  ctx.fillStyle = '#f0c2b0';
  ctx.beginPath(); ctx.arc(0, -32.5, 9, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.3);

  // Thin, plain eyebrows — calm, not bushy
  ctx.strokeStyle = '#241a10'; ctx.lineWidth = 0.8; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-4.8, -36.4); ctx.quadraticCurveTo(-3.2, -37.1, -1.6, -36.4); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1.6, -36.4); ctx.quadraticCurveTo(3.2, -37.1, 4.8, -36.4); ctx.stroke();

  // Eyes — plain dots, same warm dark color as the rest of the cast
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.ellipse(-3, -32.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3, -32.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();

  // A modest brown mustache — no mouth underneath it, same restrained,
  // no-visible-mouth face Finn and Morris both have.
  ctx.fillStyle = '#4a3220';
  ctx.beginPath();
  ctx.moveTo(0, -29.6);
  ctx.quadraticCurveTo(-1.3, -30.3, -3.2, -29.6);
  ctx.quadraticCurveTo(-4.2, -29.2, -3.7, -28.3);
  ctx.quadraticCurveTo(-2.2, -28.9, -0.9, -29.2);
  ctx.quadraticCurveTo(-0.4, -29.3, 0, -29.2);
  ctx.quadraticCurveTo(0.4, -29.3, 0.9, -29.2);
  ctx.quadraticCurveTo(2.2, -28.9, 3.7, -28.3);
  ctx.quadraticCurveTo(4.2, -29.2, 3.2, -29.6);
  ctx.quadraticCurveTo(1.3, -30.3, 0, -29.6);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 0.5);

  // Top hat — tall and plain, sitting low enough to cover most of his head
  // instead of just perching on top of it.
  ctx.fillStyle = '#161418';
  ctx.beginPath(); ctx.ellipse(0, -39.5, 7.2, 2.2, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1);
  const topHatGrad = ctx.createLinearGradient(0, -52, 0, -39.5);
  topHatGrad.addColorStop(0, '#2a2e34'); topHatGrad.addColorStop(1, '#0c0e10');
  ctx.fillStyle = topHatGrad;
  ctx.fillRect(-4.5, -52, 9, 13);
  ctx.strokeStyle = 'rgba(35,24,14,0.65)'; ctx.lineWidth = 1; ctx.strokeRect(-4.5, -52, 9, 13);
  ctx.strokeStyle = 'rgba(255,255,255,0.1)'; ctx.lineWidth = 0.7;
  ctx.beginPath(); ctx.moveTo(-2, -51); ctx.lineTo(-2, -40); ctx.stroke();
  ctx.fillStyle = '#161418';
  ctx.beginPath(); ctx.ellipse(0, -52, 4.5, 1.6, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

function drawMarketPirate(ctx, npc, t) {
  const { x, y } = npc;
  const bob = Math.sin(t * 1.2 + x) * 0.6;
  drawShadow(ctx, x, y + 2, 12, 5.5, 0.36);

  ctx.save();
  ctx.translate(x, y - 4 + bob * 0.2);

  // Peg leg + boot
  const bootGrad = ctx.createLinearGradient(-8, -4, 0, 8);
  bootGrad.addColorStop(0, '#3c2c1e'); bootGrad.addColorStop(1, '#1c140c');
  ctx.fillStyle = bootGrad;
  ctx.beginPath(); ctx.ellipse(-4, 2, 3.6, 6.4, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);
  const pegGrad = ctx.createLinearGradient(2, -6, 6, 6);
  pegGrad.addColorStop(0, '#e0c9a0'); pegGrad.addColorStop(1, '#a5834f');
  ctx.fillStyle = pegGrad;
  ctx.beginPath(); ctx.moveTo(2, -6); ctx.lineTo(6, -6); ctx.lineTo(5, 6); ctx.lineTo(3, 6); ctx.closePath(); ctx.fill(); toonOutline(ctx, 1);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 0.8;
  for (let py = -4; py < 5; py += 3) { ctx.beginPath(); ctx.moveTo(2.5, py); ctx.lineTo(5.5, py); ctx.stroke(); }

  // Coat
  const coatGrad = ctx.createLinearGradient(0, -30, 0, 4);
  coatGrad.addColorStop(0, '#243a42');
  coatGrad.addColorStop(1, '#152229');
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(-9, 4);
  ctx.quadraticCurveTo(-11, -16, -6, -24);
  ctx.quadraticCurveTo(0, -28, 6, -24);
  ctx.quadraticCurveTo(11, -16, 9, 4);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.3);

  // Gold buttons + belt
  ctx.fillStyle = '#ffb454';
  ctx.beginPath(); ctx.arc(0, -18, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(0, -10, 1.1, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3c2a1a';
  ctx.fillRect(-8, -3, 16, 3);
  ctx.fillStyle = '#ffb454';
  ctx.fillRect(-1.5, -3, 3, 3);

  // A small fish hanging from his belt (the trade of the trade)
  ctx.save();
  ctx.translate(7, 3);
  drawFishIcon(ctx, 'round', 0, 0, 8, '#9fd8c9');
  ctx.restore();

  // Arms — straight, same no-elbow-bend style as the player
  drawStraightArm(ctx, -7, -24, -10, -5, 4.2, '#d8b98c');
  drawStraightArm(ctx, 7, -24, 10, -5, 4.2, '#d8b98c');

  // Beard stub
  const stubGrad = ctx.createLinearGradient(0, -31, 0, -23);
  stubGrad.addColorStop(0, '#1c1410'); stubGrad.addColorStop(1, '#3c2e22');
  ctx.fillStyle = stubGrad;
  ctx.beginPath(); ctx.ellipse(0, -27, 5.5, 4, 0, 0, Math.PI); ctx.fill(); toonOutline(ctx, 0.8);

  // Head
  ctx.fillStyle = '#c98f5c';
  ctx.beginPath(); ctx.arc(0, -32, 9, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.3);

  // Gold hoop earring
  ctx.strokeStyle = '#ffb454';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(7.6, -29.5, 1.6, 0, Math.PI * 2); ctx.stroke();

  // Coat collar, popped up around the neck
  ctx.fillStyle = '#152229';
  ctx.beginPath();
  ctx.moveTo(-6, -22); ctx.lineTo(-2, -27); ctx.lineTo(-6, -24); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(6, -22); ctx.lineTo(2, -27); ctx.lineTo(6, -24); ctx.closePath(); ctx.fill();

  // Tricorn hat — raised 4 units higher than before. The brim's lower edge
  // used to sit at y=-31, below his eye/eyepatch line (-32/-32.5), shadowing
  // his whole upper face. Now clears it by the same margin Morris's bandana
  // clears his.
  const brimGrad = ctx.createRadialGradient(0, -41, 2, 0, -41, 12);
  brimGrad.addColorStop(0, '#2a2e34'); brimGrad.addColorStop(1, '#0c0e10');
  ctx.fillStyle = brimGrad;
  ctx.beginPath();
  ctx.ellipse(0, -41, 11.5, 6, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.2);
  const crownGrad = ctx.createLinearGradient(0, -53, 0, -42);
  crownGrad.addColorStop(0, '#26292e'); crownGrad.addColorStop(1, '#0c0e10');
  ctx.fillStyle = crownGrad;
  ctx.beginPath();
  ctx.moveTo(-6.5, -42);
  ctx.quadraticCurveTo(0, -53, 6.5, -42);
  ctx.quadraticCurveTo(0, -46, -6.5, -42);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1);
  ctx.fillStyle = '#7a2e2e';
  ctx.fillRect(-5.5, -44, 11, 2);

  // Eyepatch
  ctx.fillStyle = '#0c0c0c';
  ctx.beginPath(); ctx.arc(-2.6, -32.5, 1.8, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(-5.5, -35); ctx.lineTo(2, -30); ctx.stroke();

  // Same warm dark eye color/shape as Morris, not a cooler-toned circle.
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.ellipse(2.6, -32, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();

  ctx.restore();
}

// Grizelda: a hooded witch in a floor-length robe (no separate boots — the
// hem sweeps the ground), a gnarled staff topped with a glowing rune
// crystal in one hand, and a small black cat familiar at her feet. Same
// straight-arm/toon-outline vocabulary as the rest of the cast, but a
// cooler, more otherworldly palette than any of the three shopkeepers.
function drawWitch(ctx, npc, t) {
  const { x, y } = npc;
  const sway = Math.sin(t * 1.1 + x) * 0.04;
  drawShadow(ctx, x, y + 2, 13, 5.5, 0.36);

  ctx.save();
  ctx.translate(x, y);

  // Black cat familiar, curled at her feet
  ctx.save();
  ctx.translate(11, 2);
  ctx.fillStyle = '#141018';
  ctx.beginPath();
  ctx.ellipse(0, 0, 6.5, 4, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 0.9);
  ctx.beginPath();
  ctx.moveTo(-5, -5); ctx.quadraticCurveTo(-9, -12, -3, -14);
  ctx.quadraticCurveTo(-2, -9, 1, -6);
  ctx.closePath(); ctx.fill(); toonOutline(ctx, 0.8);
  ctx.beginPath(); ctx.arc(-4.5, -3, 3, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.8);
  ctx.fillStyle = '#141018';
  ctx.beginPath(); ctx.moveTo(-6.5, -4.5); ctx.lineTo(-7.5, -7); ctx.lineTo(-5.5, -5.5); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(-3.5, -5); ctx.lineTo(-3, -7.5); ctx.lineTo(-1.8, -5.3); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#ffd670';
  ctx.beginPath(); ctx.ellipse(-5.6, -3.2, 0.7, 0.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.rotate(sway);

  // Floor-length robe — one continuous silhouette instead of a vest over
  // separate boots, so she reads as gliding rather than standing.
  const robeGrad = ctx.createLinearGradient(0, -30, 0, 4);
  robeGrad.addColorStop(0, '#4a3468');
  robeGrad.addColorStop(1, '#1c1428');
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(-3, -27);
  ctx.quadraticCurveTo(-11, -20, -13, 4);
  ctx.lineTo(13, 4);
  ctx.quadraticCurveTo(11, -20, 3, -27);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.3);
  // Hem tatters
  ctx.fillStyle = '#160f20';
  for (const dx of [-11, -4, 3, 10]) {
    ctx.beginPath();
    ctx.moveTo(dx, 4); ctx.lineTo(dx + 3.5, 4); ctx.lineTo(dx + 1.7, 8.5);
    ctx.closePath(); ctx.fill();
  }

  // A thin green sash belt, tied with a small pouch
  ctx.strokeStyle = '#8fe97a'; ctx.lineWidth = 1.6;
  ctx.beginPath(); ctx.moveTo(-10, -8); ctx.quadraticCurveTo(0, -5, 10, -8); ctx.stroke();
  ctx.fillStyle = '#3a2a54';
  ctx.beginPath(); ctx.ellipse(7, -4, 3, 3.6, 0.3, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.7);
  ctx.strokeStyle = '#8fe97a'; ctx.lineWidth = 0.8;
  ctx.beginPath(); ctx.moveTo(6, -7); ctx.lineTo(8, -6); ctx.stroke();

  // Arms — same straight-arm style as everyone else, sallow-green skin
  drawStraightArm(ctx, -8, -25, -13, -12, 4.4, '#8ba07c');
  drawStraightArm(ctx, 8, -25, 13, -6, 4.4, '#8ba07c');

  // Gnarled staff planted by her right hand, topped with a glowing crystal
  const staffGrad = ctx.createLinearGradient(15, -46, 15, 0);
  staffGrad.addColorStop(0, '#5a4530'); staffGrad.addColorStop(1, '#2c2115');
  ctx.strokeStyle = staffGrad; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(13, -6);
  ctx.quadraticCurveTo(16, -20, 14, -34);
  ctx.quadraticCurveTo(13, -40, 16, -46);
  ctx.stroke();
  const crystalGlow = ctx.createRadialGradient(16, -48, 0, 16, -48, 12);
  crystalGlow.addColorStop(0, 'rgba(143, 233, 122, 0.55)');
  crystalGlow.addColorStop(1, 'rgba(143, 233, 122, 0)');
  ctx.fillStyle = crystalGlow;
  ctx.beginPath(); ctx.arc(16, -48, 12, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#c4f7b0';
  ctx.beginPath();
  ctx.moveTo(16, -53); ctx.lineTo(20, -48); ctx.lineTo(16, -42); ctx.lineTo(12, -48);
  ctx.closePath(); ctx.fill(); toonOutline(ctx, 1);

  // Stringy grey hair, peeking out from under the hat
  ctx.strokeStyle = '#aab0ac'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  for (const [dx, len] of [[-8, 10], [-5.5, 13], [5.5, 12], [8, 9]]) {
    ctx.beginPath();
    ctx.moveTo(dx, -30);
    ctx.quadraticCurveTo(dx * 1.2, -30 + len * 0.6, dx * 0.8, -30 + len);
    ctx.stroke();
  }

  // Head — sallow green-grey skin, gaunt
  ctx.fillStyle = '#8ba07c';
  ctx.beginPath();
  ctx.arc(0, -34, 8.4, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.3);

  // Eyes — glowing witch-yellow, no whites, plus a hooked nose
  ctx.fillStyle = '#ffe27a';
  ctx.beginPath(); ctx.ellipse(-3, -34, 1.3, 0.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3, -34, 1.3, 0.9, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#7c9070';
  ctx.beginPath();
  ctx.moveTo(0, -33); ctx.quadraticCurveTo(2.4, -30, 0.5, -28.5); ctx.lineTo(-0.8, -28.8);
  ctx.closePath(); ctx.fill();

  // Pointed witch hat, cocked slightly
  ctx.save();
  ctx.translate(1, -41);
  ctx.rotate(-0.08);
  const brimGrad = ctx.createRadialGradient(0, 0, 2, 0, 0, 13);
  brimGrad.addColorStop(0, '#2c2038'); brimGrad.addColorStop(1, '#160f20');
  ctx.fillStyle = brimGrad;
  ctx.beginPath(); ctx.ellipse(0, 0, 12.5, 4.6, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);
  const crownGrad = ctx.createLinearGradient(-6, -28, 6, 0);
  crownGrad.addColorStop(0, '#3a2a54'); crownGrad.addColorStop(1, '#160f20');
  ctx.fillStyle = crownGrad;
  ctx.beginPath();
  ctx.moveTo(-6.5, 0);
  ctx.quadraticCurveTo(-2, -24, 3, -28);
  ctx.quadraticCurveTo(4, -18, 6.5, 0);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1);
  // Floppy tip
  ctx.beginPath();
  ctx.moveTo(2.5, -27);
  ctx.quadraticCurveTo(8, -26, 7, -20);
  ctx.quadraticCurveTo(3, -22, 2.5, -27);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 0.9);
  ctx.fillStyle = '#8fe97a';
  ctx.fillRect(-6.5, -3, 13, 2);
  ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 0.6; ctx.strokeRect(-6.5, -3, 13, 2);
  ctx.restore();

  ctx.restore();
  ctx.restore();
}

// Garrick the Blacksmith: a broad, soot-smudged forge-worker in a heavy
// leather apron over bare arms, a hammer resting on one shoulder, and his
// own little anvil with a glowing coal set at his feet — the same "a small
// prop of their own" trick Richy's pet worm and Grizelda's cat use. Same
// boots/straight-arm scaffold as the rest of the cast (render/drawNPC.js).
function drawBlacksmith(ctx, npc, t) {
  const { x, y } = npc;
  const bob = Math.sin(t * 1.1 + x) * 0.5;
  drawShadow(ctx, x, y + 2, 14, 6, 0.36);

  ctx.save();
  ctx.translate(x, y);

  // His own little anvil, with a bed of glowing coals — set to one side so
  // it never sits under his own feet.
  ctx.save();
  ctx.translate(15, 4);
  const glow = ctx.createRadialGradient(0, -1, 0, 0, -1, 10);
  const flicker = 0.7 + Math.sin(t * 6) * 0.2;
  glow.addColorStop(0, `rgba(255, 140, 60, ${0.6 * flicker})`);
  glow.addColorStop(1, 'rgba(255, 140, 60, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, -1, 10, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#2c2c30';
  ctx.beginPath(); ctx.rect(-6, -2, 12, 5); ctx.fill(); toonOutline(ctx, 0.9);
  ctx.beginPath(); ctx.rect(-8, -6, 16, 4); ctx.fill(); toonOutline(ctx, 0.9);
  ctx.fillStyle = `rgba(255, 150, 60, ${0.85 * flicker})`;
  ctx.beginPath(); ctx.arc(-2, -6, 1.4, 0, Math.PI * 2); ctx.arc(2, -6.5, 1, 0, Math.PI * 2); ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.translate(0, -4 + bob * 0.2);

  // Boots
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.ellipse(-4, 2, 4, 6.4, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);
  ctx.beginPath(); ctx.ellipse(4, 2, 4, 6.4, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.1);

  // Dark trousers
  ctx.fillStyle = '#3c342c';
  ctx.fillRect(-7.5, -22, 6.5, 7);
  ctx.fillRect(1, -22, 6.5, 7);

  // Broad bare torso — a stockier, wider build than the other shopkeepers,
  // to read as physically strong
  ctx.fillStyle = '#c98f5c';
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.quadraticCurveTo(-12, -18, -6, -27);
  ctx.quadraticCurveTo(0, -30, 6, -27);
  ctx.quadraticCurveTo(12, -18, 10, 4);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.3);

  // Heavy leather apron over the torso, with a front pocket and a strap
  const apronGrad = ctx.createLinearGradient(0, -24, 0, 4);
  apronGrad.addColorStop(0, '#6b4a30'); apronGrad.addColorStop(1, '#3c2a1a');
  ctx.fillStyle = apronGrad;
  ctx.beginPath();
  ctx.moveTo(-8, -22);
  ctx.lineTo(8, -22);
  ctx.lineTo(9, 3);
  ctx.lineTo(-9, 3);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.1);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
  ctx.strokeRect(-5, -8, 10, 6);
  ctx.strokeStyle = '#5a3f28'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(-6, -24); ctx.lineTo(-2, -29); ctx.moveTo(6, -24); ctx.lineTo(2, -29); ctx.stroke();

  // Bare, muscular arms — one gripping a hammer resting on the shoulder,
  // the other hanging at his side
  drawStraightArm(ctx, -8, -25, -11, -8, 4.8, '#c98f5c');
  drawStraightArm(ctx, 8, -25, 9, -30, 4.8, '#c98f5c');

  // Hammer, head resting against his shoulder
  ctx.strokeStyle = '#5a3f28'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(9, -30); ctx.lineTo(15, -42); ctx.stroke();
  ctx.fillStyle = '#3a3a3e';
  ctx.beginPath(); ctx.rect(9, -47, 13, 8); ctx.fill(); toonOutline(ctx, 1);

  // Head
  ctx.fillStyle = '#c98f5c';
  ctx.beginPath(); ctx.arc(0, -32, 9.5, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1.3);

  // A thick, dark beard — no visible mouth, matching the cast's restrained
  // faces
  ctx.fillStyle = '#241a10';
  ctx.beginPath();
  ctx.ellipse(0, -27, 7, 6.5, 0, 0, Math.PI);
  ctx.fill(); toonOutline(ctx, 1);

  // Heavy brows and calm eyes
  ctx.strokeStyle = '#1c140c'; ctx.lineWidth = 1.4; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-5.5, -35.5); ctx.lineTo(-2, -36.2); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(2, -36.2); ctx.lineTo(5.5, -35.5); ctx.stroke();
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.ellipse(-3.2, -33, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3.2, -33, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();

  // A soot smudge across one cheek, and a leather skull cap
  ctx.fillStyle = 'rgba(30, 24, 18, 0.3)';
  ctx.beginPath(); ctx.ellipse(4.5, -30, 2.4, 1.6, 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#3c2a1a';
  ctx.beginPath(); ctx.arc(0, -37.5, 8.4, Math.PI, 0); ctx.fill(); toonOutline(ctx, 1.1);

  ctx.restore();
  ctx.restore();
}

export function drawShopNPC(ctx, npc, t) {
  switch (npc.visual) {
    case 'angler': drawAngler(ctx, npc, t); break;
    case 'richy': drawRichy(ctx, npc, t); break;
    case 'pirate': drawMarketPirate(ctx, npc, t); break;
    case 'witch': drawWitch(ctx, npc, t); break;
    case 'blacksmith': drawBlacksmith(ctx, npc, t); break;
  }
}

// The dialogue "popup" scene: the shopkeeper's full figure standing behind
// their own stall's counter, under its own roof and sign, instead of being
// visible out on the pier. This is what you see the moment you interact
// with a stand — the NPC was never rendered in the world at all, so this
// scene has to carry all the "yes, this is definitely their stall" weight
// on its own: same roof color, same sign text, same accent trim as the
// physical stall out on the boardwalk.
export function drawShopNpcAtStand(ctx, w, h, visual, stall, t, pop = 0) {
  ctx.clearRect(0, 0, w, h);

  const counterY = h * 0.76;
  const roofY = h * 0.22;

  // Back wall
  const wallGrad = ctx.createLinearGradient(0, roofY, 0, counterY);
  wallGrad.addColorStop(0, stall.roofColor || '#3c2a1a');
  wallGrad.addColorStop(1, stall.wallColor || '#241708');
  ctx.fillStyle = wallGrad;
  ctx.fillRect(0, roofY, w, counterY - roofY);
  ctx.strokeStyle = 'rgba(255,180,84,0.1)';
  ctx.lineWidth = 1;
  for (let x = 10; x < w; x += 18) {
    ctx.beginPath(); ctx.moveTo(x, roofY); ctx.lineTo(x, counterY); ctx.stroke();
  }

  // Sloped roof/awning plane, same shape language as the world stall
  ctx.save();
  ctx.beginPath();
  ctx.moveTo(-6, roofY);
  ctx.lineTo(w + 6, roofY);
  ctx.lineTo(w - 18, 0);
  ctx.lineTo(18, 0);
  ctx.closePath();
  ctx.clip();
  ctx.fillStyle = stall.roofColor || '#3c2a1a';
  ctx.fillRect(0, 0, w, roofY);
  const stripeW = 14;
  for (let x = -stripeW; x < w + stripeW; x += stripeW * 2) {
    ctx.fillStyle = 'rgba(0,0,0,0.16)';
    ctx.fillRect(x, 0, stripeW, roofY);
  }
  ctx.restore();
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillRect(0, roofY - 3, w, 4);

  // Hanging sign, naming the stall so the "you are here" reads instantly —
  // tucked near the very top of the roof plane, out of the way of the
  // now-bigger shopkeeper figure below.
  const signW = Math.min(180, w * 0.42), signX = w / 2 - signW / 2, signY = 8;
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(signX + 6, roofY); ctx.lineTo(signX + 6, signY); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(signX + signW - 6, roofY); ctx.lineTo(signX + signW - 6, signY); ctx.stroke();
  ctx.fillStyle = stall.accent || '#ffb454';
  ctx.fillRect(signX, signY, signW, 24);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.strokeRect(signX, signY, signW, 24);
  ctx.fillStyle = '#241708';
  ctx.font = '15px "Pirata One", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(stall.label || '', w / 2, signY + 13);

  // Small hanging lantern under the eave, echoing the world stall
  const lx = w * 0.16, ly = roofY + 6;
  const lglow = ctx.createRadialGradient(lx, ly, 0, lx, ly, 30);
  lglow.addColorStop(0, 'rgba(255,180,84,0.45)');
  lglow.addColorStop(1, 'rgba(255,180,84,0)');
  ctx.fillStyle = lglow;
  ctx.beginPath(); ctx.arc(lx, ly, 30, 0, Math.PI * 2); ctx.fill();

  // The shopkeeper, scaled up much bigger to dominate the scene. Richy is
  // built on the same human boot/coat/head proportions as the other
  // shopkeepers now, so he uses the same scale as they do. `pop` (a small
  // spring kicked from main.js every time the dialogue advances — see
  // util/spring.js) adds a brief lean-in/scale-up so each new line reads
  // as a reaction, not a frozen slideshow.
  const popupScale = 2.6 + pop * 0.09;
  ctx.save();
  ctx.translate(w / 2, counterY - 4 - pop * 5);
  ctx.scale(popupScale, popupScale);
  drawShopNPC(ctx, { x: 0, y: 0, visual }, t);
  ctx.restore();

  // Counter, drawn last so the figure reads as standing behind it
  const counterGrad = ctx.createLinearGradient(0, counterY, 0, h);
  counterGrad.addColorStop(0, '#6b4a30');
  counterGrad.addColorStop(1, '#43301e');
  ctx.fillStyle = counterGrad;
  ctx.fillRect(0, counterY, w, h - counterY);
  ctx.fillStyle = stall.accent || '#ffb454';
  ctx.fillRect(0, counterY, w, 3);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  for (let x = 14; x < w; x += 22) {
    ctx.beginPath(); ctx.moveTo(x, counterY + 4); ctx.lineTo(x, h - 2); ctx.stroke();
  }
}

