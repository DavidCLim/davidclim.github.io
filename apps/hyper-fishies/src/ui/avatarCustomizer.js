import { el, clearChildren } from '../util/dom.js';
import { drawPlayer } from '../render/drawPlayer.js';
import { AVATAR_OPTIONS, PLAYER_APPEARANCE } from '../render/playerAppearance.js';

const PREVIEW_W = 240;
const PREVIEW_H = 280;
const PREVIEW_SCALE = 3;

const FIELD_LABELS = {
  skin: 'Skin',
  hat: 'Hat',
  vestLight: 'Vest',
  beard: 'Beard',
  pants: 'Trousers',
};

// Shown once, right after picking an empty save slot: choose a handful of
// swatches and see the exact walking sprite update live. Whatever's picked
// here becomes that save's avatar for good (see core/save.js's createSlot).
export function buildAvatarCustomizer(root, handlers) {
  const avatar = {
    skin: PLAYER_APPEARANCE.skin,
    hat: PLAYER_APPEARANCE.hat,
    vestLight: PLAYER_APPEARANCE.vestLight,
    beard: PLAYER_APPEARANCE.beard,
    pants: PLAYER_APPEARANCE.pants,
  };

  const wrap = el('div', { class: 'boot-screen' });
  const canvas = el('canvas', { width: PREVIEW_W, height: PREVIEW_H, class: 'avatar-preview' });
  const swatchRows = el('div', { class: 'avatar-swatches' });
  const nameInput = el('input', {
    id: 'avatar-name-input',
    class: 'avatar-name-input',
    type: 'text',
    maxlength: '18',
    placeholder: 'Angler',
    'aria-label': 'Your name',
  });

  const confirmBtn = el('button', {
    class: 'btn btn-primary',
    text: 'Start Fishing',
    onClick: () => {
      const name = nameInput.value.trim().slice(0, 18) || 'Angler';
      handlers.onConfirm({ ...avatar }, name);
    },
  });

  const box = el('div', { class: 'boot-box avatar-box' }, [
    el('div', { class: 'boot-title' }, 'Make Your Fisherman'),
    el('div', { class: 'boot-subtitle' }, "This is who you'll be for this save."),
    el('div', { class: 'avatar-name-row' }, [
      el('label', { class: 'avatar-row-label', for: 'avatar-name-input' }, 'Name'),
      nameInput,
    ]),
    el('div', { class: 'avatar-layout' }, [
      el('div', { class: 'avatar-preview-frame' }, [canvas]),
      swatchRows,
    ]),
    el('div', { class: 'boot-actions' }, [
      el('button', { class: 'btn', text: 'Back', onClick: () => handlers.onBack() }),
      confirmBtn,
    ]),
  ]);
  wrap.appendChild(box);
  root.appendChild(wrap);

  nameInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') confirmBtn.click();
  });

  function redrawPreview(t) {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, PREVIEW_W, PREVIEW_H);
    ctx.save();
    ctx.translate(PREVIEW_W / 2, PREVIEW_H - 40);
    ctx.scale(PREVIEW_SCALE, PREVIEW_SCALE);
    drawPlayer(ctx, { x: 0, y: 0, facing: 'down', moving: false, animTime: t, avatar }, 'wood');
    ctx.restore();
  }

  function buildSwatchRow(field) {
    const options = AVATAR_OPTIONS[field];
    const row = el('div', { class: 'avatar-row' });
    const label = el('div', { class: 'avatar-row-label' }, FIELD_LABELS[field]);
    const swatches = el('div', { class: 'avatar-row-swatches' });
    row.appendChild(label);
    row.appendChild(swatches);

    function refreshSelected() {
      [...swatches.children].forEach((btn, i) => {
        btn.classList.toggle('avatar-swatch-selected', options[i] === avatar[field]);
      });
    }

    options.forEach((color) => {
      const btn = el('button', {
        class: 'avatar-swatch',
        style: `background:${color}`,
        'aria-label': `${FIELD_LABELS[field]} ${color}`,
        onClick: () => {
          avatar[field] = color;
          refreshSelected();
          redrawPreview(1.4);
        },
      });
      swatches.appendChild(btn);
    });
    refreshSelected();
    return row;
  }

  clearChildren(swatchRows);
  for (const field of Object.keys(AVATAR_OPTIONS)) {
    swatchRows.appendChild(buildSwatchRow(field));
  }

  let rafId = null;
  let start = performance.now();
  function tick(now) {
    redrawPreview((now - start) / 1000);
    rafId = requestAnimationFrame(tick);
  }
  rafId = requestAnimationFrame(tick);

  return {
    destroy: () => {
      if (rafId) cancelAnimationFrame(rafId);
      wrap.remove();
    },
  };
}
