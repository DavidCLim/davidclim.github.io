import { regionById } from '../data/regions.js';
import { morrisTravelMultiplier } from '../data/morris.js';

export const BASE_TRAVEL_DURATION = 2.6;

// Starts the rowing loading-screen; the actual region switch happens once
// updateTravel() reports the trip has finished. Duration scales with how
// well Morris knows you by now (data/morris.js's rapport tiers) — a
// trusted regular gets rowed out faster than a first-timer.
export function beginTravel(state, toRegionId) {
  state.ui.mapOpen = false;
  state.ui.dialogue = null;
  const duration = BASE_TRAVEL_DURATION * morrisTravelMultiplier(state);
  state.ui.travel = { toRegionId, elapsed: 0, duration };
  state.ui.activeOverlay = 'travel';
}

// Advances the trip timer. Returns the arrived region once the trip
// completes (and applies the region switch), otherwise null.
export function updateTravel(state, dt) {
  const travel = state.ui.travel;
  if (!travel) return null;

  travel.elapsed += dt;
  if (travel.elapsed < travel.duration) return null;

  state.currentRegion = travel.toRegionId;
  state.regionsVisited[travel.toRegionId] = true;
  state.ui.travel = null;
  state.ui.activeOverlay = null;
  return regionById(travel.toRegionId);
}
