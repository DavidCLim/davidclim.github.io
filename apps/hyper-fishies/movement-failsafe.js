// Movement failsafe loaded absolutely last. It focuses the game and listens for laptop
// keys on every useful target, then moves the player immediately on each tap and while held.
(function () {
  const pressed = Object.create(null);
  const walkModes = new Set(["dock", "home", "menu"]);

  function keyParts(event) {
    return {
      key: String(event.key || "").toLowerCase(),
      code: String(event.code || "").toLowerCase()
    };
  }

  function isMove(key, code) {
    return key === "a" || key === "d" || key === "w" || key === "s" ||
      key === "arrowleft" || key === "arrowright" || key === "arrowup" || key === "arrowdown" ||
      code === "keya" || code === "keyd" || code === "keyw" || code === "keys";
  }

  function record(event, value) {
    const parts = keyParts(event);
    if (!parts.key && !parts.code) return parts;
    pressed[parts.key] = value;
    pressed[parts.code] = value;
    if (typeof keys !== "undefined") {
      keys[parts.key] = value;
      keys[parts.code] = value;
      keys[parts.key.toLowerCase()] = value;
      keys[parts.code.toLowerCase()] = value;
    }
    if (isMove(parts.key, parts.code) || parts.key === " " || parts.code === "space") {
      event.preventDefault();
      event.stopPropagation();
    }
    return parts;
  }

  function directionFrom(parts) {
    if (parts.key === "a" || parts.key === "arrowleft" || parts.code === "keya") return { x: -1, y: 0 };
    if (parts.key === "d" || parts.key === "arrowright" || parts.code === "keyd") return { x: 1, y: 0 };
    if (parts.key === "w" || parts.key === "arrowup" || parts.code === "keyw") return { x: 0, y: -1 };
    if (parts.key === "s" || parts.key === "arrowdown" || parts.code === "keys") return { x: 0, y: 1 };
    return { x: 0, y: 0 };
  }

  function heldDirection() {
    return {
      x: (pressed.d || pressed.keyd || pressed.arrowright ? 1 : 0) - (pressed.a || pressed.keya || pressed.arrowleft ? 1 : 0),
      y: (pressed.s || pressed.keys || pressed.arrowdown ? 1 : 0) - (pressed.w || pressed.keyw || pressed.arrowup ? 1 : 0)
    };
  }

  function ensureDock() {
    if (!state || !state.player) return false;
    if (state.mode === "home" || state.mode === "menu") {
      state.mode = "dock";
      state.menuPage = "";
      state.player.x = state.player.x || 480;
      state.player.y = state.player.y || 340;
    }
    return walkModes.has(state.mode);
  }

  function movePlayer(dx, dy, amount) {
    if (!ensureDock()) return;
    const mag = Math.hypot(dx, dy);
    if (!mag) return;
    dx /= mag;
    dy /= mag;

    const p = state.player;
    p.x += dx * amount;
    p.y += dy * amount;
    p.vx = dx * 260;
    p.vy = dy * 260;
    p.pose = "walk";
    p.facing = Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "up" : "down");
    state.walkFrame = (state.walkFrame || 0) + 0.24;
    state.message = "Moving with laptop keys.";

    p.x = Math.max(70, Math.min(890, p.x));
    p.y = Math.max(50, Math.min(460, p.y));
    if (typeof constrainToDock === "function") constrainToDock(p);
  }

  function onKeyDown(event) {
    const parts = record(event, true);
    const dir = directionFrom(parts);
    if (dir.x || dir.y) movePlayer(dir.x, dir.y, 32);

    if ((parts.key === " " || parts.code === "space" || parts.key === "f") && state && state.mode === "fishing") {
      if (state.castPower) stopCastBar();
      else if (state.cast && state.cast.phase === "bite") reel();
      else castLine();
    }
  }

  function onKeyUp(event) {
    record(event, false);
  }

  function attach(target) {
    if (!target || target.__hyperFishiesKeysAttached) return;
    target.__hyperFishiesKeysAttached = true;
    target.addEventListener("keydown", onKeyDown, true);
    target.addEventListener("keypress", onKeyDown, true);
    target.addEventListener("keyup", onKeyUp, true);
  }

  attach(window);
  attach(document);
  attach(document.body);
  attach(canvas);

  canvas.tabIndex = 0;
  document.body.tabIndex = 0;
  canvas.style.outline = "none";
  document.body.style.outline = "none";

  function focusGame() {
    try { canvas.focus({ preventScroll: true }); } catch (error) { try { canvas.focus(); } catch (ignored) {} }
    try { window.focus(); } catch (ignored) {}
  }
  focusGame();
  window.addEventListener("load", focusGame);
  canvas.addEventListener("pointerdown", focusGame, true);
  document.addEventListener("pointerdown", focusGame, true);

  window.addEventListener("blur", function () {
    Object.keys(pressed).forEach(key => pressed[key] = false);
  });

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    const dir = heldDirection();
    if (dir.x || dir.y) movePlayer(dir.x, dir.y, 260 * dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
