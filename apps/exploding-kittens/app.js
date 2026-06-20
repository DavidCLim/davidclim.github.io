const cards = {
  explode: { title: "Exploding Kitten", kind: "explode", icon: "BOOM", text: "Avoid this unless you have Defuse." },
  defuse: { title: "Defuse", kind: "defuse", icon: "SAFE", text: "Automatically saves you from exploding." },
  skip: { title: "Skip", kind: "action", icon: "SKIP", text: "End your turn without drawing." },
  attack: { title: "Attack", kind: "action", icon: "2X", text: "End your turn and make the other player take two turns." },
  future: { title: "See Future", kind: "action", icon: "EYE", text: "Peek at the next three cards." },
  shuffle: { title: "Shuffle", kind: "action", icon: "MIX", text: "Shuffle the draw pile." },
  favor: { title: "Favor", kind: "action", icon: "TAKE", text: "Steal a random card from the other player." },
  cat: { title: "Cat Card", kind: "cat", icon: "CAT", text: "Cute, but it does nothing by itself." },
};

const state = {
  deck: [],
  playerHand: [],
  botHand: [],
  turn: "player",
  pendingTurns: { player: 1, bot: 1 },
  difficulty: "medium",
  opponent: "bot",
  roomCode: "",
  roomJoined: false,
  roomRole: "",
  roomUpdatedAt: 0,
  roomVersion: 0,
  gameOver: false,
  revealing: false,
  pendingExplosion: null,
};

const els = {
  playerHand: document.querySelector("#player-hand"),
  botHand: document.querySelector("#bot-hand"),
  playerCount: document.querySelector("#player-count"),
  botCount: document.querySelector("#bot-count"),
  playerCountLabel: document.querySelector("#player-count-label"),
  botCountLabel: document.querySelector("#bot-count-label"),
  deckCount: document.querySelector("#deck-count"),
  drawCount: document.querySelector("#draw-count"),
  turnLabel: document.querySelector("#turn-label"),
  drawCard: document.querySelector("#draw-card"),
  messageTitle: document.querySelector("#message-title"),
  message: document.querySelector("#message"),
  futureView: document.querySelector("#future-view"),
  opponentPicker: document.querySelector("#opponent-picker"),
  difficultyGroup: document.querySelector("#difficulty-group"),
  difficultyPicker: document.querySelector("#difficulty-picker"),
  roomPanel: document.querySelector("#room-panel"),
  roomCode: document.querySelector("#room-code"),
  joinCode: document.querySelector("#join-code"),
  hostRoom: document.querySelector("#host-room"),
  joinRoom: document.querySelector("#join-room"),
  roomStatus: document.querySelector("#room-status"),
  opponentTitle: document.querySelector("#opponent-title"),
  playerTitle: document.querySelector("#player-title"),
  newGame: document.querySelector("#new-game"),
  resultModal: document.querySelector("#result-modal"),
  resultTitle: document.querySelector("#result-title"),
  resultButton: document.querySelector("#result-button"),
  dangerModal: document.querySelector("#danger-modal"),
  dangerTitle: document.querySelector("#danger-title"),
  dangerMessage: document.querySelector("#danger-message"),
  dangerAction: document.querySelector("#danger-action"),
};

const roomStoragePrefix = "kittens-david-room-";
const peerRoomPrefix = "kittens-david-";
const roomTransport = { peer: null, connection: null, ready: false, mode: "storage" };

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
  const roomData = {
    opponent: state.opponent,
    roomCode: state.roomCode,
    roomJoined: state.roomJoined,
    roomRole: state.roomRole,
    roomVersion: state.roomVersion,
    roomUpdatedAt: state.roomUpdatedAt,
  };
  Object.assign(state, {
    deck: makeDeck(),
    playerHand: [makeCard("defuse")],
    botHand: [makeCard("defuse")],
    turn: "player",
    pendingTurns: { player: 1, bot: 1 },
    revealing: false,
    pendingExplosion: null,
    gameOver: false,
    ...roomData,
  });
  for (let index = 0; index < 4; index += 1) {
    state.playerHand.push(state.deck.pop());
    state.botHand.push(state.deck.pop());
  }
  state.deck.push(makeCard("explode"));
  state.deck = shuffle(state.deck);
  els.resultModal.hidden = true;
  els.dangerModal.hidden = true;
  setMessage(`${currentPlayerName()}'s turn`, isPvpMode() ? "Host or join a room, then take turns drawing and playing cards." : "Play an action card, or draw to end your turn.");
  hideFuture();
  render();
  if (isPvpMode() && state.roomRole === "player1" && state.roomCode) saveRoomState();
}

