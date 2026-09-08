import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import NavIcon from "./NavIcons.jsx";
import PostText from "./PostText.jsx";
import RichTextEditor from "./RichTextEditor.jsx";
import ImageCarousel from "./ImageCarousel.jsx";
import PostAnalyticsModal from "./PostAnalyticsModal.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { relativeTime, fullDateTime } from "../lib/formatTime.js";
import { MAX_POST_IMAGES } from "../lib/postLimits.js";

// The five card background themes a sheet can land on (see .app-card-*
// in index.css). "yellow" here is a fixed named swatch, independent of
// the dynamic --app-accent color used for nav/button highlights.
const CARD_COLORS = ["green", "yellow", "pink", "blue", "purple"];

// Seeds the edit form's RichTextEditor for a post that has no contentHtml
// yet (posted before rich text existed, or never formatted) — the editor's
// `content` prop is parsed as HTML, so raw plain text has to be escaped
// first (otherwise a post containing "<3" or "AT&T" would come out mangled)
// and each line wrapped in its own paragraph so multi-line posts don't
// collapse onto one line the way bare HTML would otherwise treat them.
function plainTextToEditableHtml(text) {
  if (!text) return "";
  const escaped = text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  return escaped
    .split("\n")
    .map((line) => `<p>${line || "<br>"}</p>`)
    .join("");
}

// Immutably walks the comment tree and appends `newReply` to whichever
// comment has id === parentId, at whatever depth it lives.
function addReplyToTree(list, parentId, newReply) {
  return list.map((c) => {
    if (c.id === parentId) {
      return { ...c, replies: [...(c.replies || []), newReply] };
    }
    if (c.replies && c.replies.length) {
      return { ...c, replies: addReplyToTree(c.replies, parentId, newReply) };
    }
    return c;
  });
}

