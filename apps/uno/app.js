const modeMeta = {
  classic: { label: "Classic", colors: ["red", "yellow", "green", "blue"], handSize: 7, forceDrawUntilPlayable: false, mercyLimit: null },
  mercy: { label: "No Mercy", colors: ["red", "yellow", "green", "blue"], handSize: 7, forceDrawUntilPlayable: true, mercyLimit: 25 },
  flip: { label: "Flip", colors: ["red", "yellow", "green", "blue"], darkColors: ["teal", "orange", "pink", "purple"], handSize: 7, forceDrawUntilPlayable: false, mercyLimit: null },
};

const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const state = { deck: [], discard: [], playerHand: [], computerHand: [], currentColor: "red", turn: "player", awaitingColor: null, gameOver: false, mode: "classic", difficulty: "medium", flipSide: "light" };
const els = {
  computerCount: document.querySelector("#computer-count"),
  playerCount: document.querySelector("#player-count"),
  currentColor: document.querySelector("#current-color"),
  gameMode: document.querySelector("#game-mode"),
  computerHand: document.querySelector("#computer-hand"),
  playerHand: document.querySelector("#player-hand"),
  discardCard: document.querySelector("#discard-card"),
  drawCard: document.querySelector("#draw-card"),
  newGame: document.querySelector("#new-game"),
  turnHeading: document.querySelector("#turn-heading"),
  message: document.querySelector("#message"),
  colorPicker: document.querySelector("#color-picker"),
  winModal: document.querySelector("#win-modal"),
  winButton: document.querySelector("#win-button"),
  modePicker: document.querySelector("#mode-picker"),
  difficultyPicker: document.querySelector("#difficulty-picker"),
};

function face(color, value, type) {
  return { color, value, type };
}

function flipCard(light, dark) {
  return { light, dark, flip: true };
}

function cardFace(card) {
  return card && card.flip ? card[state.flipSide] : card;
}

function activeColors() {
  return state.mode === "flip" && state.flipSide === "dark" ? modeMeta.flip.darkColors : modeMeta[state.mode].colors;
}

function createDeck() {
  if (state.mode === "flip") return createFlipDeck();
  if (state.mode === "mercy") return createMercyDeck();
  return createClassicDeck();
}

function createClassicDeck() {
  const deck = [];
  modeMeta.classic.colors.forEach((color) => {
    numbers.forEach((value) => deck.push(face(color, value, "number")));
    numbers.slice(1).forEach((value) => deck.push(face(color, value, "number")));
    ["skip", "reverse", "draw2"].forEach((value) => addPair(deck, color, value));
  });
  addWilds(deck, ["wild", "wild4"], 4);
  return shuffle(deck);
}

function createMercyDeck() {
  const deck = [];
  modeMeta.mercy.colors.forEach((color) => {
    numbers.forEach((value) => deck.push(face(color, value, "number")));
    numbers.slice(1).forEach((value) => deck.push(face(color, value, "number")));
    ["skip", "reverse", "draw2", "draw4", "discardAll", "skipAll"].forEach((value) => addPair(deck, color, value));
  });
  addWilds(deck, ["wild", "wild6", "wild10", "roulette"], 4);
  return shuffle(deck);
}

function createFlipDeck() {
  const deck = [];
  modeMeta.flip.colors.forEach((lightColor, index) => {
    const darkColor = modeMeta.flip.darkColors[index];
    numbers.slice(1).forEach((value) => {
      deck.push(flipCard(face(lightColor, value, "number"), face(darkColor, value, "number")));
      deck.push(flipCard(face(lightColor, value, "number"), face(darkColor, value, "number")));
    });
    ["skip", "reverse", "draw1", "flip"].forEach((value) => {
      deck.push(flipCard(face(lightColor, value, "action"), face(darkColor, darkAction(value), "action")));
      deck.push(flipCard(face(lightColor, value, "action"), face(darkColor, darkAction(value), "action")));
    });
  });
  for (let index = 0; index < 4; index += 1) {
    deck.push(flipCard(face("wild", "wild", "wild"), face("wild", "wild", "wild")));
    deck.push(flipCard(face("wild", "wild2", "wild"), face("wild", "wildColor", "wild")));
  }
  return shuffle(deck);
}

function darkAction(value) {
  if (value === "draw1") return "draw5";
  if (value === "skip") return "skipAll";
  return value;
}

