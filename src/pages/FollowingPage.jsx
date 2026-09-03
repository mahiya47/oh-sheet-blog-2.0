import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import FeedCard from "../components/FeedCard.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";

// Posts from people you follow, newest first.
export default function FollowingPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: "/following" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .getFollowingFeed()
      .then(setPosts)
      .catch((err) => setError(err.message));
  }, [user]);

  function handleDeleted(id) {
    setPosts((list) => list.filter((p) => p.id !== id));
  }

  if (!user) return null;

  return (
    <div className="app-page">
      <h2 className="app-section-title">Following</h2>

      {error && <p className="app-auth-error">{error}</p>}

      {posts === null ? (
        <p className="app-empty">Loading sheets...</p>
      ) : posts.length ? (
        <div className="app-feed">
          {posts.map((post) => (
            <FeedCard key={post.id} post={post} onDeleted={handleDeleted} />
          ))}
        </div>
      ) : (
        <p className="app-empty">
          Follow some sheeters to see their sheets here.
        </p>
      )}
    </div>
  );
}
