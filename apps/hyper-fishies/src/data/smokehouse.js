// The Smokehouse (ui/marketPanel.js's Smokehouse tab) — a slower, higher-
// value alternative to selling a catch on the spot. Curing takes real
// wall-clock time rather than a game tick, so it's a genuine "start it, walk
// away, come back later" choice against the instant gratification of a
// straight sale, capped at SMOKEHOUSE_SLOTS so it can't just absorb the
// whole bag at once.
export const SMOKEHOUSE_SLOTS = 3;
export const SMOKE_DURATION_MS = 4 * 60 * 1000;
export const SMOKE_VALUE_MULT = 1.75;
