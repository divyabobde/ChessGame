const socket = io();
const chess = new Chess();
const boardElement = document.querySelector(".chessboard");

let draggedPiece = null;
let sourceSquare = null;
let playerRole = null;

const renderBoard = () => {
    const board = chess.board();
    boardElement.innerHTML = "";

    board.forEach((row, rowindex) => {
        row.forEach((square, squareindex) => {
            const squareElement = document.createElement("div");
            squareElement.classList.add(
                "square",
                (rowindex + squareindex) % 2 === 0 ? "light" : "dark"
            );

            squareElement.dataset.row = rowindex;
            squareElement.dataset.col = squareindex;

            if (square) {
                const pieceElement = document.createElement("div");
                
                // Add class "white" or "black" based on piece color
                pieceElement.classList.add(
                    "piece",
                    square.color === "w" ? "white" : "black"
                );
                
                // Get the symbol
                pieceElement.innerText = getPieceUnicode(square);
                
                // Only allow dragging if it's your turn and your color
                pieceElement.draggable = playerRole === square.color;

                pieceElement.addEventListener("dragstart", (e) => {
                    if (pieceElement.draggable) {
                        draggedPiece = pieceElement;
                        sourceSquare = { row: rowindex, col: squareindex };
                        e.dataTransfer.setData("text/plain", "");
                    }
                });

                pieceElement.addEventListener("dragend", (e) => {
                    draggedPiece = null;
                    sourceSquare = null;
                });

                squareElement.appendChild(pieceElement);
            }

            squareElement.addEventListener("dragover", (e) => {
                e.preventDefault();
            });

            squareElement.addEventListener("drop", (e) => {
                e.preventDefault();
                if (draggedPiece) {
                    const targetSource = {
                        row: parseInt(squareElement.dataset.row),
                        col: parseInt(squareElement.dataset.col),
                    };

                    handleMove(sourceSquare, targetSource);
                }
            });

            boardElement.appendChild(squareElement);
        });
    });

    if (playerRole === 'b') {
        boardElement.classList.add("flipped");
    } else {
        boardElement.classList.remove("flipped");
    }
};

const handleMove = (source, target) => {
    const move = {
        from: `${String.fromCharCode(97 + source.col)}${8 - source.row}`,
        to: `${String.fromCharCode(97 + target.col)}${8 - target.row}`,
        promotion: 'q'
    };

    socket.emit("move", move);
};

const getPieceUnicode = (piece) => {
    const unicodePieces = {
        // Black Pieces (Solid)
        p: "♟", r: "♜", n: "♞", b: "♝", q: "♛", k: "♚",
        
        // White Pieces (Outline)
        P: "♙", R: "♖", N: "♘", B: "♗", Q: "♕", K: "♔",
    };

    // Agar color 'w' hai to Uppercase key use karein, nahi to Lowercase
    if (piece.color === 'w') {
        return unicodePieces[piece.type.toUpperCase()] || "";
    } else {
        return unicodePieces[piece.type] || "";
    }
};

// --- Socket Events ---

socket.on("playerRole", function (role) {
    playerRole = role;
    renderBoard();
});

socket.on("spectatorRole", function () {
    playerRole = null;
    renderBoard();
});

socket.on("boardState", function (fen) {
    chess.load(fen);
    renderBoard();
});

socket.on("move", function (move) {
    chess.move(move);
    renderBoard();
    checkGameOver(); // Check for game over after every move
});

// New Function: Alert when game ends
function checkGameOver() {
    if (chess.game_over()) {
        setTimeout(() => {
            if (chess.in_checkmate()) {
                alert("Game Over: Checkmate!");
            } else if (chess.in_draw()) {
                alert("Game Over: Draw!");
            } else {
                alert("Game Over!");
            }
        }, 500); // Small delay so the player sees the move first
    }
}

renderBoard();