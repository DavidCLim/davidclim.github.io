import { regionById } from '../data/regions.js';

export const BASE_TRAVEL_DURATION = 2.6;

// Starts the rowing loading-screen; the actual region switch happens once
// updateTravel() reports the trip has finished.
export function beginTravel(state, toRegionId) {
  state.ui.mapOpen = false;
  state.ui.dialogue = null;
  state.ui.travel = { toRegionId, elapsed: 0, duration: BASE_TRAVEL_DURATION };
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
