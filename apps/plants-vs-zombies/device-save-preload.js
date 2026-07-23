(() => {
  const accountsKey = "david-pvz-accounts-v1";
  const activeAccountKey = "david-pvz-active-account";
  const deviceAccountName = "device_save";
  const deviceSaveKey = "david-pvz-device-save-v1";
  const legacyStorageKey = "david-pvz-save-v2";
  const starterPlants = ["pea", "ice", "fire", "spike", "sunflower"];
  const paidPlants = ["chomper", "volt", "angry", "vine", "toxic", "triple", "cannon"];

  function readJson(key) {
    try {
      return JSON.parse(localStorage.getItem(key) || "null");
    } catch {
      return null;
    }
  }

  function normalizeSave(data) {
    const save = data || {};
    const coins = Math.max(0, Math.floor(Number(save.coins) || 0));
    const allowed = new Set([...starterPlants, ...paidPlants]);
    const unlocked = [...new Set([...(save.unlocked || []), ...starterPlants])].filter((id) => allowed.has(id));
    let equipped = (save.equipped || starterPlants).filter((id) => unlocked.includes(id)).slice(0, 5);

    if (equipped.length !== 5) equipped = [...starterPlants];
    if (!equipped.includes("sunflower")) {
      equipped = equipped.filter((id) => id !== "sunflower").slice(0, 4);
      equipped.push("sunflower");
    }

    return {
      coins,
      unlocked,
      equipped,
      wave: Math.max(1, Number(save.wave) || 1),
    };
  }

  const accounts = readJson(accountsKey) || {};
  const existing = accounts[deviceAccountName]?.save;
  const direct = readJson(deviceSaveKey);
  const legacy = readJson(legacyStorageKey);
  const save = normalizeSave(existing || direct || legacy);

  accounts[deviceAccountName] = {
    password: "device-save",
    save,
  };

  localStorage.setItem(accountsKey, JSON.stringify(accounts));
  sessionStorage.setItem(activeAccountKey, deviceAccountName);
  document.documentElement.classList.add("no-accounts-mode");
})();
