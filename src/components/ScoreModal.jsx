import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { formatArcadeScore } from "../lib/arcadeGames.js";

// Per-game leaderboard, opened from any arcade game's header. Reuses the
// same full-screen overlay pattern as ImageLightbox, but with a boxed
// panel instead of a bare image.
export default function ScoreModal({ game, onClose }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!game) return;
    function onKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    api
      .getArcadeLeaderboard(game.slug)
      .then(setRows)
      .catch((err) => setError(err.message));
    return () => document.removeEventListener("keydown", onKey);
  }, [game, onClose]);

  if (!game) return null;

  return (
    <div className="app-lightbox-overlay" onClick={onClose}>
      <div className="app-arcade-modal" onClick={(e) => e.stopPropagation()}>
        <div className="app-arcade-modal-head">
          <h3>
            <span aria-hidden="true">{game.emoji}</span> {game.label} leaderboard
          </h3>
          <button type="button" className="app-arcade-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        {error && <p className="app-auth-error">{error}</p>}

        {rows === null ? (
          <p className="app-empty">Loading leaderboard...</p>
        ) : rows.length ? (
          <ol className="app-leaderboard-list app-arcade-modal-list">
            {rows.map((row, i) => (
              <li key={row.user.id} className="app-leaderboard-row">
                <span className="app-leaderboard-rank">{i + 1}</span>
                <Link to={`/profile/${row.user.username}`} className="app-leaderboard-dp" onClick={onClose}>
                  {row.user.avatarUrl ? (
                    <img src={row.user.avatarUrl} alt="" />
                  ) : (
                    (row.user.name || row.user.username).charAt(0).toUpperCase()
                  )}
                </Link>
                <Link to={`/profile/${row.user.username}`} className="app-leaderboard-name" onClick={onClose}>
                  {row.user.name || row.user.username}
                  <span className="app-leaderboard-handle">@{row.user.username}</span>
                </Link>
                <span className="app-leaderboard-score">{formatArcadeScore(row.score, game.unit)}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="app-empty">No scores yet — be the first to play.</p>
        )}
      </div>
    </div>
  );
}
