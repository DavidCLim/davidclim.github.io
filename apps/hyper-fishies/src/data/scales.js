// Scales: a fifth equipment slot — sold by B-LA-KA at the Trading Post,
// fitting his own "weighin' fish and countin' gold" trade. Focused on Sell
// Value + Luck: a trader's keen eye appraises a catch better and has a knack
// for spotting the rarer ones. Stacks into effectiveRodStats (core/
// gameState.js) the same flat-add way every other gear slot does.
export const SCALES = [
  { id: 'basicScale', name: 'Basic Scale', cost: 0, valueMul: 0.00, luck: 0.00 },
  { id: 'brassScale', name: 'Brass Scale', cost: 100, valueMul: 0.03, luck: 0.01 },
  { id: 'merchantScale', name: "Merchant's Scale", cost: 260, valueMul: 0.06, luck: 0.02 },
  { id: 'goldWeighScale', name: 'Gold-Weigh Scale', cost: 550, valueMul: 0.10, luck: 0.03 },
  { id: 'abyssalLedger', name: 'Abyssal Ledger', cost: 1000, valueMul: 0.16, luck: 0.05 },

  // B-LA-KA's own scale, handed over once his secret quest pays off (see
  // data/shopDialogues.js's B-LA-KA quest branch, fishing/fishingMachine.js's
  // resolveChestCatch) — never sold, same "not on the counter" shape as
  // Richy's Special or Finn's Old Faithful. `questOnly` keeps it out of the
  // Trading Post's buyable list (ui/marketPanel.js) the same way bait.js's
  // flag does for its own quest rewards.
  { id: 'blakaGoldenScale', name: "B-LA-KA's Golden Scale", cost: 1800, valueMul: 0.24, luck: 0.08, questOnly: true },
];

export function scaleById(id) {
  return SCALES.find(s => s.id === id) || SCALES[0];
}
