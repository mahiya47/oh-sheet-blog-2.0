import { useEffect, useState } from "react";
import ChallengeGate from "../../components/ChallengeGate.jsx";
import MultiplayerHeader from "../../components/MultiplayerHeader.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { useChallengeFlow } from "../../lib/useChallengeFlow.js";

const GAME = getGameMeta("snakeandladder");

const SNAKES = { 16: 6, 46: 25, 49: 11, 62: 19, 64: 60, 74: 53, 89: 68, 92: 88, 95: 75, 99: 80 };
const LADDERS = { 2: 38, 7: 14, 8: 31, 15: 26, 21: 42, 28: 84, 36: 44, 51: 67, 71: 91, 78: 98 };
const PLAYER_COLORS = ["#ef5350", "#4caf50"];
const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

// Same boustrophedon numbering as the classic board: row 10 (squares
// 91-100) at the top, alternating direction each row down to row 1.
function buildCellOrder() {
  const rows = [];
  for (let r = 9; r >= 0; r--) {
    const rowStart = r * 10 + 1;
    const row = Array.from({ length: 10 }, (_, i) => rowStart + i);
    if ((9 - r) % 2 === 1) row.reverse();
    rows.push(row);
  }
  return rows.flat();
}
const CELL_ORDER = buildCellOrder();

export default function SnakeLadderPage() {
  const flow = useChallengeFlow("snakeandladder");
  const { phase, roomId, seat, socket, initialGame, opponent, leaveGame } = flow;

  const [positions, setPositions] = useState([0, 0]);
  const [turn, setTurn] = useState(0);
  const [winnerSeat, setWinnerSeat] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const [rolling, setRolling] = useState(false);

  useEffect(() => {
    if (initialGame) {
      setPositions(initialGame.positions);
      setTurn(initialGame.turn);
      setWinnerSeat(initialGame.winner);
      setLastRoll(null);
    }
  }, [initialGame]);

  useEffect(() => {
    if (phase !== "playing") return;

    function onResult(data) {
      setPositions(data.positions);
      setTurn(data.turn);
      setLastRoll({ seat: data.seat, roll: data.roll, bust: data.bust });
      setRolling(false);
      if (data.winnerSeat !== null) setWinnerSeat(data.winnerSeat);
    }
    function onRematchStart(data) {
      setPositions(data.game.positions);
      setTurn(data.game.turn);
      setWinnerSeat(null);
      setLastRoll(null);
    }

    socket.on("snl:result", onResult);
    socket.on("game:rematch_start", onRematchStart);
    return () => {
      socket.off("snl:result", onResult);
      socket.off("game:rematch_start", onRematchStart);
    };
  }, [phase, socket]);

  if (phase !== "playing") {
    return <ChallengeGate flow={flow} gameLabel={GAME.label} gameEmoji={GAME.emoji} />;
  }

  const myTurn = winnerSeat === null && turn === seat;

  function roll() {
    if (!myTurn || rolling) return;
    setRolling(true);
    socket.emit("snl:roll", { roomId });
  }

  function rematch() {
    socket.emit("game:rematch", { roomId });
  }

  let statusText;
  if (winnerSeat !== null) statusText = winnerSeat === seat ? "You win! 🎉" : "You lose! 💀";
  else if (rolling) statusText = "Rolling...";
  else statusText = myTurn ? "Your turn — roll the dice!" : "Waiting on opponent...";

  return (
    <div className="app-page">
      <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle={`vs ${opponent?.name || opponent?.username || "opponent"}`} />

      <div className="app-arcade-board">
        <div className="app-arcade-stats-row">
          <span className="app-arcade-stat-pill" style={{ borderColor: PLAYER_COLORS[seat] }}>
            You: {positions[seat]}
          </span>
          <span className="app-arcade-stat-pill" style={{ borderColor: PLAYER_COLORS[seat === 0 ? 1 : 0] }}>
            Them: {positions[seat === 0 ? 1 : 0]}
          </span>
        </div>

        <h3 className="app-rps-status">{statusText}</h3>
        {lastRoll?.bust && <p className="app-empty">Rolled too high to move — stayed put.</p>}

        <div className="app-snl-grid">
          {CELL_ORDER.map((num) => {
            const occupants = positions
              .map((pos, i) => (pos === num ? i : null))
              .filter((i) => i !== null);
            return (
              <div key={num} className={"app-snl-cell" + (SNAKES[num] ? " has-snake" : "") + (LADDERS[num] ? " has-ladder" : "")}>
                <span className="app-snl-cell-num">{num}</span>
                {SNAKES[num] && <span className="app-snl-cell-icon">🐍</span>}
                {LADDERS[num] && <span className="app-snl-cell-icon">🪜</span>}
                <span className="app-snl-tokens">
                  {occupants.map((i) => (
                    <span key={i} className="app-snl-token" style={{ background: PLAYER_COLORS[i] }} />
                  ))}
                </span>
              </div>
            );
          })}
        </div>

        <div className="app-snl-controls">
          {lastRoll && <span className="app-snl-dice">{DICE_FACES[lastRoll.roll]}</span>}
          {winnerSeat === null && (
            <button type="button" className="app-arcade-btn" disabled={!myTurn || rolling} onClick={roll}>
              Roll Dice
            </button>
          )}
        </div>

        {winnerSeat !== null && (
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
