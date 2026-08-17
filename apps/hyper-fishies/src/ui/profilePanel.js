import { el, clearChildren } from '../util/dom.js';
import { drawPlayer } from '../render/drawPlayer.js';
import { equippedRod, effectiveRodStats } from '../core/gameState.js';
import { fishById } from '../data/fish.js';
import { rarityOf } from '../data/rarity.js';
import { rankForLevel, expToNextLevel, MAX_LEVEL } from '../data/ranks.js';
import { buildPanelFrame, closeOverlay } from './overlayShell.js';
import { SHOP_THEMES } from './shopTheme.js';
import { TITLES, titleById, isTitleUnlocked } from '../data/titles.js';
import { AVATAR_OPTIONS, PLAYER_APPEARANCE } from '../render/playerAppearance.js';
import { selectTitle, canPrestige, prestige } from '../economy/economy.js';
import { prestigeBadge, prestigeBonus } from '../data/prestige.js';
import { showToast } from './toast.js';
import { enchantById } from '../data/enchants.js';

const PORTRAIT_W = 160;
const PORTRAIT_H = 180;
const PORTRAIT_SCALE = 2.2;

// The six stats effectiveRodStats(state) (core/gameState.js) actually
// stacks — rod base, runes, rank buff, mastery, reinforcement, hook, line,
// swivel, scale, Brew, Fish Sets, Prestige, and Streak Buffs all
// feed into it, but until now nothing ever showed the *total*. Read as
// plain percentages, same 0-1-scale convention statBar/deltaSpan already
// use in the shops.
const BUILD_STATS = [
  { key: 'luck', label: 'Luck', icon: '🍀' },
  { key: 'control', label: 'Control', icon: '🎯' },
  { key: 'biteSpeed', label: 'Bite Speed', icon: '⚡' },
  { key: 'valueMul', label: 'Sell Value', icon: '💰' },
  { key: 'sizeMul', label: 'Size', icon: '📏' },
  { key: 'snapGuard', label: 'Snap Guard', icon: '🛡' },
];

function bestFishLine(state) {
  if (state.personalBests.rarestCaughtId) {
    const fish = fishById(state.personalBests.rarestCaughtId);
    if (fish) {
      const rarity = rarityOf(fish.rarity);
      return { label: fish.name, sub: rarity.label, color: rarity.color };
    }
  }
  if (state.personalBests.biggestOverall) {
    const fish = fishById(state.personalBests.biggestOverall.fishId);
    if (fish) {
      const rarity = rarityOf(fish.rarity);
      return { label: fish.name, sub: `${state.personalBests.biggestOverall.size.toFixed(1)} in`, color: rarity.color };
    }
  }
  return { label: 'None yet', sub: 'Go catch something!', color: '#cfc2a4' };
}

