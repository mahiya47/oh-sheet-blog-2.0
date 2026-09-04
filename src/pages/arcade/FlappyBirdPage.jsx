import { useEffect, useRef, useState, useCallback } from "react";
import ArcadeGameHeader from "../../components/ArcadeGameHeader.jsx";
import ScoreModal from "../../components/ScoreModal.jsx";
import { getGameMeta, formatArcadeScore } from "../../lib/arcadeGames.js";
import { useArcadeScore } from "../../lib/useArcadeScore.js";

const GAME = getGameMeta("flappybird");
const W = 320;
const H = 480;
const GRAVITY = 0.37;
const FLAP_VY = -7.2;
const PIPE_GAP = 138;
const PIPE_WIDTH = 54;
const PIPE_SPEED = 2.4;
const PIPE_INTERVAL = 1500; // ms between new pipes
const BIRD_X = 70;
const BIRD_R = 14;

export default function FlappyBirdPage() {
  const canvasRef = useRef(null);
  const { best, submit } = useArcadeScore(GAME.slug);
  const [showBoard, setShowBoard] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState(null);
  const [showLb, setShowLb] = useState(false);
  const state = useRef(null);

  const flap = useCallback(() => {
    const s = state.current;
    if (!s || s.over) return;
    s.vy = FLAP_VY;
  }, []);

  const resetState = useCallback(() => {
    state.current = {
      birdY: H / 2,
      vy: 0,
      pipes: [],
      lastSpawn: 0,
      elapsed: 0,
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
        flap();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flap]);

  useEffect(() => {
    if (!showBoard) return;
    resetState();
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    let raf;

    function drawBamboo(x, topH, bottomY) {
      ctx.fillStyle = "#4a7c3a";
      ctx.strokeStyle = "#2f5726";
      ctx.lineWidth = 2;
      // Top pipe.
      ctx.fillRect(x, 0, PIPE_WIDTH, topH);
      ctx.strokeRect(x, 0, PIPE_WIDTH, topH);
      ctx.fillRect(x - 6, topH - 18, PIPE_WIDTH + 12, 18);
      // Bottom pipe.
      ctx.fillRect(x, bottomY, PIPE_WIDTH, H - bottomY);
      ctx.strokeRect(x, bottomY, PIPE_WIDTH, H - bottomY);
      ctx.fillRect(x - 6, bottomY, PIPE_WIDTH + 12, 18);
      // Bamboo joint lines.
      ctx.strokeStyle = "rgba(0,0,0,0.25)";
      for (let jy = 30; jy < topH; jy += 40) ctx.strokeRect(x, jy, PIPE_WIDTH, 2);
      for (let jy = bottomY + 30; jy < H; jy += 40) ctx.strokeRect(x, jy, PIPE_WIDTH, 2);
    }

    function tick(ts) {
      const s = state.current;
      if (!s.lastTs) s.lastTs = ts;
      const dt = ts - s.lastTs;
      s.lastTs = ts;

      if (!s.over) {
        s.elapsed += dt;
        s.vy += GRAVITY;
        s.birdY += s.vy;

        if (s.elapsed - s.lastSpawn > PIPE_INTERVAL) {
          s.lastSpawn = s.elapsed;
          const gapY = 60 + Math.random() * (H - 120 - PIPE_GAP);
          s.pipes.push({ x: W, gapY, passed: false });
        }
        s.pipes.forEach((p) => (p.x -= PIPE_SPEED));
        s.pipes = s.pipes.filter((p) => p.x > -PIPE_WIDTH - 10);

        s.pipes.forEach((p) => {
          if (!p.passed && p.x + PIPE_WIDTH < BIRD_X) {
            p.passed = true;
            s.score += 1;
            setScore(s.score);
          }
          const withinX = BIRD_X + BIRD_R > p.x && BIRD_X - BIRD_R < p.x + PIPE_WIDTH;
          if (withinX) {
            const hitTop = s.birdY - BIRD_R < p.gapY;
            const hitBottom = s.birdY + BIRD_R > p.gapY + PIPE_GAP;
            if (hitTop || hitBottom) s.over = true;
          }
        });

        if (s.birdY + BIRD_R > H || s.birdY - BIRD_R < 0) {
          s.birdY = Math.max(BIRD_R, Math.min(H - BIRD_R, s.birdY));
          s.over = true;
        }
        if (s.over) setGameOver(true);
      }

      // ---- Draw ----
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#bfe6a8");
      grad.addColorStop(1, "#8fca6f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "rgba(60,110,50,0.35)";
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.arc(((i * 70 + s.elapsed * 0.02) % (W + 60)) - 30, 40 + (i % 3) * 12, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      s.pipes.forEach((p) => drawBamboo(p.x, p.gapY, p.gapY + PIPE_GAP));

      // Bird — original round black character, no existing IP.
      ctx.save();
      ctx.translate(BIRD_X, s.birdY);
      ctx.rotate(Math.max(-0.5, Math.min(0.9, s.vy / 12)));
      ctx.fillStyle = "#1c1810";
      ctx.beginPath();
      ctx.arc(0, 0, BIRD_R, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f5c945";
      ctx.beginPath();
      ctx.moveTo(BIRD_R - 2, -3);
      ctx.lineTo(BIRD_R + 8, 0);
      ctx.lineTo(BIRD_R - 2, 4);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(4, -5, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#1c1810";
      ctx.beginPath();
      ctx.arc(5, -5, 1.6, 0, Math.PI * 2);
      ctx.fill();
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
            <div style={{ position: "relative" }} onClick={flap}>
              <canvas ref={canvasRef} width={W} height={H} />
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
            <p className="app-empty">Tap/click the board or press Space to flap.</p>
          </>
        )}
      </div>

      {showLb && <ScoreModal game={GAME} onClose={() => setShowLb(false)} />}
    </div>
  );
}
