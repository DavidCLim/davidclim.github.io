// Morris's rapport system and daily recommendation — split out from
// morrisDialogue.js (which owns the actual conversation tree) so the map
// (ui/mapPanel.js) and travel (world/travel.js) can read rapport/the pick
// without importing dialogue content they don't need.
import { REGIONS, isRegionLocked } from './regions.js';
import { todayBountyKey } from './bounties.js';

// Talked-to-Morris count (state.npc.morris.talkCount, incremented once per
// exchange by ui/dialogue.js) maps onto four rapport tiers. `travelMult`
// scales world/travel.js's base rowing time — the more he trusts you, the
// harder he rows.
export const MORRIS_RAPPORT_TIERS = [
  { min: 0, id: 'stranger', label: 'Stranger', travelMult: 1 },
  { min: 3, id: 'shipmate', label: 'Shipmate', travelMult: 0.88 },
  { min: 8, id: 'trusted', label: 'Trusted Hand', travelMult: 0.75 },
  { min: 15, id: 'oldSalt', label: 'Old Salt', travelMult: 0.6 },
];

export function morrisRapportTier(state) {
  const talk = (state.npc.morris && state.npc.morris.talkCount) || 0;
  let tier = MORRIS_RAPPORT_TIERS[0];
  for (const t of MORRIS_RAPPORT_TIERS) {
    if (talk >= t.min) tier = t;
  }
  return tier;
}

export function morrisTravelMultiplier(state) {
  return morrisRapportTier(state).travelMult;
}

// A small string hash so "Morris's Pick" is deterministic for the whole
// day (same local-date key world/regions.js's other daily systems use)
// without needing its own persisted state — it's recomputed fresh each
// time, purely a function of the date and which regions are unlocked.
function hashStr(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

// Today's region Morris is quietly steering you toward — any unlocked,
// non-home region is eligible, so the pick keeps making sense as new
// regions unlock over the course of a save.
export function morrisPickRegionId(state) {
  const pool = REGIONS.filter(r => !r.home && !isRegionLocked(state, r));
  if (!pool.length) return null;
  const idx = hashStr(todayBountyKey()) % pool.length;
  return pool[idx].id;
}
