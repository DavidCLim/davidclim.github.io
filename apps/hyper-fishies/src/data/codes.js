import { ACHIEVEMENTS } from './achievements.js';
import { MAX_LEVEL } from './ranks.js';
import { BAG } from '../core/constants.js';
import { HOOKS } from './hooks.js';
import { LINES } from './fishingLine.js';
import { SWIVELS } from './swivels.js';
import { SCALES } from './scales.js';

function bestOf(list, field) {
  return list.reduce((a, b) => (b[field] > a[field] ? b : a));
}

function grantAndEquip(slot, id) {
  if (!slot.owned.includes(id)) slot.owned.push(id);
  slot.equipped = id;
}

// Case/whitespace-insensitive redeemable codes — a fun single-player
// extra, not a security boundary of any kind (this is a client-side save
// file, there's nothing here worth protecting). Each entry's `apply`
// mutates state directly instead of routing through the normal buy/equip
// economy functions, since a cheat code granting things for free is the
// whole point — there's no coin cost to deduct.
export const CODES = {
  '54NTHONY_ADMIN_CODE': {
    apply(state) {
      state.coins = 999999999;
      state.level = MAX_LEVEL;
      state.exp = 0;
      state.bag.capacityTier = BAG.upgrades.length - 1;

      grantAndEquip(state.hook, bestOf(HOOKS, 'snapGuard').id);
      grantAndEquip(state.line, bestOf(LINES, 'biteSpeed').id);
      grantAndEquip(state.swivel, bestOf(SWIVELS, 'luck').id);
      grantAndEquip(state.scale, bestOf(SCALES, 'valueMul').id);
      grantAndEquip(state.rod, 'adminRod');

      for (const a of ACHIEVEMENTS) state.achievements[a.id] = true;

      return "Admin powers granted — infinite gold, level 100, best-in-slot gear, every achievement, and the Admin's Rod.";
    },
  },
};

export function redeemCode(state, rawInput) {
  const key = (rawInput || '').trim().toUpperCase();
  const code = CODES[key];
  if (!code) return { ok: false, message: rawInput && rawInput.trim() ? "That code doesn't ring a bell." : 'Type a code first.' };
  const message = code.apply(state);
  return { ok: true, message };
}
