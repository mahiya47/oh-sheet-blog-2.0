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

// A friendlier, rounder cottage — soft arched roof instead of a sharp
// peak, plus a little door for detail, matching the brand's playful,
// hand-drawn feel better than a generic house glyph.
function HomeIcon() {
  return (
    <svg width="29" height="29" viewBox="0 0 24 24" fill="none">
      <path
        d="M2.6 12.2 Q12 2.2 21.4 12.2"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.6 10.8V19.4a1 1 0 001 1h12.8a1 1 0 001-1v-8.6"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect x="9.8" y="14" width="4.4" height="6.4" rx="1.3" fill="currentColor" />
    </svg>
  );
}

// A rounded speech bubble with a typing-dots detail, easier to read at
// a glance than a plain rectangle.
function ChatIcon() {
  return (
    <svg width="29" height="29" viewBox="0 0 24 24" fill="none">
      <rect x="1.8" y="3.2" width="20.4" height="14.4" rx="6.6" stroke="currentColor" strokeWidth="2.4" />
      <path d="M6 17.4L6 21.8L10.4 17.6Z" fill="currentColor" />
      <circle cx="8" cy="10.4" r="1.35" fill="currentColor" />
      <circle cx="12" cy="10.4" r="1.35" fill="currentColor" />
      <circle cx="16" cy="10.4" r="1.35" fill="currentColor" />
    </svg>
  );
}

// Stories: a ring around a filled dot — the same "unwatched story"
// shape the stories bar uses, so the tab reads as what it opens.
function StoriesIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
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
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
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
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}
