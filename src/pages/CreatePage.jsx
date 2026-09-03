import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavIcon from "../components/NavIcons.jsx";
import RichTextEditor from "../components/RichTextEditor.jsx";
import TagPeoplePicker from "../components/TagPeoplePicker.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { extractHashtags } from "../lib/hashtags.js";
import { MAX_POST_IMAGES as MAX_IMAGES } from "../lib/postLimits.js";

// A dedicated compose screen — separate from the inline composer at the
// top of the home feed — reached from the sidebar/bottom-nav "New Sheet"
// buttons, matching how the previous site's /create page worked.
export default function CreatePage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // `draft` is the plain text (what hashtag extraction and the "is there
  // anything to post" check work off of); `draftHtml` is the formatted
  // version from the toolbar editor, sent alongside it — see the
  // composer's RichTextEditor and the backend's lib/richText.js.
  const [draft, setDraft] = useState("");
  const [draftHtml, setDraftHtml] = useState("");
  const [images, setImages] = useState([]); // [{ url, previewSrc }], up to MAX_IMAGES
  const [video, setVideo] = useState(null); // { url, previewSrc }
  const [uploading, setUploading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [taggedPeople, setTaggedPeople] = useState([]); // selected user objects

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: "/create" } });
    }
  }, [loading, user, navigate]);

  // URL.createObjectURL(file) below never gets revoked on its own — each
  // one keeps that file's data alive in memory until revokeObjectURL is
  // called or the page unloads, and this composer can create several
  // (attach, remove, re-attach, switch between images and video). Refs
  // mirror the latest images/video so the unmount cleanup below — which
  // only runs once, on navigating away after posting or cancelling — can
  // see whatever is still attached at that point without re-subscribing
  // this effect on every attach/remove.
  const imagesRef = useRef(images);
  imagesRef.current = images;
  const videoRef = useRef(video);
  videoRef.current = video;
  useEffect(() => {
    return () => {
      imagesRef.current.forEach((img) => img.previewSrc && URL.revokeObjectURL(img.previewSrc));
      if (videoRef.current?.previewSrc) URL.revokeObjectURL(videoRef.current.previewSrc);
    };
  }, []);

  async function handleAttachFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = ""; // allow picking the same file(s) again later
    if (!files.length) return;
    setUploading(true);
    setError("");
    try {
      const videoFile = files.find((f) => f.type.startsWith("video/"));
      if (videoFile) {
        const uploaded = await api.uploadMedia(videoFile);
        setVideo({ url: uploaded.url, previewSrc: URL.createObjectURL(videoFile) });
        // Switching to a video attachment drops any images already
        // attached — revoke their preview URLs, they're gone for good.
        images.forEach((img) => img.previewSrc && URL.revokeObjectURL(img.previewSrc));
        setImages([]);
        if (files.length > 1) {
          setError("A post can only have one video — the rest of your selection was skipped.");
        }
        return;
      }

      const room = MAX_IMAGES - images.length;
      const toUpload = files.slice(0, room);
      if (files.length > toUpload.length) {
        setError(`A post can have up to ${MAX_IMAGES} images — the rest were skipped.`);
      }
      const uploaded = await Promise.all(toUpload.map((f) => api.uploadMedia(f)));
      setImages((prev) => [
        ...prev,
        ...uploaded.map((u, i) => ({ url: u.url, previewSrc: URL.createObjectURL(toUpload[i]) })),
      ]);
      // Switching to image attachments drops any video already attached.
      if (video?.previewSrc) URL.revokeObjectURL(video.previewSrc);
      setVideo(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveImage(index) {
    setImages((prev) => {
      const removed = prev[index];
      if (removed?.previewSrc) URL.revokeObjectURL(removed.previewSrc);
      return prev.filter((_, i) => i !== index);
    });
  }

  function handleRemoveVideo() {
    setVideo((prev) => {
      if (prev?.previewSrc) URL.revokeObjectURL(prev.previewSrc);
      return null;
    });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if ((!draft.trim() && !images.length && !video) || posting) return;
    setPosting(true);
    setError("");
    try {
      const payload = { content: draft.trim(), contentHtml: draftHtml };
      if (images.length) payload.images = images.map((img) => img.url);
      if (video) payload.videoUrl = video.url;
      const tags = extractHashtags(draft);
      if (tags.length) payload.tags = tags;
      if (taggedPeople.length) payload.taggedUserIds = taggedPeople.map((u) => u.id);
      await api.createPost(payload);
      navigate("/");
    } catch (err) {
      setError(err.message || "Couldn't post");
    } finally {
      setPosting(false);
    }
  }

  if (!user) return null;

  const canPost = (draft.trim() || images.length || video) && !posting && !uploading;
  const attachDisabled = uploading || !!video || images.length >= MAX_IMAGES;
  const fileAccept = images.length ? "image/*" : "image/*,video/*";

  return (
    <div className="app-page app-create-page">
      <div className="app-create-head">
        <button type="button" className="app-create-cancel" onClick={() => navigate(-1)}>
          Cancel
        </button>
        <h2 className="app-section-title">New Sheet</h2>
        <button
          type="button"
          className="app-create-post-btn"
          onClick={handleSubmit}
          disabled={!canPost}
        >
          {posting ? "Posting..." : "Post"}
        </button>
      </div>

      <form className="app-create-form" onSubmit={handleSubmit}>
        <RichTextEditor
          onChange={({ html, text }) => {
            setDraft(text);
            setDraftHtml(html);
          }}
          placeholder={`Share a sheet, ${user.username}... (try a #hashtag)`}
          autoFocus
        />

        {uploading && <p className="app-composer-uploading">Uploading...</p>}
        {images.length > 0 && (
          <div className="app-composer-image-grid">
            {images.map((img, i) => (
              <div className="app-composer-attachment" key={img.url}>
                <img src={img.previewSrc} alt={`Attachment ${i + 1} preview`} />
                <button type="button" onClick={() => handleRemoveImage(i)} aria-label="Remove image">
                  ×
                </button>
              </div>
            ))}
          </div>
        )}
        {video && (
          <div className="app-composer-attachment">
            <video src={video.previewSrc} controls />
            <button type="button" onClick={handleRemoveVideo} aria-label="Remove video">
              ×
            </button>
          </div>
        )}

        {error && <p className="app-auth-error">{error}</p>}

        <div className="app-create-actions-row">
          <button
            type="button"
            className="app-create-attach"
            onClick={() => fileInputRef.current?.click()}
            disabled={attachDisabled}
          >
            <NavIcon name="image" />
            <span>
              {images.length ? `Add photo (${images.length}/${MAX_IMAGES})` : "Photo / video"}
            </span>
          </button>
          <TagPeoplePicker
            selected={taggedPeople}
            onChange={setTaggedPeople}
            excludeUserId={user.id}
          />
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={fileAccept}
          multiple
          hidden
          onChange={handleAttachFiles}
        />
      </form>
    </div>
  );
}
