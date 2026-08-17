import { el } from '../util/dom.js';
import { regionById } from '../data/regions.js';

const W = 480, H = 200;

function drawScene(ctx, progress, t) {
  ctx.clearRect(0, 0, W, H);

  const grad = ctx.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, '#0b2733');
  grad.addColorStop(1, '#021620');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = 'rgba(143, 233, 217, 0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 5; i++) {
    const y = 40 + i * 28;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 12) {
      const wob = Math.sin(x * 0.05 + t * 2 + i) * 3;
      if (x === 0) ctx.moveTo(x, y + wob); else ctx.lineTo(x, y + wob);
    }
    ctx.stroke();
  }

  const boatX = 40 + progress * (W - 80);
  const boatY = 130 + Math.sin(t * 3) * 3;

  ctx.save();
  ctx.translate(boatX, boatY);

  ctx.globalAlpha = 0.3;
  ctx.fillStyle = '#020c12';
  ctx.beginPath();
  ctx.ellipse(0, 16, 30, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = '#5a3f28';
  ctx.beginPath();
  ctx.moveTo(-28, 6);
  ctx.quadraticCurveTo(0, 18, 28, 6);
  ctx.lineTo(22, -2);
  ctx.lineTo(-22, -2);
  ctx.closePath();
  ctx.fill();

  const row = Math.sin(t * 5);
  ctx.strokeStyle = '#3c2a1a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(-8, -4);
  ctx.lineTo(-26 - row * 6, 4 + row * 4);
  ctx.moveTo(-8, -4);
  ctx.lineTo(10 + row * 6, 6 - row * 4);
  ctx.stroke();

  // Morris (rowing)
  ctx.fillStyle = '#243a42';
  ctx.fillRect(-13, -14, 8, 12);
  ctx.fillStyle = '#d9ab7c';
  ctx.beginPath();
  ctx.arc(-9, -17, 4.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#7a2e2e';
  ctx.beginPath();
  ctx.arc(-9, -19, 4.8, Math.PI, Math.PI * 2);
  ctx.fill();

  // Passenger
  ctx.fillStyle = '#7a2e2e';
  ctx.fillRect(4, -13, 8, 11);
  ctx.fillStyle = '#e0b385';
  ctx.beginPath();
  ctx.arc(8, -16, 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#1c1512';
  ctx.beginPath();
  ctx.ellipse(8, -19, 5.6, 2.6, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function buildTravelScreen(root) {
  const canvas = el('canvas', { width: W, height: H, class: 'travel-canvas' });
  const label = el('div', { class: 'travel-label' });
  const barFill = el('div', { class: 'travel-bar-fill' });
  const bar = el('div', { class: 'travel-bar' }, [barFill]);
  const wrap = el('div', { class: 'travel-wrap hidden' }, [
    el('div', { class: 'travel-box' }, [
      el('div', { class: 'travel-title' }, 'Rowing Out'),
      canvas,
      label,
      bar,
    ]),
  ]);
  root.appendChild(wrap);
  return { wrap, canvas, label, barFill };
}

export function updateTravelScreen(refs, state) {
  const travel = state.ui.travel;
  if (!travel) {
    refs.wrap.classList.add('hidden');
    return;
  }
  refs.wrap.classList.remove('hidden');

  const progress = Math.min(1, travel.elapsed / travel.duration);
  const region = regionById(travel.toRegionId);
  refs.label.textContent = `Rowing to ${region.name}...`;
  refs.barFill.style.width = `${progress * 100}%`;

  drawScene(refs.canvas.getContext('2d'), progress, state.fx.time);
}
