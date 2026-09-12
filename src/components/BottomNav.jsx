import { NavLink } from "react-router-dom";
import { useDm } from "../context/DmContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";

// Mobile-only bottom bar. Hidden on wider screens via CSS (the side nav
// and top bar take over there) — see the mobile-first rules in index.css.
// Icons only, no labels — five icons at this size are self-explanatory,
// and dropping the text lets the bar sit shorter.
export default function BottomNav() {
  const { unreadCount: dmUnreadCount } = useDm();
  const { user } = useAuth();

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

      <NavLink to="/stories" className={linkClass} aria-label="Stories">
        <StoriesIcon />
      </NavLink>
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

// Solid, filled glyphs (instead of thin line art) — bigger, bolder, and
// easier to read at a glance; all four tab icons share one size so the
// bar reads as a consistent set.
function HomeIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 3.2 3 11h2.3v9h5.2v-5.8h3v5.8h5.2v-9H21z"
        fill="currentColor"
      />
    </svg>
  );
}

// A solid speech bubble with a tail, easier to read at a glance than a
// thin outline.
function ChatIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5.6A2.6 2.6 0 016.6 3h10.8A2.6 2.6 0 0120 5.6v7.8a2.6 2.6 0 01-2.6 2.6H10L5.1 19.6A.6.6 0 014 19.1V5.6z"
        fill="currentColor"
      />
    </svg>
  );
}

// Stories: back to the ring-around-a-filled-dot look — the same
// "unwatched story" shape the stories bar uses.
function StoriesIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray="7 3.4"
      />
      <circle cx="12" cy="12" r="4" fill="currentColor" />
    </svg>
  );
}
function UserIcon() {
  return (
    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
      <path
        d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5.2 0-9.6 2.6-9.6 6.2V21h19.2v-.8c0-3.6-4.4-6.2-9.6-6.2z"
        fill="currentColor"
      />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
