import { drawShadow } from './drawShadow.js';
import { toonOutline, drawStraightArm } from './toon.js';

// Morris: a grizzled old ferryman-pirate who stands watch by his rowboat
// at the dock. Visually distinct from the player — grey beard, bandana
// instead of a tricorn, a hook hand — so he reads as an NPC at a glance.
export function drawMorris(ctx, npc, t) {
  const { x, y } = npc;
  const bob = Math.sin(t * 1.6) * 0.8;

  drawShadow(ctx, x, y + 2, 12, 5, 0.36);

  ctx.save();
  ctx.translate(x, y + bob * 0.2);

  // Boots + cuff, so the legs read as more than one flat blob
  const bootGrad = ctx.createLinearGradient(-8, -4, 0, 8);
  bootGrad.addColorStop(0, '#3c2c1e'); bootGrad.addColorStop(1, '#1c140c');
  ctx.fillStyle = bootGrad;
  ctx.beginPath();
  ctx.ellipse(-4, 2, 3.6, 6.2, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);
  ctx.beginPath();
  ctx.ellipse(4, 2, 3.6, 6.2, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);
  const cuffGrad = ctx.createLinearGradient(0, -3.4, 0, 1.4);
  cuffGrad.addColorStop(0, '#2c4a4a'); cuffGrad.addColorStop(1, '#152e2e');
  ctx.fillStyle = cuffGrad;
  ctx.beginPath();
  ctx.ellipse(-4, -1, 3.8, 2.4, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 0.7);
  ctx.beginPath();
  ctx.ellipse(4, -1, 3.8, 2.4, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 0.7);

  // Coat — weathered blue-grey
  const coatGrad = ctx.createLinearGradient(0, -30, 0, 4);
  coatGrad.addColorStop(0, '#3c5560');
  coatGrad.addColorStop(1, '#243a42');
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(-9, 4);
  ctx.quadraticCurveTo(-11, -16, -6, -24);
  ctx.quadraticCurveTo(0, -28, 6, -24);
  ctx.quadraticCurveTo(11, -16, 9, 4);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.3);

  ctx.strokeStyle = 'rgba(240, 226, 196, 0.55)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.moveTo(-7, -22);
  ctx.lineTo(6, 2);
  ctx.stroke();

  // Arms — straight, same no-elbow-bend style as the player; one a plain
  // sleeve, one ending in a hook
  drawStraightArm(ctx, -7, -20, -9, -2, 4.2, '#c9b28c');
  drawStraightArm(ctx, 7, -20, 10, -3, 4.2, '#c9b28c');
  ctx.strokeStyle = '#8a8f92';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(11, -3);
  ctx.quadraticCurveTo(15, -1, 13, 3);
  ctx.stroke();

  // Beard — grey, longer than the player's
  const beardGrad = ctx.createLinearGradient(0, -31, 0, -19);
  beardGrad.addColorStop(0, '#9aa2a6'); beardGrad.addColorStop(1, '#e2e6e8');
  ctx.fillStyle = beardGrad;
  ctx.beginPath();
  ctx.ellipse(0, -25, 6.5, 6, 0, 0, Math.PI);
  ctx.fill(); toonOutline(ctx, 1);
  ctx.strokeStyle = 'rgba(110,118,122,0.4)'; ctx.lineWidth = 0.6;
  for (const dx of [-3, 0, 3]) {
    ctx.beginPath(); ctx.moveTo(dx, -30); ctx.quadraticCurveTo(dx * 1.1, -25, dx * 0.7, -20); ctx.stroke();
  }

  // Head — bigger, rounder, cartoon-outlined like the rest of the cast
  ctx.fillStyle = '#d9ab7c';
  ctx.beginPath();
  ctx.arc(0, -32.5, 9, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.3);

  // Simple, calm eyes — same restrained style as the player, no exaggerated
  // cartoon blush or arched brows.
  ctx.fillStyle = '#241a10';
  ctx.beginPath(); ctx.ellipse(-3, -32.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.ellipse(3, -32.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();

  // Bandana
  const bandanaGrad = ctx.createLinearGradient(0, -44.7, 0, -35.5);
  bandanaGrad.addColorStop(0, '#a33c3c'); bandanaGrad.addColorStop(1, '#631f1f');
  ctx.fillStyle = bandanaGrad;
  ctx.beginPath();
  ctx.arc(0, -35.5, 9.2, Math.PI, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.2);
  ctx.beginPath();
  ctx.moveTo(7.4, -34.5);
  ctx.lineTo(13.4, -30.5);
  ctx.lineTo(7.4, -30.5);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1);
  ctx.fillStyle = '#f0e2c4';
  ctx.beginPath();
  ctx.arc(-3, -37.5, 1, 0, Math.PI * 2);
  ctx.arc(0, -38.5, 1, 0, Math.PI * 2);
  ctx.arc(3, -37.5, 1, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

// The dialogue popup scene for Morris — his full figure on the dock at
// dusk, matching the "NPC standing at their stand" treatment the
// shopkeepers get (see drawShopNPCs.js's drawShopNpcAtStand).
// `pop` is the current value of a small spring (util/spring.js, driven from
// main.js) that gets kicked every time the dialogue advances to a new
// line — a brief forward lean/scale-up that settles back to 0, so Morris
// visibly reacts to what you just said instead of standing dead still
// between idle-sway frames.
export function drawMorrisAtDock(ctx, w, h, t, pop = 0) {
  ctx.clearRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#123847');
  grad.addColorStop(1, '#02202f');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const deckY = h * 0.86;
  ctx.fillStyle = '#4a3320';
  ctx.fillRect(0, deckY, w, h - deckY);
  ctx.fillStyle = 'rgba(255,180,84,0.14)';
  ctx.fillRect(0, deckY, w, 2);

  const scale = 2.6 + pop * 0.09;
  ctx.save();
  ctx.translate(w / 2, deckY - pop * 5);
  ctx.scale(scale, scale);
  drawMorris(ctx, { x: 0, y: 0 }, t);
  ctx.restore();
}

// Luca: a fisherman half-taken by something that came up out of the
// Abyssal Lands with his last catch. Same straight-armed, no-elbow-bend
// build as Morris so he reads as part of the same cast, but while
// possessed he's meant to be genuinely unsettling to stand near: sickly
// cracked skin with dark veins radiating from both eyes, both eyes blown
// out into glowing slit-pupil rifts, two curled horns breaking through his
// cap, clawed fingertips, a jagged fanged grin, a churning dark-red aura
// with embers guttering up off him, and a restless full-body twitch.
// `stage` is state.quests.luca.stage — once it reaches 'complete'/
// 'thanked' every one of those possession cues drops out at once and he
// reads as just a tired, ordinary fisherman again: the visual payoff for
// finishing his quest.
export function drawLuca(ctx, npc, t, stage) {
  const { x, y } = npc;
  const cured = stage === 'complete' || stage === 'thanked';
  const bob = Math.sin(t * 1.4 + x) * 0.8;
  const twitch = cured ? 0 : Math.sin(t * 13 + x) * (Math.sin(t * 0.9 + x) > 0.75 ? 2.2 : 0);
  const lean = cured ? 0 : Math.sin(t * 0.6 + x) * 1.4;

  drawShadow(ctx, x, y + 2, 13, 5, cured ? 0.36 : 0.46);

  // A low, breathing pool of dark-red shadow underfoot — reads before
  // anything else does, so even at a glance from across the boardwalk this
  // patch of ground looks wrong.
  if (!cured) {
    const poolPulse = 0.5 + Math.sin(t * 1.7) * 0.3;
    const pool = ctx.createRadialGradient(x, y + 3, 2, x, y + 3, 24 + poolPulse * 5);
    pool.addColorStop(0, `rgba(120, 10, 40, ${0.32 * poolPulse})`);
    pool.addColorStop(1, 'rgba(120, 10, 40, 0)');
    ctx.fillStyle = pool;
    ctx.beginPath();
    ctx.ellipse(x, y + 3, 24 + poolPulse * 5, 10 + poolPulse * 2, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.save();
  ctx.translate(x + twitch, y + bob * 0.2);
  ctx.rotate(lean * 0.01);

  // Thick dark-red/violet wisps churning up off his shoulders and head —
  // more of them, taller, and brighter than an ordinary "spooky aura"
  // ought to be. Drawn first so the body layers over each curl's base.
  if (!cured) {
    ctx.save();
    ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) {
      const side = i % 2 === 0 ? -1 : 1;
      const spread = 4 + i * 3;
      const wx = side * (6 + spread * 0.4);
      const reach = 34 + (i % 3) * 10;
      const sway = Math.sin(t * (1.1 + i * 0.15) + i) * (5 + i);
      ctx.strokeStyle = `rgba(${150 + i * 8}, ${20 + i * 4}, ${70 + i * 10}, ${0.4 - i * 0.04})`;
      ctx.lineWidth = 2 - i * 0.2;
      ctx.beginPath();
      ctx.moveTo(wx, -18);
      ctx.quadraticCurveTo(wx + side * sway, -22 - reach * 0.6, wx + side * (sway * 0.6), -22 - reach);
      ctx.stroke();
    }
    ctx.restore();

    // Embers guttering upward, like something inside him is still smoldering.
    ctx.save();
    for (let i = 0; i < 4; i++) {
      const cycle = ((t * 0.7 + i * 0.31) % 1);
      const ex = Math.sin(t * 2 + i * 2.1) * 7;
      const ey = -18 - cycle * 30;
      ctx.globalAlpha = (1 - cycle) * 0.85;
      ctx.fillStyle = '#ff5a6a';
      ctx.beginPath(); ctx.arc(ex, ey, 1.1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  // Boots
  const bootGrad = ctx.createLinearGradient(-8, -4, 0, 8);
  bootGrad.addColorStop(0, '#38342c'); bootGrad.addColorStop(1, '#18140e');
  ctx.fillStyle = bootGrad;
  ctx.beginPath();
  ctx.ellipse(-4, 2, 3.6, 6.2, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);
  ctx.beginPath();
  ctx.ellipse(4, 2, 3.6, 6.2, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);

  // Coat — patched teal-grey, duller and more ragged than Morris's
  const coatGrad = ctx.createLinearGradient(0, -30, 0, 4);
  coatGrad.addColorStop(0, '#3a4a48');
  coatGrad.addColorStop(1, '#1c2624');
  ctx.fillStyle = coatGrad;
  ctx.beginPath();
  ctx.moveTo(-9, 4);
  ctx.quadraticCurveTo(-11, -16, -6, -24);
  ctx.quadraticCurveTo(0, -28, 6, -24);
  ctx.quadraticCurveTo(11, -16, 9, 4);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.3);

  // A ragged patch and a couple of tears, so the coat reads as worn-through
  ctx.fillStyle = 'rgba(90, 100, 82, 0.6)';
  ctx.beginPath();
  ctx.rect(-6, -6, 5, 4);
  ctx.fill();
  ctx.strokeStyle = 'rgba(10, 8, 6, 0.4)'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(4, -18); ctx.lineTo(6, -10); ctx.stroke();

  // Dark cracks spidering out from the collar across the coat — the
  // corruption isn't just in his face, it's spreading.
  if (!cured) {
    ctx.strokeStyle = 'rgba(80, 10, 40, 0.5)';
    ctx.lineWidth = 0.7;
    for (const [sx, sy, ex, ey] of [[-2, -22, -5, -12], [1, -21, 3, -9], [-1, -20, 0, -4]]) {
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(ex, ey); ctx.stroke();
    }
  }

  // Arms — straight, sleeves both sides; possessed hands end in small dark
  // claws instead of plain rounded fingertips.
  const armColor = cured ? '#8a9088' : '#7a8078';
  drawStraightArm(ctx, -7, -20, -9, -2, 4.2, armColor);
  drawStraightArm(ctx, 7, -20, 9, -2, 4.2, armColor);
  if (!cured) {
    ctx.fillStyle = '#181014';
    for (const [hx, hy, dir] of [[-9, -2, -1], [9, -2, 1]]) {
      for (const off of [-1.6, 0, 1.6]) {
        ctx.beginPath();
        ctx.moveTo(hx + off, hy - 1);
        ctx.lineTo(hx + off + dir * 0.6, hy + 2.6);
        ctx.lineTo(hx + off - dir * 0.6, hy + 2.4);
        ctx.closePath();
        ctx.fill();
      }
    }
  }

  // Head — sickly, cracked grey-green while possessed; warm and ordinary
  // once cured.
  ctx.fillStyle = cured ? '#d9ab7c' : '#a8ac8e';
  ctx.beginPath();
  ctx.arc(0, -32.5, 9, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.3);

  // Dark veins branching out from both eyes across the face — only while
  // possessed. Drawn before the stubble/eyes so they read as under the skin.
  if (!cured) {
    ctx.strokeStyle = 'rgba(70, 5, 35, 0.6)';
    ctx.lineWidth = 0.6;
    ctx.lineCap = 'round';
    const veinSets = [
      [[-3, -32.5], [-6, -34.5], [-8, -33]],
      [[-3, -32.5], [-5.5, -30], [-7, -28]],
      [[3, -32.5], [6, -34.5], [8, -33]],
      [[3, -32.5], [5.5, -30], [7, -28]],
      [[0, -30], [0, -27], [1, -25]],
    ];
    for (const pts of veinSets) {
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    }
  }

  // Patchy stubble instead of a full beard — a scatter of short dashes
  ctx.strokeStyle = 'rgba(60, 54, 44, 0.55)';
  ctx.lineWidth = 0.7;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = -0.3 + (i / 6) * 1.1;
    const sx = Math.sin(a) * 6.5, sy = -27 + Math.cos(a) * 5.5;
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx, sy + 1.4);
    ctx.stroke();
  }

  // A jagged, fanged grin — only while possessed. Sits low enough to clear
  // the stubble dashes above it.
  if (!cured) {
    ctx.strokeStyle = 'rgba(20, 4, 10, 0.75)';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-3.4, -25.4); ctx.lineTo(3.4, -25.4); ctx.stroke();
    ctx.fillStyle = '#e8dcd0';
    for (const fx of [-2.2, 2.2]) {
      ctx.beginPath();
      ctx.moveTo(fx - 0.6, -25.4);
      ctx.lineTo(fx + 0.6, -25.4);
      ctx.lineTo(fx, -23.6);
      ctx.closePath();
      ctx.fill();
    }
  }

  // Eyes — calm and matched once cured; both blown into glowing
  // slit-pupil rifts with cracks fanning outward while possessed.
  if (cured) {
    ctx.fillStyle = '#241a10';
    ctx.beginPath(); ctx.ellipse(-3, -32.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(3, -32.5, 1, 1.3, 0, 0, Math.PI * 2); ctx.fill();
  } else {
    const glowPulse = 0.65 + Math.sin(t * 5) * 0.3;
    for (const ex of [-3, 3]) {
      const glow = ctx.createRadialGradient(ex, -32.5, 0, ex, -32.5, 5.5);
      glow.addColorStop(0, `rgba(230, 20, 90, ${0.95 * glowPulse})`);
      glow.addColorStop(0.5, `rgba(170, 10, 90, ${0.5 * glowPulse})`);
      glow.addColorStop(1, 'rgba(170, 10, 90, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath(); ctx.arc(ex, -32.5, 5.5, 0, Math.PI * 2); ctx.fill();

      // Slit pupil — a thin vertical dark line through the glow
      ctx.strokeStyle = '#12060a';
      ctx.lineWidth = 0.9;
      ctx.beginPath(); ctx.moveTo(ex, -34.2); ctx.lineTo(ex, -30.8); ctx.stroke();

      ctx.strokeStyle = 'rgba(230, 20, 90, 0.75)';
      ctx.lineWidth = 0.6;
      for (const [dx, dy] of [[3.2, -1.5], [-2.6, -1.1], [3, 2.2], [-1.6, 2.6]]) {
        ctx.beginPath();
        ctx.moveTo(ex, -32.5);
        ctx.lineTo(ex + (ex < 0 ? -dx : dx), -32.5 + dy);
        ctx.stroke();
      }
    }
  }

  // Cap — dark knit, plainer than Morris's bandana, with a pair of curled
  // dark horns breaking through both sides while possessed.
  const capGrad = ctx.createLinearGradient(0, -44.7, 0, -35.5);
  capGrad.addColorStop(0, cured ? '#4a5048' : '#3a2c32');
  capGrad.addColorStop(1, cured ? '#262c26' : '#1a1016');
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.arc(0, -35.5, 9.2, Math.PI, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.2);
  ctx.fillStyle = cured ? '#343a34' : '#2a1c22';
  ctx.beginPath();
  ctx.arc(0, -35.8, 9.4, Math.PI * 1.02, Math.PI * 1.35);
  ctx.arc(0, -35.8, 8, Math.PI * 1.35, Math.PI * 1.02, true);
  ctx.fill();

  if (!cured) {
    for (const side of [-1, 1]) {
      const hx = side * 5.5;
      ctx.fillStyle = '#1c1014';
      ctx.beginPath();
      ctx.moveTo(hx, -41.5);
      ctx.quadraticCurveTo(hx + side * 5, -46, hx + side * 3.5, -51.5);
      ctx.quadraticCurveTo(hx + side * 4.5, -46.5, hx + side * 1.5, -42.5);
      ctx.closePath();
      ctx.fill(); toonOutline(ctx, 0.7);
      // A thin violet highlight along the horn's outer edge
      ctx.strokeStyle = 'rgba(200, 80, 150, 0.45)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(hx + side * 2, -43);
      ctx.lineTo(hx + side * 3, -49.5);
      ctx.stroke();
    }
  }

  ctx.restore();
}

// Naia: the Abyss Warden, found only in the Abyssal Lands (same `region`
// gate as Luca — see world/worldObjects.js). Same straight-armed build as
// Morris/Luca so she reads as part of the same cast, but everything else is
// deliberately the opposite of Luca's horror: a calm, hooded figure in a
// deep-water robe seamed with slow-pulsing bioluminescent teal, solid glowing
// cyan eyes with no pupil at all, and a handful of motes drifting lazily
// upward around her instead of Luca's churning red aura — eerie because
// she's clearly not fully of the surface world, not because anything's wrong
// with her.
export function drawNaia(ctx, npc, t) {
  const { x, y } = npc;
  const bob = Math.sin(t * 1.1 + x) * 0.7;
  const drift = Math.sin(t * 0.5 + x) * 1.1;

  drawShadow(ctx, x, y + 2, 12, 5, 0.4);

  // A slow-pulsing teal glow pooled underfoot, calm rather than alarming.
  const poolPulse = 0.5 + Math.sin(t * 0.9) * 0.35;
  const pool = ctx.createRadialGradient(x, y + 3, 2, x, y + 3, 22 + poolPulse * 4);
  pool.addColorStop(0, `rgba(67, 224, 255, ${0.22 * poolPulse})`);
  pool.addColorStop(1, 'rgba(67, 224, 255, 0)');
  ctx.fillStyle = pool;
  ctx.beginPath();
  ctx.ellipse(x, y + 3, 22 + poolPulse * 4, 9 + poolPulse * 2, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x + drift * 0.3, y + bob * 0.2);

  // A handful of bioluminescent motes drifting slowly upward — the calm
  // counterpart to Luca's guttering embers.
  ctx.save();
  for (let i = 0; i < 4; i++) {
    const cycle = ((t * 0.28 + i * 0.4) % 1);
    const mx = Math.sin(t * 0.6 + i * 2.4) * 9;
    const my = -20 - cycle * 34;
    ctx.globalAlpha = Math.sin(cycle * Math.PI) * 0.8;
    ctx.fillStyle = '#8dfff0';
    ctx.beginPath(); ctx.arc(mx, my, 1.1, 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Boots
  const bootGrad = ctx.createLinearGradient(-8, -4, 0, 8);
  bootGrad.addColorStop(0, '#1c3038'); bootGrad.addColorStop(1, '#0a1418');
  ctx.fillStyle = bootGrad;
  ctx.beginPath();
  ctx.ellipse(-4, 2, 3.6, 6.2, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);
  ctx.beginPath();
  ctx.ellipse(4, 2, 3.6, 6.2, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.1);

  // Robe — deep abyssal blue-black, longer and straighter than Morris/
  // Luca's coats, floor-length like something meant for cold water, not
  // walking on land.
  const robeGrad = ctx.createLinearGradient(0, -30, 0, 6);
  robeGrad.addColorStop(0, '#122a34');
  robeGrad.addColorStop(1, '#04141a');
  ctx.fillStyle = robeGrad;
  ctx.beginPath();
  ctx.moveTo(-9, 6);
  ctx.quadraticCurveTo(-12, -14, -6, -24);
  ctx.quadraticCurveTo(0, -28, 6, -24);
  ctx.quadraticCurveTo(12, -14, 9, 6);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.3);
  // A faint cool rim light on top of the toon outline — her robe is close
  // enough in value to the Abyssal Lands' own near-black water that the
  // usual warm-dark outline alone doesn't separate her from the background.
  // Kept thin and low-opacity on purpose: a hint of edge definition, not a
  // glowing cutout.
  ctx.strokeStyle = 'rgba(150, 220, 232, 0.22)';
  ctx.lineWidth = 0.6;
  ctx.stroke();

  // Bioluminescent seams running down the robe, pulsing slowly in sync with
  // the underfoot pool.
  ctx.strokeStyle = `rgba(141, 255, 240, ${0.35 + poolPulse * 0.35})`;
  ctx.lineWidth = 0.8;
  for (const [sx0, sy0, sx1, sy1] of [[-3, -22, -4, 2], [3, -22, 4, 2], [0, -20, 0, 4]]) {
    ctx.beginPath(); ctx.moveTo(sx0, sy0); ctx.lineTo(sx1, sy1); ctx.stroke();
  }

  // Arms — straight, sleeved, matching the robe's palette.
  drawStraightArm(ctx, -7, -20, -9, -2, 4.2, '#0e222a');
  drawStraightArm(ctx, 7, -20, 9, -2, 4.2, '#0e222a');

  // Head — pale blue-grey, calm.
  ctx.fillStyle = '#c4d4d8';
  ctx.beginPath();
  ctx.arc(0, -32.5, 9, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.3);

  // Eyes — solid glowing cyan discs, no pupil at all.
  const eyePulse = 0.7 + Math.sin(t * 2.2) * 0.25;
  for (const ex of [-3, 3]) {
    const glow = ctx.createRadialGradient(ex, -32.5, 0, ex, -32.5, 4.2);
    glow.addColorStop(0, `rgba(141, 255, 240, ${0.95 * eyePulse})`);
    glow.addColorStop(0.6, `rgba(67, 224, 255, ${0.6 * eyePulse})`);
    glow.addColorStop(1, 'rgba(67, 224, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(ex, -32.5, 4.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#eafffb';
    ctx.beginPath(); ctx.ellipse(ex, -32.5, 1.5, 1.9, 0, 0, Math.PI * 2); ctx.fill();
  }

  // Hood — deep, rounded, drawn well forward so the face sits in shadow
  // rather than out in the open like Morris's bandana or Luca's cap.
  const hoodGrad = ctx.createLinearGradient(0, -46, 0, -33);
  hoodGrad.addColorStop(0, '#0a1c24');
  hoodGrad.addColorStop(1, '#04101450');
  ctx.fillStyle = hoodGrad;
  ctx.beginPath();
  ctx.moveTo(-9.5, -30);
  ctx.quadraticCurveTo(-11.5, -44, -3, -47.5);
  ctx.quadraticCurveTo(0, -48.5, 3, -47.5);
  ctx.quadraticCurveTo(11.5, -44, 9.5, -30);
  ctx.quadraticCurveTo(6, -35, 0, -35.5);
  ctx.quadraticCurveTo(-6, -35, -9.5, -30);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.2);
  // A thin teal trim along the hood's edge, matching the robe seams.
  ctx.strokeStyle = 'rgba(141, 255, 240, 0.4)';
  ctx.lineWidth = 0.6;
  ctx.beginPath();
  ctx.moveTo(-9.5, -30);
  ctx.quadraticCurveTo(-11.5, -44, -3, -47.5);
  ctx.quadraticCurveTo(0, -48.5, 3, -47.5);
  ctx.quadraticCurveTo(11.5, -44, 9.5, -30);
  ctx.stroke();

  ctx.restore();
}

// The dialogue-popup scene for Naia — same "stands on their own patch of
// ground" treatment as drawLucaPortrait, but a calm deep-water backdrop
// (slow teal fog, no roiling red) instead of Luca's fogbound horror.
export function drawNaiaPortrait(ctx, w, h, t, pop = 0) {
  ctx.clearRect(0, 0, w, h);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#071f28');
  grad.addColorStop(1, '#020a10');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const pulse = 0.5 + Math.sin(t * 1.1) * 0.5;
  const glow = ctx.createRadialGradient(w * 0.5, h * 0.45, 10, w * 0.5, h * 0.45, w * 0.6);
  glow.addColorStop(0, `rgba(67, 224, 255, ${0.16 + pulse * 0.08})`);
  glow.addColorStop(1, 'rgba(67, 224, 255, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  const deckY = h * 0.86;
  ctx.fillStyle = '#0a1c22';
  ctx.fillRect(0, deckY, w, h - deckY);
  ctx.fillStyle = 'rgba(141, 255, 240, 0.16)';
  ctx.fillRect(0, deckY, w, 2);

  const scale = 2.6 + pop * 0.09;
  ctx.save();
  ctx.translate(w / 2, deckY - pop * 5);
  ctx.scale(scale, scale);
  drawNaia(ctx, { x: 0, y: 0 }, t);
  ctx.restore();
}

// The dialogue-popup scene for Luca — his figure standing on the dark,
// fogbound shore of the Abyssal Lands rather than the sunny dock, matching
// the "NPC standing at their own patch of ground" treatment Morris and the
// shopkeepers get (see drawMorrisAtDock / drawShopNPCs.js's
// drawShopNpcAtStand). `stage` toggles the same possessed-vs-cured look
// drawLuca uses.
export function drawLucaPortrait(ctx, w, h, t, stage, pop = 0) {
  ctx.clearRect(0, 0, w, h);
  const cured = stage === 'complete' || stage === 'thanked';

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, cured ? '#123847' : '#200a18');
  grad.addColorStop(1, cured ? '#02202f' : '#050006');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  if (!cured) {
    const pulse = 0.5 + Math.sin(t * 1.6) * 0.5;
    const fog = ctx.createRadialGradient(w * 0.65, h * 0.4, 10, w * 0.65, h * 0.4, w * 0.55);
    fog.addColorStop(0, `rgba(190, 20, 90, ${0.22 + pulse * 0.08})`);
    fog.addColorStop(1, 'rgba(190, 20, 90, 0)');
    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, w, h);

    // A second, cooler violet wash on the opposite side so the fog reads
    // as roiling rather than a single flat glow.
    const fog2 = ctx.createRadialGradient(w * 0.2, h * 0.6, 8, w * 0.2, h * 0.6, w * 0.4);
    fog2.addColorStop(0, `rgba(120, 30, 160, ${0.14 + (1 - pulse) * 0.06})`);
    fog2.addColorStop(1, 'rgba(120, 30, 160, 0)');
    ctx.fillStyle = fog2;
    ctx.fillRect(0, 0, w, h);
  }

  const deckY = h * 0.86;
  ctx.fillStyle = cured ? '#3a3320' : '#1c0e14';
  ctx.fillRect(0, deckY, w, h - deckY);
  ctx.fillStyle = cured ? 'rgba(255,180,84,0.14)' : 'rgba(200,20,90,0.22)';
  ctx.fillRect(0, deckY, w, 2);

  const scale = 2.6 + pop * 0.09;
  ctx.save();
  ctx.translate(w / 2, deckY - pop * 5);
  ctx.scale(scale, scale);
  drawLuca(ctx, { x: 0, y: 0 }, t, stage);
  ctx.restore();
}

export function drawMorrisBoat(ctx, x, y, t) {
  const bob = Math.sin(t * 1.6) * 2.2;
  ctx.save();
  ctx.translate(x, y + bob);

  ctx.globalAlpha = 0.35;
  ctx.fillStyle = '#020c12';
  ctx.beginPath();
  ctx.ellipse(0, 13, 26, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#5a3f28';
  ctx.beginPath();
  ctx.moveTo(-24, 4);
  ctx.quadraticCurveTo(0, 15, 24, 4);
  ctx.lineTo(19, -3);
  ctx.lineTo(-19, -3);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.3)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.fillStyle = '#6b4a30';
  ctx.fillRect(-16, -5, 32, 3);

  // Oars resting across the hull
  ctx.strokeStyle = '#3c2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-30, -1);
  ctx.lineTo(30, 5);
  ctx.stroke();

  ctx.restore();
}
