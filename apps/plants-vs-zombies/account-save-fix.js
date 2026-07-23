const accountSaveVersion = "account-save-v5";

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

function accountSaveDisplayName(username) {
  return String(username || "").trim().replace(/\s+/g, " ").slice(0, 18) || "Player";
}

function accountSavePasswordPart(password) {
  return encodeURIComponent(String(password || ""));
}

function accountSaveProfileKey(username, password) {
  return `profile:${accountSaveNormalizeUsername(username)}:${accountSavePasswordPart(password)}`;
}

function accountSaveIsProfileKey(key) {
  return String(key || "").startsWith("profile:");
}

function accountSaveMigrateAccounts(accounts) {
  const migrated = {};
  let changed = false;

  Object.entries(accounts || {}).forEach(([key, account]) => {
    if (!account) {
      changed = true;
      return;
    }

    if (accountSaveIsProfileKey(key)) {
      migrated[key] = {
        ...account,
        username: accountSaveNormalizeUsername(account.username || account.displayName || key.split(":")[1]),
        displayName: accountSaveDisplayName(account.displayName || account.username || key.split(":")[1]),
        save: normalizeSave(account.save || defaultSave),
        version: account.version || accountSaveVersion,
      };
      return;
    }

    const username = accountSaveNormalizeUsername(account.username || account.displayName || key);
    const password = String(account.password || "");
    if (!username || !password) {
      changed = true;
      return;
    }

    const profileKey = accountSaveProfileKey(username, password);
    if (profileKey !== key) changed = true;
    migrated[profileKey] = {
      ...account,
      username,
      displayName: accountSaveDisplayName(account.displayName || key),
      save: normalizeSave(account.save || defaultSave),
      version: account.version || accountSaveVersion,
    };
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

function accountSaveGetActiveKey() {
  return sessionStorage.getItem(activeAccountKey) || "";
}

function accountSaveGetActiveAccount(accounts = accountSaveMigrateAccounts(accountSaveGetAccounts())) {
  const key = accountSaveGetActiveKey();
  return key && accounts[key] ? { key, account: accounts[key] } : null;
}

function accountSaveApply(profileKey, account) {
  const save = normalizeSave(account.save || defaultSave);
  const displayName = accountSaveDisplayName(account.displayName || account.username);
  sessionStorage.setItem(activeAccountKey, profileKey);
  accountSaveSetLoggedInVisuals(true);
  Object.assign(state, {
    account: displayName,
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
  setupRound(`Loaded ${displayName}'s saved account: ${save.coins} Seed Coins, wave ${save.wave}, and ${save.unlocked.length} unlocked plants.`);
  if (els.accountLabel) els.accountLabel.textContent = `Signed in as ${displayName}`;
}

saveGame = function saveGameToAccount(note = "Account saved") {
  const accounts = accountSaveMigrateAccounts(accountSaveGetAccounts());
  const active = accountSaveGetActiveAccount(accounts);
  if (!active) {
    accountSaveSetLoggedInVisuals(false);
    state.saveNote = "Sign in first";
    if (els.saveStatus) els.saveStatus.textContent = state.saveNote;
    setMessage("Sign in first", "Create or sign into an account, then press Save to store plants, coins, and wave in that account.");
    render();
    return;
  }

  active.account.save = accountSaveSnapshot();
  active.account.savedAt = new Date().toISOString();
  active.account.version = accountSaveVersion;
  accounts[active.key] = active.account;
  accountSaveWriteAccounts(accounts);
  accountSaveSetLoggedInVisuals(true);
  Object.assign(state, { account: accountSaveDisplayName(active.account.displayName || active.account.username), dirty: false, saveNote: note });
  if (els.saveStatus) els.saveStatus.textContent = note;
  setMessage("Account saved", `${state.account}'s Seed Coins, unlocked plants, equipped plants, and wave are saved to this password profile.`);
  render();
};

signInOrCreate = function signInOrCreateAccount(event) {
  if (event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  const rawUsername = els.accountUsername.value;
  const username = accountSaveNormalizeUsername(rawUsername);
  const displayName = accountSaveDisplayName(rawUsername);
  const password = els.accountPassword.value;

  if (!username || !password) {
    accountSaveSetLoggedInVisuals(false);
    setMessage("Account needed", "Type a username and password first.");
    return;
  }

  const accounts = accountSaveMigrateAccounts(accountSaveGetAccounts());
  const profileKey = accountSaveProfileKey(username, password);

  if (!accounts[profileKey]) {
    accounts[profileKey] = {
      username,
      displayName,
      password,
      save: normalizeSave(defaultSave),
      savedAt: new Date().toISOString(),
      version: accountSaveVersion,
    };
    accountSaveWriteAccounts(accounts);
  }

  if (els.accountPassword) els.accountPassword.value = "";
  if (els.accountUsername) els.accountUsername.value = displayName;
  accountSaveApply(profileKey, accounts[profileKey]);
};

if (els.accountForm) {
  els.accountForm.addEventListener("submit", (event) => signInOrCreate(event), true);
}

if (els.logoutAccount) {
  els.logoutAccount.addEventListener("click", () => {
    sessionStorage.removeItem(activeAccountKey);
    accountSaveSetLoggedInVisuals(false);
  }, true);
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
