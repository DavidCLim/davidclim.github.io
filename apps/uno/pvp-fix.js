state.opponent = state.opponent || "ai";
state.roomCode = state.roomCode || "";
state.roomJoined = state.roomJoined || false;
state.roomRole = state.roomRole || "";
state.roomUpdatedAt = state.roomUpdatedAt || 0;

const roomStoragePrefix = "uno-david-room-";
const peerRoomPrefix = "uno-david-";
const roomTransport = { peer: null, connection: null, ready: false, mode: "storage" };
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

function peerRoomId(code = state.roomCode) {
  return `${peerRoomPrefix}${code}`;
}

function hasOnlineRooms() {
  return typeof window.Peer === "function";
}

function closeOnlineRoom() {
  roomTransport.ready = false;
  roomTransport.mode = "storage";
  if (roomTransport.connection) roomTransport.connection.close();
  if (roomTransport.peer) roomTransport.peer.destroy();
  roomTransport.connection = null;
  roomTransport.peer = null;
}

function setupConnection(connection) {
  roomTransport.connection = connection;
  connection.on("open", () => {
    roomTransport.ready = true;
    roomTransport.mode = "online";
    if (state.roomRole === "player1") sendRoomState();
    setMessage(state.roomRole === "player1" ? "Player 2 connected" : "Room connected", `Room ${state.roomCode} is online.`);
    render();
  });
  connection.on("data", (message) => {
    if (!message || message.type !== "state") return;
    if (applyRoomState(message.room)) {
      if (state.roomRole === "player1") sendRoomState();
      setMessage(`${currentPlayerName()}'s turn`, `Room ${state.roomCode} updated online.`);
      render();
    }
  });
  connection.on("close", () => {
    roomTransport.ready = false;
    setMessage("Room offline", "The online room disconnected. Host or join again to reconnect.");
    render();
  });
}

function hostOnlineRoom() {
  closeOnlineRoom();
  if (!hasOnlineRooms()) return false;
  roomTransport.peer = new Peer(peerRoomId());
  roomTransport.peer.on("open", () => {
    roomTransport.mode = "online";
    setMessage("Room hosted", `Online room ${state.roomCode} is ready. Share the code with Player 2.`);
    saveRoomState();
    render();
  });
  roomTransport.peer.on("connection", setupConnection);
  roomTransport.peer.on("error", () => {
    roomTransport.mode = "storage";
    setMessage("Online room unavailable", "Using same-device room storage for now.");
    render();
  });
  return true;
}

function joinOnlineRoom(code) {
  closeOnlineRoom();
  if (!hasOnlineRooms()) return false;
  roomTransport.peer = new Peer();
  roomTransport.peer.on("open", () => {
    setupConnection(roomTransport.peer.connect(peerRoomId(code), { reliable: true }));
  });
  roomTransport.peer.on("error", () => {
    roomTransport.mode = "storage";
    const room = loadRoomState(code);
    if (room) {
      applyRoomState(room);
      render();
    } else {
      setMessage("Room not found", `No online room was found for ${code}. Ask Player 1 to host again.`);
    }
  });
  return true;
}

function sendRoomState() {
  if (!roomTransport.connection || !roomTransport.connection.open) return;
  roomTransport.connection.send({
    type: "state",
    room: {
      updatedAt: state.roomUpdatedAt || Date.now(),
      state: snapshotRoomState(),
    },
  });
}

function roomStorageKey(code = state.roomCode) {
  return `${roomStoragePrefix}${code}`;
}

function snapshotRoomState() {
  return {
    deck: state.deck,
    discard: state.discard,
    playerHand: state.playerHand,
    computerHand: state.computerHand,
    currentColor: state.currentColor,
    turn: state.turn,
    awaitingColor: state.awaitingColor,
    gameOver: state.gameOver,
    mode: state.mode,
    opponent: "human",
    difficulty: state.difficulty,
    flipSide: state.flipSide,
    roomCode: state.roomCode,
    roomJoined: true,
  };
}

function saveRoomState() {
  if (!isPvpMode() || !state.roomCode || !state.roomRole) return;
  state.roomUpdatedAt = Date.now();
  localStorage.setItem(roomStorageKey(), JSON.stringify({
    updatedAt: state.roomUpdatedAt,
    state: snapshotRoomState(),
  }));
  sendRoomState();
}

function loadRoomState(code) {
  const saved = localStorage.getItem(roomStorageKey(code));
  if (!saved) return null;
  try {
    return JSON.parse(saved);
  } catch {
    return null;
  }
}

function applyRoomState(room) {
  if (!room || !room.state || room.updatedAt <= state.roomUpdatedAt) return false;
  const roomRole = state.roomRole;
  Object.assign(state, room.state, { roomRole, roomUpdatedAt: room.updatedAt });
  return true;
}

