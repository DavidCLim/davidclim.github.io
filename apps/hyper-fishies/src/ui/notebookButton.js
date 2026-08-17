import { el } from '../util/dom.js';

// A persistent notebook-shaped button, always available — opens the quest
// log (Richy's secret favor, once it's been offered).
function drawNotebookIcon(ctx) {
  ctx.clearRect(0, 0, 40, 40);
  ctx.save();
  ctx.translate(20, 20);

  // Cover — a small leather-bound book, slightly turned
  const coverGrad = ctx.createLinearGradient(-13, -14, 13, 14);
  coverGrad.addColorStop(0, '#5a4128');
  coverGrad.addColorStop(1, '#3c2a1a');
  ctx.fillStyle = coverGrad;
  ctx.beginPath();
  ctx.roundRect(-13, -14, 26, 28, 2.5);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,180,84,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Page edges peeking out along the right side
  ctx.fillStyle = '#e8dcc0';
  ctx.fillRect(9, -12, 3, 24);
  ctx.strokeStyle = 'rgba(58,42,22,0.3)';
  ctx.lineWidth = 0.6;
  for (let y = -11; y < 12; y += 3) {
    ctx.beginPath(); ctx.moveTo(9, y); ctx.lineTo(12, y); ctx.stroke();
  }

  // A ribbon bookmark hanging from the top
  ctx.fillStyle = '#7a2e2e';
  ctx.beginPath();
  ctx.moveTo(-3, -14);
  ctx.lineTo(1, -14);
  ctx.lineTo(1, 8);
  ctx.lineTo(-1, 5);
  ctx.lineTo(-3, 8);
  ctx.closePath();
  ctx.fill();

  // A couple of scrawled ink lines on the cover, like a title
  ctx.strokeStyle = 'rgba(255, 226, 180, 0.35)';
  ctx.lineWidth = 1.2;
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-9, -6); ctx.lineTo(3, -6); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-9, -2); ctx.lineTo(5, -2); ctx.stroke();

  ctx.restore();
}

export function buildNotebookButton(root, onClick) {
  const canvas = el('canvas', { width: 40, height: 40 });
  drawNotebookIcon(canvas.getContext('2d'));

  const btn = el('button', {
    class: 'almanac-btn notebook-btn',
    'aria-label': 'Quest Notebook',
    onClick,
  }, [canvas]);

  root.appendChild(btn);
  return { btn };
}
