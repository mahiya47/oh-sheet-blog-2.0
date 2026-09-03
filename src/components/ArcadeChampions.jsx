import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { ARCADE_GAMES, formatArcadeScore } from "../lib/arcadeGames.js";

// "Arcade Champions" — the #1 player for every game, one request. Shown in
// the right rail (desktop/tablet) and on the arcade hub page itself.
export default function ArcadeChampions() {
  const [top, setTop] = useState(null);

  useEffect(() => {
    api
      .getArcadeTopPlayers()
      .then(setTop)
      .catch(() => setTop({}));
  }, []);

  const entries = ARCADE_GAMES.map((g) => ({ game: g, top: top?.[g.slug] || null })).filter(
    (e) => e.top,
  );

  return (
    <div className="app-rail-card">
      <h2>Arcade Champions</h2>
      {top === null ? (
        <p className="app-empty">Loading...</p>
      ) : entries.length ? (
        <ul className="app-arcade-champs-list">
          {entries.map(({ game, top: t }) => (
            <li key={game.slug} className="app-arcade-champs-item">
              <Link to={`/profile/${t.user.username}`} className="app-arcade-champs-dp">
                {t.user.avatarUrl ? (
                  <img src={t.user.avatarUrl} alt="" />
                ) : (
                  (t.user.name || t.user.username).charAt(0).toUpperCase()
                )}
              </Link>
              <span className="app-arcade-champs-info">
                <span className="app-arcade-champs-game">
                  <span aria-hidden="true">{game.emoji}</span> {game.label}
                </span>
                <Link to={`/profile/${t.user.username}`} className="app-arcade-champs-name">
                  {t.user.name || t.user.username}
                </Link>
              </span>
              <span className="app-arcade-champs-score">{formatArcadeScore(t.score, game.unit)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="app-empty">No champions yet — go play something.</p>
      )}
    </div>
  );
}
