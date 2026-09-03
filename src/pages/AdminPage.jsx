import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { api } from "../lib/api.js";
import { relativeTime } from "../lib/formatTime.js";

const ADMIN_USERNAME = "sourabhmahiya";
const TABS = ["Overview", "Analytics", "Users", "Posts", "Comments", "Reports", "Support", "Errors"];

export default function AdminPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("Overview");

  const isAdmin = !!user && (user.username || "").toLowerCase() === ADMIN_USERNAME;

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate("/login", { state: { from: "/admin" } });
      return;
    }
    if (!isAdmin) {
      navigate("/");
    }
  }, [loading, user, isAdmin, navigate]);

  if (loading || !isAdmin) return null;

  return (
    <div className="app-page">
      <h2 className="app-section-title">Admin</h2>

      <div className="app-admin-tabs">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            className={"app-admin-tab" + (activeTab === tab ? " is-active" : "")}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="app-admin-content">
        {activeTab === "Overview" && <OverviewTab />}
        {activeTab === "Analytics" && <AnalyticsTab />}
        {activeTab === "Users" && <UsersTab />}
        {activeTab === "Posts" && <PostsTab />}
        {activeTab === "Comments" && <CommentsTab />}
        {activeTab === "Reports" && <ReportsTab />}
        {activeTab === "Support" && <SupportTab />}
        {activeTab === "Errors" && <ErrorsTab />}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Overview
// ---------------------------------------------------------------------
function OverviewTab() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAdminStats().then(setStats).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="app-auth-error">{error}</p>;
  if (!stats) return <p className="app-empty">Loading stats...</p>;

  const tiles = [
    { label: "Users", value: stats.totalUsers },
    { label: "Sheets", value: stats.totalPosts },
    { label: "Comments", value: stats.totalComments },
    { label: "Open reports", value: stats.openReports },
    { label: "Open tickets", value: stats.openTickets },
    { label: "Pending deletion", value: stats.deletedPendingPurge },
  ];

  return (
    <div className="app-admin-stat-grid">
      {tiles.map((t) => (
        <div key={t.label} className="app-admin-stat-tile">
          <strong>{t.value}</strong>
          <span>{t.label}</span>
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------
// Analytics — built-in, no third-party service. Signups/sheets/pageviews
// per day over the last 30 days, plus a top-pages breakdown.
// ---------------------------------------------------------------------
function Sparkline({ title, series }) {
  const max = Math.max(1, ...series.map((d) => d.count));
  return (
    <div className="app-admin-sparkline">
      <h3>{title}</h3>
      <div className="app-admin-sparkline-bars">
        {series.map((d) => (
          <div key={d.date} className="app-admin-sparkline-bar" title={`${d.date}: ${d.count}`}>
            <div className="app-admin-sparkline-fill" style={{ height: `${Math.max(2, (d.count / max) * 100)}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AnalyticsTab() {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api.getAdminAnalytics(30).then(setData).catch((err) => setError(err.message));
  }, []);

  if (error) return <p className="app-auth-error">{error}</p>;
  if (!data) return <p className="app-empty">Loading analytics...</p>;

  const sum = (series) => series.reduce((s, d) => s + d.count, 0);

  return (
    <div>
      <div className="app-admin-stat-grid">
        <div className="app-admin-stat-tile">
          <strong>{data.totalPageviews}</strong>
          <span>Pageviews (30d)</span>
        </div>
        <div className="app-admin-stat-tile">
          <strong>{sum(data.signups)}</strong>
          <span>Signups (30d)</span>
        </div>
        <div className="app-admin-stat-tile">
          <strong>{sum(data.posts)}</strong>
          <span>Sheets posted (30d)</span>
        </div>
      </div>

      <Sparkline title="Pageviews per day" series={data.pageviews} />
      <Sparkline title="Signups per day" series={data.signups} />
      <Sparkline title="Sheets posted per day" series={data.posts} />

      <h3 className="app-admin-subheading">Top pages (30d)</h3>
      {data.topPages.length === 0 ? (
        <p className="app-empty">No pageviews recorded yet.</p>
      ) : (
        <ul className="app-admin-list">
          {data.topPages.map((p) => (
            <li key={p.path} className="app-admin-row">
              <div className="app-admin-row-main">
                <div className="app-admin-row-title">
                  <strong>{p.path || "/"}</strong>
                </div>
              </div>
              <span className="app-admin-badge">{p.count} views</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------
function UsersTab() {
  const [users, setUsers] = useState(null);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({});

  function load(reset) {
    api
      .getAdminUsers({ q, cursor: reset ? null : cursor })
      .then((data) => {
        setUsers((prev) => (reset || !prev ? data.users : [...prev, ...data.users]));
        setCursor(data.nextCursor);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    const t = setTimeout(() => load(true), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  function startEdit(u) {
    setEditingId(u.id);
    setEditDraft({ name: u.name, score: u.score, emailVerified: u.emailVerified });
  }

  async function saveEdit(id) {
    try {
      const updated = await api.updateAdminUser(id, editDraft);
      setUsers((list) => list.map((u) => (u.id === id ? updated : u)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(u) {
    if (!window.confirm(`Permanently delete @${u.username}? This can't be undone.`)) return;
    try {
      await api.deleteAdminUser(u.id);
      setUsers((list) => list.filter((x) => x.id !== u.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <input
        className="app-admin-search"
        placeholder="Search by username, name, or email..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error && <p className="app-auth-error">{error}</p>}
      {users === null ? (
        <p className="app-empty">Loading users...</p>
      ) : (
        <ul className="app-admin-list">
          {users.map((u) => (
            <li key={u.id} className="app-admin-row">
              <div className="app-admin-row-dp">
                {u.avatarUrl ? <img src={u.avatarUrl} alt="" /> : (u.name || u.username).charAt(0).toUpperCase()}
              </div>
              <div className="app-admin-row-main">
                <div className="app-admin-row-title">
                  <strong>{u.name}</strong> <span className="app-admin-muted">@{u.username}</span>
                  {u.deletedAt && <span className="app-admin-badge app-admin-badge-danger">deleted</span>}
                </div>
                <div className="app-admin-row-sub">
                  {u.email} · joined {relativeTime(u.createdAt)} · {u._count.posts} sheets ·{" "}
                  {u._count.followers} followers
                </div>

                {editingId === u.id ? (
                  <div className="app-admin-edit-row">
                    <input
                      value={editDraft.name}
                      onChange={(e) => setEditDraft((d) => ({ ...d, name: e.target.value }))}
                      placeholder="Name"
                    />
                    <input
                      type="number"
                      value={editDraft.score}
                      onChange={(e) => setEditDraft((d) => ({ ...d, score: e.target.value }))}
                      placeholder="Score"
                    />
                    <label className="app-admin-checkbox-label">
                      <input
                        type="checkbox"
                        checked={editDraft.emailVerified}
                        onChange={(e) => setEditDraft((d) => ({ ...d, emailVerified: e.target.checked }))}
                      />
                      Verified
                    </label>
                    <button type="button" className="app-admin-btn" onClick={() => saveEdit(u.id)}>
                      Save
                    </button>
                    <button type="button" className="app-admin-btn-ghost" onClick={() => setEditingId(null)}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <div className="app-admin-row-actions">
                    <span className="app-admin-badge">{u.score} pts</span>
                    {u.emailVerified && <span className="app-admin-badge">verified</span>}
                    <button type="button" className="app-admin-btn-ghost" onClick={() => startEdit(u)}>
                      Edit
                    </button>
                    <button type="button" className="app-admin-btn-danger" onClick={() => handleDelete(u)}>
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button type="button" className="app-load-more" onClick={() => load(false)}>
          Load more
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------
function PostsTab() {
  const [posts, setPosts] = useState(null);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [draftContent, setDraftContent] = useState("");

  function load(reset) {
    api
      .getAdminPosts({ q, cursor: reset ? null : cursor })
      .then((data) => {
        setPosts((prev) => (reset || !prev ? data.posts : [...prev, ...data.posts]));
        setCursor(data.nextCursor);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    const t = setTimeout(() => load(true), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function saveEdit(id) {
    try {
      const updated = await api.updateAdminPost(id, { content: draftContent });
      setPosts((list) => list.map((p) => (p.id === id ? updated : p)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(p) {
    if (!window.confirm("Permanently delete this sheet?")) return;
    try {
      await api.deleteAdminPost(p.id);
      setPosts((list) => list.filter((x) => x.id !== p.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <input
        className="app-admin-search"
        placeholder="Search sheets by content or author..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error && <p className="app-auth-error">{error}</p>}
      {posts === null ? (
        <p className="app-empty">Loading sheets...</p>
      ) : (
        <ul className="app-admin-list">
          {posts.map((p) => (
            <li key={p.id} className="app-admin-row">
              <div className="app-admin-row-dp">
                {p.author.avatarUrl ? (
                  <img src={p.author.avatarUrl} alt="" />
                ) : (
                  (p.author.name || p.author.username).charAt(0).toUpperCase()
                )}
              </div>
              <div className="app-admin-row-main">
                <div className="app-admin-row-title">
                  <strong>@{p.author.username}</strong>{" "}
                  <span className="app-admin-muted">{relativeTime(p.createdAt)}</span>
                </div>
                {editingId === p.id ? (
                  <div className="app-admin-edit-row app-admin-edit-row-stacked">
                    <textarea
                      value={draftContent}
                      onChange={(e) => setDraftContent(e.target.value)}
                      rows={3}
                    />
                    <div>
                      <button type="button" className="app-admin-btn" onClick={() => saveEdit(p.id)}>
                        Save
                      </button>
                      <button type="button" className="app-admin-btn-ghost" onClick={() => setEditingId(null)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="app-admin-row-body">{p.content}</p>
                    <div className="app-admin-row-actions">
                      <span className="app-admin-badge">
                        {p.upvotes - p.downvotes >= 0 ? "+" : ""}
                        {p.upvotes - p.downvotes} votes
                      </span>
                      <span className="app-admin-badge">{p.commentCount} comments</span>
                      <button
                        type="button"
                        className="app-admin-btn-ghost"
                        onClick={() => {
                          setEditingId(p.id);
                          setDraftContent(p.content);
                        }}
                      >
                        Edit
                      </button>
                      <button type="button" className="app-admin-btn-danger" onClick={() => handleDelete(p)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button type="button" className="app-load-more" onClick={() => load(false)}>
          Load more
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Comments — moderation-only browsing (separate from the Reports tab,
// which surfaces a specific comment someone flagged). This tab is for
// combing through everything, same pattern as the Posts tab above.
// ---------------------------------------------------------------------
function CommentsTab() {
  const [comments, setComments] = useState(null);
  const [q, setQ] = useState("");
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState("");

  function load(reset) {
    api
      .getAdminComments({ q, cursor: reset ? null : cursor })
      .then((data) => {
        setComments((prev) => (reset || !prev ? data.comments : [...prev, ...data.comments]));
        setCursor(data.nextCursor);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    const t = setTimeout(() => load(true), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  async function handleDelete(c) {
    if (!window.confirm("Permanently delete this comment?")) return;
    try {
      await api.deleteAdminComment(c.id);
      setComments((list) => list.filter((x) => x.id !== c.id));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <input
        className="app-admin-search"
        placeholder="Search comments by content or author..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      {error && <p className="app-auth-error">{error}</p>}
      {comments === null ? (
        <p className="app-empty">Loading comments...</p>
      ) : comments.length === 0 ? (
        <p className="app-empty">No comments found.</p>
      ) : (
        <ul className="app-admin-list">
          {comments.map((c) => (
            <li key={c.id} className="app-admin-row">
              <div className="app-admin-row-dp">
                {c.user.avatarUrl ? (
                  <img src={c.user.avatarUrl} alt="" />
                ) : (
                  (c.user.name || c.user.username).charAt(0).toUpperCase()
                )}
              </div>
              <div className="app-admin-row-main">
                <div className="app-admin-row-title">
                  <strong>@{c.user.username}</strong>{" "}
                  <span className="app-admin-muted">
                    commented on "{c.post?.title || "a sheet"}" · {relativeTime(c.createdAt)}
                  </span>
                </div>
                <p className="app-admin-row-body">{c.content}</p>
                <div className="app-admin-row-actions">
                  <button type="button" className="app-admin-btn-danger" onClick={() => handleDelete(c)}>
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button type="button" className="app-load-more" onClick={() => load(false)}>
          Load more
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------
const TARGET_LABELS = { user: "Profile", post: "Post", comment: "Comment", message: "Message" };

function ReportsTab() {
  const [status, setStatus] = useState("open");
  const [reports, setReports] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});

  function load(reset) {
    api
      .getAdminReports({ status, cursor: reset ? null : cursor })
      .then((data) => {
        setReports((prev) => (reset || !prev ? data.reports : [...prev, ...data.reports]));
        setCursor(data.nextCursor);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleReply(r, alsoResolve) {
    const reply = (replyDrafts[r.id] || "").trim();
    try {
      const updated = await api.replyToAdminReport(r.id, {
        ...(reply ? { reply } : {}),
        ...(alsoResolve ? { status: "resolved" } : {}),
      });
      setReports((list) => (status === "open" && updated.status === "resolved" ? list.filter((x) => x.id !== r.id) : list.map((x) => (x.id === r.id ? updated : x))));
      setReplyDrafts((d) => ({ ...d, [r.id]: "" }));
    } catch (err) {
      setError(err.message);
    }
  }

  // Deleting the reported content itself (post/comment) — separate from
  // reply/resolve. Doesn't auto-resolve the report; the admin still marks
  // it resolved explicitly once they're done with it. Message reports
  // never get a delete button here — there's nothing to delete against
  // (see the note in the UI below on why the content isn't shown either).
  async function handleDeleteContent(r) {
    const label = r.targetType === "post" ? "post" : "comment";
    if (!window.confirm(`Permanently delete this ${label}?`)) return;
    try {
      if (r.targetType === "post") await api.deleteAdminPost(r.post.id);
      else await api.deleteAdminComment(r.comment.id);
      setReports((list) => list.map((x) => (x.id === r.id ? { ...x, [r.targetType]: null } : x)));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="app-admin-status-filter">
        <button
          type="button"
          className={"app-admin-btn-ghost" + (status === "open" ? " is-active" : "")}
          onClick={() => setStatus("open")}
        >
          Open
        </button>
        <button
          type="button"
          className={"app-admin-btn-ghost" + (status === "resolved" ? " is-active" : "")}
          onClick={() => setStatus("resolved")}
        >
          Resolved
        </button>
      </div>
      {error && <p className="app-auth-error">{error}</p>}
      {reports === null ? (
        <p className="app-empty">Loading reports...</p>
      ) : reports.length === 0 ? (
        <p className="app-empty">No {status} reports.</p>
      ) : (
        <ul className="app-admin-list">
          {reports.map((r) => (
            <li key={r.id} className="app-admin-row app-admin-row-stacked">
              <div className="app-admin-row-title">
                <span className="app-admin-badge">{TARGET_LABELS[r.targetType] || "Profile"}</span>{" "}
                <strong>@{r.reporter.username}</strong> reported{" "}
                <strong>@{r.reportedUser.username}</strong>{" "}
                <span className="app-admin-muted">{relativeTime(r.createdAt)}</span>
              </div>

              {r.targetType === "post" &&
                (r.post ? (
                  <p className="app-admin-report-content">"{r.post.content}"</p>
                ) : (
                  <p className="app-admin-muted">(post already deleted)</p>
                ))}
              {r.targetType === "comment" &&
                (r.comment ? (
                  <p className="app-admin-report-content">"{r.comment.content}"</p>
                ) : (
                  <p className="app-admin-muted">(comment already deleted)</p>
                ))}
              {r.targetType === "message" && (
                <p className="app-admin-muted">Message content is private — not viewable here.</p>
              )}

              <p className="app-admin-row-body">{r.reason}</p>

              {((r.targetType === "post" && r.post) || (r.targetType === "comment" && r.comment)) && (
                <div className="app-admin-row-actions">
                  <button type="button" className="app-admin-btn-danger" onClick={() => handleDeleteContent(r)}>
                    Delete {r.targetType}
                  </button>
                </div>
              )}

              {r.adminReply && (
                <p className="app-admin-reply-preview">
                  <span className="app-admin-badge">System replied</span> {r.adminReply}
                </p>
              )}
              {status === "open" && (
                <div className="app-admin-reply-form">
                  <textarea
                    placeholder="Write a reply to the reporter (sent as System)..."
                    value={replyDrafts[r.id] || ""}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    rows={2}
                  />
                  <div className="app-admin-reply-actions">
                    <button type="button" className="app-admin-btn" onClick={() => handleReply(r, false)}>
                      Send reply
                    </button>
                    <button type="button" className="app-admin-btn-ghost" onClick={() => handleReply(r, true)}>
                      {replyDrafts[r.id]?.trim() ? "Reply & resolve" : "Mark resolved"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button type="button" className="app-load-more" onClick={() => load(false)}>
          Load more
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Support
// ---------------------------------------------------------------------
function SupportTab() {
  const [status, setStatus] = useState("open");
  const [tickets, setTickets] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});

  function load(reset) {
    api
      .getAdminSupportTickets({ status, cursor: reset ? null : cursor })
      .then((data) => {
        setTickets((prev) => (reset || !prev ? data.tickets : [...prev, ...data.tickets]));
        setCursor(data.nextCursor);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleReply(t, alsoResolve) {
    const reply = (replyDrafts[t.id] || "").trim();
    try {
      const updated = await api.replyToAdminSupportTicket(t.id, {
        ...(reply ? { reply } : {}),
        ...(alsoResolve ? { status: "resolved" } : {}),
      });
      setTickets((list) => (status === "open" && updated.status === "resolved" ? list.filter((x) => x.id !== t.id) : list.map((x) => (x.id === t.id ? updated : x))));
      setReplyDrafts((d) => ({ ...d, [t.id]: "" }));
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="app-admin-status-filter">
        <button
          type="button"
          className={"app-admin-btn-ghost" + (status === "open" ? " is-active" : "")}
          onClick={() => setStatus("open")}
        >
          Open
        </button>
        <button
          type="button"
          className={"app-admin-btn-ghost" + (status === "resolved" ? " is-active" : "")}
          onClick={() => setStatus("resolved")}
        >
          Resolved
        </button>
      </div>
      {error && <p className="app-auth-error">{error}</p>}
      {tickets === null ? (
        <p className="app-empty">Loading tickets...</p>
      ) : tickets.length === 0 ? (
        <p className="app-empty">No {status} tickets.</p>
      ) : (
        <ul className="app-admin-list">
          {tickets.map((t) => (
            <li key={t.id} className="app-admin-row app-admin-row-stacked">
              <div className="app-admin-row-title">
                <strong>{t.subject}</strong>{" "}
                <span className="app-admin-muted">
                  {t.user ? `@${t.user.username}` : t.name || t.email} · {relativeTime(t.createdAt)}
                </span>
                {!t.userId && <span className="app-admin-badge">no account</span>}
              </div>
              <p className="app-admin-row-body">{t.message}</p>
              {t.adminReply && (
                <p className="app-admin-reply-preview">
                  <span className="app-admin-badge">System replied</span> {t.adminReply}
                  {!t.userId && (
                    <span className="app-admin-muted"> (not delivered — no account to notify)</span>
                  )}
                </p>
              )}
              {status === "open" && (
                <div className="app-admin-reply-form">
                  <textarea
                    placeholder={
                      t.userId
                        ? "Write a reply (sent as System)..."
                        : "Write a reply (this ticket has no account — it'll be saved but not delivered)..."
                    }
                    value={replyDrafts[t.id] || ""}
                    onChange={(e) => setReplyDrafts((d) => ({ ...d, [t.id]: e.target.value }))}
                    rows={2}
                  />
                  <div className="app-admin-reply-actions">
                    <button type="button" className="app-admin-btn" onClick={() => handleReply(t, false)}>
                      Send reply
                    </button>
                    <button type="button" className="app-admin-btn-ghost" onClick={() => handleReply(t, true)}>
                      {replyDrafts[t.id]?.trim() ? "Reply & resolve" : "Mark resolved"}
                    </button>
                  </div>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button type="button" className="app-load-more" onClick={() => load(false)}>
          Load more
        </button>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------
// Errors — built-in error log (no third-party service). Written by the
// backend's global error handler and any unhandled rejection.
// ---------------------------------------------------------------------
function ErrorsTab() {
  const [errors, setErrors] = useState(null);
  const [cursor, setCursor] = useState(null);
  const [error, setError] = useState("");

  function load(reset) {
    api
      .getAdminErrors({ cursor: reset ? null : cursor })
      .then((data) => {
        setErrors((prev) => (reset || !prev ? data.items : [...prev, ...data.items]));
        setCursor(data.nextCursor);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(() => {
    load(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDelete(e) {
    try {
      await api.deleteAdminError(e.id);
      setErrors((list) => list.filter((x) => x.id !== e.id));
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleClearAll() {
    if (!window.confirm("Clear the entire error log?")) return;
    try {
      await api.clearAdminErrors();
      setErrors([]);
      setCursor(null);
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div>
      <div className="app-admin-actions-row">
        <button type="button" className="app-admin-btn-ghost" onClick={() => load(true)}>
          Refresh
        </button>
        {errors?.length > 0 && (
          <button type="button" className="app-admin-btn-danger" onClick={handleClearAll}>
            Clear all
          </button>
        )}
      </div>
      {error && <p className="app-auth-error">{error}</p>}
      {errors === null ? (
        <p className="app-empty">Loading errors...</p>
      ) : errors.length === 0 ? (
        <p className="app-empty">No errors logged.</p>
      ) : (
        <ul className="app-admin-list">
          {errors.map((e) => (
            <li key={e.id} className="app-admin-row app-admin-row-stacked">
              <div className="app-admin-row-title">
                {e.statusCode && <span className="app-admin-badge app-admin-badge-danger">{e.statusCode}</span>}{" "}
                {e.method && <span className="app-admin-muted">{e.method}</span>}{" "}
                {e.path && <span className="app-admin-muted">{e.path}</span>}
                <span className="app-admin-muted"> · {relativeTime(e.createdAt)}</span>
              </div>
              <p className="app-admin-row-body">{e.message}</p>
              {e.stack && <pre className="app-admin-report-content app-admin-error-stack">{e.stack}</pre>}
              <div className="app-admin-row-actions">
                <button type="button" className="app-admin-btn-danger" onClick={() => handleDelete(e)}>
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {cursor && (
        <button type="button" className="app-load-more" onClick={() => load(false)}>
          Load more
        </button>
      )}
    </div>
  );
}
