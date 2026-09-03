import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import FeedCard from "../components/FeedCard.jsx";
import { FeedCardSkeleton } from "../components/Skeletons.jsx";
import { api } from "../lib/api.js";
import { useDocumentMeta } from "../lib/useDocumentMeta.js";

// A single sheet's permalink — reached by clicking its timestamp on any
// card, or by opening a shared /post/:id link directly. Renders the same
// FeedCard as everywhere else, just alone on the page and pre-expanded
// so the comment thread (and comment box) are visible immediately
// instead of needing a click.
export default function PostPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [post, setPost] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setPost(null);
    setNotFound(false);
    setError("");
    api
      .getPost(id)
      .then(setPost)
      .catch((err) => {
        if (err.status === 404) setNotFound(true);
        else setError(err.message);
      });
  }, [id]);

  useDocumentMeta(
    post
      ? {
          title: `${post.author?.name || post.author?.username || "A sheet"}'s post`,
          description: post.content,
          // Text-only posts get a generated branded card (see backend's
          // lib/ogImage.js) so shared links still show a preview image.
          image: post.imageUrl || post.ogImageUrl,
          url: `${window.location.origin}/post/${post.id}`,
        }
      : {},
  );

  function handleDeleted() {
    // The post they were looking at no longer exists — send them home
    // rather than leaving them on a page for a deleted sheet.
    navigate("/", { replace: true });
  }

  if (notFound) {
    return (
      <div className="app-page">
        <p className="app-empty">This sheet doesn't exist, or it's been deleted.</p>
      </div>
    );
  }

  return (
    <div className="app-page">
      {error && <p className="app-auth-error">{error}</p>}

      {post === null ? (
        <FeedCardSkeleton />
      ) : (
        <FeedCard post={post} onDeleted={handleDeleted} initiallyExpanded />
      )}
    </div>
  );
}
