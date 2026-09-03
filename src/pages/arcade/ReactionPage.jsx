import { useCallback, useEffect, useRef, useState } from "react";
import ArcadeGameHeader from "../../components/ArcadeGameHeader.jsx";
import ScoreModal from "../../components/ScoreModal.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { useArcadeScore } from "../../lib/useArcadeScore.js";

const GAME = getGameMeta("reaction");
const ROUNDS = 3;
const LIGHT_STEP_MS = 550;

// idle -> lighting (lights coming on one by one) -> armed (all lit, waiting
// for the random go-dark delay) -> go (lights out, timing) -> result
export default function ReactionPage() {
  const { best, submit } = useArcadeScore(GAME.slug);
  const [showBoard, setShowBoard] = useState(false);
  const [phase, setPhase] = useState("idle");
  const [litCount, setLitCount] = useState(0);
  const [round, setRound] = useState(0);
  const [times, setTimes] = useState([]);
  const [lastMessage, setLastMessage] = useState("");
  const [average, setAverage] = useState(null);
  const [result, setResult] = useState(null);
  const [showLb, setShowLb] = useState(false);
  const timeouts = useRef([]);
  const goAtRef = useRef(0);

  const clearTimers = useCallback(() => {
    timeouts.current.forEach(clearTimeout);
    timeouts.current = [];
  }, []);

  const startRound = useCallback(() => {
    clearTimers();
    setLastMessage("");
    setLitCount(0);
    setPhase("lighting");
    for (let i = 1; i <= 5; i++) {
      timeouts.current.push(setTimeout(() => setLitCount(i), i * LIGHT_STEP_MS));
    }
    const armDelay = 5 * LIGHT_STEP_MS;
    timeouts.current.push(
      setTimeout(() => {
        setPhase("armed");
        const goDelay = 1000 + Math.random() * 2500;
        timeouts.current.push(
          setTimeout(() => {
            setPhase("go");
            setLitCount(0);
            goAtRef.current = performance.now();
          }, goDelay),
        );
      }, armDelay),
    );
  }, [clearTimers]);

  useEffect(() => clearTimers, [clearTimers]);

  function beginGame() {
    setShowBoard(true);
    setRound(1);
    setTimes([]);
    setAverage(null);
    setResult(null);
    startRound();
  }

  function handleTap() {
    if (phase === "lighting" || phase === "armed") {
      clearTimers();
      setPhase("falseStart");
      setLastMessage("Jumped the lights! That round doesn't count — try again.");
      return;
    }
    if (phase === "go") {
      const reaction = Math.round(performance.now() - goAtRef.current);
      const nextTimes = [...times, reaction];
      setTimes(nextTimes);
      if (round >= ROUNDS) {
        const avg = Math.round(nextTimes.reduce((a, b) => a + b, 0) / nextTimes.length);
        setAverage(avg);
        setPhase("done");
        submit(avg).then(setResult);
      } else {
        setLastMessage(`Round ${round}: ${reaction}ms`);
        setPhase("roundDone");
        setRound((r) => r + 1);
      }
    }
  }

  function nextRound() {
    startRound();
  }
  function retryFalseStart() {
    startRound();
  }

  return (
    <div className="app-page">
      <ArcadeGameHeader title={GAME.label} emoji={GAME.emoji} best={best} unit={GAME.unit} onShowLeaderboard={() => setShowLb(true)} />

      <div className="app-arcade-board">
        {!showBoard ? (
          <div className="app-arcade-overlay-msg">
            <h3>{GAME.emoji} Ready?</h3>
            <p className="app-empty">{GAME.blurb}</p>
            <button type="button" className="app-arcade-btn" onClick={beginGame}>
              Start game
            </button>
          </div>
        ) : (
          <>
            <div className="app-arcade-stats-row">
              <span className="app-arcade-stat-pill">Round {Math.min(round, ROUNDS)} / {ROUNDS}</span>
            </div>

            <div
              onClick={phase === "lighting" || phase === "armed" || phase === "go" ? handleTap : undefined}
              style={{
                display: "flex",
                gap: 10,
                padding: "20px 28px",
                background: "#1c1810",
                borderRadius: 14,
                cursor: phase === "lighting" || phase === "armed" || phase === "go" ? "pointer" : "default",
                touchAction: "manipulation",
              }}
            >
              {[1, 2, 3, 4, 5].map((n) => (
                <span
                  key={n}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "50%",
                    background: n <= litCount ? "#f6a8cd" : "#3a352a",
                    display: "inline-block",
                    boxShadow: n <= litCount ? "0 0 10px #f6a8cd" : "none",
                  }}
                />
              ))}
            </div>

            {phase === "idle" && (
              <button type="button" className="app-arcade-btn" onClick={startRound}>
                Go to lights
              </button>
            )}
            {(phase === "lighting" || phase === "armed" || phase === "go") && (
              <>
                <p className="app-empty">
                  {phase === "go" ? "GO! Tap now!" : "Wait for all lights to go out, then tap!"}
                </p>
                <button
                  type="button"
                  className="app-arcade-btn"
                  onClick={handleTap}
                  style={
                    phase === "go"
                      ? { background: "#a3e6a1", fontSize: "1.1rem", padding: "16px 36px" }
                      : undefined
                  }
                >
                  {phase === "go" ? "TAP NOW!" : "TAP"}
                </button>
              </>
            )}
            {phase === "falseStart" && (
              <div className="app-arcade-overlay-msg">
                <h3>⚠️ Too soon</h3>
                <p className="app-empty">{lastMessage}</p>
                <button type="button" className="app-arcade-btn" onClick={retryFalseStart}>
                  Retry round
                </button>
              </div>
            )}
            {phase === "roundDone" && (
              <div className="app-arcade-overlay-msg">
                <h3>{lastMessage}</h3>
                <button type="button" className="app-arcade-btn" onClick={nextRound}>
                  Next round
                </button>
              </div>
            )}
            {phase === "done" && (
              <div className="app-arcade-overlay-msg">
                <h3>Average: {average}ms</h3>
                <p className="app-empty">{times.join("ms, ")}ms across {ROUNDS} rounds</p>
                {result?.isNewBest && <p className="app-empty">🎉 New best!</p>}
                <button type="button" className="app-arcade-btn" onClick={beginGame}>
                  Play again
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {showLb && <ScoreModal game={GAME} onClose={() => setShowLb(false)} />}
    </div>
  );
}
