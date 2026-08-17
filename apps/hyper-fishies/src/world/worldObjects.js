// Static world layout: walkable ground, stalls, and ambient props. All
// positions/footprints are plain top-down AABBs — the 2.5D look is purely a
// render-time trick (see render/drawProps.js). The whole boardwalk is one
// open, unbroken walkable area; the only special ground is the dock jetty
// that juts out over the water — the single fishing spot (data/spots.js).
//
// `id`/`kind` are stable routing keys used by ui/overlays.js — only
// `label`/`promptText`/colors are cosmetic and safe to reskin freely.
import { WORLD_W, WORLD_H } from '../core/constants.js';

// Regions the player CAN walk on (checked as "must be inside at least one").
export const WALKABLE_RECTS = [
  { x: 0, y: 210, w: WORLD_W, h: WORLD_H - 210 }, // main boardwalk
  { x: 700, y: 130, w: 120, h: 90 },              // fishing jetty over the water
];

// Regions the player CANNOT walk on (checked as "must be outside all").
export const BLOCKED_RECTS = [];

// Stalls are now purely visual backdrops for their NPC (below) — talking to
// the NPC is what opens the shop, so these no longer carry their own
// interact zone.
//
// Five stalls, evenly spread across the boardwalk: each is 90 wide, and
// centers land 175 apart (85, 260, 435, 610, 785 -> centers 130, 305, 480,
// 655, 830), leaving matching 85px margins at both edges and identical
// gaps between every pair — no stall crowds its neighbor and none of them
// hug the water's edge.
export const STALLS = [
  {
    // The Forge, leftmost — a working smithy, ember-orange against
    // Grizelda's cool witchy purple/green next door, for the Blacksmith
    // who lashes salvaged rod parts into the Scrap Rod (see
    // data/rodParts.js, economy.js's craftScrapRod).
    id: 'blacksmith', kind: 'blacksmith', label: 'The Forge',
    x: 85, y: 500, w: 90, h: 64,
    roofColor: '#3c2420', wallColor: '#1c1410', accent: '#ff8a4a',
  },
  {
    id: 'runeShop', kind: 'runeShop', label: "Witch's Runes",
    x: 260, y: 500, w: 90, h: 64,
    roofColor: '#2a1a3c', wallColor: '#160f20', accent: '#8fe97a',
  },
  {
    id: 'rodShop', kind: 'rodShop', label: 'Rigging & Rods',
    x: 435, y: 500, w: 90, h: 64,
    roofColor: '#5a2e2e', wallColor: '#3c2a1a', accent: '#ffb454',
  },
  {
    id: 'tackle', kind: 'tackle', label: 'Bait & Barnacles',
    x: 610, y: 500, w: 90, h: 64,
    roofColor: '#3c5a3c', wallColor: '#2c2015', accent: '#ffd08a',
  },
  {
    // accent was '#7a2e2e' (dark maroon) — a dark sign on a dark wood wall
    // reads as faded/washed-out next to Rod Shop and Tackle's bright gold
    // signs, which is what was actually being seen as "translucent". Every
    // other stall uses a bright, high-contrast accent for its sign; this
    // one needs to as well.
    id: 'market', kind: 'market', label: 'Trading Post',
    x: 785, y: 500, w: 90, h: 64,
    roofColor: '#6b4a1c', wallColor: '#3c2a1a', accent: '#f0b23c',
  },
];
// Note: the Captain's Log (almanac) is no longer a physical stall — it
// opens from the book button in the HUD (see ui/almanacButton.js).

