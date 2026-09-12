import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import FeedCard from "../components/FeedCard.jsx";
import { api } from "../lib/api.js";
import { useAuth } from "../context/AuthContext.jsx";
import { searchDestinations } from "../lib/siteSearchIndex.js";
import { ADMIN_USERNAME } from "../lib/adminUser.js";

export default function SearchPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState([]);
  const [tags, setTags] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setUsers([]);
      setTags([]);
      setPosts([]);
      setSearched(false);
      return;
    }
    setLoading(true);
    const handle = setTimeout(() => {
      api
        .searchAll(q)
        .then((data) => {
          setUsers(data.users || []);
          setTags(data.tags || []);
          setPosts(data.posts || []);
        })
        .catch(() => {
          setUsers([]);
          setTags([]);
          setPosts([]);
        })
        .finally(() => {
          setLoading(false);
          setSearched(true);
        });
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  // Pages, settings and games are matched right here in the browser, so
  // they show up the instant you type instead of waiting on the network.
  const isAdmin = (user?.username || "").toLowerCase() === ADMIN_USERNAME;
  const destinations = useMemo(
    () => searchDestinations(query, { isAdmin }),
    [query, isAdmin],
  );

  const hasResults =
    destinations.length > 0 || users.length > 0 || tags.length > 0 || posts.length > 0;

  return (
    <div className="app-page">
      <h2 className="app-section-title">Search</h2>
      <form className="app-composer" onSubmit={(e) => e.preventDefault()}>
        <span className="app-composer-hash">🔍</span>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sheets, people, pages, settings, games..."
        />
      </form>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="app-empty">Keep typing — at least 2 characters.</p>
      )}

      {destinations.length > 0 && (
        <>
          <h3 className="app-section-title">Go to</h3>
          <ul className="app-search-jump">
            {destinations.map((d) => (
              <li key={d.to + d.label}>
                <Link to={d.to} className="app-search-jump-item">
                  <span className="app-search-jump-icon" aria-hidden="true">
                    {d.emoji}
                  </span>
                  <span className="app-search-jump-text">
                    <span className="app-search-jump-label">{d.label}</span>
                    <span className="app-search-jump-hint">{d.hint}</span>
                  </span>
                  <span className="app-search-jump-group">{d.group}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {loading && <p className="app-empty">Searching...</p>}

      {!loading && searched && !hasResults && (
        <p className="app-empty">Nothing matches "{query.trim()}" — no sheets, sheeters, tags, pages or games.</p>
      )}

      {users.length > 0 && (
        <>
          <h3 className="app-section-title">People</h3>
          <ul className="app-search-people">
            {users.map((u) => (
              <li key={u.id}>
                <Link to={`/profile/${u.username}`} className="app-suggest-dp">
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt="" />
                  ) : (
                    (u.name || u.username).charAt(0).toUpperCase()
                  )}
                </Link>
                <Link to={`/profile/${u.username}`} className="app-suggest-name">
                  {u.name} <span className="app-search-handle">@{u.username}</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}

      {tags.length > 0 && (
        <>
          <h3 className="app-section-title">Tags</h3>
          <div className="app-search-tags">
            {tags.map((t) => (
              <Link key={t.id} to={`/tag/${encodeURIComponent(t.name)}`} className="app-card-hashtag app-search-tag-pill">
                #{t.name}
              </Link>
            ))}
          </div>
        </>
      )}

      {posts.length > 0 && (
        <>
          <h3 className="app-section-title">Sheets</h3>
          <div className="app-feed">
            {posts.map((p) => (
              <FeedCard key={p.id} post={p} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
