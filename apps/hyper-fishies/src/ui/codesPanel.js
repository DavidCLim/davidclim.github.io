import { el } from '../util/dom.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { redeemCode } from '../data/codes.js';
import { showToast } from './toast.js';
import { playAchievement } from '../audio/audioEngine.js';

const CODES_THEME = { bg1: '#2a2210', bg2: '#120e06', accent: '#ffd670', row: '#3a3018' };

export function buildCodesPanel(state, backdrop, onChange) {
  const input = el('input', {
    type: 'text',
    class: 'loadout-name-input',
    maxlength: '40',
    placeholder: 'Enter a code…',
    'aria-label': 'Code',
  });

  // Panels hide via `display:none` rather than leaving the DOM (see
  // overlayShell.js) — closing without blurring first can leave this
  // input as document.activeElement even once it's no longer visible,
  // which used to permanently block WASD movement (core/input.js checks
  // focus to keep typing here from also walking the player). Belt and
  // braces on top of that fix: never leave the close button without
  // blurring first.
  const { frame, body } = buildPanelFrame('Codes', () => { input.blur(); closeOverlay(state); onChange(); }, {
    theme: CODES_THEME,
  });

  const feedback = el('div', { class: 'shop-tagline shop-grid-full' }, 'Got a code? Type it in and hit Redeem.');

  function submit() {
    const result = redeemCode(state, input.value);
    feedback.textContent = result.message;
    feedback.classList.toggle('codes-feedback-ok', result.ok);
    feedback.classList.toggle('codes-feedback-bad', !result.ok);
    if (result.ok) {
      input.value = '';
      input.blur();
      playAchievement();
      showToast(state, result.message);
      onChange();
    }
  }

  const submitBtn = el('button', { class: 'btn btn-primary', text: 'Redeem', onClick: submit });
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') submit(); });

  const row = el('div', { class: 'loadout-save-row' }, [input, submitBtn]);
  replaceContent(body, [row, feedback]);

  return { frame, refresh: () => {} };
}
