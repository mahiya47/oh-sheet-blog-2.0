import { useGameSocket } from "../context/GameSocketContext.jsx";
import { getGameMeta } from "../lib/arcadeGames.js";

// Rendered once, at the top of the app, so a challenge can reach someone
// no matter where they're browsing — not just while they happen to be
// sitting on that game's page already.
export default function IncomingChallengeModal() {
  const { incomingChallenge, respondToIncoming } = useGameSocket();

  if (!incomingChallenge) return null;

  const game = getGameMeta(incomingChallenge.gameSlug);
  const from = incomingChallenge.from;

  return (
    <div className="app-modal-overlay">
      <div className="app-modal app-challenge-modal">
        <span className="app-challenge-modal-emoji" aria-hidden="true">
          {game?.emoji || "🎮"}
        </span>
        <h3>
          {from.name || from.username} challenged you to {game?.label || "a game"}!
        </h3>
        <div className="app-challenge-modal-actions">
          <button type="button" className="app-arcade-btn app-challenge-decline" onClick={() => respondToIncoming(false)}>
            Decline
          </button>
          <button type="button" className="app-arcade-btn app-challenge-accept" onClick={() => respondToIncoming(true)}>
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
