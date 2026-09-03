import { Link } from "react-router-dom";
import NavIcon from "./NavIcons.jsx";
import { formatArcadeScore } from "../lib/arcadeGames.js";

// The consistent strip every arcade game page renders above its board/canvas:
// a back link to the hub, the game's name, a "Leaderboard" trigger, and the
// player's own best score when they're logged in and have one.
export default function ArcadeGameHeader({ title, emoji, best, unit, onShowLeaderboard }) {
  return (
    <div className="app-arcade-game-head">
      <Link to="/arcade" className="app-arcade-back" aria-label="Back to Arcade">
        <NavIcon name="back" />
      </Link>
      <h2 className="app-section-title app-arcade-game-title">
        <span aria-hidden="true">{emoji}</span> {title}
      </h2>
      <button type="button" className="app-arcade-lb-btn" onClick={onShowLeaderboard}>
        <NavIcon name="trophy" />
        <span>Leaderboard</span>
      </button>
      {best !== null && (
        <span className="app-arcade-best">Your best: {formatArcadeScore(best, unit)}</span>
      )}
    </div>
  );
}
