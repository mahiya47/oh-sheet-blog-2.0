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
      <h2 className="app-section-title">Arcade</h2>
      <p className="app-empty">Play a game, climb the leaderboard.</p>

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
                <span className="app-arcade-tile-best">Your best: {formatArcadeScore(best, game.unit)}</span>
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
