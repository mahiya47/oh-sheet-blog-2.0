import { Link } from "react-router-dom";
import NavIcon from "./NavIcons.jsx";

// The strip every multiplayer arcade page renders above its board — same
// back-link/title layout as ArcadeGameHeader (the single-player games'
// header), but with a status subtitle in place of the leaderboard button,
// since these games don't have a persisted score to show.
//
// onBack is optional — pages that just navigate to /arcade leave it out
// and get the plain Link. A page that needs "back" to do something first
// (Monopoly: leave the room so it doesn't sit occupying a seat) passes
// onBack and gets a button instead, everything else unchanged.
export default function MultiplayerHeader({ title, emoji, subtitle, action, onBack }) {
  return (
    <div className="app-arcade-game-head">
      {onBack ? (
        <button type="button" className="app-arcade-back" onClick={onBack} aria-label="Leave and go back">
          <NavIcon name="back" />
        </button>
      ) : (
        <Link to="/arcade" className="app-arcade-back" aria-label="Back to Arcade">
          <NavIcon name="back" />
        </Link>
      )}
      <h2 className="app-section-title app-arcade-game-title">
        <span aria-hidden="true">{emoji}</span> {title}
      </h2>
      {/* Something always sits opposite the back button so the centred
          title stays centred — the single-player header has its trophy
          there, this one has the action or an empty slot the same size. */}
      {action ? (
        <span className="app-mp-head-action">{action}</span>
      ) : (
        <span className="app-mp-head-spacer" aria-hidden="true" />
      )}
      {subtitle && <span className="app-mp-subtitle">{subtitle}</span>}
    </div>
  );
}
