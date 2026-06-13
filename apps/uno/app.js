const modeMeta = {
  classic: {
    label: "Classic",
    colors: ["red", "yellow", "green", "blue"],
    handSize: 7,
    forceDrawUntilPlayable: false,
    mercyLimit: null,
  },
  mercy: {
    label: "No Mercy",
    colors: ["red", "yellow", "green", "blue"],
    handSize: 7,
    forceDrawUntilPlayable: true,
    mercyLimit: 25,
  },
  flip: {
    label: "Flip",
    colors: ["red", "yellow", "green", "blue"],
    darkColors: ["teal", "orange", "pink", "purple"],
    handSize: 7,
    forceDrawUntilPlayable: false,
    mercyLimit: null,
  },
};

const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

const state = {
  deck: [],
  discard: [],
  playerHand: [],
  computerHand: [],
  currentColor: "red",
  turn: "player",
  awaitingColor: null,
  gameOver: false,
  mode: "classic",
  difficulty: "medium",
  flipSide: "light",
  lastDrawnIndex: null,
};

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

function createDeck() {
  if (state.mode === "flip") {
    return createFlipDeck();
  }
  if (state.mode === "mercy") {
    return createMercyDeck();
  }
  return createClassicDeck();
}

function createClassicDeck() {
  const deck = [];
  modeMeta.classic.colors.forEach((color) => {
    numbers.forEach((value) => deck.push(face(color, value, "number")));
    numbers.slice(1).forEach((value) => deck.push(face(color, value, "number")));
    ["skip", "reverse", "draw2"].forEach((action) => {
      deck.push(face(color, action, "action"));
      deck.push(face(color, action, "action"));
    });
  });
  addWilds(deck, ["wild", "wild4"], 4);
  return shuffle(deck);
}

function createMercyDeck() {
  const deck = [];
  modeMeta.mercy.colors.forEach((color) => {
    numbers.forEach((value) => deck.push(face(color, value, "number")));
    numbers.slice(1).forEach((value) => deck.push(face(color, value, "number")));
    ["skip", "reverse", "draw2", "draw4", "discardAll", "skipAll"].forEach((action) => {
      deck.push(face(color, action, "action"));
      deck.push(face(color, action, "action"));
    });
  });
  addWilds(deck, ["wild", "wild6", "wild10", "roulette"], 4);
  return shuffle(deck);
}

function createFlipDeck() {
  const lightColors = modeMeta.flip.colors;
  const darkColors = modeMeta.flip.darkColors;
  const deck = [];

  lightColors.forEach((lightColor, index) => {
    const darkColor = darkColors[index];
    numbers.slice(1).forEach((value) => {
      deck.push(flipCard(face(lightColor, value, "number"), face(darkColor, value, "number")));
      deck.push(flipCard(face(lightColor, value, "number"), face(darkColor, value, "number")));
    });
    ["skip", "reverse", "draw1", "flip"].forEach((action) => {
      deck.push(flipCard(face(lightColor, action, "action"), face(darkColor, darkAction(action), "action")));
      deck.push(flipCard(face(lightColor, action, "action"), face(darkColor, darkAction(action), "action")));
    });
  });

  for (let index = 0; index < 4; index += 1) {
    deck.push(flipCard(face("wild", "wild", "wild"), face("wild", "wild", "wild")));
    deck.push(flipCard(face("wild", "wild2", "wild"), face("wild", "wildColor", "wild")));
  }
  return shuffle(deck);
}

function darkAction(action) {
  if (action === "draw1") return "draw5";
  if (action === "skip") return "skipAll";
  return action;
}

function face(color, value, type) {
  return { color, value, type };
}

function flipCard(light, dark) {
  return { light, dark, flip: true };
}

