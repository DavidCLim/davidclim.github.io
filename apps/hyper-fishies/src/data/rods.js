// Rod progression. `luck` biases rarity odds upward (0 = no bias, 1 = strong bias).
// `control` widens the safe tension margin and speeds/steadies reeling (0..1).
// `biteSpeed` shortens average bite wait time (0..1, higher = faster bites).
// `material` picks the rod's color/finish everywhere it's drawn (Finn's
// shop list, the rod slung on the player's back, and the rod in-hand while
// fishing) — see render/drawRodIcon.js.
export const RODS = [
  { id: 'twig',       name: 'Bent Twig Rod',      material: 'wood',        cost: 0,     luck: 0.00, control: 0.00, biteSpeed: 0.00 },
  { id: 'cane',       name: 'Cane Rod',           material: 'bamboo',      cost: 60,    luck: 0.06, control: 0.08, biteSpeed: 0.05 },
  { id: 'oak',        name: 'Oak Rod',            material: 'wood',        cost: 180,   luck: 0.12, control: 0.16, biteSpeed: 0.10 },
  { id: 'whalebone',  name: 'Whalebone Rod',      material: 'bone',        cost: 320,   luck: 0.16, control: 0.21, biteSpeed: 0.12 },
  { id: 'steelTip',   name: 'Steel-Tip Rod',      material: 'steel',       cost: 420,   luck: 0.20, control: 0.26, biteSpeed: 0.15 },
  { id: 'coral',      name: 'Coral-Twined Rod',   material: 'coral',       cost: 650,   luck: 0.25, control: 0.32, biteSpeed: 0.18 },
  { id: 'brassFitted', name: 'Brass-Fitted Rod',  material: 'brass',       cost: 700,   luck: 0.27, control: 0.34, biteSpeed: 0.19 },
  { id: 'silver',     name: 'Silverline Rod',     material: 'silver',      cost: 780,   luck: 0.28, control: 0.35, biteSpeed: 0.20 },
  { id: 'graphite',   name: 'Graphite Rod',       material: 'graphite',    cost: 900,   luck: 0.30, control: 0.38, biteSpeed: 0.22 },
  { id: 'harpoon',    name: 'Harpoon-Shaft Rod',  material: 'iron',        cost: 1400,  luck: 0.36, control: 0.44, biteSpeed: 0.26 },
  { id: 'reinforced', name: 'Reinforced Rod',     material: 'iron',        cost: 1900,  luck: 0.42, control: 0.50, biteSpeed: 0.30 },
  { id: 'ebony',      name: 'Ebony Rod',          material: 'ebony',       cost: 2300,  luck: 0.46, control: 0.53, biteSpeed: 0.32 },
  { id: 'gilded',     name: 'Gilded Rod',         material: 'gold',        cost: 2800,  luck: 0.50, control: 0.57, biteSpeed: 0.35 },
  { id: 'pearl',      name: 'Pearl-Inlaid Rod',   material: 'pearl',       cost: 3500,  luck: 0.54, control: 0.60, biteSpeed: 0.37 },
  { id: 'lantern',    name: 'Lanternwood Rod',    material: 'lanternwood', cost: 4200,  luck: 0.58, control: 0.64, biteSpeed: 0.40 },
  { id: 'obsidian',   name: 'Obsidian Rod',       material: 'obsidian',    cost: 6500,  luck: 0.68, control: 0.72, biteSpeed: 0.46 },
  { id: 'crystal',    name: 'Crystal Rod',        material: 'crystal',     cost: 7800,  luck: 0.73, control: 0.76, biteSpeed: 0.49 },
  { id: 'krakenbone', name: 'Kraken-Bone Rod',    material: 'bone',        cost: 8600,  luck: 0.76, control: 0.78, biteSpeed: 0.50 },
  { id: 'abyssal',    name: 'Abyssal Rod',        material: 'void',        cost: 9500,  luck: 0.78, control: 0.80, biteSpeed: 0.52 },
  { id: 'starforged', name: 'Starforged Rod',     material: 'starlight',   cost: 15000, luck: 0.86, control: 0.88, biteSpeed: 0.58 },
  { id: 'leviathan',  name: "Leviathan's Cutlass Rod", material: 'leviathan', cost: 20000, luck: 0.92, control: 0.92, biteSpeed: 0.62 },

  // Not sold on Finn's rack at all — Garrick lashes it together out of
  // whatever rod parts you fish up (every cast has a small passive chance
  // to turn one up) once you bring him enough of them (see
  // economy/economy.js's craftScrapRod, ui/forgePanel.js). `cost`
  // is never actually charged for a craftedOnly rod, it only feeds the
  // rank-badge math (data/rods.js's rodTierIndex) so it reads as a
  // respectable Journeyman rod, not a starter twig.
  { id: 'scrapRod', name: 'Scrap Rod', material: 'scrap', cost: 250, luck: 0.16, control: 0.22, biteSpeed: 0.13, craftedOnly: true },

  // The Forge's second tier — Garrick only takes this one on once you've
  // already got the Scrap Rod put together (economy.js's craftIronboundRod),
  // and it wants twice the parts. A real step up from the Scrap Rod, still
  // shy of anything you'd pay real money for on Finn's rack.
  { id: 'ironboundRod', name: 'Ironbound Rod', material: 'iron', cost: 600, luck: 0.24, control: 0.30, biteSpeed: 0.17, craftedOnly: true },

  // The one and only Cursed-rarity item in the game — Luca's parting gift
  // once his cure takes (economy.js's completeLucaQuest), not sold or
  // craftable any other way. `cursed: true` routes its badge through the
  // Cursed tier instead of the normal cost-based Deckhand..Admiral's ladder
  // (see ui/rodShopPanel.js's rodTier) — the highest `cost` here only feeds
  // rodRuneSlots so it carries the max 4 slots, matching "best rod in the
  // game" mechanically, not just visually.
  { id: 'devilsRod', name: "Devil's Rod", material: 'devil', cost: 50000, luck: 0.98, control: 0.96, biteSpeed: 0.70, craftedOnly: true, cursed: true },

  // Finn's own rod, handed over once his secret quest pays off (see
  // data/shopDialogues.js's Finn quest branch, fishing/fishingMachine.js's
  // resolveCatch) — never sold, same "not on Finn's own rack" shape as
  // Devil's Rod above. Sits just under the Leviathan's Cutlass Rod that
  // unlocks the quest in the first place — a real step up, not a novelty.
  { id: 'finnOldFaithful', name: "Finn's Old Faithful", material: 'iron', cost: 22000, luck: 0.94, control: 0.94, biteSpeed: 0.60, craftedOnly: true },

  // Only ever granted by the '54NTHONY_ADMIN_CODE' cheat code (data/codes.js)
  // — not for sale, not craftable, `craftedOnly: true` so it's excluded
  // from Finn's rack the same way Devil's Rod/Finn's Old Faithful are.
  // Stats sit just above Devil's Rod, the previous ceiling; `cost` is way
  // past the top TIER_BREAK so it reads Admiral's tier with the max 4 rune
  // slots, same as every other top-end rod.
  { id: 'adminRod', name: "Admin's Rod", material: 'starlight', cost: 999999, luck: 1, control: 1, biteSpeed: 0.85, craftedOnly: true },
];

export function rodById(id) {
  return RODS.find(r => r.id === id) || RODS[0];
}

// Shared cost breakpoints for both the rank badge (ui/rodShopPanel.js) and
// rune-slot count below — one rod can hold more runes at once the higher
// its rank, so a Deckhand rod stays a 1-slot starter while an Admiral's rod
// can carry a whole loadout.
const TIER_BREAKS = [100, 1000, 5000, 12000];
export function rodTierIndex(cost) {
  for (let i = 0; i < TIER_BREAKS.length; i++) {
    if (cost < TIER_BREAKS[i]) return i;
  }
  return TIER_BREAKS.length;
}

const RUNE_SLOTS_BY_TIER = [1, 1, 2, 3, 4];
export function rodRuneSlots(cost) {
  return RUNE_SLOTS_BY_TIER[rodTierIndex(cost)];
}
