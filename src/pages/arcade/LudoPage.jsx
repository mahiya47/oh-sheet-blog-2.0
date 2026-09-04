import { useEffect, useMemo, useState } from "react";
import ChallengeGate from "../../components/ChallengeGate.jsx";
import MultiplayerHeader from "../../components/MultiplayerHeader.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { useChallengeFlow } from "../../lib/useChallengeFlow.js";

const GAME = getGameMeta("ludo");

const LUDO_TRACK_LENGTH = 52;
const LUDO_TOTAL_STEPS = 58; // 52 track squares + 6-square home stretch; index 57 = finished
const LUDO_START_OFFSETS = [0, 13, 26, 39];
const LUDO_SAFE_SQUARES = [0, 8, 13, 21, 26, 34, 39, 47];
const PLAYER_HEX = { red: "#ef5350", green: "#4caf50", yellow: "#ffca28", blue: "#42a5f5" };
const DICE_FACES = ["", "⚀", "⚁", "⚂", "⚃", "⚄", "⚅"];

// The classic cross-shaped 15x15 board layout — same coordinates every real
// Ludo board uses. Index 0 of each of these always belongs to seat 0 (top-
// left corner), index 1 to seat 1 (top-right), and so on — which lines up
// exactly with how LUDO_START_OFFSETS/tokens already index by seat, so no
// extra color-to-corner mapping is needed anywhere below.
const TRACK_COORDS = [
  [6, 1], [6, 2], [6, 3], [6, 4], [6, 5],
  [5, 6], [4, 6], [3, 6], [2, 6], [1, 6], [0, 6],
  [0, 7],
  [0, 8],
  [1, 8], [2, 8], [3, 8], [4, 8], [5, 8],
  [6, 9], [6, 10], [6, 11], [6, 12], [6, 13], [6, 14],
  [7, 14],
  [8, 14],
  [8, 13], [8, 12], [8, 11], [8, 10], [8, 9],
  [9, 8], [10, 8], [11, 8], [12, 8], [13, 8], [14, 8],
  [14, 7],
  [14, 6],
  [13, 6], [12, 6], [11, 6], [10, 6], [9, 6],
  [8, 5], [8, 4], [8, 3], [8, 2], [8, 1], [8, 0],
  [7, 0],
  [6, 0],
];

const HOME_STRETCH_COORDS = [
  [[7, 1], [7, 2], [7, 3], [7, 4], [7, 5], [7, 6]],
  [[1, 7], [2, 7], [3, 7], [4, 7], [5, 7], [6, 7]],
  [[7, 13], [7, 12], [7, 11], [7, 10], [7, 9], [7, 8]],
  [[13, 7], [12, 7], [11, 7], [10, 7], [9, 7], [8, 7]],
];

const YARD_COORDS = [
  [[1.7, 1.7], [1.7, 3.3], [3.3, 1.7], [3.3, 3.3]],
  [[1.7, 10.7], [1.7, 12.3], [3.3, 10.7], [3.3, 12.3]],
  [[10.7, 10.7], [10.7, 12.3], [12.3, 10.7], [12.3, 12.3]],
  [[10.7, 1.7], [10.7, 3.3], [12.3, 1.7], [12.3, 3.3]],
];

const YARD_QUAD_SPANS = [
  { gridRow: "1 / 7", gridColumn: "1 / 7" },
  { gridRow: "1 / 7", gridColumn: "10 / 16" },
  { gridRow: "10 / 16", gridColumn: "10 / 16" },
  { gridRow: "10 / 16", gridColumn: "1 / 7" },
];

const trackCellSet = new Set(TRACK_COORDS.map(([r, c]) => `${r},${c}`));
const safeCellSet = new Set(LUDO_SAFE_SQUARES.map((idx) => TRACK_COORDS[idx].join(",")));

// Board geometry never changes, so this is computed once at module load
// rather than on every render.
const BOARD_CELLS = (() => {
  const cells = [];
  for (let r = 0; r < 15; r++) {
    for (let c = 0; c < 15; c++) {
      const key = `${r},${c}`;
      const isYard = (r < 6 && c < 6) || (r < 6 && c > 8) || (r > 8 && c < 6) || (r > 8 && c > 8);
      const isCenter = r >= 6 && r <= 8 && c >= 6 && c <= 8;
      const isTrack = trackCellSet.has(key);
      const isSafe = safeCellSet.has(key);
      let homeStretchSeat = null;
      HOME_STRETCH_COORDS.forEach((coords, seat) => {
        if (coords.some(([hr, hc]) => hr === r && hc === c)) homeStretchSeat = seat;
      });
      cells.push({ r, c, isYard, isCenter, isTrack, isSafe, homeStretchSeat });
    }
  }
  return cells;
})();

