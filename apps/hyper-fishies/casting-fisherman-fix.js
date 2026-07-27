// Safe final patch: remove dead bottom-right shortcuts without repainting the whole game screen.
(function () {
  if (typeof drawUiButton !== "function") return;

  const oldDrawUiButton = drawUiButton;
  drawUiButton = function drawUiButtonWithoutDeadShopShortcuts(x, y, w, h, label, action) {
    const text = String(label || "").toUpperCase();
    const mode = state && state.mode ? state.mode : "";
    const isBottomRightShortcut = (mode === "dock" || mode === "fishing") && x >= 650 && y >= 455;
    if (isBottomRightShortcut && (text.includes("SELL") || text.includes("ROD"))) return;
    oldDrawUiButton(x, y, w, h, label, action);
  };

  if (typeof say === "function") {
    say("Dead bottom-right shop buttons removed.");
  }
})();
