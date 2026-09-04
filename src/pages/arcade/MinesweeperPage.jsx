import { useEffect, useRef, useState, useCallback } from "react";
import ArcadeGameHeader from "../../components/ArcadeGameHeader.jsx";
import ScoreModal from "../../components/ScoreModal.jsx";
import { getGameMeta, formatArcadeScore } from "../../lib/arcadeGames.js";
import { useArcadeScore } from "../../lib/useArcadeScore.js";

const GAME = getGameMeta("minesweeper");
const ROWS = 10;
const COLS = 10;
const MINES = 15;

function makeBoard(safeIndex) {
  const total = ROWS * COLS;
  const mineSet = new Set();
  while (mineSet.size < MINES) {
    const idx = Math.floor(Math.random() * total);
    if (idx === safeIndex) continue; // first click is always safe
    mineSet.add(idx);
  }
  const cells = Array.from({ length: total }, (_, i) => ({
    mine: mineSet.has(i),
    revealed: false,
    flagged: false,
    adjacent: 0,
  }));
  for (let i = 0; i < total; i++) {
    if (cells[i].mine) continue;
    const r = Math.floor(i / COLS);
    const c = i % COLS;
    let count = 0;
    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS && cells[nr * COLS + nc].mine) count++;
      }
    }
    cells[i].adjacent = count;
  }
  return cells;
}

function floodReveal(cells, startIndex) {
  const stack = [startIndex];
  while (stack.length) {
    const i = stack.pop();
    const cell = cells[i];
    if (cell.revealed || cell.flagged) continue;
    cell.revealed = true;
    if (cell.adjacent === 0 && !cell.mine) {
      const r = Math.floor(i / COLS);
      const c = i % COLS;
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < ROWS && nc >= 0 && nc < COLS) stack.push(nr * COLS + nc);
        }
      }
    }
  }
}

const NUMBER_COLORS = ["", "#2f6fb0", "#3a8a3a", "#c14545", "#7345c1", "#a05a1f", "#1f9aa0", "#1c1810", "#6b6252"];

export default function MinesweeperPage() {
  const { best, submit } = useArcadeScore(GAME.slug);
  const [showBoard, setShowBoard] = useState(false);
  const [cells, setCells] = useState(null);
  const [status, setStatus] = useState("playing"); // playing | won | lost
  const [seconds, setSeconds] = useState(0);
  const [flagMode, setFlagMode] = useState(false);
  const [result, setResult] = useState(null);
  const [showLb, setShowLb] = useState(false);
  const startedRef = useRef(false);
  const timerRef = useRef(null);

  const start = useCallback(() => {
    setCells(null);
    setStatus("playing");
    setSeconds(0);
    setResult(null);
    startedRef.current = false;
    setShowBoard(true);
  }, []);

  useEffect(() => {
    if (status === "playing" && startedRef.current) {
      timerRef.current = setInterval(() => setSeconds((s) => s + 1), 1000);
      return () => clearInterval(timerRef.current);
    }
    clearInterval(timerRef.current);
  }, [status, startedRef.current]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (status === "won") {
      submit(seconds).then(setResult);
    }
  }, [status]); // eslint-disable-line react-hooks/exhaustive-deps

  function checkWin(nextCells) {
    return nextCells.every((c) => c.mine || c.revealed);
  }

  function handleReveal(index) {
    if (status !== "playing") return;
    let board = cells;
    if (!board) {
      board = makeBoard(index);
      startedRef.current = true;
    } else {
      board = board.map((c) => ({ ...c }));
    }
    const cell = board[index];
    if (cell.revealed) {
      setCells(board);
      return;
    }
    if (flagMode) {
      if (!cell.revealed) cell.flagged = !cell.flagged;
      setCells(board);
      return;
    }
    if (cell.flagged) {
      setCells(board);
      return;
    }
    if (cell.mine) {
      cell.revealed = true;
      board.forEach((c) => {
        if (c.mine) c.revealed = true;
      });
      setCells(board);
      setStatus("lost");
      return;
    }
    floodReveal(board, index);
    setCells(board);
    if (checkWin(board)) setStatus("won");
  }

  function handleFlag(e, index) {
    e.preventDefault();
    if (status !== "playing" || !cells) return;
    const board = cells.map((c) => ({ ...c }));
    if (!board[index].revealed) board[index].flagged = !board[index].flagged;
    setCells(board);
  }

  return (
    <div className="app-page app-arcade-page">
      <ArcadeGameHeader title={GAME.label} emoji={GAME.emoji} onShowLeaderboard={() => setShowLb(true)} />

      <div className="app-arcade-board">
        {!showBoard ? (
          <div className="app-arcade-overlay-msg">
            <h3>{GAME.emoji} Ready?</h3>
            <p className="app-empty">{GAME.blurb} Tap the flag toggle to mark mines on mobile.</p>
            <button type="button" className="app-arcade-btn" onClick={start}>
              Start game
            </button>
          </div>
        ) : (
          <>
            <div className="app-arcade-stats-row">
              <span className="app-arcade-stat-pill">⏱ {seconds}s</span>
              <span className="app-arcade-stat-pill">💣 {MINES}</span>
              {best !== null && (
                <span className="app-arcade-stat-pill">Best: {formatArcadeScore(best, GAME.unit)}</span>
              )}
            </div>
            <div className="app-mine-grid" style={{ gridTemplateColumns: `repeat(${COLS}, 28px)` }}>
              {(cells || Array.from({ length: ROWS * COLS }, () => ({ revealed: false, flagged: false }))).map(
                (cell, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleReveal(i)}
                    onContextMenu={(e) => handleFlag(e, i)}
                    disabled={status !== "playing"}
                    className={
                      "app-mine-cell" +
                      (cell.revealed ? " is-revealed" : "") +
                      (cell.revealed && cell.mine ? " is-mine" : "")
                    }
                    style={{ color: NUMBER_COLORS[cell.adjacent] || "var(--app-ink)" }}
                  >
                    {cell.revealed ? (cell.mine ? "💣" : cell.adjacent || "") : cell.flagged ? "🚩" : ""}
                  </button>
                ),
              )}
            </div>

            <button
              type="button"
              className={"app-arcade-btn app-mine-flagmode-btn" + (flagMode ? " is-on" : "")}
              onClick={() => setFlagMode((v) => !v)}
              disabled={status !== "playing"}
            >
              {flagMode ? "🚩 Flag mode: ON" : "🚩 Flag mode: OFF"}
            </button>

            {status !== "playing" && (
              <div className="app-arcade-overlay-msg">
                <h3>{status === "won" ? `Cleared in ${seconds}s!` : "💥 Boom — hit a mine"}</h3>
                {result?.isNewBest && <p className="app-empty">🎉 New best!</p>}
                <button type="button" className="app-arcade-btn" onClick={start}>
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
