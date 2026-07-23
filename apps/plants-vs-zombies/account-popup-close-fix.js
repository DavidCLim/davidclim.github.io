(() => {
  const activeAccountKey = "david-pvz-active-account";

  function closeAccountPopupNow() {
    const panel = document.querySelector(".account-panel");
    if (panel) {
      panel.classList.remove("popup-open");
      panel.classList.remove("account-highlight");
    }
    document.body.classList.remove("account-required");
  }

  window.closeAccountPopup = closeAccountPopupNow;

  function hasActiveAccount() {
    return Boolean(sessionStorage.getItem(activeAccountKey)) || document.body.classList.contains("account-logged-in");
  }

  function closeIfSignedIn() {
    if (hasActiveAccount()) closeAccountPopupNow();
  }

  document.addEventListener("submit", () => setTimeout(closeIfSignedIn, 80), true);
  document.addEventListener("click", () => setTimeout(closeIfSignedIn, 80), true);

  const observer = new MutationObserver(closeIfSignedIn);
  observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });

  window.addEventListener("storage", closeIfSignedIn);
  setTimeout(closeIfSignedIn, 150);
  setTimeout(closeIfSignedIn, 500);
})();
