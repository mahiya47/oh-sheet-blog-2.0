import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthContext.jsx";
import { api } from "../lib/api.js";

const DmContext = createContext(null);

// Same polling pattern as NotificationContext, just for the messages
// unread badge instead of the notifications bell.
export function DmProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    try {
      const { count } = await api.getDmUnreadCount();
      setUnreadCount(count);
    } catch {
      // ignore — badge just stays at its last known value
    }
  }, [user]);

  useEffect(() => {
    refresh();
    if (!user) return;
    const id = setInterval(refresh, 15000);
    return () => clearInterval(id);
  }, [user, refresh]);

  return <DmContext.Provider value={{ unreadCount, refresh }}>{children}</DmContext.Provider>;
}

export function useDm() {
  const ctx = useContext(DmContext);
  if (!ctx) throw new Error("useDm must be used inside <DmProvider>");
  return ctx;
}
