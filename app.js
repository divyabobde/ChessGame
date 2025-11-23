const express = require("express");
const socket = require("socket.io");
const http = require("http");
const { Chess } = require("chess.js");
const path = require("path");

const app = express();
const server = http.createServer(app);
const io = socket(server);

const chess = new Chess();

let players = {}; // {white: id, black: id}

app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
    res.render("index", { title: "Chess Game" });
});

io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    // Assign player roles
    if (!players.white) {
        players.white = socket.id;
        socket.emit("playerRole", "w");
    } 
    else if (!players.black) {
        players.black = socket.id;
        socket.emit("playerRole", "b");
    } 
    else {
        socket.emit("spectatorRole");
    }

    // Clean disconnect
    socket.on("disconnect", () => {
        if (socket.id === players.white) delete players.white;
        else if (socket.id === players.black) delete players.black;
    });

    // Handle moves
    socket.on("move", (move) => {
        try {
            if (chess.turn() === "w" && socket.id !== players.white) return;
            if (chess.turn() === "b" && socket.id !== players.black) return;

            const result = chess.move(move);

            if (result) {
                io.emit("move", move);
                io.emit("boardState", chess.fen());
            } else {
                socket.emit("invalidMove", move);
            }
        } catch (error) {
            console.log(error);
            socket.emit("invalidMove", move);
        }
    });
});

const PORT = process.env.PORT || 3000;

// ✅ CORRECT: Change 'app.listen' to 'server.listen'
server.listen(PORT, function () {
    console.log("Server running on port " + PORT);
});