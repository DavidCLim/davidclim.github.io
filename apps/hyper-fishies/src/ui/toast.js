// Toast/message queue state. DOM rendering lives in ui/hud.js; this module
// just owns the timing logic so it's not duplicated.
export function showToast(state, message, duration = 2.6) {
  state.ui.toast = message;
  state.ui.toastTimer = duration;
}

export function updateToast(state, dt) {
  if (state.ui.toastTimer > 0) {
    state.ui.toastTimer -= dt;
    if (state.ui.toastTimer <= 0) {
      state.ui.toastTimer = 0;
      state.ui.toast = null;
    }
  }
}
