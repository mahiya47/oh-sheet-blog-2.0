import { useEffect, useRef, useState, useCallback } from "react";
import ArcadeGameHeader from "../../components/ArcadeGameHeader.jsx";
import ScoreModal from "../../components/ScoreModal.jsx";
import { getGameMeta, formatArcadeScore } from "../../lib/arcadeGames.js";
import { useArcadeScore } from "../../lib/useArcadeScore.js";

const GAME = getGameMeta("runner");

// The simulation always runs in this logical landscape space, however it's
// actually displayed. Desktop draws it straight; mobile renders the exact
// same draw calls through a single rotation transform (see the ctx.save /
// translate / rotate below) so obstacles rise bottom-to-top and "jump"
// reads as a sideways dodge on a tall phone screen — one physics/draw
// path, two presentations.
const LOGICAL_W = 560;
const LOGICAL_H = 260;
const GROUND_Y = 225;
const CHAR_X = 70;
const CHAR_R = 20;
const GRAVITY = 0.62;
const JUMP_VY = -12.5;

const OBSTACLE_TYPES = [
  { type: "tree", w: 26, h: 54 },
  { type: "bush", w: 34, h: 24 },
  { type: "rock", w: 28, h: 26 },
  { type: "cactus", w: 20, h: 44 },
];

function drawObstacle(ctx, ob) {
  const baseY = GROUND_Y;
  if (ob.type === "tree") {
    ctx.fillStyle = "#6b4a2f";
    ctx.fillRect(ob.x - 4, baseY - 16, 8, 16);
    ctx.fillStyle = "#3f7a3f";
    ctx.beginPath();
    ctx.moveTo(ob.x - ob.w / 2, baseY - 16);
    ctx.lineTo(ob.x + ob.w / 2, baseY - 16);
    ctx.lineTo(ob.x, baseY - ob.h);
    ctx.closePath();
    ctx.fill();
  } else if (ob.type === "bush") {
    ctx.fillStyle = "#5a9a4a";
    [-9, 0, 9].forEach((dx) => {
      ctx.beginPath();
      ctx.arc(ob.x + dx, baseY - ob.h / 2, ob.h / 2, 0, Math.PI * 2);
      ctx.fill();
    });
  } else if (ob.type === "rock") {
    ctx.fillStyle = "#8a8578";
    ctx.beginPath();
    ctx.moveTo(ob.x - ob.w / 2, baseY);
    ctx.lineTo(ob.x - ob.w / 2 + 5, baseY - ob.h);
    ctx.lineTo(ob.x + ob.w / 2 - 5, baseY - ob.h);
    ctx.lineTo(ob.x + ob.w / 2, baseY);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = "#4a8c3f";
    ctx.fillRect(ob.x - 4, baseY - ob.h, 8, ob.h);
    ctx.fillRect(ob.x - 13, baseY - ob.h + 14, 9, 11);
    ctx.fillRect(ob.x + 4, baseY - ob.h + 22, 9, 11);
  }
}

