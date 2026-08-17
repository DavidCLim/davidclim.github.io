import { el } from '../util/dom.js';
import { rarityOf } from '../data/rarity.js';
import { drawFishIcon, fishVisualDetail } from '../render/drawFishIcon.js';
import { mutatedName } from '../data/mutations.js';

// The post-catch reveal card. Pure DOM (with a tiny canvas for the fish
// icon) so it can sit on top of the game canvas without touching world render code.
export function buildCatchCard(root) {
  const iconCanvas = el('canvas', { width: 96, height: 96, class: 'catch-card-icon' });
  const title = el('div', { class: 'catch-card-title' });
  const rarityLabel = el('div', { class: 'catch-card-rarity' });
  const stats = el('div', { class: 'catch-card-stats' });
  const badge = el('div', { class: 'catch-card-badge' });
  const hint = el('div', { class: 'catch-card-hint' }, 'Click to continue');

  const card = el('div', { class: 'catch-card' }, [iconCanvas, title, rarityLabel, stats, badge, hint]);
  const wrap = el('div', { class: 'catch-card-wrap hidden' }, [card]);
  root.appendChild(wrap);

  return { wrap, card, iconCanvas, title, rarityLabel, stats, badge };
}

export function updateCatchCard(refs, state) {
  const f = state.fishing;
  const show = f.state === 'result' && f.result && f.result.type === 'caught';
  if (!show) {
    refs.wrap.classList.add('hidden');
    return;
  }
  refs.wrap.classList.remove('hidden');

  const { fish, size, value, shiny, giant, chest, chestBonus, cleanBonus, bagFull, salvage, bottle, bottleMessage, firstCatch } = f.result;
  const rarity = rarityOf(fish.rarity);

  const cardColor = chest ? '#c9a227' : bottle ? '#8fb0c4' : shiny ? '#ffe066' : giant ? '#8fd4ff' : rarity.color;
  const cardGlow = chest ? '#ffe6a0' : bottle ? '#cfe4f0' : shiny ? '#fff7cc' : giant ? '#cfe9ff' : rarity.glow;
  refs.card.style.setProperty('--rarity-color', cardColor);
  refs.card.style.setProperty('--rarity-glow', cardGlow);
  refs.card.classList.toggle('shiny', !!shiny);
  refs.card.classList.toggle('giant', !!giant);

  const ctx = refs.iconCanvas.getContext('2d');
  ctx.clearRect(0, 0, 96, 96);
  const glow = ctx.createRadialGradient(48, 48, 4, 48, 48, 48);
  glow.addColorStop(0, cardGlow + '55');
  glow.addColorStop(1, cardGlow + '00');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, 96, 96);
  drawFishIcon(ctx, fish.shape, 48, 48, 68, fish.hue, fishVisualDetail(fish.id));

  refs.title.textContent = chest ? 'Sea Chest' : bottle ? 'Message in a Bottle' : mutatedName(fish.name, { shiny, giant });
  refs.rarityLabel.textContent = chest ? 'Treasure' : bottle ? 'Found at Sea' : rarity.label;
  refs.rarityLabel.style.color = cardColor;
  refs.stats.textContent = salvage
    ? 'Scrap · a piece of some old rig'
    : chest
    ? `You hauled up +${value}g!`
    : bottle
    ? `Finder's fee: +${value}g`
    : `Size ${size.toFixed(1)}  ·  Worth ${value}g`;

  let badgeText = '';
  if (salvage) badgeText = 'Bring it to the Blacksmith — he can build with these.';
  if (chest && chestBonus) badgeText += 'A real haul! ';
  if (bottle) badgeText += `"${bottleMessage}" `;
  if (firstCatch) badgeText += '🌅 First catch of the day — value doubled! ';
  if (shiny) badgeText += '✨ Shiny catch — worth 3x! ';
  if (giant) badgeText += '🐋 Giant catch — huge, and worth 2.2x! ';
  if (cleanBonus) badgeText += 'Clean reel bonus! ';
  if (bagFull) badgeText += 'Bag full — released, not kept.';
  refs.badge.textContent = badgeText.trim();
  refs.badge.classList.toggle('hidden', !badgeText.trim());
}