export function buildProfilePanel(state, backdrop, onChange, onQuit) {
  const { frame, body } = buildPanelFrame('Captain’s Profile', () => { closeOverlay(state); onChange(); }, {
    theme: SHOP_THEMES.profile,
  });
  // Diagonal mahogany-grain wash on the body background — see .panel-profile.
  frame.classList.add('panel-profile');

  const canvas = el('canvas', { width: PORTRAIT_W, height: PORTRAIT_H, class: 'profile-portrait' });
  const stats = el('div', { class: 'profile-stats' });
  const nameEl = el('div', { class: 'profile-name' });
  const rankEl = el('div', { class: 'profile-rank' });
  const expFill = el('div', { class: 'exp-bar-fill' });
  const expLabel = el('div', { class: 'exp-bar-label' });
  const expBar = el('div', { class: 'exp-bar-wrap' }, [
    el('div', { class: 'exp-bar-track' }, [expFill]),
    expLabel,
  ]);
  const buffEl = el('div', { class: 'profile-buff' });
  const prestigeSection = el('div', { class: 'profile-prestige' });
  const buildStatsSection = el('div', { class: 'profile-build-stats' });
  const titlesSection = el('div', { class: 'profile-titles' });
  const wardrobeSection = el('div', { class: 'profile-wardrobe' });
  let wardrobeOpen = false;

  function drawPortrait() {
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, PORTRAIT_W, PORTRAIT_H);
    ctx.save();
    ctx.translate(PORTRAIT_W / 2, PORTRAIT_H - 30);
    ctx.scale(PORTRAIT_SCALE, PORTRAIT_SCALE);
    drawPlayer(ctx, { x: 0, y: 0, facing: 'down', moving: false, animTime: 1.4, avatar: state.player.avatar }, equippedRod(state).material);
    ctx.restore();
  }

  function statRow(icon, label, value, color) {
    return el('div', { class: 'profile-stat-row' }, [
      el('div', { class: 'profile-stat-label-line' }, [
        el('span', { class: 'profile-stat-icon' }, icon),
        el('div', { class: 'profile-stat-label' }, label),
      ]),
      el('div', { class: 'profile-stat-value', style: color ? `color:${color}` : '' }, value),
    ]);
  }

  function refreshTitles() {
    clearChildren(titlesSection);
    titlesSection.appendChild(el('div', { class: 'profile-titles-label' }, '🎖 Title'));
    const row = el('div', { class: 'profile-titles-row' }, TITLES.map(title => {
      const unlocked = isTitleUnlocked(state, title);
      const equipped = state.title === title.id;
      return el('button', {
        class: 'profile-title-chip' + (equipped ? ' active' : '') + (unlocked ? '' : ' locked'),
        text: title.label,
        title: unlocked ? title.label : 'Locked — unlock the matching achievement first.',
        disabled: unlocked ? undefined : 'disabled',
        onClick: () => {
          if (!unlocked) return;
          selectTitle(state, title.id);
          showToast(state, `Title equipped: ${title.label === 'No Title' ? 'None' : title.label}.`);
          refresh();
        },
      });
    }));
    titlesSection.appendChild(row);
  }

  function refreshBuildStats() {
    clearChildren(buildStatsSection);
    buildStatsSection.appendChild(el('div', { class: 'profile-titles-label' }, '⚙ Current Build'));
    const eff = effectiveRodStats(state);
    buildStatsSection.appendChild(el('div', { class: 'build-stats-grid' }, BUILD_STATS.map(s => el('div', { class: 'build-stat-chip' }, [
      el('span', { class: 'build-stat-icon' }, s.icon),
      el('span', { class: 'build-stat-label' }, s.label),
      el('span', { class: 'build-stat-value' }, `${Math.round((eff[s.key] || 0) * 100)}%`),
    ]))));
    const enchantIds = state.rod.enchanted[state.rod.equipped] || [];
    const enchantNames = enchantIds.map(id => enchantById(id)).filter(Boolean).map(e => e.name);
    buildStatsSection.appendChild(el('div', { class: 'build-enchant-line' },
      enchantNames.length ? `🔥 Forge Enchant: ${enchantNames.join(' + ')}` : '🔥 Forge Enchant: none — visit Garrick.'));
  }

  const WARDROBE_LABELS = { skin: 'Skin', hat: 'Hat', vestLight: 'Vest', beard: 'Beard', pants: 'Trousers' };

  // Same swatch set the avatar customizer offers at save creation
  // (render/playerAppearance.js's AVATAR_OPTIONS) — re-picking here just
  // mutates state.player.avatar directly, which is already the field
  // core/save.js persists, so there's nothing new to wire into saving.
  function refreshWardrobe() {
    clearChildren(wardrobeSection);
    const toggleBtn = el('button', {
      class: 'profile-wardrobe-toggle',
      text: wardrobeOpen ? '🧥 Wardrobe ▲' : '🧥 Wardrobe ▼',
      onClick: () => { wardrobeOpen = !wardrobeOpen; refreshWardrobe(); },
    });
    wardrobeSection.appendChild(toggleBtn);
    if (!wardrobeOpen) return;

    if (!state.player.avatar) {
      state.player.avatar = {
        skin: PLAYER_APPEARANCE.skin, hat: PLAYER_APPEARANCE.hat,
        vestLight: PLAYER_APPEARANCE.vestLight, beard: PLAYER_APPEARANCE.beard,
        pants: PLAYER_APPEARANCE.pants,
      };
    }
    const rows = el('div', { class: 'profile-wardrobe-rows' });
    for (const field of Object.keys(AVATAR_OPTIONS)) {
      const row = el('div', { class: 'avatar-row' }, [
        el('div', { class: 'avatar-row-label' }, WARDROBE_LABELS[field]),
        el('div', { class: 'avatar-row-swatches' }, AVATAR_OPTIONS[field].map(color => el('button', {
          class: 'avatar-swatch' + (state.player.avatar[field] === color ? ' avatar-swatch-selected' : ''),
          style: `background:${color}`,
          'aria-label': `${WARDROBE_LABELS[field]} ${color}`,
          onClick: () => { state.player.avatar[field] = color; refresh(); onChange(); },
        }))),
      ]);
      rows.appendChild(row);
    }
    wardrobeSection.appendChild(rows);
  }

  // Once you're at MAX_LEVEL, Prestige (data/prestige.js) trades your level
  // back down to 1 for a permanent stat bump that stacks with every future
  // prestige — same inline double-confirm pattern as the Quit button below,
  // since resetting your level is exactly the kind of thing a stray click
  // shouldn't do by accident.
  function refreshPrestige() {
    clearChildren(prestigeSection);
    const n = state.prestigeLevel || 0;
    if (n > 0) {
      const bonus = prestigeBonus(state);
      const bonusText = Object.keys(bonus).map(k => `+${Math.round(bonus[k] * 100)}% ${k}`).join(', ');
      prestigeSection.appendChild(el('div', { class: 'profile-prestige-level' }, `🌟 Prestige ${n} — permanent ${bonusText}`));
    }
    if (canPrestige(state)) {
      let armed = false;
      const btn = el('button', {
        class: 'btn profile-prestige-btn',
        text: '🌟 Prestige (reset to Level 1)',
        onClick: () => {
          if (armed) {
            const result = prestige(state);
            if (result.ok) {
              showToast(state, `Prestiged! You are now Prestige ${result.prestigeLevel} — level reset to 1, permanent bonus increased.`);
              refresh();
              onChange();
            }
            return;
          }
          armed = true;
          btn.textContent = 'Really prestige? This resets your level to 1!';
          setTimeout(() => { armed = false; btn.textContent = '🌟 Prestige (reset to Level 1)'; }, 3000);
        },
      });
      prestigeSection.appendChild(btn);
    }
  }

  function refresh() {
    drawPortrait();
    const title = titleById(state.title);
    clearChildren(nameEl);
    nameEl.appendChild(document.createTextNode((state.player.name || 'Angler') + (title.achievementId ? ` — ${title.label}` : '')));
    const badge = prestigeBadge(state);
    if (badge) {
      nameEl.appendChild(el('span', { class: 'profile-prestige-badge', title: `Prestige ${state.prestigeLevel}` }, ` ${badge}`));
    }
    refreshTitles();
    refreshPrestige();
    refreshBuildStats();

    const rank = rankForLevel(state.level);
    rankEl.textContent = `⚓ ${rank.label} — Level ${state.level}`;
    buffEl.textContent = `${rank.buffLabel}: ${rank.buffDesc}`;

    if (state.level >= MAX_LEVEL) {
      expFill.style.width = '100%';
      expLabel.textContent = 'MAX LEVEL';
    } else {
      const need = expToNextLevel(state.level);
      const pct = Math.max(0, Math.min(100, (state.exp / need) * 100));
      expFill.style.width = `${pct}%`;
      expLabel.textContent = `${state.exp} / ${need} EXP`;
    }

    const best = bestFishLine(state);
    clearChildren(stats);
    stats.appendChild(statRow('💰', 'Gold', `${state.coins}g`));
    stats.appendChild(statRow('🎣', 'Current Rod', equippedRod(state).name));
    stats.appendChild(statRow('🔥', 'Best Streak', `${state.streak.best}`));
    stats.appendChild(statRow('🎯', 'Best Perfect Reel Streak', `${state.cleanStreak.best}`));
    stats.appendChild(statRow('🐟', 'Best Fish', `${best.label}${best.sub ? ` (${best.sub})` : ''}`, best.color));
    stats.appendChild(statRow('📅', 'Login Streak', `${state.dailyLogin.streak} day${state.dailyLogin.streak === 1 ? '' : 's'}`));
    refreshWardrobe();
  }

  const layout = el('div', { class: 'profile-layout' }, [
    el('div', { class: 'profile-portrait-frame' }, [canvas, nameEl, rankEl, expBar, buffEl, prestigeSection]),
    stats,
  ]);
  body.appendChild(layout);
  body.appendChild(buildStatsSection);
  body.appendChild(titlesSection);
  body.appendChild(wardrobeSection);

  // Saves and reloads to the save-slot screen — until now the only way
  // back there was closing the tab. Same inline double-confirm pattern as
  // the slot screen's own Delete button (ui/saveSlotScreen.js), even though
  // nothing is actually lost here (it saves first), just so a stray click
  // doesn't boot you out of a session you meant to keep playing.
  if (onQuit) {
    let armed = false;
    const quitBtn = el('button', {
      class: 'btn profile-quit-btn',
      text: '⚓ Save & Return to Menu',
      onClick: () => {
        if (armed) { onQuit(); return; }
        armed = true;
        quitBtn.textContent = 'Really return to menu?';
        setTimeout(() => { armed = false; quitBtn.textContent = '⚓ Save & Return to Menu'; }, 3000);
      },
    });
    body.appendChild(quitBtn);
  }

  refresh();
  return { frame, refresh };
}
