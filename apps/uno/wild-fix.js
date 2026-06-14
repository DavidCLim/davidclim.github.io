function wildIcon(label = "") {
  const text = label ? `<text x="33" y="47" text-anchor="middle" class="wild-icon-label">${label}</text>` : "";
  return `<svg class="card-icon wild-icon" viewBox="0 0 66 86" aria-hidden="true"><defs><clipPath id="wild-oval"><ellipse cx="33" cy="43" rx="33" ry="43"/></clipPath></defs><g clip-path="url(#wild-oval)"><rect x="0" y="0" width="33" height="43" fill="#e21b2d"/><rect x="33" y="0" width="33" height="43" fill="#ffd21f"/><rect x="0" y="43" width="33" height="43" fill="#0066cc"/><rect x="33" y="43" width="33" height="43" fill="#00a650"/></g><ellipse cx="33" cy="43" rx="31.5" ry="41.5" fill="none" stroke="#111111" stroke-width="3"/>${text}</svg>`;
}

if (typeof render === "function") render();
