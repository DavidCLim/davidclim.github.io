// Canvas setup + logical-resolution scaling. This is the ONE place that deals
// with device pixel ratio / letterboxing. All game/render code below this
// works purely in logical pixels (LOGICAL_W x LOGICAL_H).
export const LOGICAL_W = 960;
export const LOGICAL_H = 600;

export function createCanvasSurface(container) {
  const canvas = document.createElement('canvas');
  canvas.id = 'game-canvas';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const surface = { canvas, ctx, scale: 1, offsetX: 0, offsetY: 0 };

  function resize() {
    const dpr = window.devicePixelRatio || 1;
    const availW = container.clientWidth;
    const availH = container.clientHeight;
    const scale = Math.max(0.1, Math.min(availW / LOGICAL_W, availH / LOGICAL_H));

    const cssW = Math.round(LOGICAL_W * scale);
    const cssH = Math.round(LOGICAL_H * scale);

    canvas.style.width = cssW + 'px';
    canvas.style.height = cssH + 'px';
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);

    ctx.setTransform(dpr * scale, 0, 0, dpr * scale, 0, 0);

    surface.scale = scale;
    const rect = canvas.getBoundingClientRect();
    surface.offsetX = rect.left;
    surface.offsetY = rect.top;
  }

  window.addEventListener('resize', resize);
  window.addEventListener('orientationchange', resize);
  resize();

  // Converts a client-space (pointer/touch) coordinate to logical game coords.
  surface.clientToLogical = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (clientX - rect.left) / surface.scale,
      y: (clientY - rect.top) / surface.scale,
    };
  };

  surface.resize = resize;
  return surface;
}
