const accountPanel = document.querySelector(".account-panel");
const accountForm = document.querySelector("#account-form");
const openAccountButton = document.querySelector("#open-account");
const accountUsernameInput = document.querySelector("#account-username");

function showAccountPanel() {
  if (!accountPanel) return;
  accountPanel.classList.add("account-highlight");
  accountPanel.scrollIntoView({ behavior: "smooth", block: "start" });
  setTimeout(() => accountUsernameInput?.focus(), 80);
  setTimeout(() => accountPanel.classList.remove("account-highlight"), 1400);
}

openAccountButton?.addEventListener("click", showAccountPanel);

if (!sessionStorage.getItem("david-pvz-active-account")) {
  setTimeout(showAccountPanel, 180);
}

accountForm?.addEventListener("submit", () => {
  setTimeout(() => {
    accountPanel?.classList.remove("account-highlight");
  }, 100);
});