function addPair(deck, color, value) {
  deck.push(face(color, value, "action"));
  deck.push(face(color, value, "action"));
}

function addWilds(deck, values, count) {
  values.forEach((value) => {
    for (let index = 0; index < count; index += 1) deck.push(face("wild", value, "wild"));
  });
}

function shuffle(cards) {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function startGame() {
  const meta = modeMeta[state.mode];
  Object.assign(state, { deck: createDeck(), discard: [], playerHand: [], computerHand: [], turn: "player", awaitingColor: null, gameOver: false, flipSide: "light" });
  els.winModal.hidden = true;
  for (let index = 0; index < meta.handSize; index += 1) {
    drawOne(state.playerHand);
    drawOne(state.computerHand);
  }
  let firstCard = drawOne(state.discard);
  while (firstCard && cardFace(firstCard).type !== "number") {
    state.deck.unshift(state.discard.pop());
    state.deck = shuffle(state.deck);
    firstCard = drawOne(state.discard);
  }
  state.currentColor = cardFace(firstCard).color;
  setMessage("Your turn", modeHelpText());
  render();
}

function modeHelpText() {
  if (state.mode === "mercy") return "No Mercy is active: draw until playable, 0/7 swap hands, and 25 cards means elimination.";
  if (state.mode === "flip") return "UNO Flip is active: Flip cards switch every card to its other side.";
  return "Play a matching color, number, or action card.";
}

function drawOne(hand) {
  if (state.deck.length === 0) refillDeck();
  const card = state.deck.pop();
  if (card) hand.push(card);
  return card;
}

function drawMany(hand, total) {
  for (let index = 0; index < total; index += 1) drawOne(hand);
}

function drawUntilPlayable(hand) {
  let drawn = 0;
  let card;
  do {
    card = drawOne(hand);
    drawn += card ? 1 : 0;
  } while (card && !canPlay(card) && state.deck.length > 0 && drawn < 40);
  return { card, drawn };
}

function drawUntilColor(hand, color) {
  let drawn = 0;
  let card;
  do {
    card = drawOne(hand);
    drawn += card ? 1 : 0;
  } while (card && cardFace(card).color !== color && cardFace(card).color !== "wild" && state.deck.length > 0 && drawn < 40);
  return drawn;
}

function refillDeck() {
  const topCard = state.discard.pop();
  state.deck = shuffle(state.discard);
  state.discard = topCard ? [topCard] : [];
}

function topDiscard() {
  return state.discard[state.discard.length - 1];
}

function canPlay(card) {
  const top = cardFace(topDiscard());
  const current = cardFace(card);
  return current.color === "wild" || current.color === state.currentColor || current.value === top.value;
}

function handlePlayerCard(cardIndex) {
  if (state.turn !== "player" || state.gameOver || state.awaitingColor) return;
  const card = state.playerHand[cardIndex];
  const current = cardFace(card);
  if (!canPlay(card)) {
    setMessage("Not playable", "Match the current color, match the card value, or play a wild card.");
    return;
  }
  if (current.color === "wild") {
    state.awaitingColor = { hand: state.playerHand, cardIndex };
    setMessage("Choose a color", "Pick the color that should continue after your wild card.");
    render();
    return;
  }
  playCard(state.playerHand, cardIndex);
  afterPlayerMove(current);
}

function handleColorPick(color) {
  if (!state.awaitingColor) return;
  const { hand, cardIndex } = state.awaitingColor;
  state.awaitingColor = null;
  playCard(hand, cardIndex, color);
  afterPlayerMove(cardFace(topDiscard()));
}

function playCard(hand, cardIndex, chosenColor) {
  const [card] = hand.splice(cardIndex, 1);
  const current = cardFace(card);
  state.discard.push(card);
  state.currentColor = current.color === "wild" ? chosenColor : current.color;
  applyCardEffect(current, hand === state.playerHand ? "player" : "computer");
}

function applyCardEffect(card, player) {
  const opponentHand = player === "player" ? state.computerHand : state.playerHand;
  const ownHand = player === "player" ? state.playerHand : state.computerHand;
  if ((card.value === "0" || card.value === "7") && state.mode === "mercy") swapHands();
  if (card.value === "discardAll") discardAllColor(ownHand, card.color);
  if (card.value === "flip") {
    state.flipSide = state.flipSide === "light" ? "dark" : "light";
    const top = cardFace(topDiscard());
    state.currentColor = top.color === "wild" ? pickBestColor(ownHand) : top.color;
  }
  if (card.value === "roulette") {
    const targetColor = player === "player" ? pickBestColor(opponentHand) : pickBestColor(ownHand);
    const drawn = drawUntilColor(opponentHand, targetColor);
    state.currentColor = targetColor;
    setMessage(player === "player" ? "Color roulette" : "Your turn", `${player === "player" ? "Computer" : "You"} drew ${drawn} card${drawn === 1 ? "" : "s"} looking for ${targetColor}.`);
  }
  if (card.value === "wildColor") {
    const drawn = drawUntilColor(opponentHand, state.currentColor);
    setMessage(player === "player" ? "Wild Draw Color" : "Your turn", `${player === "player" ? "Computer" : "You"} drew ${drawn} card${drawn === 1 ? "" : "s"} looking for ${state.currentColor}.`);
  }
  const drawTotal = drawCount(card.value);
  if (drawTotal > 0) drawMany(opponentHand, drawTotal);
  state.turn = keepsTurn(card.value) ? player : player === "player" ? "computer" : "player";
}

function drawCount(value) {
  return { draw1: 1, draw2: 2, draw4: 4, wild2: 2, wild4: 4, wild6: 6, wild10: 10, draw5: 5 }[value] || 0;
}

function keepsTurn(value) {
  return ["skip", "reverse", "skipAll", "draw1", "draw2", "draw4", "wild2", "wild4", "wild6", "wild10", "draw5", "wildColor", "roulette"].includes(value);
}

function swapHands() {
  const player = state.playerHand;
  state.playerHand = state.computerHand;
  state.computerHand = player;
}

function discardAllColor(hand, color) {
  const toDiscard = [];
  for (let index = hand.length - 1; index >= 0; index -= 1) {
    if (cardFace(hand[index]).color === color) toDiscard.push(hand.splice(index, 1)[0]);
  }
  state.discard.push(...toDiscard.reverse());
}

function afterPlayerMove(card) {
  if (checkWinner()) return;
  if (state.turn === "player") {
    setMessage("Your turn again", `${cardLabel(card)} gives you another turn.`);
    render();
    return;
  }
  setMessage("Computer turn", "The computer is thinking.");
  render();
  window.setTimeout(computerTurn, 650);
}

function computerTurn() {
  if (state.gameOver) return;
  const cardIndex = chooseComputerCardIndex();
  if (cardIndex === -1) {
    if (modeMeta[state.mode].forceDrawUntilPlayable) {
      const result = drawUntilPlayable(state.computerHand);
      if (result.card && canPlay(result.card)) playComputerCard(state.computerHand.length - 1);
      else {
        state.turn = "player";
        setMessage("Your turn", `The computer drew ${result.drawn} card${result.drawn === 1 ? "" : "s"} and passed.`);
      }
    } else {
      const card = drawOne(state.computerHand);
      if (card && canPlay(card)) playComputerCard(state.computerHand.length - 1);
      else {
        state.turn = "player";
        setMessage("Your turn", "The computer drew a card and passed.");
      }
    }
  } else {
    playComputerCard(cardIndex);
  }
  if (!checkWinner()) render();
}

function chooseComputerCardIndex() {
  const playable = state.computerHand.map((card, index) => ({ card, index, face: cardFace(card) })).filter(({ card }) => canPlay(card));
  if (playable.length === 0) return -1;
  if (state.difficulty === "easy") return playable[Math.floor(Math.random() * playable.length)].index;
  playable.sort((a, b) => cardScore(b.face) - cardScore(a.face));
  if (state.difficulty === "medium") return playable[Math.min(1, playable.length - 1)].index;
  return playable[0].index;
}

function cardScore(card) {
  if (card.color === "wild") return 80 + drawCount(card.value);
  if (drawCount(card.value) > 0) return 60 + drawCount(card.value);
  if (["skip", "reverse", "skipAll", "discardAll", "flip", "roulette"].includes(card.value)) return 45;
  return Number(card.value) || 10;
}

function playComputerCard(cardIndex) {
  const card = state.computerHand[cardIndex];
  const current = cardFace(card);
  playCard(state.computerHand, cardIndex, current.color === "wild" ? pickBestColor(state.computerHand) : undefined);
  if (state.turn === "computer") {
    setMessage("Computer turn again", `The computer played ${cardLabel(current)} and gets another turn.`);
    render();
    window.setTimeout(computerTurn, 650);
  } else {
    setMessage("Your turn", `The computer played ${cardLabel(current)}.`);
  }
}

function pickBestColor(hand) {
  const counts = activeColors().map((color) => ({ color, total: hand.filter((card) => cardFace(card).color === color).length }));
  counts.sort((a, b) => b.total - a.total);
  return counts[0].color;
}

function handleDraw() {
  if (state.turn !== "player" || state.gameOver || state.awaitingColor) return;
  if (modeMeta[state.mode].forceDrawUntilPlayable) {
    const result = drawUntilPlayable(state.playerHand);
    if (result.card && canPlay(result.card)) setMessage("Playable card drawn", `You drew ${result.drawn} card${result.drawn === 1 ? "" : "s"}. You can play the last one now.`);
    else {
      state.turn = "computer";
      setMessage("Computer turn", `You drew ${result.drawn} card${result.drawn === 1 ? "" : "s"} and passed.`);
      window.setTimeout(computerTurn, 650);
    }
  } else {
    const card = drawOne(state.playerHand);
    if (card && canPlay(card)) setMessage("You drew a playable card", "You can play it now, or choose another playable card.");
    else {
      state.turn = "computer";
      setMessage("Computer turn", "You drew a card and passed.");
      window.setTimeout(computerTurn, 650);
    }
  }
  render();
}

function checkWinner() {
  const mercyLimit = modeMeta[state.mode].mercyLimit;
  if (state.playerHand.length === 0 || (mercyLimit && state.computerHand.length >= mercyLimit)) {
    state.gameOver = true;
    setMessage("You win", state.playerHand.length === 0 ? "Nicely played. Click the popup to close it." : "No Mercy rule: the computer hit 25 cards.");
    els.winModal.hidden = false;
    render();
    return true;
  }
  if (state.computerHand.length === 0 || (mercyLimit && state.playerHand.length >= mercyLimit)) {
    state.gameOver = true;
    setMessage("Computer wins", state.computerHand.length === 0 ? "Close one. Start a new game and try again." : "No Mercy rule: you hit 25 cards.");
    render();
    return true;
  }
  return false;
}

function render() {
  const top = cardFace(topDiscard());
  const modeLabel = state.mode === "flip" ? `${modeMeta.flip.label} (${state.flipSide})` : modeMeta[state.mode].label;
  els.computerCount.textContent = `${state.computerHand.length} card${state.computerHand.length === 1 ? "" : "s"}`;
  els.playerCount.textContent = `${state.playerHand.length} card${state.playerHand.length === 1 ? "" : "s"}`;
  els.currentColor.textContent = titleCase(state.currentColor);
  els.gameMode.textContent = modeLabel;
  els.discardCard.className = `card ${top.color === "wild" ? state.currentColor : top.color} ${top.type === "number" ? "number-card" : ""}`;
  els.discardCard.innerHTML = cardMarkup(top);
  els.computerHand.innerHTML = "";
  state.computerHand.forEach(() => {
    const card = document.createElement("div");
    card.className = "card-back";
    card.innerHTML = cardBackMarkup();
    els.computerHand.append(card);
  });
  els.playerHand.innerHTML = "";
  state.playerHand.forEach((card, index) => {
    const current = cardFace(card);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "player-card";
    button.disabled = state.turn !== "player" || state.gameOver || state.awaitingColor || !canPlay(card);
    button.setAttribute("aria-label", `Play ${cardLabel(current)}`);
    button.innerHTML = `<div class="card ${current.color} ${current.type === "number" ? "number-card" : ""}">${cardMarkup(current)}</div>`;
    button.addEventListener("click", () => handlePlayerCard(index));
    els.playerHand.append(button);
  });
  els.drawCard.disabled = state.turn !== "player" || state.gameOver || state.awaitingColor;
  els.colorPicker.hidden = !state.awaitingColor;
  els.colorPicker.innerHTML = "";
  activeColors().forEach((color) => {
    const button = document.createElement("button");
    button.type = "button";
    button.dataset.color = color;
    button.textContent = titleCase(color);
    button.style.background = `var(--${color})`;
    if (color === "yellow") button.style.color = "#111111";
    els.colorPicker.append(button);
  });
  syncOptionButtons();
}

function cardMarkup(card) {
  const symbolClass = card.type !== "number" ? "symbol" : "";
  const corner = cornerLabel(card);
  return `<span class="corner corner-top">${corner}</span><span class="value ${symbolClass}">${cardIcon(card)}</span><span class="corner corner-bottom">${corner}</span>`;
}

function cardIcon(card) {
  if (card.value === "skip") return skipIcon();
  if (card.value === "reverse") return reverseIcon();
  if (card.value === "skipAll") return skipAllIcon();
  if (["draw1", "draw2", "draw4", "draw5"].includes(card.value)) return drawIcon(drawLabel(card.value));
  if (card.value === "discardAll") return discardAllIcon();
  if (card.value === "flip") return flipIcon();
  if (card.value === "roulette") return rouletteIcon();
  if (card.value === "wild") return wildIcon();
  if (["wild2", "wild4", "wild6", "wild10", "wildColor"].includes(card.value)) return wildIcon(drawLabel(card.value));
  return escapeHtml(card.value);
}

function cornerLabel(card) {
  const labels = {
    skip: "S",
    reverse: "R",
    draw1: "+1",
    draw2: "+2",
    draw4: "+4",
    draw5: "+5",
    wild: "W",
    wild2: "+2",
    wild4: "+4",
    wild6: "+6",
    wild10: "+10",
    wildColor: "C",
    skipAll: "ALL",
    discardAll: "ALL",
    flip: "F",
    roulette: "?",
  };
  return labels[card.value] || escapeHtml(card.value);
}

function drawLabel(value) {
  return { draw1: "+1", draw2: "+2", draw4: "+4", draw5: "+5", wild2: "+2", wild4: "+4", wild6: "+6", wild10: "+10", wildColor: "COLOR" }[value] || "";
}

function skipIcon() {
  return `<svg class="card-icon skip-icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="21" fill="none" stroke="#111111" stroke-width="9"/><path d="M18 48 48 18" fill="none" stroke="#111111" stroke-width="10" stroke-linecap="round"/><path d="M18 48 48 18" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></svg>`;
}

function skipAllIcon() {
  return `<svg class="card-icon skip-all-icon" viewBox="0 0 74 64" aria-hidden="true"><g transform="translate(5 2) scale(.82)"><circle cx="32" cy="32" r="21" fill="none" stroke="#111111" stroke-width="9"/><path d="M18 48 48 18" fill="none" stroke="#111111" stroke-width="10" stroke-linecap="round"/><path d="M18 48 48 18" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></g><g transform="translate(28 9) scale(.82)"><circle cx="32" cy="32" r="21" fill="none" stroke="#111111" stroke-width="9"/><path d="M18 48 48 18" fill="none" stroke="#111111" stroke-width="10" stroke-linecap="round"/><path d="M18 48 48 18" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round"/></g></svg>`;
}

function reverseIcon() {
  return `<svg class="card-icon reverse-icon" viewBox="0 0 64 64" aria-hidden="true"><path d="M18 27c4-10 17-14 27-8" fill="none" stroke="#111111" stroke-width="9" stroke-linecap="round"/><path d="M45 19l-1-12 11 6z" fill="#111111"/><path d="M46 37c-4 10-17 14-27 8" fill="none" stroke="#111111" stroke-width="9" stroke-linecap="round"/><path d="M19 45l1 12-11-6z" fill="#111111"/><path d="M19 27c4-8 15-12 24-7" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/><path d="M45 37c-4 8-15 12-24 7" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/></svg>`;
}

function drawIcon(label) {
  return `<svg class="card-icon draw-icon" viewBox="0 0 64 64" aria-hidden="true"><rect x="14" y="16" width="28" height="38" rx="5" fill="#ffffff" stroke="#111111" stroke-width="4" transform="rotate(-12 28 35)"/><rect x="24" y="10" width="28" height="38" rx="5" fill="#ffffff" stroke="#111111" stroke-width="4" transform="rotate(10 38 29)"/><text x="33" y="41" text-anchor="middle" class="power-icon-label">${label}</text></svg>`;
}

function discardAllIcon() {
  return `<svg class="card-icon discard-icon" viewBox="0 0 64 64" aria-hidden="true"><rect x="12" y="15" width="25" height="36" rx="5" fill="#ffffff" stroke="#111111" stroke-width="4" transform="rotate(-14 24 33)"/><rect x="25" y="11" width="25" height="36" rx="5" fill="#ffffff" stroke="#111111" stroke-width="4" transform="rotate(13 37 29)"/><path d="M18 50h30" stroke="#111111" stroke-width="5" stroke-linecap="round"/><text x="32" y="40" text-anchor="middle" class="power-icon-label small">ALL</text></svg>`;
}

function flipIcon() {
  return `<svg class="card-icon flip-icon" viewBox="0 0 64 64" aria-hidden="true"><rect x="13" y="16" width="24" height="34" rx="5" fill="#ffffff" stroke="#111111" stroke-width="4" transform="rotate(-10 25 33)"/><rect x="29" y="14" width="24" height="34" rx="5" fill="#111111" stroke="#ffffff" stroke-width="4" transform="rotate(10 41 31)"/><path d="M18 18c8-8 25-9 33 2" fill="none" stroke="#111111" stroke-width="5" stroke-linecap="round"/><path d="M46 18l8 2-3-8" fill="none" stroke="#111111" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
}

function rouletteIcon() {
  return `<svg class="card-icon roulette-icon" viewBox="0 0 64 64" aria-hidden="true"><circle cx="32" cy="32" r="24" fill="#ffffff" stroke="#111111" stroke-width="5"/><path d="M32 8v48M8 32h48M15 15l34 34M49 15 15 49" stroke="#111111" stroke-width="3"/><circle cx="32" cy="32" r="8" fill="#111111"/><circle cx="43" cy="21" r="5" fill="#e21b2d"/></svg>`;
}

function wildIcon(label = "") {
  const text = label ? `<text x="32" y="38" text-anchor="middle" class="wild-icon-label">${label}</text>` : "";
  return `<svg class="card-icon wild-icon" viewBox="0 0 64 64" aria-hidden="true"><defs><clipPath id="wild-oval"><ellipse cx="32" cy="32" rx="25" ry="31" transform="rotate(-22 32 32)"/></clipPath></defs><g clip-path="url(#wild-oval)"><rect x="0" y="0" width="32" height="32" fill="#e21b2d"/><rect x="32" y="0" width="32" height="32" fill="#ffd21f"/><rect x="0" y="32" width="32" height="32" fill="#0066cc"/><rect x="32" y="32" width="32" height="32" fill="#00a650"/></g><ellipse cx="32" cy="32" rx="25" ry="31" fill="none" stroke="#111111" stroke-width="6" transform="rotate(-22 32 32)"/>${text}</svg>`;
}

function cardBackMarkup() {
  return '<span class="uno-logo">UNO</span><span class="edition">DAVID EDITION</span>';
}

function cardLabel(card) {
  const labels = { skip: "Skip", reverse: "Reverse", draw1: "Draw 1", draw2: "Draw 2", draw4: "Draw 4", draw5: "Draw 5", wild: "Wild", wild2: "Wild Draw 2", wild4: "Wild Draw 4", wild6: "Wild Draw 6", wild10: "Wild Draw 10", wildColor: "Wild Draw Color", skipAll: "Skip Everyone", discardAll: "Discard All", flip: "Flip", roulette: "Color Roulette" };
  return labels[card.value] || `${titleCase(card.color)} ${card.value}`;
}

function setMessage(heading, text) {
  els.turnHeading.textContent = heading;
  els.message.textContent = text;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

function syncOptionButtons() {
  els.modePicker.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.mode === state.mode));
  els.difficultyPicker.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.difficulty === state.difficulty));
}

els.newGame.addEventListener("click", startGame);
els.winButton.addEventListener("click", () => { els.winModal.hidden = true; });
els.drawCard.addEventListener("click", handleDraw);
els.modePicker.addEventListener("click", (event) => {
  if (event.target.matches("button[data-mode]")) {
    state.mode = event.target.dataset.mode;
    startGame();
  }
});
els.difficultyPicker.addEventListener("click", (event) => {
  if (event.target.matches("button[data-difficulty]")) {
    state.difficulty = event.target.dataset.difficulty;
    syncOptionButtons();
    setMessage("Difficulty changed", `Bot difficulty is now ${state.difficulty}.`);
  }
});
els.colorPicker.addEventListener("click", (event) => {
  if (event.target.matches("button[data-color]")) handleColorPick(event.target.dataset.color);
});

startGame();
