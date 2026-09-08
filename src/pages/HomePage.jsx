import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeedCard from "../components/FeedCard.jsx";
import StoriesBar from "../components/StoriesBar.jsx";
import { FeedListSkeleton } from "../components/Skeletons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

export default function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [posts, setPosts] = useState([]);
  const [cursor, setCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    api
      .getFeed()
      .then((data) => {
        if (cancelled) return;
        setPosts(data.posts);
        setCursor(data.nextCursor);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  async function loadMore() {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await api.getFeed(cursor);
      setPosts((p) => [...p, ...data.posts]);
      setCursor(data.nextCursor);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }

  function goToComposer() {
    navigate(user ? "/create" : "/login", { state: { from: "/create" } });
  }

  function handleDeleted(id) {
    setPosts((p) => p.filter((post) => post.id !== id));
  }

  return (
    <div className="app-page">
      <StoriesBar />

      <div className="app-composer-wrap app-desktop-only">
        <button type="button" className="app-composer app-composer-trigger" onClick={goToComposer}>
          <span className="app-composer-hash">#</span>
          <span className="app-composer-trigger-text">
            {user ? `Share a sheet, ${user.username}...` : "Log in to share a sheet..."}
          </span>
          <span className="app-composer-trigger-plus" aria-hidden="true">
            +
          </span>
        </button>
      </div>

      {error && <p className="app-auth-error">{error}</p>}

      {loading ? (
        <FeedListSkeleton />
      ) : (
        <>
          <div className="app-feed">
            {posts.map((post) => (
              <FeedCard key={post.id} post={post} onDeleted={handleDeleted} />
            ))}
          </div>
          {!posts.length && <p className="app-empty">No sheets yet — be the first to post.</p>}
          {cursor && (
            <button type="button" className="app-load-more" onClick={loadMore} disabled={loadingMore}>
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          )}
        </>
      )}
    </div>
  );
}
