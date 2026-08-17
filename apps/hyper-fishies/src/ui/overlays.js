import { buildOverlayRoot, closeOverlay } from './overlayShell.js';
import { buildRodShopPanel } from './rodShopPanel.js';
import { buildTacklePanel } from './tacklePanel.js';
import { buildMarketPanel } from './marketPanel.js';
import { buildWitchShopPanel } from './witchShopPanel.js';
import { buildAlmanacPanel } from './almanacPanel.js';
import { buildSatchelPanel } from './satchelPanel.js';
import { buildProfilePanel } from './profilePanel.js';
import { buildNotebookPanel } from './notebookPanel.js';
import { buildForgePanel } from './forgePanel.js';
import { buildAchievementsPanel } from './achievementsPanel.js';
import { buildHelpPanel } from './helpPanel.js';

// Wires the shop/almanac/satchel/profile panels to a single backdrop and to
// state.ui.activeOverlay, so main.js just calls updateOverlays() per frame.
// `onQuit` is only ever handed to the Profile panel — everything else only
// needs the generic `onChange` refresh hook.
export function buildOverlays(root, state, onChange, onQuit) {
  const backdrop = buildOverlayRoot(root);
  backdrop.addEventListener('click', (e) => {
    if (e.target === backdrop) { closeOverlay(state); onChange(); }
  });

  const panels = {
    rodShop: buildRodShopPanel(state, backdrop, onChange),
    tackle: buildTacklePanel(state, backdrop, onChange),
    market: buildMarketPanel(state, backdrop, onChange),
    runeShop: buildWitchShopPanel(state, backdrop, onChange),
    almanac: buildAlmanacPanel(state, backdrop, onChange),
    satchel: buildSatchelPanel(state, backdrop, onChange),
    profile: buildProfilePanel(state, backdrop, onChange, onQuit),
    notebook: buildNotebookPanel(state, backdrop, onChange),
    forge: buildForgePanel(state, backdrop, onChange),
    achievements: buildAchievementsPanel(state, backdrop, onChange),
    help: buildHelpPanel(state, backdrop, onChange),
  };
  for (const key in panels) root.appendChild(panels[key].frame);

  let lastActive = null;

  function update() {
    const active = state.ui.activeOverlay;
    backdrop.classList.toggle('hidden', !active);

    for (const key in panels) {
      const isActive = key === active;
      panels[key].frame.classList.toggle('hidden', !isActive);
    }
    if (active && active !== lastActive && panels[active]) {
      panels[active].refresh();
    }
    lastActive = active;
  }

  return { update };
}
