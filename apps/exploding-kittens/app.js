const cards = {
  explode: { title: "Exploding Kitten", kind: "explode", icon: "BOOM", text: "Avoid this unless you have Defuse." },
  defuse: { title: "Defuse", kind: "defuse", icon: "SAFE", text: "Automatically saves you from exploding." },
  skip: { title: "Skip", kind: "action", icon: "SKIP", text: "End your turn without drawing." },
  attack: { title: "Attack", kind: "action", icon: "2X", text: "End your turn and make the bot take two turns." },
  future: { title: "See Future", kind: "action", icon: "EYE", text: "Peek at the next three cards." },
  shuffle: { title: "Shuffle", kind: "action", icon: "MIX", text: "Shuffle the draw pile." },
  favor: { title: "Favor", kind: "action", icon: "TAKE", text: "Steal a random card from the bot." },
  cat: { title: "Cat Card", kind: "cat", icon: "CAT", text: "Cute, but it does nothing by itself." },
};

const state = {
  deck: [],
  playerHand: [],
  botHand: [],
  turn: "player",
  pendingTurns: { player: 1, bot: 1 },
  difficulty: "medium",
  gameOver: false,
  revealing: false,
  pendingExplosion: null,
};

const els = {
  playerHand: document.querySelector("#player-hand"),
  botHand: document.querySelector("#bot-hand"),
  playerCount: document.querySelector("#player-count"),
  botCount: document.querySelector("#bot-count"),
  deckCount: document.querySelector("#deck-count"),
  drawCount: document.querySelector("#draw-count"),
  turnLabel: document.querySelector("#turn-label"),
  drawCard: document.querySelector("#draw-card"),
  messageTitle: document.querySelector("#message-title"),
  message: document.querySelector("#message"),
  futureView: document.querySelector("#future-view"),
  difficultyPicker: document.querySelector("#difficulty-picker"),
  newGame: document.querySelector("#new-game"),
  resultModal: document.querySelector("#result-modal"),
  resultTitle: document.querySelector("#result-title"),
  resultButton: document.querySelector("#result-button"),
  dangerModal: document.querySelector("#danger-modal"),
  dangerTitle: document.querySelector("#danger-title"),
  dangerMessage: document.querySelector("#danger-message"),
  dangerAction: document.querySelector("#danger-action"),
};

function makeCard(type) {
  return { ...cards[type], type, id: `${type}-${Math.random().toString(16).slice(2)}` };
}

function makeDeck() {
  const deck = [];
  add(deck, "defuse", 2);
  add(deck, "skip", 4);
  add(deck, "attack", 3);
  add(deck, "future", 4);
  add(deck, "shuffle", 4);
  add(deck, "favor", 3);
  add(deck, "cat", 10);
  return shuffle(deck);
}

function add(deck, type, total) {
  for (let index = 0; index < total; index += 1) deck.push(makeCard(type));
}

