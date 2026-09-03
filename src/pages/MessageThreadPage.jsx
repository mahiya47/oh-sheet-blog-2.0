import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import NavIcon from "../components/NavIcons.jsx";
import { MessageThreadSkeleton } from "../components/Skeletons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useDm } from "../context/DmContext.jsx";
import { useGameSocket } from "../context/GameSocketContext.jsx";
import { api } from "../lib/api.js";
import { relativeTime } from "../lib/formatTime.js";

// How long after the other person stops typing before we hide the
// indicator, in case their "stop_typing" event never arrives (tab closed,
// connection drop, etc).
const TYPING_IDLE_TIMEOUT_MS = 5000;
// How often, at most, we emit our own "still typing" signal while the
// person keeps typing — no point spamming the socket on every keystroke.
const TYPING_EMIT_THROTTLE_MS = 2000;

// A single DM thread with one other user. Polls for new messages while
// open (same pattern as the notification badge) and marks their messages
// read as soon as the thread loads.
export default function MessageThreadPage() {
  const { username } = useParams();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { refresh } = useDm();
  const { socket } = useGameSocket();

  const [otherUser, setOtherUser] = useState(null);
  const [messages, setMessages] = useState(null);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const scrollRef = useRef(null);
  const lastTypingEmitRef = useRef(0);
  const typingIdleTimerRef = useRef(null);
  const otherUserIdRef = useRef(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { state: { from: `/messages/${username}` } });
    }
  }, [loading, user, navigate, username]);

  function loadThread() {
    api
      .getThread(username)
      .then((data) => {
        setOtherUser(data.user);
        otherUserIdRef.current = data.user.id;
        setMessages(data.messages);
        refresh();
      })
      .catch(() => setNotFound(true));
  }

  useEffect(() => {
    if (!user) return;
    setOtherUser(null);
    setMessages(null);
    setNotFound(false);
    setOtherTyping(false);
    otherUserIdRef.current = null;
    loadThread();
    const id = setInterval(loadThread, 4000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, username]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [messages]);

  // Typing indicator — reuses the same authenticated socket the arcade
  // "challenge a friend" feature already keeps open (see
  // GameSocketContext/gameSockets.js), rather than opening a second
  // connection just for DMs.
  useEffect(() => {
    if (!socket) return;

    function onTyping({ fromUserId }) {
      if (fromUserId !== otherUserIdRef.current) return;
      setOtherTyping(true);
      clearTimeout(typingIdleTimerRef.current);
      typingIdleTimerRef.current = setTimeout(() => setOtherTyping(false), TYPING_IDLE_TIMEOUT_MS);
    }
    function onStopTyping({ fromUserId }) {
      if (fromUserId !== otherUserIdRef.current) return;
      clearTimeout(typingIdleTimerRef.current);
      setOtherTyping(false);
    }

    socket.on("dm:typing", onTyping);
    socket.on("dm:stop_typing", onStopTyping);
    return () => {
      socket.off("dm:typing", onTyping);
      socket.off("dm:stop_typing", onStopTyping);
      clearTimeout(typingIdleTimerRef.current);
    };
  }, [socket]);

  function handleDraftChange(e) {
    const value = e.target.value;
    setDraft(value);
    if (!socket?.connected || !otherUserIdRef.current) return;

    if (!value.trim()) {
      socket.emit("dm:stop_typing", { toUserId: otherUserIdRef.current });
      lastTypingEmitRef.current = 0;
      return;
    }
    const now = Date.now();
    if (now - lastTypingEmitRef.current > TYPING_EMIT_THROTTLE_MS) {
      lastTypingEmitRef.current = now;
      socket.emit("dm:typing", { toUserId: otherUserIdRef.current });
    }
  }

  async function handleSend(e) {
    e.preventDefault();
    const content = draft.trim();
    if (!content || sending) return;
    setSending(true);
    setError("");
    try {
      const sent = await api.sendMessage(username, content);
      setMessages((list) => [...(list || []), sent]);
      setDraft("");
      if (socket?.connected && otherUserIdRef.current) {
        socket.emit("dm:stop_typing", { toUserId: otherUserIdRef.current });
        lastTypingEmitRef.current = 0;
      }
    } catch (err) {
      setError(err.message || "Couldn't send message");
    } finally {
      setSending(false);
    }
  }

  async function handleReportMessage(messageId) {
    const reason = window.prompt("Why are you reporting this message?");
    if (!reason || !reason.trim()) return;
    try {
      await api.reportMessage(messageId, reason.trim());
      alert("Report submitted.");
    } catch (err) {
      alert(err.message || "Couldn't submit report");
    }
  }

  if (!user) return null;

  if (notFound) {
    return (
      <div className="app-page">
        <p className="app-empty">Couldn't find that conversation.</p>
      </div>
    );
  }

  return (
    <div className="app-page app-dm-thread-page">
      <div className="app-dm-thread-head">
        <button type="button" className="app-dm-thread-back" onClick={() => navigate("/messages")}>
          <NavIcon name="back" />
        </button>
        {otherUser ? (
          <Link to={`/profile/${otherUser.username}`} className="app-dm-thread-who">
            <span className="app-dm-conv-dp">
              {otherUser.avatarUrl ? (
                <img src={otherUser.avatarUrl} alt="" />
              ) : (
                (otherUser.name || otherUser.username).charAt(0).toUpperCase()
              )}
            </span>
            <span>{otherUser.name || otherUser.username}</span>
          </Link>
        ) : (
          <span className="app-dm-thread-who">Loading...</span>
        )}
      </div>

      <div className="app-dm-thread-scroll" ref={scrollRef}>
        {messages === null ? (
          <MessageThreadSkeleton />
        ) : messages.length ? (
          <div className="app-dm-bubbles">
            {messages.map((m, i) => {
              const isLastMine = m.isMine && !messages.slice(i + 1).some((x) => x.isMine);
              return (
                <div key={m.id} className={"app-dm-bubble" + (m.isMine ? " is-mine" : "")}>
                  <p>{m.content}</p>
                  <span className="app-dm-bubble-meta">
                    <span className="app-dm-bubble-time">{relativeTime(m.createdAt)}</span>
                    {!m.isMine && (
                      <button
                        type="button"
                        className="app-dm-bubble-report"
                        onClick={() => handleReportMessage(m.id)}
                      >
                        Report
                      </button>
                    )}
                  </span>
                  {isLastMine && m.read && (
                    <span className="app-dm-bubble-seen">Seen {relativeTime(m.readAt)}</span>
                  )}
                </div>
              );
            })}
            {otherTyping && (
              <div className="app-dm-bubble app-dm-typing">
                <span className="app-dm-typing-dot" />
                <span className="app-dm-typing-dot" />
                <span className="app-dm-typing-dot" />
              </div>
            )}
          </div>
        ) : (
          <p className="app-empty">Say hello — this is the start of your conversation.</p>
        )}
      </div>

      {error && <p className="app-auth-error">{error}</p>}

      <form className="app-dm-compose" onSubmit={handleSend}>
        <input value={draft} onChange={handleDraftChange} placeholder="Write a message..." />
        <button type="submit" disabled={!draft.trim() || sending}>
          Send
        </button>
      </form>
    </div>
  );
}