function ludoAbsolutePos(seat, step) {
  if (step >= LUDO_TRACK_LENGTH - 1) return null; // in the home stretch / home — not on the shared track
  return (LUDO_START_OFFSETS[seat] + step) % LUDO_TRACK_LENGTH;
}

// Board-percentage [row, col] center for a token, given its seat and step —
// mirrors ludoAbsolutePos but returns board coordinates instead of a track
// index, for the yard/home-stretch/home cases too.
function tokenBoardCoord(seat, step, tokenIndex) {
  if (step === 0) return YARD_COORDS[seat][tokenIndex];
  if (step === LUDO_TOTAL_STEPS - 1) return [7, 7];
  if (step >= LUDO_TRACK_LENGTH - 1) return HOME_STRETCH_COORDS[seat][step - (LUDO_TRACK_LENGTH - 1)];
  return TRACK_COORDS[ludoAbsolutePos(seat, step)];
}

export default function LudoPage() {
  const flow = useChallengeFlow("ludo");
  const { phase, roomId, seat, socket, initialGame, opponent, leaveGame } = flow;

  const [tokens, setTokens] = useState([[0, 0, 0, 0], [0, 0, 0, 0]]);
  const [colors, setColors] = useState(["red", "green"]);
  const [turn, setTurn] = useState(0);
  const [winnerSeat, setWinnerSeat] = useState(null);
  const [lastRoll, setLastRoll] = useState(null);
  const [canMove, setCanMove] = useState(false);
  const [rolling, setRolling] = useState(false);
  const [noMoveMsg, setNoMoveMsg] = useState(false);

  useEffect(() => {
    if (initialGame) {
      setTokens(initialGame.tokens);
      setColors(initialGame.colors || ["red", "green"]);
      setTurn(initialGame.turn);
      setWinnerSeat(initialGame.winner);
      setLastRoll(null);
      setCanMove(false);
    }
  }, [initialGame]);

  useEffect(() => {
    if (phase !== "playing") return;

    function onRollResult(data) {
      setTokens(data.tokens);
      setTurn(data.turn);
      setLastRoll(data.roll);
      setRolling(false);
      setNoMoveMsg(data.noMove);
      setCanMove(!data.noMove && data.seat === seat);
    }
    function onMoveApplied(data) {
      setTokens(data.tokens);
      setTurn(data.turn);
      setCanMove(false);
      setLastRoll(data.extraTurn ? data.roll : null);
      if (data.winnerSeat !== null && data.winnerSeat !== undefined) setWinnerSeat(data.winnerSeat);
    }
    function onRematchStart(data) {
      setTokens(data.game.tokens);
      setTurn(data.game.turn);
      setWinnerSeat(null);
      setLastRoll(null);
      setCanMove(false);
    }

    socket.on("ludo:roll_result", onRollResult);
    socket.on("ludo:move_applied", onMoveApplied);
    socket.on("game:rematch_start", onRematchStart);
    return () => {
      socket.off("ludo:roll_result", onRollResult);
      socket.off("ludo:move_applied", onMoveApplied);
      socket.off("game:rematch_start", onRematchStart);
    };
  }, [phase, seat, socket]);

  // Every token that can currently be legally moved, keyed the same way as
  // the board loop below — used to decide which circles glow and respond
  // to a tap.
  const movable = useMemo(() => {
    const set = new Set();
    if (canMove && lastRoll) {
      tokens[seat].forEach((step, tokenIndex) => {
        if (step === LUDO_TOTAL_STEPS - 1) return;
        if (step === 0 && lastRoll !== 6) return;
        if (step + lastRoll > LUDO_TOTAL_STEPS - 1) return;
        set.add(tokenIndex);
      });
    }
    return set;
  }, [canMove, lastRoll, tokens, seat]);

  if (phase !== "playing") {
    return <ChallengeGate flow={flow} gameLabel={GAME.label} gameEmoji={GAME.emoji} />;
  }

  const myTurn = winnerSeat === null && turn === seat;
  const myColor = colors[seat];
  const theirColor = colors[seat === 0 ? 1 : 0];

  function roll() {
    if (!myTurn || rolling || (lastRoll && canMove)) return;
    setRolling(true);
    socket.emit("ludo:roll", { roomId });
  }

  function moveToken(tokenIndex) {
    if (!canMove) return;
    const step = tokens[seat][tokenIndex];
    const rollValue = lastRoll;
    if (step === 0 && rollValue !== 6) return;
    if (step + rollValue > LUDO_TOTAL_STEPS - 1) return;
    socket.emit("ludo:move_token", { roomId, tokenIndex });
  }

  function rematch() {
    socket.emit("game:rematch", { roomId });
  }

  let statusText;
  if (winnerSeat !== null) statusText = winnerSeat === seat ? "You win! 🎉" : "You lose! 💀";
  else if (rolling) statusText = "Rolling...";
  else if (!myTurn) statusText = "Waiting on opponent...";
  else if (canMove) statusText = "Tap a glowing token to move it";
  else if (noMoveMsg) statusText = "No legal move — turn passed.";
  else statusText = "Your turn — roll the dice!";

  return (
    <div className="app-page app-arcade-page">
      <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle={`vs ${opponent?.name || opponent?.username || "opponent"}`} />

      <div className="app-arcade-board">
        <div className="app-arcade-stats-row">
          <span className="app-arcade-stat-pill" style={{ borderColor: PLAYER_HEX[myColor] }}>
            You: {myColor}
          </span>
          <span className="app-arcade-stat-pill" style={{ borderColor: PLAYER_HEX[theirColor] }}>
            Them: {theirColor}
          </span>
        </div>

        <h3 className="app-rps-status">{statusText}</h3>

        <div className="app-ludo-board">
          {BOARD_CELLS.map((cell) => {
            let className = "app-ludo-cell";
            const style = {};
            if (cell.isCenter) {
              className += " app-ludo-cell-center";
            } else if (cell.homeStretchSeat !== null) {
              className += " app-ludo-cell-home";
              const seatColor = cell.homeStretchSeat < 2 ? PLAYER_HEX[colors[cell.homeStretchSeat]] : "#9a9284";
              style.background = seatColor + "3d";
            } else if (cell.isTrack) {
              className += " app-ludo-cell-track";
            } else if (cell.isYard) {
              className += " app-ludo-cell-yard";
            }
            return (
              <div
                key={`${cell.r}-${cell.c}`}
                className={className}
                style={{ gridRow: cell.r + 1, gridColumn: cell.c + 1, ...style }}
              >
                {cell.isSafe && <span className="app-ludo-safe-dot" />}
              </div>
            );
          })}

          {YARD_QUAD_SPANS.map((span, i) => {
            const active = i < 2;
            const color = active ? PLAYER_HEX[colors[i]] : null;
            return (
              <div
                key={i}
                className="app-ludo-yard-quad"
                style={{
                  gridRow: span.gridRow,
                  gridColumn: span.gridColumn,
                  background: active ? color + "26" : "rgba(28,24,16,0.06)",
                  borderColor: active ? color : "rgba(28,24,16,0.18)",
                }}
              />
            );
          })}

          <div className="app-ludo-center" />

          {[0, 1].map((s) =>
            tokens[s].map((step, tokenIndex) => {
              const [row, col] = tokenBoardCoord(s, step, tokenIndex);
              const canTapThis = s === seat && movable.has(tokenIndex);
              return (
                <button
                  key={`${s}-${tokenIndex}`}
                  type="button"
                  className={"app-ludo-piece" + (canTapThis ? " is-movable" : "")}
                  style={{
                    top: `${((row + 0.5) / 15) * 100}%`,
                    left: `${((col + 0.5) / 15) * 100}%`,
                    background: PLAYER_HEX[colors[s]],
                  }}
                  disabled={!canTapThis}
                  aria-label={`${colors[s]} token ${tokenIndex + 1}`}
                  onClick={() => canTapThis && moveToken(tokenIndex)}
                />
              );
            }),
          )}
        </div>

        <div className="app-snl-controls">
          {lastRoll && <span className="app-snl-dice">{DICE_FACES[lastRoll]}</span>}
          {winnerSeat === null && (
            <button type="button" className="app-arcade-btn" disabled={!myTurn || rolling || canMove} onClick={roll}>
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
