import { useEffect, useRef, useState } from "react";
import ArcadeGameHeader from "../../components/ArcadeGameHeader.jsx";
import ScoreModal from "../../components/ScoreModal.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { useArcadeScore } from "../../lib/useArcadeScore.js";
import { useAuth } from "../../context/AuthContext.jsx";

const GAME = getGameMeta("sudoku");

// A valid solved 9x9 grid. Every daily puzzle is a relabeling of this same
// grid (see numMap below), so it's always a legitimate Sudoku solution —
// only the digit-to-digit mapping and which cells are hidden change.
const BASE_BOARD = [
  [5, 3, 4, 6, 7, 8, 9, 1, 2],
  [6, 7, 2, 1, 9, 5, 3, 4, 8],
  [1, 9, 8, 3, 4, 2, 5, 6, 7],
  [8, 5, 9, 7, 6, 1, 4, 2, 3],
  [4, 2, 6, 8, 5, 3, 7, 9, 1],
  [7, 1, 3, 9, 2, 4, 8, 5, 6],
  [9, 6, 1, 5, 3, 7, 2, 8, 4],
  [2, 8, 7, 4, 1, 9, 6, 3, 5],
  [3, 4, 5, 2, 8, 6, 1, 7, 9],
];

const TARGET_EMPTY = 45;

// --- Deterministic seeded RNG (mulberry32) so everyone gets the SAME
// puzzle on the same UTC calendar day. ---
function hashStringToInt(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function todayKey() {
  return new Date().toISOString().slice(0, 10); // UTC — same puzzle for everyone, everywhere
}
function shuffleSeeded(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function isSafe(grid, r, c, val) {
  for (let i = 0; i < 9; i++) {
    if (grid[r][i] === val || grid[i][c] === val) return false;
  }
  const br = Math.floor(r / 3) * 3;
  const bc = Math.floor(c / 3) * 3;
  for (let i = br; i < br + 3; i++) {
    for (let j = bc; j < bc + 3; j++) {
      if (grid[i][j] === val) return false;
    }
  }
  return true;
}

// Counts solutions to `grid` (0 = empty) via backtracking, stopping as soon
// as `limit` is reached — used only to confirm a candidate puzzle still has
// EXACTLY ONE solution before we accept it as a clue removal. This is the
// check the old site's generator skipped, which is why some of its daily
// puzzles could end up with multiple valid completions.
function countSolutions(grid, limit) {
  let count = 0;
  const g = grid.map((row) => [...row]);

  function backtrack() {
    if (count >= limit) return;
    let r = -1,
      c = -1;
    outer: for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        if (g[i][j] === 0) {
          r = i;
          c = j;
          break outer;
        }
      }
    }
    if (r === -1) {
      count++;
      return;
    }
    for (let val = 1; val <= 9 && count < limit; val++) {
      if (isSafe(g, r, c, val)) {
        g[r][c] = val;
        backtrack();
        g[r][c] = 0;
      }
    }
  }

  backtrack();
  return count;
}

function generateDailyPuzzle(dateKey) {
  const rng = mulberry32(hashStringToInt(dateKey));

  const numMap = shuffleSeeded([1, 2, 3, 4, 5, 6, 7, 8, 9], rng);
  const solution = BASE_BOARD.map((row) => row.map((val) => numMap[val - 1]));

  const attempt = solution.map((row) => [...row]);
  const cellOrder = shuffleSeeded(
    Array.from({ length: 81 }, (_, i) => i),
    rng,
  );

  let removed = 0;
  for (const idx of cellOrder) {
    if (removed >= TARGET_EMPTY) break;
    const r = Math.floor(idx / 9);
    const c = idx % 9;
    const backup = attempt[r][c];
    attempt[r][c] = 0;
    // Cap the solver's search at 2 solutions — we only need to know
    // whether it's unique, not how many there are.
    if (countSolutions(attempt, 2) === 1) {
      removed++;
    } else {
      attempt[r][c] = backup;
    }
  }

  return attempt.map((row, r) =>
    row.map((val, c) => ({
      val: solution[r][c],
      isFixed: attempt[r][c] !== 0,
      userVal: null,
    })),
  );
}

const validateBoard = (board) => {
  const getVal = (cell) => (cell.isFixed ? cell.val : cell.userVal);
  for (let r = 0; r < 9; r++) {
    for (let c = 0; c < 9; c++) {
      const val = getVal(board[r][c]);
      if (!val) return false;
      for (let i = 0; i < 9; i++) {
        if (i !== c && getVal(board[r][i]) === val) return false;
        if (i !== r && getVal(board[i][c]) === val) return false;
      }
      const startR = Math.floor(r / 3) * 3;
      const startC = Math.floor(c / 3) * 3;
      for (let i = startR; i < startR + 3; i++) {
        for (let j = startC; j < startC + 3; j++) {
          if ((i !== r || j !== c) && getVal(board[i][j]) === val) return false;
        }
      }
    }
  }
  return true;
};

