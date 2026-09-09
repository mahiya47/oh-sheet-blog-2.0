import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import CreateStoryModal from "../components/CreateStoryModal.jsx";
import StoryViewerModal from "../components/StoryViewerModal.jsx";
import CameraCaptureModal from "../components/CameraCaptureModal.jsx";

// The full stories screen, reached from the stories tab in the phone's
// bottom bar: your own story on top, then everyone else's as rows —
// unwatched first, already-watched collapsed underneath. The home feed's
// StoriesBar (desktop only now) is the one-line version of the same data;
// see story.controller.js for the 24h-expiry model both render.
export default function StoriesPage() {
  const { user } = useAuth();
  const [groups, setGroups] = useState(null); // null = still loading
  const [error, setError] = useState("");
  const [composerTab, setComposerTab] = useState(null); // null = closed
  const [viewingAuthorId, setViewingAuthorId] = useState(null);
  const [showViewed, setShowViewed] = useState(true);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraShot, setCameraShot] = useState(null); // File from the camera

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
  const unseen = others.filter((g) => g.hasUnseen);
  const seen = others.filter((g) => !g.hasUnseen);

  return (
    <div className="app-page app-stories-page">
      <h2 className="app-section-title">Stories</h2>

      {error && <p className="app-auth-error">{error}</p>}

      {/* Your own story — tap to watch yours back, or to start one. The
          + badge always opens the composer, even when you already have
          one running. */}
      <div className="app-story-rows">
      <button
        type="button"
        className="app-story-row"
        onClick={() => (myGroup ? setViewingAuthorId(user.id) : setComposerTab("text"))}
      >
        <span className="app-story-row-ring">
          <span className={"app-story-ring" + (myGroup ? " is-own" : " is-empty")}>
            <span className="app-story-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="" />
              ) : (
                (user.name || user.username).charAt(0).toUpperCase()
              )}
            </span>
          </span>
          <span
            className="app-story-row-add"
            role="button"
            tabIndex={0}
            aria-label="Add to your story"
            onClick={(e) => {
              e.stopPropagation();
              setComposerTab("text");
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                setComposerTab("text");
              }
            }}
          >
            +
          </span>
        </span>
        <span className="app-story-row-text">
          <strong>{myGroup ? "Your story" : "Add story"}</strong>
          <span>
            {myGroup
              ? `${myGroup.stories.length} update${myGroup.stories.length === 1 ? "" : "s"} · ${storyTime(latestAt(myGroup))}`
              : "Disappears after 24 hours"}
          </span>
        </span>
      </button>
      </div>

      {groups === null ? (
        <div className="app-story-rows">
          {[0, 1, 2].map((i) => (
            <div key={i} className="app-story-row app-story-row-skeleton" />
          ))}
        </div>
      ) : (
        <>
          {unseen.length > 0 && (
            <>
              <p className="app-stories-label">Recent updates</p>
              <div className="app-story-rows">
                {unseen.map((g) => (
                  <StoryRow key={g.authorId} group={g} onOpen={() => setViewingAuthorId(g.authorId)} />
                ))}
              </div>
            </>
          )}

          {seen.length > 0 && (
            <>
              <button
                type="button"
                className="app-stories-label app-stories-label-toggle"
                onClick={() => setShowViewed((v) => !v)}
                aria-expanded={showViewed}
              >
                <span>Viewed updates</span>
                <Chevron up={showViewed} />
              </button>
              {showViewed && (
                <div className="app-story-rows">
                  {seen.map((g) => (
                    <StoryRow
                      key={g.authorId}
                      group={g}
                      onOpen={() => setViewingAuthorId(g.authorId)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {!others.length && (
            <p className="app-empty">
              No one else has posted a story yet. Stories disappear after 24 hours.
            </p>
          )}
        </>
      )}

      {/* Camera shortcut, floating clear of the bottom bar. */}
      <button
        type="button"
        className="app-stories-fab"
        aria-label="Add a photo or video story"
        onClick={() => setShowCamera(true)}
      >
        <CameraIcon />
      </button>

      {showCamera && (
        <CameraCaptureModal
          onClose={() => setShowCamera(false)}
          onCapture={(file) => {
            // Straight from the shutter into the composer, where the
            // photo can be written on before it goes up.
            setShowCamera(false);
            setCameraShot(file);
            setComposerTab("media");
          }}
        />
      )}

      {composerTab && (
        <CreateStoryModal
          initialTab={composerTab}
          initialFile={cameraShot}
          onClose={() => {
            setComposerTab(null);
            setCameraShot(null);
          }}
          onCreated={() => {
            setComposerTab(null);
            setCameraShot(null);
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

function StoryRow({ group, onOpen }) {
  return (
    <button type="button" className="app-story-row" onClick={onOpen}>
      <span className="app-story-row-ring">
        <span className={"app-story-ring" + (group.hasUnseen ? " has-unseen" : "")}>
          <span className="app-story-avatar">
            {group.author.avatarUrl ? (
              <img src={group.author.avatarUrl} alt="" />
            ) : (
              (group.author.name || group.author.username).charAt(0).toUpperCase()
            )}
          </span>
        </span>
      </span>
      <span className="app-story-row-text">
        <strong>{group.author.name || group.author.username}</strong>
        <span>{storyTime(latestAt(group))}</span>
      </span>
    </button>
  );
}

function latestAt(group) {
  return group.stories[group.stories.length - 1]?.createdAt;
}

// Stories only live 24 hours, so the timestamp is always today or
// yesterday — a clock time reads better here than "3h".
function storyTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  }
  return "Yesterday";
}

function Chevron({ up }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d={up ? "M6 14l6-6 6 6" : "M6 10l6 6 6-6"}
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CameraIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 8.5A1.5 1.5 0 014.5 7h2.2l1.1-1.8A1 1 0 018.7 4.7h5.6a1 1 0 01.9.5L16.3 7h2.2A1.5 1.5 0 0120 8.5v9A1.5 1.5 0 0118.5 19h-14A1.5 1.5 0 013 17.5z"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinejoin="round"
      />
      <circle cx="11.5" cy="13" r="3.4" stroke="currentColor" strokeWidth="2.1" />
    </svg>
  );
}
