import { el, clearChildren } from '../util/dom.js';

// Generic Forge-style branching dialogue box: NPC name + line up top,
// a stack of clickable reply buttons below — the player always picks a
// reply rather than pressing through with a single "next" button. Data
// is a plain node graph (see data/morrisDialogue.js); this module knows
// nothing about Morris specifically.
export function openDialogue(state, { npcId, npcLabel, tree, startNode }) {
  state.ui.dialogue = { npcId, npcLabel, tree, nodeId: startNode };
  state.ui.activeOverlay = 'dialogue';
}

export function closeDialogue(state) {
  state.ui.dialogue = null;
  if (state.ui.activeOverlay === 'dialogue') state.ui.activeOverlay = null;
}

function resolveNext(next, state) {
  return typeof next === 'function' ? next(state) : next;
}

function visibleOptions(node, state) {
  return (node.options || []).filter(o => !o.when || o.when(state));
}

// `handlers` maps action names (from data nodes) to functions run with
// (state). Actions always end the conversation once handled.
export function selectDialogueOption(state, option, handlers) {
  const dlg = state.ui.dialogue;
  if (!dlg) return;

  const npcProgress = state.npc[dlg.npcId];
  if (npcProgress) npcProgress.talkCount += 1;

  if (option.action) {
    const handler = handlers && handlers[option.action];
    closeDialogue(state);
    if (handler) handler(state);
    return;
  }

  if (option.next) {
    const nextId = resolveNext(option.next, state);
    const nextNode = dlg.tree[nextId];
    if (!nextNode || visibleOptions(nextNode, state).length === 0) {
      closeDialogue(state);
      return;
    }
    dlg.nodeId = nextId;
    return;
  }

  closeDialogue(state);
}

export const PORTRAIT_W = 560;
export const PORTRAIT_H = 270;

export function buildDialoguePanel(root) {
  const portrait = el('canvas', { width: PORTRAIT_W, height: PORTRAIT_H, class: 'dialogue-portrait' });
  const name = el('div', { class: 'dialogue-name' });
  const text = el('div', { class: 'dialogue-text' });
  const options = el('div', { class: 'dialogue-options' });

  const box = el('div', { class: 'dialogue-box' }, [
    portrait,
    el('div', { class: 'dialogue-main' }, [name, text, options]),
  ]);
  const wrap = el('div', { class: 'dialogue-wrap hidden' }, [box]);
  root.appendChild(wrap);

  return { wrap, portrait, name, text, options, lastNodeId: null };
}

// Only rebuilds the DOM when the dialogue node actually changes. This is
// called every frame from main.js — rebuilding the reply buttons on every
// call (even when nothing changed) would destroy and recreate them mid
// click-gesture, which makes them impossible to click.
//
// The portrait itself is deliberately *not* drawn here — it needs to keep
// redrawing every frame the whole time the box is open (idle sway, the
// spring-driven reaction pop on each new line — see main.js's
// drawDialoguePortrait/Spring), not just once when the node changes, so
// main.js owns that redraw loop directly and calls this purely for the
// text/button DOM.
export function updateDialoguePanel(refs, state, handlers, onChange) {
  const dlg = state.ui.dialogue;
  if (!dlg) {
    refs.wrap.classList.add('hidden');
    refs.lastNodeId = null;
    return;
  }
  refs.wrap.classList.remove('hidden');

  if (dlg.nodeId === refs.lastNodeId) return;
  refs.lastNodeId = dlg.nodeId;

  const node = dlg.tree[dlg.nodeId];
  refs.name.textContent = dlg.npcLabel;
  refs.text.textContent = typeof node.text === 'function' ? node.text(state) : node.text;

  clearChildren(refs.options);
  for (const option of visibleOptions(node, state)) {
    refs.options.appendChild(el('button', {
      class: 'dialogue-option',
      text: option.label,
      onClick: () => {
        selectDialogueOption(state, option, handlers);
        updateDialoguePanel(refs, state, handlers, onChange);
        if (onChange) onChange();
      },
    }));
  }
}
