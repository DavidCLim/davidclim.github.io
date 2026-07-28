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
    Common: 34,
    Unusual: 30,
    Rare: 24,
    Epic: 17,
    Legendary: 12,
    Mythical: 8,
    Extinct: 5,
    Gargantuan: 4,
    Abyss: 3,
    Abyssal: 3,
    "???": 2
  });

  if (typeof say === "function") {
    say("Fish are easier to find now, but sell for less coins.");
  }
})();
