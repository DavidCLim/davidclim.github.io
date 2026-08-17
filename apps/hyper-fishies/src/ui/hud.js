import { el } from '../util/dom.js';
import { bagCapacity, equippedRod } from '../core/gameState.js';
import { regionById } from '../data/regions.js';
import { rankForLevel, expToNextLevel, MAX_LEVEL } from '../data/ranks.js';
import { potionById } from '../data/potions.js';
import { activeStreakMilestone } from '../data/streakMilestones.js';
import { createAxisSpring } from '../util/matterWorld.js';

// Always-on HUD: location, coins, equipped rod, bag fill, streak, toast
// messages, and the context-sensitive "Click to..." prompt near
// interactive zones. Weather has its own dedicated widget in the top-left
// corner now (ui/weatherWheel.js) instead of a chip in this row.
// A single chip in the stat cluster: a small icon + a value, no border of
// its own — the cluster wrapping them supplies one shared pill so the row
// reads as one organized instrument rather than six separately-floating
// badges.
function stat(icon, value, extraClass) {
  return el('div', { class: 'hud-stat' + (extraClass ? ' ' + extraClass : '') }, [
    el('span', { class: 'hud-stat-icon' }, icon),
    value,
  ]);
}

function divider() {
  return el('div', { class: 'hud-divider' });
}

export function buildHud(root) {
  const location = el('span', { class: 'hud-value' }, '');
  const coins = el('span', { class: 'hud-value' }, '0');
  const rodParts = el('span', { class: 'hud-value' }, '0');
  const rodName = el('span', { class: 'hud-value' }, '');
  const bagFill = el('span', { class: 'hud-value' }, '');
  const streak = el('span', { class: 'hud-value' }, '');
  const brewLabel = el('span', { class: 'hud-value' }, '');
  const toast = el('div', { class: 'hud-toast' });
  const prompt = el('div', { class: 'hud-prompt' });

  // A long, thin bar under the chip row instead of another chip — EXP
  // fills up constantly (every catch, every landmark gathered, every
  // quest), so it reads better as a persistent progress strip than as one
  // more number squeezed between Bag and Streak. The level number rides on
  // the bar itself rather than needing its own chip.
  const expFill = el('div', { class: 'hud-exp-fill' });
  const expLevelLabel = el('div', { class: 'hud-exp-level' });
  const expBar = el('div', { class: 'hud-exp-bar' }, [
    el('div', { class: 'hud-exp-track' }, [expFill]),
    expLevelLabel,
  ]);

  // One grouped cluster instead of six independent pills — Location on its
  // own (it's "where", not a resource), then Gold+Scrap (the economy),
  // then Rod+Bag (current loadout), then Streak (performance), each group
  // set off by a thin divider so the whole row reads as one organized
  // instrument panel top-to-bottom instead of a scattered badge row.
  const bagStat = stat('🎒', bagFill, 'hud-stat-bag');
  const streakStat = stat('🔥', streak);
  const statCluster = el('div', { class: 'hud-cluster' }, [
    stat('📍', location, 'hud-stat-location'),
    divider(),
    stat('💰', coins),
    stat('🔩', rodParts),
    divider(),
    stat('🎣', rodName, 'hud-stat-rod'),
    bagStat,
    divider(),
    streakStat,
  ]);

  // A 5th group, only ever present in the DOM while a Brew (data/potions.js)
  // is actually running — hidden via CSS rather than added/removed each
  // frame, so it never has to be rebuilt.
  const brewDivider = divider();
  const brewStat = stat('🧪', brewLabel, 'hud-stat-brew');
  statCluster.appendChild(brewDivider);
  statCluster.appendChild(brewStat);

  const hud = el('div', { class: 'hud', id: 'hud' }, [
    el('div', { class: 'hud-row hud-top' }, [statCluster]),
    expBar,
    prompt,
    toast,
  ]);

  root.appendChild(hud);
  // A real matter.js spring (util/matterWorld.js) driving the toast's
  // drop-in-from-above bounce — displaced up on each new message, then let
  // the spring pull it back down through a small overshoot instead of a
  // flat CSS fade-in.
  const toastBounce = createAxisSpring({ stiffness: 0.12, damping: 0.15, frictionAir: 0.03 });
  return { hud, location, coins, rodParts, rodName, bagFill, bagStat, streak, streakStat, brewLabel, brewDivider, brewStat, toast, prompt, expFill, expLevelLabel, toastBounce, lastToastMsg: null };
}

export function updateHud(refs, state) {
  refs.location.textContent = regionById(state.currentRegion).name;
  refs.coins.textContent = String(state.coins);
  refs.rodParts.textContent = String(state.salvage.items.length);
  refs.rodName.textContent = equippedRod(state).name;
  const bagCap = bagCapacity(state);
  refs.bagFill.textContent = `${state.bag.items.length}/${bagCap}`;
  // A full bag means the next catch just gets released instead of kept —
  // flag it right where the player's already looking instead of only
  // finding out after the fact from the catch toast.
  refs.bagStat.classList.toggle('hud-stat-bag-full', state.bag.items.length >= bagCap);
  refs.streak.textContent = `${state.streak.current} (best ${state.streak.best})`;
  // Glow the streak chip while a Streak Milestone Buff (data/
  // streakMilestones.js) is actually active — the same "flag it right
  // where the player's already looking" approach the bag-full warning
  // above uses, so the bonus is obvious without opening a panel.
  refs.streakStat.classList.toggle('hud-stat-streak-active', !!activeStreakMilestone(state.streak.current));

  const activeBrew = state.activePotion.id ? potionById(state.activePotion.id) : null;
  const showBrew = !!(activeBrew && state.activePotion.timeLeft > 0);
  refs.brewDivider.style.display = showBrew ? '' : 'none';
  refs.brewStat.style.display = showBrew ? '' : 'none';
  if (showBrew) {
    const m = Math.floor(state.activePotion.timeLeft / 60);
    const s = Math.floor(state.activePotion.timeLeft % 60);
    refs.brewLabel.textContent = `${activeBrew.icon} ${m}:${String(s).padStart(2, '0')}`;
  }

  if (state.level >= MAX_LEVEL) {
    refs.expFill.style.width = '100%';
  } else {
    const need = expToNextLevel(state.level);
    refs.expFill.style.width = `${Math.max(0, Math.min(100, (state.exp / need) * 100))}%`;
  }
  refs.expLevelLabel.textContent = `Lv ${state.level} ${rankForLevel(state.level).label}`;

  if (state.ui.toast) {
    if (state.ui.toast !== refs.lastToastMsg) {
      refs.lastToastMsg = state.ui.toast;
      refs.toastBounce.displace(-26);
    }
    refs.toast.textContent = state.ui.toast;
    refs.toast.classList.add('visible');
    refs.toast.style.transform = `translateY(${refs.toastBounce.value}px)`;
  } else {
    refs.lastToastMsg = null;
    refs.toast.classList.remove('visible');
  }

  const showPrompt = !state.ui.activeOverlay && state.fishing.state === 'idle' && state.ui.nearZone;
  if (showPrompt) {
    refs.prompt.textContent = state.ui.nearZone.promptText;
    refs.prompt.classList.add('visible');
  } else {
    refs.prompt.classList.remove('visible');
  }
}
