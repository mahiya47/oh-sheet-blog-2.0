import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

function Avatar({ user }) {
  return (
    <span className="app-challenge-avatar">
      {user.avatarUrl ? <img src={user.avatarUrl} alt="" /> : (user.name || user.username || "?").charAt(0).toUpperCase()}
    </span>
  );
}

// "Who do you want to play?" — defaults to the people you follow (your
// most likely opponents), with a search box to challenge anyone else too.
export default function ChallengeFriendPicker({ onChallenge, disabled }) {
  const { user } = useAuth();
  const [following, setFollowing] = useState(null);
  const [query, setQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!user) return;
    api
      .getFollowing(user.id)
      .then(setFollowing)
      .catch(() => setFollowing([]));
  }, [user]);

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setSearchResults([]);
      return;
    }
    let cancelled = false;
    setSearching(true);
    const id = setTimeout(() => {
      api
        .searchAll(q)
        .then((data) => {
          if (cancelled) return;
          setSearchResults((data.users || []).filter((u) => u.id !== user?.id));
        })
        .catch(() => !cancelled && setSearchResults([]))
        .finally(() => !cancelled && setSearching(false));
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(id);
    };
  }, [query, user]);

  const showingSearch = query.trim().length > 0;
  const list = showingSearch ? searchResults : following;

  return (
    <div className="app-challenge-picker">
      <p className="app-empty">Challenge a friend to a live match.</p>

      <input
        type="text"
        className="app-challenge-search"
        placeholder="Search for someone to challenge..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />

      <div className="app-challenge-list">
        {list === null && <p className="app-empty">Loading...</p>}
        {list !== null && searching && showingSearch && <p className="app-empty">Searching...</p>}
        {list !== null && !searching && list.length === 0 && (
          <p className="app-empty">{showingSearch ? "No one found." : "Follow some sheeters to challenge them here."}</p>
        )}
        {list?.map((candidate) => (
          <div key={candidate.id} className="app-challenge-row">
            <Avatar user={candidate} />
            <span className="app-challenge-name">{candidate.name || candidate.username}</span>
            <button
              type="button"
              className="app-arcade-btn app-challenge-btn"
              disabled={disabled}
              onClick={() => onChallenge(candidate)}
            >
              Challenge
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
