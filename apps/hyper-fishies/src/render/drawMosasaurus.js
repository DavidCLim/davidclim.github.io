import { toonOutline } from './toon.js';

// The Bonasaur boss — full-body redesign to match the plesiosaur/mosasaur
// skeleton reference exactly: a small head on a long serpentine neck, a
// bulging torso, a simple tapering tail (no fluke), and asymmetric flippers
// (smaller front, bigger rear) — replacing the earlier short-necked,
// two-pronged-fluke build. `t` drives swimming motion (a traveling S-wave
// down the neck, a torso bob, a tail sway); `hitFlash`/`missFlash` (0..1,
// decaying) give combat feedback — a bright pulse on a landed hit, a red
// shudder on a miss.
const HEAD_TIP = -300;
const HEAD_BACK = -258;
const NECK_END = -68;
const TAIL_BASE = 168;
const TAIL_TIP = 340;

export function drawMosasaurus(ctx, x, y, scale, t, opts = {}) {
  const { armored = true, hitFlash = 0, missFlash = 0 } = opts;
  const undulate = Math.sin(t * 1.4) * 7;
  const tailWag = Math.sin(t * 1.4 + 1.1) * 12;
  const shake = missFlash > 0 ? Math.sin(t * 60) * missFlash * 5 : 0;
  const roar = Math.pow(Math.max(0, Math.sin(t * 0.45)), 10);
  const lunge = hitFlash > 0 ? hitFlash * 16 : roar * 10;
  const bite = hitFlash > 0 ? hitFlash : 0.3 + Math.sin(t * 1.15) * 0.3 + roar * 0.6;
  const flap = Math.sin(t * 2.1) * 0.09;

  const neckWave = (xPos) => {
    const p = clamp01((xPos - HEAD_BACK) / (NECK_END - HEAD_BACK));
    return Math.sin(t * 1.3 - p * 3.4) * 5 * Math.sin(p * Math.PI);
  };
  const torsoBob = (xPos) => {
    const p = clamp01((xPos - NECK_END) / (TAIL_BASE - NECK_END));
    return undulate * Math.sin(p * Math.PI);
  };
  const tailWaveAt = (xPos) => tailWag * clamp01((xPos - TAIL_BASE) / (TAIL_TIP - TAIL_BASE));

  ctx.save();
  ctx.translate(x + shake - lunge, y);
  ctx.scale(scale, scale);
  ctx.rotate(undulate * 0.003);

  // ---- Body cross-sections: head -> neck -> torso -> tail, each as a
  // {x, top, bottom} half-height pair around the spine centerline. The neck
  // is kept MUCH thinner than both the head bulb and the torso — a real
  // pinch at each end — so it reads as a distinct thin neck instead of the
  // whole head+neck region blending into one gradually-tapering "beak". ----
  const sections = [{ x: HEAD_TIP, top: 0, bottom: 0 }];
  for (const [hx, ht, hb] of [[-292, -9, 7], [-278, -15, 11], [HEAD_BACK, -11, 9]]) {
    sections.push({ x: hx, top: ht, bottom: hb });
  }
  const neckDefs = [
    [-238, -5, 4], [-213, -4.5, 4], [-188, -4.5, 4], [-163, -5, 4.5],
    [-138, -5, 5], [-113, -6, 5.5], [-90, -7, 6.5],
  ];
  for (const [nx, nt, nb] of neckDefs) {
    const w = neckWave(nx);
    sections.push({ x: nx, top: nt + w, bottom: nb + w });
  }
  {
    const w = neckWave(NECK_END);
    sections.push({ x: NECK_END, top: -9 + w, bottom: 8 + w });
  }
  const torsoDefs = [[-30, -26, 24], [20, -32, 30], [70, -30, 29], [120, -22, 21]];
  for (const [tx, tt, tb] of torsoDefs) {
    const b = torsoBob(tx);
    sections.push({ x: tx, top: tt + b, bottom: tb + b });
  }
  {
    const b = torsoBob(TAIL_BASE);
    sections.push({ x: TAIL_BASE, top: -14 + b, bottom: 13 + b });
  }
  for (const [lx, lt, lb] of [[205, -9, 9], [250, -6, 6], [295, -3, 3]]) {
    const w = tailWaveAt(lx);
    sections.push({ x: lx, top: lt + w, bottom: lb + w });
  }
  {
    const w = tailWaveAt(TAIL_TIP);
    sections.push({ x: TAIL_TIP, top: w, bottom: w });
  }

  // ---- Rear flipper (bigger — near the hip), drawn behind the torso ----
  const finGrad = ctx.createLinearGradient(0, -60, 0, 40);
  finGrad.addColorStop(0, '#3c8a8a'); finGrad.addColorStop(1, '#173d3d');
  const hipBob = torsoBob(132);
  ctx.fillStyle = finGrad;
  ctx.beginPath();
  ctx.ellipse(132, 46 + hipBob, 48, 24, 0.56 + flap, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.8);

  // ---- Main body: one continuous silhouette threaded through every
  // cross-section above via a smooth closed spline. ----
  const bodyGrad = ctx.createLinearGradient(HEAD_TIP, -32, TAIL_TIP, 30);
  bodyGrad.addColorStop(0, '#3c8a8a');
  bodyGrad.addColorStop(0.35, '#2f7070');
  bodyGrad.addColorStop(1, '#173d3d');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  const middle = sections.slice(1, -1);
  const outline = [sections[0]]
    .concat(middle.map(s => ({ x: s.x, y: s.top })))
    .concat([sections[sections.length - 1]])
    .concat(middle.slice().reverse().map(s => ({ x: s.x, y: s.bottom })));
  smoothClosedPath(ctx, outline);
  ctx.fill(); toonOutline(ctx, 2.4);

  // A small rounded cranial bump where the head meets the neck.
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(HEAD_BACK - 2, -16 + neckWave(HEAD_BACK), 8, 5, -0.15, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.4);

  // Pale belly stripe, following the ventral edge from neck through tail base.
  ctx.fillStyle = 'rgba(214, 230, 220, 0.32)';
  ctx.beginPath();
  const bellySections = sections.filter(s => s.x >= NECK_END - 20 && s.x <= TAIL_BASE + 10);
  const bellyOutline = bellySections.map(s => ({ x: s.x, y: s.bottom - 2 }))
    .concat(bellySections.slice().reverse().map(s => ({ x: s.x, y: s.bottom + 5 })));
  smoothClosedPath(ctx, bellyOutline);
  ctx.fill();

  // Dense rib-like stripe lines along the torso back.
  ctx.strokeStyle = 'rgba(12, 30, 30, 0.38)'; ctx.lineWidth = 1.2;
  for (let sx = NECK_END + 10; sx <= TAIL_BASE - 10; sx += 18) {
    const b = torsoBob(sx);
    ctx.beginPath();
    ctx.moveTo(sx, -28 + b);
    ctx.quadraticCurveTo(sx + 4, -3, sx, 22 + b);
    ctx.stroke();
  }

  // A few soft dark blotches scattered across the torso for extra texture.
  ctx.fillStyle = 'rgba(18, 40, 40, 0.3)';
  for (const [sx, sy, sr] of [[-40, -24, 5], [30, -28, 5], [90, -20, 4]]) {
    ctx.beginPath();
    ctx.ellipse(sx, sy + torsoBob(sx), sr, sr * 0.6, 0.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // ---- Front flipper (smaller — near the shoulder), in front of the body ----
  const shoulderBob = torsoBob(-40);
  ctx.fillStyle = finGrad;
  ctx.beginPath();
  ctx.ellipse(-46, 30 + shoulderBob, 30, 15, 0.42 + flap, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1.8);
  ctx.beginPath();
  ctx.ellipse(-38, 22 + shoulderBob, 23, 11, 0.26 + flap, 0, Math.PI * 2);
  ctx.globalAlpha = 0.85;
  ctx.fill(); toonOutline(ctx, 1.4);
  ctx.globalAlpha = 1;

  // ---- Simple tapering tail fin (no fork) — a low dorsal-ish membrane
  // along the last stretch of tail, matching the reference's plain,
  // fin-less tapering tail instead of a two-pronged fluke. ----
  ctx.fillStyle = finGrad;
  ctx.beginPath();
  ctx.moveTo(TAIL_BASE + 30, -12 + torsoBob(TAIL_BASE));
  ctx.quadraticCurveTo(250, -14 + tailWaveAt(250), TAIL_TIP - 5, -1 + tailWaveAt(TAIL_TIP));
  ctx.quadraticCurveTo(250, 6 + tailWaveAt(250), TAIL_BASE + 30, 10 + torsoBob(TAIL_BASE));
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.4);

  // ---- Jaw: a small, fixed upper jaw on the compact head, plus a lower
  // jaw hinging from a fixed pivot — kept proportionate to the now much
  // smaller head instead of the old long-snouted build. ----
  const headBackY = neckWave(HEAD_BACK);
  ctx.fillStyle = '#f0e8d8';
  const upperTeeth = [[-297, -1], [-291, 2], [-285, 4], [-278, 5], [-271, 5], [-264, 5]];
  for (const [fx, fy] of upperTeeth) {
    ctx.beginPath();
    ctx.moveTo(fx - 1.4, fy);
    ctx.lineTo(fx, fy + 4);
    ctx.lineTo(fx + 1.4, fy);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#6b4c48';
  ctx.beginPath();
  ctx.moveTo(-297, -3);
  ctx.quadraticCurveTo(-283, 3, -264, 8);
  ctx.lineTo(-264, 12);
  ctx.quadraticCurveTo(-283, 7, -297, 1);
  ctx.closePath();
  ctx.fill();

  ctx.save();
  ctx.translate(-260, 9 + headBackY);
  ctx.rotate(bite * 0.5);
  ctx.fillStyle = '#1e4a4a';
  ctx.beginPath();
  ctx.moveTo(0, -1);
  ctx.quadraticCurveTo(-12, -1, -22, 1);
  ctx.quadraticCurveTo(-30, 3, -32, 6);
  ctx.quadraticCurveTo(-24, 8, -13, 8);
  ctx.quadraticCurveTo(-5, 7, 2, 4);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.6);

  ctx.fillStyle = '#f0e8d8';
  const lowerTeeth = [[-29, 3], [-23, 4], [-17, 4.5], [-11, 5], [-5, 4]];
  for (const [fx, fy] of lowerTeeth) {
    ctx.beginPath();
    ctx.moveTo(fx - 1.2, fy);
    ctx.lineTo(fx, fy - 3.6);
    ctx.lineTo(fx + 1.2, fy);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // A small nostril notch near the snout tip.
  ctx.fillStyle = 'rgba(15, 35, 35, 0.55)';
  ctx.beginPath(); ctx.ellipse(-290, -8, 1.8, 1.1, 0.3, 0, Math.PI * 2); ctx.fill();

  // ---- Eye + brow, scaled to the small head ----
  ctx.fillStyle = '#182422';
  ctx.beginPath(); ctx.ellipse(-279, -9, 4.6, 4, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.beginPath(); ctx.arc(-278, -10.5, 1.2, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(20, 45, 45, 0.5)'; ctx.lineWidth = 1.2; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-286, -15); ctx.quadraticCurveTo(-279, -17.5, -270, -14.5);
  ctx.stroke();

  if (armored) {
    drawFossilArmor(ctx, { neckDefs, torsoDefs, headBackY, hipBob, shoulderBob });
  }

  ctx.restore();

  if (hitFlash > 0) {
    ctx.save();
    ctx.globalAlpha = hitFlash * 0.5;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(x, y, 260 * scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function clamp01(v) { return Math.max(0, Math.min(1, v)); }

// Every original point becomes a bezier control point and the curve passes
// through the midpoints of consecutive edges — a simple, dependency-free
// way to get a smooth closed loop through an arbitrary point set (used for
// the long, many-cross-section body outline).
function smoothClosedPath(ctx, pts) {
  const n = pts.length;
  const mid = (a, b) => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 });
  const start = mid(pts[n - 1], pts[0]);
  ctx.moveTo(start.x, start.y);
  for (let i = 0; i < n; i++) {
    const cur = pts[i];
    const next = pts[(i + 1) % n];
    const m = mid(cur, next);
    ctx.quadraticCurveTo(cur.x, cur.y, m.x, m.y);
  }
  ctx.closePath();
}

// Fossilized bone armor, matching a real plesiosaur/mosasaur mount: a
// small tapering skull, a long chain of neck vertebrae, a dense ribcage
// over the torso only, a simple tapering tail-vertebra chain (no fin rays,
// since the tail no longer has a fluke), and flipper bones sized to match
// the new smaller-front/bigger-rear flippers.
function drawFossilArmor(ctx, geo) {
  const boneGrad = ctx.createLinearGradient(0, -60, 0, 20);
  boneGrad.addColorStop(0, '#f6ecd6');
  boneGrad.addColorStop(0.4, '#e4d3a8');
  boneGrad.addColorStop(0.75, '#c2a878');
  boneGrad.addColorStop(1, '#9c7f54');
  const crackStroke = 'rgba(90, 70, 40, 0.6)';

  // --- Small skull: a tapering wedge sized to the now-compact head, plus a
  // distinct lower jaw (mandible) hanging just below it. ---
  ctx.fillStyle = boneGrad;
  ctx.beginPath();
  ctx.moveTo(HEAD_TIP, -3);
  ctx.quadraticCurveTo(-293, -10, -283, -12);
  ctx.quadraticCurveTo(-270, -14, -258, -13 + geo.headBackY);
  ctx.quadraticCurveTo(-250, -8 + geo.headBackY, -252, -1 + geo.headBackY);
  ctx.quadraticCurveTo(-262, 4 + geo.headBackY, -275, 6);
  ctx.quadraticCurveTo(-288, 8, -297, 4);
  ctx.quadraticCurveTo(-300, 0, HEAD_TIP, -3);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 2.4);

  ctx.fillStyle = 'rgba(15, 35, 35, 0.9)';
  ctx.beginPath(); ctx.ellipse(-279, -9, 4, 3.5, 0, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(120, 100, 60, 0.7)'; ctx.lineWidth = 1.4;
  ctx.stroke();

  ctx.fillStyle = 'rgba(15, 35, 35, 0.7)';
  for (let i = 0; i < 6; i++) {
    const tx = -296 + i * 6;
    ctx.beginPath();
    ctx.moveTo(tx - 1.2, 0);
    ctx.lineTo(tx, 4.5);
    ctx.lineTo(tx + 1.2, 0);
    ctx.closePath();
    ctx.fill();
  }

  drawFossilMottling(ctx, [[-283, -8, 6, 4, 0.2], [-265, -6, 5, 3, -0.2]]);
  ctx.strokeStyle = crackStroke; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-288, -10); ctx.lineTo(-278, -6); ctx.stroke();
  drawWeatherPit(ctx, -270, -8, 2);

  // Lower jaw (mandible) bone.
  ctx.fillStyle = boneGrad;
  ctx.beginPath();
  ctx.moveTo(-296, 3);
  ctx.quadraticCurveTo(-283, 2, -268, 5);
  ctx.quadraticCurveTo(-258, 7, -253, 11 + geo.headBackY);
  ctx.quadraticCurveTo(-260, 14 + geo.headBackY, -272, 12);
  ctx.quadraticCurveTo(-286, 10, -298, 7);
  ctx.closePath();
  ctx.fill(); toonOutline(ctx, 1.8);
  ctx.fillStyle = boneGrad;
  ctx.beginPath(); ctx.ellipse(-255, 9 + geo.headBackY, 2.6, 2.2, 0.3, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.8);

  ctx.fillStyle = 'rgba(15, 35, 35, 0.7)';
  for (let i = 0; i < 6; i++) {
    const tx = -294 + i * 6;
    ctx.beginPath();
    ctx.moveTo(tx - 1.1, 8);
    ctx.lineTo(tx, 4.5);
    ctx.lineTo(tx + 1.1, 8);
    ctx.closePath();
    ctx.fill();
  }

  // --- Spine: one continuous beaded vertebral column from the base of the
  // skull, all the way down the long neck, through the torso (where ribs
  // branch off), to the base of the tail. ---
  const spinePts = [{ x: HEAD_BACK, y: -13 + geo.headBackY }];
  for (const [nx] of geo.neckDefs) spinePts.push({ x: nx, y: -0.5 });
  spinePts.push({ x: NECK_END, y: -1 });
  for (const [tx] of geo.torsoDefs) spinePts.push({ x: tx, y: -20 });
  spinePts.push({ x: TAIL_BASE, y: -8 });

  ctx.strokeStyle = 'rgba(35, 24, 14, 0.55)'; ctx.lineWidth = 5.5; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(spinePts[0].x, spinePts[0].y);
  for (let i = 1; i < spinePts.length; i++) ctx.lineTo(spinePts[i].x, spinePts[i].y);
  ctx.stroke();
  ctx.strokeStyle = boneGrad; ctx.lineWidth = 3.8;
  ctx.beginPath();
  ctx.moveTo(spinePts[0].x, spinePts[0].y);
  for (let i = 1; i < spinePts.length; i++) ctx.lineTo(spinePts[i].x, spinePts[i].y);
  ctx.stroke();
  for (const p of spinePts) drawVertebraDisc(ctx, boneGrad, p.x, p.y, 3, 3.6);

  // --- Ribcage: only over the torso, a dense ladder of thin curved ribs
  // branching off the spine. ---
  const ribXs = [];
  for (let rx = NECK_END + 8; rx <= TAIL_BASE - 8; rx += 13) ribXs.push(rx);
  for (let i = 0; i < ribXs.length; i++) {
    const rx = ribXs[i];
    const spread = 12 + i * 0.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(35, 24, 14, 0.5)'; ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(rx, -18);
    ctx.quadraticCurveTo(rx - spread, -2, rx - spread * 0.55, 20);
    ctx.stroke();
    ctx.strokeStyle = boneGrad; ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(rx, -18);
    ctx.quadraticCurveTo(rx - spread, -2, rx - spread * 0.55, 20);
    ctx.stroke();
    drawVertebraDisc(ctx, boneGrad, rx, -19, 2.8, 3.4);
  }

  // --- Tail vertebrae: a long, tapering, fin-less chain of small disc
  // bones running the full length of the tail down to the very tip —
  // matching the reference's simple tapering tail with no fluke. ---
  const tailPts = [];
  const tailCtrl = { x: 250, y: -14 };
  const tailEnd = { x: TAIL_TIP, y: 0 };
  const tailStart = { x: TAIL_BASE, y: -8 };
  const tailSteps = 8;
  for (let i = 1; i <= tailSteps; i++) {
    const tt = i / tailSteps, mt = 1 - tt;
    tailPts.push({
      x: mt * mt * tailStart.x + 2 * mt * tt * tailCtrl.x + tt * tt * tailEnd.x,
      y: mt * mt * tailStart.y + 2 * mt * tt * tailCtrl.y + tt * tt * tailEnd.y,
    });
  }
  ctx.strokeStyle = 'rgba(35, 24, 14, 0.5)'; ctx.lineWidth = 4.4; ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(tailStart.x, tailStart.y);
  for (const p of tailPts) ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.strokeStyle = boneGrad; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(tailStart.x, tailStart.y);
  for (const p of tailPts) ctx.lineTo(p.x, p.y);
  ctx.stroke();
  for (let i = 0; i < tailPts.length; i++) {
    const p = tailPts[i];
    const r = 3 - i * 0.28;
    drawVertebraDisc(ctx, boneGrad, p.x, p.y, Math.max(0.6, r * 0.85), Math.max(0.7, r));
  }

  // --- Front flipper bone: smaller, matching the resized front flipper. ---
  ctx.save();
  ctx.translate(-46, 24 + geo.shoulderBob);
  ctx.rotate(0.45);
  ctx.strokeStyle = 'rgba(35, 24, 14, 0.5)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-10, -5); ctx.quadraticCurveTo(2, 1, 12, 8); ctx.stroke();
  ctx.strokeStyle = boneGrad; ctx.lineWidth = 3.6;
  ctx.beginPath(); ctx.moveTo(-10, -5); ctx.quadraticCurveTo(2, 1, 12, 8); ctx.stroke();
  ctx.fillStyle = boneGrad;
  ctx.beginPath(); ctx.ellipse(-10, -5, 3.6, 3, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.8);
  ctx.beginPath(); ctx.ellipse(12, 8, 3.2, 2.6, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 0.8);
  drawDigitFan(ctx, boneGrad, 12, 8, 0.55, 1.3, 4, 15);
  ctx.restore();

  // --- Rear flipper bone: bigger, matching the resized rear (hip) flipper. ---
  ctx.save();
  ctx.translate(132, 38 + geo.hipBob);
  ctx.rotate(0.38);
  ctx.strokeStyle = 'rgba(35, 24, 14, 0.5)'; ctx.lineWidth = 7.5; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-18, -10); ctx.quadraticCurveTo(0, 2, 8, 18); ctx.stroke();
  ctx.strokeStyle = boneGrad; ctx.lineWidth = 6;
  ctx.beginPath(); ctx.moveTo(-18, -10); ctx.quadraticCurveTo(0, 2, 8, 18); ctx.stroke();
  ctx.fillStyle = boneGrad;
  ctx.beginPath(); ctx.ellipse(-18, -10, 5.6, 4.6, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1);
  ctx.beginPath(); ctx.ellipse(8, 18, 5, 4, 0, 0, Math.PI * 2); ctx.fill(); toonOutline(ctx, 1);
  drawDigitFan(ctx, boneGrad, 8, 18, 0.65, 1.55, 5, 28);
  ctx.restore();

  // weathering along the ribcage/spine
  drawFossilMottling(ctx, [
    [-20, -12, 18, 9, 0.1], [40, -18, 16, 8, -0.1], [90, -10, 14, 7, 0.15],
  ]);
  drawWeatherPit(ctx, -20, 18, 2.2);
  drawWeatherPit(ctx, 60, 22, 2.2);
}

// A soft, irregular patch of aged discoloration.
function drawFossilMottling(ctx, spots) {
  for (const [x, y, rx, ry, rot] of spots) {
    ctx.fillStyle = 'rgba(110, 88, 52, 0.16)';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(80, 62, 34, 0.14)';
    ctx.beginPath(); ctx.ellipse(x + rx * 0.3, y + ry * 0.2, rx * 0.55, ry * 0.55, rot + 0.4, 0, Math.PI * 2); ctx.fill();
  }
}

// A small weathered pit — a dark irregular hollow.
function drawWeatherPit(ctx, x, y, r) {
  ctx.fillStyle = 'rgba(45, 34, 20, 0.65)';
  ctx.beginPath(); ctx.ellipse(x, y, r, r * 0.82, 0.3, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(20, 14, 8, 0.5)';
  ctx.beginPath(); ctx.ellipse(x - r * 0.15, y - r * 0.1, r * 0.45, r * 0.4, 0.3, 0, Math.PI * 2); ctx.fill();
}

// A small oval vertebra disc — shared by the spine and tail chains.
function drawVertebraDisc(ctx, boneGrad, x, y, rx, ry) {
  ctx.fillStyle = boneGrad;
  ctx.beginPath();
  ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
  ctx.fill(); toonOutline(ctx, 1);
}

// A small mosaic of carpal/tarsal bones filling the paddle base where the
// limb bone meets the fingers.
function drawCarpalCluster(ctx, boneGrad, originX, originY, angle) {
  const offsets = [[-4, -4], [3, -5], [-5, 3], [2, 4], [-1, -1], [6, 0]];
  for (const [ox, oy] of offsets) {
    const dx = ox * Math.cos(angle) - oy * Math.sin(angle);
    const dy = ox * Math.sin(angle) + oy * Math.cos(angle);
    ctx.fillStyle = boneGrad;
    ctx.beginPath();
    ctx.ellipse(originX + dx, originY + dy, 2.6, 2.1, angle, 0, Math.PI * 2);
    ctx.fill(); toonOutline(ctx, 0.8);
  }
}

// A fan of individual digit bones splaying out from a flipper's carpal
// cluster — each digit a tapering chain of small beaded phalanx segments.
function drawDigitFan(ctx, boneGrad, originX, originY, angleStart, angleEnd, count, length) {
  drawCarpalCluster(ctx, boneGrad, originX, originY, (angleStart + angleEnd) / 2);
  for (let i = 0; i < count; i++) {
    const a = angleStart + (angleEnd - angleStart) * (i / (count - 1));
    const dx = Math.cos(a), dy = Math.sin(a);
    let px = originX, py = originY, segLen = length;
    for (let s = 0; s < 4; s++) {
      const nx = px + dx * segLen, ny = py + dy * segLen;
      ctx.strokeStyle = 'rgba(35, 24, 14, 0.5)'; ctx.lineWidth = 2.4 - s * 0.32; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
      ctx.strokeStyle = boneGrad; ctx.lineWidth = 1.8 - s * 0.24;
      ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(nx, ny); ctx.stroke();
      ctx.fillStyle = boneGrad;
      ctx.beginPath(); ctx.ellipse(px, py, 1.5 - s * 0.2, 1.3 - s * 0.16, a, 0, Math.PI * 2); ctx.fill();
      px = nx; py = ny; segLen *= 0.8;
    }
  }
}
