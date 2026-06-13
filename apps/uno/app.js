const colors = ["red", "yellow", "green", "blue"];
const numbers = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
const actions = ["Skip", "Reverse", "+2"];
const wilds = ["Wild", "+4"];

const state = {
  deck: [],
  discard: [],
  playerHand: [],
  computerHand: [],
  currentColor: "red",
  turn: "player",
  awaitingColor: null,
  gameOver: false,
};

const els = {
  computerCount: document.querySelector("#computer-count"),
  playerCount: document.querySelector("#player-count"),
  currentColor: document.querySelector("#current-color"),
  computerHand: document.querySelector("#computer-hand"),
  playerHand: document.querySelector("#player-hand"),
  discardCard: document.querySelector("#discard-card"),
  drawCard: document.querySelector("#draw-card"),
  newGame: document.querySelector("#new-game"),
  turnHeading: document.querySelector("#turn-heading"),
  message: document.querySelector("#message"),
  colorPicker: document.querySelector("#color-picker"),
};

function createDeck() {
  const deck = [];

  colors.forEach((color) => {
    numbers.forEach((value) => deck.push({ color, value, type: "number" }));
    numbers.slice(1).forEach((value) => deck.push({ color, value, type: "number" }));
    actions.forEach((value) => {
      deck.push({ color, value, type: "action" });
      deck.push({ color, value, type: "action" });
    });
  });

  wilds.forEach((value) => {
    for (let index = 0; index < 4; index += 1) {
      deck.push({ color: "wild", value, type: "wild" });
    }
  });

  return shuffle(deck);
}

