import { NavLink, useNavigate } from "react-router-dom";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useDm } from "../context/DmContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Mobile-only bottom bar. Hidden on wider screens via CSS (the side nav
// and top bar take over there) — see the mobile-first rules in index.css.
// Icons only, no labels — five icons at this size are self-explanatory,
// and dropping the text lets the bar sit shorter.
export default function BottomNav() {
  const { unreadCount } = useNotifications();
  const { unreadCount: dmUnreadCount } = useDm();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <nav className="app-bottomnav">
      <NavLink
        to="/"
        end
        className={linkClass}
        aria-label="Home"
        // Tapping Home while already on the feed (scrolled down, or
        // mid-scroll) doesn't trigger a route change — NavLink alone does
        // nothing in that case — so scroll to top explicitly too. Smooth
        // scrolling still feels instant over a short distance and reads
        // better than a hard jump over a long one.
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <HomeIcon />
      </NavLink>
      <NavLink
        to="/messages"
        aria-label="Chat"
        className={(navData) => linkClass(navData) + " app-notif-anchor"}
      >
        <ChatIcon />
        {dmUnreadCount > 0 && (
          <span className="app-notif-badge">{dmUnreadCount > 99 ? "99+" : dmUnreadCount}</span>
        )}
      </NavLink>

      <NavLink to="/create" className="app-bottomnav-create" aria-label="Create sheet">
        <PlusIcon />
      </NavLink>

      <button
        type="button"
        className="app-bottomnav-item"
        aria-label="Search"
        onClick={() => navigate("/search")}
      >
        <SearchIcon />
      </button>
      <NavLink to="/profile" className={linkClass} aria-label="Profile">
        {user?.avatarUrl ? (
          <img src={user.avatarUrl} alt="" className="app-bottomnav-dp-photo" />
        ) : user ? (
          <span className="app-bottomnav-dp-fallback">{user.name.charAt(0).toUpperCase()}</span>
        ) : (
          <UserIcon />
        )}
      </NavLink>
    </nav>
  );
}

function linkClass({ isActive }) {
  return "app-bottomnav-item" + (isActive ? " is-active" : "");
}

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11l8-6 8 6v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16v11H8l-4 4V5z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.2" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.4" stroke="currentColor" strokeWidth="2.2" />
      <path
        d="M5 20c1.2-4 4-6 7-6s5.8 2 7 6"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
