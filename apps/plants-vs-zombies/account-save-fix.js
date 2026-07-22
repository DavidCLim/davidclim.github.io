const accountSaveVersion = "account-save-v2";

function accountSaveGetAccounts() {
  try {
    return JSON.parse(localStorage.getItem(accountsKey) || "{}");
  } catch {
    return {};
  }
}

function accountSaveWriteAccounts(accounts) {
  localStorage.setItem(accountsKey, JSON.stringify(accounts));
}

function accountSaveNormalizeUsername(username) {
  return String(username || "").trim().replace(/\s+/g, "_").slice(0, 18);
}

function accountSaveSnapshot() {
  return normalizeSave({
    coins: state.coins,
    unlocked: state.unlocked,
    equipped: state.equipped,
    wave: state.wave,
  });
}

function accountSaveLoad(username) {
  const accounts = accountSaveGetAccounts();
  const account = accounts[username];
  if (!account) return null;
  return normalizeSave(account.save || defaultSave);
}

function accountSaveApply(username, save) {
  sessionStorage.setItem(activeAccountKey, username);
  Object.assign(state, {
    account: username,
    coins: save.coins,
    unlocked: save.unlocked,
    equipped: save.equipped,
    wave: save.wave,
    selected: save.equipped[0],
    dirty: false,
    saveNote: "Account loaded",
  });
  lastSeedHtml = "";
  lastShopHtml = "";
  setupRound(`Loaded ${username}'s saved account: ${save.coins} Seed Coins, wave ${save.wave}, and ${save.unlocked.length} unlocked plants.`);
}

saveGame = function saveGameToAccount(note = "Account saved") {
  const username = accountSaveNormalizeUsername(state.account || sessionStorage.getItem(activeAccountKey));
  if (!username) {
    state.saveNote = "Sign in first";
    if (els.saveStatus) els.saveStatus.textContent = state.saveNote;
    setMessage("Sign in first", "Create or sign into an account, then press Save to store plants, coins, and wave in that account.");
    render();
    return;
  }

  const accounts = accountSaveGetAccounts();
  if (!accounts[username]) {
    state.saveNote = "Account missing";
    if (els.saveStatus) els.saveStatus.textContent = state.saveNote;
    setMessage("Account missing", "Sign in again, then press Save.");
    render();
    return;
  }

  accounts[username].save = accountSaveSnapshot();
  accounts[username].savedAt = new Date().toISOString();
  accounts[username].version = accountSaveVersion;
  accountSaveWriteAccounts(accounts);
  Object.assign(state, { account: username, dirty: false, saveNote: note });
  if (els.saveStatus) els.saveStatus.textContent = note;
  setMessage("Account saved", `${username}'s Seed Coins, unlocked plants, equipped plants, and wave are saved to this account profile.`);
  render();
};

signInOrCreate = function signInOrCreateAccount(event) {
  event.preventDefault();
  const username = accountSaveNormalizeUsername(els.accountUsername.value);
  const password = els.accountPassword.value;
  if (!username || !password) {
    setMessage("Account needed", "Type a username and password first.");
    return;
  }

  const accounts = accountSaveGetAccounts();
  if (accounts[username]) {
    if (accounts[username].password !== password) {
      setMessage("Wrong password", "That username already exists. Try the right password.");
      return;
    }
  } else {
    accounts[username] = {
      password,
      save: normalizeSave(defaultSave),
      savedAt: new Date().toISOString(),
      version: accountSaveVersion,
    };
    accountSaveWriteAccounts(accounts);
  }

  const save = accountSaveLoad(username) || normalizeSave(defaultSave);
  if (els.accountPassword) els.accountPassword.value = "";
  accountSaveApply(username, save);
};

if (els.accountForm) {
  els.accountForm.addEventListener("submit", signInOrCreate, true);
}

if (els.saveProgress) {
  els.saveProgress.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    saveGame("Account saved");
  }, true);
}

const activeAccountForSave = sessionStorage.getItem(activeAccountKey);
if (activeAccountForSave) {
  const save = accountSaveLoad(activeAccountForSave);
  if (save) accountSaveApply(activeAccountForSave, save);
}
