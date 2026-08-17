// Region-specific structural dressing for the top-down world — not a color
// wash, actual different terrain features per island (palms, pines, dead
// trees, driftwood, crystal spikes...). Always non-collide and kept along
// the water's edge or the outer corners, well clear of the main walking
// lane between the water and the stalls, so nothing here ever gets in the
// player's way. Every shape uses gradient shading + a cartoon outline to
// match the polish level of the characters, instead of flat single-color
// silhouettes.
import { drawShadow } from './drawShadow.js';
import { toonOutline } from './toon.js';

function palmTree(x, y, seedT) {
  return (ctx, t) => {
    const sway = Math.sin(t * 0.6 + seedT) * 0.06;
    drawShadow(ctx, x, y + 3, 15, 5, 0.32);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway * 0.3);

    // Trunk — gradient bark with segment rings, curving toward the fronds
    const trunkGrad = ctx.createLinearGradient(-4, 0, 5, -46);
    trunkGrad.addColorStop(0, '#5c3f24');
    trunkGrad.addColorStop(1, '#9a7248');
    ctx.strokeStyle = trunkGrad;
    ctx.lineWidth = 5.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.quadraticCurveTo(5, -26, 3, -46);
    ctx.stroke();
    toonOutline(ctx, 1);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 0.8;
    for (let ny = -4; ny > -44; ny -= 7) {
      const bx = (ny + 46) * (3 / -46) + 0;
      ctx.beginPath(); ctx.moveTo(bx - 2.4, ny); ctx.lineTo(bx + 2.4, ny - 1); ctx.stroke();
    }

    // Fronds — filled tapered leaves with a center vein, not just strokes
    const fronds = ['#3a7245', '#4d9159', '#3a7245', '#4d9159', '#3a7245', '#5ba566'];
    for (let i = 0; i < 6; i++) {
      const ang = (i / 5 - 0.5) * Math.PI * 1.25 + sway;
      const len = 24 + (i % 2) * 3;
      const ex = 3 + Math.cos(ang) * len, ey = -46 + Math.sin(ang) * (len * 0.45) - 6;
      const midx = 3 + Math.cos(ang) * len * 0.55, midy = -46 + Math.sin(ang) * (len * 0.3) - 7;
      const perp = ang + Math.PI / 2;
      const spread = 3.4;
      ctx.fillStyle = fronds[i];
      ctx.beginPath();
      ctx.moveTo(3, -46);
      ctx.quadraticCurveTo(midx + Math.cos(perp) * spread, midy + Math.sin(perp) * spread, ex, ey);
      ctx.quadraticCurveTo(midx - Math.cos(perp) * spread, midy - Math.sin(perp) * spread, 3, -46);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.9; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.moveTo(3, -46); ctx.lineTo(midx, midy); ctx.stroke();
    }

    // Coconuts, shaded like little spheres
    for (const [cx, cy] of [[-1.5, -42], [3.5, -40.5], [1, -44.5]]) {
      const coGrad = ctx.createRadialGradient(cx - 0.6, cy - 0.6, 0.3, cx, cy, 2.1);
      coGrad.addColorStop(0, '#8a6b48');
      coGrad.addColorStop(1, '#3f2c18');
      ctx.fillStyle = coGrad;
      ctx.beginPath(); ctx.arc(cx, cy, 1.9, 0, Math.PI * 2); ctx.fill();
      toonOutline(ctx, 0.7);
    }
    ctx.restore();
  };
}

