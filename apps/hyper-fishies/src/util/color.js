// Lighten/darken a 6-digit hex color for gradient shading on procedural
// icons (render/drawBaitIcon.js, render/drawRuneIcon.js) — `amount` is
// -1..1, negative mixes toward black, positive mixes toward white.
export function shadeColor(hex, amount) {
  const num = parseInt(hex.slice(1), 16);
  const r = (num >> 16) & 0xff, g = (num >> 8) & 0xff, b = num & 0xff;
  const target = amount < 0 ? 0 : 255;
  const p = Math.min(1, Math.abs(amount));
  const mix = (c) => Math.round(c + (target - c) * p);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
}

// Blends two 6-digit hex colors by `t` (0 = hexA, 1 = hexB), returned as
// hex rather than shadeColor's rgb() string so the result can itself be fed
// back in as an endpoint of a second lerp (data/dayNight.js's sky palette
// chains a day<->night blend with a dawn/dusk wash on top).
export function lerpColor(hexA, hexB, t) {
  const a = parseInt(hexA.slice(1), 16), b = parseInt(hexB.slice(1), 16);
  const ar = (a >> 16) & 0xff, ag = (a >> 8) & 0xff, ab = a & 0xff;
  const br = (b >> 16) & 0xff, bg = (b >> 8) & 0xff, bb = b & 0xff;
  const clamped = Math.max(0, Math.min(1, t));
  const mix = (x, y) => Math.round(x + (y - x) * clamped);
  const toHex = (n) => n.toString(16).padStart(2, '0');
  return `#${toHex(mix(ar, br))}${toHex(mix(ag, bg))}${toHex(mix(ab, bb))}`;
}
