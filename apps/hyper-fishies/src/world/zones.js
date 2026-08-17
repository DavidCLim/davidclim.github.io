import { SPOTS } from '../data/spots.js';
import { NPCS } from './worldObjects.js';

// Finds whichever interactive zone (fishing spot or NPC) the player is
// currently close enough to, for prompts + the action-button behavior.
// Fishing spots take priority, then NPCs. Stalls are purely visual now —
// their NPC is the interactive zone (see main.js). `currentRegion` filters
// out anything pinned to a specific region (Luca) so they can't be reached
// from somewhere they aren't actually standing.
export function findNearZone(playerX, playerY, currentRegion) {
  for (const spot of SPOTS) {
    const d = Math.hypot(playerX - spot.x, playerY - spot.y);
    if (d <= spot.radius) {
      return { kind: 'spot', id: spot.id, promptText: `Click to fish here (${spot.label})`, data: spot };
    }
  }
  for (const npc of NPCS) {
    if (npc.region && npc.region !== currentRegion) continue;
    const d = Math.hypot(playerX - npc.x, playerY - npc.y);
    if (d <= npc.interactRadius) {
      return { kind: 'npc', id: npc.id, promptText: npc.promptText, data: npc };
    }
  }
  return null;
}
