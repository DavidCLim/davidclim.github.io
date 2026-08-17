// A Fisch-style "Shiny" mutation — a small independent roll on every catch,
// layered on top of the normal rarity roll rather than replacing it. A
// Common fish can come up Shiny just as easily as a Secret one; it's a
// second axis of luck, not a harder version of the first.
export const SHINY_CHANCE = 1 / 40;
export const SHINY_VALUE_MULT = 3;
export const SHINY_SIZE_MULT = 1.1;

// "Giant" — a second, independent mutation roll (fishing/fishingMachine.js
// rolls it separately from Shiny, right alongside it) for a specimen that
// dwarfs its species' normal size range. Rarer than Shiny and leans harder
// into size than value, the opposite emphasis of Shiny's value-first payoff
// — and since the two rolls are independent, a fish can come up both at
// once, exactly like Fisch's own stackable mutation prefixes.
export const GIANT_CHANCE = 1 / 60;
export const GIANT_VALUE_MULT = 2.2;
export const GIANT_SIZE_MULT = 1.8;

// Builds the display name for a catch/bag item given its mutation flags —
// shared by the catch card, satchel, and market panel so the "Giant Shiny
// X" stacking order only ever has to be decided in one place.
export function mutatedName(name, { shiny, giant } = {}) {
  let prefix = '';
  if (giant) prefix += '🐋 Giant ';
  if (shiny) prefix += '✨ Shiny ';
  return prefix ? `${prefix}${name}` : name;
}
