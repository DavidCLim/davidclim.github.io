// Movement failsafe loaded absolutely last. It moves the player from real keyboard state,
// and also nudges on each key tap so laptop movement is visible immediately.
(function () {
  const down = Object.create(null);
  const walkModes = new Set(["dock", "home", "menu"]);

  function keyName(event) {
    return String(event.key || event.code || "").toLowerCase();
  }

  function isMoveKey(key, code) {
    return ["arrowleft", "arrowright", "arrowup", "arrowdown", "w", "a", "s", "d", "keyw", "keya", "keys", "keyd"].includes(key) || ["keyw", "keya", "keys", "keyd"].includes(code);
  }

  function setDown(event, value) {
    const key = keyName(event);
    const code = String(event.code || "").toLowerCase();
    down[key] = value;
    down[code] = value;
    if (typeof keys !== "undefined") {
      keys[key] = value;
      keys[code] = value;
      if (key === " ") keys.space = value;
    }
    if (isMoveKey(key, code) || key === " " || code === "space") {
      event.preventDefault();
      event.stopPropagation();
    }
  }

  function held() {
    return {
      left: down.arrowleft || down.a || down.keya,
      right: down.arrowright || down.d || down.keyd,
      up: down.arrowup || down.w || down.keyw,
      down: down.arrowdown || down.s || down.keys
    };
  }

  function startGameIfNeeded() {
    if (state.mode === "home" || state.mode === "menu") {
      state.mode = "dock";
      state.menuPage = "";
      if (state.player) {
        state.player.x = state.player.x || 480;
        state.player.y = state.player.y || 340;
      }
      say("Move with WASD or arrow keys.");
    }
  }

  function applyMove(ax, ay, amount) {
    if (!state || !state.player) return;
    if (!walkModes.has(state.mode)) return;
    startGameIfNeeded();

    const p = state.player;
    const mag = Math.hypot(ax, ay) || 1;
    ax /= mag;
    ay /= mag;

    p.x += ax * amount;
    p.y += ay * amount;
    p.vx = ax * 260;
    p.vy = ay * 260;
    p.pose = "walk";
    if (Math.abs(ax) > Math.abs(ay)) p.facing = ax < 0 ? "left" : "right";
    else p.facing = ay < 0 ? "up" : "down";
    state.walkFrame = (state.walkFrame || 0) + 0.2;

    p.x = Math.max(70, Math.min(890, p.x));
    p.y = Math.max(50, Math.min(460, p.y));
    if (typeof constrainToDock === "function") constrainToDock(p);
  }

  function moveFromHeld(dt) {
    if (!state || !state.player) return;
    const h = held();
    let ax = 0;
    let ay = 0;
    if (h.left) ax -= 1;
    if (h.right) ax += 1;
    if (h.up) ay -= 1;
    if (h.down) ay += 1;
    if (window.joy) {
      ax += joy.x || 0;
      ay += joy.y || 0;
    }
    if (Math.hypot(ax, ay) <= 0.1) return;
    applyMove(ax, ay, 260 * dt);
  }

  function moveFromTap(key, code) {
    let ax = 0;
    let ay = 0;
    if (key === "arrowleft" || key === "a" || code === "keya") ax = -1;
    if (key === "arrowright" || key === "d" || code === "keyd") ax = 1;
    if (key === "arrowup" || key === "w" || code === "keyw") ay = -1;
    if (key === "arrowdown" || key === "s" || code === "keys") ay = 1;
    if (ax || ay) applyMove(ax, ay, 24);
  }

  document.addEventListener("keydown", function (event) {
    const key = keyName(event);
    const code = String(event.code || "").toLowerCase();
    setDown(event, true);
    moveFromTap(key, code);
    if ((key === " " || code === "space" || key === "f") && state.mode === "fishing") {
      if (state.castPower) stopCastBar();
      else if (state.cast && state.cast.phase === "bite") reel();
      else castLine();
    }
  }, true);

  document.addEventListener("keyup", function (event) {
    setDown(event, false);
  }, true);

  window.addEventListener("blur", function () {
    Object.keys(down).forEach(key => down[key] = false);
  });

  let last = performance.now();
  function tick(now) {
    const dt = Math.min(0.033, (now - last) / 1000);
    last = now;
    moveFromHeld(dt);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
})();
