state.opponent = state.opponent || "ai";
state.roomCode = state.roomCode || "";
state.roomJoined = state.roomJoined || false;

const pvpEls = {
  opponentPicker: document.querySelector("#opponent-picker"),
  roomPanel: document.querySelector("#room-panel"),
  roomCode: document.querySelector("#room-code"),
  joinCode: document.querySelector("#join-code"),
  hostRoom: document.querySelector("#host-room"),
  joinRoom: document.querySelector("#join-room"),
  roomStatus: document.querySelector("#room-status"),
  opponentTitle: document.querySelector("#opponent-title"),
  playerTitle: document.querySelector("#player-title"),
  difficultyGroup: document.querySelector("#difficulty-picker").closest("div"),
};

function isPvpMode() {
  return state.opponent === "human";
}

function activePlayerHand() {
  return isPvpMode() && state.turn === "computer" ? state.computerHand : state.playerHand;
}

function hiddenPlayerHand() {
  return isPvpMode() && state.turn === "computer" ? state.playerHand : state.computerHand;
}

function currentPlayerName() {
  if (!isPvpMode()) return "You";
  return state.turn === "computer" ? "Player 2" : "Player 1";
}

function otherPlayerName() {
  if (!isPvpMode()) return "Computer";
  return state.turn === "computer" ? "Player 1" : "Player 2";
}

function otherTurn(turn) {
  return turn === "player" ? "computer" : "player";
}

function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function roomStatusText() {
  if (!isPvpMode()) return "";
  if (state.roomJoined) return `Joined room ${state.roomCode}. Pass the device when turns change.`;
  if (state.roomCode) return `Room ${state.roomCode} is ready. Share the code, then use Join Room on this browser.`;
  return "Host a room to make a 4-number code, or enter a code to join on this browser.";
}

modeHelpText = function modeHelpText() {
  if (isPvpMode()) return `Player 1's turn. Room code: ${state.roomCode || "host a room first"}.`;
  if (state.mode === "mercy") return "No Mercy is active: draw until playable, 0/7 swap hands, and 25 cards means elimination.";
  if (state.mode === "flip") return "UNO Flip is active: Flip cards switch every card to its other side.";
  return "Play a matching color, number, or action card.";
};

handlePlayerCard = function handlePlayerCard(cardIndex) {
  if ((!isPvpMode() && state.turn !== "player") || state.gameOver || state.awaitingColor) return;
  const hand = activePlayerHand();
  const card = hand[cardIndex];
  const current = cardFace(card);
  if (!canPlay(card)) {
    setMessage("Not playable", "Match the current color, match the card value, or play a wild card.");
    return;
  }
  if (current.color === "wild") {
    state.awaitingColor = { hand, cardIndex };
    setMessage("Choose a color", "Pick the color that should continue after your wild card.");
    render();
    return;
  }
  playCard(hand, cardIndex);
  afterPlayerMove(current);
};

afterPlayerMove = function afterPlayerMove(card) {
  if (checkWinner()) return;
  if (isPvpMode()) {
    setMessage(`${currentPlayerName()}'s turn`, `${cardLabel(card)} was played. ${currentPlayerName()}, your turn.`);
    render();
    return;
  }
  if (state.turn === "player") {
    setMessage("Your turn again", `${cardLabel(card)} gives you another turn.`);
    render();
    return;
  }
  setMessage("Computer turn", "The computer is thinking.");
  render();
  window.setTimeout(computerTurn, 650);
};

handleDraw = function handleDraw() {
  if ((!isPvpMode() && state.turn !== "player") || state.gameOver || state.awaitingColor) return;
  const hand = activePlayerHand();
  if (modeMeta[state.mode].forceDrawUntilPlayable) {
    const result = drawUntilPlayable(hand);
    if (result.card && canPlay(result.card)) {
      setMessage("Playable card drawn", `You drew ${result.drawn} card${result.drawn === 1 ? "" : "s"}. You can play the last one now.`);
    } else {
      state.turn = otherTurn(state.turn);
      if (isPvpMode()) setMessage(`${currentPlayerName()}'s turn`, `${otherPlayerName()} drew ${result.drawn} card${result.drawn === 1 ? "" : "s"} and passed.`);
      else {
        setMessage("Computer turn", `You drew ${result.drawn} card${result.drawn === 1 ? "" : "s"} and passed.`);
        window.setTimeout(computerTurn, 650);
      }
    }
  } else {
    const card = drawOne(hand);
    if (card && canPlay(card)) {
      setMessage(`${currentPlayerName()} drew a playable card`, "You can play it now, or choose another playable card.");
    } else {
      state.turn = otherTurn(state.turn);
      if (isPvpMode()) setMessage(`${currentPlayerName()}'s turn`, "A card was drawn and the turn passed.");
      else {
        setMessage("Computer turn", "You drew a card and passed.");
        window.setTimeout(computerTurn, 650);
      }
    }
  }
  render();
};