function shuffle(cards) {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
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

function refillDeck() {
  const topCard = state.discard.pop();
  state.deck = shuffle([...state.discard]);
  state.discard = topCard ? [topCard] : [];
}

function startGame() {
  state.deck = createDeck();
  state.discard = [];
  state.playerHand = [];
  state.computerHand = [];
  state.turn = "player";
  state.awaitingColor = null;
  state.gameOver = false;

  for (let index = 0; index < 7; index += 1) {
    drawOne(state.playerHand);
    drawOne(state.computerHand);
  }

  let firstCard = drawOne(state.discard);
  while (firstCard && firstCard.type === "wild") {
    state.deck.unshift(state.discard.pop());
    state.deck = shuffle(state.deck);
    firstCard = drawOne(state.discard);
  }

  state.currentColor = firstCard.color;
  setMessage("Your turn", "Play a matching color, number, or action card.");
  render();
}

function canPlay(card) {
  const top = topDiscard();
  return (
    card.color === "wild" ||
    card.color === state.currentColor ||
    card.value === top.value
  );
}

function topDiscard() {
  return state.discard[state.discard.length - 1];
}

function playCard(hand, cardIndex, chosenColor) {
  const [card] = hand.splice(cardIndex, 1);
  state.discard.push(card);
  state.currentColor = card.color === "wild" ? chosenColor : card.color;
  applyCardEffect(card, hand === state.playerHand ? "player" : "computer");
}

function applyCardEffect(card, player) {
  const opponentHand = player === "player" ? state.computerHand : state.playerHand;

  if (card.value === "+2") {
    drawOne(opponentHand);
    drawOne(opponentHand);
  }

  if (card.value === "+4") {
    for (let index = 0; index < 4; index += 1) {
      drawOne(opponentHand);
    }
  }

  if (card.value === "Skip" || card.value === "Reverse" || card.value === "+2" || card.value === "+4") {
    state.turn = player;
    return;
  }

  state.turn = player === "player" ? "computer" : "player";
}

function handlePlayerCard(cardIndex) {
  if (state.turn !== "player" || state.gameOver || state.awaitingColor) {
    return;
  }

  const card = state.playerHand[cardIndex];
  if (!canPlay(card)) {
    setMessage("Not playable", "Match the current color, match the card value, or play a wild card.");
    return;
  }

  if (card.color === "wild") {
    state.awaitingColor = { hand: state.playerHand, cardIndex };
    setMessage("Choose a color", "Pick the color that should continue after your wild card.");
    render();
    return;
  }

  playCard(state.playerHand, cardIndex);
  afterPlayerMove(card);
}

function handleColorPick(color) {
  if (!state.awaitingColor) {
    return;
  }
  const { hand, cardIndex } = state.awaitingColor;
  state.awaitingColor = null;
  playCard(hand, cardIndex, color);
  afterPlayerMove(topDiscard());
}

function afterPlayerMove(card) {
  if (checkWinner()) {
    return;
  }

  if (state.turn === "player") {
    setMessage("Your turn again", `${card.value} keeps the computer from playing. Take another turn.`);
    render();
    return;
  }

  setMessage("Computer turn", "The computer is thinking.");
  render();
  window.setTimeout(computerTurn, 650);
}

function computerTurn() {
  if (state.gameOver) {
    return;
  }

  const cardIndex = state.computerHand.findIndex(canPlay);
  if (cardIndex === -1) {
    const card = drawOne(state.computerHand);
    if (card && canPlay(card)) {
      const drawnIndex = state.computerHand.length - 1;
      playComputerCard(drawnIndex);
    } else {
      state.turn = "player";
      setMessage("Your turn", "The computer drew a card and passed.");
    }
  } else {
    playComputerCard(cardIndex);
  }

  if (!checkWinner()) {
    render();
  }
}

function playComputerCard(cardIndex) {
  const card = state.computerHand[cardIndex];
  let chosenColor;
  if (card.color === "wild") {
    chosenColor = chooseComputerColor();
  }
  playCard(state.computerHand, cardIndex, chosenColor);

  if (state.turn === "computer") {
    setMessage("Computer turn again", `The computer played ${card.value} and gets another turn.`);
    render();
    window.setTimeout(computerTurn, 650);
  } else {
    setMessage("Your turn", `The computer played ${formatCardName(card)}.`);
  }
}

function chooseComputerColor() {
  const counts = colors.map((color) => ({
    color,
    total: state.computerHand.filter((card) => card.color === color).length,
  }));
  counts.sort((a, b) => b.total - a.total);
  return counts[0].color;
}

function handleDraw() {
  if (state.turn !== "player" || state.gameOver || state.awaitingColor) {
    return;
  }

  const drawnCard = drawOne(state.playerHand);
  if (drawnCard && canPlay(drawnCard)) {
    setMessage("You drew a playable card", "You can play it now, or choose another playable card.");
  } else {
    state.turn = "computer";
    setMessage("Computer turn", "You drew a card and passed.");
    window.setTimeout(computerTurn, 650);
  }
  render();
}

function checkWinner() {
  if (state.playerHand.length === 0) {
    state.gameOver = true;
    setMessage("You win", "Nicely played. Start a new game whenever you are ready.");
    render();
    return true;
  }

  if (state.computerHand.length === 0) {
    state.gameOver = true;
    setMessage("Computer wins", "Close one. Start a new game and try again.");
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
  const top = topDiscard();

  els.computerCount.textContent = `${state.computerHand.length} card${state.computerHand.length === 1 ? "" : "s"}`;
  els.playerCount.textContent = `${state.playerHand.length} card${state.playerHand.length === 1 ? "" : "s"}`;
  els.currentColor.textContent = capitalize(state.currentColor);
  els.discardCard.className = `card ${top.color === "wild" ? state.currentColor : top.color}`;
  els.discardCard.innerHTML = cardMarkup(top);

  els.computerHand.innerHTML = "";
  state.computerHand.forEach(() => {
    const card = document.createElement("div");
    card.className = "card-back";
    card.textContent = "UNO";
    els.computerHand.append(card);
  });

  els.playerHand.innerHTML = "";
  state.playerHand.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "player-card";
    button.disabled = state.turn !== "player" || state.gameOver || state.awaitingColor || !canPlay(card);
    button.setAttribute("aria-label", `Play ${formatCardName(card)}`);
    button.innerHTML = `<div class="card ${card.color}">${cardMarkup(card)}</div>`;
    button.addEventListener("click", () => handlePlayerCard(index));
    els.playerHand.append(button);
  });

  els.drawCard.disabled = state.turn !== "player" || state.gameOver || state.awaitingColor;
  els.colorPicker.hidden = !state.awaitingColor;
}

function cardMarkup(card) {
  return `<span class="corner">${escapeHtml(card.value)}</span><span class="value">${escapeHtml(card.value)}</span>`;
}

function formatCardName(card) {
  if (card.color === "wild") {
    return card.value;
  }
  return `${capitalize(card.color)} ${card.value}`;
}

function capitalize(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

els.newGame.addEventListener("click", startGame);
els.drawCard.addEventListener("click", handleDraw);
els.colorPicker.addEventListener("click", (event) => {
  if (event.target.matches("button[data-color]")) {
    handleColorPick(event.target.dataset.color);
  }
});

startGame();
