import { el, clearChildren } from '../util/dom.js';

// Shared open/close state + a reusable panel frame (title bar + close
// button) so each shop/almanac panel only has to build its own content.
export function openOverlay(state, kind) {
  state.ui.activeOverlay = kind;
}

export function closeOverlay(state) {
  state.ui.activeOverlay = null;
}

export function buildOverlayRoot(root) {
  const backdrop = el('div', { class: 'overlay-backdrop hidden' });
  root.appendChild(backdrop);
  return backdrop;
}

// `opts.theme` (optional) = { bg1, bg2, accent, row } — sets CSS custom
// properties so a shop's panel can be skinned to match its stall instead of
// every panel sharing the same generic parchment look (see `.panel-themed`
// in styles.css). `opts.landscape` swaps the body from a single stacked
// column to a wide multi-column grid.
export function buildPanelFrame(title, onClose, opts = {}) {
  const bodyClass = 'panel-body' +
    (opts.landscape ? ' panel-body-landscape' : '') +
    (opts.book ? ' panel-body-book' : '');
  const body = el('div', { class: bodyClass });
  const closeBtn = el('button', { class: 'panel-close', text: '✕', onClick: onClose });
  const frameClass = 'panel hidden' +
    (opts.landscape ? ' panel-landscape' : '') +
    (opts.book ? ' panel-book' : '') +
    (opts.theme ? ' panel-themed' : '');
  const frame = el('div', { class: frameClass }, [
    el('div', { class: 'panel-header' }, [el('h2', {}, title), closeBtn]),
    body,
  ]);
  if (opts.theme) {
    frame.style.setProperty('--shop-bg1', opts.theme.bg1);
    frame.style.setProperty('--shop-bg2', opts.theme.bg2);
    frame.style.setProperty('--shop-accent', opts.theme.accent);
    frame.style.setProperty('--shop-row', opts.theme.row);
    // Set directly as an inline style too — inline styles always win over
    // any class-based rule regardless of selector order, so the panel's
    // own background can never end up losing a cascade fight and falling
    // back to something translucent.
    frame.style.background = `linear-gradient(165deg, ${opts.theme.bg1}, ${opts.theme.bg2})`;
    // The `background` shorthand above resets background-color to its
    // initial value (transparent) as a side effect of only specifying an
    // image — so if the gradient itself ever fails to paint (Windows
    // "forced colors"/high-contrast mode strips background-image on many
    // elements and paints only background-color), there is nothing behind
    // it and the panel goes see-through. Setting backgroundColor as its own
    // statement afterward survives that reset and gives a guaranteed solid
    // fallback paint layer no matter what happens to the gradient.
    frame.style.backgroundColor = opts.theme.bg2;
    frame.style.borderColor = opts.theme.accent;
  }
  return { frame, body };
}

export function replaceContent(body, nodes) {
  clearChildren(body);
  for (const n of [].concat(nodes)) body.appendChild(n);
}
