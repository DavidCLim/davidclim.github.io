import { el } from '../util/dom.js';

// A persistent podium-shaped button, always available — opens the
// Leaderboard panel (ui/leaderboardPanel.js).
function drawPodiumIcon(ctx) {
  ctx.clearRect(0, 0, 40, 40);
  ctx.save();
  ctx.translate(20, 20);

  const bars = [
    { x: -14, w: 10, h: 12, top: 6 },
    { x: -3, w: 10, h: 18, top: 0 },
    { x: 8, w: 10, h: 8, top: 10 },
  ];
  for (const b of bars) {
    const grad = ctx.createLinearGradient(b.x, b.top, b.x, b.top + b.h);
    grad.addColorStop(0, '#ffe9a8');
    grad.addColorStop(1, '#c9a227');
    ctx.fillStyle = grad;
    ctx.fillRect(b.x, b.top, b.w, b.h);
    ctx.strokeStyle = 'rgba(122, 74, 20, 0.6)';
    ctx.lineWidth = 1;
    ctx.strokeRect(b.x, b.top, b.w, b.h);
  }

  // A little star over the tallest (center) bar, the "#1" cue.
  ctx.fillStyle = '#ffd670';
  ctx.strokeStyle = 'rgba(122, 74, 20, 0.6)';
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * 2 * Math.PI) / 5;
    const ao = -Math.PI / 2 + ((i + 0.5) * 2 * Math.PI) / 5;
    ctx.lineTo(Math.cos(a) * 4.5, -8 + Math.sin(a) * 4.5);
    ctx.lineTo(Math.cos(ao) * 2, -8 + Math.sin(ao) * 2);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  ctx.restore();
}

export function buildLeaderboardButton(root, onClick) {
  const canvas = el('canvas', { width: 40, height: 40 });
  drawPodiumIcon(canvas.getContext('2d'));

  const btn = el('button', {
    class: 'almanac-btn leaderboard-btn',
    'aria-label': 'Leaderboard',
    onClick,
  }, [canvas]);

  root.appendChild(btn);
  return { btn };
}
