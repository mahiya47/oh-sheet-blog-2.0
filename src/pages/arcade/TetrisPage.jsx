import { useEffect, useRef, useState, useCallback } from "react";
import ArcadeGameHeader from "../../components/ArcadeGameHeader.jsx";
import ScoreModal from "../../components/ScoreModal.jsx";
import { getGameMeta } from "../../lib/arcadeGames.js";
import { useArcadeScore } from "../../lib/useArcadeScore.js";

const GAME = getGameMeta("tetris");
const COLS = 10;
const ROWS = 20;
const CELL = 25;
const LINE_SCORES = [0, 100, 300, 500, 800];

const SHAPES = {
  I: { cells: [[0, 1], [1, 1], [2, 1], [3, 1]], color: "#a3d8f2" },
  O: { cells: [[1, 0], [2, 0], [1, 1], [2, 1]], color: "#f5c945" },
  T: { cells: [[1, 0], [0, 1], [1, 1], [2, 1]], color: "#cdb3f2" },
  S: { cells: [[1, 0], [2, 0], [0, 1], [1, 1]], color: "#a3e6a1" },
  Z: { cells: [[0, 0], [1, 0], [1, 1], [2, 1]], color: "#f6a8cd" },
  J: { cells: [[0, 0], [0, 1], [1, 1], [2, 1]], color: "#8fb8e8" },
  L: { cells: [[2, 0], [0, 1], [1, 1], [2, 1]], color: "#f2b56b" },
};
const SHAPE_KEYS = Object.keys(SHAPES);

function newPiece() {
  const key = SHAPE_KEYS[Math.floor(Math.random() * SHAPE_KEYS.length)];
  return { key, cells: SHAPES[key].cells.map(([x, y]) => ({ x, y })), color: SHAPES[key].color };
}

function rotateCells(cells) {
  // Rotate around the piece's own bounding-box center — good enough for a
  // simple (non-SRS) implementation.
  const maxX = Math.max(...cells.map((c) => c.x));
  return cells.map((c) => ({ x: maxX - c.y, y: c.x }));
}

function makeEmptyGrid() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

