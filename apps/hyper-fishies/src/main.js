import { el } from './util/dom.js';
import { createCanvasSurface } from './core/canvas.js';
import { listSaveSlots, loadSlot, saveToSlot, createSlot, deleteSlot } from './core/save.js';
import { initInput, consumeActionEdge, consumeBossKeyEdge, consumeEscapeEdge } from './core/input.js';
import { updatePlayer } from './world/player.js';
import { findNearZone } from './world/zones.js';
import { startCharging, updateFishing } from './fishing/fishingMachine.js';
import { startBossEncounter, updateBossFight } from './fishing/bossFight.js';
import { acceptRichyQuest, acceptFinnQuest, acceptBarnabyQuest, acceptLucaQuest, completeLucaQuest, checkAchievements, ensureDailyBounties, ensureWeeklyChallenges, ensureHotCatch, ensureQuarry, checkDailyLogin, buyBait } from './economy/economy.js';
import { openOverlay, closeOverlay } from './ui/overlayShell.js';
import { showToast, updateToast } from './ui/toast.js';
import { buildHud, updateHud } from './ui/hud.js';
import { buildWeatherWheel, updateWeatherWheel } from './ui/weatherWheel.js';
import { buildDayNightClock, updateDayNightClock } from './ui/dayNightClock.js';
import { updateDayNight } from './world/dayNight.js';
import { buildCatchCard, updateCatchCard } from './ui/catchCard.js';
import { buildOverlays } from './ui/overlays.js';
import { initRenderer, updateRender, render } from './render/renderer.js';
import { sideViewBobber } from './render/drawDockScene.js';
import { drawMorrisAtDock, drawLucaPortrait, drawNaiaPortrait } from './render/drawNPC.js';
import { drawShopNpcAtStand } from './render/drawShopNPCs.js';
import { spawnRipple, spawnCatchBurst, spawnSplash, triggerScreenFlash } from './render/particles.js';
import { rarityOf, RARITY } from './data/rarity.js';
import { openDialogue, closeDialogue, buildDialoguePanel, updateDialoguePanel, PORTRAIT_W, PORTRAIT_H } from './ui/dialogue.js';
import { stepMatterWorld, createAxisSpring } from './util/matterWorld.js';
import { MORRIS_DIALOGUE, MORRIS_START } from './data/morrisDialogue.js';
import { SHOP_DIALOGUES } from './data/shopDialogues.js';
import { BLACKSMITH_DIALOGUE, BLACKSMITH_START } from './data/blacksmithDialogue.js';
import { LUCA_DIALOGUE, LUCA_START } from './data/lucaDialogue.js';
import { NAIA_DIALOGUE, NAIA_START, VOID_LURE_MAX_OWNED } from './data/naiaDialogue.js';
import { buildMapPanel } from './ui/mapPanel.js';
import { beginTravel, updateTravel } from './world/travel.js';
import { updateWeather } from './world/weather.js';
import { buildTravelScreen, updateTravelScreen } from './ui/travelScreen.js';
import { buildAlmanacButton } from './ui/almanacButton.js';
import { buildSatchelButton } from './ui/satchelButton.js';
import { buildProfileButton } from './ui/profileButton.js';
import { buildNotebookButton } from './ui/notebookButton.js';
import { buildAchievementsButton } from './ui/achievementsButton.js';
import { buildHelpButton } from './ui/helpButton.js';
import { buildSaveSlotScreen } from './ui/saveSlotScreen.js';
import { buildAvatarCustomizer } from './ui/avatarCustomizer.js';
import { NPCS, STALLS } from './world/worldObjects.js';
import { ensureAudioContext, playClick, setMusicEnabled, setSfxEnabled } from './audio/audioEngine.js';

const root = document.getElementById('game-root');

// Any click anywhere doubles as the user gesture browsers require before an
// AudioContext can make sound, and — if it landed on a real button — as the
// generic UI click SFX. Capture phase so this always runs before whatever
// the button's own onClick handler does (navigating screens, closing a
// panel, etc.), so the very first click of a session still unlocks audio
// in time for anything that click itself triggers.
document.addEventListener('click', (e) => {
  ensureAudioContext();
  if (e.target.closest && e.target.closest('button, .btn')) playClick();
}, true);

