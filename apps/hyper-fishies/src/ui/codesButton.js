import { el } from '../util/dom.js';

// A persistent key-shaped button, always available — opens the Codes
// panel (ui/codesPanel.js) for redeeming codes.
function drawKeyIcon(ctx) {
  ctx.clearRect(0, 0, 40, 40);
  ctx.save();
  ctx.translate(20, 20);
  ctx.rotate(-0.6);

  // Bow (the ring end)
  const grad = ctx.createLinearGradient(-12, -8, -12, 4);
  grad.addColorStop(0, '#ffe9a8');
  grad.addColorStop(1, '#c9a227');
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3.4;
  ctx.beginPath();
  ctx.arc(-9, -2, 5, 0, Math.PI * 2);
  ctx.stroke();

  // Shaft
  ctx.strokeStyle = grad;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(-4, -2);
  ctx.lineTo(11, -2);
  ctx.stroke();

  // Teeth
  ctx.beginPath();
  ctx.moveTo(6, -2); ctx.lineTo(6, 4);
  ctx.moveTo(11, -2); ctx.lineTo(11, 5);
  ctx.stroke();

  ctx.strokeStyle = 'rgba(122, 74, 20, 0.6)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(-9, -2, 5, 0, Math.PI * 2); ctx.stroke();

  ctx.restore();
}

export function buildCodesButton(root, onClick) {
  const canvas = el('canvas', { width: 40, height: 40 });
  drawKeyIcon(canvas.getContext('2d'));

  const btn = el('button', {
    class: 'almanac-btn codes-btn',
    'aria-label': 'Codes',
    onClick,
  }, [canvas]);

  root.appendChild(btn);
  return { btn };
}
