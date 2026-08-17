import { el } from '../util/dom.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { ACHIEVEMENTS } from '../data/achievements.js';
import { FISH_SETS, isSetComplete, setProgress } from '../data/fishSets.js';
import { emojiIcon } from './rodShopPanel.js';

const ACHIEVEMENTS_THEME = { bg1: '#2a2210', bg2: '#120e06', accent: '#ffd670', row: '#3a3018' };

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'unlocked', label: 'Unlocked' },
  { id: 'locked', label: 'Locked' },
  { id: 'sets', label: 'Collections' },
];

const STAT_LABELS = {
  luck: 'Luck', control: 'Control', biteSpeed: 'Bite Speed',
  snapGuard: 'Snap Guard', valueMul: 'Sell Value', sizeMul: 'Size',
};

function bonusText(bonus) {
  return Object.keys(bonus).map(k => `+${Math.round(bonus[k] * 100)}% ${STAT_LABELS[k] || k}`).join(', ');
}

function checkBadge() {
  return el('div', { class: 'quest-check', title: 'Unlocked' }, '✓');
}

function achievementRow(a, done, state) {
  const reward = [a.gold ? `+${a.gold}g` : null, a.exp ? `+${a.exp} EXP` : null].filter(Boolean).join('  ·  ');
  const infoChildren = [
    el('div', { class: 'shop-row-name' }, done ? a.name : '???'),
    el('div', { class: 'shop-row-stats' }, done ? a.desc : 'Not yet unlocked.'),
    el('div', { class: 'shop-row-stats' }, reward),
  ];
  // Numeric-threshold achievements (data/achievements.js's `progress`) get a
  // little "how close am I" bar instead of just a locked/unlocked flag —
  // one-off achievements ("land a Rare fish") have no meaningful progress
  // to show, so they're left with plain locked text.
  if (!done && a.progress) {
    const [current, target] = a.progress(state);
    const pct = target > 0 ? Math.max(0, Math.min(100, Math.round((current / target) * 100))) : 0;
    infoChildren.push(
      el('div', { class: 'achievement-progress-track' }, [
        el('div', { class: 'achievement-progress-fill', style: `width:${pct}%` }),
      ]),
      el('div', { class: 'achievement-progress-label' }, `${current.toLocaleString()} / ${target.toLocaleString()}`),
    );
  }
  const children = [emojiIcon(done ? '🏆' : '🔒'), el('div', { class: 'shop-row-info' }, infoChildren)];
  if (done) children.push(checkBadge());
  return el('div', { class: 'shop-row' + (done ? ' quest-done' : ' achievement-locked') }, children);
}

// A Collection Set row (data/fishSets.js) — its own progress bar toward
// completion plus the permanent stat bonus completing it grants, shown
// plainly rather than gated behind "???" the way a locked achievement is,
// since the whole point is knowing what you're working toward.
function setRow(set, state) {
  const done = isSetComplete(state, set);
  const [current, target] = setProgress(state, set);
  const pct = target > 0 ? Math.max(0, Math.min(100, Math.round((current / target) * 100))) : 0;
  const infoChildren = [
    el('div', { class: 'shop-row-name' }, set.name),
    el('div', { class: 'shop-row-stats' }, done ? `Complete — ${bonusText(set.bonus)} (always active)` : `Reward: ${bonusText(set.bonus)}`),
    el('div', { class: 'achievement-progress-track' }, [
      el('div', { class: 'achievement-progress-fill', style: `width:${pct}%` }),
    ]),
    el('div', { class: 'achievement-progress-label' }, `${current} / ${target} caught`),
  ];
  const children = [emojiIcon(set.icon), el('div', { class: 'shop-row-info' }, infoChildren)];
  if (done) children.push(checkBadge());
  return el('div', { class: 'shop-row' + (done ? ' quest-done' : '') }, children);
}

// A read-only trophy case (data/achievements.js) — every milestone re-checked
// every frame (economy.js's checkAchievements), so this panel only ever
// needs to render whatever's already true in state.achievements. Locked
// entries show as "???" rather than dropping out, so there's always a
// visible count of what's still left to chase.
export function buildAchievementsPanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame('Achievements', () => { closeOverlay(state); onChange(); }, {
    landscape: true, theme: ACHIEVEMENTS_THEME,
  });
  frame.classList.add('panel-notebook');

  // With 27+ milestones, scrolling past everything already earned just to
  // see what's left (or vice versa) got old fast — these filter which set
  // shows without changing anything about how a row itself renders.
  let activeTab = 'all';
  const tabBar = el('div', { class: 'satchel-tabs' }, TABS.map(tab => el('button', {
    class: 'satchel-tab' + (tab.id === activeTab ? ' active' : ''),
    text: tab.label,
    onClick: () => { activeTab = tab.id; refresh(); },
  })));

  function refresh() {
    for (let i = 0; i < TABS.length; i++) {
      tabBar.children[i].classList.toggle('active', TABS[i].id === activeTab);
    }

    if (activeTab === 'sets') {
      const completeCount = FISH_SETS.filter(set => isSetComplete(state, set)).length;
      const nodes = [
        el('div', { class: 'shop-tagline shop-grid-full' },
          `🧩 ${completeCount} / ${FISH_SETS.length} collections complete — each grants a permanent bonus.`),
        ...FISH_SETS.map(set => setRow(set, state)),
      ];
      replaceContent(body, nodes);
      return;
    }

    const unlockedCount = ACHIEVEMENTS.filter(a => state.achievements[a.id]).length;
    const nodes = [
      el('div', { class: 'shop-tagline shop-grid-full' },
        `🏆 ${unlockedCount} / ${ACHIEVEMENTS.length} milestones earned.`),
    ];
    const visible = ACHIEVEMENTS.filter(a => {
      const done = !!state.achievements[a.id];
      if (activeTab === 'unlocked') return done;
      if (activeTab === 'locked') return !done;
      return true;
    });
    nodes.push(...visible.map(a => achievementRow(a, !!state.achievements[a.id], state)));
    replaceContent(body, nodes);
  }

  frame.querySelector('.panel-body').insertAdjacentElement('beforebegin', tabBar);
  refresh();
  return { frame, refresh };
}
