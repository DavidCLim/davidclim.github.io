// The cursed hallway route — a single winding polyline enemies walk along,
// start to finish, in logical canvas coordinates (see core/canvas.js's
// LOGICAL_W/LOGICAL_H). Off-canvas endpoints (negative x, > LOGICAL_W) are
// deliberate: the portal and the exit both sit just past the visible edge
// so enemies spawn from/vanish into darkness instead of popping into
// existence mid-frame.
export const LOGICAL_W = 960;
export const LOGICAL_H = 600;

export const PATH = [
  { x: -40, y: 110 },
  { x: 230, y: 110 },
  { x: 230, y: 330 },
  { x: 570, y: 330 },
  { x: 570, y: 90 },
  { x: 800, y: 90 },
  { x: 800, y: 430 },
  { x: 400, y: 430 },
  { x: 400, y: 560 },
  { x: 1000, y: 560 },
];

// Precomputed cumulative length at each waypoint, so a walker's progress
// (0..totalLength) can be turned into an {x,y,angle} without re-summing
// the whole path every frame.
function buildLengths(points) {
  const lens = [0];
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1], b = points[i];
    lens.push(lens[i - 1] + Math.hypot(b.x - a.x, b.y - a.y));
  }
  return lens;
}
export const PATH_LENGTHS = buildLengths(PATH);
export const PATH_TOTAL_LENGTH = PATH_LENGTHS[PATH_LENGTHS.length - 1];

// Walks `dist` units along PATH from the start and returns the point +
// facing angle there — the one function every enemy's per-frame movement
// boils down to.
export function pointAtDistance(dist) {
  const d = Math.max(0, Math.min(PATH_TOTAL_LENGTH, dist));
  let i = 1;
  while (i < PATH_LENGTHS.length && PATH_LENGTHS[i] < d) i++;
  i = Math.min(i, PATH.length - 1);
  const a = PATH[i - 1], b = PATH[i];
  const segLen = PATH_LENGTHS[i] - PATH_LENGTHS[i - 1];
  const t = segLen > 0 ? (d - PATH_LENGTHS[i - 1]) / segLen : 0;
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
    angle: Math.atan2(b.y - a.y, b.x - a.x),
  };
}

// Fixed placement circles for towers, hand-set just off the path so every
// slot has a clean line of sight to a nearby stretch of it. `id` doubles
// as the DOM/save key for whatever's placed there.
export const TOWER_SLOTS = [
  { id: 's1', x: 90, y: 55 },
  { id: 's2', x: 90, y: 175 },
  { id: 's3', x: 340, y: 175 },
  { id: 's4', x: 140, y: 330 },
  { id: 's5', x: 340, y: 260 },
  { id: 's6', x: 400, y: 400 },
  { id: 's7', x: 500, y: 200 },
  { id: 's8', x: 640, y: 200 },
  { id: 's9', x: 690, y: 40 },
  { id: 's10', x: 730, y: 260 },
  { id: 's11', x: 870, y: 260 },
  { id: 's12', x: 600, y: 375 },
  { id: 's13', x: 600, y: 495 },
  { id: 's14', x: 330, y: 495 },
  { id: 's15', x: 700, y: 500 },
  { id: 's16', x: 870, y: 500 },
];
