import { el } from '../util/dom.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { ensureDailyBounties, ensureWeeklyChallenges, ensureQuarry } from '../economy/economy.js';
import { rarityOf } from '../data/rarity.js';
import { msUntilNextDay } from '../data/bounties.js';
import { msUntilNextWeek } from '../data/weeklyChallenges.js';
import { REGIONS, isRegionLocked } from '../data/regions.js';
import { regionCatchCount, regionMasteryBonus, nextRegionMilestone } from '../data/regionMilestones.js';
import { QUARRY_BONUS_GOLD, QUARRY_BONUS_EXP } from '../data/quarry.js';
import { fishById } from '../data/fish.js';
import { drawFishIcon, fishVisualDetail } from '../render/drawFishIcon.js';
import { emojiIcon } from './rodShopPanel.js';

// "3h 42m" / "2d 5h" style — coarse on purpose, this is a rough "how much
// longer" readout, not a countdown clock ticking down to the second.
function formatCountdown(ms) {
  const totalMinutes = Math.max(0, Math.floor(ms / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

const NOTEBOOK_THEME = { bg1: '#2a2018', bg2: '#120d08', accent: '#c9a227', row: '#3a2c1c' };

// A green checkmark disc, standing in for a quest's action button once
// there's nothing left to do with it — same visual language as a mobile
// quest-log's "done" state (a filled circle + check) rather than more text.
function checkBadge() {
  return el('div', { class: 'quest-check', title: 'Complete' }, '✓');
}

function questRow({ name, status, done }) {
  const children = [
    emojiIcon(done ? '📜' : '❓'),
    el('div', { class: 'shop-row-info' }, [
      el('div', { class: 'shop-row-name' }, name),
      el('div', { class: 'shop-row-badges' }, [
        el('span', { class: 'tier-badge tier-captain' }, 'Secret Quest'),
      ]),
      el('div', { class: 'shop-row-stats' }, status),
    ]),
  ];
  if (done) children.push(checkBadge());
  return el('div', { class: 'shop-row' + (done ? ' quest-done' : '') }, children);
}

function richyRow(state) {
  const q = state.quests.richy;
  if (q.stage === 'locked') return null;
  const done = q.stage === 'complete' || q.stage === 'thanked';
  let status;
  if (q.stage === 'available') status = 'Offered — talk to Richy to accept.';
  else if (q.stage === 'active') status = `In progress: ${q.progress}/${q.goal} Legendary-or-better catches.`;
  else status = 'Complete — his Special is yours for good.';

  return questRow({ name: "Richy's Secret Recipe", status, done });
}

function finnRow(state) {
  const q = state.quests.finn;
  if (q.stage === 'locked') return null;
  const done = q.stage === 'complete' || q.stage === 'thanked';
  let status;
  if (q.stage === 'available') status = 'Offered — talk to Finn to accept.';
  else if (q.stage === 'active') status = `In progress: ${q.progress}/${q.goal} Gargantuan-or-better catches.`;
  else status = 'Complete — Old Faithful is yours for good.';

  return questRow({ name: "Finn's Old Faithful", status, done });
}

function barnabyRow(state) {
  const q = state.quests.barnaby;
  if (q.stage === 'locked') return null;
  const done = q.stage === 'complete' || q.stage === 'thanked';
  let status;
  if (q.stage === 'available') status = 'Offered — talk to B-LA-KA to accept.';
  else if (q.stage === 'active') status = `In progress: ${q.progress}/${q.goal} Sea Chests opened.`;
  else status = 'Complete — the Golden Scale is yours for good.';

  return questRow({ name: "B-LA-KA's Golden Scale", status, done });
}

// One row per Daily Bounty (data/bounties.js) — a rarity-colored dot, its
// target, a thin progress bar, and the reward. Claimed ones get the same
// checkmark as a finished quest and their bar reads full, but stay listed
// rather than disappearing — same "trophy case, not a to-do list" choice as
// the quest rows below.
function bountyRow(b) {
  const rarity = rarityOf(b.rarity);
  const pct = Math.min(100, Math.round((b.progress / b.goal) * 100));
  const children = [
    emojiIcon(b.weekly ? '🗓' : '🎯'),
    el('div', { class: 'shop-row-info' }, [
      el('div', { class: 'shop-row-name' }, [
        el('span', { class: 'bounty-dot', style: `background:${rarity.color}` }),
        b.label,
      ]),
      el('div', { class: 'bounty-progress-track' }, [
        el('div', { class: 'bounty-progress-fill', style: `width:${pct}%;background:${rarity.color}` }),
      ]),
      el('div', { class: 'shop-row-stats' },
        b.claimed ? `Claimed — +${b.rewardGold}g, +${b.rewardExp} EXP` : `${b.progress}/${b.goal} — reward ${b.rewardGold}g, ${b.rewardExp} EXP`),
    ]),
  ];
  if (b.claimed) children.push(checkBadge());
  return el('div', { class: 'shop-row' + (b.claimed ? ' quest-done' : '') }, children);
}

// Charted Waters (data/regionMilestones.js) — one row per unlocked region,
// its own catch count and a progress bar toward whatever tier is still
// ahead, or a "Fully Charted" badge once every tier's cleared. Only counts
// real fish landed there, and the bonus only ever applies while actually
// standing in that region (gameState.js's effectiveRodStats).
function regionMilestoneRow(state, region) {
  const count = regionCatchCount(state, region.id);
  const bonus = regionMasteryBonus(state, region.id);
  const next = nextRegionMilestone(state, region.id);
  const pct = next ? Math.min(100, Math.round((count / next.count) * 100)) : 100;
  const status = next
    ? `${count}/${next.count} catches — next tier +${Math.round(next.luck * 100)}% luck`
    : `Fully charted — +${Math.round(bonus * 100)}% luck here for good`;
  const children = [
    emojiIcon('🗺'),
    el('div', { class: 'shop-row-info' }, [
      el('div', { class: 'shop-row-name' }, region.name),
      el('div', { class: 'bounty-progress-track' }, [
        el('div', { class: 'bounty-progress-fill', style: `width:${pct}%;background:${region.mapTint || '#c9a227'}` }),
      ]),
      el('div', { class: 'shop-row-stats' }, status),
    ]),
  ];
  if (!next) children.push(checkBadge());
  return el('div', { class: 'shop-row' + (!next ? ' quest-done' : '') }, children);
}

function lucaRow(state) {
  const q = state.quests.luca;
  if (q.stage === 'available') return null; // hasn't been offered yet
  const done = q.stage === 'complete' || q.stage === 'thanked';
  let status;
  if (q.stage === 'active') status = `In progress: ${q.progress}/${q.goal} Mythic-or-better catches, landed in the Abyssal Lands.`;
  else if (q.stage === 'ingredientsReady') status = "Every ingredient gathered — see Grizelda to carve the Cleansing Rune.";
  else if (q.stage === 'runeReady') status = 'Rune in hand — bring it back to Luca.';
  else status = 'Complete — Luca is himself again, and the Devil\'s Rod is yours.';

  return questRow({ name: "Luca's Cure", status, done });
}

// Today's Quarry (data/quarry.js) — one named species, with its actual icon
// (same per-fish pattern/skew as everywhere else, render/drawFishIcon.js)
// rather than just a name, so this reads as "go find THIS fish" at a
// glance. Purely a readout — there's no accept step, it's already live the
// moment the board rolls it, same "automatic, no turn-in" shape as the
// bounty rows above.
function quarryRow(state) {
  const fish = fishById(state.quarry.fishId);
  if (!fish) return null;
  const rarity = rarityOf(fish.rarity);
  const canvas = el('canvas', { width: 40, height: 40, class: 'market-fish-icon' });
  const ctx = canvas.getContext('2d');
  drawFishIcon(ctx, fish.shape, 20, 20, 30, fish.hue, fishVisualDetail(fish.id));
  const status = state.quarry.claimed
    ? 'Claimed today — nice work.'
    : `Land one for a bonus — reward ${QUARRY_BONUS_GOLD}g, ${QUARRY_BONUS_EXP} EXP.`;
  const children = [
    canvas,
    el('div', { class: 'shop-row-info' }, [
      el('div', { class: 'shop-row-name', style: `color:${rarity.color}` }, fish.name),
      el('div', { class: 'shop-row-stats' }, status),
    ]),
  ];
  if (state.quarry.claimed) children.push(checkBadge());
  return el('div', { class: 'shop-row' + (state.quarry.claimed ? ' quest-done' : '') }, children);
}

// A read-only log of every quest currently held — Richy's secret recipe
// favor and Luca's cure, each once it's been offered at least once. Nothing
// here is interactive; turning a quest in happens automatically the moment its
// catch requirement is met (see fishing/fishingMachine.js), so this panel
// is purely "what am I working toward right now." Finished quests get a
// checkmark instead of dropping out of the list entirely — a small trophy
// case of favors you've already settled.
export function buildNotebookPanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame('Quest Notebook', () => { closeOverlay(state); onChange(); }, {
    landscape: true, theme: NOTEBOOK_THEME,
  });
  // Faint ruled lines over the themed body, like an actual notebook page —
  // see .panel-notebook.
  frame.classList.add('panel-notebook');

  function refresh() {
    ensureDailyBounties(state);
    ensureWeeklyChallenges(state);
    ensureQuarry(state);

    const nodes = [
      el('div', { class: 'shop-tagline shop-grid-full' }, '🎯 Today\'s Quarry'),
      ...[quarryRow(state)].filter(Boolean),
      el('div', { class: 'shop-tagline shop-grid-full' }, [
        '🎯 Today\'s Bounties ',
        el('span', { class: 'bounty-countdown' }, `— resets in ${formatCountdown(msUntilNextDay())}`),
      ]),
      ...state.bounties.list.map(bountyRow),
      el('div', { class: 'shop-tagline shop-grid-full' }, [
        '🗓 Weekly Challenges ',
        el('span', { class: 'bounty-countdown' }, `— resets in ${formatCountdown(msUntilNextWeek())}`),
      ]),
      ...state.weeklyChallenges.list.map(bountyRow),
      el('div', { class: 'shop-tagline shop-grid-full' }, '🗺 Charted Waters'),
      ...REGIONS.filter(r => !isRegionLocked(state, r)).map(r => regionMilestoneRow(state, r)),
      el('div', { class: 'shop-tagline shop-grid-full' },
        "📓 Every favor you've taken on."),
    ];

    const rows = [richyRow(state), finnRow(state), barnabyRow(state), lucaRow(state)].filter(Boolean);
    if (rows.length === 0) {
      nodes.push(el('div', { class: 'market-empty shop-grid-full' }, "No open quests — go find some trouble."));
    } else {
      nodes.push(...rows);
    }

    replaceContent(body, nodes);
  }

  refresh();
  return { frame, refresh };
}
