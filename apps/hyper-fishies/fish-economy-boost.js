// Tunes fish value and catch rarity without changing the restored gameplay structure.
(function () {
  if (typeof fishTypes === "undefined" || typeof rarityWeights === "undefined") return;

  const tunedValues = {
    Sweetfish: 38,
    Clownfish: 48,
    Saltfish: 74,
    "Flying Fish": 92,
    Shrimp: 120,
    "Monster Fish": 170,
    Swordfish: 245,
    "Sea Star": 285,
    "Golden Shark": 620
  };

  fishTypes.forEach(function (fish) {
    if (tunedValues[fish.name]) fish.value = tunedValues[fish.name];
  });

  Object.assign(rarityWeights, {
    Common: 52,
    Unusual: 18,
    Rare: 16,
    Epic: 8,
    Legendary: 4,
    Mythical: 2.2,
    Extinct: 1.1,
    Gargantuan: 0.55,
    Abyss: 0.25,
    Abyssal: 0.25,
    "???": 0.08
  });

  if (typeof say === "function") {
    say("Rare fish are harder to find now. Better rods matter more.");
  }
})();
