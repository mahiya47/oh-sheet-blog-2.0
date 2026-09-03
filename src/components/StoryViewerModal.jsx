import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { relativeTime } from "../lib/formatTime.js";

const TEXT_IMAGE_DURATION_MS = 5000;

// Full-screen sequential story viewer for one author's active stories —
// opened from StoriesBar. Auto-advances (text/image on a timer, video on
// its own `onEnded`), records a view the moment each story is shown (see
// story.controller.js's viewStory — a no-op for the author's own story),
// and lets the author delete a story they're currently viewing.
export default function StoryViewerModal({ authorId, onClose }) {
  const [stories, setStories] = useState(null); // null = loading
  const [index, setIndex] = useState(0);
  const viewedRef = useRef(new Set());
  const timerRef = useRef(null);
  const videoRef = useRef(null);

  useEffect(() => {
    let cancelled = false;
    api
      .getAuthorStories(authorId)
      .then((data) => {
        if (cancelled) return;
        if (!data.length) {
          onClose();
          return;
        }
        setStories(data);
        const firstUnseen = data.findIndex((s) => !s.isViewedByMe);
        setIndex(firstUnseen === -1 ? 0 : firstUnseen);
      })
      .catch(() => onClose());
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authorId]);

  const current = stories?.[index];

  // Deliberately checks the boundary here rather than inside setIndex's
  // functional updater — React (in StrictMode, during development) invokes
  // a functional updater twice to help surface exactly this kind of bug,
  // so calling onClose() (a side effect, and one the parent isn't built to
  // receive twice) from inside one risked firing it twice per advance.
  // goNext is a plain function re-created each render, so it always closes
  // over the `index`/`stories` from its own render — including the one
  // captured by the auto-advance timer set up in the effect below.
  function goNext() {
    if (!stories) return;
    if (index >= stories.length - 1) {
      onClose();
      return;
    }
    setIndex((i) => i + 1);
  }
  function goPrev() {
    setIndex((i) => Math.max(0, i - 1));
  }

  // Record the view + run the auto-advance timer for whichever story is
  // currently on screen. Video stories advance on their own `onEnded`
  // instead (see the <video> element below), so no timer is set for them.
  useEffect(() => {
    if (!current) return;
    if (!viewedRef.current.has(current.id)) {
      viewedRef.current.add(current.id);
      api.viewStory(current.id).catch(() => {});
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!current.videoUrl) {
      timerRef.current = setTimeout(goNext, TEXT_IMAGE_DURATION_MS);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  async function handleDelete() {
    if (!current || !window.confirm("Delete this story?")) return;
    try {
      await api.deleteStory(current.id);
      if (stories.length === 1) {
        onClose();
        return;
      }
      const rest = stories.filter((s) => s.id !== current.id);
      setStories(rest);
      setIndex((i) => Math.min(i, rest.length - 1));
    } catch (err) {
      alert(err.message || "Couldn't delete story");
    }
  }

  const progressSegments = useMemo(() => stories?.map((s) => s.id) || [], [stories]);

  if (!stories || !current) {
    return (
      <div className="app-story-viewer-overlay">
        <p className="app-composer-uploading">Loading...</p>
      </div>
    );
  }

  return (
    <div className="app-story-viewer-overlay">
      <div className="app-story-viewer">
        <div className="app-story-progress-row">
          {progressSegments.map((id, i) => (
            <div className="app-story-progress-seg" key={id}>
              <div
                className={
                  "app-story-progress-fill" +
                  (i < index ? " is-full" : i === index ? " is-active" : "")
                }
                style={i === index && !current.videoUrl ? { animationDuration: `${TEXT_IMAGE_DURATION_MS}ms` } : undefined}
              />
            </div>
          ))}
        </div>

        <div className="app-story-viewer-header">
          <Link to={`/profile/${current.author.username}`} className="app-story-viewer-author" onClick={onClose}>
            <span className="app-story-viewer-dp">
              {current.author.avatarUrl ? (
                <img src={current.author.avatarUrl} alt="" />
              ) : (
                (current.author.name || current.author.username).charAt(0).toUpperCase()
              )}
            </span>
            <span>{current.author.username}</span>
          </Link>
          <span className="app-story-viewer-time">{relativeTime(current.createdAt)}</span>
          <button type="button" className="app-story-viewer-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <div className="app-story-viewer-media">
          {current.imageUrl && <img src={current.imageUrl} alt="" />}
          {current.videoUrl && (
            <video ref={videoRef} src={current.videoUrl} autoPlay playsInline onEnded={goNext} />
          )}
          {current.text && (
            <div className={`app-story-text-card app-card-${current.backgroundColor || "yellow"}`}>
              <p>{current.text}</p>
            </div>
          )}
          <button type="button" className="app-story-tap-zone app-story-tap-left" onClick={goPrev} aria-label="Previous story" />
          <button type="button" className="app-story-tap-zone app-story-tap-right" onClick={goNext} aria-label="Next story" />
        </div>

        {current.isOwnStory && (
          <div className="app-story-viewer-footer">
            <span>{current.viewCount} view{current.viewCount === 1 ? "" : "s"}</span>
            <button type="button" onClick={handleDelete}>
              Delete
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
