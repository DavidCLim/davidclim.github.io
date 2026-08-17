// Rarity tier definitions: order, color identity, base weight, size
// multiplier range. Order (common -> rarest / hardest to catch):
// common, rare, legendary, mythic, gargantuan, extinct, abyssal, secret.
//
// `valueMul` INCREASES with rarity again (back to the traditional "rarer =
// more valuable" direction) — tuned so a typical Mythic catch sells for
// roughly 300-400g, with every other tier scaled proportionally around
// that anchor. `weight` also drops harder per tier than before, so the
// bigger payouts are matched by genuinely worse odds, not just a bigger
// number for the same catch rate.
export const RARITY = {
  common:    { id: 'common',    label: 'Common',    rank: 0, color: '#9fd8c9', glow: '#c7f2e4', weight: 100,   sizeMul: [0.8, 1.1],  valueMul: 3 },
  rare:      { id: 'rare',      label: 'Rare',       rank: 1, color: '#5fe3c0', glow: '#8fe9d9', weight: 30,    sizeMul: [0.9, 1.25], valueMul: 5 },
  legendary: { id: 'legendary', label: 'Legendary',  rank: 2, color: '#ffb454', glow: '#ffd08a', weight: 8,     sizeMul: [1.0, 1.4],  valueMul: 12 },
  mythic:    { id: 'mythic',    label: 'Mythic',     rank: 3, color: '#ff6f59', glow: '#ff9d8c', weight: 2.5,   sizeMul: [1.05, 1.55],valueMul: 26 },
  gargantuan:{ id: 'gargantuan',label: 'Gargantuan', rank: 4, color: '#ff8ad1', glow: '#ffc0e8', weight: 0.9,   sizeMul: [1.3, 2.2],  valueMul: 42 },
  extinct:   { id: 'extinct',   label: 'Extinct',    rank: 5, color: '#c896ff', glow: '#e0c2ff', weight: 0.35,  sizeMul: [1.15, 1.9], valueMul: 62 },
  abyssal:   { id: 'abyssal',   label: 'Abyssal',    rank: 6, color: '#43e0ff', glow: '#a6f2ff', weight: 0.12,  sizeMul: [1.2, 2.0],  valueMul: 110 },
  secret:    { id: 'secret',    label: '???',        rank: 7, color: '#fff37a', glow: '#fffbc9', weight: 0.018, sizeMul: [1.4, 2.6],  valueMul: 225 },
};

export const RARITY_ORDER = Object.values(RARITY).sort((a, b) => a.rank - b.rank).map(r => r.id);

export function rarityOf(id) {
  return RARITY[id] || RARITY.common;
}
