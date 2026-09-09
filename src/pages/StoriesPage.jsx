import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import CreateStoryModal from "../components/CreateStoryModal.jsx";
import StoryViewerModal from "../components/StoryViewerModal.jsx";

// The full stories screen, reached from the stories tab in the phone's
// bottom bar. The home feed's StoriesBar is a one-line summary of the
// same data (see story.controller.js's 24h-expiry model); this is the
// roomy version — every author who has an active story as a tappable
// card, with your own story and the composer pinned at the top.
export default function StoriesPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState(null); // null = still loading
  const [error, setError] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [viewingAuthorId, setViewingAuthorId] = useState(null);

  function loadStories() {
    return api
      .getStories()
      .then((data) => {
        setGroups(data);
        setError("");
      })
      .catch((err) => {
        setGroups([]);
        setError(err.message || "Couldn't load stories.");
      });
  }

  useEffect(() => {
    if (!user) {
      setGroups([]);
      return;
    }
    loadStories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (!user) {
    return (
      <div className="app-page">
        <h2 className="app-section-title">Stories</h2>
        <p className="app-empty">
          <Link to="/login">Log in</Link> to see stories and post your own.
        </p>
      </div>
    );
  }

  const myGroup = groups?.find((g) => g.authorId === user.id) || null;
  const others = groups?.filter((g) => g.authorId !== user.id) || [];

  return (
    <div className="app-page app-stories-page">
      <h2 className="app-section-title">Stories</h2>

      {error && <p className="app-auth-error">{error}</p>}

      {/* Your own story: view what you posted, or start one. */}
      <div className="app-stories-mine">
        <button
          type="button"
          className="app-stories-mine-main"
          onClick={() => (myGroup ? setViewingAuthorId(user.id) : setShowCreate(true))}
        >
          <span className={"app-story-ring" + (myGroup ? " is-own" : "")}>
            <span className="app-story-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" />
              ) : (
                (user.name || user.username).charAt(0).toUpperCase()
              )}
            </span>
          </span>
          <span className="app-stories-mine-text">
            <strong>Your story</strong>
            <span>
              {myGroup
                ? `${myGroup.stories.length} active · ${totalViews(myGroup)} view${
                    totalViews(myGroup) === 1 ? "" : "s"
                  }`
                : "Nothing posted yet"}
            </span>
          </span>
        </button>
        <button
          type="button"
          className="app-stories-add-btn"
          onClick={() => setShowCreate(true)}
        >
          + Add
        </button>
      </div>

      {groups === null ? (
        <div className="app-stories-grid">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="app-stories-card app-stories-card-skeleton" />
          ))}
        </div>
      ) : others.length ? (
        <div className="app-stories-grid">
          {others.map((g) => (
            <StoryCard key={g.authorId} group={g} onOpen={() => setViewingAuthorId(g.authorId)} />
          ))}
        </div>
      ) : (
        <p className="app-empty">
          No one else has posted a story yet. Stories disappear after 24 hours.
        </p>
      )}

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

function totalViews(group) {
  return group.stories.reduce((sum, s) => sum + (s.viewCount || 0), 0);
}

// One author's stories as a card: their newest story as the backdrop
// (photo, video poster frame, or the colored card a text story lives
// on), with the ring showing whether anything in it is unwatched.
function StoryCard({ group, onOpen }) {
  const latest = group.stories[group.stories.length - 1];
  const preview = latest?.imageUrl || latest?.videoUrl || null;
  const isVideo = !latest?.imageUrl && !!latest?.videoUrl;

  return (
    <button
      type="button"
      className={"app-stories-card" + (group.hasUnseen ? " has-unseen" : "")}
      onClick={onOpen}
    >
      <span className={"app-stories-card-media app-card-" + (latest?.backgroundColor || "yellow")}>
        {preview ? (
          isVideo ? (
            <video src={latest.videoUrl} muted playsInline preload="metadata" />
          ) : (
            <img src={latest.imageUrl} alt="" />
          )
        ) : (
          <span className="app-stories-card-text">{latest?.text}</span>
        )}
      </span>

      <span className="app-stories-card-foot">
        <span className={"app-story-ring" + (group.hasUnseen ? " has-unseen" : "")}>
          <span className="app-story-avatar">
            {group.author.avatarUrl ? (
              <img src={group.author.avatarUrl} alt="" />
            ) : (
              (group.author.name || group.author.username).charAt(0).toUpperCase()
            )}
          </span>
        </span>
        <span className="app-stories-card-name">{group.author.username}</span>
      </span>
    </button>
  );
}
