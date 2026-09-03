import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import FeedCard from "../components/FeedCard.jsx";
import { api } from "../lib/api.js";

export default function SearchPage() {
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

  const hasResults = users.length > 0 || tags.length > 0 || posts.length > 0;

  return (
    <div className="app-page">
      <h2 className="app-section-title">Search</h2>
      <form className="app-composer" onSubmit={(e) => e.preventDefault()}>
        <span className="app-composer-hash">🔍</span>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search sheets or people..."
        />
      </form>

      {query.trim().length > 0 && query.trim().length < 2 && (
        <p className="app-empty">Keep typing — at least 2 characters.</p>
      )}

      {loading && <p className="app-empty">Searching...</p>}

      {!loading && searched && !hasResults && (
        <p className="app-empty">No sheets, sheeters, or tags match "{query.trim()}".</p>
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
