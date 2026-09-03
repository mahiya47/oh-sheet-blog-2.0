import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import FeedCard from "../components/FeedCard.jsx";
import { api } from "../lib/api.js";

// Every post carrying a given #hashtag — reached by clicking a hashtag
// anywhere it's rendered in a post's text.
export default function TagPage() {
  const { name } = useParams();
  const [posts, setPosts] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setPosts(null);
    api
      .getPostsByTag(name)
      .then((data) => !cancelled && setPosts(data))
      .catch((err) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [name]);

  function handleDeleted(id) {
    setPosts((list) => list.filter((p) => p.id !== id));
  }

  return (
    <div className="app-page">
      <h2 className="app-section-title">#{name}</h2>

      {error && <p className="app-auth-error">{error}</p>}

      {posts === null ? (
        <p className="app-empty">Loading sheets...</p>
      ) : (
        <>
          <div className="app-feed">
            {posts.map((post) => (
              <FeedCard key={post.id} post={post} onDeleted={handleDeleted} />
            ))}
          </div>
          {!posts.length && <p className="app-empty">No sheets tagged #{name} yet.</p>}
        </>
      )}
    </div>
  );
}
