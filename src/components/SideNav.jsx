import { NavLink, useNavigate } from "react-router-dom";
import NavIcon from "./NavIcons.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useDm } from "../context/DmContext.jsx";

const PRIMARY_ITEMS = [
  { to: "/", label: "Home", icon: "home" },
  { to: "/search", label: "Search", icon: "search" },
  { to: "/notifications", label: "Notifications", icon: "bell" },
  { to: "/messages", label: "Messages", icon: "chat" },
  { to: "/profile", label: "Profile", icon: "user" },
];

export const DISCOVER_ITEMS = [
  { to: "/following", label: "Following", icon: "people" },
  { to: "/trending", label: "Trending", icon: "flame" },
  { to: "/leaderboard", label: "Leaderboard", icon: "trophy" },
  { to: "/arcade", label: "Arcade", icon: "arcade" },
];

// Full list — the mobile drawer shows all of these. The desktop side
// nav shows a shorter version (see SIDEBAR_INFO_ITEMS below): Privacy
// policy / Rules / Agreement moved to the desktop burger menu instead,
// so the persistent sidebar doesn't have to carry every legal link.
export const INFO_ITEMS = [
  { to: "/about", label: "About Oh Sheet!", icon: "info" },
  { to: "/privacy", label: "Privacy policy", icon: "shield" },
  { to: "/rules", label: "Rules", icon: "scale" },
  { to: "/agreement", label: "Agreement", icon: "doc" },
  { to: "/support", label: "Support", icon: "help" },
];

const SIDEBAR_INFO_ITEMS = INFO_ITEMS.filter(
  (item) => !["/privacy", "/rules", "/agreement"].includes(item.to),
);

export default function SideNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/");
  }

  return (
    <nav className="app-sidenav">
      <ul>
        {PRIMARY_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </ul>

      <hr className="app-sidenav-divider" />

      <ul>
        {DISCOVER_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </ul>

      <hr className="app-sidenav-divider" />

      <ul>
        {SIDEBAR_INFO_ITEMS.map((item) => (
          <NavItem key={item.to} item={item} />
        ))}
      </ul>

      <hr className="app-sidenav-divider" />

      <ul>
        {user && (user.username || "").toLowerCase() === "sourabhmahiya" && (
          <NavItem item={{ to: "/admin", label: "Admin", icon: "shield" }} />
        )}
        <NavItem item={{ to: "/settings", label: "Settings", icon: "gear" }} />
        {user ? (
          <li>
            <button
              type="button"
              className="app-sidenav-item app-sidenav-logout"
              onClick={handleLogout}
            >
              <NavIcon name="logout" />
              <span>Log out</span>
            </button>
          </li>
        ) : (
          <NavItem item={{ to: "/login", label: "Log in", icon: "user" }} />
        )}
      </ul>

      <button
        type="button"
        className="app-sidenav-new"
        onClick={() => navigate(user ? "/create" : "/login", { state: { from: "/create" } })}
      >
        <PlusIcon />
        <span>New Sheet</span>
      </button>
    </nav>
  );
}

function NavItem({ item }) {
  const { unreadCount } = useNotifications();
  const { unreadCount: dmUnreadCount } = useDm();
  const showBadge =
    (item.to === "/notifications" && unreadCount > 0) ||
    (item.to === "/messages" && dmUnreadCount > 0);

  return (
    <li>
      <NavLink
        to={item.to}
        end={item.to === "/"}
        className={({ isActive }) =>
          "app-sidenav-item" + (isActive ? " is-active" : "") + (showBadge ? " app-notif-anchor" : "")
        }
      >
        <NavIcon name={item.icon} />
        <span>{item.label}</span>
        {showBadge && <span className="app-notif-dot" />}
      </NavLink>
    </li>
  );
}

function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  );
}
