// The big units are dozens of shapes apiece, which is slow to draw every frame, while stamping a saved picture costs
// next to nothing. So each of them is drawn into a picture of its own, stamped where he is now, and the picture is only
// drawn afresh as often as there is time for: every frame when there are a few of them, less often in a crowd. They
// still move smoothly, since the picture goes wherever they go.

// weight: roughly how much work one is to draw. half: how far the picture reaches to each side of him; up and down:
// above and below (world units, generous enough for his leaps, flights and swung weapons)
const PICTURED = {
  gibbondore: { weight: 8, half: 52, up: 88, down: 26 },
  gandalligator: { weight: 7, half: 54, up: 92, down: 26, planted: true }, // (planted: see below)
  mechazord: { weight: 8, half: 52, up: 108, down: 32 },
  chimera: { weight: 16, half: 188, up: 250, down: 70, planted: true },
  gatlingtrooper: { weight: 6, half: 36, up: 76, down: 24 },
  juggernaut: { weight: 6, half: 38, up: 94, down: 22 },
  trooper: { weight: 1.5, half: 46, up: 74, down: 20 },
  jettrooper: { weight: 1.2, half: 30, up: 92, down: 20 },
  malftrooper: { weight: 2.8, half: 34, up: 76, down: 20, planted: true },
  shieldtrooper: { weight: 3, half: 40, up: 80, down: 24 },
};
const BUDGET = 16; // how much weight is drawn afresh in a frame before they start taking turns
const SLOWEST = 6; // and the longest any of them waits, in frames

const pictures = new WeakMap();
let frame = 0;
let every = 1;
let last = 0;
let pace = 16.7; // ms a frame has been taking lately
let extra = 0; // frames more they wait while the computer is not keeping up

export function beginUnitPictures(units) {
  frame++;
  let total = 0;
  for (const u of units) {
    const p = PICTURED[u.species];
    if (p) total += p.weight;
  }
  const now = performance.now();
  if (last) pace += (Math.min(200, now - last) - pace) * 0.08;
  last = now;
  if (frame % 20 === 0) extra = pace > 26 ? Math.min(3, extra + 1) : pace < 19 ? Math.max(0, extra - 1) : extra;
  const share = Math.max(1, Math.ceil(total / BUDGET));
  every = Math.min(SLOWEST, share + Math.min(extra, share));
}

function make(spec, dpr) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil(spec.half * 2 * dpr);
  canvas.height = Math.ceil((spec.up + spec.down) * dpr);
  const g = canvas.getContext('2d');
  const pic = { canvas, g, dpr, ox: 0, oy: 0, at: -1, facing: 0, dx: 0, dy: 0 };
  // everything that draws him places itself on the field with setTransform, so the picture's corner is taken off there
  const place = g.setTransform.bind(g);
  pic.place = place;
  g.setTransform = (a, b, c, d, e, f) => place(a, b, c, d, e - pic.ox, f - pic.oy);
  return pic;
}

// `draw(g)` draws the unit onto whatever context it is given, in field coordinates
export function drawPictured(ctx, dpr, u, draw) {
  const spec = PICTURED[u.species];
  // (only a real unit is worth keeping a picture of: a passing copy, as at a tower window, is drawn straight)
  if (!spec || u.perch || every <= 1 || u.id === undefined) {
    draw(ctx);
    return;
  }
  let pic = pictures.get(u);
  if (!pic || pic.dpr !== dpr) pictures.set(u, (pic = make(spec, dpr)));
  const due = pic.at < 0 || pic.facing !== u.facing || frame - pic.at >= every * 2 || (frame + u.id) % every === 0;
  if (due) {
    pic.at = frame;
    pic.facing = u.facing;
    pic.ox = Math.round((u.x - spec.half) * dpr);
    pic.oy = Math.round((u.y - spec.up) * dpr);
    // where he was within the picture, so it can be put back exactly under him wherever he has got to
    pic.dx = pic.ox - u.x * dpr;
    pic.dy = pic.oy - u.y * dpr;
    pic.place(1, 0, 0, 1, 0, 0);
    pic.g.clearRect(0, 0, pic.canvas.width, pic.canvas.height);
    pic.g.globalAlpha = 1;
    pic.g.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(pic.g);
  }
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  // (`planted`: he stays where he was drawn until drawn again, so that his feet don't slide along with the picture)
  if (spec.planted) ctx.drawImage(pic.canvas, pic.ox, pic.oy);
  else ctx.drawImage(pic.canvas, Math.round(u.x * dpr + pic.dx), Math.round(u.y * dpr + pic.dy));
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}
