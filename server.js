require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const { Chess } = require("chess.js");
const cors = require("cors");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Adjust this in production
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

const games = {}; // Store active games

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  socket.on("createGame", () => {
    const gameId = Math.random().toString(36).substring(2, 7); // Generate short random code
    games[gameId] = { game: new Chess(), players: [] };
    socket.join(gameId);
    socket.emit("gameCreated", { gameId });
    console.log(`Game created: ${gameId}`);
  });

  socket.on("joinGame", ({ gameId }) => {
    if (games[gameId] && games[gameId].players.length < 2) {
      games[gameId].players.push(socket.id);
      socket.join(gameId);
      socket.emit("joinedGame", { gameId });
      console.log(`User joined game: ${gameId}`);
    } else {
      socket.emit("error", "Game full or not found");
    }
  });

  socket.on("move", ({ gameId, move }) => {
    if (games[gameId]) {
      const game = games[gameId].game;
      
      // Validate and apply the move on the server-side
      const validMove = game.move(move);
      
      if (validMove) {
        io.to(gameId).emit("move", {
          fen: game.fen(),  // Send the updated board state
          move: validMove,   // Send the move data
        });
      } else {
        socket.emit("error", "Invalid move attempted");
      }
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});

server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
