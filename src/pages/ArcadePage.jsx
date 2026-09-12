import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { ARCADE_GAMES, formatArcadeScore } from "../lib/arcadeGames.js";
import ArcadeChampions from "../components/ArcadeChampions.jsx";

// The arcade hub — a tile per game, each showing the player's own best
// score when logged in. Multiplayer games (see arcadeGames.js) have no
// persisted score, so they just get a "Multiplayer" badge instead.
export default function ArcadePage() {
  const { user } = useAuth();
  const [myScores, setMyScores] = useState(null);

  useEffect(() => {
    if (!user) {
      setMyScores({});
      return;
    }
    api
      .getMyArcadeScores()
      .then(setMyScores)
      .catch(() => setMyScores({}));
  }, [user]);

  return (
    <div className="app-page">
      {/* Header strip instead of a bare title + one grey line — the hub is
          the first thing you see after tapping Arcade, so it gets a bit of
          presence. The oversized emoji is decoration only. */}
      <div className="app-arcade-hero">
        <h2>Arcade</h2>
        <p>Play a game, climb the leaderboard.</p>
        <span className="app-arcade-hero-emoji" aria-hidden="true">
          🕹️
        </span>
      </div>

      <div className="app-arcade-grid">
        {ARCADE_GAMES.map((game) => {
          const best = myScores?.[game.slug]?.score;
          return (
            <Link key={game.slug} to={`/arcade/${game.slug}`} className={`app-arcade-tile app-card-${game.color}`}>
              <span className="app-arcade-tile-emoji" aria-hidden="true">
                {game.emoji}
              </span>
              <span className="app-arcade-tile-label">{game.label}</span>
              {game.multiplayer && <span className="app-arcade-tile-badge">Multiplayer</span>}
              <span className="app-arcade-tile-blurb">{game.blurb}</span>
              {best !== undefined && (
                <span className="app-arcade-tile-best">Best: {formatArcadeScore(best, game.unit)}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Same widget shown in the right rail on desktop — repeated here so
          phone/tablet users (who never see the rail) can still see it. */}
      <div className="app-arcade-champs-mobile">
        <ArcadeChampions />
      </div>
    </div>
  );
}
