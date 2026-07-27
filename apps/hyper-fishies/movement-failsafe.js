// Final movement layer. Loaded last so laptop keys always move the same player the game draws.
(function () {
  var pressed = Object.create(null);
  var moveKeys = {
    a: true, d: true, w: true, s: true,
    keya: true, keyd: true, keyw: true, keys: true,
    arrowleft: true, arrowright: true, arrowup: true, arrowdown: true
  };

  function lower(value) {
    return String(value || "").toLowerCase();
  }

  function remember(event, value) {
    var key = lower(event.key);
    var code = lower(event.code);
    if (key) pressed[key] = value;
    if (code) pressed[code] = value;

    if (typeof keys !== "undefined") {
      if (key) keys[key] = value;
      if (code) keys[code] = value;
      keys.a = !!(pressed.a || pressed.keya || pressed.arrowleft);
      keys.d = !!(pressed.d || pressed.keyd || pressed.arrowright);
      keys.w = !!(pressed.w || pressed.keyw || pressed.arrowup);
      keys.s = !!(pressed.s || pressed.keys || pressed.arrowdown);
      keys.arrowleft = !!(pressed.a || pressed.keya || pressed.arrowleft);
      keys.arrowright = !!(pressed.d || pressed.keyd || pressed.arrowright);
      keys.arrowup = !!(pressed.w || pressed.keyw || pressed.arrowup);
      keys.arrowdown = !!(pressed.s || pressed.keys || pressed.arrowdown);
    }

    if (moveKeys[key] || moveKeys[code] || key === " " || code === "space") {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function heldAxis() {
    return {
      x: (pressed.d || pressed.keyd || pressed.arrowright ? 1 : 0) - (pressed.a || pressed.keya || pressed.arrowleft ? 1 : 0),
      y: (pressed.s || pressed.keys || pressed.arrowdown ? 1 : 0) - (pressed.w || pressed.keyw || pressed.arrowup ? 1 : 0)
    };
  }

  function playableMode() {
    if (typeof state === "undefined" || !state.player) return false;
    if (state.mode === "home" || state.mode === "menu" || state.mode === "credits" || state.mode === "inventory") {
      state.mode = "dock";
      state.menuPage = "";
      state.message = "Laptop movement ready: WASD or arrow keys.";
    }
    return state.mode === "dock";
  }

  function forceMove(dt, tapBoost) {
    if (!playableMode()) return;
    var dir = heldAxis();
    if (window.joy) {
      dir.x += joy.x || 0;
      dir.y += joy.y || 0;
    }
    var mag = Math.hypot(dir.x, dir.y);
    if (mag < 0.05) return;

    dir.x /= mag;
    dir.y /= mag;

    var p = state.player;
    var speed = tapBoost || 245 * Math.max(0.012, Math.min(0.04, dt || 0.016));
    p.x += dir.x * speed;
    p.y += dir.y * speed;
    p.vx = dir.x * 245;
    p.vy = dir.y * 245;
    p.pose = "walk";
    p.facing = Math.abs(dir.x) > Math.abs(dir.y) ? (dir.x < 0 ? "left" : "right") : (dir.y < 0 ? "up" : "down");
    state.walkFrame = (state.walkFrame || 0) + 0.22;

    p.x = Math.max(64, Math.min(896, p.x));
    p.y = Math.max(42, Math.min(456, p.y));
    if (typeof constrainToDock === "function") constrainToDock(p);
  }

  function keyDown(event) {
    remember(event, true);
    var key = lower(event.key);
    var code = lower(event.code);

    if (moveKeys[key] || moveKeys[code]) forceMove(0.016, 26);

    if ((key === " " || code === "space" || key === "f") && typeof state !== "undefined" && state.mode === "fishing") {
      if (state.castPower && typeof stopCastBar === "function") stopCastBar();
      else if (state.cast && state.cast.phase === "bite" && typeof reel === "function") reel();
      else if (typeof castLine === "function") castLine();
    }
  }

  function keyUp(event) {
    remember(event, false);
  }

  function attach(target) {
    if (!target) return;
    target.addEventListener("keydown", keyDown, true);
    target.addEventListener("keypress", keyDown, true);
    target.addEventListener("keyup", keyUp, true);
  }

  attach(window);
  attach(document);
  attach(document.body);
  attach(canvas);
  window.onkeydown = keyDown;
  window.onkeyup = keyUp;
  document.onkeydown = keyDown;
  document.onkeyup = keyUp;

  canvas.tabIndex = 0;
  document.body.tabIndex = 0;
  canvas.style.outline = "none";
  document.body.style.outline = "none";

  function focusGame() {
    try { canvas.focus({ preventScroll: true }); } catch (error) { try { canvas.focus(); } catch (ignored) {} }
    try { document.body.focus({ preventScroll: true }); } catch (ignored2) {}
  }

  focusGame();
  window.addEventListener("load", focusGame);
  document.addEventListener("pointerdown", focusGame, true);
  canvas.addEventListener("pointerdown", focusGame, true);

  var previousUpdate = typeof update === "function" ? update : null;
  if (previousUpdate) {
    update = function updateWithGuaranteedLaptopMovement(dt) {
      previousUpdate(dt);
      forceMove(dt, 0);
    };
  }

  window.addEventListener("blur", function () {
    Object.keys(pressed).forEach(function (name) { pressed[name] = false; });
  });
})();
