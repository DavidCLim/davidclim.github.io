// The three battlefields — a single horizontal lane, matching the
// player's own sketch: the Teacher's Base sits on the left (where
// teachers spawn and march right), and the Student Base sits on the
// right — that's your base, where deployed students spawn and march
// left to intercept them.
export const LOGICAL_W = 960;
export const LOGICAL_H = 600;

const LANE_Y = 380;

function mkMap(id, name, icon, theme) {
  return {
    id, name, icon, theme,
    laneY: LANE_Y,
    base: { x: LOGICAL_W - 100, y: LANE_Y },
    spawn: { x: 70, y: LANE_Y },
  };
}

export const MAPS = {
  class: mkMap('class', 'Classroom', '📝', 'classroom'),
  ish: mkMap('ish', 'I.S. Hall', '🚪', 'hallway'),
  lounge: mkMap('lounge', 'The Lounge', '🛋️', 'lounge'),
};

export const MAP_LIST = Object.values(MAPS);
