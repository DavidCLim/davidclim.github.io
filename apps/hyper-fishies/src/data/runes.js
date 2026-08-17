// Runes: conjured by Grizelda, the Wicked Witch of the Fishies, then
// socketed onto a rod for a passive buff (see economy/economy.js's
// craftRune/socketRune/removeRune and core/gameState.js's
// effectiveRodStats). Unlike fish/rods, runes carry no rarity tier at all —
// each is just a fixed, named effect; "how good" is bought with gold
// (craftCost) and ritual fees, not rolled.
// `effect` keys line up with the fields read off effectiveRodStats():
// luck/control/biteSpeed stack onto the equipped rod's own stats,
// valueMul/sizeMul are flat fractional bonuses applied at catch-resolve
// time, snapGuard further eases tension rise on top of rod control.
export const RUNES = [
  {
    id: 'fortune', name: 'Rune of Fortune', craftCost: 150,
    effect: { luck: 0.08 },
    desc: 'Tilts the tide in your favor — better odds at rarer fish.',
    glyph: 'eye', hue: '#c896ff',
  },
  {
    id: 'steady', name: 'Rune of Steady Hands', craftCost: 150,
    effect: { control: 0.10 },
    desc: "Calms the fight in your grip — safer tension, stronger reeling.",
    glyph: 'spiral', hue: '#5fe3c0',
  },
  {
    id: 'swift', name: 'Rune of the Swift Bite', craftCost: 150,
    effect: { biteSpeed: 0.10 },
    desc: 'Impatience made magic — shortens the wait for a bite.',
    glyph: 'bolt', hue: '#ffd08a',
  },
  {
    id: 'greed', name: "Rune of the Witch's Greed", craftCost: 220,
    effect: { valueMul: 0.15 },
    desc: 'Every catch sells for more, as if the gold itself likes you.',
    glyph: 'coin', hue: '#ffb454',
  },
  {
    id: 'growth', name: 'Rune of Growth', craftCost: 220,
    effect: { sizeMul: 0.08 },
    desc: 'Coaxes a little more size out of everything you land.',
    glyph: 'wave', hue: '#43e0ff',
  },
  {
    id: 'ward', name: 'Rune of the Barnacle Ward', craftCost: 180,
    effect: { snapGuard: 0.12 },
    desc: 'Wards the line against snapping under too much tension.',
    glyph: 'shield', hue: '#9fd8c9',
  },
];

export function runeById(id) {
  return RUNES.find(r => r.id === id) || null;
}