// The game proper only starts once a save slot has been picked or created
// (see showSlotScreen/showAvatarCustomizer below) — everything that used to
// run at module load now lives in startGame(state, slotIndex).
function startGame(state, slotIndex) {
  ensureDailyBounties(state);
  ensureWeeklyChallenges(state);
  ensureHotCatch(state);
  ensureQuarry(state);
  setMusicEnabled(state.settings.musicOn !== false);
  setSfxEnabled(state.settings.sfxOn !== false);
  const loginReward = checkDailyLogin(state);
  if (loginReward) {
    showToast(state, `Welcome back! Day ${loginReward.streak} login streak — +${loginReward.gold}g, +${loginReward.exp} EXP.`);
  }
  const surface = createCanvasSurface(root);
  initInput(state, surface, root);
  initRenderer(state);

  const hudRefs = buildHud(root);
  const weatherWheelRefs = buildWeatherWheel(root);
  const dayNightClockRefs = buildDayNightClock(root);
  const catchCardRefs = buildCatchCard(root);
  // Saves immediately, then does a full page reload rather than trying to
  // tear down the running rAF loop and every global listener initInput()
  // attached (window keydown/keyup/mouseup/blur, touch) — reload resets all
  // of that for free and the save already landed before it fires, so
  // nothing is lost.
  function quitToMenu() {
    saveToSlot(slotIndex, state);
    location.reload();
  }
  const overlaysUI = buildOverlays(root, state, () => { queueSave(); }, quitToMenu);
  const dialogueRefs = buildDialoguePanel(root);
  // A real matter.js spring (util/matterWorld.js), kicked every time the
  // dialogue node changes and then left to settle back to rest — the
  // "lively idle motion" the portraits react each new line with, on top of
  // their existing continuous idle sway.
  const dialoguePop = createAxisSpring({ stiffness: 0.15, damping: 0.2, frictionAir: 0.05 });
  let lastPortraitNodeId = null;
  const mapPanel = buildMapPanel(state, root, (regionId) => { beginTravel(state, regionId); });
  const travelRefs = buildTravelScreen(root);

  // Every HUD icon button opens its overlay through the same guard (idle,
  // nothing else already open) — a single helper instead of six copies of
  // the same three-line closure.
  function openPanelButton(kind) {
    if (state.fishing.state === 'idle' && !state.ui.activeOverlay) {
      openOverlay(state, kind);
      overlaysUI.update();
    }
  }

  // One flex toolbar (see .hud-toolbar) instead of six individually
  // absolute-positioned buttons — grouped Player (profile, satchel) ->
  // Records (notebook, captain's log) -> Meta (achievements, help), nearest
  // the screen center to nearest its corner. Buttons themselves no longer
  // carry their own position; a newly added one just joins the flex row,
  // so it can never silently land on top of an existing button the way a
  // missed `right:` offset used to.
  const toolbar = el('div', { class: 'hud-toolbar' });
  root.appendChild(toolbar);
  buildProfileButton(toolbar, () => openPanelButton('profile'));
  buildSatchelButton(toolbar, () => openPanelButton('satchel'));
  toolbar.appendChild(el('div', { class: 'hud-toolbar-divider' }));
  buildNotebookButton(toolbar, () => openPanelButton('notebook'));
  buildAlmanacButton(toolbar, () => openPanelButton('almanac'));
  toolbar.appendChild(el('div', { class: 'hud-toolbar-divider' }));
  buildAchievementsButton(toolbar, () => openPanelButton('achievements'));
  buildHelpButton(toolbar, () => openPanelButton('help'));

  const NPC_DIALOGUES = {
    morris: { tree: MORRIS_DIALOGUE, start: MORRIS_START },
    garrick: { tree: BLACKSMITH_DIALOGUE, start: BLACKSMITH_START },
    luca: { tree: LUCA_DIALOGUE, start: LUCA_START },
    naia: { tree: NAIA_DIALOGUE, start: NAIA_START },
    ...SHOP_DIALOGUES,
  };

  function openShop(s, shopId) {
    openOverlay(s, shopId);
    overlaysUI.update();
  }

  const dialogueHandlers = {
    openMap: (s) => { s.ui.mapOpen = true; s.ui.activeOverlay = 'map'; mapPanel.update(); },
    openRodShop: (s) => openShop(s, 'rodShop'),
    openTackle: (s) => openShop(s, 'tackle'),
    openMarket: (s) => openShop(s, 'market'),
    openRuneShop: (s) => openShop(s, 'runeShop'),
    openForge: (s) => openShop(s, 'forge'),
    acceptRichyQuest: (s) => {
      const result = acceptRichyQuest(s);
      if (result.ok) toast(`Quest accepted! Land ${s.quests.richy.goal} Legendary-or-better fish for Richy.`);
    },
    acceptFinnQuest: (s) => {
      const result = acceptFinnQuest(s);
      if (result.ok) toast(`Quest accepted! Land ${s.quests.finn.goal} Gargantuan-or-better fish for Finn.`);
    },
    acceptBarnabyQuest: (s) => {
      const result = acceptBarnabyQuest(s);
      if (result.ok) toast(`Quest accepted! Open ${s.quests.barnaby.goal} Sea Chests for B-LA-KA.`);
    },
    acceptLucaQuest: (s) => {
      const result = acceptLucaQuest(s);
      if (result.ok) toast(`Luca's counting on you — gather ${s.quests.luca.goal} cursed ingredients from these waters.`);
    },
    completeLucaQuest: (s) => {
      const result = completeLucaQuest(s);
      if (!result.ok) return;
      let msg = "The Cleansing Rune took hold — Luca's himself again. He presses gold and the Devil's Rod on you in thanks — it's yours now, equip it from your Satchel.";
      if (result.expResult && result.expResult.leveledUp) {
        msg += result.expResult.rankedUp
          ? ` Level up! ${result.expResult.rank.label} now — level ${result.expResult.level}.`
          : ` Level up! Level ${result.expResult.level}.`;
      }
      toast(msg);
    },
    buyVoidLure: (s) => {
      if ((s.bait.owned.voidLure || 0) >= VOID_LURE_MAX_OWNED) {
        toast("Naia: \"Use the one you've got first.\"");
        return;
      }
      const result = buyBait(s, 'voidLure', 1);
      toast(result.ok ? 'Bought a Voidsong Lure — equip it from your Satchel.' : 'Not enough gold for that.');
    },
  };

  function drawDialoguePortrait(ctx, w, h, pop) {
    const dlg = state.ui.dialogue;
    if (!dlg) return;
    if (dlg.npcId === 'morris') { drawMorrisAtDock(ctx, w, h, state.fx.time, pop); return; }
    if (dlg.npcId === 'luca') { drawLucaPortrait(ctx, w, h, state.fx.time, state.quests.luca.stage, pop); return; }
    if (dlg.npcId === 'naia') { drawNaiaPortrait(ctx, w, h, state.fx.time, pop); return; }
    const npc = NPCS.find(n => n.id === dlg.npcId);
    if (!npc) return;
    const stall = STALLS.find(s => s.id === npc.shopId) || {};
    drawShopNpcAtStand(ctx, w, h, npc.visual, stall, state.fx.time, pop);
  }

  function toast(msg) { showToast(state, msg); }

  let saveTimer = 0;
  function queueSave() { saveTimer = 0.4; }

  // Tracks the bobber's own nibbleActive flag frame-to-frame — unlike the
  // other effects here there's no clean fishing.state transition to key
  // off (a nibble toggles a flag within the same 'waiting' state), so this
  // closure var stands in for one.
  let prevNibbleActive = false;
  // A slow, quiet drip of ripples while the bobber just sits there waiting
  // for a bite — otherwise the water around it is dead still for however
  // many seconds pass between nibbles, which reads as static rather than
  // "floating on open water."
  let idleRippleTimer = 0;

  function applyFishingTransitionEffects(prevState, dt) {
    const f = state.fishing;

    if (prevState === 'flying' && f.state === 'waiting') {
      const pos = sideViewBobber(f);
      spawnRipple(state, pos.x, pos.y, 1.3);
      spawnSplash(state, pos.x, pos.y, true);
      idleRippleTimer = 0;
    }

    if (f.state === 'waiting' && !f.nibbleActive) {
      idleRippleTimer += dt;
      if (idleRippleTimer >= 1.6) {
        idleRippleTimer = 0;
        const pos = sideViewBobber(f);
        spawnRipple(state, pos.x, pos.y, 0.55);
      }
    }

    const nibbleNow = f.state === 'waiting' && f.nibbleActive;
    if (nibbleNow && !prevNibbleActive) {
      const pos = sideViewBobber(f);
      spawnSplash(state, pos.x, pos.y, false);
    }
    prevNibbleActive = nibbleNow;

    if (prevState === 'reeling' && f.state === 'result' && f.result) {
      const pos = sideViewBobber(f);
      if (f.result.type === 'caught') {
        const rarity = rarityOf(f.result.fish.rarity);
        // A Shiny (data/mutations.js) gets the same flourish as a Legendary+
        // catch regardless of its actual rarity — it's a second, independent
        // kind of lucky, and should read as one just as loudly. A Sea Chest
        // (data/seaChest.js) gets it too, gold instead of glow-colored.
        // Reduce Effects (state.settings, toggled from the Help panel)
        // caps every burst to the small size and skips the screen flash
        // entirely, for anyone sensitive to flashing/motion.
        const big = (rarity.rank >= RARITY.legendary.rank || f.result.shiny || f.result.chest) && !state.settings.reduceEffects;
        spawnCatchBurst(state, pos.x, pos.y, f.result.chest ? '#ffe6a0' : f.result.shiny ? '#ffe066' : rarity.glow, big);
        if (big) triggerScreenFlash(state, pos.x, pos.y);
        let caughtMsg;
        if (f.result.chest) caughtMsg = `⚓ You reeled up a Sea Chest — +${f.result.value}g!`;
        else if (f.result.bottle) caughtMsg = `📜 Message in a Bottle — a finder's fee of +${f.result.value}g.`;
        else if (f.result.salvage) caughtMsg = `🔧 Fished up a ${f.result.fish.name} instead of a bite.`;
        else if (f.result.shiny) caughtMsg = `✨ SHINY! Caught a ${rarity.label} ${f.result.fish.name}!`;
        else caughtMsg = `Caught a ${rarity.label} ${f.result.fish.name}!`;
        toast(f.result.questNote ? `${caughtMsg} ${f.result.questNote}` : caughtMsg);
        queueSave();
      } else if (f.result.type === 'snapped') {
        spawnRipple(state, pos.x, pos.y, 1.6);
        spawnSplash(state, pos.x, pos.y, true);
        queueSave();
      }
    }
  }

  let last = performance.now();
  function frame(now) {
    let dt = (now - last) / 1000;
    last = now;
    dt = Math.min(dt, 0.05);

    stepMatterWorld(dt);

    const actionEdge = consumeActionEdge(state.input);
    const actionDown = state.input.actionDown;
    const bossKeyEdge = consumeBossKeyEdge(state.input);

    // Escape is a universal backstop: whatever dialogue or panel is open,
    // one press closes it, independent of that panel's own close button or
    // dialogue reaching an 'end' node. Skipped during a boss fight, which
    // has its own dedicated flow. Without this, any dialogue/panel that for
    // whatever reason fails to render its close path leaves the player
    // stuck with movement locked (world/player.js gates movement on
    // state.ui.activeOverlay) and no way back — this is the one way out
    // that doesn't depend on any single panel working correctly.
    if (consumeEscapeEdge(state.input) && !(state.boss && state.boss.state !== 'idle')) {
      if (state.ui.dialogue) {
        closeDialogue(state);
      } else if (state.ui.activeOverlay) {
        closeOverlay(state);
        state.ui.mapOpen = false;
      }
    }

    updatePlayer(state, dt);
    updateWeather(state, dt, toast);
    updateDayNight(state, dt, toast);

    // Active Brew (data/potions.js) counts down only while actually
    // playing — ticks here alongside weather rather than in economy.js,
    // which only ever mutates in response to a discrete action, never a
    // per-frame dt.
    if (state.activePotion.id && state.activePotion.timeLeft > 0) {
      state.activePotion.timeLeft = Math.max(0, state.activePotion.timeLeft - dt);
      if (state.activePotion.timeLeft === 0) {
        toast('Your brew has worn off.');
        state.activePotion.id = null;
      }
    }

    const arrivedRegion = updateTravel(state, dt);
    if (arrivedRegion) {
      toast(`Arrived at ${arrivedRegion.name}.`);
      queueSave();
    }

    const bossActive = state.boss && state.boss.state !== 'idle';
    if (bossActive) {
      updateBossFight(state, dt, actionEdge, toast);
      state.ui.nearZone = null;
      // Debounced autosave settles once the fight ends (victory/escape
      // both leave state.boss back at 'idle'), picking up the almanac/
      // coins/bag changes from a win without saving mid-fight.
      queueSave();
    } else if (state.ui.activeOverlay) {
      state.ui.nearZone = null;
    } else if (state.fishing.state !== 'idle') {
      // The Bonasaur boss encounter is disabled for now — its Z-key trigger
      // was removed from core/input.js, so bossKeyEdge never fires and
      // startBossEncounter is unreachable. All the boss code (this branch,
      // fishing/bossFight.js, render/drawBossScene.js, render/drawMosasaurus.js)
      // is left in place, just dormant, in case it comes back later.
      if (bossKeyEdge && state.fishing.state === 'waiting') {
        startBossEncounter(state);
      } else {
        const prevState = state.fishing.state;
        updateFishing(state, dt, actionDown, actionEdge, toast);
        applyFishingTransitionEffects(prevState, dt);
      }
    } else {
      state.ui.nearZone = findNearZone(state.player.x, state.player.y, state.currentRegion);
      if (actionEdge && state.ui.nearZone) {
        const zone = state.ui.nearZone;
        if (zone.kind === 'spot') {
          startCharging(state, zone.id);
        } else if (zone.kind === 'npc') {
          const convo = NPC_DIALOGUES[zone.id];
          if (convo) {
            openDialogue(state, { npcId: zone.id, npcLabel: zone.data.label, tree: convo.tree, startNode: convo.start });
          }
        }
      }
    }

    if (checkAchievements(state, toast)) {
      // A gold confetti burst + screen flash right at the player — the same
      // "big catch" flourish a Legendary+ fish gets (applyFishingTransitionEffects
      // above), so landing a milestone reads as just as big a deal. Reduce
      // Effects (state.settings) shrinks the burst and skips the flash.
      spawnCatchBurst(state, state.player.x, state.player.y, '#ffd670', !state.settings.reduceEffects);
      if (!state.settings.reduceEffects) triggerScreenFlash(state, state.player.x, state.player.y);
      queueSave();
    }
    updateToast(state, dt);
    updateRender(state, dt);
    render(surface.ctx, state);
    updateHud(hudRefs, state);
    updateWeatherWheel(weatherWheelRefs, state);
    updateDayNightClock(dayNightClockRefs, state);
    updateCatchCard(catchCardRefs, state);
    overlaysUI.update();
    updateDialoguePanel(dialogueRefs, state, dialogueHandlers, () => queueSave());
    if (state.ui.dialogue) {
      if (state.ui.dialogue.nodeId !== lastPortraitNodeId) {
        lastPortraitNodeId = state.ui.dialogue.nodeId;
        dialoguePop.kick(6);
      }
      drawDialoguePortrait(dialogueRefs.portrait.getContext('2d'), PORTRAIT_W, PORTRAIT_H, dialoguePop.value);
    } else if (lastPortraitNodeId !== null) {
      lastPortraitNodeId = null;
      dialoguePop.reset();
    }
    mapPanel.update();
    updateTravelScreen(travelRefs, state);

    if (saveTimer > 0) {
      saveTimer -= dt;
      if (saveTimer <= 0) saveToSlot(slotIndex, state);
    }

    requestAnimationFrame(frame);
  }

  window.addEventListener('beforeunload', () => saveToSlot(slotIndex, state));
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') saveToSlot(slotIndex, state);
  });

  requestAnimationFrame(frame);
}

function showSlotScreen() {
  const screen = buildSaveSlotScreen(root, {
    initialSlots: listSaveSlots(),
    onPlay: (index) => {
      const state = loadSlot(index);
      screen.destroy();
      startGame(state, index);
    },
    onNew: (index) => {
      screen.destroy();
      showAvatarCustomizer(index);
    },
    onDelete: (index) => {
      deleteSlot(index);
      screen.refresh(listSaveSlots());
    },
  });
}

function showAvatarCustomizer(index) {
  const screen = buildAvatarCustomizer(root, {
    onConfirm: (avatar, name) => {
      const state = createSlot(index, avatar, name);
      screen.destroy();
      startGame(state, index);
    },
    onBack: () => {
      screen.destroy();
      showSlotScreen();
    },
  });
}

showSlotScreen();
