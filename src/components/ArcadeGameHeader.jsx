import { Link } from "react-router-dom";
import NavIcon from "./NavIcons.jsx";

// The consistent strip every arcade game page renders above its board/canvas:
// a back link to the hub, the game's name, and a "Leaderboard" trigger (just
// the trophy icon — it's unambiguous on its own). The player's own best
// score is shown lower down, in the game's own stats row next to the live
// score, instead of up here.
export default function ArcadeGameHeader({ title, emoji, onShowLeaderboard }) {
  return (
    <div className="app-arcade-game-head">
      <Link to="/arcade" className="app-arcade-back" aria-label="Back to Arcade">
        <NavIcon name="back" />
      </Link>
      <h2 className="app-section-title app-arcade-game-title">
        <span aria-hidden="true">{emoji}</span> {title}
      </h2>
      <button
        type="button"
        className="app-arcade-lb-btn"
        aria-label="Leaderboard"
        onClick={onShowLeaderboard}
      >
        <NavIcon name="trophy" />
      </button>
    </div>
  );
}