function actorHand(actor) {
  return actor === "player" ? state.playerHand : state.botHand;
}

function otherActor(actor) {
  return actor === "player" ? "bot" : "player";
}

function currentHand() {
  return actorHand(state.turn);
}

function otherHand() {
  return actorHand(otherActor(state.turn));
}

function drawFor(actor) {
  const hand = actorHand(actor);
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
  setMessage(actor === localActor() ? "Card drawn" : `${playerName(actor)} drew`, `${playerName(actor)} drew a card safely.`);
  finishTurn(actor);
}

function handleExplosion(actor) {
  const hand = actorHand(actor);
  const defuseIndex = hand.findIndex((card) => card.type === "defuse");

  if (!isPvpMode() && actor === "bot") {
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
  state.pendingExplosion = { actor, canDefuse: defuseIndex !== -1 };
  showDanger(defuseIndex !== -1);
  render();
}

function resolveDanger() {
  if (!state.pendingExplosion) return;
  const actor = state.pendingExplosion.actor;

  if (!state.pendingExplosion.canDefuse) {
    state.revealing = false;
    state.pendingExplosion = null;
    endGame(isPvpMode() ? `${playerName(otherActor(actor))} wins` : "You lose!", `${playerName(actor)} had no Defuse card left.`);
    return;
  }

  const hand = actorHand(actor);
  const defuseIndex = hand.findIndex((card) => card.type === "defuse");
  if (defuseIndex !== -1) hand.splice(defuseIndex, 1);
  reinsertExplosion();
  state.revealing = false;
  state.pendingExplosion = null;
  els.dangerModal.hidden = true;
  setMessage("Defused", `${playerName(actor)} used a Defuse card and put the danger back in the pile.`);
  finishTurn(actor);
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
    state.turn = otherActor(actor);
  }
  render();
  if (isPvpMode()) saveRoomState();
  if (!state.gameOver && !state.revealing && !isPvpMode() && state.turn === "bot") window.setTimeout(botTurn, 700);
}

function playCard(index) {
  if (!isLocalPlayersTurn() || state.gameOver || state.revealing) return;
  const hand = activePlayerHand();
  const actor = localActor();
  const card = hand[index];
  if (!card || card.type === "defuse" || card.type === "cat") {
    setMessage("Keep that card", "Defuse cards work automatically. Cat cards are just along for the ride.");
    return;
  }
  hand.splice(index, 1);
  useAction(card, actor);
  if (isPvpMode()) saveRoomState();
}

function useAction(card, actor) {
  hideFuture();
  if (card.type === "skip") {
    setMessage("Skipped", `${playerName(actor)} skipped the draw.`);
    finishTurn(actor);
    return;
  }
  if (card.type === "attack") {
    const opponent = otherActor(actor);
    state.pendingTurns[opponent] = 2;
    state.pendingTurns[actor] = 0;
    state.turn = opponent;
    setMessage("Attack", `${playerName(opponent)} must take two turns.`);
    render();
    if (isPvpMode()) saveRoomState();
    if (!isPvpMode() && state.turn === "bot") window.setTimeout(botTurn, 700);
    return;
  }
  if (card.type === "future") {
    const nextCards = state.deck.slice(-3).reverse().map((item) => item.title).join(" | ");
    els.futureView.textContent = `Next cards: ${nextCards || "No cards left"}`;
    els.futureView.hidden = false;
    setMessage("Future seen", `${playerName(actor)} peeked at the next cards.`);
    render();
    return;
  }
  if (card.type === "shuffle") {
    state.deck = shuffle(state.deck);
    setMessage("Shuffled", `${playerName(actor)} shuffled the draw pile.`);
    render();
    if (isPvpMode()) saveRoomState();
    return;
  }
  if (card.type === "favor") {
    const target = actorHand(otherActor(actor));
    if (target.length > 0) {
      const stolen = target.splice(Math.floor(Math.random() * target.length), 1)[0];
      actorHand(actor).push(stolen);
    }
    setMessage("Favor", `${playerName(actor)} stole a random card.`);
    render();
    if (isPvpMode()) saveRoomState();
  }
}

