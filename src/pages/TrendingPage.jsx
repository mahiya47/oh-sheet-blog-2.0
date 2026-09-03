import { useEffect, useState } from "react";
import FeedCard from "../components/FeedCard.jsx";
import { FeedListSkeleton } from "../components/Skeletons.jsx";
import { api } from "../lib/api.js";

// Posts ranked by all-time engagement (votes + comments), most-engaged first.
export default function TrendingPage() {
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api
      .getTrendingPosts(50)
      .then(setPosts)
      .catch((err) => setError(err.message));
  }, []);

  function handleDeleted(id) {
    setPosts((list) => list.filter((p) => p.id !== id));
  }

  return (
    <div className="app-page">
      <h2 className="app-section-title">Trending</h2>

      {error && <p className="app-auth-error">{error}</p>}

      {posts === null ? (
        <FeedListSkeleton />
      ) : posts.length ? (
        <div className="app-feed">
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : (
        <p className="app-empty">No sheets yet.</p>
      )}
    </div>
  );
}
