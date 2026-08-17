import { el } from '../util/dom.js';
import { NPCS, STALLS } from '../world/worldObjects.js';
import { drawShopNpcAtStand } from '../render/drawShopNPCs.js';

// A static "you're standing at their stand" illustration reused across every
// shop panel (Rod Shop, Tackle, Trading Post, Witch's Runes, the Forge) —
// the exact same scene ui/dialogue.js already shows the moment you first
// talk to a shopkeeper, just shrunk into a banner strip at the top of the
// buy panel itself, so the panel reads as "this specific person's counter"
// on sight instead of a generic parchment list once you've clicked past the
// dialogue. Drawn once at build time (t=0, no idle sway/pop) rather than
// redrawn every frame — same "cheap one-shot render" choice
// ui/profilePanel.js already makes for its own portrait canvas, since a shop
// panel only rebuilds on refresh(), not every animation frame.
export const BANNER_W = 720;
export const BANNER_H = 190;

export function buildShopBanner(shopId) {
  const npc = NPCS.find(n => n.shopId === shopId);
  const stall = STALLS.find(s => s.id === shopId) || {};
  const canvas = el('canvas', { width: BANNER_W, height: BANNER_H, class: 'shop-banner-canvas' });
  if (npc) {
    drawShopNpcAtStand(canvas.getContext('2d'), BANNER_W, BANNER_H, npc.visual, stall, 0, 0);
  }
  return el('div', { class: 'shop-banner shop-grid-full' }, [canvas]);
}
