// Bait/tackle. Bought in stacks, consumed one-per-cast while equipped.
// `waitMul` scales bite wait time (lower = faster bites).
// `rarityBoost` adds flat weight bonus to fish at/above rank threshold `boostRank`.
// `unlocks` (optional) is a bait id that certain fish require via `requiresBait`.
// `shape`/`hue` pick the row icon — see render/drawBaitIcon.js.
//
// Every regular (non-questOnly) price below got a deliberate ~1.75x pass —
// bait was underpriced relative to how much a good catch pays out, so
// stocking up stopped being a real decision. `none` stays free (it's the
// no-bait fallback) and the two questOnly rewards (Richy's Special,
// Naia's Voidsong Lure) are untouched — they were never part of this
// pricing curve in the first place.

// A stand-in for "unlimited" bait (the starter "no bait" and Richy's
// Special once his quest is done) — deliberately NOT the literal
// `Infinity` value. `JSON.stringify(Infinity)` serializes to `null`, so
// anything actually stored as `Infinity` would silently turn into 0 the
// moment it round-trips through core/save.js's autosave. This number is
// high enough that consumeEquippedBait's one-per-cast decrement could
// never realistically exhaust it in a real play session, and it survives
// JSON perfectly fine.
export const UNLIMITED_BAIT_QTY = 999999;

