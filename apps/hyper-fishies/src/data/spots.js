// Fishing spot definitions. There's a single spot now — the Dock, at the
// pier's water edge. Reaching it switches the whole game to a dedicated
// side-view fishing scene (see render/drawDockScene.js); everything below
// still just describes a top-down interaction zone + cast-origin vector for
// the fishing state machine's internal math.
export const SPOTS = [
  {
    id: 'dock',
    label: 'The Dock',
    x: 760, y: 175, radius: 75,
    castOrigin: { x: 760, y: 95 },
    tags: ['dock'],
    blurb: 'The lantern-lit dock at the end of the pier. Cast out into the deep.',
  },
];

export function spotById(id) {
  return SPOTS.find(s => s.id === id) || null;
}
