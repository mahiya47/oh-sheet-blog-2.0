import { useEffect, useRef, useState } from "react";
import { api } from "../lib/api.js";

const STORY_COLORS = ["green", "yellow", "pink", "blue", "purple"];
const MAX_STORY_TEXT = 300;
const MAX_CAPTION = 120;

// Text colours for writing on a photo — plain white/black read on most
// pictures, the brand colours are there for fun.
const CAPTION_COLORS = ["#ffffff", "#1c1810", "#f5c945", "#a3e6a1", "#f6a8cd", "#a3d8f2"];
const CAPTION_POSITIONS = [
  { key: "top", label: "Top" },
  { key: "middle", label: "Middle" },
  { key: "bottom", label: "Bottom" },
];
// Longest edge of an uploaded photo. Phone cameras produce far bigger
// images than a story ever displays, and the caption is burned in at
// this size, so shrinking first keeps the upload quick.
const MAX_IMAGE_EDGE = 1440;

// The story composer. Two kinds, matching what story.controller.js's
// createStory accepts (one of text, image, or video — never a mix):
//
//   Text  — words on one of the five brand-coloured cards.
//   Photo/video — a single picture or clip. On a photo you can write
//     over the picture; since the backend won't store a caption next to
//     an image, the words are drawn into the picture itself before it's
//     uploaded, which is also what makes them land where you placed them.
//
// initialTab opens straight onto one side (the stories page's camera
// button uses it); initialFile pre-loads a picture that was just taken.
export default function CreateStoryModal({ onClose, onCreated, initialTab = "text", initialFile = null }) {
  const [tab, setTab] = useState(initialFile ? "media" : initialTab);
  const [text, setText] = useState("");
  const [color, setColor] = useState(STORY_COLORS[0]);
  // { file, previewSrc, kind } — held locally and uploaded on Share, so
  // a caption can be drawn in first.
  const [media, setMedia] = useState(null);
  const [caption, setCaption] = useState("");
  const [captionColor, setCaptionColor] = useState(CAPTION_COLORS[0]);
  const [captionPos, setCaptionPos] = useState("bottom");
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  // A photo handed over by the camera arrives ready to go.
  useEffect(() => {
    if (!initialFile) return;
    setMedia({
      file: initialFile,
      previewSrc: URL.createObjectURL(initialFile),
      kind: initialFile.type.startsWith("video") ? "video" : "image",
    });
  }, [initialFile]);

  // URL.createObjectURL(file) never gets revoked on its own — the
  // browser keeps that blob alive until revokeObjectURL is called or the
  // page unloads. This fires whenever `media` changes (covers removing
  // the attachment and attaching a different one) and once more on
  // unmount (covers closing the modal, or posting successfully).
  useEffect(() => {
    return () => {
      if (media?.previewSrc) URL.revokeObjectURL(media.previewSrc);
    };
  }, [media]);

  function handleAttachFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setError("");
    setMedia({
      file,
      previewSrc: URL.createObjectURL(file),
      kind: file.type.startsWith("video") ? "video" : "image",
    });
  }

  const isPhoto = media?.kind === "image";
  const canPost = tab === "text" ? text.trim().length > 0 : !!media;

  async function handlePost() {
    if (!canPost || posting) return;
    setPosting(true);
    setError("");
    try {
      if (tab === "text") {
        await api.createStory({ text: text.trim(), backgroundColor: color });
      } else {
        // A photo with words on it gets flattened into one picture
        // first; everything else uploads as-is.
        const toUpload =
          isPhoto && caption.trim()
            ? await burnCaption(media.previewSrc, {
                text: caption.trim(),
                color: captionColor,
                position: captionPos,
              })
            : media.file;
        const uploaded = await api.uploadMedia(toUpload);
        await api.createStory(
          uploaded.kind === "video" ? { videoUrl: uploaded.url } : { imageUrl: uploaded.url }
        );
      }
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
              {media ? (
                <>
                  <div className="app-story-media-stage">
                    {isPhoto ? (
                      <img src={media.previewSrc} alt="Story preview" />
                    ) : (
                      <video src={media.previewSrc} controls />
                    )}
                    {isPhoto && caption.trim() && (
                      <span
                        className={"app-story-caption-overlay is-" + captionPos}
                        style={{ color: captionColor }}
                      >
                        {caption}
                      </span>
                    )}
                    <button
                      type="button"
                      className="app-story-media-remove"
                      onClick={() => {
                        setMedia(null);
                        setCaption("");
                      }}
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  </div>

                  {isPhoto && (
                    <div className="app-story-caption-tools">
                      <input
                        type="text"
                        className="app-story-caption-input"
                        maxLength={MAX_CAPTION}
                        value={caption}
                        placeholder="Write on the photo..."
                        onChange={(e) => setCaption(e.target.value)}
                      />
                      {caption.trim() && (
                        <>
                          <div className="app-story-caption-row">
                            {CAPTION_COLORS.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className={
                                  "app-story-caption-swatch" + (c === captionColor ? " is-selected" : "")
                                }
                                style={{ background: c }}
                                onClick={() => setCaptionColor(c)}
                                aria-label={`Text colour ${c}`}
                              />
                            ))}
                          </div>
                          <div className="app-story-caption-row">
                            {CAPTION_POSITIONS.map((p) => (
                              <button
                                key={p.key}
                                type="button"
                                className={
                                  "app-story-caption-pos" + (p.key === captionPos ? " is-selected" : "")
                                }
                                onClick={() => setCaptionPos(p.key)}
                              >
                                {p.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="app-story-attach-wrap">
                  <button
                    type="button"
                    className="app-create-attach"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    Choose a photo or video
                  </button>
                </div>
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
            className="app-arcade-btn app-whatsnew-done app-story-share-btn"
            onClick={handlePost}
            disabled={!canPost || posting}
          >
            {posting ? "Posting..." : "Share to your story"}
          </button>
        </div>
      </div>
    </div>
  );
}

// Draws the picture and the words into one flattened JPEG, matching
// where the overlay sits in the preview. Returns a File ready to upload.
async function burnCaption(src, { text, color, position }) {
  const img = await loadImage(src);

  const scale = Math.min(1, MAX_IMAGE_EDGE / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.round(img.naturalWidth * scale);
  const h = Math.round(img.naturalHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, 0, 0, w, h);

  // Wait for the display font before measuring, or the lines get laid
  // out against a fallback and then redrawn wider than measured.
  await document.fonts?.ready?.catch(() => {});

  const fontSize = Math.round(w / 14);
  const lineHeight = Math.round(fontSize * 1.25);
  ctx.font = `700 ${fontSize}px Fredoka, Nunito, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lines = wrapLines(ctx, text, w * 0.86);
  const blockHeight = lines.length * lineHeight;
  const pad = Math.round(fontSize * 0.55);

  let top;
  if (position === "top") top = pad * 2;
  else if (position === "middle") top = Math.round((h - blockHeight) / 2);
  else top = h - blockHeight - pad * 2;
  top = Math.max(pad, Math.min(top, h - blockHeight - pad));

  // A soft dark band behind the words so they stay readable over a busy
  // photo, skipped when the text is dark (it's being used on a light
  // picture, and a dark band would fight it).
  if (color !== "#1c1810") {
    ctx.fillStyle = "rgba(0, 0, 0, 0.32)";
    ctx.fillRect(0, top - pad, w, blockHeight + pad * 2);
  }

  ctx.fillStyle = color;
  ctx.shadowColor = "rgba(0, 0, 0, 0.45)";
  ctx.shadowBlur = Math.round(fontSize * 0.25);
  lines.forEach((line, i) => {
    ctx.fillText(line, w / 2, top + i * lineHeight + lineHeight / 2);
  });

  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
  if (!blob) throw new Error("Couldn't prepare the photo");
  return new File([blob], `story-${Date.now()}.jpg`, { type: "image/jpeg" });
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Couldn't read that photo"));
    img.src = src;
  });
}

function wrapLines(ctx, text, maxWidth) {
  const lines = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (ctx.measureText(next).width > maxWidth && line) {
        lines.push(line);
        line = word;
      } else {
        line = next;
      }
    }
    lines.push(line);
  }
  return lines.filter((l) => l.length);
}