function shuffle(deck) {
  const copy = [...deck];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function startGame() {
  Object.assign(state, {
    deck: makeDeck(),
    playerHand: [makeCard("defuse")],
    botHand: [makeCard("defuse")],
    turn: "player",
    pendingTurns: { player: 1, bot: 1 },
    revealing: false,
    pendingExplosion: null,
    gameOver: false,
  });
  for (let index = 0; index < 4; index += 1) {
    state.playerHand.push(state.deck.pop());
    state.botHand.push(state.deck.pop());
  }
  state.deck.push(makeCard("explode"));
  state.deck = shuffle(state.deck);
  els.resultModal.hidden = true;
  els.dangerModal.hidden = true;
  setMessage("Your turn", "Play an action card, or draw to end your turn.");
  hideFuture();
  render();
}

function currentHand() {
  return state.turn === "player" ? state.playerHand : state.botHand;
}

function otherHand() {
  return state.turn === "player" ? state.botHand : state.playerHand;
}

function drawFor(actor) {
  const hand = actor === "player" ? state.playerHand : state.botHand;
  const card = state.deck.pop();
  if (!card) {
    endGame("You both survived", "The draw pile ran out. That is suspiciously peaceful.");
    return;
  }
  if (card.type === "explode") {
    handleExplosion(actor);
    return;
  }
  hand.push(card);
  setMessage(actor === "player" ? "Card drawn" : "Bot drew", `${actor === "player" ? "You drew" : "The bot drew"} a card safely.`);
  finishTurn(actor);
}

function handleExplosion(actor) {
  const hand = actor === "player" ? state.playerHand : state.botHand;
  const defuseIndex = hand.findIndex((card) => card.type === "defuse");

  if (actor === "bot") {
    if (defuseIndex === -1) {
      endGame("You win", "The bot drew the Exploding Kitten with no Defuse card left.");
      return;
    }
    hand.splice(defuseIndex, 1);
    reinsertExplosion();
    setMessage("Bot defused", "The bot drew the Exploding Kitten and used a Defuse card.");
    finishTurn("bot");
    return;
  }

  state.revealing = true;
  state.pendingExplosion = { canDefuse: defuseIndex !== -1 };
  showDanger(defuseIndex !== -1);
  render();
}

function resolveDanger() {
  if (!state.pendingExplosion) return;

  if (!state.pendingExplosion.canDefuse) {
    state.revealing = false;
    state.pendingExplosion = null;
    endGame("You lose!", "No Defuse card was available.");
    return;
  }

  const defuseIndex = state.playerHand.findIndex((card) => card.type === "defuse");
  if (defuseIndex !== -1) state.playerHand.splice(defuseIndex, 1);
  reinsertExplosion();
  state.revealing = false;
  state.pendingExplosion = null;
  els.dangerModal.hidden = true;
  setMessage("Defused", "You used a Defuse card and put the danger back in the pile.");
  finishTurn("player");
}

function reinsertExplosion() {
  const insertAt = Math.floor(Math.random() * (state.deck.length + 1));
  state.deck.splice(insertAt, 0, makeCard("explode"));
}

function finishTurn(actor) {
  state.pendingTurns[actor] -= 1;
  if (state.pendingTurns[actor] > 0) {
    state.turn = actor;
  } else {
    state.pendingTurns[actor] = 1;
    state.turn = actor === "player" ? "bot" : "player";
  }
  render();
  if (!state.gameOver && !state.revealing && state.turn === "bot") window.setTimeout(botTurn, 700);
}

function playCard(index) {
  if (state.turn !== "player" || state.gameOver || state.revealing) return;
  const card = state.playerHand[index];
  if (!card || card.type === "defuse" || card.type === "cat") {
    setMessage("Keep that card", "Defuse cards work automatically. Cat cards are just along for the ride.");
    return;
  }
  state.playerHand.splice(index, 1);
  useAction(card, "player");
}

function useAction(card, actor) {
  hideFuture();
  if (card.type === "skip") {
    setMessage("Skipped", actor === "player" ? "You skipped the draw." : "The bot skipped its draw.");
    finishTurn(actor);
    return;
  }
  if (card.type === "attack") {
    const opponent = actor === "player" ? "bot" : "player";
    state.pendingTurns[opponent] = 2;
    state.pendingTurns[actor] = 0;
    state.turn = opponent;
    setMessage("Attack", actor === "player" ? "The bot must take two turns." : "You must take two turns.");
    render();
    if (state.turn === "bot") window.setTimeout(botTurn, 700);
    return;
  }
  if (card.type === "future") {
    const nextCards = state.deck.slice(-3).reverse().map((item) => item.title).join(" | ");
    els.futureView.textContent = `Next cards: ${nextCards || "No cards left"}`;
    els.futureView.hidden = false;
    setMessage("Future seen", actor === "player" ? "You peeked at the next cards." : "The bot peeked at the next cards.");
    render();
    return;
  }
  if (card.type === "shuffle") {
    state.deck = shuffle(state.deck);
    setMessage("Shuffled", actor === "player" ? "You shuffled the draw pile." : "The bot shuffled the draw pile.");
    render();
    return;
  }
  if (card.type === "favor") {
    const target = otherHand();
    if (target.length > 0) {
      const stolen = target.splice(Math.floor(Math.random() * target.length), 1)[0];
      currentHand().push(stolen);
    }
    setMessage("Favor", actor === "player" ? "You stole a random card from the bot." : "The bot stole a random card from you.");
    render();
  }
}

function botTurn() {
  if (state.gameOver || state.revealing || state.turn !== "bot") return;
  hideFuture();
  const usefulCardIndex = chooseBotCard();
  if (usefulCardIndex !== -1) {
    const [card] = state.botHand.splice(usefulCardIndex, 1);
    useAction(card, "bot");
    if (!["skip", "attack"].includes(card.type) && state.turn === "bot") window.setTimeout(() => drawFor("bot"), 650);
    return;
  }
  drawFor("bot");
}

function chooseBotCard() {
  const dangerNearTop = state.deck.slice(-2).some((card) => card.type === "explode");
  if (state.difficulty === "easy") {
    const playable = state.botHand.map((card, index) => ({ card, index })).filter(({ card }) => card.kind === "action");
    return playable.length && Math.random() > 0.45 ? playable[Math.floor(Math.random() * playable.length)].index : -1;
  }
  const preferred = dangerNearTop || state.difficulty === "hard" ? ["future", "shuffle", "skip", "attack", "favor"] : ["favor", "future"];
  for (const type of preferred) {
    const index = state.botHand.findIndex((card) => card.type === type);
    if (index !== -1 && (state.difficulty === "hard" || Math.random() > 0.28)) return index;
  }
  return -1;
}

function showDanger(canDefuse) {
  els.dangerTitle.textContent = "Exploding Kitten!";
  els.dangerMessage.textContent = canDefuse
    ? "You drew the Exploding Kitten. Click Defuse to survive."
    : "You drew the Exploding Kitten with no Defuse card left.";
  els.dangerAction.textContent = canDefuse ? "Defuse" : "You Lose!";
  els.dangerAction.classList.toggle("lose", !canDefuse);
  els.dangerModal.hidden = false;
}

function endGame(title, message) {
  state.gameOver = true;
  state.revealing = false;
  state.pendingExplosion = null;
  els.dangerModal.hidden = true;
  setMessage(title, message);
  els.resultTitle.textContent = title;
  els.resultButton.textContent = title === "You win" ? "You Win!" : "Play Again";
  els.resultModal.hidden = false;
  render();
}

function setMessage(title, message) {
  els.messageTitle.textContent = title;
  els.message.textContent = message;
}

function hideFuture() {
  els.futureView.hidden = true;
  els.futureView.textContent = "";
}

function render() {
  els.playerCount.textContent = `${state.playerHand.length} card${state.playerHand.length === 1 ? "" : "s"}`;
  els.botCount.textContent = `${state.botHand.length} card${state.botHand.length === 1 ? "" : "s"}`;
  els.deckCount.textContent = `${state.deck.length} card${state.deck.length === 1 ? "" : "s"}`;
  els.drawCount.textContent = state.deck.length;
  els.turnLabel.textContent = state.turn === "player" ? "You" : "Bot";
  els.drawCard.disabled = state.turn !== "player" || state.gameOver || state.revealing;
  els.difficultyPicker.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.difficulty === state.difficulty));

  els.botHand.innerHTML = "";
  state.botHand.forEach(() => {
    const card = document.createElement("div");
    card.className = "card-back";
    card.innerHTML = `<span class="card-icon">???</span><strong class="card-title">Hidden</strong>`;
    els.botHand.append(card);
  });

  els.playerHand.innerHTML = "";
  state.playerHand.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card-button";
    button.disabled = state.turn !== "player" || state.gameOver || state.revealing;
    button.setAttribute("aria-label", `Play ${card.title}`);
    button.innerHTML = cardMarkup(card);
    button.addEventListener("click", () => playCard(index));
    els.playerHand.append(button);
  });
}

function cardMarkup(card) {
  return `<div class="card ${card.kind} ${card.type}"><div class="card-art" aria-hidden="true"><span class="art-core"></span><span class="art-mark one"></span><span class="art-mark two"></span><span class="art-mark three"></span></div><span class="card-icon">${card.icon}</span><strong class="card-title">${card.title}</strong><p class="card-text">${card.text}</p></div>`;
}

els.newGame.addEventListener("click", startGame);
els.resultButton.addEventListener("click", startGame);
els.dangerAction.addEventListener("click", resolveDanger);
els.drawCard.addEventListener("click", () => drawFor("player"));
els.difficultyPicker.addEventListener("click", (event) => {
  if (!event.target.matches("button[data-difficulty]")) return;
  state.difficulty = event.target.dataset.difficulty;
  setMessage("Difficulty changed", `Bot difficulty is now ${state.difficulty}.`);
  render();
});

startGame();
