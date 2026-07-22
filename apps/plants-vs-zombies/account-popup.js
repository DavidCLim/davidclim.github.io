const accountPanel = document.querySelector(".account-panel");
const accountForm = document.querySelector("#account-form");
const openAccountButton = document.querySelector("#open-account");
const accountUsernameInput = document.querySelector("#account-username");

const accountBackdrop = document.createElement("div");
accountBackdrop.className = "account-gate-backdrop";
document.body.append(accountBackdrop);

function openAccountPopup() {
  if (!accountPanel) return;
  accountPanel.classList.add("popup-open");
  accountPanel.classList.add("account-highlight");
  document.body.classList.add("account-required");
  setTimeout(() => accountUsernameInput?.focus(), 80);
  setTimeout(() => accountPanel.classList.remove("account-highlight"), 1400);
}

function closeAccountPopup() {
  if (!accountPanel) return;
  accountPanel.classList.remove("popup-open");
  accountPanel.classList.remove("account-highlight");
  document.body.classList.remove("account-required");
}

openAccountButton?.addEventListener("click", openAccountPopup);

if (!sessionStorage.getItem("david-pvz-active-account")) {
  setTimeout(openAccountPopup, 180);
}

accountForm?.addEventListener("submit", () => {
  setTimeout(() => {
    if (sessionStorage.getItem("david-pvz-active-account")) {
      closeAccountPopup();
    }
  }, 120);
});
