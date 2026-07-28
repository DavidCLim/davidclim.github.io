// Makes catches feel more rewarding without changing the restored gameplay structure.
(function () {
  if (typeof fishTypes === "undefined" || typeof rarityWeights === "undefined") return;

  const boostedValues = {
    Sweetfish: 90,
    Clownfish: 120,
    Saltfish: 220,
    "Flying Fish": 280,
    Shrimp: 430,
    "Monster Fish": 650,
    Swordfish: 1050,
    "Sea Star": 1200,
    "Golden Shark": 2500
  };

  fishTypes.forEach(function (fish) {
    if (boostedValues[fish.name]) fish.value = boostedValues[fish.name];
  });

  Object.assign(rarityWeights, {
    Common: 34,
    Unusual: 30,
    Rare: 24,
    Epic: 17,
    Legendary: 12
  });

  if (typeof say === "function") {
    say("Fish are easier to find now, and every catch sells for a lot more.");
  }
})();
