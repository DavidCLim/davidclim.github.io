// Panel color themes, one per shop, hand-picked to match each stall's own
// palette (see world/worldObjects.js's STALLS) so the shop UI itself reads
// as "that specific place" — a rope-and-wood rigging cabin, a mossy bait
// shed, a warm merchant's ledger post — instead of every panel sharing the
// same generic parchment look.
// `row` is a fully solid color (no alpha) on purpose — a translucent row
// background was repeatedly reported as looking washed-out/see-through, so
// there's no alpha channel left anywhere in this chain to cause that.
export const SHOP_THEMES = {
  rodShop: {
    bg1: '#3c1f1f', bg2: '#1a0d0d', accent: '#ffb454', row: '#4a2626',
  },
  tackle: {
    bg1: '#22381f', bg2: '#101d0f', accent: '#ffd08a', row: '#2c4a2c',
  },
  market: {
    bg1: '#4a3318', bg2: '#221507', accent: '#ffb454', row: '#5a3f16',
  },
  runeShop: {
    bg1: '#2e1f42', bg2: '#140c20', accent: '#8fe97a', row: '#3a2a54',
  },
  // Forge-hot brick red and ember orange, next door to Grizelda's cool
  // purple — the two stalls should never be mistaken for each other.
  blacksmith: {
    bg1: '#3c2420', bg2: '#180d0a', accent: '#ff8a4a', row: '#4a2e28',
  },
  // Tanned-hide leather + brass, distinct from Rod Shop's redder wood tones —
  // this is the one panel that's meant to look like a bag you're carrying,
  // not a stall you're standing at.
  satchel: {
    bg1: '#4a3320', bg2: '#20150a', accent: '#c9a227', row: '#5a4128',
  },
  // Captain's-quarters mahogany + gold-leaf, for the Profile panel — a
  // personal dossier, not a shop counter, so it gets a richer, darker wood
  // than any of the stalls.
  profile: {
    bg1: '#3a2418', bg2: '#160d08', accent: '#ffd08a', row: '#4a2e1c',
  },
};
