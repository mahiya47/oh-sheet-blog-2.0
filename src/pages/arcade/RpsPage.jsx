import { useEffect, useState } from "react";
import ChallengeGate from "../../components/ChallengeGate.jsx";
import MultiplayerHeader from "../../components/MultiplayerHeader.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { useChallengeFlow } from "../../lib/useChallengeFlow.js";

const GAME = getGameMeta("rps");

const WEAPONS = {
  ROCK: { name: "Rock", icon: "✊" },
  PAPER: { name: "Paper", icon: "✋" },
  SCISSORS: { name: "Scissors", icon: "✌️" },
};

export default function RpsPage() {
  const flow = useChallengeFlow("rps");
  const { phase, roomId, seat, socket, initialGame, opponent, leaveGame } = flow;

  const [scores, setScores] = useState([0, 0]);
  const [myChoice, setMyChoice] = useState(null);
  const [opponentChoice, setOpponentChoice] = useState(null);
  const [opponentPicked, setOpponentPicked] = useState(false);
  const [resultMessage, setResultMessage] = useState("");

  useEffect(() => {
    if (initialGame) setScores(initialGame.scores || [0, 0]);
  }, [initialGame]);

  useEffect(() => {
    if (phase !== "playing") return;

    function onOpponentMoved() {
      setOpponentPicked(true);
    }
    function onResult(data) {
      const otherSeat = seat === 0 ? 1 : 0;
      setMyChoice(data.moves[seat]);
      setOpponentChoice(data.moves[otherSeat]);
      setScores(data.scores);
      if (data.winnerSeat === null) setResultMessage("It's a tie! 🤝");
      else if (data.winnerSeat === seat) setResultMessage("You win! 🎉");
      else setResultMessage("You lose! 💀");
    }
    function onRematchStart(data) {
      setScores(data.game.scores);
      setMyChoice(null);
      setOpponentChoice(null);
      setOpponentPicked(false);
      setResultMessage("");
    }

    socket.on("rps:opponent_moved", onOpponentMoved);
    socket.on("rps:result", onResult);
    socket.on("game:rematch_start", onRematchStart);
    return () => {
      socket.off("rps:opponent_moved", onOpponentMoved);
      socket.off("rps:result", onResult);
      socket.off("game:rematch_start", onRematchStart);
    };
  }, [phase, seat, socket]);

  if (phase !== "playing") {
    return <ChallengeGate flow={flow} gameLabel={GAME.label} gameEmoji={GAME.emoji} />;
  }

  function pick(weaponKey) {
    if (myChoice) return;
    setMyChoice(weaponKey);
    socket.emit("rps:move", { roomId, weaponKey });
  }

  function rematch() {
    socket.emit("game:rematch", { roomId });
  }

  const revealed = Boolean(myChoice && opponentChoice);

  return (
    <div className="app-page">
      <MultiplayerHeader title={GAME.label} emoji={GAME.emoji} subtitle={`vs ${opponent?.name || opponent?.username || "opponent"}`} />

      <div className="app-arcade-board">
        <div className="app-arcade-stats-row">
          <span className="app-arcade-stat-pill">You {scores[seat]}</span>
          <span className="app-arcade-stat-pill">Them {scores[seat === 0 ? 1 : 0]}</span>
        </div>

        <h3 className="app-rps-status">
          {!myChoice && "Choose your weapon!"}
          {myChoice && !revealed && "Waiting on opponent..."}
          {revealed && resultMessage}
        </h3>

        <div className="app-rps-arena">
          <div className="app-rps-slot">
            <span className="app-rps-slot-label">You</span>
            <div className="app-rps-hand">{myChoice ? WEAPONS[myChoice].icon : "?"}</div>
          </div>
          <span className="app-rps-vs">VS</span>
          <div className="app-rps-slot">
            <span className="app-rps-slot-label">Them</span>
            <div className="app-rps-hand">{revealed ? WEAPONS[opponentChoice].icon : opponentPicked ? "✅" : "?"}</div>
          </div>
        </div>

        {!myChoice && (
          <div className="app-rps-weapons">
            {Object.keys(WEAPONS).map((key) => (
              <button key={key} type="button" className="app-rps-weapon-btn" onClick={() => pick(key)}>
                {WEAPONS[key].icon}
              </button>
            ))}
          </div>
        )}

        {revealed && (
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
