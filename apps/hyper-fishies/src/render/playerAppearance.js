// Single source of truth for the player's colors, shared by drawPlayer.js
// (top-down world) and drawDockScene.js (side-view angler) so the two
// views are guaranteed to read as the exact same character rather than
// two independently-drawn look-alikes. Modeled on a reference photo of a
// classic outdoorsman angler: tan hat, full brown beard, cream shirt under
// a tan work vest, a satchel strap, blue trousers, brown boots — a working
// fisherman, not a pirate.
export const PLAYER_APPEARANCE = {
  skin: '#e8b78a',
  beard: '#7a5230',
  beardDark: '#5c3d22',
  hat: '#c9a876',
  hatDark: '#a8875c',
  hatBand: '#6b4a30',
  shirt: '#ede3d3',
  vestLight: '#a3835a',
  vestDark: '#6b5138',
  strap: '#6b4a30',
  pants: '#4a5568',
  pantsDark: '#333d4d',
  bootDark: '#5c4030',
  bootCuff: '#3c2a1a',
};

// A small curated palette per customizable slot, rather than a full color
// picker — every combination is picked to still look coherent together
// (see ui/avatarCustomizer.js).
export const AVATAR_OPTIONS = {
  skin: ['#e8b78a', '#c98f5c', '#8a5f3c', '#f0c9a0', '#5c3d22'],
  hat: ['#c9a876', '#8a7048', '#5c6b4a', '#7a2e2e', '#3c5a6b'],
  vestLight: ['#a3835a', '#5c6b4a', '#7a2e2e', '#3c5a6b', '#8a7048'],
  beard: ['#7a5230', '#3c2a1a', '#c7cdd0', '#a35a2e', '#241a10'],
  pants: ['#4a5568', '#3c2a1a', '#5c6b4a', '#7a2e2e', '#2c3a48'],
};

function darken(hex, amt) {
  const c = hex.replace('#', '');
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  const f = (v) => Math.max(0, Math.round(v * (1 - amt))).toString(16).padStart(2, '0');
  return `#${f(r)}${f(g)}${f(b)}`;
}

// Turns a save's stored avatar picks (a few base colors) into the full
// shaded palette drawPlayer.js/drawDockScene.js expect — derived dark/band
// tones so a single swatch choice still produces a fully-shaded outfit.
// `avatar` may be null/undefined (old saves, or the pre-customization
// default), in which case the default look is used untouched.
export function resolveAppearance(avatar) {
  if (!avatar) return PLAYER_APPEARANCE;
  const skin = avatar.skin || PLAYER_APPEARANCE.skin;
  const hat = avatar.hat || PLAYER_APPEARANCE.hat;
  const vestLight = avatar.vestLight || PLAYER_APPEARANCE.vestLight;
  const beard = avatar.beard || PLAYER_APPEARANCE.beard;
  const pants = avatar.pants || PLAYER_APPEARANCE.pants;
  return {
    skin,
    beard,
    beardDark: darken(beard, 0.3),
    hat,
    hatDark: darken(hat, 0.25),
    hatBand: darken(hat, 0.45),
    shirt: PLAYER_APPEARANCE.shirt,
    vestLight,
    vestDark: darken(vestLight, 0.35),
    strap: darken(hat, 0.3),
    pants,
    pantsDark: darken(pants, 0.3),
    bootDark: PLAYER_APPEARANCE.bootDark,
    bootCuff: PLAYER_APPEARANCE.bootCuff,
  };
}