checkWinner = function checkWinner() {
  const mercyLimit = modeMeta[state.mode].mercyLimit;
  if (state.playerHand.length === 0 || (!isPvpMode() && mercyLimit && state.computerHand.length >= mercyLimit)) {
    state.gameOver = true;
    setMessage(isPvpMode() ? "Player 1 wins" : "You win", state.playerHand.length === 0 ? "Nicely played. Click the popup to close it." : "No Mercy rule: the computer hit 25 cards.");
    els.winModal.hidden = false;
    render();
    return true;
  }
  if (state.computerHand.length === 0 || (!isPvpMode() && mercyLimit && state.playerHand.length >= mercyLimit)) {
    state.gameOver = true;
    setMessage(isPvpMode() ? "Player 2 wins" : "Computer wins", state.computerHand.length === 0 ? "Close one. Start a new game and try again." : "No Mercy rule: you hit 25 cards.");
    render();
    return true;
  }
  return false;
};

render = function render() {
  const top = cardFace(topDiscard());
  const modeLabel = state.mode === "flip" ? `${modeMeta.flip.label} (${state.flipSide})` : modeMeta[state.mode].label;
  const visibleHand = activePlayerHand();
  const hiddenHand = hiddenPlayerHand();
  els.computerCount.textContent = `${hiddenHand.length} card${hiddenHand.length === 1 ? "" : "s"}`;
  els.playerCount.textContent = `${visibleHand.length} card${visibleHand.length === 1 ? "" : "s"}`;
  els.currentColor.textContent = titleCase(state.currentColor);
  els.gameMode.textContent = isPvpMode() ? `${modeLabel} Human` : `${modeLabel} AI`;
  pvpEls.opponentTitle.textContent = isPvpMode() ? `${otherPlayerName()} hand` : "Computer hand";
  pvpEls.playerTitle.textContent = isPvpMode() ? `${currentPlayerName()} hand` : "Your hand";
  els.discardCard.className = cardClasses(top, top.color === "wild" ? state.currentColor : top.color);
  els.discardCard.innerHTML = cardMarkup(top);
  els.computerHand.innerHTML = "";
  hiddenHand.forEach(() => {
    const card = document.createElement("div");
    card.className = "card-back";
    card.innerHTML = cardBackMarkup();
    els.computerHand.append(card);
  });
  els.playerHand.innerHTML = "";
  visibleHand.forEach((card, index) => {
    const current = cardFace(card);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "player-card";
    button.disabled = (!isPvpMode() && state.turn !== "player") || state.gameOver || state.awaitingColor || !canPlay(card);
    button.setAttribute("aria-label", `Play ${cardLabel(current)}`);
    button.innerHTML = `<div class="${cardClasses(current)}">${cardMarkup(current)}</div>`;
    button.addEventListener("click", () => handlePlayerCard(index));
    els.playerHand.append(button);
  });
  els.drawCard.disabled = (!isPvpMode() && state.turn !== "player") || state.gameOver || state.awaitingColor;
  pvpEls.roomPanel.hidden = !isPvpMode();
  pvpEls.difficultyGroup.hidden = isPvpMode();
  pvpEls.roomCode.textContent = state.roomCode || "----";
  pvpEls.roomStatus.textContent = roomStatusText();
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
};

const originalSyncOptionButtons = syncOptionButtons;
syncOptionButtons = function syncOptionButtons() {
  originalSyncOptionButtons();
  pvpEls.opponentPicker.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.opponent === state.opponent));
};

pvpEls.opponentPicker.addEventListener("click", (event) => {
  if (event.target.matches("button[data-opponent]")) {
    state.opponent = event.target.dataset.opponent;
    if (!isPvpMode()) {
      state.roomCode = "";
      state.roomJoined = false;
    } else if (!state.roomCode) {
      state.roomCode = generateRoomCode();
    }
    startGame();
  }
});

pvpEls.hostRoom.addEventListener("click", () => {
  state.roomCode = generateRoomCode();
  state.roomJoined = false;
  setMessage("Room hosted", `Room code ${state.roomCode} is ready.`);
  render();
});

pvpEls.joinRoom.addEventListener("click", () => {
  const code = pvpEls.joinCode.value.replace(/\D/g, "").slice(0, 4);
  pvpEls.joinCode.value = code;
  if (code.length !== 4) {
    setMessage("Enter 4 numbers", "Type the 4-number room code to join.");
    return;
  }
  state.roomCode = code;
  state.roomJoined = true;
  setMessage("Room joined", `Joined room ${state.roomCode}. Player 1 starts.`);
  render();
});

render();