function isPvpMode() {
  return state.opponent === "human";
}

function isPlayerTwoTab() {
  return isPvpMode() && state.roomRole === "player2";
}

function isLocalPlayersTurn() {
  if (!isPvpMode() || !state.roomRole) return true;
  return (state.roomRole === "player1" && state.turn === "player")
    || (state.roomRole === "player2" && state.turn === "computer");
}

function playerNameForTurn(turn) {
  return turn === "computer" ? "Player 2" : "Player 1";
}

function localPlayerName() {
  if (!isPvpMode()) return "You";
  return state.roomRole === "player2" ? "Player 2" : "Player 1";
}

function activePlayerHand() {
  if (!isPvpMode()) return state.playerHand;
  return isPlayerTwoTab() ? state.computerHand : state.playerHand;
}

function hiddenPlayerHand() {
  if (!isPvpMode()) return state.computerHand;
  return isPlayerTwoTab() ? state.playerHand : state.computerHand;
}

function currentPlayerName() {
  if (!isPvpMode()) return "You";
  return playerNameForTurn(state.turn);
}

function otherPlayerName() {
  if (!isPvpMode()) return "Computer";
  return playerNameForTurn(otherTurn(state.turn));
}

function otherTurn(turn) {
  return turn === "player" ? "computer" : "player";
}

function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function roomStatusText() {
  if (!isPvpMode()) return "";
  if (!state.roomCode) return "Host a room to make a 4-number code, or enter a code to join.";
  const roomType = roomTransport.mode === "online" ? "Online" : "Same-device";
  if (state.roomRole === "player2") return `${roomType} room ${state.roomCode}. Joined as Player 2. ${currentPlayerName()}'s turn.`;
  if (state.roomRole === "player1") return `${roomType} room ${state.roomCode}. Share the code with Player 2. ${currentPlayerName()}'s turn.`;
  return `Room ${state.roomCode} is ready.`;
}

modeHelpText = function modeHelpText() {
  if (isPvpMode()) return `Player 1's turn. Host or join a room to play against a human.`;
  if (state.mode === "mercy") return "No Mercy is active: draw until playable, 0/7 swap hands, and 25 cards means elimination.";
  if (state.mode === "flip") return "UNO Flip is active: Flip cards switch every card to its other side.";
  return "Play a matching color, number, or action card.";
};

handlePlayerCard = function handlePlayerCard(cardIndex) {
  if ((!isPvpMode() && state.turn !== "player") || (isPvpMode() && !isLocalPlayersTurn()) || state.gameOver || state.awaitingColor) return;
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
    setMessage(`${currentPlayerName()}'s turn`, `${cardLabel(card)} was played. ${currentPlayerName()} is up next.`);
    saveRoomState();
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
  if ((!isPvpMode() && state.turn !== "player") || (isPvpMode() && !isLocalPlayersTurn()) || state.gameOver || state.awaitingColor) return;
  const hand = activePlayerHand();
  if (modeMeta[state.mode].forceDrawUntilPlayable) {
    const result = drawUntilPlayable(hand);
    if (result.card && canPlay(result.card)) {
      setMessage("Playable card drawn", `${localPlayerName()} drew ${result.drawn} card${result.drawn === 1 ? "" : "s"}.`);
    } else {
      state.turn = otherTurn(state.turn);
      setMessage(`${currentPlayerName()}'s turn`, `${otherPlayerName()} drew ${result.drawn} card${result.drawn === 1 ? "" : "s"} and passed.`);
      if (!isPvpMode()) window.setTimeout(computerTurn, 650);
    }
  } else {
    const card = drawOne(hand);
    if (card && canPlay(card)) {
      setMessage("Playable card drawn", `${localPlayerName()} drew a playable card.`);
    } else {
      state.turn = otherTurn(state.turn);
      setMessage(`${currentPlayerName()}'s turn`, "A card was drawn and the turn passed.");
      if (!isPvpMode()) window.setTimeout(computerTurn, 650);
    }
  }
  saveRoomState();
  render();
};

const originalHandleColorPick = handleColorPick;
handleColorPick = function handleColorPick(color) {
  originalHandleColorPick(color);
  saveRoomState();
};

