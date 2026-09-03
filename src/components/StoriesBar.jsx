import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import CreateStoryModal from "./CreateStoryModal.jsx";
import StoryViewerModal from "./StoryViewerModal.jsx";

// The horizontal "stories" row at the top of the home feed — one circle
// per author with at least one active (not yet expired) story, plus an
// always-present "Your story" circle for the logged-in user to add one.
// See story.controller.js for the 24h-expiry model this renders.
export default function StoriesBar() {
  const { user } = useAuth();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [viewingAuthorId, setViewingAuthorId] = useState(null);

  function loadStories() {
    return api
      .getStories()
      .then((data) => setGroups(data))
      .catch(() => setGroups([]));
  }

  useEffect(() => {
    setLoading(true);
    loadStories().finally(() => setLoading(false));
  }, [user?.id]);

  if (!user || loading) return null;

  const myGroup = groups.find((g) => g.authorId === user.id);
  const others = groups.filter((g) => g.authorId !== user.id);

  return (
    <div className="app-stories-bar">
      <button
        type="button"
        className="app-story-circle"
        onClick={() => (myGroup ? setViewingAuthorId(user.id) : setShowCreate(true))}
      >
        <span className={"app-story-ring" + (myGroup?.hasUnseen ? " has-unseen" : " is-own")}>
          <span className="app-story-avatar">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="" />
            ) : (
              (user.name || user.username).charAt(0).toUpperCase()
            )}
          </span>
          <span
            className="app-story-add-badge"
            onClick={(e) => {
              e.stopPropagation();
              setShowCreate(true);
            }}
            aria-label="Add to story"
          >
            +
          </span>
        </span>
        <span className="app-story-label">Your story</span>
      </button>

      {others.map((g) => (
        <button
          type="button"
          className="app-story-circle"
          key={g.authorId}
          onClick={() => setViewingAuthorId(g.authorId)}
        >
          <span className={"app-story-ring" + (g.hasUnseen ? " has-unseen" : "")}>
            <span className="app-story-avatar">
              {g.author.avatarUrl ? (
                <img src={g.author.avatarUrl} alt="" />
              ) : (
                (g.author.name || g.author.username).charAt(0).toUpperCase()
              )}
            </span>
          </span>
          <span className="app-story-label">{g.author.username}</span>
        </button>
      ))}

      {showCreate && (
        <CreateStoryModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadStories();
          }}
        />
      )}
      {viewingAuthorId != null && (
        <StoryViewerModal
          authorId={viewingAuthorId}
          onClose={() => {
            setViewingAuthorId(null);
            loadStories();
          }}
        />
      )}
    </div>
  );
}
