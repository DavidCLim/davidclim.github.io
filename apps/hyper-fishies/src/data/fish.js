// Fish roster. `shape` selects a reusable icon archetype (see render/drawFishIcon.js).
// `behavior` selects a reel-fight archetype (see fishing/behaviors.js).
// `requiresBait` (optional) restricts the fish to being caught while that bait is equipped.
// `requiresRegion` (optional) restricts the fish to being caught while
// actually standing in that region (fishing/rollFish.js) — a real "you have
// to go there" exclusive, the same way Fisch ties specific catches to
// specific maps, rather than every fish being reachable from anywhere.
//
// `baseValue` climbs gently as rarity goes up (bigger, more exotic
// specimens are worth a bit more raw), but rarity.valueMul in
// data/rarity.js falls sharply as rarity goes up — so the final sale price
// (baseValue * valueMul * sizeFactor) actually drops the rarer a fish is.
// See the comment there for why.
export const FISH = [
  // --- Common ---
  { id: 'minnow',       name: 'Silver Minnow',    rarity: 'common', shape: 'round', behavior: 'steady',  spots: ['dock'], baseValue: 5,  sizeRange: [4, 9],   hue: '#cfe8df' },
  { id: 'perch',        name: 'Pier Perch',       rarity: 'common', shape: 'round', behavior: 'steady',  spots: ['dock'], baseValue: 6,  sizeRange: [6, 13],  hue: '#b7d98a' },
  { id: 'gullfish',     name: 'Gullfish',         rarity: 'common', shape: 'flyingfish', behavior: 'erratic', spots: ['dock'], baseValue: 6,  sizeRange: [5, 12],  hue: '#dcd08f' },
  { id: 'mudskip',      name: 'Mudskip Eel',      rarity: 'common', shape: 'eel',   behavior: 'resting', spots: ['dock'], baseValue: 7,  sizeRange: [10, 22], hue: '#8a9b6e' },
  { id: 'barnaclamp',   name: 'Barnaclamp',       rarity: 'common', shape: 'clam', behavior: 'resting', spots: ['dock'], baseValue: 6,  sizeRange: [4, 10],  hue: '#9a8f7d' },
  { id: 'catfin',       name: 'Whiskered Catfin', rarity: 'common', shape: 'catfish', behavior: 'resting', spots: ['dock'], baseValue: 6,  sizeRange: [8, 18],  hue: '#a89478' },
  { id: 'sunperch',     name: 'Sunfin Perch',     rarity: 'common', shape: 'round', behavior: 'erratic', spots: ['dock'], baseValue: 7,  sizeRange: [5, 11],  hue: '#f2d16b' },
  { id: 'muddab',       name: 'Mud Dab',          rarity: 'common', shape: 'round', behavior: 'resting', spots: ['dock'], baseValue: 5,  sizeRange: [4, 10],  hue: '#c9b98f' },
  { id: 'reedguppy',    name: 'Reed Guppy',       rarity: 'common', shape: 'round', behavior: 'erratic', spots: ['dock'], baseValue: 5,  sizeRange: [3, 7],   hue: '#a7d6c4' },
  { id: 'shrimplet',    name: 'Shrimplet',        rarity: 'common', shape: 'shrimp',  behavior: 'resting', spots: ['dock'], baseValue: 6,  sizeRange: [3, 6],   hue: '#f0b28a' },
  { id: 'dockgar',      name: 'Dockside Gar',     rarity: 'common', shape: 'pike',   behavior: 'sprinter', spots: ['dock'], baseValue: 7,  sizeRange: [12, 20], hue: '#7fae8f' },
  { id: 'pebblecrab',   name: 'Pebble Crab',      rarity: 'common', shape: 'crab', behavior: 'resting', spots: ['dock'], baseValue: 6,  sizeRange: [3, 8],   hue: '#b0a58f' },
  { id: 'driftgoby',    name: 'Driftwood Goby',   rarity: 'common', shape: 'round', behavior: 'resting', spots: ['dock'], baseValue: 6,  sizeRange: [3, 8],   hue: '#8fae8f' },
  { id: 'saltminnow',   name: 'Saltmarsh Minnow', rarity: 'common', shape: 'round', behavior: 'erratic', spots: ['dock'], baseValue: 5,  sizeRange: [3, 7],   hue: '#cfe0d0' },
  { id: 'ropefish',     name: 'Ropefin Eel',      rarity: 'common', shape: 'eel',   behavior: 'steady',  spots: ['dock'], baseValue: 7,  sizeRange: [9, 19],  hue: '#9a8560' },
  { id: 'tidepebble',   name: 'Tidepebble Fish',  rarity: 'common', shape: 'round', behavior: 'resting', spots: ['dock'], baseValue: 6,  sizeRange: [3, 8],   hue: '#b8ab8f' },
  { id: 'driftclam',    name: 'Driftwood Clam',   rarity: 'common', shape: 'clam', behavior: 'resting', spots: ['dock'], baseValue: 6,  sizeRange: [3, 7],   hue: '#c9bfa0' },
  { id: 'kelpminnow',   name: 'Kelp Minnow',      rarity: 'common', shape: 'round', behavior: 'erratic', spots: ['dock'], baseValue: 5,  sizeRange: [3, 8],   hue: '#7fae6e' },
  { id: 'barnacleskipper', name: 'Barnacle Skipper', rarity: 'common', shape: 'crab', behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [4, 9], hue: '#a89878' },
  { id: 'tidepoolgoby', name: 'Tidepool Goby',    rarity: 'common', shape: 'round', behavior: 'resting', spots: ['dock'], baseValue: 5,  sizeRange: [3, 7],   hue: '#8fc9b0' },

  // --- Common, second wave (new archetypes: shrimp/catfish/piranha/turtle/
  // flyingfish/lobster/seahorse/stingray/cuttlefish — see render/
  // drawFishIcon.js) ---
  { id: 'reefShrimp',   name: 'Reef Shrimp',      rarity: 'common', shape: 'shrimp', behavior: 'resting', spots: ['dock'], baseValue: 5, sizeRange: [2, 5], hue: '#e8a878' },
  { id: 'muckCat',      name: 'Muck Catfish',     rarity: 'common', shape: 'catfish', behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [7, 15], hue: '#7a6b52' },
  { id: 'redbellyPiranha', name: 'Redbelly Piranha', rarity: 'common', shape: 'piranha', behavior: 'sprinter', spots: ['dock'], baseValue: 6, sizeRange: [6, 12], hue: '#c94040' },
  { id: 'pondTurtle',   name: 'Pond Turtle',      rarity: 'common', shape: 'turtle', behavior: 'resting', spots: ['dock'], baseValue: 7, sizeRange: [8, 16], hue: '#6b8f5c' },
  { id: 'skipperFish',  name: 'Skipper Fish',     rarity: 'common', shape: 'flyingfish', behavior: 'erratic', spots: ['dock'], baseValue: 6, sizeRange: [5, 10], hue: '#d8cf9a' },
  { id: 'rockLobster',  name: 'Rock Lobster',     rarity: 'common', shape: 'lobster', behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [8, 16], hue: '#8a5c4a' },
  { id: 'dwarfSeahorse', name: 'Dwarf Seahorse',  rarity: 'common', shape: 'seahorse', behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [3, 6], hue: '#e0a85c' },
  { id: 'sandStingray', name: 'Sand Stingray',    rarity: 'common', shape: 'stingray', behavior: 'resting', spots: ['dock'], baseValue: 7, sizeRange: [10, 20], hue: '#c9b98a' },
  { id: 'commonCuttlefish', name: 'Common Cuttlefish', rarity: 'common', shape: 'cuttlefish', behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [8, 16], hue: '#a89878' },

  // --- Common, third wave ---
  { id: 'harborMinnow', name: 'Harbor Minnow', rarity: 'common', shape: 'round', behavior: 'erratic', spots: ['dock'], baseValue: 5, sizeRange: [3, 8], hue: '#cfe0c9' },
  { id: 'saltEel',      name: 'Saltwater Eel', rarity: 'common', shape: 'eel',   behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [9, 19], hue: '#7a9b7a' },
  { id: 'dockCrab',     name: 'Dock Crab',     rarity: 'common', shape: 'crab',  behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [4, 10], hue: '#9a7a5c' },

  // --- Common, fourth wave ---
  { id: 'coveMinnow', name: 'Cove Minnow', rarity: 'common', shape: 'round', behavior: 'erratic', spots: ['dock'], baseValue: 5, sizeRange: [3, 7], hue: '#cfe8d8' },
  { id: 'tidepoolShrimp', name: 'Tidepool Shrimp', rarity: 'common', shape: 'shrimp', behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [2, 5], hue: '#e0a08a' },
  { id: 'mossbackTurtle', name: 'Mossback Turtle', rarity: 'common', shape: 'turtle', behavior: 'resting', spots: ['dock'], baseValue: 7, sizeRange: [8, 15], hue: '#7a9060' },
  { id: 'duneCrab', name: 'Dune Crab', rarity: 'common', shape: 'crab', behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [3, 9], hue: '#a08f6a' },

  // --- Common, fifth wave --- picked from the least-used shape archetypes
  // in render/drawFishIcon.js on purpose, so the roster's full 200 species
  // lean on every shape roughly evenly instead of a handful (round, eel,
  // shark) carrying most of the list.
  { id: 'brackishClam', name: 'Brackish Clam', rarity: 'common', shape: 'clam', behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [3, 8], hue: '#b8a888' },
  { id: 'siltCatfish', name: 'Silt Catfish', rarity: 'common', shape: 'catfish', behavior: 'resting', spots: ['dock'], baseValue: 6, sizeRange: [7, 16], hue: '#8f7a5c' },
  { id: 'duskFlyingfish', name: 'Dusk Flyingfish', rarity: 'common', shape: 'flyingfish', behavior: 'erratic', spots: ['dock'], baseValue: 6, sizeRange: [5, 11], hue: '#c9b98f' },

  // --- Rare ---
  { id: 'moonfin',      name: 'Moonfin Trout',    rarity: 'rare', shape: 'round', behavior: 'steady',   spots: ['dock'], baseValue: 8,  sizeRange: [10, 20], hue: '#9adfe0' },
  { id: 'coralwing',    name: 'Coralwing Ray',    rarity: 'rare', shape: 'angel', behavior: 'sprinter', spots: ['dock'], baseValue: 9,  sizeRange: [14, 30], hue: '#ff9d8c' },
  { id: 'tideeel',      name: 'Tide Eel',         rarity: 'rare', shape: 'eel',   behavior: 'erratic',  spots: ['dock'], baseValue: 8,  sizeRange: [18, 34], hue: '#5fa8a0' },
  { id: 'lanternjelly', name: 'Lantern Jellyquid',rarity: 'rare', shape: 'jellyfish', behavior: 'resting',  spots: ['dock'], baseValue: 9,  sizeRange: [8, 16],  hue: '#ffb454' },
  { id: 'starcrab',     name: 'Star Crab',        rarity: 'rare', shape: 'crab',  behavior: 'erratic',  spots: ['dock'], baseValue: 8,  sizeRange: [6, 14],  hue: '#f2d16b' },
  { id: 'bluefin',      name: 'Bluefin Darter',   rarity: 'rare', shape: 'pike',  behavior: 'sprinter', spots: ['dock'], baseValue: 9,  sizeRange: [12, 24], hue: '#5b8cff' },
  { id: 'urchinback',   name: 'Urchinback Ray',   rarity: 'rare', shape: 'urchin',  behavior: 'resting',  spots: ['dock'], baseValue: 8,  sizeRange: [8, 18],  hue: '#c96b7a' },
  { id: 'glowsquid',    name: 'Glowsquid',        rarity: 'rare', shape: 'squid', behavior: 'erratic',  spots: ['dock'], baseValue: 10, sizeRange: [16, 28], hue: '#8fe9d9' },
  { id: 'stormsail',    name: 'Stormsail Fish',   rarity: 'rare', shape: 'sail',  behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [24, 44], hue: '#7aa8ff' },
  { id: 'duskshark',    name: 'Dusk Reef Shark',  rarity: 'rare', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 11, sizeRange: [40, 70], hue: '#4d6e8f' },
  { id: 'emberling',    name: 'Emberling Eel',    rarity: 'rare', shape: 'eel',   behavior: 'resting',  spots: ['dock'], baseValue: 10, sizeRange: [20, 38], hue: '#ff8a5e' },
  { id: 'thornfish',    name: 'Thornback Pike',   rarity: 'rare', shape: 'pike',   behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [26, 46], hue: '#8fae4d' },
  { id: 'mistjelly',    name: 'Mistveil Jelly',   rarity: 'rare', shape: 'jellyfish', behavior: 'resting',  spots: ['dock'], baseValue: 9,  sizeRange: [14, 24], hue: '#cfe8ff' },
  { id: 'tidalstar',    name: 'Tidal Starfish',   rarity: 'rare', shape: 'star',  behavior: 'resting',  spots: ['dock'], baseValue: 9,  sizeRange: [7, 15],  hue: '#ffd08a' },
  { id: 'saltwing',     name: 'Saltwing Manta',   rarity: 'rare', shape: 'manta', behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [18, 32], hue: '#8fb5d8' },
  { id: 'reefchest',    name: 'Reef-Locked Chest Crab', rarity: 'rare', shape: 'chest', behavior: 'resting', spots: ['dock'], baseValue: 9, sizeRange: [8, 16], hue: '#c9a05c' },
  { id: 'driftjelly',   name: 'Driftglass Jelly', rarity: 'rare', shape: 'jellyfish', behavior: 'resting',  spots: ['dock'], baseValue: 9,  sizeRange: [10, 20], hue: '#bfe8ff' },
  { id: 'rustfin',      name: 'Rustfin Piranha',  rarity: 'rare', shape: 'piranha', behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [10, 18], hue: '#c9542e' },
  { id: 'silverjaw',    name: 'Silverjaw Pike',   rarity: 'rare', shape: 'pike',   behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [22, 40], hue: '#c9d4de' },
  { id: 'brinefang',    name: 'Brinefang Eel',    rarity: 'rare', shape: 'eel',   behavior: 'erratic',  spots: ['dock'], baseValue: 9,  sizeRange: [16, 30], hue: '#5c7a6b' },
  { id: 'coralstar',    name: 'Coral Starfish',   rarity: 'rare', shape: 'star',  behavior: 'resting',  spots: ['dock'], baseValue: 8,  sizeRange: [6, 13],  hue: '#ff9d8c' },
  { id: 'opaljelly',    name: 'Opal Jelly',       rarity: 'rare', shape: 'jellyfish', behavior: 'resting',  spots: ['dock'], baseValue: 9,  sizeRange: [10, 18], hue: '#e0c2ff' },
  { id: 'sandsharkpup', name: 'Sandshark Pup',    rarity: 'rare', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [20, 36], hue: '#d8c090' },
  { id: 'coralcrawler', name: 'Coral Crawler',    rarity: 'rare', shape: 'crab',  behavior: 'erratic',  spots: ['dock'], baseValue: 9,  sizeRange: [6, 14],  hue: '#ff9d6c' },

  // --- Rare, second wave ---
  { id: 'gildedPrawn',  name: 'Gilded Prawn',     rarity: 'rare', shape: 'shrimp', behavior: 'erratic', spots: ['dock'], baseValue: 9, sizeRange: [4, 8], hue: '#ffcf7a' },
  { id: 'ironWhiskerCat', name: 'Ironwhisker Catfish', rarity: 'rare', shape: 'catfish', behavior: 'resting', spots: ['dock'], baseValue: 10, sizeRange: [16, 30], hue: '#8f9aa0' },
  { id: 'shoalPiranha', name: 'Shoaling Piranha', rarity: 'rare', shape: 'piranha', behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [10, 17], hue: '#e0685a' },
  { id: 'shellbackTurtle', name: 'Shellback Turtle', rarity: 'rare', shape: 'turtle', behavior: 'resting', spots: ['dock'], baseValue: 10, sizeRange: [18, 32], hue: '#a89050' },
  { id: 'silverFlyer',  name: 'Silver Flyer',     rarity: 'rare', shape: 'flyingfish', behavior: 'sprinter', spots: ['dock'], baseValue: 9, sizeRange: [9, 16], hue: '#c9d4de' },
  { id: 'tidepoolOctopus', name: 'Tidepool Octopus', rarity: 'rare', shape: 'octopus', behavior: 'resting', spots: ['dock'], baseValue: 9, sizeRange: [10, 20], hue: '#c9708f' },
  { id: 'crimsonLobster', name: 'Crimson Lobster', rarity: 'rare', shape: 'lobster', behavior: 'resting', spots: ['dock'], baseValue: 10, sizeRange: [16, 28], hue: '#b0342c' },
  { id: 'blueSwordfish', name: 'Blue Swordfish',  rarity: 'rare', shape: 'swordfish', behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [30, 50], hue: '#3a6bbf' },
  { id: 'youngHammerhead', name: 'Young Hammerhead', rarity: 'rare', shape: 'hammerhead', behavior: 'sprinter', spots: ['dock'], baseValue: 11, sizeRange: [35, 55], hue: '#5c6b7a' },
  { id: 'spottedStingray', name: 'Spotted Stingray', rarity: 'rare', shape: 'stingray', behavior: 'resting', spots: ['dock'], baseValue: 10, sizeRange: [20, 36], hue: '#8f9a5c' },
  { id: 'chamberedNautilus', name: 'Chambered Nautilus', rarity: 'rare', shape: 'nautilus', behavior: 'resting', spots: ['dock'], baseValue: 9, sizeRange: [6, 12], hue: '#e8dcc0' },
  { id: 'greenMoray',   name: 'Green Moray',      rarity: 'rare', shape: 'moray', behavior: 'erratic', spots: ['dock'], baseValue: 10, sizeRange: [24, 42], hue: '#4d8a5c' },

  // --- Rare, third wave ---
  { id: 'veilJelly',    name: 'Veil Jelly',       rarity: 'rare', shape: 'jellyfish', behavior: 'resting', spots: ['dock'], baseValue: 9, sizeRange: [12, 22], hue: '#c2e0ff' },
  { id: 'stripedPike',  name: 'Striped Pike',     rarity: 'rare', shape: 'pike', behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [24, 42], hue: '#8fae5c' },
  { id: 'coralKoi',     name: 'Coral Koi',        rarity: 'rare', shape: 'koi', behavior: 'erratic', spots: ['dock'], baseValue: 9, sizeRange: [14, 26], hue: '#ff9d8c' },
  { id: 'gardenSerpentEel', name: 'Garden Serpent Eel', rarity: 'rare', shape: 'serpent', behavior: 'erratic', spots: ['dock'], baseValue: 9, sizeRange: [16, 28], hue: '#7ac97a' },

  // --- Rare, fourth wave ---
  { id: 'amberJelly', name: 'Amber Jelly', rarity: 'rare', shape: 'jellyfish', behavior: 'resting', spots: ['dock'], baseValue: 9, sizeRange: [10, 20], hue: '#ffcf7a' },
  { id: 'currentwingRay', name: 'Currentwing Ray', rarity: 'rare', shape: 'angel', behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [16, 30], hue: '#7ac9d4' },
  { id: 'saltspireEel', name: 'Saltspire Eel', rarity: 'rare', shape: 'eel', behavior: 'erratic', spots: ['dock'], baseValue: 9, sizeRange: [18, 32], hue: '#8f7a5c' },
  { id: 'glassfinKoi', name: 'Glassfin Koi', rarity: 'rare', shape: 'koi', behavior: 'erratic', spots: ['dock'], baseValue: 9, sizeRange: [14, 24], hue: '#cfe8ff' },

  // --- Rare, fifth wave (least-used shapes, see the common batch above) ---
  { id: 'spineUrchin', name: 'Spine Urchin', rarity: 'rare', shape: 'urchin', behavior: 'resting', spots: ['dock'], baseValue: 8, sizeRange: [8, 17], hue: '#7a4a5c' },
  { id: 'harborStarfish', name: 'Harbor Starfish', rarity: 'rare', shape: 'star', behavior: 'resting', spots: ['dock'], baseValue: 8, sizeRange: [7, 14], hue: '#ffb454' },
  { id: 'coralSeahorse', name: 'Coral Seahorse', rarity: 'rare', shape: 'seahorse', behavior: 'resting', spots: ['dock'], baseValue: 9, sizeRange: [4, 8], hue: '#ff9d8c' },

  // --- Legendary ---
  { id: 'kingfin',      name: 'Kingfin',          rarity: 'legendary', shape: 'koi', behavior: 'steady',   spots: ['dock'], baseValue: 10, sizeRange: [30, 55],  hue: '#ffd08a' },
  { id: 'nebulasail',   name: 'Nebula Sailfish',  rarity: 'legendary', shape: 'sail',  behavior: 'sprinter', spots: ['dock'], baseValue: 11, sizeRange: [35, 60],  hue: '#c896ff' },
  { id: 'deepchest',    name: "Drifter's Chest Crab", rarity: 'legendary', shape: 'chest', behavior: 'resting', spots: ['dock'], baseValue: 10, sizeRange: [14, 26],  hue: '#e0c2ff' },
  { id: 'stormking',    name: 'Stormking Marlin', rarity: 'legendary', shape: 'sail',  behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [40, 65],  hue: '#4d6e8f' },
  { id: 'goldenkoi',    name: 'Golden Koi',       rarity: 'legendary', shape: 'koi', behavior: 'erratic',  spots: ['dock'], baseValue: 11, sizeRange: [20, 38],  hue: '#ffcf5c' },
  { id: 'thunderray',   name: 'Thunder Ray',      rarity: 'legendary', shape: 'angel', behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [30, 52],  hue: '#8a9dff' },
  { id: 'emeraldshark',  name: 'Emerald Reef Shark', rarity: 'legendary', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [55, 85], hue: '#4dd88a' },
  { id: 'crownsquid',   name: 'Crowned Squid',    rarity: 'legendary', shape: 'squid', behavior: 'erratic',  spots: ['dock'], baseValue: 11, sizeRange: [20, 36],  hue: '#ffb454' },
  { id: 'prismfin',     name: 'Prismfin Marlin',  rarity: 'legendary', shape: 'sail',  behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [38, 62],  hue: '#7affd6' },
  { id: 'amberking',    name: 'Amberback Kingfish', rarity: 'legendary', shape: 'koi', behavior: 'steady', spots: ['dock'], baseValue: 11, sizeRange: [28, 48],  hue: '#ffb454' },
  { id: 'opalfin',      name: 'Opalfin Marlin',   rarity: 'legendary', shape: 'sail',  behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [36, 58],  hue: '#e0c2ff' },
  { id: 'sunfireray',   name: 'Sunfire Ray',      rarity: 'legendary', shape: 'angel', behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [32, 54],  hue: '#ff9d3c' },
  { id: 'lanternmarlin', name: 'Abyss Lantern Marlin', rarity: 'legendary', shape: 'sail', behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [38, 60], hue: '#ffd670' },

  // --- Legendary, second wave ---
  { id: 'goldenSeahorse', name: 'Golden Seahorse', rarity: 'legendary', shape: 'seahorse', behavior: 'resting', spots: ['dock'], baseValue: 12, sizeRange: [8, 14], hue: '#ffd670' },
  { id: 'stormSwordfish', name: 'Storm Swordfish', rarity: 'legendary', shape: 'swordfish', behavior: 'sprinter', spots: ['dock'], baseValue: 13, sizeRange: [45, 70], hue: '#5c7a9f', weatherOnly: ['storm'] },
  { id: 'inkcapOctopus', name: 'Inkcap Octopus',  rarity: 'legendary', shape: 'octopus', behavior: 'erratic', spots: ['dock'], baseValue: 11, sizeRange: [24, 40], hue: '#5c3a6b' },
  { id: 'mirageCuttlefish', name: 'Mirage Cuttlefish', rarity: 'legendary', shape: 'cuttlefish', behavior: 'erratic', spots: ['dock'], baseValue: 12, sizeRange: [18, 30], hue: '#e0c2ff' },

  // --- Legendary, third wave ---
  { id: 'sunstoneOctopus', name: 'Sunstone Octopus', rarity: 'legendary', shape: 'octopus', behavior: 'erratic', spots: ['dock'], baseValue: 12, sizeRange: [28, 46], hue: '#ffb454' },
  { id: 'duskLobster',   name: 'Dusk Lobster',     rarity: 'legendary', shape: 'lobster', behavior: 'resting', spots: ['dock'], baseValue: 12, sizeRange: [26, 42], hue: '#6b4a7a' },
  { id: 'phantomHammerhead', name: 'Phantom Hammerhead', rarity: 'legendary', shape: 'hammerhead', behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [45, 70], hue: '#8a9dff' },
  { id: 'crownedNautilus', name: 'Crowned Nautilus', rarity: 'legendary', shape: 'nautilus', behavior: 'resting', spots: ['dock'], baseValue: 11, sizeRange: [10, 18], hue: '#ffd670' },

  // --- Legendary, fourth wave ---
  { id: 'duskfinHammerhead', name: 'Duskfin Hammerhead', rarity: 'legendary', shape: 'hammerhead', behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [42, 66], hue: '#6b7a8f' },
  { id: 'sapphireNautilus', name: 'Sapphire Nautilus', rarity: 'legendary', shape: 'nautilus', behavior: 'resting', spots: ['dock'], baseValue: 11, sizeRange: [12, 20], hue: '#4d8ad4' },
  { id: 'emberCuttlefish', name: 'Ember Cuttlefish', rarity: 'legendary', shape: 'cuttlefish', behavior: 'erratic', spots: ['dock'], baseValue: 12, sizeRange: [20, 34], hue: '#ff8a5e' },
  { id: 'moonlitManta', name: 'Moonlit Manta', rarity: 'legendary', shape: 'manta', behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [30, 50], hue: '#c2c9ff' },

  // --- Legendary, fifth wave (least-used shapes) ---
  { id: 'reeftoothHammerhead', name: 'Reeftooth Hammerhead', rarity: 'legendary', shape: 'hammerhead', behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [40, 64], hue: '#4d6b6b' },
  { id: 'gildedNautilus', name: 'Gilded Nautilus', rarity: 'legendary', shape: 'nautilus', behavior: 'resting', spots: ['dock'], baseValue: 11, sizeRange: [14, 22], hue: '#ffd670' },

  // --- Mythic ---
  { id: 'voidshark',    name: 'Void Reef Shark',  rarity: 'mythic', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [60, 95], hue: '#2c3a55' },
  { id: 'auroraeel',    name: 'Aurora Eel',       rarity: 'mythic', shape: 'serpent',   behavior: 'erratic',  spots: ['dock'], baseValue: 13, sizeRange: [40, 70], hue: '#43e0ff' },
  { id: 'phantomray',   name: 'Phantom Manta',    rarity: 'mythic', shape: 'manta', behavior: 'erratic',  spots: ['dock'], baseValue: 13, sizeRange: [50, 85], hue: '#e8e2ff' },
  { id: 'infernogar',   name: 'Inferno Gar',      rarity: 'mythic', shape: 'pike',   behavior: 'sprinter', spots: ['dock'], baseValue: 13, sizeRange: [45, 75], hue: '#ff6a3c' },
  { id: 'wraithsail',   name: 'Wraith Sailfish',  rarity: 'mythic', shape: 'sail',  behavior: 'sprinter', spots: ['dock'], baseValue: 14, sizeRange: [50, 80], hue: '#b0a8ff' },
  { id: 'starwhirl',    name: 'Starwhirl Squid',  rarity: 'mythic', shape: 'squid', behavior: 'erratic',  spots: ['dock'], baseValue: 13, sizeRange: [35, 60], hue: '#ff8ad1' },
  { id: 'duskwraith',   name: 'Duskwraith Eel',   rarity: 'mythic', shape: 'serpent',   behavior: 'erratic',  spots: ['dock'], baseValue: 14, sizeRange: [42, 72], hue: '#5a3c7a' },
  { id: 'glasswhale',   name: 'Glass Calf Whale', rarity: 'mythic', shape: 'whale', behavior: 'resting',  spots: ['dock'], baseValue: 14, sizeRange: [70, 110], hue: '#cfe8ff' },
  { id: 'riftfinjr',    name: 'Riftfin Leviathan Jr.', rarity: 'mythic', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 14, sizeRange: [55, 90], hue: '#5a3c7a' },
  { id: 'prismserpent', name: 'Prism Serpent',    rarity: 'mythic', shape: 'serpent',   behavior: 'erratic',  spots: ['dock'], baseValue: 14, sizeRange: [45, 78],  hue: '#ff8ad1' },

  // --- Mythic, second wave ---
  { id: 'emperorSwordfish', name: 'Emperor Swordfish', rarity: 'mythic', shape: 'swordfish', behavior: 'sprinter', spots: ['dock'], baseValue: 14, sizeRange: [55, 85], hue: '#2c4a6b' },
  { id: 'greatHammerhead', name: 'Great Hammerhead', rarity: 'mythic', shape: 'hammerhead', behavior: 'sprinter', spots: ['dock'], baseValue: 14, sizeRange: [60, 95], hue: '#3a4552' },
  { id: 'shallowAngler', name: 'Shallow Angler',  rarity: 'mythic', shape: 'anglerfish', behavior: 'resting', spots: ['dock'], baseValue: 14, sizeRange: [20, 34], hue: '#4a3c5c' },
  { id: 'shadowMoray',  name: 'Shadow Moray',     rarity: 'mythic', shape: 'moray', behavior: 'erratic', spots: ['dock'], baseValue: 14, sizeRange: [45, 72], hue: '#2c2c3a' },

  // --- Mythic, third wave ---
  { id: 'voidwakeSwordfish', name: 'Voidwake Swordfish', rarity: 'mythic', shape: 'swordfish', behavior: 'sprinter', spots: ['dock'], baseValue: 14, sizeRange: [60, 90], hue: '#5a3c7a' },
  { id: 'echoStingray', name: 'Echo Stingray',    rarity: 'mythic', shape: 'stingray', behavior: 'resting', spots: ['dock'], baseValue: 14, sizeRange: [48, 75], hue: '#43e0ff' },
  { id: 'wraithCuttlefish', name: 'Wraith Cuttlefish', rarity: 'mythic', shape: 'cuttlefish', behavior: 'erratic', spots: ['dock'], baseValue: 13, sizeRange: [30, 48], hue: '#b0a8ff' },

  // --- Mythic, fourth wave ---
  { id: 'voidglassOctopus', name: 'Voidglass Octopus', rarity: 'mythic', shape: 'octopus', behavior: 'erratic', spots: ['dock'], baseValue: 14, sizeRange: [30, 50], hue: '#5a3c7a' },
  { id: 'riftscaleTurtle', name: 'Riftscale Turtle', rarity: 'mythic', shape: 'turtle', behavior: 'resting', spots: ['dock'], baseValue: 14, sizeRange: [40, 65], hue: '#4d6e5c' },
  { id: 'emberfallSerpent', name: 'Emberfall Serpent', rarity: 'mythic', shape: 'serpent', behavior: 'erratic', spots: ['dock'], baseValue: 14, sizeRange: [45, 75], hue: '#ff6a3c' },

  // --- Mythic, fifth wave (least-used shapes) ---
  { id: 'shadowfangMoray', name: 'Shadowfang Moray', rarity: 'mythic', shape: 'moray', behavior: 'erratic', spots: ['dock'], baseValue: 14, sizeRange: [48, 78], hue: '#2c2c3a' },
  { id: 'crimsonPiranha', name: 'Crimson Piranha', rarity: 'mythic', shape: 'piranha', behavior: 'sprinter', spots: ['dock'], baseValue: 14, sizeRange: [16, 26], hue: '#c9203a' },

  // --- Gargantuan ---
  { id: 'tidewhale',    name: 'Tidewhale Calf',   rarity: 'gargantuan', shape: 'whale', behavior: 'sprinter', spots: ['dock'], baseValue: 14, sizeRange: [120, 200], hue: '#ff8ad1' },
  { id: 'ironjaw',      name: 'Ironjaw Leviathan',rarity: 'gargantuan', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 15, sizeRange: [140, 220], hue: '#5a6b7a' },
  { id: 'colossalray',  name: 'Colossal Ray',     rarity: 'gargantuan', shape: 'angel', behavior: 'resting',  spots: ['dock'], baseValue: 14, sizeRange: [110, 190], hue: '#ffb8e0' },
  { id: 'titansail',    name: "Titan's Sailfish", rarity: 'gargantuan', shape: 'sail',  behavior: 'sprinter', spots: ['dock'], baseValue: 15, sizeRange: [130, 210], hue: '#6a8cff' },
  { id: 'reeftitan',    name: 'Reef Titan Turtle',  rarity: 'gargantuan', shape: 'turtle', behavior: 'resting',  spots: ['dock'], baseValue: 15, sizeRange: [100, 170], hue: '#4d8a5c' },
  { id: 'stormbehemoth',name: 'Stormfin Behemoth',  rarity: 'gargantuan', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 16, sizeRange: [150, 230], hue: '#3a5a8f' },
  { id: 'kelpserpent',  name: 'Kelp Serpent',       rarity: 'gargantuan', shape: 'serpent',   behavior: 'erratic',  spots: ['dock'], baseValue: 15, sizeRange: [160, 260], hue: '#3a6b3a' },
  { id: 'moonjelly',    name: 'Moon Colossquid',    rarity: 'gargantuan', shape: 'squid', behavior: 'resting',  spots: ['dock'], baseValue: 16, sizeRange: [90, 150],  hue: '#d8c9ff' },
  { id: 'krakenpup',    name: 'Colossal Kraken Pup', rarity: 'gargantuan', shape: 'squid', behavior: 'erratic', spots: ['dock'], baseValue: 16, sizeRange: [100, 170], hue: '#4a2c6b' },
  { id: 'colossalMoray', name: 'Colossal Moray',   rarity: 'gargantuan', shape: 'moray', behavior: 'erratic', spots: ['dock'], baseValue: 16, sizeRange: [170, 260], hue: '#3a5a3a' },
  { id: 'titanAnglerfish', name: 'Titan Anglerfish', rarity: 'gargantuan', shape: 'anglerfish', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [120, 190], hue: '#2c1c3c' },

  // --- Gargantuan, second wave ---
  { id: 'trenchColossus', name: 'Trench Colossus', rarity: 'gargantuan', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 16, sizeRange: [160, 250], hue: '#2c3a4a' },
  { id: 'abyssReachWhale', name: 'Abyss-Reach Whale', rarity: 'gargantuan', shape: 'whale', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [130, 220], hue: '#1c2c3c' },

  // --- Gargantuan, third wave (least-used shape) ---
  { id: 'colossalAnglerfish', name: 'Colossal Anglerfish', rarity: 'gargantuan', shape: 'anglerfish', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [100, 170], hue: '#241830' },

  // --- Extinct ---
  { id: 'trilobyte',    name: 'Ghost Trilobyte',  rarity: 'extinct', shape: 'trilobite',  behavior: 'resting', spots: ['dock'], baseValue: 15, sizeRange: [10, 20], hue: '#b7a5ff' },
  { id: 'coelafin',     name: 'Coelafin',         rarity: 'extinct', shape: 'round', behavior: 'steady',  spots: ['dock'], baseValue: 16, sizeRange: [50, 80], hue: '#8f7bd8' },
  { id: 'boneshark',    name: 'Boneshark Relic',  rarity: 'extinct', shape: 'shark', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [60, 100], hue: '#d8d0c0' },
  { id: 'fossilray',    name: 'Fossil Manta',     rarity: 'extinct', shape: 'manta', behavior: 'resting', spots: ['dock'], baseValue: 15, sizeRange: [45, 75], hue: '#a89878' },
  { id: 'ancientchest', name: "Ancient Mariner's Chest Crab", rarity: 'extinct', shape: 'chest', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [16, 28], hue: '#7a6b4a' },
  { id: 'direfin',      name: 'Dire Reef Shark',       rarity: 'extinct', shape: 'shark', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [65, 105], hue: '#8a7a5c' },
  { id: 'amberlung',    name: 'Amberlung Coelacanth',  rarity: 'extinct', shape: 'round', behavior: 'steady',  spots: ['dock'], baseValue: 16, sizeRange: [55, 85],  hue: '#c99a5c' },
  { id: 'shellback',    name: 'Shellback Relic',       rarity: 'extinct', shape: 'chest', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [20, 34],  hue: '#9a8a6a' },
  { id: 'titantrilobite', name: 'Titan Trilobite',      rarity: 'extinct', shape: 'trilobite',  behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [30, 55],  hue: '#9a8cd8' },
  { id: 'ancientNautilus', name: 'Ancient Nautilus',    rarity: 'extinct', shape: 'nautilus', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [14, 24], hue: '#b7a5ff' },
  { id: 'fossilSeahorse', name: 'Fossil Seahorse',      rarity: 'extinct', shape: 'seahorse', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [14, 22], hue: '#c9a878' },
  { id: 'relicLobster',  name: 'Relic Lobster',         rarity: 'extinct', shape: 'lobster', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [24, 38], hue: '#8a7a5c' },
  { id: 'fossilUrchinKing', name: 'Fossil Urchin King', rarity: 'extinct', shape: 'urchin', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [18, 30], hue: '#a89a7a' },
  { id: 'primevalTrilobite', name: 'Primeval Trilobite', rarity: 'extinct', shape: 'trilobite', behavior: 'resting', spots: ['dock'], baseValue: 16, sizeRange: [22, 40], hue: '#8a7ac0' },
  // `spots: []` deliberately keeps this out of normal casting — it's a
  // scripted boss encounter (see fishing/bossFight.js), not something that
  // turns up from a regular cast. Its own custom illustration
  // (render/drawMosasaurus.js) is used everywhere instead of the generic
  // shape-icon system, so `shape`/`hue` here only matter as a fallback for
  // anywhere that hasn't been taught about the boss yet (e.g. a bare
  // almanac silhouette).
  { id: 'mosasaurusBoss', name: 'Bonasaur', rarity: 'extinct', shape: 'shark', behavior: 'resting', spots: [], baseValue: 40, sizeRange: [140, 220], hue: '#2f6b6b', boss: true },

  // --- Abyssal ---
  { id: 'abyssquid',    name: 'Abyssal Colossquid', rarity: 'abyssal', shape: 'squid', behavior: 'erratic',  spots: ['dock'], baseValue: 17, sizeRange: [80, 140],  hue: '#43e0ff', requiresBait: 'deepChum' },
  { id: 'trenchmaw',    name: 'Trenchmaw Shark',    rarity: 'abyssal', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 18, sizeRange: [100, 160], hue: '#1c3145', requiresBait: 'deepChum' },
  { id: 'voidwhale',    name: 'Void Calf Whale',    rarity: 'abyssal', shape: 'whale', behavior: 'resting',  spots: ['dock'], baseValue: 18, sizeRange: [130, 210], hue: '#0e1a2e', requiresBait: 'deepChum' },
  { id: 'blackstar',    name: 'Blackstar Urchin',   rarity: 'abyssal', shape: 'urchin',  behavior: 'resting',  spots: ['dock'], baseValue: 17, sizeRange: [15, 26],   hue: '#1c2a3c', requiresBait: 'deepChum' },
  { id: 'pressurefang', name: 'Pressurefang Eel',   rarity: 'abyssal', shape: 'eel',   behavior: 'sprinter', spots: ['dock'], baseValue: 18, sizeRange: [90, 150],  hue: '#0e2a3c', requiresBait: 'deepChum' },
  { id: 'gloomray',     name: 'Gloomray',           rarity: 'abyssal', shape: 'angel', behavior: 'erratic',  spots: ['dock'], baseValue: 17, sizeRange: [70, 120],  hue: '#142838', requiresBait: 'deepChum' },
  { id: 'hadalcrab',    name: 'Hadal Chest Crab',   rarity: 'abyssal', shape: 'chest', behavior: 'resting',  spots: ['dock'], baseValue: 17, sizeRange: [20, 34],   hue: '#0a1a24', requiresBait: 'deepChum' },
  { id: 'voidOctopus',  name: 'Void Octopus',       rarity: 'abyssal', shape: 'octopus', behavior: 'erratic',  spots: ['dock'], baseValue: 18, sizeRange: [40, 70],   hue: '#14202e', requiresBait: 'deepChum' },
  { id: 'abyssalLobster', name: 'Abyssal Lobster',  rarity: 'abyssal', shape: 'lobster', behavior: 'resting',  spots: ['dock'], baseValue: 18, sizeRange: [30, 50],   hue: '#1c2c2a', requiresBait: 'deepChum' },
  { id: 'voidStingray', name: 'Void Stingray',      rarity: 'abyssal', shape: 'stingray', behavior: 'resting',  spots: ['dock'], baseValue: 17, sizeRange: [40, 65],   hue: '#182430', requiresBait: 'deepChum' },
  { id: 'deepAngler',   name: 'Deep Angler',        rarity: 'abyssal', shape: 'anglerfish', behavior: 'resting',  spots: ['dock'], baseValue: 18, sizeRange: [30, 50],   hue: '#0e1a24', requiresBait: 'deepChum' },
  { id: 'hadalCuttlefish', name: 'Hadal Cuttlefish', rarity: 'abyssal', shape: 'cuttlefish', behavior: 'erratic',  spots: ['dock'], baseValue: 18, sizeRange: [35, 55],   hue: '#0e1c2a', requiresBait: 'deepChum' },
  { id: 'hadalPiranha',  name: 'Hadal Piranha',     rarity: 'abyssal', shape: 'piranha', behavior: 'sprinter', spots: ['dock'], baseValue: 18, sizeRange: [25, 42],   hue: '#142430', requiresBait: 'deepChum' },

  // --- Abyssal, Voidsong Lure-only --- Naia (data/naiaDialogue.js) is the
  // only source of the Voidsong Lure, so these two only ever turn up for
  // someone who's actually found her — same "the NPC gates the fish" shape
  // as the weatherOnly/requiresRegion families above, just gated by bait
  // instead.
  { id: 'wraitheel',    name: 'Abyssal Wraith Eel', rarity: 'abyssal', shape: 'eel',   behavior: 'erratic',  spots: ['dock'], baseValue: 19, sizeRange: [85, 145], hue: '#2a4a5c', requiresBait: 'voidLure' },
  { id: 'hollowchoir',  name: 'Hollow Choir Jelly', rarity: 'abyssal', shape: 'jellyfish', behavior: 'resting',  spots: ['dock'], baseValue: 19, sizeRange: [40, 70],  hue: '#3adfc4', requiresBait: 'voidLure' },

  // --- Secret ---
  { id: 'starlightWhale', name: 'The Starlight Whale', rarity: 'secret', shape: 'whale', behavior: 'resting', spots: ['dock'], baseValue: 18, sizeRange: [150, 260], hue: '#fff37a', requiresBait: 'stardustLure' },
  { id: 'timelostKoi',    name: 'The Time-Lost Koi',   rarity: 'secret', shape: 'koi', behavior: 'erratic', spots: ['dock'], baseValue: 16, sizeRange: [30, 50],   hue: '#fff9d0', requiresBait: 'stardustLure' },
  { id: 'echoSquid',      name: 'The Echoing Squid',   rarity: 'secret', shape: 'squid', behavior: 'erratic', spots: ['dock'], baseValue: 17, sizeRange: [60, 100],  hue: '#f7f0ff', requiresBait: 'stardustLure' },
  { id: 'driftlightEel',  name: 'The Driftlight Eel',  rarity: 'secret', shape: 'eel',   behavior: 'erratic', spots: ['dock'], baseValue: 17, sizeRange: [45, 75],   hue: '#e8fff0', requiresBait: 'stardustLure' },
  { id: 'glassStag',      name: 'The Glass Stag Ray',  rarity: 'secret', shape: 'angel', behavior: 'sprinter', spots: ['dock'], baseValue: 18, sizeRange: [50, 90],  hue: '#fff0ff', requiresBait: 'stardustLure' },
  { id: 'starlitSeahorse', name: 'The Starlit Seahorse', rarity: 'secret', shape: 'seahorse', behavior: 'resting', spots: ['dock'], baseValue: 17, sizeRange: [10, 16], hue: '#fff37a', requiresBait: 'stardustLure' },
  // The Unblinking — the Voidsong Lure's own capstone, on top of the
  // Abyssal Lands region gate: it takes both finding Naia AND fishing where
  // she actually lives to ever come up, the same "two locks, one key each"
  // shape as auroraserpent below (Frozen Reach + Stardust Lure).
  { id: 'theUnblinking', name: 'The Unblinking', rarity: 'secret', shape: 'star', behavior: 'resting', spots: ['dock'], baseValue: 20, sizeRange: [40, 65], hue: '#43e0ff', requiresBait: 'voidLure', requiresRegion: 'abyssalLands' },

  // --- Weather-Exclusive --- `weatherOnly` (checked in fishing/rollFish.js
  // against the current sky, data/weather.js) keeps these off the line
  // entirely outside the listed conditions — no amount of luck substitutes
  // for actually being out on the water when it rains. Escalates with the
  // weather itself: rain unlocks the first tier, the rarest two only ever
  // bite in a storm.
  { id: 'raincaller',   name: 'Raincaller Loach', rarity: 'rare',      shape: 'eel',   behavior: 'erratic',  spots: ['dock'], baseValue: 10, sizeRange: [14, 26],  hue: '#8fb5d8', weatherOnly: ['rain', 'storm'] },
  { id: 'puddlejumper', name: 'Puddlejumper Frogfish', rarity: 'rare', shape: 'round', behavior: 'erratic', spots: ['dock'], baseValue: 10, sizeRange: [8, 16],   hue: '#7ac97a', weatherOnly: ['rain', 'storm'] },
  { id: 'stormfin',     name: 'Stormfin Marlin', rarity: 'legendary', shape: 'sail',  behavior: 'sprinter', spots: ['dock'], baseValue: 12, sizeRange: [38, 62],  hue: '#7aa8ff', weatherOnly: ['rain', 'storm'] },
  { id: 'thunderscale', name: 'Thunderscale Eel', rarity: 'legendary', shape: 'eel',  behavior: 'sprinter', spots: ['dock'], baseValue: 13, sizeRange: [42, 68],  hue: '#c8a8ff', weatherOnly: ['storm'] },
  { id: 'squallwhale',  name: 'Squall Calf Whale', rarity: 'mythic',  shape: 'whale', behavior: 'resting',  spots: ['dock'], baseValue: 14, sizeRange: [65, 105], hue: '#5c7a9f', weatherOnly: ['storm'] },
  { id: 'deludge',      name: 'Deluge Leviathan', rarity: 'gargantuan', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 16, sizeRange: [155, 240], hue: '#2c4a6b', weatherOnly: ['storm'] },

  // --- Frozen Reach-Exclusive --- `requiresRegion` (checked in fishing/
  // rollFish.js) keeps these off the line everywhere else — a real reason
  // to actually make the trip once the region unlocks (data/regions.js's
  // unlockLevel), not just more of the same roster with a colder coat of
  // paint. A full rarity ladder on its own, common through secret, so
  // there's always another Frozen Reach milestone to chase.
  { id: 'frostminnow',   name: 'Frost Minnow',          rarity: 'common',    shape: 'round', behavior: 'erratic',  spots: ['dock'], baseValue: 6,  sizeRange: [3, 8],     hue: '#dff3ff', requiresRegion: 'frozenReach' },
  { id: 'glacierTurtle', name: 'Glacier Turtle',        rarity: 'common',    shape: 'turtle', behavior: 'resting',  spots: ['dock'], baseValue: 7,  sizeRange: [9, 17],    hue: '#c9ecff', requiresRegion: 'frozenReach' },
  { id: 'icejawsmelt',   name: 'Icejaw Smelt',          rarity: 'rare',      shape: 'eel',   behavior: 'sprinter', spots: ['dock'], baseValue: 10, sizeRange: [12, 22],   hue: '#bfe8ff', requiresRegion: 'frozenReach' },
  { id: 'glaciermarlin', name: 'Glacier Marlin',        rarity: 'legendary', shape: 'sail',  behavior: 'sprinter', spots: ['dock'], baseValue: 13, sizeRange: [40, 64],   hue: '#8fd4ff', requiresRegion: 'frozenReach' },
  { id: 'frostwyrmeel',  name: 'Frostwyrm Eel',         rarity: 'mythic',    shape: 'serpent',   behavior: 'erratic',  spots: ['dock'], baseValue: 14, sizeRange: [48, 80],   hue: '#aeeaff', requiresRegion: 'frozenReach' },
  { id: 'permafrostleviathan', name: 'Permafrost Leviathan', rarity: 'gargantuan', shape: 'shark', behavior: 'sprinter', spots: ['dock'], baseValue: 16, sizeRange: [150, 240], hue: '#5c7a8f', requiresRegion: 'frozenReach' },
  { id: 'frozenmammothray', name: 'Frozen Mammoth Ray', rarity: 'extinct',   shape: 'manta', behavior: 'resting', spots: ['dock'], baseValue: 17, sizeRange: [70, 110],  hue: '#d8e8f0', requiresRegion: 'frozenReach' },
  { id: 'auroraserpent', name: 'The Aurora Serpent',    rarity: 'secret',    shape: 'serpent',   behavior: 'erratic',  spots: ['dock'], baseValue: 19, sizeRange: [55, 95],   hue: '#c9fff0', requiresBait: 'stardustLure', requiresRegion: 'frozenReach' },
];

export function fishById(id) {
  return FISH.find(f => f.id === id) || null;
}

export function fishForSpot(spotId) {
  return FISH.filter(f => f.spots.includes(spotId));
}
