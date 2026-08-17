// Per-region deck/ground base colors. Previously every region shared the
// exact same dark-brown plank gradient and only got a faint 14-55% tint
// wash on top (data/regions.js's deckTint) — nowhere near strong enough to
// read as a different island at a glance, which is why every destination
// ended up looking like the same dock with a slightly different mood
// lighting. This is the actual plank material per region instead.
const PALETTE = {
  dock: { top: '#5a3f2c', bottom: '#3c2a1c' },
  tropicalIsland: { top: '#9c7a42', bottom: '#6b4f26' }, // sun-bleached golden planking
  seasideBay: { top: '#7c7568', bottom: '#4f4a40' },     // pale salt-scoured driftwood
  darkWaters: { top: '#33402f', bottom: '#171f16' },     // damp, moss-blackened wood
  mountainIsle: { top: '#5c636d', bottom: '#33383f' },   // frost-grey timber
  abyssalLands: { top: '#20222c', bottom: '#0a0b10' },   // near-black, faintly cold
  frozenReach: { top: '#7a8f9c', bottom: '#455560' },    // ice-rimed blue-grey timber
};

export function groundBase(regionId) {
  return PALETTE[regionId] || PALETTE.dock;
}
