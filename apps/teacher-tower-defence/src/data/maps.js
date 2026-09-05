// The three battlefields — a single horizontal lane, matching the
// player's own sketch: the Teacher's Base sits on the left (where
// teachers spawn and march right), and the Student Base sits on the
// right — that's your base, where deployed students spawn and march
// left to intercept them.
export const LOGICAL_W = 960;
export const LOGICAL_H = 600;

const LANE_Y = 380;

function mkMap(id, name, icon, theme, crystal) {
  return {
    id, name, icon, theme, crystal,
    laneY: LANE_Y,
    base: { x: LOGICAL_W - 100, y: LANE_Y },
    spawn: { x: 70, y: LANE_Y },
  };
}

// Each chapter drops its own awaken crystal on every clear (not just the
// first), same as farming a stage for Catfruit — and MAP_LIST's order
// below is also chapter order: clearing one unlocks the next, but every
// cleared chapter stays replayable forever after (see
// isChapterUnlocked/clearChapter in game/collection.js).
export const MAPS = {
  class: mkMap('class', 'Classroom', '📝', 'classroom', { id: 'crystal_class', name: 'Chalk Crystal', icon: '🔷' }),
  ish: mkMap('ish', 'I.S. Hall', '🚪', 'hallway', { id: 'crystal_ish', name: 'Detention Crystal', icon: '🔶' }),
  lounge: mkMap('lounge', 'The Lounge', '🛋️', 'lounge', { id: 'crystal_lounge', name: 'Lounge Crystal', icon: '🔮' }),
};

export const MAP_LIST = Object.values(MAPS);
