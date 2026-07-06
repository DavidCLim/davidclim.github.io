const size = 8;
const empty = null;
const players = {
  black: { name: "Black", opponent: "white" },
  white: { name: "White", opponent: "black" },
};

const state = {
  board: [],
  current: "black",
  opponent: "bot",
  gameOver: false,
  lastMove: null,
};

const els = {
  board: document.querySelector("#board"),
  blackScore: document.querySelector("#black-score"),
  whiteScore: document.querySelector("#white-score"),
  turnLabel: document.querySelector("#turn-label"),
  moveCount: document.querySelector("#move-count"),
  messageTitle: document.querySelector("#message-title"),
  message: document.querySelector("#message"),
  newGame: document.querySelector("#new-game"),
  opponentPicker: document.querySelector("#opponent-picker"),
};

const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1], [0, 1],
  [1, -1], [1, 0], [1, 1],
];

function startGame() {
  state.board = Array.from({ length: size }, () => Array(size).fill(empty));
  state.board[3][3] = "white";
  state.board[3][4] = "black";
  state.board[4][3] = "black";
  state.board[4][4] = "white";
  state.current = "black";
  state.gameOver = false;
  state.lastMove = null;
  setMessage("Black starts", "Place a black disc on a glowing square to trap white discs between black ones.");
  render();
}

function inBounds(row, col) {
  return row >= 0 && row < size && col >= 0 && col < size;
}

function flipsForMove(row, col, player, board = state.board) {
  if (!inBounds(row, col) || board[row][col]) return [];
  const opponent = players[player].opponent;
  const flips = [];

  for (const [rowStep, colStep] of directions) {
    const line = [];
    let nextRow = row + rowStep;
    let nextCol = col + colStep;

    while (inBounds(nextRow, nextCol) && board[nextRow][nextCol] === opponent) {
      line.push([nextRow, nextCol]);
      nextRow += rowStep;
      nextCol += colStep;
    }

    if (line.length && inBounds(nextRow, nextCol) && board[nextRow][nextCol] === player) {
      flips.push(...line);
    }
  }

  return flips;
}

function legalMoves(player, board = state.board) {
  const moves = [];
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const flips = flipsForMove(row, col, player, board);
      if (flips.length) moves.push({ row, col, flips });
    }
  }
  return moves;
}

function playMove(row, col) {
  if (state.gameOver || (state.opponent === "bot" && state.current === "white")) return;
  const move = legalMoves(state.current).find((item) => item.row === row && item.col === col);
  if (!move) return;
  applyMove(move, state.current);
}

function applyMove(move, player) {
  state.board[move.row][move.col] = player;
  for (const [row, col] of move.flips) state.board[row][col] = player;
  state.lastMove = { row: move.row, col: move.col };
  state.current = players[player].opponent;
  advanceTurn(`${players[player].name} placed a disc and flipped ${move.flips.length}.`);
}

function advanceTurn(lastMessage) {
  const currentMoves = legalMoves(state.current);
  const otherMoves = legalMoves(players[state.current].opponent);

  if (!currentMoves.length && !otherMoves.length) {
    finishGame();
    return;
  }

  if (!currentMoves.length) {
    const skipped = players[state.current].name;
    state.current = players[state.current].opponent;
    setMessage(`${skipped} has no moves`, `${lastMessage} ${skipped} passes because there are no legal moves.`);
    render();
    queueBotTurn();
    return;
  }

  setMessage(`${players[state.current].name}'s turn`, lastMessage || "Choose a glowing legal move.");
  render();
  queueBotTurn();
}

function finishGame() {
  state.gameOver = true;
  const counts = score();
  let title = "Draw game";
  let message = `Black ${counts.black}, White ${counts.white}.`;

  if (counts.black > counts.white) {
    title = "Black wins";
    message = `Black wins ${counts.black} to ${counts.white}.`;
  } else if (counts.white > counts.black) {
    title = state.opponent === "bot" ? "Bot wins" : "White wins";
    message = `White wins ${counts.white} to ${counts.black}.`;
  }

  setMessage(title, message);
  render();
}

function score() {
  return state.board.flat().reduce((counts, piece) => {
    if (piece) counts[piece] += 1;
    return counts;
  }, { black: 0, white: 0 });
}

function queueBotTurn() {
  if (state.gameOver || state.opponent !== "bot" || state.current !== "white") return;
  window.setTimeout(botTurn, 450);
}

function botTurn() {
  if (state.gameOver || state.current !== "white") return;
  const moves = legalMoves("white");
  if (!moves.length) {
    advanceTurn("White has no legal moves.");
    return;
  }
  const move = chooseBotMove(moves);
  applyMove(move, "white");
}

function chooseBotMove(moves) {
  const corners = new Set(["0,0", "0,7", "7,0", "7,7"]);
  const edges = moves.filter((move) => move.row === 0 || move.row === 7 || move.col === 0 || move.col === 7);
  const cornerMove = moves.find((move) => corners.has(`${move.row},${move.col}`));
  if (cornerMove) return cornerMove;
  if (edges.length) return edges.sort((a, b) => b.flips.length - a.flips.length)[0];
  return moves.sort((a, b) => b.flips.length - a.flips.length)[0];
}

function setMessage(title, message) {
  els.messageTitle.textContent = title;
  els.message.textContent = message;
}

function render() {
  const counts = score();
  const moves = legalMoves(state.current);
  const moveKeys = new Set(moves.map((move) => `${move.row},${move.col}`));

  els.blackScore.textContent = counts.black;
  els.whiteScore.textContent = counts.white;
  els.turnLabel.textContent = state.gameOver ? "Game over" : players[state.current].name;
  els.moveCount.textContent = state.gameOver ? "0" : moves.length;

  els.opponentPicker.querySelectorAll("button").forEach((button) => {
    button.classList.toggle("active", button.dataset.opponent === state.opponent);
  });

  els.board.innerHTML = "";
  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const cell = document.createElement("button");
      const key = `${row},${col}`;
      const piece = state.board[row][col];
      cell.type = "button";
      cell.className = "cell";
      cell.setAttribute("aria-label", piece ? `${players[piece].name} disc` : `Empty square ${row + 1}, ${col + 1}`);
      if (!state.gameOver && moveKeys.has(key) && !(state.opponent === "bot" && state.current === "white")) cell.classList.add("valid");
      if (state.lastMove && state.lastMove.row === row && state.lastMove.col === col) cell.classList.add("just-played");
      if (piece) cell.innerHTML = `<span class="piece ${piece}"></span>`;
      cell.addEventListener("click", () => playMove(row, col));
      els.board.append(cell);
    }
  }
}

els.newGame.addEventListener("click", startGame);
els.opponentPicker.addEventListener("click", (event) => {
  if (!event.target.matches("button[data-opponent]")) return;
  state.opponent = event.target.dataset.opponent;
  startGame();
});

startGame();
