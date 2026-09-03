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
    if (!user) return;
    const id = setInterval(refresh, 20000);
    return () => clearInterval(id);
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
