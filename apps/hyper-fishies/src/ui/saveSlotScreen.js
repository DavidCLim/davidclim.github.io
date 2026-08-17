import { el, clearChildren } from '../util/dom.js';
import { drawPlayer } from '../render/drawPlayer.js';
import { drawTitleCard } from '../render/drawTitleCard.js';
import { regionById } from '../data/regions.js';

const TITLE_CARD_W = 640;
const TITLE_CARD_H = 190;

const PREVIEW_W = 170;
const PREVIEW_H = 190;
const PREVIEW_SCALE = 2.2;

function drawPreview(canvas, avatar) {
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
  ctx.save();
  ctx.translate(PREVIEW_W / 2, PREVIEW_H - 30);
  ctx.scale(PREVIEW_SCALE, PREVIEW_SCALE);
  drawPlayer(ctx, { x: 0, y: 0, facing: 'down', moving: false, animTime: 1.4, avatar }, 'wood');
  ctx.restore();
}

function formatWhen(ts) {
  if (!ts) return '';
  const diffMs = Date.now() - ts;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

// The very first screen the player sees: 5 save slots. Occupied slots show
// the saved avatar, gold, and current island; empty slots offer "New Game",
// which hands off to the avatar customizer before any save is created.
export function buildSaveSlotScreen(root, handlers) {
  const wrap = el('div', { class: 'boot-screen' });
  const titleCanvas = el('canvas', { width: TITLE_CARD_W, height: TITLE_CARD_H, class: 'boot-title-card' });
  const drawTitle = () => drawTitleCard(titleCanvas.getContext('2d'), TITLE_CARD_W, TITLE_CARD_H);
  drawTitle();
  // The title card's wordmark is set in 'Pirata One' (loaded via Google
  // Fonts in index.html's <head>) — on a cold load this canvas can draw
  // before that webfont finishes downloading, silently falling back to a
  // generic serif for a static image that (unlike every other canvas in
  // this game) never redraws on its own to self-correct. Redrawing once
  // document.fonts.ready resolves guarantees the real font lands the
  // moment it's available, with no flash on the common case where it's
  // already cached.
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(drawTitle).catch(() => {});
  }
  const box = el('div', { class: 'boot-box' }, [
    titleCanvas,
    el('div', { class: 'boot-subtitle' }, 'Choose a save to cast off with.'),
  ]);
  const grid = el('div', { class: 'slot-grid' });
  box.appendChild(grid);
  wrap.appendChild(box);
  root.appendChild(wrap);

  function render(slots) {
    clearChildren(grid);
    slots.forEach((slot, index) => {
      if (slot) {
        const canvas = el('canvas', { width: PREVIEW_W, height: PREVIEW_H, class: 'slot-preview' });
        drawPreview(canvas, slot.avatar);
        const region = regionById(slot.currentRegion);
        const card = el('div', { class: 'slot-card slot-card-filled' }, [
          el('div', { class: 'slot-label' }, `Save ${index + 1}`),
          canvas,
          el('div', { class: 'slot-name' }, slot.name),
          el('div', { class: 'slot-meta' }, `Lv.${slot.level} · ${slot.coins}g · ${region.name}`),
          el('div', { class: 'slot-meta slot-meta-dim' }, formatWhen(slot.updatedAt)),
          el('div', { class: 'slot-actions' }, [
            el('button', { class: 'btn btn-primary', text: 'Play', onClick: () => handlers.onPlay(index) }),
            el('button', {
              class: 'btn slot-delete',
              text: 'Delete',
              onClick: () => {
                if (confirmDelete(card)) handlers.onDelete(index);
              },
            }),
          ]),
        ]);
        grid.appendChild(card);
      } else {
        const card = el('div', { class: 'slot-card slot-card-empty' }, [
          el('div', { class: 'slot-label' }, `Save ${index + 1}`),
          el('div', { class: 'slot-empty-icon' }, '+'),
          el('button', { class: 'btn btn-primary', text: 'New Game', onClick: () => handlers.onNew(index) }),
        ]);
        grid.appendChild(card);
      }
    });
  }

  // Simple inline double-confirm instead of a browser confirm() dialog, to
  // stay in the game's own UI. First click arms it and re-labels the
  // button; a second click within a few seconds actually deletes.
  function confirmDelete(card) {
    if (card.dataset.armed === '1') return true;
    card.dataset.armed = '1';
    const btn = card.querySelector('.slot-delete');
    if (btn) {
      btn.textContent = 'Really delete?';
      setTimeout(() => { card.dataset.armed = '0'; if (btn.isConnected) btn.textContent = 'Delete'; }, 3000);
    }
    return false;
  }

  render(handlers.initialSlots);

  return {
    refresh: (slots) => render(slots),
    destroy: () => wrap.remove(),
  };
}
