// Input: keyboard (desktop) + virtual joystick/action button (touch).
// Everything funnels into state.input so downstream systems never touch DOM events.
const MOVE_KEYS = new Set(['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright']);

export function isTouchDevice() {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
}

// True while a text field (Codes, avatar name, a loadout name, ...) has
// focus — WASD/Space are also the movement/action keys, so without this a
// player typing "sad" into any of those fields also walks their character
// left and casts a line.
function isTypingInField() {
  const el = document.activeElement;
  if (!el) return false;
  if (!(el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable)) return false;
  // Overlay panels (ui/overlayShell.js) are hidden via `display:none`, not
  // removed from the DOM — closing one should blur its input, but focus
  // can linger on it regardless (an iPad-with-hardware-keyboard case
  // reported this locking WASD out permanently, well after the field was
  // ever visible again). `offsetParent` is null for anything not actually
  // rendered, so a stale reference to a hidden field stops counting as
  // "typing" instead of blocking movement forever.
  return el.offsetParent !== null;
}

export function initInput(state, surface, root) {
  const input = state.input;

  window.addEventListener('keydown', (e) => {
    if (isTypingInField()) return;
    const k = e.key.toLowerCase();
    if (k === ' ' || e.code === 'Space') {
      if (!input.actionDown) input.actionPressedEdge = true;
      input.actionDown = true;
      e.preventDefault();
      return;
    }
    // A universal "get me out of here" — closes whatever dialogue/overlay
    // is currently open (main.js consumes this edge). Exists as a backstop
    // independent of any one panel's own close button, so a dialogue or
    // panel that's for whatever reason unclickable never leaves the player
    // with literally no way back to the world.
    if (k === 'escape') {
      input.escapePressedEdge = true;
      return;
    }
    if (MOVE_KEYS.has(k)) {
      input.keys[k] = true;
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k === ' ' || e.code === 'Space') {
      input.actionDown = false;
      return;
    }
    if (MOVE_KEYS.has(k)) input.keys[k] = false;
  });

  // Mouse/click also acts as the universal action button, but only when the
  // click lands on the canvas itself (overlay panels sit in their own DOM).
  surface.canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    if (!input.actionDown) input.actionPressedEdge = true;
    input.actionDown = true;
  });
  window.addEventListener('mouseup', () => { input.actionDown = false; });

  // Touch's answer to the desktop canvas click above — tapping the game
  // view itself is the action button, so there's no separate on-screen
  // button duplicating it (see buildTouchControls: only the joystick lives
  // there now).
  surface.canvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (!input.actionDown) input.actionPressedEdge = true;
    input.actionDown = true;
  }, { passive: false });
  surface.canvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    input.actionDown = false;
  }, { passive: false });

  if (isTouchDevice()) {
    buildTouchControls(input, root);
  }

  window.addEventListener('blur', () => {
    input.actionDown = false;
    input.joystick.active = false;
    input.joystick.dx = 0;
    input.joystick.dy = 0;
    for (const k in input.keys) input.keys[k] = false;
  });
}

export function keyboardMoveVector(input) {
  let dx = 0, dy = 0;
  if (input.keys['w'] || input.keys['arrowup']) dy -= 1;
  if (input.keys['s'] || input.keys['arrowdown']) dy += 1;
  if (input.keys['a'] || input.keys['arrowleft']) dx -= 1;
  if (input.keys['d'] || input.keys['arrowright']) dx += 1;
  return { dx, dy };
}

// Consume the one-frame "action just pressed" edge. Call once per frame from main loop.
export function consumeActionEdge(input) {
  const v = input.actionPressedEdge;
  input.actionPressedEdge = false;
  return v;
}

// Same one-frame-edge pattern, for the boss "find" debug key.
export function consumeBossKeyEdge(input) {
  const v = input.bossKeyPressedEdge;
  input.bossKeyPressedEdge = false;
  return v;
}

// Same one-frame-edge pattern, for Escape's "close whatever's open" backstop.
export function consumeEscapeEdge(input) {
  const v = input.escapePressedEdge;
  input.escapePressedEdge = false;
  return v;
}


function buildTouchControls(input, root) {
  const wrap = document.createElement('div');
  wrap.id = 'touch-controls';

  const joyBase = document.createElement('div');
  joyBase.className = 'joy-base';
  const joyKnob = document.createElement('div');
  joyKnob.className = 'joy-knob';
  joyBase.appendChild(joyKnob);

  wrap.appendChild(joyBase);
  root.appendChild(wrap);

  const JOY_RADIUS = 36;
  let joyTouchId = null;
  let baseRect = null;

  function setKnob(dx, dy) {
    joyKnob.style.transform = `translate(${dx * JOY_RADIUS}px, ${dy * JOY_RADIUS}px)`;
  }

  joyBase.addEventListener('touchstart', (e) => {
    e.preventDefault();
    const t = e.changedTouches[0];
    joyTouchId = t.identifier;
    baseRect = joyBase.getBoundingClientRect();
    input.joystick.active = true;
    updateJoy(t.clientX, t.clientY);
  }, { passive: false });

  function updateJoy(clientX, clientY) {
    if (!baseRect) return;
    const cx = baseRect.left + baseRect.width / 2;
    const cy = baseRect.top + baseRect.height / 2;
    let dx = (clientX - cx) / JOY_RADIUS;
    let dy = (clientY - cy) / JOY_RADIUS;
    const len = Math.hypot(dx, dy);
    if (len > 1) { dx /= len; dy /= len; }
    input.joystick.dx = dx;
    input.joystick.dy = dy;
    setKnob(dx, dy);
  }

  window.addEventListener('touchmove', (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) {
        e.preventDefault();
        updateJoy(t.clientX, t.clientY);
      }
    }
  }, { passive: false });

  function endJoy(e) {
    for (const t of e.changedTouches) {
      if (t.identifier === joyTouchId) {
        joyTouchId = null;
        input.joystick.active = false;
        input.joystick.dx = 0;
        input.joystick.dy = 0;
        setKnob(0, 0);
      }
    }
  }
  window.addEventListener('touchend', endJoy);
  window.addEventListener('touchcancel', endJoy);
}
