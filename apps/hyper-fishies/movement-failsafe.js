// Final movement layer. Loaded last so keyboard and mobile joystick always move the player.
(function () {
  var pressed = Object.create(null);
  var activeJoystickPointer = null;
  var lastMoveTime = performance.now();
  var moveKeys = {
    a: true, d: true, w: true, s: true,
    keya: true, keyd: true, keyw: true, keys: true,
    arrowleft: true, arrowright: true, arrowup: true, arrowdown: true
  };

  function low(value) { return String(value || "").toLowerCase(); }

  function syncKeys() {
    if (typeof keys === "undefined") return;
    keys.a = !!(pressed.a || pressed.keya || pressed.arrowleft);
    keys.d = !!(pressed.d || pressed.keyd || pressed.arrowright);
    keys.w = !!(pressed.w || pressed.keyw || pressed.arrowup);
    keys.s = !!(pressed.s || pressed.keys || pressed.arrowdown);
    keys.arrowleft = keys.a;
    keys.arrowright = keys.d;
    keys.arrowup = keys.w;
    keys.arrowdown = keys.s;
    keys.ArrowLeft = keys.a;
    keys.ArrowRight = keys.d;
    keys.ArrowUp = keys.w;
    keys.ArrowDown = keys.s;
    keys.KeyA = keys.a;
    keys.KeyD = keys.d;
    keys.KeyW = keys.w;
    keys.KeyS = keys.s;
  }

  function remember(event, value) {
    var key = low(event.key);
    var code = low(event.code);
    if (key) pressed[key] = value;
    if (code) pressed[code] = value;
    syncKeys();

    if (moveKeys[key] || moveKeys[code] || key === " " || code === "space") {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function heldAxis() {
    var x = (pressed.d || pressed.keyd || pressed.arrowright ? 1 : 0) - (pressed.a || pressed.keya || pressed.arrowleft ? 1 : 0);
    var y = (pressed.s || pressed.keys || pressed.arrowdown ? 1 : 0) - (pressed.w || pressed.keyw || pressed.arrowup ? 1 : 0);
    if (window.joy) {
      x += joy.x || 0;
      y += joy.y || 0;
    }
    return { x: x, y: y };
  }

  function enterPlayableMode() {
    if (typeof state === "undefined" || !state.player) return false;
    if (state.mode === "home" || state.mode === "menu" || state.mode === "credits") {
      if (typeof playFromMenu === "function") playFromMenu();
      else state.mode = "dock";
    }
    return state.mode === "dock";
  }

  function applyMove(dt, instantStep) {
    if (!enterPlayableMode()) return;
    var axis = heldAxis();
    var mag = Math.hypot(axis.x, axis.y);
    if (mag < 0.05) {
      if (state.player) {
        state.player.vx = 0;
        state.player.vy = 0;
        state.player.pose = "idle";
      }
      return;
    }

    axis.x /= mag;
    axis.y /= mag;
    var p = state.player;
    var step = instantStep || 235 * Math.max(0.008, Math.min(0.05, dt || 0.016));
    p.x += axis.x * step;
    p.y += axis.y * step;
    p.vx = axis.x * 235;
    p.vy = axis.y * 235;
    p.pose = "walk";
    p.facing = Math.abs(axis.x) > Math.abs(axis.y) ? (axis.x < 0 ? "left" : "right") : (axis.y < 0 ? "up" : "down");
    state.walkFrame = (state.walkFrame || 0) + Math.max(0.08, step / 28);

    p.x = Math.max(64, Math.min(896, p.x));
    p.y = Math.max(42, Math.min(456, p.y));
    if (typeof constrainToDock === "function") constrainToDock(p);

    if (typeof atSellDock === "function" && atSellDock(p) && typeof enterSellShop === "function") enterSellShop();
    else if (typeof atShopDock === "function" && atShopDock(p) && typeof enterRodShop === "function") enterRodShop();
    else if (typeof atFishingDock === "function" && atFishingDock(p)) state.message = "Fishing dock: tap CAST or press Space/F.";
  }

  function keyDown(event) {
    remember(event, true);
    var key = low(event.key);
    var code = low(event.code);
    if (moveKeys[key] || moveKeys[code]) applyMove(0.016, 24);

    if ((key === " " || code === "space" || key === "f") && typeof state !== "undefined" && state.mode === "fishing") {
      if (state.castPower && typeof stopCastBar === "function") stopCastBar();
      else if (state.cast && state.cast.phase === "bite" && typeof reel === "function") reel();
      else if (typeof castLine === "function") castLine();
    }
  }

  function keyUp(event) { remember(event, false); }

  [window, document, document.body, canvas].forEach(function (target) {
    if (!target) return;
    target.addEventListener("keydown", keyDown, true);
    target.addEventListener("keypress", keyDown, true);
    target.addEventListener("keyup", keyUp, true);
  });
  window.onkeydown = keyDown;
  window.onkeyup = keyUp;
  document.onkeydown = keyDown;
  document.onkeyup = keyUp;

  function focusGame() {
    try { canvas.tabIndex = 0; canvas.focus({ preventScroll: true }); } catch (error) { try { canvas.focus(); } catch (ignored) {} }
  }
  focusGame();
  window.addEventListener("load", focusGame);
  document.addEventListener("pointerdown", focusGame, true);

  function setJoyFromPointer(event) {
    var joystick = document.getElementById("joystick");
    var knob = document.getElementById("joystickKnob");
    if (!joystick || !window.joy) return;
    var rect = joystick.getBoundingClientRect();
    var cx = rect.left + rect.width / 2;
    var cy = rect.top + rect.height / 2;
    var dx = event.clientX - cx;
    var dy = event.clientY - cy;
    var max = rect.width * 0.34;
    var mag = Math.hypot(dx, dy);
    if (mag > max) {
      dx = dx / mag * max;
      dy = dy / mag * max;
      mag = max;
    }
    joy.x = max ? dx / max : 0;
    joy.y = max ? dy / max : 0;
    joy.active = true;
    if (knob) knob.style.transform = "translate(calc(-50% + " + dx + "px), calc(-50% + " + dy + "px))";
    applyMove(0.016, 12);
  }

  function resetJoy() {
    if (window.joy) {
      joy.x = 0;
      joy.y = 0;
      joy.active = false;
    }
    var knob = document.getElementById("joystickKnob");
    if (knob) knob.style.transform = "translate(-50%, -50%)";
    activeJoystickPointer = null;
  }

  var joystick = document.getElementById("joystick");
  if (joystick) {
    joystick.style.touchAction = "none";
    joystick.addEventListener("pointerdown", function (event) {
      activeJoystickPointer = event.pointerId;
      joystick.setPointerCapture(event.pointerId);
      event.preventDefault();
      setJoyFromPointer(event);
    }, true);
    joystick.addEventListener("pointermove", function (event) {
      if (activeJoystickPointer !== event.pointerId) return;
      event.preventDefault();
      setJoyFromPointer(event);
    }, true);
    joystick.addEventListener("pointerup", function (event) {
      if (activeJoystickPointer === event.pointerId) resetJoy();
    }, true);
    joystick.addEventListener("pointercancel", resetJoy, true);
  }

  var previousUpdate = typeof update === "function" ? update : null;
  if (previousUpdate) {
    update = function updateWithMovementFix(dt) {
      previousUpdate(dt);
      applyMove(dt, 0);
    };
  }

  function movementLoop(now) {
    var dt = Math.min(0.05, (now - lastMoveTime) / 1000 || 0.016);
    lastMoveTime = now;
    applyMove(dt, 0);
    requestAnimationFrame(movementLoop);
  }
  requestAnimationFrame(movementLoop);

  window.addEventListener("blur", function () {
    Object.keys(pressed).forEach(function (name) { pressed[name] = false; });
    syncKeys();
    resetJoy();
  });
})();
