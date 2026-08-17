import { el } from '../util/dom.js';

// A persistent profile-card button, always available — opens the captain's
// profile: avatar, name, best streak, best fish, current rod, current gold.
function drawProfileIcon(ctx) {
  ctx.clearRect(0, 0, 40, 40);
  ctx.save();
  ctx.translate(20, 20);

  // A small ID-card frame
  ctx.fillStyle = '#3c2a1a';
  ctx.beginPath();
  ctx.roundRect(-14, -11, 28, 22, 3);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,180,84,0.4)';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Portrait bust — head + shoulders silhouette
  ctx.fillStyle = '#e8b78a';
  ctx.beginPath();
  ctx.arc(0, -4, 4.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(-7, 8);
  ctx.quadraticCurveTo(-7, 0, 0, -0.5);
  ctx.quadraticCurveTo(7, 0, 7, 8);
  ctx.closePath();
  ctx.fill();

  // A little hat brim, echoing the fisherman hat
  ctx.fillStyle = '#c9a876';
  ctx.beginPath();
  ctx.ellipse(0, -8.5, 5.4, 1.8, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function buildProfileButton(root, onClick) {
  const canvas = el('canvas', { width: 40, height: 40 });
  drawProfileIcon(canvas.getContext('2d'));

  const btn = el('button', {
    class: 'almanac-btn profile-btn',
    'aria-label': 'Profile',
    onClick,
  }, [canvas]);

  root.appendChild(btn);
  return { btn };
}