// NPCs: fixed characters the player can talk to (see ui/dialogue.js).
// `shopId` links a shopkeeper to the overlay their dialogue opens; `visual`
// picks which draw function renders them (render/drawNPC.js for Morris,
// render/drawShopNPCs.js for the shopkeepers).
export const NPCS = [
  {
    id: 'morris', label: 'Morris', visual: 'morris',
    x: 205, y: 265, interactRadius: 80,
    promptText: 'Click to talk to Morris',
  },
  {
    // Stands just north of the counter, in the open walkway — standing
    // south (behind the counter) put the interact circle inside the
    // stall's own inflated collision box, unreachable from the normal
    // approach direction. Never do that again.
    //
    // All five shopkeepers now sit on the same evenly-spaced 175px grid as
    // their stalls (see STALLS above) with a matching interactRadius of 85
    // apiece — centers 175 apart with radii summing to 170 leaves a clean
    // 5px gap between every pair, so no two interact zones overlap.
    id: 'finn', label: 'Finn', visual: 'angler', shopId: 'rodShop',
    x: 480, y: 478, interactRadius: 85,
    promptText: 'Click to talk to Finn',
  },
  {
    id: 'wiggins', label: 'Richy', visual: 'richy', shopId: 'tackle',
    x: 655, y: 478, interactRadius: 85,
    promptText: 'Click to talk to Richy',
  },
  {
    id: 'barnaby', label: 'B-LA-KA', visual: 'pirate', shopId: 'market',
    x: 830, y: 478, interactRadius: 85,
    promptText: 'Click to talk to B-LA-KA',
  },
  {
    id: 'grizelda', label: 'Grizelda', visual: 'witch', shopId: 'runeShop',
    x: 305, y: 478, interactRadius: 85,
    promptText: 'Click to talk to Grizelda',
  },
  {
    id: 'garrick', label: 'Garrick', visual: 'blacksmith', shopId: 'blacksmith',
    x: 130, y: 478, interactRadius: 85,
    promptText: 'Click to talk to Garrick',
  },
  {
    // Luca isn't a shopkeeper — no stall, no counter to hide behind. He's
    // a standalone figure out in the open (see render/renderer.js's
    // `standalone` check), and `region` gates both his rendering and his
    // interact zone (world/zones.js) so he only ever turns up in the one
    // place his own dialogue says he does: the Abyssal Lands. Parked on
    // the boardwalk's left side, clear of every stall's footprint —
    // deliberately kept well outside Morris's own 80px interact radius
    // (205,265) since findNearZone (world/zones.js) returns whichever NPC
    // it checks first when two overlap, and Morris is checked first.
    id: 'luca', label: 'Luca', visual: 'luca', standalone: true, region: 'abyssalLands',
    x: 55, y: 320, interactRadius: 70,
    promptText: 'Click to talk to Luca',
  },
  {
    // Naia, the Abyss Warden — mirrors Luca's placement on the opposite
    // side of the boardwalk (same y band, same region gate, same standalone
    // shape) so the Abyssal Lands reads as having two figures who actually
    // belong there, not one. Nudged to y:300 rather than Luca's exact 320
    // to clear the chest prop at (905,370).
    id: 'naia', label: 'Naia', visual: 'naia', standalone: true, region: 'abyssalLands',
    x: 905, y: 300, interactRadius: 70,
    promptText: 'Click to talk to Naia',
  },
];

// Purely decorative props (lantern posts, chests, barrels, and the flag
// post collide; rope coils and the anchor are ground clutter and don't).
// Kept off the main walking lane between the water and the stalls — pushed
// out to the corners and the water's edge instead, so the open path stays
// clear and the decoration reads as "the edges of the dock," not clutter
// underfoot.
export const PROPS = [
  { type: 'lanternPost', x: 120, y: 250, collide: true, r: 10 },
  { type: 'lanternPost', x: 460, y: 230, collide: true, r: 10 },
  { type: 'lanternPost', x: 660, y: 250, collide: true, r: 10 },
  { type: 'lanternPost', x: 900, y: 300, collide: true, r: 10 },
  { type: 'lanternPost', x: 40, y: 470, collide: true, r: 10 },
  { type: 'lanternPost', x: 300, y: 580, collide: true, r: 10 },
  { type: 'lanternPost', x: 620, y: 580, collide: true, r: 10 },
  { type: 'lanternPost', x: 820, y: 560, collide: true, r: 10 },

  { type: 'chest', x: 55, y: 370, collide: true, w: 22, h: 18 },
  { type: 'chest', x: 905, y: 370, collide: true, w: 22, h: 18 },
  { type: 'barrel', x: 905, y: 555, collide: true, w: 18, h: 18 },
  { type: 'barrel', x: 830, y: 240, collide: true, w: 18, h: 18 },

  { type: 'netCoil', x: 190, y: 560, collide: false, w: 26, h: 20 },
  { type: 'netCoil', x: 940, y: 560, collide: false, w: 26, h: 20 },
  { type: 'netCoil', x: 500, y: 220, collide: false, w: 26, h: 20 },
  { type: 'anchor', x: 640, y: 585, collide: false, w: 20, h: 26 },
  { type: 'anchor', x: 940, y: 220, collide: false, w: 20, h: 26 },
  { type: 'flag', x: 480, y: 350, collide: true, r: 6 },
  { type: 'sign', x: 855, y: 585, collide: true, w: 16, h: 14 },

  // A little forge glow at Garrick's elbow — see render/drawProps.js's
  // drawForgeEmbers. Purely visual, tucked at the stall's own edge so it
  // never sits in the walking lane.
  { type: 'forgeEmbers', x: 160, y: 492, collide: false, w: 12, h: 12 },
];

export function aabbOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function pointInRect(px, py, r) {
  return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}