function addWilds(deck, values, count) {
  values.forEach((value) => {
    for (let index = 0; index < count; index += 1) {
      deck.push(face("wild", value, "wild"));
    }
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

function cardFace(card) {
  return card && card.flip ? card[state.flipSide] : card;
}

function drawOne(hand) {
  if (state.deck.length === 0) {
    refillDeck();
  }
  const card = state.deck.pop();
  if (card) {
    hand.push(card);
  }
  return card;
}

function drawMany(hand, total) {
  for (let index = 0; index < total; index += 1) {
    drawOne(hand);
  }
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
  state.deck = shuffle([...state.discard]);
  state.discard = topCard ? [topCard] : [];
}

function startGame() {
  const meta = modeMeta[state.mode];
  state.deck = createDeck();
  state.discard = [];
  state.playerHand = [];
  state.computerHand = [];
  state.turn = "player";
  state.awaitingColor = null;
  state.gameOver = false;
  state.flipSide = "light";
  state.lastDrawnIndex = null;
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
  if (state.mode === "mercy") {
    return "No Mercy is active: draw until playable, 0/7 swap hands, and 25 cards means elimination.";
  }
  if (state.mode === "flip") {
    return "UNO Flip is active: Flip cards switch every card to its other side.";
  }
  return "Play a matching color, number, or action card.";
}

function canPlay(card) {
  const top = cardFace(topDiscard());
  const current = cardFace(card);
  return (
    current.color === "wild" ||
    current.color === state.currentColor ||
    current.value === top.value
  );
}

function topDiscard() {
  return state.discard[state.discard.length - 1];
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

  if (card.value === "0" && state.mode === "mercy") {
    swapHands();
  }
  if (card.value === "7" && state.mode === "mercy") {
    swapHands();
  }
  if (card.value === "discardAll") {
    discardAllColor(ownHand, card.color);
  }
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

  const drawTotal = drawCount(card.value);
  if (drawTotal > 0) {
    drawMany(opponentHand, drawTotal);
  }

  if (keepsTurn(card.value)) {
    state.turn = player;
    return;
  }
  state.turn = player === "player" ? "computer" : "player";
}

function drawCount(value) {
  const counts = {
    draw1: 1,
    draw2: 2,
    draw4: 4,
    wild2: 2,
    wild4: 4,
    wild6: 6,
    wild10: 10,
    draw5: 5,
  };
  return counts[value] || 0;
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
    if (cardFace(hand[index]).color === color) {
      toDiscard.push(hand.splice(index, 1)[0]);
    }
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
      if (result.card && canPlay(result.card)) {
        playComputerCard(state.computerHand.length - 1);
      } else {
        state.turn = "player";
        setMessage("Your turn", `The computer drew ${result.drawn} card${result.drawn === 1 ? "" : "s"} and passed.`);
      }
    } else {
      const card = drawOne(state.computerHand);
      if (card && canPlay(card)) {
        playComputerCard(state.computerHand.length - 1);
      } else {
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
  const playable = state.computerHand
    .map((card, index) => ({ card, index, face: cardFace(card) }))
    .filter(({ card }) => canPlay(card));
  if (playable.length === 0) return -1;
  if (state.difficulty === "easy") {
    return playable[Math.floor(Math.random() * playable.length)].index;
  }
  playable.sort((a, b) => cardScore(b.face) - cardScore(a.face));
  if (state.difficulty === "medium") {
    return playable[Math.min(1, playable.length - 1)].index;
  }
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
  let chosenColor;
  if (current.color === "wild") {
    chosenColor = pickBestColor(state.computerHand);
  }
  playCard(state.computerHand, cardIndex, chosenColor);

  if (state.turn === "computer") {
    setMessage("Computer turn again", `The computer played ${cardLabel(current)} and gets another turn.`);
    render();
    window.setTimeout(computerTurn, 650);
  } else {
    setMessage("Your turn", `The computer played ${cardLabel(current)}.`);
  }
}

function pickBestColor(hand) {
  const colors = activeColors();
  const counts = colors.map((color) => ({
    color,
    total: hand.filter((card) => cardFace(card).color === color).length,
  }));
  counts.sort((a, b) => b.total - a.total);
  return counts[0].color;
}

function activeColors() {
  if (state.mode === "flip" && state.flipSide === "dark") {
    return modeMeta.flip.darkColors;
  }
  return modeMeta[state.mode].colors;
}

function handleDraw() {
  if (state.turn !== "player" || state.gameOver || state.awaitingColor) return;
  if (modeMeta[state.mode].forceDrawUntilPlayable) {
    const result = drawUntilPlayable(state.playerHand);
    if (result.card && canPlay(result.card)) {
      setMessage("Playable card drawn", `You drew ${result.drawn} card${result.drawn === 1 ? "" : "s"}. You can play the last one now.`);
    } else {
      state.turn = "computer";
      setMessage("Computer turn", `You drew ${result.drawn} card${result.drawn === 1 ? "" : "s"} and passed.`);
      window.setTimeout(computerTurn, 650);
    }
  } else {
    const drawnCard = drawOne(state.playerHand);
    if (drawnCard && canPlay(drawnCard)) {
      setMessage("You drew a playable card", "You can play it now, or choose another playable card.");
    } else {
      state.turn = "computer";
      setMessage("Computer turn", "You drew a card and passed.");
      window.setTimeout(computerTurn, 650);
    }
  }
  render();
}

function checkWinner() {
  const mercyLimit = modeMeta[state.mode].mercyLimit;
  if (state.playerHand.length === 0) {
    state.gameOver = true;
    setMessage("You win", "Nicely played. Click the popup to close it.");
    els.winModal.hidden = false;
    render();
    return true;
  }
  if (state.computerHand.length === 0) {
    state.gameOver = true;
    setMessage("Computer wins", "Close one. Start a new game and try again.");
    render();
    return true;
  }
  if (mercyLimit && state.computerHand.length >= mercyLimit) {
    state.gameOver = true;
    setMessage("You win", "No Mercy rule: the computer hit 25 cards.");
    els.winModal.hidden = false;
    render();
    return true;
  }
  if (mercyLimit && state.playerHand.length >= mercyLimit) {
    state.gameOver = true;
    setMessage("Computer wins", "No Mercy rule: you hit 25 cards.");
    render();
    return true;
  }
  return false;
}

function setMessage(heading, text) {
  els.turnHeading.textContent = heading;
  els.message.textContent = text;
}

function render() {
  const top = cardFace(topDiscard());
  const modeLabel = state.mode === "flip" ? `${modeMeta.flip.label} (${state.flipSide})` : modeMeta[state.mode].label;

  els.computerCount.textContent = `${state.computerHand.length} card${state.computerHand.length === 1 ? "" : "s"}`;
  els.playerCount.textContent = `${state.playerHand.length} card${state.playerHand.length === 1 ? "" : "s"}`;
  els.currentColor.textContent = titleCase(state.currentColor);
  els.gameMode.textContent = modeLabel;
  els.discardCard.className = `card ${top.color === "wild" ? state.currentColor : top.color}`;
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
    button.innerHTML = `<div class="card ${current.color}">${cardMarkup(current)}</div>`;
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
  const icon = cardIcon(card);
  const label = cardLabel(card);
  return `<span class="corner">${icon}</span><span class="value ${card.type !== "number" ? "symbol" : ""}">${icon}</span><span class="card-name">${escapeHtml(label)}</span>`;
}

function cardIcon(card) {
  const icons = {
    skip: "⊘",
    reverse: "↻",
    draw1: "+1",
    draw2: "+2",
    draw4: "+4",
    draw5: "+5",
    wild2: "+2",
    wild4: "+4",
    wild6: "+6",
    wild10: "+10",
    skipAll: "⊘⊘",
    discardAll: "▤",
    flip: "⇄",
    roulette: "◌",
    wildColor: "◌",
    wild: "◆",
  };
  return icons[card.value] || escapeHtml(card.value);
}

function cardBackMarkup() {
  return '<span class="uno-logo">UNO</span><span class="edition">DAVID EDITION</span>';
}

function cardLabel(card) {
  const labels = {
    skip: "Skip",
    reverse: "Reverse",
    draw1: "Draw 1",
    draw2: "Draw 2",
    draw4: "Draw 4",
    draw5: "Draw 5",
    wild: "Wild",
    wild2: "Wild Draw 2",
    wild4: "Wild Draw 4",
    wild6: "Wild Draw 6",
    wild10: "Wild Draw 10",
    wildColor: "Wild Draw Color",
    skipAll: "Skip Everyone",
    discardAll: "Discard All",
    flip: "Flip",
    roulette: "Color Roulette",
  };
  if (labels[card.value]) return labels[card.value];
  return `${titleCase(card.color)} ${card.value}`;
}

function titleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function syncOptionButtons() {
  els.modePicker.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.mode === state.mode);
  });
  els.difficultyPicker.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.difficulty === state.difficulty);
  });
}

els.newGame.addEventListener("click", startGame);
els.winButton.addEventListener("click", () => {
  els.winModal.hidden = true;
});
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
  if (event.target.matches("button[data-color]")) {
    handleColorPick(event.target.dataset.color);
  }
});

startGame();