function botTurn() {
  if (state.gameOver || state.revealing || state.turn !== "bot" || isPvpMode()) return;
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
  if (isPvpMode()) saveRoomState();
}

function setMessage(title, message) {
  els.messageTitle.textContent = title;
  els.message.textContent = message;
}

function hideFuture() {
  els.futureView.hidden = true;
  els.futureView.textContent = "";
}

function isPvpMode() {
  return state.opponent === "human";
}

function localActor() {
  return isPvpMode() && state.roomRole === "player2" ? "bot" : "player";
}

function isLocalPlayersTurn() {
  if (!isPvpMode()) return state.turn === "player";
  return state.roomJoined && state.roomRole && state.turn === localActor();
}

function activePlayerHand() {
  return actorHand(localActor());
}

function hiddenPlayerHand() {
  return actorHand(otherActor(localActor()));
}

function playerName(actor) {
  if (!isPvpMode()) return actor === "player" ? "You" : "The bot";
  return actor === "player" ? "Player 1" : "Player 2";
}

function currentPlayerName() {
  return playerName(state.turn);
}

function otherPlayerName() {
  return playerName(otherActor(localActor()));
}

function generateRoomCode() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

function roomStorageKey(code = state.roomCode) {
  return `${roomStoragePrefix}${code}`;
}

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
    if (state.roomRole === "player2") requestRoomState();
    setMessage(state.roomRole === "player1" ? "Player 2 connected" : "Room connected", `Room ${state.roomCode} is online.`);
    render();
  });
  connection.on("data", (message) => {
    if (!message) return;
    if (message.type === "request-state") {
      sendRoomState();
      return;
    }
    if (message.type !== "state") return;
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

function snapshotRoomState() {
  return {
    deck: state.deck,
    playerHand: state.playerHand,
    botHand: state.botHand,
    turn: state.turn,
    pendingTurns: state.pendingTurns,
    difficulty: state.difficulty,
    opponent: "human",
    roomCode: state.roomCode,
    roomJoined: true,
    roomVersion: state.roomVersion || 0,
    gameOver: state.gameOver,
    revealing: false,
    pendingExplosion: null,
  };
}

function saveRoomState() {
  if (!isPvpMode() || !state.roomCode || !state.roomRole) return;
  state.roomVersion = (Number(state.roomVersion) || 0) + 1;
  state.roomUpdatedAt = Date.now();
  const room = {
    version: state.roomVersion,
    updatedAt: state.roomUpdatedAt,
    state: snapshotRoomState(),
  };
  localStorage.setItem(roomStorageKey(), JSON.stringify(room));
  sendRoomState(room);
}

function sendRoomState(room) {
  if (!roomTransport.connection || !roomTransport.connection.open) return;
  roomTransport.connection.send({
    type: "state",
    room: room || {
      version: state.roomVersion || 0,
      updatedAt: state.roomUpdatedAt || Date.now(),
      state: snapshotRoomState(),
    },
  });
}

function requestRoomState() {
  if (!roomTransport.connection || !roomTransport.connection.open) return;
  roomTransport.connection.send({ type: "request-state" });
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

function roomVersion(room) {
  return Number(room?.version || room?.state?.roomVersion || room?.updatedAt || 0);
}

function applyRoomState(room) {
  const incomingVersion = roomVersion(room);
  if (!room || !room.state || incomingVersion <= (Number(state.roomVersion) || 0)) return false;
  const roomRole = state.roomRole;
  Object.assign(state, room.state, { roomRole, roomUpdatedAt: room.updatedAt || Date.now(), roomVersion: incomingVersion });
  state.opponent = "human";
  state.roomJoined = true;
  return true;
}

function roomStatusText() {
  if (!isPvpMode()) return "";
  if (!state.roomCode) return "Host a room to make a 4-number code, or enter a code to join.";
  const roomType = roomTransport.mode === "online" ? "Online" : "Same-device";
  if (state.roomRole === "player2") return `${roomType} room ${state.roomCode}. Joined as Player 2. ${currentPlayerName()}'s turn.`;
  if (state.roomRole === "player1") return `${roomType} room ${state.roomCode}. Share the code with Player 2. ${currentPlayerName()}'s turn.`;
  return `Room ${state.roomCode} is ready.`;
}

function render() {
  const visibleHand = activePlayerHand();
  const hiddenHand = hiddenPlayerHand();
  const localTurn = isLocalPlayersTurn();
  els.playerCountLabel.textContent = isPvpMode() ? `${playerName(localActor())} hand` : "Your hand";
  els.botCountLabel.textContent = isPvpMode() ? `${otherPlayerName()} hand` : "Bot hand";
  els.playerCount.textContent = `${visibleHand.length} card${visibleHand.length === 1 ? "" : "s"}`;
  els.botCount.textContent = `${hiddenHand.length} card${hiddenHand.length === 1 ? "" : "s"}`;
  els.deckCount.textContent = `${state.deck.length} card${state.deck.length === 1 ? "" : "s"}`;
  els.drawCount.textContent = state.deck.length;
  els.turnLabel.textContent = isPvpMode() ? currentPlayerName() : state.turn === "player" ? "You" : "Bot";
  els.opponentTitle.textContent = isPvpMode() ? `${otherPlayerName()} hand` : "Bot";
  els.playerTitle.textContent = isPvpMode() ? `${playerName(localActor())} hand` : "Your hand";
  els.drawCard.disabled = !localTurn || state.gameOver || state.revealing;
  els.roomPanel.hidden = !isPvpMode();
  els.difficultyGroup.hidden = isPvpMode();
  els.roomCode.textContent = state.roomCode || "----";
  els.roomStatus.textContent = roomStatusText();
  els.opponentPicker.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.opponent === state.opponent));
  els.difficultyPicker.querySelectorAll("button").forEach((button) => button.classList.toggle("active", button.dataset.difficulty === state.difficulty));

  els.botHand.innerHTML = "";
  hiddenHand.forEach(() => {
    const card = document.createElement("div");
    card.className = "card-back";
    card.innerHTML = `<span class="card-icon">???</span><strong class="card-title">Hidden</strong>`;
    els.botHand.append(card);
  });

  els.playerHand.innerHTML = "";
  visibleHand.forEach((card, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "card-button";
    button.disabled = !localTurn || state.gameOver || state.revealing;
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
els.drawCard.addEventListener("click", () => drawFor(localActor()));
els.opponentPicker.addEventListener("click", (event) => {
  if (!event.target.matches("button[data-opponent]")) return;
  state.opponent = event.target.dataset.opponent;
  if (!isPvpMode()) {
    state.roomCode = "";
    state.roomJoined = false;
    state.roomRole = "";
    state.roomVersion = 0;
    closeOnlineRoom();
  } else {
    state.roomRole = "player1";
    state.roomCode = generateRoomCode();
    state.roomJoined = true;
    state.roomVersion = 0;
  }
  startGame();
});
els.hostRoom.addEventListener("click", () => {
  state.opponent = "human";
  state.roomRole = "player1";
  state.roomCode = generateRoomCode();
  state.roomJoined = true;
  state.roomVersion = 0;
  startGame();
  if (!hostOnlineRoom()) setMessage("Room hosted", `Room code ${state.roomCode} is ready on this device. Online helper did not load.`);
  render();
});
els.joinRoom.addEventListener("click", () => {
  const code = els.joinCode.value.replace(/\D/g, "").slice(0, 4);
  els.joinCode.value = code;
  if (code.length !== 4) {
    setMessage("Enter 4 numbers", "Type the 4-number room code to join.");
    return;
  }
  state.roomRole = "player2";
  state.opponent = "human";
  state.roomCode = code;
  state.roomJoined = true;
  state.roomVersion = 0;
  if (!joinOnlineRoom(code)) {
    const room = loadRoomState(code);
    if (!room) {
      setMessage("Room not found", `No hosted room was found for ${code} in this browser.`);
      render();
      return;
    }
    applyRoomState(room);
    setMessage("Room joined", `Joined room ${state.roomCode} as Player 2.`);
  } else {
    setMessage("Joining room", `Connecting to online room ${state.roomCode}...`);
  }
  render();
});
els.difficultyPicker.addEventListener("click", (event) => {
  if (!event.target.matches("button[data-difficulty]")) return;
  state.difficulty = event.target.dataset.difficulty;
  setMessage("Difficulty changed", `Bot difficulty is now ${state.difficulty}.`);
  render();
});
window.addEventListener("storage", (event) => {
  if (!isPvpMode() || !state.roomCode || event.key !== roomStorageKey()) return;
  const room = loadRoomState(state.roomCode);
  if (applyRoomState(room)) {
    setMessage(`${currentPlayerName()}'s turn`, `Room ${state.roomCode} updated.`);
    render();
  }
});

startGame();
