const accountSaveVersion = "account-save-v4";

function accountSaveSetLoggedInVisuals(isLoggedIn) {
  document.body.classList.toggle("account-logged-in", Boolean(isLoggedIn));
  document.body.classList.toggle("account-logged-out", !isLoggedIn);
}

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
  return String(username || "").trim().replace(/\s+/g, "_").toLowerCase().slice(0, 18);
}

function accountSaveMigrateAccounts(accounts) {
  const migrated = {};
  let changed = false;
  Object.entries(accounts).forEach(([name, account]) => {
    const normalized = accountSaveNormalizeUsername(name);
    if (!normalized) {
      changed = true;
      return;
    }
    if (normalized !== name) changed = true;
    if (!migrated[normalized]) {
      migrated[normalized] = { ...account, displayName: account.displayName || name };
      return;
    }
    changed = true;
    const existingSave = normalizeSave(migrated[normalized].save || defaultSave);
    const incomingSave = normalizeSave(account.save || defaultSave);
    if ((incomingSave.wave > existingSave.wave) || (incomingSave.coins > existingSave.coins)) {
      migrated[normalized] = { ...account, displayName: migrated[normalized].displayName || account.displayName || name };
    }
  });
  if (changed) accountSaveWriteAccounts(migrated);
  return migrated;
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
  const accounts = accountSaveMigrateAccounts(accountSaveGetAccounts());
  const account = accounts[accountSaveNormalizeUsername(username)];
  if (!account) return null;
  return normalizeSave(account.save || defaultSave);
}

function accountSaveApply(username, save) {
  const normalized = accountSaveNormalizeUsername(username);
  sessionStorage.setItem(activeAccountKey, normalized);
  accountSaveSetLoggedInVisuals(true);
  Object.assign(state, {
    account: normalized,
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
  setupRound(`Loaded ${normalized}'s saved account: ${save.coins} Seed Coins, wave ${save.wave}, and ${save.unlocked.length} unlocked plants.`);
}

saveGame = function saveGameToAccount(note = "Account saved") {
  const username = accountSaveNormalizeUsername(state.account || sessionStorage.getItem(activeAccountKey));
  if (!username) {
    accountSaveSetLoggedInVisuals(false);
    state.saveNote = "Sign in first";
    if (els.saveStatus) els.saveStatus.textContent = state.saveNote;
    setMessage("Sign in first", "Create or sign into an account, then press Save to store plants, coins, and wave in that account.");
    render();
    return;
  }

  const accounts = accountSaveMigrateAccounts(accountSaveGetAccounts());
  if (!accounts[username]) {
    accountSaveSetLoggedInVisuals(false);
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
  accountSaveSetLoggedInVisuals(true);
  Object.assign(state, { account: username, dirty: false, saveNote: note });
  if (els.saveStatus) els.saveStatus.textContent = note;
  setMessage("Account saved", `${username}'s Seed Coins, unlocked plants, equipped plants, and wave are saved to this account profile.`);
  render();
};

signInOrCreate = function signInOrCreateAccount(event) {
  if (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
  const rawUsername = els.accountUsername.value;
  const username = accountSaveNormalizeUsername(rawUsername);
  const password = els.accountPassword.value;
  if (!username || !password) {
    accountSaveSetLoggedInVisuals(false);
    setMessage("Account needed", "Type a username and password first.");
    return;
  }

  const accounts = accountSaveMigrateAccounts(accountSaveGetAccounts());
  if (accounts[username]) {
    if (accounts[username].password !== password) {
      accountSaveSetLoggedInVisuals(false);
      setMessage("Username already taken", "That account name already exists. Use the correct password or choose a different name.");
      return;
    }
  } else {
    accounts[username] = {
      password,
      displayName: rawUsername.trim().slice(0, 18),
      save: normalizeSave(defaultSave),
      savedAt: new Date().toISOString(),
      version: accountSaveVersion,
    };
    accountSaveWriteAccounts(accounts);
  }

  const save = accountSaveLoad(username) || normalizeSave(defaultSave);
  if (els.accountPassword) els.accountPassword.value = "";
  if (els.accountUsername) els.accountUsername.value = username;
  accountSaveApply(username, save);
};

if (els.accountForm) {
  els.accountForm.addEventListener("submit", (event) => signInOrCreate(event), true);
}

if (els.logoutAccount) {
  els.logoutAccount.addEventListener("click", () => accountSaveSetLoggedInVisuals(false), true);
}

if (els.saveProgress) {
  els.saveProgress.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopImmediatePropagation();
    saveGame("Account saved");
  }, true);
}

accountSaveMigrateAccounts(accountSaveGetAccounts());
accountSaveSetLoggedInVisuals(false);
