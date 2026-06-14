const unoCard = document.querySelector("[data-theme-target='uno']");

function setUnoSelected(selected) {
  document.body.classList.toggle("uno-selected", selected);
  unoCard?.classList.toggle("selected", selected);
}

if (unoCard) {
  unoCard.addEventListener("mouseenter", () => setUnoSelected(true));
  unoCard.addEventListener("focusin", () => setUnoSelected(true));
  unoCard.addEventListener("click", () => setUnoSelected(true));
  unoCard.addEventListener("mouseleave", () => {
    if (!unoCard.contains(document.activeElement)) setUnoSelected(false);
  });
  unoCard.addEventListener("focusout", () => {
    window.setTimeout(() => {
      if (!unoCard.contains(document.activeElement)) setUnoSelected(false);
    }, 0);
  });
  document.addEventListener("pointerdown", (event) => {
    if (!unoCard.contains(event.target)) setUnoSelected(false);
  });
}
