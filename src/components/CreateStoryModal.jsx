import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";

const STORY_COLORS = ["green", "yellow", "pink", "blue", "purple"];
const MAX_STORY_TEXT = 300;

// The story composer — reached from the "+" on the stories bar's own
// circle. Three mutually exclusive kinds: text (on a colored card, same
// five swatches a post card can land on), or a single photo/video. See
// story.controller.js's createStory for the matching backend validation.
export default function CreateStoryModal({ onClose, onCreated, initialTab = "text" }) {
  // initialTab lets a caller open straight onto the photo/video side —
  // the stories page's camera button does that.
  const [tab, setTab] = useState(initialTab); // "text" | "media"
  const [text, setText] = useState("");
  const [color, setColor] = useState(STORY_COLORS[0]);
  const [media, setMedia] = useState(null); // { url, kind, previewSrc }
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // URL.createObjectURL(file) below never gets revoked on its own — the
  // browser keeps that blob alive in memory until revokeObjectURL is
  // called or the page unloads. This fires whenever `media` changes
  // (covers removing the attachment and attaching a different one) and
  // once more on unmount (covers closing the modal, or posting
  // successfully and the modal going away with it).
  useEffect(() => {
    return () => {
      if (media?.previewSrc) URL.revokeObjectURL(media.previewSrc);
    };
  }, [media]);

  async function handleAttachFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    setError("");
    try {
      const uploaded = await api.uploadMedia(file);
      setMedia({ ...uploaded, previewSrc: URL.createObjectURL(file) });
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  const canPost = tab === "text" ? text.trim().length > 0 : !!media;

  async function handlePost() {
    if (!canPost || posting) return;
    setPosting(true);
    setError("");
    try {
      const payload =
        tab === "text"
          ? { text: text.trim(), backgroundColor: color }
          : media.kind === "image"
            ? { imageUrl: media.url }
            : { videoUrl: media.url };
      await api.createStory(payload);
      onCreated();
    } catch (err) {
      setError(err.message || "Couldn't post story");
    } finally {
      setPosting(false);
    }
  }

  return (
    <div className="app-modal-overlay" onClick={onClose}>
      <div className="app-modal app-story-create-modal" onClick={(e) => e.stopPropagation()}>
        <div className="app-modal-head">
          <h3>New story</h3>
          <button type="button" className="app-modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        <div className="app-modal-body">
          <div className="app-story-tabs">
            <button
              type="button"
              className={"app-story-tab" + (tab === "text" ? " is-active" : "")}
              onClick={() => setTab("text")}
            >
              Text
            </button>
            <button
              type="button"
              className={"app-story-tab" + (tab === "media" ? " is-active" : "")}
              onClick={() => setTab("media")}
            >
              Photo / video
            </button>
          </div>

          {tab === "text" ? (
            <>
              <div className={`app-story-preview app-card-${color}`}>
                <textarea
                  autoFocus
                  maxLength={MAX_STORY_TEXT}
                  value={text}
                  placeholder="What's up?"
                  onChange={(e) => setText(e.target.value)}
                />
              </div>
              <div className="app-story-color-row">
                {STORY_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    className={`app-story-swatch app-card-${c}` + (c === color ? " is-selected" : "")}
                    onClick={() => setColor(c)}
                    aria-label={`${c} background`}
                  />
                ))}
              </div>
            </>
          ) : (
            <>
              {uploading && <p className="app-composer-uploading">Uploading...</p>}
              {media ? (
                <div className="app-composer-attachment">
                  {media.kind === "image" ? (
                    <img src={media.previewSrc} alt="Story preview" />
                  ) : (
                    <video src={media.previewSrc} controls />
                  )}
                  <button type="button" onClick={() => setMedia(null)} aria-label="Remove">
                    ×
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="app-create-attach"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  Choose a photo or video
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                hidden
                onChange={handleAttachFile}
              />
            </>
          )}

          {error && <p className="app-auth-error">{error}</p>}

          <button
            type="button"
            className="app-arcade-btn app-whatsnew-done"
            onClick={handlePost}
            disabled={!canPost || posting || uploading}
          >
            {posting ? "Posting..." : "Share to your story"}
          </button>
        </div>
      </div>
    </div>
  );
}
