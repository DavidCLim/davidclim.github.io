// Particle bursts, ripples, and screen flash — all driven off state.fx so
// there is one place tracking transient visual effects.
import { LOGICAL_W, LOGICAL_H } from '../core/canvas.js';

// Circles for the common case, a small 4-point sparkle mixed in for Shiny/
// Legendary+ bursts (the `big` flag) — a burst that's mostly circles with a
// few glinting points reads as "treasure" rather than just "more confetti."
export function spawnCatchBurst(state, x, y, color, big) {
  const count = big ? 34 : 18;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count + Math.random() * 0.4;
    const speed = (big ? 90 : 60) + Math.random() * (big ? 90 : 60);
    const sparkle = big && Math.random() < 0.3;
    state.fx.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 20,
      life: 0,
      maxLife: 0.7 + Math.random() * 0.5,
      color,
      size: (2 + Math.random() * (big ? 4 : 2.5)) * (sparkle ? 1.4 : 1),
      shape: sparkle ? 'sparkle' : 'circle',
      spin: (Math.random() - 0.5) * 6,
      angle: Math.random() * Math.PI * 2,
      glow: sparkle,
    });
  }
}

// A small spray of water droplets — the bobber landing, a nibble, a
// snapped line whipping the surface. Distinct from spawnCatchBurst: tight,
// low, fast-falling, and always blue/white rather than rarity-colored, so
// it reads as water rather than treasure.
export function spawnSplash(state, x, y, big) {
  const count = big ? 16 : 8;
  const palette = ['#c7f2e4', '#8fe9d9', '#eaf6f1'];
  for (let i = 0; i < count; i++) {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * Math.PI * 0.9;
    const speed = (big ? 70 : 40) + Math.random() * (big ? 70 : 40);
    state.fx.particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 0,
      maxLife: 0.35 + Math.random() * 0.3,
      color: palette[Math.floor(Math.random() * palette.length)],
      size: 1.4 + Math.random() * (big ? 2.4 : 1.6),
      shape: 'circle',
      spin: 0,
      angle: 0,
      glow: false,
      heavy: true,
    });
  }
}

export function spawnRipple(state, x, y, size = 1) {
  state.fx.ripples.push({ x, y, life: 0, maxLife: 0.9 * size, size });
}

// `x`/`y` pin the flash's hot spot (defaults to screen center) — a radial
// glow that originates from where the moment actually happened reads much
// more like "that thing right there just mattered" than a flat tint over
// the whole screen.
export function triggerScreenFlash(state, x = LOGICAL_W / 2, y = LOGICAL_H / 2) {
  state.fx.screenFlash = 1;
  state.fx.screenFlashX = x;
  state.fx.screenFlashY = y;
}

export function updateFx(state, dt) {
  state.fx.time += dt;

  const particles = state.fx.particles;
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life += dt;
    if (p.life >= p.maxLife) { particles.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    // Splash droplets fall harder and drag more than confetti, so they
    // arc and vanish quickly instead of drifting like the catch burst.
    p.vy += (p.heavy ? 260 : 140) * dt;
    p.vx *= (1 - dt * (p.heavy ? 1.1 : 0.6));
    if (p.spin) p.angle += p.spin * dt;
  }

  const ripples = state.fx.ripples;
  for (let i = ripples.length - 1; i >= 0; i--) {
    const r = ripples[i];
    r.life += dt;
    if (r.life >= r.maxLife) ripples.splice(i, 1);
  }

  if (state.fx.screenFlash > 0) {
    state.fx.screenFlash = Math.max(0, state.fx.screenFlash - dt * 2.2);
  }
}

function drawSparkle(ctx, x, y, size, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.beginPath();
  ctx.moveTo(0, -size);
  ctx.lineTo(size * 0.28, -size * 0.28);
  ctx.lineTo(size, 0);
  ctx.lineTo(size * 0.28, size * 0.28);
  ctx.lineTo(0, size);
  ctx.lineTo(-size * 0.28, size * 0.28);
  ctx.lineTo(-size, 0);
  ctx.lineTo(-size * 0.28, -size * 0.28);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

export function drawFx(ctx, state) {
  ctx.save();
  for (const r of state.fx.ripples) {
    const t = r.life / r.maxLife;
    const ease = 1 - Math.pow(1 - t, 2);
    // A second, tighter inner ring trailing the main one — reads as a real
    // expanding wave instead of one thin outline.
    const radius = ease * 34 * r.size;
    ctx.beginPath();
    ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(143, 233, 217, ${(1 - t) * 0.55})`;
    ctx.lineWidth = 1.6;
    ctx.stroke();
    if (t > 0.15) {
      const innerT = Math.max(0, t - 0.15);
      const innerEase = 1 - Math.pow(1 - innerT, 2);
      ctx.beginPath();
      ctx.arc(r.x, r.y, innerEase * 34 * r.size, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(232, 246, 241, ${(1 - t) * 0.3})`;
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  for (const p of state.fx.particles) {
    const t = p.life / p.maxLife;
    // A quick pop-in on spawn (first 12% of life) instead of appearing at
    // full size instantly — gives every particle a tiny bit of impact.
    const popIn = Math.min(1, p.life / (p.maxLife * 0.12));
    const size = p.size * popIn * (1 - t * 0.4);
    ctx.globalAlpha = 1 - t;
    if (p.glow) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.fillStyle = p.color;
    if (p.shape === 'sparkle') {
      drawSparkle(ctx, p.x, p.y, size, p.angle);
    } else {
      ctx.beginPath();
      ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function drawScreenFlash(ctx, state, w, h) {
  if (state.fx.screenFlash <= 0) return;
  ctx.save();
  const x = state.fx.screenFlashX != null ? state.fx.screenFlashX : w / 2;
  const y = state.fx.screenFlashY != null ? state.fx.screenFlashY : h / 2;
  const radius = Math.max(w, h) * 0.85;
  const grad = ctx.createRadialGradient(x, y, 0, x, y, radius);
  const a = state.fx.screenFlash;
  grad.addColorStop(0, `rgba(255, 244, 214, ${a * 0.5})`);
  grad.addColorStop(0.55, `rgba(255, 244, 214, ${a * 0.22})`);
  grad.addColorStop(1, 'rgba(255, 244, 214, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
  ctx.restore();
}