// One comment plus its own reply form and (collapsed by default) replies
// sub-section — recurses so a reply-to-a-reply nests the same way.
function CommentNode({
  comment,
  replyingTo,
  setReplyingTo,
  replyDraft,
  setReplyDraft,
  expandedComments,
  toggleReplies,
  onAddReply,
  currentUserId,
  onReportComment,
}) {
  const hasReplies = comment.replies && comment.replies.length > 0;
  const repliesShown = expandedComments.has(comment.id);
  const authorName = comment.user?.name || comment.user?.username || "Someone";

  return (
    <div className="app-comment">
      <div className="app-comment-head">
        <span className="app-comment-dp">{authorName.charAt(0).toUpperCase()}</span>
        <span className="app-comment-author">{authorName}</span>
        <span className="app-card-dot">·</span>
        <span className="app-comment-time">{relativeTime(comment.createdAt)}</span>
      </div>
      <PostText text={comment.content} className="app-comment-text" />

      <div className="app-comment-actions">
        <button
          type="button"
          className="app-comment-reply-btn"
          onClick={() => setReplyingTo((r) => (r === comment.id ? null : comment.id))}
        >
          Reply
        </button>
        {hasReplies && (
          <button
            type="button"
            className="app-comment-reply-btn"
            onClick={() => toggleReplies(comment.id)}
          >
            {repliesShown ? "Hide replies" : `Show replies (${comment.replies.length})`}
          </button>
        )}
        {comment.user?.id !== currentUserId && (
          <button
            type="button"
            className="app-comment-reply-btn"
            onClick={() => onReportComment(comment.id)}
          >
            Report
          </button>
        )}
      </div>

      {replyingTo === comment.id && (
        <form
          className="app-comment-form app-comment-reply-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!replyDraft.trim()) return;
            onAddReply(comment.id, replyDraft.trim());
            setReplyDraft("");
            setReplyingTo(null);
          }}
        >
          <input
            autoFocus
            value={replyDraft}
            onChange={(e) => setReplyDraft(e.target.value)}
            placeholder={`Reply to ${authorName}...`}
          />
          <button type="submit">Reply</button>
        </form>
      )}

      {hasReplies && repliesShown && (
        <div className="app-comment-replies">
          {comment.replies.map((r) => (
            <CommentNode
              key={r.id}
              comment={r}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              replyDraft={replyDraft}
              setReplyDraft={setReplyDraft}
              expandedComments={expandedComments}
              toggleReplies={toggleReplies}
              onAddReply={onAddReply}
              currentUserId={currentUserId}
              onReportComment={onReportComment}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function FeedCard({ post, onDeleted, initiallyExpanded = false }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const isOwnPost = !!post.isOwnPost;

  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [myVote, setMyVote] = useState(post.myVote);
  const [upvotes, setUpvotes] = useState(post.upvotes);
  const [downvotes, setDownvotes] = useState(post.downvotes);
  const [saved, setSaved] = useState(!!post.isBookmarked);
  const [following, setFollowing] = useState(!!post.isFollowedByMe);
  const [isMuted, setIsMuted] = useState(!!post.isMutedByMe);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showVoters, setShowVoters] = useState(false);
  const [voters, setVoters] = useState(null);
  const [shared, setShared] = useState(false);

  const [comments, setComments] = useState(null); // null = not loaded yet
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post.commentCount || 0);
  const [commentDraft, setCommentDraft] = useState("");
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyDraft, setReplyDraft] = useState("");
  const [expandedComments, setExpandedComments] = useState(() => new Set());

  // `images` is the full carousel set (see Post.images in schema.prisma);
  // a legacy/single-image post has none, so it falls back to imageUrl
  // alone — same value, just not worth a 1-item carousel wrapper.
  const initialImages = post.images?.length ? post.images : post.imageUrl ? [post.imageUrl] : [];
  const [text, setText] = useState(post.content);
  const [contentHtml, setContentHtml] = useState(post.contentHtml || null);
  const [images, setImages] = useState(initialImages);
  const [videoUrl, setVideoUrl] = useState(post.videoUrl || null);
  const [isEditing, setIsEditing] = useState(false);
  const [editDraft, setEditDraft] = useState(post.content);
  const [editDraftHtml, setEditDraftHtml] = useState(post.contentHtml || null);
  const [editImages, setEditImages] = useState(initialImages);
  const [editVideoUrl, setEditVideoUrl] = useState(post.videoUrl || null);
  const [editUploading, setEditUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  // Guards against a rapid double-click sending two overlapping vote
  // requests — votePost toggles (clicking the same vote again clears it),
  // so a second click landing before the first request's response comes
  // back would silently cancel out the vote the user thought they'd cast.
  const [voting, setVoting] = useState(false);
  const editFileInputRef = useRef(null);

  const [taggedUsers, setTaggedUsers] = useState(post.taggedUsers || []);
  const [showTagged, setShowTagged] = useState(false);
  const [untagging, setUntagging] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const viewRecordedRef = useRef(false);

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Lazily fetch the comment thread the first time the card expands.
  useEffect(() => {
    if (expanded && comments === null && !commentsLoading) {
      setCommentsLoading(true);
      api
        .getComments(post.id)
        .then((data) => setComments(data))
        .catch(() => setComments([]))
        .finally(() => setCommentsLoading(false));
    }
  }, [expanded, comments, commentsLoading, post.id]);

  // A "view" is recorded once per page load, when the post is actually
  // opened/expanded — not on every feed-scroll impression. The backend
  // (post.controller.js's recordPostView) skips the post's own author, so
  // this fires unconditionally here.
  useEffect(() => {
    if (expanded && !viewRecordedRef.current) {
      viewRecordedRef.current = true;
      api.recordPostView(post.id).catch(() => {});
    }
  }, [expanded, post.id]);

  const score = upvotes - downvotes;

  function stop(e) {
    e.stopPropagation();
  }

  function requireAuth() {
    if (!user) {
      navigate("/login", { state: { from: window.location.pathname } });
      return false;
    }
    return true;
  }

  async function handleUpvote(e) {
    stop(e);
    if (!requireAuth()) return;
    if (voting) return;
    setVoting(true);
    const prev = { myVote, upvotes, downvotes };
    try {
      const res = await api.votePost(post.id, "up");
      setMyVote(res.myVote);
      setUpvotes(res.upvotes);
      setDownvotes(res.downvotes);
    } catch {
      setMyVote(prev.myVote);
      setUpvotes(prev.upvotes);
      setDownvotes(prev.downvotes);
    } finally {
      setVoting(false);
    }
  }
  async function handleDownvote(e) {
    stop(e);
    if (!requireAuth()) return;
    if (voting) return;
    setVoting(true);
    const prev = { myVote, upvotes, downvotes };
    try {
      const res = await api.votePost(post.id, "down");
      setMyVote(res.myVote);
      setUpvotes(res.upvotes);
      setDownvotes(res.downvotes);
    } catch {
      setMyVote(prev.myVote);
      setUpvotes(prev.upvotes);
      setDownvotes(prev.downvotes);
    } finally {
      setVoting(false);
    }
  }

  function handleShare(e) {
    stop(e);
    const url = `${window.location.origin}/post/${post.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setShared(true);
    setTimeout(() => setShared(false), 1500);
  }

  async function handleToggleFollow(e) {
    stop(e);
    setMenuOpen(false);
    if (!requireAuth()) return;
    const next = !following;
    setFollowing(next);
    try {
      if (next) await api.follow(post.author.id);
      else await api.unfollow(post.author.id);
    } catch {
      setFollowing(!next);
    }
  }

  async function handleToggleSave(e) {
    stop(e);
    if (!requireAuth()) return;
    const next = !saved;
    setSaved(next);
    try {
      await api.toggleBookmark(post.id, saved);
    } catch {
      setSaved(!next);
    }
  }

  async function handleAddComment(e) {
    e.preventDefault();
    if (!requireAuth()) return;
    if (!commentDraft.trim()) return;
    try {
      const created = await api.addComment(post.id, commentDraft.trim());
      setComments((c) => [...(c || []), { ...created, replies: [] }]);
      setCommentCount((n) => n + 1);
      setCommentDraft("");
    } catch (err) {
      alert(err.message || "Couldn't post comment");
    }
  }

  function toggleReplies(id) {
    setExpandedComments((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleAddReply(parentId, replyText) {
    if (!requireAuth()) return;
    try {
      const created = await api.addComment(post.id, replyText, parentId);
      setComments((c) => addReplyToTree(c || [], parentId, { ...created, replies: [] }));
      setCommentCount((n) => n + 1);
      setExpandedComments((prev) => new Set(prev).add(parentId));
    } catch (err) {
      alert(err.message || "Couldn't post reply");
    }
  }

  function handleShowVoters(e) {
    stop(e);
    const next = !showVoters;
    setShowVoters(next);
    if (next && !voters) {
      api
        .getPostVoters(post.id)
        .then(setVoters)
        .catch(() => setVoters({ upvoters: [], downvoters: [] }));
    }
  }

  async function handleSaveEdit(e) {
    e.preventDefault();
    if ((!editDraft.trim() && !editImages.length && !editVideoUrl) || busy) return;
    setBusy(true);
    try {
      const updated = await api.updatePost(post.id, {
        content: editDraft.trim(),
        contentHtml: editDraftHtml,
        images: editImages,
        videoUrl: editVideoUrl || null,
      });
      setText(updated.content);
      setContentHtml(updated.contentHtml || null);
      setImages(updated.images?.length ? updated.images : updated.imageUrl ? [updated.imageUrl] : []);
      setVideoUrl(updated.videoUrl || null);
      setIsEditing(false);
    } catch (err) {
      alert(err.message || "Couldn't save changes");
    } finally {
      setBusy(false);
    }
  }
  function handleCancelEdit(e) {
    stop(e);
    setEditDraft(text);
    setEditDraftHtml(contentHtml);
    setEditImages(images);
    setEditVideoUrl(videoUrl);
    setIsEditing(false);
  }

  function handleRemoveEditImage(index) {
    setEditImages((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleEditAttachFiles(e) {
    const files = Array.from(e.target.files || []);
    e.target.value = "";
    if (!files.length) return;
    setEditUploading(true);
    try {
      const videoFile = files.find((f) => f.type.startsWith("video/"));
      if (videoFile) {
        const uploaded = await api.uploadMedia(videoFile);
        setEditVideoUrl(uploaded.url);
        setEditImages([]);
      } else {
        const room = MAX_POST_IMAGES - editImages.length;
        const toUpload = files.slice(0, room);
        const uploaded = await Promise.all(toUpload.map((f) => api.uploadMedia(f)));
        setEditImages((prev) => [...prev, ...uploaded.map((u) => u.url)]);
        setEditVideoUrl(null);
      }
    } catch (err) {
      alert(err.message || "Upload failed");
    } finally {
      setEditUploading(false);
    }
  }

  async function handleDeletePost(e) {
    stop(e);
    setMenuOpen(false);
    if (!window.confirm("Delete this post? This can't be undone.")) return;
    try {
      await api.deletePost(post.id);
      onDeleted?.(post.id);
    } catch (err) {
      alert(err.message || "Couldn't delete post");
    }
  }

  async function handleReport(e) {
    stop(e);
    setMenuOpen(false);
    if (!requireAuth()) return;
    const reason = window.prompt("Why are you reporting this post?");
    if (!reason || !reason.trim()) return;
    try {
      await api.reportPost(post.id, reason.trim());
      alert("Report submitted.");
    } catch (err) {
      alert(err.message || "Couldn't submit report");
    }
  }

  async function handleReportComment(commentId) {
    if (!requireAuth()) return;
    const reason = window.prompt("Why are you reporting this comment?");
    if (!reason || !reason.trim()) return;
    try {
      await api.reportComment(commentId, reason.trim());
      alert("Report submitted.");
    } catch (err) {
      alert(err.message || "Couldn't submit report");
    }
  }

  async function handleUntagSelf(e) {
    stop(e);
    if (!user || untagging) return;
    setUntagging(true);
    try {
      await api.untagSelf(post.id);
      setTaggedUsers((list) => list.filter((u) => u.id !== user.id));
    } catch (err) {
      alert(err.message || "Couldn't remove tag");
    } finally {
      setUntagging(false);
    }
  }

  async function handleBlock(e) {
    stop(e);
    setMenuOpen(false);
    if (!requireAuth()) return;
    if (!window.confirm(`Block @${post.author.username}?`)) return;
    try {
      await api.block(post.author.id);
      alert(`@${post.author.username} is blocked.`);
    } catch (err) {
      alert(err.message || "Couldn't block user");
    }
  }

  async function handleMuteToggle(e) {
    stop(e);
    setMenuOpen(false);
    if (!requireAuth()) return;
    const wasMuted = isMuted;
    setIsMuted(!wasMuted);
    try {
      if (wasMuted) await api.unmute(post.author.id);
      else await api.mute(post.author.id);
    } catch (err) {
      setIsMuted(wasMuted);
      alert(err.message || "Couldn't update mute status");
    }
  }

  const displayName = post.author?.name || post.author?.username || "Someone";
  // Picked once per mount (i.e. once per page load/reload) rather than
  // derived from post.id, so cards reshuffle to new random colors on
  // every reload instead of always landing on the same color per post.
  const cardColor = useMemo(
    () => CARD_COLORS[Math.floor(Math.random() * CARD_COLORS.length)],
    [post.id],
  );

  return (
    <>
    <article
      className={`app-card app-card-${cardColor}`}
      onClick={() => setExpanded((v) => !v)}
    >
      <div className="app-card-tab">
        <Link to={`/profile/${post.author.username}`} className="app-card-dp" onClick={stop}>
          {post.author.avatarUrl ? (
            <img src={post.author.avatarUrl} alt="" className="app-card-dp-photo" />
          ) : (
            displayName.charAt(0).toUpperCase()
          )}
        </Link>
        <Link to={`/profile/${post.author.username}`} className="app-card-name" onClick={stop}>
          {displayName}
        </Link>
        <span className="app-card-dot">·</span>
        <Link to={`/post/${post.id}`} className="app-card-time" onClick={stop}>
          {relativeTime(post.createdAt)}
        </Link>

        <div className="app-card-more-wrap" ref={menuRef}>
          <button
            type="button"
            className={
              "app-card-more" +
              (!isOwnPost ? (following ? " is-following" : " is-not-following") : "")
            }
            aria-label="More post options"
            onClick={(e) => {
              stop(e);
              setMenuOpen((v) => !v);
            }}
          >
            <NavIcon name="dots" />
          </button>
          {menuOpen && (
            <div className="app-card-more-menu">
              <button
                type="button"
                onClick={(e) => {
                  stop(e);
                  setMenuOpen(false);
                  navigate(`/profile/${post.author.username}`);
                }}
              >
                Visit profile
              </button>
              {!isOwnPost && (
                <button type="button" onClick={handleToggleFollow}>
                  {following ? "Unfollow" : "Follow"}
                </button>
              )}
              {isOwnPost ? (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      setMenuOpen(false);
                      setEditDraft(text);
                      setEditDraftHtml(contentHtml);
                      setEditImages(images);
                      setEditVideoUrl(videoUrl);
                      setIsEditing(true);
                      setExpanded(false);
                    }}
                  >
                    Edit post
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      stop(e);
                      setMenuOpen(false);
                      setShowAnalytics(true);
                    }}
                  >
                    View analytics
                  </button>
                  <button type="button" className="app-card-more-danger" onClick={handleDeletePost}>
                    Delete post
                  </button>
                </>
              ) : (
                <>
                  <button type="button" onClick={handleReport}>
                    Report post
                  </button>
                  <button type="button" onClick={handleMuteToggle}>
                    {isMuted ? "Unmute" : `Mute @${post.author.username}`}
                  </button>
                  <button type="button" onClick={handleBlock}>
                    Block
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {isEditing ? (
        <form className="app-card-edit-form" onClick={stop} onSubmit={handleSaveEdit}>
          <RichTextEditor
            content={editDraftHtml || plainTextToEditableHtml(editDraft)}
            onChange={({ html, text: t }) => {
              setEditDraft(t);
              setEditDraftHtml(html);
            }}
            placeholder="Edit your sheet..."
            autoFocus
          />
          {editImages.length > 0 && (
            <div className="app-composer-image-grid">
              {editImages.map((url, i) => (
                <div className="app-card-edit-media" key={url + i}>
                  <img src={url} alt="" />
                  <button
                    type="button"
                    onClick={() => handleRemoveEditImage(i)}
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          {editVideoUrl && (
            <div className="app-card-edit-media">
              <video src={editVideoUrl} controls />
              <button type="button" onClick={() => setEditVideoUrl(null)} aria-label="Remove video">
                ×
              </button>
            </div>
          )}
          <div className="app-card-edit-actions">
            <button
              type="button"
              onClick={() => editFileInputRef.current?.click()}
              disabled={editUploading || !!editVideoUrl || editImages.length >= MAX_POST_IMAGES}
            >
              <NavIcon name="image" />
              {editUploading
                ? "Uploading..."
                : editImages.length
                  ? `Add photo (${editImages.length}/${MAX_POST_IMAGES})`
                  : "Attach"}
            </button>
            <input
              ref={editFileInputRef}
              type="file"
              accept={editImages.length ? "image/*" : "image/*,video/*"}
              multiple
              hidden
              onChange={handleEditAttachFiles}
            />
            <button type="submit" disabled={busy || editUploading}>
              {busy ? "Saving..." : "Save"}
            </button>
            <button type="button" onClick={handleCancelEdit}>
              Cancel
            </button>
          </div>
        </form>
      ) : (
        <div className="app-card-content-box">
          <PostText text={text} html={contentHtml} />
          {images.length > 1 ? (
            <ImageCarousel images={images} onClick={stop} />
          ) : (
            images.length === 1 && (
              <div className="app-card-media">
                <img src={images[0]} alt="" />
              </div>
            )
          )}
          {videoUrl && (
            <div className="app-card-media">
              <video src={videoUrl} controls />
            </div>
          )}
        </div>
      )}

      <div className="app-card-actions" onClick={stop}>
        <div className="app-vote-group">
          <button
            type="button"
            className={"app-vote-btn" + (myVote === "up" ? " is-up" : "")}
            aria-label="Upvote"
            onClick={handleUpvote}
            disabled={voting}
          >
            <NavIcon name="arrow-up" />
          </button>
          <span className="app-vote-score">{score}</span>
          <button
            type="button"
            className={"app-vote-btn" + (myVote === "down" ? " is-down" : "")}
            aria-label="Downvote"
            onClick={handleDownvote}
            disabled={voting}
          >
            <NavIcon name="arrow-down" />
          </button>
        </div>

        <button type="button" className="app-action-btn" onClick={() => setExpanded(true)}>
          <NavIcon name="chat" />
          <span>{commentCount}</span>
        </button>

        <button
          type="button"
          className="app-action-btn app-desktop-only"
          aria-label="Share"
          onClick={handleShare}
        >
          <NavIcon name="share" />
          {shared && <span>Copied</span>}
        </button>

        <button
          type="button"
          className={"app-action-btn" + (saved ? " is-active" : "")}
          aria-label="Save"
          onClick={handleToggleSave}
        >
          <NavIcon name="bookmark" />
        </button>

        {taggedUsers.length > 0 && (
          <div className="app-card-tagged">
            <button
              type="button"
              className="app-card-tagged-toggle"
              aria-label="Tagged people"
              onClick={() => setShowTagged((v) => !v)}
            >
              <NavIcon name="tag" />
              <span>{taggedUsers.length}</span>
            </button>
            {showTagged && (
              <div className="app-card-tagged-pop">
                <p className="app-card-tagged-label">Tagged</p>
                <ul>
                  {taggedUsers.map((u) => (
                    <li key={u.id}>
                      <Link to={`/profile/${u.username}`} onClick={stop}>
                        {u.name || u.username}
                      </Link>
                      {user?.id === u.id && (
                        <button type="button" onClick={handleUntagSelf} disabled={untagging}>
                          Remove me
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {expanded && (
        <div className="app-card-expanded" onClick={stop}>
          <p className="app-card-datetime">{fullDateTime(post.createdAt)}</p>

          <button type="button" className="app-card-voters-toggle" onClick={handleShowVoters}>
            {showVoters ? "Hide reactions" : "See who upvoted or downvoted"}
          </button>
          {showVoters && (
            <div className="app-card-voters">
              {!voters ? (
                <p className="app-empty">Loading...</p>
              ) : (
                <>
                  <p>
                    <strong>Upvoted:</strong>{" "}
                    {voters.upvoters.length
                      ? voters.upvoters.map((u) => u.name || u.username).join(", ")
                      : "No one yet"}
                  </p>
                  <p>
                    <strong>Downvoted:</strong>{" "}
                    {voters.downvoters.length
                      ? voters.downvoters.map((u) => u.name || u.username).join(", ")
                      : "No one yet"}
                  </p>
                </>
              )}
            </div>
          )}

          <div className="app-card-comments-scroll">
            <div className="app-card-comments">
              {commentsLoading && <p className="app-empty">Loading comments...</p>}
              {!commentsLoading &&
                comments?.map((c) => (
                  <CommentNode
                    key={c.id}
                    comment={c}
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                    replyDraft={replyDraft}
                    setReplyDraft={setReplyDraft}
                    expandedComments={expandedComments}
                    toggleReplies={toggleReplies}
                    onAddReply={handleAddReply}
                    currentUserId={user?.id}
                    onReportComment={handleReportComment}
                  />
                ))}
              {!commentsLoading && comments && !comments.length && (
                <p className="app-empty">No comments yet — be the first.</p>
              )}
            </div>
          </div>

          <form className="app-comment-form" onSubmit={handleAddComment}>
            <input
              value={commentDraft}
              onChange={(e) => setCommentDraft(e.target.value)}
              placeholder="Write a comment..."
            />
            <button type="submit">Comment</button>
          </form>
        </div>
      )}
    </article>
    {showAnalytics && (
      <PostAnalyticsModal postId={post.id} onClose={() => setShowAnalytics(false)} />
    )}
    </>
  );
}
