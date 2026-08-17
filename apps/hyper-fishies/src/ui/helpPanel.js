import { el } from '../util/dom.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { setMusicEnabled, setSfxEnabled } from '../audio/audioEngine.js';

const HELP_THEME = { bg1: '#1c2a30', bg2: '#0c1418', accent: '#8fe9d9', row: '#243440' };

// Grouped into tabs (same satchel-tabs pattern the Satchel/Achievements
// panels already use) rather than one long scroll — the game has quietly
// grown a lot of systems over time, and a flat list of 25 rows stopped
// being a "quick reference" a while ago. Each card is deliberately short:
// this is a pointer to what a system does and where to find it, not a full
// manual.
const CATEGORIES = [
  {
    id: 'basics', label: 'Basics', icon: '🎣',
    cards: [
      { icon: '🕹', title: 'Move', desc: 'WASD, Arrow Keys, or the on-screen joystick on touch devices.' },
      { icon: '⎵', title: 'Interact / Cast', desc: 'Hold Space, click, or tap near a fishing spot to charge a cast; a quick click/tap near an NPC or stall talks to them instead.' },
      { icon: '🪝', title: 'Hookset', desc: 'Press Space, click, or tap the instant the bobber gets a bite.' },
      { icon: '🎞', title: 'Reel', desc: "Hold Space, click, or tap to reel in; release to let the line rest and tension cool. Keep tension in check for a clean reel — see Perfect Reel Streak." },
      { icon: '✕', title: 'Close Anything', desc: 'Esc always closes whatever dialogue or panel is open, no matter where you are.' },
    ],
  },
  {
    id: 'fishing', label: 'Fishing', icon: '🌦',
    cards: [
      { icon: '🎡', title: 'The Weather Wheel', desc: 'Top-left corner — the lit wedge is the current sky, and it turns on its own timer.' },
      { icon: '🌤', title: 'Everyday Weather', desc: 'Sunny, Cloudy, Windy, Foggy, and Snowy each nudge bite speed and rare-fish odds a little — small, mostly-flavor effects.' },
      { icon: '🌧', title: 'Rain & Storms', desc: "Rain gives a real boost to both and unlocks a handful of rain-only species. Storms boost harder still, plus their own storm-only fish — but tension rises faster once something's hooked." },
      { icon: '🌙', title: 'Day & Night', desc: 'The clock widget tracks the sky in real time. Fishing deep in the night quietly improves your luck.' },
      { icon: '✨', title: 'Shiny', desc: 'A small independent chance on every catch, any rarity — worth 3x as much and tracked separately in the Almanac.' },
      { icon: '🐋', title: 'Giant', desc: "A second, independent mutation roll leaning hard into size over value — can stack with Shiny on the same fish." },
      { icon: '⚓', title: 'Sea Chests', desc: 'A small chance on any cast to reel up a chest of gold instead of a fish — storms wash up more of them, and chests carry their own small hatch chance too.' },
      { icon: '📜', title: 'Message in a Bottle', desc: "A rare, purely-flavor find — a small finder's fee and a note, nothing more." },
    ],
  },
  {
    id: 'forge', label: 'The Forge', icon: '🔨',
    cards: [
      { icon: '🔧', title: 'Rod Scraps', desc: 'A small chance on any cast to fish up a loose part instead of a bite — no toggle needed, it just happens.' },
      { icon: '⚒', title: "The Blacksmith", desc: "Bring parts to the Forge to build a rod, reinforce your equipped rod's stats, or melt them down for gold." },
      { icon: '🔥', title: 'Forge Enchants', desc: "Bend odds nothing else touches — mutation chance, treasure chance, EXP, even skipping the hookset window. One slot per rod, a second once that rod is Mastered." },
      { icon: '🔮', title: "Grizelda's Runes", desc: 'Flat stat buffs, socketed onto a rod — how many slots a rod holds scales with its own tier.' },
    ],
  },
  {
    id: 'progress', label: 'Progression', icon: '📈',
    cards: [
      { icon: '⚓', title: 'Level & Rank', desc: 'EXP from every catch and quest turns into levels, and levels turn into a naval rank with its own small passive buff.' },
      { icon: '🏆', title: 'Rod Mastery', desc: "Every catch earns the equipped rod its own XP, separate from your level. A small permanent stat bump per level, up to level 10 — check progress in the Satchel." },
      { icon: '🎯', title: 'Perfect Reel Streak', desc: 'Reel a fish in without ever spiking the tension too far and the streak grows, adding a little more sell value each time. One sloppy fight resets it, even if you still land the fish.' },
      { icon: '🔥', title: 'Catch Streak', desc: 'Landing fish back-to-back without a snapped line builds a separate streak with its own milestone buffs — breaks the instant a line snaps.' },
      { icon: '🗺', title: 'Charted Waters', desc: 'Fishing the same region enough times permanently sharpens your luck there — check the Notebook for progress toward the next tier.' },
      { icon: '👑', title: 'Prestige', desc: 'Once you hit the level cap, trade back down to Level 1 for a small permanent bonus that stacks every time you do it again.' },
      { icon: '🎖', title: 'Titles & Achievements', desc: 'Milestones across every system unlock gold, EXP, and wearable titles — check the trophy button for the full list.' },
    ],
  },
  {
    id: 'world', label: 'World', icon: '🧭',
    cards: [
      { icon: '🚣', title: 'Regions & Travel', desc: "Morris rows you between regions from the map — each has its own difficulty, focus rarity, and look." },
      { icon: '🎯', title: 'Daily Bounties & Weekly Challenges', desc: "Land fish of a target rarity or better for a bounty reward — the Weekly board asks for a lot more, and pays out to match. Check the Notebook for both." },
      { icon: '📅', title: 'Daily Login Streak', desc: 'Log in on consecutive days for a growing reward — miss a day and it resets.' },
      { icon: '🎒', title: 'Gear Loadouts', desc: 'Save a full equip setup — rod, hook, line, swivel, scale, bait, title — and swap the whole thing in one click from the Satchel.' },
      { icon: '♻', title: 'Chum the Duplicates', desc: 'At the Trading Post, trade 3 bagged fish of the same species for one guaranteed catch a rarity tier higher.' },
      { icon: '🌑', title: 'The Abyssal Lands', desc: "The deep dark, out past the mainland. Naia keeps watch there and sells one exclusive lure — but only ever has one to spare at a time." },
    ],
  },
];

