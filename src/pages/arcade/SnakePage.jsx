import { useEffect, useRef, useState, useCallback } from "react";
import ArcadeGameHeader from "../../components/ArcadeGameHeader.jsx";
import ScoreModal from "../../components/ScoreModal.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { useArcadeScore } from "../../lib/useArcadeScore.js";

const GAME = getGameMeta("snake");
const GRID = 20; // cells per side
const CELL = 20; // px per cell at 1x — canvas is GRID*CELL, scaled by CSS
const START_SPEED = 160; // ms per tick
const MIN_SPEED = 70;
const SPEED_STEP = 4; // ms faster per food eaten

function randomCell(exclude) {
  let cell;
  do {
    cell = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
  } while (exclude.some((c) => c.x === cell.x && c.y === cell.y));
  return cell;
}

export default function SnakePage() {
  const canvasRef = useRef(null);
  const { best, submit } = useArcadeScore(GAME.slug);
  const [showBoard, setShowBoard] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [showLb, setShowLb] = useState(false);

  // All mutable game state lives in a ref so the render loop (rAF) never
  // has to fight React's render cycle for it — only score/gameOver (for
  // the UI overlay) go through setState.
  const state = useRef(null);

  const resetState = useCallback(() => {
    const startSnake = [
      { x: 10, y: 10 },
      { x: 9, y: 10 },
      { x: 8, y: 10 },
    ];
    state.current = {
      snake: startSnake,
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: randomCell(startSnake),
      speed: START_SPEED,
      acc: 0,
      lastTs: 0,
      over: false,
    };
    setScore(0);
    setGameOver(false);
    setResult(null);
  }, []);

  function turn(dx, dy) {
    const s = state.current;
    if (!s || s.over) return;
    // Can't reverse directly into yourself.
    if (s.dir.x === -dx && s.dir.y === -dy) return;
    s.nextDir = { x: dx, y: dy };
  }

  useEffect(() => {
    function onKey(e) {
      const map = {
        ArrowUp: [0, -1], w: [0, -1], W: [0, -1],
        ArrowDown: [0, 1], s: [0, 1], S: [0, 1],
        ArrowLeft: [-1, 0], a: [-1, 0], A: [-1, 0],
        ArrowRight: [1, 0], d: [1, 0], D: [1, 0],
      };
      if (map[e.key]) {
        e.preventDefault();
        turn(...map[e.key]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (!showBoard) return;
    resetState();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;

    function tick(ts) {
      const s = state.current;
      if (!s.over) {
        if (!s.lastTs) s.lastTs = ts;
        s.acc += ts - s.lastTs;
        s.lastTs = ts;

        while (s.acc >= s.speed) {
          s.acc -= s.speed;
          s.dir = s.nextDir;
          const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y };
          // Wrap-around walls.
          head.x = (head.x + GRID) % GRID;
          head.y = (head.y + GRID) % GRID;

          const hitSelf = s.snake.some((c) => c.x === head.x && c.y === head.y);
          if (hitSelf) {
            s.over = true;
            setGameOver(true);
            break;
          }

          s.snake.unshift(head);
          if (head.x === s.food.x && head.y === s.food.y) {
            s.food = randomCell(s.snake);
            s.speed = Math.max(MIN_SPEED, s.speed - SPEED_STEP);
            setScore((sc) => sc + 10);
          } else {
            s.snake.pop();
          }
        }
      }

      // Draw.
      ctx.fillStyle = "#f2e8d8";
      ctx.fillRect(0, 0, GRID * CELL, GRID * CELL);
      ctx.fillStyle = "#f6a8cd";
      ctx.fillRect(s.food.x * CELL + 2, s.food.y * CELL + 2, CELL - 4, CELL - 4);
      s.snake.forEach((c, i) => {
        ctx.fillStyle = i === 0 ? "#1c1810" : "#a3e6a1";
        ctx.fillRect(c.x * CELL + 1, c.y * CELL + 1, CELL - 2, CELL - 2);
      });

      if (!s.over) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBoard]);

  useEffect(() => {
    if (gameOver) {
      submit(score).then(setResult);
    }
  }, [gameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="app-page">
      <ArcadeGameHeader title={GAME.label} emoji={GAME.emoji} best={best} unit={GAME.unit} onShowLeaderboard={() => setShowLb(true)} />

      <div className="app-arcade-board">
        {!showBoard ? (
          <div className="app-arcade-overlay-msg">
            <h3>{GAME.emoji} Ready?</h3>
            <p className="app-empty">{GAME.blurb}</p>
            <button type="button" className="app-arcade-btn" onClick={() => setShowBoard(true)}>
              Start game
            </button>
          </div>
        ) : (
          <>
            <div className="app-arcade-stats-row">
              <span className="app-arcade-stat-pill">Score: {score}</span>
            </div>
            <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL} />
            {gameOver && (
              <div className="app-arcade-overlay-msg">
                <h3>Game over — {score} pts</h3>
                {result?.isNewBest && <p className="app-empty">🎉 New best!</p>}
                <button type="button" className="app-arcade-btn" onClick={() => setShowBoard(false)}>
                  Play again
                </button>
              </div>
            )}
            <div className="app-arcade-dpad">
              <button type="button" className="app-arcade-dpad-up" onClick={() => turn(0, -1)} aria-label="Up">↑</button>
              <button type="button" className="app-arcade-dpad-left" onClick={() => turn(-1, 0)} aria-label="Left">←</button>
              <button type="button" className="app-arcade-dpad-down" onClick={() => turn(0, 1)} aria-label="Down">↓</button>
              <button type="button" className="app-arcade-dpad-right" onClick={() => turn(1, 0)} aria-label="Right">→</button>
            </div>
          </>
        )}
      </div>

      {showLb && <ScoreModal game={GAME} onClose={() => setShowLb(false)} />}
    </div>
  );
}
