import { useEffect, useState } from "react";
import ChallengeGate from "../../components/ChallengeGate.jsx";
import MultiplayerHeader from "../../components/MultiplayerHeader.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { useChallengeFlow } from "../../lib/useChallengeFlow.js";

const GAME = getGameMeta("tictactoe");

export default function TicTacToePage() {
  const flow = useChallengeFlow("tictactoe");
  const { phase, roomId, seat, socket, initialGame, opponent, leaveGame } = flow;

  const [board, setBoard] = useState(Array(9).fill(null));
  const [turn, setTurn] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [result, setResult] = useState(null); // { winnerSeat } | null

  useEffect(() => {
    if (initialGame) {
      setBoard(initialGame.board);
      setTurn(initialGame.turn);
      setScores(initialGame.scores);
      setResult(null);
    }
  }, [initialGame]);

  useEffect(() => {
    if (phase !== "playing") return;

    function onUpdate(data) {
      setBoard(data.board);
      setTurn(data.turn);
    }
    function onResult(data) {
      setBoard(data.board);
      setScores(data.scores);
      setResult({ winnerSeat: data.winnerSeat });
    }
    function onRematchStart(data) {
      setBoard(data.game.board);
      setTurn(data.game.turn);
      setScores(data.game.scores);
      setResult(null);
    }

    socket.on("ttt:update", onUpdate);
    socket.on("ttt:result", onResult);
    socket.on("game:rematch_start", onRematchStart);
    return () => {
      socket.off("ttt:update", onUpdate);
      socket.off("ttt:result", onResult);
      socket.off("game:rematch_start", onRematchStart);
    };
  }, [phase, socket]);

  if (phase !== "playing") {
    return <ChallengeGate flow={flow} gameLabel={GAME.label} gameEmoji={GAME.emoji} />;
  }

  const mySymbol = seat === 0 ? "X" : "O";
  const myTurn = !result && turn === seat;

  function play(index) {
    if (!myTurn || board[index] !== null) return;
    socket.emit("ttt:move", { roomId, index });
  }

  function rematch() {
    socket.emit("game:rematch", { roomId });
  }

  let statusText;
  if (result) {
    if (result.winnerSeat === null) statusText = "It's a draw! 🤝";
    else if (result.winnerSeat === seat) statusText = "You win! 🎉";
    else statusText = "You lose! 💀";
  } else {
    statusText = myTurn ? "Your turn" : "Their turn...";
  }

  return (
    <div className="app-page">
      <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle={`vs ${opponent?.name || opponent?.username || "opponent"}`} />

      <div className="app-arcade-board">
        <div className="app-arcade-stats-row">
          <span className="app-arcade-stat-pill">You ({mySymbol}) {scores[seat]}</span>
          <span className="app-arcade-stat-pill">Them ({seat === 0 ? "O" : "X"}) {scores[seat === 0 ? 1 : 0]}</span>
        </div>

        <h3 className="app-rps-status">{statusText}</h3>

        <div className="app-ttt-grid">
          {board.map((cell, i) => (
            <button
              key={i}
              type="button"
              className={"app-ttt-cell" + (cell ? " is-filled" : "")}
              disabled={!myTurn || cell !== null}
              onClick={() => play(i)}
            >
              {cell}
            </button>
          ))}
        </div>

        {result && (
          <div className="app-mp-actions">
            <button type="button" className="app-arcade-btn" onClick={rematch}>
              Play Again
            </button>
            <button type="button" className="app-arcade-btn app-mp-leave" onClick={leaveGame}>
              Leave
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
