import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import ArcadeChampions from "./ArcadeChampions.jsx";

const MAX_ITEMS = 5;

export default function RightRail() {
  const { user } = useAuth();
  const [people, setPeople] = useState([]);
  const [followedIds, setFollowedIds] = useState(() => new Set());
  const [trending, setTrending] = useState([]);

  useEffect(() => {
    api
      .getSuggestions()
      .then((data) => setPeople(data.slice(0, MAX_ITEMS)))
      .catch(() => setPeople([]));

    api
      .getTrendingPosts(MAX_ITEMS)
      .then(setTrending)
      .catch(() => setTrending([]));
  }, [user]);

  async function handleFollow(personId) {
    if (!user) return;
    setFollowedIds((prev) => new Set(prev).add(personId));
    try {
      await api.follow(personId);
    } catch {
      setFollowedIds((prev) => {
        const next = new Set(prev);
        next.delete(personId);
        return next;
      });
    }
  }

  return (
    <aside className="app-rightrail">
      <div className="app-rail-card">
        <h2>People you might know</h2>
        {people.length ? (
          <ul className="app-suggest-list">
            {people.map((p) => (
              <li key={p.id}>
                <Link to={`/profile/${p.username}`} className="app-suggest-dp">
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt="" />
                  ) : (
                    (p.name || p.username).charAt(0).toUpperCase()
                  )}
                </Link>
                <Link to={`/profile/${p.username}`} className="app-suggest-name">
                  {p.name || p.username}
                </Link>
                {user && user.username !== p.username && (
                  <button
                    type="button"
                    className="app-follow-btn"
                    disabled={followedIds.has(p.id)}
                    onClick={() => handleFollow(p.id)}
                  >
                    {followedIds.has(p.id) ? "Following" : "Follow"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="app-empty">No suggestions right now.</p>
        )}
      </div>

      <div className="app-rail-card">
        <h2>Trending</h2>
        {trending.length ? (
          <ul className="app-trend-list">
            {trending.map((p) => {
              const name = p.author.name || p.author.username;
              const caption = (p.content || "").slice(0, 60);
              return (
                <li key={p.id} className="app-trend-item">
                  <Link to={`/profile/${p.author.username}`} className="app-trend-head">
                    <span className="app-trend-dp">
                      {p.author.avatarUrl ? (
                        <img src={p.author.avatarUrl} alt="" />
                      ) : (
                        name.charAt(0).toUpperCase()
                      )}
                    </span>
                    <span className="app-trend-username">{name}</span>
                  </Link>
                  {caption && (
                    <p className="app-trend-caption">
                      {caption}
                      {(p.content || "").length > 60 ? "…" : ""}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="app-empty">Nothing trending yet.</p>
        )}
      </div>

      <ArcadeChampions />

      <nav className="app-rail-footer">
        <Link to="/about">About</Link>
        <Link to="/rules">Rules</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/agreement">Agreement</Link>
        <Link to="/support">Support</Link>
        <a href="/feed.xml" target="_blank" rel="noopener noreferrer">
          RSS
        </a>
      </nav>
      {/* Not "Inc." — per the Agreement/Privacy pages, Oh Sheet! is a
          personal project run by one person, not a company. Year is
          computed so this never needs a manual bump. */}
      <p className="app-rail-copyright">© {new Date().getFullYear()} Oh Sheet!</p>
    </aside>
  );
}
