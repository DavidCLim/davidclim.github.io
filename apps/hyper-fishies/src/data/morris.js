// Morris's daily recommendation — split out from morrisDialogue.js (which
// owns the actual conversation tree) so the map (ui/mapPanel.js) can read
// the pick without importing dialogue content it doesn't need.
import { REGIONS, isRegionLocked } from './regions.js';
import { todayBountyKey } from './bounties.js';

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
