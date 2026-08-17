// The Bonasaur boss encounter, drawn directly into the world canvas on top
// of the normal dock scene — the player stays visibly standing on the dock
// the whole time (renderer.js still calls renderDockScene underneath this),
// there's no separate modal panel. Covers all four boss phases: the rod
// straining (pulling), the line getting yanked under (pulledUnder), the
// creature bursting up (reveal), and the timing-hit fight itself.
import { WORLD_W, WORLD_H } from '../core/constants.js';
import { drawMosasaurus } from './drawMosasaurus.js';
import { bossProgress } from '../fishing/bossFight.js';
import { WATERLINE_Y, CAST_FAR_X, ROD_TIP } from './drawDockScene.js';

// The long-neck redesign roughly doubled the creature's total length (head
// to tail-tip now spans ~640 units instead of ~576), so this sits further
// left and at a smaller scale than before to keep both the snout and the
// tail tip clear of the canvas edges.
const BOSS_X = 520;
const BOSS_SURFACE_Y = WATERLINE_Y + 6;
const BOSS_SCALE = 0.85;
const STUN_DISPLAY_DURATION = 2.2; // must match STUN_DURATION in fishing/bossFight.js

// Only the fight itself keeps the flat, fixed side-view camera (so it
// stays fair and readable as a minigame). The three cutscene beats before
// it each get their own cinematic shot — a close-up push-in, a hard cut,
// a low dramatic angle — instead of all sharing that same flat framing,
// closer to how a Fisch-style boss reveal cuts between angles.
let scratch = null;
function getScratch(w, h) {
  if (!scratch) {
    scratch = document.createElement('canvas');
    scratch.width = w;
    scratch.height = h;
  }
  return scratch;
}

// The lowest zoom that still guarantees the transformed image's edges land
// outside the canvas on every side for a given off-center focus point — go
// any lower and a real gap opens up on whichever side the focus leans
// away from (the corner case that broke the first version of this).
function minCoverZoom(focusX, focusY) {
  const zx = Math.max((WORLD_W / 2) / Math.max(1, focusX), (WORLD_W / 2) / Math.max(1, WORLD_W - focusX));
  const zy = Math.max((WORLD_H / 2) / Math.max(1, focusY), (WORLD_H / 2) / Math.max(1, WORLD_H - focusY));
  return Math.max(zx, zy);
}

// Re-frames whatever has already been drawn this frame — zooms into
// (focusX, focusY) and optionally tilts it — by snapshotting the canvas to
// an offscreen scratch buffer and redrawing it back through a camera
// transform. Anything drawn after this call (banners, letterbox bars)
// stays in flat screen space, unaffected by the zoom/tilt.
function applyCinematicPunch(ctx, focusX, focusY, zoom, rotation) {
  const w = WORLD_W, h = WORLD_H;
  const safeZoom = Math.max(zoom, minCoverZoom(focusX, focusY) * 1.03);
  const buf = getScratch(w, h);
  const bctx = buf.getContext('2d');
  bctx.clearRect(0, 0, w, h);
  // The real canvas's backing store is scaled by devicePixelRatio/CSS fit
  // (see core/canvas.js) and is almost never exactly WORLD_W x WORLD_H, so
  // the source rect must be given explicitly — a plain drawImage(canvas,0,0)
  // copies 1:1 pixels and only grabs whatever corner happens to overlap.
  bctx.drawImage(ctx.canvas, 0, 0, ctx.canvas.width, ctx.canvas.height, 0, 0, w, h);

  ctx.clearRect(0, 0, w, h);
  ctx.save();
  ctx.translate(w / 2, h / 2);
  ctx.rotate(rotation);
  ctx.scale(safeZoom, safeZoom);
  ctx.translate(-focusX, -focusY);
  ctx.drawImage(buf, 0, 0);
  ctx.restore();
}

// A quick white flash to sell a hard cut between two camera shots — used
// on both sides of the cut so it reads as one flash spanning the edit,
// not two separate pops.
function drawCutFlash(ctx, alpha) {
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha)) * 0.5;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.restore();
}

function drawLetterbox(ctx, barH) {
  if (barH <= 0) return;
  ctx.fillStyle = '#020608';
  ctx.fillRect(0, 0, WORLD_W, barH);
  ctx.fillRect(0, WORLD_H - barH, WORLD_W, barH);
}

