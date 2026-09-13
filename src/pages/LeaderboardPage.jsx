import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { LeaderboardSkeleton } from "../components/Skeletons.jsx";
import { api } from "../lib/api.js";

// Top 20 sheeters by score (earned from posting, commenting, getting
// upvoted, and so on).
export default function LeaderboardPage() {
  const [users, setUsers] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getLeaderboard()
      .then(setUsers)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <div className="app-page">
      <h2 className="app-section-title">Leaderboard</h2>

      {error && <p className="app-auth-error">{error}</p>}

      {users === null ? (
        <LeaderboardSkeleton />
      ) : users.length ? (
        <ol className="app-leaderboard-list">
          {users.map((u, i) => (
            <li key={u.id} className="app-leaderboard-row">
              <span className="app-leaderboard-rank">{i + 1}</span>
              <Link to={`/profile/${u.username}`} className="app-leaderboard-dp">
                {u.avatarUrl ? (
                  <img src={u.avatarUrl} alt="" />
                ) : (
                  (u.name || u.username).charAt(0).toUpperCase()
                )}
              </Link>
              <Link to={`/profile/${u.username}`} className="app-leaderboard-name">
                {u.name || u.username}
                <span className="app-leaderboard-handle">@{u.username}</span>
              </Link>
              <span className="app-leaderboard-level">Lvl {u.level}</span>
              <span className="app-leaderboard-score">{u.score} pts</span>
            </li>
          ))}
        </ol>
      ) : (
        <p className="app-empty">Nothing to rank yet.</p>
      )}
    </div>
  );
}
