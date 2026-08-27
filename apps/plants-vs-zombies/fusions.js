(() => {
  const fusionVersion = "fusion-v3";

  const fusionPlants = {
    repeater: { id: "repeater", name: "Repeater", cost: 100, role: "Fused pea shooter that fires two peas", hp: 135, fireRate: 1120, damage: 20, shot: "pea", repeat: 2, fusion: true, family: "shooter", element: "plain" },
    gatlingPea: { id: "gatlingPea", name: "Gatling Pea", cost: 150, role: "Rapid four-pea burst shooter", hp: 165, fireRate: 980, damage: 18, shot: "pea", repeat: 4, fusion: true, family: "shooter", element: "plain" },
    snowRepeater: { id: "snowRepeater", name: "Snow Repeater", cost: 130, role: "Double icy shots that slow zombies", hp: 140, fireRate: 1250, damage: 15, shot: "ice", slow: 1900, repeat: 2, fusion: true, family: "shooter", element: "ice" },
    flameRepeater: { id: "flameRepeater", name: "Flame Repeater", cost: 165, role: "Double fire shots with splash", hp: 135, fireRate: 1350, damage: 24, shot: "fire", splash: 0.58, repeat: 2, fusion: true, family: "shooter", element: "fire" },
    steamPea: { id: "steamPea", name: "Steam Pea", cost: 175, role: "Hot-cold shots slow and splash", hp: 130, fireRate: 1400, damage: 23, shot: "ice", slow: 1100, splash: 0.62, repeat: 2, fusion: true, family: "shooter", element: "steam" },
    twinSunflower: { id: "twinSunflower", name: "Twin Sunflower", cost: 100, role: "Produces bigger bursts of sun", hp: 120, sunRate: 4300, sunAmount: 85, fusion: true, family: "sun", element: "sun" },
    solarFlare: { id: "solarFlare", name: "Solar Flare", cost: 150, role: "Makes sun faster and burns nearby zombies", hp: 120, sunRate: 3800, sunAmount: 70, auraDamage: 0.006, fusion: true, family: "sun", element: "fire" },
    frostFlower: { id: "frostFlower", name: "Frost Flower", cost: 125, role: "Makes sun and chills nearby zombies", hp: 130, sunRate: 4500, sunAmount: 65, auraSlow: 900, fusion: true, family: "sun", element: "ice" },
    stormFlower: { id: "stormFlower", name: "Storm Flower", cost: 165, role: "Makes sun and zaps nearby zombies", hp: 125, sunRate: 4600, sunAmount: 75, auraDamage: 0.008, auraSlow: 350, fusion: true, family: "sun", element: "volt" },
    toxicSunflower: { id: "toxicSunflower", name: "Toxic Sunflower", cost: 165, role: "Makes sun and poisons nearby zombies", hp: 125, sunRate: 4700, sunAmount: 75, auraPoison: 900, fusion: true, family: "sun", element: "toxic" },
    tallnut: { id: "tallnut", name: "Tallnut", cost: 100, role: "Blocks two rows with thick health", hp: 920, blocker: true, coverRows: 2, fusion: true, family: "wall", element: "plain" },
    juggernut: { id: "juggernut", name: "Juggernut", cost: 200, role: "Massive two-row, two-tile wall", hp: 1650, blocker: true, coverRows: 2, coverCols: 2, fusion: true, family: "wall", element: "plain" },
    frostnut: { id: "frostnut", name: "Frostnut", cost: 125, role: "Wall that chills zombies chewing it", hp: 760, blocker: true, onHitSlow: 1700, fusion: true, family: "wall", element: "ice" },
    embernut: { id: "embernut", name: "Embernut", cost: 150, role: "Wall that burns zombies chewing it", hp: 700, blocker: true, onHitDamage: 22, fusion: true, family: "wall", element: "fire" },
    zapnut: { id: "zapnut", name: "Zapnut", cost: 175, role: "Wall that shocks zombies chewing it", hp: 720, blocker: true, onHitDamage: 16, onHitChain: true, fusion: true, family: "wall", element: "volt" },
    venomnut: { id: "venomnut", name: "Venomnut", cost: 175, role: "Wall that poisons zombies chewing it", hp: 720, blocker: true, onHitPoison: 2200, fusion: true, family: "wall", element: "toxic" },
    brambleNut: { id: "brambleNut", name: "Bramble Nut", cost: 150, role: "Spiky wall that scratches nearby zombies", hp: 820, blocker: true, auraDamage: 0.01, fusion: true, family: "wall", element: "thorn" },
    iceChomper: { id: "iceChomper", name: "Ice Chomper", cost: 225, role: "Huge frozen bite that slows targets", hp: 220, fireRate: 2450, damage: 155, melee: true, slowBite: 2300, biteRange: 1.45, fusion: true, family: "chomper", element: "ice" },
    doubleIceChomper: { id: "doubleIceChomper", name: "Ice Double Chomper", cost: 300, role: "Twin frozen jaws with heavier bite", hp: 330, fireRate: 2150, damage: 235, melee: true, slowBite: 3200, biteRange: 1.7, fusion: true, family: "chomper", element: "ice" },
    fireChomper: { id: "fireChomper", name: "Fire Chomper", cost: 250, role: "Huge burning bite with splash", hp: 230, fireRate: 2380, damage: 175, melee: true, biteSplash: 0.8, biteRange: 1.48, fusion: true, family: "chomper", element: "fire" },
    toxicChomper: { id: "toxicChomper", name: "Toxic Chomper", cost: 250, role: "Huge poison bite", hp: 230, fireRate: 2380, damage: 145, melee: true, bitePoison: 3500, biteRange: 1.48, fusion: true, family: "chomper", element: "toxic" },
    voltChomper: { id: "voltChomper", name: "Volt Chomper", cost: 265, role: "Huge electric bite that chains", hp: 225, fireRate: 2300, damage: 150, melee: true, biteChain: 2, biteRange: 1.5, fusion: true, family: "chomper", element: "volt" },
    vineChomper: { id: "vineChomper", name: "Vine Chomper", cost: 240, role: "Snaring bite that holds zombies back", hp: 250, fireRate: 2300, damage: 125, melee: true, slowBite: 3800, biteRange: 1.55, fusion: true, family: "chomper", element: "thorn" },
    sunChomper: { id: "sunChomper", name: "Sun Chomper", cost: 200, role: "Bites zombies and blooms sun", hp: 210, fireRate: 2500, damage: 135, melee: true, biteSun: 20, biteRange: 1.38, fusion: true, family: "chomper", element: "sun" },
    voltRepeater: { id: "voltRepeater", name: "Volt Repeater", cost: 175, role: "Double electric shots that chain", hp: 135, fireRate: 1420, damage: 20, shot: "volt", chain: 2, repeat: 2, fusion: true, family: "shooter", element: "volt" },
    toxicRepeater: { id: "toxicRepeater", name: "Toxic Repeater", cost: 175, role: "Double poison shots", hp: 135, fireRate: 1350, damage: 14, shot: "toxic", poison: 2800, repeat: 2, fusion: true, family: "shooter", element: "toxic" },
    peaBattery: { id: "peaBattery", name: "Pea Battery", cost: 225, role: "Triple pea upgrade with stronger lanes", hp: 145, fireRate: 1300, damage: 20, shot: "triple", multiRows: [-1, 0, 1], repeat: 2, fusion: true, family: "shooter", element: "plain" },
    snowThreepeater: { id: "snowThreepeater", name: "Snow Threepeater", cost: 250, role: "Three lanes of icy shots", hp: 155, fireRate: 1400, damage: 16, shot: "ice", slow: 1800, multiRows: [-1, 0, 1], repeat: 2, fusion: true, family: "shooter", element: "ice" },
    flameThreepeater: { id: "flameThreepeater", name: "Flame Threepeater", cost: 275, role: "Three lanes of fire splash", hp: 150, fireRate: 1500, damage: 22, shot: "fire", splash: 0.55, multiRows: [-1, 0, 1], repeat: 2, fusion: true, family: "shooter", element: "fire" },
    voltThreepeater: { id: "voltThreepeater", name: "Volt Threepeater", cost: 300, role: "Three lanes of chaining lightning", hp: 150, fireRate: 1550, damage: 18, shot: "volt", chain: 2, multiRows: [-1, 0, 1], repeat: 2, fusion: true, family: "shooter", element: "volt" },
    toxicThreepeater: { id: "toxicThreepeater", name: "Toxic Threepeater", cost: 300, role: "Three lanes of poison shots", hp: 150, fireRate: 1500, damage: 14, shot: "toxic", poison: 3200, multiRows: [-1, 0, 1], repeat: 2, fusion: true, family: "shooter", element: "toxic" },
    cannonRepeater: { id: "cannonRepeater", name: "Cannon Repeater", cost: 250, role: "Double pod blasts with heavy splash", hp: 170, fireRate: 2100, damage: 55, shot: "cannon", splash: 1.08, repeat: 2, fusion: true, family: "cannon", element: "plain" },
    meteorCannon: { id: "meteorCannon", name: "Meteor Cannon", cost: 300, role: "Huge fire cannon splash", hp: 180, fireRate: 2200, damage: 72, shot: "fire", splash: 1.25, repeat: 1, fusion: true, family: "cannon", element: "fire" },
    glacierCannon: { id: "glacierCannon", name: "Glacier Cannon", cost: 300, role: "Huge ice cannon blast", hp: 185, fireRate: 2250, damage: 54, shot: "ice", slow: 3200, splash: 1.18, repeat: 1, fusion: true, family: "cannon", element: "ice" },
    railCannon: { id: "railCannon", name: "Rail Cannon", cost: 325, role: "Electric cannon chains through crowds", hp: 180, fireRate: 2200, damage: 54, shot: "volt", chain: 4, splash: 0.55, repeat: 1, fusion: true, family: "cannon", element: "volt" },
    sludgeCannon: { id: "sludgeCannon", name: "Sludge Cannon", cost: 325, role: "Poison cannon blast", hp: 180, fireRate: 2250, damage: 46, shot: "toxic", poison: 4500, splash: 1.05, repeat: 1, fusion: true, family: "cannon", element: "toxic" },
    frostVine: { id: "frostVine", name: "Frost Vine", cost: 175, role: "Snare that freezes nearby zombies", hp: 150, fireRate: 640, damage: 7, trap: true, slowAura: 1900, fusion: true, family: "vine", element: "ice" },
    fireVine: { id: "fireVine", name: "Fire Vine", cost: 200, role: "Snare that burns nearby zombies", hp: 145, fireRate: 660, damage: 18, trap: true, splash: 0.55, fusion: true, family: "vine", element: "fire" },
    voltVine: { id: "voltVine", name: "Volt Vine", cost: 225, role: "Snare that shocks nearby zombies", hp: 145, fireRate: 680, damage: 14, trap: true, chain: 2, slowAura: 450, fusion: true, family: "vine", element: "volt" },
    toxicVine: { id: "toxicVine", name: "Toxic Vine", cost: 225, role: "Snare that poisons nearby zombies", hp: 145, fireRate: 650, damage: 9, trap: true, poisonAura: 2200, fusion: true, family: "vine", element: "toxic" },

    titanNut: { id: "titanNut", name: "Titan Nut", cost: 260, role: "Colossal two-row wall", hp: 1450, blocker: true, coverRows: 2, fusion: true, family: "wall", element: "plain" },
    reinforcedNut: { id: "reinforcedNut", name: "Reinforced Nut", cost: 200, role: "Extra tough single-tile wall", hp: 1050, blocker: true, fusion: true, family: "wall", element: "plain" },
    meteorMelon: { id: "meteorMelon", name: "Meteor Melon", cost: 340, role: "Enormous splash blast", hp: 190, fireRate: 2600, damage: 100, shot: "cannon", splash: 1.4, fusion: true, family: "cannon", element: "fire" },
    scorchMelon: { id: "scorchMelon", name: "Scorch Melon", cost: 300, role: "Molten splash cannon", hp: 170, fireRate: 2500, damage: 88, shot: "cannon", splash: 1.25, fusion: true, family: "cannon", element: "fire" },
    frozenMelon: { id: "frozenMelon", name: "Frozen Melon", cost: 300, role: "Icy splash cannon that slows", hp: 170, fireRate: 2550, damage: 70, shot: "cannon", slow: 2600, splash: 1.2, fusion: true, family: "cannon", element: "ice" },
    novaBurst: { id: "novaBurst", name: "Nova Burst", cost: 300, role: "Five-lane rapid bursts", hp: 130, fireRate: 1300, damage: 17, shot: "pea", multiRows: [-2, -1, 0, 1, 2], fusion: true, family: "shooter", element: "plain" },
    stormBurst: { id: "stormBurst", name: "Storm Burst", cost: 340, role: "Five lanes of chaining lightning", hp: 130, fireRate: 1500, damage: 15, shot: "volt", chain: 2, multiRows: [-2, -1, 0, 1, 2], fusion: true, family: "shooter", element: "volt" },
    ironJaw: { id: "ironJaw", name: "Iron Jaw", cost: 260, role: "Bone-crushing single bite", hp: 240, fireRate: 2500, damage: 320, melee: true, fusion: true, family: "chomper", element: "thorn" },
    venomJaw: { id: "venomJaw", name: "Venom Jaw", cost: 270, role: "Thorny bite that poisons", hp: 230, fireRate: 2550, damage: 240, melee: true, bitePoison: 3200, fusion: true, family: "chomper", element: "toxic" },
    glacierWall: { id: "glacierWall", name: "Glacier Wall", cost: 260, role: "Two-row wall that chills attackers", hp: 900, blocker: true, coverRows: 2, onHitSlow: 1800, fusion: true, family: "wall", element: "ice" },
    steamWall: { id: "steamWall", name: "Steam Wall", cost: 240, role: "Wall that scalds and slows attackers", hp: 720, blocker: true, onHitDamage: 14, onHitSlow: 1200, fusion: true, family: "wall", element: "steam" },
    infernoVine: { id: "infernoVine", name: "Inferno Vine", cost: 300, role: "Stronger burning snare", hp: 150, fireRate: 650, damage: 20, trap: true, splash: 0.75, fusion: true, family: "vine", element: "fire" },
    plagueVine: { id: "plagueVine", name: "Plague Vine", cost: 300, role: "Burning snare that also poisons", hp: 150, fireRate: 660, damage: 14, trap: true, splash: 0.5, poisonAura: 2000, fusion: true, family: "vine", element: "toxic" },
    hurricanePea: { id: "hurricanePea", name: "Hurricane Pea", cost: 200, role: "Extremely rapid light shots", hp: 105, fireRate: 400, damage: 10, shot: "pea", fusion: true, family: "shooter", element: "plain" },
    staticStorm: { id: "staticStorm", name: "Static Storm", cost: 250, role: "Rapid chaining shocks", hp: 105, fireRate: 480, damage: 10, shot: "volt", chain: 2, fusion: true, family: "shooter", element: "volt" },
    twinGuard: { id: "twinGuard", name: "Twin Guard", cost: 240, role: "Tanky sunflower with big bursts", hp: 260, sunRate: 4000, sunAmount: 90, fusion: true, family: "sun", element: "sun" },
    solarGuard: { id: "solarGuard", name: "Solar Guard", cost: 260, role: "Tanky sunflower that burns nearby zombies", hp: 240, sunRate: 4200, sunAmount: 75, auraDamage: 0.007, fusion: true, family: "sun", element: "fire" },
    sludgeMelon: { id: "sludgeMelon", name: "Sludge Melon", cost: 320, role: "Splash cannon that poisons", hp: 165, fireRate: 2600, damage: 60, shot: "toxic", poison: 4200, splash: 1.15, fusion: true, family: "cannon", element: "toxic" },
    voltMelon: { id: "voltMelon", name: "Volt Melon", cost: 320, role: "Splash cannon that chains", hp: 165, fireRate: 2500, damage: 62, shot: "volt", chain: 3, splash: 0.9, fusion: true, family: "cannon", element: "volt" },
    blazeBurst: { id: "blazeBurst", name: "Blaze Burst", cost: 320, role: "Five lanes of fire splash", hp: 125, fireRate: 1600, damage: 20, shot: "fire", splash: 0.5, multiRows: [-2, -1, 0, 1, 2], fusion: true, family: "shooter", element: "fire" },
    toxicBurst: { id: "toxicBurst", name: "Toxic Burst", cost: 320, role: "Five lanes of poison shots", hp: 125, fireRate: 1600, damage: 14, shot: "toxic", poison: 3000, multiRows: [-2, -1, 0, 1, 2], fusion: true, family: "shooter", element: "toxic" },
    cinderJaw: { id: "cinderJaw", name: "Cinder Jaw", cost: 240, role: "Bite with a burning splash", hp: 220, fireRate: 2500, damage: 235, melee: true, biteSplash: 0.7, fusion: true, family: "chomper", element: "fire" },
    shockJaw: { id: "shockJaw", name: "Shock Jaw", cost: 250, role: "Bite that chains to nearby zombies", hp: 220, fireRate: 2500, damage: 230, melee: true, biteChain: 2, fusion: true, family: "chomper", element: "volt" },
    blightWall: { id: "blightWall", name: "Blight Wall", cost: 250, role: "Wall that poisons attackers", hp: 700, blocker: true, onHitPoison: 2600, fusion: true, family: "wall", element: "toxic" },
    vaporVine: { id: "vaporVine", name: "Vapor Vine", cost: 260, role: "Scalding snare that also slows", hp: 140, fireRate: 680, damage: 15, trap: true, slowAura: 1300, splash: 0.4, fusion: true, family: "vine", element: "steam" },
    cyclonePea: { id: "cyclonePea", name: "Cyclone Pea", cost: 230, role: "Rapid burning shots", hp: 100, fireRate: 480, damage: 12, shot: "fire", fusion: true, family: "shooter", element: "fire" },
    miasmaPea: { id: "miasmaPea", name: "Miasma Pea", cost: 230, role: "Rapid poison shots", hp: 100, fireRate: 500, damage: 10, shot: "toxic", poison: 1800, fusion: true, family: "shooter", element: "toxic" },
    winterGuard: { id: "winterGuard", name: "Winter Guard", cost: 250, role: "Sunflower that chills nearby zombies", hp: 235, sunRate: 4400, sunAmount: 65, auraSlow: 800, fusion: true, family: "sun", element: "ice" },
    blightGuard: { id: "blightGuard", name: "Blight Guard", cost: 250, role: "Sunflower that poisons nearby zombies", hp: 235, sunRate: 4500, sunAmount: 65, auraPoison: 800, fusion: true, family: "sun", element: "toxic" },

    frostGale: { id: "frostGale", name: "Frost Gale", cost: 200, role: "Rapid heavy icy shots", hp: 130, fireRate: 850, damage: 16, shot: "ice", slow: 1700, fusion: true, family: "shooter", element: "ice" },
    steamFern: { id: "steamFern", name: "Steam Fern", cost: 220, role: "Rapid scalding shots", hp: 130, fireRate: 900, damage: 15, shot: "ice", slow: 900, splash: 0.4, fusion: true, family: "shooter", element: "steam" },
    infernoBud: { id: "infernoBud", name: "Inferno Bud", cost: 230, role: "Bigger single fireball", hp: 135, fireRate: 1950, damage: 58, shot: "fire", splash: 0.4, fusion: true, family: "shooter", element: "fire" },
    emberFrost: { id: "emberFrost", name: "Ember Frost", cost: 230, role: "Hot-cold heavy shots", hp: 135, fireRate: 2000, damage: 50, shot: "ice", slow: 1200, fusion: true, family: "shooter", element: "steam" },
    stormReed: { id: "stormReed", name: "Storm Reed", cost: 240, role: "Longer chaining lightning", hp: 125, fireRate: 1750, damage: 26, shot: "volt", chain: 5, fusion: true, family: "shooter", element: "volt" },
    plagueReed: { id: "plagueReed", name: "Plague Reed", cost: 250, role: "Chaining poison shots", hp: 125, fireRate: 1800, damage: 15, shot: "toxic", poison: 2600, chain: 2, fusion: true, family: "shooter", element: "toxic" },
    miasmaSprout: { id: "miasmaSprout", name: "Miasma Sprout", cost: 230, role: "Heavier stacking poison", hp: 130, fireRate: 1150, damage: 12, shot: "toxic", poison: 4200, fusion: true, family: "shooter", element: "toxic" },
    voltBog: { id: "voltBog", name: "Volt Bog", cost: 250, role: "Shocking poison shots", hp: 130, fireRate: 1200, damage: 14, shot: "volt", chain: 2, poison: 1800, fusion: true, family: "shooter", element: "volt" },
    mountainRoot: { id: "mountainRoot", name: "Mountain Root", cost: 260, role: "Two-row tough wall", hp: 1700, blocker: true, coverRows: 2, fusion: true, family: "wall", element: "plain" },
    diamondRoot: { id: "diamondRoot", name: "Diamond Root", cost: 300, role: "Wall that badly slows attackers", hp: 1100, blocker: true, onHitSlow: 2800, fusion: true, family: "wall", element: "crystal" },
    prismWard: { id: "prismWard", name: "Prism Ward", cost: 300, role: "Two-row slowing wall", hp: 1150, blocker: true, coverRows: 2, onHitSlow: 2000, fusion: true, family: "wall", element: "crystal" },
    voidRoot: { id: "voidRoot", name: "Void Root", cost: 300, role: "Two-row wall that scratches attackers", hp: 1250, blocker: true, coverRows: 2, auraDamage: 0.012, fusion: true, family: "wall", element: "shadow" },
    megajaw: { id: "megajaw", name: "Megajaw", cost: 280, role: "Even heavier single bite", hp: 220, fireRate: 2200, damage: 260, melee: true, fusion: true, family: "chomper", element: "plain" },
    cinderGator: { id: "cinderGator", name: "Cinder Gator", cost: 290, role: "Burning heavy bite", hp: 220, fireRate: 2250, damage: 220, melee: true, biteSplash: 0.6, fusion: true, family: "chomper", element: "fire" },
    glacierFang: { id: "glacierFang", name: "Glacier Fang", cost: 300, role: "Faster freezing bite", hp: 225, fireRate: 1950, damage: 150, melee: true, slowBite: 3400, fusion: true, family: "chomper", element: "ice" },
    frostbiteFang: { id: "frostbiteFang", name: "Frostbite Fang", cost: 310, role: "Freezing bite that also poisons", hp: 225, fireRate: 2000, damage: 145, melee: true, slowBite: 2200, bitePoison: 2200, fusion: true, family: "chomper", element: "toxic" },
    brambleWhip: { id: "brambleWhip", name: "Bramble Whip", cost: 220, role: "Sharper snaring trap", hp: 145, fireRate: 600, damage: 14, trap: true, slowAura: 1500, fusion: true, family: "vine", element: "thorn" },
    scorchWhip: { id: "scorchWhip", name: "Scorch Whip", cost: 240, role: "Burning snaring trap", hp: 145, fireRate: 610, damage: 18, trap: true, splash: 0.5, slowAura: 700, fusion: true, family: "vine", element: "fire" },
    stormMist: { id: "stormMist", name: "Storm Mist", cost: 250, role: "Stronger scalding trap", hp: 150, fireRate: 660, damage: 17, trap: true, slowAura: 1300, splash: 0.5, fusion: true, family: "vine", element: "steam" },
    chargedMist: { id: "chargedMist", name: "Charged Mist", cost: 260, role: "Shocking, slowing trap", hp: 150, fireRate: 650, damage: 15, trap: true, chain: 2, slowAura: 1100, fusion: true, family: "vine", element: "volt" },
    meteorStorm: { id: "meteorStorm", name: "Meteor Storm", cost: 340, role: "Even bigger fiery blast", hp: 175, fireRate: 2500, damage: 82, shot: "fire", splash: 1.15, fusion: true, family: "cannon", element: "fire" },
    cometFrost: { id: "cometFrost", name: "Comet Frost", cost: 340, role: "Freezing splash blast", hp: 175, fireRate: 2500, damage: 60, shot: "ice", slow: 2800, splash: 1.05, fusion: true, family: "cannon", element: "ice" },
    teslaCannon: { id: "teslaCannon", name: "Tesla Cannon", cost: 350, role: "Wide chaining blast", hp: 175, fireRate: 2450, damage: 46, shot: "volt", chain: 5, splash: 0.5, fusion: true, family: "cannon", element: "volt" },
    corrosiveIon: { id: "corrosiveIon", name: "Corrosive Ion", cost: 360, role: "Poisoning chain blast", hp: 175, fireRate: 2500, damage: 44, shot: "toxic", poison: 4000, chain: 2, fusion: true, family: "cannon", element: "toxic" },
    solsticeBloom: { id: "solsticeBloom", name: "Solstice Bloom", cost: 250, role: "Even bigger bursts of sun", hp: 130, sunRate: 4600, sunAmount: 100, fusion: true, family: "sun", element: "sun" },
    eclipseRadiance: { id: "eclipseRadiance", name: "Eclipse Radiance", cost: 300, role: "Makes sun and saps harder", hp: 160, sunRate: 4700, sunAmount: 70, auraDamage: 0.007, fusion: true, family: "sun", element: "shadow" },
    umbraBloom: { id: "umbraBloom", name: "Umbra Bloom", cost: 300, role: "Bigger shadowy sun bursts", hp: 165, sunRate: 4500, sunAmount: 75, auraDamage: 0.006, fusion: true, family: "sun", element: "shadow" },
    galaxyPea: { id: "galaxyPea", name: "Galaxy Pea", cost: 270, role: "Stronger slowing crystal shots", hp: 115, fireRate: 1150, damage: 23, shot: "ice", slow: 2400, fusion: true, family: "shooter", element: "crystal" },
    prismStorm: { id: "prismStorm", name: "Prism Storm", cost: 300, role: "Chaining crystal shots", hp: 115, fireRate: 1200, damage: 20, shot: "volt", chain: 2, slow: 1400, fusion: true, family: "shooter", element: "crystal" },
    abyssChomper: { id: "abyssChomper", name: "Abyss Chomper", cost: 320, role: "Bigger shadowy weakening bite", hp: 235, fireRate: 2350, damage: 200, melee: true, slowBite: 2600, fusion: true, family: "chomper", element: "shadow" },
    toxicFrost: { id: "toxicFrost", name: "Toxic Frost", cost: 220, role: "Icy poison shots", hp: 100, fireRate: 1100, damage: 12, shot: "toxic", poison: 2000, slow: 900, fusion: true, family: "shooter", element: "toxic" },
    plasmaBud: { id: "plasmaBud", name: "Plasma Bud", cost: 250, role: "Chaining fireball", hp: 105, fireRate: 1900, damage: 34, shot: "volt", chain: 2, fusion: true, family: "shooter", element: "volt" },
    stormBlaze: { id: "stormBlaze", name: "Storm Blaze", cost: 250, role: "Burning chain shots", hp: 105, fireRate: 1650, damage: 26, shot: "fire", splash: 0.4, fusion: true, family: "shooter", element: "fire" },
    causticBlaze: { id: "causticBlaze", name: "Caustic Blaze", cost: 250, role: "Burning poison shots", hp: 105, fireRate: 1250, damage: 16, shot: "fire", splash: 0.35, poison: 1600, fusion: true, family: "shooter", element: "fire" },
    shockGator: { id: "shockGator", name: "Shock Gator", cost: 300, role: "Chaining electric bite", hp: 195, fireRate: 2350, damage: 175, melee: true, biteChain: 2, fusion: true, family: "chomper", element: "volt" },
    venomGator: { id: "venomGator", name: "Venom Gator", cost: 300, role: "Poisoning heavy bite", hp: 195, fireRate: 2350, damage: 170, melee: true, bitePoison: 3000, fusion: true, family: "chomper", element: "toxic" },
    steamFang: { id: "steamFang", name: "Steam Fang", cost: 310, role: "Scalding freezing bite", hp: 200, fireRate: 2150, damage: 140, melee: true, slowBite: 2000, biteSplash: 0.4, fusion: true, family: "chomper", element: "steam" },
    venomWhip: { id: "venomWhip", name: "Venom Whip", cost: 250, role: "Poisoning snare", hp: 135, fireRate: 650, damage: 10, trap: true, poisonAura: 1800, fusion: true, family: "vine", element: "toxic" },
    staticWhip: { id: "staticWhip", name: "Static Whip", cost: 260, role: "Shocking snare", hp: 135, fireRate: 640, damage: 12, trap: true, chain: 2, fusion: true, family: "vine", element: "volt" },
    boilingMist: { id: "boilingMist", name: "Boiling Mist", cost: 260, role: "Scalding, burning trap", hp: 140, fireRate: 680, damage: 16, trap: true, splash: 0.55, fusion: true, family: "vine", element: "fire" },
    plasmaComet: { id: "plasmaComet", name: "Plasma Comet", cost: 380, role: "Chaining splash blast", hp: 180, fireRate: 2400, damage: 48, shot: "volt", chain: 3, splash: 0.7, fusion: true, family: "cannon", element: "volt" },
    blightComet: { id: "blightComet", name: "Blight Comet", cost: 380, role: "Poisoning splash blast", hp: 180, fireRate: 2450, damage: 44, shot: "toxic", poison: 4400, splash: 1.0, fusion: true, family: "cannon", element: "toxic" },
    fusionCannon: { id: "fusionCannon", name: "Fusion Cannon", cost: 380, role: "Huge burning electric blast", hp: 180, fireRate: 2500, damage: 58, shot: "fire", splash: 1.1, fusion: true, family: "cannon", element: "fire" },
    nebulaPea: { id: "nebulaPea", name: "Nebula Pea", cost: 280, role: "Slowing poison shots", hp: 115, fireRate: 1300, damage: 15, shot: "toxic", poison: 2200, slow: 1300, fusion: true, family: "shooter", element: "toxic" },
    supernovaPea: { id: "supernovaPea", name: "Supernova Pea", cost: 300, role: "Slowing splash shots", hp: 115, fireRate: 1500, damage: 28, shot: "fire", splash: 0.5, slow: 1100, fusion: true, family: "shooter", element: "fire" },
    permafrostRoot: { id: "permafrostRoot", name: "Permafrost Root", cost: 260, role: "Wall that deeply chills attackers", hp: 950, blocker: true, onHitSlow: 2400, fusion: true, family: "wall", element: "ice" },
    magmaRoot: { id: "magmaRoot", name: "Magma Root", cost: 260, role: "Wall that scorches attackers", hp: 920, blocker: true, onHitDamage: 26, fusion: true, family: "wall", element: "fire" },
    plagueRoot: { id: "plagueRoot", name: "Plague Root", cost: 270, role: "Heavier poisoning wall", hp: 900, blocker: true, onHitPoison: 3200, fusion: true, family: "wall", element: "toxic" },
    resonantWard: { id: "resonantWard", name: "Resonant Ward", cost: 280, role: "Wall that shocks attackers", hp: 880, blocker: true, onHitDamage: 18, onHitChain: true, fusion: true, family: "wall", element: "volt" },
    radiantFlare: { id: "radiantFlare", name: "Radiant Flare", cost: 300, role: "Sunflower that burns hard", hp: 150, sunRate: 4400, sunAmount: 70, auraDamage: 0.008, fusion: true, family: "sun", element: "fire" },
    blightedRadiance: { id: "blightedRadiance", name: "Blighted Radiance", cost: 300, role: "Sunflower that poisons hard", hp: 150, sunRate: 4400, sunAmount: 70, auraPoison: 1000, fusion: true, family: "sun", element: "toxic" },
    frozenEclipse: { id: "frozenEclipse", name: "Frozen Eclipse", cost: 310, role: "Sunflower that chills hard", hp: 155, sunRate: 4500, sunAmount: 65, auraSlow: 1100, fusion: true, family: "sun", element: "ice" },
    hellmaw: { id: "hellmaw", name: "Hellmaw", cost: 340, role: "Blazing shadow bite", hp: 210, fireRate: 2300, damage: 210, melee: true, biteSplash: 0.55, fusion: true, family: "chomper", element: "fire" },
    plagueMaw: { id: "plagueMaw", name: "Plague Maw", cost: 340, role: "Poisoning shadow bite", hp: 210, fireRate: 2350, damage: 195, melee: true, bitePoison: 3400, fusion: true, family: "chomper", element: "toxic" },
    toxicFog: { id: "toxicFog", name: "Toxic Fog", cost: 250, role: "Poisoning scalding trap", hp: 140, fireRate: 670, damage: 12, trap: true, poisonAura: 1600, fusion: true, family: "vine", element: "toxic" },
    twinGator: { id: "twinGator", name: "Twin Gator", cost: 320, role: "Massive twin-jaw bite", hp: 260, fireRate: 2150, damage: 300, melee: true, fusion: true, family: "chomper", element: "plain" },
    bedrockWall: { id: "bedrockWall", name: "Bedrock Wall", cost: 280, role: "Two-row bedrock wall", hp: 1550, blocker: true, coverRows: 2, fusion: true, family: "wall", element: "plain" },
    orbitalCannon: { id: "orbitalCannon", name: "Orbital Cannon", cost: 400, role: "Colossal fiery blast", hp: 190, fireRate: 2600, damage: 90, shot: "fire", splash: 1.3, fusion: true, family: "cannon", element: "fire" },
    cosmicRepeater: { id: "cosmicRepeater", name: "Cosmic Repeater", cost: 260, role: "Twin slowing crystal shots", hp: 125, fireRate: 1150, damage: 17, shot: "ice", slow: 1900, repeat: 2, fusion: true, family: "shooter", element: "crystal" },
    razorVine: { id: "razorVine", name: "Razor Vine", cost: 210, role: "Sharper thorny snare", hp: 140, fireRate: 630, damage: 12, trap: true, slowAura: 1000, fusion: true, family: "vine", element: "thorn" },
  };

  Object.entries(fusionPlants).forEach(([id, stats]) => {
    plantStats[id] = stats;
  });

  const rules = new Map();
  function key(a, b) {
    return [a, b].sort().join("+");
  }
  function addFusion(a, b, result) {
    rules.set(key(a, b), result);
  }

  addFusion("pea", "pea", "repeater");
  addFusion("repeater", "pea", "gatlingPea");
  addFusion("ice", "ice", "snowRepeater");
  addFusion("fire", "fire", "flameRepeater");
  addFusion("fire", "ice", "steamPea");
  addFusion("sunflower", "sunflower", "twinSunflower");
  addFusion("sunflower", "fire", "solarFlare");
  addFusion("sunflower", "ice", "frostFlower");
  addFusion("sunflower", "volt", "stormFlower");
  addFusion("sunflower", "toxic", "toxicSunflower");
  addFusion("spike", "spike", "tallnut");
  addFusion("tallnut", "tallnut", "juggernut");
  addFusion("tallnut", "spike", "juggernut");
  addFusion("spike", "ice", "frostnut");
  addFusion("spike", "fire", "embernut");
  addFusion("spike", "volt", "zapnut");
  addFusion("spike", "toxic", "venomnut");
  addFusion("spike", "vine", "brambleNut");
  addFusion("ice", "chomper", "iceChomper");
  addFusion("fire", "chomper", "fireChomper");
  addFusion("toxic", "chomper", "toxicChomper");
  addFusion("volt", "chomper", "voltChomper");
  addFusion("vine", "chomper", "vineChomper");
  addFusion("iceChomper", "iceChomper", "doubleIceChomper");
  addFusion("iceChomper", "ice", "doubleIceChomper");
  addFusion("iceChomper", "chomper", "doubleIceChomper");
  addFusion("pea", "volt", "voltRepeater");
  addFusion("pea", "toxic", "toxicRepeater");
  addFusion("pea", "triple", "peaBattery");
  addFusion("sunflower", "chomper", "sunChomper");
  addFusion("pea", "cannon", "cannonRepeater");
  addFusion("triple", "ice", "snowThreepeater");
  addFusion("triple", "fire", "flameThreepeater");
  addFusion("triple", "volt", "voltThreepeater");
  addFusion("triple", "toxic", "toxicThreepeater");
  addFusion("cannon", "fire", "meteorCannon");
  addFusion("cannon", "ice", "glacierCannon");
  addFusion("cannon", "volt", "railCannon");
  addFusion("cannon", "toxic", "sludgeCannon");
  addFusion("vine", "ice", "frostVine");
  addFusion("vine", "fire", "fireVine");
  addFusion("vine", "volt", "voltVine");
  addFusion("vine", "toxic", "toxicVine");

  addFusion("ironNut", "ironNut", "titanNut");
  addFusion("ironNut", "spike", "reinforcedNut");
  addFusion("melonSmasher", "melonSmasher", "meteorMelon");
  addFusion("melonSmasher", "fire", "scorchMelon");
  addFusion("melonSmasher", "ice", "frozenMelon");
  addFusion("starburst", "starburst", "novaBurst");
  addFusion("starburst", "volt", "stormBurst");
  addFusion("snapTrap", "snapTrap", "ironJaw");
  addFusion("snapTrap", "toxic", "venomJaw");
  addFusion("frostSpike", "frostSpike", "glacierWall");
  addFusion("frostSpike", "fire", "steamWall");
  addFusion("emberVine", "emberVine", "infernoVine");
  addFusion("emberVine", "toxic", "plagueVine");
  addFusion("galePea", "galePea", "hurricanePea");
  addFusion("galePea", "volt", "staticStorm");
  addFusion("bloomGuard", "bloomGuard", "twinGuard");
  addFusion("bloomGuard", "fire", "solarGuard");
  addFusion("melonSmasher", "toxic", "sludgeMelon");
  addFusion("melonSmasher", "volt", "voltMelon");
  addFusion("starburst", "fire", "blazeBurst");
  addFusion("starburst", "toxic", "toxicBurst");
  addFusion("snapTrap", "fire", "cinderJaw");
  addFusion("snapTrap", "volt", "shockJaw");
  addFusion("frostSpike", "toxic", "blightWall");
  addFusion("emberVine", "ice", "vaporVine");
  addFusion("galePea", "fire", "cyclonePea");
  addFusion("galePea", "toxic", "miasmaPea");
  addFusion("bloomGuard", "ice", "winterGuard");
  addFusion("bloomGuard", "toxic", "blightGuard");

  addFusion("frostFern", "frostFern", "frostGale");
  addFusion("frostFern", "fire", "steamFern");
  addFusion("blazeBud", "blazeBud", "infernoBud");
  addFusion("blazeBud", "ice", "emberFrost");
  addFusion("thunderReed", "thunderReed", "stormReed");
  addFusion("thunderReed", "toxic", "plagueReed");
  addFusion("bogSprout", "bogSprout", "miasmaSprout");
  addFusion("bogSprout", "volt", "voltBog");
  addFusion("boulderRoot", "boulderRoot", "mountainRoot");
  addFusion("boulderRoot", "crystalWard", "diamondRoot");
  addFusion("crystalWard", "crystalWard", "prismWard");
  addFusion("shadowRoot", "shadowRoot", "voidRoot");
  addFusion("gatorJaw", "gatorJaw", "megajaw");
  addFusion("gatorJaw", "fire", "cinderGator");
  addFusion("frostFang", "frostFang", "glacierFang");
  addFusion("frostFang", "toxic", "frostbiteFang");
  addFusion("thornWhip", "thornWhip", "brambleWhip");
  addFusion("thornWhip", "fire", "scorchWhip");
  addFusion("mistVine", "mistVine", "stormMist");
  addFusion("mistVine", "volt", "chargedMist");
  addFusion("cometCannon", "cometCannon", "meteorStorm");
  addFusion("cometCannon", "ice", "cometFrost");
  addFusion("ionCannon", "ionCannon", "teslaCannon");
  addFusion("ionCannon", "toxic", "corrosiveIon");
  addFusion("radiantBloom", "radiantBloom", "solsticeBloom");
  addFusion("radiantBloom", "eclipseBloom", "eclipseRadiance");
  addFusion("eclipseBloom", "eclipseBloom", "umbraBloom");
  addFusion("starlightPea", "starlightPea", "galaxyPea");
  addFusion("starlightPea", "volt", "prismStorm");
  addFusion("voidChomper", "voidChomper", "abyssChomper");
  addFusion("frostFern", "toxic", "toxicFrost");
  addFusion("blazeBud", "volt", "plasmaBud");
  addFusion("thunderReed", "fire", "stormBlaze");
  addFusion("bogSprout", "fire", "causticBlaze");
  addFusion("gatorJaw", "volt", "shockGator");
  addFusion("gatorJaw", "toxic", "venomGator");
  addFusion("frostFang", "fire", "steamFang");
  addFusion("thornWhip", "toxic", "venomWhip");
  addFusion("thornWhip", "volt", "staticWhip");
  addFusion("mistVine", "fire", "boilingMist");
  addFusion("cometCannon", "volt", "plasmaComet");
  addFusion("cometCannon", "toxic", "blightComet");
  addFusion("ionCannon", "fire", "fusionCannon");
  addFusion("starlightPea", "toxic", "nebulaPea");
  addFusion("starlightPea", "fire", "supernovaPea");
  addFusion("boulderRoot", "ice", "permafrostRoot");
  addFusion("boulderRoot", "fire", "magmaRoot");
  addFusion("shadowRoot", "toxic", "plagueRoot");
  addFusion("crystalWard", "volt", "resonantWard");
  addFusion("radiantBloom", "fire", "radiantFlare");
  addFusion("radiantBloom", "toxic", "blightedRadiance");
  addFusion("eclipseBloom", "ice", "frozenEclipse");
  addFusion("voidChomper", "fire", "hellmaw");
  addFusion("voidChomper", "toxic", "plagueMaw");
  addFusion("mistVine", "toxic", "toxicFog");
  addFusion("gatorJaw", "chomper", "twinGator");
  addFusion("boulderRoot", "spike", "bedrockWall");
  addFusion("cometCannon", "cannon", "orbitalCannon");
  addFusion("starlightPea", "pea", "cosmicRepeater");
  addFusion("thornWhip", "vine", "razorVine");

  function fusionResult(a, b) {
    return rules.get(key(a, b));
  }

  function canSelectForFusion(id) {
    return Boolean(plantStats[id]) && state.equipped.includes(id);
  }

  const originalPlantAt = plantAt;
  plantAt = function plantOrFuseAt(row, col) {
    if (!state.running || state.lost || state.won || state.deleteMode) return originalPlantAt(row, col);
    const existingIndex = state.plants.findIndex((plant) => plant.row === row && plant.col === col);
    if (existingIndex === -1) return originalPlantAt(row, col);

    const base = state.plants[existingIndex];
    const selected = state.selected;
    const result = fusionResult(base.type, selected);
    if (!result || !canSelectForFusion(selected)) {
      setMessage("No fusion", `${plantStats[base.type].name} does not fuse with ${plantStats[selected]?.name || "that plant"}.`);
      return;
    }

    const selectedStats = plantStats[selected];
    if (state.sun < selectedStats.cost) {
      setMessage("Need more sun", `Fusing with ${selectedStats.name} costs ${selectedStats.cost} sun.`);
      return;
    }

    state.sun -= selectedStats.cost;
    const fusionStats = plantStats[result];
    Object.assign(base, {
      type: result,
      hp: fusionStats.hp,
      cooldown: fusionStats.sunRate || Math.min(fusionStats.fireRate || 900, 900),
      action: 900,
    });
    setMessage(`${fusionStats.name} fused`, fusionStats.role);
    render();
  };

  updatePlants = function updatePlantsWithFusions(dt) {
    for (const plant of state.plants) {
      const stats = plantStats[plant.type];
      plant.action = Math.max(0, plant.action - dt);
      const auraVictims = state.zombies.filter((zombie) => zombie.row === plant.row && Math.abs(zombie.x - plant.col) <= 1.15);
      if (stats.auraDamage) auraVictims.forEach((zombie) => damageZombie(zombie, stats.auraDamage * dt));
      if (stats.auraSlow) auraVictims.forEach((zombie) => { zombie.slow = Math.max(zombie.slow, stats.auraSlow); });
      if (stats.auraPoison) auraVictims.forEach((zombie) => { zombie.poison = Math.max(zombie.poison, stats.auraPoison); });

      if (stats.sunRate) {
        plant.cooldown -= dt;
        if (plant.cooldown <= 0) {
          state.sun += stats.sunAmount || 25;
          plant.action = 500;
          plant.cooldown = stats.sunRate;
        }
        continue;
      }
      if (!stats.fireRate) continue;
      plant.cooldown -= dt;
      if (stats.trap) {
        const victims = state.zombies.filter((zombie) => zombie.row === plant.row && Math.abs(zombie.x - plant.col) < 0.72);
        if (victims.length && plant.cooldown <= 0) {
          victims.forEach((zombie) => {
            damageZombie(zombie, stats.damage);
            if (stats.slowAura) zombie.slow = Math.max(zombie.slow, stats.slowAura);
            if (stats.poisonAura) zombie.poison = Math.max(zombie.poison, stats.poisonAura);
            if (stats.chain) state.zombies.filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.1).slice(0, stats.chain).forEach((other) => damageZombie(other, Math.round(stats.damage * 0.72)));
          });
          plant.action = 320;
          plant.cooldown = stats.fireRate;
        }
        continue;
      }
      const target = nearestZombieInLane(plant.row, plant.col);
      if (!target || plant.cooldown > 0) continue;
      if (stats.melee) {
        if (target.x - plant.col < (stats.biteRange || 1.32)) {
          damageZombie(target, stats.damage);
          if (stats.slowBite) target.slow = Math.max(target.slow, stats.slowBite);
          if (stats.bitePoison) target.poison = Math.max(target.poison, stats.bitePoison);
          if (stats.biteSun) state.sun += stats.biteSun;
          if (stats.biteSplash) state.zombies.filter((zombie) => zombie !== target && zombie.row === target.row && Math.abs(zombie.x - target.x) <= stats.biteSplash).forEach((zombie) => damageZombie(zombie, Math.round(stats.damage * 0.45)));
          if (stats.biteChain) state.zombies.filter((zombie) => zombie !== target && Math.abs(zombie.row - target.row) <= 1 && Math.abs(zombie.x - target.x) <= 1.4).slice(0, stats.biteChain).forEach((zombie) => { damageZombie(zombie, Math.round(stats.damage * 0.55)); zombie.slow = Math.max(zombie.slow, 500); });
          plant.action = 620;
          plant.cooldown = stats.fireRate;
        }
        continue;
      }
      (stats.multiRows || [0]).forEach((offset) => {
        const shotRow = plant.row + offset;
        if (shotRow < 0 || shotRow >= rows || !nearestZombieInLane(shotRow, plant.col)) return;
        for (let i = 0; i < (stats.repeat || 1); i += 1) {
          state.shots.push({
            id: state.nextId += 1,
            row: shotRow,
            x: plant.col + 0.62 - i * 0.12,
            type: stats.shot,
            damage: stats.damage,
            slow: stats.slow || 0,
            poison: stats.poison || 0,
            chain: stats.chain || 0,
            splash: stats.splash || 0,
            speed: shotSpeed(stats.shot),
          });
        }
      });
      plant.action = 330;
      plant.cooldown = stats.fireRate;
    }
  };

  function plantBlocksZombie(plant, zombie) {
    const stats = plantStats[plant.type];
    const coverRows = stats.coverRows || 1;
    const coverCols = stats.coverCols || 1;
    const rowBlocked = zombie.row >= plant.row && zombie.row < Math.min(rows, plant.row + coverRows);
    const centerX = plant.col + (coverCols - 1) / 2;
    const hitWidth = coverCols > 1 ? 0.98 : 0.42;
    return rowBlocked && Math.abs(zombie.x - centerX) < hitWidth;
  }

  updateZombies = function updateZombiesWithFusionWalls(dt) {
    const flagRows = new Set(state.zombies.filter((zombie) => zombie.aura).map((zombie) => zombie.row));
    for (const zombie of state.zombies) {
      zombie.slow = Math.max(0, zombie.slow - dt);
      if (zombie.poison > 0) {
        zombie.poison = Math.max(0, zombie.poison - dt);
        damageZombie(zombie, 0.008 * dt);
      }
      if (zombie.healer) {
        zombie.healTimer -= dt;
        if (zombie.healTimer <= 0) {
          state.zombies.filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.35).forEach((other) => {
            other.hp = Math.min(other.maxHp, other.hp + 16);
          });
          zombie.healTimer = 1200;
        }
      }
      const blocker = state.plants.find((plant) => plantBlocksZombie(plant, zombie));
      if (blocker && zombie.leaper && !zombie.leaped && zombie.x > blocker.col) {
        const blockerStats = plantStats[blocker.type];
        if (blockerStats.blocker || blockerStats.coverRows) {
          zombie.leaped = true;
        } else {
          zombie.x -= 0.95;
          zombie.leaped = true;
        }
        continue;
      }
      if (blocker) {
        zombie.eat -= dt;
        if (zombie.eat <= 0) {
          const blockerStats = plantStats[blocker.type];
          const wallBonus = blockerStats.blocker ? 0.75 : 1;
          blocker.hp -= (zombie.damage + (zombie.toxic ? 8 : 0)) * wallBonus;
          if (blockerStats.onHitSlow) zombie.slow = Math.max(zombie.slow, blockerStats.onHitSlow);
          if (blockerStats.onHitPoison) zombie.poison = Math.max(zombie.poison, blockerStats.onHitPoison);
          if (blockerStats.onHitDamage) damageZombie(zombie, blockerStats.onHitDamage);
          if (blockerStats.onHitChain) state.zombies.filter((other) => other !== zombie && Math.abs(other.row - zombie.row) <= 1 && Math.abs(other.x - zombie.x) <= 1.2).slice(0, 2).forEach((other) => damageZombie(other, 12));
          zombie.eat = zombie.toxic ? 360 : 480;
        }
      } else {
        zombie.x -= zombie.speed * (zombie.slow > 0 ? 0.42 : 1) * (flagRows.has(zombie.row) && !zombie.aura ? 1.18 : 1) * dt;
      }
      if (zombie.x < -0.35) loseGame();
    }
  };

  const originalRenderSeedBank = renderSeedBank;
  renderSeedBank = function renderSeedBankWithFusionHint() {
    originalRenderSeedBank();
    els.seedBank.querySelectorAll(".seed-card").forEach((card) => {
      if (!card.querySelector(".fusion-hint")) {
        card.insertAdjacentHTML("beforeend", '<span class="fusion-hint">FUSE</span>');
      }
    });
  };

  window.davidPvzFusions = { version: fusionVersion, rules: [...rules.entries()] };
  if (typeof render === "function") render();
})();
