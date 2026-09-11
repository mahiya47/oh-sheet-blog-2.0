import { useState, useRef, useEffect } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useNotifications } from "../context/NotificationContext.jsx";
import { useDm } from "../context/DmContext.jsx";
import { logoColor } from "../lib/logoColor.js";
import OhSheetLogo from "./OhSheetLogo.jsx";
import NavIcon from "./NavIcons.jsx";
import { DISCOVER_ITEMS, INFO_ITEMS } from "./SideNav.jsx";

// The tablet/desktop dropdown: account actions plus the legal links
// that were moved out of the persistent sidebar. Log out is rendered
// separately below since it's a button, not a route.
const TABLET_MENU_ITEMS = [
  { to: "/profile", label: "Profile", icon: "user" },
  { to: "/settings", label: "Settings", icon: "gear" },
  { to: "/support", label: "Support", icon: "help" },
  { to: "/privacy", label: "Privacy policy", icon: "shield" },
  { to: "/rules", label: "Rules", icon: "scale" },
  { to: "/agreement", label: "Agreement", icon: "doc" },
];

export default function TopBar() {
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { unreadCount: dmUnreadCount } = useDm();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  function handleLogout() {
    setMenuOpen(false);
    logout();
    navigate("/");
  }

  useEffect(() => {
    function onClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  // Logged-out visitors get the brand mark plus Log in/Sign up only —
  // no search, messages, notifications, home shortcut, or account menu,
  // since none of those lead anywhere they're allowed to see (App.jsx's
  // showLanding gate sends every real page back to the landing pitch).
  if (!user) {
    return (
      <header className="app-topbar">
        <Link to="/" className="app-topbar-brand" aria-label="Oh sheet! home">
          <span className="app-logo-badge" style={{ background: logoColor }}>
            <OhSheetLogo size={22} />
          </span>
          <span className="app-topbar-wordmark">Oh Sheet!</span>
        </Link>
        <div className="app-topbar-actions">
          <Link to="/login" className="app-topbar-login">
            Log in
          </Link>
          <Link to="/signup" className="app-topbar-signup">
            Sign up
          </Link>
        </div>
      </header>
    );
  }

  return (
    <header className="app-topbar">
      <Link to="/" className="app-topbar-brand" aria-label="Oh sheet! home">
        <span className="app-logo-badge" style={{ background: logoColor }}>
          <OhSheetLogo size={22} />
        </span>
        <span className="app-topbar-wordmark">Oh Sheet!</span>
      </Link>

      <div className="app-topbar-actions">
        <button
          type="button"
          className="app-icon-btn"
          aria-label="Search"
          onClick={() => navigate("/search")}
        >
          <SearchIcon />
        </button>
        <button
          type="button"
          className="app-icon-btn app-desktop-only app-notif-anchor"
          aria-label="Messages"
          onClick={() => navigate("/messages")}
        >
          <ChatIcon />
          {dmUnreadCount > 0 && (
            <span className="app-notif-badge">{dmUnreadCount > 99 ? "99+" : dmUnreadCount}</span>
          )}
        </button>
        <button
          type="button"
          className="app-icon-btn app-notif-anchor"
          aria-label="Notifications"
          onClick={() => navigate("/notifications")}
        >
          <BellIcon />
          {unreadCount > 0 && (
            <span className="app-notif-badge">{unreadCount > 99 ? "99+" : unreadCount}</span>
          )}
        </button>
        <button
          type="button"
          className="app-icon-btn app-desktop-only"
          aria-label="Home"
          onClick={() => navigate("/")}
        >
          <HomeIcon />
        </button>

        <div className="app-burger-wrap" ref={menuRef}>
          <button
            type="button"
            className="app-icon-btn"
            aria-label="Menu"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <BurgerIcon />
          </button>

          {/* Tablet/desktop: a small dropdown. The side nav already
              covers primary nav + Following/Trending/etc, so this
              carries account actions and the legal links that were
              moved out of the sidebar. */}
          {menuOpen && (
            <div className="app-burger-menu app-tablet-menu">
              {TABLET_MENU_ITEMS.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  onClick={() => setMenuOpen(false)}
                >
                  <NavIcon name={item.icon} />
                  <span>{item.label}</span>
                </Link>
              ))}
              <hr className="app-burger-menu-divider" />
              {user ? (
                <button type="button" className="app-burger-menu-logout" onClick={handleLogout}>
                  <NavIcon name="logout" />
                  <span>Log out</span>
                </button>
              ) : (
                <Link to="/login" onClick={() => setMenuOpen(false)}>
                  <NavIcon name="user" />
                  <span>Log in</span>
                </Link>
              )}
            </div>
          )}

          {/* Phone: a full slide-in drawer, since there's no side nav
              to fall back on there. */}
          <div
            className={
              "app-drawer-backdrop" + (menuOpen ? " is-open" : "")
            }
            onClick={() => setMenuOpen(false)}
            aria-hidden={!menuOpen}
          />
          <div
            className={"app-drawer" + (menuOpen ? " is-open" : "")}
            role="dialog"
            aria-label="Menu"
            aria-hidden={!menuOpen}
          >
            <div className="app-drawer-head">
              {user ? (
                <Link to="/profile" className="app-drawer-profile" onClick={() => setMenuOpen(false)}>
                  <span className="app-drawer-dp">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="" className="app-drawer-dp-photo" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </span>
                  <span className="app-drawer-names">
                    <strong>{user.name}</strong>
                    <span>@{user.username}</span>
                  </span>
                </Link>
              ) : (
                <Link to="/login" className="app-drawer-profile" onClick={() => setMenuOpen(false)}>
                  <span className="app-drawer-names">
                    <strong>Log in</strong>
                  </span>
                </Link>
              )}
              <button
                type="button"
                className="app-drawer-close"
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                <CloseIcon />
              </button>
            </div>

            <ul className="app-drawer-list">
              {DISCOVER_ITEMS.map((item) => (
                <DrawerItem key={item.to} item={item} onClose={() => setMenuOpen(false)} />
              ))}
            </ul>

            <hr className="app-drawer-divider" />

            <ul className="app-drawer-list">
              {INFO_ITEMS.map((item) => (
                <DrawerItem key={item.to} item={item} onClose={() => setMenuOpen(false)} />
              ))}
            </ul>

            <hr className="app-drawer-divider" />

            <ul className="app-drawer-list">
              {user && (user.username || "").toLowerCase() === "sourabhmahiya" && (
                <DrawerItem
                  item={{ to: "/admin", label: "Admin", icon: "shield" }}
                  onClose={() => setMenuOpen(false)}
                />
              )}
              <DrawerItem
                item={{ to: "/settings", label: "Settings", icon: "gear" }}
                onClose={() => setMenuOpen(false)}
              />
              <li>
                {user ? (
                  <button
                    type="button"
                    className="app-drawer-item app-drawer-logout"
                    onClick={handleLogout}
                  >
                    <NavIcon name="logout" />
                    <span>Log out</span>
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="app-drawer-item"
                    onClick={() => setMenuOpen(false)}
                  >
                    <NavIcon name="user" />
                    <span>Log in</span>
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </header>
  );
}

function DrawerItem({ item, onClose }) {
  return (
    <li>
      <NavLink
        to={item.to}
        className={({ isActive }) =>
          "app-drawer-item" + (isActive ? " is-active" : "")
        }
        onClick={onClose}
      >
        <NavIcon name={item.icon} />
        <span>{item.label}</span>
      </NavLink>
    </li>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2.4" />
      <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 5h16v11H8l-4 4V5z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M6 10a6 6 0 1112 0c0 4 1.5 5.5 2 6H4c.5-.5 2-2 2-6z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
      <path d="M10 20a2 2 0 004 0" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}
function HomeIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 11l8-6 8 6v9a1 1 0 01-1 1h-4v-6H9v6H5a1 1 0 01-1-1v-9z"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
      />
    </svg>
  );
}
function BurgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path
        d="M4 6h16M4 12h16M4 18h16"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}
