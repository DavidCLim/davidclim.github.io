const accountSaveVersion = "account-save-v6";

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

function accountSaveCleanAccount(key, account) {
  if (!account) return null;
  const username = accountSaveNormalizeUsername(account.username || account.displayName || key.split(":")[1] || key);
  const displayName = accountSaveDisplayName(account.displayName || account.username || username);
  return {
    ...account,
    username,
    displayName,
    save: normalizeSave(account.save || defaultSave),
    version: account.version || accountSaveVersion,
  };
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
      const cleaned = accountSaveCleanAccount(key, account);
      if (cleaned) migrated[key] = cleaned;
      return;
    }

    const username = accountSaveNormalizeUsername(account.username || account.displayName || key);
    const password = String(account.password || "");
    if (!username || !password) {
      changed = true;
      return;
    }

    const profileKey = accountSaveProfileKey(username, password);
    migrated[profileKey] = accountSaveCleanAccount(profileKey, account);
    changed = true;
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

function accountSaveRefreshAfterLogin(profileKey, account) {
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
  if (els.accountPassword) els.accountPassword.value = "";
  if (els.accountUsername) els.accountUsername.value = displayName;
  if (els.accountLabel) els.accountLabel.textContent = `Signed in as ${displayName}`;
  setupRound(`Loaded ${displayName}'s saved account: ${save.coins} Seed Coins, wave ${save.wave}, and ${save.unlocked.length} unlocked plants.`);
  if (window.closeAccountPopup) window.closeAccountPopup();
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

let accountSaveBusy = false;
signInOrCreate = function signInOrCreateAccount(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  }
  if (accountSaveBusy) return;
  accountSaveBusy = true;

  try {
    const rawUsername = els.accountUsername ? els.accountUsername.value : "";
    const username = accountSaveNormalizeUsername(rawUsername);
    const displayName = accountSaveDisplayName(rawUsername);
    const password = els.accountPassword ? els.accountPassword.value : "";

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

    accountSaveRefreshAfterLogin(profileKey, accounts[profileKey]);
  } finally {
    setTimeout(() => { accountSaveBusy = false; }, 250);
  }
};

function accountSaveHandleSubmit(event) {
  signInOrCreate(event);
}

if (els.accountForm) {
  els.accountForm.addEventListener("submit", accountSaveHandleSubmit, true);
}

const accountSubmitButton = document.querySelector("#account-submit");
if (accountSubmitButton) {
  accountSubmitButton.addEventListener("click", (event) => {
    if (els.accountForm && typeof els.accountForm.requestSubmit === "function") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
      els.accountForm.requestSubmit();
    }
  }, true);
}

if (els.logoutAccount) {
  els.logoutAccount.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    sessionStorage.removeItem(activeAccountKey);
    accountSaveSetLoggedInVisuals(false);
    logoutAccount();
  }, true);
}

if (els.saveProgress) {
  els.saveProgress.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    saveGame("Account saved");
  }, true);
}

accountSaveMigrateAccounts(accountSaveGetAccounts());
accountSaveSetLoggedInVisuals(false);
