import { el } from '../util/dom.js';

// A persistent "?" button, always available — opens the How to Play
// reference panel (ui/helpPanel.js).
function drawHelpIcon(ctx) {
  ctx.clearRect(0, 0, 40, 40);
  ctx.save();
  ctx.translate(20, 20);

  const glow = ctx.createRadialGradient(0, 0, 2, 0, 0, 17);
  glow.addColorStop(0, 'rgba(143, 233, 217, 0.35)');
  glow.addColorStop(1, 'rgba(143, 233, 217, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath(); ctx.arc(0, 0, 17, 0, Math.PI * 2); ctx.fill();

  ctx.strokeStyle = 'rgba(143, 233, 217, 0.75)';
  ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.arc(0, 0, 14, 0, Math.PI * 2); ctx.stroke();

  ctx.fillStyle = '#e8fff9';
  ctx.font = '700 20px "Pirata One", cursive';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('?', 0, 1);

  ctx.restore();
}

export function buildHelpButton(root, onClick) {
  const canvas = el('canvas', { width: 40, height: 40 });
  drawHelpIcon(canvas.getContext('2d'));

  const btn = el('button', {
    class: 'almanac-btn help-btn',
    'aria-label': 'How to Play',
    onClick,
  }, [canvas]);

  root.appendChild(btn);
  return { btn };
}