export const BAIT = [
  {
    id: 'none', name: 'No Bait', cost: 0, stackCost: 0,
    waitMul: 1.0, rarityBoost: 0, boostRank: 0,
    desc: 'Bare hook. Works, but nothing special.',
    shape: 'jig', hue: '#8a8f92',
  },
  {
    id: 'saltPork', name: 'Salted Pork Rind', cost: 5, stackCost: 4,
    waitMul: 0.9, rarityBoost: 0, boostRank: 0,
    desc: "Old ship's-galley standby. Every deckhand keeps a strip in their pocket.",
    shape: 'chum', hue: '#e8b8a0',
  },
  {
    id: 'tidepoolScum', name: 'Tide Pool Scum', cost: 10, stackCost: 7,
    waitMul: 0.82, rarityBoost: 2, boostRank: 0,
    desc: 'Scraped straight off the rocks at low tide. Cheap, plentiful, gets bites fast.',
    shape: 'chum', hue: '#6b8f6b',
  },
  {
    id: 'cricket', name: 'Cricket', cost: 9, stackCost: 7,
    waitMul: 0.7, rarityBoost: 0, boostRank: 0,
    desc: 'Twitchy and irresistible to anything common. Fast bites, nothing fancy.',
    shape: 'bug', hue: '#8a9b4e',
  },
  {
    id: 'earthworm', name: 'Earthworm', cost: 14, stackCost: 11,
    waitMul: 0.85, rarityBoost: 0, boostRank: 0,
    desc: 'Cheap and reliable. Shortens the wait for a bite.',
    shape: 'worm', hue: '#c98f6e',
  },
  {
    id: 'nightcrawler', name: 'Nightcrawler', cost: 11, stackCost: 9,
    waitMul: 0.78, rarityBoost: 0, boostRank: 0,
    desc: 'Fat and wriggling. Dependable in any water, day or night.',
    shape: 'worm', hue: '#7a5a3e',
  },
  {
    id: 'mothLure', name: 'Moth Lure', cost: 26, stackCost: 19,
    waitMul: 0.9, rarityBoost: 5, boostRank: 1,
    desc: 'Flutters just above the surface — draws curious eyes.',
    shape: 'bug', hue: '#c9b98a',
  },
  {
    id: 'chumBucket', name: 'Chum Bucket Scraps', cost: 21, stackCost: 16,
    waitMul: 0.88, rarityBoost: 3, boostRank: 0,
    desc: 'The galley’s leftovers, tossed over the rail. Fish come running.',
    shape: 'chum', hue: '#8a6b4a',
  },
  {
    id: 'goldenHerring', name: 'Golden Herring', cost: 60, stackCost: 44,
    waitMul: 0.95, rarityBoost: 10, boostRank: 2,
    desc: 'A whole herring, scales still catching the light. A real step up from scraps.',
    shape: 'shrimp', hue: '#f0c060',
  },
  {
    id: 'barnacleBait', name: 'Barnacle Scrapings', cost: 35, stackCost: 26,
    waitMul: 0.95, rarityBoost: 7, boostRank: 1,
    desc: 'Scraped straight off the hull. Smells foul, works well.',
    shape: 'shell', hue: '#9a8f7d',
  },
  {
    id: 'glowshrimp', name: 'Glowshrimp Lure', cost: 39, stackCost: 28,
    waitMul: 1.0, rarityBoost: 18, boostRank: 1,
    desc: 'Shimmers in the dark water. Rare+ fish take notice.',
    shape: 'shrimp', hue: '#ffb454',
  },
  {
    id: 'ironJig', name: 'Iron Jig', cost: 53, stackCost: 39,
    waitMul: 1.1, rarityBoost: 8, boostRank: 2,
    desc: 'Heavy and steady. Slightly slower bites, but tougher fish bite more.',
    controlBoost: 0.08,
    shape: 'jig', hue: '#8a8f92',
  },
  {
    id: 'crabClaw', name: 'Crab Claw Rig', cost: 67, stackCost: 49,
    waitMul: 1.05, rarityBoost: 6, boostRank: 2,
    desc: 'Tough bait rigged for stronger fighters.',
    shape: 'claw', hue: '#c96b5a',
  },
  {
    id: 'squidStrip', name: 'Squid Strip', cost: 79, stackCost: 60,
    waitMul: 1.05, rarityBoost: 14, boostRank: 2,
    desc: "A cut strip that drifts real. Popular with anything that isn't common.",
    shape: 'strip', hue: '#e8e2ff',
  },
  {
    id: 'moonAlgae', name: 'Moonlit Algae', cost: 114, stackCost: 84,
    waitMul: 1.15, rarityBoost: 12, boostRank: 3,
    desc: 'Glows faintly under moonlight — legendary fish can’t resist it.',
    shape: 'algae', hue: '#8fe9d9',
  },
  {
    id: 'frozenShrimp', name: 'Frozen Shrimp', cost: 140, stackCost: 105,
    waitMul: 1.1, rarityBoost: 14, boostRank: 3,
    desc: 'Packed in ice hauled up from the Frozen Reach — legendary things down there still smell it thawing.',
    shape: 'shrimp', hue: '#bfe8ff',
  },
  {
    id: 'wigginsSpecial', name: "Richy's Special", cost: 85, stackCost: 62,
    // Tuned to land solidly in the "Strong" tier (rarityBoost 8-14, see
    // ui/tacklePanel.js's baitTier) — a genuinely good all-rounder thanks
    // to fast bites AND a real rarity boost together, but deliberately
    // short of the 15+ "Potent" baits (Glowshrimp Lure, Kraken Ink,
    // Doubloon Lure) so infinite supply doesn't trivialize them.
    waitMul: 0.8, rarityBoost: 13, boostRank: 1,
    desc: "Richy won't say what's in it. Fast bites and solid odds, nothing fancier — and once he trusts you with the recipe, it never runs dry.",
    shape: 'vial', hue: '#c896ff',
    // Not for sale — see data/shopDialogues.js's Richy quest branch and
    // fishing/fishingMachine.js's resolveCatch. This one's only ever
    // granted as the quest reward (as Infinity uses, not a finite stack —
    // see economy/economy.js's consumeEquippedBait), never bought, so
    // ui/tacklePanel.js filters it out of the buyable list. Left off the
    // general price-increase pass above for the same reason — it was never
    // part of that economy in the first place.
    questOnly: true,
  },
  {
    id: 'harpoonChunk', name: 'Harpoon Chunk', cost: 96, stackCost: 70,
    waitMul: 1.1, rarityBoost: 16, boostRank: 2,
    desc: 'A hunk of hard-won catch, cut for bait. Draws a real fight.',
    controlBoost: 0.05,
    shape: 'chum', hue: '#7a2e2e',
  },
  {
    id: 'phantomInk', name: 'Phantom Ink', cost: 193, stackCost: 144,
    waitMul: 1.0, rarityBoost: 9, boostRank: 3,
    desc: 'Squid ink laced with something otherworldly.',
    shape: 'strip', hue: '#4a3a5c',
  },
  {
    id: 'whalefallChum', name: 'Whalefall Chum', cost: 320, stackCost: 240,
    waitMul: 1.35, rarityBoost: 10, boostRank: 4,
    desc: "Cut from something that used to be enormous. Only the truly gargantuan bother rising for a taste.",
    shape: 'chum', hue: '#4a3f4a',
  },
  {
    id: 'doubloonLure', name: 'Doubloon Lure', cost: 345, stackCost: 255,
    waitMul: 1.2, rarityBoost: 20, boostRank: 3,
    desc: 'A sunken coin on a hook. Legend says the big ones can smell gold.',
    shape: 'coin', hue: '#ffd670',
  },
  {
    id: 'deepChum', name: 'Deep Chum', cost: 263, stackCost: 193,
    waitMul: 1.25, rarityBoost: 4, boostRank: 6,
    desc: 'A foul, potent slick. Required to draw out abyssal things.',
    shape: 'chum', hue: '#4a3a2a',
  },
  {
    id: 'krakenInk', name: 'Kraken Ink', cost: 455, stackCost: 341,
    waitMul: 1.3, rarityBoost: 15, boostRank: 5,
    desc: 'Black as the trench it came from. Only the boldest fish bite.',
    shape: 'strip', hue: '#1c2a3c',
  },
  {
    id: 'voidLure', name: 'Voidsong Lure', cost: 3200, stackCost: 3200,
    waitMul: 1.4, rarityBoost: 6, boostRank: 6,
    desc: "Naia's own work — it doesn't glow, doesn't smell like anything alive. Some things down in the Abyssal Lands won't rise for anything else. She'll only ever part with one at a time.",
    shape: 'strip', hue: '#43e0ff',
    // Not for sale at Bait & Barnacles — see data/naiaDialogue.js's
    // buyVoidLure action and main.js's dialogueHandlers. Naia is the only
    // source, same "hidden from the buyable list" pattern as Richy's
    // Special above. Also capped at VOID_LURE_MAX_OWNED (main.js) — unlike
    // every other bait, you can't stock up on this one. Already priced far
    // above the general pass above; left untouched.
    questOnly: true,
  },
  {
    id: 'stardustLure', name: '??? Lure', cost: 860, stackCost: 860,
    waitMul: 1.6, rarityBoost: 0.4, boostRank: 8,
    desc: 'It smells like starlight. Something with it might work.',
    shape: 'star', hue: '#fff37a',
  },
];

export function baitById(id) {
  return BAIT.find(b => b.id === id) || BAIT[0];
}
