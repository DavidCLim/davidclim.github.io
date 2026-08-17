import { WORLD_W, WORLD_H } from '../core/constants.js';
import { drawWater } from './drawWater.js';
import { drawPierPilings } from './drawPier.js';
import { drawBoardwalk } from './drawBoardwalk.js';
import { drawAmbientBackground, initAmbient, updateAmbient } from './ambientLife.js';
import { STALLS, PROPS, NPCS } from '../world/worldObjects.js';
import { SPOTS } from '../data/spots.js';
import { drawStall, drawProp } from './drawProps.js';
import { drawPlayer } from './drawPlayer.js';
import { drawMorris, drawMorrisBoat, drawLuca, drawNaia } from './drawNPC.js';
import { renderDockScene } from './drawDockScene.js';
import { drawBossScene } from './drawBossScene.js';
import { drawFx, drawScreenFlash, updateFx } from './particles.js';
import { equippedRod } from '../core/gameState.js';
import { regionById } from '../data/regions.js';
import { regionSceneryEntities } from './regionScenery.js';
import { drawWeatherOverlay } from './drawWeather.js';
import { drawDayNightOverlay } from './drawDayNight.js';

const MORRIS_BOAT_POS = { x: 248, y: 196 };

// The vignette's edge color leans toward the current region's water tint —
// one more small cue (on top of the water color and this atmosphere wash)
// that you're somewhere else, without needing unique art per destination.
function drawVignette(ctx, state) {
  const region = regionById(state.currentRegion);
  // Radii picked so the whole stall row (y=500, x from 340 to 810) sits
  // inside the clear inner circle no matter which stall it is — with the
  // old 0.35/0.85 radii the Trading Post (x:720, furthest from center) sat
  // much closer to the dark outer edge than Rod Shop/Tackle, so it alone
  // came out visibly darker/hazier ("translucent"-looking) purely because
  // of where it happens to sit on the dock, not any real transparency.
  const vignette = ctx.createRadialGradient(
    WORLD_W / 2, WORLD_H / 2, WORLD_H * 0.68,
    WORLD_W / 2, WORLD_H / 2, WORLD_H * 1.15
  );
  vignette.addColorStop(0, 'rgba(0,0,0,0)');
  vignette.addColorStop(1, (region.waterTint || '#01080c') + '9a');
  ctx.save();
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.restore();
}

// A soft flat wash in the region's signature color over the whole pier —
// same layout and props everywhere, but Tropical Island reads warm and
// teal, Dark Waters reads cold and murky, Abyssal Lands reads cyan-lit, etc.
function drawRegionAtmosphere(ctx, state) {
  const region = regionById(state.currentRegion);
  if (!region.ambientTint) return;
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = region.ambientTint;
  ctx.fillRect(0, 0, WORLD_W, WORLD_H);
  ctx.restore();
}

export function initRenderer(state) {
  initAmbient(state);
}

export function updateRender(state, dt) {
  updateAmbient(state, dt);
  updateFx(state, dt);
}

function drawSpotMarkers(ctx, state, t) {
  for (const spot of SPOTS) {
    const pulse = 0.5 + Math.sin(t * 2 + spot.x) * 0.15;
    ctx.save();
    ctx.globalAlpha = 0.28 * pulse;
    ctx.fillStyle = '#8fe9d9';
    ctx.beginPath();
    ctx.arc(spot.castOrigin.x, spot.castOrigin.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function renderWorldScene(ctx, state) {
  const region = regionById(state.currentRegion);
  drawWater(ctx, state);
  drawAmbientBackground(ctx, state);
  drawPierPilings(ctx, state.fx.time, region);
  drawBoardwalk(ctx, region);
  drawSpotMarkers(ctx, state, state.fx.time);

  const entities = [];
  for (const s of STALLS) entities.push({ y: s.y + s.h, draw: () => drawStall(ctx, s) });
  for (const p of PROPS) entities.push({ y: p.y, draw: () => drawProp(ctx, p, state.fx.time) });
  for (const e of regionSceneryEntities(state, state.fx.time)) entities.push({ y: e.y, draw: () => e.draw(ctx) });
  // Shopkeepers (anyone with a shopId) stay behind the counter, out of
  // sight, until you interact with their stand — Morris and Luca aren't
  // tied to a stall, so they both stand out in the open. `region` further
  // gates Luca to only ever render while actually in the Abyssal Lands.
  for (const n of NPCS) {
    if (n.region && n.region !== state.currentRegion) continue;
    if (n.visual === 'morris') {
      entities.push({ y: n.y, draw: () => drawMorris(ctx, n, state.fx.time) });
    } else if (n.visual === 'luca') {
      entities.push({ y: n.y, draw: () => drawLuca(ctx, n, state.fx.time, state.quests.luca.stage) });
    } else if (n.visual === 'naia') {
      entities.push({ y: n.y, draw: () => drawNaia(ctx, n, state.fx.time) });
    }
  }
  entities.push({ y: MORRIS_BOAT_POS.y, draw: () => drawMorrisBoat(ctx, MORRIS_BOAT_POS.x, MORRIS_BOAT_POS.y, state.fx.time) });
  entities.push({ y: state.player.y, draw: () => drawPlayer(ctx, state.player, equippedRod(state).material) });
  entities.sort((a, b) => a.y - b.y);
  for (const e of entities) e.draw();

  drawRegionAtmosphere(ctx, state);
}

export function render(ctx, state) {
  ctx.clearRect(0, 0, WORLD_W, WORLD_H);

  if (state.fishing.state === 'idle') {
    renderWorldScene(ctx, state);
  } else {
    renderDockScene(ctx, state);
  }

  if (state.boss && state.boss.state !== 'idle') {
    drawBossScene(ctx, state);
  }

  drawFx(ctx, state);
  drawWeatherOverlay(ctx, state);
  drawDayNightOverlay(ctx, state);
  drawScreenFlash(ctx, state, WORLD_W, WORLD_H);
  drawVignette(ctx, state);
}
