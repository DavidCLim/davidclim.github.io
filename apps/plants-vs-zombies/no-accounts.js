(() => {
  const deviceSaveKey = "david-pvz-device-save-v1";

  function readDeviceSave() {
    try {
      const direct = JSON.parse(localStorage.getItem(deviceSaveKey) || "null");
      if (direct) return normalizeSave(direct);
    } catch {}
    try {
      const legacy = JSON.parse(localStorage.getItem(legacyStorageKey) || "null");
      if (legacy) return normalizeSave(legacy);
    } catch {}
    return normalizeSave(defaultSave);
  }

  function writeDeviceSave(save) {
    localStorage.setItem(deviceSaveKey, JSON.stringify(normalizeSave(save)));
  }

  function applyDeviceSave() {
    const save = readDeviceSave();
    sessionStorage.removeItem(activeAccountKey);
    document.body.classList.remove("account-required", "account-logged-in", "account-logged-out");
    Object.assign(state, {
      account: "Device Save",
      coins: save.coins,
      unlocked: save.unlocked,
      equipped: save.equipped,
      wave: save.wave,
      selected: save.equipped[0],
      dirty: false,
      saveNote: "Device save",
    });
    lastSeedHtml = "";
    lastShopHtml = "";
    setupRound(`Device save loaded: ${save.coins} Seed Coins, wave ${save.wave}, and ${save.unlocked.length} unlocked plants.`);
  }

  saveGame = function saveGameToDevice(note = "Saved") {
    writeDeviceSave({
      coins: state.coins,
      unlocked: state.unlocked,
      equipped: state.equipped,
      wave: state.wave,
    });
    state.account = "Device Save";
    state.dirty = false;
    state.saveNote = note;
    if (els.saveStatus) els.saveStatus.textContent = note;
    setMessage("Progress saved", "Your Seed Coins, unlocked plants, loadout, and wave were saved on this device.");
    render();
  };

  signInOrCreate = function signInDisabled(event) {
    if (event) event.preventDefault();
    applyDeviceSave();
  };

  logoutAccount = function logoutDisabled(event) {
    if (event) event.preventDefault();
    applyDeviceSave();
  };

  if (els.saveProgress) {
    els.saveProgress.onclick = (event) => {
      event.preventDefault();
      saveGame("Saved");
    };
  }

  applyDeviceSave();
})();