function pineTree(x, y) {
  return (ctx) => {
    drawShadow(ctx, x, y + 2, 13, 4.5, 0.32);
    ctx.save();
    ctx.translate(x, y);

    const trunkGrad = ctx.createLinearGradient(-2, -6, 2, 2);
    trunkGrad.addColorStop(0, '#241a10');
    trunkGrad.addColorStop(1, '#4a3320');
    ctx.fillStyle = trunkGrad;
    ctx.fillRect(-2, -6, 4, 8);
    toonOutline(ctx, 0.9);

    const tiers = [[-17, -8, 17, 0], [-14, -20, 14, -8], [-11, -32, 11, -18], [-6.5, -43, 6.5, -30]];
    for (const [x0, y0, x1, y1] of tiers) {
      const tGrad = ctx.createLinearGradient(0, y1, 0, y0 - 8);
      tGrad.addColorStop(0, '#1f4530');
      tGrad.addColorStop(1, '#3d7a4e');
      ctx.fillStyle = tGrad;
      ctx.beginPath();
      ctx.moveTo(0, y0 - 8);
      ctx.lineTo(x1, y1);
      ctx.lineTo(x0, y1);
      ctx.closePath();
      ctx.fill();
      toonOutline(ctx, 1);
    }
    ctx.fillStyle = 'rgba(240,246,241,0.85)';
    for (const [, , x1, y1] of tiers) {
      ctx.beginPath();
      ctx.moveTo(x1 * 0.28, y1 - 2);
      ctx.lineTo(x1 * 0.62, y1);
      ctx.lineTo(0, y1 + 2.8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  };
}

function deadTree(x, y, seedT) {
  return (ctx, t) => {
    const sway = Math.sin(t * 0.5 + seedT) * 0.03;
    drawShadow(ctx, x, y + 2, 13, 4, 0.3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);

    const barkGrad = ctx.createLinearGradient(-14, 0, 8, -42);
    barkGrad.addColorStop(0, '#0f1613');
    barkGrad.addColorStop(1, '#2f3c34');
    ctx.strokeStyle = barkGrad;
    ctx.lineWidth = 3.8;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 2); ctx.lineTo(-2, -30);
    ctx.moveTo(-2, -14); ctx.lineTo(-14, -26);
    ctx.moveTo(-2, -22); ctx.lineTo(8, -34);
    ctx.moveTo(-2, -30); ctx.lineTo(-10, -42);
    ctx.stroke();
    toonOutline(ctx, 1);

    // Broken knots and stubs, so the trunk reads as dead/rotten
    ctx.fillStyle = '#141e1a';
    for (const [kx, ky] of [[-2, -18], [-2, -26], [3, -34]]) {
      ctx.beginPath(); ctx.arc(kx, ky, 1.2, 0, Math.PI * 2); ctx.fill();
    }

    // Hanging moss wisps, gradient-faded
    for (const [mx, my] of [[-10, -22], [4, -28], [-6, -36]]) {
      const mossGrad = ctx.createLinearGradient(mx, my, mx - 1, my + 14);
      mossGrad.addColorStop(0, 'rgba(120, 150, 120, 0.5)');
      mossGrad.addColorStop(1, 'rgba(120, 150, 120, 0)');
      ctx.strokeStyle = mossGrad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(mx, my);
      ctx.quadraticCurveTo(mx + 1, my + 8, mx - 1, my + 14);
      ctx.stroke();
    }
    ctx.restore();
  };
}

function driftwoodPile(x, y) {
  return (ctx) => {
    ctx.save();
    ctx.translate(x, y);
    drawShadow(ctx, 0, 5, 18, 5, 0.28);

    for (const [x0, y0, x1, y1, lw, top, bot] of [
      [-14, 2, 12, -4, 5, '#a8917a', '#6b5c48'],
      [-10, -3, 14, 3, 4.4, '#8a7860', '#5c4c3a'],
    ]) {
      const grad = ctx.createLinearGradient(x0, y0, x1, y1);
      grad.addColorStop(0, top);
      grad.addColorStop(1, bot);
      ctx.strokeStyle = grad;
      ctx.lineWidth = lw;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
      toonOutline(ctx, 0.8);
    }
    ctx.strokeStyle = 'rgba(60,45,30,0.3)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(-8, 0); ctx.lineTo(8, -1); ctx.stroke();

    ctx.fillStyle = '#eae0cf';
    ctx.beginPath(); ctx.ellipse(-4, -6, 3, 2, 0.4, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.6);
    ctx.fillStyle = '#e6c8b8';
    ctx.beginPath(); ctx.moveTo(6, -6); ctx.lineTo(9, -10); ctx.lineTo(11, -5); ctx.closePath(); ctx.fill();
    toonOutline(ctx, 0.6);
    ctx.restore();
  };
}

function crystalSpike(x, y, seedT) {
  return (ctx, t) => {
    const pulse = 0.6 + Math.sin(t * 1.6 + seedT) * 0.3;
    drawShadow(ctx, x, y + 2, 12, 4, 0.32);
    ctx.save();
    ctx.translate(x, y);
    const glow = ctx.createRadialGradient(0, -14, 0, 0, -14, 28);
    glow.addColorStop(0, `rgba(67, 224, 255, ${0.4 * pulse})`);
    glow.addColorStop(1, 'rgba(67, 224, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, -14, 28, 0, Math.PI * 2); ctx.fill();

    // A small cluster: one tall spike flanked by two shorter shards
    const shards = [
      { pts: [[-6, 2], [-2, -24], [2, -30], [5, -20], [7, 2]], grad: ['#26364a', '#0f1a24'] },
      { pts: [[-11, 2], [-9, -12], [-6, -15], [-4, -6], [-3, 2]], grad: ['#1c2a38', '#0a121a'] },
      { pts: [[6, 2], [8, -10], [11, -13], [13, -4], [12, 2]], grad: ['#1c2a38', '#0a121a'] },
    ];
    for (const shard of shards) {
      const g = ctx.createLinearGradient(0, -30, 0, 2);
      g.addColorStop(0, shard.grad[0]);
      g.addColorStop(1, shard.grad[1]);
      ctx.fillStyle = g;
      ctx.beginPath();
      shard.pts.forEach(([px, py], i) => (i === 0 ? ctx.moveTo(px, py) : ctx.lineTo(px, py)));
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = `rgba(67, 224, 255, ${0.55 * pulse})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
    // Bright inner facet lines
    ctx.strokeStyle = `rgba(200, 250, 255, ${0.85 * pulse})`;
    ctx.lineWidth = 1.1;
    ctx.beginPath(); ctx.moveTo(0, -6); ctx.lineTo(0, -27); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-7, -3); ctx.lineTo(-6.5, -13); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(9, -3); ctx.lineTo(9.5, -11); ctx.stroke();
    ctx.restore();
  };
}

function bonePile(x, y) {
  return (ctx) => {
    ctx.save();
    ctx.translate(x, y);
    drawShadow(ctx, 0, 4, 14, 4, 0.3);
    ctx.strokeStyle = '#c9c3ae';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-9, 2); ctx.lineTo(9, -3); ctx.stroke();
    toonOutline(ctx, 0.9);
    for (const [bx, by] of [[-9, 2], [9, -3]]) {
      ctx.fillStyle = '#e0dccb';
      ctx.beginPath(); ctx.arc(bx, by, 2.2, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.6);
    }
    // A small skull, the centerpiece of the pile
    const skullGrad = ctx.createRadialGradient(-1, -3, 0.5, 1, -1, 6);
    skullGrad.addColorStop(0, '#f0ece0');
    skullGrad.addColorStop(1, '#c9c3ae');
    ctx.fillStyle = skullGrad;
    ctx.beginPath(); ctx.ellipse(0, -1.5, 4.6, 4, 0, 0, Math.PI * 2); ctx.fill();
    toonOutline(ctx, 0.9);
    ctx.fillStyle = '#c9c3ae';
    ctx.beginPath(); ctx.moveTo(-2.4, 1.5); ctx.lineTo(-1.4, 4); ctx.lineTo(0, 1.8); ctx.lineTo(1.4, 4); ctx.lineTo(2.4, 1.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#1c2a38';
    ctx.beginPath(); ctx.arc(-1.6, -2, 1.1, 0, Math.PI * 2); ctx.arc(1.6, -1.4, 1.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
}

// A run of triangular pennant flags strung between two x positions,
// drawn well above head height so it never reads as something to walk
// into — pure overhead set-dressing for the home dock.
function pennantString(x1, y, x2, seed) {
  const colors = ['#7a2e2e', '#ffb454', '#5fe3c0', '#7a2e2e', '#ffb454'];
  return (ctx, t) => {
    const sag = 10 + Math.sin(t * 0.7 + seed) * 1.5;
    ctx.strokeStyle = 'rgba(240,226,196,0.5)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x1, y);
    ctx.quadraticCurveTo((x1 + x2) / 2, y + sag, x2, y);
    ctx.stroke();
    const count = Math.max(3, Math.round((x2 - x1) / 26));
    for (let i = 1; i < count; i++) {
      const frac = i / count;
      const fx = x1 + (x2 - x1) * frac;
      const fy = y + sag * 4 * frac * (1 - frac);
      const flutter = Math.sin(t * 2 + i + seed) * 1.5;
      const base = colors[i % colors.length];
      const grad = ctx.createLinearGradient(fx, fy, fx + flutter, fy + 8);
      grad.addColorStop(0, base);
      grad.addColorStop(1, 'rgba(0,0,0,0.25)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(fx - 4, fy);
      ctx.lineTo(fx + 4, fy);
      ctx.lineTo(fx + flutter, fy + 8);
      ctx.closePath();
      ctx.fill();
      toonOutline(ctx, 0.6);
    }
  };
}

// A bigger set-piece than the plain chests elsewhere: a pile of chests
// with gold spilling out, and a parrot keeping watch — "way cooler," not
// just "one more crate."
function treasurePile(x, y) {
  return (ctx) => {
    ctx.save();
    ctx.translate(x, y);
    drawShadow(ctx, 0, 3, 20, 6, 0.34);

    const woodGrad = ctx.createLinearGradient(-16, -10, -16, 2);
    woodGrad.addColorStop(0, '#6b4a30'); woodGrad.addColorStop(1, '#3c2a1a');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(-16, -10, 30, 12);
    toonOutline(ctx, 1);
    const woodGrad2 = ctx.createLinearGradient(-6, -20, -6, -8);
    woodGrad2.addColorStop(0, '#7a5638'); woodGrad2.addColorStop(1, '#5a3f28');
    ctx.fillStyle = woodGrad2;
    ctx.fillRect(-6, -20, 22, 12);
    toonOutline(ctx, 1);
    const lidGrad = ctx.createLinearGradient(-6, -32, -6, -20);
    lidGrad.addColorStop(0, '#8a6239'); lidGrad.addColorStop(1, '#5a3f28');
    ctx.fillStyle = lidGrad;
    ctx.beginPath();
    ctx.moveTo(-6, -20); ctx.quadraticCurveTo(5, -32, 16, -20); ctx.closePath(); ctx.fill();
    toonOutline(ctx, 1);
    ctx.fillStyle = '#ffb454';
    ctx.fillRect(-6, -21, 22, 2);
    ctx.fillRect(3, -21, 3, 12);
    toonOutline(ctx, 0.6);

    // Spilling gold coins, each with a shine highlight
    for (const [gx, gy, r] of [[-12, -3, 2.6], [-6, 1, 2.2], [0, -1, 2.8], [6, 2, 2.2], [12, -2, 2.4], [-2, -6, 2]]) {
      const coinGrad = ctx.createRadialGradient(gx - r * 0.4, gy - r * 0.4, r * 0.2, gx, gy, r);
      coinGrad.addColorStop(0, '#fff0c4');
      coinGrad.addColorStop(1, '#d69a4a');
      ctx.fillStyle = coinGrad;
      ctx.beginPath(); ctx.arc(gx, gy, r, 0, Math.PI * 2); ctx.fill();
      toonOutline(ctx, 0.6);
    }

    // A parrot perched on top, keeping watch
    ctx.save();
    ctx.translate(9, -30);
    ctx.fillStyle = '#5fe3c0';
    ctx.beginPath(); ctx.ellipse(0, 0, 4, 5.5, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.8);
    ctx.fillStyle = '#ff6f59';
    ctx.beginPath(); ctx.arc(0, -4.5, 2.4, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.7);
    ctx.fillStyle = '#ffb454';
    ctx.beginPath(); ctx.moveTo(2, -5); ctx.lineTo(5.5, -4); ctx.lineTo(2, -3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#ff8ad1';
    ctx.beginPath(); ctx.ellipse(-3, 2, 1.8, 4, 0.3, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.6);
    ctx.fillStyle = '#0c1a1e';
    ctx.beginPath(); ctx.arc(1, -5, 0.7, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    ctx.restore();
  };
}

// A wooden A-frame with a fishing net draped over it, drying — the kind of
// detail that makes a working dock read as "in use," not just decorated.
function netRack(x, y) {
  return (ctx) => {
    ctx.save();
    ctx.translate(x, y);
    drawShadow(ctx, 0, 3, 16, 5, 0.3);
    const frameGrad = ctx.createLinearGradient(-14, 2, 14, -30);
    frameGrad.addColorStop(0, '#241a10');
    frameGrad.addColorStop(1, '#5a3f28');
    ctx.strokeStyle = frameGrad;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-14, 2); ctx.lineTo(0, -30); ctx.lineTo(14, 2);
    ctx.moveTo(-8, -8); ctx.lineTo(8, -8);
    ctx.stroke();
    toonOutline(ctx, 1);
    ctx.strokeStyle = 'rgba(196,168,120,0.6)';
    ctx.lineWidth = 1;
    for (let i = -12; i <= 12; i += 4) {
      ctx.beginPath();
      ctx.moveTo(i, -6 - Math.abs(i) * 1.3);
      ctx.quadraticCurveTo(i * 0.5, -2, 0, -4);
      ctx.stroke();
    }
    for (let ny = -20; ny < 0; ny += 5) {
      ctx.beginPath();
      ctx.moveTo(-12 + (ny + 20) * 0.6, ny);
      ctx.lineTo(12 - (ny + 20) * 0.6, ny);
      ctx.stroke();
    }
    ctx.restore();
  };
}

// --- Unique per-region landmarks — one big signature set-piece each, found
// nowhere else, so the region reads unmistakably even at a glance. ---

// Tropical Island: a carved tiki totem with a glowing painted mask, two
// stacked carvings for a taller, more elaborate idol.
function tikiTotem(x, y, seedT) {
  return (ctx, t) => {
    const glow = 0.6 + Math.sin(t * 1.4 + seedT) * 0.3;
    drawShadow(ctx, x, y + 2, 13, 4.5, 0.34);
    ctx.save();
    ctx.translate(x, y);

    const woodGrad = ctx.createLinearGradient(-7, -50, 7, 0);
    woodGrad.addColorStop(0, '#4a331e');
    woodGrad.addColorStop(0.5, '#8a6239');
    woodGrad.addColorStop(1, '#4a331e');
    ctx.fillStyle = woodGrad;
    ctx.fillRect(-7, -50, 14, 50);
    toonOutline(ctx, 1.3);
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1;
    for (let ny = -46; ny < 0; ny += 11) { ctx.beginPath(); ctx.moveTo(-7, ny); ctx.lineTo(7, ny); ctx.stroke(); }

    function face(cy, tone) {
      ctx.fillStyle = `rgba(255, 111, 89, ${tone})`;
      ctx.beginPath(); ctx.arc(-3, cy, 1.9, 0, Math.PI * 2); ctx.arc(3, cy, 1.9, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(35,24,14,0.6)'; ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(-3, cy, 1.9, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(3, cy, 1.9, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = '#241708';
      ctx.beginPath(); ctx.moveTo(-4.5, cy + 8); ctx.lineTo(4.5, cy + 8); ctx.lineTo(0, cy + 14); ctx.closePath(); ctx.fill();
      toonOutline(ctx, 0.7);
    }
    face(-38, 0.55 + glow * 0.3);
    face(-14, 0.4 + glow * 0.25);

    const halo = ctx.createRadialGradient(0, -38, 0, 0, -38, 22);
    halo.addColorStop(0, `rgba(255, 180, 84, ${0.25 * glow})`);
    halo.addColorStop(1, 'rgba(255, 180, 84, 0)');
    ctx.fillStyle = halo;
    ctx.beginPath(); ctx.arc(0, -38, 22, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
}

// Seaside Bay: a wrecked hull's broken ribs, half-buried, with a torn
// scrap of sail still clinging to one.
function shipwreckRibs(x, y) {
  return (ctx) => {
    ctx.save();
    ctx.translate(x, y);
    drawShadow(ctx, 0, 2, 28, 6, 0.32);
    const ribs = [[-16, 22, -0.3], [-4, 30, -0.08], [8, 26, 0.15], [19, 16, 0.35]];
    for (const [rx, h, lean] of ribs) {
      const grad = ctx.createLinearGradient(rx, 2, rx + lean * 20, -h);
      grad.addColorStop(0, '#2f251a');
      grad.addColorStop(1, '#6b5642');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 3.6;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(rx, 2);
      ctx.quadraticCurveTo(rx + lean * 14, -h * 0.6, rx + lean * 20, -h);
      ctx.stroke();
      toonOutline(ctx, 0.9);
    }
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.moveTo(-18, -2); ctx.lineTo(22, -6); ctx.stroke();

    // Torn sail scrap caught on the tallest rib
    ctx.fillStyle = 'rgba(224, 220, 203, 0.55)';
    ctx.beginPath();
    ctx.moveTo(-4, -22); ctx.quadraticCurveTo(2, -18, -1, -12); ctx.quadraticCurveTo(-8, -16, -4, -22);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 0.7; ctx.stroke();
    ctx.restore();
  };
}

// Dark Waters: a colossal fish-rib arch looming over the water's edge, with
// a blunt skull at its base — foreshadowing the gargantuan things this
// region is known for.
function giantFishSkeletonArch(x, y) {
  return (ctx) => {
    ctx.save();
    ctx.translate(x, y);
    const boneGrad = ctx.createLinearGradient(0, -56, 0, 4);
    boneGrad.addColorStop(0, 'rgba(230, 226, 210, 0.75)');
    boneGrad.addColorStop(1, 'rgba(180, 176, 160, 0.5)');
    ctx.strokeStyle = boneGrad;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-46, 4);
    ctx.quadraticCurveTo(-42, -46, 0, -56);
    ctx.quadraticCurveTo(42, -46, 46, 4);
    ctx.stroke();
    toonOutline(ctx, 0.8);
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = 'rgba(220, 216, 200, 0.5)';
    for (let i = -5; i <= 5; i++) {
      const frac = i / 5;
      const bx = frac * 40, by = -56 + Math.abs(frac) * 46 + 4;
      ctx.beginPath();
      ctx.moveTo(bx, by - 8);
      ctx.lineTo(bx, by + 8);
      ctx.stroke();
    }
    // Skull at one base, half-buried
    const skullGrad = ctx.createRadialGradient(-44, 0, 1, -46, 2, 10);
    skullGrad.addColorStop(0, '#e8e4d4');
    skullGrad.addColorStop(1, '#a8a494');
    ctx.fillStyle = skullGrad;
    ctx.beginPath(); ctx.ellipse(-46, 2, 9, 7, 0.2, 0, Math.PI * 2); ctx.fill();
    toonOutline(ctx, 1);
    ctx.fillStyle = '#1c2a38';
    ctx.beginPath(); ctx.arc(-49, 0, 1.6, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
}

// Dark Waters: a drifting will-o'-wisp light over the murk.
function willOWisp(x, y, seedT) {
  return (ctx, t) => {
    const bob = Math.sin(t * 0.8 + seedT) * 6;
    const flicker = 0.4 + Math.sin(t * 3 + seedT) * 0.25;
    const glow = ctx.createRadialGradient(x, y + bob, 0, x, y + bob, 18);
    glow.addColorStop(0, `rgba(143, 233, 217, ${0.55 * flicker})`);
    glow.addColorStop(0.5, `rgba(90, 200, 190, ${0.25 * flicker})`);
    glow.addColorStop(1, 'rgba(143, 233, 217, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(x, y + bob, 18, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(220, 246, 238, ${0.8 * flicker})`;
    ctx.beginPath(); ctx.arc(x, y + bob, 2.2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = `rgba(255, 255, 255, ${0.9 * flicker})`;
    ctx.beginPath(); ctx.arc(x - 0.6, y + bob - 0.6, 0.7, 0, Math.PI * 2); ctx.fill();
  };
}

// Mountain Isle: a cascading waterfall down a cliff face, with a foaming
// pool and a soft mist at the base.
function waterfallCliff(x, y) {
  return (ctx, t) => {
    ctx.save();
    ctx.translate(x, y);
    const rockGrad = ctx.createLinearGradient(-24, -50, 24, 4);
    rockGrad.addColorStop(0, '#3f454f');
    rockGrad.addColorStop(0.5, '#5c6470');
    rockGrad.addColorStop(1, '#3f454f');
    ctx.fillStyle = rockGrad;
    ctx.beginPath();
    ctx.moveTo(-24, 4); ctx.lineTo(-18, -50); ctx.lineTo(18, -50); ctx.lineTo(24, 4);
    ctx.closePath(); ctx.fill();
    toonOutline(ctx, 1.3);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-10, -46); ctx.lineTo(-6, 2); ctx.moveTo(8, -44); ctx.lineTo(10, 0); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(-16, -44); ctx.lineTo(-13, 0); ctx.stroke();

    const waterGrad = ctx.createLinearGradient(0, -48, 0, 4);
    waterGrad.addColorStop(0, 'rgba(238, 246, 248, 0.95)');
    waterGrad.addColorStop(1, 'rgba(200, 230, 236, 0.7)');
    ctx.fillStyle = waterGrad;
    ctx.beginPath();
    for (let fy = -48; fy <= 4; fy += 4) {
      const wob = Math.sin(t * 4 + fy * 0.3) * 1.6;
      ctx.rect(-6 + wob, fy, 12, 3);
    }
    ctx.fill();
    // Foaming pool at the base, with ripple rings
    ctx.fillStyle = 'rgba(238,246,248,0.45)';
    ctx.beginPath(); ctx.ellipse(0, 6, 15, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(255,255,255,${0.35 + Math.sin(t * 2) * 0.15})`;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(0, 6, 10, 3, 0, 0, Math.PI * 2); ctx.stroke();
    // Rising mist
    ctx.fillStyle = 'rgba(238,246,248,0.15)';
    ctx.beginPath(); ctx.ellipse(0, -4, 12, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
}

// Mountain Isle: colorful prayer flags strung between posts, snapping in
// the cold wind.
function prayerFlags(x1, y, x2, seed) {
  const colors = ['#5b8cff', '#eef6f8', '#ff6f59', '#ffd08a', '#4d8f57'];
  return (ctx, t) => {
    ctx.strokeStyle = 'rgba(240,246,248,0.55)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(x2, y - 4); ctx.stroke();
    const count = Math.max(4, Math.round((x2 - x1) / 20));
    for (let i = 1; i < count; i++) {
      const frac = i / count;
      const fx = x1 + (x2 - x1) * frac, fy = y - 4 * frac;
      const flap = Math.sin(t * 3 + i + seed) * 2;
      const base = colors[i % colors.length];
      const grad = ctx.createLinearGradient(fx, fy, fx + flap, fy + 6);
      grad.addColorStop(0, base);
      grad.addColorStop(1, 'rgba(0,0,0,0.2)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(fx - 3.5, fy);
      ctx.lineTo(fx + 3.5, fy);
      ctx.lineTo(fx + flap, fy + 6);
      ctx.closePath();
      ctx.fill();
      toonOutline(ctx, 0.5);
    }
  };
}

// Abyssal Lands: a leviathan's rib arch with a skull and faintly glowing
// eye-sockets.
function leviathanArch(x, y) {
  return (ctx, t) => {
    const pulse = 0.5 + Math.sin(t * 1.2) * 0.3;
    ctx.save();
    ctx.translate(x, y);
    const boneGrad = ctx.createLinearGradient(0, -58, 0, 4);
    boneGrad.addColorStop(0, '#2a3a4a');
    boneGrad.addColorStop(1, '#141c26');
    ctx.strokeStyle = boneGrad;
    ctx.lineWidth = 4.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-44, 4);
    ctx.quadraticCurveTo(-40, -48, 0, -58);
    ctx.quadraticCurveTo(40, -48, 44, 4);
    ctx.stroke();
    toonOutline(ctx, 1);
    ctx.strokeStyle = `rgba(67, 224, 255, ${0.5 * pulse})`;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-44, 4);
    ctx.quadraticCurveTo(-40, -48, 0, -58);
    ctx.quadraticCurveTo(40, -48, 44, 4);
    ctx.stroke();

    // A skull hangs at the arch's peak
    const skullGrad = ctx.createRadialGradient(-1, -60, 1, 0, -58, 9);
    skullGrad.addColorStop(0, '#3a4a5a');
    skullGrad.addColorStop(1, '#1c2a38');
    ctx.fillStyle = skullGrad;
    ctx.beginPath(); ctx.ellipse(0, -58, 8, 6.5, 0, 0, Math.PI * 2); ctx.fill();
    toonOutline(ctx, 1);
    ctx.fillStyle = `rgba(67, 224, 255, ${0.8 * pulse})`;
    ctx.beginPath(); ctx.arc(-3, -59, 1.6, 0, Math.PI * 2); ctx.arc(3, -59, 1.6, 0, Math.PI * 2); ctx.fill();
    const eyeGlow = ctx.createRadialGradient(0, -59, 0, 0, -59, 14);
    eyeGlow.addColorStop(0, `rgba(67, 224, 255, ${0.3 * pulse})`);
    eyeGlow.addColorStop(1, 'rgba(67, 224, 255, 0)');
    ctx.fillStyle = eyeGlow;
    ctx.beginPath(); ctx.arc(0, -59, 14, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  };
}

// Abyssal Lands: a crack in the ground glowing with cyan light, with a few
// drifting embers of light rising out of it.
function voidRift(x, y, seedT) {
  return (ctx, t) => {
    const pulse = 0.5 + Math.sin(t * 1.8 + seedT) * 0.3;
    ctx.save();
    ctx.translate(x, y);
    const glow = ctx.createRadialGradient(0, 0, 0, 0, 0, 24);
    glow.addColorStop(0, `rgba(67, 224, 255, ${0.32 * pulse})`);
    glow.addColorStop(1, 'rgba(67, 224, 255, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.ellipse(0, 0, 24, 10, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(5, 10, 14, 0.6)';
    ctx.beginPath(); ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = `rgba(166, 242, 255, ${0.85 * pulse})`;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-14, 2); ctx.lineTo(-4, -3); ctx.lineTo(2, 2); ctx.lineTo(14, -2);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const ex = -6 + i * 6;
      const ey = -6 - ((t * 14 + seedT * 20 + i * 30) % 22);
      ctx.fillStyle = `rgba(166, 242, 255, ${0.5 * pulse * (1 - Math.abs(ey) / 28)})`;
      ctx.beginPath(); ctx.arc(ex, ey, 1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };
}

// The home dock's own signature: a second, larger galleon anchored off the
// jetty — found nowhere but home port.
function homeGalleon(x, y) {
  return (ctx, t) => {
    const bob = Math.sin(t * 0.7) * 2;
    ctx.save();
    ctx.translate(x, y + bob);
    const hullGrad = ctx.createLinearGradient(0, -4, 0, 16);
    hullGrad.addColorStop(0, '#5a3f28');
    hullGrad.addColorStop(1, '#2c1e10');
    ctx.fillStyle = hullGrad;
    ctx.beginPath();
    ctx.moveTo(-30, 6); ctx.quadraticCurveTo(0, 16, 30, 6); ctx.lineTo(24, -4); ctx.lineTo(-24, -4);
    ctx.closePath(); ctx.fill();
    toonOutline(ctx, 1.2);
    ctx.fillStyle = 'rgba(255,180,84,0.16)';
    ctx.fillRect(-24, -4, 48, 2.4);
    for (const px of [-16, -4, 8, 20]) {
      ctx.fillStyle = '#1c1410';
      ctx.beginPath(); ctx.arc(px, 1, 1.6, 0, Math.PI * 2); ctx.fill();
    }

    ctx.strokeStyle = '#2c2117'; ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.moveTo(-4, -4); ctx.lineTo(-4, -40); ctx.stroke();
    toonOutline(ctx, 0.8);

    const sailGrad = ctx.createLinearGradient(-4, -36, 14, -18);
    sailGrad.addColorStop(0, '#f0e6d0');
    sailGrad.addColorStop(1, '#cfc2a4');
    ctx.fillStyle = sailGrad;
    ctx.beginPath(); ctx.moveTo(-4, -36); ctx.lineTo(14, -26); ctx.lineTo(-4, -18); ctx.closePath(); ctx.fill();
    toonOutline(ctx, 0.9);

    ctx.fillStyle = '#7a2e2e';
    ctx.beginPath(); ctx.moveTo(-4, -38); ctx.lineTo(2, -34); ctx.lineTo(-4, -30); ctx.closePath(); ctx.fill();
    toonOutline(ctx, 0.6);
    ctx.restore();
  };
}

// Tropical Island: a lit tiki torch, a smaller cousin of the totem.
function tikiTorch(x, y, seedT) {
  return (ctx, t) => {
    const flicker = 0.85 + Math.sin(t * 7 + seedT) * 0.1 + Math.sin(t * 3.3 + seedT) * 0.05;
    drawShadow(ctx, x, y + 2, 8, 3, 0.28);
    ctx.save();
    ctx.translate(x, y);
    const poleGrad = ctx.createLinearGradient(-2, -30, 2, 2);
    poleGrad.addColorStop(0, '#8a6239'); poleGrad.addColorStop(1, '#4a331e');
    ctx.strokeStyle = poleGrad;
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(0, 2); ctx.lineTo(0, -30); ctx.stroke();
    toonOutline(ctx, 0.7);
    ctx.fillStyle = '#3c2a1a';
    ctx.beginPath(); ctx.moveTo(-4, -30); ctx.lineTo(4, -30); ctx.lineTo(2, -24); ctx.lineTo(-2, -24); ctx.closePath(); ctx.fill();
    const glow = ctx.createRadialGradient(0, -34, 0, 0, -34, 20 * flicker);
    glow.addColorStop(0, `rgba(255, 150, 60, ${0.5 * flicker})`);
    glow.addColorStop(1, 'rgba(255, 150, 60, 0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(0, -34, 20 * flicker, 0, Math.PI * 2); ctx.fill();
    const flameGrad = ctx.createLinearGradient(0, -42, 0, -26);
    flameGrad.addColorStop(0, '#ffe08a'); flameGrad.addColorStop(1, '#ff6f2e');
    ctx.fillStyle = flameGrad;
    ctx.beginPath();
    ctx.moveTo(0, -42 * flicker);
    ctx.quadraticCurveTo(4, -34, 2, -26);
    ctx.quadraticCurveTo(0, -29, -2, -26);
    ctx.quadraticCurveTo(-4, -34, 0, -42 * flicker);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };
}

// Dark Waters: gnarled mangrove roots rising out of the murk.
function mangroveRoots(x, y, seedT) {
  return (ctx, t) => {
    const sway = Math.sin(t * 0.4 + seedT) * 0.02;
    drawShadow(ctx, x, y + 3, 16, 5, 0.3);
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(sway);
    const rootGrad = ctx.createLinearGradient(0, -26, 0, 4);
    rootGrad.addColorStop(0, '#2a3a30'); rootGrad.addColorStop(1, '#0f1a15');
    ctx.strokeStyle = rootGrad;
    ctx.lineWidth = 3.2;
    ctx.lineCap = 'round';
    for (const [x0, y0] of [[-12, -22], [0, -26], [12, -20]]) {
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(x0 * 0.5, -6, x0 * 1.3, 4);
      ctx.stroke();
    }
    toonOutline(ctx, 0.7);
    ctx.strokeStyle = 'rgba(110, 140, 110, 0.35)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(-14, -8); ctx.lineTo(14, -6); ctx.stroke();
    ctx.restore();
  };
}

// Mountain Isle: a cluster of hanging icicles catching the light.
function iceCluster(x, y, seedT) {
  return (ctx, t) => {
    const glint = 0.5 + Math.sin(t * 1.5 + seedT) * 0.3;
    drawShadow(ctx, x, y + 2, 12, 3.5, 0.26);
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#8a95a4';
    ctx.fillRect(-14, -4, 28, 3);
    toonOutline(ctx, 0.7);
    for (const [ix, len] of [[-10, 12], [-4, 18], [2, 10], [8, 16], [12, 8]]) {
      const g = ctx.createLinearGradient(ix, -4, ix, -4 + len);
      g.addColorStop(0, 'rgba(220, 240, 248, 0.9)');
      g.addColorStop(1, `rgba(160, 210, 230, ${0.5 + glint * 0.3})`);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(ix - 1.6, -4); ctx.lineTo(ix + 1.6, -4); ctx.lineTo(ix, -4 + len);
      ctx.closePath(); ctx.fill();
      toonOutline(ctx, 0.5);
    }
    ctx.restore();
  };
}

// Abyssal Lands: a pale tentacle reaching up from the deep at the water's
// edge — a hint of something much larger below.
function tentacle(x, y, seedT) {
  return (ctx, t) => {
    const reach = 0.5 + Math.sin(t * 0.6 + seedT) * 0.5;
    ctx.save();
    ctx.translate(x, y);
    const grad = ctx.createLinearGradient(0, 4, 6, -30 * reach - 6);
    grad.addColorStop(0, '#2c3a48');
    grad.addColorStop(1, '#5a6e7c');
    ctx.strokeStyle = grad;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.quadraticCurveTo(8, -6 - 14 * reach, -2, -10 - 20 * reach);
    ctx.stroke();
    toonOutline(ctx, 1);
    ctx.fillStyle = 'rgba(67, 224, 255, 0.5)';
    for (let i = 0; i < 3; i++) {
      const f = 0.3 + i * 0.25;
      const sx = 8 * Math.sin(f * Math.PI) * reach;
      const sy = 6 - (10 + 20 * reach) * f;
      ctx.beginPath(); ctx.arc(sx * 0.4, sy, 1, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };
}

// The home dock's own extra flourish: a coiled mooring rope pile.
function ropeCoilPile(x, y) {
  return (ctx) => {
    ctx.save();
    ctx.translate(x, y);
    drawShadow(ctx, 0, 3, 12, 4, 0.28);
    for (let i = 0; i < 4; i++) {
      const r = 9 - i * 2;
      const g = ctx.createRadialGradient(-2, -2 - i * 1.4, 1, 0, -i * 1.4, r);
      g.addColorStop(0, '#e0c9a0');
      g.addColorStop(1, '#a5834f');
      ctx.strokeStyle = g;
      ctx.lineWidth = 2.2;
      ctx.beginPath(); ctx.ellipse(0, -i * 1.4, r, r * 0.45, 0, 0, Math.PI * 2); ctx.stroke();
    }
    toonOutline(ctx, 0.6);
    ctx.restore();
  };
}

function fogWisp(x, y, seedT) {
  return (ctx, t) => {
    const drift = Math.sin(t * 0.3 + seedT) * 12;
    ctx.save();
    const grad = ctx.createRadialGradient(x + drift, y, 2, x + drift, y, 34);
    grad.addColorStop(0, 'rgba(207, 232, 224, 0.28)');
    grad.addColorStop(1, 'rgba(207, 232, 224, 0)');
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 0.5 + seedT);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(x + drift, y, 34, 10, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  };
}

// Each entry: [x, y, factory, ...extraArgs] — factory(x, y, ...extraArgs)
// returns draw(ctx, t). Every region carries a handful of recurring small
// elements PLUS one unmistakable signature landmark drawn nowhere else, so
// the island reads as itself at a glance. Deliberately kept sparse: a
// previous pass crammed 12-16 pieces per region (several flush against the
// canvas edge and getting clipped, a few drifting into the main walking
// lane between the water and the stalls) which read as noise rather than
// terrain. Everything below sits fully on-screen with real margin, and
// nothing sits between y=260 and y=560 — that band is the walking lane and
// stays clear. The ground/water colors (see groundPalette.js, data/regions.js)
// now carry most of the "which island is this" signal; these pieces are the
// accent on top, not the whole job.
const SCENERY = {
  tropicalIsland: [
    [36, 224, palmTree], [924, 224, palmTree], [36, 590, palmTree], [924, 590, palmTree],
    [470, 224, tikiTotem, 0.5],
    [150, 594, tikiTorch, 0.2], [810, 594, tikiTorch, 1.8],
  ],
  seasideBay: [
    [36, 590, driftwoodPile], [924, 588, driftwoodPile],
    [40, 226, fogWisp, 0.4], [920, 226, fogWisp, 2.1],
    [470, 594, shipwreckRibs],
  ],
  darkWaters: [
    [32, 224, deadTree, 0.6], [928, 222, deadTree, 2.4], [32, 590, deadTree, 4.1], [928, 588, deadTree, 1.1],
    [470, 224, giantFishSkeletonArch],
    [170, 228, willOWisp, 1.4], [790, 228, willOWisp, 3.6],
    [130, 594, mangroveRoots, 0.3], [830, 594, mangroveRoots, 1.9],
  ],
  mountainIsle: [
    [32, 224, pineTree], [928, 222, pineTree], [32, 590, pineTree], [928, 590, pineTree],
    [470, 220, waterfallCliff],
    [250, 594, prayerFlags, 400, 1.1],
    [700, 594, iceCluster, 0.4], [230, 226, iceCluster, 2.7],
  ],
  abyssalLands: [
    [32, 226, crystalSpike, 0.7], [928, 224, crystalSpike, 2.9], [32, 588, crystalSpike, 4.4], [928, 588, crystalSpike, 1.8],
    [470, 224, leviathanArch],
    [190, 228, voidRift, 0.9], [760, 228, voidRift, 2.6],
    [110, 230, tentacle, 0.5], [850, 230, tentacle, 3.1],
    [250, 594, bonePile], [700, 594, bonePile],
  ],
  // The home dock's own "way cooler" pass — bigger set-pieces than the
  // baseline props, all overhead or tucked in the free corners between
  // existing props so nothing new ever sits in the walking lane.
  dock: [
    [120, 222, pennantString, 460, 0.4], [660, 222, pennantString, 900, 2.1],
    [30, 430, treasurePile], [930, 430, netRack],
    [880, 190, homeGalleon],
    [32, 300, ropeCoilPile], [928, 300, ropeCoilPile],
    [700, 594, tikiTorch, 1.4], [260, 594, tikiTorch, 3.7],
  ],
};

export function regionSceneryEntities(state, t) {
  const list = SCENERY[state.currentRegion];
  if (!list || list.length === 0) return [];
  return list.map(([x, y, factory, ...rest]) => {
    const draw = factory(x, y, ...rest);
    return { y, draw: (ctx) => draw(ctx, t) };
  });
}
