import { el } from '../util/dom.js';

// A persistent satchel-shaped button, always available regardless of where
// the player is standing — opens the read-only "everything currently in
// your bag" panel (as opposed to the Trading Post, which is for selling).
function drawSatchelIcon(ctx) {
  ctx.clearRect(0, 0, 40, 40);
  ctx.save();
  ctx.translate(20, 22);

  // Strap, looping up and over
  ctx.strokeStyle = '#8a6239';
  ctx.lineWidth = 2.6;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(-11, -6);
  ctx.quadraticCurveTo(-9, -16, 0, -16);
  ctx.quadraticCurveTo(9, -16, 11, -6);
  ctx.stroke();

  // Bag body — rounded trapezoid pouch
  const bodyGrad = ctx.createLinearGradient(0, -6, 0, 13);
  bodyGrad.addColorStop(0, '#9a6a3c');
  bodyGrad.addColorStop(1, '#6b4526');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.moveTo(-13, -4);
  ctx.quadraticCurveTo(-14, 4, -11, 11);
  ctx.quadraticCurveTo(-8, 14, 0, 14);
  ctx.quadraticCurveTo(8, 14, 11, 11);
  ctx.quadraticCurveTo(14, 4, 13, -4);
  ctx.quadraticCurveTo(0, -9, -13, -4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(58,42,22,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Stitching seams
  ctx.strokeStyle = 'rgba(240, 226, 196, 0.35)';
  ctx.lineWidth = 0.8;
  ctx.setLineDash([1.4, 1.6]);
  ctx.beginPath();
  ctx.moveTo(-10, 4);
  ctx.quadraticCurveTo(0, 8, 10, 4);
  ctx.stroke();
  ctx.setLineDash([]);

  // Flap, folded over the top
  ctx.fillStyle = '#7a4f2c';
  ctx.beginPath();
  ctx.moveTo(-12, -4);
  ctx.quadraticCurveTo(0, 3, 12, -4);
  ctx.quadraticCurveTo(9, -12, 0, -13);
  ctx.quadraticCurveTo(-9, -12, -12, -4);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = 'rgba(58,42,22,0.5)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Brass buckle
  ctx.fillStyle = '#ffb454';
  ctx.beginPath();
  ctx.arc(0, -3, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#6b4526';
  ctx.beginPath();
  ctx.arc(0, -3, 1.3, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function buildSatchelButton(root, onClick) {
  const canvas = el('canvas', { width: 40, height: 40 });
  drawSatchelIcon(canvas.getContext('2d'));

  const btn = el('button', {
    class: 'almanac-btn satchel-btn',
    'aria-label': 'Satchel',
    onClick,
  }, [canvas]);

  root.appendChild(btn);
  return { btn };
}
