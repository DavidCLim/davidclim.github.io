export const TAU = Math.PI * 2;

// Team battle only: a team is shown by a coloured circle under the feet,
// never by recolouring the unit itself.
export const TEAMS = {
  red: { id: 'red', label: 'Red', ring: '#e5484d', ringDark: '#a82b30' },
  blue: { id: 'blue', label: 'Blue', ring: '#2f6bf0', ringDark: '#1f46a8' },
};

// A mid-range skirmisher: walks toward the enemy while firing short rifle
// bursts, no setup delay. Distances are CSS pixels, times are seconds.
export const SOLDIER = {
  hp: 100,
  radius: 9,
  speed: 42,
  sight: 340,
  range: 270,
  holdDist: 110,
  burst: 3,
  burstGap: 0.1,
  cooldownMin: 0.9,
  cooldownMax: 1.7,
  damage: 20,
  bulletSpeed: 640,
  bulletRange: 360,
  spread: 0.07,
};
