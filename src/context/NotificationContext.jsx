import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { api } from "../lib/api.js";

// Just tracks the unread count for the bell badge (sidebar/topbar/bottom
// nav all read from here) so it stays in sync without each of them
// polling the backend separately. The notifications LIST itself is
// fetched directly by NotificationsPage — this context only needs the count.
const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const { count } = await api.getUnreadNotificationCount();
      setUnreadCount(count);
    } catch {
      // Not worth surfacing an error for a background badge check.
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return undefined;
    // A timer alone meant the badge could sit up to 20 seconds behind, and
    // kept polling in a background tab for no one. This checks a little
    // more often, skips the check while the tab is hidden, and refreshes
    // the moment you come back to it — so returning to the app shows a
    // current count straight away instead of after the next tick.
    const id = setInterval(() => {
      if (!document.hidden) refresh();
    }, 15000);
    const onWake = () => {
      if (!document.hidden) refresh();
    };
    window.addEventListener("focus", onWake);
    document.addEventListener("visibilitychange", onWake);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", onWake);
      document.removeEventListener("visibilitychange", onWake);
    };
  }, [user, refresh]);

  return (
    <NotificationContext.Provider value={{ unreadCount, refresh }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used inside <NotificationProvider>");
  return ctx;
}
