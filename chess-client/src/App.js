import React, { useState, useEffect } from "react";
import { io } from "socket.io-client";
import { Chess } from "chess.js"; // FIXED import
import { Chessboard } from "react-chessboard";

const socket = io("https://chess-room-backend.onrender.com");

function App() {
  const [gameId, setGameId] = useState(null);
  const [chess, setChess] = useState(new Chess());
  const [fen, setFen] = useState(chess.fen());

  useEffect(() => {
    socket.on("gameCreated", ({ gameId }) => {
      setGameId(gameId);
      console.log("Game ID:", gameId);
    });
  
    socket.on("joinedGame", ({ gameId }) => {
      setGameId(gameId);
      console.log("Joined game:", gameId);
    });
  
    socket.on("move", ({ fen }) => {
      chess.load(fen);  // Sync the game state from the server
      setFen(fen);
    });
  
    return () => {
      socket.off("gameCreated");
      socket.off("joinedGame");
      socket.off("move");
    };
  }, [chess]);

  const createGame = () => socket.emit("createGame");
  const joinGame = () => {
    const id = prompt("Enter Game ID:");
    if (id) socket.emit("joinGame", { gameId: id });
  };

  const makeMove = (move) => {
    const legalMove = chess.move(move);

    if (legalMove) {
      socket.emit("move", { gameId, move });  // Send move to server
    }
  };

  return (
    <div style={{ textAlign: "center", padding: "20px" }}>
      <h1>Chess Room</h1>
      <button onClick={createGame}>Create Game</button>
      <button onClick={joinGame}>Join Game</button>
      {gameId && <h3>Game ID: {gameId}</h3>}
      <Chessboard
        position={fen}
        onPieceDrop={(source, target) => {
          makeMove({ from: source, to: target });
          return true;  // FIXED to ensure moves are registered
        }}
      />
    </div>
  );
}

export default App;
