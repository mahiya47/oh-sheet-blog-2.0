import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";

// A simple overlay listing a user's followers or who they follow. `kind`
// is "followers" or "following"; `userId` is whose list to show.
export default function FollowListModal({ userId, kind, title, onClose }) {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setList(null);
    setError("");
    const fetcher = kind === "followers" ? api.getFollowers : api.getFollowing;
    fetcher(userId)
      .then(setList)
      .catch((err) => setError(err.message || "Couldn't load list"));
  }, [userId, kind]);

  return (
    <div className="app-modal-overlay" onClick={onClose}>
      <div className="app-modal" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-head">
          <h3>{title}</h3>
          <button type="button" className="app-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="app-modal-body">
          {error && <p className="app-auth-error">{error}</p>}
          {!error && list === null && <p className="app-empty">Loading...</p>}
          {list && !list.length && <p className="app-empty">Nobody here yet.</p>}
          {list && list.length > 0 && (
            <ul className="app-modal-user-list">
              {list.map((u) => (
                <li key={u.id}>
                  <Link to={`/profile/${u.username}`} onClick={onClose} className="app-modal-user-dp">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" />
                    ) : (
                      (u.name || u.username).charAt(0).toUpperCase()
                    )}
                  </Link>
                  <Link to={`/profile/${u.username}`} onClick={onClose} className="app-modal-user-name">
                    {u.name || u.username}
                    <span className="app-search-handle">@{u.username}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
