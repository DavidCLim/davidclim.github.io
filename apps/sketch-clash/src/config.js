export const TAU = Math.PI * 2;
export const INK = '#23201c';

export const TEAMS = {
  red: { id: 'red', label: 'Red', fill: '#e0573f', dark: '#9d3322', splat: 'rgba(224, 87, 63, 0.5)' },
  blue: { id: 'blue', label: 'Blue', fill: '#4a86c8', dark: '#274f7e', splat: 'rgba(74, 134, 200, 0.5)' },
};
export const OTHER = { red: 'blue', blue: 'red' };

// A mid-range skirmisher: walks toward the enemy while firing short rifle
// bursts, no setup delay. Distances are CSS pixels, times are seconds.
export const SOLDIER = {
  hp: 100,
  radius: 7,
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
