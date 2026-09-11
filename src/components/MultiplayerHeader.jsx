import { Link } from "react-router-dom";
import NavIcon from "./NavIcons.jsx";

// The strip every multiplayer arcade page renders above its board — same
// back-link/title layout as ArcadeGameHeader (the single-player games'
// header), but with a status subtitle in place of the leaderboard button,
// since these games don't have a persisted score to show.
export default function MultiplayerHeader({ title, emoji, subtitle, action }) {
  return (
    <div className="app-arcade-game-head">
      <Link to="/arcade" className="app-arcade-back" aria-label="Back to Arcade">
        <NavIcon name="back" />
      </Link>
      <h2 className="app-section-title app-arcade-game-title">
        <span aria-hidden="true">{emoji}</span> {title}
      </h2>
      {action && <span className="app-mp-head-action">{action}</span>}
      {subtitle && <span className="app-mp-subtitle">{subtitle}</span>}
    </div>
  );
}