export function drawBossScene(ctx, state) {
  const b = state.boss;
  if (!b || b.state === 'idle') return;
  const t = state.fx.time;

  if (b.state === 'pulling') {
    drawPullingOverlay(ctx, b, t);
    // Two distinct shots, hard-cut between them, instead of one continuous
    // zoom: a wide establishing angle (you, the dock, the whole scene —
    // something's out there) that jump-cuts into the tight push-in once
    // the strain really kicks in.
    const WIDE_BEAT = 0.55;
    if (b.phaseTimer < WIDE_BEAT) {
      const wideT = b.phaseTimer / WIDE_BEAT;
      applyCinematicPunch(ctx, WORLD_W / 2 - 40, WATERLINE_Y - 40, 1.08 + wideT * 0.08, 0);
      drawLetterbox(ctx, 30);
      if (b.phaseTimer > WIDE_BEAT - 0.05) drawCutFlash(ctx, 1 - (WIDE_BEAT - b.phaseTimer) / 0.05);
    } else {
      const strain = Math.min(1, (b.phaseTimer - WIDE_BEAT) / 0.45);
      const shakeR = Math.sin(t * 19) * 0.012 * strain;
      applyCinematicPunch(ctx, 300, 196, 1.75 + strain * 0.3, -0.045 + shakeR);
      drawLetterbox(ctx, 44);
      if (b.phaseTimer < WIDE_BEAT + 0.05) drawCutFlash(ctx, 1 - (b.phaseTimer - WIDE_BEAT) / 0.05);
    }
    drawBanner(ctx, 'SOMETHING HUGE HAS TAKEN THE BAIT!', 'The rod bends double...');
    return;
  }
  if (b.state === 'pulledUnder') {
    drawPulledUnderOverlay(ctx, b, t);
    const burstT = Math.min(1, b.phaseTimer / 0.7);
    // A hard jolt right on impact (decaying fast) on top of the punch-in —
    // the "cut" should feel like it hit something, not just zoom.
    const jolt = Math.max(0, 1 - b.phaseTimer / 0.22);
    const joltRot = Math.sin(t * 70) * 0.05 * jolt;
    applyCinematicPunch(ctx, CAST_FAR_X - 160, WATERLINE_Y - 6, 2.6 - burstT * 0.4, joltRot);
    drawLetterbox(ctx, 44);
    return;
  }

  const progress = bossProgress(state);
  const shakeX = b.shakeT > 0 ? Math.sin(t * 50) * b.shakeT * 6 : 0;

  ctx.save();
  ctx.translate(shakeX, 0);
  if (b.state === 'reveal') {
    drawRevealOverlay(ctx, b, t, progress);
  } else {
    drawFightOverlay(ctx, b, t, progress);
  }
  ctx.restore();

  if (b.state === 'reveal') {
    // A slow dramatic pull-back: starts as a close, slightly tilted low
    // angle on the breaching creature and eases out to the flat fight
    // camera right as Space becomes pressable — the "cut" into gameplay
    // reads as a camera move instead of a hard jump. Focus eases back to
    // dead-center (not just zoom back to 1) so the very end of the pull-
    // back is a true identity transform — an exact, gapless match for the
    // plain fight camera it cuts into.
    const camT = clamp(b.phaseTimer / 1.6, 0, 1);
    const zoom = 1 + (1.85 - 1) * (1 - camT);
    const rotation = -0.05 * (1 - camT);
    const focusX = WORLD_W / 2 + (BOSS_X - WORLD_W / 2) * (1 - camT);
    const focusY = WORLD_H / 2 + (BOSS_SURFACE_Y - 30 - WORLD_H / 2) * (1 - camT);
    applyCinematicPunch(ctx, focusX, focusY, zoom, rotation);
    drawLetterbox(ctx, 44 * (1 - camT));
    // A brief murky underwater tint right at the start — one more distinct
    // beat (a glimpse from below) before the shot clears into the full
    // breach, rather than jumping straight to a clean, lit close-up.
    const murkT = Math.max(0, 1 - b.phaseTimer / 0.22);
    if (murkT > 0) {
      ctx.save();
      ctx.globalAlpha = murkT * 0.55;
      ctx.fillStyle = '#03222a';
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);
      ctx.restore();
    }
    drawBanner(ctx, 'THE BONASAUR SURFACES!', 'Fossil-plated and furious. Click to attack!');
    return;
  }

  drawHUD(ctx, progress);
}

function drawTautLine(ctx, toX, toY) {
  ctx.strokeStyle = 'rgba(240,246,241,0.85)';
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.moveTo(ROD_TIP.x, ROD_TIP.y);
  ctx.lineTo(toX, toY);
  ctx.stroke();
}