export default function SudokuPage() {
  const { user, loading: authLoading } = useAuth();
  const { best, submit } = useArcadeScore(GAME.slug);

  const dateKey = todayKey();
  // Scoped per-account so "already solved today" can't leak between two
  // people sharing a browser — checked again once auth finishes loading,
  // since the very first render doesn't know who's logged in yet.
  const solvedKey = `sudoku-solved-${dateKey}-${user?.username || "guest"}`;
  const [board, setBoard] = useState(() => generateDailyPuzzle(dateKey));
  const [selectedCell, setSelectedCell] = useState(null);

  const [alreadySolvedToday, setAlreadySolvedToday] = useState(false);
  const [gameState, setGameState] = useState("playing");
  const [timer, setTimer] = useState(0);
  const [showLb, setShowLb] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (authLoading) return;
    if (localStorage.getItem(solvedKey) === "1") {
      setAlreadySolvedToday(true);
      setGameState("won");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, solvedKey]);

  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => setTimer((p) => p + 1), 1000);
    } else {
      clearInterval(timerRef.current);
    }
    return () => clearInterval(timerRef.current);
  }, [gameState]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (gameState !== "playing" || !selectedCell) return;
      if (e.key >= "1" && e.key <= "9") {
        handleInput(parseInt(e.key, 10));
      } else if (e.key === "Backspace" || e.key === "Delete") {
        handleInput(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCell, gameState, board]);

  async function handleInput(num) {
    if (gameState !== "playing" || !selectedCell) return;
    const { r, c } = selectedCell;
    if (board[r][c].isFixed) return;

    const newBoard = board.map((row) => row.map((cell) => ({ ...cell })));
    newBoard[r][c].userVal = num;
    setBoard(newBoard);

    if (validateBoard(newBoard)) {
      setGameState("won");
      localStorage.setItem(solvedKey, "1");
      await submit(timer); // streak games ignore the raw number server-side — the streak is computed there
    }
  }

  function handleCellClick(r, c) {
    if (gameState === "playing") setSelectedCell({ r, c });
  }

  if (!board.length) return null;

  return (
    <div className="app-page app-arcade-page">
      <ArcadeGameHeader title={GAME.label} emoji={GAME.emoji} onShowLeaderboard={() => setShowLb(true)} />

      <div className="app-arcade-board">
        <div className="app-arcade-stats-row">
          <span className="app-arcade-stat-pill">⏱ {timer}s</span>
          <span className="app-arcade-stat-pill">🔥 {best ?? 0} day streak</span>
        </div>

        <div className={"app-sudoku-grid" + (gameState !== "playing" ? " is-done" : "")}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isSelected = selectedCell?.r === r && selectedCell?.c === c;
              return (
                <button
                  key={`${r}-${c}`}
                  type="button"
                  className={
                    "app-sudoku-cell" +
                    (isSelected ? " is-selected" : "") +
                    (cell.isFixed ? " is-fixed" : "") +
                    (r % 3 === 0 ? " row-edge" : "") +
                    (c % 3 === 0 ? " col-edge" : "")
                  }
                  onClick={() => handleCellClick(r, c)}
                  disabled={cell.isFixed || gameState !== "playing"}
                >
                  {cell.isFixed ? cell.val : cell.userVal || ""}
                </button>
              );
            }),
          )}
        </div>

        {gameState === "playing" && (
          <div className="app-sudoku-numpad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
              <button key={num} type="button" className="app-arcade-btn app-sudoku-numkey" onClick={() => handleInput(num)}>
                {num}
              </button>
            ))}
            <button type="button" className="app-arcade-btn app-sudoku-numkey" onClick={() => handleInput(null)}>
              ⌫
            </button>
          </div>
        )}

        {gameState === "won" && (
          <div className="app-arcade-overlay-msg">
            <h3>{alreadySolvedToday && timer === 0 ? "Already solved today!" : "🎉 Puzzle solved!"}</h3>
            <p className="app-empty">🔥 {best ?? 0} day streak</p>
            <p className="app-empty">Come back tomorrow for a new puzzle.</p>
          </div>
        )}
      </div>

      {showLb && <ScoreModal game={GAME} onClose={() => setShowLb(false)} />}
    </div>
  );
}
