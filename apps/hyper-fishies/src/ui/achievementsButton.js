import { el } from '../util/dom.js';

// A persistent trophy-shaped button, always available — opens the
// Achievements panel (ui/achievementsPanel.js).
function drawTrophyIcon(ctx) {
  ctx.clearRect(0, 0, 40, 40);
  ctx.save();
  ctx.translate(20, 20);

  // Cup bowl
  const cupGrad = ctx.createLinearGradient(-10, -12, 10, 4);
  cupGrad.addColorStop(0, '#ffe9a8');
  cupGrad.addColorStop(1, '#c9a227');
  ctx.fillStyle = cupGrad;
  ctx.beginPath();
  ctx.moveTo(-10, -12);
  ctx.lineTo(10, -12);
  ctx.quadraticCurveTo(9, 2, 0, 5);
  ctx.quadraticCurveTo(-9, 2, -10, -12);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(122, 74, 20, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Handles
  ctx.strokeStyle = '#c9a227';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(-13, -8, 4.5, -0.6, 2.2); ctx.stroke();
  ctx.beginPath(); ctx.arc(13, -8, 4.5, Math.PI - 2.2, Math.PI + 0.6); ctx.stroke();

  // A little shine
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1.2;
  ctx.beginPath(); ctx.moveTo(-5, -9); ctx.lineTo(-6, -1); ctx.stroke();

  // Stem + base
  ctx.fillStyle = '#c9a227';
  ctx.fillRect(-2, 5, 4, 5);
  ctx.beginPath();
  ctx.moveTo(-7, 10); ctx.lineTo(7, 10); ctx.lineTo(5, 14); ctx.lineTo(-5, 14);
  ctx.closePath(); ctx.fill();
  ctx.strokeStyle = 'rgba(122, 74, 20, 0.6)';
  ctx.lineWidth = 1;
  ctx.stroke();

  ctx.restore();
}

export function buildAchievementsButton(root, onClick) {
  const canvas = el('canvas', { width: 40, height: 40 });
  drawTrophyIcon(canvas.getContext('2d'));

  const btn = el('button', {
    class: 'almanac-btn achievements-btn',
    'aria-label': 'Achievements',
    onClick,
  }, [canvas]);

  root.appendChild(btn);
  return { btn };
}
