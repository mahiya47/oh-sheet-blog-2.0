import MultiplayerHeader from "./MultiplayerHeader.jsx";
import ChallengeFriendPicker from "./ChallengeFriendPicker.jsx";

// The four screens shared by every multiplayer arcade game before (and
// after) the actual board matters: loading a stashed room, picking who to
// challenge, waiting for them to respond, and the room having ended. The
// game page itself only ever renders once `flow.phase === "playing"`.
export default function ChallengeGate({ flow, gameLabel, gameEmoji }) {
  if (flow.phase === "loading") {
    return (
      <div className="app-page">
        <MultiplayerHeader title={gameLabel} emoji={gameEmoji} />
        <p className="app-empty">Loading...</p>
      </div>
    );
  }

  if (flow.phase === "picker") {
    return (
      <div className="app-page">
        <MultiplayerHeader title={gameLabel} emoji={gameEmoji} />
        {flow.error && <p className="app-auth-error">{flow.error}</p>}
        <ChallengeFriendPicker onChallenge={flow.challenge} />
      </div>
    );
  }

  if (flow.phase === "waiting") {
    return (
      <div className="app-page">
        <MultiplayerHeader title={gameLabel} emoji={gameEmoji} />
        <div className="app-mp-waiting">
          <span className="app-mp-waiting-spinner" aria-hidden="true">
            ⏳
          </span>
          <h3>Waiting for {flow.opponent?.name || flow.opponent?.username || "them"} to accept...</h3>
          <button type="button" className="app-arcade-btn" onClick={flow.cancelWaiting}>
            Cancel
          </button>
        </div>
      </div>
    );
  }

  if (flow.phase === "ended") {
    return (
      <div className="app-page">
        <MultiplayerHeader title={gameLabel} emoji={gameEmoji} />
        <div className="app-mp-waiting">
          <h3>{flow.opponent?.name || flow.opponent?.username || "Your opponent"} left the match.</h3>
          <button type="button" className="app-arcade-btn" onClick={flow.leaveGame}>
            Back to Challenges
          </button>
        </div>
      </div>
    );
  }

  return null;
}
