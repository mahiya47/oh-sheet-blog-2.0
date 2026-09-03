import { useEffect, useState } from "react";
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

function ludoAbsolutePos(seat, step) {
  if (step >= LUDO_TRACK_LENGTH - 1) return null; // in the home stretch / home — not on the shared track
  return (LUDO_START_OFFSETS[seat] + step) % LUDO_TRACK_LENGTH;
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
    const roll = lastRoll;
    if (step === 0 && roll !== 6) return;
    if (step + roll > LUDO_TOTAL_STEPS - 1) return;
    socket.emit("ludo:move_token", { roomId, tokenIndex });
  }

  function rematch() {
    socket.emit("game:rematch", { roomId });
  }

  let statusText;
  if (winnerSeat !== null) statusText = winnerSeat === seat ? "You win! 🎉" : "You lose! 💀";
  else if (rolling) statusText = "Rolling...";
  else if (!myTurn) statusText = "Waiting on opponent...";
  else if (canMove) statusText = "Pick a token to move";
  else if (noMoveMsg) statusText = "No legal move — turn passed.";
  else statusText = "Your turn — roll the dice!";

  return (
    <div className="app-page">
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

        <div className="app-ludo-track">
          {Array.from({ length: LUDO_TRACK_LENGTH }, (_, absPos) => {
            const occupants = [];
            tokens.forEach((seatTokens, s) => {
              seatTokens.forEach((step, tIdx) => {
                if (ludoAbsolutePos(s, step) === absPos) occupants.push({ s, tIdx });
              });
            });
            return (
              <div key={absPos} className={"app-ludo-square" + (LUDO_SAFE_SQUARES.includes(absPos) ? " is-safe" : "")}>
                {LUDO_SAFE_SQUARES.includes(absPos) && <span className="app-ludo-star">★</span>}
                {occupants.map(({ s, tIdx }) => (
                  <span key={`${s}-${tIdx}`} className="app-ludo-token" style={{ background: PLAYER_HEX[colors[s]] }} />
                ))}
              </div>
            );
          })}
        </div>

        <div className="app-ludo-players">
          {[0, 1].map((s) => (
            <div key={s} className="app-ludo-player-row">
              <span className="app-ludo-player-label" style={{ color: PLAYER_HEX[colors[s]] }}>
                {s === seat ? "You" : "Them"} ({colors[s]})
              </span>
              <div className="app-ludo-yard-tokens">
                {tokens[s].map((step, tIdx) => {
                  const inYard = step === 0;
                  const home = step >= LUDO_TOTAL_STEPS - 1;
                  const label = home ? "🏠" : inYard ? "🏡" : String(step);
                  const clickable = s === seat && canMove;
                  return (
                    <button
                      key={tIdx}
                      type="button"
                      className={"app-ludo-yard-token" + (clickable ? " is-clickable" : "")}
                      style={{ borderColor: PLAYER_HEX[colors[s]] }}
                      disabled={!clickable}
                      onClick={() => moveToken(tIdx)}
                    >
                      {label || tIdx + 1}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