function card({ icon, title, desc }) {
  return el('div', { class: 'help-card' }, [
    el('div', { class: 'help-card-head' }, [
      el('div', { class: 'help-card-icon' }, icon),
      el('div', { class: 'help-card-title' }, title),
    ]),
    el('div', { class: 'help-card-desc' }, desc),
  ]);
}

// Mostly a static reference panel — the category cards below never change,
// but the Settings toggle does read/write `state`, so this still needs a
// real refresh() (just for that one card and whichever tab is active).
export function buildHelpPanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame('How to Play', () => { closeOverlay(state); onChange(); }, {
    landscape: true, theme: HELP_THEME,
  });
  frame.classList.add('panel-help');

  let activeTab = 'basics';
  const tabBar = el('div', { class: 'satchel-tabs' }, CATEGORIES.map(cat => el('button', {
    class: 'satchel-tab' + (cat.id === activeTab ? ' active' : ''),
    text: `${cat.icon} ${cat.label}`,
    onClick: () => { activeTab = cat.id; refresh(); },
  })));

  function settingsCard() {
    const on = state.settings.reduceEffects;
    return el('div', { class: 'help-card help-card-settings' }, [
      el('div', { class: 'help-card-head' }, [
        el('div', { class: 'help-card-icon' }, '⚙'),
        el('div', { class: 'help-card-title' }, 'Reduce Flash & Particles'),
      ]),
      el('div', { class: 'help-card-desc' }, [
        'Suppresses the screen flash and shrinks catch bursts, for anyone sensitive to flashing or motion. ',
        el('button', {
          class: 'btn btn-chip' + (on ? ' btn-equipped' : ''),
          text: on ? 'On' : 'Off',
          onClick: () => { state.settings.reduceEffects = !state.settings.reduceEffects; onChange(); refresh(); },
        }),
      ]),
    ]);
  }

  function musicCard() {
    const on = state.settings.musicOn;
    return el('div', { class: 'help-card help-card-settings' }, [
      el('div', { class: 'help-card-head' }, [
        el('div', { class: 'help-card-icon' }, '🎵'),
        el('div', { class: 'help-card-title' }, 'Background Music'),
      ]),
      el('div', { class: 'help-card-desc' }, [
        'A quiet generative loop while you fish. ',
        el('button', {
          class: 'btn btn-chip' + (on ? ' btn-equipped' : ''),
          text: on ? 'On' : 'Off',
          onClick: () => {
            state.settings.musicOn = !state.settings.musicOn;
            setMusicEnabled(state.settings.musicOn);
            onChange();
            refresh();
          },
        }),
      ]),
    ]);
  }

  function sfxCard() {
    const on = state.settings.sfxOn;
    return el('div', { class: 'help-card help-card-settings' }, [
      el('div', { class: 'help-card-head' }, [
        el('div', { class: 'help-card-icon' }, '🔊'),
        el('div', { class: 'help-card-title' }, 'Sound Effects' ),
      ]),
      el('div', { class: 'help-card-desc' }, [
        'Casts, catches, snapped lines, gold, and every button click. ',
        el('button', {
          class: 'btn btn-chip' + (on ? ' btn-equipped' : ''),
          text: on ? 'On' : 'Off',
          onClick: () => {
            state.settings.sfxOn = !state.settings.sfxOn;
            setSfxEnabled(state.settings.sfxOn);
            onChange();
            refresh();
          },
        }),
      ]),
    ]);
  }

  function refresh() {
    for (let i = 0; i < CATEGORIES.length; i++) {
      tabBar.children[i].classList.toggle('active', CATEGORIES[i].id === activeTab);
    }
    const category = CATEGORIES.find(c => c.id === activeTab) || CATEGORIES[0];
    const nodes = [
      el('div', { class: 'help-intro shop-grid-full' }, '📖 A quick reference for everything on deck.'),
    ];
    if (category.id === 'basics') nodes.push(settingsCard(), musicCard(), sfxCard());
    nodes.push(...category.cards.map(card));
    replaceContent(body, nodes);
  }

  frame.querySelector('.panel-body').insertAdjacentElement('beforebegin', tabBar);
  refresh();
  return { frame, refresh };
}
