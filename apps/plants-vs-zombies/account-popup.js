const accountPanel = document.querySelector(".account-panel");
const accountForm = document.querySelector("#account-form");
const openAccountButton = document.querySelector("#open-account");
const startRoundButton = document.querySelector("#start-round");
const saveButton = document.querySelector("#save-progress");
const accountUsernameInput = document.querySelector("#account-username");
const activeAccountName = sessionStorage.getItem("david-pvz-active-account") || "";

const accountBackdrop = document.createElement("div");
accountBackdrop.className = "account-gate-backdrop";
document.body.append(accountBackdrop);

function accountIsSignedIn() {
  return Boolean(sessionStorage.getItem("david-pvz-active-account"));
}

function openAccountPopup() {
  if (!accountPanel) return;
  accountPanel.classList.add("popup-open");
  document.body.classList.add("account-required");
  setTimeout(() => accountUsernameInput?.focus(), 30);
}

function closeAccountPopup() {
  if (!accountPanel) return;
  accountPanel.classList.remove("popup-open");
  document.body.classList.remove("account-required");
}

if (!activeAccountName) {
  openAccountPopup();
} else {
  closeAccountPopup();
}

openAccountButton?.addEventListener("click", openAccountPopup);

accountForm?.addEventListener("submit", () => {
  setTimeout(() => {
    if (accountIsSignedIn()) closeAccountPopup();
  }, 80);
});

startRoundButton?.addEventListener("click", (event) => {
  if (accountIsSignedIn()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openAccountPopup();
}, true);

saveButton?.addEventListener("click", (event) => {
  if (accountIsSignedIn()) return;
  event.preventDefault();
  event.stopImmediatePropagation();
  openAccountPopup();
}, true);
