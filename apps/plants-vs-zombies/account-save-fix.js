const accountSaveVersion = "account-save-v3";

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
  accountSaveSetLoggedInVisuals(true);
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
    accountSaveSetLoggedInVisuals(false);
    state.saveNote = "Sign in first";
    if (els.saveStatus) els.saveStatus.textContent = state.saveNote;
    setMessage("Sign in first", "Create or sign into an account, then press Save to store plants, coins, and wave in that account.");
    render();
    return;
  }

  const accounts = accountSaveGetAccounts();
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
  const username = accountSaveNormalizeUsername(els.accountUsername.value);
  const password = els.accountPassword.value;
  if (!username || !password) {
    accountSaveSetLoggedInVisuals(false);
    setMessage("Account needed", "Type a username and password first.");
    return;
  }

  const accounts = accountSaveGetAccounts();
  if (accounts[username]) {
    if (accounts[username].password !== password) {
      accountSaveSetLoggedInVisuals(false);
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

accountSaveSetLoggedInVisuals(false);
