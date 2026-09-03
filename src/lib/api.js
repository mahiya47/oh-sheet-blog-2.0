// Thin fetch wrapper around the Oh Sheet! backend. Every function here
// returns parsed JSON and throws an Error (with the server's message,
// when there is one) on a non-2xx response.

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const TOKEN_KEY = "ohsheet_token";
// A cached copy of the last `me()` response — purely so the installed PWA
// can render the logged-in nav/shell immediately on a fresh offline load,
// before (or instead of, if offline) the real /auth/me round-trip
// completes. Never trusted as authoritative; AuthContext still refreshes
// it from the network whenever it can.
const CACHED_USER_KEY = "ohsheet_cached_user";

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}
export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getCachedUser() {
  try {
    const raw = localStorage.getItem(CACHED_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
export function setCachedUser(user) {
  if (user) localStorage.setItem(CACHED_USER_KEY, JSON.stringify(user));
  else localStorage.removeItem(CACHED_USER_KEY);
}

async function request(path, { method = "GET", body, auth = true } = {}) {
  const headers = { "Content-Type": "application/json" };
  if (auth) {
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let res;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch (err) {
    throw new Error(
      "Can't reach the server. Is the backend running at " + API_BASE + "?",
    );
  }

  let data = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      // non-JSON response body — leave data null
    }
  }

  if (!res.ok) {
    const err = new Error((data && data.message) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

// Google/GitHub are plain redirects (the browser navigates the whole page
// there and back), not fetch() calls — exported so pages can build the
// href/onClick target without hardcoding API_BASE themselves.
export function oauthUrl(provider, intent) {
  return intent ? `${API_BASE}/auth/${provider}?intent=${intent}` : `${API_BASE}/auth/${provider}`;
}
// Starting an OAuth account-link used to put the actual session token
// straight in this URL — visible in the browser's address bar/history the
// whole way through Google/GitHub's redirect and back. This instead asks
// the backend (over an authenticated fetch, never a URL) for a short-lived,
// one-time nonce scoped to nothing but that one link flow — see the
// backend's getOAuthLinkNonce/parseLinkUserId for the other half of this.
export async function oauthLinkUrl(provider) {
  const { nonce } = await request("/auth/link-nonce", { method: "POST" });
  return `${API_BASE}/auth/${provider}/link?nonce=${encodeURIComponent(nonce)}`;
}

export const api = {
  // Auth
  register: (payload) => request("/auth/register", { method: "POST", body: payload, auth: false }),
  login: (payload) => request("/auth/login", { method: "POST", body: payload, auth: false }),
  verifyLogin2FA: (challengeToken, code) =>
    request("/auth/2fa/verify-login", { method: "POST", body: { challengeToken, code }, auth: false }),
  setup2FA: () => request("/auth/2fa/setup", { method: "POST" }),
  enable2FA: (code) => request("/auth/2fa/enable", { method: "POST", body: { code } }),
  disable2FA: (password) => request("/auth/2fa/disable", { method: "POST", body: { password } }),
  getSessions: () => request("/auth/sessions"),
  revokeSession: (id) => request(`/auth/sessions/${id}`, { method: "DELETE" }),

  // Push notifications
  getPushPublicKey: () => request("/push/public-key", { auth: false }),
  subscribePush: (subscription) => request("/push/subscribe", { method: "POST", body: subscription }),
  unsubscribePush: (endpoint) => request("/push/subscribe", { method: "DELETE", body: { endpoint } }),

  // Passkeys
  getPasskeys: () => request("/auth/passkeys"),
  getPasskeyRegisterOptions: () => request("/auth/passkeys/register-options", { method: "POST" }),
  verifyPasskeyRegistration: (response, deviceLabel) =>
    request("/auth/passkeys/register-verify", { method: "POST", body: { response, deviceLabel } }),
  deletePasskey: (id) => request(`/auth/passkeys/${id}`, { method: "DELETE" }),
  getPasskeyLoginOptions: () => request("/auth/passkeys/login-options", { method: "POST", auth: false }),
  verifyPasskeyLogin: (challengeId, response) =>
    request("/auth/passkeys/login-verify", { method: "POST", body: { challengeId, response }, auth: false }),
  me: () => request("/auth/me"),
  verifyEmail: (token) => request(`/auth/verify/${encodeURIComponent(token)}`, { auth: false }),
  resendVerification: () => request("/auth/resend-verification", { method: "POST" }),
  forgotPassword: (email) =>
    request("/auth/forgot-password", { method: "POST", body: { email }, auth: false }),
  resetPassword: (token, password) =>
    request(`/auth/reset-password/${encodeURIComponent(token)}`, {
      method: "POST",
      body: { password },
      auth: false,
    }),

  // Posts
  getFeed: (cursor) => request(`/posts${cursor ? `?cursor=${cursor}` : ""}`),
  getFollowingFeed: () => request("/posts/following"),
  getSavedPosts: () => request("/posts/saved/me"),
  getPostsByUsername: (username) => request(`/posts/user/${encodeURIComponent(username)}`),
  getPost: (id) => request(`/posts/${id}`),
  createPost: (payload) => request("/posts", { method: "POST", body: payload }),
  updatePost: (id, payload) => request(`/posts/${id}`, { method: "PUT", body: payload }),
  deletePost: (id) => request(`/posts/${id}`, { method: "DELETE" }),
  votePost: (id, type) => request(`/posts/${id}/vote`, { method: "POST", body: { type } }),
  getPostVoters: (id) => request(`/posts/${id}/voters`),
  toggleBookmark: (id, isBookmarked) =>
    request(`/posts/${id}/bookmark`, { method: isBookmarked ? "DELETE" : "POST" }),
  getPostsByTag: (name) => request(`/posts/tag/${encodeURIComponent(name)}`),
  untagSelf: (id) => request(`/posts/${id}/untag`, { method: "DELETE" }),
  getTrendingPosts: (limit) => request(`/posts/trending${limit ? `?limit=${limit}` : ""}`),
  recordPostView: (id) => request(`/posts/${id}/view`, { method: "POST" }),
  getPostAnalytics: (id) => request(`/posts/${id}/analytics`),

  // Stories (24h-disappearing image/video/text updates)
  getStories: () => request("/stories"),
  getAuthorStories: (authorId) => request(`/stories/${authorId}`),
  createStory: (payload) => request("/stories", { method: "POST", body: payload }),
  viewStory: (id) => request(`/stories/${id}/view`, { method: "POST" }),
  deleteStory: (id) => request(`/stories/${id}`, { method: "DELETE" }),

  // Comments
  getComments: (postId) => request(`/posts/${postId}/comments`),
  addComment: (postId, content, parentId) =>
    request(`/posts/${postId}/comments`, { method: "POST", body: { content, parentId } }),
  deleteComment: (postId, id) => request(`/posts/${postId}/comments/${id}`, { method: "DELETE" }),

  // Users
  getUserByUsername: (username) => request(`/users/${encodeURIComponent(username)}`),
  updateProfile: (payload) => request("/users/me", { method: "PUT", body: payload }),
  exportMyData: () => request("/users/me/export"),
  deleteAccount: () => request("/auth/me", { method: "DELETE" }),
  searchAll: (q) => request(`/users/search?q=${encodeURIComponent(q)}`),
  getSuggestions: () => request("/users/suggestions"),
  checkUsername: (username) => request(`/users/check-username/${encodeURIComponent(username)}`, { auth: false }),
  getLeaderboard: () => request("/users/leaderboard", { auth: false }),

  // Follow
  follow: (userId) => request(`/follows/${userId}`, { method: "POST" }),
  unfollow: (userId) => request(`/follows/${userId}`, { method: "DELETE" }),
  getFollowInfo: (userId) => request(`/follows/${userId}`),
  getFollowers: (userId) => request(`/follows/${userId}/followers`),
  getFollowing: (userId) => request(`/follows/${userId}/following`),

  // Block / report
  block: (userId) => request(`/blocks/${userId}`, { method: "POST" }),
  unblock: (userId) => request(`/blocks/${userId}`, { method: "DELETE" }),
  getBlockedUsers: () => request("/blocks"),
  getBlockStatus: (userId) => request(`/blocks/${userId}/status`),
  mute: (userId) => request(`/mutes/${userId}`, { method: "POST" }),
  unmute: (userId) => request(`/mutes/${userId}`, { method: "DELETE" }),
  getMutedUsers: () => request("/mutes"),
  getMuteStatus: (userId) => request(`/mutes/${userId}/status`),
  report: (reportedUserId, reason) =>
    request("/reports", { method: "POST", body: { targetType: "user", reportedUserId, reason } }),
  reportPost: (postId, reason) =>
    request("/reports", { method: "POST", body: { targetType: "post", postId, reason } }),
  reportComment: (commentId, reason) =>
    request("/reports", { method: "POST", body: { targetType: "comment", commentId, reason } }),
  reportMessage: (messageId, reason) =>
    request("/reports", { method: "POST", body: { targetType: "message", messageId, reason } }),

  // Notifications
  getNotifications: () => request("/notifications"),
  getUnreadNotificationCount: () => request("/notifications/unread-count"),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: "POST" }),
  markAllNotificationsRead: () => request("/notifications/read-all", { method: "POST" }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: "DELETE" }),

  // Messages
  getConversations: () => request("/messages/conversations"),
  getDmUnreadCount: () => request("/messages/unread-count"),
  getThread: (username) => request(`/messages/${encodeURIComponent(username)}`),
  sendMessage: (username, content) =>
    request(`/messages/${encodeURIComponent(username)}`, { method: "POST", body: { content } }),

  // Support
  submitSupportTicket: (payload) => request("/support", { method: "POST", body: payload }),

  // Admin (sourabhmahiya only — the backend enforces this regardless of
  // what the frontend shows/hides)
  getAdminStats: () => request("/admin/stats"),
  getAdminUsers: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.cursor) qs.set("cursor", params.cursor);
    const s = qs.toString();
    return request(`/admin/users${s ? `?${s}` : ""}`);
  },
  updateAdminUser: (id, payload) => request(`/admin/users/${id}`, { method: "PATCH", body: payload }),
  deleteAdminUser: (id) => request(`/admin/users/${id}`, { method: "DELETE" }),
  getAdminPosts: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.cursor) qs.set("cursor", params.cursor);
    const s = qs.toString();
    return request(`/admin/posts${s ? `?${s}` : ""}`);
  },
  updateAdminPost: (id, payload) => request(`/admin/posts/${id}`, { method: "PATCH", body: payload }),
  deleteAdminPost: (id) => request(`/admin/posts/${id}`, { method: "DELETE" }),
  getAdminComments: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.q) qs.set("q", params.q);
    if (params.cursor) qs.set("cursor", params.cursor);
    const s = qs.toString();
    return request(`/admin/comments${s ? `?${s}` : ""}`);
  },
  deleteAdminComment: (id) => request(`/admin/comments/${id}`, { method: "DELETE" }),
  getAdminReports: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.cursor) qs.set("cursor", params.cursor);
    const s = qs.toString();
    return request(`/admin/reports${s ? `?${s}` : ""}`);
  },
  replyToAdminReport: (id, payload) => request(`/admin/reports/${id}`, { method: "PATCH", body: payload }),
  getAdminSupportTickets: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.status) qs.set("status", params.status);
    if (params.cursor) qs.set("cursor", params.cursor);
    const s = qs.toString();
    return request(`/admin/support${s ? `?${s}` : ""}`);
  },
  replyToAdminSupportTicket: (id, payload) => request(`/admin/support/${id}`, { method: "PATCH", body: payload }),
  getAdminErrors: (params = {}) => {
    const qs = new URLSearchParams();
    if (params.cursor) qs.set("cursor", params.cursor);
    const s = qs.toString();
    return request(`/admin/errors${s ? `?${s}` : ""}`);
  },
  deleteAdminError: (id) => request(`/admin/errors/${id}`, { method: "DELETE" }),
  clearAdminErrors: () => request("/admin/errors", { method: "DELETE" }),
  getAdminAnalytics: (days = 30) => request(`/admin/analytics?days=${days}`),

  // Analytics (public — fired on every route change, best-effort)
  trackPageview: (path) =>
    request("/analytics/pageview", { method: "POST", body: { path }, auth: false }).catch(() => {}),

  // Arcade
  submitArcadeScore: (gameSlug, score) =>
    request(`/arcade/${gameSlug}/score`, { method: "POST", body: { score } }),
  getArcadeLeaderboard: (gameSlug) => request(`/arcade/${gameSlug}/leaderboard`, { auth: false }),
  getArcadeTopPlayers: () => request("/arcade/top-players", { auth: false }),
  getMyArcadeScores: () => request("/arcade/me"),

  // Media (photo/video upload — stored in the database, served back at the
  // returned url). Not JSON, so this bypasses the request() helper above.
  uploadMedia: async (file) => {
    const form = new FormData();
    form.append("file", file);
    const headers = {};
    const token = getToken();
    if (token) headers.Authorization = `Bearer ${token}`;

    let res;
    try {
      res = await fetch(`${API_BASE}/media`, { method: "POST", headers, body: form });
    } catch {
      throw new Error("Can't reach the server. Is the backend running at " + API_BASE + "?");
    }
    const data = await res.json().catch(() => null);
    if (!res.ok) throw new Error((data && data.message) || `Upload failed (${res.status})`);
    return data; // { id, url, mimeType, kind }
  },
};
