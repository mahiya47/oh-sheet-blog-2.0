import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api, getToken, setToken, getCachedUser, setCachedUser } from "../lib/api.js";
import { clearApiCache } from "../lib/pwa.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // Hydrate synchronously from the last-known `me()` response (see
  // lib/api.js) so a fresh offline load of the installed app renders the
  // signed-in nav/shell immediately instead of flashing "logged out" while
  // the (impossible, offline) network refresh is attempted.
  const [user, setUser] = useState(() => (getToken() ? getCachedUser() : null));
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setCachedUser(null);
      setLoading(false);
      return;
    }
    try {
      const me = await api.me();
      setUser(me);
      setCachedUser(me);
    } catch (err) {
      // Only a real auth failure (expired/invalid/revoked token — the
      // request() helper sets `.status` from the response) should log
      // someone out. A network failure (offline) has no `.status` at all —
      // treating that the same way would force a logged-out shell every
      // time the offline-cached app is reopened with no connection,
      // defeating the point of caching a signed-in feed for offline use.
      // The cached user hydrated above (if any) just stays as-is.
      if (err.status) {
        setToken(null);
        setUser(null);
        setCachedUser(null);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  async function login(identifier, password) {
    const res = await api.login({ identifier, password });
    // 2FA-enabled accounts don't get a real token yet — just a short-lived
    // challengeToken. The caller (LoginPage) checks for this and shows a
    // second step instead of treating login as complete.
    if (res.requires2FA) return res;
    setToken(res.token);
    await loadMe();
    return res;
  }

  // Second step of a 2FA login — exchanges the challengeToken + an
  // authenticator/backup code for the real token.
  async function completeLogin2FA(challengeToken, code) {
    const res = await api.verifyLogin2FA(challengeToken, code);
    setToken(res.token);
    await loadMe();
    return res;
  }

  async function register(payload) {
    const res = await api.register(payload);
    setToken(res.token);
    setUser(res.user);
  }

  // Used by the OAuth callback page — the backend already issued a JWT
  // (Google/GitHub login succeeded), this just adopts it the same way
  // login()/register() do.
  async function loginWithToken(token) {
    setToken(token);
    await loadMe();
  }

  function logout() {
    setToken(null);
    setUser(null);
    setCachedUser(null);
    // So a different account logging in on this device never has a window
    // where the previous account's cached feed/post data could flash on
    // screen before revalidating — see public/sw.js.
    clearApiCache();
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        loading,
        login,
        completeLogin2FA,
        register,
        loginWithToken,
        logout,
        refreshMe: loadMe,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
