import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConversationsSkeleton } from "../components/Skeletons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDm } from "../context/DmContext.jsx";
import { api } from "../lib/api.js";
import { relativeTime } from "../lib/formatTime.js";

// The conversation list — one row per person you've messaged, newest
// conversation first. Tapping a row opens the thread at /messages/:username.
export default function MessagesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { refresh } = useDm();
  const [conversations, setConversations] = useState(null);
  const [people, setPeople] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: "/messages" } });
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    api
      .getConversations()
      .then((list) => {
        setConversations(list);
        // Clear the chat badge as soon as the list is opened — each row
        // below still shows its own unread count from this fetch, same
        // pattern as the notifications bell.
        if (list.some((c) => c.unreadCount > 0)) {
          api.markAllDmRead().then(refresh).catch(() => {});
        }
      })
      .catch((err) => setError(err.message));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // People to start a chat with: whoever you follow, falling back to the
  // same suggestions the right rail shows when you don't follow anyone
  // yet — otherwise a new account lands here with nothing to do.
  useEffect(() => {
    if (!user) return;
    api
      .getFollowing(user.id)
      .then((list) => (list.length ? list : api.getSuggestions().catch(() => [])))
      .then(setPeople)
      .catch(() => setPeople([]));
  }, [user]);

  if (!user) return null;

  // Anyone already in the list above doesn't need a second row down here.
  const inConversation = new Set((conversations || []).map((c) => c.user.id));
  const startable = (people || []).filter((p) => p.id !== user.id && !inConversation.has(p.id));

  return (
    <div className="app-page">
      <h2 className="app-section-title">Messages</h2>

      {error && <p className="app-auth-error">{error}</p>}

      {conversations === null ? (
        <ConversationsSkeleton />
      ) : conversations.length ? (
        <ul className="app-dm-conv-list">
          {conversations.map((c) => (
            <li key={c.user.id}>
              <Link
                to={`/messages/${c.user.username}`}
                className={"app-dm-conv-row" + (c.unreadCount > 0 ? " is-unread" : "")}
              >
                <span className="app-dm-conv-dp">
                  {c.user.avatarUrl ? (
                    <img src={c.user.avatarUrl} alt="" />
                  ) : (
                    (c.user.name || c.user.username).charAt(0).toUpperCase()
                  )}
                </span>
                <span className="app-dm-conv-main">
                  <span className="app-dm-conv-name">{c.user.name || c.user.username}</span>
                  <span className="app-dm-conv-snippet">
                    {c.lastMessageIsMine ? "You: " : ""}
                    {c.lastMessage}
                  </span>
                </span>
                <span className="app-dm-conv-meta">
                  <span className="app-dm-conv-time">{relativeTime(c.lastMessageAt)}</span>
                  {c.unreadCount > 0 && <span className="app-dm-conv-badge">{c.unreadCount}</span>}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="app-empty">No messages yet — start one below.</p>
      )}

      {startable.length > 0 && (
        <>
          <h3 className="app-dm-start-title">Start a chat</h3>
          <ul className="app-dm-start-list">
            {startable.map((p) => (
              <li key={p.id}>
                <Link to={`/profile/${p.username}`} className="app-dm-start-who">
                  <span className="app-dm-conv-dp">
                    {p.avatarUrl ? (
                      <img src={p.avatarUrl} alt="" />
                    ) : (
                      (p.name || p.username).charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="app-dm-start-names">
                    <strong>{p.name || p.username}</strong>
                    <span>@{p.username}</span>
                  </span>
                </Link>
                <Link to={`/messages/${p.username}`} className="app-dm-start-btn">
                  Message
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
