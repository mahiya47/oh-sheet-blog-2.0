import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { NotificationsSkeleton } from "../components/Skeletons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { api } from "../lib/api.js";
import { relativeTime } from "../lib/formatTime.js";

const VERBS = {
  follow: "started following you",
  follow_request: "requested to follow you",
  follow_accept: "accepted your follow request",
  upvote: "upvoted your sheet",
  comment: "commented on your sheet",
  reply: "replied to your comment",
  tagged: "tagged you in a sheet",
  mention: "mentioned you",
  dm: "sent you a message",
  report_reply: "replied to your report",
  support_reply: "replied to your support ticket",
  // Rows carried over from the old site, whose reactions were emoji names
  // rather than up/down votes. Without these they'd fall through to the
  // placeholder and read as "<name> did something".
  like: "reacted to your sheet",
  heart: "reacted to your sheet",
  laugh: "reacted to your sheet",
  love: "reacted to your sheet",
  wow: "reacted to your sheet",
  sad: "reacted to your sheet",
  angry: "reacted to your sheet",
  downvote: "downvoted your sheet",
};

// Anything still unrecognised says something plausible rather than "did
// something": if it points at a post it was about that post, otherwise
// it was about the reader.
function verbFor(n) {
  return VERBS[n.type] || (n.postId ? "interacted with your sheet" : "sent you a notification");
}

// These are sent by the admin panel but should never show the admin's own
// name to the recipient — they're presented as coming from "System".
const SYSTEM_TYPES = new Set(["report_reply", "support_reply"]);

export default function NotificationsPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { refresh } = useNotifications();
  const [notifications, setNotifications] = useState(null);
  const [error, setError] = useState("");
  // Follow requests this session has already accepted/declined — once
  // handled, a notification's Accept/Decline buttons go away even though
  // the notification itself stays in the list.
  const [handledRequestIds, setHandledRequestIds] = useState(() => new Set());
  const [requestBusyId, setRequestBusyId] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: "/notifications" } });
    }
  }, [loading, user, navigate]);

  // The list used to be fetched once, when the page mounted, and never
  // again — so a notification arriving while you sat on the page only
  // turned up if you reloaded. It now refreshes on a timer, and
  // immediately whenever you come back to the tab (which is when a stale
  // list is most obvious, and cheaper than waiting out the timer).
  const load = useCallback(async () => {
    if (!user || document.hidden) return;
    try {
      const list = await api.getNotifications();
      setNotifications(list);
      setError("");
      // Clear the bell badge while this page is open — the items below
      // keep showing which ones were unread on this visit (using the
      // `read` flag from this fetch), but the count elsewhere in the app
      // should read zero, same as opening Messages.
      if (list.some((n) => !n.read)) {
        api.markAllNotificationsRead().then(refresh).catch(() => {});
      }
    } catch (err) {
      setError(err.message);
    }
  }, [user, refresh]);

  useEffect(() => {
    if (!user) return undefined;
    load();
    const id = setInterval(load, 15000);
    const onWake = () => load();
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [user, load]);

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setNotifications((list) => list.map((n) => ({ ...n, read: true })));
      refresh();
    } catch (err) {
      setError(err.message || "Couldn't mark as read");
    }
  }

  async function handleOpen(n) {
    if (!n.read) {
      try {
        await api.markNotificationRead(n.id);
        setNotifications((list) => list.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
        refresh();
      } catch {
        // Not critical if this fails silently — still let them navigate.
      }
    }
    if (SYSTEM_TYPES.has(n.type) || !n.actor?.username) return;
    // A DM notification should open the conversation itself, not the
    // sender's profile — everything else still goes to their profile.
    if (n.type === "dm") navigate(`/messages/${n.actor.username}`);
    else navigate(`/profile/${n.actor.username}`);
  }

  async function handleAcceptRequest(e, n) {
    e.stopPropagation();
    if (!n.actor?.id) return;
    setRequestBusyId(n.id);
    try {
      await api.acceptFollowRequest(n.actor.id);
      setHandledRequestIds((prev) => new Set(prev).add(n.id));
    } catch (err) {
      setError(err.message || "Couldn't accept that request");
    } finally {
      setRequestBusyId(null);
    }
  }

  async function handleDeclineRequest(e, n) {
    e.stopPropagation();
    if (!n.actor?.id) return;
    setRequestBusyId(n.id);
    try {
      await api.rejectFollowRequest(n.actor.id);
      setHandledRequestIds((prev) => new Set(prev).add(n.id));
    } catch (err) {
      setError(err.message || "Couldn't decline that request");
    } finally {
      setRequestBusyId(null);
    }
  }

  async function handleRemove(e, id) {
    e.stopPropagation();
    const prev = notifications;
    setNotifications((list) => list.filter((n) => n.id !== id));
    try {
      await api.deleteNotification(id);
    } catch (err) {
      setNotifications(prev);
      setError(err.message || "Couldn't remove notification");
    }
  }

  if (!user) return null;

  const hasUnread = !!notifications?.some((n) => !n.read);

  return (
    <div className="app-page">
      <div className="app-notif-head">
        <h2 className="app-section-title">Notifications</h2>
        {hasUnread && (
          <button type="button" className="app-notif-markall" onClick={handleMarkAllRead}>
            Mark all read
          </button>
        )}
      </div>

      {error && <p className="app-auth-error">{error}</p>}

      {notifications === null ? (
        <NotificationsSkeleton />
      ) : notifications.length === 0 ? (
        <p className="app-empty">
          Nothing yet — when someone follows you, requests to follow you, upvotes, comments,
          replies, or tags you in a sheet, it'll show up here.
        </p>
      ) : (
        <ul className="app-notif-list">
          {notifications.map((n) => {
            const isSystem = SYSTEM_TYPES.has(n.type);
            const name = isSystem ? "System" : n.actor?.name || n.actor?.username || "Someone";
            const showRequestActions = n.type === "follow_request" && !handledRequestIds.has(n.id);
            return (
              <li key={n.id} className="app-notif-item-row">
                <button
                  type="button"
                  className={"app-notif-item" + (n.read ? "" : " is-unread")}
                  onClick={() => handleOpen(n)}
                >
                  <span className={"app-notif-dp" + (isSystem ? " app-notif-dp-system" : "")}>
                    {isSystem ? (
                      <ShieldIcon />
                    ) : n.actor?.avatarUrl ? (
                      <img src={n.actor.avatarUrl} alt="" />
                    ) : (
                      name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="app-notif-text">
                    <strong>{name}</strong> {verbFor(n)}
                    {n.postSnippet && <span className="app-notif-snippet"> — "{n.postSnippet}"</span>}
                    {isSystem && n.message && <span className="app-notif-snippet"> — "{n.message}"</span>}
                  </span>
                  <span className="app-notif-time">{relativeTime(n.createdAt)}</span>
                </button>
                {showRequestActions && (
                  <span className="app-notif-request-actions">
                    <button
                      type="button"
                      className="app-notif-request-accept"
                      disabled={requestBusyId === n.id}
                      onClick={(e) => handleAcceptRequest(e, n)}
                    >
                      Accept
                    </button>
                    <button
                      type="button"
                      className="app-notif-request-decline"
                      disabled={requestBusyId === n.id}
                      onClick={(e) => handleDeclineRequest(e, n)}
                    >
                      Decline
                    </button>
                  </span>
                )}
                <button
                  type="button"
                  className="app-notif-remove"
                  aria-label="Remove notification"
                  onClick={(e) => handleRemove(e, n.id)}
                >
                  ×
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function ShieldIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
