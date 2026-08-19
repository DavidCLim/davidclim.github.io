import { el } from '../util/dom.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { listSaveSlots } from '../core/save.js';
import { emojiIcon } from './rodShopPanel.js';

const LEADERBOARD_THEME = { bg1: '#2a2210', bg2: '#120e06', accent: '#ffd670', row: '#3a3018' };

const MEDALS = ['🥇', '🥈', '🥉'];

const CATEGORIES = [
  {
    id: 'worth', label: 'Net Worth', icon: '💰',
    value: (s) => s.coins,
    format: (s) => `${s.coins.toLocaleString()}g`,
  },
  {
    id: 'level', label: 'Level', icon: '⭐',
    value: (s) => s.level + s.prestigeLevel * 1000,
    format: (s) => (s.prestigeLevel > 0 ? `Lv.${s.level} · Prestige ${s.prestigeLevel}` : `Lv.${s.level}`),
  },
  {
    id: 'catch', label: 'Biggest Catch', icon: '🐟',
    value: (s) => (s.biggestOverall ? s.biggestOverall.size : 0),
    format: (s) => (s.biggestOverall ? `${s.biggestOverall.size.toFixed(1)}" ${s.biggestOverall.name}` : 'No catch yet'),
  },
  {
    id: 'trophies', label: 'Trophies', icon: '🏆',
    value: (s) => s.achievementCount,
    format: (s) => `${s.achievementCount} earned`,
  },
];

function leaderboardRow(rank, slot, category) {
  const medal = MEDALS[rank - 1];
  const rankBadge = el('div', { class: 'leaderboard-rank' + (medal ? ' leaderboard-medal' : '') }, medal || `#${rank}`);
  const infoChildren = [
    el('div', { class: 'shop-row-name' }, slot.name + (slot.__isActive ? ' (You)' : '')),
    el('div', { class: 'shop-row-stats' }, category.format(slot)),
  ];
  const children = [rankBadge, emojiIcon(category.icon), el('div', { class: 'shop-row-info' }, infoChildren)];
  return el('div', { class: 'shop-row' + (slot.__isActive ? ' active' : '') }, children);
}

// A local leaderboard ranking this browser's own save slots against each
// other — there's no account/server system for the game to compare across
// different players, so "leaderboard" here means the honest thing it can
// actually be: your own captains, ranked against each other. The currently
// active slot reads its live in-memory `state` rather than its last save,
// so it never looks stale mid-session; every other slot reads whatever it
// last saved as.
export function buildLeaderboardPanel(state, backdrop, onChange, slotIndex) {
  const { frame, body } = buildPanelFrame('Leaderboard', () => { closeOverlay(state); onChange(); }, {
    theme: LEADERBOARD_THEME,
  });

  let activeCategory = 'worth';
  const tabBar = el('div', { class: 'satchel-tabs' }, CATEGORIES.map(cat => el('button', {
    class: 'satchel-tab' + (cat.id === activeCategory ? ' active' : ''),
    text: `${cat.icon} ${cat.label}`,
    onClick: () => { activeCategory = cat.id; refresh(); },
  })));

  function liveSlotSummary() {
    return {
      name: state.player.name || 'Angler',
      coins: state.coins,
      level: state.level,
      prestigeLevel: state.prestigeLevel || 0,
      biggestOverall: state.personalBests.biggestOverall,
      achievementCount: Object.values(state.achievements).filter(Boolean).length,
      __isActive: true,
    };
  }

  function refresh() {
    for (let i = 0; i < CATEGORIES.length; i++) {
      tabBar.children[i].classList.toggle('active', CATEGORIES[i].id === activeCategory);
    }
    const category = CATEGORIES.find(c => c.id === activeCategory);
    const slots = listSaveSlots()
      .map((s, i) => (i === slotIndex ? liveSlotSummary() : s))
      .filter(Boolean);
    slots.sort((a, b) => category.value(b) - category.value(a));

    const nodes = [
      el('div', { class: 'shop-tagline shop-grid-full' },
        `${category.icon} Ranked by ${category.label.toLowerCase()}, across every captain on this browser.`),
    ];
    if (!slots.length) {
      nodes.push(el('div', { class: 'shop-row achievement-locked' }, 'No saves yet.'));
    } else {
      slots.forEach((slot, i) => nodes.push(leaderboardRow(i + 1, slot, category)));
    }
    replaceContent(body, nodes);
  }

  frame.querySelector('.panel-body').insertAdjacentElement('beforebegin', tabBar);
  refresh();
  return { frame, refresh };
}
