import { el } from '../util/dom.js';

// A persistent book-shaped button — always available regardless of where
// the player is standing — that opens the Captain's Log (almanac) panel.
function drawBookIcon(ctx) {
  ctx.clearRect(0, 0, 40, 40);
  ctx.save();
  ctx.translate(20, 21);

  // Pages (open book, seen from above)
  ctx.fillStyle = '#f0e2c4';
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.quadraticCurveTo(-13, -8, -13, -2);
  ctx.quadraticCurveTo(-13, 8, 0, 10);
  ctx.quadraticCurveTo(13, 8, 13, -2);
  ctx.quadraticCurveTo(13, -8, 0, -2);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(58,42,22,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Spine shadow
  ctx.strokeStyle = 'rgba(58,42,22,0.5)';
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.moveTo(0, -2);
  ctx.lineTo(0, 9.5);
  ctx.stroke();

  // Text lines on each page
  ctx.strokeStyle = 'rgba(122,46,46,0.55)';
  ctx.lineWidth = 0.9;
  for (let i = 0; i < 3; i++) {
    const y = 0 + i * 2.6;
    ctx.beginPath();
    ctx.moveTo(-9, y);
    ctx.lineTo(-2.5, y + (i - 1) * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(2.5, y + (i - 1) * 0.4);
    ctx.lineTo(9, y);
    ctx.stroke();
  }

  // Gold bookmark ribbon
  ctx.fillStyle = '#ffb454';
  ctx.beginPath();
  ctx.moveTo(4, -7);
  ctx.lineTo(7, -7);
  ctx.lineTo(7, 3);
  ctx.lineTo(5.5, 1);
  ctx.lineTo(4, 3);
  ctx.closePath();
  ctx.fill();

  ctx.restore();
}

export function buildAlmanacButton(root, onClick) {
  const canvas = el('canvas', { width: 40, height: 40 });
  drawBookIcon(canvas.getContext('2d'));

  const btn = el('button', {
    class: 'almanac-btn',
    'aria-label': "Captain's Log",
    onClick,
  }, [canvas]);

  root.appendChild(btn);
  return { btn };
}
