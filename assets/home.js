const unoCard = document.querySelector("[data-theme-target='uno']");
const unoLink = unoCard?.querySelector(".app-link");

function setUnoSelected(selected) {
  document.body.classList.toggle("uno-selected", selected);
  unoCard?.classList.toggle("selected", selected);
  unoLink?.setAttribute("aria-disabled", selected ? "false" : "true");
}

if (unoCard) {
  setUnoSelected(false);

  unoCard.addEventListener("click", (event) => {
    if (!unoCard.classList.contains("selected")) {
      event.preventDefault();
      setUnoSelected(true);
    }
  });

  unoLink?.addEventListener("click", (event) => {
    if (!unoCard.classList.contains("selected")) {
      event.preventDefault();
      setUnoSelected(true);
    }
  });
}