// The "forest spirit" — an original round grey woodland character with
// pointed ears, whiskers, a cream belly with little arch markings, and big
// friendly eyes — the same silhouette family as the mascot from the old
// version's runner, redrawn from scratch here.
function drawCharacter(ctx, x, y, squash) {
  const R = CHAR_R;
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(1, squash);

  ctx.strokeStyle = "#2a2a32";
  ctx.lineWidth = 1.4;

  // Ears (pointed, set into the top of the head).
  ctx.fillStyle = "#5b5960";
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.moveTo(side * R * 0.32, -R * 0.85);
    ctx.lineTo(side * R * 0.95, -R * 1.45);
    ctx.lineTo(side * R * 0.98, -R * 0.55);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Body — tall rounded silhouette.
  ctx.fillStyle = "#6a6870";
  ctx.beginPath();
  ctx.ellipse(0, R * 0.02, R * 1.0, R * 1.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Belly.
  ctx.fillStyle = "#efe6c8";
  ctx.beginPath();
  ctx.ellipse(0, R * 0.34, R * 0.68, R * 0.72, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly arch markings (two up top, three below — same layout as the
  // sketch).
  ctx.strokeStyle = "#4a4850";
  ctx.lineWidth = R * 0.09;
  ctx.lineCap = "round";
  [-R * 0.3, R * 0.3].forEach((dx) => {
    ctx.beginPath();
    ctx.arc(dx, R * 0.06, R * 0.13, Math.PI, 0);
    ctx.stroke();
  });
  [-R * 0.42, 0, R * 0.42].forEach((dx) => {
    ctx.beginPath();
    ctx.arc(dx, R * 0.44, R * 0.13, Math.PI, 0);
    ctx.stroke();
  });

  // Whiskers.
  ctx.strokeStyle = "#2a2a32";
  ctx.lineWidth = 1;
  [-1, 1].forEach((side) => {
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.moveTo(side * R * 0.5, -R * 0.18 + i * R * 0.12);
      ctx.lineTo(side * R * 1.25, -R * 0.24 + i * R * 0.2);
      ctx.stroke();
    }
  });

  // Eyes.
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#2a2a32";
  ctx.lineWidth = 1.2;
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.arc(side * R * 0.3, -R * 0.32, R * 0.22, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });
  ctx.fillStyle = "#1c1c22";
  ctx.beginPath();
  ctx.arc(-R * 0.24, -R * 0.28, R * 0.1, 0, Math.PI * 2);
  ctx.arc(R * 0.36, -R * 0.28, R * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Nose.
  ctx.fillStyle = "#1c1c22";
  ctx.beginPath();
  ctx.moveTo(-R * 0.08, -R * 0.05);
  ctx.lineTo(R * 0.08, -R * 0.05);
  ctx.lineTo(0, R * 0.04);
  ctx.closePath();
  ctx.fill();

  // Little cream feet peeking out the bottom.
  ctx.fillStyle = "#efe6c8";
  [-1, 1].forEach((side) => {
    ctx.beginPath();
    ctx.ellipse(side * R * 0.4, R * 1.02, R * 0.24, R * 0.14, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  ctx.restore();
}

export default function RunnerPage() {
  const canvasRef = useRef(null);
  const { best, submit } = useArcadeScore(GAME.slug);
  const [isMobile] = useState(() => typeof window !== "undefined" && window.innerWidth < 760);
  const [showBoard, setShowBoard] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [showLb, setShowLb] = useState(false);
  const state = useRef(null);

  const jump = useCallback(() => {
    const s = state.current;
    if (!s || s.over) return;
    if (s.charY >= GROUND_Y - CHAR_R - 0.5) s.vy = JUMP_VY;
  }, []);

  const resetState = useCallback(() => {
    state.current = {
      charY: GROUND_Y - CHAR_R,
      vy: 0,
      obstacles: [],
      speed: 3.6,
      elapsed: 0,
      lastSpawn: 0,
      nextSpawnGap: 900,
      score: 0,
      over: false,
      lastTs: 0,
    };
    setScore(0);
    setGameOver(false);
    setResult(null);
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === " " || e.key === "ArrowUp") {
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  useEffect(() => {
    if (!showBoard) return;
    resetState();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;

    function tick(ts) {
      const s = state.current;
      if (!s.lastTs) s.lastTs = ts;
      const dt = ts - s.lastTs;
      s.lastTs = ts;

      if (!s.over) {
        s.elapsed += dt;
        s.speed = 3.6 + Math.min(3.4, s.elapsed / 8000);
        s.vy += GRAVITY;
        s.charY += s.vy;
        if (s.charY > GROUND_Y - CHAR_R) {
          s.charY = GROUND_Y - CHAR_R;
          s.vy = 0;
        }

        if (s.elapsed - s.lastSpawn > s.nextSpawnGap) {
          s.lastSpawn = s.elapsed;
          s.nextSpawnGap = 700 + Math.random() * 900;
          const def = OBSTACLE_TYPES[Math.floor(Math.random() * OBSTACLE_TYPES.length)];
          s.obstacles.push({ ...def, x: LOGICAL_W + 20, passed: false });
        }
        s.obstacles.forEach((o) => (o.x -= s.speed));
        s.obstacles = s.obstacles.filter((o) => o.x > -40);

        s.obstacles.forEach((o) => {
          if (!o.passed && o.x < CHAR_X) {
            o.passed = true;
            s.score += 10;
            setScore(s.score);
          }
          const withinX = CHAR_X + CHAR_R > o.x - o.w / 2 && CHAR_X - CHAR_R < o.x + o.w / 2;
          const charBottom = s.charY + CHAR_R;
          const obTop = GROUND_Y - o.h;
          if (withinX && charBottom > obTop) s.over = true;
        });

        if (s.over) setGameOver(true);
      }

      // ---- Draw (always in logical landscape space) ----
      ctx.save();
      if (isMobile) {
        ctx.translate(LOGICAL_H, 0);
        ctx.rotate(Math.PI / 2);
      }

      const grad = ctx.createLinearGradient(0, 0, 0, LOGICAL_H);
      grad.addColorStop(0, "#cdeab3");
      grad.addColorStop(1, "#eadfc4");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, LOGICAL_W, LOGICAL_H);
      ctx.fillStyle = "#c9b98a";
      ctx.fillRect(0, GROUND_Y, LOGICAL_W, LOGICAL_H - GROUND_Y);

      s.obstacles.forEach((o) => drawObstacle(ctx, o));

      const onGround = s.charY >= GROUND_Y - CHAR_R - 0.5;
      const squash = onGround ? 1 : Math.max(0.82, 1 - Math.abs(s.vy) / 90);
      drawCharacter(ctx, CHAR_X, s.charY + CHAR_R * (1 - squash), squash);

      ctx.restore();

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
    <div className="app-page app-arcade-page">
      <ArcadeGameHeader title={GAME.label} emoji={GAME.emoji} onShowLeaderboard={() => setShowLb(true)} />

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
              {best !== null && (
                <span className="app-arcade-stat-pill">Best: {formatArcadeScore(best, GAME.unit)}</span>
              )}
            </div>
            <div style={{ position: "relative" }} onClick={jump}>
              <canvas
                ref={canvasRef}
                width={isMobile ? LOGICAL_H : LOGICAL_W}
                height={isMobile ? LOGICAL_W : LOGICAL_H}
              />
              {gameOver && (
                <div
                  className="app-arcade-overlay-msg"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "rgba(28,24,16,0.55)",
                    borderRadius: "var(--app-radius-sm)",
                  }}
                >
                  <div style={{ background: "var(--app-surface)", padding: 18, borderRadius: 14 }}>
                    <h3 style={{ margin: "0 0 6px" }}>Game over — {score} pts</h3>
                    {result?.isNewBest && <p className="app-empty">🎉 New best!</p>}
                    <button
                      type="button"
                      className="app-arcade-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowBoard(false);
                      }}
                    >
                      Play again
                    </button>
                  </div>
                </div>
              )}
            </div>
            <p className="app-empty">Tap/click the board or press Space to jump.</p>
          </>
        )}
      </div>

      {showLb && <ScoreModal game={GAME} onClose={() => setShowLb(false)} />}
    </div>
  );
}
