const botWordingRender = render;

render = function render() {
  botWordingRender();
  els.gameMode.textContent = els.gameMode.textContent.replace(/\bAI\b/g, "Bot");
};

render();
