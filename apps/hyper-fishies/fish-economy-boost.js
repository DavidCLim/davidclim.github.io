// Makes catches feel more rewarding without changing the restored gameplay structure.
(function () {
  if (typeof fishTypes === "undefined" || typeof rarityWeights === "undefined") return;

  const boostedValues = {
    Sweetfish: 45,
    Clownfish: 60,
    Saltfish: 105,
    "Flying Fish": 135,
    Shrimp: 200,
    "Monster Fish": 300,
    Swordfish: 480,
    "Sea Star": 550,
    "Golden Shark": 1000
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
    say("Fish are easier to find now, and every catch sells for more.");
  }
})();
