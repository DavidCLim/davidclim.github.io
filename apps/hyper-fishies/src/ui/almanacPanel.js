import { el } from '../util/dom.js';
import { FISH } from '../data/fish.js';
import { rarityOf, RARITY_ORDER } from '../data/rarity.js';
import { drawFishIcon, fishVisualDetail } from '../render/drawFishIcon.js';
import { buildPanelFrame, replaceContent, closeOverlay } from './overlayShell.js';
import { mutatedName } from '../data/mutations.js';

// A real book has discrete leaves you turn, not one endless scroll — the
// fish grid is paginated at this many entries per page instead of dumping
// the entire, ever-growing roster onto one towering right page. Bumped from
// 12 to 16 alongside the rarity filter below — with the roster now at 200
// species, filtering down to one tier at a time is what actually makes
// paging through it reasonable; the bigger page size just means fewer
// clicks once you're looking at, say, the ~20-strong Common shelf instead
// of all 200 at once.
const PAGE_SIZE = 16;

const ROMAN_DIGITS = [[10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
function toRoman(n) {
  let out = '';
  for (const [value, symbol] of ROMAN_DIGITS) {
    while (n >= value) { out += symbol; n -= value; }
  }
  return out;
}

// The single biggest specimen ever landed in a given rarity tier, scanning
// every species that shares it — a tier can hold a dozen fish, but the
// Trophy Case only has room to mount the one you're proudest of.
function bestCatchForRarity(state, rarityId) {
  let best = null;
  for (const fish of FISH) {
    if (fish.rarity !== rarityId) continue;
    const entry = state.almanac[fish.id];
    if (!entry || !entry.caught) continue;
    if (!best || entry.biggestSize > best.size) {
      best = { fish, size: entry.biggestSize, shiny: entry.shinyCaught, giant: entry.giantCaught };
    }
  }
  return best;
}

// The almanac is laid out as a literal open book: a left page (cover +
// progress) and a right page (the fish grid, filterable/paginated — see
// PAGE_SIZE) either side of a shadowed spine, inside a frame that plays a
// "cover swinging open" animation each time it's shown (see .panel-book /
// @keyframes bookOpen in styles.css), with the right page itself doing a
// small settle-flip on every page turn (@keyframes pageFlip).
export function buildAlmanacPanel(state, backdrop, onChange) {
  const { frame, body } = buildPanelFrame("Captain's Log", () => { closeOverlay(state); onChange(); }, { book: true });
  let pageIndex = 0;
  let viewMode = 'log';
  // 'all' or a rarity id — narrows the right page's grid down to one shelf
  // at a time instead of paging through every rarity back to back. Reset to
  // page 1 whenever the filter (or sort) changes so you never land on a
  // now-empty page from a longer previous view.
  let rarityFilter = 'all';
  let sortMode = 'rarity'; // 'rarity' | 'az'

  // The Trophy Case: one line per rarity tier, rarest first, showing the
  // single biggest specimen you've ever landed in it — a "flex wall" that
  // reads at a glance, distinct from the exhaustive species grid. A Shiny
  // or Giant trophy gets the same gold/blue treatment those catches already
  // get everywhere else (Satchel, Trading Post), so a mounted rarity isn't
  // the only thing worth bragging about here.
  function buildTrophyList() {
    const tiers = [...RARITY_ORDER].reverse();
    let mounted = 0;
    const rows = tiers.map(rarityId => {
      const rarity = rarityOf(rarityId);
      const best = bestCatchForRarity(state, rarityId);
      if (best) mounted += 1;
      const canvas = el('canvas', { width: 44, height: 44, class: 'trophy-icon' });
      const ctx = canvas.getContext('2d');
      if (best) {
        const glow = ctx.createRadialGradient(22, 22, 2, 22, 22, 22);
        glow.addColorStop(0, rarity.glow + '55');
        glow.addColorStop(1, rarity.glow + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 44, 44);
        drawFishIcon(ctx, best.fish.shape, 22, 22, 32, best.fish.hue, fishVisualDetail(best.fish.id));
      } else {
        drawFishIcon(ctx, 'round', 22, 22, 32, '#000', { silhouette: true });
      }
      const mutTag = best && best.shiny ? ' trophy-shiny' : best && best.giant ? ' trophy-giant' : '';
      return el('div', { class: 'trophy-row' + (best ? mutTag : ' trophy-empty') }, [
        canvas,
        el('div', { class: 'trophy-row-info' }, [
          el('div', { class: 'trophy-row-name-line' }, [
            el('span', { class: 'book-rarity-dot', style: `background:${rarity.color}; box-shadow:0 0 6px ${rarity.color}99;` }),
            el('span', { class: 'trophy-row-name' }, best ? mutatedName(best.fish.name, best) : '??? — nothing landed yet'),
            best && best.shiny ? el('span', { class: 'trophy-mut-tag trophy-mut-shiny' }, '✨ Shiny') : null,
            best && best.giant ? el('span', { class: 'trophy-mut-tag trophy-mut-giant' }, '🐋 Giant') : null,
          ]),
          el('div', { class: 'trophy-row-meta' }, best ? `${rarity.label} · best ${best.size.toFixed(1)} in` : rarity.label),
        ]),
      ]);
    });
    return { rows, mounted, total: tiers.length };
  }

  function refresh() {
    const allSorted = sortMode === 'az'
      ? [...FISH].sort((a, b) => a.name.localeCompare(b.name))
      : [...FISH].sort((a, b) => RARITY_ORDER.indexOf(a.rarity) - RARITY_ORDER.indexOf(b.rarity) || a.name.localeCompare(b.name));
    const caughtCount = allSorted.filter(f => state.almanac[f.id].caught).length;

    const sorted = rarityFilter === 'all' ? allSorted : allSorted.filter(f => f.rarity === rarityFilter);
    const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
    pageIndex = Math.max(0, Math.min(pageIndex, pageCount - 1));
    const pageFish = sorted.slice(pageIndex * PAGE_SIZE, (pageIndex + 1) * PAGE_SIZE);

    const grid = el('div', { class: 'almanac-grid' }, pageFish.map(fish => {
      const entry = state.almanac[fish.id];
      const rarity = rarityOf(fish.rarity);
      const canvas = el('canvas', { width: 56, height: 56, class: 'almanac-icon' });
      const ctx = canvas.getContext('2d');
      if (entry.caught) {
        const glow = ctx.createRadialGradient(28, 28, 2, 28, 28, 28);
        glow.addColorStop(0, rarity.glow + '55');
        glow.addColorStop(1, rarity.glow + '00');
        ctx.fillStyle = glow;
        ctx.fillRect(0, 0, 56, 56);
        drawFishIcon(ctx, fish.shape, 28, 28, 40, fish.hue, fishVisualDetail(fish.id));
      } else {
        drawFishIcon(ctx, fish.shape, 28, 28, 40, '#000', { silhouette: true });
      }

      // Each discovered entry gets a wax-seal border/glow in its own
      // rarity's color instead of one flat tint for every fish — the grid
      // itself now reads as sorted-by-rarity at a glance, the way the
      // rarity-badge chip already did in text.
      const cellStyle = entry.caught ? `--cell-color:${rarity.color}; --cell-glow:${rarity.glow};` : '';
      return el('div', { class: 'almanac-cell' + (entry.caught ? ' discovered' : ' undiscovered'), style: cellStyle }, [
        canvas,
        el('div', { class: 'almanac-name', style: entry.caught ? `color:${rarity.color}` : '' }, entry.caught ? fish.name : '???'),
        el('div', { class: 'almanac-name-line' }, [
          el('span', {
            class: 'rarity-badge',
            style: `background:${rarity.color}2e; border-color:${rarity.color}; color:${rarity.color}`,
          }, rarity.label),
        ]),
        el('div', { class: 'almanac-meta' }, entry.caught ? `x${entry.count} · best ${entry.biggestSize.toFixed(1)}` : ''),
      ]);
    }));

    const pct = Math.round((caughtCount / allSorted.length) * 100);
    const byRarity = RARITY_ORDER.map(r => {
      const fishOfRarity = allSorted.filter(f => f.rarity === r);
      const caught = fishOfRarity.filter(f => state.almanac[f.id].caught).length;
      return { rarity: rarityOf(r), caught, total: fishOfRarity.length };
    });

    const logToggle = el('button', {
      class: 'book-view-toggle' + (viewMode === 'log' ? ' active' : ''),
      text: '📖 Log',
      onClick: () => { viewMode = 'log'; refresh(); },
    });
    const trophyToggle = el('button', {
      class: 'book-view-toggle' + (viewMode === 'trophies' ? ' active' : ''),
      text: '🏆 Trophies',
      onClick: () => { viewMode = 'trophies'; refresh(); },
    });

    const leftPage = el('div', { class: 'book-page book-page-left' }, [
      el('div', { class: 'book-page-watermark' }, '⚓'),
      el('div', { class: 'book-page-title' }, "Ship's Log"),
      el('div', { class: 'book-view-toggles' }, [logToggle, trophyToggle]),
      el('div', { class: 'book-page-rule' }),
      el('div', { class: 'book-summary-big' }, `${caughtCount} / ${allSorted.length}`),
      el('div', { class: 'book-summary-label' }, `species catalogued  ·  ${pct}%`),
      el('div', { class: 'book-progress' }, [
        el('div', { class: 'book-progress-fill', style: `width:${pct}%` }),
      ]),
      el('div', { class: 'book-rarity-list' }, byRarity.map(r => {
        const barPct = r.total > 0 ? Math.round((r.caught / r.total) * 100) : 0;
        const complete = r.total > 0 && r.caught >= r.total;
        return el('div', { class: 'book-rarity-row' }, [
          el('div', { class: 'book-rarity-row-top' }, [
            el('span', { class: 'book-rarity-dot', style: `background:${r.rarity.color}; box-shadow:0 0 6px ${r.rarity.color}99;` }),
            el('span', { class: 'book-rarity-name' }, r.rarity.label + (complete ? ' 🏅' : '')),
            el('span', { class: 'book-rarity-count' }, `${r.caught}/${r.total}`),
          ]),
          el('div', { class: 'book-rarity-bar' }, [
            el('div', { class: 'book-rarity-bar-fill', style: `width:${barPct}%; background:${r.rarity.color};` }),
          ]),
        ]);
      })),
      el('div', { class: 'book-page-number' }, 'I'),
    ]);

    const prevBtn = el('button', {
      class: 'book-nav-btn',
      text: '‹',
      disabled: pageIndex === 0 ? 'disabled' : undefined,
      onClick: () => { pageIndex -= 1; refresh(); },
    });
    const nextBtn = el('button', {
      class: 'book-nav-btn',
      text: '›',
      disabled: pageIndex >= pageCount - 1 ? 'disabled' : undefined,
      onClick: () => { pageIndex += 1; refresh(); },
    });

    // Rarity filter shelf — "All" plus one chip per tier, each carrying its
    // own caught/total so you can see a whole rarity's completion without
    // opening it. Picking one both filters the grid AND resets to page 1,
    // since a filter change almost always invalidates whatever page you
    // were sitting on under the old (usually longer) list.
    const filterChips = [{ id: 'all', label: 'All', color: null }, ...RARITY_ORDER.map(id => ({ id, label: rarityOf(id).label, color: rarityOf(id).color }))]
      .map(opt => {
        const r = opt.id === 'all' ? null : byRarity.find(b => b.rarity.id === opt.id);
        const countTag = opt.id === 'all' ? `${caughtCount}/${allSorted.length}` : `${r.caught}/${r.total}`;
        const active = rarityFilter === opt.id;
        return el('button', {
          class: 'almanac-filter-chip' + (active ? ' active' : ''),
          style: opt.color ? `--chip-color:${opt.color};` : '',
          onClick: () => { rarityFilter = opt.id; pageIndex = 0; refresh(); },
        }, [
          el('span', { class: 'almanac-filter-label' }, opt.label),
          el('span', { class: 'almanac-filter-count' }, countTag),
        ]);
      });

    const sortToggle = el('div', { class: 'almanac-sort-toggle' }, [
      el('button', {
        class: 'book-view-toggle' + (sortMode === 'rarity' ? ' active' : ''),
        text: 'Rarity',
        onClick: () => { sortMode = 'rarity'; pageIndex = 0; refresh(); },
      }),
      el('button', {
        class: 'book-view-toggle' + (sortMode === 'az' ? ' active' : ''),
        text: 'A–Z',
        onClick: () => { sortMode = 'az'; pageIndex = 0; refresh(); },
      }),
    ]);

    let rightPage;
    if (viewMode === 'trophies') {
      const trophies = buildTrophyList();
      rightPage = el('div', { class: 'book-page book-page-right' }, [
        el('div', { class: 'trophy-header' }, [
          el('div', { class: 'book-page-title', style: 'font-size:18px;' }, 'Trophy Case'),
          el('div', { class: 'trophy-mounted-count' }, `${trophies.mounted}/${trophies.total} mounted`),
        ]),
        el('div', { class: 'trophy-list' }, trophies.rows),
        el('div', { class: 'book-page-number' }, toRoman(pageIndex + 2)),
      ]);
    } else {
      rightPage = el('div', { class: 'book-page book-page-right' }, [
        el('div', { class: 'almanac-toolbar' }, [
          el('div', { class: 'almanac-filter-row' }, filterChips),
          sortToggle,
        ]),
        grid,
        el('div', { class: 'book-nav' }, [prevBtn, el('span', { class: 'book-nav-label' }, `Page ${pageIndex + 1} of ${pageCount}`), nextBtn]),
        el('div', { class: 'book-page-number' }, toRoman(pageIndex + 2)),
      ]);
    }

    replaceContent(body, [
      el('div', { class: 'book-spread' }, [leftPage, el('div', { class: 'book-spine' }), rightPage]),
    ]);
  }

  refresh();
  return { frame, refresh };
}