export default function TetrisPage() {
  const canvasRef = useRef(null);
  const { best, submit } = useArcadeScore(GAME.slug);
  const [showBoard, setShowBoard] = useState(false);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [showLb, setShowLb] = useState(false);

  const state = useRef(null);

  const collides = useCallback((grid, piece, ox, oy) => {
    return piece.cells.some(({ x, y }) => {
      const nx = x + ox;
      const ny = y + oy;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny < 0) return false;
      return grid[ny][nx];
    });
  }, []);

  const resetState = useCallback(() => {
    state.current = {
      grid: makeEmptyGrid(),
      piece: newPiece(),
      pos: { x: 3, y: -1 },
      dropInterval: 700,
      acc: 0,
      lastTs: 0,
      over: false,
    };
    setScore(0);
    setLines(0);
    setGameOver(false);
    setResult(null);
  }, []);

  const lockPiece = useCallback(() => {
    const s = state.current;
    const { grid, piece, pos } = s;
    piece.cells.forEach(({ x, y }) => {
      const gy = y + pos.y;
      const gx = x + pos.x;
      if (gy >= 0) grid[gy][gx] = piece.color;
    });

    let cleared = 0;
    for (let y = ROWS - 1; y >= 0; y--) {
      if (grid[y].every((cell) => cell)) {
        grid.splice(y, 1);
        grid.unshift(Array(COLS).fill(null));
        cleared++;
        y++;
      }
    }
    if (cleared) {
      setScore((sc) => sc + LINE_SCORES[cleared]);
      setLines((ln) => {
        const next = ln + cleared;
        s.dropInterval = Math.max(120, 700 - Math.floor(next / 5) * 50);
        return next;
      });
    }

    s.piece = newPiece();
    s.pos = { x: 3, y: -1 };
    if (collides(grid, s.piece, s.pos.x, s.pos.y + 1)) {
      s.over = true;
      setGameOver(true);
    }
  }, [collides]);

  const move = useCallback(
    (dx) => {
      const s = state.current;
      if (!s || s.over) return;
      if (!collides(s.grid, s.piece, s.pos.x + dx, s.pos.y)) s.pos.x += dx;
    },
    [collides],
  );

  const rotate = useCallback(() => {
    const s = state.current;
    if (!s || s.over) return;
    const before = s.piece.cells;
    const rotatedCells = rotateCells(before);
    const rotated = { ...s.piece, cells: rotatedCells };

    // Rotating a piece's local cells changes its bounding-box size (e.g. the
    // I-piece flips from 4-wide/1-tall to 1-wide/4-tall). Without correcting
    // for that, the piece visually "jumps" toward the top-left corner
    // instead of turning in place. Shift the anchor by half the bounding-box
    // size delta so it pivots around its own center instead.
    const bbox = (cells) => {
      const xs = cells.map((c) => c.x);
      const ys = cells.map((c) => c.y);
      return {
        w: Math.max(...xs) - Math.min(...xs) + 1,
        h: Math.max(...ys) - Math.min(...ys) + 1,
      };
    };
    const oldBox = bbox(before);
    const newBox = bbox(rotatedCells);
    const dx = Math.round((oldBox.w - newBox.w) / 2);
    const dy = Math.round((oldBox.h - newBox.h) / 2);
    const nx = s.pos.x + dx;
    const ny = s.pos.y + dy;

    if (!collides(s.grid, rotated, nx, ny)) {
      s.piece = rotated;
      s.pos = { x: nx, y: ny };
    } else if (!collides(s.grid, rotated, s.pos.x, s.pos.y)) {
      // Centered spot is blocked (e.g. against a wall) — fall back to
      // rotating without the shift rather than refusing the rotation.
      s.piece = rotated;
    }
  }, [collides]);

  const softDrop = useCallback(() => {
    const s = state.current;
    if (!s || s.over) return;
    if (!collides(s.grid, s.piece, s.pos.x, s.pos.y + 1)) {
      s.pos.y += 1;
      s.acc = 0;
    } else {
      lockPiece();
    }
  }, [collides, lockPiece]);

  const hardDrop = useCallback(() => {
    const s = state.current;
    if (!s || s.over) return;
    while (!collides(s.grid, s.piece, s.pos.x, s.pos.y + 1)) s.pos.y += 1;
    lockPiece();
  }, [collides, lockPiece]);

  useEffect(() => {
    function onKey(e) {
      const keys = ["ArrowLeft", "ArrowRight", "ArrowDown", "ArrowUp", " "];
      if (!keys.includes(e.key)) return;
      e.preventDefault();
      if (e.key === "ArrowLeft") move(-1);
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowDown") softDrop();
      else if (e.key === "ArrowUp") rotate();
      else if (e.key === " ") hardDrop();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [move, softDrop, rotate, hardDrop]);

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
        if (s.acc >= s.dropInterval) {
          s.acc = 0;
          if (!collides(s.grid, s.piece, s.pos.x, s.pos.y + 1)) s.pos.y += 1;
          else lockPiece();
        }
      }

      ctx.fillStyle = "#f2e8d8";
      ctx.fillRect(0, 0, COLS * CELL, ROWS * CELL);
      for (let y = 0; y < ROWS; y++) {
        for (let x = 0; x < COLS; x++) {
          if (s.grid[y][x]) {
            ctx.fillStyle = s.grid[y][x];
            ctx.fillRect(x * CELL + 1, y * CELL + 1, CELL - 2, CELL - 2);
          }
        }
      }
      ctx.fillStyle = s.piece.color;
      s.piece.cells.forEach(({ x, y }) => {
        const gy = y + s.pos.y;
        if (gy >= 0) ctx.fillRect((x + s.pos.x) * CELL + 1, gy * CELL + 1, CELL - 2, CELL - 2);
      });

      if (!s.over) raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showBoard]);

  useEffect(() => {
    if (gameOver) submit(score).then(setResult);
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
              <span className="app-arcade-stat-pill">Lines: {lines}</span>
            </div>
            <canvas
              ref={canvasRef}
              width={COLS * CELL}
              height={ROWS * CELL}
              style={{ height: "46vh" }}
            />
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
              <button type="button" className="app-arcade-dpad-up" onClick={rotate} aria-label="Rotate">⟳</button>
              <button type="button" className="app-arcade-dpad-left" onClick={() => move(-1)} aria-label="Left">←</button>
              <button type="button" className="app-arcade-dpad-down" onClick={softDrop} aria-label="Soft drop">↓</button>
              <button type="button" className="app-arcade-dpad-right" onClick={() => move(1)} aria-label="Right">→</button>
            </div>
            <button type="button" className="app-arcade-btn" onClick={hardDrop}>
              Hard drop
            </button>
          </>
        )}
      </div>

      {showLb && <ScoreModal game={GAME} onClose={() => setShowLb(false)} />}
    </div>
  );
}
