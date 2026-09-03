import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ConversationsSkeleton } from "../components/Skeletons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { relativeTime } from "../lib/formatTime.js";

// The conversation list — one row per person you've messaged, newest
// conversation first. Tapping a row opens the thread at /messages/:username.
export default function MessagesPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState(null);
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
      .then(setConversations)
      .catch((err) => setError(err.message));
  }, [user]);

  if (!user) return null;

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
        <p className="app-empty">
          No messages yet — visit someone's profile and tap Message to start a conversation.
        </p>
      )}
    </div>
  );
}