function drawRipple(ctx, x, y, r, alpha) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = 'rgba(255,255,255,0.7)';
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(x, y, r, r * 0.32, 0, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawSplashBurst(ctx, x, y, burstT, scale = 1) {
  const alpha = 1 - burstT;
  ctx.save();
  ctx.globalAlpha = alpha * 0.8;
  ctx.fillStyle = '#eaf6f6';
  ctx.beginPath();
  ctx.ellipse(x, y, (30 + burstT * 70) * scale, (10 + burstT * 22) * scale, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  const droplets = 10;
  for (let i = 0; i < droplets; i++) {
    const a = (i / droplets) * Math.PI - Math.PI / 2 - 0.3;
    const dist = (20 + burstT * 90) * scale;
    const dx = x + Math.cos(a) * dist;
    const dy = y - Math.abs(Math.sin(a)) * dist * 0.9 + burstT * burstT * 60;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#dff4f2';
    ctx.beginPath();
    ctx.ellipse(dx, dy, 3.2 * scale, 5 * scale, a, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawFoamLine(ctx, t) {
  ctx.strokeStyle = 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (let x = BOSS_X - 200; x <= BOSS_X + 240; x += 14) {
    const wob = Math.sin(x * 0.08 + t * 3) * 2.5;
    if (x === BOSS_X - 200) ctx.moveTo(x, WATERLINE_Y + wob); else ctx.lineTo(x, WATERLINE_Y + wob);
  }
  ctx.stroke();
}

function drawPullingOverlay(ctx, b, t) {
  const strain = Math.min(1, b.phaseTimer / 0.5);
  const jitter = Math.sin(t * 22) * (2 + strain * 5);
  const bx = CAST_FAR_X - 60 + jitter * 2;
  const by = WATERLINE_Y + Math.sin(t * 30) * 6;

  drawTautLine(ctx, bx, by);
  drawRipple(ctx, bx, WATERLINE_Y, 16 + Math.sin(t * 10) * 5, 0.5);
  drawBubbles(ctx, bx, WATERLINE_Y + 6, t, 5, 24);

  ctx.fillStyle = '#7a2e2e';
  ctx.beginPath(); ctx.arc(bx, by, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#f0e2c4';
  ctx.beginPath(); ctx.arc(bx, by - 3, 6, Math.PI, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = `rgba(255, 220, 180, ${0.3 + strain * 0.4})`;
  ctx.lineWidth = 1.4;
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + t * 6;
    ctx.beginPath();
    ctx.moveTo(bx + Math.cos(a) * 14, by + Math.sin(a) * 14);
    ctx.lineTo(bx + Math.cos(a) * (22 + strain * 10), by + Math.sin(a) * (22 + strain * 10));
    ctx.stroke();
  }
}

function drawPulledUnderOverlay(ctx, b, t) {
  const bx = CAST_FAR_X - 100;
  drawTautLine(ctx, bx, WATERLINE_Y - 4);
  const burstT = Math.min(1, b.phaseTimer / 0.7);
  drawSplashBurst(ctx, bx, WATERLINE_Y, burstT, 1.1);
  drawBubbles(ctx, bx, WATERLINE_Y + 10, t, 10, 60, burstT);
  if (b.phaseTimer < 0.18) {
    ctx.save();
    ctx.globalAlpha = (1 - b.phaseTimer / 0.18) * 0.4;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.restore();
  }
}

// A little rush of bubbles boiling up from a point — used to sell the
// "something just went under" and "it's breathing hard" moments.
function drawBubbles(ctx, cx, cy, t, count, spread, age = 0) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    const seed = i * 12.9898;
    const life = ((t * 0.6 + seed) % 1);
    const bx = cx + (Math.sin(seed * 3.1) * spread) * (0.3 + life * 0.7);
    const by = cy - life * 70 - age * 20;
    const r = 1.4 + Math.sin(seed) * 1.2 + life * 1.5;
    ctx.globalAlpha = (1 - life) * 0.5;
    ctx.fillStyle = '#dff4f2';
    ctx.beginPath();
    ctx.arc(bx, by, Math.max(0.6, r), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawRevealOverlay(ctx, b, t, progress) {
  const riseT = clamp(b.phaseTimer / 0.9, 0, 1);
  const ease = 1 - Math.pow(1 - riseT, 3);
  const dropY = (1 - ease) * 160;
  const popScale = BOSS_SCALE * (0.7 + Math.min(1, riseT * 1.3) * 0.3);

  drawSplashBurst(ctx, BOSS_X, BOSS_SURFACE_Y + 10, Math.min(1, b.phaseTimer / 1.1), 1.5);
  drawBubbles(ctx, BOSS_X - 40, BOSS_SURFACE_Y + dropY + 20, t, 8, 90, 1 - riseT);
  drawMosasaurus(ctx, BOSS_X, BOSS_SURFACE_Y + dropY, popScale, t, { armored: !progress.armorGone });
  drawFoamLine(ctx, t);
}

function drawFightOverlay(ctx, b, t, progress) {
  const stunned = b.state === 'stunned';
  drawMosasaurus(ctx, BOSS_X, BOSS_SURFACE_Y, BOSS_SCALE, t, {
    armored: !progress.armorGone,
    hitFlash: b.hitFlash,
    missFlash: stunned ? 0 : b.missFlash,
  });
  if (stunned) drawStunStars(ctx, t);
  else drawBubbles(ctx, BOSS_X - 210, BOSS_SURFACE_Y + 20, t, 3, 14);
  drawFoamLine(ctx, t);

  if (!stunned && b.missFlash > 0) {
    ctx.save();
    ctx.globalAlpha = b.missFlash * 0.25;
    ctx.fillStyle = '#7a1f1f';
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);
    ctx.restore();
  }

  if (stunned) {
    drawStunMeter(ctx, progress, t);
  } else {
    drawTimingBar(ctx, b, t, progress);
  }
}

// A little ring of dizzy stars circling above the creature's head — the
// clearest possible "this is a different moment, go mash" visual cue.
function drawStunStars(ctx, t) {
  const cx = BOSS_X - 130, cy = BOSS_SURFACE_Y - 90;
  for (let i = 0; i < 4; i++) {
    const a = t * 3.4 + (i / 4) * Math.PI * 2;
    const sx = cx + Math.cos(a) * 26;
    const sy = cy + Math.sin(a) * 9;
    drawStar(ctx, sx, sy, 5, '#ffe9a8');
  }
}

function drawStar(ctx, cx, cy, r, color) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a1 = (i / 5) * Math.PI * 2 - Math.PI / 2;
    const a2 = a1 + Math.PI / 5;
    ctx.lineTo(Math.cos(a1) * r, Math.sin(a1) * r);
    ctx.lineTo(Math.cos(a2) * r * 0.42, Math.sin(a2) * r * 0.42);
  }
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// The stun finisher: not the timing bar at all — a real-time mash meter
// with its own countdown ring, so it visibly reads as a second minigame.
function drawStunMeter(ctx, progress, t) {
  const cx = WORLD_W / 2, cy = WORLD_H - 90;
  const w = 300, h = 20, x = cx - w / 2, y = cy;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffe9a8';
  ctx.font = `${24 + Math.sin(t * 14) * 1.5}px "Pirata One", cursive`;
  ctx.fillText('STUNNED! MASH SPACE!', cx, y - 20);
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(2,10,14,0.6)';
  roundedRect(ctx, x - 4, y - 4, w + 8, h + 8, 10);
  ctx.fill();
  ctx.fillStyle = '#241c0c';
  roundedRect(ctx, x, y, w, h, 8);
  ctx.fill();

  const fillGrad = ctx.createLinearGradient(x, 0, x + w, 0);
  fillGrad.addColorStop(0, '#ffd08a');
  fillGrad.addColorStop(1, '#ffe9a8');
  ctx.fillStyle = fillGrad;
  roundedRect(ctx, x, y, w * progress.stunFrac, h, 8);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 233, 168, 0.7)';
  ctx.lineWidth = 1.6;
  roundedRect(ctx, x, y, w, h, 8);
  ctx.stroke();

  // Countdown ring on the right end of the bar for how long the window lasts.
  const ringFrac = 1 - progress.stunTimeLeft / STUN_DISPLAY_DURATION;
  ctx.beginPath();
  ctx.arc(x + w + 20, y + h / 2, 12, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * ringFrac);
  ctx.strokeStyle = '#ffe9a8';
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.restore();
}

function drawTimingBar(ctx, b, t, progress) {
  const w = 420, h = 16;
  const x = WORLD_W / 2 - w / 2, y = WORLD_H - 76;

  ctx.save();
  if (progress.combo >= 2) {
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0,0,0,0.9)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = progress.combo >= 3 ? '#ff9d6a' : '#ffe9a8';
    ctx.font = `bold ${13 + Math.min(4, progress.combo)}px "Nunito", sans-serif`;
    ctx.fillText(`COMBO x${progress.combo}${progress.combo >= 3 ? ' — DOUBLE TRAPS!' : ''}`, WORLD_W / 2, y - 14);
    ctx.shadowBlur = 0;
  }
  ctx.fillStyle = 'rgba(2,10,14,0.6)';
  roundedRect(ctx, x - 4, y - 4, w + 8, h + 8, 8);
  ctx.fill();

  ctx.fillStyle = '#1c3a3a';
  roundedRect(ctx, x, y, w, h, 6);
  ctx.fill();

  // Faint tick marks along the track for a more instrument-like read.
  ctx.strokeStyle = 'rgba(255,255,255,0.1)';
  ctx.lineWidth = 1;
  for (let p = 10; p < 100; p += 10) {
    const tx = x + (p / 100) * w;
    ctx.beginPath(); ctx.moveTo(tx, y); ctx.lineTo(tx, y + h); ctx.stroke();
  }

  if (b.trapActive) {
    ctx.fillStyle = 'rgba(255, 90, 70, 0.55)';
    ctx.fillRect(x + (b.trapStart / 100) * w, y, (b.trapWidth / 100) * w, h);
    ctx.strokeStyle = 'rgba(255, 140, 120, 0.9)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x + (b.trapStart / 100) * w, y, (b.trapWidth / 100) * w, h);
  }
  if (b.trap2Active) {
    ctx.fillStyle = 'rgba(255, 90, 70, 0.55)';
    ctx.fillRect(x + (b.trap2Start / 100) * w, y, (b.trap2Width / 100) * w, h);
    ctx.strokeStyle = 'rgba(255, 140, 120, 0.9)';
    ctx.lineWidth = 1.4;
    ctx.strokeRect(x + (b.trap2Start / 100) * w, y, (b.trap2Width / 100) * w, h);
  }

  // A soft pulsing glow behind the real zone so it reads as "the good one"
  // at a glance even next to a same-colored trap.
  const pulse = 0.5 + Math.sin(t * 6) * 0.5;
  ctx.save();
  ctx.globalAlpha = 0.35 + pulse * 0.25;
  ctx.fillStyle = '#ffe9a8';
  ctx.fillRect(x + (b.zoneStart / 100) * w - 3, y - 3, (b.zoneWidth / 100) * w + 6, h + 6);
  ctx.restore();

  const zoneGrad = ctx.createLinearGradient(0, y, 0, y + h);
  zoneGrad.addColorStop(0, '#ffd08a');
  zoneGrad.addColorStop(1, '#ffb454');
  ctx.fillStyle = zoneGrad;
  ctx.fillRect(x + (b.zoneStart / 100) * w, y, (b.zoneWidth / 100) * w, h);

  // A short trailing glow behind the marker in its direction of travel.
  const mx = x + (b.markerPos / 100) * w;
  const trailDir = b.markerDir >= 0 ? -1 : 1;
  const trailGrad = ctx.createLinearGradient(mx, 0, mx + trailDir * 22, 0);
  trailGrad.addColorStop(0, 'rgba(255,246,234,0.55)');
  trailGrad.addColorStop(1, 'rgba(255,246,234,0)');
  ctx.fillStyle = trailGrad;
  ctx.fillRect(Math.min(mx, mx + trailDir * 22), y, 22, h);

  ctx.fillStyle = '#fff6ea';
  ctx.beginPath();
  ctx.moveTo(mx - 5, y - 8);
  ctx.lineTo(mx + 5, y - 8);
  ctx.lineTo(mx, y);
  ctx.closePath();
  ctx.fill();
  ctx.fillRect(mx - 1.4, y, 2.8, h);

  ctx.font = '12px "Nunito", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#d6f0ea';
  ctx.globalAlpha = 0.9;
  ctx.fillText(
    b.trapActive ? 'Hit the gold zone — dodge the red!' : 'Click when the marker crosses the zone!',
    WORLD_W / 2, y + h + 20
  );
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawBanner(ctx, headline, sub) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = '#ffd08a';
  ctx.font = '26px "Pirata One", cursive';
  ctx.fillText(headline, WORLD_W / 2, 108);
  ctx.shadowBlur = 5;
  ctx.fillStyle = '#d6f0ea';
  ctx.font = '14px "Nunito", sans-serif';
  ctx.fillText(sub, WORLD_W / 2, 132);
  ctx.restore();
}

// Top HUD health bar: the white armor layer renders directly in front of
// (i.e. painted over, same track) the red segment bar instead of as a
// separate row stacked above it — the armor visually hides the creature's
// real health until it's cracked away.
function drawHUD(ctx, progress) {
  const w = 380, h = 22;
  const x = WORLD_W / 2 - w / 2, y = 26;

  ctx.save();
  ctx.textAlign = 'center';
  ctx.shadowColor = 'rgba(0,0,0,0.9)';
  ctx.shadowBlur = 6;
  ctx.fillStyle = '#ffd08a';
  ctx.font = '22px "Pirata One", cursive';
  ctx.fillText('BONASAUR', WORLD_W / 2, y - 8);
  ctx.shadowBlur = 0;
  ctx.restore();

  ctx.save();
  ctx.fillStyle = 'rgba(2,10,14,0.65)';
  roundedRect(ctx, x - 5, y - 5, w + 10, h + 10, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 180, 84, 0.4)';
  ctx.lineWidth = 1.5;
  roundedRect(ctx, x - 5, y - 5, w + 10, h + 10, 12);
  ctx.stroke();

  drawSkullBadge(ctx, x - 5, y + h / 2 - 5, 15);

  ctx.save();
  roundedRect(ctx, x, y, w, h, 6);
  ctx.clip();

  ctx.fillStyle = '#180c0c';
  ctx.fillRect(x, y, w, h);

  const segW = w / progress.segments.length;
  for (let i = 0; i < progress.segments.length; i++) {
    const remaining = 1 - progress.segments[i];
    const segGrad = ctx.createLinearGradient(0, y, 0, y + h);
    segGrad.addColorStop(0, '#ff9d8c');
    segGrad.addColorStop(0.55, '#a51f1f');
    segGrad.addColorStop(1, '#6e1414');
    ctx.fillStyle = segGrad;
    ctx.fillRect(x + i * segW, y, segW * remaining, h);
    if (i > 0) {
      ctx.strokeStyle = 'rgba(0,0,0,0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(x + i * segW, y); ctx.lineTo(x + i * segW, y + h); ctx.stroke();
    }
  }

  // Armor, painted in front of (over) the segment fill above — same bar,
  // not a second one — shrinking away as it takes hits.
  if (progress.armorFrac > 0) {
    const armorGrad = ctx.createLinearGradient(0, y, 0, y + h);
    armorGrad.addColorStop(0, '#fff8ea');
    armorGrad.addColorStop(1, '#c9bb96');
    ctx.fillStyle = armorGrad;
    ctx.fillRect(x, y, w * progress.armorFrac, h);
    ctx.strokeStyle = 'rgba(120, 100, 60, 0.6)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + w * progress.armorFrac, y);
    ctx.lineTo(x + w * progress.armorFrac, y + h);
    ctx.stroke();
  }
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 180, 84, 0.6)';
  ctx.lineWidth = 1.4;
  roundedRect(ctx, x, y, w, h, 6);
  ctx.stroke();

  ctx.restore();
}

function drawSkullBadge(ctx, cx, cy, r) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(r / 16, r / 16);
  const boneGrad = ctx.createLinearGradient(0, -14, 0, 12);
  boneGrad.addColorStop(0, '#efe4c8'); boneGrad.addColorStop(1, '#b8a97e');
  ctx.fillStyle = boneGrad;
  ctx.beginPath();
  ctx.moveTo(-13, 2);
  ctx.quadraticCurveTo(-15, -12, -2, -14);
  ctx.quadraticCurveTo(12, -15, 14, -3);
  ctx.quadraticCurveTo(15, 6, 6, 9);
  ctx.quadraticCurveTo(-2, 11, -6, 6);
  ctx.quadraticCurveTo(-9, 8, -13, 2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(35,24,14,0.7)'; ctx.lineWidth = 1.4; ctx.stroke();

  ctx.fillStyle = 'rgba(15,35,35,0.9)';
  ctx.beginPath(); ctx.ellipse(3, -3, 4.6, 3.8, 0, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = '#f0e8d8';
  for (let i = 0; i < 3; i++) {
    const fx = -9 + i * 4;
    ctx.beginPath();
    ctx.moveTo(fx, 6);
    ctx.lineTo(fx - 1.6, 10.5);
    ctx.lineTo(fx + 1.8, 10);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

function roundedRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