checkWinner = function checkWinner() {
  const mercyLimit = modeMeta[state.mode].mercyLimit;
  if (state.playerHand.length === 0 || (!isPvpMode() && mercyLimit && state.computerHand.length >= mercyLimit)) {
    state.gameOver = true;
    setMessage(isPvpMode() ? "Player 1 wins" : "You win", state.playerHand.length === 0 ? "Nicely played. Click the popup to close it." : "No Mercy rule: the computer hit 25 cards.");
    els.winModal.hidden = false;
    saveRoomState();
    render();
    return true;
  }
  if (state.computerHand.length === 0 || (!isPvpMode() && mercyLimit && state.playerHand.length >= mercyLimit)) {
    state.gameOver = true;
    setMessage(isPvpMode() ? "Player 2 wins" : "Computer wins", state.computerHand.length === 0 ? "Close one. Start a new game and try again." : "No Mercy rule: you hit 25 cards.");
    saveRoomState();
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
  const localTurn = isLocalPlayersTurn();
  document.body.classList.toggle("is-your-turn", localTurn && !state.gameOver && !state.awaitingColor);
  els.computerCount.textContent = `${hiddenHand.length} card${hiddenHand.length === 1 ? "" : "s"}`;
  els.playerCount.textContent = `${visibleHand.length} card${visibleHand.length === 1 ? "" : "s"}`;
  els.currentColor.textContent = titleCase(state.currentColor);
  els.gameMode.textContent = isPvpMode() ? `${modeLabel} Human` : `${modeLabel} Bot`;
  pvpEls.opponentTitle.textContent = isPvpMode() ? `${otherPlayerName()} hand` : "Computer hand";
  pvpEls.playerTitle.textContent = isPvpMode() ? `${localPlayerName()} hand` : "Your hand";
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
    button.disabled = (!isPvpMode() && state.turn !== "player") || (isPvpMode() && !localTurn) || state.gameOver || state.awaitingColor || !canPlay(card);
    button.setAttribute("aria-label", `Play ${cardLabel(current)}`);
    button.innerHTML = `<div class="${cardClasses(current)}">${cardMarkup(current)}</div>`;
    button.addEventListener("click", () => handlePlayerCard(index));
    els.playerHand.append(button);
  });
  els.drawCard.disabled = (!isPvpMode() && state.turn !== "player") || (isPvpMode() && !localTurn) || state.gameOver || state.awaitingColor;
  pvpEls.roomPanel.hidden = !isPvpMode();
  pvpEls.difficultyGroup.hidden = isPvpMode();
  pvpEls.roomCode.textContent = state.roomCode || "----";
  pvpEls.roomStatus.textContent = roomStatusText();
  els.colorPicker.hidden = !state.awaitingColor || (isPvpMode() && !localTurn);
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

const originalStartGame = startGame;
startGame = function startGame() {
  originalStartGame();
  if (isPvpMode() && state.roomRole) {
    state.roomJoined = true;
    saveRoomState();
  }
};

const originalSyncOptionButtons = syncOptionButtons;
syncOptionButtons = function syncOptionButtons() {
  originalSyncOptionButtons();
  pvpEls.opponentPicker.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.opponent === state.opponent));
};

pvpEls.opponentPicker.addEventListener("click", (event) => {
  if (!event.target.matches("button[data-opponent]")) return;
  event.stopImmediatePropagation();
  state.opponent = event.target.dataset.opponent;
  if (!isPvpMode()) {
    state.roomCode = "";
    state.roomJoined = false;
    state.roomRole = "";
    closeOnlineRoom();
  } else {
    state.roomRole = "player1";
    state.roomCode = generateRoomCode();
    state.roomJoined = true;
  }
  startGame();
}, true);

pvpEls.hostRoom.addEventListener("click", (event) => {
  event.stopImmediatePropagation();
  state.opponent = "human";
  state.roomRole = "player1";
  state.roomCode = generateRoomCode();
  state.roomJoined = true;
  saveRoomState();
  if (!hostOnlineRoom()) setMessage("Room hosted", `Room code ${state.roomCode} is ready on this device. Online helper did not load.`);
  render();
}, true);

pvpEls.joinRoom.addEventListener("click", (event) => {
  event.stopImmediatePropagation();
  const code = pvpEls.joinCode.value.replace(/\D/g, "").slice(0, 4);
  pvpEls.joinCode.value = code;
  if (code.length !== 4) {
    setMessage("Enter 4 numbers", "Type the 4-number room code to join.");
    return;
  }
  state.roomRole = "player2";
  state.opponent = "human";
  state.roomCode = code;
  state.roomJoined = true;
  if (!joinOnlineRoom(code)) {
    const room = loadRoomState(code);
    if (!room) {
      setMessage("Room not found", `No hosted room was found for ${code} in this browser.`);
      return;
    }
    applyRoomState(room);
    setMessage("Room joined", `Joined room ${state.roomCode} as Player 2.`);
  } else {
    setMessage("Joining room", `Connecting to online room ${state.roomCode}...`);
  }
  render();
}, true);

window.addEventListener("storage", (event) => {
  if (!isPvpMode() || !state.roomCode || event.key !== roomStorageKey()) return;
  const room = loadRoomState(state.roomCode);
  if (applyRoomState(room)) {
    setMessage(`${currentPlayerName()}'s turn`, `Room ${state.roomCode} updated.`);
    render();
  }
});

render();
